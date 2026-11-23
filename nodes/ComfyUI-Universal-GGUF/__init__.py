# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2026 gikipil
"""Isolated MiniMax GGUF entry point. Existing GGUF node IDs are not replaced."""
import importlib
import folder_paths

paths=[]
for kind in ('diffusion_models','unet','unet_gguf'):
    for path in folder_paths.folder_names_and_paths.get(kind,([],set()))[0]:
        if path not in paths:paths.append(path)
folder_paths.folder_names_and_paths['universal_minimax_gguf']=(paths,{'.gguf'})

class UniversalMiniMaxGGUF:
    @classmethod
    def INPUT_TYPES(cls):
        return {'required':{'unet_name':(['None',*folder_paths.get_filename_list('universal_minimax_gguf')],)}}
    RETURN_TYPES=('MODEL',)
    FUNCTION='load_unet'
    CATEGORY='Universal Workflow/Video'
    def load_unet(self,unet_name):
        if not unet_name or unet_name in ('None','none'):
            raise ValueError('Select the MiniMax H3 GGUF file in Settings → Video.')
        path=folder_paths.get_full_path('universal_minimax_gguf',unet_name)
        if not path:raise FileNotFoundError(unet_name)
        # Import the pinned compatible implementation only for the GGUF branch.
        # The vendor package is nested, so its generic node mappings are never
        # registered with ComfyUI and cannot replace another GGUF installation.
        module=importlib.import_module('.vendor.nodes',__name__)
        # The underlying loader uses the shared unet_gguf inventory. Include all
        # custom model roots registered by this isolated loader.
        old_paths=folder_paths.folder_names_and_paths.get('unet_gguf',([],set()))[0]
        folder_paths.folder_names_and_paths['unet_gguf']=(list(dict.fromkeys([*old_paths,*paths])),{'.gguf'})
        from .compat import prepare_minimax_model
        result = module.UnetLoaderGGUF().load_unet(unet_name)
        return (prepare_minimax_model(result[0]), *result[1:])

NODE_CLASS_MAPPINGS={'UniversalMiniMaxGGUF':UniversalMiniMaxGGUF}
NODE_DISPLAY_NAME_MAPPINGS={'UniversalMiniMaxGGUF':'MiniMax H3 · GGUF loader'}
