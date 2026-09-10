// scripts/replace-brand.js
// replace-brand.js – replaces old branding with CEV.PhanTan™
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Replacement patterns – includes trademark everywhere
const REPLACEMENTS = [
  {regex: /CEV.PhanTan™/g, replace: 'CEV.PhanTan™'},
  {regex: /CEV.PhanTan/g, replace: 'CEV.PhanTan'},
  {regex: /CEV.PhanTan/g, replace: 'CEV.PHAN TAN'},
  // domain replacements (lower‑case)
  {regex: /\.CEV.PhanTan\.app/g, replace: '.cev.phtan.app'},
  {regex: /CEV.PhanTan\.com/g, replace: 'cev.phtan.com'},
  {regex: /@CEV.PhanTan\.test/g, replace: '@cev.phtan.test'},
];

// Files to process – all source, config, docs, tests
const PATTERN = '**/*.{ts,tsx,js,jsx,md,html,css,json}';

glob(PATTERN, {ignore: ['node_modules/**', 'dist/**', 'build/**']}, (err, files) => {
  if (err) { console.error(err); process.exit(1); }
  files.forEach(file => {
    const abs = path.resolve(file);
    let content = fs.readFileSync(abs, 'utf8');
    let changed = false;
    REPLACEMENTS.forEach(r => {
      if (r.regex.test(content)) {
        content = content.replace(r.regex, r.replace);
        changed = true;
      }
    });
    if (changed) {
      fs.writeFileSync(abs, content);
      console.log(`Updated ${file}`);
    }
  });
});

