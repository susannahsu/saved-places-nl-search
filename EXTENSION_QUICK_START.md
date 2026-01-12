# Chrome Extension Quick Start 🚀

Get your extension running in **5 minutes**.

## Step 1: Generate Icons

Open the icon generator in your browser:

```bash
open scripts/generate-icons.html
```

Or manually create 3 PNG files:
- `public/icon-16.png` (16×16)
- `public/icon-48.png` (48×48)
- `public/icon-128.png` (128×128)

**Tip:** Use the SVG in `public/icon-48.svg` as a starting point.

## Step 2: Build the Extension

```bash
npm run build:extension
```

This creates a `dist/` folder with all extension files.

## Step 3: Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Toggle **"Developer mode"** (top-right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from this project
5. ✅ Extension is now installed!

## Step 4: Test on Google Maps

1. Navigate to [Google Maps](https://www.google.com/maps)
2. Look for the **"Search Saved"** button (top-left)
3. Click it to open the side panel
4. Import your Google Takeout file
5. Start searching! 🎉

## Troubleshooting

### Button not appearing?
- Refresh the Google Maps page
- Check `chrome://extensions/` for errors
- Verify the extension is enabled

### Side panel not opening?
- Click the extension icon in the toolbar
- Check the service worker console for errors
- Ensure you're on a Google Maps page

### Build failed?
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build:extension
```

## Next Steps

- Read [EXTENSION_SETUP.md](./EXTENSION_SETUP.md) for detailed docs
- Check [EXTENSION_CHECKLIST.md](./EXTENSION_CHECKLIST.md) for testing
- Customize the button position in `content-script.css`

---

**Need help?** Check the full documentation in `EXTENSION_SETUP.md`.
