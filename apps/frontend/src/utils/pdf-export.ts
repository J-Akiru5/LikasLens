import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { ExportPdfOptions } from "@/lib/pdf-export-types";

/**
 * Exports a DOM element as a high-quality PDF with support for background colors
 * and multi-page layouts.
 *
 * @param element - The HTML element to export
 * @param options - Export configuration options
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    filename = "export.pdf",
    quality = 2,
    scale = 2,
    preserveBackgroundColor = true,
    margin = { top: 10, right: 10, bottom: 10, left: 10 },
  } = options;

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: preserveBackgroundColor ? null : "#ffffff",
      allowTaint: true,
      useCORS: true,
      logging: false,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margins = margin;
    const contentWidth = pdfWidth - margins.left - margins.right;
    const contentHeight = pdfHeight - margins.top - margins.bottom;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    let position = margins.top;
    const imgData = canvas.toDataURL("image/png");

    while (heightLeft >= 0) {
      pdf.addImage(
        imgData,
        "PNG",
        margins.left,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= contentHeight;
      position += contentHeight;

      if (heightLeft >= 0) {
        pdf.addPage();
        position = margins.top;
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error("PDF export failed:", error);
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Creates a timestamp-based filename for exports
 * @param prefix - Prefix for the filename
 * @returns Filename with timestamp
 */
export function generateExportFilename(prefix: string = "export"): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, -5);
  return `${prefix}_${timestamp}.pdf`;
}
