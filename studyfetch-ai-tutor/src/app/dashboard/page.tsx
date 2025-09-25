"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { extractTextFromPDF } from "@/lib/pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

type ChatRole = "user" | "assistant";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [docText, setDocText] = useState("");
  const [messages, setMessages] = useState<{ role: ChatRole; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [highlightSentences, setHighlightSentences] = useState<string[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return <p className="text-white">Loading...</p>;
  if (!session) return null;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  async function handleFileUpload(f: File) {
    setFile(f);
    const text = await extractTextFromPDF(f);
    setDocText(text);
    console.log("Extracted PDF text sample:", text.slice(0, 200) + "...");
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: "user" as ChatRole, content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, newMessage], context: docText }),
    });

    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let aiContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      aiContent += decoder.decode(value, { stream: true });

      // Update with raw streamed AI content
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

    // Parse <metadata> block AFTER streaming finishes
    try {
      const metadataMatch = aiContent.match(/<metadata>([\s\S]*?)<\/metadata>/);
      if (metadataMatch) {
        const jsonStr = metadataMatch[1].trim();
        const data = JSON.parse(jsonStr);

        // Clean visible message (remove metadata)
        const cleanedAnswer = aiContent.replace(metadataMatch[0], "").trim();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = cleanedAnswer;
          return updated;
        });

        // Apply metadata for PDF navigation/highlighting
        if (data.page) setPageNumber(data.page);
        if (data.sentence) setHighlightSentences([data.sentence]);
        if (data.sentences && Array.isArray(data.sentences)) {
          setHighlightSentences(data.sentences);
        }
      }
    } catch (err) {
      console.error("Failed to parse AI metadata:", err);
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
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await handleFileUpload(f);
            }}
            className="text-sm text-gray-300"
          />
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center">
          {file ? (
            <Document file={file} onLoadSuccess={onDocumentLoadSuccess} className="mx-auto">
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onRenderError={(error) => {
                  if (error?.name === "AbortException") return;
                  console.error("PDF render error:", error);
                }}
                customTextRenderer={({ str }) => {
                  if (highlightSentences.length > 0) {
                    for (const sentence of highlightSentences) {
                      if (sentence.includes(str)) {
                        return `<mark class="pdf-highlight">${str}</mark>`;
                      }
                    }
                  }
                  return str;
                }}
              />
            </Document>
          ) : (
            <p className="text-gray-400">Upload a PDF to view it here 📄</p>
          )}
        </div>

        {numPages && (
          <div className="flex justify-center items-center gap-4 p-2 border-t border-gray-700">
            <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">
              Prev
            </button>
            <p>Page {pageNumber} of {numPages}</p>
            <button onClick={() => setPageNumber((p) => Math.min(numPages!, p + 1))} disabled={pageNumber >= numPages!} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Chat Window */}
      <div className="w-1/3 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`p-2 rounded max-w-[80%] whitespace-pre-line ${msg.role === "user"
              ? "bg-blue-600 text-white ml-auto"
              : "bg-gray-700 text-gray-200 mr-auto"}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 flex">
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