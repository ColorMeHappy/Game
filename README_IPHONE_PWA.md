# BioCore Defense - iPhone / PWA build

## Installation on iPhone

1. Upload the entire folder to an HTTPS website, for example GitHub Pages, Netlify or Cloudflare Pages.
2. Open `index.html` in Safari on iPhone.
3. Tap Share.
4. Choose Add to Home Screen.
5. Launch BioCore from the new icon.
6. Rotate the iPhone to landscape mode.

The game cannot install as a PWA when opened directly from a ZIP or through a `file://` address. PWA installation and offline caching require HTTPS.

## Included PWA features

- iPhone Home Screen icon.
- Fullscreen standalone mode.
- Landscape orientation prompt.
- iPhone safe-area support.
- Touch-first canvas interaction.
- Offline application shell through Service Worker.
- Local progress storage through browser localStorage.
- Install guide inside the main menu.

## Files required on the server

Do not remove:

- `index.html`
- `styles.css`
- `script.js`
- `pwa.js`
- `service-worker.js`
- `manifest.webmanifest`
- the entire `icons` folder
