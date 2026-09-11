import { list } from "@vercel/blob";
import TranscriptDocxViewer from "../../components/TranscriptDocxViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return {
    title: `Transcript - ${params.id}`,
    description: `Official Transcript Record`,
  };
}

async function getTranscriptBlobUrl(id) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  try {
    const { blobs } = await list({
      prefix: `transcripts/${id}/`,
    });

    const modifiedBlob =
      blobs.find((b) => b.pathname.includes("/modified-") && b.pathname.endsWith(".docx")) ||
      blobs.find((b) => b.pathname.endsWith(".docx"));

    return modifiedBlob?.downloadUrl || modifiedBlob?.url || null;
  } catch (err) {
    return null;
  }
}

export default async function TranscriptPage({ params }) {
  const { id } = params;
  const docxUrl = await getTranscriptBlobUrl(id);

  return (
    <main className="min-h-screen bg-[#121212] flex flex-col items-center justify-start p-2 sm:p-6">
      <TranscriptDocxViewer id={id} docxUrl={docxUrl} />
    </main>
  );
}
