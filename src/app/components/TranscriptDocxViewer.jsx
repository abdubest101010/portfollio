"use client";

import React, { useEffect, useRef, useState } from "react";
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

        // Fetch DOCX file buffer
        const fileUrl = docxUrl || `/api/transcript/${id}/download`;
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Could not load the transcript document.");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Attempt 1: Render with docx-preview for pixel-accurate Word layout
        try {
          const docx = await import("docx-preview");
          if (containerRef.current && isMounted) {
            containerRef.current.innerHTML = "";
            await docx.renderAsync(arrayBuffer, containerRef.current, null, {
              className: "docx-rendered-document",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              breakPages: true,
              useBase64URL: true,
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
    <div className="w-full flex flex-col items-center min-h-screen py-4 sm:py-8">
      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-sm">Rendering transcript document...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 max-w-lg bg-red-950/40 border border-red-800 rounded-xl text-center text-red-200 text-sm">
          <p className="font-semibold mb-1">Document Load Notice</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* Main docx-preview container */}
      <div
        ref={containerRef}
        className="w-full max-w-4xl overflow-x-auto shadow-2xl rounded-lg bg-white text-black"
        style={{
          minHeight: loading ? "0" : "600px",
          display: htmlContent ? "none" : "block",
        }}
      />

      {/* Fallback HTML container if docx-preview fell back to mammoth */}
      {htmlContent && !loading && (
        <div className="w-full max-w-4xl p-8 sm:p-14 bg-white text-black shadow-2xl rounded-lg overflow-x-auto docx-html-view">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      )}
    </div>
  );
}
