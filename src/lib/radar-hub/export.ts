import type { RadarEntity } from "@/lib/radar-hub/types";
import type { RadarEvidenceRow, RadarRelationshipRow } from "@/lib/radar-hub/db-types";

type ExportRow = Record<string, unknown>;

function scalar(value: unknown) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function csvCell(value: unknown) {
  const text = scalar(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function rowsToCsv(rows: ExportRow[]) {
  if (!rows.length) return "\uFEFF";
  const headers = Object.keys(rows[0]);
  return `\uFEFF${[headers, ...rows.map((row) => headers.map((header) => row[header]))].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

function xml(value: unknown) { return scalar(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
export function rowsToExcelXml(rows: ExportRow[], sheetName = "Radar") {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const values = [headers, ...rows.map((row) => headers.map((header) => row[header]))];
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${xml(sheetName)}"><Table>${values.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${xml(cell)}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet></Workbook>`;
}

export function entityExportRows(entities: RadarEntity[]): ExportRow[] {
  return entities.map((entity) => ({ id: entity.id, nome: entity.display_name, tipo: entity.entity_type, categoria: entity.main_category, categorias_secundarias: entity.secondary_categories, cidade: entity.primary_city, estado: entity.primary_state, regiao: entity.primary_region, score: entity.influence_score, confianca: entity.confidence_score, status: entity.status, atualizado_em: entity.updated_at }));
}
export function relationshipExportRows(items: RadarRelationshipRow[]): ExportRow[] {
  return items.map((item) => ({ id: item.id, entidade_origem: item.subject_entity_id, predicado: item.predicate, entidade_destino: item.object_entity_id, rotulo: item.relationship_label, confianca: item.confidence, evidencia_id: item.evidence_id, valido_desde: item.valid_from, valido_ate: item.valid_until }));
}
export function evidenceExportRows(items: RadarEvidenceRow[]): ExportRow[] {
  return items.map((item) => ({ id: item.id, entidade_id: item.entity_id, fonte: item.source_type, nome_fonte: item.source_name, referencia: item.source_reference, coletado_em: item.captured_at, campo: item.field_name, valor: item.field_value, confianca: item.confidence, tipo_evidencia: item.evidence_kind, trecho: item.raw_excerpt }));
}

