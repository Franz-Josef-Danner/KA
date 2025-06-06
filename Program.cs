using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;


namespace res_format
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            SetWebBrowserEmulationMode();
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new Liste());
        }

        private static void SetWebBrowserEmulationMode()
        {
            var appName = System.IO.Path.GetFileName(System.Diagnostics.Process.GetCurrentProcess().MainModule.FileName);
            SetIEVersion(11000, appName); // Use 11000 for IE 11, 10000 for IE 10, etc.
        }

        private static void SetIEVersion(int ieVersion, string appName)
        {
            try
            {
                using (var key = Registry.CurrentUser.CreateSubKey($@"Software\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION"))
                {
                    key?.SetValue(appName, ieVersion, RegistryValueKind.DWord);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to set browser emulation mode: {ex.Message}");
            }
        }
    }
}
