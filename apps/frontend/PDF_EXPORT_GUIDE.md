# PDF Export Feature for LikasLens Dashboard

This guide explains how to use the PDF export functionality for the Analytics & Reports section in the LikasLens dashboard.

## Overview

The PDF export feature allows users to capture the Analytics & Reports section (including charts, incident data, and styling) as a high-quality PDF file. The implementation preserves the Eco-Brutalism dark theme colors and uses A4 page formatting.

## Installation

First, ensure the required dependencies are installed:

```bash
pnpm --filter frontend add jspdf html2canvas
```

### Dependencies

- **jspdf** (^2.5.0): PDF generation library
- **html2canvas** (^1.4.1): HTML to canvas conversion

## Available APIs

### 1. Hook: `usePdfExport`

A React hook for easy integration in components.

**Location:** `src/hooks/usePdfExport.ts`

**Usage:**

```tsx
import { usePdfExport } from "@/hooks/usePdfExport";

export function MyComponent() {
  const { exportRef, handleExportPDF } = usePdfExport();

  const handleClick = async () => {
    await handleExportPDF({
      filename: "my-export.pdf",
      scale: 2,
      quality: 2,
      preserveBackgroundColor: true,
    });
  };

  return (
    <div>
      <button onClick={handleClick}>Export PDF</button>
      <div ref={exportRef}>
        {/* Content to export */}
      </div>
    </div>
  );
}
```

**Options:**

```typescript
interface ExportOptions {
  filename?: string;              // Default: "export.pdf"
  quality?: number;               // Default: 2 (0-1, or 2+ for higher)
  scale?: number;                 // Default: 2 (higher = better quality)
  preserveBackgroundColor?: boolean; // Default: true
}
```

### 2. Utility Function: `exportElementToPdf`

For standalone usage without React hooks.

**Location:** `src/utils/pdf-export.ts`

**Usage:**

```tsx
import { exportElementToPdf } from "@/utils/pdf-export";

async function exportReport() {
  const element = document.getElementById("analytics-section");
  if (!element) return;

  try {
    await exportElementToPdf(element, {
      filename: "analytics-report.pdf",
      preserveBackgroundColor: true,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
    });
  } catch (error) {
    console.error("Export failed:", error);
  }
}
```

**Options:**

```typescript
interface ExportPdfOptions {
  filename?: string;                 // Default: "export.pdf"
  quality?: number;                  // Default: 2
  scale?: number;                    // Default: 2
  preserveBackgroundColor?: boolean;  // Default: true
  margin?: {                          // Default: 10mm all sides
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

### 3. Helper Function: `generateExportFilename`

Creates timestamped filenames for exports.

**Location:** `src/utils/pdf-export.ts`

**Usage:**

```tsx
import { generateExportFilename } from "@/utils/pdf-export";

const filename = generateExportFilename("analytics");
// Result: "analytics_2025-05-15T22-51-35.pdf"
```

## Components

### `AnalyticsExportButton`

Ready-to-use export button component.

**Location:** `src/components/dashboard/analytics-export-button.tsx`

**Usage:**

```tsx
import { AnalyticsExportButton } from "@/components/dashboard/analytics-export-button";

export function MyDashboard() {
  return (
    <div>
      <AnalyticsExportButton
        disabled={false}
        onExportStart={() => console.log("Starting export...")}
        onExportComplete={() => console.log("Export complete!")}
        onExportError={(error) => console.error("Export error:", error)}
      />
    </div>
  );
}
```

### `AnalyticsDashboardWithExport`

Complete example component showing full integration.

**Location:** `src/components/dashboard/analytics-dashboard-export.tsx`

**Features:**
- Export button with loading state
- Error handling and display
- Sample charts and data table
- Timestamp footer

## Best Practices

### 1. **Background Color Preservation**

Always set `preserveBackgroundColor: true` to maintain the Eco-Brutalism dark theme:

```tsx
await handleExportPDF({
  preserveBackgroundColor: true,
  // ... other options
});
```

### 2. **Quality Settings**

For optimal quality with reasonable file size:

```tsx
await handleExportPDF({
  scale: 2,      // 2x upscaling for crisp text
  quality: 2,    // High quality PNG encoding
});
```

### 3. **Loading States**

Always provide user feedback during export:

```tsx
const [isExporting, setIsExporting] = useState(false);

const handleExport = async () => {
  setIsExporting(true);
  try {
    await handleExportPDF({ /* options */ });
  } finally {
    setIsExporting(false);
  }
};
```

### 4. **Error Handling**

Wrap exports in try-catch blocks:

```tsx
try {
  await handleExportPDF({ /* options */ });
} catch (error) {
  console.error("Export failed:", error);
  // Show error to user
}
```

### 5. **Multi-Page Support**

Content longer than one page is automatically split:

```tsx
// This content will be split across multiple A4 pages if needed
<div ref={exportRef}>
  {/* Long content automatically paginated */}
</div>
```

## Integration Example

Here's how to integrate the export feature into the existing Reports page:

```tsx
// apps/frontend/src/app/dashboard/reports/page.tsx
"use client";

import { useRef, useState } from "react";
import { usePdfExport } from "@/hooks/usePdfExport";
import { generateExportFilename } from "@/utils/pdf-export";
import { Download, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const { exportRef, handleExportPDF } = usePdfExport();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await handleExportPDF({
        filename: generateExportFilename("analytics-report"),
        scale: 2,
        quality: 2,
        preserveBackgroundColor: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-accent"
          >
            {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>

          {/* Analytics Content */}
          <div ref={exportRef} className="space-y-8">
            {/* Your analytics content here */}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## Troubleshooting

### PDF appears blank or has incorrect colors

**Solution:** Ensure `preserveBackgroundColor: true` is set in options.

### Text appears blurry

**Solution:** Increase the `scale` option:

```tsx
await handleExportPDF({ scale: 3 }); // Higher scale = better quality
```

### Export is slow

**Solution:** Reduce the scale or disable logging:

```tsx
await handleExportPDF({
  scale: 1.5,  // Lower scale, faster export
});
```

### Images aren't showing in PDF

**Solution:** Ensure all images have proper CORS headers:

```tsx
await handleExportPDF({
  // html2canvas will attempt to load images with CORS
});
```

## Performance Considerations

- **Scale:** Higher scale = better quality but slower processing
- **Quality:** Affects PNG compression (1 = high compression, faster)
- **Content Size:** Larger elements take longer to render
- **Browser Capabilities:** Large PDFs may consume significant memory

## Security Considerations

- PDF export happens entirely in the browser (client-side)
- No data is sent to external servers
- Sensitive information remains on the user's device
- Follow your application's security policies for exported data

## Accessibility

When implementing the export feature:

1. Provide clear button labels
2. Use appropriate ARIA attributes
3. Include loading and error states
4. Consider keyboard navigation
5. Test with screen readers

Example:

```tsx
<button
  onClick={handleExport}
  disabled={isExporting}
  aria-label="Export analytics and reports as PDF"
  title="Export current view as PDF"
>
  {isExporting ? "Exporting..." : "Export PDF"}
</button>
```

## Browser Support

Supported in all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## License & Attribution

- **jsPDF**: Apache-2.0
- **html2canvas**: MIT
- **LikasLens Integration**: Part of LikasLens environmental monitoring platform
