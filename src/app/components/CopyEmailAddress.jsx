import { useState } from "react";

export default function CopyEmail() {
  const [copied, setCopied] = useState(false);

  const email="abdulkadre04@gmail.com";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="flex flex-col items-center ml-2">
      <button
        onClick={copyToClipboard}
        className="bg-blue-500 text-white px-6 py-2 rounded-md font-semibold shadow-md hover:bg-blue-600 transition"
      >
        {copied ? "Copied!" : "Copy Email Address"}
      </button>

      

      {copied && (
        <div className="text-green-500 mt-2">
          Email copied to clipboard!
        </div>
      )}
    </div>
  );
}
