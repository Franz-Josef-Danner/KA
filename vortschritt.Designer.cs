namespace res_format
{
    partial class vortschritt
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
            this.VortscgritInfo = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // VortscgritInfo
            // 
            this.VortscgritInfo.AutoSize = true;
            this.VortscgritInfo.Location = new System.Drawing.Point(12, 9);
            this.VortscgritInfo.Name = "VortscgritInfo";
            this.VortscgritInfo.Size = new System.Drawing.Size(35, 13);
            this.VortscgritInfo.TabIndex = 0;
            this.VortscgritInfo.Text = "label1";
            // 
            // vortschritt
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(412, 35);
            this.Controls.Add(this.VortscgritInfo);
            this.Name = "vortschritt";
            this.Text = "vortschritt";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        public System.Windows.Forms.Label VortscgritInfo;
    }
}