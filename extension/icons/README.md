# Extension Icons

Place your extension icons in this directory:

- `icon16.png` - 16x16 pixels (toolbar)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Design Guidelines

### Style
- Use a simple, recognizable symbol
- Clear silhouette at small sizes
- Consistent with brand colors
- No text or complex details

### Suggested Icon Concept
- A circular play/record button
- Signal wave symbol
- Automation gear/workflow symbol
- Browser window with recording indicator

### Tools for Creating Icons
- Figma (free, web-based)
- Sketch (Mac only)
- Adobe Illustrator
- Inkscape (free, cross-platform)

### Export Settings
- PNG format
- Transparent background
- Exact dimensions (16, 48, 128)
- Optimized for web

### Placeholder Creation
You can use this Node.js script to create placeholder icons:

```javascript
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Record symbol
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/4, 0, Math.PI * 2);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
}

createIcon(16);
createIcon(48);
createIcon(128);
```

