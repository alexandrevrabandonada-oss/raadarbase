import type { InfluenceProfile } from "@/lib/influence/types";

const COLUMNS: Array<[string, keyof InfluenceProfile]> = [
  ["username", "username"], ["nome", "nome"], ["categoria", "categoria"], ["cidade", "cidade"],
  ["estado", "estado"], ["seguidores", "seguidores"], ["seguindo", "seguindo"], ["posts", "posts"],
  ["score", "influence_score"], ["verificada", "conta_verificada"], ["criador", "criador"],
  ["empresa", "empresa"], ["privada", "privada"], ["ultima_atualizacao", "data_ultima_atualizacao"],
];

function scalar(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export function profilesToCsv(profiles: InfluenceProfile[]) {
  const rows = [COLUMNS.map(([label]) => label), ...profiles.map((profile) => COLUMNS.map(([, key]) => scalar(profile[key])))];
  return `\uFEFF${rows.map((row) => row.map((cell) => {
    const safeCell = /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
    return `"${safeCell.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n")}`;
}

function xmlEscape(value: unknown) {
  return scalar(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function profilesToExcelXml(profiles: InfluenceProfile[]) {
  const rows = [COLUMNS.map(([label]) => label), ...profiles.map((profile) => COLUMNS.map(([, key]) => profile[key]))];
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Influência"><Table>${rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${xmlEscape(cell)}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet></Workbook>`;
}

export function buildDistribution(profiles: InfluenceProfile[], dimension: "categoria" | "cidade" | "faixa") {
  const counts = new Map<string, number>();
  for (const profile of profiles) {
    const key = dimension === "faixa"
      ? profile.seguidores < 1_000 ? "0–999" : profile.seguidores < 10_000 ? "1 mil–9,9 mil" : profile.seguidores < 100_000 ? "10 mil–99,9 mil" : "100 mil+"
      : scalar(profile[dimension]) || "Não informado";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value })).toSorted((a, b) => b.value - a.value);
}
