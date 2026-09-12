import JSZip from "jszip";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { customAlphabet } from "nanoid";

// 10-character URL-friendly alphanumeric ID generator
const generateNanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);

/**
 * Attempts to decode a QR code from a PNG buffer.
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
 * Processes a DOCX buffer and optional student photo:
 * 1. Replaces the QR code pointing to https://abdu-portfollio.vercel.app/t/{id}
 * 2. If photo is provided, center-crops/resizes it and places it in the photo box
 * 3. Saves documents, photo, and metadata to Vercel Blob
 */
export async function processTranscriptDocx(
  fileBuffer,
  originalFilename = "transcript.docx",
  photoBuffer = null,
  photoFilename = "photo.jpg"
) {
  const id = generateNanoid();
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

  // Check word/media/image2.png first
  const image2 = zip.file("word/media/image2.png");
  if (image2) {
    const imgBuf = await image2.async("nodebuffer");
    const decoded = decodeQrFromPng(imgBuf);
    if (decoded) {
      originalQrData = decoded;
    }
    targetImagePath = "word/media/image2.png";
  }

  // If not found, scan other media images
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
        } catch (e) {}
      }
    }
  }

  if (!targetImagePath) {
    targetImagePath = image2 ? "word/media/image2.png" : "word/media/image2.png";
  }

  // Generate and replace QR
  const newQrBuffer = await generateQrCodePng(newQrUrl, 260);
  zip.file(targetImagePath, newQrBuffer);

  // Process optional Student Photo
  let processedPhotoBuffer = null;
  let photoBlobUrl = null;

  if (photoBuffer && photoBuffer.length > 0) {
    try {
      // Resize & center-crop photo to exact portrait dimensions (300x360 px, 5:6 aspect ratio)
      processedPhotoBuffer = await sharp(photoBuffer)
        .resize(300, 360, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Place image inside zip
      zip.file("word/media/image_photo.jpg", processedPhotoBuffer);

      // Ensure [Content_Types].xml has jpg / jpeg
      const ctPath = "[Content_Types].xml";
      let ctXml = (await zip.file(ctPath)?.async("text")) || "";
      if (ctXml && !ctXml.includes('Extension="jpg"')) {
        ctXml = ctXml.replace("<Types", '<Types><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/>');
        zip.file(ctPath, ctXml);
      }

      // Add relationship to word/_rels/document.xml.rels
      const relsPath = "word/_rels/document.xml.rels";
      let relsXml = (await zip.file(relsPath)?.async("text")) || "";
      if (relsXml && !relsXml.includes("image_photo.jpg")) {
        const photoRel = `<Relationship Id="rIdPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image_photo.jpg"/>`;
        relsXml = relsXml.replace("</Relationships>", `${photoRel}</Relationships>`);
        zip.file(relsPath, relsXml);
      }

      // Insert photo drawing XML inside photo box in word/document.xml
      const docPath = "word/document.xml";
      let docXml = (await zip.file(docPath)?.async("text")) || "";
      if (docXml) {
        // Ensure root <w:document> includes wp, pic, a, and r namespaces if missing
        if (!docXml.includes('xmlns:wp=')) {
          docXml = docXml.replace('<w:document ', '<w:document xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ');
        }

        const photoDrawingXml = `<w:p w:rsidR="003576BC" w:rsidRDefault="00F428F1"><w:pPr><w:jc w:val="center"/><w:spacing w:after="40" w:before="0"/></w:pPr><w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><wp:extent cx="1069354" cy="1283225"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="99" name="Student Photo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="99" name="student_photo.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rIdPhoto" cstate="print"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1069354" cy="1283225"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

        // Insert before "Note: The photo is" or inside the right-hand cell
        const noteIdx = docXml.indexOf("Note: The photo is");
        if (noteIdx !== -1) {
          const pStart = docXml.lastIndexOf("<w:p", noteIdx);
          if (pStart !== -1) {
            docXml = docXml.slice(0, pStart) + photoDrawingXml + docXml.slice(pStart);
            zip.file(docPath, docXml);
          }
        }
      }
    } catch (photoErr) {
      console.warn("Could not process photo for DOCX:", photoErr.message);
    }
  }

  // Generate modified DOCX buffer
  const modifiedDocxBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  // Upload to Vercel Blob
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
    hasPhoto: !!processedPhotoBuffer,
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

      if (processedPhotoBuffer) {
        const photoBlob = await put(`transcripts/${id}/photo.jpg`, processedPhotoBuffer, {
          access: "public",
          contentType: "image/jpeg",
        });
        photoBlobUrl = photoBlob.url;
        metadata.photoBlobUrl = photoBlobUrl;
      }

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
    photoBuffer: processedPhotoBuffer,
    photoBlobUrl,
    metadata: {
      ...metadata,
      originalBlobUrl,
      modifiedBlobUrl,
      metadataBlobUrl,
      photoBlobUrl,
    },
  };
}
