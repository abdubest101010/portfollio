"use client";

import React, { useEffect, useState } from "react";
import { parseDocxTranscript } from "../../lib/transcriptParser";
import GibsonTranscriptRenderer from "./GibsonTranscriptRenderer";

export default function TranscriptDocxViewer({ id, docxUrl, photoBlobUrl }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcriptData, setTranscriptData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAndParse() {
      try {
        setLoading(true);
        setError(null);

        const fileUrl = docxUrl || `/api/transcript/${id}/download`;
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Could not load the transcript document.");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Parse structured transcript data from DOCX
        const data = await parseDocxTranscript(arrayBuffer);

        if (photoBlobUrl && !data.photoDataUrl) {
          data.photoBlobUrl = photoBlobUrl;
        }

        if (isMounted) {
          setTranscriptData(data);
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

    loadAndParse();

    return () => {
      isMounted = false;
    };
  }, [id, docxUrl, photoBlobUrl]);

  return (
    <div className="w-full flex flex-col items-center min-h-screen bg-white text-black py-4 sm:py-8 px-2 sm:px-4">
      {loading && (
        <div className="flex flex-col items-center justify-center p-20 text-gray-500 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
          <p className="text-sm font-medium">Loading official transcript...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 max-w-lg bg-red-50 border border-red-300 rounded-xl text-center text-red-800 text-sm my-12">
          <p className="font-semibold mb-1">Document Load Notice</p>
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Main Document Viewport with Left-to-Right Horizontal Scrolling Support & Unveiling Animation */}
      {!loading && transcriptData && (
        <div className="w-full overflow-x-auto docx-scroll-wrapper pb-10 flex flex-col items-start sm:items-center animate-unveil">
          <div className="min-w-fit mx-auto">
            <GibsonTranscriptRenderer data={transcriptData} />
          </div>
        </div>
      )}
    </div>
  );
}
