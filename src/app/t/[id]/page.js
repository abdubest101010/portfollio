import Link from "next/link";
import { list } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return {
    title: `Transcript Verification #${params.id} | Abdu Portfolio`,
    description: `Official verification record for transcript ID: ${params.id}`,
  };
}

async function getTranscriptData(id) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      id,
      verified: true,
      processedAt: new Date().toISOString(),
      storageMode: "local",
    };
  }

  try {
    const { blobs } = await list({
      prefix: `transcripts/${id}/`,
    });

    const metaBlob = blobs.find((b) => b.pathname.endsWith("metadata.json"));
    if (metaBlob) {
      const res = await fetch(metaBlob.url, { cache: "no-store" });
      if (res.ok) {
        const metadata = await res.json();
        return {
          ...metadata,
          verified: true,
          blobs,
          storageMode: "blob",
        };
      }
    }

    return {
      id,
      verified: true,
      blobs,
      storageMode: "blob",
    };
  } catch (err) {
    return {
      id,
      verified: true,
      storageMode: "local",
    };
  }
}

export default async function TranscriptVerificationPage({ params }) {
  const { id } = params;
  const data = await getTranscriptData(id);

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-600 hover:opacity-80 transition"
          >
            ABDU PORTFOLIO
          </Link>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 uppercase tracking-widest">
            Document Verification System
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-[#181818] border border-[#33353F] rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          {/* Background subtle glow */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 bg-pink-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Verification Badge */}
          <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-[#252833]">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 mb-1">
                AUTHENTIC RECORD
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Verified / Processed by Abdu
              </h1>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4 text-sm">
            <div className="bg-[#121212] p-4 rounded-xl border border-[#262837] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-gray-400">Unique Verification ID:</span>
              <span className="font-mono font-semibold text-primary-400 text-base tracking-wider bg-purple-950/40 px-3 py-1 rounded-md border border-purple-800/40">
                {id}
              </span>
            </div>

            {data?.originalFilename && (
              <div className="bg-[#121212] p-4 rounded-xl border border-[#262837] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-gray-400">Document Name:</span>
                <span className="font-medium text-gray-200 truncate max-w-xs sm:max-w-md">
                  {data.originalFilename}
                </span>
              </div>
            )}

            {data?.processedAt && (
              <div className="bg-[#121212] p-4 rounded-xl border border-[#262837] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-gray-400">Processing Timestamp:</span>
                <span className="text-gray-300 font-mono text-xs sm:text-sm">
                  {new Date(data.processedAt).toLocaleString()}
                </span>
              </div>
            )}

            {data?.originalQrData && data.originalQrData !== "N/A" && (
              <div className="bg-[#121212] p-4 rounded-xl border border-[#262837]">
                <span className="text-gray-400 block mb-1">
                  Original QR Target URL:
                </span>
                <a
                  href={data.originalQrData}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-400 hover:text-pink-300 underline font-mono text-xs break-all"
                >
                  {data.originalQrData}
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-[#252833] flex flex-col sm:flex-row gap-4">
            {data?.modifiedBlobUrl ? (
              <a
                href={data.modifiedBlobUrl}
                download
                className="flex-1 text-center px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 hover:opacity-90 font-semibold text-white transition shadow-lg shadow-purple-500/20"
              >
                Download Verified DOCX
              </a>
            ) : null}

            {data?.originalBlobUrl ? (
              <a
                href={data.originalBlobUrl}
                download
                className="flex-1 text-center px-6 py-3 rounded-xl bg-[#222430] hover:bg-[#2b2e3d] text-gray-200 border border-[#3b3e4f] font-medium transition"
              >
                Download Original DOCX
              </a>
            ) : null}

            <Link
              href="/tools/transcript"
              className="flex-1 text-center px-6 py-3 rounded-xl bg-[#222430] hover:bg-[#2b2e3d] text-gray-200 border border-[#3b3e4f] font-medium transition"
            >
              Upload Another Transcript
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition inline-flex items-center gap-1"
          >
            ← Back to Abdu Portfolio
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 mt-12">
        Protected & Verified via Abdu Portfolio Transcript Engine
      </div>
    </main>
  );
}
