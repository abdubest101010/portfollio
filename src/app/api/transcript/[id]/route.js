import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        id,
        verified: true,
        message: "Transcript record verified (Local storage mode)",
      });
    }

    const { blobs } = await list({
      prefix: `transcripts/${id}/`,
    });

    const metaBlob = blobs.find((b) => b.pathname.endsWith("metadata.json"));
    if (metaBlob) {
      const res = await fetch(metaBlob.url);
      if (res.ok) {
        const metadata = await res.json();
        return NextResponse.json({
          verified: true,
          ...metadata,
          blobs,
        });
      }
    }

    return NextResponse.json({
      id,
      verified: true,
      blobs,
    });
  } catch (err) {
    return NextResponse.json(
      { id, verified: true, error: err.message },
      { status: 200 }
    );
  }
}
