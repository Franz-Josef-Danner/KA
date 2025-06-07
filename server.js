const express = require('express');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory (HTML/JS)
app.use(express.static(__dirname));

const EMAIL_USERNAME = process.env.EMAIL_USERNAME;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// Endpoint to send an e-mail and create a calendar event
app.post('/send-email', async (req, res) => {
  const { to, subject, body, firma, telefon, adresse, kommentar, inhaber } = req.body;

  try {
    // Configure SMTP client similar to the C# version
    const transporter = nodemailer.createTransport({
      host: 'smtp.world4you.com',
      port: 587,
      secure: false,
      auth: { user: EMAIL_USERNAME, pass: EMAIL_PASSWORD }
    });

    await transporter.sendMail({
      from: EMAIL_USERNAME,
      to,
      subject,
      html: body
    });

    // Add appointment to Google Calendar seven days from now
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'json', 'service_account.json'),
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = {
      summary: 'Mail gesendet an ' + (firma || ''),
      description: `Telefon: ${telefon}\nAdresse: ${adresse}\nKommentar: ${kommentar}\nInhaber: ${inhaber}`,
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() }
    };

    await calendar.events.insert({ calendarId: 'primary', requestBody: event });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Endpoint to add a phone appointment to Google Calendar
app.post('/add-tele-termin', async (req, res) => {
  const { firma, telefon, kommentar, date, time } = req.body;

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, 'json', 'service_account.json'),
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    const client = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const startDate = new Date(`${date}T${time}:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const event = {
      summary: 'Anruf bei ' + (firma || ''),
      description: `Telefon: ${telefon}\nKommentar: ${kommentar}`,
      start: { dateTime: startDate.toISOString() },
      end: { dateTime: endDate.toISOString() }
    };

    await calendar.events.insert({ calendarId: 'primary', requestBody: event });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
