// Simple script to ensure all CSS files are properly copied to the dist folder
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const srcContentDir = path.join(rootDir, 'src', 'content');
const distDir = path.join(rootDir, 'dist');

// List of CSS files to ensure are copied
const cssFiles = [
  'high-contrast.css',
  'dyslexic.css',
  'reading-line.css',
  'deuteranopia.css',
  'protanopia.css',
  'tritanopia.css',
  'reduced-motion.css',
  'keyboard-nav.css',
  'large-targets.css',
  'custom-cursor.css',
  'auto-scroll.css',
  'hover-controls.css',
  'focus-mode.css',
  'highlight-links.css',
  'reading-progress.css',
  'image-descriptions.css',
];

console.log('Ensuring all CSS files are properly copied to the dist directory...');

// Make sure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy each CSS file
cssFiles.forEach(filename => {
  const sourcePath = path.join(srcContentDir, filename);
  const destPath = path.join(distDir, filename);
  
  try {
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Successfully copied ${filename} to dist folder`);
    } else {
      console.error(`✗ Source file not found: ${sourcePath}`);
    }
  } catch (error) {
    console.error(`✗ Error copying ${filename}:`, error);
  }
});

console.log('CSS file copy process completed');