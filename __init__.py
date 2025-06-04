bl_info = {
    "name": "Render Notify",
    "author": "Ihr Name",
    "version": (1, 0, 0),
    "blender": (2, 80, 0),
    "description": "Sendet eine Nachricht, wenn das Rendering fertig ist",
    "category": "Render",
}
import bpy
from bpy.app.handlers import persistent

@persistent
def notify_render_complete(scene):
    # Beispiel: einfache Ausgabe in der Konsole
    print("Render fertig!")
    # Hier könnten Sie auch eine E-Mail versenden oder einen Webhook aufrufen.
def register():
    bpy.app.handlers.render_complete.append(notify_render_complete)

def unregister():
    if notify_render_complete in bpy.app.handlers.render_complete:
        bpy.app.handlers.render_complete.remove(notify_render_complete)
