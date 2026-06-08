/**
 * PDF Export Configuration & Presets
 * Ready-to-use configurations for common export scenarios
 */

import type { ExportOptions, ExportPdfOptions } from "@/lib/pdf-export-types";

/**
 * Export presets for different use cases
 */
export const EXPORT_PRESETS = {
  /**
   * High-quality export for printing and archival
   */
  PRINT_QUALITY: {
    scale: 3,
    quality: 2,
    preserveBackgroundColor: true,
  } as ExportOptions,

  /**
   * Balanced quality and file size for general sharing
   */
  BALANCED: {
    scale: 2,
    quality: 2,
    preserveBackgroundColor: true,
  } as ExportOptions,

  /**
   * Fast export with reduced file size
   */
  FAST: {
    scale: 1.5,
    quality: 1,
    preserveBackgroundColor: true,
  } as ExportOptions,

  /**
   * Web-optimized for sharing via email or messaging
   */
  WEB_OPTIMIZED: {
    scale: 1,
    quality: 0.8,
    preserveBackgroundColor: false,
  } as ExportOptions,

  /**
   * Dark theme preservation (Eco-Brutalism)
   */
  ECO_BRUTALISM: {
    scale: 2,
    quality: 2,
    preserveBackgroundColor: true,
  } as ExportOptions,
} as const;

/**
 * Margin presets in millimeters
 */
export const MARGIN_PRESETS = {
  NONE: { top: 0, right: 0, bottom: 0, left: 0 },
  MINIMAL: { top: 5, right: 5, bottom: 5, left: 5 },
  STANDARD: { top: 10, right: 10, bottom: 10, left: 10 },
  GENEROUS: { top: 15, right: 15, bottom: 15, left: 15 },
  PROFESSIONAL: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 }, // 0.5 inches
} as const;

/**
 * Common export configurations for LikasLens use cases
 */
export const LIKASLENS_EXPORT_CONFIGS = {
  /**
   * Analytics and reports with dark theme
   */
  ANALYTICS_REPORT: {
    filename: "analytics-report.pdf",
    scale: 2,
    quality: 2,
    preserveBackgroundColor: true,
    margin: MARGIN_PRESETS.STANDARD,
  } as ExportPdfOptions,

  /**
   * Incident data export
   */
  INCIDENT_DATA: {
    filename: "incident-report.pdf",
    scale: 2,
    quality: 2,
    preserveBackgroundColor: true,
    margin: MARGIN_PRESETS.PROFESSIONAL,
  } as ExportPdfOptions,

  /**
   * Environmental monitoring dashboard
   */
  MONITORING_DASHBOARD: {
    filename: "monitoring-dashboard.pdf",
    scale: 2,
    quality: 2,
    preserveBackgroundColor: true,
    margin: MARGIN_PRESETS.STANDARD,
  } as ExportPdfOptions,

  /**
   * Evidence documentation
   */
  EVIDENCE_DOCUMENT: {
    filename: "evidence-documentation.pdf",
    scale: 3, // High quality for forensic purposes
    quality: 2,
    preserveBackgroundColor: true,
    margin: MARGIN_PRESETS.PROFESSIONAL,
  } as ExportPdfOptions,

  /**
   * Scoreboard/public sharing
   */
  PUBLIC_SCOREBOARD: {
    filename: "scoreboard.pdf",
    scale: 2,
    quality: 1,
    preserveBackgroundColor: true,
    margin: MARGIN_PRESETS.MINIMAL,
  } as ExportPdfOptions,
} as const;

/**
 * Get the appropriate export configuration based on content type
 */
export function getExportConfig(
  contentType: keyof typeof LIKASLENS_EXPORT_CONFIGS
): ExportPdfOptions {
  return LIKASLENS_EXPORT_CONFIGS[contentType];
}

/**
 * Create a custom export configuration
 */
export function createExportConfig(
  filename: string,
  preset: keyof typeof EXPORT_PRESETS = "BALANCED",
  margin: keyof typeof MARGIN_PRESETS = "STANDARD"
): ExportPdfOptions {
  return {
    filename,
    ...EXPORT_PRESETS[preset],
    margin: MARGIN_PRESETS[margin],
  };
}

/**
 * CSS class utilities for PDF export optimization
 */
