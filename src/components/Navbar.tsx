"use client";

// src/components/Navbar.tsx
// Top navigation bar: logo/brand mark, page tabs (e.g. "Upload & Palette" /
// "Export PDF"), and user avatar. Pass the tab matching the current route
// with active: true so it renders as the highlighted pill.

import Link from "next/link";
import { LayoutGrid, User } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface NavbarProps {
  navItems?: NavItem[];
}

export default function Navbar({ navItems = [] }: NavbarProps) {
  return (
    <nav className="grid grid-cols-3 items-center border-b border-gray-200 bg-white px-6 py-1">
       {/* Left */}
      <div className="flex items-center gap-3">
         <img
          src="/logoNoBG.png"
          alt="CheerClub Converter Logo"
          className="h-12 w-12"
        />
        <span className="text-sm font-bold tracking-wide text-gray-900">
          CheerClub Converter
        </span>
      </div>

      {/* Center */}
      <div className="flex items-center justify-center gap-6">
        {navItems.map((item) =>
          item.active ? (
            <span
              key={item.label}
              className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-700"
            >
              {item.label}
            </span>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-900"
            >
              {item.label}
            </Link>
          )
        )}
      </div>

      {/* Right */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-full bg-red-800 text-white cursor-not-allowed justify-self-end"
        aria-label="Account"
      >
        <User className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </nav>
  );
}