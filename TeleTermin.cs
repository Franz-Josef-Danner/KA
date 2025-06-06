using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Calendar.v3;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace res_format
{
    public partial class TeleTermin : Form
    {
        private Bearbeiten _bearbeitenForm;

        public TeleTermin()
        {
            InitializeComponent();

        }

        // anrufzeitbox automatisch zu HH:MM formatieren
        private void AnrufZeitBox_TextChanged(object sender, EventArgs e)
        {
            if (AnrufZeitBox.Text.Length == 2 && AnrufZeitBox.Text[1] != ':')
            {
                AnrufZeitBox.Text += ":";
                AnrufZeitBox.SelectionStart = AnrufZeitBox.Text.Length;
            }
        }
        

        private void AnrufOkButton_Click(object sender, EventArgs e)
        {
            // AnrufZeitBox und TerminPicker in AnrufTerminBox schreiben
            AnrufTerminBox.Text = TerminPicker.Value.ToString("dd.MM.yyyy") + " / " + AnrufZeitBox.Text;
            // Termin in ArufTerminBox in den Google Kalender hinzufügen
            DateTime startDate = TerminPicker.Value.Date;
            string time = AnrufZeitBox.Text;
            if (!string.IsNullOrEmpty(time) && time.Length == 5 && time[2] == ':')
            {
                if (DateTime.TryParse(time, out DateTime timeValue))
                {
                    startDate = startDate.AddHours(timeValue.Hour).AddMinutes(timeValue.Minute);
                }
            }
            _ = AddEventToGoogleCalendarAsync("Anruf bei " + FirmaBox.Text, startDate, startDate.AddHours(1));
        }

        private async Task AddEventToGoogleCalendarAsync(string summary, DateTime startDate, DateTime endDate)
        {
            if (summary is null)
            {
                throw new ArgumentNullException(nameof(summary));
            }
            // strings erstellen
            string firma = FirmaBox.Text;
            string Kommentar = KommentarBox.Text;
            string telefon = TelefonBox.Text;

            UserCredential credential = GetCredential();
            CalendarService service = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "Stagedive Organisation"
            });

            Event newEvent = new Event
            {
                Summary = "Anruf bei " + firma,
                Description = $"Telefon: {telefon}\nKommentar: {Kommentar}",
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