export const PDF_EXPORT_STYLES = `
  /* Hide elements that shouldn't be in PDF */
  .no-export {
    display: none !important;
  }

  /* Optimize spacing for PDF */
  .export-container {
    background-color: rgb(17, 24, 39); /* Dark background */
    color: rgb(243, 244, 246); /* Light text */
    page-break-inside: avoid;
  }

  /* Table styling for PDF */
  .export-table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: avoid;
  }

  .export-table th,
  .export-table td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid rgba(239, 68, 68, 0.2);
  }

  .export-table th {
    background-color: rgba(239, 68, 68, 0.1);
    font-weight: bold;
    color: rgb(243, 244, 246);
  }

  /* Chart container for PDF */
  .export-chart {
    page-break-inside: avoid;
    break-inside: avoid;
    margin: 16px 0;
  }

  /* Section break for multi-page PDFs */
  .export-page-break {
    page-break-after: always;
  }

  /* Footer for all pages */
  .export-footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px solid rgba(239, 68, 68, 0.2);
    font-size: 12px;
    color: rgba(243, 244, 246, 0.6);
  }

  /* Print media queries */
  @media print {
    body {
      margin: 0;
      padding: 10mm;
      background: white;
    }

    .no-print {
      display: none !important;
    }

    .export-container {
      page-break-inside: avoid;
    }
  }
`;

/**
 * Filename generator with timestamp
 */
export function generateTimestampedFilename(
  prefix: string = "export",
  extension: string = "pdf"
): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${prefix}_${date}_${time}.${extension}`;
}

/**
 * Export quality calculator based on content size
 */
export function getOptimalQuality(
  elementWidth: number,
  elementHeight: number
): ExportOptions {
  const area = elementWidth * elementHeight;

  // Adjust quality based on content size
  if (area > 1000000) {
    // Very large content
    return EXPORT_PRESETS.FAST;
  } else if (area > 500000) {
    // Large content
    return EXPORT_PRESETS.BALANCED;
  } else {
    // Small content
    return EXPORT_PRESETS.PRINT_QUALITY;
  }
}

/**
 * Color palette for consistent PDF styling
 */
export const PDF_COLOR_PALETTE = {
  // Eco-Brutalism colors
  primary: "#ef4444",      // Vigilant Red
  secondary: "#6b7280",    // Stone Gray
  accent: "#fbbf24",       // Amber
  background: "#111827",   // Eco-Dark
  foreground: "#f3f4f6",   // Eco-Light
  success: "#10b981",      // Forest Green
  warning: "#f59e0b",      // Warning Amber
  danger: "#ef4444",       // Alert Red
  info: "#3b82f6",         // Info Blue
} as const;

/**
 * Create exportable table HTML with styling
 */
export function createExportableTable(
  data: Record<string, unknown>[],
  columns: { key: string; label: string }[]
): string {
  const headerRow = columns
    .map((col) => `<th class="export-table-header">${col.label}</th>`)
    .join("");

  const bodyRows = data
    .map(
      (row) =>
        `<tr>${columns.map((col) => `<td>${row[col.key] ?? "-"}</td>`).join("")}</tr>`
    )
    .join("");

  return `
    <table class="export-table">
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

/**
 * Create a PDF-friendly chart representation
 */
export function createExportableChart(
  title: string,
  data: { label: string; value: number }[]
): string {
  const maxValue = Math.max(...data.map((d) => d.value));

  const bars = data
    .map(
      (item) =>
        `
    <div class="export-chart-item">
      <div class="export-chart-label">${item.label}</div>
      <div class="export-chart-bar-container">
        <div 
          class="export-chart-bar" 
          style="width: ${(item.value / maxValue) * 100}%"
        >
          ${item.value}
        </div>
      </div>
    </div>
  `
    )
    .join("");

  return `
    <div class="export-chart">
      <h3 class="export-chart-title">${title}</h3>
      <div class="export-chart-container">
        ${bars}
      </div>
    </div>
  `;
}

/**
 * Export validation utility
 */
export function validateExportContent(element: HTMLElement): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (element.offsetHeight === 0 || element.offsetWidth === 0) {
    warnings.push("Element has zero dimensions");
  }

  if (element.querySelectorAll("img").length > 0) {
    const images = Array.from(element.querySelectorAll("img")) as HTMLImageElement[];
    images.forEach((img) => {
      if (!img.src || img.src.startsWith("data:") === false) {
        if (!img.complete) {
          warnings.push(`Image not loaded: ${img.src}`);
        }
      }
    });
  }

  if (element.querySelectorAll("iframe").length > 0) {
    warnings.push("Content contains iframes which may not render in PDF");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

/**
 * Export metrics for monitoring and optimization
 */
export interface ExportMetrics {
  startTime: number;
  endTime?: number;
  elementSize: { width: number; height: number };
  fileSize?: number;
  quality: number;
  scale: number;
}

export function createExportMetrics(
  element: HTMLElement,
  options: ExportOptions
): ExportMetrics {
  return {
    startTime: Date.now(),
    elementSize: {
      width: element.offsetWidth,
      height: element.offsetHeight,
    },
    quality: options.quality || 2,
    scale: options.scale || 2,
  };
}

export function completeExportMetrics(
  metrics: ExportMetrics,
  fileSize: number
): ExportMetrics & { duration: number } {
  return {
    ...metrics,
    endTime: Date.now(),
    fileSize,
    duration: (metrics.endTime ?? Date.now()) - metrics.startTime,
  };
}
