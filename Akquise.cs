// Akquise code:
using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;
using Newtonsoft.Json;
using System.Diagnostics;
using static res_format.Liste;
using System.Threading;

namespace res_format
{
    public partial class Akquise : Form
    {
        private readonly string apiKey = "AIzaSyC82aoSWfXJwJOqJgSCMt8V4CQcn31VE_4";
        private readonly HttpClient httpClient = new HttpClient();
        public static Akquise Instance { get; private set; }

        public Akquise()
        {
            InitializeComponent();
            Instance = this; // Setze die Instanz beim Erstellen des Formulars
            ReCh.Click += ReCh_Click;
        }

        public void AddAddressesToZieAd(List<string> addresses)
        {
            foreach (var address in addresses)
            {
                ZieAd.Items.Add(address);
            }
        }

        public void AddAddressesToStaAd(List<string> addresses)
        {
            foreach (var address in addresses)
            {
                StaAd.AppendText(address + Environment.NewLine);
            }
        }


        public bool IsDataChanged { get; set; } = false; // Setze dies auf false, wenn Daten geändert werden

        private void ZieAd_ItemAddedOrRemovedOrChanged(object sender, EventArgs e)
        {
            IsDataChanged = true;

        }


        public event EventHandler ZieAdChanged;

        protected virtual void OnZieAdChanged()
        {
            ZieAdChanged?.Invoke(this, EventArgs.Empty);
            IsDataChanged = true;
        }


        private void Ein_Click(object sender, EventArgs e)
        {
            var inputDialog = new Form
            {
                Width = 500,
                Height = 300,
                FormBorderStyle = FormBorderStyle.FixedDialog,
                Text = "Adresse hinzufügen",
                StartPosition = FormStartPosition.CenterScreen
            };
            TextBox textBox = new TextBox { Left = 50, Top = 50, Width = 400, Height = 150, Multiline = true };
            Button confirmation = new Button() { Text = "Ok", Left = 350, Width = 100, Top = 210, DialogResult = DialogResult.OK };
            confirmation.Click += (innerSender, innerE) => { inputDialog.Close(); };
            inputDialog.Controls.Add(textBox);
            inputDialog.Controls.Add(confirmation);
            inputDialog.AcceptButton = confirmation;

            if (inputDialog.ShowDialog() == DialogResult.OK)
            {
                string[] addresses = textBox.Text.Split(new string[] { Environment.NewLine }, StringSplitOptions.None);
                foreach (var address in addresses)
                {
                    if (!string.IsNullOrWhiteSpace(address))
                    {
                        ZieAd.Items.Add(address.Trim());
                        IsDataChanged = true; // Setze IsDataChanged auf true
                    }
                }
            }
        }




        public void Bea_Click(object sender, EventArgs e)
        {
            if (ZieAd.SelectedItem == null) return;

            string selectedAddresses = string.Join(Environment.NewLine, ZieAd.SelectedItems.Cast<string>().ToArray());
            var editDialog = new Form
            {
                Width = 500,
                Height = 300,
                FormBorderStyle = FormBorderStyle.FixedDialog,
                Text = "Adresse bearbeiten",
                StartPosition = FormStartPosition.CenterScreen
            };
            TextBox textBox = new TextBox { Left = 50, Top = 50, Width = 400, Height = 150, Multiline = true, Text = selectedAddresses };
            Button confirmation = new Button() { Text = "Ok", Left = 350, Width = 100, Top = 210, DialogResult = DialogResult.OK };
            confirmation.Click += (innerSender, innerE) => { editDialog.Close(); };
            editDialog.Controls.Add(textBox);
            editDialog.Controls.Add(confirmation);
            editDialog.AcceptButton = confirmation;

            if (editDialog.ShowDialog() == DialogResult.OK)
            {
                foreach (var item in ZieAd.SelectedItems.Cast<string>().ToList())
                {
                    ZieAd.Items.Remove(item);
                }

                string[] addresses = textBox.Text.Split(new string[] { Environment.NewLine }, StringSplitOptions.None);
                foreach (var address in addresses)
                {
                    if (!string.IsNullOrWhiteSpace(address))
                    {
                        ZieAd.Items.Add(address.Trim());
                    }
                }
                IsDataChanged = true;

            }
        }

        public void Ent_Click(object sender, EventArgs e)
        {
            if (ZieAd.SelectedItem == null) return;

            var confirmResult = MessageBox.Show("Sind Sie sicher, dass Sie die Auswahl löschen möchten?", "Bestätigen", MessageBoxButtons.YesNo);
            if (confirmResult == DialogResult.Yes)
            {
                foreach (var item in ZieAd.SelectedItems.Cast<string>().ToList())
                {
                    ZieAd.Items.Remove(item);
                    IsDataChanged = true; // Setze IsDataChanged auf true nach dem Löschen
                }
            }
        }


