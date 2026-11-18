"""Universal Workflow memory cleanup. Copyright gikipil 2026, AGPL-3.0-only."""
import functools
import gc
import inspect
import logging
import sys
import traceback

from aiohttp import web
import execution
import comfy.model_management as mm
from server import PromptServer

MARKER = "universal_memory_cleanup"


def requested(extra_data):
    if not isinstance(extra_data, dict):
        return False
    pnginfo = extra_data.get("extra_pnginfo")
    workflow = pnginfo.get("workflow") if isinstance(pnginfo, dict) else None
    extra = workflow.get("extra") if isinstance(workflow, dict) else None
    return isinstance(extra, dict) and extra.get(MARKER) is True



def release_memory(executor):
    # Reset before execution, never from a graph node or the HTTP/UI thread.
    # This releases cached node instances and outputs as well as their CPU tensors.
    executor.reset()
    mm.unload_all_models()  # Includes installed plugins' native unload hooks (Higgs).
    for module in tuple(sys.modules.values()):
        path = str(getattr(module, "__file__", "")).replace("\\", "/")
        if path.endswith("/ComfyUI-QwenTTS/AILab_QwenTTS.py"):
            cache = getattr(module, "_MODEL_CACHE", None)
            if isinstance(cache, dict):
                cache.clear()
    gc.collect()
    mm.soft_empty_cache(force=True)


def install(executor_class=execution.PromptExecutor):
    original = executor_class.execute
    if getattr(original, "universal_memory_cleanup", False):
        return
    signature = inspect.signature(original)

    @functools.wraps(original)
    def execute(self, *args, **kwargs):
        bound = signature.bind(self, *args, **kwargs)
        extra = bound.arguments.get("extra_data") or {}
        if not requested(extra):
            return original(self, *args, **kwargs)
        prompt_id = bound.arguments.get("prompt_id")
        try:
            logging.info("[Universal Workflow] Releasing node cache, models, RAM and accelerator cache before %s", prompt_id)
            release_memory(self)
        except Exception as error:
            # Do not let a cleanup failure terminate ComfyUI's queue worker.
            self.server.client_id = extra.get("client_id")
            self.status_messages = []
            self.success = False
            self.history_result = {"outputs": {}, "meta": {}}
            self.add_message("execution_start", {"prompt_id": prompt_id}, broadcast=False)
            self.add_message("execution_error", {
                "prompt_id": prompt_id, "node_id": "universal_memory_cleanup",
                "node_type": "UniversalMemoryCleanup", "executed": [],
                "exception_message": "Не удалось очистить память: " + str(error),
                "exception_type": type(error).__name__,
                "traceback": traceback.format_exc().splitlines(True),
                "current_inputs": {}, "current_outputs": [],
            }, broadcast=False)
            logging.exception("[Universal Workflow] Memory cleanup failed")
            return
        return original(self, *args, **kwargs)

    execute.universal_memory_cleanup = True
    executor_class.execute = execute


install()


@PromptServer.instance.routes.get("/universal-memory/status")
async def status(request):
    return web.json_response({"ready": True, "version": 1})


NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
