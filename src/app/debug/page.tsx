"use client";
import { useState } from "react";
import axios from "axios";

export default function DebugPage() {
  const [fileKey, setFileKey] = useState("1750872218897-pneumoniadetection__3___2___2__docx.pdf");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [embeddingResult, setEmbeddingResult] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [pdfTextResult, setPdfTextResult] = useState<any>(null);

  const debugPinecone = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/debug-pinecone", { fileKey });
      setResult(response.data);
    } catch (error: any) {
      setResult({ error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  const testEmbeddings = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/test-embeddings", {
        text: "This is a test text for embedding generation"
      });
      setEmbeddingResult(response.data);
    } catch (error: any) {
      setEmbeddingResult({ error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  const debugUpload = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/debug-upload", { fileKey });
      setUploadResult(response.data);
    } catch (error: any) {
      setUploadResult({ error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  const debugPdfText = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/debug-pdf-text", { fileKey });
      setPdfTextResult(response.data);
    } catch (error: any) {
      setPdfTextResult({ error: error.response?.data || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Pinecone</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">File Key:</label>
        <input
          type="text"
          value={fileKey}
          onChange={(e) => setFileKey(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter file key to debug"
        />
      </div>

      <div className="space-x-4">
        <button
          onClick={debugPinecone}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Debugging..." : "Debug Pinecone"}
        </button>

        <button
          onClick={testEmbeddings}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Embeddings"}
        </button>

        <button
          onClick={debugUpload}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Debug Upload Process"}
        </button>

        <button
          onClick={debugPdfText}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? "Debugging..." : "Debug PDF Text"}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Pinecone Debug Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {embeddingResult && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Embedding Test Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(embeddingResult, null, 2)}
          </pre>
        </div>
      )}

      {uploadResult && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Upload Debug Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(uploadResult, null, 2)}
          </pre>
        </div>
      )}

      {pdfTextResult && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">PDF Text Extraction Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(pdfTextResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
