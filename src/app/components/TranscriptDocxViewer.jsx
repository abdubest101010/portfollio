"use client";

import React, { useEffect, useRef, useState } from "react";
import mammoth from "mammoth";

export default function TranscriptDocxViewer({ id, docxUrl }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [zoom, setZoom] = useState(100);

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

        // Attempt 1: Render with docx-preview
        try {
          const docx = await import("docx-preview");
          if (containerRef.current && isMounted) {
            containerRef.current.innerHTML = "";
            await docx.renderAsync(arrayBuffer, containerRef.current, null, {
              className: "docx-rendered-document",
              inWrapper: false,
              ignoreWidth: true, // Allows responsive width without right-side clipping
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              useBase64URL: true,
              renderChanges: false,
              experimental: true,
            });
            if (isMounted) setLoading(false);
            return;
          }
        } catch (docxErr) {
          console.warn("docx-preview failed, attempting mammoth fallback:", docxErr);
        }

        // Attempt 2: Mammoth HTML conversion fallback
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
    <div className="w-full flex flex-col items-center min-h-screen bg-[#121212] py-2 sm:py-6 px-1 sm:px-4">
      {/* Floating Toolbar for comfortable viewing / zoom on mobile & desktop */}
      {!loading && !error && (
        <div className="sticky top-2 z-20 mb-4 px-4 py-2 bg-[#1e1e1e]/90 backdrop-blur-md border border-[#33353F] rounded-full shadow-lg flex items-center gap-3 text-xs sm:text-sm text-gray-300">
          <button
            onClick={() => setZoom((prev) => Math.max(prev - 10, 60))}
            className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center font-bold text-white transition"
            title="Zoom Out"
          >
            -
          </button>
          <span className="font-mono text-xs w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((prev) => Math.min(prev + 10, 150))}
            className="w-7 h-7 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center font-bold text-white transition"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoom(100)}
            className="px-2.5 py-1 rounded-full bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition ml-1"
          >
            Reset
          </button>
        </div>
      )}

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

      {/* Main Document Viewport with responsive horizontal scrolling & scaling */}
      <div className="w-full flex justify-center overflow-x-auto pb-8">
        <div
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : "none",
            transformOrigin: "top center",
            transition: "transform 0.15s ease-out",
          }}
          className="w-full max-w-4xl transition-all"
        >
          {/* Main docx-preview container */}
          <div
            ref={containerRef}
            className="w-full bg-white text-black shadow-2xl rounded-sm docx-custom-container"
            style={{
              display: htmlContent ? "none" : "block",
            }}
          />

          {/* Fallback HTML container if docx-preview fell back to mammoth */}
          {htmlContent && !loading && (
            <div className="w-full p-4 sm:p-12 bg-white text-black shadow-2xl rounded-sm overflow-x-auto docx-html-view">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
