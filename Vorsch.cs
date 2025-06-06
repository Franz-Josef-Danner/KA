// Vorst.cs
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using System.Text;
using System.Net.Mail;
using System.Net;



namespace res_format
{
    public partial class Vorsch : Form
    {
        private List<string> schauspielerAuto = new List<string>();
        private List<StueckeRowData> _stueckeData;
        private int initialMitfahrerAnzahl = 6;
        private WebView2 webView;
        private Dictionary<string, List<string>> driverPassengers; // Class-level variable
        public event EventHandler DataSaved;
        private string _mitfahrer;
        private string _regie;
        private string _fahrermitfahrer;
        private string _schauspielerundRollen;
        public string Stuecklist;



        public Vorsch()
        {
            InitializeComponent();
            this.Load += async (sender, e) => await Vorst_Load(sender, e); // Update the event handler
            abendRegieSet = new HashSet<string>();


            MitLabel.TextChanged += MitLabel_TextChanged;
            driverPassengers = new Dictionary<string, List<string>>();

            // webview2 initialization
            webView = new WebView2
            {
                Dock = DockStyle.Fill
            };
            Controls.Add(webView);

        }



        public async Task SetValue(string stueck, string regie, string schauspielerundRollen, string mitfahrer, string driverPassengers)
        {
            // StueckeListBox_SelectedIndexChanged deaktivieren
            StueckeListBox.SelectedIndexChanged -= StueckeListBox_SelectedIndexChanged;

            _schauspielerundRollen = schauspielerundRollen;
            _mitfahrer = mitfahrer;
            _regie = regie;


            Label[] rollenLabels = new[] { Rolle1, Rolle2, Rolle3, Rolle4, Rolle5, Rolle6 };
            // Holen der RolleCombo-Comboboxen
            ComboBox[] comboBoxes = new[] { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };
            // Holen der MitfahrCombo-Comboboxen
            ComboBox[] mitfahrCombos = new[] { MitfahrCombo1, MitfahrCombo2, MitfahrCombo3, MitfahrCombo4, MitfahrCombo5, MitfahrCombo6 };

            // schauspielerundRollen bei | splitten und in string[] parts speichern
            string[] partslabel = schauspielerundRollen.Split('|');
            // alles nach dem : in partslabel Löschen
            for (int i = 0; i < partslabel.Length; i++)
            {
                if (partslabel[i].Contains(":"))
                {
                    partslabel[i] = partslabel[i].Substring(0 ,partslabel[i].IndexOf(":")).Trim();
                }
            }
            // partslabel in den rollenlabels einfügen
            for (int i = 0; i < partslabel.Length && i < rollenLabels.Length; i++)
            {
                rollenLabels[i].Text = partslabel[i];
            }



            string stueckeDataPath = @"F:\StagOrg\VS\res format\json\res_format_StueckeData.json";
            if (File.Exists(stueckeDataPath))
            {
                string stueckeJson = File.ReadAllText(stueckeDataPath);
                List<StueckeRowData> stueckeData = JsonConvert.DeserializeObject<List<StueckeRowData>>(stueckeJson);
                await LoadStueckeNamen(stueckeData);

            }
            else
            {
                MessageBox.Show("Fehler beim Lesen der Datei.");
            }

            StueckeListBox.SelectedItem = stueck;
            await Task.Delay(200);
            string[] parts = schauspielerundRollen.Split('|');
            for (int i = 0; i < parts.Length && i < comboBoxes.Length; i++)
            {
                string part = parts[i];
                // Remove everything before ';'
                int semicolonIndex = part.IndexOf(';');
                if (semicolonIndex >= 0)
                {
                    part = part.Substring(semicolonIndex + 1);
                }
                // Split by ',' and add to ComboBox
                string[] items = part.Split(',');
                comboBoxes[i].Items.Clear();
                comboBoxes[i].Items.AddRange(items.Select(item => item.Trim()).ToArray());
            }


            for (int i = 0; i < parts.Length && i < comboBoxes.Length; i++)
            {
                string part = parts[i];

                // Remove everything before ';'
                int semicolonIndex = part.IndexOf(':');
                if (semicolonIndex >= 0)
                {
                    part = part.Substring(semicolonIndex + 1);
                    int semicolonIndex2 = part.IndexOf(';');
                    if (semicolonIndex2 >= 0)
                    {
                        part = part.Substring(0, semicolonIndex2).Trim();

                    }

                }
                // part in comboBoxes suchen und auswählen
                for (int j = 0; j < comboBoxes[i].Items.Count; j++)
                {
                    if (comboBoxes[i].Items[j].ToString() == part)
                    {
                        comboBoxes[i].SelectedIndex = j;
                    }
                }
            }

            // regie bei ; splitten und in regiebox einfügen
            string[] parts2 = regie.Split(';');

            string[] regieaus = parts2[0].Split(':');

            string abendregie = parts2[1];

            string[] abendregieParts = abendregie.Split(',');
            for (int i = 0; i < abendregieParts.Length; i++)
            {
                RegieBox.Items.Add(abendregieParts[i].Trim());
            }

            
            await Task.Delay(200);
            if (RegieBox.Items.Contains(regieaus[0]))
            {
                RegieBox.SelectedItem = regieaus[0];
            }
            else
            {
                MessageBox.Show("Regie nicht gefunden.");
            }
            // alles ab string regie in driverPassengersString löschen

            string[] parts3 = driverPassengers.Split(';');
            for (int i = 0; i < parts3.Length; i++)
            {
                if (parts3[i].Contains(":"))
                {
                    parts3[i] = parts3[i].Substring(0, parts3[i].IndexOf(":")).Trim();
                    for (int j = 0; j < comboBoxes.Length; j++)
                    {
                        if (comboBoxes[j].Items.Contains(parts3[i]))
                        {
                            CheckBox checkBox = Controls.Find($"Fahrer{j + 1}", true).FirstOrDefault() as CheckBox;
                            checkBox.Visible = true;
                            checkBox.Checked = true;
                            ComboBox mitfahrCombo = Controls.Find($"MitfahrCombo{j + 1}", true).FirstOrDefault() as ComboBox;
                            mitfahrCombo.Visible = true;
                        }
                    }
                }
            }
            
            string[] parts5 = mitfahrer.Split(',');
            // klammern mit , ersetzen
            for (int i = 0; i < parts5.Length; i++)
            {
                parts5[i] = parts5[i].Replace("(", ":").Replace(")", "").Trim();
                for (int j = 0; j < comboBoxes.Length; j++)
                {
                    if (comboBoxes[j].Items.Contains(parts5[i].Split(':')[0].Trim()))
                    {
                        ComboBox mitfahrCombo = Controls.Find($"MitfahrCombo{j + 1}", true).FirstOrDefault() as ComboBox;
                        if (mitfahrCombo.Visible)
                        {
                            mitfahrCombo.Items.Clear();
                            for (int k = 1; k <= int.Parse(parts5[i].Split(':')[1].Trim()); k++)
                            {
                                mitfahrCombo.Items.Add(k.ToString());
                            }
                            mitfahrCombo.SelectedIndex = mitfahrCombo.Items.Count - 1;

                        }

                    }
                }
            }

            string[] mitfahrerParts = mitfahrer.Split(',');

            foreach (var comboBox in comboBoxes)
            {
                // Set the DrawMode to OwnerDrawFixed to allow custom drawing
                comboBox.DrawMode = DrawMode.OwnerDrawFixed;

                // Attach the DrawItem event handler
                comboBox.DrawItem += (s, ev) =>
                {
                    ev.DrawBackground();

                    if (ev.Index >= 0)
                    {
                        string itemText = comboBox.Items[ev.Index].ToString();
                        bool isInMitfahrer = mitfahrerParts.Any(p => p.Contains(itemText));

                        if (isInMitfahrer)
                        {
                            ev.Graphics.FillRectangle(Brushes.Green, ev.Bounds);
                            ev.Graphics.DrawString(itemText, ev.Font, Brushes.White, ev.Bounds);
                        }
                        else
                        {
                            ev.Graphics.DrawString(itemText, ev.Font, Brushes.Black, ev.Bounds);
                        }

                        ev.DrawFocusRectangle();
                    }
                };
            }
            StueckeListBox.SelectedIndexChanged += StueckeListBox_SelectedIndexChanged;

            await Task.Delay(100);
            // Here is the new logic to select the appropriate number in the MitfahrCombos based on DriverPassengers
            string[] driverPassengerParts = driverPassengers.Split(';');
            for (int i = 0; i < driverPassengerParts.Length; i++)
            {
                string[] dripa = driverPassengerParts[i].Split(':');
                string driver = dripa[0].Trim();
                string passengers = dripa[1].Trim();
                for (int j = 0; j < comboBoxes.Length; j++)
                {
                    // was vor : ist wird in den rollenboxen gesucht und was nach : wird in den mitfahrcombos gesucht und ausgewählt
                    if (comboBoxes[j].Items.Contains(driver))
                    {
                        ComboBox mitfahrCombo = Controls.Find($"MitfahrCombo{j + 1}", true).FirstOrDefault() as ComboBox;
                        if (mitfahrCombo != null)
                        {
                            mitfahrCombo.SelectedIndex = mitfahrCombo.Items.IndexOf(passengers);
                        }
                    }
                }
            }
            // StueckeListBox_SelectedIndexChanged aktivieren


            
            Checkbutton_Click(null, null);
            
        }



        private async Task Vorst_Load(object sender, EventArgs e) // Make the method async
        {
            UpdateFahrerUndMitfahrerStrings();
            await InitializeWebView2Async();
            LoadInitialMap();
        }

        private void MitLabel_TextChanged(object sender, EventArgs e)
        {
            UpdateMitfahrCombo7();
        }


        private void UpdateMitfahrCombo7()
        {
            if (MitfahrCombo7 != null)
            {
                // Clear the items
                MitfahrCombo7.Items.Clear();

                // Extract the number from MitLabel
                string mitfahrerText = MitLabel.Text.Split(':')[1].Trim();

                // die Anzahl der Mitfahrer aus MitLabel extrahieren und die zahlen von 1 bis zur Anzahl der Mitfahrer in MitfahrCombo7 hinzufügen
                if (int.TryParse(mitfahrerText, out int mitfahrerAnzahl))
                {
                    for (int i = 1; i <= mitfahrerAnzahl; i++)
                    {
                        MitfahrCombo7.Items.Add(i.ToString());
                    }
                }
                // die höchste Anzahl der Mitfahrer in MitfahrCombo7 auswählen, falls vorhanden
                if (MitfahrCombo7.Items.Count > 0)
                {
                    MitfahrCombo7.SelectedIndex = MitfahrCombo7.Items.Count - 1;
                }
            }
        }

