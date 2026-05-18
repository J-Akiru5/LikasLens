"use client";

import { useRef, useState } from "react";
import { usePdfExport } from "@/hooks/usePdfExport";
import { generateExportFilename } from "@/utils/pdf-export";
import { Download, Loader2 } from "lucide-react";

/**
 * Example: Analytics Dashboard with PDF Export
 * This component demonstrates how to use the usePdfExport hook to export
 * the Analytics & Reports section as a high-quality PDF while preserving
 * the Eco-Brutalism dark theme colors.
 */
export function AnalyticsDashboardWithExport() {
  const { exportRef, handleExportPDF } = usePdfExport();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportError(null);

      const filename = generateExportFilename("analytics-dashboard");

      await handleExportPDF({
        filename,
        scale: 2,
        quality: 2,
        preserveBackgroundColor: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to export PDF";
      setExportError(errorMessage);
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="flex items-center justify-between bg-background/50 p-4 rounded-sm border border-secondary/20">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Analytics & Reports
          </h2>
          <p className="text-sm text-foreground/60 mt-1">
            Export high-quality PDF with all charts and incident data
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-[#081c15] rounded-sm font-semibold transition-colors disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {exportError && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-sm text-red-100">
          {exportError}
        </div>
      )}

      {/* Content to Export - Wrap with ref */}
      <div
        ref={exportRef}
        className="space-y-6 bg-background p-6 rounded-sm border border-secondary/20"
      >
        {/* Sample Charts Section */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">
            Incident Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart Placeholder 1 */}
            <div className="h-48 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-sm border border-secondary/20 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">42</div>
                <div className="text-xs text-foreground/60 mt-1">
                  Total Incidents
                </div>
              </div>
            </div>

            {/* Chart Placeholder 2 */}
            <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-sm border border-primary/20 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">87%</div>
                <div className="text-xs text-foreground/60 mt-1">
                  Resolution Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Data Table */}
        <div>
          <h3 className="text-base font-semibold text-foreground mb-4">
            Recent Incidents
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-secondary/20">
                  <th className="text-left py-2 px-3 text-foreground/70 font-semibold">
                    ID
                  </th>
                  <th className="text-left py-2 px-3 text-foreground/70 font-semibold">
                    Category
                  </th>
                  <th className="text-left py-2 px-3 text-foreground/70 font-semibold">
                    Location
                  </th>
                  <th className="text-left py-2 px-3 text-foreground/70 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    id: "INC-104",
                    cat: "Deforestation",
                    loc: "Northern Ridge",
                    status: "Critical",
                  },
                  {
                    id: "INC-103",
                    cat: "Water Pollution",
                    loc: "Lake View",
                    status: "Investigating",
                  },
                  {
                    id: "INC-102",
                    cat: "Illegal Dumping",
                    loc: "Highway 9",
                    status: "Resolved",
                  },
                ].map((incident) => (
                  <tr key={incident.id} className="border-b border-secondary/10">
                    <td className="py-3 px-3 text-foreground/80 font-mono">
                      {incident.id}
                    </td>
                    <td className="py-3 px-3 text-foreground/80">
                      {incident.cat}
                    </td>
                    <td className="py-3 px-3 text-foreground/80">
                      {incident.loc}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          incident.status === "Critical"
                            ? "bg-red-900/30 text-red-100"
                            : incident.status === "Investigating"
                              ? "bg-yellow-900/30 text-yellow-100"
                              : "bg-green-900/30 text-green-100"
                        }`}
                      >
                        {incident.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-secondary/20">
          <p className="text-xs text-foreground/50">
            Generated on {new Date().toLocaleDateString()} at{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
