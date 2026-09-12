import { NextResponse } from "next/server";
import { processTranscriptDocx } from "../../../lib/transcriptProcessor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const photo = formData.get("photo");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Please upload a valid DOCX file." },
        { status: 400 }
      );
    }

    const filename = file.name || "transcript.docx";
    if (!filename.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { error: "Invalid file format. Only .docx files are supported." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    let photoBuffer = null;
    let photoFilename = "photo.jpg";
    if (photo && typeof photo !== "string" && photo.size > 0) {
      const photoArrayBuffer = await photo.arrayBuffer();
      photoBuffer = Buffer.from(photoArrayBuffer);
      photoFilename = photo.name || "photo.jpg";
    }

    // Process the transcript with optional photo
    const result = await processTranscriptDocx(
      fileBuffer,
      filename,
      photoBuffer,
      photoFilename
    );

    const format = request.nextUrl.searchParams.get("format");
    const acceptHeader = request.headers.get("accept") || "";

    // If JSON format is requested
    if (format === "json" || acceptHeader.includes("application/json")) {
      return NextResponse.json({
        success: true,
        id: result.id,
        newQrUrl: result.newQrUrl,
        originalQrData: result.originalQrData,
        filename: `modified-${filename}`,
        modifiedBlobUrl: result.metadata.modifiedBlobUrl,
        originalBlobUrl: result.metadata.originalBlobUrl,
        photoBlobUrl: result.metadata.photoBlobUrl,
        metadataBlobUrl: result.metadata.metadataBlobUrl,
        modifiedDocxBase64: result.modifiedDocxBuffer.toString("base64"),
      });
    }

    // Default: Return modified DOCX as downloadable binary file
    const safeFilename = encodeURIComponent(`modified-${filename}`);
    return new Response(result.modifiedDocxBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${safeFilename}`,
        "x-transcript-id": result.id,
        "x-new-qr-url": encodeURIComponent(result.newQrUrl),
        "x-original-qr-data": encodeURIComponent(result.originalQrData || "N/A"),
        "x-modified-blob-url": encodeURIComponent(result.metadata.modifiedBlobUrl || ""),
        "x-photo-blob-url": encodeURIComponent(result.metadata.photoBlobUrl || ""),
        "Access-Control-Expose-Headers":
          "x-transcript-id, x-new-qr-url, x-original-qr-data, x-modified-blob-url, x-photo-blob-url, Content-Disposition",
      },
    });
  } catch (error) {
    console.error("Error processing transcript:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process transcript DOCX file." },
      { status: 500 }
    );
  }
}
