#!/usr/bin/env node

/**
 * Helper script to update the production API URL in config.js
 * Usage: node update-api-url.js https://your-app.onrender.com
 */

const fs = require('fs');
const path = require('path');

// Get the URL from command line argument
const newUrl = process.argv[2];

if (!newUrl) {
  console.error('❌ Error: Please provide your Render backend URL');
  console.log('\nUsage:');
  console.log('  node update-api-url.js https://your-app-name.onrender.com');
  console.log('\nExample:');
  console.log('  node update-api-url.js https://notification-orchestrator.onrender.com');
  process.exit(1);
}

// Validate URL
if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
  console.error('❌ Error: URL must start with http:// or https://');
  process.exit(1);
}

// Remove trailing slash if present
const cleanUrl = newUrl.replace(/\/$/, '');

// Path to config.js
const configPath = path.join(__dirname, 'public', 'js', 'config.js');

// Check if file exists
if (!fs.existsSync(configPath)) {
  console.error('❌ Error: config.js not found at:', configPath);
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(configPath, 'utf8');

// Replace the URL
const oldPattern = /const PRODUCTION_API_URL = ['"]https:\/\/YOUR-RENDER-APP-NAME\.onrender\.com\/api['"];/;
const newLine = `const PRODUCTION_API_URL = '${cleanUrl}/api';`;

if (content.match(oldPattern)) {
  content = content.replace(oldPattern, newLine);
  console.log('✅ Updated placeholder URL');
} else {
  // Try to replace any existing URL
  const existingPattern = /const PRODUCTION_API_URL = ['"].*['"];/;
  if (content.match(existingPattern)) {
    content = content.replace(existingPattern, newLine);
    console.log('✅ Updated existing URL');
  } else {
    console.error('❌ Error: Could not find PRODUCTION_API_URL in config.js');
    process.exit(1);
  }
}

// Write the file back
fs.writeFileSync(configPath, content, 'utf8');

console.log('\n✅ Success! API URL updated to:', `${cleanUrl}/api`);
console.log('\n📝 Next steps:');
console.log('  1. Review the changes: git diff public/js/config.js');
console.log('  2. Commit: git add public/js/config.js && git commit -m "Update production API URL"');
console.log('  3. Push: git push');
console.log('  4. Deploy to Netlify');
console.log('\n🚀 Your frontend will now connect to:', cleanUrl);
