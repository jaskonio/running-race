"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

interface HeaderNavProps {
  links: NavLink[];
}

export default function HeaderNav({ links }: HeaderNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-6">
      <a
        href="/"
        className="text-xl font-bold text-[#FFD600] font-[family-name:var(--font-heading)]"
      >
        R3000
      </a>

      {/* Desktop nav */}
      <nav className="hidden sm:flex items-center gap-4">
        {links.map((link) =>
          link.active ? (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#F5F5F5] border-b-2 border-[#FFD600] pb-0.5"
            >
              {link.label}
            </a>
          ) : (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#F5F5F5]"
            >
              {link.label}
            </a>
          )
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="sm:hidden p-1 text-[#A1A1AA] hover:text-[#F5F5F5]"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-[65px] z-50 border-b border-[#27272A] bg-[#18181B] sm:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            {links.map((link) =>
              link.active ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg bg-[#FFD600]/10 px-4 py-2.5 text-sm font-medium text-[#FFD600]"
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-[#A1A1AA] transition-colors hover:bg-[#27272A] hover:text-[#F5F5F5]"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
