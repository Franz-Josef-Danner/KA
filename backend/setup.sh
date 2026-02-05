#!/bin/bash

# KA Email Backend Setup Script
# This script helps you set up the email backend quickly

echo "🚀 KA Email Backend Setup"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert!"
    echo "   Bitte installieren Sie Node.js von https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js gefunden: $(node --version)"
echo "✅ npm gefunden: $(npm --version)"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installiere Dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Fehler bei der Installation der Dependencies"
    exit 1
fi

echo "✅ Dependencies installiert"
echo ""

# Create config.json if it doesn't exist
if [ ! -f "config.json" ]; then
    echo "📝 Erstelle config.json..."
    cp config.example.json config.json
    echo "✅ config.json erstellt"
    echo ""
    echo "⚠️  WICHTIG: Bearbeiten Sie jetzt config.json mit Ihren E-Mail-Zugangsdaten!"
    echo "   nano config.json"
    echo ""
else
    echo "✅ config.json existiert bereits"
    echo ""
fi

# Create empty queue file if it doesn't exist
if [ ! -f "email-queue.json" ]; then
    echo "[]" > email-queue.json
    echo "✅ Leere email-queue.json erstellt"
    echo ""
fi

# Create smtp-debug.log with header if it doesn't exist
if [ ! -f "smtp-debug.log" ]; then
    cat > smtp-debug.log << 'EOF'
# SMTP Debug Log
# ================================================================================
# This file logs all SMTP email sending operations for debugging purposes.
# Each log entry includes timestamp, configuration, and detailed SMTP conversation.
#
# Log Rotation: Automatically rotates when file size exceeds 10MB
#
# Location: backend/smtp-debug.log
# Created: Automatically by the email sending system
#
# IMPORTANT: This file may contain sensitive information (email addresses).
#            It is protected by backend/.htaccess from web access.
#
# Usage:
# - Check this file when email sending fails
# - Look for error messages and SMTP response codes
# - Common SMTP errors:
#   * 535 Authentication failed - Wrong username/password
#   * 550 Sender rejected - Invalid FROM address (must be existing mailbox)
#   * 554 Connection refused - Wrong host or port
#   * 454 TLS not available - Wrong port (use 587 for STARTTLS)
#
# If this file is empty or only contains this header, no email sending has been
# attempted yet through the system.
# ================================================================================

EOF
    echo "✅ SMTP Debug Log (smtp-debug.log) erstellt"
    echo ""
fi

echo "✨ Setup abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo ""
echo "1. Bearbeiten Sie config.json mit Ihren Zugangsdaten:"
echo "   nano config.json"
echo ""
echo "2. Testen Sie den E-Mail-Versand:"
echo "   node email-sender.js"
echo ""
echo "3. Richten Sie einen Cronjob ein:"
echo "   crontab -e"
echo "   */5 * * * * cd $(pwd) && node email-sender.js >> /var/log/ka-email.log 2>&1"
echo ""
echo "📖 Siehe README.md für detaillierte Anweisungen"
echo ""
