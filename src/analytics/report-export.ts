import type { AnalyticsGeneratedReport, ReportTableSection } from "./report-types";

/**
 * Escapes a single cell value for standard CSV format.
 * - Encloses in quotes if the value contains commas, quotes, line breaks, or carriage returns.
 * - Escapes inner quotes by doubling them ("" -> """").
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formats a table section into CSV text lines.
 */
export function formatSectionToCsv(section: ReportTableSection): string {
  const lines: string[] = [];

  // Section Header
  lines.push(escapeCsvCell(section.title));
  if (section.description) {
    lines.push(escapeCsvCell(section.description));
  }

  // Column Headers
  const headerRow = section.columns.map((c) => escapeCsvCell(c.header)).join(",");
  lines.push(headerRow);

  // Rows
  if (section.rows.length === 0) {
    lines.push(escapeCsvCell(section.emptyMessage || "Sin datos registrados para esta sección."));
  } else {
    for (const row of section.rows) {
      const line = section.columns.map((c) => escapeCsvCell(row[c.key])).join(",");
      lines.push(line);
    }
  }

  return lines.join("\r\n");
}

/**
 * Builds a structured, complete CSV string from an AnalyticsGeneratedReport.
 * Includes official DMPS INFO header, metadata, executive summary, and all tables.
 */
export function buildReportCsv(report: AnalyticsGeneratedReport): string {
  const parts: string[] = [];

  // 1. Report Header Metadata
  parts.push("DMPS INFO — REPORTE DE ANALÍTICA ADMINISTRATIVA");
  parts.push(`Reporte,${escapeCsvCell(report.metadata.reportTitle)}`);
  parts.push(`Periodo,${escapeCsvCell(report.metadata.periodLabel)}`);
  parts.push(`Escuela,${escapeCsvCell(report.metadata.schoolFilterLabel)}`);
  parts.push(`Generado,${escapeCsvCell(report.metadata.generatedAtFormatted)}`);
  parts.push(`Fuente,${escapeCsvCell(report.metadata.dataSource)}`);
  parts.push(`Nivel de Confianza,${escapeCsvCell(report.metadata.confidence)}`);
  parts.push("");

  // 2. Management Summary
  parts.push("RESUMEN GENERAL");
  parts.push(escapeCsvCell(report.managementSummary));
  parts.push("");

  // 3. Key Metrics Summary
  if (report.keyMetrics.length > 0) {
    parts.push("MÉTRICAS CLAVE");
    parts.push("Métrica,Valor Actual,Valor Previo,Variación,Nota");
    for (const m of report.keyMetrics) {
      parts.push(
        [
          escapeCsvCell(m.label),
          escapeCsvCell(m.value),
          escapeCsvCell(m.previousValue ?? "—"),
          escapeCsvCell(m.changeLabel ?? "—"),
          escapeCsvCell(m.note ?? ""),
        ].join(","),
      );
    }
    parts.push("");
  }

  // 4. Intelligence Findings (if present)
  if (report.findings && report.findings.length > 0) {
    parts.push("HALLAZGOS DE INTELIGENCIA Y DIAGNÓSTICO");
    parts.push("Categoría,Título,Evidencia,Periodo,Confianza");
    for (const f of report.findings) {
      parts.push(
        [
          escapeCsvCell(f.categoryLabel),
          escapeCsvCell(f.title),
          escapeCsvCell(f.evidence),
          escapeCsvCell(f.periodLabel),
          escapeCsvCell(f.confidence),
        ].join(","),
      );
    }
    parts.push("");
  }

  // 5. Data Tables
  for (const table of report.tables) {
    parts.push(formatSectionToCsv(table));
    parts.push("");
  }

  return parts.join("\r\n");
}

/**
 * Triggers a browser download of the report CSV file with UTF-8 BOM.
 */
export function downloadReportCsv(report: AnalyticsGeneratedReport): string {
  const csvContent = buildReportCsv(report);
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanId = report.metadata.reportId.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const fileName = `dmps-info-analytics-${cleanId}-${dateStr}.csv`;

  if (typeof window !== "undefined") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return fileName;
}
