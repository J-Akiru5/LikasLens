# PDF Export Feature - Quick Reference Card

## 🎯 One-Minute Setup

### Install
```bash
pnpm --filter frontend add jspdf html2canvas
```

### Use in Component
```tsx
import { usePdfExport } from "@/hooks/usePdfExport";

const { exportRef, handleExportPDF } = usePdfExport();

// Attach ref to content
<div ref={exportRef}>Your Analytics</div>

// Call on button click
onClick={() => handleExportPDF({ filename: "report.pdf" })}
```

---

## 📦 What's Included

| File | Purpose |
|------|---------|
| `src/hooks/usePdfExport.ts` | Main React hook |
| `src/utils/pdf-export.ts` | Utility functions |
| `src/lib/pdf-export-types.ts` | TypeScript types |
| `src/lib/pdf-export-config.ts` | Presets & configs |
| `src/components/dashboard/analytics-export-button.tsx` | Button component |
| `src/components/dashboard/analytics-dashboard-export.tsx` | Example component |

---

## 🚀 API Overview

### `usePdfExport()`
```tsx
const { exportRef, handleExportPDF } = usePdfExport();

// Options
await handleExportPDF({
  filename: "report.pdf",           // Optional
  scale: 2,                         // Resolution (default: 2)
  quality: 2,                       // Compression (default: 2)
  preserveBackgroundColor: true,    // Keep dark theme (default: true)
});
```

### `exportElementToPdf()`
```tsx
import { exportElementToPdf } from "@/utils/pdf-export";

await exportElementToPdf(element, {
  filename: "report.pdf",
  margin: { top: 10, right: 10, bottom: 10, left: 10 },
});
```

### `generateExportFilename()`
```tsx
import { generateExportFilename } from "@/utils/pdf-export";

const filename = generateExportFilename("analytics");
// Result: "analytics_2026-05-15T22-51-35.pdf"
```

---

## ⚡ Presets

### Built-in Presets
```tsx
import { EXPORT_PRESETS } from "@/lib/pdf-export-config";

EXPORT_PRESETS.PRINT_QUALITY    // Highest quality (scale: 3)
EXPORT_PRESETS.BALANCED          // Default (scale: 2)
EXPORT_PRESETS.FAST              // Reduced size (scale: 1.5)
EXPORT_PRESETS.WEB_OPTIMIZED     // Small file (scale: 1)
EXPORT_PRESETS.ECO_BRUTALISM     // Dark theme (scale: 2)
```

### LikasLens Configs
```tsx
import { LIKASLENS_EXPORT_CONFIGS } from "@/lib/pdf-export-config";

LIKASLENS_EXPORT_CONFIGS.ANALYTICS_REPORT
LIKASLENS_EXPORT_CONFIGS.INCIDENT_DATA
LIKASLENS_EXPORT_CONFIGS.MONITORING_DASHBOARD
LIKASLENS_EXPORT_CONFIGS.EVIDENCE_DOCUMENT
LIKASLENS_EXPORT_CONFIGS.PUBLIC_SCOREBOARD
```

---

## 💡 Common Patterns

### Simple Button
```tsx
<button onClick={() => handleExportPDF()}>
  Export PDF
</button>
```

### With Loading State
```tsx
const [loading, setLoading] = useState(false);

const handleExport = async () => {
  setLoading(true);
  try {
    await handleExportPDF({ filename: "report.pdf" });
  } finally {
    setLoading(false);
  }
};
```

### With Error Handling
```tsx
try {
  await handleExportPDF({ filename: "report.pdf" });
} catch (error) {
  console.error("Export failed:", error);
}
```

### Using Preset
```tsx
await handleExportPDF(EXPORT_PRESETS.PRINT_QUALITY);
```

### Custom Filename
```tsx
const filename = generateExportFilename("analytics");
await handleExportPDF({ filename });
```

---

## 🎨 Configuration Matrix

| Use Case | Preset | Scale | Quality | Time |
|----------|--------|-------|---------|------|
| Print/Archive | PRINT_QUALITY | 3 | 2 | 8-12s |
| General Use | BALANCED | 2 | 2 | 4-6s ⭐ |
| Quick Share | FAST | 1.5 | 1 | 2-3s |
| Email | WEB_OPTIMIZED | 1 | 0.8 | 1-2s |
| Dark Theme | ECO_BRUTALISM | 2 | 2 | 4-6s ⭐ |

---

## ✅ Checklist

- [ ] Dependencies installed: `pnpm --filter frontend add jspdf html2canvas`
- [ ] Hook imported: `import { usePdfExport } from "@/hooks/usePdfExport"`
- [ ] Ref attached: `ref={exportRef}`
- [ ] Handler called: `onClick={() => handleExportPDF({...})}`
- [ ] Testing complete: File downloads successfully
- [ ] Dark theme preserved: Colors look correct in PDF
- [ ] Error handling added: Try-catch or error state

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank PDF | Add `preserveBackgroundColor: true` |
| Blurry text | Increase `scale` to 2.5 or 3 |
| Slow export | Use `EXPORT_PRESETS.FAST` |
| Missing colors | Check CSS, use solid colors |
| Export fails | Check console for errors |

---

## 📚 Documentation

- **README_PDF_EXPORT.md** - Complete guide
- **PDF_EXPORT_GUIDE.md** - Technical reference
- **IMPLEMENTATION_EXAMPLES.md** - Code examples
- **DELIVERABLES.md** - Feature overview

---

## 🔗 Quick Links

### Files
- Hook: `src/hooks/usePdfExport.ts`
- Utils: `src/utils/pdf-export.ts`
- Types: `src/lib/pdf-export-types.ts`
- Config: `src/lib/pdf-export-config.ts`

### Components
- Button: `src/components/dashboard/analytics-export-button.tsx`
- Example: `src/components/dashboard/analytics-dashboard-export.tsx`

### Docs
- Main: `README_PDF_EXPORT.md`
- API: `PDF_EXPORT_GUIDE.md`
- Examples: `IMPLEMENTATION_EXAMPLES.md`
- Overview: `DELIVERABLES.md`

---

## 🌟 Pro Tips

1. **Always use timestamped filenames**
   ```tsx
   const filename = generateExportFilename("analytics");
   ```

2. **Preserve dark theme by default**
   ```tsx
   preserveBackgroundColor: true  // Always keep this enabled
   ```

3. **Use presets instead of manual config**
   ```tsx
   // ✅ Better
   await handleExportPDF(EXPORT_PRESETS.BALANCED);
   
   // ❌ Less maintainable
   await handleExportPDF({ scale: 2, quality: 2 });
   ```

4. **Provide loading feedback**
   ```tsx
   {loading ? "Exporting..." : "Export PDF"}
   ```

5. **Validate before export** (large content)
   ```tsx
   const { isValid, warnings } = validateExportContent(element);
   ```

---

## 📞 Support

1. Check README_PDF_EXPORT.md for quick answers
2. Review IMPLEMENTATION_EXAMPLES.md for code patterns
3. See PDF_EXPORT_GUIDE.md for detailed API docs
4. Check console for error messages

---

**Version:** 1.0  
**Status:** Production Ready ✅  
**Last Updated:** 2026-05-15
