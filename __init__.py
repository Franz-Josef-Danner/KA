 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/__init__.py b/__init__.py
index 3baa5dd1ea2e296b9ded51fbb6d4758489fc8cb2..83501396c7b132cef2265a842f7449ecb95e174f 100644
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
+import requests
+
+
+def send_push_notification(title, message, token, user_key):
+    """Send a push notification via the Pushover service."""
+    url = "https://api.pushover.net/1/messages.json"
+    data = {
+        "token": asrgqs7othw2kaa3hihs2cpjyqksif,
+        "user": uyqozoh1mbgwdim1mnbc1rzh5354e2,
+        "title": Render erledigt,
+        "message": Aufhören oder weiter machen?,
+    }
+    requests.post(url, data=data)
 
 @persistent
 def notify_render_complete(scene):
-    # Beispiel: einfache Ausgabe in der Konsole
+    """Handler that runs when rendering finishes."""
     print("Render fertig!")
-    # Hier könnten Sie auch eine E-Mail versenden oder einen Webhook aufrufen.
+
+    # Replace with your Pushover credentials
+    token = asrgqs7othw2kaa3hihs2cpjyqksif
+    user_key = uyqozoh1mbgwdim1mnbc1rzh5354e2
+
+    message = f"Render in Szene '{scene.name}' abgeschlossen."
+    send_push_notification("Render fertig", message, token, user_key)
 def register():
     bpy.app.handlers.render_complete.append(notify_render_complete)
 
 def unregister():
     if notify_render_complete in bpy.app.handlers.render_complete:
         bpy.app.handlers.render_complete.remove(notify_render_complete)
 
EOF
)
