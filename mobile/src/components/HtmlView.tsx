import { useState } from 'react';
import { useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';

import { usePaletteFor } from '@/lib/theme';

/**
 * Rend du HTML (description_html) dans une WebView à hauteur automatique,
 * avec un style cohérent avec le thème de l'app. Évite l'affichage brut
 * des balises HTML.
 */
export function HtmlView({ html }: { html: string }) {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const [height, setHeight] = useState(40);

  const doc = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
  * { -webkit-tap-highlight-color: transparent; }
  body {
    margin: 0; padding: 0;
    font-family: -apple-system, system-ui, sans-serif;
    font-size: 15px; line-height: 1.5;
    color: ${C.textSecondary};
    background: transparent;
    word-wrap: break-word;
  }
  a { color: #2563eb; }
  img { max-width: 100%; height: auto; }
  div:empty { min-height: 0.5em; }
</style>
</head>
<body>
<div id="content">${html}</div>
<script>
  function report() {
    var h = document.getElementById('content').scrollHeight;
    window.ReactNativeWebView.postMessage(String(h));
  }
  window.onload = report;
  setTimeout(report, 300);
</script>
</body>
</html>`;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: doc }}
      style={{ height, backgroundColor: 'transparent' }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      onMessage={(e) => {
        const h = Number(e.nativeEvent.data);
        if (h > 0) setHeight(h + 4);
      }}
    />
  );
}
