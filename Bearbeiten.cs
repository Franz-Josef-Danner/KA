// Bearbeiten Form
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Calendar.v3;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using static res_format.Liste;
using System.Collections.Generic;
using System.Net.Mail;
using System.Net;
using SysDT = System.DateTime;
using System.Text;

namespace res_format
{
    public partial class Bearbeiten : Form
    {

        private System.Windows.Forms.Button mapsButton, mailButton;
        public event EventHandler DataSaved;
        // Singleton-Instanz des Formulars
        private static Bearbeiten instance;
        private List<SchauRowData> schauList;
        private List<StueckeRowData> StueckList;
        private readonly Dictionary<string, List<BesetzungData>> BesetzungenNachDatum = new Dictionary<string, List<BesetzungData>>();
        private bool isOperationInProgress = false;


        public Bearbeiten(List<SchauRowData> schauData)
        {
            InitializeComponent();

            AcceptButton = OkButton;
            ZeitBox.Leave += ZeitBox_Leave;
            // mit dem escape button wird das Formular geschlossen
            CancelButton = Abbrechen;
            // alle button deselectieren
            schauList = schauData;
            LoadJsonFilesIntoComboBox();  // Call this method on form load
            this.BesetzungSuche.SelectedIndexChanged += new System.EventHandler(this.TabbelnCombo_SelectedIndexChanged);
            BesetzungSuche.SelectedIndexChanged += new System.EventHandler(this.TabbelnCombo_SelectedIndexChanged);
            this.StartPosition = FormStartPosition.CenterScreen;
            LoadStueckeInComboBox();
            OkButton.Click += new EventHandler(OkButton_Click);
        }

        public Bearbeiten()
        {
        }

        private void LoadStueckeInComboBox()
        {
            // Laden der stücke in die Combobox
            StueckList = new List<StueckeRowData>();
            string jsonPfad = @"F:\StagOrg\VS\res format\json\res_format_Stueckedata.json";
            if (File.Exists(jsonPfad))
            {
                string jsonData = File.ReadAllText(jsonPfad);
                StueckList = JsonConvert.DeserializeObject<List<StueckeRowData>>(jsonData);
                foreach (var stueck in StueckList)
                {
                    OrgStuecke.Items.Add(stueck.StueckeName);
                }
            }
            
        }

