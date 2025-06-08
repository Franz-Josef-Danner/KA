bl_info = {
    "name": "Render Watchdog",
    "blender": (2, 80, 0),
    "category": "System",
}

import atexit
import bpy
import os
import time
import sys
import tempfile
from collections import deque
from multiprocessing import Process

_watchdog = None
_parent_pid = os.getpid()
_stdout_orig = None
_stderr_orig = None
_last_lines = deque(maxlen=20)
_log_path = os.path.join(tempfile.gettempdir(), "blender_watchdog.log")


def send_push(message: str) -> None:
    """Send a push notification. Placeholder implementation."""
    try:
        import requests
        requests.post("https://example.com/push", json={"message": message})
    except Exception:
        # Fallback to console output if requests is unavailable
        print("Push:", message)


class _ConsoleCapture:
    """Capture stdout/stderr while keeping the original behavior."""

    def __init__(self, stream):
        self.stream = stream
        self._is_capture = True

    def write(self, data):
        self.stream.write(data)
        for line in data.splitlines():
            if line.strip():
                _last_lines.append(line)
        with open(_log_path, "a", encoding="utf-8") as f:
            f.write(data)
            f.flush()

    def flush(self):
        self.stream.flush()


def _process_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def _get_last_log_lines(num: int = 20) -> str:
    if not os.path.exists(_log_path):
        return ""
    with open(_log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return "".join(lines[-num:])


def _setup_capture() -> None:
    global _stdout_orig, _stderr_orig
    if not getattr(sys.stdout, "_is_capture", False):
        _stdout_orig = sys.stdout
        sys.stdout = _ConsoleCapture(sys.stdout)
    if not getattr(sys.stderr, "_is_capture", False):
        _stderr_orig = sys.stderr
        sys.stderr = _ConsoleCapture(sys.stderr)
    open(_log_path, "w", encoding="utf-8").close()


def _remove_capture() -> None:
    global _stdout_orig, _stderr_orig
    if _stdout_orig is not None and getattr(sys.stdout, "_is_capture", False):
        sys.stdout = _stdout_orig
        _stdout_orig = None
    if _stderr_orig is not None and getattr(sys.stderr, "_is_capture", False):
        sys.stderr = _stderr_orig
        _stderr_orig = None


def _watchdog_loop(pid: int) -> None:
    while True:
        if not _process_alive(pid):
            lines = _get_last_log_lines()
            msg = "Blender crashed"  ("\n"  lines if lines else "")
            send_push(msg)
            break
        time.sleep(2)


def start_watchdog() -> None:
    global _watchdog
    if _watchdog is None:
        _setup_capture()
        _watchdog = Process(target=_watchdog_loop, args=(_parent_pid,), daemon=True)
        _watchdog.start()


def stop_watchdog() -> None:
    global _watchdog
    if _watchdog is not None:
        send_push("Blender closed")
        _watchdog.terminate()
        _watchdog.join()
        _watchdog = None
    _remove_capture()


def render_finished(_scene: bpy.types.Scene) -> None:
    send_push("Render finished")


def register() -> None:
    bpy.app.handlers.render_complete.append(render_finished)
    start_watchdog()
    atexit.register(stop_watchdog)


def unregister() -> None:
    stop_watchdog()
    if render_finished in bpy.app.handlers.render_complete:
        bpy.app.handlers.render_complete.remove(render_finished)


