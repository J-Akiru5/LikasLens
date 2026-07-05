const fs = require("fs");
const path = require("path");

const messagesDir = path.join(__dirname, "../apps/shared/src/i18n/messages");
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith(".json"));

const baseEn = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

for (const file of files) {
  const filePath = path.join(messagesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!data.seo) {
    data.seo = baseEn.seo;
  }
  if (!data.sharedUi) {
    data.sharedUi = {
      switchLanguage: "Switch language"
    };
  } else if (!data.sharedUi.switchLanguage) {
    data.sharedUi.switchLanguage = "Switch language";
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Updated ${file}`);
}
