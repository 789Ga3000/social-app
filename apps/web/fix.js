const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('\\`')) {
    content = content.replace(/\\`/g, '\`');
    content = content.replace(/\\\$/g, '\$');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      fixFile(full);
    }
  }
}

walk(dir);
