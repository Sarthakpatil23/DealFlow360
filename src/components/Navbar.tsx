"use client";

import React, { useState } from "react";
import {
  Navbar as ResizableNavbarRoot,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavbarButton,
} from "@/components/ui/resizable-navbar";

interface NavbarProps {
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export function Navbar({}: NavbarProps = {}) {
  const navItems = [
    { name: "CPQ Engine", link: "#cpq-engine" },
    { name: "Approval Chains", link: "#approvals" },
    { name: "Margin Intel", link: "#margin-intel" },
    { name: "Specs", link: "#specs" },
    { name: "Pricing", link: "#pricing" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ResizableNavbarRoot className="fixed inset-x-0 top-5 z-50 w-full flex justify-center px-4">
      {/* Desktop Navigation: compact centered floating pill */}
      <NavBody className="border border-white/20 bg-neutral-950/70 shadow-[0_4px_24px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.1)_inset] backdrop-blur-md">
        {/* Animated Sliding Hover Nav Links */}
        <NavItems items={navItems} />

        {/* Action Controls */}
        <div className="relative z-20 flex items-center">
          <NavbarButton
            variant="primary"
            href="/login"
            className="text-xs px-3.5 py-1.5 font-semibold rounded-sm bg-white text-[#171717] hover:bg-neutral-100 border border-white/20 shadow-sm transition-all"
          >
            Log In
          </NavbarButton>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav className="border border-white/20 bg-neutral-950/75 shadow-[0_4px_24px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.1)_inset] backdrop-blur-md">
        <MobileNavHeader className="flex w-full items-center justify-between px-2">
          <span className="font-mono text-xs text-white/90 font-semibold tracking-wider">MENU</span>
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          className="border border-white/15 bg-neutral-950/95 shadow-2xl backdrop-blur-xl text-white"
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-md transition-colors w-full"
            >
              <span>{item.name}</span>
            </a>
          ))}

          <div className="flex w-full flex-col gap-2 pt-3 border-t border-white/15">
            <NavbarButton
              onClick={() => setIsMobileMenuOpen(false)}
              variant="primary"
              className="w-full justify-center py-2 text-sm text-[#171717] bg-white hover:bg-neutral-100 font-semibold rounded-sm shadow-sm border border-white/20"
              href="/login"
            >
              Log In
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbarRoot>
  );
}
