"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppHeader } from "@/components/layout/header";
import { BarChart3, TrendingUp, Download } from "lucide-react";
import { useState } from "react";

export default function ReportsPage() {
  // Demo incident data
  const incidentsData = [
    { id: "INC-104", cat: "Deforestation", loc: "Northern Ridge", stat: "Critical" },
    { id: "INC-103", cat: "Water Pollution", loc: "Lake View", stat: "Investigating" },
    { id: "INC-102", cat: "Illegal Dumping", loc: "Highway 9", stat: "Resolved" },
    { id: "INC-101", cat: "Wildfire Risk", loc: "Sector 7", stat: "Monitoring" },
    { id: "INC-100", cat: "Wildlife Threat", loc: "National Park", stat: "Resolved" },
    { id: "INC-099", cat: "Air Quality", loc: "Downtown Core", stat: "Investigating" },
    { id: "INC-098", cat: "Noise Pollution", loc: "Industrial Zone", stat: "Monitoring" },
  ];

  // Calculate incident type distribution from actual data
  const incidentTypes = incidentsData.reduce((acc, incident) => {
    const existing = acc.find((item) => item.label === incident.cat);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ label: incident.cat, count: 1 });
    }
    return acc;
  }, [] as Array<{ label: string; count: number }>);

  // Sort by count and calculate percentages
  const totalIncidents = incidentsData.length;
  const typeStats = incidentTypes
    .sort((a, b) => b.count - a.count)
    .map((type, idx) => ({
      label: type.label,
      count: type.count,
      percent: Math.round((type.count / totalIncidents) * 100),
      color: idx === 0 ? "bg-secondary" : idx === 1 ? "bg-accent" : idx === 2 ? "bg-primary" : "bg-secondary/60",
      borderColor: idx === 0 ? "border-secondary" : idx === 1 ? "border-accent" : idx === 2 ? "border-primary" : "border-secondary/60",
      textColor: idx === 0 ? "text-secondary" : idx === 1 ? "text-accent" : idx === 2 ? "text-primary" : "text-secondary"
    }));

  // Resolution efficiency data (cases by day, week-long)
  const resolutionData = [
    { day: "Mon", cases: 40, resolved: 35, efficiency: 87 },
    { day: "Tue", cases: 60, resolved: 45, efficiency: 75 },
    { day: "Wed", cases: 45, resolved: 38, efficiency: 84 },
    { day: "Thu", cases: 80, resolved: 72, efficiency: 90 },
    { day: "Fri", cases: 55, resolved: 48, efficiency: 87 },
    { day: "Sat", cases: 90, resolved: 78, efficiency: 86 },
    { day: "Sun", cases: 75, resolved: 68, efficiency: 90 },
  ];

  // Calculate metrics
  const avgResolutionRate = Math.round(
    resolutionData.reduce((sum, d) => sum + d.efficiency, 0) / resolutionData.length
  );
  const ghostModeUsage = Math.round((incidentsData.length * 0.34));

  // Export data handler - generates PDF-ready HTML in new window
  const handleExportData = () => {
    // Create HTML content for the report
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>LikasLens Analytics Report</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #081c15;
                padding: 40px 20px;
                background: #fff;
            }
            .container {
                max-width: 900px;
                margin: 0 auto;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #1B4332;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                font-size: 32px;
                color: #1B4332;
                margin-bottom: 10px;
            }
            .timestamp {
                color: #666;
                font-size: 12px;
            }
            .section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .section h2 {
                color: #1B4332;
                border-left: 4px solid #ffb703;
                padding-left: 12px;
                margin-bottom: 15px;
                font-size: 18px;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .summary-item {
                background: #f8f9fa;
                border: 2px solid #1B4332;
                padding: 15px;
                border-radius: 4px;
            }
            .summary-item .label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                font-weight: bold;
                margin-bottom: 8px;
            }
            .summary-item .value {
                font-size: 24px;
                color: #1B4332;
                font-weight: bold;
            }
            .incident-item {
                margin-bottom: 12px;
            }
            .progress-bar {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }
            .progress-label {
                font-weight: bold;
                font-size: 12px;
            }
            .progress-value {
                color: #1B4332;
                font-weight: bold;
                font-size: 12px;
            }
            .progress-container {
                width: 100%;
                height: 24px;
                background: #f0f0f0;
                border: 2px solid #1B4332;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #2de1c2, #1B4332);
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 11px;
                font-weight: bold;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                background: #fff;
                margin-top: 15px;
            }
            th {
                background: #1B4332;
                color: #fff;
                padding: 10px;
                text-align: left;
                font-weight: bold;
                font-size: 12px;
            }
            td {
                padding: 8px 10px;
                border: 1px solid #ddd;
                font-size: 12px;
            }
            tr:nth-child(even) {
                background: #f8f9fa;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #1B4332;
                text-align: center;
                color: #666;
                font-size: 11px;
            }
            .print-hint {
                text-align: center;
                background: #fff3cd;
                border: 1px solid #ffc107;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 20px;
                color: #856404;
            }
            @media print {
                body {
                    padding: 20px;
                }
                .print-hint {
                    display: none;
                }
                .section {
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="print-hint">
                📄 Use Ctrl+P (or Cmd+P on Mac) to print this page as PDF
            </div>
            
            <div class="header">
                <h1>🌍 LikasLens Analytics Report</h1>
                <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
            </div>

            <div class="section">
                <h2>📊 Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="label">Total Incidents</div>
                        <div class="value">${totalIncidents}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Avg Resolution</div>
                        <div class="value">${avgResolutionRate}%</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Ghost Mode</div>
                        <div class="value">${ghostModeUsage}</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Ghost %</div>
                        <div class="value">${Math.round((ghostModeUsage/totalIncidents)*100)}%</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🏷️ Incident Types Distribution</h2>
                ${typeStats.map((stat) => `
                <div class="incident-item">
                    <div class="progress-bar">
                        <span class="progress-label">${stat.label}</span>
                        <span class="progress-value">${stat.count} (${stat.percent}%)</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-fill" style="width: ${stat.percent}%">${stat.percent > 15 ? stat.percent + '%' : ''}</div>
                    </div>
                </div>
                `).join('')}
            </div>

            <div class="section">
                <h2>📈 Daily Resolution Efficiency</h2>
                <table>
                    <tr>
                        <th>Day</th>
                        <th>Cases</th>
                        <th>Resolved</th>
                        <th>Efficiency</th>
                    </tr>
                    ${resolutionData.map((day) => `
                    <tr>
                        <td><strong>${day.day}</strong></td>
                        <td>${day.cases}</td>
                        <td>${day.resolved}</td>
                        <td><strong>${day.efficiency}%</strong></td>
                    </tr>
                    `).join('')}
                </table>
            </div>

            <div class="section">
                <h2>📋 All Incidents</h2>
                <table>
                    <tr>
                        <th>ID</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Status</th>
                    </tr>
                    ${incidentsData.map((inc) => `
                    <tr>
                        <td><strong>${inc.id}</strong></td>
                        <td>${inc.cat}</td>
                        <td>${inc.loc}</td>
                        <td>${inc.stat}</td>
                    </tr>
                    `).join('')}
                </table>
            </div>

            <div class="footer">
                <p>LikasLens © 2026 | Neuro-symbolic Civic Reporting Platform</p>
                <p>This report contains sensitive environmental and civic data. Handle with care.</p>
            </div>
        </div>
        <script>
            window.onload = function() {
                // Auto-focus print dialog
                setTimeout(() => window.print(), 500);
            };
        </script>
    </body>
    </html>
    `;

    // Open in new window
    const printWindow = window.open('', '', 'width=1200,height=800');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      alert('Please disable pop-up blocker to generate PDF');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-body selection:bg-accent/30 selection:text-current">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
        <div className="smoke-overlay" />
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6 relative z-10">
          <BottomNav />
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-4 border-primary pb-4">
              <h1 className="font-heading text-4xl font-black uppercase">Analytics & Reports</h1>
              <button
                onClick={handleExportData}
                className="brutal-button px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" /> Export Data
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Incident Types Chart */}
              <div className="brutal-panel panel-surface p-6 border-2 border-primary shadow-[4px_4px_0px_#1b4332]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-xl font-bold uppercase tracking-widest">Incident Types</h2>
                  <BarChart3 className="w-5 h-5 text-secondary" />
                </div>

                <div className="space-y-4">
                  {typeStats.map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between font-mono text-sm font-bold uppercase mb-2 tracking-widest">
                        <span className="text-foreground">{stat.label}</span>
                        <span className={stat.textColor}>
                          {stat.count} ({stat.percent}%)
                        </span>
                      </div>
                      <div className={`w-full h-5 bg-foreground/10 rounded overflow-hidden border-2 border-foreground/30`}>
                        <div
                          className={`h-full transition-all duration-500 font-bold text-xs flex items-center justify-center text-foreground ${
                            stat.color === 'bg-secondary' ? 'bg-[#2de1c2]' : 
                            stat.color === 'bg-accent' ? 'bg-[#ffb703]' :
                            'bg-[#1B4332]'
                          } shadow-[0_0_12px_var(--bar-glow),inset_0_0_4px_rgba(255,255,255,0.2)]`}
                          style={{ 
                            width: `${stat.percent}%`,
                            '--bar-glow': stat.color === 'bg-secondary' ? 'rgba(45,225,194,1)' : 'rgba(255,183,3,1)'
                          } as React.CSSProperties}
                        >
                          {stat.percent > 15 && <span>{stat.percent}%</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-3 bg-primary/5 border-l-4 border-primary rounded">
                  <div className="text-xs font-mono uppercase tracking-widest text-foreground/70">
                    Total Tracked: <span className="font-bold text-primary">{totalIncidents}</span> incidents
                  </div>
                </div>
              </div>

              {/* Resolution Efficiency Chart */}
              <div className="brutal-panel panel-surface p-6 border-2 border-secondary shadow-[4px_4px_0px_#2de1c2]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-xl font-bold uppercase tracking-widest">Resolution Efficiency</h2>
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>

                <div className="flex items-end h-48 gap-2 mt-4">
                  {resolutionData.map((d, i) => {
                    const maxCases = Math.max(...resolutionData.map(x => x.cases));
                    const barHeight = (d.cases / maxCases) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer relative">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white font-mono text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap shadow-[2px_2px_0px_#081c15] z-20">
                          {d.resolved}/{d.cases} ({d.efficiency}%)
                        </div>
                        <div
                          className="w-full bg-secondary border-2 border-secondary rounded-t group-hover:bg-accent transition-colors shadow-[0_0_6px_rgba(45,225,194,0.4)]"
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between font-mono text-xs font-bold surface-muted uppercase mt-4 border-t-2 border-primary/10 pt-2 tracking-widest">
                  {resolutionData.map((d) => (
                    <span key={d.day}>{d.day}</span>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-secondary/5 border-l-4 border-secondary rounded">
                  <div className="text-xs font-mono uppercase tracking-widest text-foreground/70">
                    Avg Efficiency: <span className="font-bold text-secondary">{avgResolutionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Efficiency Insight Card */}
            <div className="brutal-panel panel-surface p-8 border-4 border-accent shadow-[4px_4px_0px_#ffb703]">
              <h2 className="font-heading text-xl font-black uppercase text-primary mb-2 tracking-widest">
                🤖 AI Efficiency Insight
              </h2>
              <p className="font-mono text-sm leading-relaxed text-foreground/80">
                The Neuro-Symbolic AI accurately categorized <span className="text-secondary font-bold">98.4%</span> of
                reports this week, reducing manual dispatch time by an average of <span className="text-accent font-bold">4.2 hours</span> per
                critical incident. Ghost Mode usage increased to <span className="text-secondary font-bold">{ghostModeUsage} reports</span> ({Math.round((ghostModeUsage/totalIncidents)*100)}%), indicating strong community trust in the anonymity protocol.
              </p>
            </div>

            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                { 
                  title: "Response Time", 
                  value: "18m", 
                  unit: "Average", 
                  color: "border-primary",
                  progress: (18 / 30) * 100,
                  label: "vs 30m SLA"
                },
                { 
                  title: "Resolution Rate", 
                  value: `${avgResolutionRate}%`, 
                  unit: "This Week", 
                  color: "border-secondary",
                  progress: avgResolutionRate,
                  label: "weekly target"
                },
                { 
                  title: "Ghost Mode Usage", 
                  value: `${Math.round((ghostModeUsage/totalIncidents)*100)}%`, 
                  unit: `${ghostModeUsage} Reports`, 
                  color: "border-accent",
                  progress: (ghostModeUsage / totalIncidents) * 100,
                  label: "of all reports"
                },
              ].map((metric, i) => (
                <div key={i} className={`brutal-panel panel-surface p-6 border-2 ${metric.color} shadow-[3px_3px_0px_#1b4332]`}>
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-foreground/60 mb-2">
                    {metric.unit}
                  </div>
                  <div className="font-heading text-3xl font-black mb-1">{metric.value}</div>
                  <div className="font-heading text-sm font-bold uppercase tracking-widest text-foreground/70 mb-3">
                    {metric.title}
                  </div>
                  <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                    <div
                      className={`h-full ${metric.color.replace("border-", "bg-")} transition-all duration-500 shadow-[0_0_6px_rgba(45,225,194,0.3)]`}
                      style={{ width: `${Math.min(metric.progress, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs font-mono text-foreground/50 mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
