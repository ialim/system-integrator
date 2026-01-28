import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(_: Request, context: { params: { id: string; versionId: string } }) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const { id, versionId } = context.params;
  const res = await fetch(`${apiUrl}/projects/${id}/bom-versions/${versionId}/export`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text || "Export failed", { status: res.status });
  }

  const csv = await res.text();
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set(
    "Content-Disposition",
    res.headers.get("Content-Disposition") || `attachment; filename="project-${id}-bom-${versionId}.csv"`
  );

  return new NextResponse(csv, { status: 200, headers });
}
