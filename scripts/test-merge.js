const fs = require("fs");
const path = require("path");

const messagesDir = path.join(__dirname, "../apps/shared/src/i18n/messages");
const ms = JSON.parse(fs.readFileSync(path.join(messagesDir, "ms.json"), "utf8"));

console.log("Root keys of ms.json:", Object.keys(ms));
console.log("common keys:", Object.keys(ms.common || {}));
console.log("nav keys:", Object.keys(ms.nav || {}));
console.log("landing keys:", Object.keys(ms.landing || {}));
console.log("howItWorks keys:", Object.keys(ms.howItWorks || {}));
