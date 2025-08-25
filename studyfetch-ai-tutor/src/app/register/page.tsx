"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const { error } = await res.json();
      alert(error || "Failed to register");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <form
        onSubmit={handleRegister}
        className="bg-black p-6 rounded-md shadow-md w-96 border border-gray-700"
      >
        <h1 className="text-2xl mb-4 font-bold text-white">Register</h1>

        <input
          type="text"
          placeholder="Name"
          className="w-full mb-3 p-2 border border-gray-600 bg-black text-white rounded focus:outline-none focus:border-green-500 placeholder-gray-400"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          value={form.name}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border border-gray-600 bg-black text-white rounded focus:outline-none focus:border-green-500 placeholder-gray-400"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          value={form.email}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border border-gray-600 bg-black text-white rounded focus:outline-none focus:border-green-500 placeholder-gray-400"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          value={form.password}
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition mb-3"
        >
          Register
        </button>

        <p className="mt-3 text-sm text-white">
          Already have an account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Login
          </a>
        </p>

        {/* Back Button */}
        <Link
          href="/"
          className="inline-block mt-4 w-full text-center py-2 rounded border border-gray-600 text-white hover:bg-gray-800 transition"
        >
          ← Back to Home
        </Link>
      </form>
    </div>
  );
}