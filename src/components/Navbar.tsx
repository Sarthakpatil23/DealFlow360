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
      <NavBody className="border border-white/40 bg-white/80 shadow-whisper backdrop-blur-md">
        {/* Animated Sliding Hover Nav Links */}
        <NavItems items={navItems} />

        {/* Action Controls */}
        <div className="relative z-20 flex items-center">
          <NavbarButton
            variant="primary"
            href="#login"
            className="text-xs px-3.5 py-1.5 font-medium rounded-sm border border-[#ebebeb] bg-white text-[#171717] hover:bg-[#fafafa]"
          >
            Log In
          </NavbarButton>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav className="border border-white/40 bg-white/90 shadow-floating backdrop-blur-md">
        <MobileNavHeader className="flex w-full items-center justify-between px-2">
          <span className="font-mono text-xs text-[#171717] font-semibold">MENU</span>
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-medium text-[#4d4d4d] hover:text-[#171717] py-1"
            >
              <span>{item.name}</span>
            </a>
          ))}

          <div className="flex w-full flex-col gap-2 pt-3 border-t border-[#ebebeb]">
            <NavbarButton
              onClick={() => setIsMobileMenuOpen(false)}
              variant="primary"
              className="w-full justify-center py-2 text-sm text-[#171717] border border-[#ebebeb] bg-white"
              href="#login"
            >
              Log In
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbarRoot>
  );
}
