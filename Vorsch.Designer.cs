// Vorst.Designer.cs
using System.Drawing;
using System.Windows.Forms;

namespace res_format
{
    partial class Vorsch
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.LokationBox = new System.Windows.Forms.TextBox();
            this.contextMenuStrip1 = new System.Windows.Forms.ContextMenuStrip(this.components);
            this.DatumBox = new System.Windows.Forms.TextBox();
            this.ZeitBox = new System.Windows.Forms.TextBox();
            this.LokLabel = new System.Windows.Forms.Label();
            this.Datumlabel = new System.Windows.Forms.Label();
            this.Uhrzeitlabel = new System.Windows.Forms.Label();
            this.RolleCombo1 = new System.Windows.Forms.ComboBox();
            this.RolleCombo2 = new System.Windows.Forms.ComboBox();
            this.RolleCombo4 = new System.Windows.Forms.ComboBox();
            this.RolleCombo3 = new System.Windows.Forms.ComboBox();
            this.RolleCombo6 = new System.Windows.Forms.ComboBox();
            this.RolleCombo5 = new System.Windows.Forms.ComboBox();
            this.RegieBox = new System.Windows.Forms.ComboBox();
            this.StueckeListBox = new System.Windows.Forms.ComboBox();
            this.Rolle1 = new System.Windows.Forms.Label();
            this.Stuecklabel = new System.Windows.Forms.Label();
            this.Rolle2 = new System.Windows.Forms.Label();
            this.Rolle3 = new System.Windows.Forms.Label();
            this.Rolle6 = new System.Windows.Forms.Label();
            this.Rolle5 = new System.Windows.Forms.Label();
            this.Rolle4 = new System.Windows.Forms.Label();
            this.label11 = new System.Windows.Forms.Label();
            this.Abbrechenbutton = new System.Windows.Forms.Button();
            this.OKbutton = new System.Windows.Forms.Button();
            this.StueckBox = new System.Windows.Forms.TextBox();
            this.AuswahlBox = new System.Windows.Forms.TextBox();
            this.Fahrer1 = new System.Windows.Forms.CheckBox();
            this.Fahrer2 = new System.Windows.Forms.CheckBox();
            this.Fahrer3 = new System.Windows.Forms.CheckBox();
            this.Fahrer4 = new System.Windows.Forms.CheckBox();
            this.Fahrer5 = new System.Windows.Forms.CheckBox();
            this.Fahrer6 = new System.Windows.Forms.CheckBox();
            this.MitfahrCombo1 = new System.Windows.Forms.ComboBox();
            this.MitfahrCombo2 = new System.Windows.Forms.ComboBox();
            this.MitfahrCombo3 = new System.Windows.Forms.ComboBox();
            this.MitfahrCombo6 = new System.Windows.Forms.ComboBox();
            this.MitfahrCombo5 = new System.Windows.Forms.ComboBox();
            this.MitfahrCombo4 = new System.Windows.Forms.ComboBox();
            this.MitLabel = new System.Windows.Forms.Label();
            this.Checkbutton = new System.Windows.Forms.Button();
            this.webView2 = new Microsoft.Web.WebView2.WinForms.WebView2();
            this.MitfahrCombo7 = new System.Windows.Forms.ComboBox();
            this.NeuAnf = new System.Windows.Forms.Button();
            this.TestBox1 = new System.Windows.Forms.RichTextBox();
            this.TestBox2 = new System.Windows.Forms.RichTextBox();
            this.TestBox3 = new System.Windows.Forms.RichTextBox();
            this.InfoLabel = new System.Windows.Forms.Label();
            this.ProgressBar = new System.Windows.Forms.ProgressBar();
            this.TestBox6 = new System.Windows.Forms.RichTextBox();
            this.TestBox5 = new System.Windows.Forms.RichTextBox();
            this.TestBox4 = new System.Windows.Forms.RichTextBox();
            ((System.ComponentModel.ISupportInitialize)(this.webView2)).BeginInit();
            this.SuspendLayout();
            // 
            // LokationBox
            // 
            this.LokationBox.Location = new System.Drawing.Point(12, 25);
            this.LokationBox.Name = "LokationBox";
            this.LokationBox.Size = new System.Drawing.Size(375, 20);
            this.LokationBox.TabIndex = 0;
            this.LokationBox.TextChanged += new System.EventHandler(this.LokationBox_TextChanged);
            // 
            // contextMenuStrip1
            // 
            this.contextMenuStrip1.Name = "contextMenuStrip1";
            this.contextMenuStrip1.Size = new System.Drawing.Size(61, 4);
            // 
            // DatumBox
            // 
            this.DatumBox.Location = new System.Drawing.Point(395, 25);
            this.DatumBox.Name = "DatumBox";
            this.DatumBox.Size = new System.Drawing.Size(121, 20);
            this.DatumBox.TabIndex = 2;
            // 
            // ZeitBox
            // 
            this.ZeitBox.Location = new System.Drawing.Point(523, 25);
            this.ZeitBox.Name = "ZeitBox";
            this.ZeitBox.Size = new System.Drawing.Size(120, 20);
            this.ZeitBox.TabIndex = 3;
            // 
            // LokLabel
            // 
            this.LokLabel.AutoSize = true;
            this.LokLabel.Location = new System.Drawing.Point(12, 9);
            this.LokLabel.Name = "LokLabel";
            this.LokLabel.Size = new System.Drawing.Size(48, 13);
            this.LokLabel.TabIndex = 18;
            this.LokLabel.Text = "Lokation";
            // 
            // Datumlabel
            // 
            this.Datumlabel.AutoSize = true;
            this.Datumlabel.Location = new System.Drawing.Point(392, 9);
            this.Datumlabel.Name = "Datumlabel";
            this.Datumlabel.Size = new System.Drawing.Size(38, 13);
            this.Datumlabel.TabIndex = 19;
            this.Datumlabel.Text = "Datum";
            // 
            // Uhrzeitlabel
            // 
            this.Uhrzeitlabel.AutoSize = true;
            this.Uhrzeitlabel.Location = new System.Drawing.Point(520, 9);
            this.Uhrzeitlabel.Name = "Uhrzeitlabel";
            this.Uhrzeitlabel.Size = new System.Drawing.Size(40, 13);
            this.Uhrzeitlabel.TabIndex = 20;
            this.Uhrzeitlabel.Text = "Uhrzeit";
            // 
            // RolleCombo1
            // 
            this.RolleCombo1.FormattingEnabled = true;
            this.RolleCombo1.Location = new System.Drawing.Point(12, 83);
            this.RolleCombo1.Name = "RolleCombo1";
            this.RolleCombo1.Size = new System.Drawing.Size(121, 21);
            this.RolleCombo1.TabIndex = 21;
            this.RolleCombo1.SelectedIndexChanged += new System.EventHandler(this.RolleCombo1_SelectedIndexChanged);
            // 
            // RolleCombo2
            // 
            this.RolleCombo2.FormattingEnabled = true;
            this.RolleCombo2.Location = new System.Drawing.Point(140, 83);
            this.RolleCombo2.Name = "RolleCombo2";
            this.RolleCombo2.Size = new System.Drawing.Size(121, 21);
            this.RolleCombo2.TabIndex = 22;
            this.RolleCombo2.SelectedIndexChanged += new System.EventHandler(this.RolleCombo2_SelectedIndexChanged);
            // 
            // RolleCombo4
            // 
            this.RolleCombo4.FormattingEnabled = true;
            this.RolleCombo4.Location = new System.Drawing.Point(395, 83);
            this.RolleCombo4.Name = "RolleCombo4";
            this.RolleCombo4.Size = new System.Drawing.Size(121, 21);
            this.RolleCombo4.TabIndex = 24;
            this.RolleCombo4.SelectedIndexChanged += new System.EventHandler(this.RolleCombo4_SelectedIndexChanged);
            // 
            // RolleCombo3
            // 
            this.RolleCombo3.FormattingEnabled = true;
            this.RolleCombo3.Location = new System.Drawing.Point(267, 83);
            this.RolleCombo3.Name = "RolleCombo3";
            this.RolleCombo3.Size = new System.Drawing.Size(121, 21);
            this.RolleCombo3.TabIndex = 23;
            this.RolleCombo3.SelectedIndexChanged += new System.EventHandler(this.RolleCombo3_SelectedIndexChanged);
            // 
            // RolleCombo6
            // 
            this.RolleCombo6.FormattingEnabled = true;
            this.RolleCombo6.Location = new System.Drawing.Point(650, 83);
            this.RolleCombo6.Name = "RolleCombo6";
            this.RolleCombo6.Size = new System.Drawing.Size(121, 21);
            this.RolleCombo6.TabIndex = 26;
            this.RolleCombo6.SelectedIndexChanged += new System.EventHandler(this.RolleCombo6_SelectedIndexChanged);
            // 
            // RolleCombo5
            // 
            this.RolleCombo5.FormattingEnabled = true;
            this.RolleCombo5.Location = new System.Drawing.Point(522, 83);
            this.RolleCombo5.Name = "RolleCombo5";
            this.RolleCombo5.Size = new System.Drawing.Size(121, 21);
            this.RolleCombo5.TabIndex = 25;
            this.RolleCombo5.SelectedIndexChanged += new System.EventHandler(this.RolleCombo5_SelectedIndexChanged);
            // 
            // RegieBox
            // 
            this.RegieBox.FormattingEnabled = true;
            this.RegieBox.Location = new System.Drawing.Point(777, 83);
            this.RegieBox.Name = "RegieBox";
            this.RegieBox.Size = new System.Drawing.Size(121, 21);
            this.RegieBox.TabIndex = 27;
            this.RegieBox.SelectedIndexChanged += new System.EventHandler(this.RegieBox_SelectedIndexChanged);
            // 
            // StueckeListBox
            // 
            this.StueckeListBox.FormattingEnabled = true;
            this.StueckeListBox.Location = new System.Drawing.Point(650, 25);
            this.StueckeListBox.Name = "StueckeListBox";
            this.StueckeListBox.Size = new System.Drawing.Size(121, 21);
            this.StueckeListBox.TabIndex = 28;
            this.StueckeListBox.SelectedIndexChanged += new System.EventHandler(this.StueckeListBox_SelectedIndexChanged);
            // 
            // Rolle1
            // 
            this.Rolle1.AutoSize = true;
            this.Rolle1.Location = new System.Drawing.Point(9, 67);
            this.Rolle1.Name = "Rolle1";
            this.Rolle1.Size = new System.Drawing.Size(37, 13);
            this.Rolle1.TabIndex = 29;
            this.Rolle1.Text = "Rolle1";
            // 
            // Stuecklabel
            // 
            this.Stuecklabel.AutoSize = true;
            this.Stuecklabel.Location = new System.Drawing.Point(647, 9);
            this.Stuecklabel.Name = "Stuecklabel";
            this.Stuecklabel.Size = new System.Drawing.Size(35, 13);
            this.Stuecklabel.TabIndex = 30;
            this.Stuecklabel.Text = "Stück";
            // 
            // Rolle2
            // 
            this.Rolle2.AutoSize = true;
            this.Rolle2.Location = new System.Drawing.Point(137, 67);
            this.Rolle2.Name = "Rolle2";
            this.Rolle2.Size = new System.Drawing.Size(37, 13);
            this.Rolle2.TabIndex = 31;
            this.Rolle2.Text = "Rolle2";
            // 
            // Rolle3
            // 
            this.Rolle3.AutoSize = true;
            this.Rolle3.Location = new System.Drawing.Point(264, 67);
            this.Rolle3.Name = "Rolle3";
            this.Rolle3.Size = new System.Drawing.Size(37, 13);
            this.Rolle3.TabIndex = 32;
            this.Rolle3.Text = "Rolle3";
            // 
            // Rolle6
            // 
            this.Rolle6.AutoSize = true;
            this.Rolle6.Location = new System.Drawing.Point(647, 67);
            this.Rolle6.Name = "Rolle6";
            this.Rolle6.Size = new System.Drawing.Size(37, 13);
            this.Rolle6.TabIndex = 35;
            this.Rolle6.Text = "Rolle6";
            // 
            // Rolle5
            // 
            this.Rolle5.AutoSize = true;
            this.Rolle5.Location = new System.Drawing.Point(520, 67);
            this.Rolle5.Name = "Rolle5";
            this.Rolle5.Size = new System.Drawing.Size(37, 13);
            this.Rolle5.TabIndex = 34;
            this.Rolle5.Text = "Rolle5";
            // 
            // Rolle4
            // 
            this.Rolle4.AutoSize = true;
            this.Rolle4.Location = new System.Drawing.Point(392, 67);
            this.Rolle4.Name = "Rolle4";
            this.Rolle4.Size = new System.Drawing.Size(37, 13);
            this.Rolle4.TabIndex = 33;
            this.Rolle4.Text = "Rolle4";
            // 
            // label11
            // 
            this.label11.AutoSize = true;
            this.label11.Location = new System.Drawing.Point(774, 67);
            this.label11.Name = "label11";
            this.label11.Size = new System.Drawing.Size(61, 13);
            this.label11.TabIndex = 36;
            this.label11.Text = "Abendregie";
            // 
            // Abbrechenbutton
            // 
            this.Abbrechenbutton.Location = new System.Drawing.Point(742, 861);
            this.Abbrechenbutton.Name = "Abbrechenbutton";
            this.Abbrechenbutton.Size = new System.Drawing.Size(75, 23);
            this.Abbrechenbutton.TabIndex = 37;
            this.Abbrechenbutton.Text = "Abbrechen";
            this.Abbrechenbutton.UseVisualStyleBackColor = true;
            this.Abbrechenbutton.Click += new System.EventHandler(this.Abbrechenbutton_Click);
            // 
            // OKbutton
            // 
            this.OKbutton.Location = new System.Drawing.Point(823, 861);
            this.OKbutton.Name = "OKbutton";
            this.OKbutton.Size = new System.Drawing.Size(75, 23);
            this.OKbutton.TabIndex = 38;
            this.OKbutton.Text = "senden...";
            this.OKbutton.UseVisualStyleBackColor = true;
            this.OKbutton.Click += new System.EventHandler(this.OKbutton_Click);
            // 
            // StueckBox
            // 
            this.StueckBox.Location = new System.Drawing.Point(12, 864);
            this.StueckBox.Name = "StueckBox";
            this.StueckBox.Size = new System.Drawing.Size(48, 20);
            this.StueckBox.TabIndex = 39;
            this.StueckBox.Visible = false;
            // 
            // AuswahlBox
            // 
            this.AuswahlBox.Location = new System.Drawing.Point(62, 864);
            this.AuswahlBox.Name = "AuswahlBox";
            this.AuswahlBox.Size = new System.Drawing.Size(50, 20);
            this.AuswahlBox.TabIndex = 40;
            this.AuswahlBox.Visible = false;
            this.AuswahlBox.TextChanged += new System.EventHandler(this.AuswahlBox_TextChanged);
            // 
            // Fahrer1
            // 
            this.Fahrer1.AutoSize = true;
            this.Fahrer1.Location = new System.Drawing.Point(12, 110);
            this.Fahrer1.Name = "Fahrer1";
            this.Fahrer1.Size = new System.Drawing.Size(57, 18);
            this.Fahrer1.TabIndex = 48;
            this.Fahrer1.Text = "Fahrer";
            this.Fahrer1.UseCompatibleTextRendering = true;
            this.Fahrer1.UseVisualStyleBackColor = true;
            this.Fahrer1.Visible = false;
            this.Fahrer1.CheckedChanged += new System.EventHandler(this.Fahrer1_CheckedChanged);
            // 
            // Fahrer2
            // 
            this.Fahrer2.AutoSize = true;
            this.Fahrer2.Location = new System.Drawing.Point(140, 110);
            this.Fahrer2.Name = "Fahrer2";
            this.Fahrer2.Size = new System.Drawing.Size(57, 18);
            this.Fahrer2.TabIndex = 49;
            this.Fahrer2.Text = "Fahrer";
            this.Fahrer2.UseCompatibleTextRendering = true;
            this.Fahrer2.UseVisualStyleBackColor = true;
            this.Fahrer2.Visible = false;
            this.Fahrer2.CheckedChanged += new System.EventHandler(this.Fahrer2_CheckedChanged);
            // 
            // Fahrer3
            // 
            this.Fahrer3.AutoSize = true;
            this.Fahrer3.Location = new System.Drawing.Point(267, 110);
            this.Fahrer3.Name = "Fahrer3";
            this.Fahrer3.Size = new System.Drawing.Size(57, 18);
            this.Fahrer3.TabIndex = 50;
            this.Fahrer3.Text = "Fahrer";
            this.Fahrer3.UseCompatibleTextRendering = true;
            this.Fahrer3.UseVisualStyleBackColor = true;
            this.Fahrer3.Visible = false;
            this.Fahrer3.CheckedChanged += new System.EventHandler(this.Fahrer3_CheckedChanged);
            // 
            // Fahrer4
            // 
            this.Fahrer4.AutoSize = true;
            this.Fahrer4.Location = new System.Drawing.Point(395, 110);
            this.Fahrer4.Name = "Fahrer4";
            this.Fahrer4.Size = new System.Drawing.Size(57, 18);
            this.Fahrer4.TabIndex = 51;
            this.Fahrer4.Text = "Fahrer";
            this.Fahrer4.UseCompatibleTextRendering = true;
            this.Fahrer4.UseVisualStyleBackColor = true;
            this.Fahrer4.Visible = false;
            this.Fahrer4.CheckedChanged += new System.EventHandler(this.Fahrer4_CheckedChanged);
            // 
            // Fahrer5
            // 
            this.Fahrer5.AutoSize = true;
            this.Fahrer5.Location = new System.Drawing.Point(523, 110);
            this.Fahrer5.Name = "Fahrer5";
            this.Fahrer5.Size = new System.Drawing.Size(57, 18);
            this.Fahrer5.TabIndex = 52;
            this.Fahrer5.Text = "Fahrer";
            this.Fahrer5.UseCompatibleTextRendering = true;
            this.Fahrer5.UseVisualStyleBackColor = true;
            this.Fahrer5.Visible = false;
            this.Fahrer5.CheckedChanged += new System.EventHandler(this.Fahrer5_CheckedChanged);
            // 
            // Fahrer6
            // 
            this.Fahrer6.AutoSize = true;
            this.Fahrer6.Location = new System.Drawing.Point(650, 110);
            this.Fahrer6.Name = "Fahrer6";
            this.Fahrer6.Size = new System.Drawing.Size(57, 18);
            this.Fahrer6.TabIndex = 53;
            this.Fahrer6.Text = "Fahrer";
            this.Fahrer6.UseCompatibleTextRendering = true;
            this.Fahrer6.UseVisualStyleBackColor = true;
            this.Fahrer6.Visible = false;
            this.Fahrer6.CheckedChanged += new System.EventHandler(this.Fahrer6_CheckedChanged);
            // 
            // MitfahrCombo1
            // 
            this.MitfahrCombo1.FormattingEnabled = true;
            this.MitfahrCombo1.Location = new System.Drawing.Point(12, 134);
            this.MitfahrCombo1.Name = "MitfahrCombo1";
            this.MitfahrCombo1.Size = new System.Drawing.Size(34, 21);
            this.MitfahrCombo1.TabIndex = 54;
            this.MitfahrCombo1.Visible = false;
            this.MitfahrCombo1.SelectedIndexChanged += new System.EventHandler(this.MitfahrCombo1_SelectedIndexChanged);
            // 
            // MitfahrCombo2
            // 
            this.MitfahrCombo2.FormattingEnabled = true;
            this.MitfahrCombo2.Location = new System.Drawing.Point(140, 134);
            this.MitfahrCombo2.Name = "MitfahrCombo2";
            this.MitfahrCombo2.Size = new System.Drawing.Size(34, 21);
            this.MitfahrCombo2.TabIndex = 55;
            this.MitfahrCombo2.Visible = false;
            this.MitfahrCombo2.SelectedIndexChanged += new System.EventHandler(this.MitfahrCombo2_SelectedIndexChanged);
            // 
            // MitfahrCombo3
            // 
            this.MitfahrCombo3.FormattingEnabled = true;
            this.MitfahrCombo3.Location = new System.Drawing.Point(267, 134);
            this.MitfahrCombo3.Name = "MitfahrCombo3";
            this.MitfahrCombo3.Size = new System.Drawing.Size(34, 21);
            this.MitfahrCombo3.TabIndex = 56;
            this.MitfahrCombo3.Visible = false;
            this.MitfahrCombo3.SelectedIndexChanged += new System.EventHandler(this.MitfahrCombo3_SelectedIndexChanged);
            // 
            // MitfahrCombo6
            // 
            this.MitfahrCombo6.FormattingEnabled = true;
            this.MitfahrCombo6.Location = new System.Drawing.Point(650, 134);
            this.MitfahrCombo6.Name = "MitfahrCombo6";
            this.MitfahrCombo6.Size = new System.Drawing.Size(34, 21);
            this.MitfahrCombo6.TabIndex = 59;
            this.MitfahrCombo6.Visible = false;
            this.MitfahrCombo6.SelectedIndexChanged += new System.EventHandler(this.MitfahrCombo6_SelectedIndexChanged);
            // 
            // MitfahrCombo5
            // 
            this.MitfahrCombo5.FormattingEnabled = true;
            this.MitfahrCombo5.Location = new System.Drawing.Point(523, 134);
            this.MitfahrCombo5.Name = "MitfahrCombo5";
            this.MitfahrCombo5.Size = new System.Drawing.Size(34, 21);
            this.MitfahrCombo5.TabIndex = 58;
            this.MitfahrCombo5.Visible = false;
            this.MitfahrCombo5.SelectedIndexChanged += new System.EventHandler(this.MitfahrCombo5_SelectedIndexChanged);
            // 
            // MitfahrCombo4
            // 
            this.MitfahrCombo4.FormattingEnabled = true;
            this.MitfahrCombo4.Location = new System.Drawing.Point(395, 134);
            this.MitfahrCombo4.Name = "MitfahrCombo4";
            this.MitfahrCombo4.Size = new System.Drawing.Size(34, 21);
            this.MitfahrCombo4.TabIndex = 57;
            this.MitfahrCombo4.Visible = false;
            this.MitfahrCombo4.SelectedIndexChanged += new System.EventHandler(this.MitfahrCombo4_SelectedIndexChanged);
            // 
            // MitLabel
            // 
            this.MitLabel.AutoSize = true;
            this.MitLabel.Location = new System.Drawing.Point(774, 115);
            this.MitLabel.Name = "MitLabel";
            this.MitLabel.Size = new System.Drawing.Size(48, 13);
            this.MitLabel.TabIndex = 60;
            this.MitLabel.Text = "Mitfahrer";
            // 
            // Checkbutton
            // 
            this.Checkbutton.Location = new System.Drawing.Point(823, 161);
            this.Checkbutton.Name = "Checkbutton";
            this.Checkbutton.Size = new System.Drawing.Size(75, 23);
            this.Checkbutton.TabIndex = 72;
            this.Checkbutton.Text = "Check";
            this.Checkbutton.UseVisualStyleBackColor = true;
            this.Checkbutton.Click += new System.EventHandler(this.Checkbutton_Click);
            // 
            // webView2
            // 
            this.webView2.AllowExternalDrop = true;
            this.webView2.CreationProperties = null;
            this.webView2.DefaultBackgroundColor = System.Drawing.Color.White;
            this.webView2.Location = new System.Drawing.Point(12, 191);
            this.webView2.Name = "webView2";
            this.webView2.Size = new System.Drawing.Size(886, 664);
            this.webView2.TabIndex = 80;
            this.webView2.ZoomFactor = 1D;
            // 
            // MitfahrCombo7
            // 
            this.MitfahrCombo7.FormattingEnabled = true;
            this.MitfahrCombo7.Location = new System.Drawing.Point(774, 134);
            this.MitfahrCombo7.Name = "MitfahrCombo7";
            this.MitfahrCombo7.Size = new System.Drawing.Size(34, 21);
            this.MitfahrCombo7.TabIndex = 81;
            this.MitfahrCombo7.Visible = false;
            // 
            // NeuAnf
            // 
            this.NeuAnf.Location = new System.Drawing.Point(777, 23);
            this.NeuAnf.Name = "NeuAnf";
            this.NeuAnf.Size = new System.Drawing.Size(121, 23);
            this.NeuAnf.TabIndex = 82;
            this.NeuAnf.Text = "Neu Anfragen";
            this.NeuAnf.UseVisualStyleBackColor = true;
            this.NeuAnf.Visible = false;
            this.NeuAnf.Click += new System.EventHandler(this.NeuAnf_Click);
            // 
            // TestBox1
            // 
            this.TestBox1.Location = new System.Drawing.Point(904, 23);
            this.TestBox1.Name = "TestBox1";
            this.TestBox1.Size = new System.Drawing.Size(555, 281);
            this.TestBox1.TabIndex = 83;
            this.TestBox1.Text = "";
            // 
            // TestBox2
            // 
            this.TestBox2.Location = new System.Drawing.Point(904, 310);
            this.TestBox2.Name = "TestBox2";
            this.TestBox2.Size = new System.Drawing.Size(555, 318);
            this.TestBox2.TabIndex = 84;
            this.TestBox2.Text = "";
            // 
            // TestBox3
            // 
            this.TestBox3.Location = new System.Drawing.Point(904, 634);
            this.TestBox3.Name = "TestBox3";
            this.TestBox3.Size = new System.Drawing.Size(555, 246);
            this.TestBox3.TabIndex = 86;
            this.TestBox3.Text = "";
            // 
            // InfoLabel
            // 
            this.InfoLabel.AutoSize = true;
            this.InfoLabel.Location = new System.Drawing.Point(9, 175);
            this.InfoLabel.Name = "InfoLabel";
            this.InfoLabel.Size = new System.Drawing.Size(48, 13);
            this.InfoLabel.TabIndex = 87;
            this.InfoLabel.Text = "Progress";
            // 
            // ProgressBar
            // 
            this.ProgressBar.Location = new System.Drawing.Point(12, 161);
            this.ProgressBar.Name = "ProgressBar";
            this.ProgressBar.Size = new System.Drawing.Size(805, 10);
            this.ProgressBar.TabIndex = 88;
            // 
            // TestBox6
            // 
            this.TestBox6.Location = new System.Drawing.Point(1465, 636);
            this.TestBox6.Name = "TestBox6";
            this.TestBox6.Size = new System.Drawing.Size(555, 246);
            this.TestBox6.TabIndex = 94;
            this.TestBox6.Text = "";
            // 
            // TestBox5
            // 
            this.TestBox5.Location = new System.Drawing.Point(1465, 312);
            this.TestBox5.Name = "TestBox5";
            this.TestBox5.Size = new System.Drawing.Size(555, 318);
            this.TestBox5.TabIndex = 93;
            this.TestBox5.Text = "";
            // 
            // TestBox4
            // 
            this.TestBox4.Location = new System.Drawing.Point(1465, 25);
            this.TestBox4.Name = "TestBox4";
            this.TestBox4.Size = new System.Drawing.Size(555, 281);
            this.TestBox4.TabIndex = 92;
            this.TestBox4.Text = "";
            // 
            // Vorsch
            // 
            this.ClientSize = new System.Drawing.Size(2029, 892);
            this.Controls.Add(this.TestBox6);
            this.Controls.Add(this.TestBox5);
            this.Controls.Add(this.TestBox4);
            this.Controls.Add(this.InfoLabel);
            this.Controls.Add(this.ProgressBar);
            this.Controls.Add(this.TestBox3);
            this.Controls.Add(this.TestBox2);
            this.Controls.Add(this.TestBox1);
            this.Controls.Add(this.NeuAnf);
            this.Controls.Add(this.MitfahrCombo7);
            this.Controls.Add(this.webView2);
            this.Controls.Add(this.LokationBox);
            this.Controls.Add(this.DatumBox);
            this.Controls.Add(this.ZeitBox);
            this.Controls.Add(this.LokLabel);
            this.Controls.Add(this.Datumlabel);
            this.Controls.Add(this.Uhrzeitlabel);
            this.Controls.Add(this.RolleCombo1);
            this.Controls.Add(this.RolleCombo2);
            this.Controls.Add(this.RolleCombo3);
            this.Controls.Add(this.RolleCombo4);
            this.Controls.Add(this.RolleCombo5);
            this.Controls.Add(this.RolleCombo6);
            this.Controls.Add(this.RegieBox);
            this.Controls.Add(this.StueckeListBox);
            this.Controls.Add(this.Rolle1);
            this.Controls.Add(this.Rolle2);
            this.Controls.Add(this.Rolle3);
            this.Controls.Add(this.Rolle4);
            this.Controls.Add(this.Rolle5);
            this.Controls.Add(this.Rolle6);
            this.Controls.Add(this.Stuecklabel);
            this.Controls.Add(this.label11);
            this.Controls.Add(this.Abbrechenbutton);
            this.Controls.Add(this.OKbutton);
            this.Controls.Add(this.StueckBox);
            this.Controls.Add(this.AuswahlBox);
            this.Controls.Add(this.Fahrer1);
            this.Controls.Add(this.Fahrer2);
            this.Controls.Add(this.Fahrer3);
            this.Controls.Add(this.Fahrer4);
            this.Controls.Add(this.Fahrer5);
            this.Controls.Add(this.Fahrer6);
            this.Controls.Add(this.MitfahrCombo1);
            this.Controls.Add(this.MitfahrCombo2);
            this.Controls.Add(this.MitfahrCombo3);
            this.Controls.Add(this.MitfahrCombo4);
            this.Controls.Add(this.MitfahrCombo5);
            this.Controls.Add(this.MitfahrCombo6);
            this.Controls.Add(this.MitLabel);
            this.Controls.Add(this.Checkbutton);
            this.Name = "Vorsch";
            ((System.ComponentModel.ISupportInitialize)(this.webView2)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        public System.Windows.Forms.TextBox LokationBox;
        private System.Windows.Forms.ContextMenuStrip contextMenuStrip1;
        public System.Windows.Forms.TextBox DatumBox;
        public System.Windows.Forms.TextBox ZeitBox;
        private System.Windows.Forms.Label LokLabel;
        private System.Windows.Forms.Label Datumlabel;
        private System.Windows.Forms.Label Uhrzeitlabel;
        public System.Windows.Forms.ComboBox RolleCombo1;
        public System.Windows.Forms.ComboBox RolleCombo4;
        public System.Windows.Forms.ComboBox RolleCombo3;
        public System.Windows.Forms.ComboBox RolleCombo6;
        public System.Windows.Forms.ComboBox RolleCombo5;
        public System.Windows.Forms.ComboBox RegieBox;
        public System.Windows.Forms.ComboBox StueckeListBox;
        private System.Windows.Forms.Label Stuecklabel;
        private System.Windows.Forms.Label label11;
        private System.Windows.Forms.Button Abbrechenbutton;
        private System.Windows.Forms.Button OKbutton;
        public System.Windows.Forms.TextBox StueckBox;
        public System.Windows.Forms.ComboBox RolleCombo2;
        public System.Windows.Forms.TextBox AuswahlBox;
        public ComboBox MitfahrCombo2;
        public ComboBox MitfahrCombo3;
        public ComboBox MitfahrCombo6;
        public ComboBox MitfahrCombo5;
        public ComboBox MitfahrCombo4;
        private Label MitLabel;
        private Button Checkbutton;
        public ComboBox MitfahrCombo1;
        private Microsoft.Web.WebView2.WinForms.WebView2 webView2;
        public ComboBox MitfahrCombo7;
        private Button NeuAnf;
        private RichTextBox TestBox1;
        private RichTextBox TestBox2;
        private RichTextBox TestBox3;
        private Label InfoLabel;
        private ProgressBar ProgressBar;
        private RichTextBox TestBox6;
        private RichTextBox TestBox5;
        private RichTextBox TestBox4;
        public CheckBox Fahrer1;
        public CheckBox Fahrer2;
        public CheckBox Fahrer3;
        public CheckBox Fahrer4;
        public CheckBox Fahrer5;
        public CheckBox Fahrer6;
        public Label Rolle1;
        public Label Rolle2;
        public Label Rolle3;
        public Label Rolle6;
        public Label Rolle5;
        public Label Rolle4;
    }
}
