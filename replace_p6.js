const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./apps/admin-portal/src/app/[locale]/(dashboard)');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('p-6')) {
    // Only replace p-6 if it's not already sm:p-6 and it's inside className or similar.
    // A simpler regex: replace ' p-6 ' or '"p-6 ' with ' p-4 sm:p-6 '
    // We can just use string replacements on common patterns
    let newContent = content
      .replace(/ p-6 /g, ' p-4 sm:p-6 ')
      .replace(/ p-6"/g, ' p-4 sm:p-6"')
      .replace(/"p-6 /g, '"p-4 sm:p-6 ')
      .replace(/ p-6'/g, " p-4 sm:p-6'")
      .replace(/'p-6 /g, "'p-4 sm:p-6 ")
      .replace(/ p-6\b(?! sm:)/g, " p-4 sm:p-6")
      .replace(/\bp-6\b/g, "p-4 sm:p-6")
      // Clean up if we double replaced
      .replace(/p-4 sm:p-4 sm:p-6/g, "p-4 sm:p-6")
      .replace(/p-4 sm:p-6 sm:p-6/g, "p-4 sm:p-6")
      .replace(/sm:p-4 sm:p-6/g, "sm:p-6");
      
    if (content !== newContent) {
      fs.writeFileSync(file, newContent);
      console.log('Updated ' + file);
    }
  }
});
