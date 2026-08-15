import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'np.afterwork.commlink',
  appName: 'np-commlink',
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
    // Native launch splash held until the app decides the theme. launchAutoHide
    // is false so the (branded dark) splash covers the entire webview boot —
    // including the async `settings` read that resolves the theme — and is hidden
    // by SplashService.reveal() (with the 3s fallback) once <html data-theme> is
    // applied. Mirrors the web #app-splash overlay so a boomer user sees no
    // cyberpunk flash on cold start. backgroundColor mirrors --sr-bg (cyberpunk).
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0f141b',
      showSpinner: false,
    },
  },
};

export default config;
