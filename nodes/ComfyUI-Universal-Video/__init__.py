"""Universal Workflow video output. Copyright gikipil 2026, AGPL-3.0-only."""
import os
import uuid
import folder_paths


class UniversalVideoStreamModel:
    """Apply SelfLift's supported native streaming path to the optional refiner."""
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"model": ("MODEL",),
                "token_chunk": ("INT", {"default": 4096, "min": 128, "max": 16384, "step": 128}),
                "weight_cache_gb": ("FLOAT", {"default": 4.0, "min": 0.0, "max": 64.0, "step": 0.5})}}

    RETURN_TYPES = ("MODEL",)
    FUNCTION = "patch"
    CATEGORY = "Universal Workflow/video"

    def patch(self, model, token_chunk=4096, weight_cache_gb=4.0):
        import importlib
        import nodes
        sampler = nodes.NODE_CLASS_MAPPINGS.get("SelfLiftAvatarH3Sampler")
        if sampler is None:
            raise RuntimeError("Install the required video nodes and restart ComfyUI before using video refinement.")
        package = sampler.__module__.rsplit(".", 1)[0]
        streaming = importlib.import_module(package + ".h3_global_tiling")
        return (streaming.tiled_model(model, chunk_size=token_chunk, use_stream=True,
                                      weight_cache_gb=weight_cache_gb),)

class UniversalVideoOutput:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"video": ("VIDEO",), "save_output": ("BOOLEAN", {"default": False}),
                "filename_prefix": ("STRING", {"default": "video/Universal_MiniMax"}),
                "crf": ("FLOAT", {"default": 12.0, "min": 0.0, "max": 51.0, "step": 1.0})}}
    RETURN_TYPES = ("VIDEO",)
    FUNCTION = "write"
    CATEGORY = "Universal Workflow/video"
    OUTPUT_NODE = True

    def write(self, video, save_output=False, filename_prefix="video/Universal_MiniMax", crf=12.0):
        from comfy_api.latest import Types
        directory = folder_paths.get_output_directory() if save_output else folder_paths.get_temp_directory()
        width, height = video.get_dimensions()
        prefix = filename_prefix if save_output else "Universal_MiniMax_" + uuid.uuid4().hex[:12]
        folder, name, counter, subfolder, _ = folder_paths.get_save_image_path(prefix, directory, width, height)
        file = f"{name}_{counter:05}_.mp4"
        video.save_to(os.path.join(folder, file), format=Types.VideoContainer("mp4"),
                      codec=Types.VideoCodec("h264"), metadata=None, crf=float(crf))
        ref = {"filename": file, "subfolder": subfolder, "type": "output" if save_output else "temp"}
        return {"ui": {"images": [ref]}, "result": (video,)}

NODE_CLASS_MAPPINGS = {"UniversalVideoOutput": UniversalVideoOutput,
                       "UniversalVideoStreamModel": UniversalVideoStreamModel}
NODE_DISPLAY_NAME_MAPPINGS = {"UniversalVideoOutput": "Universal Video Output",
                              "UniversalVideoStreamModel": "Universal Video · Native Stream Refiner"}


# Read-only capability check: reject unsupported video runtimes before loading weights.
try:
    from server import PromptServer
except ImportError:
    PromptServer = None

if PromptServer is not None:
    @PromptServer.instance.routes.post('/universal/video/last-frame')
    async def video_last_frame(request):
        import asyncio
        from aiohttp import web
        from .last_frame import extract_last_frame
        try:
            ref = await request.json()
            result = await asyncio.to_thread(extract_last_frame, ref,
                {'output': folder_paths.get_output_directory(), 'temp': folder_paths.get_temp_directory()},
                folder_paths.get_input_directory())
            return web.json_response(result)
        except (ValueError, FileNotFoundError):
            return web.json_response({'error': 'Video result is unavailable or has no readable frames.'}, status=400)
        except Exception:
            return web.json_response({'error': 'Could not extract the last frame. Check the video file and PyAV installation.'}, status=500)

    @PromptServer.instance.routes.get('/universal/video/runtime')
    async def video_runtime(request):
        import torch
        import nodes
        import comfy_kitchen as ck
        from aiohttp import web
        required = ['BlockSparseAttention', 'SelfLiftAvatarH3Sampler', 'H3SigmaRefiner',
                    'MiniMaxH3AudioConditioningT8', 'UniversalVideoStreamModel']
        missing = [name for name in required if name not in nodes.NODE_CLASS_MAPPINGS]
        cuda = torch.version.cuda or ''
        cuda_major = int(cuda.split('.')[0]) if cuda else 0
        available = cuda_major >= 13 and torch.cuda.is_available() and ck.sol_attn_is_available()
        return web.json_response({'ok': bool(available and not missing), 'cuda': cuda,
                                  'sol_available': bool(available), 'missing_nodes': missing})
