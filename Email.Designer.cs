using System.Drawing;

namespace res_format
{
    partial class Email
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

        private void InitializeComponent()
        {
            this.SendButton = new System.Windows.Forms.Button();
            this.FirmaBodyTextBox = new System.Windows.Forms.TextBox();
            this.TelefonBodyTextBox = new System.Windows.Forms.TextBox();
            this.InhaberBodyTextBox = new System.Windows.Forms.TextBox();
            this.AdresseBodyTextBox = new System.Windows.Forms.TextBox();
            this.KommentarBodyTextBox = new System.Windows.Forms.TextBox();
            this.InstructionLabel = new System.Windows.Forms.Label();
            this.EmailBodyTextBox = new System.Windows.Forms.TextBox();
            this.subjectLabel = new System.Windows.Forms.Label();
            this.BetreffTextBox = new System.Windows.Forms.TextBox();
            this.emailLabel = new System.Windows.Forms.Label();
            this.EmailBox = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // SendButton
            // 
            this.SendButton.Location = new System.Drawing.Point(730, 650);
            this.SendButton.Name = "SendButton";
            this.SendButton.Size = new System.Drawing.Size(70, 23);
            this.SendButton.TabIndex = 0;
            this.SendButton.Text = "Senden";
            this.SendButton.Click += new System.EventHandler(this.SendButton_Click);
            // 
            // FirmaBodyTextBox
            // 
            this.FirmaBodyTextBox.Location = new System.Drawing.Point(10, 130);
            this.FirmaBodyTextBox.Multiline = true;
            this.FirmaBodyTextBox.Name = "FirmaBodyTextBox";
            this.FirmaBodyTextBox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.FirmaBodyTextBox.Size = new System.Drawing.Size(800, 500);
            this.FirmaBodyTextBox.TabIndex = 1;
            this.FirmaBodyTextBox.Visible = false;
            // 
            // TelefonBodyTextBox
            // 
            this.TelefonBodyTextBox.Location = new System.Drawing.Point(10, 130);
            this.TelefonBodyTextBox.Multiline = true;
            this.TelefonBodyTextBox.Name = "TelefonBodyTextBox";
            this.TelefonBodyTextBox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.TelefonBodyTextBox.Size = new System.Drawing.Size(800, 500);
            this.TelefonBodyTextBox.TabIndex = 2;
            this.TelefonBodyTextBox.Visible = false;
            // 
            // InhaberBodyTextBox
            // 
            this.InhaberBodyTextBox.Location = new System.Drawing.Point(10, 130);
            this.InhaberBodyTextBox.Multiline = true;
            this.InhaberBodyTextBox.Name = "InhaberBodyTextBox";
            this.InhaberBodyTextBox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.InhaberBodyTextBox.Size = new System.Drawing.Size(800, 500);
            this.InhaberBodyTextBox.TabIndex = 3;
            this.InhaberBodyTextBox.Visible = false;
            // 
            // AdresseBodyTextBox
            // 
            this.AdresseBodyTextBox.Location = new System.Drawing.Point(10, 130);
            this.AdresseBodyTextBox.Multiline = true;
            this.AdresseBodyTextBox.Name = "AdresseBodyTextBox";
            this.AdresseBodyTextBox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.AdresseBodyTextBox.Size = new System.Drawing.Size(800, 500);
            this.AdresseBodyTextBox.TabIndex = 4;
            this.AdresseBodyTextBox.Visible = false;
            // 
            // KommentarBodyTextBox
            // 
            this.KommentarBodyTextBox.Location = new System.Drawing.Point(10, 130);
            this.KommentarBodyTextBox.Multiline = true;
            this.KommentarBodyTextBox.Name = "KommentarBodyTextBox";
            this.KommentarBodyTextBox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.KommentarBodyTextBox.Size = new System.Drawing.Size(800, 500);
            this.KommentarBodyTextBox.TabIndex = 5;
            this.KommentarBodyTextBox.Visible = false;
            // 
            // InstructionLabel
            // 
            this.InstructionLabel.AutoSize = true;
            this.InstructionLabel.Location = new System.Drawing.Point(10, 110);
            this.InstructionLabel.Name = "InstructionLabel";
            this.InstructionLabel.Size = new System.Drawing.Size(68, 13);
            this.InstructionLabel.TabIndex = 6;
            this.InstructionLabel.Text = "E-Mail Inhalt:";
            // 
            // EmailBodyTextBox
            // 
            this.EmailBodyTextBox.Location = new System.Drawing.Point(10, 130);
            this.EmailBodyTextBox.Multiline = true;
            this.EmailBodyTextBox.Name = "EmailBodyTextBox";
            this.EmailBodyTextBox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.EmailBodyTextBox.Size = new System.Drawing.Size(800, 500);
            this.EmailBodyTextBox.TabIndex = 7;
            // 
            // subjectLabel
            // 
            this.subjectLabel.AutoSize = true;
            this.subjectLabel.Location = new System.Drawing.Point(10, 60);
            this.subjectLabel.Name = "subjectLabel";
            this.subjectLabel.Size = new System.Drawing.Size(41, 13);
            this.subjectLabel.TabIndex = 8;
            this.subjectLabel.Text = "Betreff:";
            // 
            // BetreffTextBox
            // 
            this.BetreffTextBox.Location = new System.Drawing.Point(10, 80);
            this.BetreffTextBox.Name = "BetreffTextBox";
            this.BetreffTextBox.Size = new System.Drawing.Size(200, 20);
            this.BetreffTextBox.TabIndex = 9;
            this.BetreffTextBox.DoubleClick += new System.EventHandler(this.BetreffTextBox_DoubleClick);
            // 
            // emailLabel
            // 
            this.emailLabel.AutoSize = true;
            this.emailLabel.Location = new System.Drawing.Point(10, 10);
            this.emailLabel.Name = "emailLabel";
            this.emailLabel.Size = new System.Drawing.Size(80, 13);
            this.emailLabel.TabIndex = 10;
            this.emailLabel.Text = "E-Mail-Adresse:";
            // 
            // EmailBox
            // 
            this.EmailBox.Location = new System.Drawing.Point(10, 30);
            this.EmailBox.Name = "EmailBox";
            this.EmailBox.Size = new System.Drawing.Size(200, 20);
            this.EmailBox.TabIndex = 11;
            // 
            // Email
            // 
            this.ClientSize = new System.Drawing.Size(828, 692);
            this.Controls.Add(this.SendButton);
            this.Controls.Add(this.FirmaBodyTextBox);
            this.Controls.Add(this.TelefonBodyTextBox);
            this.Controls.Add(this.InhaberBodyTextBox);
            this.Controls.Add(this.AdresseBodyTextBox);
            this.Controls.Add(this.KommentarBodyTextBox);
            this.Controls.Add(this.InstructionLabel);
            this.Controls.Add(this.EmailBodyTextBox);
            this.Controls.Add(this.subjectLabel);
            this.Controls.Add(this.BetreffTextBox);
            this.Controls.Add(this.emailLabel);
            this.Controls.Add(this.EmailBox);
            this.Name = "Email";
            this.ResumeLayout(false);
            this.PerformLayout();

        }
        private System.Windows.Forms.Label InstructionLabel;
        private System.Windows.Forms.Label subjectLabel;
        private System.Windows.Forms.Label emailLabel;
        public System.Windows.Forms.TextBox EmailBox;
        public System.Windows.Forms.TextBox BetreffTextBox;
        public System.Windows.Forms.TextBox EmailBodyTextBox;
        public System.Windows.Forms.TextBox FirmaBodyTextBox;
        public System.Windows.Forms.TextBox TelefonBodyTextBox;
        public System.Windows.Forms.TextBox InhaberBodyTextBox;
        public System.Windows.Forms.TextBox AdresseBodyTextBox;
        public System.Windows.Forms.TextBox KommentarBodyTextBox;
        private System.Windows.Forms.Button SendButton;


    }
}