"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type ChatRole = "user" | "assistant";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null); // selected PDF
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [messages, setMessages] = useState<{ role: ChatRole; content: string }[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p className="text-white">Loading...</p>;
  }

  if (!session) return null;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: "user" as ChatRole, content: input };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // POST messages to /api/chat
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [...messages, newMessage] }),
    });

    if (!res.body) return;

    // Read the streaming response
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let aiContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      aiContent += decoder.decode(value, { stream: true });

      // Update AI message incrementally
      setMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.role === "assistant") {
          updated[updated.length - 1].content = aiContent;
        } else {
          updated.push({ role: "assistant", content: aiContent });
        }
        return updated;
      });
    }
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* LEFT: PDF Viewer */}
      <div className="flex-1 flex flex-col border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-gray-300"
          />
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center">
          {file ? (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              className="mx-auto"
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          ) : (
            <p className="text-gray-400">Upload a PDF to view it here 📄</p>
          )}
        </div>
        {numPages && (
          <div className="flex justify-center items-center gap-4 p-2 border-t border-gray-700">
            <button
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <p>
              Page {pageNumber} of {numPages}
            </p>
            <button
              onClick={() => setPageNumber((p) => Math.min(numPages!, p + 1))}
              disabled={pageNumber >= numPages!}
              className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Chat Window */}
      <div className="w-1/3 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded max-w-[80%] ${
                msg.role === "user"
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-700 text-gray-200 mr-auto"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-gray-700 flex"
        >
          <input
            type="text"
            className="flex-1 p-2 bg-black border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            placeholder="Ask something about the PDF..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="ml-2 px-4 bg-blue-600 rounded hover:bg-blue-700">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}