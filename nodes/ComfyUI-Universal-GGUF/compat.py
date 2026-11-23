# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 gikipil
"""Preserve native MiniMax auxiliary-buffer precision after GGUF loading."""


def prepare_minimax_model(patcher):
    import torch
    import comfy.model_base
    from .vendor.dequant import dequantize_tensor

    if not isinstance(patcher.model, comfy.model_base.MiniMaxH3):
        raise ValueError('Select a MiniMax H3 video GGUF model in Settings → Video.')

    network = patcher.get_model_object('diffusion_model')
    if getattr(network, 'use_adaln_curves', False):
        # Native H3 registers this small interpolation table as float32 and
        # uses float32 time coordinates in torch.lerp. GGUF can store it in
        # float16. Restore only this buffer; transformer weights stay packed.
        table = dequantize_tensor(network.adaln_t_table, dtype=torch.float32)
        if type(table) is not torch.Tensor:
            table = table.as_subclass(torch.Tensor)
        network.adaln_t_table = table.detach().clone()

    return patcher
