"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="bg-gray-900 p-10 rounded-lg shadow-lg text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">
          Welcome to AI PDF Tutor 📚
        </h1>
        <p className="text-gray-300 mb-6">
          Upload PDFs and chat with your personal AI tutor.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}