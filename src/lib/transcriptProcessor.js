import JSZip from "jszip";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { put } from "@vercel/blob";
import { customAlphabet } from "nanoid";

// 10-character URL-friendly alphanumeric ID generator
const generateNanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);

/**
 * Attempts to decode a QR code from a PNG buffer.
 * Returns the decoded string if found, otherwise null.
 */
function decodeQrFromPng(pngBuffer) {
  try {
    const png = PNG.sync.read(pngBuffer);
    const code = jsQR(new Uint8Array(png.data), png.width, png.height);
    return code ? code.data : null;
  } catch (err) {
    return null;
  }
}

/**
 * Generates a high-quality PNG buffer of a QR code.
 */
async function generateQrCodePng(url, width = 300) {
  return await QRCode.toBuffer(url, {
    type: "png",
    width: width,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Processes a DOCX buffer:
 * 1. Finds existing QR (checking word/media/image2.png first, then scanning word/media/*)
 * 2. Reads the original QR value if readable
 * 3. Replaces that image in the DOCX zip with a newly generated QR pointing to `https://abdu-portfollio.vercel.app/t/{id}`
 * 4. Optionally stores to Vercel Blob if token is configured
 */
export async function processTranscriptDocx(fileBuffer, originalFilename = "transcript.docx") {
  const id = generateNanoid();
  // Always use the official production domain so QR codes open directly without requiring Vercel login
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://abdu-portfollio.vercel.app";

  const newQrUrl = `${baseUrl.replace(/\/$/, "")}/t/${id}`;

  const zip = await JSZip.loadAsync(fileBuffer);

  let targetImagePath = null;
  let originalQrData = null;

  // Find media files in the docx
  const mediaFiles = [];
  zip.folder("word/media")?.forEach((relativePath, file) => {
    mediaFiles.push({ path: `word/media/${relativePath}`, file });
  });

  // Step 1: Check word/media/image2.png first as specified
  const image2 = zip.file("word/media/image2.png");
  if (image2) {
    const imgBuf = await image2.async("nodebuffer");
    const decoded = decodeQrFromPng(imgBuf);
    if (decoded) {
      originalQrData = decoded;
    }
    targetImagePath = "word/media/image2.png";
  }

  // Step 2: If image2.png wasn't a QR or didn't exist, scan all media images with jsQR
  if (!targetImagePath || !originalQrData) {
    for (const item of mediaFiles) {
      if (
        item.path.toLowerCase().endsWith(".png") ||
        item.path.toLowerCase().endsWith(".jpg") ||
        item.path.toLowerCase().endsWith(".jpeg")
      ) {
        try {
          const imgBuf = await item.file.async("nodebuffer");
          const decoded = decodeQrFromPng(imgBuf);
          if (decoded) {
            originalQrData = decoded;
            targetImagePath = item.path;
            break;
          }
        } catch (e) {
          // ignore scan error and continue
        }
      }
    }
  }

  // Default fallback if no QR identified: use word/media/image2.png or the first image
  if (!targetImagePath) {
    if (image2) {
      targetImagePath = "word/media/image2.png";
    } else if (mediaFiles.length > 0) {
      targetImagePath = mediaFiles[0].path;
    } else {
      targetImagePath = "word/media/image2.png";
    }
  }

  // Generate new replacement QR
  const newQrBuffer = await generateQrCodePng(newQrUrl, 260);

  // Replace the image inside the zip
  zip.file(targetImagePath, newQrBuffer);

  // Generate modified DOCX buffer
  const modifiedDocxBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  // Store to Vercel Blob if BLOB_READ_WRITE_TOKEN is available
  let originalBlobUrl = null;
  let modifiedBlobUrl = null;
  let metadataBlobUrl = null;

  const metadata = {
    id,
    originalFilename,
    originalQrData: originalQrData || "N/A",
    newQrUrl,
    processedAt: new Date().toISOString(),
    targetImageReplaced: targetImagePath,
  };

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const origBlob = await put(`transcripts/${id}/original-${originalFilename}`, fileBuffer, {
        access: "public",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      originalBlobUrl = origBlob.url;

      const modBlob = await put(`transcripts/${id}/modified-${originalFilename}`, modifiedDocxBuffer, {
        access: "public",
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      modifiedBlobUrl = modBlob.url;

      metadata.originalBlobUrl = originalBlobUrl;
      metadata.modifiedBlobUrl = modifiedBlobUrl;

      const metaBlob = await put(`transcripts/${id}/metadata.json`, JSON.stringify(metadata, null, 2), {
        access: "public",
        contentType: "application/json",
      });
      metadataBlobUrl = metaBlob.url;
    } catch (blobErr) {
      console.error("Vercel Blob upload warning:", blobErr.message);
    }
  }

  return {
    id,
    newQrUrl,
    originalQrData,
    targetImagePath,
    modifiedDocxBuffer,
    metadata: {
      ...metadata,
      originalBlobUrl,
      modifiedBlobUrl,
      metadataBlobUrl,
    },
  };
}
