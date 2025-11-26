# Asset Management Guide - Basketdubs

## 📁 Asset Structure

```
frontend/public/assets/
├── teams/              # NBA team logos ✅ COMPLETE
│   ├── atl_logo.png
│   ├── bos_logo.png
│   ├── ... (all 30 teams)
│   └── was_logo.png
├── avatar/              # Base avatar images
│   └── default-avatar.png
├── backgrounds/         # Background images
│   └── default-bg.png
└── items/              # Shop items (equipment)
    ├── head/           # Headbands, hats, crowns
    ├── body/           # Jerseys, hoodies
    ├── shoes/          # Sneakers
    └── accessories/    # Other items
```

## 🎨 Why This Structure?

**`frontend/public/`** - Files here are served directly by Vite
- Accessible at `/assets/...` in the browser
- No bundling or processing
- Perfect for images, fonts, static files

**Example:**
```
File: frontend/public/assets/avatar/default-avatar.png
URL:  http://localhost:5173/assets/avatar/default-avatar.png
```

## 🖼️ Current Assets

### Team Logos ✅ COMPLETE (November 25, 2025)
- **Location:** `frontend/public/assets/teams/`
- **Count:** 30 NBA team logos
- **Format:** PNG with transparent backgrounds
- **Naming:** `{abbreviation}_logo.png` (lowercase)
- **Usage:** 
  - Upcoming game cards (next to team names)
  - Recent game cards (next to scores)
  - Prediction history (matchup display)
- **Features:**
  - Automatic fallback if logo missing
  - Responsive sizing (8x8 for cards, 6x6 for history)
  - Graceful error handling

### Default Avatar
- **Location:** `frontend/public/assets/avatar/default-avatar.png`
- **Purpose:** Base player image (shown when no items equipped)
- **Usage:** Displayed on profile page, leaderboard

### Default Background
- **Location:** `frontend/public/assets/backgrounds/default-bg.png`
- **Purpose:** Default background for avatar display
- **Usage:** Profile page backdrop

## ➕ Adding New Items

### Step 1: Create/Get the Asset

**Recommended formats:**
- **PNG** with transparency (for items that layer)
- **SVG** for scalable graphics (best for icons)
- **JPG** for backgrounds (smaller file size)

**Recommended sizes:**
- Avatar base: 400x400px
- Items (head/body/shoes): 400x400px (to overlay on avatar)
- Backgrounds: 800x600px or larger
- Icons: 64x64px or SVG

### Step 2: Place in Correct Folder

```bash
# Example: Adding a red headband
frontend/public/assets/items/head/headband-red.png

# Example: Adding a Lakers jersey
frontend/public/assets/items/body/jersey-lakers.png

# Example: Adding Jordan 1s
frontend/public/assets/items/shoes/jordan-1-red.png

# Example: Adding a court background
frontend/public/assets/backgrounds/court-outdoor.jpg
```

### Step 3: Add to Database

Run this SQL in Supabase:

```sql
INSERT INTO shop_items (name, category, cost, asset_ref, is_active)
VALUES 
  ('Red Headband', 'head', 15, 'headband-red.png', true),
  ('Lakers Jersey', 'body', 50, 'jersey-lakers.png', true),
  ('Jordan 1 Red', 'shoes', 75, 'jordan-1-red.png', true),
  ('Outdoor Court', 'background', 30, 'court-outdoor.jpg', true);
```

**Important:** `asset_ref` should match the filename!

### Step 4: Reference in Code

The app automatically loads assets using this pattern:

```javascript
// For items
const itemUrl = `/assets/items/${category}/${asset_ref}`

// Example:
// category = 'head'
// asset_ref = 'headband-red.png'
// Result: /assets/items/head/headband-red.png

// For team logos (automatic in TeamLogo component)
<TeamLogo abbreviation="LAL" className="w-8 h-8" />
// Result: /assets/teams/lal_logo.png
```

## 🎭 How Layering Works

The avatar system uses **CSS layering** (not SVG compositing):

```
┌─────────────────────────┐
│   Background Layer      │  ← Furthest back
│  (court, arena, etc)    │
├─────────────────────────┤
│   Avatar Base Layer     │  ← Middle
│  (default-avatar.png)   │
├─────────────────────────┤
│   Items Layer           │  ← On top
│  (jersey, headband,     │
│   shoes stacked)        │
└─────────────────────────┘
```

**CSS Example:**
```css
.avatar-container {
  position: relative;
  width: 400px;
  height: 400px;
}

.background {
  position: absolute;
  z-index: 1;
}

.avatar-base {
  position: absolute;
  z-index: 2;
}

.item-body {
  position: absolute;
  z-index: 3;
}

.item-head {
  position: absolute;
  z-index: 4;
}
```

## 📝 Asset Naming Convention

**Format:** `{item-type}-{variant}.{ext}`

**Examples:**
```
✅ Good:
- headband-red.png
- jersey-lakers.png
- shoes-jordan-1.png
- bg-court-outdoor.jpg

❌ Bad:
- RedHeadband.png (use lowercase)
- lakers jersey.png (no spaces)
- jordan1.png (not descriptive)
```

## 🎨 Creating Assets

### Option 1: Use Existing Images
- Find PNG images with transparent backgrounds
- Resize to 400x400px
- Save in appropriate folder

