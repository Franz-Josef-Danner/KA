--- a/__init__.py
+++ b/__init__.py
@@ -1,22 +1,41 @@
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
    requests.post(url, data=data)
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

 token = asrgqs7othw2kaa3hihs2cpjyqksif
 user_key = uyqozoh1mbgwdim1mnbc1rzh5354e2

 message = f"Render in Szene '{scene.name}' abgeschlossen."
 send_push_notification("Render fertig", message, token, user_key)
 def register():
     bpy.app.handlers.render_complete.append(notify_render_complete)
 
 def unregister():
     if notify_render_complete in bpy.app.handlers.render_complete:
         bpy.app.handlers.render_complete.remove(notify_render_complete)
 
EOF
)
