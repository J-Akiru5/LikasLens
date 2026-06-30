import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { ExportOptions } from "@/lib/pdf-export-types";

export function usePdfExport() {
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(
    async (options: ExportOptions = {}) => {
      const {
        filename = "export.pdf",
        quality = 2,
        scale = 2,
        preserveBackgroundColor = true,
      } = options;

      if (!exportRef.current) {
        console.error("Export ref not attached to any element");
        return;
      }

      try {
        const canvas = await html2canvas(exportRef.current, {
          scale,
          backgroundColor: preserveBackgroundColor ? null : "#ffffff",
          allowTaint: true,
          useCORS: true,
          logging: false,
        });

        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        let position = 0;

        const imgData = canvas.toDataURL("image/png", quality);

        while (heightLeft >= 0) {
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          position += pageHeight;

          if (heightLeft >= 0) {
            pdf.addPage();
          }
        }

        pdf.save(filename);
      } catch (error) {
        console.error("PDF export failed:", error);
        throw error;
      }
    },
    []
  );

  return {
    exportRef,
    handleExportPDF,
  };
}
