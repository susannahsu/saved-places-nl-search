# Chrome Extension Setup Guide

## Overview

This project can run as both a **local web app** (for development) and a **Chrome Extension** (for production use on Google Maps).

## Architecture

### Extension Components

1. **Side Panel** (`index.html`)
   - Hosts the React app in a Chrome side panel
   - Provides the full search UI
   - Stores data locally in IndexedDB

2. **Service Worker** (`public/service-worker.js`)
   - Handles extension lifecycle events
   - Opens side panel when extension icon is clicked
   - Facilitates communication between content script and side panel

3. **Content Script** (`public/content-script.js`)
   - Runs on `maps.google.com` pages
   - Injects a "Search Saved" button
   - Opens side panel when button is clicked

4. **Extension Bridge** (`src/lib/extension/bridge.ts`)
   - Abstracts Chrome Extension APIs
   - Handles opening Maps URLs in the current tab
   - Provides fallbacks for local development

## Build Instructions

### 1. Build for Extension

```bash
npm run build:extension
```

This creates a `dist/` folder with:
- `index.html` - Side panel UI
- `service-worker.js` - Background service worker
- `content-script.js` - Content script for Google Maps
- `content-script.css` - Styles for injected button
- `manifest.json` - Extension manifest
- `assets/` - Bundled React app and assets

### 2. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The extension should now appear in your extensions list

### 3. Test the Extension

1. Navigate to [Google Maps](https://www.google.com/maps)
2. You should see a **"Search Saved"** button in the top-left corner
3. Click the button to open the side panel
4. Import your Google Takeout file and start searching!

## Permissions Explained

The extension requests minimal permissions:

- **`sidePanel`**: Required to display the side panel UI
- **`storage`**: For storing user preferences (not currently used, but reserved for future use)
- **`activeTab`**: To open Google Maps URLs in the current tab
- **`host_permissions`**: Limited to `maps.google.com` for content script injection

## Privacy & Security

✅ **All data stays local** - No data is sent to external servers
✅ **No tracking** - No analytics or telemetry
✅ **No scraping** - Does not read or modify Google Maps data
✅ **Minimal permissions** - Only requests what's necessary

## Development Workflow

### Local Development (Web App)

```bash
npm run dev
```

- Runs on `http://localhost:5173`
- Hot module reloading
- Full React DevTools support
- Extension APIs are mocked (URLs open in new tabs)

### Extension Development

1. Make changes to the code
2. Run `npm run build:extension`
3. Go to `chrome://extensions/`
4. Click the **reload icon** on your extension
5. Refresh Google Maps to see changes

## File Structure

```
public/
├── manifest.json           # Extension manifest (Manifest V3)
├── service-worker.js       # Background service worker
├── content-script.js       # Content script for Google Maps
├── content-script.css      # Styles for injected button
└── icon-*.png             # Extension icons (16, 48, 128)

src/
├── lib/
│   └── extension/
│       └── bridge.ts       # Extension API bridge
└── components/
    └── ResultsList.tsx     # Updated to use extension bridge

vite.config.extension.ts    # Vite config for extension build
```

## Troubleshooting

### Extension not loading
- Ensure you ran `npm run build:extension` first
- Check that `dist/manifest.json` exists
- Look for errors in `chrome://extensions/` (click "Errors" button)

### Side panel not opening
- Check the service worker console: `chrome://extensions/` → click "service worker"
- Ensure you're on a Google Maps page
- Try clicking the extension icon in the toolbar

### Content script button not appearing
- Refresh the Google Maps page
- Check the page console for errors (F12)
- Verify the extension is enabled

### URLs not opening in current tab
- Check that `activeTab` permission is granted
- Look for errors in the service worker console
- Fallback behavior: URLs open in new tabs

## Next Steps

### Optional Enhancements

1. **Add extension icons**
   - Replace placeholder PNGs in `public/` with actual icons
   - Use a tool like [Icon Generator](https://www.favicon-generator.org/)

2. **Add keyboard shortcuts**
   - Update `manifest.json` with `commands` section
   - Example: `Ctrl+Shift+S` to open side panel

3. **Add context menu**
   - Right-click on Google Maps to open side panel
   - Add `contextMenus` permission

4. **Sync settings across devices**
   - Use `chrome.storage.sync` for API keys
   - Requires `storage` permission (already included)

5. **Add analytics (optional)**
   - Track usage patterns for portfolio metrics
   - Use privacy-friendly approach (no PII)

## Publishing to Chrome Web Store

When ready to publish:

1. Create a [Chrome Web Store developer account](https://chrome.google.com/webstore/devconsole/)
2. Prepare store assets:
   - Screenshots (1280x800 or 640x400)
   - Promotional images
   - Detailed description
3. Zip the `dist/` folder
4. Upload to Chrome Web Store
5. Submit for review

## License

This is a portfolio project. Feel free to use as a reference!
