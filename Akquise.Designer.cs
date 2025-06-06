// Akquise.Designer code:
namespace res_format
{
    partial class Akquise
    {
        /// <summary>
        /// Erforderliche Designervariable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Verwendete Ressourcen bereinigen.
        /// </summary>
        /// <param name="disposing">True, wenn verwaltete Ressourcen gelöscht werden sollen; andernfalls False.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Vom Windows Form-Designer generierter Code

        /// <summary>
        /// Erforderliche Methode für die Designerunterstützung.
        /// Der Inhalt der Methode darf nicht mit dem Code-Editor geändert werden.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.ZieAd = new System.Windows.Forms.ListBox();
            this.ProgressBar1 = new System.Windows.Forms.ProgressBar();
            this.Ein = new System.Windows.Forms.Button();
            this.Bea = new System.Windows.Forms.Button();
            this.Ent = new System.Windows.Forms.Button();
            this.Map = new System.Windows.Forms.Button();
            this.contextMenuStrip1 = new System.Windows.Forms.ContextMenuStrip(this.components);
            this.contextMenuStrip2 = new System.Windows.Forms.ContextMenuStrip(this.components);
            this.StaAd = new System.Windows.Forms.RichTextBox();
            this.VErAr = new System.Windows.Forms.Button();
            this.Check = new System.Windows.Forms.Button();
            this.AdGo = new System.Windows.Forms.RichTextBox();
            this.menuStrip1 = new System.Windows.Forms.MenuStrip();
            this.dateiToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.öffnenToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.speichernToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.neuToolStripMenuItem = new System.Windows.Forms.ToolStripMenuItem();
            this.BeschBueh = new System.Windows.Forms.Label();
            this.ResLiEin = new System.Windows.Forms.Label();
            this.GueRes = new System.Windows.Forms.Label();
            this.Filter = new System.Windows.Forms.Panel();
            this.StatusLabel = new System.Windows.Forms.Label();
            this.ReCh = new System.Windows.Forms.Button();
            this.label2 = new System.Windows.Forms.Label();
            this.MinAut = new System.Windows.Forms.NumericUpDown();
            this.ResFilSys = new System.Windows.Forms.Label();
            this.FilSch = new System.Windows.Forms.Button();
            this.Filter.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.MinAut)).BeginInit();
            this.SuspendLayout();
            // 
            // ZieAd
            // 
            this.ZieAd.FormattingEnabled = true;
            this.ZieAd.Location = new System.Drawing.Point(12, 53);
            this.ZieAd.Name = "ZieAd";
            this.ZieAd.SelectionMode = System.Windows.Forms.SelectionMode.MultiExtended;
            this.ZieAd.Size = new System.Drawing.Size(306, 563);
            this.ZieAd.TabIndex = 0;
            this.ZieAd.SelectedIndexChanged += new System.EventHandler(this.ZieAd_SelectedIndexChanged);
            // 
            // ProgressBar1
            // 
            this.ProgressBar1.Location = new System.Drawing.Point(127, 276);
            this.ProgressBar1.Name = "ProgressBar1";
            this.ProgressBar1.Size = new System.Drawing.Size(534, 23);
            this.ProgressBar1.TabIndex = 3;
            this.ProgressBar1.Click += new System.EventHandler(this.ProgressBar1_Click);
            // 
            // Ein
            // 
            this.Ein.Location = new System.Drawing.Point(324, 53);
            this.Ein.Name = "Ein";
            this.Ein.Size = new System.Drawing.Size(75, 23);
            this.Ein.TabIndex = 4;
            this.Ein.Text = "Einfügen";
            this.Ein.UseVisualStyleBackColor = true;
            this.Ein.Click += new System.EventHandler(this.Ein_Click);
            // 
            // Bea
            // 
            this.Bea.Location = new System.Drawing.Point(324, 82);
            this.Bea.Name = "Bea";
            this.Bea.Size = new System.Drawing.Size(75, 23);
            this.Bea.TabIndex = 5;
            this.Bea.Text = "Bearbeiten";
            this.Bea.UseVisualStyleBackColor = true;
            this.Bea.Click += new System.EventHandler(this.Bea_Click);
            // 
            // Ent
            // 
            this.Ent.Location = new System.Drawing.Point(324, 111);
            this.Ent.Name = "Ent";
            this.Ent.Size = new System.Drawing.Size(75, 23);
            this.Ent.TabIndex = 6;
            this.Ent.Text = "Entfernen";
            this.Ent.UseVisualStyleBackColor = true;
            this.Ent.Click += new System.EventHandler(this.Ent_Click);
            // 
            // Map
            // 
            this.Map.Location = new System.Drawing.Point(46, 525);
            this.Map.Name = "Map";
            this.Map.Size = new System.Drawing.Size(75, 23);
            this.Map.TabIndex = 8;
            this.Map.Text = "Zur Liste";
            this.Map.UseVisualStyleBackColor = true;
            this.Map.Click += new System.EventHandler(this.Map_Click);
            // 
            // contextMenuStrip1
            // 
            this.contextMenuStrip1.Name = "contextMenuStrip1";
            this.contextMenuStrip1.Size = new System.Drawing.Size(61, 4);
            // 
            // contextMenuStrip2
            // 
            this.contextMenuStrip2.Name = "contextMenuStrip2";
            this.contextMenuStrip2.Size = new System.Drawing.Size(61, 4);
            // 
            // StaAd
            // 
            this.StaAd.Location = new System.Drawing.Point(127, 42);
            this.StaAd.Name = "StaAd";
            this.StaAd.Size = new System.Drawing.Size(534, 199);
            this.StaAd.TabIndex = 11;
            this.StaAd.Text = "";
            this.StaAd.TextChanged += new System.EventHandler(this.StaAd_TextChanged);
            // 
            // VErAr
            // 
            this.VErAr.Location = new System.Drawing.Point(46, 42);
            this.VErAr.Name = "VErAr";
            this.VErAr.Size = new System.Drawing.Size(75, 23);
            this.VErAr.TabIndex = 13;
            this.VErAr.Text = "Filtern";
            this.VErAr.UseVisualStyleBackColor = true;
            this.VErAr.Click += new System.EventHandler(this.VErAr_Click);
            // 
            // Check
            // 
            this.Check.Location = new System.Drawing.Point(46, 218);
            this.Check.Name = "Check";
            this.Check.Size = new System.Drawing.Size(75, 23);
            this.Check.TabIndex = 16;
            this.Check.Text = "Check";
            this.Check.UseVisualStyleBackColor = true;
            this.Check.Click += new System.EventHandler(this.Check_Click);
            // 
            // AdGo
            // 
            this.AdGo.Location = new System.Drawing.Point(127, 325);
            this.AdGo.Name = "AdGo";
            this.AdGo.Size = new System.Drawing.Size(534, 223);
            this.AdGo.TabIndex = 18;
            this.AdGo.Text = "";
            this.AdGo.TextChanged += new System.EventHandler(this.AdGo_TextChanged);
            // 
            // menuStrip1
            // 
            this.menuStrip1.Location = new System.Drawing.Point(0, 0);
            this.menuStrip1.Name = "menuStrip1";
            this.menuStrip1.Size = new System.Drawing.Size(1131, 24);
            this.menuStrip1.TabIndex = 26;
            // 
            // dateiToolStripMenuItem
            // 
            this.dateiToolStripMenuItem.DropDownItems.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.öffnenToolStripMenuItem,
            this.speichernToolStripMenuItem,
            this.neuToolStripMenuItem});
            this.dateiToolStripMenuItem.Name = "dateiToolStripMenuItem";
            this.dateiToolStripMenuItem.Size = new System.Drawing.Size(46, 20);
            this.dateiToolStripMenuItem.Text = "Datei";
            // 
            // öffnenToolStripMenuItem
            // 
            this.öffnenToolStripMenuItem.Name = "öffnenToolStripMenuItem";
            this.öffnenToolStripMenuItem.Size = new System.Drawing.Size(67, 22);
            // 
            // speichernToolStripMenuItem
            // 
            this.speichernToolStripMenuItem.Name = "speichernToolStripMenuItem";
            this.speichernToolStripMenuItem.Size = new System.Drawing.Size(67, 22);
            // 
            // neuToolStripMenuItem
            // 
            this.neuToolStripMenuItem.Name = "neuToolStripMenuItem";
            this.neuToolStripMenuItem.Size = new System.Drawing.Size(67, 22);
            // 
            // BeschBueh
            // 
            this.BeschBueh.AutoSize = true;
            this.BeschBueh.Location = new System.Drawing.Point(12, 32);
            this.BeschBueh.Name = "BeschBueh";
            this.BeschBueh.Size = new System.Drawing.Size(104, 13);
            this.BeschBueh.TabIndex = 21;
            this.BeschBueh.Text = "Bestehende Bühnen";
            // 
            // ResLiEin
            // 
            this.ResLiEin.AutoSize = true;
            this.ResLiEin.Location = new System.Drawing.Point(124, 18);
            this.ResLiEin.Name = "ResLiEin";
            this.ResLiEin.Size = new System.Drawing.Size(144, 13);
            this.ResLiEin.TabIndex = 22;
            this.ResLiEin.Text = "Restaurant liste hier einfügen";
            // 
            // GueRes
            // 
            this.GueRes.AutoSize = true;
            this.GueRes.Location = new System.Drawing.Point(124, 302);
            this.GueRes.Name = "GueRes";
            this.GueRes.Size = new System.Drawing.Size(95, 13);
            this.GueRes.TabIndex = 23;
            this.GueRes.Text = "Gültige restaurants";
            // 
            // Filter
            // 
            this.Filter.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.Filter.Controls.Add(this.StatusLabel);
            this.Filter.Controls.Add(this.ReCh);
            this.Filter.Controls.Add(this.label2);
            this.Filter.Controls.Add(this.MinAut);
            this.Filter.Controls.Add(this.StaAd);
            this.Filter.Controls.Add(this.ProgressBar1);
            this.Filter.Controls.Add(this.AdGo);
            this.Filter.Controls.Add(this.GueRes);
            this.Filter.Controls.Add(this.ResLiEin);
            this.Filter.Controls.Add(this.VErAr);
            this.Filter.Controls.Add(this.Check);
            this.Filter.Controls.Add(this.Map);
            this.Filter.Location = new System.Drawing.Point(424, 53);
            this.Filter.Name = "Filter";
            this.Filter.Size = new System.Drawing.Size(696, 563);
            this.Filter.TabIndex = 24;
            this.Filter.Paint += new System.Windows.Forms.PaintEventHandler(this.Filter_Paint);
            // 
            // StatusLabel
            // 
            this.StatusLabel.AutoSize = true;
            this.StatusLabel.Location = new System.Drawing.Point(124, 251);
            this.StatusLabel.Name = "StatusLabel";
            this.StatusLabel.Size = new System.Drawing.Size(0, 13);
            this.StatusLabel.TabIndex = 28;
            // 
            // ReCh
            // 
            this.ReCh.Location = new System.Drawing.Point(586, 8);
            this.ReCh.Name = "ReCh";
            this.ReCh.Size = new System.Drawing.Size(75, 23);
            this.ReCh.TabIndex = 27;
            this.ReCh.Text = "Recheck";
            this.ReCh.UseVisualStyleBackColor = true;
            this.ReCh.Click += new System.EventHandler(this.ReCh_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(19, 176);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(102, 13);
            this.label2.TabIndex = 26;
            this.label2.Text = "Autofahrt in Minuten";
            // 
            // MinAut
            // 
            this.MinAut.Location = new System.Drawing.Point(46, 192);
            this.MinAut.Name = "MinAut";
            this.MinAut.Size = new System.Drawing.Size(75, 20);
            this.MinAut.TabIndex = 24;
            this.MinAut.Value = new decimal(new int[] {
            30,
            0,
            0,
            0});
            this.MinAut.ValueChanged += new System.EventHandler(this.MinAut_ValueChanged);
            // 
            // ResFilSys
            // 
            this.ResFilSys.AutoSize = true;
            this.ResFilSys.Location = new System.Drawing.Point(421, 32);
            this.ResFilSys.Name = "ResFilSys";
            this.ResFilSys.Size = new System.Drawing.Size(84, 13);
            this.ResFilSys.TabIndex = 25;
            this.ResFilSys.Text = "Restaurant Filter";
            // 
            // FilSch
            // 
            this.FilSch.Location = new System.Drawing.Point(1044, 631);
            this.FilSch.Name = "FilSch";
            this.FilSch.Size = new System.Drawing.Size(75, 23);
            this.FilSch.TabIndex = 27;
            this.FilSch.Text = "OK";
            this.FilSch.UseVisualStyleBackColor = true;
            this.FilSch.Click += new System.EventHandler(this.FilSch_Click);
            // 
            // Akquise
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1131, 666);
            this.Controls.Add(this.FilSch);
            this.Controls.Add(this.ResFilSys);
            this.Controls.Add(this.Filter);
            this.Controls.Add(this.BeschBueh);
            this.Controls.Add(this.menuStrip1);
            this.Controls.Add(this.Ent);
            this.Controls.Add(this.Bea);
            this.Controls.Add(this.Ein);
            this.Controls.Add(this.ZieAd);
            this.MainMenuStrip = this.menuStrip1;
            this.Name = "Akquise";
            this.Text = "Akquise";
            this.Load += new System.EventHandler(this.Akquise_Load);
            this.Filter.ResumeLayout(false);
            this.Filter.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.MinAut)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion
        private System.Windows.Forms.ProgressBar ProgressBar1;
        private System.Windows.Forms.Button Ein;
        private System.Windows.Forms.Button Bea;
        private System.Windows.Forms.Button Ent;
        private System.Windows.Forms.Button Map;
        private System.Windows.Forms.ContextMenuStrip contextMenuStrip1;
        private System.Windows.Forms.ContextMenuStrip contextMenuStrip2;
        private System.Windows.Forms.RichTextBox StaAd;
        private System.Windows.Forms.Button VErAr;
        private System.Windows.Forms.Button Check;
        private System.Windows.Forms.RichTextBox AdGo;
        private System.Windows.Forms.MenuStrip menuStrip1;
        private System.Windows.Forms.ToolStripMenuItem dateiToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem öffnenToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem speichernToolStripMenuItem;
        private System.Windows.Forms.ToolStripMenuItem neuToolStripMenuItem;
        private System.Windows.Forms.Label BeschBueh;
        private System.Windows.Forms.Label ResLiEin;
        private System.Windows.Forms.Label GueRes;
        private System.Windows.Forms.Panel Filter;
        private System.Windows.Forms.Label ResFilSys;
        private System.Windows.Forms.NumericUpDown MinAut;
        private System.Windows.Forms.Label label2;
        public System.Windows.Forms.ListBox ZieAd;
        private System.Windows.Forms.Button FilSch;
        private System.Windows.Forms.Button ReCh;
        private System.Windows.Forms.Label StatusLabel;
    }

}
