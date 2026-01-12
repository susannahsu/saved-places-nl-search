# Build & Test Instructions

## Prerequisites

- Node.js installed
- Chrome browser
- Google Takeout export (optional for testing)

## Build Steps

### 1. Install Dependencies (if not done)

```bash
npm install
```

### 2. Generate Extension Icons

**Option A: Use the icon generator**
```bash
open scripts/generate-icons.html
```
Then download the 3 icons and save to `public/`.

**Option B: Use placeholder icons**
The build will work with the existing `icon-16.png` placeholder. You can replace with proper icons later.

### 3. Build the Extension

```bash
npm run build:extension
```

This creates a `dist/` folder with:
```
dist/
├── index.html              # Side panel UI
├── service-worker.js       # Background worker
├── content-script.js       # Content script
├── content-script.css      # Button styles
├── manifest.json           # Extension manifest
├── icon-*.png             # Icons
└── assets/                # React app bundles
    ├── index-[hash].js
    ├── index-[hash].css
    └── ...
```

### 4. Load in Chrome

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Toggle **"Developer mode"** (top-right)
4. Click **"Load unpacked"**
5. Select the `dist/` folder
6. ✅ Extension loaded!

## Testing

### Test 1: Extension Loads
- [ ] Extension appears in `chrome://extensions/`
- [ ] No errors shown
- [ ] Extension icon appears in toolbar

### Test 2: Content Script Injection
1. Navigate to `https://www.google.com/maps`
2. Look for "Search Saved" button (top-left)
3. Button should have:
   - Search icon
   - "Search Saved" text
   - White background
   - Blue text color

### Test 3: Side Panel Opens
**Method A: Click button**
1. Click "Search Saved" button on Google Maps
2. Side panel should open on the right

**Method B: Click extension icon**
1. Click extension icon in toolbar
2. Side panel should open

### Test 4: File Import
1. Open side panel
2. Drag & drop a Google Takeout JSON file
3. Should see:
   - File name displayed
   - "Embedding X/Y..." progress
   - Success message when complete

### Test 5: Search
1. After importing, type a query: "coffee"
2. Should see:
   - Loading spinner
   - Results appear
   - Match explanations shown
   - Rank badges (1, 2, 3...)

### Test 6: List Filters
1. Search: "in my favorites"
2. Should see:
   - Filtered results
   - "in favorites" shown in results header

### Test 7: Open in Maps
1. Click "Open in Maps" on any result
2. Should:
   - Open Google Maps URL
   - Open in **current tab** (not new tab)
   - Navigate to the place

### Test 8: Empty States
1. Open side panel without importing
2. Should see: "No places imported yet"

3. Import file and search for gibberish
4. Should see: "No results found"

### Test 9: Google Maps Navigation
1. Open side panel on Google Maps
2. Navigate to a different place in Maps (soft reload)
3. Button should remain visible
4. Side panel should remain functional

### Test 10: Permissions
1. Check `chrome://extensions/` → Extension details
2. Permissions should be:
   - ✅ Read and change data on maps.google.com
   - ✅ Display notifications
   - ✅ Store data locally

## Development Workflow

### Make Changes to React App
```bash
# Edit files in src/
npm run dev              # Test locally
npm run build:extension  # Build extension
# Reload extension in chrome://extensions/
```

### Make Changes to Content Script
```bash
# Edit public/content-script.js or .css
npm run build:extension
# Reload extension
# Refresh Google Maps page
```

### Make Changes to Service Worker
```bash
# Edit public/service-worker.js
npm run build:extension
# Reload extension
# Click "service worker" link to see console
```

### Run Tests
```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:ui       # UI mode
```

## Debugging

### Extension Console
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" → Opens console
4. See service worker logs

### Content Script Console
1. Open Google Maps
2. Press F12 (DevTools)
3. Go to Console tab
4. See content script logs

### Side Panel Console
1. Open side panel
2. Right-click in side panel
3. Select "Inspect"
4. DevTools opens for side panel

### Common Issues

**Issue: Extension won't load**
```bash
# Solution: Check manifest.json syntax
cat dist/manifest.json | jq .
```

**Issue: Button not appearing**
```bash
# Solution: Check content script loaded
# In Google Maps console, type:
window.__savedPlacesInjected
# Should return: true
```

**Issue: Side panel blank**
```bash
# Solution: Check for build errors
npm run build:extension
# Look for errors in output
```

**Issue: URLs open in new tab**
```bash
# Solution: Check activeTab permission
# In chrome://extensions/, verify permissions
```

## Performance Benchmarks

Expected performance:
- Extension load: < 100ms
- Side panel open: < 500ms
- File import (1000 places): < 5s
- Embedding generation (1000 places): 30-60s (depends on API)
- Search query: < 500ms
- Result click → Maps open: < 200ms

## Build Verification Checklist

Before considering the build complete:

- [ ] `npm run build:extension` completes without errors
- [ ] `dist/` folder exists with all files
- [ ] `dist/manifest.json` is valid JSON
- [ ] `dist/index.html` exists
- [ ] `dist/service-worker.js` exists
- [ ] `dist/content-script.js` exists
- [ ] `dist/content-script.css` exists
- [ ] `dist/assets/` folder contains JS/CSS bundles
- [ ] Icons exist (or placeholders)
- [ ] Extension loads in Chrome without errors
- [ ] All 10 tests pass

## Next Steps After Testing

1. **Polish UI**
   - Improve icon design
   - Adjust button position
   - Add keyboard shortcuts

2. **Add Features**
   - Settings page
   - Dark mode
   - Search history
   - Favorites

3. **Prepare for Publishing**
   - Create screenshots
   - Write store description
   - Record demo video
   - Submit to Chrome Web Store

---

**Ready to build?** Run `npm run build:extension` and follow the steps above!
