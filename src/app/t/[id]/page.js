import { list } from "@vercel/blob";
import TranscriptDocxViewer from "../../components/TranscriptDocxViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  return {
    title: `Transcript - ${params.id}`,
    description: `Official Transcript Record`,
  };
}

async function getTranscriptBlobData(id) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { docxUrl: null, photoBlobUrl: null };
  }

  try {
    const { blobs } = await list({
      prefix: `transcripts/${id}/`,
    });

    const modifiedBlob =
      blobs.find((b) => b.pathname.includes("/modified-") && b.pathname.endsWith(".docx")) ||
      blobs.find((b) => b.pathname.endsWith(".docx"));

    const photoBlob =
      blobs.find((b) => b.pathname.includes("/photo.") || b.pathname.includes("photo.jpg") || b.pathname.includes("photo.png"));

    return {
      docxUrl: modifiedBlob?.downloadUrl || modifiedBlob?.url || null,
      photoBlobUrl: photoBlob?.downloadUrl || photoBlob?.url || null,
    };
  } catch (err) {
    return { docxUrl: null, photoBlobUrl: null };
  }
}

export default async function TranscriptPage({ params }) {
  const { id } = params;
  const { docxUrl, photoBlobUrl } = await getTranscriptBlobData(id);

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-start p-2 sm:p-6 animate-unveil">
      <TranscriptDocxViewer id={id} docxUrl={docxUrl} photoBlobUrl={photoBlobUrl} />
    </main>
  );
}
