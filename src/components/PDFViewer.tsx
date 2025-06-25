"use client";
import React from "react";
import { Loader2 } from "lucide-react";

type Props = { pdf_url: string };

const PDFViewer = ({ pdf_url }: Props) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Reset states when URL changes
    setIsLoading(true);
    setError(null);
  }, [pdf_url]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError("Failed to load PDF. Please try again.");
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full bg-gray-50">
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* PDF Iframe */}
      <iframe
        src={`https://docs.google.com/gview?url=${pdf_url}&embedded=true`}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};

export default PDFViewer;
