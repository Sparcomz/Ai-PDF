"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      alert("Invalid email or password");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <form
        onSubmit={handleLogin}
        className="bg-black p-6 rounded-md shadow-md w-96 border border-gray-700"
      >
        <h1 className="text-2xl mb-4 font-bold text-white">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border border-gray-600 bg-black text-white rounded focus:outline-none focus:border-blue-500 placeholder-gray-400"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border border-gray-600 bg-black text-white rounded focus:outline-none focus:border-blue-500 placeholder-gray-400"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mb-3"
        >
          Login
        </button>

        <p className="mt-3 text-sm text-white">
          No account?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Register here
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