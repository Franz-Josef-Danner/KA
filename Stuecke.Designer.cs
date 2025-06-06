namespace res_format
{
    partial class Stuecke
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
            this.Abbrechen = new System.Windows.Forms.Button();
            this.NameBox = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.StueckeOK = new System.Windows.Forms.Button();
            this.label2 = new System.Windows.Forms.Label();
            this.Beschreibung = new System.Windows.Forms.RichTextBox();
            this.FigCount = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.RollenBox = new System.Windows.Forms.TextBox();
            this.RollenBeschBox = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // Abbrechen
            // 
            this.Abbrechen.Location = new System.Drawing.Point(417, 9);
            this.Abbrechen.Name = "Abbrechen";
            this.Abbrechen.Size = new System.Drawing.Size(75, 23);
            this.Abbrechen.TabIndex = 1;
            this.Abbrechen.Text = "Abbrechen";
            this.Abbrechen.UseVisualStyleBackColor = true;
            this.Abbrechen.Click += new System.EventHandler(this.Abbrechen_Click);
            // 
            // NameBox
            // 
            this.NameBox.Location = new System.Drawing.Point(15, 35);
            this.NameBox.Name = "NameBox";
            this.NameBox.Size = new System.Drawing.Size(100, 20);
            this.NameBox.TabIndex = 3;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(12, 9);
            this.label1.Name = "label1";
            this.label1.Padding = new System.Windows.Forms.Padding(5);
            this.label1.Size = new System.Drawing.Size(76, 23);
            this.label1.TabIndex = 8;
            this.label1.Text = "Stück Name";
            // 
            // StueckeOK
            // 
            this.StueckeOK.Location = new System.Drawing.Point(497, 9);
            this.StueckeOK.Name = "StueckeOK";
            this.StueckeOK.Size = new System.Drawing.Size(75, 23);
            this.StueckeOK.TabIndex = 13;
            this.StueckeOK.Text = "OK";
            this.StueckeOK.UseVisualStyleBackColor = true;
            this.StueckeOK.Click += new System.EventHandler(this.StueckeOK_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(12, 58);
            this.label2.Name = "label2";
            this.label2.Padding = new System.Windows.Forms.Padding(5);
            this.label2.Size = new System.Drawing.Size(113, 23);
            this.label2.TabIndex = 9;
            this.label2.Text = "Stück Beschreibung";
            // 
            // Beschreibung
            // 
            this.Beschreibung.Location = new System.Drawing.Point(14, 81);
            this.Beschreibung.Name = "Beschreibung";
            this.Beschreibung.Size = new System.Drawing.Size(232, 172);
            this.Beschreibung.TabIndex = 14;
            this.Beschreibung.Text = "";
            // 
            // FigCount
            // 
            this.FigCount.Location = new System.Drawing.Point(214, 35);
            this.FigCount.Name = "FigCount";
            this.FigCount.Size = new System.Drawing.Size(32, 20);
            this.FigCount.TabIndex = 15;
            this.FigCount.TextChanged += new System.EventHandler(this.FigCount_TextChanged);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(166, 9);
            this.label3.Name = "label3";
            this.label3.Padding = new System.Windows.Forms.Padding(0, 5, 0, 5);
            this.label3.Size = new System.Drawing.Size(80, 23);
            this.label3.TabIndex = 16;
            this.label3.Text = "Figuren Anzahl:";
            // 
            // RollenBox
            // 
            this.RollenBox.Location = new System.Drawing.Point(292, 38);
            this.RollenBox.Name = "RollenBox";
            this.RollenBox.Size = new System.Drawing.Size(100, 20);
            this.RollenBox.TabIndex = 17;
            this.RollenBox.Visible = false;
            this.RollenBox.TextChanged += new System.EventHandler(this.RollenBox_TextChanged);
            // 
            // RollenBeschBox
            // 
            this.RollenBeschBox.Location = new System.Drawing.Point(292, 64);
            this.RollenBeschBox.Name = "RollenBeschBox";
            this.RollenBeschBox.Size = new System.Drawing.Size(100, 20);
            this.RollenBeschBox.TabIndex = 18;
            this.RollenBeschBox.Visible = false;
            this.RollenBeschBox.TextChanged += new System.EventHandler(this.RollenBeschBox_TextChanged);
            // 
            // Stuecke
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.AutoScroll = true;
            this.AutoSize = true;
            this.AutoSizeMode = System.Windows.Forms.AutoSizeMode.GrowAndShrink;
            this.ClientSize = new System.Drawing.Size(584, 264);
            this.Controls.Add(this.RollenBeschBox);
            this.Controls.Add(this.RollenBox);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.FigCount);
            this.Controls.Add(this.Beschreibung);
            this.Controls.Add(this.StueckeOK);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.NameBox);
            this.Controls.Add(this.Abbrechen);
            this.MaximumSize = new System.Drawing.Size(610, 1026);
            this.MinimumSize = new System.Drawing.Size(600, 290);
            this.Name = "Stuecke";
            this.Padding = new System.Windows.Forms.Padding(0, 0, 0, 10);
            this.Text = "Stücke";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Button Abbrechen;
        public System.Windows.Forms.TextBox NameBox;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button StueckeOK;
        private System.Windows.Forms.Label label2;
        public System.Windows.Forms.RichTextBox Beschreibung;
        public System.Windows.Forms.TextBox FigCount;
        private System.Windows.Forms.Label label3;
        public System.Windows.Forms.TextBox RollenBox;
        public System.Windows.Forms.TextBox RollenBeschBox;
    }
}