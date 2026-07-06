# Plateful Camera Coach

Plateful is a browser-based MVP for a food photography coach. It opens to a live camera surface, shows shot-style overlays, reads basic image quality signals, and gives one concise adjustment at a time.

## Included

- Shot modes: flat lay, 45 deg, macro, drink, and table spread
- Live guide overlays tailored to each mode
- Rule-based readings for light, sharpness, color cast, contrast, and likely subject position
- Capture and review sheet with download/share actions
- PWA manifest and service worker
- No-camera demo state for desktop preview

## Local Preview

Run the hosted app package with:

```text
npm run dev
```

Camera access works on secure browser origins. Localhost is secure on this computer. For Pixel testing from the phone itself, deploy the app to HTTPS or wrap it as a native Android app, because Chrome on Android blocks camera access from ordinary `http://` LAN URLs.
