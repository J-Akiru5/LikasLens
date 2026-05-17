import { Download } from "lucide-react";
import { usePdfExport } from "@/hooks/usePdfExport";
import { generateExportFilename } from "@/utils/pdf-export";

interface AnalyticsExportButtonProps {
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export function AnalyticsExportButton({
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError,
}: AnalyticsExportButtonProps) {
  const { handleExportPDF } = usePdfExport();

  const handleClick = async () => {
    try {
      onExportStart?.();

      const filename = generateExportFilename("analytics-report");

      await handleExportPDF({
        filename,
        scale: 2,
        quality: 2,
        preserveBackgroundColor: true,
      });

      onExportComplete?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Export failed");
      onExportError?.(err);
      console.error("Export error:", err);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-background rounded-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Export Analytics & Reports as PDF"
    >
      <Download size={18} />
      <span>Export PDF</span>
    </button>
  );
}