        public ListBox ZieAdBox
        {
            get { return ZieAd; }
        }

        private void For_Click(object sender, EventArgs e)
        {
            // Fügt "Route planen" am Anfang des StaAd-Textfeldes hinzu
            StaAd.Text = "Route planen" + Environment.NewLine + StaAd.Text;

            string[] lines = StaAd.Text.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);

            // Jetzt fügen wir jede Zeile dem AdGo RichTextBox hinzu.
            foreach (var line in lines)
            {
                AdGo.AppendText(line + "\n");
            }

            // Zum Schluss leeren wir den Inhalt von StaAd.
            StaAd.Clear();
        }

        private void FilRaus_Click(object sender, EventArgs e)
        {
            // Löscht vorhandene Einträge in AdGo, um für neue Daten Platz zu machen.
            StaAd.Clear();

            // Splittet den Text in Blöcke, die durch "Route planen" getrennt sind.
            var blocks = AdGo.Text.Split(new[] { "Route planen" }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var block in blocks)
            {
                // Entfernt führende und nachfolgende Leerzeichen und teilt jede Zeile.
                var lines = block.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                                 .Select(line => line.Trim())
                                 .ToArray();

                if (lines.Length >= 3) // Mindestanzahl von Zeilen, die für eine gültige Adresse erforderlich sind.
                {
                    // Nimmt den ersten Eintrag als Firmennamen und die letzten zwei Einträge als Adresse.
                    var firmenName = lines[0];
                    var adresse = lines[lines.Length - 2] + ", " + lines[lines.Length - 1]; // Fügt die Adresse zusammen.

                    // Fügt den formatierten String in AdGo ein.
                    StaAd.AppendText(firmenName + "; " + adresse + "\n");
                }
            }
            AdGo.Clear();
        }

