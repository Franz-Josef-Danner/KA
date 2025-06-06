// File: Schau.cs
using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using static res_format.Liste;

namespace res_format
{

    public partial class Schau : Form
    {

        public event EventHandler DataSaved;


        public Schau()
        {
            InitializeComponent();
            Load += (s, e) => StueckArchiGet_Click(s, e);
            this.AcceptButton = SchauOK; // Stellen Sie sicher, dass SchauOK der Button ist, der aktiviert wird
            CancelButton = Abbrechen;

            foreach (Button button in flowLayoutPanel1.Controls.OfType<Button>())
            {
                button.TabStop = false;
            }
            this.StartPosition = FormStartPosition.CenterScreen;

        }


        private void SchauOK_Click(object sender, EventArgs e)
        {
            // Hier können zusätzliche Aktionen definiert werden
            DataSaved?.Invoke(this, EventArgs.Empty);

            // Das Setzen des DialogResult auf OK wird das Formular schließen
            DialogResult = DialogResult.OK;
            

        }


        private void SchauAbbrechen_Click(object sender, EventArgs e)
        {
            Close();
        }


        private void StueckeComboBox_SelectedIndexChanged(object sender, EventArgs e)
        {
            ComboBox stueckeComboBox = (ComboBox)sender;
            if (stueckeComboBox.SelectedIndex == -1)
            {
                return;
            }
            StueckeRowData selectedStueck = Liste.Instance.GetAllStueckeRowData().ToArray()[stueckeComboBox.SelectedIndex];
            if (selectedStueck != null)
            {
                List<string> roleList = GetRollen(selectedStueck);
                roleList = roleList.Select(r => r.Trim(';')).ToList();  // Entfernen von Semikolons
                if (roleList.Count > 0)
                {
                    ComboBox roleComboBox = flowLayoutPanel1.Controls.OfType<GroupBox>().Last().Controls.OfType<ComboBox>().First();
                    roleComboBox.Items.Clear();
                    roleComboBox.Items.AddRange(roleList.ToArray());
                    roleComboBox.SelectedIndex = -1;
                }
            }
        }


        private void NeuStueck_Click(object sender, EventArgs e)
        {

            // Erstellung und Hinzufügung der Haupt-GroupBox wie zuvor beschrieben

            GroupBox mainGroupBox = new GroupBox
            {
                Text = $"Stück {flowLayoutPanel1.Controls.OfType<GroupBox>().Count() + 1}",
                AutoSize = true,
                Padding = new Padding(10),
                Margin = new Padding(10)
            };

            Button deleteButton = new Button
            {
                Text = "Löschen",
                Width = 70,
                Location = new Point(10, 30)

            };

            // Beim Löschen der GroupBox werden diese aus dem FlowLayoutPanel entfernt

            deleteButton.Click += (s, ev) =>
            {
                flowLayoutPanel1.Controls.Remove(mainGroupBox);
                GetStueckeData();
            };

            ComboBox StueckecomboBox = new ComboBox
            {
                DropDownStyle = ComboBoxStyle.DropDownList,
                Width = 150,
                Location = new Point(10, 60)
            };




            // Laden der Stücknamen aus StueckeRowData
            StueckeRowData[] stueckeName = Liste.Instance.GetAllStueckeRowData().ToArray();
            StueckecomboBox.Items.AddRange(stueckeName.Select(s => s.StueckeName).ToArray());
            if (StueckecomboBox.Items.Count > 0)
            {
                StueckecomboBox.SelectedIndex = -1;
            }

            Button addSubGroupButton = new Button
            {
                Text = "Neue Rolle",
                Width = 70,
                Location = new Point(90, 30)
            };


            // überprüfen ob in der StueckecomboBox in mainGroupBox ein Stück ausgewählt wurde
            addSubGroupButton.Click += (s, ev) =>
            {
                if (StueckecomboBox.SelectedIndex == -1)
                {
                    MessageBox.Show("Bitte wählen Sie ein Stück aus.");
                    return;
                }
                // Ensure the correct type is being passed
                AddSubGroup(mainGroupBox, stueckeName[StueckecomboBox.SelectedIndex]);
            };


            //jede mainGroupBox in den Controls iterieren und die Anzahl sammeln.
            //Die anzahl wird dann in den TestText eingefügt
            int i = 1;
            foreach (GroupBox mainGroup in flowLayoutPanel1.Controls.OfType<GroupBox>())
            {
                mainGroup.Text = $"Stück {i}";
                i++;
            }


            mainGroupBox.Controls.Add(StueckecomboBox);
            mainGroupBox.Controls.Add(deleteButton);
            mainGroupBox.Controls.Add(addSubGroupButton);


            flowLayoutPanel1.Controls.Add(mainGroupBox); // Annahme, dass ein FlowLayoutPanel zur Anordnung verwendet wird
        }



