using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Calendar.v3;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using System;
using System.IO;
using System.Net.Mail;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace res_format
{
    public partial class Email : Form
    {

        public Email()
        {
            InitializeComponent();
            SendButton.Click += (sender, e) => Close();
        }

        private void BetreffTextBox_DoubleClick(object sender, EventArgs e)
        {
            BetreffTextBox.SelectAll();  // Wählt den gesamten Text in der TextBox aus
        }

        private void EmailBodyTextBox_DoubleClick(object sender, EventArgs e)
        {
            EmailBodyTextBox.SelectAll();  // Wählt den gesamten Text in der TextBox aus
        }

        private async Task SendEmailAsync(string from, string to, string subject, string body, string password)
        {
            try
            {
                var smtpClient = new SmtpClient("smtp.world4you.com")
                {
                    Port = 587, // Standardport für TLS ist 587
                    Credentials = new NetworkCredential(from, password),
                    EnableSsl = true, // SSL muss aktiviert sein, um die Sicherheit der Verbindung zu gewährleisten
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(from),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true // Hier wird angegeben, dass der E-Mail-Body HTML-Content enthält
                };
                mailMessage.To.Add(to);

                await smtpClient.SendMailAsync(mailMessage);
                MessageBox.Show("E-Mail wurde erfolgreich gesendet!", "Erfolg", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Fehler beim Senden der E-Mail: " + ex.Message, "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }


        private async void SendButton_Click(object sender, EventArgs e)
        {

            string fromEmail = "danner@stagedive.at";
            string toEmail = EmailBox.Text;
            string emailSubject = BetreffTextBox.Text;
            string emailBody = EmailBodyTextBox.Text;
            string emailPassword = "92J4WGosyurRt"; // Stellen Sie sicher, dass Sie das Passwort sicher speichern/handhaben

            await SendEmailAsync(fromEmail, toEmail, emailSubject, emailBody, emailPassword);


            // Termin in den Google Kalender 7 Tage von heute hinzufügen
            DateTime startDate = DateTime.Now.AddDays(7);
            DateTime endDate = startDate.AddHours(1); // Dauer: 1 Stunde
            await AddEventToGoogleCalendarAsync(BetreffTextBox.Text, startDate, endDate);
        }

        // eine funktion zum Termine in den Google Kalender hinzufügen, 7 tage von heute
        private async Task AddEventToGoogleCalendarAsync(string summary, DateTime startDate, DateTime endDate)
        {
            if (summary is null)
            {
                throw new ArgumentNullException(nameof(summary));
            }
            // strings erstellen
            string firma = FirmaBodyTextBox.Text;
            string telefon = TelefonBodyTextBox.Text;
            string adresse = AdresseBodyTextBox.Text;
            string kommentar = KommentarBodyTextBox.Text;
            string inhaber = InhaberBodyTextBox.Text;

            UserCredential credential = GetCredential();
            CalendarService service = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "Stagedive Organisation"
            });

            Event newEvent = new Event
            {
                Summary = "Mail gesendet an " + firma,
                Description = $"Telefon: {telefon}\nAdresse: {adresse}\nKommentar: {kommentar}\nInhaber: {inhaber}",
                Start = new EventDateTime { DateTimeDateTimeOffset = startDate },
                End = new EventDateTime { DateTimeDateTimeOffset = endDate }
            };

            string calendarId = "primary"; // Standardkalender des angemeldeten Benutzers
            EventsResource.InsertRequest request = service.Events.Insert(newEvent, calendarId);
            _ = await request.ExecuteAsync();
            MessageBox.Show("Termin wurde erfolgreich hinzugefügt!", "Erfolg", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }



        private UserCredential GetCredential()
        {
            using (var stream = new FileStream(@"F:\StagOrg\VS\res format\json\client_secret.json", FileMode.Open, FileAccess.Read))
            {
                string credPath = "token.json";
                return GoogleWebAuthorizationBroker.AuthorizeAsync(
                    GoogleClientSecrets.FromStream(stream).Secrets,
                    new[] { CalendarService.Scope.Calendar },
                    "user",
                    CancellationToken.None,
                    new FileDataStore(credPath, true)).Result;
            }
        }
    }
}
