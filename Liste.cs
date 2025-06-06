using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace res_format
{
    public partial class Liste : Form
    {
        private MenuStrip menuStrip1;
        private ToolStripMenuItem dateiToolStripMenuItem;
        private ToolStripMenuItem speichernToolStripMenuItem;
        private ToolStripMenuItem ladenToolStripMenuItem;
        private List<ListeRowData> _originalRowsData;
        private List<StueckeRowData> _originalStueckeRowsData;
        private List<SchauRowData> _originalSchauRowsData;
        private List<VorschRowData> _originalVorschRowsData;
        private readonly StueckeRowData _selectedStueckeRowData = null;
        internal bool isReChActivated = false;
        private List<PlanListeRowData> _originalPlanListeRowsData;


        private vortschritt _vortschritt;



        public Liste()
        {
            // initialisieren von Vortschritt.cs
            vortschritt vortschritt = new vortschritt();
            if (_vortschritt != null && !_vortschritt.IsDisposed)
            {
                _vortschritt.Show();
            }
            Load += new EventHandler(Liste_Load);  // Fügt den Liste_Load Ereignishandler zum Load-Ereignis hinzu
            Load += new EventHandler(StueckeListe_Load);  // Fügt den Liste_Load Ereignishandler zum Load-Ereignis hinzu
            Load += new EventHandler(SchauListe_Load);  // Fügt den Liste_Load Ereignishandler zum Load-Ereignis hinzu
            Load += new EventHandler(VorschListe_Load);  // Fügt den Liste_Load Ereignishandler zum Load-Ereignis hinzu
            Load += new EventHandler(PlanListe_Load);  // Fügt den PlanListe_Load Ereignishandler zum Load-Ereignis hinzu
            InitializeComponent();
            Instance = this;
            InitializeMenu();
            FormClosing += new FormClosingEventHandler(Liste_FormClosing);
            FormClosing += new FormClosingEventHandler(StueckeListe_FormClosing);
            FormClosing += new FormClosingEventHandler(SchauListe_FormClosing);
            FormClosing += new FormClosingEventHandler(VorschListe_FormClosing);
            FormClosing += new FormClosingEventHandler(PlanListe_FormClosing);
            InitializeBackupTimer();
            this.StartPosition = FormStartPosition.CenterScreen;
            Vorsch vorschForm = new Vorsch();
            this.Load += Liste_Load;
            VorschListe.CellDoubleClick += new DataGridViewCellEventHandler(VorschListe_CellDoubleClick);

            ResListe.RowsAdded += ResListe_RowsChanged;
            ResListe.RowsRemoved += ResListe_RowsChanged;
            StueckeListe.RowsAdded += StueckeListe_RowsChanged;
            StueckeListe.RowsRemoved += StueckeListe_RowsChanged;
            SchauListe.RowsAdded += SchauListe_RowsChanged;
            SchauListe.RowsRemoved += SchauListe_RowsChanged;
            VorschListe.RowsAdded += VorschListe_RowsChanged;
            VorschListe.RowsRemoved += VorschListe_RowsChanged;
            PlanListe.RowsAdded += PlanListe_RowsChanged;
            PlanListe.RowsRemoved += PlanListe_RowsChanged;
        }

        public void UpdatePlanListeData()
        {
            // Hier können Sie die Logik zum Aktualisieren der Daten hinzufügen
            PlanListe_Load(this, EventArgs.Empty);
        }

        public void UpdateVorschListeData()
        {
            // Hier können Sie die Logik zum Aktualisieren der Daten hinzufügen
            VorschListe_Load(this, EventArgs.Empty);
        }

        private void InitializeBackupTimer()
        {
            System.Windows.Forms.Timer backupTimer = new System.Windows.Forms.Timer
            {
                Interval = 300000 // 5 Minuten in Millisekunden
            };
            backupTimer.Tick += (sender, e) => SaveBackupData();
            backupTimer.Tick += (sender, e) => SaveStueckeBackupData();
            backupTimer.Tick += (sender, e) => SaveSchauBackupData();
            backupTimer.Tick += (sender, e) => SaveVorschBackupData();

            backupTimer.Start();
        }


        private void Liste_FormClosing(object sender, FormClosingEventArgs e)
        {
            SaveBackupData(); // Speichert die Daten beim Schließen
        }

        private void StueckeListe_FormClosing(object sender, FormClosingEventArgs e)
        {
            SaveStueckeBackupData(); // Speichert die Daten beim Schließen
        }

        private void SchauListe_FormClosing(object sender, FormClosingEventArgs e)
        {
            SaveSchauBackupData(); // Speichert die Daten beim Schließen
        }

        private void VorschListe_FormClosing(object sender, FormClosingEventArgs e)
        {
            SaveVorschBackupData(); // Speichert die Daten beim Schließen
        }

        private void PlanListe_FormClosing(object sender, FormClosingEventArgs e)
        {
            SaveVorschBackupData(); // Speichert die Daten beim Schließen
        }

        public void SaveBackupData()
        {
            string directoryPath = @"F:\StagOrg\VS\res format\backups";
            if (!Directory.Exists(directoryPath))
            {
                _ = Directory.CreateDirectory(directoryPath);
            }

            string timestamp = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
            string filePath = Path.Combine(directoryPath, $"res_format_data_{timestamp}.json");

            SaveDataToFile(filePath);
            ManageBackupFiles(directoryPath);
        }

        public void SaveStueckeBackupData()
        {
            string directoryPath = @"F:\StagOrg\VS\res format\backups";
            if (!Directory.Exists(directoryPath))
            {
                _ = Directory.CreateDirectory(directoryPath);
            }

            string timestamp = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
            string StueckefilePath = Path.Combine(directoryPath, $"res_format_Stueckedata_{timestamp}.json");

            SaveStueckeDataToFile(StueckefilePath);
            ManageStueckeBackupFiles(directoryPath);
        }

        public void SaveSchauBackupData()
        {
            string directoryPath = @"F:\StagOrg\VS\res format\backups";
            if (!Directory.Exists(directoryPath))
            {
                _ = Directory.CreateDirectory(directoryPath);
            }

            string timestamp = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
            string SchaufilePath = Path.Combine(directoryPath, $"res_format_SchauData_{timestamp}.json");

            SaveSchauDataToFile(SchaufilePath);
            ManageSchauBackupFiles(directoryPath);
        }

        public void SaveVorschBackupData()
        {
            string directoryPath = @"F:\StagOrg\VS\res format\backups";
            if (!Directory.Exists(directoryPath))
            {
                _ = Directory.CreateDirectory(directoryPath);
            }

            string timestamp = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
            string VorschfilePath = Path.Combine(directoryPath, $"res_format_VorschData_{timestamp}.json");

            SaveVorschDataToFile(VorschfilePath);
            ManageVorschBackupFiles(directoryPath);
        }

        public void SavePlanBackupData()
        {
            string directoryPath = @"F:\StagOrg\VS\res format\backups";
            if (!Directory.Exists(directoryPath))
            {
                _ = Directory.CreateDirectory(directoryPath);
            }

            string timestamp = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
            string PlanfilePath = Path.Combine(directoryPath, $"res_format_PlanData_{timestamp}.json");

            SavePlanDataToFile(PlanfilePath);
            ManagePlanBackupFiles(directoryPath);
        }


        private void ManageBackupFiles(string directoryPath)
        {
            List<FileInfo> files = new DirectoryInfo(directoryPath).GetFiles("*.json")
                         .OrderByDescending(f => f.CreationTime)
                         .ToList();

            while (files.Count > 100)
            {
                files.Last().Delete();
                _ = files.Remove(files.Last());
            }
        }

        private void ManageStueckeBackupFiles(string directoryPath)
        {
            List<FileInfo> files = new DirectoryInfo(directoryPath).GetFiles("*.json")
                         .OrderByDescending(f => f.CreationTime)
                         .ToList();

            while (files.Count > 100)
            {
                files.Last().Delete();
                _ = files.Remove(files.Last());
            }
        }

        private void ManageSchauBackupFiles(string directoryPath)
        {
            List<FileInfo> files = new DirectoryInfo(directoryPath).GetFiles("*.json")
                         .OrderByDescending(f => f.CreationTime)
                         .ToList();

            while (files.Count > 100)
            {
                files.Last().Delete();
                _ = files.Remove(files.Last());
            }
        }

        private void ManageVorschBackupFiles(string directoryPath)
        {
            List<FileInfo> files = new DirectoryInfo(directoryPath).GetFiles("*.json")
                         .OrderByDescending(f => f.CreationTime)
                         .ToList();

            while (files.Count > 100)
            {
                files.Last().Delete();
                _ = files.Remove(files.Last());
            }
        }

        private void ManagePlanBackupFiles(string directoryPath)
        {
            List<FileInfo> files = new DirectoryInfo(directoryPath).GetFiles("*.json")
                         .OrderByDescending(f => f.CreationTime)
                         .ToList();

            while (files.Count > 100)
            {
                files.Last().Delete();
                _ = files.Remove(files.Last());
            }
        }

        public void SaveDataToFile(string filePath)
        {
            string json = JsonConvert.SerializeObject(_originalRowsData, Formatting.Indented);
            try
            {
                File.WriteAllText(filePath, json);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SaveStueckeDataToFile(string StueckefilePath)
        {
            string jsonString = JsonConvert.SerializeObject(_originalStueckeRowsData, Formatting.Indented);
            try
            {
                System.IO.File.WriteAllText(StueckefilePath, jsonString);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SaveSchauDataToFile(string SchaufilePath)
        {
            string jsonString = JsonConvert.SerializeObject(_originalSchauRowsData, Formatting.Indented);
            try
            {
                System.IO.File.WriteAllText(SchaufilePath, jsonString);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SaveVorschDataToFile(string VorschfilePath)
        {
            string jsonString = JsonConvert.SerializeObject(_originalVorschRowsData, Formatting.Indented);
            try
            {
                System.IO.File.WriteAllText(VorschfilePath, jsonString);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SavePlanDataToFile(string PlanfilePath)
        {
            string jsonString = JsonConvert.SerializeObject(_originalPlanListeRowsData, Formatting.Indented);
            try
            {
                System.IO.File.WriteAllText(PlanfilePath, jsonString);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }


        private void SpeichernToolStripMenuItem_Click(object sender, EventArgs e)
        {
            using (SaveFileDialog sfd = new SaveFileDialog())
            {
                sfd.Filter = "JSON files (*.json)|*.json|All files (*.*)|*.*";
                sfd.Title = "Speichern als...";
                sfd.OverwritePrompt = true;
                if (sfd.ShowDialog() == DialogResult.OK)
                {
                    SaveDataToFile(sfd.FileName);
                    SaveStueckeDataToFile(sfd.FileName);
                    SaveSchauDataToFile(sfd.FileName);
                }
            }
        }

        private void LadenToolStripMenuItem_Click(object sender, EventArgs e)
        {
            using (OpenFileDialog ofd = new OpenFileDialog())
            {
                ofd.Filter = "JSON files (*.json)|*.json|All files (*.*)|*.*";
                ofd.Title = "Laden...";
                if (ofd.ShowDialog() == DialogResult.OK)
                {
                    LoadDataFromFile(ofd.FileName);
                    LoadStueckeDataFromFile(ofd.FileName);
                    LoadSchauDataFromFile(ofd.FileName);
                }
            }
            CheckForListeSchauNameduplicates();
        }


        private void LoadDataFromFile(string filePath)
        {
            string jsonString = System.IO.File.ReadAllText(filePath);
            _originalRowsData = JsonConvert.DeserializeObject<List<ListeRowData>>(jsonString);
        }

        private void LoadStueckeDataFromFile(string StueckefilePath)
        {
            string jsonString = System.IO.File.ReadAllText(StueckefilePath);
            _originalStueckeRowsData = JsonConvert.DeserializeObject<List<StueckeRowData>>(jsonString);
        }

        private void LoadSchauDataFromFile(string SchaufilePath)
        {
            string jsonString = System.IO.File.ReadAllText(SchaufilePath);
            _originalSchauRowsData = JsonConvert.DeserializeObject<List<SchauRowData>>(jsonString);
        }
        

        private void RefreshDataGridView()
        {
            ResListe.Rows.Clear();
            foreach (ListeRowData RowData in _originalRowsData)
            {
                int index = ResListe.Rows.Add(RowData.Firma, RowData.Adresse, RowData.Inhaber, RowData.Tel, RowData.Mail, RowData.Termin, RowData.Kommentar, RowData.Land, RowData.Bundesland, RowData.Bezirk, RowData.Ort, RowData.Stern1, RowData.Stern2, RowData.Stern3, RowData.Stern4, RowData.Stern5, RowData.Fahrzeit, RowData.Offen, RowData.ErsteMail, RowData.ErstGespraech, RowData.Buehne, RowData.Nein, RowData.Zunahe);
                ResListe.Rows[index].Tag = RowData;
            }
        }

        private void RefreshStueckeDataGridView()
        {
            StueckeListe.Rows.Clear();
            foreach (StueckeRowData RowData in _originalStueckeRowsData)
            {
                int index = StueckeListe.Rows.Add(RowData.StueckeName, RowData.Beschreibung, RowData.FigCount, RowData.Rollen, RowData.RollenBesch);
                StueckeListe.Rows[index].Tag = RowData;
            }
        }

        private void RefreshSchauDataGridView()
        {
            SchauListe.Rows.Clear();
            foreach (SchauRowData RowData in _originalSchauRowsData)
            {
                int index = SchauListe.Rows.Add(RowData.Schauspieler, RowData.SchauAdresse, RowData.SchauTelefonnummer, RowData.SchauEmail, RowData.SchauArchi, RowData.SchauRollen, RowData.SchauAbendregie);
                SchauListe.Rows[index].Tag = RowData;
            }
        }

        private void RefreshVorschDataGridView()
        {
            VorschListe.Rows.Clear();
            foreach (VorschRowData RowData in _originalVorschRowsData)
            {
                int index = VorschListe.Rows.Add(RowData.Lokation, RowData.Datum, RowData.Zeit, RowData.Stueck);
                VorschListe.Rows[index].Tag = RowData;
            }
        }


        private void RefreshDataGridView(List<ListeRowData> filteredData)
        {
            ResListe.Rows.Clear();
            foreach (ListeRowData RowData in filteredData)
            {
                int index = ResListe.Rows.Add(RowData.Firma, RowData.Adresse, RowData.Inhaber, RowData.Tel, RowData.Mail, RowData.Termin, RowData.Kommentar, RowData.Land, RowData.Bundesland, RowData.Bezirk, RowData.Ort, RowData.Stern1, RowData.Stern2, RowData.Stern3, RowData.Stern4, RowData.Stern5, RowData.Fahrzeit, RowData.Offen, RowData.ErsteMail, RowData.ErstGespraech, RowData.Buehne, RowData.Nein, RowData.Zunahe);
                ResListe.Rows[index].Tag = RowData;
            }
        }

        private void RefreshStueckeDataGridView(List<StueckeRowData> filteredData)
        {
            StueckeListe.Rows.Clear();
            foreach (StueckeRowData StueckeRowData in filteredData)
            {
                int index = StueckeListe.Rows.Add(StueckeRowData.StueckeName, StueckeRowData.Beschreibung, StueckeRowData.FigCount, StueckeRowData.Rollen, StueckeRowData.RollenBesch);
                StueckeListe.Rows[index].Tag = StueckeRowData;
            }
        }

        private void RefreshSchauDataGridView(List<SchauRowData> filteredData)
        {
            SchauListe.Rows.Clear();
            foreach (SchauRowData SchauRowData in filteredData)
            {
                int index = SchauListe.Rows.Add(SchauRowData.Schauspieler, SchauRowData.SchauAdresse, SchauRowData.SchauTelefonnummer, SchauRowData.SchauEmail, SchauRowData.SchauArchi, SchauRowData.SchauRollen, SchauRowData.SchauAbendregie);
                SchauListe.Rows[index].Tag = SchauRowData;
            }
        }

        public void RefreshPlanListe()
        {
            string filePath = @"F:\StagOrg\VS\res format\json\PlanListe.json";
            try
            {
                string jsonString = File.ReadAllText(filePath);
                var planListeData = JsonConvert.DeserializeObject<List<PlanListeRowData>>(jsonString);
                _originalPlanListeRowsData = planListeData;


                RefreshPlanListeDataGridView();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der PlanListe-Daten: {ex.Message}", "Ladefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void RefreshVorschListe()
        {
            string filePath = @"F:\StagOrg\VS\res format\json\res_format_VorschData.json";
            try
            {
                string jsonString = File.ReadAllText(filePath);
                var VorschListeData = JsonConvert.DeserializeObject<List<VorschRowData>>(jsonString);
                _originalVorschRowsData = VorschListeData;

                RefreshVorschDataGridView();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der VorschListe-Daten: {ex.Message}", "Ladefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void RefreshPlanListeDataGridView()
        {
            PlanListe.Rows.Clear();
            foreach (var rowData in _originalPlanListeRowsData)
            {
                int rowIndex = PlanListe.Rows.Add(rowData.FolderName, rowData.JsonFileName);
                PlanListe.Rows[rowIndex].Tag = rowData;

                string filePath = @"F:\StagOrg\VS\res format\json\Firmen\";
                string folderPath = Path.Combine(filePath, rowData.FolderName);
                string jsonFilePath = Path.Combine(folderPath, "Organ", $"{rowData.JsonFileName}.json");

                // Ensure the file exists before attempting to read it
                if (File.Exists(jsonFilePath))
                {
                    string jsonString = File.ReadAllText(jsonFilePath);
                    var planListeData = JsonConvert.DeserializeObject<List<PlanListeRowData>>(jsonString);

                    if (planListeData != null)
                    {
                        // Check if all "Besetzt" values are true and not null
                        bool allBesetztTrue = planListeData.All(row => row?.Besetzt != null && row.Besetzt.Equals("True", StringComparison.OrdinalIgnoreCase));

                        // Set the row color to green if all "Besetzt" values are true
                        if (allBesetztTrue)
                        {
                            PlanListe.Rows[rowIndex].DefaultCellStyle.BackColor = System.Drawing.Color.Green;
                        }
                    }
                    else
                    {
                        MessageBox.Show($"Failed to deserialize JSON from file: {jsonFilePath}", "Deserialization Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
                else
                {
                    MessageBox.Show($"File not found: {jsonFilePath}", "File Not Found", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
        }

        public void SaveAllListeData()
        {
            // Definieren Sie hier den festen Pfad, an dem die Daten gespeichert werden sollen.
            string filePath = @"F:\StagOrg\VS\res format\json\res_format_data.json";
            try
            {
                SaveDataToFile(filePath);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SaveAllStueckeData()
        {
            // Definieren Sie hier den festen Pfad, an dem die Daten gespeichert werden sollen.
            string StueckefilePath = @"F:\StagOrg\VS\res format\json\res_format_Stueckedata.json";
            try
            {
                SaveStueckeDataToFile(StueckefilePath);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SaveAllSchauData()
        {
            // Definieren Sie hier den festen Pfad, an dem die Daten gespeichert werden sollen.
            string SchaufilePath = @"F:\StagOrg\VS\res format\json\res_format_SchauData.json";
            try
            {
                SaveSchauDataToFile(SchaufilePath);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SaveAllVorschData()
        {
            // Definieren Sie hier den festen Pfad, an dem die Daten gespeichert werden sollen.
            string VorschfilePath = @"F:\StagOrg\VS\res format\json\res_format_VorschData.json";
            try
            {
                SaveVorschDataToFile(VorschfilePath);
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung, falls beim Schreiben in die Datei ein Fehler auftritt
                _ = MessageBox.Show($"Ein Fehler ist aufgetreten beim Speichern der Datei: {ex.Message}", "Speicherfehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void LoadAllListeData()
        {
            string filePath = @"F:\StagOrg\VS\res format\json\res_format_data.json";
            try
            {
                string jsonString = File.ReadAllText(filePath);
                _originalRowsData = JsonConvert.DeserializeObject<List<ListeRowData>>(jsonString);
                RefreshDataGridView();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der Daten aus {filePath}: {ex.Message}", "Ladefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        
        private void LoadAllStueckeData()
        {
            string StueckefilePath = @"F:\StagOrg\VS\res format\json\res_format_Stueckedata.json";
            try
            {
                string jsonString = File.ReadAllText(StueckefilePath);
                _originalStueckeRowsData = JsonConvert.DeserializeObject<List<StueckeRowData>>(jsonString);
                RefreshStueckeDataGridView();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der Daten aus {StueckefilePath}: {ex.Message}", "Ladefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            CheckForListeStueckeNameduplicates();
        }

        private void LoadAllSchauData()
        {
            string SchaufilePath = @"F:\StagOrg\VS\res format\json\res_format_SchauData.json";
            try
            {
                string jsonString = File.ReadAllText(SchaufilePath);
                _originalSchauRowsData = JsonConvert.DeserializeObject<List<SchauRowData>>(jsonString);
                RefreshSchauDataGridView();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der Daten aus {SchaufilePath}: {ex.Message}", "Ladefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            CheckForListeSchauNameduplicates();
        }

        private void LoadAllVorschData()
        {
            string VorschfilePath = @"F:\StagOrg\VS\res format\json\res_format_VorschData.json";
            try
            {
                string jsonString = File.ReadAllText(VorschfilePath);
                _originalVorschRowsData = JsonConvert.DeserializeObject<List<VorschRowData>>(jsonString);
                RefreshVorschDataGridView();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der Daten aus {VorschfilePath}: {ex.Message}", "Ladefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }


        public void UpdateRowTags(string firma, string adresse, ListeRowData newTags)
        {
            bool found = false;
            foreach (ListeRowData row in _originalRowsData)
            {
                if (row.Firma == firma && row.Adresse == adresse)
                {
                    row.Offen = newTags.Offen;
                    row.ErsteMail = newTags.ErsteMail;
                    row.ErstGespraech = newTags.ErstGespraech;
                    row.Buehne = newTags.Buehne;
                    row.Nein = newTags.Nein;
                    row.Zunahe = newTags.Zunahe;
                    found = true;
                    break; // Beendet die Schleife, sobald eine Übereinstimmung gefunden wurde
                }
            }
            if (!found)
            {
                _ = MessageBox.Show($"Keine Übereinstimmung gefunden für: {firma} an der Adresse {adresse}.", "Aktualisierung fehlgeschlagen", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }


        public void AddNewListeRowData(ListeRowData RowData)
        {
            if (_originalRowsData == null)
            {
                _originalRowsData = new List<ListeRowData>();
            }

            _originalRowsData.Add(RowData); // Daten zur Liste hinzufügen
            int rowIndex = ResListe.Rows.Add(RowData.Firma, RowData.Adresse, RowData.Inhaber, RowData.Tel, RowData.Mail, RowData.Termin, RowData.Kommentar, RowData.Land, RowData.Bundesland, RowData.Bezirk, RowData.Ort, RowData.Stern1, RowData.Stern2, RowData.Stern3, RowData.Stern4, RowData.Stern5, RowData.Fahrzeit, RowData.Offen, RowData.ErsteMail, RowData.ErstGespraech, RowData.Buehne, RowData.Nein, RowData.Zunahe);
            ResListe.Rows[rowIndex].Tag = RowData; // Setze RowData als Tag für die Zugänglichkeit später
        }

        public void AddNewStueckeRowData(StueckeRowData StueckeRowData)
        {
            if (_originalStueckeRowsData == null)
            {
                _originalStueckeRowsData = new List<StueckeRowData>();
            }

            _originalStueckeRowsData.Add(StueckeRowData); // Daten zur Liste hinzufügen
            int rowIndex = StueckeListe.Rows.Add(StueckeRowData.StueckeName, StueckeRowData.Beschreibung, StueckeRowData.FigCount, StueckeRowData.Rollen, StueckeRowData.RollenBesch);
            StueckeListe.Rows[rowIndex].Tag = StueckeRowData; // Setze StueckeRowData als Tag für die Zugänglichkeit später
        }

        public void AddNewSchauRowData(SchauRowData SchauRowData)
        {
            if (_originalSchauRowsData == null)
            {
                _originalSchauRowsData = new List<SchauRowData>();
            }

            _originalSchauRowsData.Add(SchauRowData); // Daten zur Liste hinzufügen
            int rowIndex = SchauListe.Rows.Add(SchauRowData.Schauspieler, SchauRowData.SchauAdresse, SchauRowData.SchauTelefonnummer, SchauRowData.SchauEmail, SchauRowData.SchauArchi, SchauRowData.SchauRollen, SchauRowData.SchauAbendregie);
            SchauListe.Rows[rowIndex].Tag = SchauRowData; // Setze SchauRowData als Tag für die Zugänglichkeit später
        }

        public void AddNewVorschRowData(VorschRowData VorschRowData)
        {
            if (_originalVorschRowsData == null)
            {
                _originalVorschRowsData = new List<VorschRowData>();
            }

            _originalVorschRowsData.Add(VorschRowData); // Daten zur Liste hinzufügen
            int rowIndex = VorschListe.Rows.Add(VorschRowData.Lokation, VorschRowData.Datum, VorschRowData.Zeit, VorschRowData.Stueck);
            VorschListe.Rows[rowIndex].Tag = VorschRowData; // Setze VorschRowData als Tag für die Zugänglichkeit später
        }

        public List<ListeRowData> GetAllListeRowData()
        {
            return _originalRowsData;
        }

        public List<StueckeRowData> GetAllStueckeRowData()
        {
            return _originalStueckeRowsData;
        }

        public List<SchauRowData> GetAllSchauRowData()
        {
            return _originalSchauRowsData;
        }

        public List<VorschRowData> GetAllVorschRowData()
        {
            return _originalVorschRowsData;
        }

        private void Liste_Load(object sender, EventArgs e)
        {
            LoadAllListeData();  // Ruft die Methode zum Laden der Daten auf
            RefreshPlanListe();
            CheckForListeFirmaDuplicates();

        }

        private void StueckeListe_Load(object sender, EventArgs e)
        {
            LoadAllStueckeData();  // Ruft die Methode zum Laden der Daten auf
        }

        private void SchauListe_Load(object sender, EventArgs e)
        {
            LoadAllSchauData();  // Ruft die Methode zum Laden der Daten auf
        }

        private void VorschListe_Load(object sender, EventArgs e)
        {
            LoadAllVorschData();  // Ruft die Methode zum Laden der Daten auf
        }

        public void PlanListe_Load(object sender, EventArgs e)
        {
            // planliste leeren
            Task.Run(() => InitializePlanListeData()).Wait(); // Daten initialisieren und warten bis der Task abgeschlossen ist.
            LoadAllPlanListeData(); // Daten laden und in der PlanListe anzeigen.
        }

        private void LoadAllPlanListeData()
        {
            string filePath = @"F:\StagOrg\VS\res format\json\PlanListe.json";
            try
            {
                string jsonString = File.ReadAllText(filePath);
                _originalPlanListeRowsData = JsonConvert.DeserializeObject<List<PlanListeRowData>>(jsonString);

                RefreshPlanListeDataGridView();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der PlanListe-Daten: {ex.Message}", "Ladefehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async void BearbeitenDataSaved(object sender, EventArgs e)
        {
            await Task.Delay(500);
            SaveAllListeData(); // Speichern aller Daten
            LoadAllListeData();    // Neu laden der Daten
            UpdateDataGridView(); // Aktual
        }

        private async void StueckeDataSaved(object sender, EventArgs e)
        {
            await Task.Delay(500);
            SaveAllStueckeData(); // Speichern aller Daten
            LoadAllStueckeData();    // Neu laden der Daten
        }

        private async void SchauDataSaved(object sender, EventArgs e)
        {
            await Task.Delay(500);
            SaveAllSchauData(); // Speichern aller Daten
            LoadAllSchauData();    // Neu laden der Daten
        }
        public async void VorschDataSaved(object sender, EventArgs e)
        {
            await Task.Delay(500);
            SaveAllVorschData(); // Speichern aller Daten
            LoadAllVorschData();    // Neu laden der Daten
        }

        private bool ShouldRowBeVisible(ListeRowData RowData, string filter)
        {
            switch (filter)
            {
                case "Offen":
                    return RowData.Offen;
                case "Erste Mail":
                    return RowData.ErsteMail;
                case "Erst Gespräch":
                    return RowData.ErstGespraech;
                case "Bühne":
                    return RowData.Buehne;
                case "Nein":
                    return RowData.Nein;
                case "Zu nahe":
                    return RowData.Zunahe;
                case "leer":
                    return !RowData.Offen && !RowData.ErsteMail && !RowData.ErstGespraech && !RowData.Buehne && !RowData.Nein && !RowData.Zunahe;
                default:
                    return true; // 'Alle' oder unbekannte Filter zeigen alle Zeilen
            }
        }


        private void InitializeOriginalData()
        {
            _originalRowsData = ResListe.Rows.Cast<DataGridViewRow>()
                                          .Where(row => row.Tag is ListeRowData)
                                          .Select(row => row.Tag as ListeRowData)
                                          .ToList();
        }

        private void InitializePlanListeData()
        {
            string rootDirectoryPath = @"F:\StagOrg\VS\res format\json\Firmen";
            string outputFilePath = @"F:\StagOrg\VS\res format\json\PlanListe.json";

            var planListeData = new List<PlanListeRowData>();

            foreach (string dir in Directory.GetDirectories(rootDirectoryPath))
            {
                string organDirectory = Path.Combine(dir, "Organ");
                if (Directory.Exists(organDirectory))
                {
                    foreach (string jsonFile in Directory.GetFiles(organDirectory, "*.json"))
                    {
                        var rowData = new PlanListeRowData
                        {
                            FolderName = Path.GetFileName(dir),
                            JsonFileName = Path.GetFileNameWithoutExtension(jsonFile) // Remove .json extension
                        };
                        planListeData.Add(rowData);
                    }
                }
            }

            string jsonString = JsonConvert.SerializeObject(planListeData, Formatting.Indented);
            File.WriteAllText(outputFilePath, jsonString);
        }


        private void InitializeMenu()
        {
            menuStrip1 = new MenuStrip();
            dateiToolStripMenuItem = new ToolStripMenuItem();
            speichernToolStripMenuItem = new ToolStripMenuItem();
            ladenToolStripMenuItem = new ToolStripMenuItem();

            menuStrip1.Items.AddRange(new ToolStripItem[] {
            dateiToolStripMenuItem
            });

            dateiToolStripMenuItem.DropDownItems.AddRange(new ToolStripItem[] {
            speichernToolStripMenuItem,
            ladenToolStripMenuItem
            });

            dateiToolStripMenuItem.Text = "Datei";
            speichernToolStripMenuItem.Text = "Speichern";
            ladenToolStripMenuItem.Text = "Laden";

            speichernToolStripMenuItem.Click += new EventHandler(SpeichernToolStripMenuItem_Click);
            ladenToolStripMenuItem.Click += new EventHandler(LadenToolStripMenuItem_Click);

            Controls.Add(menuStrip1);
            MainMenuStrip = menuStrip1;
        }

        public List<string> GetZunaheAddresses()
        {
            return ResListe.Rows.Cast<DataGridViewRow>()
                   .Where(row => row.Tag is ListeRowData data && data.Zunahe)
                   .Select(row => $"{((ListeRowData)row.Tag).Firma}; {((ListeRowData)row.Tag).Adresse}")
                   .ToList();
        }

        public static Liste Instance { get; private set; }  // Singleton-Instanz

        public class ListeRowData
        {
            public string Firma { get; set; }

            public string Adresse { get; set; }

            public string Inhaber { get; set; }

            public string Tel { get; set; }

            public string Mail { get; set; }

            public string Termin { get; set; }

            public string Kommentar { get; set; }

            public string Land { get; set; }

            public string Bundesland { get; set; }

            public string Bezirk { get; set; }

            public string Ort { get; set; }
            public bool Stern1 { get; set; }
            public bool Stern2 { get; set; }
            public bool Stern3 { get; set; }
            public bool Stern4 { get; set; }
            public bool Stern5 { get; set; }
            public string Fahrzeit { get; set; }
            public bool Offen { get; set; }
            public bool ErsteMail { get; set; }
            public bool ErstGespraech { get; set; }
            public bool Buehne { get; set; }
            public bool Nein { get; set; }
            public bool Zunahe { get; set; }
            
        }

        public class StueckeRowData
        {
            public string StueckeName { get; set; }
            public string Beschreibung { get; set; }
            public string FigCount { get; set; }
            public string Rollen { get; set; }
            public string RollenBesch { get; set; }

        }

        public class SchauRowData
        {
            public string Schauspieler { get; set; }
            public string SchauAdresse { get; set; }
            public string SchauTelefonnummer { get; set; }
            public string SchauEmail { get; set; }
            public string SchauArchi { get; set; }
            public string SchauRollen { get; set; }
            public string SchauAbendregie { get; set; }
        }

        public class VorschRowData
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


        public class PlanListeRowData
        {
            public string FolderName { get; set; }
            public string JsonFileName { get; set; }
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


        public void DeleteZunaheRows()
        {
            List<ListeRowData> rowsToRemove = _originalRowsData.Where(row => row.Zunahe).ToList();
            foreach (ListeRowData RowData in rowsToRemove)
            {
                DataGridViewRow row = ResListe.Rows.Cast<DataGridViewRow>().FirstOrDefault(r => r.Tag == RowData);
                if (row != null)
                {
                    ResListe.Rows.Remove(row);
                }
            }
            _ = _originalRowsData.RemoveAll(row => row.Zunahe);
            SaveAllListeData();
        }

        public List<StueckeRowData> GetStueckeData()
        {
            // Assuming _originalStueckeRowsData is your data source for "Stuecke" related information
            return _originalStueckeRowsData;
        }

        public List<SchauRowData> GetSchauData()
        {
            // Assuming _originalSchauRowsData is your data source for "Schau" related information
            return _originalSchauRowsData;
        }

        public List<VorschRowData> GetVorschData()
        {
            // Assuming _originalSchauRowsData is your data source for "Schau" related information
            return _originalVorschRowsData;
        }

        private void ResListe_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {

            if (e.RowIndex >= 0)
            {
                List<StueckeRowData> stueckeData = GetStueckeData(); // Diese Methode sollte deine tatsächlichen Daten liefern
                List<SchauRowData> schauData = GetSchauData(); // Diese Methode sollte deine tatsächlichen Daten liefern
                DataGridViewRow row = ResListe.Rows[e.RowIndex];
                if (row.Tag is ListeRowData RowData)
                {
                    using (Bearbeiten Bearbeiten = new Bearbeiten(schauData))
                    {
                        InitializeBearbeitenWithListeRowData(Bearbeiten, RowData);

                        // Laden der sichtbaren Daten
                        Bearbeiten.FirmaBox.Text = row.Cells["FirmaColumn"].Value?.ToString() ?? "";
                        Bearbeiten.AdresseBox.Text = row.Cells["FirmaAdresseColumn"].Value?.ToString() ?? "";
                        Bearbeiten.InhaberBox.Text = row.Cells["FirmaInhaberColumn"].Value?.ToString() ?? "";
                        Bearbeiten.TelefonBox.Text = row.Cells["FirmaTelefonColumn"].Value?.ToString() ?? "";
                        Bearbeiten.EmailBox.Text = row.Cells["FirmaEMailColumn"].Value?.ToString() ?? "";
                        Bearbeiten.TerminBox.Text = row.Cells["FirmaTerminColumn"].Value?.ToString() ?? "";
                        Bearbeiten.KommentarBox.Text = row.Cells["FirmaKommentarColumn"].Value?.ToString() ?? "";
                        Bearbeiten.LandBox.Text = row.Cells["LandColumn"].Value?.ToString() ?? "";
                        Bearbeiten.BundeslandBox.Text = row.Cells["BundeslandColumn"].Value?.ToString() ?? "";
                        Bearbeiten.BezirkBox.Text = row.Cells["BezirkColumn"].Value?.ToString() ?? "";
                        Bearbeiten.OrtBox.Text = row.Cells["OrtColumn"].Value?.ToString() ?? "";
                        Bearbeiten.Stern1.Visible = RowData?.Stern1 ?? false;
                        Bearbeiten.Stern2.Visible = RowData?.Stern2 ?? false;
                        Bearbeiten.Stern3.Visible = RowData?.Stern3 ?? false;
                        Bearbeiten.Stern4.Visible = RowData?.Stern4 ?? false;
                        Bearbeiten.Stern5.Visible = RowData?.Stern5 ?? false;

                        Bearbeiten.FahrzeitBox.Text = row.Cells["FahrzeitColumn"].Value?.ToString() ?? "";

                        // ... andere Felder

                        // Laden der Daten aus der Tag-Eigenschaft
                        Bearbeiten.OffenCheckbox.Checked = RowData?.Offen ?? false;
                        Bearbeiten.ErsteMailCheckbox.Checked = RowData?.ErsteMail ?? false;
                        Bearbeiten.ErstGespraechCheckbox.Checked = RowData?.ErstGespraech ?? false;
                        Bearbeiten.BuehneCheckbox.Checked = RowData?.Buehne ?? false;
                        Bearbeiten.NeinCheckbox.Checked = RowData?.Nein ?? false;
                        Bearbeiten.ZunaheCheckbox.Checked = RowData?.Zunahe ?? false;

                        // sternTextInt 

                        Bearbeiten.DataSaved += BearbeitenDataSaved; // Hinzufügen des Event-Handlers
                        // hollen von string Stern1V aus bearbeiten.cs
                        


                        if (Bearbeiten.ShowDialog() == DialogResult.OK)
                        {
                            // Stern1V in bool umwandeln
                           
                            // Aktualisieren der sichtbaren Daten
                            row.Cells["FirmaColumn"].Value = Bearbeiten.FirmaBox.Text;
                            row.Cells["FirmaAdresseColumn"].Value = Bearbeiten.AdresseBox.Text;
                            row.Cells["FirmaInhaberColumn"].Value = Bearbeiten.InhaberBox.Text;
                            row.Cells["FirmaTelefonColumn"].Value = Bearbeiten.TelefonBox.Text;
                            row.Cells["FirmaEMailColumn"].Value = Bearbeiten.EmailBox.Text;
                            row.Cells["FirmaTerminColumn"].Value = Bearbeiten.TerminBox.Text;
                            row.Cells["FirmaKommentarColumn"].Value = Bearbeiten.KommentarBox.Text;
                            row.Cells["LandColumn"].Value = Bearbeiten.LandBox.Text;
                            row.Cells["BundeslandColumn"].Value = Bearbeiten.BundeslandBox.Text;
                            row.Cells["BezirkColumn"].Value = Bearbeiten.BezirkBox.Text;
                            row.Cells["OrtColumn"].Value = Bearbeiten.OrtBox.Text;
                            RowData.Stern1 = Bearbeiten.S1.Checked;
                            RowData.Stern2 = Bearbeiten.S2.Checked;
                            RowData.Stern3 = Bearbeiten.S3.Checked;
                            RowData.Stern4 = Bearbeiten.S4.Checked;
                            RowData.Stern5 = Bearbeiten.S5.Checked;
                            row.Cells["FahrzeitColumn"].Value = Bearbeiten.FahrzeitBox.Text;

                            // Aktualisieren der Tag-Daten
                            RowData.Offen = Bearbeiten.OffenCheckbox.Checked;
                            RowData.ErsteMail = Bearbeiten.ErsteMailCheckbox.Checked;
                            RowData.ErstGespraech = Bearbeiten.ErstGespraechCheckbox.Checked;
                            RowData.Buehne = Bearbeiten.BuehneCheckbox.Checked;
                            RowData.Nein = Bearbeiten.NeinCheckbox.Checked;
                            RowData.Zunahe = Bearbeiten.ZunaheCheckbox.Checked;


                            UpdateListeRowDataFromBearbeiten(Bearbeiten, RowData);
                            row.Tag = RowData;
                        }
                    }
                }
            }
        }

        private void StueckeListe_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = StueckeListe.Rows[e.RowIndex];
                if (row.Tag is StueckeRowData RowData)
                {
                    using (Stuecke Stuecke = new Stuecke())
                    {
                        InitializeStueckeWithStueckeRowData(Stuecke, RowData);

                        // Laden der sichtbaren Daten
                        Stuecke.NameBox.Text = row.Cells["StueckeNameColumn"].Value?.ToString() ?? "";
                        Stuecke.Beschreibung.Text = row.Cells["BeschreibungColumn"].Value?.ToString() ?? "";
                        Stuecke.FigCount.Text = row.Cells["FigCountColumn"].Value?.ToString() ?? "";




                        Stuecke.DataSaved += StueckeDataSaved; // Hinzufügen des Event-Handlers


                        if (Stuecke.ShowDialog() == DialogResult.OK)
                        {
                            // Aktualisieren der sichtbaren Daten
                            row.Cells["StueckeNameColumn"].Value = Stuecke.NameBox.Text;
                            row.Cells["BeschreibungColumn"].Value = Stuecke.Beschreibung.Text;
                            row.Cells["FigCountColumn"].Value = Stuecke.FigCount.Text;
                            // die RollenColumn nach 

                            UpdateRowDataFromStuecke(Stuecke, RowData);
                            row.Tag = RowData;
                        }
                    }
                }
            }
        }

        private void SchauListe_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {

            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = SchauListe.Rows[e.RowIndex];
                if (row.Tag is SchauRowData RowData)
                {
                    using (Schau Schau = new Schau())
                    {
                        InitializeSchauWithSchauRowData(Schau, RowData);

                        // Laden der sichtbaren Daten
                        Schau.NameBox.Text = row.Cells["Schauspieler"].Value?.ToString() ?? "";
                        Schau.AdresseBox.Text = row.Cells["SchauAdresseColumn"].Value?.ToString() ?? "";
                        Schau.TelefonnummerBox.Text = row.Cells["SchauTelefonnummerColumn"].Value?.ToString() ?? "";
                        Schau.EmailBox.Text = row.Cells["SchauEmailColumn"].Value?.ToString() ?? "";
                        Schau.DataBox.Text = row.Cells["SchauArchiColumn"].Value?.ToString() ?? "";
                        Schau.StRoBox.Text = row.Cells["SchauRollenColumn"].Value?.ToString() ?? "";
                        Schau.AbRgCheck.Checked = Convert.ToBoolean(row.Cells["SchauAbendregieColumn"].Value);

                        Schau.DataSaved += SchauDataSaved; // Hinzufügen des Event-Handlers

                        if (Schau.ShowDialog() == DialogResult.OK)
                        {
                            // Aktualisieren der sichtbaren Daten
                            row.Cells["Schauspieler"].Value = Schau.NameBox.Text;
                            row.Cells["SchauAdresseColumn"].Value = Schau.AdresseBox.Text;
                            row.Cells["SchauTelefonnummerColumn"].Value = Schau.TelefonnummerBox.Text;
                            row.Cells["SchauEmailColumn"].Value = Schau.EmailBox.Text;
                            row.Cells["SchauArchiColumn"].Value = Schau.DataBox.Text;
                            row.Cells["SchauRollenColumn"].Value = Schau.StRoBox.Text;
                            row.Cells["SchauAbendregieColumn"].Value = Schau.AbRgCheck.Checked;

                            UpdateRowDataFromSchau(Schau, RowData);
                            row.Tag = RowData;
                        }
                    }
                }
            }
        }

        private async void PlanListe_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0) return;

            string firma = PlanListe.Rows[e.RowIndex].Cells[0].Value?.ToString();
            string tabbelnComboValue = PlanListe.Rows[e.RowIndex].Cells[1].Value?.ToString();

            if (string.IsNullOrEmpty(firma) || string.IsNullOrEmpty(tabbelnComboValue))
            {
                MessageBox.Show("Firma oder Tabellenname ist leer. Bitte überprüfen Sie die Daten.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // einfügen der spalte zwei in Klickauswahl
            Klickauswahl.Text = tabbelnComboValue;

            // eine sekunde warten
            await Task.Delay(100);

            

            var matchingRow = _originalRowsData.FirstOrDefault(row => row.Firma == firma);
            if (matchingRow != null)
            {
                DataGridViewRow targetRow = ResListe.Rows.Cast<DataGridViewRow>().FirstOrDefault(row => row.Tag == matchingRow);
                if (targetRow != null)
                {
                    int rowIndex = ResListe.Rows.IndexOf(targetRow);
                    ResListe.ClearSelection();
                    targetRow.Selected = true;

                    // Simulate cell double-click event on ResListe
                    ResListe_CellDoubleClick(ResListe, new DataGridViewCellEventArgs(0, rowIndex));


                }
                else
                {
                    MessageBox.Show("Die Zeile konnte nicht in ResListe gefunden werden.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            else
            {
                MessageBox.Show($"Keine passende Zeile für Firma {firma} gefunden.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void VorschListe_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = VorschListe.Rows[e.RowIndex];
                if (row.Tag is VorschRowData RowData)
                {
                    // hollen der Stueck row und in string umwandeln
                    string stueck = row.Cells["VorschStueckColumn"].Value?.ToString() ?? "";
                    string schauspielerundRollen = RowData.SchauspielerundRollen ?? "";
                    string regie = RowData?.Regie ?? "";
                    string driverPassengers = RowData?.DriverPassengers ?? "";
                    string mitfahrer = RowData?.Mitfahrer ?? "";
                    using (Vorsch Vorsch = new Vorsch())
                    {
                        InitializeVorschWithVorschRowData(Vorsch, RowData);

                        // Laden der sichtbaren Daten
                        Vorsch.LokationBox.Text = row.Cells["VorschLokationColumn"].Value?.ToString() ?? "";
                        Vorsch.DatumBox.Text = row.Cells["VorschDatumColumn"].Value?.ToString() ?? "";
                        Vorsch.ZeitBox.Text = row.Cells["VorschZeitColumn"].Value?.ToString() ?? "";
                        _ = Vorsch.SetValue(stueck, regie, schauspielerundRollen, mitfahrer, driverPassengers);

                        Vorsch.DataSaved += VorschDataSaved; // Hinzufügen des Event-Handlers

                        if (Vorsch.ShowDialog() == DialogResult.OK)
                        {
                            // Aktualisieren der sichtbaren Daten
                            row.Cells["VorschLokationColumn"].Value = Vorsch.LokationBox.Text;
                            row.Cells["VorschDatumColumn"].Value = Vorsch.DatumBox.Text;
                            row.Cells["VorschZeitColumn"].Value = Vorsch.ZeitBox.Text;
                            // die auswahl in Vorsch.StueckeListBox in RowData.Stueck speichern
                            RowData.Stueck = Vorsch.StueckeListBox.SelectedItem.ToString();
                            // hollen von Rolle1-6 und in string umwandeln
                            string SchauspielerundRollen = Vorsch.Rolle1.Text + ": " + Vorsch.RolleCombo1.SelectedItem + ";" + Vorsch.RolleCombo1.Items.Cast<object>().Aggregate("", (current, item) => current + item.ToString() + ", ").TrimEnd(',' , ' ') + "|" + Vorsch.Rolle2.Text + ": " + Vorsch.RolleCombo2.SelectedItem + ";" + Vorsch.RolleCombo2.Items.Cast<object>().Aggregate("", (current2, item2) => current2 + item2.ToString() + ", ").TrimEnd(',', ' ') + "|" + Vorsch.Rolle3.Text + ": " + Vorsch.RolleCombo3.SelectedItem + ";" + Vorsch.RolleCombo3.Items.Cast<object>().Aggregate("", (current3, item3) => current3 + item3.ToString() + ", ").TrimEnd(',', ' ') + "|" + Vorsch.Rolle4.Text + ": " + Vorsch.RolleCombo4.SelectedItem + ";" + Vorsch.RolleCombo4.Items.Cast<object>().Aggregate("", (current4, item4) => current4 + item4.ToString() + ", ").TrimEnd(',', ' ') + "|" + Vorsch.Rolle5.Text + ": " + Vorsch.RolleCombo5.SelectedItem + ";" + Vorsch.RolleCombo5.Items.Cast<object>().Aggregate("", (current5, item5) => current5 + item5.ToString() + ", ").TrimEnd(',', ' ') + "|" + Vorsch.Rolle6.Text + ": " + Vorsch.RolleCombo6.SelectedItem + ";" + Vorsch.RolleCombo6.Items.Cast<object>().Aggregate("", (current6, item6) => current6 + item6.ToString() + ", ").TrimEnd(',', ' ');
                            // Komma am ende entfernen
                            RowData.SchauspielerundRollen = SchauspielerundRollen;
                            RowData.Regie = Vorsch.RegieBox.SelectedItem + "; " + Vorsch.RegieBox.Items.Cast<object>().Aggregate("", (current, item) => current + item.ToString() + ", ");
                            // das freizeichen am ende und das komma am ende entfernen
                            RowData.Regie = RowData.Regie.Remove(RowData.Regie.Length - 2);
                            // hollen der Fahrer1-6 Checkboxen und in string umwandeln
                            string fahrercheck = Vorsch.Fahrer1.Checked + "," + Vorsch.Fahrer2.Checked + "," + Vorsch.Fahrer3.Checked + "," + Vorsch.Fahrer4.Checked + "," + Vorsch.Fahrer5.Checked + "," + Vorsch.Fahrer6.Checked;
                            string[] fahrerStatusArray = fahrercheck.Split(',');

                            // Überprüfen ob einer der Einträge true ist und den Index abspeichern
                            bool found = false;
                            int index = -1;
                            for (int i = 0; i < fahrerStatusArray.Length; i++)
                            {
                                if (fahrerStatusArray[i].Trim().ToLower() == "true")
                                {
                                    index = i;
                                    found = true;
                                }
                            }
                            UpdateRowDataFromVorsch(Vorsch, RowData);
                            row.Tag = RowData;
                        }
                    }
                }
            }
        }

        private async void InitializeBearbeitenWithListeRowData(Bearbeiten form, ListeRowData RowData)
        {
            form.FirmaBox.Text = RowData.Firma ?? "";
            form.AdresseBox.Text = RowData.Adresse ?? "";
            form.InhaberBox.Text = RowData.Inhaber ?? "";
            form.TelefonBox.Text = RowData.Tel ?? "";
            form.EmailBox.Text = RowData.Mail ?? "";
            form.TerminBox.Text = RowData.Termin ?? "";
            form.KommentarBox.Text = RowData.Kommentar ?? "";
            form.LandBox.Text = RowData.Land ?? "";
            form.BundeslandBox.Text = RowData.Bundesland ?? "";
            form.BezirkBox.Text = RowData.Bezirk ?? "";
            form.OrtBox.Text = RowData.Ort ?? "";
            form.Stern1.Visible = RowData.Stern1;
            form.Stern2.Visible = RowData.Stern2;
            form.Stern3.Visible = RowData.Stern3;
            form.Stern4.Visible = RowData.Stern4;
            form.Stern5.Visible = RowData.Stern5;
            form.FahrzeitBox.Text = RowData.Fahrzeit ?? "";
            form.OffenCheckbox.Checked = RowData.Offen;
            form.ErsteMailCheckbox.Checked = RowData.ErsteMail;
            form.ErstGespraechCheckbox.Checked = RowData.ErstGespraech;
            form.BuehneCheckbox.Checked = RowData.Buehne;
            form.NeinCheckbox.Checked = RowData.Nein;
            form.ZunaheCheckbox.Checked = RowData.Zunahe;
            await Task.Delay(100);
            form.PlanText.Text = Klickauswahl.Text;
        }

        private void InitializeStueckeWithStueckeRowData(Stuecke form, StueckeRowData RowData)
        {
            form.NameBox.Text = RowData.StueckeName ?? "";
            form.Beschreibung.Text = RowData.Beschreibung ?? "";
            form.FigCount.Text = RowData.FigCount ?? "";
            form.RollenBox.Text = RowData.Rollen ?? "";
            form.RollenBeschBox.Text = RowData.RollenBesch ?? "";
        }

        private void InitializeSchauWithSchauRowData(Schau form, SchauRowData RowData)
        {
            form.NameBox.Text = RowData.Schauspieler ?? "";
            form.AdresseBox.Text = RowData.SchauAdresse ?? "";
            form.TelefonnummerBox.Text = RowData.SchauTelefonnummer ?? "";
            form.EmailBox.Text = RowData.SchauEmail ?? "";
            form.DataBox.Text = RowData.SchauArchi ?? "";
            form.StRoBox.Text = RowData.SchauRollen ?? "";
            form.AbRgCheck.Checked = Convert.ToBoolean(RowData.SchauAbendregie);
        }

        private void InitializeVorschWithVorschRowData(Vorsch form, VorschRowData RowData)
        {
            form.LokationBox.Text = RowData.Lokation ?? "";
            form.DatumBox.Text = RowData.Datum ?? "";
            form.ZeitBox.Text = RowData.Zeit ?? "";
            // Stueck row in string umwandeln
        }

        private void UpdateListeRowDataFromBearbeiten(Bearbeiten form, ListeRowData RowData)
        {
            RowData.Firma = form.FirmaBox.Text;
            RowData.Adresse = form.AdresseBox.Text;
            RowData.Inhaber = form.InhaberBox.Text;
            RowData.Tel = form.TelefonBox.Text;
            RowData.Mail = form.EmailBox.Text;
            RowData.Termin = form.TerminBox.Text;
            RowData.Kommentar = form.KommentarBox.Text;
            RowData.Land = form.LandBox.Text;
            RowData.Bundesland = form.BundeslandBox.Text;
            RowData.Bezirk = form.BezirkBox.Text;
            RowData.Ort = form.OrtBox.Text;
            RowData.Stern1 = form.S1.Checked;
            RowData.Stern2 = form.S2.Checked;
            RowData.Stern3 = form.S3.Checked;
            RowData.Stern4 = form.S4.Checked;
            RowData.Stern5 = form.S5.Checked;
            RowData.Fahrzeit = form.FahrzeitBox.Text;
            RowData.Offen = form.OffenCheckbox.Checked;
            RowData.ErsteMail = form.ErsteMailCheckbox.Checked;
            RowData.ErstGespraech = form.ErstGespraechCheckbox.Checked;
            RowData.Buehne = form.BuehneCheckbox.Checked;
            RowData.Nein = form.NeinCheckbox.Checked;
            RowData.Zunahe = form.ZunaheCheckbox.Checked;
        }

        private void UpdateRowDataFromStuecke(Stuecke form, StueckeRowData RowData)
        {
            RowData.StueckeName = form.NameBox.Text;
            RowData.Beschreibung = form.Beschreibung.Text;
            RowData.FigCount = form.FigCount.Text;
            RowData.Rollen = form.RollenBox.Text;
            RowData.RollenBesch = form.RollenBeschBox.Text;

        }

        private void UpdateRowDataFromSchau(Schau form, SchauRowData RowData)
        {
            RowData.Schauspieler = form.NameBox.Text;
            RowData.SchauAdresse = form.AdresseBox.Text;
            RowData.SchauTelefonnummer = form.TelefonnummerBox.Text;
            RowData.SchauEmail = form.EmailBox.Text;
            RowData.SchauArchi = form.DataBox.Text;
            RowData.SchauRollen = form.StRoBox.Text;
            RowData.SchauAbendregie = form.AbRgCheck.Checked.ToString();
        }

        private void UpdateRowDataFromVorsch(Vorsch form, VorschRowData RowData)
        {
            RowData.Lokation = form.LokationBox.Text;
            RowData.Datum = form.DatumBox.Text;
            RowData.Zeit = form.ZeitBox.Text;
        }

        private void CheckForListeFirmaDuplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalRowsData == null || ResListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }



            // Duplikate finden, ausgenommen leere Firmennamen
            List<ListeRowData> Firmaduplicates = _originalRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.Firma))
                .GroupBy(x => x.Firma)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in ResListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (ListeRowData item in Firmaduplicates)
            {
                foreach (DataGridViewRow Firmarow in ResListe.Rows)
                {
                    if (Firmarow.Tag is ListeRowData rowData && rowData.Firma == item.Firma)
                    {
                        Firmarow.Visible = true;
                        Firmarow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (Firmaduplicates.Count == 0)
            {
                // Alle Zeilen wieder sichtbar machen, wenn keine Duplikate gefunden wurden
                CheckForListeAdresseDuplicates();
            }

        }

        private void CheckForListeAdresseDuplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalRowsData == null || ResListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere Firmennamen
            List<ListeRowData> Adresseduplicates = _originalRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.Adresse))
                .GroupBy(x => x.Adresse)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in ResListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (ListeRowData item in Adresseduplicates)
            {
                foreach (DataGridViewRow Adresserow in ResListe.Rows)
                {
                    if (Adresserow.Tag is ListeRowData rowData && rowData.Adresse == item.Adresse)
                    {
                        Adresserow.Visible = true;
                        Adresserow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (Adresseduplicates.Count == 0)
            {
                // Alle Zeilen wieder sichtbar machen, wenn keine Duplikate gefunden wurden
                CheckForListeInhaberDuplicates();
            }

        }
        private void CheckForListeInhaberDuplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalRowsData == null || ResListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere Firmennamen
            List<ListeRowData> Inhaberduplicates = _originalRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.Inhaber))
                .GroupBy(x => x.Inhaber)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in ResListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (ListeRowData item in Inhaberduplicates)
            {
                foreach (DataGridViewRow Inhaberrow in ResListe.Rows)
                {
                    if (Inhaberrow.Tag is ListeRowData rowData && rowData.Inhaber == item.Inhaber)
                    {
                        Inhaberrow.Visible = true;
                        Inhaberrow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (Inhaberduplicates.Count == 0)
            {
                CheckForListeTelDuplicates();
            }

        }
        private void CheckForListeTelDuplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalRowsData == null || ResListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere Firmennamen
            List<ListeRowData> Telduplicates = _originalRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.Tel))
                .GroupBy(x => x.Tel)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in ResListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (ListeRowData item in Telduplicates)
            {
                foreach (DataGridViewRow Telrow in ResListe.Rows)
                {
                    if (Telrow.Tag is ListeRowData rowData && rowData.Tel == item.Tel)
                    {
                        Telrow.Visible = true;
                        Telrow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (Telduplicates.Count == 0)
            {
                CheckForListeMailDuplicates();
            }

        }
        private void CheckForListeMailDuplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalRowsData == null || ResListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere Firmennamen
            List<ListeRowData> Mailduplicates = _originalRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.Mail))
                .GroupBy(x => x.Mail)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in ResListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (ListeRowData item in Mailduplicates)
            {
                foreach (DataGridViewRow Mailrow in ResListe.Rows)
                {
                    if (Mailrow.Tag is ListeRowData rowData && rowData.Mail == item.Mail)
                    {
                        Mailrow.Visible = true;
                        Mailrow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (Mailduplicates.Count == 0)
            {
                // Alle Zeilen wieder sichtbar machen, wenn keine Duplikate gefunden wurden
                foreach (DataGridViewRow row in ResListe.Rows)
                {
                    row.Visible = true;
                    row.DefaultCellStyle.BackColor = System.Drawing.Color.White; // Zurücksetzen der Markierung
                }
            }
            UpdateDataGridView();

        }

        private void CheckForListeStueckeNameduplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalStueckeRowsData == null || StueckeListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere Firmennamen
            List<StueckeRowData> StueckeNameduplicates = _originalStueckeRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.StueckeName))
                .GroupBy(x => x.StueckeName)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in StueckeListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (StueckeRowData item in StueckeNameduplicates)
            {
                foreach (DataGridViewRow Namerow in StueckeListe.Rows)
                {
                    if (Namerow.Tag is StueckeRowData rowData && rowData.StueckeName == item.StueckeName)
                    {
                        Namerow.Visible = true;
                        Namerow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (StueckeNameduplicates.Count == 0)
            {
                // Alle Zeilen wieder sichtbar machen, wenn keine Duplikate gefunden wurden
                foreach (DataGridViewRow row in StueckeListe.Rows)
                {
                    row.Visible = true;
                    row.DefaultCellStyle.BackColor = System.Drawing.Color.White; // Zurücksetzen der Markierung
                }
            }

        }

        private void CheckForListeSchauNameduplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalSchauRowsData == null || SchauListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere Firmennamen
            List<SchauRowData> SchauNameduplicates = _originalSchauRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.Schauspieler))
                .GroupBy(x => x.Schauspieler)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in SchauListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (SchauRowData item in SchauNameduplicates)
            {
                foreach (DataGridViewRow Namerow in SchauListe.Rows)
                {
                    if (Namerow.Tag is SchauRowData rowData && rowData.Schauspieler == item.Schauspieler)
                    {
                        Namerow.Visible = true;
                        Namerow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }



            if (SchauNameduplicates.Count == 0)
            {
                CheckForListeSchauAdresseduplicates();
            }

        }

        private void CheckForListeSchauAdresseduplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalSchauRowsData == null || SchauListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere FirmenAdressen
            List<SchauRowData> SchauAdresseduplicates = _originalSchauRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.SchauAdresse))
                .GroupBy(x => x.SchauAdresse)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in SchauListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (SchauRowData item in SchauAdresseduplicates)
            {
                foreach (DataGridViewRow Adresserow in SchauListe.Rows)
                {
                    if (Adresserow.Tag is SchauRowData rowData && rowData.SchauAdresse == item.SchauAdresse)
                    {
                        Adresserow.Visible = true;
                        Adresserow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (SchauAdresseduplicates.Count == 0)
            {
                CheckForListeSchauSchauTelefonnumerduplicates();
            }

        }

        private void CheckForListeSchauSchauTelefonnumerduplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalSchauRowsData == null || SchauListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere FirmenSchauTelefonnumern
            List<SchauRowData> SchauTelefonnumerduplicates = _originalSchauRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.SchauTelefonnummer))
                .GroupBy(x => x.SchauTelefonnummer)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in SchauListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (SchauRowData item in SchauTelefonnumerduplicates)
            {
                foreach (DataGridViewRow SchauTelefonnumerrow in SchauListe.Rows)
                {
                    if (SchauTelefonnumerrow.Tag is SchauRowData rowData && rowData.SchauTelefonnummer == item.SchauTelefonnummer)
                    {
                        SchauTelefonnumerrow.Visible = true;
                        SchauTelefonnumerrow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (SchauTelefonnumerduplicates.Count == 0)
            {
                CheckForListeSchauEmailduplicates();
            }

        }

        private void CheckForListeSchauEmailduplicates()
        {
            // Sicherstellen, dass das DataGridView und die Datenliste initialisiert sind
            if (_originalSchauRowsData == null || SchauListe == null)
            {
                _ = MessageBox.Show("Daten sind nicht geladen.", "Fehler", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            // Duplikate finden, ausgenommen leere FirmenSchauEmailn
            List<SchauRowData> SchauEmailduplicates = _originalSchauRowsData
                .Where(x => !string.IsNullOrWhiteSpace(x.SchauEmail))
                .GroupBy(x => x.SchauEmail)
                .Where(g => g.Count() > 1)
                .SelectMany(g => g)
                .ToList();

            // Alle Zeilen zunächst ausblenden
            foreach (DataGridViewRow row in SchauListe.Rows)
            {
                row.Visible = false;
            }

            // Zeilen, die Duplikate enthalten, sichtbar machen und hervorheben
            foreach (SchauRowData item in SchauEmailduplicates)
            {
                foreach (DataGridViewRow SchauEmailrow in SchauListe.Rows)
                {
                    if (SchauEmailrow.Tag is SchauRowData rowData && rowData.SchauEmail == item.SchauEmail)
                    {
                        SchauEmailrow.Visible = true;
                        SchauEmailrow.DefaultCellStyle.BackColor = System.Drawing.Color.Yellow; // Markieren der Duplikatzeilen
                    }
                }
            }

            if (SchauEmailduplicates.Count == 0)
            {
                // Alle Zeilen wieder sichtbar machen, wenn keine Duplikate gefunden wurden
                foreach (DataGridViewRow row in SchauListe.Rows)
                {
                    row.Visible = true;
                    row.DefaultCellStyle.BackColor = System.Drawing.Color.White; // Zurücksetzen der Markierung
                }
            }

        }

        private void UpdateRowCount()
        {
            ResAnzahl.Text = "Anzahl der Zeilen: " + ResListe.Rows.Count.ToString();
        }

        private void UpdateStueckeRowCount()
        {
            StueckeAnzahl.Text = "Anzahl der Zeilen: " + StueckeListe.Rows.Count.ToString();
        }

        private void UpdateSchauRowCount()
        {
            SchauAnzahl.Text = "Anzahl der Zeilen: " + SchauListe.Rows.Count.ToString();
        }

        private void UpdateVorschRowCount()
        {
            VorschAnzahlSuch.Text = "Anzahl der Zeilen: " + VorschListe.Rows.Count.ToString();
        }

        private void UpdatePlanRowCount()
        {
            string filePath = @"F:\StagOrg\VS\res format\json\PlanListe.json";
            if (File.Exists(filePath))
            {
                string json = File.ReadAllText(filePath);
                List<PlanListeRowData> planListe = JsonConvert.DeserializeObject<List<PlanListeRowData>>(json);
                PlanZahlSuch.Text = "Anzahl der Zeilen: " + planListe.Count.ToString();
            }
            else
            {
                Console.WriteLine("Die Datei existiert nicht.");
            }
        }

        private void ResListe_RowsChanged(object sender, DataGridViewRowsAddedEventArgs e)
        {
            UpdateRowCount();
        }

        private void StueckeListe_RowsChanged(object sender, DataGridViewRowsAddedEventArgs e)
        {
            UpdateStueckeRowCount();
        }

        private void SchauListe_RowsChanged(object sender, DataGridViewRowsAddedEventArgs e)
        {
            UpdateSchauRowCount();
        }

        private void VorschListe_RowsChanged(object sender, DataGridViewRowsAddedEventArgs e)
        {
            UpdateVorschRowCount();
        }

        private void PlanListe_RowsChanged(object sender, DataGridViewRowsAddedEventArgs e)
        {
            UpdatePlanRowCount();
        }

        private void ResListe_RowsChanged(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            UpdateRowCount();
        }

        private void StueckeListe_RowsChanged(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            UpdateStueckeRowCount();
        }

        private void SchauListe_RowsChanged(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            UpdateSchauRowCount();
        }

        private void VorschListe_RowsChanged(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            UpdateVorschRowCount();
        }

        private void PlanListe_RowsChanged(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            UpdatePlanRowCount();
        }

        public void AddDataToDataGridView(List<string> data, ListeRowData extraData)
        {
            if (ResListe.InvokeRequired)
            {
                _ = ResListe.Invoke(new MethodInvoker(delegate
                {
                    int rowIndex = ResListe.Rows.Add(data.ToArray());
                    ResListe.Rows[rowIndex].Tag = extraData;
                    _originalRowsData.Add(extraData); // Hinzufügen zur Hauptliste
                }));
            }
            else
            {
                int rowIndex = ResListe.Rows.Add(data.ToArray());
                ResListe.Rows[rowIndex].Tag = extraData;
                _originalRowsData.Add(extraData); // Hinzufügen zur Hauptliste
            }
        }

        public void AddDataToStueckeDataGridView(List<string> data, StueckeRowData extraData)
        {
            if (StueckeListe.InvokeRequired)
            {
                _ = StueckeListe.Invoke(new MethodInvoker(delegate
                {
                    int rowIndex = StueckeListe.Rows.Add(data.ToArray());
                    StueckeListe.Rows[rowIndex].Tag = extraData;
                    _originalStueckeRowsData.Add(extraData); // Hinzufügen zur Hauptliste
                }));
            }
            else
            {
                int rowIndex = StueckeListe.Rows.Add(data.ToArray());
                StueckeListe.Rows[rowIndex].Tag = extraData;
                _originalStueckeRowsData.Add(extraData); // Hinzufügen zur Hauptliste
            }
        }

        public void AddDataToSchauDataGridView(List<string> data, SchauRowData extraData)
        {
            if (SchauListe.InvokeRequired)
            {
                _ = SchauListe.Invoke(new MethodInvoker(delegate
                {
                    int rowIndex = SchauListe.Rows.Add(data.ToArray());
                    SchauListe.Rows[rowIndex].Tag = extraData;
                    _originalSchauRowsData.Add(extraData); // Hinzufügen zur Hauptliste
                }));
            }
            else
            {
                int rowIndex = SchauListe.Rows.Add(data.ToArray());
                SchauListe.Rows[rowIndex].Tag = extraData;
                _originalSchauRowsData.Add(extraData); // Hinzufügen zur Hauptliste
            }
        }

        public void AddDataToVorschDataGridView(List<string> data, VorschRowData extraData)
        {
            if (VorschListe.InvokeRequired)
            {
                _ = VorschListe.Invoke(new MethodInvoker(delegate
                {
                    int rowIndex = VorschListe.Rows.Add(data.ToArray());
                    VorschListe.Rows[rowIndex].Tag = extraData;
                    _originalVorschRowsData.Add(extraData); // Hinzufügen zur Hauptliste
                }));
            }
            else
            {
                int rowIndex = VorschListe.Rows.Add(data.ToArray());
                VorschListe.Rows[rowIndex].Tag = extraData;
                _originalVorschRowsData.Add(extraData); // Hinzufügen zur Hauptliste
            }
        }


        private void Neue_Click(object sender, EventArgs e)
        {
            // Stellen Sie sicher, dass die Originaldaten initialisiert sind
            if (_originalRowsData == null)
            {
                InitializeOriginalData();
            }

            // Erstellen einer neuen Instanz von Akquise
            Akquise Akquise = new Akquise();

            // Übertragen Sie alle Adressen vor dem Anzeigen
            TransferStagesToAkquise(Akquise);

            // Zeigen Sie Akquise an
            _ = Akquise.ShowDialog();
        }




        private void TransferStagesToAkquise(Akquise Akquise)
        {
            List<string> buehneAddresses = _originalRowsData
                .Where(ListeRowData => ListeRowData.Buehne)
                .Select(ListeRowData => ListeRowData.Adresse)
                .ToList();

            if (buehneAddresses.Any())
            {
                Akquise.AddAddressesToZieAd(buehneAddresses);
            }
        }


        private void Erg_Click(object sender, EventArgs e)
        {
            ListeRowData newRow = new ListeRowData()
            {
                Firma = "",
                Tel = "",
                Kommentar = "",
                Land = "",
                Bundesland = "",
                Offen = true,
                ErsteMail = false,
                ErstGespraech = false,
                Buehne = false,
                Nein = false,
                Zunahe = false,
                Stern1 = false,
                Stern2 = false,
                Stern3 = false,
                Stern4 = false,
                Stern5 = false,
                Fahrzeit = ""

            };
            
            _originalRowsData.Add(newRow);  // Dies stellt sicher, dass die neue Zeile auch bei Filteränderungen erhalten bleibt.
            int rowIndex = ResListe.Rows.Add(newRow.Firma, newRow.Adresse, newRow.Inhaber, newRow.Tel, newRow.Mail, newRow.Termin, newRow.Kommentar, newRow.Land, newRow.Bundesland, newRow.Bezirk, newRow.Ort, newRow.Offen, newRow.ErsteMail, newRow.ErstGespraech, newRow.Buehne, newRow.Nein, newRow.Zunahe, newRow.Stern1, newRow.Stern2, newRow.Stern3, newRow.Stern4, newRow.Stern5, newRow.Fahrzeit);
            ResListe.Rows[rowIndex].Tag = newRow; // Speichern der ListeRowData Instanz im Tag der Zeile für weiteren Zugriff

            // Daten speichern
            SaveAllListeData();
            // Daten neu laden
            LoadAllListeData();


        }

        private void StueckeHinzu_Click(object sender, EventArgs e)
        {
            StueckeRowData newRow = new StueckeRowData()
            {
                StueckeName = "",
                Beschreibung = "",
                FigCount = "",
                Rollen = "",
                RollenBesch = ""
            };

            _originalStueckeRowsData.Add(newRow);  // Dies stellt sicher, dass die neue Zeile auch bei Filteränderungen erhalten bleibt.
            int rowIndex = StueckeListe.Rows.Add(newRow.StueckeName, newRow.Beschreibung, newRow.FigCount, newRow.Rollen, newRow.RollenBesch);
            StueckeListe.Rows[rowIndex].Tag = newRow; // Setze newRow als Tag für die Zugänglichkeit später

            // Daten speichern
            SaveAllStueckeData();
            // Daten neu laden
            LoadAllStueckeData();
        }

        private void SchauHinzu_Click(object sender, EventArgs e)
        {
            SchauRowData newRow = new SchauRowData()
            {
                Schauspieler = "",
                SchauAdresse = "",
                SchauTelefonnummer = "",
                SchauEmail = "",
                SchauRollen = "",
                SchauAbendregie = "False"
            };

            _originalSchauRowsData.Add(newRow);  // Dies stellt sicher, dass die neue Zeile auch bei Filteränderungen erhalten bleibt.
            int rowIndex = SchauListe.Rows.Add(newRow.Schauspieler, newRow.SchauAdresse, newRow.SchauTelefonnummer, newRow.SchauEmail, newRow.SchauRollen, newRow.SchauAbendregie);
            SchauListe.Rows[rowIndex].Tag = newRow; // Setze newRow als Tag für die Zugänglichkeit später

            // Daten speichern
            SaveAllSchauData();
            // Daten neu laden
            LoadAllSchauData();
        }


        private void VorschHinzuButton_Click(object sender, EventArgs e)
        {
            VorschRowData newRow = new VorschRowData()
            {
                Lokation = "",
                Datum = ""
            };

            _originalVorschRowsData.Add(newRow);  // Dies stellt sicher, dass die neue Zeile auch bei Filteränderungen erhalten bleibt.
            int rowIndex = VorschListe.Rows.Add(newRow.Lokation, newRow.Datum, newRow.Zeit, newRow.Stueck);
            VorschListe.Rows[rowIndex].Tag = newRow; // Setze newRow als Tag für die Zugänglichkeit später

            // Daten speichern
            SaveAllVorschData();
            // Daten neu laden
            LoadAllVorschData();
        }


        private void BtnDeleteRow_Click(object sender, EventArgs e)
        {
            if (ResListe.SelectedRows.Count > 0)
            {
                DialogResult confirmResult = MessageBox.Show("Möchten Sie die ausgewählten Zeilen wirklich löschen?",
                                                    "Zeilen löschen bestätigen",
                                                    MessageBoxButtons.YesNo,
                                                    MessageBoxIcon.Question);

                if (confirmResult == DialogResult.Yes)
                {
                    List<ListeRowData> rowsToRemove = new List<ListeRowData>();

                    foreach (DataGridViewRow row in ResListe.SelectedRows)
                    {
                        if (!row.IsNewRow)
                        {
                            // Hinzufügen des ListeRowData-Objekts zur Liste der zu entfernenden Objekte
                            if (row.Tag is ListeRowData RowData)
                            {
                                rowsToRemove.Add(RowData);
                            }

                            // Entfernen der Zeile aus dem DataGridView
                            ResListe.Rows.Remove(row);
                        }
                    }

                    // Entfernen der Zeilen aus der Originaldatenliste
                    foreach (ListeRowData RowData in rowsToRemove)
                    {
                        _ = _originalRowsData.Remove(RowData);
                    }

                    // Daten speichern und neu laden
                    SaveAllListeData();
                    LoadAllListeData(); // Optional, wenn Sie das DataGridView nach dem Löschvorgang aktualisieren möchten

                }
            }
            else
            {
                _ = MessageBox.Show("Bitte wählen Sie mindestens eine Zeile aus.", "Keine Zeile ausgewählt", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void PlanLoeschButton_Click(object sender, EventArgs e)
        {
            if (PlanListe.SelectedRows.Count > 0)
            {
                DialogResult confirmResult = MessageBox.Show("Möchten Sie die ausgewählten Zeilen wirklich löschen?",
                                                    "Zeilen löschen bestätigen",
                                                    MessageBoxButtons.YesNo,
                                                    MessageBoxIcon.Question);

                if (confirmResult == DialogResult.Yes)
                {
                    List<PlanListeRowData> rowsToRemove = new List<PlanListeRowData>();

                    // hollen des Foldernamen aus der ausgewählten Zeile
                    string foldername = PlanListe.SelectedRows[0].Cells[0].Value.ToString();
                    // hollen des JsonDateinamens aus der ausgewählten Zeile
                    string jsonfilename = PlanListe.SelectedRows[0].Cells[1].Value.ToString();
                    string filpath = $@"D:\test\Vs\res format\json\Firmen\{foldername}\Organ\{jsonfilename}.json";
                    // löschen der JsonDatei
                    File.Delete(filpath);
                    // löschen der Zeile aus _PlanRowsData
                    string mainPath = @"D:\test\Vs\res format\json\PlanListe.json";
                    if (File.Exists(mainPath))
                    {
                        string json = File.ReadAllText(mainPath);
                        List<PlanListeRowData> planListe = JsonConvert.DeserializeObject<List<PlanListeRowData>>(json);
                        foreach (PlanListeRowData plan in planListe)
                        {
                            if (plan.FolderName == foldername && plan.JsonFileName == jsonfilename)
                            {
                                rowsToRemove.Add(plan);
                            }
                        }
                        foreach (PlanListeRowData plan in rowsToRemove)
                        {
                            _ = planListe.Remove(plan);
                        }
                        string newJson = JsonConvert.SerializeObject(planListe, Formatting.Indented);
                        File.WriteAllText(mainPath, newJson);
                    }

                    foreach (DataGridViewRow row in PlanListe.SelectedRows)
                    {
                        if (!row.IsNewRow)
                        {
                            PlanListe.Rows.Remove(row);
                        }
                    }
                    string ftpdel = jsonfilename + "_" + foldername;
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
                }
                
            }
            else
            {
                _ = MessageBox.Show("Bitte wählen Sie mindestens eine Zeile aus.", "Keine Zeile ausgewählt", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void BtnDeleteStueckeRow_Click(object sender, EventArgs e)
        {
            if (StueckeListe.SelectedRows.Count > 0)
            {
                int selectedIndex = StueckeListe.SelectedRows[0].Index;
                DletDataBox.Text = selectedIndex.ToString();  // Aktualisieren des Textfeldes mit dem Index der ersten ausgewählten Zeile
                // spalten inhalt von "Stücke" und "Rollen" extrahieren, die "," entfertnen und in "SchriftDelet" einfügen
                StueckDel.Text = "[" + StueckeListe.Rows[selectedIndex].Cells[0].Value.ToString() + "] ";

                RollDel.Text = StueckeListe.Rows[selectedIndex].Cells[3].Value.ToString();
                // löschen von semicolon
                RollDel.Text = RollDel.Text.Replace(";", ",");

                string names = (_selectedStueckeRowData != null) ? _selectedStueckeRowData.StueckeName : "die ausgewählten Zeilen";
                DialogResult confirmResult = MessageBox.Show($"Möchten Sie {names} wirklich löschen?", "Zeilen löschen bestätigen",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

                if (confirmResult == DialogResult.Yes)
                {
                    foreach (DataGridViewRow row in StueckeListe.SelectedRows)
                    {
                        if (!row.IsNewRow && row.Tag is StueckeRowData StueckeRowData)
                        {
                            // aktivieren der RemoveRelatedEntriesFromSchau methode
                            RemoveRelatedEntriesFromSchau();
                            RemoveRelatedNamesFromSchau();



                            StueckeListe.Rows.Remove(row);
                            _ = _originalStueckeRowsData.Remove(StueckeRowData);
                        }
                    }
                    SaveAllStueckeData();
                    LoadAllStueckeData();
                }

            }
            else
            {
                _ = MessageBox.Show("Bitte wählen Sie mindestens eine Zeile aus.", "Keine Zeile ausgewählt", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        


        private void RemoveRelatedEntriesFromSchau()
        {
            int indexToRemove = int.Parse(DletDataBox.Text);
            foreach (SchauRowData schauData in _originalSchauRowsData)
            {
                // Extrahieren der einzelnen Gruppen
                List<string> groups = Regex.Matches(schauData.SchauArchi, @"\[([^\]]+)\]")
                    .Cast<Match>()
                    .Select(m => m.Groups[1].Value) // Nimmt den Inhalt innerhalb der Klammern
                    .ToList();

                // Filtern der Gruppen, entfernt die, deren zweiter Eintrag der Index ist
                List<string> filteredGroups = groups.Where(group =>
                {
                    string[] parts = group.Split(';');
                    return !(parts.Length > 1 && int.TryParse(parts[1], out int secondNum) && secondNum == indexToRemove);
                }).ToList();

                // Wieder zusammenbauen der übrig gebliebenen Gruppen
                schauData.SchauArchi = string.Join(";", filteredGroups.Select(g => $"[{g}]"));
            }
        }


        private void RemoveRelatedNamesFromSchau()
        {
            // Entfernen der Daten in "StueckDel" aus "SchauRollen"
            foreach (SchauRowData schauData in _originalSchauRowsData)
            {
                schauData.SchauRollen = schauData.SchauRollen.Replace(StueckDel.Text, "");
            }
            // aufsplitten der rollen in "RollDel" und entfernen der leeren elemente
            string[] rollen = RollDel.Text.Split(',');
            rollen = rollen.Where(x => !string.IsNullOrEmpty(x)).ToArray();
            // Entfernen der Daten in "RollDel" aus "SchauRollen"
            foreach (SchauRowData schauData in _originalSchauRowsData)
            {
                foreach (string rolle in rollen)
                {
                    schauData.SchauRollen = schauData.SchauRollen.Replace(rolle, "");
                }
            }
            // Entfernen von " ," aus "SchauRollen"
            foreach (SchauRowData schauData in _originalSchauRowsData)
            {
                schauData.SchauRollen = schauData.SchauRollen.Replace(" ,", "");
            }




            RefreshSchauDataGridView();
            SaveAllSchauData();
        }

        private void BtnDeleteSchauRow_Click(object sender, EventArgs e)
        {
            if (SchauListe.SelectedRows.Count > 0)
            {
                DialogResult confirmResult = MessageBox.Show("Möchten Sie die ausgewählten Zeilen wirklich löschen?", "Zeilen löschen bestätigen",
                                   MessageBoxButtons.YesNo,
                                                  MessageBoxIcon.Question);

                if (confirmResult == DialogResult.Yes)
                {
                    List<SchauRowData> rowsToRemove = new List<SchauRowData>();

                    foreach (DataGridViewRow row in SchauListe.SelectedRows)
                    {
                        if (!row.IsNewRow)
                        {
                            // Hinzufügen des SchauRowData-Objekts zur Liste der zu entfernenden Objekte
                            if (row.Tag is SchauRowData SchauRowData)
                            {
                                rowsToRemove.Add(SchauRowData);
                            }

                            // Entfernen der Zeile aus dem DataGridView
                            SchauListe.Rows.Remove(row);
                        }
                    }

                    // Entfernen der Zeilen aus der Originaldatenliste
                    foreach (SchauRowData SchaurowData in rowsToRemove)
                    {
                        _ = _originalSchauRowsData.Remove(SchaurowData);
                    }

                    // Daten speichern und neu laden
                    SaveAllSchauData();
                    LoadAllSchauData(); // Optional, wenn Sie das DataGridView nach dem Löschvorgang aktualisieren möchten

                }
            }
            else
            {
                _ = MessageBox.Show("Bitte wählen Sie mindestens eine Zeile aus.", "Keine Zeile ausgewählt", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }



        private void VorschLoeschButton_Click(object sender, EventArgs e)
        {
            if (VorschListe.SelectedRows.Count > 0)
            {
                
                DialogResult confirmResult = MessageBox.Show("Möchten Sie die ausgewählten Zeilen wirklich löschen?", "Zeilen löschen bestätigen",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);
                if (confirmResult == DialogResult.Yes)
                {
                    // hollen der VorschRowData anhand der ausgewählten Zeile
                    VorschRowData vorschRowData = VorschListe.SelectedRows[0].Tag as VorschRowData;
                    string datum = vorschRowData.Datum;
                    string ort = vorschRowData.Lokation;

                    // SchauspielerundRollen spliten bei | und entfernen der leeren elemente
                    string[] schauspielerundrollen = vorschRowData.SchauspielerundRollen.Split('|').SelectMany(x => x.Split(new[] { ";" }, StringSplitOptions.RemoveEmptyEntries)).Where(x => x.Contains(":")).Select(x => x.Split(':')[1]).Select(x => x.Trim()).ToArray();
                    // suchen der schauspiler in SchauListe und email adresse hollen
                    foreach (string schauspieler in schauspielerundrollen)
                    {
                        foreach (SchauRowData schauRowData in _originalSchauRowsData)
                        {
                            if (schauRowData.Schauspieler == schauspieler)
                            {
                                // suchen der schauspiler in SchauListe und email adresse hollen
                                string toEmail = schauRowData.SchauEmail;
                                string htmlBody = $@"
                                    <html>
                                    <body>
                                        <p>Hallo {schauspieler}</p><br><br>
                                        <p>Leider mussten wir die Vorstellung am {datum} in {ort} absagen.</a></p><br><br><br>
                                        <p>An diese Mailadresse kann nicht geantwortet werden</p>
                                    </body>
                                    </html>";


                                MailMessage mail = new MailMessage
                                {
                                    From = new MailAddress("spielen@stagedive.at")
                                };
                                mail.To.Add(new MailAddress(toEmail));
                                mail.Subject = "Bitte fülle das Feedback-Formular aus";
                                mail.Body = htmlBody;
                                mail.IsBodyHtml = true;


                                SmtpClient smtp = new SmtpClient("smtp.world4you.com")
                                {
                                    Port = 587,
                                    Credentials = new NetworkCredential("danner@stagedive.at", "92J4WGosyurRt"),
                                    EnableSsl = true
                                };

                                try
                                {
                                    smtp.Send(mail);
                                    Console.WriteLine("Email sent successfully to " + schauspieler);
                                }
                                catch (Exception ex)
                                {
                                    MessageBox.Show("Fehler beim Senden der E-Mail: " + ex.Message);
                                }
                            }
                        }
                    }

                    List<VorschRowData> rowsToRemove = new List<VorschRowData>();

                    foreach (DataGridViewRow row in VorschListe.SelectedRows)
                    {
                        if (!row.IsNewRow)
                        {
                            // Hinzufügen des VorschRowData-Objekts zur Liste der zu entfernenden Objekte
                            if (row.Tag is VorschRowData VorschRowData)
                            {
                                rowsToRemove.Add(VorschRowData);
                            }

                            // Entfernen der Zeile aus dem DataGridView
                            VorschListe.Rows.Remove(row);
                        }
                    }

                    // Entfernen der Zeilen aus der Originaldatenliste
                    foreach (VorschRowData VorschrowData in rowsToRemove)
                    {
                        _ = _originalVorschRowsData.Remove(VorschrowData);
                    }

                    // Daten speichern und neu laden
                    SaveAllVorschData();
                    LoadAllVorschData(); // Optional, wenn Sie das DataGridView nach dem Löschvorgang aktualisieren möchten
                    
                }
            }
            else
            {
                _ = MessageBox.Show("Bitte wählen Sie mindestens eine Zeile aus.", "Keine Zeile ausgewählt", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
        }

        private void UpdateDataGridView()
        {
            if (_originalRowsData == null)
            {
                return;
            }

            string searchQuery = ResSuche.Text.Trim().ToLower();
            string filter = ResFilter.SelectedItem?.ToString() ?? "Alle"; // Assuming "Alle" shows all records

            // First filter by search text
            List<ListeRowData> filteredBySearch = _originalRowsData.Where(row => MatchesSearch(row, searchQuery)).ToList();

            // Then filter by the selected filter option
            List<ListeRowData> finalFilteredData = filteredBySearch.Where(row => ShouldRowBeVisible(row, filter)).ToList();

            RefreshDataGridView(finalFilteredData);
        }

        private void FilterComboBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (_originalRowsData == null)
            {
                return;
            }
            // wenn die auswahl index -1 ist, wird die liste auf alle daten zurückgesetzt
            if (ResFilter.SelectedIndex == -1)
            {
                RefreshDataGridView(_originalRowsData);
                return;
            }

            UpdateDataGridView();
        }

        
        private void SearchBox_TextChanged(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(ResSuche.Text))
            {
                UpdateDataGridView(); // Bei leerem Suchfeld die DataGridView aktualisieren
                return;
            }

            UpdateDataGridView(); // Bei nicht leerem Suchfeld ebenfalls DataGridView aktualisieren
        }
        private void StueckeSuch_TextChanged(object sender, EventArgs e)
        {
            if (StueckeSuch == null || string.IsNullOrWhiteSpace(StueckeSuch.Text))
            {
                return; // Frühe Rückkehr, um weitere Verarbeitung zu vermeiden
            }

            string searchQuery = StueckeSuch.Text.ToLower();
            List<StueckeRowData> filteredData = _originalStueckeRowsData
                .Where(row => MatchesStueckeSearch(row, searchQuery))
                .ToList();
            // sobald ich das suchfeld leere, wird die liste wieder auf alle daten zurückgesetzt




            RefreshStueckeDataGridView(filteredData);
        }

        private void SchauSuch_TextChanged(object sender, EventArgs e)
        {
            if (SchauSuch == null || string.IsNullOrWhiteSpace(SchauSuch.Text))
            {
                return; // Frühe Rückkehr, um weitere Verarbeitung zu vermeiden
            }

            string searchQuery = SchauSuch.Text.ToLower();
            List<SchauRowData> filteredData = _originalSchauRowsData
                .Where(row => MatchesSchauSearch(row, searchQuery))
                .ToList();

            RefreshSchauDataGridView(filteredData);
        }

        

        private void VorschSuchBox_TextChanged(object sender, EventArgs e)
        {
            if (VorschSuchBox == null || string.IsNullOrWhiteSpace(VorschSuchBox.Text))
            {
                return; // Frühe Rückkehr, um weitere Verarbeitung zu vermeiden
            }

            string searchQuery = VorschSuchBox.Text.ToLower();
            List<VorschRowData> filteredData = _originalVorschRowsData
                .Where(row => MatchesVorschSearch(row, searchQuery))
                .ToList();

        }
        

        public List<string> GetRollen(object selectedStueck)
        {
            List<string> rollen = new List<string>();
            if (selectedStueck != null)
            {
                foreach (StueckeRowData stuecke in _originalStueckeRowsData)
                {
                    if (stuecke.StueckeName == selectedStueck.ToString())
                    {
                        rollen.Add(stuecke.Rollen);
                    }
                }
            }
            return rollen;
        }

        private bool MatchesSearch(ListeRowData row, string searchQuery)
        {
            return row.Firma.ToLower().Contains(searchQuery) ||
                   row.Adresse.ToLower().Contains(searchQuery) ||
                   row.Inhaber.ToLower().Contains(searchQuery) ||
                   row.Tel.ToLower().Contains(searchQuery) ||
                   row.Mail.ToLower().Contains(searchQuery) ||
                   row.Termin.ToLower().Contains(searchQuery) ||
                   row.Kommentar.ToLower().Contains(searchQuery) ||
                   row.Land.ToLower().Contains(searchQuery) ||
                   row.Bundesland.ToLower().Contains(searchQuery) ||
                   row.Bezirk.ToLower().Contains(searchQuery) ||
                   row.Ort.ToLower().Contains(searchQuery) ||
                   row.Fahrzeit.ToLower().Contains(searchQuery);
        }

        private bool MatchesStueckeSearch(StueckeRowData row, string searchQuery)
        {
            return row.StueckeName.ToLower().Contains(searchQuery) ||
                   row.Beschreibung.ToLower().Contains(searchQuery) ||
                   row.FigCount.ToLower().Contains(searchQuery) ||
                   row.Rollen.ToLower().Contains(searchQuery) ||
                   row.RollenBesch.ToLower().Contains(searchQuery);
        }

        private bool MatchesSchauSearch(SchauRowData row, string searchQuery)
        {
            return (row.Schauspieler?.ToLower().Contains(searchQuery) ?? false) ||
                   (row.SchauAdresse?.ToLower().Contains(searchQuery) ?? false) ||
                   (row.SchauTelefonnummer?.ToLower().Contains(searchQuery) ?? false) ||
                   (row.SchauEmail?.ToLower().Contains(searchQuery) ?? false) ||
                   (row.SchauRollen?.ToLower().Contains(searchQuery) ?? false) ||
                   (row.SchauAbendregie?.ToLower().Contains(searchQuery) ?? false);
        }

        private bool MatchesVorschSearch(VorschRowData row, string searchQuery)
        {
            return row.Lokation.ToLower().Contains(searchQuery) ||
                   row.Datum.ToLower().Contains(searchQuery);
        }

        
    }
}
