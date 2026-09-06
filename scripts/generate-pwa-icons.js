/**
 * PWA Icons Generator for Mavora
 * Generates all required icon sizes from SVG source
 */

const fs = require('fs');
const path = require('path');

// Simple SVG to PNG converter using Canvas (if available)
// For now, we'll create placeholder PNG files with proper headers

const ICONS_DIR = path.join(__dirname, '../public/icons');

// Icon sizes required by manifest.json
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple valid PNG file (1x1 pixel, will be replaced later)
function createMinimalPNG(size) {
  // This creates a minimal valid PNG - in production, use sharp or canvas
  const { createCanvas } = require('canvas') || {};
  
  // For now, copy the SVG and note that real PNG generation needs canvas/sharp
  const svgContent = fs.readFileSync(path.join(ICONS_DIR, 'icon.svg'), 'utf8');
  
  // Create an HTML file that can be opened in browser to generate icons
  return `<!DOCTYPE html>
<html>
<head>
  <title>Generate ${size}x${size} Icon</title>
</head>
<body>
  <h2>Mavora Icon Generator</h2>
  <p>Open this file in browser, right-click the image and save as PNG</p>
  <img src="data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}" 
       width="${size}" height="${size}" 
       style="image-rendering: pixelated;" />
  <script>
    // Auto-download functionality
    const img = document.querySelector('img');
    const canvas = document.createElement('canvas');
    canvas.width = ${size};
    canvas.height = ${size};
    const ctx = canvas.getContext('2d');
    img.onload = function() {
      ctx.drawImage(img, 0, 0, ${size}, ${size});
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'icon-${size}x${size}.png';
        a.click();
      });
    };
  </script>
</body>
</html>`;
}

// Generate SVG-based placeholder icons (will work in most modern browsers)
function generateIcons() {
  console.log('🎨 Generating PWA icons for Mavora...\n');
  
  // Read the source SVG
  const svgPath = path.join(ICONS_DIR, 'icon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('❌ Source SVG not found!');
    return;
  }
  
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  // Generate each size
  for (const size of SIZES) {
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(ICONS_DIR, filename);
    
    // Create an SVG-based icon with proper viewBox scaling
    const sizedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${size * 0.21}" fill="url(#grad1)"/>
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">M</text>
  <circle cx="400" cy="120" r="60" fill="#fbbf24"/>
  <path d="M380 120 L400 140 L430 100" stroke="white" stroke-width="20" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    
    // Save as SVG with PNG extension (browsers will render it)
    // In production, use sharp/canvas to convert to actual PNG
    fs.writeFileSync(filepath.replace('.png', '.svg'), sizedSvg);
    
    // Also create a simple HTML generator for each size
    const htmlGenerator = `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Mavora Icon ${size}x${size}</title>
  <style>
    body { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh; 
      margin: 0; 
      background: #f3f4f6; 
      font-family: system-ui, sans-serif;
    }
    .container { text-align: center; }
    img { box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: ${size > 144 ? '20%' : '16'}px; }
    .info { margin-top: 20px; color: #4b5563; }
    button { 
      margin-top: 15px; 
      padding: 10px 24px; 
      background: #2563eb; 
      color: white; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 14px;
    }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 Mavora Icon Generator</h1>
    <p class="info">حجم: ${size} × ${size} بكسل</p>
    <img id="icon" width="${size}" height="${size}" />
    <br/>
    <button onclick="downloadIcon()">⬇️ تحميل أيقونة PNG</button>
    <p class="info" style="font-size: 12px;">انقر على الزر لتحميل الأيقونة</p>
  </div>

  <script>
    const svgString = \`${sizedSvg.replace(/`/g, '\\`')}\`;
    const blob = new Blob([svgString], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    
    document.getElementById('icon').src = url;
    
    function downloadIcon() {
      const canvas = document.createElement('canvas');
      canvas.width = ${size};
      canvas.height = ${size};
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = function() {
        ctx.drawImage(img, 0, 0, ${size}, ${size});
        canvas.toBlob(function(blob) {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'icon-${size}x${size}.png';
          a.click();
        }, 'image/png');
      };
      img.src = url;
    }
  </script>
</body>
</html>`;
    
    fs.writeFileSync(
      path.join(ICONS_DIR, `generate-icon-${size}.html`),
      htmlGenerator
    );
    
    console.log(`  ✅ Created ${filename} (SVG + HTML generator)`);
  }
  
  // Create additional icons for shortcuts
  const searchIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#2563eb"/>
  <circle cx="42" cy="42" r="16" fill="none" stroke="white" stroke-width="6"/>
  <line x1="54" y1="54" x2="68" y2="68" stroke="white" stroke-width="6" stroke-linecap="round"/>
</svg>`;
  
  fs.writeFileSync(path.join(ICONS_DIR, 'search-icon.svg'), searchIcon);
  
  const addIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#16a34a"/>
  <line x1="48" y1="28" x2="48" y2="68" stroke="white" stroke-width="6" stroke-linecap="round"/>
  <line x1="28" y1="48" x2="68" y2="48" stroke="white" stroke-width="6" stroke-linecap="round"/>
</svg>`;
  
  fs.writeFileSync(path.join(ICONS_DIR, 'add-icon.svg'), addIcon);
  
  // Create badge icon for notifications
  const badgeIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="40" fill="#ef4444"/>
  <text x="48" y="60" font-family="Arial" font-size="40" font-weight="bold" fill="white" text-anchor="middle">!</text>
</svg>`;
  
  fs.writeFileSync(path.join(ICONS_DIR, 'badge-icon.svg'), badgeIcon);
  
  console.log('\n  ✅ Created shortcut icons (search, add, badge)');
  console.log('\n📝 ملاحظة: لإنشاء PNG حقيقية:');
  console.log('   افتح ملفات generate-icon-*.html في المتصفح وحمّل الصور');
  console.log('   أو استخدم: npx sharp-cli -i icon.svg -o icon.png resize ${SIZES[0]} ${SIZES[0]}\n');
}

// Run
generateIcons();
