const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Lou/Desktop/BestProject/LikasLens AI Environmental Detection Monorepo/apps/mobile-pwa/src/app/[locale]/(app)';

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (file === 'page.tsx') {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const regex = /<h1 className="[^"]*tracking-widest uppercase[^"]*">\s*([^<]+)\s*<\/h1>/g;
  if (regex.test(content)) {
    const newContent = content.replace(regex, '<h1 className="ios-large-title ios-large-title--xl">$1</h1>');
    fs.writeFileSync(file, newContent);
    console.log(`Fixed ${file}`);
  }
});
