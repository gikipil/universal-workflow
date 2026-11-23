# SPDX-License-Identifier: MIT
# Copyright (c) 2026 gikipil
"""Optional LC acceleration. Private adapters; no global sampler patches."""
import ast
import copy
import importlib.util
import inspect
from pathlib import Path
import sys
import types

import comfy.sample
import comfy.samplers
import nodes


_spec = importlib.util.spec_from_file_location(__name__ + '.lc_speed_boost', Path(__file__).with_name('lc_speed_boost.py'))
_lc = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = _lc
_spec.loader.exec_module(_lc)


class Proxy:
    def __init__(self, original, **changes):
        self.original = original
        self.__dict__.update(changes)

    def __getattr__(self, key):
        return getattr(self.original, key)


def cloned(fn, **overrides):
    result = types.FunctionType(fn.__code__, {**fn.__globals__, **overrides}, fn.__name__, fn.__defaults__, fn.__closure__)
    result.__kwdefaults__ = fn.__kwdefaults__
    return result


def wrapped(sampler):
    return _lc._wrap(sampler, True, 4)


# Preserve Comfy's own sigma slicing, sampler setup and intermediate conversion.
# Only the sampler factory in this private function copy is replaced.
class BoostKSampler(comfy.samplers.KSampler):
    sample = cloned(comfy.samplers.KSampler.sample,
                    sampler_object=lambda name: wrapped(comfy.samplers.sampler_object(name)))


_sample_proxy = Proxy(comfy, samplers=Proxy(comfy.samplers, KSampler=BoostKSampler))
_boost_sample = cloned(comfy.sample.sample, comfy=_sample_proxy)
_comfy_proxy = Proxy(comfy, sample=Proxy(comfy.sample, sample=_boost_sample))
_boost_common = cloned(nodes.common_ksampler, comfy=_comfy_proxy)


class UniversalLCKSampler(nodes.KSampler):
    @classmethod
    def INPUT_TYPES(cls):
        schema = copy.deepcopy(nodes.KSampler.INPUT_TYPES())
        schema.setdefault('optional', {})['accelerator'] = ('BOOLEAN', {'default': False})
        return schema

    FUNCTION = 'sample'
    CATEGORY = 'Universal Workflow/Acceleration'

    def sample(self, accelerator=False, **kwargs):
        if not accelerator:
            return super().sample(**kwargs)
        kwargs['latent'] = kwargs.pop('latent_image')
        return _boost_common(**kwargs)


def raw_class():
    return nodes.NODE_CLASS_MAPPINGS['KreaTwoStageSampler']


class UniversalLCRawTurbo:
    RETURN_TYPES = ('LATENT',)
    FUNCTION = 'sample'
    CATEGORY = 'Universal Workflow/Acceleration'

    @classmethod
    def INPUT_TYPES(cls):
        schema = copy.deepcopy(raw_class().INPUT_TYPES())
        schema.setdefault('optional', {})['accelerator'] = ('BOOLEAN', {'default': False})
        return schema

    def sample(self, accelerator=False, **kwargs):
        original = raw_class()
        if not accelerator:
            return original().sample(**kwargs)
        fn = original.sample
        helper = fn.__globals__['_sample_with_sigmas']
        boosted_helper = cloned(helper, comfy=_comfy_proxy)
        helper_signature = inspect.signature(helper)
        used = False

        def first_noise_stage(*args, **params):
            nonlocal used
            bound = helper_signature.bind(*args, **params)
            # Only first stage adding initial noise; Turbo continuation is untouched.
            if not used and not bound.arguments['disable_noise']:
                used = True
                return boosted_helper(*args, **params)
            return helper(*args, **params)

        run = cloned(fn, _sample_with_sigmas=first_noise_stage)
        return run(original(), **kwargs)


def res_module():
    cls = nodes.NODE_CLASS_MAPPINGS['ClownsharKSampler_Beta']
    return cls, sys.modules[cls.__module__]