        private void LoadInitialMap()
        {
            string apiKey = "AIzaSyC82aoSWfXJwJOqJgSCMt8V4CQcn31VE_4"; // Replace with your actual API key

            string mapHtml = $@"
<!DOCTYPE html>
<html>
<head>
    <meta name='viewport' content='initial-scale=1.0, user-scalable=no'>
    <meta charset='utf-8'>
    <title>Simple Map</title>
    <style>
        #map {{
            height: 100%;
        }}
        html, body {{
            height: 100%;
            margin: 0;
            padding: 0;
        }}
    </style>
    <script src='https://maps.googleapis.com/maps/api/js?key={apiKey}&libraries=places,directions'></script>
    <script>
        var map;

        function initMap() {{
            var location = {{ lat: 48.210033, lng: 16.363449 }}; // Replace with your coordinates
            map = new google.maps.Map(document.getElementById('map'), {{
                zoom: 12,
                center: location
            }});
        }}

        window.onload = initMap;
    </script>
</head>
<body>
    <div id='map'></div>
</body>
</html>";

            webView2.NavigateToString(mapHtml);
        }

        private async Task InitializeWebView2Async()
        {
            await webView2.EnsureCoreWebView2Async(null);
        }

        private void LoadMap(Dictionary<string, string> schauspielerAddresses, Dictionary<string, List<string>> driverPassengers, string locationAddress)
        {
            string apiKey = "AIzaSyC82aoSWfXJwJOqJgSCMt8V4CQcn31VE_4"; // Replace with your actual API key
            StringBuilder markersScript = new StringBuilder();
            StringBuilder directionsScript = new StringBuilder();

            foreach (var driver in driverPassengers)
            {
                if (IsValidAddress(schauspielerAddresses[driver.Key]))
                {
                    markersScript.AppendLine($@"
            geocodeAddress('{schauspielerAddresses[driver.Key]}', '{driver.Key}');
        ");

                    foreach (var passenger in driver.Value)
                    {
                        if (schauspielerAddresses.ContainsKey(passenger) && IsValidAddress(schauspielerAddresses[passenger]))
                        {
                            markersScript.AppendLine($@"
                geocodeAddress('{schauspielerAddresses[passenger]}', '{passenger}');
            ");
                            directionsScript.AppendLine($@"
                drawPolyline('{schauspielerAddresses[passenger]}', '{schauspielerAddresses[driver.Key]}');
            ");
                        }
                        else
                        {
                            Console.WriteLine($"Invalid or missing address for passenger: {passenger}");
                        }
                    }
                    directionsScript.AppendLine($@"
            calculateAndDisplayRoute('{schauspielerAddresses[driver.Key]}', '{locationAddress}', true, 'driving');
        ");
                }
                else
                {
                    Console.WriteLine($"Invalid address for driver: {driver.Key}");
                }
            }

            if (IsValidAddress(locationAddress))
            {
                markersScript.AppendLine($@"
        geocodeAddress('{locationAddress}', 'Location');
    ");
            }
            else
            {
                Console.WriteLine("Invalid location address");
            }

            string mapHtml = $@"
<!DOCTYPE html>
<html>
<head>
    <meta name='viewport' content='initial-scale=1.0, user-scalable=no'>
    <meta charset='utf-8'>
    <title>Simple Map</title>
    <style>
        #map {{
            height: 100%;
        }}
        html, body {{
            height: 100%;
            margin: 0;
            padding: 0;
        }}
    </style>
    <script src='https://maps.googleapis.com/maps/api/js?key={apiKey}&libraries=places,directions'></script>
    <script>
        var map;
        var directionsService;

        function initMap() {{
            var location = {{ lat: 48.210033, lng: 16.363449 }}; // Replace with your coordinates
            map = new google.maps.Map(document.getElementById('map'), {{
                zoom: 12,
                center: location
            }});
            directionsService = new google.maps.DirectionsService();
            {markersScript}
            {directionsScript}
        }}

        function geocodeAddress(address, title) {{
            if (!address || address.trim() === '') {{
                console.error('Geocode was not successful for the following reason: INVALID_REQUEST');
                console.log('Failed address: ' + address);
                return;
            }}
            console.log('Geocoding address: ' + address + ' with title: ' + title);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({{ 'address': address, 'region': 'AT' }}, function(results, status) {{
                if (status === 'OK') {{
                    console.log('Geocode success for address: ' + address + ', results: ' + JSON.stringify(results));
                    var marker = new google.maps.Marker({{
                        map: map,
                        position: results[0].geometry.location,
                        title: title
                    }});
                    var infowindow = new google.maps.InfoWindow({{
                        content: '<b>' + title + '</b><br>' + results[0].formatted_address
                    }});
                    marker.addListener('click', function() {{
                        infowindow.open(map, marker);
                    }});
                }} else {{
                    console.error('Geocode was not successful for the following reason: ' + status);
                    console.log('Failed address: ' + address);
                }}
            }});
        }}

        function drawPolyline(origin, destination) {{
            if (!origin || origin.trim() === '' || !destination || destination.trim() === '') {{
                console.error('Invalid polyline request: origin or destination is empty');
                return;
            }}
            console.log('Drawing polyline from origin: ' + origin + ' to destination: ' + destination);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({{ 'address': origin, 'region': 'AT' }}, function(results, status) {{
                if (status === 'OK') {{
                    var originLatLng = results[0].geometry.location;
                    geocoder.geocode({{ 'address': destination, 'region': 'AT' }}, function(results, status) {{
                        if (status === 'OK') {{
                            var destinationLatLng = results[0].geometry.location;
                            var polyline = new google.maps.Polyline({{
                                path: [originLatLng, destinationLatLng],
                                geodesic: true,
                                strokeColor: '#FF0000',
                                strokeOpacity: 1.0,
                                strokeWeight: 2
                            }});
                            polyline.setMap(map);
                        }} else {{
                            console.error('Geocode for destination was not successful for the following reason: ' + status);
                            console.log('Failed destination address: ' + destination);
                        }}
                    }});
                }} else {{
                    console.error('Geocode for origin was not successful for the following reason: ' + status);
                    console.log('Failed origin address: ' + origin);
                }}
            }});
        }}

        function calculateAndDisplayRoute(origin, destination, suppressMarkers, mode) {{
            if (!origin || origin.trim() === '' || !destination || destination.trim() === '') {{
                console.error('Invalid route request: origin or destination is empty');
                return;
            }}
            var directionsRenderer = new google.maps.DirectionsRenderer({{ suppressMarkers: suppressMarkers }});
            directionsRenderer.setMap(map);

            directionsService.route(
                {{
                    origin: origin,
                    destination: destination,
                    travelMode: mode.toUpperCase()
                }},
                function(response, status) {{
                    if (status === 'OK') {{
                        directionsRenderer.setDirections(response);
                    }} else {{
                        console.error('Directions request failed due to ' + status);
                        console.log('Route request from: ' + origin + ' to: ' + destination);
                    }}
                }}
            );
        }}

        window.onload = initMap;
    </script>
</head>
<body>
    <div id='map'></div>
</body>
</html>";

            webView2.NavigateToString(mapHtml);
        }

        private bool IsValidAddress(string address)
        {
            // Validate address: must contain at least a street and city
            return !string.IsNullOrEmpty(address) && address.Split(',').Length >= 2;
        }

        private void UpdateMitLabel()
        {
            int totalSelected = 0;
            totalSelected += GetSelectedValueFromComboBox(MitfahrCombo1);
            totalSelected += GetSelectedValueFromComboBox(MitfahrCombo2);
            totalSelected += GetSelectedValueFromComboBox(MitfahrCombo3);
            totalSelected += GetSelectedValueFromComboBox(MitfahrCombo4);
            totalSelected += GetSelectedValueFromComboBox(MitfahrCombo5);
            totalSelected += GetSelectedValueFromComboBox(MitfahrCombo6);

            int driversChecked = 0;
            if (Fahrer1.Checked) driversChecked++;
            if (Fahrer2.Checked) driversChecked++;
            if (Fahrer3.Checked) driversChecked++;
            if (Fahrer4.Checked) driversChecked++;
            if (Fahrer5.Checked) driversChecked++;
            if (Fahrer6.Checked) driversChecked++;

            int remainingMitfahrer = initialMitfahrerAnzahl - totalSelected - driversChecked;
            MitLabel.Text = $"Mitfahrer: {remainingMitfahrer}";

            UpdateFahrerUndMitfahrerStrings(); // Ensure `UpdateFahrerUndMitfahrerStrings` is called whenever `MitLabel` updates
        }

        private int GetSelectedValueFromComboBox(ComboBox comboBox)
        {
            if (comboBox.SelectedItem != null && int.TryParse(comboBox.SelectedItem.ToString(), out int selectedValue))
            {
                return selectedValue;
            }
            return 0;
        }

        private async Task<T> LoadJsonDataAsync<T>(string filePath)
        {
            if (!File.Exists(filePath))
                throw new FileNotFoundException($"File not found: {filePath}");

            var jsonData = await Task.Run(() => File.ReadAllText(filePath));
            return JsonConvert.DeserializeObject<T>(jsonData);
        }

        private async Task LoadDataAsync()
        {
            string schauDataPath = @"F:\StagOrg\VS\res format\json\res_format_SchauData.json";
            string vorschDataPath = @"F:\StagOrg\VS\res format\json\res_format_VorschData.json";

            List<SchauspielerData> schauspielerData = await LoadJsonDataAsync<List<SchauspielerData>>(schauDataPath);
            List<VorschRowData> vorschData = await LoadJsonDataAsync<List<VorschRowData>>(vorschDataPath);

            // Additional processing of loaded data
        }

        private async Task HandleComboBoxSelectionChanged(int comboIndex, ComboBox comboBox, CheckBox checkBox, string identifier)
        {
            await Task.Delay(100); // Add a delay to ensure the UI is updated before processing
            UpdateRegieBoxItems();
            // wenn AuswahlBox leer ist, dann return
            if (string.IsNullOrEmpty(AuswahlBox.Text))
            {
                string[] parts = _mitfahrer.Split(',').Select(p => p.Split('(')[0].Trim()).ToArray();
                // suchen nach dem schauspieler in parts und wenn er gefunden wurde die checkbox sichtbar machen
                if (comboBox.SelectedItem != null && parts.Contains(comboBox.SelectedItem.ToString()))
                {
                    checkBox.Visible = true;
                }
                else
                {
                    checkBox.Visible = false;
                    checkBox.Checked = false;
                }
                
            }
            else
            {
                if (comboBox.SelectedItem != null && schauspielerAuto.Contains(comboBox.SelectedItem.ToString()))
                {
                    checkBox.Visible = true;
                }
                else
                {
                    checkBox.Visible = false;
                    checkBox.Checked = false;
                }
            }
        }

        public async Task LoadStueckeNamen(List<StueckeRowData> stueckeData)
        {
            _stueckeData = stueckeData;
            StueckeListBox.Items.Clear();
            foreach (StueckeRowData stueck in stueckeData)
            {
                _ = StueckeListBox.Items.Add(stueck.StueckeName);
            }

            string selectedStueck = StueckBox.Text;
            if (!string.IsNullOrEmpty(selectedStueck))
            {
                StueckeListBox.SelectedItem = selectedStueck;
            }
        }

        public void SetStueckBoxText(string text)
        {
            StueckBox.Text = text;
        }

        private void OKbutton_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(AuswahlBox.Text))
            {

                string email = "";
                List<string> MailBesetz = new List<string>();

                // Rollen und Schauspieler extrahieren
                string SchauspielerundRollen = Rolle1.Text + ": " + RolleCombo1.SelectedItem + ";" + RolleCombo1.Items.Cast<object>().Aggregate("", (current, item) => current + item.ToString() + ", ") + "|" +
                                               Rolle2.Text + ": " + RolleCombo2.SelectedItem + ";" + RolleCombo2.Items.Cast<object>().Aggregate("", (current2, item2) => current2 + item2.ToString() + ", ") + "|" +
                                               Rolle3.Text + ": " + RolleCombo3.SelectedItem + ";" + RolleCombo3.Items.Cast<object>().Aggregate("", (current3, item3) => current3 + item3.ToString() + ", ") + "|" +
                                               Rolle4.Text + ": " + RolleCombo4.SelectedItem + ";" + RolleCombo4.Items.Cast<object>().Aggregate("", (current4, item4) => current4 + item4.ToString() + ", ") + "|" +
                                               Rolle5.Text + ": " + RolleCombo5.SelectedItem + ";" + RolleCombo5.Items.Cast<object>().Aggregate("", (current5, item5) => current5 + item5.ToString() + ", ") + "|" +
                                               Rolle6.Text + ": " + RolleCombo6.SelectedItem + ";" + RolleCombo6.Items.Cast<object>().Aggregate("", (current6, item6) => current6 + item6.ToString() + ", ");
                SchauspielerundRollen = SchauspielerundRollen.Replace(", |", "|").Replace(", ,", ",").TrimEnd(',');
                // letztes Komma in SchauspielerundRollen löschen
                SchauspielerundRollen = SchauspielerundRollen.Substring(0, SchauspielerundRollen.LastIndexOf(','));
                
                // Entpacken der schauData.json Datei
                string schauDataPath = @"F:\StagOrg\VS\res format\json\res_format_SchauData.json";
                if (File.Exists(schauDataPath))
                {
                    string schauJson = File.ReadAllText(schauDataPath);
                    List<SchauspielerData> schauDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(schauJson);

                    // Suchen nach den Schauspielern und deren Mailadresse in MailBesetz speichern
                    foreach (var schauData in schauDataList)
                    {
                        if (schauData != null)
                        {
                            foreach (var rolle in new[] { RolleCombo1.SelectedItem, RolleCombo2.SelectedItem, RolleCombo3.SelectedItem, RolleCombo4.SelectedItem, RolleCombo5.SelectedItem, RolleCombo6.SelectedItem })
                            {
                                if (rolle != null && schauData.Schauspieler.Contains(rolle.ToString()))
                                {
                                    MailBesetz.Add(schauData.SchauEmail);
                                }
                            }
                        }
                    }
                }
                else
                {
                    MessageBox.Show($"File not found: {schauDataPath}", "File Not Found", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }


                // Extract and format driver and passenger data
                string fahrermitfahrerData = _fahrermitfahrer;
                // spliten bei jedem zeilenende
                string[] parts = fahrermitfahrerData.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
                string[] fahrermitfahrer = fahrermitfahrerData.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
                // alles was vor : ist löschen
                for (int i = 0; i < parts.Length; i++)
                {
                    if (parts[i].Contains(":"))
                    {
                        parts[i] = parts[i].Substring(parts[i].IndexOf(":") + 1).Trim();
                    }
                }
                // doppelte löschen
                parts = parts.Distinct().ToArray();
                
                // hier die gewünschte formatierung fahrer1: mitfahrer1, mitfahrer2, mitfahrer3 new line fahrer2: mitfahrer1, mitfahrer2, mitfahrer3 new line usw. keine doppleten fahrer
                // die fahrer sind in parts und die mitfahrer samt fahrer in fahrermitfahrer, mit doppelten einträgen der fahrer
                string FahrMit = string.Empty;
                for (int i = 0; i < parts.Length; i++)
                {
                    string driver = parts[i];
                    string passengers = string.Join(", ", fahrermitfahrer.Where(p => p.Contains(driver)).Select(p => p.Replace(driver, "").Replace(":", "").Trim()));
                    FahrMit += $"{driver}: {passengers}{Environment.NewLine}";
                }

                FahrMit = FahrMit.TrimEnd(Environment.NewLine.ToCharArray());

                string mailSubject1 = $"wir spielen in {LokationBox.Text}, am {DatumBox.Text}";
                string mailText1 = $@"
Hallo Meine Lieben

Wir spielen in {LokationBox.Text}, am {DatumBox.Text} um {ZeitBox.Text}.

Hier die Besetzung:
{RolleCombo1.SelectedItem}: {Rolle1.Text}
{RolleCombo2.SelectedItem}: {Rolle2.Text}
{RolleCombo3.SelectedItem}: {Rolle3.Text}
{RolleCombo4.SelectedItem}: {Rolle4.Text}
{RolleCombo5.SelectedItem}: {Rolle5.Text}
{RolleCombo6.SelectedItem}: {Rolle6.Text}

Regie: {RegieBox.SelectedItem}

Fahrer und Mitfahrer:

{FahrMit}

Ihr könnt natürlich selbst eine andere Mitfahrt organisieren.

Liebe Grüße
Das Dinnerleichen Team
";

                SmtpClient smtp1 = new SmtpClient("smtp.world4you.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("danner@stagedive.at", "92J4WGosyurRt"),
                    EnableSsl = true
                };

                foreach (var recipient in MailBesetz)
                {
                    try
                    {
                        MailMessage mail = new MailMessage
                        {
                            From = new MailAddress("spielen@stagedive.at"),
                            Subject = mailSubject1,
                            Body = mailText1,
                            IsBodyHtml = false // Set to true if the email body contains HTML
                        };

                        mail.To.Add(recipient);

                        smtp1.Send(mail);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show($"Fehler beim Senden der E-Mail an {recipient}: {ex.Message}", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
                MessageBox.Show($"E-Mail erfolgreich gesendet!", "Erfolg", MessageBoxButtons.OK, MessageBoxIcon.Information);
                

                DataSaved?.Invoke(this, EventArgs.Empty); // Löst das DataSaved Ereignis aus, wenn vorhanden

                // Das Setzen des DialogResult auf OK wird das Formular schließen
                DialogResult = DialogResult.OK;
                
            }
            else
            {

                string[] Teile = LokationBox.Text.Split(';');
                if (Teile.Length == 0)
                {
                    MessageBox.Show("Ungültige LokationBox-Eingabe.");
                    return;
                }

                string auswahl = AuswahlBox.Text;
                string Firma = Teile[0];
                string BesetzungDataPath = $@"F:\StagOrg\VS\res format\json\Firmen\{Firma}\Organ\{auswahl}.json";
                string ftpdel1 = auswahl + "_" + Firma;
                string ftpdel = RemoveUmlautsAndSpecialCharacters(ftpdel1);

                string[] rollen = new string[6];
                for (int i = 0; i < 6; i++)
                {
                    ComboBox comboBox = Controls.Find($"RolleCombo{i + 1}", true).FirstOrDefault() as ComboBox;
                    rollen[i] = comboBox?.SelectedItem?.ToString();
                }

                

                

                List<string> schauspielerAuto = new List<string>();
                List<string> mitfahrer = new List<string>();
                if (File.Exists(BesetzungDataPath))
                {
                    string stueckeJson = File.ReadAllText(BesetzungDataPath);
                    List<BesetzungData> stueckeDataList = JsonConvert.DeserializeObject<List<BesetzungData>>(stueckeJson);

                    schauspielerAuto = stueckeDataList
                        .Where(data2 => data2.Auto?.ToLower() == "true")
                        .Select(data2 => data2.Schauspieler)
                        .ToList();

                    mitfahrer = stueckeDataList
                        .Where(data2 => data2.Auto?.ToLower() == "true")
                        .Select(data2 => data2.Mitfahrer)
                        .ToList();
                }

                string mitfahren = string.Join(", ", schauspielerAuto.Zip(mitfahrer, (s, m) => $"{s} ({m})"));

                string rollenString = string.Join(", ", rollen.Where(r => !string.IsNullOrEmpty(r)));

                ComboBox[] comboBoxes = new[] { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };
                ComboBox[] mitfahrCombos = new[] { MitfahrCombo1, MitfahrCombo2, MitfahrCombo3, MitfahrCombo4, MitfahrCombo5, MitfahrCombo6 };
                CheckBox[] checkBoxes = new[] { Fahrer1, Fahrer2, Fahrer3, Fahrer4, Fahrer5, Fahrer6 };

                string driverPassengers = string.Empty;

                for (int i = 0; i < comboBoxes.Length; i++)
                {
                    if (checkBoxes[i].Checked)
                    {
                        string driver = comboBoxes[i].SelectedItem?.ToString();
                        string passengers = mitfahrCombos[i].SelectedItem?.ToString();
                        if (!string.IsNullOrEmpty(driver) && !string.IsNullOrEmpty(passengers))
                        {
                            string driverPassenger = $"{driver}: {passengers}; ";
                            driverPassengers += $"{driverPassenger}";
                        }
                    }
                }
                // hollen des geasmten inhalts von RegieBox
                string regie = RegieBox.Items.Cast<string>().Aggregate((a, b) => $"{a}, {b}");

                SaveData newData = new SaveData
                {
                    Lokation = LokationBox.Text,
                    Datum = DatumBox.Text,
                    Zeit = ZeitBox.Text,
                    Stueck = StueckeListBox.SelectedItem?.ToString(),
                    SchauspielerundRollen = string.Join("|", new List<string>
        {
            $"{Rolle1.Text}: {RolleCombo1.SelectedItem};{string.Join(", ", RolleCombo1.Items.Cast<string>())}",
            $"{Rolle2.Text}: {RolleCombo2.SelectedItem};{string.Join(", ", RolleCombo2.Items.Cast<string>())}",
            $"{Rolle3.Text}: {RolleCombo3.SelectedItem};{string.Join(", ", RolleCombo3.Items.Cast<string>())}",
            $"{Rolle4.Text}: {RolleCombo4.SelectedItem};{string.Join(", ", RolleCombo4.Items.Cast<string>())}",
            $"{Rolle5.Text}: {RolleCombo5.SelectedItem};{string.Join(", ", RolleCombo5.Items.Cast<string>())}",
            $"{Rolle6.Text}: {RolleCombo6.SelectedItem};{string.Join(", ", RolleCombo6.Items.Cast<string>())}"
        }),
                    Regie = RegieBox.SelectedItem?.ToString() + "; " + regie,
                    DriverPassengers = driverPassengers,
                    Mitfahrer = mitfahren
                };

                string vorschDataPath = @"F:\StagOrg\VS\res format\json\res_format_VorschData.json";
                List<SaveData> vorschDataList = new List<SaveData>();

                if (File.Exists(vorschDataPath))
                {
                    string vorschJson = File.ReadAllText(vorschDataPath);
                    if (!string.IsNullOrEmpty(vorschJson.Trim()))
                    {
                        vorschDataList = JsonConvert.DeserializeObject<List<SaveData>>(vorschJson);
                    }
                }

                vorschDataList.Add(newData);
                string updatedVorschJson = JsonConvert.SerializeObject(vorschDataList, Formatting.Indented);
                File.WriteAllText(vorschDataPath, updatedVorschJson);

                if (File.Exists(vorschDataPath))
                {
                    MessageBox.Show("Daten erfolgreich gespeichert.");
                }
                else
                {
                    MessageBox.Show("Fehler beim Speichern der Daten.");
                    return;
                }
                
                // Löschen der alten Datei
                if (File.Exists(BesetzungDataPath))
                {
                    File.Delete(BesetzungDataPath);
                }
                else
                {
                    MessageBox.Show("Fehler beim Löschen der Datei.");
                    return;
                }
                
                string email = "";
                List<string> MailBesetz = new List<string>();

                if (File.Exists(BesetzungDataPath))
                {
                    email = string.Join(RolleCombo1.SelectedItem.ToString(), RolleCombo2.SelectedItem.ToString(), RolleCombo3.SelectedItem.ToString(), RolleCombo4.SelectedItem.ToString(), RolleCombo5.SelectedItem.ToString(), RolleCombo6.SelectedItem.ToString());
                    string schauspielerJson = File.ReadAllText(BesetzungDataPath);
                    List<BesetzungData> schauspielerDataList = JsonConvert.DeserializeObject<List<BesetzungData>>(schauspielerJson);
                    List<string> schauspielerAusBesetzung = schauspielerDataList
                        .Where(data => email.Contains(data.Schauspieler))
                        .Select(data => $"{data.Email}")
                        .ToList();

                    MailBesetz = schauspielerAusBesetzung;
                }

                // Extract and format driver and passenger data
                string fahrermitfahrerData = _fahrermitfahrer;
                // spliten bei jedem zeilenende
                string[] parts = fahrermitfahrerData.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
                string[] fahrermitfahrer = fahrermitfahrerData.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
                // alles was vor : ist löschen
                for (int i = 0; i < parts.Length; i++)
                {
                    if (parts[i].Contains(":"))
                    {
                        parts[i] = parts[i].Substring(parts[i].IndexOf(":") + 1).Trim();
                    }
                }
                // doppelte löschen
                parts = parts.Distinct().ToArray();

                // hier die gewünschte formatierung fahrer1: mitfahrer1, mitfahrer2, mitfahrer3 new line fahrer2: mitfahrer1, mitfahrer2, mitfahrer3 new line usw. keine doppleten fahrer
                // die fahrer sind in parts und die mitfahrer samt fahrer in fahrermitfahrer, mit doppelten einträgen der fahrer
                string FahrMit = string.Empty;
                for (int i = 0; i < parts.Length; i++)
                {
                    string driver = parts[i];
                    string passengers = string.Join(", ", fahrermitfahrer.Where(p => p.Contains(driver)).Select(p => p.Replace(driver, "").Replace(":", "").Trim()));
                    FahrMit += $"{driver}: {passengers}{Environment.NewLine}";
                }

                FahrMit = FahrMit.TrimEnd(Environment.NewLine.ToCharArray());

                

                string mailSubject = $"wir spielen in {LokationBox.Text}, am {DatumBox.Text}";
                string mailText = $@"
Hallo Meine Lieben

Wir spielen in {LokationBox.Text}, am {DatumBox.Text} um {ZeitBox.Text}.

Hier die Besetzung:
{RolleCombo1.SelectedItem}: {Rolle1.Text}
{RolleCombo2.SelectedItem}: {Rolle2.Text}
{RolleCombo3.SelectedItem}: {Rolle3.Text}
{RolleCombo4.SelectedItem}: {Rolle4.Text}
{RolleCombo5.SelectedItem}: {Rolle5.Text}
{RolleCombo6.SelectedItem}: {Rolle6.Text}

Regie: {RegieBox.SelectedItem}

Fahrer und Mitfahrer:

{FahrMit}

Ihr könnt natürlich selbst eine andere Mitfahrt organisieren.

Liebe Grüße
Das Dinnerleichen Team


";

                SmtpClient smtp = new SmtpClient("smtp.world4you.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("danner@stagedive.at", "92J4WGosyurRt"),
                    EnableSsl = true
                };

                foreach (var recipient in MailBesetz)
                {
                    try
                    {
                        MailMessage mail = new MailMessage
                        {
                            From = new MailAddress("spielen@stagedive.at"),
                            Subject = mailSubject,
                            Body = mailText,
                            IsBodyHtml = false // Set to true if the email body contains HTML
                        };

                        mail.To.Add(recipient);

                        smtp.Send(mail);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show($"Fehler beim Senden der E-Mail an {recipient}: {ex.Message}", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
                MessageBox.Show($"E-Mail erfolgreich gesendet!", "Erfolg", MessageBoxButtons.OK, MessageBoxIcon.Information);

                Liste.Instance.UpdateVorschListeData();
                Liste.Instance.UpdatePlanListeData();

                string ftpPath = "ftp://ftp.world4you.com/wp-content/uploads/Schauspieler/";
                string ftpUser = "ftp8596592";
                string ftpPassword = "m8&fCsH#Mt7FYsxT";

                try
                {
                    // Create FTP request to list directory contents
                    FtpWebRequest request = (FtpWebRequest)WebRequest.Create(ftpPath);
                    request.Method = WebRequestMethods.Ftp.ListDirectory;
                    request.Credentials = new NetworkCredential(ftpUser, ftpPassword);
                    request.UsePassive = true;
                    request.UseBinary = true;
                    request.KeepAlive = false;

                    using (FtpWebResponse response = (FtpWebResponse)request.GetResponse())
                    using (Stream responseStream = response.GetResponseStream())
                    using (StreamReader reader = new StreamReader(responseStream))
                    {
                        List<string> files = new List<string>();
                        string line = reader.ReadLine();
                        while (!string.IsNullOrEmpty(line))
                        {
                            if (line.StartsWith(ftpdel))
                            {
                                files.Add(line);
                            }
                            line = reader.ReadLine();
                        }

                        // Delete files
                        foreach (var file in files)
                        {
                            try
                            {
                                string encodedFileName = Uri.EscapeDataString(file);
                                FtpWebRequest deleteRequest = (FtpWebRequest)WebRequest.Create(ftpPath + encodedFileName);
                                deleteRequest.Credentials = new NetworkCredential(ftpUser, ftpPassword);
                                deleteRequest.Method = WebRequestMethods.Ftp.DeleteFile;

                                using (FtpWebResponse deleteResponse = (FtpWebResponse)deleteRequest.GetResponse())
                                {
                                    // Optionally check the status of the response
                                }
                            }
                            catch (WebException ex)
                            {
                                FtpWebResponse response1 = (FtpWebResponse)ex.Response;
                                if (response1.StatusCode == FtpStatusCode.ActionNotTakenFileUnavailable)
                                {
                                    MessageBox.Show($"File {file} not found on the server.", "File Not Found", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                                }
                                else
                                {
                                    MessageBox.Show($"Error deleting file {file}: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                                }
                            }
                        }
                    }

                    MessageBox.Show("E-Mail erfolgreich gesendet!", "Erfolg", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"An error occurred: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }

                this.Close();
                
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


        private void CancelButton_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private Dictionary<string, string> GetSchauspielerAddresses(string rollenString)
        {

            string schauspielpfad = @"F:\StagOrg\VS\res format\json\res_format_SchauData.json";

            List<string> schauspielerAusSchauspielpfad = new List<string>();
            List<string> schauspielerAusBesetzungDataPath = new List<string>();

            if (File.Exists(schauspielpfad))
            {
                string schauspielerJson = File.ReadAllText(schauspielpfad);
                List<SchauspielerData> schauspielerDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(schauspielerJson);

                schauspielerAusSchauspielpfad = schauspielerDataList
                    .Select(data => $"{data.Schauspieler}: ({data.SchauAdresse});")
                    .ToList();
                schauspielerAusBesetzungDataPath = schauspielerDataList
                    .Where(data => rollenString.Contains(data.Schauspieler))
                    .Select(data => $"{data.Schauspieler}: ({data.SchauAdresse});")
                    .ToList();
                return schauspielerAusBesetzungDataPath.ToDictionary(s => s.Split(':')[0].Trim(), s => s.Split(':')[1].Trim());
            }

            else
            {
                MessageBox.Show("Fehler beim Lesen der Datei.");
                return null;
            }

        }



        public class SaveData
        {
            public string Lokation { get; set; }
            public string Datum { get; set; }
            public string Zeit { get; set; }
            public string Stueck { get; set; }
            public string SchauspielerundRollen { get; set; }
            public string Regie { get; set; }
            public string DriverPassengers { get; set; }
            public string Mitfahrer { get; set; }
        }

        private async void StueckeListBox_SelectedIndexChanged(object sender, EventArgs e)
        {

            string selectedStueckName = StueckeListBox.SelectedItem?.ToString();
            if (string.IsNullOrEmpty(selectedStueckName) || _stueckeData == null)
            {
                return;
            }

            StueckeRowData selectedStueck = _stueckeData.FirstOrDefault(s => s.StueckeName == selectedStueckName);
            if (selectedStueck != null)
            {
                UpdateRollenLabels(selectedStueck.Rollen.Split(';').Select(r => r.Trim()).ToArray());
            }

            await Task.Delay(100);

            string auswahl = AuswahlBox.Text;
            string[] Teile = LokationBox.Text.Split(';');
            if (Teile.Length == 0)
            {
                _ = MessageBox.Show("Ungültige LokationBox-Eingabe.");
                return;
            }
            if (string.IsNullOrEmpty(AuswahlBox.Text))
            {
                string[] schauspieleraus = _schauspielerundRollen.Split(',');

                await Task.Delay(100);
                string schauspielpfad = $@"F:\StagOrg\VS\res format\json\res_format_SchauData.json";

                List<string> schauspielerAusSchauspielpfad = new List<string>();

                string schauspielerAuto = string.Join(", ", _mitfahrer.Split(',').Select(p => p.Split('(')[0].Trim()));


                if (File.Exists(schauspielpfad))
                {
                    string schauspielerJson = File.ReadAllText(schauspielpfad);
                    List<SchauspielerData> schauspielerDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(schauspielerJson);

                    schauspielerAusSchauspielpfad = schauspielerDataList
                        .Select(data => $"{data.Schauspieler}: ({data.SchauRollen});")
                        .ToList();
                }

                string[] rollen = { Rolle1.Text, Rolle2.Text, Rolle3.Text, Rolle4.Text, Rolle5.Text, Rolle6.Text };

                schauspieleraus = schauspieleraus.SelectMany(s => s.Split('|').SelectMany(a => a.Split(':').SelectMany(b => b.Split(';').Select(c => rollen.Contains(c) ? null : c).Where(c => c != null).Select(d => d.Trim())))).Distinct().ToArray();

                List<string> filteredSchauspieler = schauspielerAusSchauspielpfad
                    .Where(s => schauspieleraus.Any(name => s.StartsWith(name)))
                    .ToList();
                filteredSchauspieler = filteredSchauspieler
                    .Select(s => System.Text.RegularExpressions.Regex.Replace(s, @"\[.*?\]", "").Replace(")", "").Replace("(", "").Replace(";", ",").Trim())
                    .ToList();

                List<string> finalFilteredSchauspieler = filteredSchauspieler
                    .Select(s =>
                    {
                        string[] parts = s.Split(':');
                        string schauspieler = parts[0];
                        List<string> schauspielerRollen = parts.Length > 1 ? parts[1].Split(',').Select(r => r.Trim()).ToList() : new List<string>();

                        List<string> validRollen = schauspielerRollen.Where(r => !rollen.Contains(r)).ToList();

                        return validRollen.Any() ? $"{schauspieler}: {string.Join(", ", validRollen)}" : $"{schauspieler}: keine validen Rollen";
                    })
                    .Where(s => s != null && !s.EndsWith("keine validen Rollen"))
                    .ToList();

                List<string> reverseFilteredSchauspieler = filteredSchauspieler
                    .Select(s =>
                    {
                        string[] parts = s.Split(':');
                        string schauspieler = parts[0];
                        List<string> schauspielerRollen = parts.Length > 1 ? parts[1].Split(',').Select(r => r.Trim()).ToList() : new List<string>();

                        List<string> validRollen = schauspielerRollen.Where(r => rollen.Contains(r)).ToList();
                        return validRollen.Any() ? $"{schauspieler}: {string.Join(", ", validRollen)}" : null;
                    })
                    .Where(s => s != null)
                    .ToList();


                ComboBox[] comboBoxes = new[] { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };


                for (int i = 0; i < rollen.Length; i++)
                {
                    string rolle = rollen[i];
                    ComboBox comboBox = comboBoxes[i];
                    comboBox.SelectedIndex = -1;

                    comboBox.Items.Clear();


                    List<string> matchingActors = reverseFilteredSchauspieler
                        .Select(s =>
                        {
                            string[] parts = s.Split(':');
                            string schauspieler = parts[0];
                            List<string> schauspielerRollen = parts.Length > 1 ? parts[1].Split(',').Select(r => r.Trim()).ToList() : new List<string>();
                            return schauspielerRollen.Contains(rolle) ? schauspieler : null;
                        })
                        .Where(s => s != null)
                        .ToList();

                    comboBox.Items.AddRange(matchingActors.ToArray());
                }
                foreach (ComboBox comboBox in comboBoxes)
                {
                    comboBox.DrawMode = DrawMode.OwnerDrawFixed;
                    comboBox.DrawItem += (s, o) =>
                    {
                        o.DrawBackground();
                        ComboBox cb = s as ComboBox;
                        if (o.Index >= 0)
                        {
                            string itemText = cb.Items[o.Index].ToString();
                            Brush textBrush = SystemBrushes.ControlText;
                            if (schauspielerAuto.Contains(itemText))
                            {
                                o.Graphics.FillRectangle(Brushes.Green, o.Bounds);
                                textBrush = Brushes.White;
                            }
                            o.Graphics.DrawString(itemText, o.Font, textBrush, o.Bounds);
                        }
                        o.DrawFocusRectangle();
                    };
                }
                // Check if any RolleCombo is empty and make NeuAnf visible
                if (comboBoxes.Any(cb => cb.Items.Count == 0))
                {
                    NeuAnf.Visible = true;
                }
                else
                {
                    NeuAnf.Visible = false;
                }
            }
            else
            {
                string Firma = Teile[0];
                string BesetzungDataPath = $@"F:\StagOrg\VS\res format\json\Firmen\{Firma}\Organ\{auswahl}.json";
                string schauspielpfad = $@"F:\StagOrg\VS\res format\json\res_format_SchauData.json";

                List<string> schauspielerAusSchauspielpfad = new List<string>();
                List<string> schauspielerAusBesetzungDataPath = new List<string>();

                if (File.Exists(BesetzungDataPath))
                {
                    string stueckeJson = File.ReadAllText(BesetzungDataPath);
                    List<BesetzungData> stueckeDataList = JsonConvert.DeserializeObject<List<BesetzungData>>(stueckeJson);

                    schauspielerAuto = stueckeDataList
                        .Where(data => data.Auto?.ToLower() == "true")
                        .Select(data => data.Schauspieler)
                        .ToList();
                }

                if (File.Exists(schauspielpfad))
                {
                    string schauspielerJson = File.ReadAllText(schauspielpfad);
                    List<SchauspielerData> schauspielerDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(schauspielerJson);

                    schauspielerAusSchauspielpfad = schauspielerDataList
                        .Select(data => $"{data.Schauspieler}: ({data.SchauRollen});")
                        .ToList();
                }
                if (File.Exists(BesetzungDataPath))
                {
                    string stueckeJson = File.ReadAllText(BesetzungDataPath);
                    List<BesetzungData> stueckeDataList = JsonConvert.DeserializeObject<List<BesetzungData>>(stueckeJson);

                    schauspielerAusBesetzungDataPath = stueckeDataList
                        .Where(data => data.Ja?.ToLower() == "true")
                        .Select(data => data.Schauspieler)
                        .ToList();
                }
                List<string> filteredSchauspieler = schauspielerAusSchauspielpfad
                    .Where(s => schauspielerAusBesetzungDataPath.Any(name => s.StartsWith(name)))
                    .ToList();
                filteredSchauspieler = filteredSchauspieler
                    .Select(s => System.Text.RegularExpressions.Regex.Replace(s, @"\[.*?\]", "").Replace(")", "").Replace("(", "").Replace(";", ",").Trim())
                    .ToList();

                string[] rollen = { Rolle1.Text, Rolle2.Text, Rolle3.Text, Rolle4.Text, Rolle5.Text, Rolle6.Text };
                List<string> finalFilteredSchauspieler = filteredSchauspieler
                    .Select(s =>
                    {
                        string[] parts = s.Split(':');
                        string schauspieler = parts[0];
                        List<string> schauspielerRollen = parts.Length > 1 ? parts[1].Split(',').Select(r => r.Trim()).ToList() : new List<string>();

                        List<string> validRollen = schauspielerRollen.Where(r => !rollen.Contains(r)).ToList();

                        return validRollen.Any() ? $"{schauspieler}: {string.Join(", ", validRollen)}" : $"{schauspieler}: keine validen Rollen";
                    })
                    .Where(s => s != null && !s.EndsWith("keine validen Rollen"))
                    .ToList();

                List<string> reverseFilteredSchauspieler = filteredSchauspieler
                    .Select(s =>
                    {
                        string[] parts = s.Split(':');
                        string schauspieler = parts[0];
                        List<string> schauspielerRollen = parts.Length > 1 ? parts[1].Split(',').Select(r => r.Trim()).ToList() : new List<string>();

                        List<string> validRollen = schauspielerRollen.Where(r => rollen.Contains(r)).ToList();
                        return validRollen.Any() ? $"{schauspieler}: {string.Join(", ", validRollen)}" : null;
                    })
                    .Where(s => s != null)
                    .ToList();


                ComboBox[] comboBoxes = new[] { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };


                for (int i = 0; i < rollen.Length; i++)
                {
                    string rolle = rollen[i];
                    ComboBox comboBox = comboBoxes[i];
                    comboBox.SelectedIndex = -1;

                    comboBox.Items.Clear();

                    List<string> matchingActors = reverseFilteredSchauspieler

                        .Select(s =>
                        {
                            string[] parts = s.Split(':');
                            string schauspieler = parts[0];
                            List<string> schauspielerRollen = parts.Length > 1 ? parts[1].Split(',').Select(r => r.Trim()).ToList() : new List<string>();

                            return schauspielerRollen.Contains(rolle) ? schauspieler : null;
                        })
                        .Where(s => s != null)
                        .ToList();

                    comboBox.Items.AddRange(matchingActors.ToArray());
                }
                foreach (ComboBox comboBox in comboBoxes)
                {
                    comboBox.DrawMode = DrawMode.OwnerDrawFixed;
                    comboBox.DrawItem += (s, o) =>
                    {
                        o.DrawBackground();
                        ComboBox cb = s as ComboBox;
                        if (o.Index >= 0)
                        {
                            string itemText = cb.Items[o.Index].ToString();
                            Brush textBrush = SystemBrushes.ControlText;
                            if (schauspielerAuto.Contains(itemText))
                            {
                                o.Graphics.FillRectangle(Brushes.Green, o.Bounds);
                                textBrush = Brushes.White;
                            }
                            o.Graphics.DrawString(itemText, o.Font, textBrush, o.Bounds);
                        }
                        o.DrawFocusRectangle();
                    };
                }
                
                // Check if any RolleCombo is empty and make NeuAnf visible
                if (comboBoxes.Any(cb => cb.Items.Count == 0))
                {
                    NeuAnf.Visible = true;
                }
                else
                {
                    NeuAnf.Visible = false;
                }
            }
        }

        public class SchauspielerData
        {
            public string Schauspieler { get; set; }
            public string SchauAdresse { get; set; }
            public string SchauTelefonnummer { get; set; }
            public string SchauEmail { get; set; }
            public string SchauArchi { get; set; }
            public string SchauRollen { get; set; }
            public string Ja { get; set; }
            public string SchauAbendregie { get; set; }
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

        public class StueckeRowData
        {
            public string StueckeName { get; set; }
            public string Beschreibung { get; set; }
            public string FigCount { get; set; }
            public string Rollen { get; set; }
            public string RollenBesch { get; set; }
        }

        public class VorschRowData
        {
            public string Datum { get; set; }
            public string Zeit { get; set; }
            public string Stueck { get; set; }
            public string SchauspielerundRollen { get; set; }
            public string Regie { get; set; }
            public string Location { get; set; }
            public string DriverPassengers { get; set; }
            public string Mitfahrer { get; set; }
            public string SomeField { get; set; }
            public string AnotherField { get; set; }
        }

        public class PlanListeRowData
        {
            public string FolderName { get; set; }
            public string JsonFileName { get; set; }
        }

        private void UpdateRollenLabels(string[] rollen)
        {
            Label[] rollenLabels = new[] { Rolle1, Rolle2, Rolle3, Rolle4, Rolle5, Rolle6 };
            for (int i = 0; i < rollenLabels.Length; i++)
            {
                rollenLabels[i].Text = i < rollen.Length ? rollen[i] : $"Rolle{i + 1}";
            }
        }

        private void AuswahlBox_TextChanged(object sender, EventArgs e)
        {
            string[] parts = AuswahlBox.Text.Split('_');
            DatumBox.Text = parts[0].Replace("-", ".");
            ZeitBox.Text = parts[1].Replace("-", ":");
        }

        private async Task UpdateMitfahrerCombo(int index, CheckBox fahrerCheckBox)
        {
            if (string.IsNullOrEmpty(AuswahlBox.Text))
            {
                if (fahrerCheckBox.Checked)
                {

                    string auswahl = AuswahlBox.Text;
                    string[] teile = LokationBox.Text.Split(';');

                    if (teile.Length == 0)
                    {
                        MessageBox.Show("Ungültige LokationBox-Eingabe.");
                        return;
                    }

                    string firma = teile[0];
                    ComboBox rolleCombo = Controls.Find($"RolleCombo{index}", true).FirstOrDefault() as ComboBox;
                    ComboBox mitfahrCombo = Controls.Find($"MitfahrCombo{index}", true).FirstOrDefault() as ComboBox;
                    if (rolleCombo != null && mitfahrCombo != null && rolleCombo.SelectedItem != null)
                    {
                        string selectedSchauspieler = rolleCombo.SelectedItem.ToString();
                        string vorschDataPath = $@"F:\StagOrg\VS\res format\json\res_format_VorschData.json";

                        // wenn die auswahlbox leer ist, wird eine Meldung angezeigt


                        if (!File.Exists(vorschDataPath))
                        {
                            MessageBox.Show($"Datei nicht gefunden: {vorschDataPath}");
                            mitfahrCombo.Visible = false;
                            return;
                        }

                        string VorschJson = await Task.Run(() => File.ReadAllText(vorschDataPath));

                        List<SaveData> vorschDataList = JsonConvert.DeserializeObject<List<SaveData>>(VorschJson);


                        mitfahrCombo.Visible = false;
                        mitfahrCombo.Items.Clear();

                        // hollen der mitfahrer spalte aus der json datei und beim , splitten
                        List<string> mitfahrer = vorschDataList
                            .Select(data => data.Mitfahrer)
                            .SelectMany(m => m.Split(','))
                            .Select(m => m.Trim())
                            .ToList();
                        // suchen nach dem schauspiler der in der RolleCombo ausgewählt wurde und bei der klammer die mitfahreranzahl holen
                        string mitfahrerAnzahl = mitfahrer.FirstOrDefault(m => m.StartsWith(selectedSchauspieler + " ("))?.Split('(')[1].Split(')')[0];
                        // prüfen ob in der MitfahrCombo schon etwas ausgewählt wurde
                        
                        // wenn nein wird die mitfahreranzahl in die MitfahrCombo eingetragen
                       
                        
                        if (int.TryParse(mitfahrerAnzahl, out int mitfahrerAnzahlInt) && mitfahrerAnzahlInt > 0)
                        {
                            for (int i = 1; i <= mitfahrerAnzahlInt; i++)
                            {
                                mitfahrCombo.Items.Add(i.ToString());
                            }
                            mitfahrCombo.Visible = true;
                        }
                        else
                        {
                            MessageBox.Show($"Keine gültige Zahl für Schauspieler: {selectedSchauspieler}");
                            mitfahrCombo.Visible = false;
                        }                       
                    }
                    
                }
                else
                {
                    ComboBox mitfahrCombo = Controls.Find($"MitfahrCombo{index}", true).FirstOrDefault() as ComboBox;
                    if (mitfahrCombo != null)
                    {
                        mitfahrCombo.Visible = false;
                    }
                }
            }
            else
            {
                if (fahrerCheckBox.Checked)
                {

                    string auswahl = AuswahlBox.Text;
                    string[] teile = LokationBox.Text.Split(';');

                    if (teile.Length == 0)
                    {
                        MessageBox.Show("Ungültige LokationBox-Eingabe.");
                        return;
                    }

                    string firma = teile[0];
                    ComboBox rolleCombo = Controls.Find($"RolleCombo{index}", true).FirstOrDefault() as ComboBox;
                    ComboBox mitfahrCombo = Controls.Find($"MitfahrCombo{index}", true).FirstOrDefault() as ComboBox;
                    if (rolleCombo != null && mitfahrCombo != null && rolleCombo.SelectedItem != null)
                    {
                        string selectedSchauspieler = rolleCombo.SelectedItem.ToString();
                        string besetzungDataPath = $@"F:\StagOrg\VS\res format\json\Firmen\{firma}\Organ\{auswahl}.json";

                        // wenn die auswahlbox leer ist, wird eine Meldung angezeigt


                        if (!File.Exists(besetzungDataPath))
                        {
                            MessageBox.Show($"Datei nicht gefunden: {besetzungDataPath}");
                            mitfahrCombo.Visible = false;
                            return;
                        }

                        string besetzungJson = await Task.Run(() => File.ReadAllText(besetzungDataPath));
                        List<BesetzungData> besetzungDataList = JsonConvert.DeserializeObject<List<BesetzungData>>(besetzungJson);

                        BesetzungData schauspieler = besetzungDataList.FirstOrDefault(data => data.Schauspieler == selectedSchauspieler);

                        mitfahrCombo.Visible = false;
                        mitfahrCombo.Items.Clear();

                        if (schauspieler != null && !string.IsNullOrEmpty(schauspieler.Mitfahrer))
                        {
                            if (int.TryParse(schauspieler.Mitfahrer, out int mitfahrerAnzahl) && mitfahrerAnzahl > 0)
                            {
                                for (int i = 1; i <= mitfahrerAnzahl; i++)
                                {
                                    mitfahrCombo.Items.Add(i.ToString());
                                }

                                mitfahrCombo.Visible = true;
                            }
                            else
                            {
                                MessageBox.Show($"Keine gültige Zahl für Schauspieler: {selectedSchauspieler}");
                                mitfahrCombo.Visible = false;
                            }
                        }
                        else
                        {
                            MessageBox.Show($"{selectedSchauspieler} nimmt niemanden mit");
                            mitfahrCombo.Visible = false;
                        }
                    }
                    else
                    {
                        MessageBox.Show($"RolleCombo{index} oder MitfahrCombo{index} ist null oder kein Schauspieler ausgewählt.");
                        if (mitfahrCombo != null)
                        {
                            mitfahrCombo.Visible = false;
                        }
                    }
                }
                else
                {
                    ComboBox mitfahrCombo = Controls.Find($"MitfahrCombo{index}", true).FirstOrDefault() as ComboBox;
                    if (mitfahrCombo != null)
                    {
                        mitfahrCombo.Visible = false;
                    }
                }
            }
        }

        private void UpdateRegieBoxItems()
        {
            // wenn AuswahlBox leer ist, dann return
            if (string.IsNullOrEmpty(AuswahlBox.Text))
            {
                string[] parts = _regie.Split(';');
                List<string> schauspielerAbendregie = parts[1].Split(',').Select(p => p.Trim()).ToList();
                ComboBox[] comboBoxes = new[] { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };

                foreach (ComboBox comboBox in comboBoxes)
                {
                    if (comboBox.SelectedItem != null)
                    {
                        _ = schauspielerAbendregie.Remove(comboBox.SelectedItem.ToString());
                    }
                }

                RegieBox.Items.Clear();
                RegieBox.Items.AddRange(schauspielerAbendregie.ToArray());
            }
            else
            {
                string auswahl = AuswahlBox.Text;
                string[] Teile = LokationBox.Text.Split(';');
                if (Teile.Length == 0)
                {
                    _ = MessageBox.Show("Ungültige LokationBox-Eingabe.");
                    return;
                }
                string Firma = Teile[0];
                string BesetzungDataPath = $@"F:\StagOrg\VS\res format\json\Firmen\{Firma}\Organ\{auswahl}.json";
                if (File.Exists(BesetzungDataPath))
                {
                    string stueckeJson = File.ReadAllText(BesetzungDataPath);
                    List<BesetzungData> stueckeDataList = JsonConvert.DeserializeObject<List<BesetzungData>>(stueckeJson);

                    List<string> schauspielerAbendregie = stueckeDataList
                        .Where(data => data.Abendregie?.ToLower() == "true")
                        .Select(data => data.Schauspieler)
                        .ToList();

                    ComboBox[] comboBoxes = new[] { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };
                    foreach (ComboBox comboBox in comboBoxes)
                    {
                        if (comboBox.SelectedItem != null)
                        {
                            _ = schauspielerAbendregie.Remove(comboBox.SelectedItem.ToString());
                        }
                    }

                    RegieBox.Items.Clear();
                    RegieBox.Items.AddRange(schauspielerAbendregie.ToArray());
                }
            }
        }

        private string GetSchauspielerAdresse(string schauspielerName)
        {
            if (string.IsNullOrEmpty(schauspielerName))
            {
                return null;
            }

            if (schauspielerName == "Abendregie")
            {
                return "Meinhartsdorfer Gasse 3, 1150 Wien";
            }

            string schauspielpfad = @"F:\StagOrg\VS\res format\json\res_format_SchauData.json";
            if (File.Exists(schauspielpfad))
            {
                string schauspielerJson = File.ReadAllText(schauspielpfad);
                List<SchauspielerData> schauspielerDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(schauspielerJson);
                var schauspieler = schauspielerDataList.FirstOrDefault(s => s.Schauspieler == schauspielerName);
                return schauspieler?.SchauAdresse;
            }

            return null;
        }


        private string selectedActors = "";
        private string fahrerActors = "";
        private string abendRegie = "";


        // Declare these at the class level
        private HashSet<string> abendRegieSet = new HashSet<string>();

        private void UpdateFahrerUndMitfahrerStrings()
        {
            string selectedRegie = RegieBox.SelectedItem?.ToString();
            RegieBox.Text = selectedRegie;

            selectedActors = "";
            fahrerActors = "";

            ComboBox[] roleCombos = { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };
            ComboBox[] mitfahrCombos = { MitfahrCombo1, MitfahrCombo2, MitfahrCombo3, MitfahrCombo4, MitfahrCombo5, MitfahrCombo6, MitfahrCombo7 };
            CheckBox[] fahrerCheckboxes = { Fahrer1, Fahrer2, Fahrer3, Fahrer4, Fahrer5, Fahrer6 };

            HashSet<string> selectedActorsSet = new HashSet<string>();
            HashSet<string> fahrerActorsSet = new HashSet<string>();

            // Loop through the roleCombos array
            for (int i = 0; i < roleCombos.Length; i++)
            {
                if (roleCombos[i].SelectedItem != null)
                {
                    string actor = roleCombos[i].SelectedItem.ToString();
                    selectedActorsSet.Add(actor);
                    // Check if the corresponding Fahrer checkbox is checked
                    if (fahrerCheckboxes[i].Checked)
                    {
                        string mitfahrerCount = mitfahrCombos[i].SelectedItem?.ToString() ?? "0";
                        fahrerActorsSet.Add($"{actor} (Mitfahrer: {mitfahrerCount})");
                        selectedActorsSet.Remove(actor);
                    }
                }
            }

            if (RegieBox.SelectedItem != null)
            {
                string regieActor = RegieBox.SelectedItem.ToString();
                string mitfahrerCount = MitLabel.Text.Split(':')[1].Trim();
                abendRegieSet.Clear();
                abendRegieSet.Add($"{regieActor} (Mitfahrer: {mitfahrerCount})");
            }

            selectedActors = string.Join(", ", selectedActorsSet);
            fahrerActors = string.Join(", ", fahrerActorsSet.Concat(abendRegieSet));
            abendRegie = string.Join(", ", abendRegieSet);
        }

        private void RegieBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            // ok button disabled wenn regiebox geändert wird+
            OKbutton.Enabled = false;

        }

        private void MitfahrCombo6_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private void MitfahrCombo5_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private void MitfahrCombo4_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private void MitfahrCombo3_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private void MitfahrCombo2_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private void MitfahrCombo1_SelectedIndexChanged(object sender, EventArgs e)
        {
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void RolleCombo1_SelectedIndexChanged(object sender, EventArgs e)
        {
            await HandleComboBoxSelectionChanged(1, RolleCombo1, Fahrer1, "comboA");
            Fahrer1.Checked = false;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void RolleCombo2_SelectedIndexChanged(object sender, EventArgs e)
        {
            await HandleComboBoxSelectionChanged(2, RolleCombo2, Fahrer2, "comboB");
            Fahrer2.Checked = false;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void RolleCombo3_SelectedIndexChanged(object sender, EventArgs e)
        {
            await HandleComboBoxSelectionChanged(3, RolleCombo3, Fahrer3, "comboC");
            Fahrer3.Checked = false;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void RolleCombo4_SelectedIndexChanged(object sender, EventArgs e)
        {
            await HandleComboBoxSelectionChanged(4, RolleCombo4, Fahrer4, "comboD");
            Fahrer4.Checked = false;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void RolleCombo5_SelectedIndexChanged(object sender, EventArgs e)
        {
            await HandleComboBoxSelectionChanged(5, RolleCombo5, Fahrer5, "comboE");
            Fahrer5.Checked = false;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void RolleCombo6_SelectedIndexChanged(object sender, EventArgs e)
        {
            await HandleComboBoxSelectionChanged(6, RolleCombo6, Fahrer6, "comboF");
            Fahrer6.Checked = false;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void Fahrer1_CheckedChanged(object sender, EventArgs e)
        {
            await UpdateMitfahrerCombo(1, Fahrer1);
            MitfahrCombo1.SelectedIndex = -1;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void Fahrer2_CheckedChanged(object sender, EventArgs e)
        {
            await UpdateMitfahrerCombo(2, Fahrer2);
            MitfahrCombo2.SelectedIndex = -1;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void Fahrer3_CheckedChanged(object sender, EventArgs e)
        {
            await UpdateMitfahrerCombo(3, Fahrer3);
            MitfahrCombo3.SelectedIndex = -1;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void Fahrer4_CheckedChanged(object sender, EventArgs e)
        {
            await UpdateMitfahrerCombo(4, Fahrer4);
            MitfahrCombo4.SelectedIndex = -1;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void Fahrer5_CheckedChanged(object sender, EventArgs e)
        {
            await UpdateMitfahrerCombo(5, Fahrer5);
            MitfahrCombo5.SelectedIndex = -1;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }

        private async void Fahrer6_CheckedChanged(object sender, EventArgs e)
        {
            await UpdateMitfahrerCombo(6, Fahrer6);
            MitfahrCombo6.SelectedIndex = -1;
            UpdateMitLabel();
            UpdateFahrerUndMitfahrerStrings();
            OKbutton.Enabled = false;

        }


        private async void Checkbutton_Click(object sender, EventArgs e)
        {
            // Auswahl der regieBox in string speichern
            string selectedRegie = RegieBox.SelectedItem?.ToString();
            // List of ComboBoxes to check
            ComboBox[] roleCombos = { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };

            // Check if any of the role combo boxes or RegieBox do not have a selected item
            bool allSelected = roleCombos.All(combo => combo.SelectedItem != null) && RegieBox.SelectedItem != null;
            // If any combo box is not selected, show a message box and return
            if (!allSelected)
            {
                MessageBox.Show("Bitte treffen Sie eine Auswahl für alle Rollen und die Regie.", "Auswahl erforderlich", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Collect addresses for selected actors
            string addresses = "";

            // Add addresses for selected actors
            addresses += GetAddressesForActors(selectedActors);
            addresses += GetAddressesForActors(fahrerActors);
            // Regie aus adresse löschen
            // Add address for "Abendregie"
            if (!string.IsNullOrEmpty(selectedRegie))
            {
                addresses += $"{selectedRegie}: Meinhartsdorfer Gasse 3, 1150 Wien{Environment.NewLine}";
            }
            // Add address from LokationBox
            string[] lokationParts = LokationBox.Text.Split(';');

            if (lokationParts.Length > 1)
            {
                string firmaName = lokationParts[0].Trim();
                string firmaAddress = lokationParts[1].Trim();
                addresses += $"{firmaName}: {firmaAddress}{Environment.NewLine}";
            }
            string apiKey = "AIzaSyC82aoSWfXJwJOqJgSCMt8V4CQcn31VE_4";


            string mitfahrer = await CalculateRelativeDistances(apiKey, selectedRegie);
            TestBox1.Text = mitfahrer;
            
            
            await Task.Delay(100);


            _fahrermitfahrer = mitfahrer;


            driverPassengers = ParseMitfahrenString(mitfahrer);
            // Load the map with markers and routes
            LoadMapFromFinalMitfahren(mitfahrer, lokationParts[1], selectedRegie);
            OKbutton.Enabled = true;

            
        }

        private Dictionary<string, List<string>> ParseMitfahrenString(string mitfahren)
        {
            var driverPassengers = new Dictionary<string, List<string>>();

            if (string.IsNullOrEmpty(mitfahren))
            {
                MessageBox.Show("Mitfahren string is null or empty.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return driverPassengers;
            }

            var entries = mitfahren.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var entry in entries)
            {
                var parts = entry.Split(':');
                if (parts.Length == 2)
                {
                    string passenger = parts[0].Trim();
                    string driver = parts[1].Trim();

                    if (!driverPassengers.ContainsKey(driver))
                    {
                        driverPassengers[driver] = new List<string>();
                    }
                    driverPassengers[driver].Add(passenger);
                }
            }

            return driverPassengers;
        }

        private string GetAddressesForActors(string actors)
        {
            // Split the actors string into individual actor names
            string[] actorNames = actors.Split(new[] { ", " }, StringSplitOptions.RemoveEmptyEntries);

            // Collect the addresses for each actor
            List<string> addresses = new List<string>();
            foreach (string actorName in actorNames)
            {
                // Extract the actual actor name if it's followed by additional info (e.g., "(Mitfahrer: ...)")
                string cleanName = actorName.Split('(')[0].Trim();
                string address = GetSchauspielerAdresse(cleanName);
                if (!string.IsNullOrEmpty(address))
                {
                    addresses.Add($"{cleanName}: {address}");
                }
            }

            // Combine addresses into a single string with new lines for readability
            return string.Join(Environment.NewLine, addresses) + Environment.NewLine;
        }


        private async Task<string> GetDistanceMatrix(string origin, string destination, string apiKey, string mode)
        {
            using (var client = new HttpClient())
            {
                string url = $"https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&mode={mode}&key={apiKey}";
                var response = await client.GetStringAsync(url);
                return response;
            }
        }

        public async Task<Dictionary<string, Dictionary<string, double>>> CalculateDistances(string apiKey, List<string> fahrerList, List<string> schauspielerList, string mode, string regieName)
        {
            Dictionary<string, Dictionary<string, double>> distances = new Dictionary<string, Dictionary<string, double>>();
            string regieAddress = "Meinhartsdorfer Gasse 3, 1150 Wien";

            foreach (var fahrer in fahrerList)
            {
                distances[fahrer] = new Dictionary<string, double>();
                string fahrerAddress = fahrer == regieName ? regieAddress : GetSchauspielerAdresse(fahrer);

                foreach (var schauspieler in schauspielerList)
                {
                    string schauspielerAddress = GetSchauspielerAdresse(schauspieler);
                    var response = await GetDistanceMatrix(fahrerAddress, schauspielerAddress, apiKey, mode);
                    if (response == null)
                    {
                        // Handle the case when response is null
                        continue;
                    }
                    dynamic json = JsonConvert.DeserializeObject(response);
                    if (json?.rows?[0]?.elements?[0]?.distance?.value == null)
                    {
                        // Handle the case when json structure is not as expected
                        continue;
                    }
                    double distance = json.rows[0].elements[0].distance.value;

                    distances[fahrer][schauspieler] = distance;
                }
            }

            return distances;
        }

        public async Task<string> CalculateRelativeDistances(string apiKey, string regieName)
        {
            var fahrerList = fahrerActors.Split(',')
                .Select(a => a.Trim().Split('(')[0].Trim())
                .Concat(new[] { regieName })
                .Distinct()
                .ToList();

            var selectedActorsList = selectedActors.Split(',').Select(a => a.Trim()).ToList();
            var publicDistances = await CalculateDistances(apiKey, fahrerList, selectedActorsList, "walking", regieName);

            StringBuilder mitfahren = new StringBuilder();
            Dictionary<string, Dictionary<string, double>> relativeDistances = new Dictionary<string, Dictionary<string, double>>();

            foreach (var schauspieler in selectedActorsList)
            {
                double totalDistance = fahrerList.Sum(fahrer => publicDistances.ContainsKey(fahrer) && publicDistances[fahrer].ContainsKey(schauspieler) ? publicDistances[fahrer][schauspieler] : 0);
                foreach (var fahrer in fahrerList)
                {
                    if (!relativeDistances.ContainsKey(schauspieler))
                    {
                        relativeDistances[schauspieler] = new Dictionary<string, double>();
                    }
                    double relativeDistance = totalDistance - (publicDistances.ContainsKey(fahrer) && publicDistances[fahrer].ContainsKey(schauspieler) ? publicDistances[fahrer][schauspieler] : 0);
                    relativeDistances[schauspieler][fahrer] = relativeDistance;
                }
            }

            var sortedDistances = relativeDistances
                .SelectMany(kvp => kvp.Value.Select(innerKvp => new
                {
                    Mitfahrer = kvp.Key,
                    Fahrer = innerKvp.Key,
                    Distance = innerKvp.Value
                }))
                .OrderByDescending(x => x.Distance)
                .ToList();

            var driverCapacities = fahrerActors.Replace("Mitfahrer: ", "").Replace(")", "").Replace("(", ":")
                .Split(',')
                .Select(entry => entry.Split(':'))
                .ToDictionary(parts => parts[0].Trim(), parts => int.Parse(parts[1].Trim()));

            Dictionary<string, List<string>> fahrerAssignments = fahrerList.ToDictionary(f => f, f => new List<string>());
            HashSet<string> assignedActors = new HashSet<string>();

            foreach (var entry in sortedDistances)
            {
                if (assignedActors.Contains(entry.Mitfahrer))
                {
                    continue;
                }

                if (fahrerAssignments[entry.Fahrer].Count < driverCapacities[entry.Fahrer])
                {
                    fahrerAssignments[entry.Fahrer].Add(entry.Mitfahrer);
                    assignedActors.Add(entry.Mitfahrer);
                }
            }

            foreach (var fahrer in fahrerAssignments.Keys)
            {
                if (!fahrerAssignments[fahrer].Any())
                {
                    mitfahren.AppendLine($"Fahrer ohne Mitfahrer: {fahrer}");
                }
                else
                {
                    foreach (var mitfahrer in fahrerAssignments[fahrer])
                    {
                        mitfahren.AppendLine($"{mitfahrer}: {fahrer}");
                    }
                }
            }
            return mitfahren.ToString();
        }




        private void LoadMapFromFinalMitfahren(string finalMitfahren, string locationAddress, string regieName)
        {
            Dictionary<string, string> schauspielerAddresses = new Dictionary<string, string>();
            Dictionary<string, List<string>> driverPassengers = new Dictionary<string, List<string>>();

            var entries = finalMitfahren.Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
            StringBuilder Content4 = new StringBuilder();
            StringBuilder Content5 = new StringBuilder();
            StringBuilder Content6 = new StringBuilder();
            StringBuilder Content7 = new StringBuilder();

            foreach (var entry in entries)
            {
                var parts = entry.Split(':'); // Split the entry into components

                if (parts.Length == 2)
                {
                    string schauspieler = parts[0].Trim();
                    string fahrer = parts[1].Trim();

                    Content4.Append(parts[0] + " <-> ");
                    Content5.Append(parts[1] + " <-> ");

                    if (!schauspielerAddresses.ContainsKey(schauspieler))
                    {
                        string schauspielerAddress = GetSchauspielerAdresse(schauspieler);
                        schauspielerAddresses[schauspieler] = schauspielerAddress;
                    }
                    Content6.Append(schauspielerAddresses[schauspieler] + " <-> ");

                    if (!schauspielerAddresses.ContainsKey(fahrer))
                    {
                        string fahrerAddress = GetSchauspielerAdresse(fahrer);
                        schauspielerAddresses[fahrer] = fahrerAddress;
                    }
                    Content7.Append(schauspielerAddresses[fahrer] + " <-> ");

                    if (!driverPassengers.ContainsKey(fahrer))
                    {
                        driverPassengers[fahrer] = new List<string>();
                    }
                    driverPassengers[fahrer].Add(schauspieler);
                }
            }

            // Add Abendregie with fixed address
            string abendregieAddress = "Meinhartsdorfer Gasse 3, 1150 Wien";
            schauspielerAddresses[regieName] = abendregieAddress;

            // Ensure Abendregie is included in driverPassengers if it is not already present
            if (!driverPassengers.ContainsKey(regieName))
            {
                driverPassengers[regieName] = new List<string>();
            }

            // Load the map with the parsed data
            LoadMap(schauspielerAddresses, driverPassengers, locationAddress);
        }


        private void Abbrechenbutton_Click(object sender, EventArgs e)
        {
            DialogResult = DialogResult.Cancel;

        }

        private void NeuAnf_Click(object sender, EventArgs e)
        {

            // StueckeListBox combobox auswahl in string speichern
            string Stueck = StueckeListBox.SelectedItem?.ToString();
            string auswahl = AuswahlBox.Text;
            string[] Teile = LokationBox.Text.Split(';');
            if (Teile.Length == 0)
            {
                _ = MessageBox.Show("Ungültige LokationBox-Eingabe.");
                return;
            }
            string Firma = Teile[0];
            string BesetzungDataPath = $@"F:\StagOrg\VS\res format\json\Firmen\{Firma}\Organ\{auswahl}.json";
            string schauspielpfad = @"F:\StagOrg\VS\res format\json\res_format_SchauData.json";
            string vorschDataPath = $@"F:\StagOrg\VS\res format\json\res_format_VorschData.json";
            // suchen nach Stueck in schauspielpfad
            List<string> schauspielerAusSchauspielpfad = new List<string>();
            List<string> schauspielerAusBesetzungDataPath = new List<string>();


            // holen der daten aus schauspielpfad
            if (File.Exists(schauspielpfad))
            {
                string besetzungJson = File.ReadAllText(BesetzungDataPath);
                List<BesetzungData> besetzungDataList = JsonConvert.DeserializeObject<List<BesetzungData>>(besetzungJson);
                var besetzungschauspieler = besetzungDataList
                    .Select(data => data.Schauspieler)
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .ToList();
                string schauspielerJson = File.ReadAllText(schauspielpfad);
                List<SchauspielerData> schauspielerDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(schauspielerJson);
                var alleschauspieler = schauspielerDataList
                    .Select(data => $"{data.Schauspieler}: ({data.SchauRollen});")
                    .Select(Select => Select.Replace("(", "").Replace(")", ""))
                    .SelectMany(s => s.Split(';'))
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Where(s => !besetzungschauspieler.Any(name => s.Contains(name)))
                    .Where(s => s.Contains(Stueck))
                    .Select(s => s.Split(':')[0])
                    .ToList();
                string rollenJson = File.ReadAllText(schauspielpfad);
                List<SchauspielerData> RollenDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(rollenJson);
                var allerollen = RollenDataList
                    .Select(data => $"{data.Schauspieler}: ({data.SchauRollen});")
                    .Select(Select => Select.Replace("(", "").Replace(")", ""))
                    .SelectMany(s => s.Split(';'))
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Where(s => !besetzungschauspieler.Any(name => s.Contains(name)))
                    .Where(s => s.Contains(Stueck))
                    .SelectMany(s => s.Split('['))
                    .Where(s => s.Contains(Stueck))
                    .Select(s => s.Split(']')[1])
                    .Select(Select => Select.Replace(",", ""))
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .ToList();
                string mailJson = File.ReadAllText(schauspielpfad);
                List<SchauspielerData> mailDataList = JsonConvert.DeserializeObject<List<SchauspielerData>>(mailJson);
                var mailschau = mailDataList
                    .Select(data => $"{data.Schauspieler}: ({data.SchauEmail})")
                    // alle schauspieler die schon in allerollen sind extrahieren
                    .Where(s => alleschauspieler.Any(name => s.Contains(name)))
                    .Select(s => s.Split(':')[1])
                    .Select(s => s.Replace("(", "").Replace(")", ""))
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .ToList();
                // verbinden der alleschauspieler mit allerollen
                List<BesetzungData> dataList = new List<BesetzungData>();
                for (int i = 0; i < alleschauspieler.Count; i++)
                {
                    dataList.Add(new BesetzungData
                    {
                        Schauspieler = alleschauspieler[i],
                        Rollen = allerollen[i],
                        Email = mailschau[i]
                    });
                }
                // hollen der namen der Labels "Rolle1-6"
                Label[] rollenLabels = { Rolle1, Rolle2, Rolle3, Rolle4, Rolle5, Rolle6 };
                ComboBox[] comboBox = { RolleCombo1, RolleCombo2, RolleCombo3, RolleCombo4, RolleCombo5, RolleCombo6 };
                // zuweisen der "alleschauspieler" zu den zugehörigen Comboboxen "RolleCombo1-6" anhand der zugehörigen Labels "Rolle1-6"
                for (int i = 0; i < rollenLabels.Length; i++)
                {
                    if (i < alleschauspieler.Count)
                    {
                        // suchen nach dem rollenLabels mit dem passenden Text aus allerollen
                        Label rollenLabel = rollenLabels.FirstOrDefault(label => label.Text == allerollen[i]);
                        if (rollenLabel != null)
                        {
                            // Index des Labels in rollenLabels
                            int index = Array.IndexOf(rollenLabels, rollenLabel);
                            // ComboBox anhand des Indexes auswählen und den Schauspieler aus alleschauspieler zur auswahl hinzufügen
                            comboBox[index].Items.Add(alleschauspieler[i]);

                        }
                    }
                }
                // prüfen ob die Comboboxen "RolleCombo1-6" leer sind, wenn ja, dann eine Meldung mit zugehörigem Label anzeigen
                for (int i = 0; i < comboBox.Length; i++)
                {
                    if (comboBox[i].Items.Count == 0)
                    {
                        MessageBox.Show($"Keine Schauspieler für die Rolle {rollenLabels[i].Text} gefunden.");
                        // wenn keine Schauspieler gefunden wurden, dann den prozes abbrechen
                        return;
                    }
                    
                }

                // Json string erstellen mit dataList
                string json = JsonConvert.SerializeObject(dataList, Formatting.Indented);
                // Json string in BesetzungDataPath speichern
                File.WriteAllText(BesetzungDataPath, json);
            }
        }

        private void UpdateFahrerCheckboxes(List<bool> fahrerCheckboxes)
        {
            if (fahrerCheckboxes == null || fahrerCheckboxes.Count < 6)
            {
                throw new ArgumentException("FahrerCheckboxes must contain at least 6 elements.");
            }

            Fahrer1.Checked = fahrerCheckboxes[0];
            Fahrer2.Checked = fahrerCheckboxes[1];
            Fahrer3.Checked = fahrerCheckboxes[2];
            Fahrer4.Checked = fahrerCheckboxes[3];
            Fahrer5.Checked = fahrerCheckboxes[4];
            Fahrer6.Checked = fahrerCheckboxes[5];
        }

        private void LokationBox_TextChanged(object sender, EventArgs e)
        {
            OKbutton.Enabled = false;
        }
    }
}
