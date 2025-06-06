using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace res_format
{
    public partial class vortschritt : Form
    {
        public vortschritt()
        {
            InitializeComponent();
            // initialisierung der Klasse FtpSyncService und starten der Methode DownloadJsonFiles
            FtpSyncService ftpSyncService = new FtpSyncService(this.VortscgritInfo); // Pass the label to the service
            ftpSyncService.OperationsCompleted += (sender, e) =>
            {
                // form schließen
                Close();
            };
            _ = ftpSyncService.DownloadJsonFiles();
            this.ControlBox = false;
            this.TopMost = true;
            this.Enabled = false;
            this.ShowInTaskbar = false;
            this.StartPosition = FormStartPosition.CenterScreen;

        }

        public class FtpSyncService
        {
            private readonly Label VortscgritInfo;

            public FtpSyncService(Label progressLabel)
            {
                VortscgritInfo = progressLabel;
            }

            public event EventHandler OperationsCompleted;

            protected virtual void OnOperationsCompleted()
            {
                OperationsCompleted?.Invoke(this, EventArgs.Empty);
            }

            private readonly string ftpServer = "ftp://ftp.world4you.com/wp-content/uploads/Schauspieler/";
            private readonly string ftpUsername = "ftp8596592";
            private readonly string ftpPassword = "m8&fCsH#Mt7FYsxT";
            private readonly string localDirectory = @"F:\StagOrg\VS\res format\json\Schauspieler\";
            private readonly string downloadpre = @"F:\StagOrg\VS\res format\json\Firmen\";

            private void UpdateProgress(string message)
            {
                if (VortscgritInfo.InvokeRequired)
                {
                    VortscgritInfo.Invoke(new Action<string>(UpdateProgress), new object[] { message });
                }
                else
                {
                    VortscgritInfo.Text = message;
                }
            }

            public async Task DownloadJsonFiles()
            {
                UpdateProgress("Checking directories...");
                if (!Directory.Exists(localDirectory))
                {
                    Directory.CreateDirectory(localDirectory);
                    UpdateProgress("Created directory for downloads.");
                }

                if (!Directory.Exists(localDirectory))
                {
                    _ = Directory.CreateDirectory(localDirectory);
                }
                try
                {
                    UpdateProgress("Connecting to FTP server...");

                    // runterladen der json daten von ftp server nach localDirectory
                    FtpWebRequest request = (FtpWebRequest)WebRequest.Create(ftpServer);
                    request.Method = WebRequestMethods.Ftp.ListDirectory;
                    request.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
                    // runterladen der json daten von ftp server nach localDirectory
                    using (FtpWebResponse response = (FtpWebResponse)request.GetResponse())
                    using (Stream responseStream = response.GetResponseStream())
                    using (StreamReader reader = new StreamReader(responseStream))
                    {
                        string[] files = reader.ReadToEnd().Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
                        UpdateProgress($"Found {files.Length} files.");

                        foreach (string file in files)
                        {
                            if (file.EndsWith("_form.json"))
                            {
                                string localFilePath = Path.Combine(localDirectory, file);
                                FtpWebRequest downloadRequest = (FtpWebRequest)WebRequest.Create(ftpServer + file);
                                downloadRequest.Method = WebRequestMethods.Ftp.DownloadFile;
                                downloadRequest.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
                                UpdateProgress($"Downloading {file}...");

                                using (FtpWebResponse downloadResponse = (FtpWebResponse)downloadRequest.GetResponse())
                                using (Stream downloadStream = downloadResponse.GetResponseStream())
                                using (FileStream fileStream = new FileStream(localFilePath, FileMode.Create))
                                {
                                    await downloadStream.CopyToAsync(fileStream);
                                }
                                UpdateProgress($"{file} downloaded.");
                            }
                        }
                    }
                    UpdateProgress("Download complete. Updating records...");
                    if (Directory.GetFiles(localDirectory, "*_form.json").Length > 0)
                    {
                        /*
                        // json daten in ftp server löschen
                        FtpWebRequest requestDelete = (FtpWebRequest)WebRequest.Create(ftpServer);
                        requestDelete.Method = WebRequestMethods.Ftp.ListDirectory;
                        requestDelete.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
                        UpdateProgress($"verbinden mit FTP...");

                        using (FtpWebResponse responseDelete = (FtpWebResponse)requestDelete.GetResponse())
                        using (Stream responseStreamDelete = responseDelete.GetResponseStream())
                        using (StreamReader readerDelete = new StreamReader(responseStreamDelete))
                        {
                            string[] filesDelete = readerDelete.ReadToEnd().Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);

                            foreach (string fileDelete in filesDelete)
                            {
                                if (fileDelete.EndsWith("_form.json"))
                                {
                                    FtpWebRequest deleteRequest = (FtpWebRequest)WebRequest.Create(ftpServer + fileDelete);
                                    deleteRequest.Method = WebRequestMethods.Ftp.DeleteFile;
                                    deleteRequest.Credentials = new NetworkCredential(ftpUsername, ftpPassword);
                                    UpdateProgress($"Löschen der Json Daten auf FTP...");

                                    using (FtpWebResponse deleteResponse = (FtpWebResponse)deleteRequest.GetResponse())
                                    {
                                        // do nothing
                                    }
                                }
                            }
                        }
                        */
                        await AuftragUpdate(downloadpre);
                    }
                    if (Directory.GetFiles(localDirectory, "*_form.json").Length == 0)
                    {
                        await Task.Delay(2000);
                        OnOperationsCompleted();
                    }
                }
                catch (Exception ex)
                {
                    UpdateProgress($"Error: {ex.Message}");

                    OnOperationsCompleted();
                }
            }

            private async Task AuftragUpdate(string downloadpre)
            {
                string[] jsonFiles1 = Directory.GetFiles(localDirectory, "*_form.json");
                foreach (string file1 in jsonFiles1)
                {
                    // firmenname aus json datei extrahieren
                    UpdateProgress($"firmenname aus json datei extrahieren...");

                    string json = File.ReadAllText(file1);
                    string firma = Regex.Match(json, "\"firmenname\": \"(.*?)\"").Groups[1].Value;
                    string downloadDirectory = Path.Combine(downloadpre, firma, "Organ");
                    if (!Directory.Exists(downloadDirectory))
                    {
                        _ = Directory.CreateDirectory(downloadDirectory);
                    }
                    File.Move(file1, Path.Combine(downloadDirectory, Path.GetFileName(file1)));

                    string[] jsonFiles = Directory.GetFiles(downloadDirectory, "*.json");
                    // Gruppieren der json dateien nach Schauspieler
                    UpdateProgress($"Gruppieren der json dateien nach Schauspieler...");

                    IEnumerable<IGrouping<string, string>> groupedFiles = jsonFiles.GroupBy(file => Path.GetFileName(file).Substring(0, 16));

                    foreach (IGrouping<string, string> group in groupedFiles)
                    {
                        string longFile = group.FirstOrDefault(file => file.Contains("_form"));
                        string shortFile = group.FirstOrDefault(file => !file.Contains("_form"));
                        // wenn longFile und shortFile vorhanden sind, sollen die daten in shortFile aktualisiert werden
                        UpdateProgress($"shortFile aktualisieren...");

                        if (longFile != null && shortFile != null)
                        {
                            var longData = JObject.Parse(System.IO.File.ReadAllText(longFile).Replace("-", " "));
                            var shortData = JArray.Parse(System.IO.File.ReadAllText(shortFile));

                            string actor = longData["Schauspieler"].ToString();
                            var targetObject = shortData.FirstOrDefault(obj => obj["Schauspieler"].ToString() == actor);

                            if (targetObject != null)
                            {
                                // Update the target object with the long data.
                                UpdateProgress($"Update the target object with the long data...");

                                targetObject["Ja"] = longData["Ja"];
                                targetObject["Auto"] = longData["Auto"];
                                targetObject["Mitfahrer"] = longData["Mitfahrer"];
                                targetObject["Besetzt"] = longData["Ja"];
                            }

                            // Find all roles marked as 'Besetzt' = true and set 'Besetzt' to true for all matching roles.
                            UpdateProgress($"Besetzte Rollen Markieren...");
                            HashSet<string> occupiedRoles = new HashSet<string>(shortData
                                .Where(item => item["Besetzt"]?.ToString() == "true")
                                .Select(item => item["Rollen"].ToString()));

                            foreach (var item in shortData)
                            {
                                if (occupiedRoles.Contains(item["Rollen"].ToString()))
                                {
                                    item["Besetzt"] = "true";
                                }
                            }
                            // finde alle rollen die Abendregie auf "True" haben.
                            UpdateProgress($"Abendregie Rollen Markieren...");
                            HashSet<string> abendregie = new HashSet<string>(shortData
                                .Where(item => item["Abendregie"]?.ToString() == "True")
                                .Select(item => item["Rollen"].ToString()));

                            foreach (var item in shortData)
                            {
                                if (occupiedRoles.Contains(item["Abendregie"].ToString()))
                                {
                                    item["Besetzt"] = "true";
                                }
                            }

                            System.IO.File.WriteAllText(shortFile, shortData.ToString());
                        }
                        // löschen der "longFile" Dateien
                        UpdateProgress($"löschen der \"longFile\" Dateien...");
                        /*
                        System.IO.File.Delete(longFile);
                        */
                    }
                    // wenn noch longFile daten in downloadDirectory vorhanden sind, soll der prozes wiederholt werden
                    if (Directory.GetFiles(downloadDirectory, "*_form.json").Length > 0)
                    {
                        await AuftragUpdate(downloadpre);
                    }
                    else
                    {

                    }
                    await Task.CompletedTask;
                }
            }
        }
    }
}
