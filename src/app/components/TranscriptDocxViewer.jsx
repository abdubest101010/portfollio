"use client";

import React, { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import mammoth from "mammoth";

export default function TranscriptDocxViewer({ id, docxUrl }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        const fileUrl = docxUrl || `/api/transcript/${id}/download`;
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Could not load the transcript document.");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Extract QR image (image2.png) from word/media directly via JSZip
        let qrDataUrl = null;
        try {
          const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
          const qrFile = zip.file("word/media/image2.png");
          if (qrFile) {
            const base64 = await qrFile.async("base64");
            qrDataUrl = `data:image/png;base64,${base64}`;
          }
        } catch (e) {
          console.warn("Could not extract QR from zip:", e);
        }

        // Render DOCX with docx-preview
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

            // Post-render check: Ensure the QR code image is visible in the header cell
            if (containerRef.current && qrDataUrl) {
              const allImgs = containerRef.current.querySelectorAll("img");
              let hasQrImg = false;
              allImgs.forEach((img) => {
                if (img.src && (img.src.includes("image2") || img.src === qrDataUrl)) {
                  hasQrImg = true;
                  img.style.width = "120px";
                  img.style.height = "120px";
                  img.style.display = "block";
                  img.style.margin = "0 auto 4px auto";
                  img.style.objectFit = "contain";
                }
              });

              // If docx-preview didn't render the QR code in the first table's first cell, inject it
              if (!hasQrImg) {
                const tables = containerRef.current.querySelectorAll("table");
                if (tables.length > 0) {
                  const firstCell = tables[0].querySelector("td, th");
                  if (firstCell) {
                    const existingImg = firstCell.querySelector("img");
                    if (!existingImg) {
                      const qrImgElement = document.createElement("img");
                      qrImgElement.src = qrDataUrl;
                      qrImgElement.alt = "QR Code";
                      qrImgElement.style.width = "120px";
                      qrImgElement.style.height = "120px";
                      qrImgElement.style.display = "block";
                      qrImgElement.style.margin = "0 auto 4px auto";
                      qrImgElement.style.objectFit = "contain";
                      firstCell.insertBefore(qrImgElement, firstCell.firstChild);
                    }
                  }
                }
              }
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
          <p className="text-sm">Loading transcript document...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 max-w-lg bg-red-950/40 border border-red-800 rounded-xl text-center text-red-200 text-sm my-12">
          <p className="font-semibold mb-1">Document Load Notice</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Main Document Viewport with Horizontal Scroll */}
      <div className="w-full overflow-x-auto docx-scroll-wrapper pb-10 flex flex-col items-start sm:items-center">
        <div
          style={{
            minWidth: "fit-content",
            margin: "0 auto",
          }}
          className="px-2 sm:px-4"
        >
          {/* Main docx-preview container */}
          <div
            ref={containerRef}
            className="bg-white text-black shadow-2xl rounded-sm docx-custom-container"
            style={{
              display: htmlContent ? "none" : "block",
              minWidth: "fit-content",
            }}
          />

          {/* Fallback HTML container if docx-preview fell back to mammoth */}
          {htmlContent && !loading && (
            <div className="p-6 sm:p-14 bg-white text-black shadow-2xl rounded-sm overflow-x-auto docx-html-view min-w-[750px]">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