        private void AddSubGroup(GroupBox parentGroup, StueckeRowData selectedStueck)
        {

            GroupBox subGroupBox = new GroupBox
            {
                // Text mit fortlaufender Nummerierung
                Text = $"Rolle {parentGroup.Controls.OfType<GroupBox>().Count() + 1}",
                AutoSize = true,
                Height = 20,
                Padding = new Padding(1),
                Location = new Point(170, 0)
            };



            ComboBox roleComboBox = new ComboBox
            {
                DropDownStyle = ComboBoxStyle.DropDownList,
                Width = 100,
                Location = new Point(5, 15)
            };

            // wenn ich der roleComboBox eine auswahl getroffen habe, soll public string GetStueckeData() ausgeführt werden
            roleComboBox.SelectedIndexChanged += (s, ev) =>
            {
                GetStueckeData();
            };

            // Assume `GetRollen` returns a list of string roles
            List<string> roleList = GetRollen(selectedStueck);
            roleComboBox.Items.AddRange(roleList.ToArray());
            if (roleComboBox.Items.Count > 0)
            {
                roleComboBox.SelectedIndex = -1;  // Select the first role by default
            }

            Button deleteButton = new Button
            {
                Text = "Löschen",
                Width = 80,
                Location = new Point(125, 14)
            };

            deleteButton.Click += (s, ev) =>
            {
                parentGroup.Controls.Remove(subGroupBox);
                UpdateSubGroupPositions(parentGroup);
                GetStueckeData();

            };

            //jede subGroupBox in den Controls iterieren und die Anzahl sammeln.
            //Die anzahl wird dann in den TestText eingefügt
            int i = 1;
            foreach (GroupBox subGroup in parentGroup.Controls.OfType<GroupBox>())
            {
                subGroup.Text = $"Rolle {i}";
                i++;
            }


            subGroupBox.Controls.Add(roleComboBox);
            subGroupBox.Controls.Add(deleteButton);

            parentGroup.Controls.Add(subGroupBox);
            UpdateSubGroupPositions(parentGroup);
        }

        public string GetStueckeData()
        {
            // Initialize a list to hold each group's data as a string.
            List<string> groupDataList = new List<string>();

            // Iterate over each main GroupBox in the flowLayoutPanel.
            foreach (GroupBox mainGroup in flowLayoutPanel1.Controls.OfType<GroupBox>())
            {
                string groupData = "["; // Start of the group data.

                // Get the main ComboBox for the current main GroupBox.
                ComboBox stueckeComboBox = mainGroup.Controls.OfType<ComboBox>().FirstOrDefault();
                int stueckeIndex = stueckeComboBox != null ? stueckeComboBox.SelectedIndex : -1;

                // Count subgroups (which are GroupBoxes) inside the main GroupBox.
                int subGroupCount = mainGroup.Controls.OfType<GroupBox>().Count();

                // Build the subgroup indices string.
                List<string> subGroupIndices = new List<string>();
                foreach (GroupBox subGroup in mainGroup.Controls.OfType<GroupBox>())
                {
                    ComboBox roleComboBox = subGroup.Controls.OfType<ComboBox>().FirstOrDefault();
                    int roleIndex = roleComboBox != null ? roleComboBox.SelectedIndex : -1;
                    subGroupIndices.Add(roleIndex.ToString());
                }

                // Concatenate all parts for the current main GroupBox.
                groupData += $"{flowLayoutPanel1.Controls.OfType<GroupBox>().Count()};{stueckeIndex};{subGroupCount};{String.Join(";", subGroupIndices)}]";

                // Add the current group data to the list.
                groupDataList.Add(groupData);
            }

            // Join all group data with semicolons to form the final string.
            string stueckeData = String.Join(";", groupDataList);

            // Store the formatted data in DataBox and return it.
            DataBox.Text = stueckeData;
            ListeInfo_Click(this, EventArgs.Empty);
            return stueckeData;
            
        }

