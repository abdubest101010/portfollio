"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function TranscriptToolPage() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const fileInputRef = useRef(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("transcript_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load history from localStorage:", e);
    }
  }, []);

  const saveToHistory = (item) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 10);
      try {
        localStorage.setItem("transcript_history", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save history:", e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem("transcript_history");
    } catch (e) {}
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    setResult(null);
    if (!selectedFile.name.toLowerCase().endsWith(".docx")) {
      setError("Please select a valid Word Document (.docx) file.");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a .docx file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call the API endpoint requesting JSON format with base64 for reliable instant download & display
      const response = await fetch("/api/process-transcript?format=json", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process transcript.");
      }

      // Automatically trigger download of the modified DOCX file
      let downloadUrl = "";
      if (data.modifiedBlobUrl) {
        downloadUrl = data.modifiedBlobUrl;
      } else if (data.modifiedDocxBase64) {
        const byteCharacters = atob(data.modifiedDocxBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        downloadUrl = URL.createObjectURL(blob);
      }

      const resultObj = {
        id: data.id,
        newQrUrl: data.newQrUrl,
        originalQrData: data.originalQrData,
        filename: data.filename || `modified-${file.name}`,
        downloadUrl: downloadUrl,
        modifiedBlobUrl: data.modifiedBlobUrl,
        timestamp: new Date().toISOString(),
      };

      setResult(resultObj);
      saveToHistory(resultObj);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while processing the file.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#121212] text-white">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-12 mt-28 mb-16 flex-1">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-600">
              Transcript QR Code
            </span>{" "}
            Replacer
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            Upload your school transcript DOCX file. The tool will automatically find the embedded
            QR code, replace it with a new QR pointing to your personal verification URL (
            <code className="text-primary-400">/t/[unique-id]</code>), and return the updated file ready for download.
          </p>
        </div>

        {/* Upload Container */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#181818] border border-[#33353F] rounded-2xl p-6 sm:p-8 shadow-xl">
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                dragActive
                  ? "border-primary-500 bg-purple-500/10"
                  : "border-gray-700 hover:border-gray-500 bg-[#121212]/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 mb-4 rounded-full bg-purple-900/30 border border-purple-600/30 flex items-center justify-center text-primary-400">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              {file ? (
                <div>
                  <p className="text-white font-medium text-lg mb-1">{file.name}</p>
                  <p className="text-gray-400 text-xs">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to process
                  </p>
                  <span className="inline-block mt-3 text-xs text-primary-400 underline">
                    Click to change file
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-white font-medium mb-1">
                    Drag and drop your <span className="text-primary-400">.docx</span> file here
                  </p>
                  <p className="text-gray-500 text-xs">or click to browse your computer</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-red-900/30 border border-red-700/50 text-red-300 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleProcess}
              disabled={!file || loading}
              className={`w-full mt-6 py-3.5 px-6 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 ${
                !file || loading
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  : "bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 shadow-lg shadow-purple-500/20"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Processing & Replacing QR Code...</span>
                </>
              ) : (
                <>
                  <span>Process Transcript & Replace QR</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>

            {/* Result Display */}
            {result && (
              <div className="mt-8 pt-6 border-t border-gray-800 animate-fadeIn">
                <div className="p-4 rounded-xl bg-green-950/40 border border-green-700/50 mb-6 flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-green-300 text-sm">
                      Success! QR Code Replaced
                    </h3>
                    <p className="text-green-400/80 text-xs mt-0.5">
                      Your updated transcript has been generated and download started.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="bg-[#121212] p-3 rounded-lg border border-gray-800 flex items-center justify-between">
                    <span className="text-gray-400">Generated ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary-400 font-semibold">{result.id}</span>
                      <button
                        onClick={() => copyToClipboard(result.id, "id")}
                        className="text-gray-400 hover:text-white px-2 py-0.5 bg-gray-800 rounded text-xs"
                      >
                        {copiedId ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#121212] p-3 rounded-lg border border-gray-800 flex flex-col gap-1.5">
                    <span className="text-gray-400">New Public QR Destination:</span>
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/t/${result.id}`}
                        target="_blank"
                        className="font-mono text-pink-400 hover:underline truncate text-xs"
                      >
                        {result.newQrUrl}
                      </Link>
                      <button
                        onClick={() => copyToClipboard(result.newQrUrl, "url")}
                        className="text-gray-400 hover:text-white px-2 py-0.5 bg-gray-800 rounded text-xs flex-shrink-0"
                      >
                        {copiedUrl ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {result.originalQrData && result.originalQrData !== "N/A" && (
                    <div className="bg-[#121212] p-3 rounded-lg border border-gray-800 flex flex-col gap-1">
                      <span className="text-gray-400">Detected School Original QR:</span>
                      <span className="font-mono text-gray-300 text-xs break-all">
                        {result.originalQrData}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  {result.downloadUrl && (
                    <a
                      href={result.downloadUrl}
                      download={result.filename}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-center font-semibold text-white text-sm shadow-md hover:opacity-90 transition"
                    >
                      Download Again (.docx)
                    </a>
                  )}
                  <Link
                    href={`/t/${result.id}`}
                    target="_blank"
                    className="flex-1 py-3 px-4 rounded-xl bg-[#222430] hover:bg-[#2b2e3d] text-center font-medium text-gray-200 text-sm border border-[#3b3e4f] transition"
                  >
                    Open Live Verification Page ↗
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* History List */}
          {history.length > 0 && (
            <div className="mt-10 bg-[#181818] border border-[#33353F] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Processed Documents</h2>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-red-400 transition"
                >
                  Clear History
                </button>
              </div>

              <div className="divide-y divide-gray-800">
                {history.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {item.filename || `Transcript #${item.id}`}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        ID: {item.id} • {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/t/${item.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-primary-400 hover:bg-gray-700 font-medium transition"
                      >
                        View Page
                      </Link>
                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          download={item.filename}
                          className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/40 text-purple-200 hover:bg-purple-800/40 font-medium transition"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
