"use client";

// src/components/Navbar.tsx
// Top navigation bar: logo/brand mark on the left, user avatar on the right.

import { LayoutGrid, User } from "lucide-react";
import { useRouter } from "next/navigation";

// in Navbar's props
interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  navLinks?: NavLink[];
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

export default function Navbar({ navLinks = [], actionLabel, onAction, actionDisabled }: NavbarProps) {
  const router = useRouter(); 
  const goHome = () => { router.push("/"); };
  return (
    <nav className="grid grid-cols-3 items-center border-b border-gray-200 bg-white px-6 py-1">
      {/* Left */}
      <button
        className="flex items-center gap-3 cursor-pointer justify-self-start"
        onClick={goHome}
      >
        <img
          src="/logoNoBG.png"
          alt="CheerClub Converter Logo"
          className="h-12 w-12"
        />
        <span className="text-sm font-bold tracking-wide text-gray-900">
          CheerClub Converter
        </span>
      </button>

      {/* Center */}
      <div className="flex items-center justify-center gap-6">
        {navLinks.map((link) => (
          <a
            key={link.label}
            className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 cursor-default"
          >
            {link.label}
          </a>
        ))}

        {actionLabel && (
          <button
            onClick={onAction}
            disabled={actionDisabled}
            className="text-xs font-semibold tracking-wide text-gray-500 hover:text-gray-900 cursor-pointer"
          >
            {actionLabel}
          </button>
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