        private void UpdateStatusLabel(string text)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => StatusLabel.Text = text));
            }
            else
            {
                StatusLabel.Text = text;
            }
        }

        private async void Check_Click(object sender, EventArgs e)
        {
            UpdateStatusLabel("Initiiere Überprüfung...");
            await CheckAddressesAsync();
            RemoveAddressesFromStaAd();
            UpdateStatusLabel("Bereit für neue Aufgaben.");
        }


        public static string CleanAddress(string address)
        {
            return address.Replace("\r", "").Replace("\n", "").Trim();
        }

        public class RateLimiter
        {
            private readonly int _maxRequestsPerMinute;
            private readonly int _maxRequestsPerDay;
            private int _currentRequestsPerMinute;
            private int _currentRequestsPerDay;
            private readonly object _lock = new object();
            private DateTime _minuteStart;
            private DateTime _dayStart;

            public RateLimiter(int maxRequestsPerMinute, int maxRequestsPerDay)
            {
                _maxRequestsPerMinute = maxRequestsPerMinute;
                _maxRequestsPerDay = maxRequestsPerDay;
                _minuteStart = DateTime.Now;
                _dayStart = DateTime.Now;
            }

            public async Task WaitForAvailableSlotAsync()
            {
                lock (_lock)
                {
                    // Reset der Minute und Tageszähler
                    if ((DateTime.Now - _minuteStart).TotalMinutes >= 1)
                    {
                        _currentRequestsPerMinute = 0;
                        _minuteStart = DateTime.Now;
                    }

                    if ((DateTime.Now - _dayStart).TotalDays >= 1)
                    {
                        _currentRequestsPerDay = 0;
                        _dayStart = DateTime.Now;
                    }

                    // Wenn Limits erreicht sind, warten
                    if (_currentRequestsPerMinute >= _maxRequestsPerMinute || _currentRequestsPerDay >= _maxRequestsPerDay)
                    {
                        Monitor.Exit(_lock);
                        Task.Delay(1000).Wait(); // 1 Sekunde warten
                        return;
                    }

                    // Zähler erhöhen
                    _currentRequestsPerMinute++;
                    _currentRequestsPerDay++;
                }
            }
        }

        // Asynchrone Logik in einer separaten Methode
        private async Task CheckAddressesAsync()
        {
            UpdateStatusLabel("Starte Batch-Adressüberprüfung...");
            ProgressBar1.Value = 0;
            var originAddresses = StaAd.Lines.Where(line => !string.IsNullOrWhiteSpace(line)).ToList();
            var destinationAddresses = ZieAd.Items.Cast<string>().Where(address => !string.IsNullOrWhiteSpace(address)).ToList();

            var totalTasks = originAddresses.Count * destinationAddresses.Count;
            var completedTasks = 0;

            List<string> validAddresses = new List<string>();

            foreach (var origin in originAddresses)
            {
                var parts = origin.Split(';');
                if (parts.Length < 2)
                {
                    UpdateStatusLabel($"Überspringe ungültige Adresse: {origin}");
                    continue;
                }

                var originAddress = parts[1].Trim();
                bool isValid = true;

                foreach (var destination in destinationAddresses)
                {
                    UpdateStatusLabel($"Überprüfe Route von {originAddress} nach {destination}...");

                    // API-Anfrage mit Batch-Verarbeitung
                    var duration = await GetTravelTimeFromGoogleMaps(originAddress, destination);
                    completedTasks++;

                    if (duration <= (int)MinAut.Value)
                    {
                        isValid = false;
                        UpdateStatusLabel($"Adresse {originAddress} ist zu nah an {destination}.");
                        break;
                    }

                    UpdateProgressBar((completedTasks * 100) / totalTasks);
                }

                if (isValid)
                {
                    validAddresses.Add(origin);
                }
            }

            UpdateStatusLabel("Batch-Adressüberprüfung abgeschlossen.");
            Invoke(new Action(() =>
            {
                AdGo.Lines = validAddresses.ToArray();
                ProgressBar1.Value = ProgressBar1.Maximum;
            }));
        }



        private void RemoveAddressesFromStaAd()
        {
            var validAddresses = new HashSet<string>(AdGo.Lines);
            var updatedStaAd = StaAd.Lines.Where(line => !validAddresses.Contains(line)).ToArray();
            StaAd.Lines = updatedStaAd;
        }






        private readonly RateLimiter rateLimiter = new RateLimiter(100, 1000);

        private async Task<int> GetTravelTimeFromGoogleMaps(string origin, string destination)
        {
            try
            {
                // Warten, bis ein Slot verfügbar ist
                await rateLimiter.WaitForAvailableSlotAsync();

                string requestUri = $"https://maps.googleapis.com/maps/api/directions/json?origin={Uri.EscapeDataString(origin)}&destination={Uri.EscapeDataString(destination)}&key={apiKey}";
                HttpResponseMessage response = await httpClient.GetAsync(requestUri);
                string jsonResponse = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"Request: {requestUri}");
                Console.WriteLine($"Response: {jsonResponse}");

                if (response.IsSuccessStatusCode)
                {
                    var directions = JsonConvert.DeserializeObject<dynamic>(jsonResponse);
                    if (directions.routes.Count == 0)
                    {
                        Console.WriteLine("No routes found for " + origin + " to " + destination);
                        return -1; // Keine Route gefunden
                    }
                    int duration = directions.routes[0].legs[0].duration.value;
                    return duration / 60; // Rückgabe der Dauer in Minuten
                }

                return -1; // API call failed
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error getting travel time: " + ex.Message);
                return -1; // Return an error indicator
            }
        }


        private async Task CheckAddressesAsync(string[] addresses, int maxTravelTime)
        {
            // Leere AdGo, um Platz für neue Daten zu machen
            AdGo.Clear();

            // Initialisiere Variablen für Fortschrittserfassung
            int totalTasks = addresses.Length * ZieAd.Items.Count;
            int completedTasks = 0;

            HashSet<string> processedAddresses = new HashSet<string>(); // Verwendet, um Duplikate zu vermeiden

            foreach (var StaAdLine in addresses)
            {
                // Überprüfen, ob die Zeile das erwartete Format hat
                var parts = StaAdLine.Split(';');
                if (parts.Length < 2)
                {
                    // Falsches Format, überspringe diese Zeile
                    continue;
                }
                var origin = parts[1].Trim(); // Adresse aus der Zeile extrahieren

                foreach (var zieAd in ZieAd.Items.Cast<string>())
                {
                    // Führe eine asynchrone Abfrage der Reisezeit durch
                    var duration = await GetTravelTimeFromGoogleMaps(origin, zieAd);

                    // Aktualisiere den Fortschritt
                    completedTasks++;
                    int progressValue = (completedTasks * 100) / totalTasks;
                    UpdateProgressBar(progressValue);

                    // Überprüfe, ob die Adresse bereits verarbeitet wurde und die Reisezeit akzeptabel ist
                    if (!processedAddresses.Contains(StaAdLine) && duration > maxTravelTime)
                    {
                        // Füge die Adresse zu AdGo hinzu, wenn die Reisezeit akzeptabel ist
                        AdGo.AppendText(StaAdLine + Environment.NewLine);
                        processedAddresses.Add(StaAdLine); // Markiere die Adresse als verarbeitet, um Duplikate zu vermeiden
                    }
                }
            }
        }



        private void MinAut_ValueChanged(object sender, EventArgs e)
        {
            // Optional: Führen Sie eine Überprüfung nur aus, wenn bestimmte Bedingungen erfüllt sind, z.B. nur wenn StaAd und ZieAd Einträge vorhanden sind.
            if (StaAd.Lines.Any() && ZieAd.Items.Count > 0)
            {
                Check_Click(sender, e); // Verwenden Sie die bestehende Check_Click Methode, um die Adressen basierend auf dem neuen Wert zu überprüfen.
            }
        }



        // Konvertieren Sie die Check_Click Methode in eine asynchrone Task-Methode
        private async Task Check_Click()
        {
            StaAd.Clear(); // Leert StaAd
            List<string> validAddresses = new List<string>();
            int totalTasks = StaAd.Lines.Length * ZieAd.Items.Count;
            int completedTasks = 0;

            foreach (var StaAdLine in StaAd.Lines)
            {
                bool isValid = true;
                foreach (var zieAd in ZieAd.Items.Cast<string>())
                {
                    var duration = await GetTravelTimeFromGoogleMaps(StaAdLine.Split(';')[1], zieAd);
                    completedTasks++;
                    if (duration <= (int)MinAut.Value) // Wenn die Fahrtzeit zu kurz ist
                    {
                        isValid = false;
                        break;
                    }
                }

                if (isValid)
                {
                    validAddresses.Add(StaAdLine);
                }

                int progressValue = (completedTasks * 100) / totalTasks;
                UpdateProgressBar(progressValue); // Aktualisiert den Fortschrittsbalken
            }

            foreach (var address in validAddresses.Distinct())
            {
                StaAd.AppendText(address + "\n");
            }
        }






        private async void VErAr_Click(object sender, EventArgs e)
        {
            await Verarbeiten();
        }

        private async Task Verarbeiten()
        {
            await Task.Delay(1); // Simuliert eine asynchrone Verarbeitung
            For_Click(null, EventArgs.Empty);

            FilRaus_Click(null, EventArgs.Empty);
        }



        private void UpdateProgressBar(int value)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => ProgressBar1.Value = value));
            }
            else
            {
                ProgressBar1.Value = value;
            }
        }




        private void Map_Click(object sender, EventArgs e)
        {
            if (Liste.Instance.isReChActivated)
            {
                string[] addressLines = AdGo.Lines; // Gehe von Textbox `AdGo` in `Akquise`
                foreach (var addressLine in addressLines)
                {
                    if (!string.IsNullOrWhiteSpace(addressLine))
                    {
                        var parts = addressLine.Split(';');
                        if (parts.Length >= 2)
                        {
                            string firma = parts[0].Trim();
                            string adresse = parts[1].Trim();
                            Liste.Instance.UpdateRowTags(firma, adresse, new ListeRowData
                            {
                                Offen = true,
                                ErsteMail = false,
                                ErstGespraech = false,
                                Buehne = false,
                                Nein = false,
                                Zunahe = false
                            });
                        }
                    }
                }
                Liste.Instance.isReChActivated = false; // Zustand zurücksetzen
                StaAd.Clear();
                AdGo.Clear();
                Liste.Instance.SaveAllListeData();
            }
            else
            {
                foreach (var addressLine in StaAd.Lines)
                {
                    if (!string.IsNullOrWhiteSpace(addressLine))
                    {
                        var parts = addressLine.Split(';');
                        if (parts.Length >= 2)
                        {
                            Liste.Instance.AddNewListeRowData(new Liste.ListeRowData
                            {
                                Firma = parts[0].Trim(),
                                Adresse = parts[1].Trim(),
                                Zunahe = true
                            });
                        }
                    }
                }

                // Übertragen der AdGo-Adressen mit dem Tag "Offen"
                foreach (var addressLine in AdGo.Lines)
                {
                    if (!string.IsNullOrWhiteSpace(addressLine))
                    {
                        var parts = addressLine.Split(';');
                        if (parts.Length >= 2)
                        {
                            Liste.Instance.AddNewListeRowData(new Liste.ListeRowData
                            {
                                Firma = parts[0].Trim(),
                                Adresse = parts[1].Trim(),
                                Offen = true
                            });
                        }
                    }
                }
                StaAd.Clear();
                AdGo.Clear();
                Liste.Instance.SaveAllListeData();
            }
        }

        private void OpenAddressesInGoogleMaps(string addresses)
        {
            // Split and clean addresses, filtering out empty or whitespace entries.
            var addressList = addresses.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                                       .Where(address => !string.IsNullOrWhiteSpace(address))
                                       .ToList();

            // Check if there are any addresses to process.
            if (addressList.Count == 0)
            {
                MessageBox.Show("Keine Adressen verfügbar zum Öffnen in Google Maps.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Attempt to open each address in Google Maps.
            foreach (var fullAddress in addressList)
            {
                try
                {
                    
                    if (!string.IsNullOrWhiteSpace(fullAddress))
                    {
                        string addressForMaps = Uri.EscapeDataString(fullAddress);
                        string url = $"https://www.google.com/maps/search/?api=1&query={addressForMaps}";
                        Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Ein Fehler ist aufgetreten: {ex.Message}", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }






        private void RemoveAddressesFromAdGoAndClearStaAd()
        {
            var staAdLines = new HashSet<string>(StaAd.Lines);
            var adGoLines = AdGo.Lines.Where(line => !staAdLines.Contains(line)).ToArray();
            AdGo.Lines = adGoLines;

            StaAd.Clear();
        }




        private int GetMaxLabelWidth(List<string> addresses)
        {
            int maxLabelWidth = 0;
            using (Graphics g = this.CreateGraphics())
            {
                foreach (string address in addresses)
                {
                    SizeF size = g.MeasureString(address, this.Font); // Verwenden Sie die tatsächliche Schriftart von addressLabel in Form3
                    if (size.Width > maxLabelWidth)
                    {
                        maxLabelWidth = (int)Math.Ceiling(size.Width);
                    }
                }
            }
            return maxLabelWidth;
        }






        private void F2OK_Click(object sender, EventArgs e)
        {
            // Logik, um die ausgewählten Adressen zu verarbeiten, falls notwendig
            this.DialogResult = DialogResult.OK; // Wichtig, um das Dialogergebnis zu setzen
        }

        private void F2Ab_Click(object sender, EventArgs e)
        {
            this.DialogResult = DialogResult.Cancel; // Setzt das Dialogergebnis auf Cancel
        }

        private void UpdateAdGoAfterForm3Changes()
        {
            // Beispiel: Entfernen Sie alle Adressen aus AdGo
            // Sie müssen diese Methode an Ihre spezifische Logik anpassen
            AdGo.Clear();
            // Fügen Sie hier Code ein, um AdGo mit den aktualisierten Adressen zu füllen
        }


        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);

            // Verhindert, dass das Formular beim Schließen zerstört wird
            if (e.CloseReason == CloseReason.UserClosing)
            {
                Liste.Instance.isReChActivated = false; // Zurücksetzen des Zustands
                e.Cancel = true;
                this.Hide(); // Versteckt das Formular
            }
        }




        public event EventHandler MapButtonClicked;

        protected virtual void OnMapButtonClicked()
        {
            MapButtonClicked?.Invoke(this, EventArgs.Empty);
        }

        private void ProgressBar1_Click(object sender, EventArgs e)
        {

        }


        private void Akquise_Load(object sender, EventArgs e)
        {

        }

        private void ZieAd_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void StaAd_TextChanged(object sender, EventArgs e)
        {

        }

        private void AdGo_Click(object sender, EventArgs e)
        {

        }
        private void AdGo_TextChanged(object sender, EventArgs e)
        {

        }


        private void FilSch_Click(object sender, EventArgs e)
        {
            Liste.Instance.SaveAllListeData();
            Liste.Instance.LoadAllListeData();
            // Versteckt Akquise anstatt sie zu schließen
            this.Hide();
        }


        

        private void DatTransF1_Paint(object sender, PaintEventArgs e)
        {

        }

        private void ReCh_Click(object sender, EventArgs e)
        {
            Liste.Instance.isReChActivated = true;

            // Clear StaAd before adding new data
            StaAd.Clear();

            // Retrieve all row data that have the tag "Zunahe" or "Offen"
            var addresses = Liste.Instance.GetAllListeRowData()
                .Where(row => row.Zunahe || row.Offen || row.ErsteMail) // Selects rows that are either "Zunahe" or "Offen"
                .Select(row => $"{row.Firma}; {row.Adresse}")
                .ToList();

            // Add each formatted address to StaAd
            foreach (string address in addresses)
            {
                CleanAddress(address);
                string formattedAddress = address.Replace("\n", " ").Replace("\r", " ");
                StaAd.AppendText(formattedAddress + Environment.NewLine);
            }



        }


        private void Filter_Paint(object sender, PaintEventArgs e)
        {

        }
    }

}