class UniversalLCRES4LYF:
    RETURN_TYPES = ('LATENT', 'LATENT', 'OPTIONS')
    RETURN_NAMES = ('output', 'denoised', 'options')
    FUNCTION = 'sample'
    CATEGORY = 'Universal Workflow/Acceleration'

    @classmethod
    def INPUT_TYPES(cls):
        _, module = res_module()
        return {'required': {
            'eta': ('FLOAT', {'default': 0.0, 'min': -100.0, 'max': 100.0, 'step': 0.01}),
            'sampler_name': (module.get_sampler_name_list(),),
            'scheduler': (module.get_res4lyf_scheduler_list(),),
            'steps': ('INT', {'default': 8, 'min': 1, 'max': 10000}),
            'steps_to_run': ('INT', {'default': -1, 'min': -1, 'max': 10000}),
            'denoise': ('FLOAT', {'default': 1.0, 'min': 0.0, 'max': 1.0, 'step': 0.01}),
            'cfg': ('FLOAT', {'default': 1.0, 'min': 0.0, 'max': 100.0, 'step': 0.01}),
            'seed': ('INT', {'default': 42, 'min': 0, 'max': 0xffffffffffffffff, 'control_after_generate': True}),
            'sampler_mode': (['unsample', 'standard', 'resample'],),
            'bongmath': ('BOOLEAN', {'default': False}),
        }, 'optional': {
            'model': ('MODEL',), 'positive': ('CONDITIONING',), 'negative': ('CONDITIONING',),
            'latent_image': ('LATENT',), 'sigmas': ('SIGMAS',), 'guides': ('GUIDES',),
            'options_group.options0': ('OPTIONS',),
            'accelerator': ('BOOLEAN', {'default': False}),
        }}

    def sample(self, accelerator=False, **kwargs):
        original, module = res_module()
        if not accelerator:
            result = original.execute(**kwargs)
        else:
            # Compile only a private copy of the author's execute method with his
            # actual module globals. SharkSampler, options and outputs stay original.
            tree = ast.parse(Path(module.__file__).read_text(encoding='utf-8-sig'))
            cls_ast = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'ClownsharKSampler_Beta')
            method = copy.deepcopy(next(n for n in cls_ast.body if isinstance(n, ast.FunctionDef) and n.name == 'execute'))
            method.decorator_list = []
            shark_ast = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'SharkSampler')
            shark_method = copy.deepcopy(next(n for n in shark_ast.body if isinstance(n, ast.FunctionDef) and n.name == 'main'))
            shark_method.decorator_list = []

            class WrapSampling(ast.NodeTransformer):
                count = 0

                def visit_Call(self, node):
                    self.generic_visit(node)
                    if isinstance(node.func, ast.Attribute) and node.func.attr == 'sample' and isinstance(node.func.value, ast.Name) and node.func.value.id == 'guider':
                        assert len(node.args) >= 3 and isinstance(node.args[2], ast.Name) and node.args[2].id == 'sampler'
                        node.args[2] = ast.Call(func=ast.Name(id='_lc_wrap', ctx=ast.Load()), args=[node.args[2]], keywords=[])
                        self.count += 1
                    return node

            transformer = WrapSampling()
            shark_method = transformer.visit(shark_method)
            if transformer.count != 2:
                raise RuntimeError('RES4LYF source changed: LC adapter needs review.')
            shark_namespace = {**vars(module), '_lc_wrap': wrapped}
            exec(compile(ast.fix_missing_locations(ast.Module(body=[shark_method], type_ignores=[])), module.__file__, 'exec'), shark_namespace)

            class WrappedShark(module.SharkSampler):
                main = shark_namespace['main']

            namespace = {**vars(module), 'SharkSampler': WrappedShark}
            code = ast.fix_missing_locations(ast.Module(body=[method], type_ignores=[]))
            exec(compile(code, module.__file__, 'exec'), namespace)
            result = namespace['execute'](original, **kwargs)
        return tuple(result.result) if hasattr(result, 'result') else tuple(result)


NODE_CLASS_MAPPINGS = {
    'UniversalLCKSampler': UniversalLCKSampler,
    'UniversalLCRawTurbo': UniversalLCRawTurbo,
    'UniversalLCRES4LYF': UniversalLCRES4LYF,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    'UniversalLCKSampler': 'LC · KSampler',
    'UniversalLCRawTurbo': 'LC · Raw → Turbo',
    'UniversalLCRES4LYF': 'LC · RES4LYF',
}
