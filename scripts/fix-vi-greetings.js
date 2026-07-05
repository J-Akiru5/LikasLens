#!/usr/bin/env node
/**
 * Fix Vietnamese greeting diacritics in vi.json files.
 * Chào buổi sáng, / Chào buổi chiều, / Chào buổi tối,
 */
const fs = require("fs");
const path = require("path");

const dirs = [
  "apps/shared/src/i18n/messages",
  "apps/frontend/src/i18n/messages",
];

const fixes = {
  goodMorning: "Chào buổi sáng,",
  goodAfternoon: "Chào buổi chiều,",
  goodEvening: "Chào buổi tối,",
};

for (const dir of dirs) {
  const fp = path.join(dir, "vi.json");
  if (!fs.existsSync(fp)) {
    console.log(`Skipping ${fp} (not found)`);
    continue;
  }
  const d = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!d.dashboard) d.dashboard = {};

  let changed = false;
  for (const [k, v] of Object.entries(fixes)) {
    if (d.dashboard[k] !== v) {
      d.dashboard[k] = v;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(d, null, 2) + "\n", "utf8");
    console.log(`✅ ${fp} updated`);
    console.log(`   goodMorning: ${d.dashboard.goodMorning}`);
    console.log(`   goodAfternoon: ${d.dashboard.goodAfternoon}`);
    console.log(`   goodEvening: ${d.dashboard.goodEvening}`);
  } else {
    console.log(`⏭️  ${fp} already correct`);
  }
}
