#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const SHARED = path.join(__dirname, "../apps/shared/src/i18n/messages");
const LOCALES = ["en", "fil", "vi", "id", "ms", "ta", "th", "km", "my", "lo"];

const extraKeys = {
  timeSeriesChart: { reportsLabel: "Reports", resolvedLabel: "Resolved" },
  violationDonut: { total: "TOTAL" },
};

const trans = {
  fil: { timeSeriesChart: { reportsLabel: "Mga Ulat", resolvedLabel: "Nalutas" }, violationDonut: { total: "KABUUAN" } },
  vi: { timeSeriesChart: { reportsLabel: "Bao cao", resolvedLabel: "Da giai quyet" }, violationDonut: { total: "TONG" } },
  id: { timeSeriesChart: { reportsLabel: "Laporan", resolvedLabel: "Terselesaikan" }, violationDonut: { total: "TOTAL" } },
  ms: { timeSeriesChart: { reportsLabel: "Laporan", resolvedLabel: "Selesai" }, violationDonut: { total: "JUMLAH" } },
  ta: { timeSeriesChart: { reportsLabel: "Arikkaigal", resolvedLabel: "Theerkkapadattapattathu" }, violationDonut: { total: "MOTHTHAM" } },
  th: { timeSeriesChart: { reportsLabel: "Rai-ngan", resolvedLabel: "Kae-lae-laew" }, violationDonut: { total: "RUM" } },
  km: { timeSeriesChart: { reportsLabel: "Raboy kar-nav", resolvedLabel: "Doum solh-srob riab" }, violationDonut: { total: "SOR-BOUN" } },
  my: { timeSeriesChart: { reportsLabel: "A-sin-jone", resolvedLabel: "Phae-yan-phyit-pyi" }, violationDonut: { total: "SAR-SHON-YE" } },
  lo: { timeSeriesChart: { reportsLabel: "Lai-ngan", resolvedLabel: "Kaep-hai-laew" }, violationDonut: { total: "HAPHON" } },
};

LOCALES.forEach((locale) => {
  const fp = path.join(SHARED, locale + ".json");
  const d = JSON.parse(fs.readFileSync(fp, "utf8"));
  let added = 0;
  if (locale === "en") {
    Object.entries(extraKeys).forEach(([ns, keys]) => {
      if (!d[ns]) d[ns] = {};
      Object.entries(keys).forEach(([k, v]) => {
        if (!d[ns][k]) { d[ns][k] = v; added++; }
      });
    });
  } else {
    const t = trans[locale];
    if (!t) { console.log(locale + ": no translations, skipping"); return; }
    Object.entries(t).forEach(([ns, keys]) => {
      if (!d[ns]) d[ns] = {};
      Object.entries(keys).forEach(([k, v]) => {
        if (!d[ns][k]) { d[ns][k] = v; added++; }
      });
    });
  }
  fs.writeFileSync(fp, JSON.stringify(d, null, 2) + "\n");
  console.log(locale + ": +" + added + " keys");
});
console.log("Done");
