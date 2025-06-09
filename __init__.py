bl_info = {
    "name":        "Render Watchdog Auto",
    "author":      "Franz J. Danner",
    "version":     (1, 0, 0),
    "blender":     (2, 80, 0),
    "category":    "System",
    "description": "Startet externen Watchdog bei jedem Render-Job"
}

import bpy, sys, subprocess, os, atexit
from pathlib import Path

# ── KONFIG ───────────────────────────────────────────────────────────
PUSH_TOKEN = "asrgqs7othw2kaa3hihs2cpjyqksif"
PUSH_USER  = "uyqozoh1mbgwdim1mnbc1rzh5354e2"
# Pfad zum watchdog_core.py innerhalb des Add-on-Ordners
WD_PATH = Path(__file__).with_name("watchdog_core.py")
PY_EXEC = sys.executable  # benutzt Jetziges Python (Blender interne)
# ─────────────────────────────────────────────────────────────────────

_process = None  # globale Referenz

# ––––– Helper ––––––
def _launch_watchdog():
    global _process
    if _process is None or _process.poll() is not None:
        cmd = [PY_EXEC, str(WD_PATH), str(os.getpid()), PUSH_TOKEN, PUSH_USER]
        _process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL,
                                    stderr=subprocess.DEVNULL)

def _terminate_watchdog():
    global _process
    if _process and _process.poll() is None:
        _process.terminate()
        try:
            _process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            _process.kill()
    _process = None

# ––––– Handler ––––––
def on_render_pre(scene):
    _launch_watchdog()

def on_render_finish(scene):
    _terminate_watchdog()

# ––––– Register –––––
def register():
    bpy.app.handlers.render_pre.append(on_render_pre)
    bpy.app.handlers.render_complete.append(on_render_finish)
    bpy.app.handlers.render_cancel.append(on_render_finish)
    atexit.register(_terminate_watchdog)

def unregister():
    _terminate_watchdog()
    for hndl in (on_render_pre, on_render_finish):
        for coll in (bpy.app.handlers.render_pre,
                     bpy.app.handlers.render_complete,
                     bpy.app.handlers.render_cancel):
            if hndl in coll:
                coll.remove(hndl)