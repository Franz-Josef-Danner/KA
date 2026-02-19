<?php
/**
 * Emergency Admin Recovery Script
 *
 * USE CASE: The admin is completely locked out (wrong credentials, email not working).
 *
 * HOW TO USE:
 *   1. Upload / deploy this file to your server (it is already part of the repository).
 *   2. Create a gate file on the server via FTP, SSH or your hosting file-manager:
 *        data/EMERGENCY_RESET_ENABLED
 *      (The file content does not matter – its mere existence acts as the key.)
 *   3. Open this URL in your browser:
 *        https://your-domain/api/emergency-admin-reset.php
 *   4. Fill in the new e-mail address and password and click "Speichern".
 *   5. After a successful reset the gate file is deleted automatically.
 *   6. Log in with the new credentials at index.html.
 *
 * IMPORTANT:
 *   • This endpoint bypasses all authentication.
 *   • It is protected ONLY by the gate file – meaning you need file-system access
 *     (FTP, SSH, hosting panel) to enable it.
 *   • Disable it again by deleting the gate file (done automatically) or by
 *     removing this file from the server.
 */

$dataDir   = __DIR__ . '/../data';
$gateFile  = $dataDir . '/EMERGENCY_RESET_ENABLED';
$adminFile = $dataDir . '/admin-users.json';

// ── Gate check ──────────────────────────────────────────────────────────────
$gateOpen = file_exists($gateFile);

// ── POST: process credential reset ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $gateOpen) {
    $email    = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $confirm  = trim($_POST['password_confirm'] ?? '');

    $errors = [];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
    }
    if ($password !== $confirm) {
        $errors[] = 'Die Passwörter stimmen nicht überein.';
    }

    if (empty($errors)) {
        // Hash must match the frontend auth.js simpleHash() which uses SHA-256.
        // The entire authentication system (including login) compares SHA-256 hashes,
        // so bcrypt cannot be used here without a coordinated frontend change.
        $hash = hash('sha256', $password);

        // Preserve any existing admin accounts not matching this email,
        // and update (or create) the account for the provided email.
        $existingAdmins = [];
        if (file_exists($adminFile)) {
            $decoded = json_decode(file_get_contents($adminFile), true);
            if (is_array($decoded)) {
                foreach ($decoded as $a) {
                    if (strtolower($a['email'] ?? '') !== strtolower($email)) {
                        $existingAdmins[] = $a;
                    }
                }
            }
        }

        $existingAdmins[] = [
            'email'    => $email,
            'password' => $hash,
            'role'     => 'admin',
        ];

        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0755, true);
        }

        $saved = file_put_contents(
            $adminFile,
            json_encode($existingAdmins, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        if ($saved !== false) {
            // Remove gate file so the endpoint is automatically disabled
            @unlink($gateFile);
            $success = true;
        } else {
            $errors[] = 'Fehler beim Schreiben von admin-users.json. Bitte prüfen Sie die Schreibrechte.';
        }
    }
}

// ── HTML output ──────────────────────────────────────────────────────────────
?><!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Notfall-Zugangsdaten – KA System</title>
  <link rel="stylesheet" href="../css/styles.css" />
  <style>
    .recovery-hint {
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 13px;
      color: #5d4037;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .recovery-hint strong { display: block; margin-bottom: 4px; }
    .step-list { margin: 6px 0 0 16px; padding: 0; }
    .step-list li { margin-bottom: 3px; }
  </style>
</head>
<body class="login-page">
  <div class="login-container" style="max-width: 500px;">
    <div class="login-card">
      <h1 style="font-size:22px;">Notfall-Zugangsdaten</h1>

<?php if (!$gateOpen): ?>

      <div class="error-message" style="display:block; margin-bottom:20px;">
        <strong>Zugriff verweigert</strong><br>
        Die Notfall-Wiederherstellung ist nicht aktiviert.<br><br>
        Um sie zu aktivieren, erstellen Sie die folgende leere Datei auf Ihrem Server
        (per FTP, SSH oder Hosting-Dateimanager):<br>
        <code style="word-break:break-all; font-size:12px;"><?= htmlspecialchars(realpath($dataDir) ?: $dataDir) ?>/EMERGENCY_RESET_ENABLED</code>
      </div>
      <p style="text-align:center; font-size:14px;">
        <a href="../index.html" style="color:#667eea; text-decoration:none;">← Zurück zur Anmeldung</a>
      </p>

<?php elseif (!empty($success)): ?>

      <div class="message success-message" style="display:block; margin-bottom:20px;">
        ✅ Zugangsdaten wurden erfolgreich zurückgesetzt.<br>
        Die Notfall-Wiederherstellung wurde automatisch deaktiviert.<br><br>
        Sie können sich jetzt mit den neuen Daten anmelden.
      </div>
      <p style="text-align:center;">
        <a href="../index.html" class="login-btn" style="display:inline-block; text-decoration:none; padding:12px 24px;">
          Zur Anmeldung
        </a>
      </p>

<?php else: ?>

      <div class="recovery-hint">
        <strong>⚠ Notfall-Wiederherstellung aktiv</strong>
        Setzen Sie hier die Administrator-Zugangsdaten zurück.
        Nach dem Speichern wird die Notfall-Funktion automatisch deaktiviert.
        <ol class="step-list">
          <li>Geben Sie eine neue E-Mail-Adresse und ein neues Passwort ein.</li>
          <li>Klicken Sie auf „Speichern".</li>
          <li>Melden Sie sich mit den neuen Daten an.</li>
          <li>Löschen Sie diese Datei vom Server, sobald Sie wieder eingeloggt sind.</li>
        </ol>
      </div>

      <?php if (!empty($errors)): ?>
        <div class="error-message" style="display:block; margin-bottom:16px;">
          <?= implode('<br>', array_map('htmlspecialchars', $errors)) ?>
        </div>
      <?php endif; ?>

      <form method="post" class="login-form">
        <div class="form-group">
          <label for="email">Neue E-Mail-Adresse</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="admin@ihre-domain.de"
            autocomplete="email"
            value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
          />
        </div>

        <div class="form-group">
          <label for="password">Neues Passwort (mind. 8 Zeichen)</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            placeholder="Mindestens 8 Zeichen"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="password_confirm">Passwort bestätigen</label>
          <input
            type="password"
            id="password_confirm"
            name="password_confirm"
            required
            placeholder="Passwort wiederholen"
            autocomplete="new-password"
          />
        </div>

        <button type="submit" class="login-btn">Speichern</button>
      </form>

      <p style="text-align:center; margin-top:20px; font-size:13px;">
        <a href="../index.html" style="color:#667eea; text-decoration:none;">← Zurück zur Anmeldung</a>
      </p>

<?php endif; ?>

    </div>
  </div>
</body>
</html>
