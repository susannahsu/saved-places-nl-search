# Command Reference

## Setup Commands (Run Once)

```bash
# Navigate to project directory
cd /Users/sususannah/Library/CloudStorage/OneDrive-TheBostonConsultingGroup,Inc/Desktop/repos/personal/saved-places-nl-search

# Install all dependencies
npm install

# This installs:
# - react, react-dom (UI framework)
# - dexie, dexie-react-hooks (IndexedDB)
# - vite, @vitejs/plugin-react (build tool)
# - typescript, @types/* (type safety)
# - tailwindcss, autoprefixer, postcss (styling)
# - eslint (linting)
```

---

## Development Commands (Daily Use)

```bash
# Start development server
npm run dev
# → Opens at http://localhost:3000
# → Hot reload enabled
# → Press Ctrl+C to stop

# Build for production
npm run build
# → Output in dist/ folder
# → Optimized and minified

# Preview production build
npm run preview
# → Test production build locally

# Run linter
npm run lint
# → Check for code issues
```

---

## Git Commands (Version Control)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: UI shell with file import and search"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/savedplaces-nl-search.git
git branch -M main
git push -u origin main
```

---

## Useful Development Commands

```bash
# Check if port 3000 is in use (Mac/Linux)
lsof -ti:3000

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Clear npm cache (if install fails)
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit

# Format code (if prettier installed)
npx prettier --write "src/**/*.{ts,tsx}"
```

---

## Chrome DevTools Commands

```javascript
// Open browser console (F12) and run:

// View database
indexedDB.databases()

// Open database
const db = await window.indexedDB.open('savedplaces-db')

// Count places
const tx = db.transaction('places', 'readonly')
const store = tx.objectStore('places')
const count = await store.count()
console.log('Total places:', count.result)

// Get all places
const places = await store.getAll()
console.log('Places:', places.result)
```

---

## Testing the App

### 1. Start the app
```bash
npm run dev
```

### 2. Open browser
Navigate to `http://localhost:3000`

### 3. Test file import
1. Drag and drop a test JSON file
2. Or click "Browse Files" and select file
3. Check debug panel for import count

### 4. Test search
1. Type a query in search box
2. Click "Search" or press Enter
3. Results should appear
4. Click "Open in Maps" to test URL generation

### 5. Test clear data
1. Click "Clear All Data"
2. Confirm dialog
3. Check that counts reset to 0

---

## Sample Test Data

Create a test file `test-places.json`:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4194, 37.7749]
      },
      "properties": {
        "name": "Blue Bottle Coffee",
        "address": "66 Mint St, San Francisco, CA 94103",
        "Comment": "Best pour-over in the city!",
        "Google Maps URL": "https://maps.google.com/?cid=123456789"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-122.4083, 37.7833]
      },
      "properties": {
        "name": "Tartine Bakery",
        "address": "600 Guerrero St, San Francisco, CA 94110",
        "Comment": "Amazing sourdough and pastries",
        "Google Maps URL": "https://maps.google.com/?cid=987654321"
      }
    }
  ]
}
```

---

## Troubleshooting Commands

### Problem: npm install fails

```bash
# Solution 1: Clear cache
npm cache clean --force
npm install

# Solution 2: Delete and reinstall
rm -rf node_modules package-lock.json
npm install

# Solution 3: Use different registry
npm install --registry=https://registry.npmjs.org/
```

### Problem: Port already in use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.ts
```

### Problem: TypeScript errors

```bash
# Check all errors
npx tsc --noEmit

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Problem: Styles not loading

```bash
# Rebuild Tailwind
npx tailwindcss -i ./src/index.css -o ./dist/output.css

# Or restart dev server
# Ctrl+C, then npm run dev
```

---

## Production Deployment

### Build for static hosting

```bash
# Build
npm run build

# Output is in dist/
# Upload dist/ to:
# - Netlify
# - Vercel
# - GitHub Pages
# - Any static host
```

### Deploy to Netlify (example)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

---

## Next Phase Commands

### Phase 2: Add Transformers.js

```bash
# Install ML library
npm install @xenova/transformers

# Create embedding service
touch src/services/embedding.ts

# Create search service
touch src/services/search.ts

# Create Web Worker
touch src/workers/ml-worker.ts
```

### Phase 3: Chrome Extension

```bash
# Install CRXJS plugin
npm install -D @crxjs/vite-plugin @types/chrome

# Create manifest
touch manifest.json

# Create background script
touch src/background.ts

# Create content script
touch src/content.ts
```

---

## Useful Aliases (Optional)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick navigate
alias cdsp="cd /Users/sususannah/Library/CloudStorage/OneDrive-TheBostonConsultingGroup,Inc/Desktop/repos/personal/saved-places-nl-search"

# Quick dev
alias spdev="cdsp && npm run dev"

# Quick build
alias spbuild="cdsp && npm run build"
```

Then reload:
```bash
source ~/.zshrc  # or ~/.bashrc
```

Now you can just type `spdev` from anywhere!
