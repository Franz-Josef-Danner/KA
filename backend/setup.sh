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
