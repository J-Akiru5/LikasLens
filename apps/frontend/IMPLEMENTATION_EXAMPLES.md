# PDF Export Implementation Guide - LikasLens Dashboard

## Quick Start

### 1. Install Dependencies

```bash
pnpm --filter frontend add jspdf html2canvas
```

### 2. Basic Usage with Hook

```tsx
import { usePdfExport } from "@/hooks/usePdfExport";
import { Download } from "lucide-react";

export function MyDashboard() {
  const { exportRef, handleExportPDF } = usePdfExport();

  return (
    <div>
      <button onClick={() => handleExportPDF({ filename: "report.pdf" })}>
        <Download size={18} /> Export PDF
      </button>
      <div ref={exportRef}>
        {/* Content to export */}
      </div>
    </div>
  );
}
```

## Complete Implementation Examples

### Example 1: Simple Analytics Export

```tsx
"use client";

import { usePdfExport } from "@/hooks/usePdfExport";
import { Download } from "lucide-react";
import { useState } from "react";

export function SimpleAnalyticsExport() {
  const { exportRef, handleExportPDF } = usePdfExport();
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await handleExportPDF({
        filename: "analytics-report.pdf",
        preserveBackgroundColor: true,
        scale: 2,
        quality: 2,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-background rounded disabled:opacity-50"
      >
        <Download size={18} />
        {isLoading ? "Exporting..." : "Export PDF"}
      </button>

      <div ref={exportRef} className="bg-background p-6 rounded border border-secondary/20">
        <h2 className="text-2xl font-bold text-foreground mb-4">Analytics Report</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary/10 rounded">
            <div className="text-3xl font-bold text-primary">42</div>
            <div className="text-sm text-foreground/60">Total Incidents</div>
          </div>
          <div className="p-4 bg-secondary/10 rounded">
            <div className="text-3xl font-bold text-secondary">87%</div>
            <div className="text-sm text-foreground/60">Resolution Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Example 2: Advanced Export with Loading State and Error Handling

```tsx
"use client";

