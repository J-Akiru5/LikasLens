import fs from 'fs';
import path from 'path';
import https from 'https';

const logos = {
  'denr': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Seal_of_the_Department_of_Environment_and_Natural_Resources.svg',
  'dilg': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Department_of_the_Interior_and_Local_Government_%28DILG%29_Seal_-_Logo.svg',
  'dost': 'https://upload.wikimedia.org/wikipedia/commons/9/96/Department_of_Science_and_Technology_%28DOST%29_Seal_-_Logo.svg',
  'pcg': 'https://upload.wikimedia.org/wikipedia/commons/1/18/Philippine_Coast_Guard_%28PCG%29_Seal.svg',
  'coa': 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Commission_on_Audit_%28COA%29_Seal_-_Logo.svg',
  'nbi': 'https://upload.wikimedia.org/wikipedia/commons/5/52/National_Bureau_of_Investigation_%28NBI%29_Seal_-_Logo.svg',
  '7-eleven': 'https://upload.wikimedia.org/wikipedia/commons/4/40/7-eleven_logo.svg',
  'sm': 'https://upload.wikimedia.org/wikipedia/commons/4/42/SM_Supermalls_Logo.svg',
  'jollibee': 'https://upload.wikimedia.org/wikipedia/en/2/2c/Jollibee_logo.svg',
  'globe': 'https://upload.wikimedia.org/wikipedia/commons/2/25/Globe_Telecom_logo.svg'
};

const dir = path.join(process.cwd(), 'apps', 'frontend', 'public', 'logos');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const [name, url] of Object.entries(logos)) {
    const ext = url.endsWith('.svg') ? '.svg' : '.svg';
    const filePath = path.join(dir, `${name}${ext}`);
    try {
      console.log(`Downloading ${name}...`);
      await download(url, filePath);
      console.log(`Successfully downloaded ${name}`);
      // Wait 1 second to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error(`Error downloading ${name}:`, e.message);
    }
  }
}

run();
