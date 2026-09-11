"use client";

import React, { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import mammoth from "mammoth";

export default function TranscriptDocxViewer({ id, docxUrl }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);
        setBarcodeImage(null);

        const fileUrl = docxUrl || `/api/transcript/${id}/download`;
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Could not load the transcript document.");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Extract media images (specifically barcode image like image1.png) via JSZip
        try {
          const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
          const mediaFiles = [];
          zip.folder("word/media")?.forEach((relativePath, file) => {
            mediaFiles.push({ path: `word/media/${relativePath}`, file });
          });

          // Search for image1.png or any non-QR barcode image
          let barcodeFile = zip.file("word/media/image1.png");
          if (!barcodeFile) {
            for (const item of mediaFiles) {
              if (item.path !== "word/media/image2.png" && (item.path.endsWith(".png") || item.path.endsWith(".jpeg") || item.path.endsWith(".jpg"))) {
                barcodeFile = item.file;
                break;
              }
            }
          }

          if (barcodeFile) {
            const base64Data = await barcodeFile.async("base64");
            const ext = barcodeFile.name.endsWith(".jpg") || barcodeFile.name.endsWith(".jpeg") ? "jpeg" : "png";
            const dataUrl = `data:image/${ext};base64,${base64Data}`;
            if (isMounted) {
              setBarcodeImage(dataUrl);
            }
          }
        } catch (zipErr) {
          console.warn("Could not inspect zip media for barcode:", zipErr);
        }

        // Render DOCX with all header/footer and experimental options enabled
        try {
          const docx = await import("docx-preview");
          if (containerRef.current && isMounted) {
            containerRef.current.innerHTML = "";
            await docx.renderAsync(arrayBuffer, containerRef.current, null, {
              className: "docx-rendered-document",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              useBase64URL: true,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true,
              renderAltChunks: true,
              renderChanges: false,
              experimental: true,
            });

            // Ensure images inside rendered document have clean display
            if (containerRef.current) {
              const imgs = containerRef.current.querySelectorAll("img");
              imgs.forEach((img) => {
                img.style.maxWidth = "100%";
                img.style.display = "inline-block";
              });
            }

            if (isMounted) setLoading(false);
            return;
          }
        } catch (docxErr) {
          console.warn("docx-preview failed, attempting mammoth fallback:", docxErr);
        }

        // Fallback: Mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (isMounted) {
          setHtmlContent(result.value);
          setLoading(false);
        }
      } catch (err) {
        console.error("Rendering error:", err);
        if (isMounted) {
          setError(err.message || "Failed to render document.");
          setLoading(false);
        }
      }
    }

    loadAndRender();

    return () => {
      isMounted = false;
    };
  }, [id, docxUrl]);

  return (
    <div className="w-full flex flex-col items-center min-h-screen bg-[#121212] py-2 sm:py-6">
      {loading && (
        <div className="flex flex-col items-center justify-center p-16 text-gray-400 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-sm">Rendering transcript document...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 max-w-lg bg-red-950/40 border border-red-800 rounded-xl text-center text-red-200 text-sm my-12">
          <p className="font-semibold mb-1">Document Load Notice</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Main Document Viewport */}
      <div className="w-full overflow-x-auto docx-scroll-wrapper pb-10 flex flex-col items-start sm:items-center">
        <div
          style={{
            minWidth: "fit-content",
            margin: "0 auto",
            position: "relative",
          }}
          className="px-2 sm:px-4"
        >
          {/* Top Left Barcode Overlay if extracted from word/media */}
          {barcodeImage && !loading && (
            <div className="absolute top-5 left-7 sm:left-9 z-10 pointer-events-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={barcodeImage}
                alt="Barcode"
                className="h-10 sm:h-12 w-auto object-contain max-w-[200px]"
              />
            </div>
          )}

          {/* Main docx-preview container */}
          <div
            ref={containerRef}
            className="bg-white text-black shadow-2xl rounded-sm docx-custom-container"
            style={{
              display: htmlContent ? "none" : "block",
              minWidth: "fit-content",
              position: "relative",
            }}
          />

          {/* Fallback HTML container if docx-preview fell back to mammoth */}
          {htmlContent && !loading && (
            <div className="p-6 sm:p-14 bg-white text-black shadow-2xl rounded-sm overflow-x-auto docx-html-view min-w-[700px] relative">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
