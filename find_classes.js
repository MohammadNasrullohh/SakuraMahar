const fs = require('fs');
const code = fs.readFileSync('script.js', 'utf8');
const classRegex = /class(?:Name)?\s*[=:]\s*["'`]?([^"'`>]+)["'`]?/g;
let match;
const classes = new Set();
while ((match = classRegex.exec(code)) !== null) {
  classes.add(match[1]);
}
const catClasses = [...classes].filter(c => c.includes('catalog') || c.includes('tab') || c.includes('filter'));
console.log(catClasses);
