import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing transcript ID" }, { status: 400 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Blob storage not configured." },
        { status: 404 }
      );
    }

    const { blobs } = await list({
      prefix: `transcripts/${id}/`,
    });

    const modifiedBlob =
      blobs.find((b) => b.pathname.includes("/modified-") && b.pathname.endsWith(".docx")) ||
      blobs.find((b) => b.pathname.endsWith(".docx"));

    if (modifiedBlob) {
      return NextResponse.redirect(modifiedBlob.downloadUrl || modifiedBlob.url, 307);
    }

    return NextResponse.json(
      { error: "Transcript file not found for this ID." },
      { status: 404 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
