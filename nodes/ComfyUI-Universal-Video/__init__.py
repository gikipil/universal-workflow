"""Universal Workflow video output. Copyright gikipil 2026, AGPL-3.0-only."""
import os
import uuid
import folder_paths

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

NODE_CLASS_MAPPINGS = {"UniversalVideoOutput": UniversalVideoOutput}
NODE_DISPLAY_NAME_MAPPINGS = {"UniversalVideoOutput": "Universal Video Output"}