### Option 2: Create Simple SVGs
```svg
<!-- Example: Simple headband -->
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="100" width="300" height="30" fill="#FF0000" rx="15"/>
</svg>
```

### Option 3: Use AI Generation
- DALL-E, Midjourney, Stable Diffusion
- Prompt: "basketball headband, transparent background, PNG"
- Remove background if needed

### Option 4: Commission Artists
- Fiverr, Upwork for custom sprites
- Provide size requirements (400x400px)
- Request transparent PNGs

## 🔄 Updating Assets

### Replace an Asset
1. Keep the same filename
2. Replace the file in the folder
3. Clear browser cache (Ctrl+Shift+R)
4. No database changes needed!

### Remove an Asset
1. Set `is_active = false` in database (don't delete!)
2. Keep the file (users might still own it)
3. Item won't show in shop but will work for owners

## 📦 Asset Optimization

### Before Adding Assets

**Compress images:**
```bash
# Using ImageMagick
magick convert input.png -quality 85 -strip output.png

# Using online tools
# - TinyPNG.com
# - Squoosh.app
```

**Recommended:**
- PNG: Use PNG-8 if possible (smaller)
- JPG: 85% quality is usually enough
- SVG: Minify with SVGO

### File Size Guidelines
- Avatar/Items: < 100KB each
- Backgrounds: < 500KB each
- Icons: < 20KB each

## 🚀 Production Deployment

**Vercel automatically serves `public/` folder:**
- No special configuration needed
- Assets cached by CDN
- Fast global delivery

**After deployment:**
```
Local:      http://localhost:5173/assets/avatar/default-avatar.png
Production: https://basketdubs.vercel.app/assets/avatar/default-avatar.png
```

## 🎯 Quick Reference

### Adding a New Item (Complete Flow)

1. **Create/get the asset** (400x400px PNG)
2. **Save to folder:**
   ```
   frontend/public/assets/items/{category}/{filename}.png
   ```
3. **Add to database:**
   ```sql
   INSERT INTO shop_items (name, category, cost, asset_ref)
   VALUES ('Cool Item', 'head', 25, 'filename.png');
   ```
4. **Test locally:**
   - Visit shop
   - Item should appear
   - Purchase it
   - Equip on profile

5. **Deploy:**
   ```bash
   git add frontend/public/assets/
   git commit -m "Add new shop items"
   git push
   ```

## 📊 Current Asset Inventory

| Category | Count | Examples |
|----------|-------|----------|
| Team Logos | 30 ✅ | atl_logo.png, bos_logo.png, lal_logo.png |
| Avatar Base | 1 | default-avatar.png |
| Backgrounds | 1 | default-bg.png |
| Head Items | 0 | (add headbands, hats) |
| Body Items | 0 | (add jerseys, hoodies) |
| Shoes | 0 | (add sneakers) |

**Total Assets:** 32  
**Shop Items in DB:** 9 (seed data)  
**Missing Assets:** 9 shop items need images!

## 🎨 Asset TODO List

### High Priority
- [ ] Create/find 3 headband variations
- [ ] Create/find 3 jersey variations
- [ ] Create/find 2 shoe variations

### Medium Priority
- [ ] Add 2 more backgrounds
- [ ] Create item preview thumbnails
- [ ] Add team logo jerseys

### Low Priority
- [ ] Animated items (GIF/APNG)
- [ ] Seasonal items
- [ ] Special effects

## 🏀 Team Logos Implementation

### How It Works

**TeamLogo Component** (`Court.jsx`):
```jsx
function TeamLogo({ abbreviation, className = "w-8 h-8" }) {
  const [imgError, setImgError] = useState(false)
  
  if (imgError) {
    return null // Hide if image fails to load
  }
  
  return (
    <img 
      src={`/assets/teams/${abbreviation.toLowerCase()}_logo.png`}
      alt={`${abbreviation} logo`}
      className={className}
      onError={() => setImgError(true)}
    />
  )
}
```

**Features:**
- Automatic lowercase conversion
- Graceful error handling (hides if missing)
- Customizable sizing via className
- No external API calls needed

**Usage Locations:**
1. **Upcoming Games:** Next to team abbreviation in prediction buttons
2. **Recent Games:** Next to team abbreviation in score displays
3. **Prediction History:** 
   - Matchup display (visitor @ home)
   - "You picked" section
   - "Winner" section

**Backend Support:**
The prediction history endpoint returns team abbreviations:
- `predicted_team_abbr` - Team user picked
- `winner_abbr` - Winning team
- `visitor_abbr` - Visitor team
- `home_abbr` - Home team

## 💡 Tips

1. **Start simple:** Use solid colors or simple shapes
2. **Consistency:** Keep art style consistent
3. **Test layering:** Make sure items don't overlap weirdly
4. **Mobile:** Test on small screens
5. **Performance:** Optimize file sizes
6. **Team logos:** Always use transparent backgrounds for clean display

---

**Need help creating assets?** Check out:
- [Figma](https://figma.com) - Free design tool
- [Canva](https://canva.com) - Easy templates
- [OpenGameArt](https://opengameart.org) - Free game assets
- [Itch.io](https://itch.io/game-assets) - Asset packs