        private void UpdateInfoLabel(string text)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<string>(UpdateInfoLabel), new object[] { text });
            }
            else
            {
                InfoLabel.Text = text;
            }
        }



        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            // Verhindern, dass das Formular geschlossen wird, wenn eine Operation im Gange ist
            if (isOperationInProgress)
            {
                e.Cancel = true;
                // Console öffnen und den Benutzer informieren
                MessageBox.Show("Bitte warten Sie, bis die aktuelle Operation abgeschlossen ist.", "Operation im Gange", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            else
            {
                base.OnFormClosing(e);
            }
        }

        // Singleton-Instanz des Formulars
        public static Bearbeiten Instance
        {
            // Singleton-Instanz des Formulars
            get
            {
                // Wenn die Instanz noch nicht erstellt wurde oder bereits geschlossen ist, wird eine neue Instanz erstellt
                if (instance == null || instance.IsDisposed)
                {
                    // Neue Instanz erstellen
                    instance = new Bearbeiten();
                    instance = new Bearbeiten(new List<SchauRowData>());

                }
                return instance;
            }
        }

        private void ZeitBox_TextChanged(object sender, EventArgs e)
        {
            if (ZeitBox.Text.Length == 2)
            {
                ZeitBox.Text += ":";
                ZeitBox.SelectionStart = ZeitBox.Text.Length;
            }

            System.DateTime startDate = TerminPicker.Value.Date;
            string time = ZeitBox.Text;
            if (!string.IsNullOrEmpty(time) && time.Length == 5 && time[2] == ':')
            {
                if (System.DateTime.TryParse(time, out System.DateTime timeValue))
                {
                    startDate = startDate.AddHours(timeValue.Hour).AddMinutes(timeValue.Minute);
                }

            }
            // Setzen des Terminfeldes
            TerminBox.Text = startDate.ToString("dd.MM.yyyy / HH:mm");
        }

        private void ZeitBox_Leave(object sender, EventArgs e)
        {
            FormatZeitBox();
        }

        private void FormatZeitBox()
        {
            if (ZeitBox.Text.Length == 1)
            {
                ZeitBox.Text = "0" + ZeitBox.Text + ":00";
            }
            else if (ZeitBox.Text.Length == 2)
            {
                ZeitBox.Text += ":00";
            }
            else if (ZeitBox.Text.Length == 3)
            {
                ZeitBox.Text = "0" + ZeitBox.Text;
            }
            else if (ZeitBox.Text.Length == 4)
            {
                ZeitBox.Text += "0";
            }
        }




        private void OffenCheckbox_CheckedChanged(object sender, EventArgs e)
        {
            if (OffenCheckbox.Checked)
            {
                ErsteMailCheckbox.Checked = false;
                ErstGespraechCheckbox.Checked = false;
                BuehneCheckbox.Checked = false;
                NeinCheckbox.Checked = false;
                ZunaheCheckbox.Checked = false;
                UnterGruppe.Enabled = true;
                ErstGruppe.Enabled = false;
                OrgGroup.Enabled = false;
            }


        }

        private void ErstGespraechCheckbox_CheckedChanged(object sender, EventArgs e)
        {
            if (ErstGespraechCheckbox.Checked)
            {
                OffenCheckbox.Checked = false;
                ErsteMailCheckbox.Checked = false;
                BuehneCheckbox.Checked = false;
                NeinCheckbox.Checked = false;
                ZunaheCheckbox.Checked = false;
                UnterGruppe.Enabled = true;
                ErstGruppe.Enabled = true;
                OrgGroup.Enabled = false;
            }

        }

        private void BuehneCheckbox_CheckedChanged(object sender, EventArgs e)
        {
            if (BuehneCheckbox.Checked)
            {
                OffenCheckbox.Checked = false;
                ErsteMailCheckbox.Checked = false;
                ErstGespraechCheckbox.Checked = false;
                NeinCheckbox.Checked = false;
                ZunaheCheckbox.Checked = false;
                UnterGruppe.Enabled = true;
                ErstGruppe.Enabled = false;
                OrgGroup.Enabled = true;
            }

        }

        private void NeinCheckbox_CheckedChanged(object sender, EventArgs e)
        {
            if (NeinCheckbox.Checked)
            {
                OffenCheckbox.Checked = false;
                ErsteMailCheckbox.Checked = false;
                ErstGespraechCheckbox.Checked = false;
                BuehneCheckbox.Checked = false;
                ZunaheCheckbox.Checked = false;
                UnterGruppe.Enabled = false;
                ErstGruppe.Enabled = false;
                OrgGroup.Enabled = false;
            }

        }

        private void ZunaheCheckbox_CheckedChanged(object sender, EventArgs e)
        {
            if (ZunaheCheckbox.Checked)
            {
                OffenCheckbox.Checked = false;
                ErsteMailCheckbox.Checked = false;
                ErstGespraechCheckbox.Checked = false;
                BuehneCheckbox.Checked = false;
                NeinCheckbox.Checked = false;
                UnterGruppe.Enabled = true;
                ErstGruppe.Enabled = false;
                OrgGroup.Enabled = false;
            }

        }

        private void ErsteMailCheckbox_CheckedChanged(object sender, EventArgs e)
        {
            if (ErsteMailCheckbox.Checked)
            {
                OffenCheckbox.Checked = false;
                ErstGespraechCheckbox.Checked = false;
                BuehneCheckbox.Checked = false;
                NeinCheckbox.Checked = false;
                ZunaheCheckbox.Checked = false;
                UnterGruppe.Enabled = true;
                ErstGruppe.Enabled = false;
                OrgGroup.Enabled = false;
                sendenButton.Visible = true;
            }
            
        }

        private void KommentarBox_TextChanged(object sender, EventArgs e)
        {

        }

        private void AbbrechenButton_Click(object sender, EventArgs e)
        {
            DialogResult = DialogResult.Cancel;

        }

        
        public void OkButton_Click(object sender, EventArgs e)
        {
            // Hier können zusätzliche Aktionen definiert werden
            DataSaved?.Invoke(this, EventArgs.Empty);
            
            this.DialogResult = DialogResult.OK;
            
            this.Close();  
        }

        public class BesetzungData
        {
            public string Rollen { get; set; }
            public string Besetzt { get; set; }
            public string Schauspieler { get; set; }
            public string Email { get; set; }
            public string Warten { get; set; }
            public string Ja { get; set; }
            public string Auto { get; set; }
            public string Mitfahrer { get; set; }
            public string Abendregie { get; set; }

        }

        private async void MapsButton_Click(object sender, EventArgs e)
        {
            string firma = FirmaBox.Text;
            string adresse = AdresseBox.Text;

            if (string.IsNullOrWhiteSpace(firma) || string.IsNullOrWhiteSpace(adresse))
            {
                _ = MessageBox.Show("Firma und Adresse müssen ausgefüllt sein.", "Eingabefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string query = Uri.EscapeDataString(firma + " " + adresse);
            string url = $"https://www.google.com/maps/search/?api=1&query={query}";




            try
            {
                // Versuchen, die URL im Standardbrowser zu öffnen
                _ = System.Diagnostics.Process.Start(url);
                await RetrieveLocationDetails(adresse);
                await CalculateTravelTime(adresse, "Meinhartsdorfer Gasse 3, 1150 Wien");

            }
            catch (Exception ex)
            {
                _ = MessageBox.Show("Fehler beim Öffnen von Google Maps: " + ex.Message, "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task CalculateTravelTime(string origin, string destination)
        {
            string apiKey = "AIzaSyC82aoSWfXJwJOqJgSCMt8V4CQcn31VE_4";
            string requestUri = $"https://maps.googleapis.com/maps/api/directions/json?origin={Uri.EscapeDataString(origin)}&destination={Uri.EscapeDataString(destination)}&key={apiKey}";

            using (HttpClient client = new HttpClient())
            {
                HttpResponseMessage response = await client.GetAsync(requestUri);
                if (response.IsSuccessStatusCode)
                {
                    string content = await response.Content.ReadAsStringAsync();
                    var directionsResponse = JsonConvert.DeserializeObject<DirectionsResponse>(content);

                    if (directionsResponse.Status == "OK")
                    {
                        string duration = directionsResponse.Routes[0].Legs[0].Duration.Text;
                        if (duration.Contains(" hour") || duration.Contains(" hours"))
                        {
                            string[] parts = duration.Split(' ');
                            int hours = int.Parse(parts[0]);
                            int minutes = int.Parse(parts[2]);
                            int totalMinutes = hours * 60 + minutes;
                            totalMinutes = (int)(totalMinutes * 1.25);
                            // 

                            hours = totalMinutes / 60;
                            minutes = totalMinutes % 60;
                            FahrzeitBox.Text = $"{hours:D2}:{minutes:D2}";
                        }
                        else if (duration.Contains(" min"))
                        {
                            string[] parts = duration.Split(' ');
                            int minutes = int.Parse(parts[0]);
                            minutes = (int)(minutes * 1.25);
                            FahrzeitBox.Text = $"00:{minutes:D2}";
                        }
                    }
                    else
                    {
                        MessageBox.Show("Fahrzeitberechnung fehlgeschlagen: " + directionsResponse.Status);
                    }
                }
                else
                {
                    MessageBox.Show("Fehler beim Abrufen der Fahrtdauer.");
                }
            }
        }

        public class DirectionsResponse
        {
            public string Status { get; set; }
            public Route[] Routes { get; set; }
        }

        public class Route
        {
            public Leg[] Legs { get; set; }
        }

        public class Leg
        {
            public Duration Duration { get; set; }
        }

        public class Duration
        {
            public string Text { get; set; }
        }

        private async void TerminFixierenButton_Click(object sender, EventArgs e)
        {
            // mit dem klicken des Buttons wird das Datum des Terminpickers und die Zeit aus dem Zeitfeld in das Terminfeld geschrieben und der Termin in den Kalender eingetragen
            System.DateTime startDate = TerminPicker.Value.Date;
            string time = ZeitBox.Text;
            if (!string.IsNullOrEmpty(time) && time.Length == 5 && time[2] == ':')
            {
                if (System.DateTime.TryParse(time, out System.DateTime timeValue))
                {
                    startDate = startDate.AddHours(timeValue.Hour).AddMinutes(timeValue.Minute);
                }
            }
            await AdderstgespraeToGoogleCalendarAsync("Erstgespräch mit " + FirmaBox.Text, startDate, startDate.AddHours(1));
            // Setzen des Terminfeldes
            KommentarBox.Text = "Erstgespräch mit " + FirmaBox.Text + " am " + startDate.ToString("dd.MM.yyyy") + " um " + startDate.ToString("HH:mm") + " Uhr.";
        }

        private async Task AdderstgespraeToGoogleCalendarAsync(string summary, System.DateTime startDate, System.DateTime endDate)
        {
            if (summary is null)
            {
                throw new ArgumentNullException(nameof(summary));
            }
            // strings erstellen
            string firma = FirmaBox.Text;
            string adresse = AdresseBox.Text;
            string kommentar = KommentarBox.Text;
            string inhaber = InhaberBox.Text;
            string telefon = TelefonBox.Text;

            UserCredential credential = GetCredential();
            CalendarService service = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "Stagedive Organisation"
            });

            Google.Apis.Calendar.v3.Data.Event newEvent = new Google.Apis.Calendar.v3.Data.Event
            {
                Summary = "Erstgespräch mit " + firma,
                Description = $"Telefon: {telefon}\nKommentar: {kommentar}\nInhaber: {inhaber}",
                Location = adresse,
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

        private string EnsureEndsWithPeriod(string input)
        {
            return !string.IsNullOrEmpty(input) && !input.EndsWith(".") ? input + "." : input;
        }


        private async Task RetrieveLocationDetails(string address)
        {
            string apiKey = "AIzaSyC82aoSWfXJwJOqJgSCMt8V4CQcn31VE_4";
            string requestUri = $"https://maps.googleapis.com/maps/api/geocode/json?address={Uri.EscapeDataString(address)}&key={apiKey}&language=de";

            using (HttpClient client = new HttpClient())
            {
                HttpResponseMessage response = await client.GetAsync(requestUri);
                if (response.IsSuccessStatusCode)
                {
                    string content = await response.Content.ReadAsStringAsync();
                    GeocodeResponse locationResult = JsonConvert.DeserializeObject<GeocodeResponse>(content);

                    if (locationResult.Status == "OK" && locationResult.Results.Any())
                    {
                        GeocodeResult result = locationResult.Results[0];
                        AddressComponent countryComponent = result.Address_Components.FirstOrDefault(ac => ac.Types.Contains("country"));
                        AddressComponent areaComponent = result.Address_Components.FirstOrDefault(ac => ac.Types.Contains("administrative_area_level_1"));
                        AddressComponent subAreaComponent = result.Address_Components.FirstOrDefault(ac => ac.Types.Contains("administrative_area_level_2"));
                        AddressComponent cityComponent = result.Address_Components.FirstOrDefault(ac => ac.Types.Contains("locality"));

                        // Setzen der Textfelder mit sicherem Punkt am Ende
                        LandBox.Text = EnsureEndsWithPeriod(countryComponent?.Long_Name);
                        BundeslandBox.Text = EnsureEndsWithPeriod(areaComponent?.Long_Name);
                        BezirkBox.Text = EnsureEndsWithPeriod(subAreaComponent?.Long_Name);
                        OrtBox.Text = EnsureEndsWithPeriod(cityComponent?.Long_Name);
                    }
                    else
                    {
                        _ = MessageBox.Show("Geocoding failed: " + locationResult.Status);
                    }
                }
            }
        }




        private void MailButton_Click(object sender, EventArgs e)
        {
            // Email öffnen mit Mailadresse aus dem Emailfeld
            using (Email Email = new Email())
            {
                Email.EmailBox.Text = EmailBox.Text;
                if (Email.ShowDialog() == DialogResult.OK)
                {
                    // Handhaben der Bestätigung hier
                }
            }
        }

        private void TeleterminButton_Click(object sender, EventArgs e)
        {
            // TeleTermin öffnen mit Telefonnummer aus dem Telefonfeld und Firmennamen aus dem Firmenfeld
            using (TeleTermin TeleTermin = new TeleTermin())
            {
                TeleTermin.TelefonBox.Text = TelefonBox.Text;
                TeleTermin.FirmaBox.Text = FirmaBox.Text;
                if (TeleTermin.ShowDialog() == DialogResult.OK)
                {
                    string kom = TeleTermin.KommentarBox.Text;
                    string datum = TeleTermin.TerminPicker.Value.ToString("dd.MM.yyyy");
                    string uhrzeit = TeleTermin.AnrufZeitBox.Text;
                    KommentarBox.Text += "Anruf Termin am " + datum + " um " + uhrzeit + " Uhr, " + kom + Environment.NewLine;
                }
            }
        }

        public class GeocodeResponse
        {
            public string Status { get; set; }
            public GeocodeResult[] Results { get; set; }
        }

        public class GeocodeResult
        {
            public AddressComponent[] Address_Components { get; set; }
            public Geometry Geometry { get; set; }
            public string Formatted_Address { get; set; }
            public string Place_Id { get; set; }
            public string[] Types { get; set; }
        }

        private void TerminPicker_ValueChanged(object sender, EventArgs e)
        {

        }

        public class AddressComponent
        {
            public string Long_Name { get; set; }
            public string Short_Name { get; set; }
            public string[] Types { get; set; }
        }

        public class Geometry
        {
            public Location Location { get; set; }
            public string Location_Type { get; set; }
            public Bounds Viewport { get; set; }
            public Bounds Bounds { get; set; }
        }

        public new class Location
        {
            public double Lat { get; set; }
            public double Lng { get; set; }
        }

        private void Stern1_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = false;
            Stern3.Visible = false;
            Stern4.Visible = false;
            Stern5.Visible = false;
            S1.Checked = true;
            S2.Checked = false;
            S3.Checked = false;
            S4.Checked = false;
            S5.Checked = false;
        }

        private void Stern2_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            Stern3.Visible = false;
            Stern4.Visible = false;
            Stern5.Visible = false;
            S1.Checked = true;
            S2.Checked = true;
            S3.Checked = false;
            S4.Checked = false;
            S5.Checked = false;
        }

        private void Stern3_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            Stern3.Visible = true;
            Stern4.Visible = false;
            Stern5.Visible = false;
            S1.Checked = true;
            S2.Checked = true;
            S3.Checked = true;
            S4.Checked = false;
            S5.Checked = false;
        }

        private void Stern4_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            Stern3.Visible = true;
            Stern4.Visible = true;
            Stern5.Visible = false;
            S1.Checked = true;
            S2.Checked = true;
            S3.Checked = true;
            S4.Checked = true;
            S5.Checked = false;
        }

        private void Stern5_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            Stern3.Visible = true;
            Stern4.Visible = true;
            Stern5.Visible = true;
            S1.Checked = true;
            S2.Checked = true;
            S3.Checked = true;
            S4.Checked = true;
            S5.Checked = true;
        }

        private void PictureBox9_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            S1.Checked = true;
        }

        private void PictureBox2_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            S1.Checked = true;
            S2.Checked = true;
        }

        private void PictureBox4_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            Stern3.Visible = true;
            S1.Checked = true;
            S2.Checked = true;
            S3.Checked = true;
        }

        private void PictureBox6_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            Stern3.Visible = true;
            Stern4.Visible = true;
            S1.Checked = true;
            S2.Checked = true;
            S3.Checked = true;
            S4.Checked = true;
        }

        private void PictureBox8_Click(object sender, EventArgs e)
        {
            Stern1.Visible = true;
            Stern2.Visible = true;
            Stern3.Visible = true;
            Stern4.Visible = true;
            Stern5.Visible = true;
            S1.Checked = true;
            S2.Checked = true;
            S3.Checked = true;
            S4.Checked = true;
            S5.Checked = true;
        }



        public new class Bounds
        {
            public Location Northeast { get; set; }
            public Location Southwest { get; set; }
        }


        



        private void OrgStuecke_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (OrgStuecke.SelectedIndex == -1)
                return;

            string selectedStueck = OrgStuecke.SelectedItem.ToString();
            LoadActorsForSelectedStueck(selectedStueck);
        }

        private void LoadActorsForSelectedStueck(string stueckName)
        {
            var actors = new List<string>();

            foreach (var schau in schauList)
            {
                if (schau.SchauRollen.Contains($"[{stueckName}]"))
                {
                    int start = schau.SchauRollen.IndexOf($"[{stueckName}]") + stueckName.Length + 2;
                    int end = schau.SchauRollen.IndexOf(']', start);
                    if (end == -1) end = schau.SchauRollen.Length;
                    string rolesString = schau.SchauRollen.Substring(start, end - start);

                    actors.AddRange(rolesString.Split(new[] { ", " }, StringSplitOptions.RemoveEmptyEntries).Select(role => schau.Schauspieler));
                    // die spalte Abendrgie wird nicht berücksichtigt
                }
            }

            UpdateCastingDataGridView(actors.Distinct().ToList());
        }

        private void OrgUhrzeit_TextChanged(object sender, EventArgs e)
        {
            // nimmt nur Uhrzeiten im Format HH:mm an
            if (OrgUhrzeit.Text.Length == 2)
            {
                OrgUhrzeit.Text += ":";
                OrgUhrzeit.SelectionStart = OrgUhrzeit.Text.Length;
            }
            // keine Buchstaben annehmen
            if (OrgUhrzeit.Text.Any(c => !char.IsDigit(c) && c != ':'))
            {
                OrgUhrzeit.Text = string.Concat(OrgUhrzeit.Text.Where(char.IsDigit));
            }
            // nur 5 Zeichen annehmen
            if (OrgUhrzeit.Text.Length > 5)
            {
                OrgUhrzeit.Text = OrgUhrzeit.Text.Substring(0, 5);
            }

        }



        private void UpdateCastingDataGridView(List<string> actors)
        {
            Casting.Rows.Clear();

            foreach (string actor in actors)
            {
                Casting.Rows.Add(actor);
            }
        }



        private void OrgSpielButton_Click(object sender, EventArgs e)
        {
            // Überprüfen, ob alle Rollen besetzt sind
            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                if (row.Cells["BesetztColumn"].Value == null || !Convert.ToBoolean(row.Cells["BesetztColumn"].Value))
                {
                    MessageBox.Show("Bitte besetzen Sie alle Rollen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
            }

            string stueckeDataPath = @"F:\StagOrg\VS\res format\json\res_format_Stueckedata.json";

            // JSON-Daten aus der Datei laden
            if (!File.Exists(stueckeDataPath))
            {
                MessageBox.Show("Die JSON-Datei wurde nicht gefunden.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string jsonData = File.ReadAllText(stueckeDataPath);
            var stueckeData = JsonConvert.DeserializeObject<List<Vorsch.StueckeRowData>>(jsonData);

            if (stueckeData == null)
            {
                MessageBox.Show("Die JSON-Daten konnten nicht geladen werden.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string selectedStueckeName = null;

            // Durchsuche BesetzungDataGrid nach Rollen und finde das entsprechende Stück
            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                string rollenName = row.Cells["RollenColumn"].Value.ToString();

                foreach (var stueck in stueckeData)
                {
                    if (stueck.Rollen.Contains(rollenName))
                    {
                        selectedStueckeName = stueck.StueckeName;
                        break;
                    }
                }

                if (selectedStueckeName != null)
                    break;
            }

            if (selectedStueckeName == null)
            {
                MessageBox.Show("Kein passendes Stück gefunden.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }
            // extrahieren aller schauspieler die abendregie und Besetzt auf true gesetzt haben
            List<string> Abendreg = new List<string>();
            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                // sichergehen das spalte Abendregie und Ja mit true besetzt sind
                if (row.Cells["AbendregieColumn"].Value != null && Convert.ToBoolean(row.Cells["AbendregieColumn"].Value) && row.Cells["JaColumn"].Value != null && Convert.ToBoolean(row.Cells["JaColumn"].Value))
                {
                    Abendreg.Add(row.Cells["SchauspielerColumn"].Value.ToString());
                }
            }
            // Öffne das Vorst-Formular und setze den Text
            Vorsch vorstForm = new Vorsch();
            vorstForm.SetStueckBoxText(selectedStueckeName);

            // Laden Sie die Stücke-Namen in die ListBox des Vorst-Formulars
            vorstForm.LoadStueckeNamen(stueckeData);

            // auswahl in BesetzungSuche in string umwandeln
            string selectedDate = BesetzungSuche.SelectedItem.ToString();
            vorstForm.AuswahlBox.Text = selectedDate;
            // Firmenbox und adressebox in string umwandeln
            string lokation = FirmaBox.Text + "; " + AdresseBox.Text;
            vorstForm.LokationBox.Text = lokation;

            // laden der Abendreg in die auswahl der RegieBox des Vorst-Formulars
            vorstForm.RegieBox.Items.AddRange(Abendreg.ToArray());

            vorstForm.ShowDialog();
            Close();
        }




        // Definition der StueckData Klasse entsprechend der JSON-Struktur
        public class StueckData
        {
            public string StueckeName { get; set; }
            public string Beschreibung { get; set; }
            public string FigCount { get; set; }
            public string Rollen { get; set; }
            public string RollenBesch { get; set; }
        }





        private void UpdateProgressBar(int progress)
        {
            if (this.InvokeRequired)
            {
                this.Invoke(new Action<int>(UpdateProgressBar), new object[] { progress });
            }
            else
            {
                ProgressBar.Value = progress;
            }
        }

        

        // Notiz: Abdate Balken und Ladebalken einfügen
        async private void OrgPlanButton_Click(object sender, EventArgs e)
        {
            int totalSteps = Casting.SelectedRows.Count * 3 + 4; // Number of steps
            int currentStep = 0;

            EnableControls(false);
            ProgressBar.Visible = true;
            ProgressBar.Minimum = 0;
            ProgressBar.Maximum = totalSteps;
            ProgressBar.Value = 0;

            try
            {
                isOperationInProgress = true;
                this.ControlBox = false;

                if (OrgStuecke.SelectedIndex == -1)
                {
                    MessageBox.Show("Bitte wählen Sie ein Stück aus.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                if (string.IsNullOrWhiteSpace(OrgUhrzeit.Text))
                {
                    MessageBox.Show("Bitte geben Sie eine Uhrzeit ein.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                if (!SysDT.TryParse(OrgUhrzeit.Text, out SysDT timeValue))  // Parse once
                {
                    MessageBox.Show("Bitte geben Sie eine gültige Uhrzeit im Format HH:mm ein.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                if (OrgDatum.Value.Date < SysDT.Today)
                {
                    MessageBox.Show("Bitte geben Sie ein Datum in der Zukunft ein.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                if (Casting.Rows.Count == 0)
                {
                    MessageBox.Show("Bitte fügen Sie Schauspieler hinzu.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                if (Casting.SelectedRows.Count == 1)
                {
                    MessageBox.Show("Bitte wählen Sie mindestens zwei Schauspieler aus.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
                // Berechnung der Abfahrtszeit
                if (TimeSpan.TryParse(FahrzeitBox.Text, out TimeSpan travelTime))
                {
                    SysDT departureTime = OrgDatum.Value.Date.Add(timeValue.TimeOfDay).Subtract(travelTime);
                    Abfahrt.Text = departureTime.ToString("HH:mm");
                }
                else
                {
                    MessageBox.Show("Bitte geben Sie eine gültige Fahrzeit im Format HH:mm:ss ein.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
                // prüfen on in Firmabox ein Eintrag ist
                if (string.IsNullOrWhiteSpace(FirmaBox.Text))
                {
                    MessageBox.Show("Bitte geben Sie einen Firmennamen ein.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                UpdateInfoLabel("Erstellen des Dateinamens...");

                // Erstellen des Dateinamens
                string datumAlsString = OrgDatum.Value.ToString("dd.MM.yyyy").Replace(".", "-") + "_" + this.OrgUhrzeit.Text.Replace(":", "-");

                BesetzungDataGrid.Rows.Clear();

                // Wenn das Datum noch nicht in der Liste enthalten ist, wird es hinzugefügt
                if (!BesetzungenNachDatum.ContainsKey(datumAlsString))
                {
                    BesetzungenNachDatum.Add(datumAlsString, new List<BesetzungData>());
                    BesetzungSuche.Items.Add(datumAlsString);
                    BesetzungSuche.SelectedItem = datumAlsString; // Wählt das neu hinzugefügte Datum aus
                }

                UpdateInfoLabel("Übertragen der Schauspieler aus Casting in BesetzungDataGrid...");
                // suchen aller Schauspieler in SchauDataGrid die SchauAbendregie auf true gesetzt haben
                string abre = "";
                foreach (SchauRowData schauRow in schauList)
                {
                    if (schauRow.SchauAbendregie == "True")
                    {
                        abre += string.Join(",", schauRow.Schauspieler) + ",";
                    }
                }

                // Übertragen der Schauspieler aus Casting in BesetzungDataGrid
                foreach (DataGridViewRow selectedRow in Casting.SelectedRows)
                {
                    string actorName = selectedRow.Cells["OrgSchauColumn"].Value.ToString();

                    abre = abre.Replace(actorName + ",", "");

                    int rowIndex = BesetzungDataGrid.Rows.Add();
                    BesetzungDataGrid.Rows[rowIndex].Cells["SchauspielerColumn"].Value = actorName;
                }

                // Entferne das letzte Komma und erzeuge eine Liste der verbleibenden Schauspieler
                abre = abre.TrimEnd(',');
                List<string> remainingActors = new List<string>(abre.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries));

                // Füge die verbleibenden Schauspieler in das BesetzungDataGrid hinzu
                foreach (string actor in remainingActors)
                {
                    int rowIndex = BesetzungDataGrid.Rows.Add();
                    BesetzungDataGrid.Rows[rowIndex].Cells["SchauspielerColumn"].Value = actor;
                }

                UpdateInfoLabel("suchen der Schauspieler in SchauDataGrid und übertragen der Mailadresse nach BesetzungDataGrid...");

                // suchen der Schauspieler in SchauDataGrid und übertragen der Mailadresse nach BesetzungDataGrid
                foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
                {
                    string actorName = row.Cells["SchauspielerColumn"].Value.ToString();
                    foreach (SchauRowData schauRow in schauList)
                    {
                        if (schauRow.Schauspieler == actorName)
                        {
                            row.Cells["EmailColumn"].Value = schauRow.SchauEmail;
                        }
                    }
                }

                UpdateInfoLabel("Extrahieren der Schauspieler...");

                if (currentStep < ProgressBar.Maximum)
                {
                    ProgressBar.Value = ++currentStep;
                }
                // Extrahieren der Schauspieler in der Besetzung und in Schauliste suchen und dann die rollen aus dieser Zeile in Besetzung eintragen
                foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
                {
                    string actorName = row.Cells["SchauspielerColumn"].Value.ToString();
                    foreach (SchauRowData schauRow in schauList)
                    {
                        if (schauRow.Schauspieler == actorName)
                        {
                            // Wenn Schauspieler mit SchauRow Schauspieler übereinstimmt, dann die Rollen in die Besetzung eintragen
                            row.Cells["RollenColumn"].Value = schauRow.SchauRollen;
                            // durchsuchen der Rollen in Besetzung Rollen Row und nach dem Stück in OrgStuecke suchen, dieses stück mit den Rollen bleibt, der Rest wird gelöscht
                            string[] roles = schauRow.SchauRollen.Split(new[] { ", " }, StringSplitOptions.RemoveEmptyEntries);
                            string stueckName = OrgStuecke.SelectedItem.ToString();
                            string newRoles = string.Join(", ", roles.Where(role => role.Contains($"[{stueckName}]")));
                            row.Cells["RollenColumn"].Value = newRoles;
                            // Den Inhalt in den eckklammern entfernen
                            row.Cells["RollenColumn"].Value = newRoles.Replace($"[{stueckName}]", "").Trim();
                            // wer keine Rolle hat, bekommt anstelle "Abendregie" in die Rolle geschrieben
                            if (string.IsNullOrWhiteSpace(row.Cells["RollenColumn"].Value.ToString()))
                            {
                                row.Cells["RollenColumn"].Value = "Abendregie";
                            }
                        }
                    }
                }
                // Setzen der Warten Spalte auf "Ja" für alle Schauspieler
                foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
                {
                    row.Cells["WartenColumn"].Value = true;
                }
                // setzen der AbendregieColumn spalte auf "Ja" für alle Schauspieler die in der SchauDataGrid in der Spalte SchauAbendregie auf true gesetzt haben
                foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
                {
                    string actorName = row.Cells["SchauspielerColumn"].Value.ToString();
                    foreach (SchauRowData schauRow in schauList)
                    {
                        if (schauRow.Schauspieler == actorName && schauRow.SchauAbendregie == "True")
                        {
                            row.Cells["AbendregieColumn"].Value = true;
                        }
                    }
                }
                
                // Create the file path
                string firma = FirmaBox.Text;
                string tabelle = BesetzungSuche.SelectedItem.ToString() + ".json";
                string directoryPath = $@"F:\StagOrg\VS\res format\json\Firmen\{firma}\Organ";
                // Create directory if it does not exist
                if (!Directory.Exists(directoryPath))
                {
                    Directory.CreateDirectory(directoryPath);
                }
                // Combine the directory path with the file name
                string filePath = Path.Combine(directoryPath, tabelle);
                // create the file if it does not exist
                if (!File.Exists(filePath))
                {
                    File.Create(filePath).Close();
                }
                // Fetching data from DataGridView
                var dataList = new List<BesetzungData>();

                // Fügt die aktuelle Besetzung in die Liste der Besetzungen für das ausgewählte Datum hinzu
                foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
                {
                    if (row.IsNewRow) continue;
                    var data = new BesetzungData()
                    {
                        Rollen = row.Cells["RollenColumn"].Value?.ToString(),
                        Besetzt = row.Cells["BesetztColumn"].Value?.ToString(),
                        Schauspieler = row.Cells["SchauspielerColumn"].Value?.ToString(),
                        Email = row.Cells["EmailColumn"].Value?.ToString(),
                        Warten = row.Cells["WartenColumn"].Value?.ToString(),
                        Ja = row.Cells["JaColumn"].Value?.ToString(),
                        Auto = row.Cells["AutoColumn"].Value?.ToString(),
                        Mitfahrer = row.Cells["MitfahrerColumn"].Value?.ToString(),
                        Abendregie = row.Cells["AbendregieColumn"].Value?.ToString()
                    };
                    dataList.Add(data);
                }

                // Serialize the data to JSON and write it to the file
                string json = JsonConvert.SerializeObject(dataList, Formatting.Indented);
                // Write the JSON to the file
                File.WriteAllText(filePath, json);

                string schau = "";
                string schauVor = "";
                string roll = "";
                foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
                {
                    // Schauspieler, Email und Rollen für die Verwendung in den Dateinamen extrahieren
                    string actorName = row.Cells["SchauspielerColumn"].Value.ToString();
                    string email = row.Cells["EmailColumn"].Value.ToString();
                    if (row.Cells["EmailColumn"].Value != null && row.Cells["EmailColumn"].Value.ToString() == email)
                    {
                        schau = row.Cells["SchauspielerColumn"].Value.ToString();
                        if (schau.Contains(" "))
                        {
                            schau = schau.Replace(" ", "-");


                        }
                        schauVor = row.Cells["SchauspielerColumn"].Value.ToString();
                        // schau bereinigen das nur der vorname übrig bleibt
                        if (schauVor.Contains(" "))
                        {
                            schauVor = schauVor.Insert(schauVor.IndexOf(" "), "-");


                        }
                        roll = row.Cells["RollenColumn"].Value.ToString();
                    }
                }

                string datum = OrgDatum.Text;
                string adresse = AdresseBox.Text;
                string fahrzeit = FahrzeitBox.Text;
                string orgUhrzeit = OrgUhrzeit.Text;
                string Rollen = roll.Replace(" ", "-");
                string phpfirma = firma.Replace(" ", "-");
                string Schauspieler = schau.Replace(" ", "_");

                await Task.Delay(3000);

                if (currentStep < ProgressBar.Maximum)
                {
                    ProgressBar.Value = ++currentStep;
                }
                // Clear the Casting DataGridView
                foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
                {
                    string actorName = row.Cells["SchauspielerColumn"].Value.ToString();
                    string email = row.Cells["EmailColumn"].Value.ToString();
                    // Erstellen Sie das HTML-Formular für jeden Schauspieler
                    string localPath = CreatephpForm(email, Abfahrt.Text);
                    if (currentStep < ProgressBar.Maximum)
                    {
                        ProgressBar.Value = ++currentStep;
                    }
                    await SpielSpeichern(email);
                    if (currentStep < ProgressBar.Maximum)
                    {
                        ProgressBar.Value = ++currentStep;
                    }
                    await SendHtmlEmail(email);
                    if (currentStep < ProgressBar.Maximum)
                    {
                        ProgressBar.Value = ++currentStep;
                    }
                }

                SavefortschrittJson();
                if (currentStep < ProgressBar.Maximum)
                {
                    ProgressBar.Value = ++currentStep;
                }
                await Task.Delay(3000); // Simuliert eine langwierige Operation


                if (currentStep < ProgressBar.Maximum)
                {
                    ProgressBar.Value = ++currentStep;
                }

                Casting.Rows.Clear();
                UpdateBesetzungDataGrid();
                EnableControls(false);
            }

            finally
            {
                Liste.Instance.UpdatePlanListeData();
                // Wiederaktivieren des Close-Buttons
                this.ControlBox = true;

                // Deaktivieren des Operation-Flags
                isOperationInProgress = false;
                // UI freigeben
                EnableControls(true);
            }
        }
        
        private void EnableControls(bool enable)
        {
            // Aktivieren oder Deaktivieren aller relevanten UI-Elemente
            foreach (Control ctrl in this.Controls)
            {
                ctrl.Enabled = enable;
            }
            InfoLabel.Enabled = true; // Das Lade-Label sollte immer aktivierbar bleiben
        }

        private async Task SendHtmlEmail(string toEmail)
        {
            EnableControls(false);
            UpdateInfoLabel("E-Mail-Versand vorbereitet...");

            string schau1 = "";
            string Schau = RemoveUmlautsAndSpecialCharacters(schau1);

            string SchauVor = "";
            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);

            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                if (row.Cells["EmailColumn"].Value != null && row.Cells["EmailColumn"].Value.ToString() == toEmail)
                {
                    Schau = row.Cells["SchauspielerColumn"].Value.ToString().Replace(" ", "-");
                    SchauVor = row.Cells["SchauspielerColumn"].Value.ToString();
                    // SchauVor bereinigen, damit nur der Vorname übrig bleibt
                    if (SchauVor.Contains(" "))
                    {
                        SchauVor = SchauVor.Substring(0, SchauVor.IndexOf(" "));
                    }
                }
            }
            UpdateInfoLabel("SendHtmlEmail an " + Schau + " wird vorbereitet...");

            await Task.Delay(300);
            string datumAlsString = BesetzungSuche.SelectedItem.ToString().Replace(":", "-").Replace(".", "-").Replace(" ", "_");
            string formUrl = $"http://stagedive.at/wp-content/uploads/Schauspieler/{datumAlsString}_{firma}_{Schau}_form.html"; // URL des Formulars
            string htmlBody = $@"
<html>
<body>
    <p>Hallo {SchauVor}</p><br><br>
    <p>Ein neuer Termin ist da, hast du vielleicht Zeit?: <a href='{formUrl}'>Feedback Formular</a></p><br><br><br>
    <p>An diese Mailadresse kann nicht geantwortet werden</p>
</body>
</html>";

            UpdateInfoLabel("HTML-E-Mail-Inhalt erstellt...");

            MailMessage mail = new MailMessage
            {
                From = new MailAddress("spielen@stagedive.at")
            };
            mail.To.Add(new MailAddress(toEmail));
            mail.Subject = "Bitte fülle das Feedback-Formular aus";
            mail.Body = htmlBody;
            mail.IsBodyHtml = true;

            UpdateInfoLabel("SMTP-Client konfiguriert...");

            SmtpClient smtp = new SmtpClient("smtp.world4you.com")
            {
                Port = 587,
                Credentials = new NetworkCredential("danner@stagedive.at", "92J4WGosyurRt"),
                EnableSsl = true
            };

            try
            {
                smtp.Send(mail);
                UpdateInfoLabel("E-Mail erfolgreich gesendet an " + Schau + "...");
                Console.WriteLine("Email sent successfully to " + Schau);
            }
            catch (Exception ex)
            {
                UpdateInfoLabel("Fehler beim Senden der E-Mail...");
                MessageBox.Show("Fehler beim Senden der E-Mail: " + ex.Message);
            }

            UpdateInfoLabel("Löschen lokaler Dateien...");

            // Wenn alle Daten hochgeladen wurden und die E-Mail versendet wurde, sollen alle Daten in F:\StagOrg\VS\res format\json\Schauspieler\ gelöscht werden
            string directoryPath = $@"F:\StagOrg\VS\res format\json\Schauspieler\";
            // Löschen der Dateien und nicht der Ordner

            foreach (string file in Directory.EnumerateFiles(directoryPath))
            {
                File.Delete(file);
            }

            UpdateInfoLabel("Lokale Dateien gelöscht, E-Mail-Versand abgeschlossen.");
        }



        public string CreatephpForm(string toEmail, string abfahrt)
        {
            string schau1 = "";
            string schau = RemoveUmlautsAndSpecialCharacters(schau1);
            string schauVor = "";
            string roll = "";

            UpdateInfoLabel("Starte Erstellung des PHP-Formulars...");

            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                if (row.Cells["EmailColumn"].Value != null && row.Cells["EmailColumn"].Value.ToString() == toEmail)
                {
                    schau = row.Cells["SchauspielerColumn"].Value.ToString();
                    if (schau.Contains(" "))
                    {
                        schau = schau.Replace(" ", "-");
                    }
                    UpdateInfoLabel("Bearbeite Schauspieler: " + schau + "...");

                    schauVor = row.Cells["SchauspielerColumn"].Value.ToString();
                    if (schauVor.Contains(" "))
                    {
                        schauVor = schauVor.Insert(schauVor.IndexOf(" "), "-");
                    }
                    roll = row.Cells["RollenColumn"].Value.ToString();
                }
            }

            UpdateInfoLabel("Sammle Daten für das Formular...");

            string datum = OrgDatum.Text;
            string stueckName = OrgStuecke.SelectedItem.ToString();
            string adresse = AdresseBox.Text;
            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);
            string orgUhrzeit = OrgUhrzeit.Text;
            string Rollen = roll.Replace(" ", "-");
            string phpfirma = firma.Replace(" ", "-");
            string Schauspieler = schau.Replace(" ", "_");
            string datumAlsString = BesetzungSuche.SelectedItem.ToString().Replace(":", "-").Replace(".", "-").Replace(" ", "_");
            string filephpname = $"{datumAlsString}_{firma}_{schau}_form.php";

            UpdateInfoLabel("Erstelle HTML-Inhalt...");

            string htmlContent = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Krimmi Anfrage Formular</title>
    <link href='https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap' rel='stylesheet'>
    <style>
        body {{
            font-family: 'Roboto', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
            padding-top: 25vh;
        }}
        form {{
            width: 80%;
            max-width: 600px;
        }}
        .hidden {{
            display: none;
        }}
    </style>
    <script>
    function toggleVisibility(checkbox, sectionId) {{
        var section = document.getElementById(sectionId);
        if (checkbox.checked) {{
            section.style.display = 'block';
        }} else {{
            section.style.display = 'none';
        }}
    }}

    function hideall()  
    {{
        // Verstecke alle relevanten Abschnitte
        document.getElementById('autoSection').style.display = 'none';
        document.getElementById('mitfahrerSection').style.display = 'none';
        document.getElementById('Anzahl').style.display = 'none';
        // Umschalten der Sichtbarkeit des 'senden' Abschnitts
        document.getElementById('senden').style.display = 'block';
        // Auswahl aufheben
        document.querySelector('input[name=""auto""]:checked').checked = false;
        document.querySelector('input[name=""Mitfahrer""]:checked').checked = false;
        document.querySelector('input[name=""anzahl""]:checked').checked = false;
    }}
    function hidetwo()
    {{
        // Verstecke alle relevanten Abschnitte
        document.getElementById('mitfahrerSection').style.display = 'none';
        document.getElementById('Anzahl').style.display = 'none';
        // Umschalten der Sichtbarkeit des 'senden' Abschnitts
        document.getElementById('senden').style.display = 'block';
        document.querySelector('input[name=""Mitfahrer""]:checked').checked = false;
        document.querySelector('input[name=""anzahl""]:checked').checked = false;
    }}
    function hideone()
    {{
        // Verstecke alle relevanten Abschnitte
        document.getElementById('Anzahl').style.display = 'none';
        // Umschalten der Sichtbarkeit des 'senden' Abschnitts
        document.getElementById('senden').style.display = 'block';
        document.querySelector('input[name=""anzahl""]:checked').checked = false;
    }}
    function showfirst() {{
        document.getElementById('autoSection').style.display = 'block';
        document.getElementById('senden').style.display = 'none';
    }}
    function showsecond() {{
        document.getElementById('mitfahrerSection').style.display = 'block';
        document.getElementById('senden').style.display = 'none';
    }}
    function showthird() {{
        document.getElementById('Anzahl').style.display = 'block';
        document.getElementById('senden').style.display = 'none';
    }}
    function showlast() {{
        document.getElementById('senden').style.display = 'block';
    }}

    function replaceSpacesAndSubmit()
    {{
        var inputs = document.querySelectorAll('input[type=""text""]');
        inputs.forEach(function(input) {{
            input.value = input.value.replace(/\s+/g, '-');
        }});
        document.forms[0].submit();
    }}
    </script>
</head>
<body>
    <form action='{filephpname}' method='post' onsubmit='event.preventDefault(); replaceSpacesAndSubmit();'>
        <h2>Krimmi Anfrage für {stueckName}</h2>
        <p>Hallo {schauVor},</p>
        <p>Hast du Zeit?</p>
        <p>Datum: {datum}<br>Spielbeginn: {orgUhrzeit}<br>Wo: {firma}, {adresse}<br>wir spielen {stueckName}.</p>
        <p>Abfahrt ist um ca. {abfahrt}</p>
        <label><input type='radio' name='teilnahme' value='true' onchange='showfirst()'> Ja</label>
        <label><input type='radio' name='teilnahme' value='false' onchange='hideall()'> Nein</label>
        <div id='autoSection' class='hidden section'>
            <p>Kannst du selbst mit dem Auto fahren?</p>
            <label><input type='radio' name='auto' value='true' onchange='showsecond()'> Ja</label>
            <label><input type='radio' name='auto' value='false' onchange='hidetwo()'> Nein</label>
        </div>
        <div id='mitfahrerSection' class='hidden section'>
            <p>Hast du noch Platz für Mitfahrer?</p>
            <label><input type='radio' name='Mitfahrer' value='true' onchange='showthird()'> Ja</label>
            <label><input type='radio' name='Mitfahrer' value='false' onchange='hideone()'> Nein</label>
        </div>
        <div id='Anzahl' class='hidden section'>
            <p>Wie Viele</p>
            <label><input type='radio' name='anzahl' value='1' onchange='showlast()'> 1</label>
            <label><input type='radio' name='anzahl' value='2' onchange='showlast()'> 2</label>
            <label><input type='radio' name='anzahl' value='3' onchange='showlast()'> 3</label>
            <label><input type='radio' name='anzahl' value='4' onchange='showlast()'> 4</label>
            <label><input type='radio' name='anzahl' value='5' onchange='showlast()'> 5</label>
        </div>
        <br><br>
        <div id='zusatz' class='hidden'>
            <input type='text' name='firma' value='{phpfirma}'>
            <input type='text' name='roll' value='{Rollen}'>
            <input type='text' name='schauname' value='{Schauspieler}'>
        </div>
        <div id='senden' class='hidden'>
            <input type='submit' value='Daten speichern' name='save'>
        </div>
    </form>
</body>
</html>
";

            UpdateInfoLabel("PHP-Formular erstellt für " + schau + "...");
            return htmlContent;
        }



        public void CreateAndSavePHP(string toEmail)
        {
            UpdateInfoLabel("Starte Erstellung der PHP-Dateien...");

            // extrahieren des Schauspielernamens anhand der E-Mail-Adresse
            string Schau1 = GetSchauspielerName(toEmail).Replace(" ", "-");

            string Schau = RemoveUmlautsAndSpecialCharacters(Schau1);


            UpdateInfoLabel("Extrahiere Schauspielername: " + Schau + "...");

            // Konsolenausgabe mit Bestätigung der Anfrage
            Console.WriteLine("Anfrage für " + Schau + " wurde erstellt.");

            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);


            // Das heutige Datum
            string datumAlsString = BesetzungSuche.SelectedItem.ToString().Replace(":", "-").Replace(".", "-").Replace(" ", "_");
            UpdateInfoLabel("Datum für Dateien: " + datumAlsString + "...");

            // Erstellen des Dateinamens
            string termine = $"{datumAlsString}_{firma}_{Schau}_termin.php";
            string Pathtermine = $@"F:\StagOrg\VS\res format\json\Schauspieler\{termine}";
            string Pathform = $@"F:\StagOrg\VS\res format\json\Schauspieler\{datumAlsString}_{firma}_{Schau}_form.php";
            string htmlContent = $"http://stagedive.at/wp-content/uploads/Schauspieler/{datumAlsString}_{firma}_{Schau}_form.html";
            string filehtmlname = $"{datumAlsString}_{firma}_{Schau}_form.html";
            string filefin = $"{datumAlsString}_{Schau}_form.json";

            UpdateInfoLabel("Erstelle Zeitstempel für Erinnerungen...");

            // Das heutige Datum
            System.DateTime now = System.DateTime.Now;
            System.DateTime datumAlsStringplus2 = now.AddMinutes(2);
            System.DateTime datumAlsStringplus4 = now.AddMinutes(4);
            System.DateTime datumAlsStringplus6 = now.AddMinutes(6);
            System.DateTime datumAlsStringplus8 = now.AddMinutes(8);
            System.DateTime datumAlsStringplus10 = now.AddMinutes(10);
            System.DateTime datumAlsStringplus12 = now.AddMinutes(12);
            System.DateTime datumAlsStringplus14 = now.AddMinutes(14);

            UpdateInfoLabel("Erstelle PHP-Inhalt für Termin...");

            string terminphp = TerminePhp(toEmail, datumAlsStringplus2.ToString(), datumAlsStringplus4.ToString(), datumAlsStringplus6.ToString(), datumAlsStringplus8.ToString(), datumAlsStringplus10.ToString(), datumAlsStringplus12.ToString(), datumAlsStringplus14.ToString(), Schau, htmlContent, firma, datumAlsString);

            UpdateInfoLabel("Erstelle PHP-Inhalt für Formular...");

            string formPhp = FormPhp(filefin, filehtmlname, termine);

            try
            {
                UpdateInfoLabel("Speichere Termin-PHP-Datei...");

                File.WriteAllText(Pathtermine, terminphp);

                UpdateInfoLabel("Speichere Formular-PHP-Datei...");

                File.WriteAllText(Pathform, formPhp);

                UpdateInfoLabel("PHP-Dateien erfolgreich gespeichert.");
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung
                UpdateInfoLabel("Fehler beim Speichern der Dateien: " + ex.Message);
                Console.WriteLine("Fehler beim Schreiben der Datei: " + ex.Message);
            }
        }

        private string RemoveUmlautsAndSpecialCharacters(string input)
        {
            Dictionary<char, string> replacements = new Dictionary<char, string>
    {
        { 'ä', "ae" },
        { 'ö', "oe" },
        { 'ü', "ue" },
        { 'Ä', "Ae" },
        { 'Ö', "Oe" },
        { 'Ü', "Ue" },
        { 'ß', "ss" }
    };

            StringBuilder sb = new StringBuilder();

            foreach (char c in input)
            {
                if (replacements.ContainsKey(c))
                {
                    sb.Append(replacements[c]);
                }
                else
                {
                    sb.Append(c);
                }
            }

            return sb.ToString();
        }


        private string GetSchauspielerName(string email)
        {
            UpdateInfoLabel("GetSchauspielerName...");
            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                if (row.Cells["EmailColumn"].Value?.ToString() == email)
                {
                    return row.Cells["SchauspielerColumn"].Value.ToString();
                }
            }
            return "";
        }

        private string TerminePhp(string toEmail, string datumAlsStringplus2, string datumAlsStringplus4, string datumAlsStringplus6, string datumAlsStringplus8, string datumAlsStringplus10, string datumAlsStringplus12, string datumAlsStringplus14, string Schau, string htmlContent, string firma, string datumAlsString)
        {

            UpdateInfoLabel("Beginne mit der Erstellung des PHP-Inhalts für: " + Schau + "...");

            // Durchgehen der SchauRowData und Extrahieren der Telefonnummer anhand der E-Mail-Adresse
            string telefon = "";
            foreach (SchauRowData schauRow in schauList)
            {
                if (schauRow.SchauEmail == toEmail)
                {
                    telefon = schauRow.SchauTelefonnummer;
                }
            }

            UpdateInfoLabel("Erstelle PHP-Namespaces und Variablen für: " + Schau + "...");

            string filefortschritt = $"{datumAlsString}_{firma}_fortschritt.json";

            // OrgStuecke to string
            string datum = OrgDatum.Text;
            string uhrzeit = OrgUhrzeit.Text;
            string name = Schau.Replace("-", " ");

            UpdateInfoLabel("Generiere PHP-Code für: " + Schau + "...");

            // Hier wird Ihr PHP-Code generiert werden
            return $@"<?php
namespace Termin\AureliaLanker;


// Informationen speichern
$firma = '{firma}';
$datum = '{datum}';
$uhrzeit = '{uhrzeit}';
$telefon = '{telefon}';

if (!function_exists(__NAMESPACE__ . '\removePastEvents')) {{
    function removePastEvents($file, $events) {{
        $content = file_get_contents($file);
        foreach ($events as $event) {{
            $pattern = ""/\['datum' => '"".preg_quote($event, '/').""'\],?/s"";
            $content = preg_replace($pattern, '', $content);
        }}
        file_put_contents($file, $content);
    }}
}}


// Define the termin dates
$termine = [
    ['datum' => '{datumAlsStringplus2}'],
    ['datum' => '{datumAlsStringplus4}'],
    ['datum' => '{datumAlsStringplus6}'],
    ['datum' => '{datumAlsStringplus8}'],
    ['datum' => '{datumAlsStringplus10}'],
    ['datum' => '{datumAlsStringplus12}'],
    ['datum' => '{datumAlsStringplus14}']
];

$currentDateTime = new \DateTime('now');
$pastEvents = [];

echo ""Current DateTime: "" . $currentDateTime->format('Y-m-d H:i:s') . ""\n"";

foreach ($termine as $index => $termin) {{
    $eventDateTime = new \DateTime($termin['datum']);
    echo ""Checking termin: {{$termin['datum']}} -> Formatted: "" . $eventDateTime->format('Y-m-d H:i:s') . ""\n"";

    if ($currentDateTime > $eventDateTime) {{
        echo ""Termin is in the past, preparing to send email\n"";
        $subject = 'Erinnerung: Feedback benötigt';
        $body = ""Hallo {name}, ich erinnere dich, dass wir noch deine Antwort brauchen. Dankeschön: <a href='{htmlContent}'>Link</a>"";
        echo ""Subject: $subject\n"";
        echo ""Body: $body\n"";
        $response = sendEmail('{toEmail}', $subject, $body); // Test-E-Mail-Adresse
        echo ""Email response: "" . ($response ? ""Success"" : ""Failed"") . ""\n"";
        file_put_contents(__DIR__ . '/cron_log.txt', $response . ""\n"", FILE_APPEND);
        $pastEvents[] = $termin['datum'];
    }} else {{
        echo ""Date found: Termin is in the future, no email sent\n"";
    }}
}}






// Remove past events from this file
removePastEvents(__FILE__, $pastEvents);

// Debugging: Display remaining termine
echo ""Remaining termine: "";
print_r($termine);

// Check if there are no more termin dates left
if (empty($termine)) {{
    echo ""No more termin dates left, preparing to send notification email\n"";






// Read the JSON file content
    $jsonFileName = '{filefortschritt}';
    $jsonFilePath = __DIR__ . '/' . $jsonFileName;
    if (file_exists($jsonFilePath)) {{
        echo ""JSON file found: $jsonFileName\n"";
        $jsonContent = file_get_contents($jsonFilePath);
        $data = json_decode($jsonContent, true);

        // Find the role of the specified actress
        $actressName = ""{Schau}"";
        $roleName = null;
        foreach ($data['Besetzung'] as $entry) {{
            if ($entry['Name'] === $actressName) {{
                $roleName = $entry['Rollen'];
                break;
            }}
        }}

        // Filter the ""Besetzung"" array by the role name
        if ($roleName !== null) {{
            $filteredEntries = array_filter($data['Besetzung'], function($entry) use ($roleName) {{
                return $entry['Rollen'] === $roleName;
            }});

            if (!empty($filteredEntries)) {{
                // Create HTML table for the filtered data
                $htmlTable = ""<table border='1' cellpadding='10' cellspacing='0'>"";
                $htmlTable .= ""<tr><th>Name</th><th>Rollen</th><th>Email</th><th>Telefonnummer</th></tr>"";
                foreach ($filteredEntries as $entry) {{
                    $htmlTable .= ""<tr>"";
                    $htmlTable .= ""<td>{{$entry['Name']}}</td>"";
                    $htmlTable .= ""<td>{{$entry['Rollen']}}</td>"";
                    $htmlTable .= ""<td>{{$entry['Email']}}</td>"";
                    $htmlTable .= ""<td>{{$entry['Telefonnummer']}}</td>"";
                    $htmlTable .= ""</tr>"";
                }}
                $htmlTable .= ""</table>"";

                // Simplify the email body for testing
                $subject = 'No More Termine Left';
                $body = ""<h1>Filtered JSON Data</h1>{{$htmlTable}}"";
                echo ""Email Subject: $subject\n"";
                echo ""Email Body: $body\n"";
                echo ""Sending email to scener@gmx.net\n"";
                $response = sendEmail('scener@gmx.net', $subject, $body);
                echo ""Notification email response: "" . ($response ? ""Success"" : ""Failed"") . ""\n"";
                file_put_contents(__DIR__ . '/cron_log.txt', ""Notification email: "" . $response . ""\n"", FILE_APPEND);

                // Remove the filtered entries from the JSON data
                foreach ($filteredEntries as $key => $entry) {{
                    unset($data['Besetzung'][$key]);
                }}

                // Save the updated JSON data back to the file
                file_put_contents($jsonFilePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                echo ""Filtered entries removed from JSON file.\n"";
            }} else {{
                echo ""No entries found for role $roleName.\n"";
            }}
        }} else {{
            echo ""Role for actress $actressName not found.\n"";
        }}
    }} else {{
        echo ""JSON file not found: $jsonFileName\n"";
    }}
}} else {{
    echo ""There are still remaining termine, no notification email sent.\n"";
}}

echo ""Script execution completed.\n"";
?>
";
}

        private string FormPhp(string filefin, string filehtmlname, string termine)
        {
            UpdateInfoLabel("Beginne mit der Erstellung des PHP-Inhalts für das Formular: " + filehtmlname + "...");


            string datumAlsString = BesetzungSuche.SelectedItem.ToString().Replace(":", "-").Replace(".", "-").Replace(" ", "_");
            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);



            // Pfad für die JSON-Datei erstellen
            string pathfortschritt = $@"{datumAlsString}_{firma}_fortschritt.json";
            string pathbesetzung = $@"{datumAlsString}_{firma}_besetzung.json";

            // Hier wird Ihr PHP-Code generiert werden
            return $@"<?php
// process_form.php

if ($_SERVER['REQUEST_METHOD'] == 'POST') {{
    $firma = trim($_POST['firma'] ?? 'keine Angabe');
    $roll = trim($_POST['roll'] ?? 'keine Angabe');
    $schauname = trim($_POST['schauname'] ?? 'keine Angabe');
    $teilnahme = trim($_POST['teilnahme'] ?? 'keine Angabe');
    $auto = trim($_POST['auto'] ?? 'keine Angabe');
    $anzahl = trim($_POST['anzahl'] ?? '0');

    // Daten für die neue JSON-Datei sammeln
    $daten = [
        'Ja' => $teilnahme,
        'Auto' => $auto,
        'Mitfahrer' => $anzahl,
        'firmenname' => $firma,
        'Rollen' => $roll,
        'Schauspieler' => $schauname
    ];

   // Neue JSON-Datei erstellen
    $jsonDaten = json_encode($daten, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
     file_put_contents('{filefin}', $jsonDaten, FILE_APPEND);

    // JSON-Datei Pfad
    $jsonFilePath = '{pathfortschritt}';
    $besetzungFilePath = '{pathbesetzung}';

    // JSON-Datei einlesen und in ein Array dekodieren
    if (file_exists($jsonFilePath)) {{
        $jsonData = json_decode(file_get_contents($jsonFilePath), true);

        // Suche nach dem Schauspieler und aktualisiere die Daten
        $found = false;
        foreach ($jsonData['Besetzung'] as &$entry) {{
            if ($entry['Name'] === $schauname) {{
                $entry['Warten'] = 'False';
                $entry['Ja'] = ($teilnahme === 'true') ? 'True' : 'False';
                $found = true;
                break;
            }}
        }}

        if (!$found) {{
            echo ""No matching entry found for: "" . $schauname . ""\n"";
        }}

        // JSON-Datei mit den aktualisierten Daten speichern
        file_put_contents($jsonFilePath, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    }} else {{
        echo ""JSON file does not exist."";
    }}

    // Aktualisierung der ""besetzung.json"" Datei
    if (file_exists($besetzungFilePath)) {{
        $besetzungData = json_decode(file_get_contents($besetzungFilePath), true);

        // Suche nach der Rolle und setze auf ""true""
        if (array_key_exists($roll, $besetzungData['Besetzung'])) {{
            $besetzungData['Besetzung'][$roll] = true;
        }} else {{
            echo ""No matching role found for: "" . $roll . ""\n"";
        }}

        // JSON-Datei mit den aktualisierten Daten speichern
        file_put_contents($besetzungFilePath, json_encode($besetzungData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }} else {{
        echo ""Besetzung JSON file does not exist."";
    }}

    if ($teilnahme === 'true') {{
        echo ""<style>
                html, body {{ height: 100%; margin: 0; display: flex; justify-content: center; align-items: center; font-family: 'Roboto', sans-serif; }}
              </style>
              <div><h2>Dankeschön, wenn der Termin mit dir stattfindet, sage ich Bescheid.<br>Bis dahin, alles Gute.</h2></div>"";
    }} else {{
        echo ""<style>
                html, body {{ height: 100%; margin: 0; display: flex; justify-content: center; align-items: center; font-family: 'Roboto', sans-serif; }}
              </style>
              <div><h2>Schade, dass du keine Zeit hast.<br>Vielleicht beim nächsten Mal. Alles Gute.</h2></div>"";
    }}

    unlink('{filehtmlname}');
    unlink('{termine}');
    unlink(__FILE__);
}}
?>




";
}

        
        private string Fortschrittjson()
        {
            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);
            string stueck1 = OrgStuecke.SelectedItem.ToString();
            string stueck = RemoveUmlautsAndSpecialCharacters(stueck1);
            string datum = OrgDatum.Text;
            string uhrzeit = OrgUhrzeit.Text;

            UpdateInfoLabel("Beginne mit der Erstellung des JSON-Inhalts für den Fortschritt...");

            UpdateInfoLabel("Sammle Informationen über Firma, Stück, Datum und Uhrzeit...");


            // BesetzungDataGrid in JSON konvertieren
            var besetzungDataList = new List<Dictionary<string, string>>();
            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                if (!row.IsNewRow)
                {
                    UpdateInfoLabel("Sammle Daten für " + row.Cells["SchauspielerColumn"].Value?.ToString() + "...");
                    var schauspielerName1 = row.Cells["SchauspielerColumn"].Value?.ToString();
                    string schauspielerName = RemoveUmlautsAndSpecialCharacters(schauspielerName1);


                    string telefonnummer = GetPhoneNumber(schauspielerName);

                    // die leerzeichen in den schauspielername durch - ersetzen
                    if (schauspielerName.Contains(" "))
                    {
                        schauspielerName = schauspielerName.Replace(" ", "-");
                    }

                    var rowData = new Dictionary<string, string>
                {
                    { "Name", schauspielerName },
                    { "Rollen", row.Cells["RollenColumn"].Value?.ToString() },
                    { "Email", row.Cells["EmailColumn"].Value?.ToString() },
                    { "Warten", row.Cells["WartenColumn"].Value?.ToString() },
                    { "Ja", row.Cells["JaColumn"].Value?.ToString() },
                    { "Telefonnummer", telefonnummer },
                    { "Abendregie", row.Cells["AbendregieColumn"].Value?.ToString() }
                    };
                    besetzungDataList.Add(rowData);
                }
            }
            UpdateInfoLabel("Konvertiere BesetzungDataGrid in JSON...");

            // 

            // Erstelle das JSON-Objekt mit allen gesammelten Daten
            var jsonData = new
            {
                Firma = firma,
                Stueck = stueck,
                Datum = datum,
                Uhrzeit = uhrzeit,
                Besetzung = besetzungDataList
            };

            // JSON in eine Datei schreiben
            string jsonContent = JsonConvert.SerializeObject(jsonData, Formatting.Indented);
            string filePath = "fortschritt.json"; // Pfad und Dateiname für die JSON-Datei

            try
            {
                File.WriteAllText(filePath, jsonContent);
                UpdateInfoLabel("JSON-Datei erfolgreich erstellt: " + filePath);
            }
            catch (Exception ex)
            {
                UpdateInfoLabel("Fehler beim Erstellen der JSON-Datei: " + ex.Message);
            }

            return jsonContent;
        }

        private string Besetzungjson()
        {
            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);
            string stueck1 = OrgStuecke.SelectedItem.ToString();
            string stueck = RemoveUmlautsAndSpecialCharacters(stueck1);
            string datum = OrgDatum.Text;
            string uhrzeit = OrgUhrzeit.Text;

            UpdateInfoLabel("Beginne mit der Erstellung des JSON-Inhalts für den Fortschritt...");
            UpdateInfoLabel("Sammle Informationen über Firma, Stück, Datum und Uhrzeit...");

            // BesetzungDataGrid in JSON konvertieren
            var rollenDict = new Dictionary<string, bool>(); // Verwenden Sie ein Dictionary, um Rollen auf false zu setzen
            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                if (!row.IsNewRow)
                {
                    UpdateInfoLabel("Sammle Daten für " + row.Cells["SchauspielerColumn"].Value?.ToString() + "...");

                    // Fügen Sie die Rolle zum Dictionary hinzu und ersetze Leerzeichen durch -
                    var rolle1 = row.Cells["RollenColumn"].Value?.ToString();
                    string rolle = RemoveUmlautsAndSpecialCharacters(rolle1);

                    if (rolle != null)
                    {
                        rolle = rolle.Replace(" ", "-");
                        rollenDict[rolle] = false; // Fügen Sie die Rolle zum Dictionary hinzu und setzen Sie den Wert auf false
                    }
                    
                }
            }
            UpdateInfoLabel("Konvertiere BesetzungDataGrid in JSON...");

            // Erstelle das JSON-Objekt mit allen gesammelten Daten
            var jsonData = new
            {
                Firma = firma,
                Stueck = stueck,
                Datum = datum,
                Uhrzeit = uhrzeit,
                Besetzung = rollenDict // Verwenden Sie das Dictionary hier
            };

            // JSON in eine Datei schreiben
            string jsonContent = JsonConvert.SerializeObject(jsonData, Formatting.Indented);
            string filePath = "fortschritt.json"; // Pfad und Dateiname für die JSON-Datei

            try
            {
                File.WriteAllText(filePath, jsonContent);
                UpdateInfoLabel("JSON-Datei erfolgreich erstellt: " + filePath);
            }
            catch (Exception ex)
            {
                UpdateInfoLabel("Fehler beim Erstellen der JSON-Datei: " + ex.Message);
            }

            return jsonContent;
        }

        // Beispielmethode zum Abrufen der Telefonnummer
        private string GetPhoneNumber(string schauspielerName)
        {
            // suchen nach dem Schauspielername in schauList und die telefonnummer der Schauspieler
            foreach (SchauRowData schauRow in schauList)
            {
                if (schauRow.Schauspieler == schauspielerName)
                {
                    return schauRow.SchauTelefonnummer;
                }
            }
            return "";
        }




        public void SavefortschrittJson()
        {
            UpdateInfoLabel("Beginne mit dem Hochladen der Fortschritt-JSON...");

            string datumAlsString = BesetzungSuche.SelectedItem.ToString().Replace(":", "-").Replace(".", "-").Replace(" ", "_");
            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);


            UpdateInfoLabel("Erstelle den Pfad für die JSON-Datei...");

            // Pfad für die JSON-Datei erstellen
            string pathfortschritt = $@"F:\StagOrg\VS\res format\json\Schauspieler\{datumAlsString}_{firma}_fortschritt.json";
            string pathbesetzungjson = $@"F:\StagOrg\VS\res format\json\Schauspieler\{datumAlsString}_{firma}_besetzung.json";

            UpdateInfoLabel("Generiere den JSON-Inhalt...");

            // JSON-Inhalt generieren
            string jsonContent = Fortschrittjson();
            string besetzungjson = Besetzungjson();

            UpdateInfoLabel("Speichere die JSON-Datei...");

            // JSON-Datei speichern
            try
            {
                File.WriteAllText(pathfortschritt, jsonContent);
                File.WriteAllText(pathbesetzungjson, besetzungjson);

                UpdateInfoLabel("JSON-Datei erfolgreich gespeichert...");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Speichern der Datei: {ex.Message}", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                UpdateInfoLabel("Fehler beim Speichern der JSON-Datei...");
                return;
            }

            UpdateInfoLabel("Überprüfe, ob der lokale Pfad existiert...");

            string ftpPath = "ftp://ftp.world4you.com/wp-content/uploads/Schauspieler/";
            string ftpUser = "ftp8596592";
            string ftpPassword = "m8&fCsH#Mt7FYsxT";

            string ordner = $@"F:\StagOrg\VS\res format\json\Schauspieler\";

            // Prüfen, ob der lokale Pfad existiert
            if (!Directory.Exists(ordner))
            {
                UpdateInfoLabel("Der angegebene lokale Pfad existiert nicht...");
                Console.WriteLine("Der angegebene lokale Pfad existiert nicht.");
                return;
            }

            UpdateInfoLabel("Erstelle den FTP-Pfad, falls nicht vorhanden...");

            // Erstellen des FTP-Pfads, wenn nicht vorhanden
            FtpWebRequest requestDir = (FtpWebRequest)WebRequest.Create(ftpPath);
            requestDir.Method = WebRequestMethods.Ftp.MakeDirectory;
            requestDir.Credentials = new NetworkCredential(ftpUser, ftpPassword);
            try
            {
                using (var resp = (FtpWebResponse)requestDir.GetResponse())
                {
                    Console.WriteLine("Verzeichnis erstellt.");
                    UpdateInfoLabel("FTP-Verzeichnis erfolgreich erstellt...");
                }
            }
            catch (WebException ex)
            {
                Console.WriteLine("Das Verzeichnis existiert möglicherweise schon. Fehler: " + ex.Message);
                UpdateInfoLabel("Das Verzeichnis existiert möglicherweise schon. Fehler: " + ex.Message);
            }

            UpdateInfoLabel("Beginne mit dem Hochladen der Dateien...");

            // Hochladen der JSON-Datei
            foreach (string file in Directory.GetFiles(ordner))
            {
                UpdateInfoLabel("Hochladen der Datei " + Path.GetFileName(file) + "...");

                string ftpFilePath = Path.Combine(ftpPath, Path.GetFileName(file)).Replace("\\", "/");
                FtpWebRequest request = (FtpWebRequest)WebRequest.Create(ftpFilePath);
                request.Method = WebRequestMethods.Ftp.UploadFile;
                request.Credentials = new NetworkCredential(ftpUser, ftpPassword);

                // Lese die Datei in einen Byte-Array
                byte[] fileContents;
                using (StreamReader sourceStream = new StreamReader(file))
                {
                    fileContents = System.Text.Encoding.UTF8.GetBytes(sourceStream.ReadToEnd());
                }

                request.ContentLength = fileContents.Length;

                // Schreibe den Dateiinhalt zum FTP-Server
                using (System.IO.Stream requestStream = request.GetRequestStream())
                {
                    requestStream.Write(fileContents, 0, fileContents.Length);
                }

                using (FtpWebResponse response = (FtpWebResponse)request.GetResponse())
                {
                    Console.WriteLine("Upload File Complete, status {0}", response.StatusDescription);
                    UpdateInfoLabel("Upload der Datei " + Path.GetFileName(file) + " abgeschlossen...");
                }
            }

            UpdateInfoLabel("Alle Dateien wurden erfolgreich hochgeladen...");

            string directoryPath = $@"F:\StagOrg\VS\res format\json\Schauspieler\";
            // Löschen der Dateien und nicht der Ordner

            foreach (string file in Directory.EnumerateFiles(directoryPath))
            {
                File.Delete(file);
            }

            UpdateInfoLabel("Lokale Dateien gelöscht, E-Mail-Versand abgeschlossen.");
        }

        public async Task SpielSpeichern(string toEmail)
        {
            UpdateInfoLabel("Beginne mit SpielSpeichern...");

            CreateAndSavePHP(toEmail);
            UpdateInfoLabel("PHP-Datei für " + toEmail + " erstellt...");

            // extrahieren des Schauspieler-Namens anhand der Mail-Adresse
            string Schau1 = "";
            string firma1 = FirmaBox.Text;
            string firma = RemoveUmlautsAndSpecialCharacters(firma1);

            foreach (DataGridViewRow row in BesetzungDataGrid.Rows)
            {
                if (row.Cells["EmailColumn"].Value != null && row.Cells["EmailColumn"].Value.ToString() == toEmail)
                {
                    Schau1 = row.Cells["SchauspielerColumn"].Value.ToString().Replace(" ", "-");
                }
            }
            UpdateInfoLabel("Schauspieler extrahiert: " + Schau1 + "...");
            string Schau = RemoveUmlautsAndSpecialCharacters(Schau1);

            // extrahieren der "TabbelnCombo" und säubern der Zeichen
            string datumAlsString = BesetzungSuche.SelectedItem.ToString().Replace(":", "-").Replace(".", "-").Replace(" ", "_");
            UpdateInfoLabel("Datum extrahiert und bereinigt: " + datumAlsString + "...");

            // filename erstellen für php und html
            string filehtmlname = $"{datumAlsString}_{firma}_{Schau}_form.html";
            string localhtmlPath = $@"F:\StagOrg\VS\res format\json\Schauspieler\{filehtmlname}";
            UpdateInfoLabel("Dateiname für HTML und PHP erstellt: " + filehtmlname + "...");

            // lokalen Pfad erstellen
            string localhtmlDirectory = Path.GetDirectoryName(localhtmlPath);
            if (!Directory.Exists(localhtmlDirectory))
            {
                Directory.CreateDirectory(localhtmlDirectory);
                UpdateInfoLabel("Lokales Verzeichnis erstellt: " + localhtmlDirectory + "...");
            }

            await Task.Delay(300);
            UpdateInfoLabel("Speichere HTML-Formular lokal...");

            // Lokal abspeichern des HTML-Formulars
            File.WriteAllText(localhtmlPath, CreatephpForm(toEmail, Abfahrt.Text));
            UpdateInfoLabel("HTML-Formular lokal gespeichert: " + localhtmlPath + "...");

            await Task.Delay(500);
            UpdateInfoLabel("Bereite FTP-Upload vor für " + Schau + "...");

            string ftpPath = "ftp://ftp.world4you.com/wp-content/uploads/Schauspieler/";
            string ftpUser = "ftp8596592";
            string ftpPassword = "m8&fCsH#Mt7FYsxT";

            string Ordner = $@"F:\StagOrg\VS\res format\json\Schauspieler\";

            // Prüfen, ob der lokale Pfad existiert
            if (!Directory.Exists(Ordner))
            {
                Console.WriteLine("Der angegebene lokale Pfad existiert nicht.");
                UpdateInfoLabel("Der angegebene lokale Pfad existiert nicht...");
                return;
            }

            // Erstellen des FTP-Pfad, wenn nicht vorhanden
            FtpWebRequest requestDir = (FtpWebRequest)WebRequest.Create(ftpPath);
            requestDir.Method = WebRequestMethods.Ftp.MakeDirectory;
            requestDir.Credentials = new NetworkCredential(ftpUser, ftpPassword);
            try
            {
                using (var resp = (FtpWebResponse)requestDir.GetResponse())
                {
                    Console.WriteLine("Verzeichnis erstellt.");
                    UpdateInfoLabel("FTP-Verzeichnis erstellt: " + ftpPath + "...");
                }
            }
            catch (WebException ex)
            {
                Console.WriteLine("Das Verzeichnis existiert möglicherweise schon. Fehler: " + ex.Message);
                UpdateInfoLabel("Das Verzeichnis existiert möglicherweise schon. Fehler: " + ex.Message);
            }

            UpdateInfoLabel("Beginne mit dem Hochladen der Dateien...");

            // Hochladen aller Dateien im Verzeichnis
            foreach (string file in Directory.GetFiles(Ordner))
            {
                UpdateInfoLabel("Hochladen der Datei: " + Path.GetFileName(file) + "...");

                string ftpFilePath = Path.Combine(ftpPath, Path.GetFileName(file)).Replace("\\", "/");
                FtpWebRequest request = (FtpWebRequest)WebRequest.Create(ftpFilePath);
                request.Method = WebRequestMethods.Ftp.UploadFile;
                request.Credentials = new NetworkCredential(ftpUser, ftpPassword);

                // Lese die Datei in einen Byte-Array
                byte[] fileContents;
                using (StreamReader sourceStream = new StreamReader(file))
                {
                    fileContents = System.Text.Encoding.UTF8.GetBytes(sourceStream.ReadToEnd());
                }

                request.ContentLength = fileContents.Length;

                // Schreibe den Dateiinhalt zum FTP-Server
                using (System.IO.Stream requestStream = request.GetRequestStream())
                {
                    requestStream.Write(fileContents, 0, fileContents.Length);
                }

                using (FtpWebResponse response = (FtpWebResponse)request.GetResponse())
                {
                    Console.WriteLine("Upload File Complete, status {0}", response.StatusDescription);
                    UpdateInfoLabel("Upload der Datei abgeschlossen: " + Path.GetFileName(file) + "...");
                }
            }

            UpdateInfoLabel("Alle Dateien erfolgreich hochgeladen...");
        }

        public async void LoadJsonFilesIntoComboBox()
        {

            // eine halbe sekunde warten
            await Task.Delay(100);
            // Specify the directory where the JSON files are stored with the company name as last folder
            string directoryPath = $@"F:\StagOrg\VS\res format\json\Firmen\{FirmaBox.Text}\Organ";

            // Ensure the directory exists
            if (Directory.Exists(directoryPath))
            {
                // Get all JSON files in the directory
                var fileEntries = Directory.GetFiles(directoryPath, "*.json");

                // Clear existing items in the ComboBox
                BesetzungSuche.Items.Clear();

                // Add each file name to the ComboBox, removing the path and the '.json' extension
                foreach (var filePath in fileEntries)
                {
                    var fileName = Path.GetFileNameWithoutExtension(filePath);
                    BesetzungSuche.Items.Add(fileName);
                }
            }

        }

        // Load the data from the selected JSON file into the DataGridView
        private async void TabbelnCombo_SelectedIndexChanged(object sender, EventArgs e)
        {
            await Task.Delay(100); // Wait for the ComboBox selection to complete

            if (BesetzungSuche.SelectedItem == null) return;

            string firma = FirmaBox.Text;  // Assuming you need the company name to build the path
            string selectedFile = BesetzungSuche.SelectedItem.ToString() + ".json";
            string fullPath = $@"F:\StagOrg\VS\res format\json\Firmen\{firma}\Organ\{selectedFile}";

            try
            {
                // Read the file content and deserialize it
                string jsonData = File.ReadAllText(fullPath);
                List<BesetzungData> dataList = JsonConvert.DeserializeObject<List<BesetzungData>>(jsonData);

                // Clear existing data in the DataGridView
                BesetzungDataGrid.Rows.Clear();

                // Populate the DataGridView with the data
                foreach (var data in dataList)
                {
                    int rowIndex = BesetzungDataGrid.Rows.Add();
                    BesetzungDataGrid.Rows[rowIndex].Cells["RollenColumn"].Value = data.Rollen;
                    BesetzungDataGrid.Rows[rowIndex].Cells["BesetztColumn"].Value = data.Besetzt;
                    BesetzungDataGrid.Rows[rowIndex].Cells["SchauspielerColumn"].Value = data.Schauspieler;
                    BesetzungDataGrid.Rows[rowIndex].Cells["EmailColumn"].Value = data.Email;
                    BesetzungDataGrid.Rows[rowIndex].Cells["WartenColumn"].Value = data.Warten;
                    BesetzungDataGrid.Rows[rowIndex].Cells["JaColumn"].Value = data.Ja;
                    BesetzungDataGrid.Rows[rowIndex].Cells["AutoColumn"].Value = data.Auto;
                    BesetzungDataGrid.Rows[rowIndex].Cells["MitfahrerColumn"].Value = data.Mitfahrer;
                    BesetzungDataGrid.Rows[rowIndex].Cells["AbendregieColumn"].Value = data.Abendregie;
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error loading data: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            UpdateBesetzungDataGrid();
        }

        //  und bei doppelten einträgen nur den ersten anzeigen
        private void UpdateBesetzungDataGrid()
        {
            // Durchsuchen der Rollen in der Besetzung und bei doppelten Einträgen nur den ersten anzeigen
            for (int i = 0; i < BesetzungDataGrid.Rows.Count; i++)
            {
                // Schauspielername auslesen
                string actorName = BesetzungDataGrid.Rows[i].Cells["RollenColumn"].Value.ToString();
                for (int j = i + 1; j < BesetzungDataGrid.Rows.Count; j++)
                {
                    // Wenn der Schauspielername doppelt vorkommt, dann nur den ersten Eintrag anzeigen und auch die Zeile ausblenden
                    if (BesetzungDataGrid.Rows[j].Cells["RollenColumn"].Value.ToString() == actorName)
                    {
                        BesetzungDataGrid.Rows[j].Visible = false;
                    }
                }
            }
        }

        private async void PlanText_TextChanged(object sender, EventArgs e)
        {
            // Suchen in BesetzungSuche nach dem Text in PlanText
            string searchValue = PlanText.Text.Trim(); // Entfernt führende und nachfolgende Leerzeichen
            int rowIndex = -1; // Initialize to -1 to indicate not found by default

            await Task.Delay(100); // Warten, um die Benutzereingabe abzuschließen
            // suchen der searchValue in der BesetzungSuche ComboBox
            for (int i = 0; i < BesetzungSuche.Items.Count; i++)
            {
                if (BesetzungSuche.Items[i].ToString().IndexOf(searchValue, StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    rowIndex = i;
                    break;
                }
            }

            // Einfügen des Index in IndexText
            IndexText.Text = rowIndex.ToString();

            // auswahl des Index in der ComboBox
            if (rowIndex >= 0)
            {
                BesetzungSuche.SelectedIndex = rowIndex;
            }
        }

        private void senden_Click(object sender, EventArgs e)
        {
            if (ErsteMailCheckbox.Checked)
            {
                string emailContent;
                if (!string.IsNullOrEmpty(InhaberBox.Text))
                {
                    emailContent = $@"<p>Sehr geehrte/r {InhaberBox.Text},<br><br>
                    Wie telefonisch besprochen, sende ich Ihnen die Infos zu unseren Veranstaltungen.<br>
                    Jedes Jahr planen wir eine Tour mit unserem Krimidinner durch ganz Österreich und auch Bayern und suchen in Folge dessen immer wieder nach neuen Gastro-Betrieben, mit denen wir zusammenarbeiten können, weshalb ich auch {FirmaBox.Text} gefunden habe.<br><br>
                    Unsere Krimidinner bestehen aus 4 Akten a jeweils ca 20 Minuten.
                    Daraus folgen 3 Essenspausen, in denen ein Menü gereicht wird. Unsere Spieler:innen essen gemeinsam mit den Gästen und bleiben in ihren Rollen, so dass die Gäste die Möglichkeit haben, alle Darsteller:innen zu dem Mordfall zu befragen. Die Gäste sind in unsere Settings integriert (bei unserer Produktion „Killer con Carne“ sind zum Beispiel alle Gäste Mitarbeiter:innen der fleischerei, in der der Mord geschieht). Die Gäste können ihren Grad der Interaktion selbst bestimmen. Uns ist es wichtig, dass sich alle Gäste wohlfühlen und niemand vorgeführt wird. Das erreichen wir durch große Tische, an denen die Gäste sitzen. Bewährt haben sich 8er- oder 10er-Tische.
                    In der Regel kommen die Gäste paarweise zur Veranstaltung: eine Person möchte miträtseln, die andere Person kommt mit… Bei der Tischgröße können alle 'Rätsler' bedient werden und die 'Mitkommer' werden von uns in Ruhe gelassen.<br><br>
                    Wir spielen zu einem Festpreis, der sich aus der Entfernung zum Spielort und der Größe des Restaurants errechnet. Gern erstelle ich Ihnen ein Angebot. Inkludiert ist die Durchführung der jeweiligen Produktion, die An- und Abreise und Nächtigung des Ensembles. Wir bringen alle Requisiten mit. Wir benötigen keine Bühne als Spielfläche, da der Saal jeweils unsere Bühne ist. Wir spielen nah an den Zuschauer:innen, zwischen den Tischen. Zusätzlich benötigen wir einen Raum, den wir als Garderobe nutzen können.<br>
                    Das Ensemble besteht aus 6 Spieler:innen und einer Abendregie. Die Abendregie ist das Bindeglied zwischen Ihnen und dem Ensemble. Wir beginnen einen neuen Akt immer erst, wenn der Service mit abservieren und Getränke Wünschen für den nächsten Akt fertig ist und uns ein Zeichen gibt<br>
                    Bei der Menükalkulation muss beachtet werden, dass die 7 Ensemblemitglieder mit verköstigt werden müssen.<br>
                    Wir bewerben die Veranstaltung auf unserer Webseite <a href='http://www.dinnerleiche.at'>www.dinnerleiche.at</a> und unserer Facebookseite. Ausserdem sind wir auch immer dankbar über Pressekontakte vor Ort, denen wir gern unser Pressematerial zukommen lassen.<br>
                    Sie bekommen von uns Flyer (A6) und Plakate (A3), die jeweils angepasst an das Haus sind. Ausserdem erstellen wir einen Satz Tickets für Sie. Erfahrungsgemäss werden die meisten Tickets direkt vor Ort verkauft. Wir verkaufen auch Tickets über die Plattform von Ö-Ticket. Um immer einen Überblick über den aktuellen Verkaufsstand zu haben, erstellen wir eine Ticketliste auf die Sie und wir Zugriff haben. <br>
                    Das erst einmal als grundlegende Informationen. Melden Sie sich gern bei mir für weitere Details und Fragen.<br>
                    Ich würde mich sehr freuen, auch in Ihrer Gegend spielen zu können. Wir bringen jedes Jahr ein neues Stück heraus, so dass auch Folgeveranstaltungen möglich sind. Selbstverständlich spielen wir auch im Umkreis von ca einer Stunde Fahrtzeit auch in keinen weiteren Restaurants.<br>
                    Ich freue mich, von Ihnen zu hören.<br><br>
                    Mit Freundlichen Grüßen<br>
                    Franz Josef Danner<br>
                    Kreative Leitung der Stagedive GesBR (Meinhartsdorfer Gasse 3/28, 1150 Wien)<br>
                    danner@stagedive.at<br>
                    06607977400</p>";


                }
                else
                {
                    emailContent = $@"<p>Sehr geehrtes {FirmaBox.Text} Team,<br><br>
                    Wie telefonisch besprochen, sende ich Ihnen die Infos zu unseren Veranstaltungen.<br>
                    Jedes Jahr planen wir eine Tour mit unserem Krimidinner durch ganz Österreich und auch Bayern und suchen in Folge dessen immer wieder nach neuen Gastro-Betrieben, mit denen wir zusammenarbeiten können, weshalb ich auch {FirmaBox.Text} gefunden habe.<br><br>
                    Unsere Krimidinner bestehen aus 4 Akten a jeweils ca 20 Minuten.
                    Daraus folgen 3 Essenspausen, in denen ein Menü gereicht wird. Unsere Spieler:innen essen gemeinsam mit den Gästen und bleiben in ihren Rollen, so dass die Gäste die Möglichkeit haben, alle Darsteller:innen zu dem Mordfall zu befragen. Die Gäste sind in unsere Settings integriert (bei unserer Produktion „Killer con Carne“ sind zum Beispiel alle Gäste Mitarbeiter:innen der fleischerei, in der der Mord geschieht). Die Gäste können ihren Grad der Interaktion selbst bestimmen. Uns ist es wichtig, dass sich alle Gäste wohlfühlen und niemand vorgeführt wird. Das erreichen wir durch große Tische, an denen die Gäste sitzen. Bewährt haben sich 8er- oder 10er-Tische.
                    In der Regel kommen die Gäste paarweise zur Veranstaltung: eine Person möchte miträtseln, die andere Person kommt mit… Bei der Tischgröße können alle 'Rätsler' bedient werden und die 'Mitkommer' werden von uns in Ruhe gelassen.<br><br>
                    Wir spielen zu einem Festpreis, der sich aus der Entfernung zum Spielort und der Größe des Restaurants errechnet. Gern erstelle ich Ihnen ein Angebot. Inkludiert ist die Durchführung der jeweiligen Produktion, die An- und Abreise und Nächtigung des Ensembles. Wir bringen alle Requisiten mit. Wir benötigen keine Bühne als Spielfläche, da der Saal jeweils unsere Bühne ist. Wir spielen nah an den Zuschauer:innen, zwischen den Tischen. Zusätzlich benötigen wir einen Raum, den wir als Garderobe nutzen können.<br>
                    Das Ensemble besteht aus 6 Spieler:innen und einer Abendregie. Die Abendregie ist das Bindeglied zwischen Ihnen und dem Ensemble. Wir beginnen einen neuen Akt immer erst, wenn der Service mit abservieren und Getränke Wünschen für den nächsten Akt fertig ist und uns ein Zeichen gibt<br>
                    Bei der Menükalkulation muss beachtet werden, dass die 7 Ensemblemitglieder mit verköstigt werden müssen.<br>
                    Wir bewerben die Veranstaltung auf unserer Webseite <a href='http://www.dinnerleiche.at'>www.dinnerleiche.at</a> und unserer Facebookseite. Ausserdem sind wir auch immer dankbar über Pressekontakte vor Ort, denen wir gern unser Pressematerial zukommen lassen.<br>
                    Sie bekommen von uns Flyer (A6) und Plakate (A3), die jeweils angepasst an das Haus sind. Ausserdem erstellen wir einen Satz Tickets für Sie. Erfahrungsgemäss werden die meisten Tickets direkt vor Ort verkauft. Wir verkaufen auch Tickets über die Plattform von Ö-Ticket. Um immer einen Überblick über den aktuellen Verkaufsstand zu haben, erstellen wir eine Ticketliste auf die Sie und wir Zugriff haben. <br>
                    Das erst einmal als grundlegende Informationen. Melden Sie sich gern bei mir für weitere Details und Fragen.<br>
                    Ich würde mich sehr freuen, auch in Ihrer Gegend spielen zu können. Wir bringen jedes Jahr ein neues Stück heraus, so dass auch Folgeveranstaltungen möglich sind. Selbstverständlich spielen wir auch im Umkreis von ca einer Stunde Fahrtzeit auch in keinen weiteren Restaurants.<br>
                    Ich freue mich, von Ihnen zu hören.<br><br>
                    Mit Freundlichen Grüßen<br>
                    Franz Josef Danner<br>
                    Kreative Leitung der Stagedive GesBR (Meinhartsdorfer Gasse 3/28, 1150 Wien)<br>
                    danner@stagedive.at<br>
                    06607977400</p>";
                }

                using (Email Email = new Email())
                {
                    Email.EmailBox.Text = EmailBox.Text;
                    Email.EmailBodyTextBox.Text = emailContent;
                    Email.FirmaBodyTextBox.Text = FirmaBox.Text;
                    Email.InhaberBodyTextBox.Text = InhaberBox.Text;
                    Email.TelefonBodyTextBox.Text = TelefonBox.Text;
                    Email.AdresseBodyTextBox.Text = AdresseBox.Text;
                    Email.KommentarBodyTextBox.Text = KommentarBox.Text;
                    Email.BetreffTextBox.Text = "Anfrage für Krimidinner";
                    if (Email.ShowDialog() == DialogResult.OK)
                    {
                    }
                }
                KommentarBox.Text += Environment.NewLine + " erst E-Mail gesendet." + DateTime.Now.ToString("dd.MM.yyyy HH:mm:ss");

            }
        }

        

        public async Task CreateGoogleCalendarEvent(string summary, List<string> emails, System.DateTime startDate, System.DateTime endDate)
        {
            UserCredential credential = GetCredential(); // Stellen Sie sicher, dass Sie die Autorisierung korrekt konfiguriert haben
            CalendarService service = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = "Stagedive Organisation"
            });

            Google.Apis.Calendar.v3.Data.Event newEvent = new Google.Apis.Calendar.v3.Data.Event()
            {
                Summary = summary,
                Start = new EventDateTime() { DateTimeDateTimeOffset = startDate },
                End = new EventDateTime() { DateTimeDateTimeOffset = endDate },
                Attendees = emails.Select(email => new EventAttendee() { Email = email }).ToList(),
                Description = "Beschreibung des Events mit Details zu Stück, Zeit und Ort. "
            };
            // Erstellen des Events
            EventsResource.InsertRequest request = service.Events.Insert(newEvent, "Vorstellung");
            Google.Apis.Calendar.v3.Data.Event createdEvent = await request.ExecuteAsync();
            // Ausgabe der Event-URL
            Console.WriteLine("Vorstellung: " + createdEvent.HtmlLink);
        }
    }
}
