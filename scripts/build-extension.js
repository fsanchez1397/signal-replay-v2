const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const buildDir = path.join(__dirname, '..', 'extension', 'dist');

// Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy static files
const staticFiles = [
  'extension/manifest.json',
  'extension/popup.html',
];

staticFiles.forEach(file => {
  const dest = path.join(buildDir, path.basename(file));
  fs.copyFileSync(file, dest);
  console.log(`Copied ${file} to ${dest}`);
});

// Create placeholder icons
const iconsDir = path.join(buildDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Build scripts
Promise.all([
  // Background script
  esbuild.build({
    entryPoints: ['extension/src/background.ts'],
    bundle: true,
    outfile: path.join(buildDir, 'background.js'),
    platform: 'browser',
    target: 'es2020',
    format: 'esm',
  }),

  // Content script
  esbuild.build({
    entryPoints: ['extension/src/content.ts'],
    bundle: true,
    outfile: path.join(buildDir, 'content.js'),
    platform: 'browser',
    target: 'es2020',
  }),

  // Popup script
  esbuild.build({
    entryPoints: ['extension/src/popup/index.tsx'],
    bundle: true,
    outfile: path.join(buildDir, 'popup.js'),
    platform: 'browser',
    target: 'es2020',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css',
    },
    external: ['chrome'],
  }),
])
.then(() => {
  console.log('Extension built successfully!');
  console.log(`Output directory: ${buildDir}`);
})
.catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