        private void ListeInfo_Click(object sender, EventArgs e)
        {
            // die Text Inhalte der ComboBoxen in MainGroupBox und SubGroupBox in StRoBox.Text speichern, also Stückname und Rollen mit
            List<string> stueckeData = new List<string>();
            foreach (GroupBox mainGroup in flowLayoutPanel1.Controls.OfType<GroupBox>())
            {
                ComboBox stueckeComboBox = mainGroup.Controls.OfType<ComboBox>().FirstOrDefault();
                if (stueckeComboBox != null)
                {
                    // [Stückname1] Rolle1, Rolle2, Rolle3; [Stückname2] Rolle1, Rolle2; ...
                    string stueckeName = stueckeComboBox.SelectedItem?.ToString();
                    if (!string.IsNullOrWhiteSpace(stueckeName))
                    {
                        List<string> roleList = new List<string>();
                        foreach (GroupBox subGroup in mainGroup.Controls.OfType<GroupBox>())
                        {
                            ComboBox roleComboBox = subGroup.Controls.OfType<ComboBox>().FirstOrDefault();
                            if (roleComboBox != null)
                            {
                                string roleName = roleComboBox.SelectedItem?.ToString();
                                if (!string.IsNullOrWhiteSpace(roleName))
                                {
                                    roleList.Add(roleName);
                                }
                            }
                        }
                        stueckeData.Add($"[{stueckeName}] {string.Join(", ", roleList)}");
                    }
                }
            }
            StRoBox.Text = string.Join(", ", stueckeData);
        }

        private List<string> GetRollen(StueckeRowData stueck)
        {
            if (stueck != null && !string.IsNullOrWhiteSpace(stueck.Rollen))
            {
                return stueck.Rollen.Split(';').ToList();
            }
            return new List<string>(); // Return an empty list if no roles found or if input is invalid
        }


        private void UpdateSubGroupPositions(GroupBox parentGroup)
        {
            // x and y position variables
            int yPos = 45;
            foreach (Control ctrl in parentGroup.Controls.OfType
                <GroupBox>())
            {
                ctrl.Location = new Point(ctrl.Location.X, yPos);
                yPos += ctrl.Height + 5;
            }
            parentGroup.Height = yPos + 60; // Update the parent GroupBox's height to accommodate all sub-group boxes

        }

        private void StueckArchiGet_Click(object sender, EventArgs e)
        {
            // Ich möchte den NeuStueck_Click Event ausführen so oft wie "[" in DataBox.Text vorkommt, sonst nichts
            int count = DataBox.Text.Count(f => f == '[');
            for (int i = 0; i < count; i++)
            {
                NeuStueck_Click(sender, e);
            }
            // Extrahieren der zweiten Zahl nach "[" aus allen "[]" und in StKl anzeigen
            string[] parts = Regex.Matches(DataBox.Text, @"\[(.*?)\]")
                .Cast<Match>()
                .Select(m => m.Groups[1].Value)
                .ToArray();
            string[] numbers = parts.Select(p => p.Split(';')[1]).ToArray();
            StKl.Text = string.Join(", ", numbers);
            // die zahlen dann nacheinander in die durch NeuStueck_Click erstellten ComboBoxen einfügen
            int j = 0;
            foreach (GroupBox mainGroup in flowLayoutPanel1.Controls.OfType<GroupBox>())
            {
                ComboBox stueckeComboBox = mainGroup.Controls.OfType<ComboBox>().FirstOrDefault();
                if (stueckeComboBox != null)
                {
                    stueckeComboBox.SelectedIndex = int.Parse(numbers[j]);
                    j++;
                }
            }
            // Extrahieren der dritten Zahl nach "[" aus allen "[]" und in StIn anzeigen
            string[] numbers2 = parts.Select(p => p.Split(';')[2]).ToArray();
            StIn.Text = string.Join(", ", numbers2);
            // die erste Zahl in StIn löst die addSubGroupButton_Click in der ersten mainGroupBox aus, die zweite in der zweiten usw.
            int k = 0;
            foreach (GroupBox mainGroup in flowLayoutPanel1.Controls.OfType<GroupBox>())
            {
                Button addSubGroupButton = mainGroup.Controls.OfType<Button>().Last();
                if (addSubGroupButton != null)
                {
                    for (int l = 0; l < int.Parse(numbers2[k]); l++)
                    {
                        addSubGroupButton.PerformClick();
                    }
                    k++;
                }
            }
            // extrahieren der restlichen Zahlen ab zahl 4 aus allen "[]" und in RoKl anzeigen
            string[] numbers3 = parts.Select(p => p.Split(';').Skip(3).ToArray()).SelectMany(x => x).ToArray();
            RoKl.Text = string.Join(", ", numbers3);
            // die zahlen dann nacheinander in die durch addSubGroupButton_Click erstellten ComboBoxen einfügen
            int t = 0;
            foreach (GroupBox mainGroup in flowLayoutPanel1.Controls.OfType<GroupBox>())
            {
                foreach (GroupBox subGroup in mainGroup.Controls.OfType<GroupBox>())
                {
                    ComboBox roleComboBox = subGroup.Controls.OfType<ComboBox>().FirstOrDefault();
                    if (roleComboBox != null)
                    {
                        roleComboBox.SelectedIndex = int.Parse(numbers3[t]);
                        t++;
                    }
                }
            }
        }

        private void Abbrechen_Click(object sender, EventArgs e)
        {
            DialogResult = DialogResult.Cancel;

        }
    }
}