import { usePdfExport } from "@/hooks/usePdfExport";
import { generateExportFilename } from "@/utils/pdf-export";
import { Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

type ExportState = "idle" | "loading" | "success" | "error";

export function AdvancedAnalyticsExport() {
  const { exportRef, handleExportPDF } = usePdfExport();
  const [state, setState] = useState<ExportState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleExport = async () => {
    setState("loading");
    setErrorMessage("");

    try {
      const filename = generateExportFilename("analytics-dashboard");

      await handleExportPDF({
        filename,
        scale: 2,
        quality: 2,
        preserveBackgroundColor: true,
      });

      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export PDF";
      setErrorMessage(message);
      setState("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="bg-background/50 p-4 rounded border border-secondary/20 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Analytics & Reports</h3>
          <p className="text-sm text-foreground/60">Export high-quality PDF</p>
        </div>

        <button
          onClick={handleExport}
          disabled={state === "loading"}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded font-semibold transition-all ${
            state === "success"
              ? "bg-green-600/20 text-green-100"
              : state === "error"
                ? "bg-red-600/20 text-red-100"
                : "bg-accent hover:bg-accent/90 text-background disabled:opacity-50"
          }`}
        >
          {state === "loading" && (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Exporting...</span>
            </>
          )}
          {state === "success" && (
            <>
              <CheckCircle2 size={18} />
              <span>Exported!</span>
            </>
          )}
          {state === "error" && (
            <>
              <AlertCircle size={18} />
              <span>Failed</span>
            </>
          )}
          {state === "idle" && (
            <>
              <Download size={18} />
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {state === "error" && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-100">
          <p className="text-sm">{errorMessage}</p>
          <button
            onClick={() => setState("idle")}
            className="text-xs mt-2 text-red-100 hover:text-red-50 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Message */}
      {state === "success" && (
        <div className="p-3 bg-green-900/20 border border-green-500/30 rounded text-green-100">
          <p className="text-sm">PDF exported successfully!</p>
        </div>
      )}

      {/* Content */}
      <div
        ref={exportRef}
        className="bg-background p-6 rounded border border-secondary/20 space-y-6"
      >
        {/* Analytics content here */}
      </div>
    </div>
  );
}
```

### Example 3: Export with Data Table and Charts

```tsx
"use client";

import { usePdfExport } from "@/hooks/usePdfExport";
import { generateExportFilename } from "@/utils/pdf-export";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

const INCIDENT_DATA = [
  { id: "INC-104", category: "Deforestation", location: "Northern Ridge", status: "Critical" },
  { id: "INC-103", category: "Water Pollution", location: "Lake View", status: "Investigating" },
  { id: "INC-102", category: "Illegal Dumping", location: "Highway 9", status: "Resolved" },
];

export function DataTableExport() {
  const { exportRef, handleExportPDF } = usePdfExport();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await handleExportPDF({
        filename: generateExportFilename("incident-report"),
        preserveBackgroundColor: true,
        scale: 2,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-red-900/30 text-red-100";
      case "Investigating":
        return "bg-yellow-900/30 text-yellow-100";
      case "Resolved":
        return "bg-green-900/30 text-green-100";
      default:
        return "bg-gray-900/30 text-gray-100";
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-background rounded disabled:opacity-50"
      >
        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {isExporting ? "Exporting..." : "Export Report"}
      </button>

      <div ref={exportRef} className="bg-background p-6 rounded border border-secondary/20">
        <h2 className="text-xl font-bold text-foreground mb-4">Incident Report</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary/20">
              <th className="text-left py-2 px-3 text-foreground/70 font-semibold">ID</th>
              <th className="text-left py-2 px-3 text-foreground/70 font-semibold">Category</th>
              <th className="text-left py-2 px-3 text-foreground/70 font-semibold">Location</th>
              <th className="text-left py-2 px-3 text-foreground/70 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {INCIDENT_DATA.map((incident) => (
              <tr key={incident.id} className="border-b border-secondary/10">
                <td className="py-3 px-3 text-foreground/80 font-mono">{incident.id}</td>
                <td className="py-3 px-3 text-foreground/80">{incident.category}</td>
                <td className="py-3 px-3 text-foreground/80">{incident.location}</td>
                <td className="py-3 px-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 pt-4 border-t border-secondary/20">
          <p className="text-xs text-foreground/50">
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Example 4: Using Standalone Utility Function

```tsx
import { exportElementToPdf } from "@/utils/pdf-export";
import { Download } from "lucide-react";

export function StandaloneExport() {
  const handleExport = async () => {
    const element = document.getElementById("content-to-export");
    if (!element) return;

    try {
      await exportElementToPdf(element, {
        filename: "custom-report.pdf",
        preserveBackgroundColor: true,
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
        scale: 2,
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <>
      <button
        onClick={handleExport}
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-background rounded"
      >
        <Download size={18} />
        Export to PDF
      </button>
      <div id="content-to-export">{/* Your content */}</div>
    </>
  );
}
```

## Integration with Existing Reports Page

To integrate this into the existing `apps/frontend/src/app/dashboard/reports/page.tsx`:

```tsx
"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/header";
import { usePdfExport } from "@/hooks/usePdfExport";
import { generateExportFilename } from "@/utils/pdf-export";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  const { exportRef, handleExportPDF } = usePdfExport();
  const [isExporting, setIsExporting] = useState(false);

  const incidentsData = [
    // ... existing incident data
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await handleExportPDF({
        filename: generateExportFilename("analytics-report"),
        preserveBackgroundColor: true,
        scale: 2,
        quality: 2,
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Export Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 size={28} />
                  Analytics & Reports
                </h1>
                <p className="text-foreground/60 mt-1">View incident trends and statistics</p>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-background rounded font-semibold disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Export PDF
                  </>
                )}
              </button>
            </div>

            {/* Analytics Content */}
            <div
              ref={exportRef}
              className="space-y-6 bg-background p-6 rounded border border-secondary/20"
            >
              {/* Existing report content */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

## Styling Tips for PDF Export

### Preserve Dark Theme Colors

```css
/* Ensure background colors are preserved */
div {
  background-color: var(--background); /* CSS variable or hardcoded color */
  color: var(--foreground);
}

/* Use specific colors instead of Tailwind arbitrary values for better PDF support */
.card {
  background-color: rgb(17, 24, 39); /* Instead of bg-gray-900 */
  border-color: rgba(239, 68, 68, 0.2);
}
```

### Optimize for PDF

```tsx
// Add PDF-specific classes
<div ref={exportRef} className="print:m-0 print:p-4">
  {/* Content optimized for both screen and PDF */}
</div>
```

### Media Queries

```css
@media print {
  .no-print {
    display: none;
  }

  .print-only {
    display: block;
  }

  /* Adjust spacing for PDF */
  body {
    margin: 0;
    padding: 10mm;
  }
}
```

## Performance Optimization

### 1. Lazy Load Heavy Content

```tsx
const [showContent, setShowContent] = useState(false);

return (
  <>
    <button onClick={() => setShowContent(!showContent)}>Toggle Content</button>
    {showContent && <div ref={exportRef}>Heavy content here</div>}
  </>
);
```

### 2. Reduce Scale for Faster Export

```tsx
await handleExportPDF({
  scale: 1.5, // Instead of 2, for faster processing
  quality: 1, // Slight compression for speed
});
```

### 3. Memoize Export Components

```tsx
import { memo } from "react";

const ExportableContent = memo(function ExportableContent() {
  return <div>Content that rarely changes</div>;
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Blank PDF | Enable `preserveBackgroundColor: true` |
| Blurry text | Increase `scale` to 2.5 or 3 |
| Slow export | Reduce `scale` to 1.5, or split content into smaller sections |
| Images missing | Ensure CORS headers are set on image servers |
| Colors incorrect | Use solid colors instead of gradients, check color variables |
| PDF too large | Reduce `quality` value or use JPEG instead of PNG |

## Accessibility

```tsx
<button
  onClick={handleExport}
  aria-label="Export analytics report as PDF"
  title="Download the current analytics view as a PDF file"
  disabled={isExporting}
>
  {isExporting ? "Exporting..." : "Export PDF"}
</button>
```

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Chrome Mobile

## Further Resources

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [PDF.js Examples](https://mozilla.github.io/pdf.js/examples/)
