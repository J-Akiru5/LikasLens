/**
 * PDF Export Module - Type Definitions
 * Comprehensive types for the PDF export functionality
 */

/**
 * Configuration options for PDF export
 */
export interface ExportOptions {
  /** Output filename (default: "export.pdf") */
  filename?: string;

  /** PNG compression quality (0-1 or higher for better quality, default: 2) */
  quality?: number;

  /** Canvas scaling factor for higher resolution (default: 2) */
  scale?: number;

  /** Whether to preserve background colors (default: true) */
  preserveBackgroundColor?: boolean;
}

/**
 * Extended options for the utility function with margins
 */
export interface ExportPdfOptions extends ExportOptions {
  /** Page margins in millimeters */
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Return type for usePdfExport hook
 */
export interface UsePdfExportReturn {
  /** React ref to attach to the element you want to export */
  exportRef: React.RefObject<HTMLDivElement>;

  /** Function to handle the PDF export */
  handleExportPDF: (options?: ExportOptions) => Promise<void>;
}

/**
 * Error details for export failures
 */
export interface ExportError {
  message: string;
  code?: string;
  originalError?: Error;
}

/**
 * Status tracking for export operations
 */
export interface ExportStatus {
  isExporting: boolean;
  progress?: number;
  error: ExportError | null;
}
