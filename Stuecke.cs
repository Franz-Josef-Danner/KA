using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;

namespace res_format
{
    public partial class Stuecke : Form
    {
        public event EventHandler DataSaved;
        private static Stuecke instance;
        private readonly List<TextBox> RollenTextBoxes = new List<TextBox>();
        private readonly List<Label> RoleLabels = new List<Label>();
        private readonly List<Label> BeschreibungLabels = new List<Label>();
        private readonly List<RichTextBox> BeschreibungRichtTextBox = new List<RichTextBox>();

        public Stuecke()
        {
            AcceptButton = StueckeOK;

            InitializeComponent();
            this.Load += Form_Load;
            CancelButton = Abbrechen;
            // alle button deselectieren
        }

        public static Stuecke StueckInstance
        {
            get
            {
                if (instance == null || instance.IsDisposed)
                {
                    instance = new Stuecke();
                }
                return instance;
            }
        }

        private void Form_Load(object sender, EventArgs e)
        {
            FigCount.TextChanged += FigCount_TextChanged;
        }

        private void FigCount_TextChanged(object sender, EventArgs e)
        {
            CreateRollenTextBoxes();
        }

        private void RollenBox_TextChanged(object sender, EventArgs e)
        {
            // Split the text by ';' to separate roles and descriptions
            string[] rollen = RollenBox.Text.Split(';');
            for (int i = 0; i < RollenTextBoxes.Count; i++)
            {
                if (i < rollen.Length)
                {
                    RollenTextBoxes[i].Text = rollen[i].Trim();
                }
                else
                {
                    RollenTextBoxes[i].Text = string.Empty;
                }
            }

            
        }
        private void RollenBeschBox_TextChanged(object sender, EventArgs e)
        {
            string[] rollenBesch = RollenBeschBox.Text.Split(';');
            for (int i = 0; i < BeschreibungRichtTextBox.Count; i++)
            {
                if (i < rollenBesch.Length)
                {
                    BeschreibungRichtTextBox[i].Text = rollenBesch[i].Trim();
                }
                else
                {
                    BeschreibungRichtTextBox[i].Text = string.Empty;
                }
            }

        }



        private void CreateRollenTextBoxes()
        {
            int currentCount = RollenTextBoxes.Count;
            if (int.TryParse(FigCount.Text, out int newCount))
            {
                if (newCount < currentCount)
                {
                    DialogResult result = MessageBox.Show(
                        "Durch die Reduzierung der Anzahl der Rollen werden einige Textfelder entfernt. Möchten Sie fortfahren?",
                        "Rollenanzahl reduzieren",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Question);

                    if (result == DialogResult.No)
                    {
                        FigCount.Text = currentCount.ToString();  // Setzen Sie die Zahl im FigCount zurück zur aktuellen Anzahl
                        return;
                    }
                }

                // Remove excess controls
                RemoveExcessControls(newCount);

                // Add new controls as needed
                AddNewControls(currentCount, newCount);
            }
            else
            {
                MessageBox.Show("Bitte geben Sie eine gültige Zahl ein.", "Ungültige Eingabe", MessageBoxButtons.OK, MessageBoxIcon.Error);
                FigCount.Text = currentCount.ToString(); // Zurücksetzen auf die aktuelle Anzahl, falls die Eingabe ungültig war
            }
        }

        private void RemoveExcessControls(int newCount)
        {
            while (RollenTextBoxes.Count > newCount)
            {
                int lastIndex = RollenTextBoxes.Count - 1;
                Controls.Remove(RollenTextBoxes[lastIndex]);
                RollenTextBoxes[lastIndex].Dispose();
                RollenTextBoxes.RemoveAt(lastIndex);

                Controls.Remove(BeschreibungRichtTextBox[lastIndex]);
                BeschreibungRichtTextBox[lastIndex].Dispose();
                BeschreibungRichtTextBox.RemoveAt(lastIndex);

                Controls.Remove(RoleLabels[lastIndex]);
                RoleLabels[lastIndex].Dispose();
                RoleLabels.RemoveAt(lastIndex);

                Controls.Remove(BeschreibungLabels[lastIndex]);
                BeschreibungLabels[lastIndex].Dispose();
                BeschreibungLabels.RemoveAt(lastIndex);
            }
        }

        private void AddNewControls(int currentCount, int newCount)
        {
            for (int i = currentCount; i < newCount; i++)
            {
                int labelIndex = i + 1; // Nummerierung beginnt bei 1
                AddControl(labelIndex);
            }
        }

        private void AddControl(int index)
        {
            Label roleLabel = new Label
            {
                Text = $"Rolle {index}",
                Location = new Point(253, -100 + (index * 140)),
                Size = new Size(100, 13)
            };
            TextBox roleTextBox = new TextBox
            {
                Location = new Point(253, -80 + (index * 140)),
                Size = new Size(150, 20)
            };
            Label descriptionLabel = new Label
            {
                Text = $"Beschreibung {index}",
                Location = new Point(422, -100 + (index * 140)),
                Size = new Size(100, 13)
            };
            RichTextBox descriptionTextBox = new RichTextBox
            {
                Location = new Point(422, -80 + (index * 140)),
                Size = new Size(150, 100)
            };

            Controls.Add(roleLabel);
            Controls.Add(descriptionLabel);
            Controls.Add(roleTextBox);
            Controls.Add(descriptionTextBox);
            RoleLabels.Add(roleLabel);
            BeschreibungLabels.Add(descriptionLabel);
            RollenTextBoxes.Add(roleTextBox);
            BeschreibungRichtTextBox.Add(descriptionTextBox);
        }



        private void StueckeOK_Click(object sender, EventArgs e)
        {
            // Formatieren der Informationen aus den TextBoxen und RichTextBoxen
            string formattedRollen = FormatRole();
            string formattedRollenBeschreibung = FormatRoleDescriptions();
            // Optional: Setzen des formatierten Textes zurück in die RollenBox, falls gewünscht
            RollenBox.Text = formattedRollen;

            RollenBeschBox.Text = formattedRollenBeschreibung;

            // Hier können zusätzliche Aktionen definiert werden
            DataSaved?.Invoke(this, EventArgs.Empty); // Löst das DataSaved Ereignis aus, wenn vorhanden

            // Das Setzen des DialogResult auf OK wird das Formular schließen
            DialogResult = DialogResult.OK;
        }

        private string FormatRole()
        {
            List<string> RoleName = new List<string>();
            for (int i = 0; i < RollenTextBoxes.Count; i++)
            {
                string roleName = RollenTextBoxes[i].Text.Trim();
                RoleName.Add($"{roleName}");
            }
            return string.Join("; ",RoleName);
        }
        private string FormatRoleDescriptions()
        {
            List<string> Descriptions = new List<string>();
            for (int i = 0; i < RollenTextBoxes.Count; i++)
            {
                string description = BeschreibungRichtTextBox[i].Text.Trim();
                Descriptions.Add($"{description}");
            }
            return string.Join("; ",Descriptions);
        }

        private void Abbrechen_Click(object sender, EventArgs e)
        {
            // Das Setzen des DialogResult auf Cancel wird das Formular schließen
            DialogResult = DialogResult.Cancel;
        }
    }
}
