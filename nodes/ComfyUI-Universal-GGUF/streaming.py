# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 gikipil
"""Private function graph for the GGUF stream experiment, not a global patch.

The existing SelfLift implementation remains responsible for sampling, masks,
attention, head grouping and residuals. Only its QKV weight preparation and
the lifetime of prepared GGUF projection weights are changed for this call.
"""
import ast
import copy
import importlib
import inspect
import logging
import textwrap
import types
from contextlib import contextmanager


def clone_function(fn, **changes):
    namespace = dict(fn.__globals__)
    namespace.update(changes)
    result = types.FunctionType(fn.__code__, namespace, fn.__name__, fn.__defaults__, fn.__closure__)
    result.__kwdefaults__ = copy.copy(fn.__kwdefaults__)
    return result


def replace_stream_import(fn, stream, expected):
    # The native function imports this module inside its body. Compile a private
    # copy with only that import replaced; never edit sys.modules or the source.
    tree = ast.parse(textwrap.dedent(inspect.getsource(fn)))
    count = 0

    class Replace(ast.NodeTransformer):
        def visit_ImportFrom(self, node):
            nonlocal count
            if node.level == 1 and node.module is None and len(node.names) == 1 and node.names[0].name == 'h3_stream_attention':
                count += 1
                return ast.copy_location(ast.Assign(
                    targets=[ast.Name(id='h3_stream_attention', ctx=ast.Store())],
                    value=ast.Name(id='_test_stream', ctx=ast.Load())), node)
            return node

    tree = ast.fix_missing_locations(Replace().visit(tree))
    if count != expected:
        raise RuntimeError('MiniMax GGUF: the streaming implementation changed; update the test adapter.')
    namespace = dict(fn.__globals__, _test_stream=stream)
    exec(compile(tree, inspect.getsourcefile(fn), 'exec'), namespace)
    return namespace[fn.__name__]


def is_gguf_projection(linear):
    return (hasattr(linear.weight, 'tensor_type')
            and callable(getattr(linear, 'get_weight', None))
            and callable(getattr(linear, 'cast_bias_weight', None)))


@contextmanager
def cache_block_projections(block, stats):
    """One cache per block evaluation; restore methods even on interruption.

    Use GGMLLayer's own cast function, including all current LoRA patches.
    Cache dense compute weights only, never replace the packed parameters.
    """
    saved = []
    missing = object()
    try:
        for linear in (block.attn.qkv_proj, block.attn.out_proj, block.mlp.fc1, block.mlp.fc2):
            if not is_gguf_projection(linear):
                continue
            original = linear.cast_bias_weight
            cache = {}

            def cached(input=None, dtype=None, device=None, bias_dtype=None,
                       _original=original, _cache=cache):
                if input is not None:
                    dtype = input.dtype if dtype is None else dtype
                    device = input.device if device is None else device
                    bias_dtype = dtype if bias_dtype is None else bias_dtype
                key = (str(device), dtype, bias_dtype)
                if key not in _cache:
                    _cache[key] = _original(input=input, dtype=dtype, device=device, bias_dtype=bias_dtype)
                    stats['preparations'] += 1
                else:
                    stats['hits'] += 1
                return _cache[key]

            saved.append((linear, linear.__dict__.get('cast_bias_weight', missing), cache))
            linear.cast_bias_weight = cached
        yield
    finally:
        for linear, prior, cache in reversed(saved):
            if prior is missing:
                del linear.cast_bias_weight
            else:
                linear.cast_bias_weight = prior
            cache.clear()


def build_private_tiler(global_module, stream_module, stats):
    def validate(linear):
        if not is_gguf_projection(linear):
            return stream_module.validate_projection(linear)
        if (getattr(linear, '_full_precision_mm', False)
                or getattr(linear, 'comfy_force_cast_weights', False)
                or len(getattr(linear, 'weight_function', []))
                or len(getattr(linear, 'bias_function', []))):
            raise ValueError('MiniMax GGUF streaming does not support additional custom QKV transforms.')

    @contextmanager
    def cast(linear, device, dtype):
        if not is_gguf_projection(linear):
            with stream_module.cast_projection(linear, device, dtype) as result:
                yield result
            return
        validate(linear)
        weight, bias = linear.cast_bias_weight(dtype=dtype, device=device, bias_dtype=dtype)
        if tuple(weight.shape) != (linear.out_features, linear.in_features):
            raise RuntimeError('MiniMax GGUF streaming: QKV was not unpacked to its logical matrix shape.')
        yield weight, bias

    inner = clone_function(stream_module._sparse_block, cast_projection=cast)

    def sparse(block, x, t_emb, segments, rope, options, chunk_size, spec, block_index, head_chunk=8):
        with cache_block_projections(block, stats):
            return inner(block, x, t_emb, segments, rope, options, chunk_size, spec, block_index, head_chunk)

    proxy = types.SimpleNamespace(validate_projection=validate, sparse_block=sparse)
    sparse_dispatch = replace_stream_import(global_module._sparse_block, proxy, 1)
    block_dispatch = clone_function(global_module._block_replace, _sparse_block=sparse_dispatch)
    forward = clone_function(global_module._forward, _block_replace=block_dispatch)
    tiled = replace_stream_import(global_module.tiled_model, proxy, 1)
    return clone_function(tiled, _forward=forward)


def run(cls, *args, **kwargs):
    sample = cls.sample
    bound = inspect.signature(sample).bind(cls(), *args, **kwargs)
    bound.apply_defaults()
    low = bound.arguments['low_res_model']
    high = bound.arguments.get('high_res_model') or low
    # Turning GGUF off in the test still uses the unmodified native path.
    if not any(hasattr(b.attn.qkv_proj.weight, 'tensor_type')
               for b in high.get_model_object('diffusion_model').blocks):
        return sample(*bound.args, **bound.kwargs)

    module = importlib.import_module(cls.__module__)
    package = module.__package__
    global_module = importlib.import_module('.h3_global_tiling', package)
    stream_module = importlib.import_module('.h3_stream_attention', package)
    stats = {'preparations': 0, 'hits': 0}
    tiled = build_private_tiler(global_module, stream_module, stats)

    def global_tiled(model, chunk_size, mode, weight_cache_gb):
        if mode == 'global_stream':
            return tiled(model, chunk_size, use_ram=False, use_stream=True, weight_cache_gb=weight_cache_gb)
        return module._global_tiled_model(model, chunk_size, mode, weight_cache_gb)

    progressive = clone_function(module.progressive_sample, _global_tiled_model=global_tiled)
    private_sample = clone_function(sample, progressive_sample=progressive)
    bound.arguments['highres_tiling'] = True
    bound.arguments['highres_tiling_mode'] = 'global_stream'
    logging.info('[Universal GGUF Stream] enabled: GGUF-native QKV + block-local projection cache; full video/audio context')
    try:
        return private_sample(*bound.args, **bound.kwargs)
    finally:
        logging.info('[Universal GGUF Stream] dense weight preparations=%d, cache hits=%d; block caches released',
                     stats['preparations'], stats['hits'])
