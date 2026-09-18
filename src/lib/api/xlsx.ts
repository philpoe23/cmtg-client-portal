export type XlsxColumnType = "text" | "number" | "date" | "hours";

export interface XlsxColumn {
  key: string;
  label: string;
  type: XlsxColumnType;
  width?: number;
  align?: "left" | "center" | "right";
  total?: boolean;
}

export interface XlsxRequest {
  title: string;
  subtitle?: string;
  sheet_name: string;
  filename: string;
  columns: XlsxColumn[];
  rows: Array<Record<string, string | number | null>>;
}

/**
 * Posts a workbook spec to the generator service (proxied via /api/xlsx/generate
 * so the internal service URL stays server-side) and saves the result.
 */
export async function downloadXlsx(payload: XlsxRequest): Promise<void> {
  const res = await fetch("/api/xlsx/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res
      .json()
      .then((d) => (d as { detail?: string }).detail)
      .catch(() => null);
    throw new Error(detail ?? `Export failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${payload.filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
