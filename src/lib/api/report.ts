import type { ReportPreviewResponse } from "@/types";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getReportPreview(company_name: string, start_date: string, end_date: string): Promise<ReportPreviewResponse> {
  const res = await fetch("/api/report/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name, start_date, end_date }),
  });
  return handleResponse<ReportPreviewResponse>(res);
}
