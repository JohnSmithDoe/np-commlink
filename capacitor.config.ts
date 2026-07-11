import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'np.afterwork.commlink',
  appName: 'commlink',
  webDir: 'www/browser',
  server: {
    androidScheme: 'https',
  },
  android: {
    // WebView background; fills the status/navigation bar areas on WebViews
    // older than v140 where Capacitor insets the WebView instead of drawing
    // edge-to-edge. Matches the shadowrun slate base so no white shows.
    backgroundColor: '#ff0f141b',
  },
  plugins: {
    // Android 16 (SDK 36) enforces edge-to-edge. The WebView draws behind the
    // (transparent) system bars; insets are exposed to CSS via env() vars
    // (insetsHandling defaults to 'css'). 'DARK' style = light icons, which
    // read correctly against this app's dark theme.
    SystemBars: {
      style: 'DARK',
    },
  },
};

export default config;
