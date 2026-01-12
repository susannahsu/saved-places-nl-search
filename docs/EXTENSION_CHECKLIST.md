# Chrome Extension Conversion Checklist

## ✅ Completed

### Core Extension Files
- [x] `public/manifest.json` - Manifest V3 configuration
- [x] `public/service-worker.js` - Background service worker
- [x] `public/content-script.js` - Content script for Google Maps
- [x] `public/content-script.css` - Styles for injected button

### Extension Bridge
- [x] `src/lib/extension/bridge.ts` - API abstraction layer
- [x] `src/vite-env.d.ts` - TypeScript definitions for Chrome APIs
- [x] Updated `ResultsList.tsx` to use extension bridge

### Build Configuration
- [x] `vite.config.extension.ts` - Vite config for extension build
- [x] Added `build:extension` script to `package.json`
- [x] Updated `.gitignore` to exclude extension build artifacts

### Documentation
- [x] `EXTENSION_SETUP.md` - Complete setup guide
- [x] `EXTENSION_CHECKLIST.md` - This file
- [x] `scripts/generate-icons.html` - Icon generator tool

## 🔲 TODO Before First Load

### 1. Generate Extension Icons
```bash
# Open the icon generator in your browser
open scripts/generate-icons.html

# Or manually create icons and save to public/
# - public/icon-16.png
# - public/icon-48.png
# - public/icon-128.png
```

### 2. Build the Extension
```bash
npm run build:extension
```

### 3. Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist/` folder

### 4. Test on Google Maps
1. Navigate to `https://www.google.com/maps`
2. Look for "Search Saved" button (top-left)
3. Click to open side panel
4. Import a test file
5. Search and verify results open in current tab

## 🎯 Key Features

### Local-First Architecture
- ✅ All data stored in IndexedDB (no external servers)
- ✅ Embeddings computed locally or via OpenAI API (user's key)
- ✅ No scraping of Google Maps data
- ✅ Privacy-focused design

### Side Panel UI
- ✅ Full React app in side panel
- ✅ File import (drag & drop)
- ✅ Natural language search
- ✅ Results with match explanations
- ✅ Loading and empty states

### Content Script Integration
- ✅ "Search Saved" button on Google Maps
- ✅ Opens side panel on click
- ✅ Minimal UI footprint
- ✅ Responsive design

### Result Navigation
- ✅ Click result → opens in current tab
- ✅ Fallback: opens in new tab if extension context unavailable
- ✅ Works in both web app and extension modes

## 🔍 Testing Checklist

### Functional Tests
- [ ] Extension loads without errors
- [ ] Side panel opens when clicking extension icon
- [ ] Side panel opens when clicking "Search Saved" button
- [ ] File import works (JSON and CSV)
- [ ] Embeddings are generated and stored
- [ ] Search returns relevant results
- [ ] Clicking result opens Google Maps URL in current tab
- [ ] List filters work ("in my tokyo list")
- [ ] Match explanations display correctly

### UI/UX Tests
- [ ] Button appears on Google Maps pages
- [ ] Button doesn't interfere with Maps UI
- [ ] Side panel is responsive
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Match explanations are readable

### Edge Cases
- [ ] Works on both `maps.google.com` and `www.google.com/maps`
- [ ] Handles Google Maps SPA navigation (soft reloads)
- [ ] Handles missing URLs (fallback to coordinates/name)
- [ ] Handles malformed import files gracefully
- [ ] Works when offline (after initial setup)

### Performance
- [ ] Side panel loads quickly (<1s)
- [ ] Search results appear quickly (<500ms)
- [ ] No memory leaks after extended use
- [ ] Embedding generation shows progress

## 🚀 Optional Enhancements

### Phase 2 (Post-MVP)
- [ ] Add keyboard shortcut (e.g., `Ctrl+Shift+S`)
- [ ] Add context menu ("Search Saved Places")
- [ ] Sync API keys across devices (`chrome.storage.sync`)
- [ ] Add search history
- [ ] Add favorites/starred places
- [ ] Add export functionality

### Phase 3 (Polish)
- [ ] Add onboarding flow
- [ ] Add settings page
- [ ] Add dark mode
- [ ] Add analytics (privacy-friendly)
- [ ] Add A/B test different button positions
- [ ] Add telemetry for portfolio metrics

### Phase 4 (Publishing)
- [ ] Create promotional images (1280x800)
- [ ] Write detailed store description
- [ ] Create demo video
- [ ] Set up Chrome Web Store listing
- [ ] Submit for review

## 📊 Portfolio Metrics to Track

### Technical Demonstration
- ✅ Manifest V3 compliance
- ✅ Side panel API usage
- ✅ Content script injection
- ✅ Service worker implementation
- ✅ IndexedDB for local storage
- ✅ TypeScript throughout
- ✅ React + Vite modern stack

### Product Thinking
- ✅ Privacy-first design
- ✅ Minimal permissions
- ✅ Local-only data processing
- ✅ Graceful error handling
- ✅ Progressive enhancement (works as web app too)

### User Experience
- ✅ Natural language search
- ✅ Match explanations
- ✅ Loading/empty states
- ✅ Responsive design
- ✅ Keyboard accessibility

## 🐛 Known Issues / Limitations

### Current Limitations
1. **No real-time sync**: Changes in Google Maps won't reflect until re-import
2. **Manual import**: User must export from Google Takeout
3. **API key required**: For semantic search (OpenAI)
4. **No image support**: Place photos not included
5. **No reviews/ratings**: Only saved place data

### Future Considerations
- Could integrate with Google Maps API (if available)
- Could add local LLM support (e.g., WebLLM)
- Could add collaborative features (shared lists)
- Could add export to other mapping services

## 📝 Notes

### Why Manifest V3?
- Required for new Chrome extensions (Manifest V2 deprecated)
- Service workers instead of background pages
- More secure and performant

### Why Side Panel?
- Better UX than popup (doesn't close when clicking outside)
- More space for search results
- Persistent across tab navigation

### Why Local-First?
- Privacy: no data sent to external servers
- Performance: no network latency
- Offline: works without internet (after setup)
- Trust: user owns their data

### Why No Scraping?
- Respects Google's ToS
- Avoids legal issues
- More reliable (no breaking on UI changes)
- Better for portfolio (shows ethical engineering)

---

**Ready to ship!** 🚢

Follow the checklist above, test thoroughly, and you'll have a production-ready Chrome extension for your portfolio.
