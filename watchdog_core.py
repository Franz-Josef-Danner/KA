import time
import requests
import psutil

def is_process_alive(pid: int) -> bool:
    """
    Überprüft, ob ein Prozess existiert und noch läuft.
    """
    try:
        process = psutil.Process(pid)
        # Prüft, ob der Prozess noch läuft und keines der speziellen Zombie-Status hat
        return process.is_running() and process.status() != psutil.STATUS_ZOMBIE
    except psutil.NoSuchProcess:
        return False

def send_push(title: str, message: str, token: str, user: str):
    """
    Sendet eine Pushbenachrichtigung über Pushover.
    """
    try:
        response = requests.post(
            "https://api.pushover.net/1/messages.json",
            data={
                "token": token,
                "user": user,
                "title": title,
                "message": message
            },
            timeout=10
        )
        if response.status_code != 200:
            print("Push fehlgeschlagen:", response.status_code, response.text)
    except Exception as e:
        print("Fehler beim Senden der Push-Nachricht:", e)

def main():
    if len(sys.argv) < 4:
        print("Usage: python watchdog_core.py <PID> <TOKEN> <USER>")
        sys.exit(1)
    try:
        pid = int(sys.argv[1])
    except ValueError:
        print("Die PID muss eine Ganzzahl sein.")
        sys.exit(1)

    push_token = sys.argv[2]
    push_user = sys.argv[3]

    while True:
        if not is_process_alive(pid):
            send_push("Blender abgestürzt", f"PID {pid} wurde unerwartet beendet.", push_token, push_user)
            break
        time.sleep(1)

if __name__ == "__main__":
    main()