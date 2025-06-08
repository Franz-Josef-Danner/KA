bl_info = {
    "name": "Render Notify",
    "author": "FJD",
    "version": (1, 0, 0),
    "blender": (2, 80, 0),
    "description": "Sendet eine Nachricht, wenn das Rendering fertig ist",
    "category": "Render",
}

import bpy
from bpy.app.handlers import persistent
import requests

def send_push_notification(title, message, token, user_key):
    url = "https://api.pushover.net/1/messages.json"
    data = {
        "token": token,
        "user": user_key,
        "title": title,
        "message": message,
    }
    try:
        response = requests.post(url, data=data)
        if response.status_code != requests.codes.ok:
            print(f"Notification failed with status {response.status_code}")
    except requests.RequestException as exc:
        print(f"Failed to send push notification: {exc}")

@persistent
def notify_render_complete(scene):
    """Handler that runs when rendering finishes."""
    print("Render fertig!")

    token = "asrgqs7othw2kaa3hihs2cpjyqksif"
    user_key = "uyqozoh1mbgwdim1mnbc1rzh5354e2"

    message = f"Render in Szene '{scene.name}' abgeschlossen."
    send_push_notification("Render fertig", message, token, user_key)

def register():
    bpy.app.handlers.render_complete.append(notify_render_complete)

def unregister():
    if notify_render_complete in bpy.app.handlers.render_complete:
        bpy.app.handlers.render_complete.remove(notify_render_complete)
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Render-Guard 1.0  –  Unified Blender Launcher + Crash Watchdog
"""

import subprocess, sys, os, time, signal, requests

# --- Konfiguration ---------------------------------------------
BLENDER_EXE = r"C:/Programme/Blender/blender.exe"       # ↔ Pfad anpassen
PUSH_URL    = "https://api.pushover.net/1/messages.json"
PUSH_PAYLD  = {
    "token":  "APP_TOKEN",     # Pushover-App-Token
    "user":   "USER_KEY",      # persönlicher User-Key
    "title":  "⚠️  Blender Crash",
    "message": ""
}
# ---------------------------------------------------------------

def send_push(msg: str) -> None:
    """Fire-and-forget Push-Notification (5 s Timeout)."""
    try:
        r = requests.post(PUSH_URL, data={**PUSH_PAYLD, "message": msg},
                          timeout=5)
        r.raise_for_status()
    except Exception as e:
        # Logging auf STDERR, aber nicht abbrechen
        print(f"[Render-Guard] Push-Fehler → {e}", file=sys.stderr)

def main():
    blender_args = sys.argv[1:]           # alle CLI-Parameter an Blender durchreichen
    # Child 1 = Blender
    proc = subprocess.Popen([BLENDER_EXE, *blender_args])
    print(f"[Render-Guard] PID {proc.pid} gestartet …")

    while True:
        try:
            rc = proc.wait(timeout=1)     # 1 s Poll-Intervall
            break                         # Prozess ist beendet
        except subprocess.TimeoutExpired:
            continue                      # noch aktiv → weiter warten
        except KeyboardInterrupt:
            print("[Render-Guard] Cancel → SIGTERM an Blender")
            proc.terminate()
            proc.wait()
            return 0

    if rc == 0:
        print("[Render-Guard] Blender normal beendet (RC 0).")
    else:
        msg = f"Blender ist unerwartet abgestürzt (RC {rc})."
        print(f"[Render-Guard] {msg}")
        send_push(msg)

    return rc

if __name__ == "__main__":
    sys.exit(main())
