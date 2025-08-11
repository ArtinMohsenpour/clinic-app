// app/error.tsx

"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Caught by error.tsx boundary:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4 ">
      <h1 className="text-4xl font-bold mb-4 bg-white text-navbar-primary border-4 border-navbar-primary p-8 rounded-lg">
        خطای غیرمنتظره‌ای رخ داده است
      </h1>
      <p className="mb-6 p-5 bg-red-500/80  rounded-lg text-back">
        {error.message}
      </p>

      <button
        onClick={reset}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        تلاش دوباره
      </button>
    </div>
  );
}
