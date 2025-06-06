using System;
using System.Drawing;
using System.Windows.Forms;

namespace res_format
{
    partial class TeleTermin
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
            this.CancelButton = new System.Windows.Forms.Button();
            this.AnrufOkButton = new System.Windows.Forms.Button();
            this.telefonlabel = new System.Windows.Forms.Label();
            this.TelefonBox = new System.Windows.Forms.TextBox();
            this.firmaLabel = new System.Windows.Forms.Label();
            this.FirmaBox = new System.Windows.Forms.TextBox();
            this.datumLabel = new System.Windows.Forms.Label();
            this.TerminPicker = new System.Windows.Forms.DateTimePicker();
            this.uhrzeitLabel = new System.Windows.Forms.Label();
            this.AnrufZeitBox = new System.Windows.Forms.TextBox();
            this.kommentarLabel = new System.Windows.Forms.Label();
            this.KommentarBox = new System.Windows.Forms.TextBox();
            this.AnrufTerminBox = new System.Windows.Forms.TextBox();
            this.SuspendLayout();
            // 
            // CancelButton
            // 
            this.CancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.CancelButton.Location = new System.Drawing.Point(120, 340);
            this.CancelButton.Name = "CancelButton";
            this.CancelButton.Size = new System.Drawing.Size(100, 23);
            this.CancelButton.TabIndex = 11;
            this.CancelButton.Text = "Abbrechen";
            // 
            // AnrufOkButton
            // 
            this.AnrufOkButton.DialogResult = System.Windows.Forms.DialogResult.OK;
            this.AnrufOkButton.Location = new System.Drawing.Point(10, 340);
            this.AnrufOkButton.Name = "AnrufOkButton";
            this.AnrufOkButton.Size = new System.Drawing.Size(100, 23);
            this.AnrufOkButton.TabIndex = 11;
            this.AnrufOkButton.Text = "OK";
            this.AnrufOkButton.Click += new System.EventHandler(this.AnrufOkButton_Click);
            // 
            // telefonlabel
            // 
            this.telefonlabel.AutoSize = true;
            this.telefonlabel.Location = new System.Drawing.Point(10, 10);
            this.telefonlabel.Name = "telefonlabel";
            this.telefonlabel.Size = new System.Drawing.Size(83, 13);
            this.telefonlabel.TabIndex = 0;
            this.telefonlabel.Text = "Telefonnummer:";
            // 
            // TelefonBox
            // 
            this.TelefonBox.Location = new System.Drawing.Point(10, 30);
            this.TelefonBox.Name = "TelefonBox";
            this.TelefonBox.Size = new System.Drawing.Size(200, 20);
            this.TelefonBox.TabIndex = 1;
            // 
            // firmaLabel
            // 
            this.firmaLabel.AutoSize = true;
            this.firmaLabel.Location = new System.Drawing.Point(10, 60);
            this.firmaLabel.Name = "firmaLabel";
            this.firmaLabel.Size = new System.Drawing.Size(35, 13);
            this.firmaLabel.TabIndex = 2;
            this.firmaLabel.Text = "Firma:";
            // 
            // FirmaBox
            // 
            this.FirmaBox.Location = new System.Drawing.Point(10, 80);
            this.FirmaBox.Name = "FirmaBox";
            this.FirmaBox.Size = new System.Drawing.Size(200, 20);
            this.FirmaBox.TabIndex = 3;
            // 
            // datumLabel
            // 
            this.datumLabel.AutoSize = true;
            this.datumLabel.Location = new System.Drawing.Point(10, 110);
            this.datumLabel.Name = "datumLabel";
            this.datumLabel.Size = new System.Drawing.Size(41, 13);
            this.datumLabel.TabIndex = 4;
            this.datumLabel.Text = "Datum:";
            // 
            // TerminPicker
            // 
            this.TerminPicker.Format = System.Windows.Forms.DateTimePickerFormat.Short;
            this.TerminPicker.Location = new System.Drawing.Point(10, 130);
            this.TerminPicker.Name = "TerminPicker";
            this.TerminPicker.Size = new System.Drawing.Size(200, 20);
            this.TerminPicker.TabIndex = 5;
            // 
            // uhrzeitLabel
            // 
            this.uhrzeitLabel.AutoSize = true;
            this.uhrzeitLabel.Location = new System.Drawing.Point(10, 160);
            this.uhrzeitLabel.Name = "uhrzeitLabel";
            this.uhrzeitLabel.Size = new System.Drawing.Size(43, 13);
            this.uhrzeitLabel.TabIndex = 6;
            this.uhrzeitLabel.Text = "Uhrzeit:";
            // 
            // AnrufZeitBox
            // 
            this.AnrufZeitBox.Location = new System.Drawing.Point(10, 180);
            this.AnrufZeitBox.Name = "AnrufZeitBox";
            this.AnrufZeitBox.Size = new System.Drawing.Size(200, 20);
            this.AnrufZeitBox.TabIndex = 10;
            this.AnrufZeitBox.TextChanged += new System.EventHandler(this.AnrufZeitBox_TextChanged);
            // 
            // kommentarLabel
            // 
            this.kommentarLabel.AutoSize = true;
            this.kommentarLabel.Location = new System.Drawing.Point(10, 210);
            this.kommentarLabel.Name = "kommentarLabel";
            this.kommentarLabel.Size = new System.Drawing.Size(63, 13);
            this.kommentarLabel.TabIndex = 8;
            this.kommentarLabel.Text = "Kommentar:";
            // 
            // KommentarBox
            // 
            this.KommentarBox.Location = new System.Drawing.Point(10, 230);
            this.KommentarBox.Multiline = true;
            this.KommentarBox.Name = "KommentarBox";
            this.KommentarBox.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
            this.KommentarBox.Size = new System.Drawing.Size(200, 100);
            this.KommentarBox.TabIndex = 9;
            // 
            // AnrufTerminBox
            // 
            this.AnrufTerminBox.Location = new System.Drawing.Point(10, 370);
            this.AnrufTerminBox.Multiline = true;
            this.AnrufTerminBox.Name = "AnrufTerminBox";
            this.AnrufTerminBox.Size = new System.Drawing.Size(200, 20);
            this.AnrufTerminBox.TabIndex = 12;
            this.AnrufTerminBox.Visible = false;
            // 
            // TeleTermin
            // 
            this.ClientSize = new System.Drawing.Size(240, 369);
            this.Controls.Add(this.telefonlabel);
            this.Controls.Add(this.TelefonBox);
            this.Controls.Add(this.firmaLabel);
            this.Controls.Add(this.FirmaBox);
            this.Controls.Add(this.datumLabel);
            this.Controls.Add(this.TerminPicker);
            this.Controls.Add(this.uhrzeitLabel);
            this.Controls.Add(this.AnrufZeitBox);
            this.Controls.Add(this.kommentarLabel);
            this.Controls.Add(this.KommentarBox);
            this.Controls.Add(this.AnrufOkButton);
            this.Controls.Add(this.CancelButton);
            this.Controls.Add(this.AnrufTerminBox);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "TeleTermin";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Anruf vereinbaren";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        //
        // Telefonnummer
        //
        private System.Windows.Forms.Label telefonlabel;
        public System.Windows.Forms.TextBox TelefonBox;
        private System.Windows.Forms.Label firmaLabel;
        public System.Windows.Forms.TextBox FirmaBox;
        public System.Windows.Forms.Button AnrufOkButton;
        public new System.Windows.Forms.Button CancelButton;
        private System.Windows.Forms.Label kommentarLabel;
        public System.Windows.Forms.TextBox KommentarBox;
        private System.Windows.Forms.Label uhrzeitLabel;
        private System.Windows.Forms.Label datumLabel;
        private System.Windows.Forms.TextBox AnrufTerminBox;

        #endregion

        public TextBox AnrufZeitBox;
        public DateTimePicker TerminPicker;
    }
}
