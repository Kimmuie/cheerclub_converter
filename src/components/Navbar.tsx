"use client";

// src/components/Navbar.tsx
// Top navigation bar: logo/brand mark on the left, user avatar on the right.

import { LayoutGrid, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter(); 
  const goHome = () => { router.push("/"); };
  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-1">
      <button 
        className="flex items-center gap-3 cursor-pointer"
        onClick={goHome}>
        <img src="/logoNoBG.png" alt="CheerClub Converter Logo" className="h-12 w-12" />
        <span className="text-sm font-bold tracking-wide text-gray-900">
          CheerClub Converter
        </span>
      </button>

      {/* Hardcoded user avatar for now — wire up to auth/profile later */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full bg-red-800 text-white cursor-not-allowed"
        aria-label="Account"
      >
        <User className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </nav>
  );
}
