"use client";

import React, { useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";

export type FeedbackType = "success" | "warning" | "info" | "error";

export interface FeedbackDetailItem {
  label: string;
  value: string;
  badge?: string;
  badgeColor?: "emerald" | "amber" | "blue" | "neutral" | "purple";
}

export interface ActionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: FeedbackType;
  title: string;
  description: string;
  details?: FeedbackDetailItem[];
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  autoCloseMs?: number;
}

export function ActionFeedbackModal({
  isOpen,
  onClose,
  type = "success",
  title,
  description,
  details,
  primaryAction,
  secondaryAction,
  autoCloseMs,
}: ActionFeedbackModalProps) {
  useEffect(() => {
    if (!isOpen || !autoCloseMs) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [isOpen, autoCloseMs, onClose]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Visual cues based on feedback type
  const iconConfig = {
    success: {
      icon: CheckCircle2,
      bgClass: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60",
      accentBorder: "border-emerald-500/20",
    },
    warning: {
      icon: AlertTriangle,
      bgClass: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60",
      accentBorder: "border-amber-500/20",
    },
    info: {
      icon: Clock,
      bgClass: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60",
      accentBorder: "border-blue-500/20",
    },
    error: {
      icon: XCircle,
      bgClass: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60",
      accentBorder: "border-rose-500/20",
    },
  }[type];

  const Icon = iconConfig.icon;

  const getBadgeStyle = (color?: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "amber":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "purple":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800";
      case "blue":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={`relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 font-sans`}
      >
        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Type Icon */}
        <div className="flex items-start gap-4">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${iconConfig.bgClass}`}
          >
            <Icon className="w-6 h-6" />
          </div>

          <div className="space-y-1 pr-6">
            <h3
              id="feedback-modal-title"
              className="text-lg font-bold tracking-tight text-[#171717] dark:text-[#ededed]"
            >
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#a1a1a1] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Optional Key Details Summary Table/Grid */}
        {details && details.length > 0 && (
          <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/60 dark:bg-neutral-900/40 p-3.5 space-y-2 text-xs">
            {details.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1 border-b last:border-b-0 border-neutral-200/50 dark:border-neutral-800/50 text-xs"
              >
                <span className="text-[#737373] dark:text-[#a1a1a1] font-medium">
                  {item.label}
                </span>
                <div className="flex items-center gap-2 font-mono font-medium text-[#171717] dark:text-[#ededed]">
                  <span>{item.value}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-sans font-semibold ${getBadgeStyle(
                        item.badgeColor
                      )}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2">
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                onClick={() => {
                  secondaryAction.onClick?.();
                  onClose();
                }}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  secondaryAction.onClick?.();
                  onClose();
                }}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer"
              >
                {secondaryAction.label}
              </button>
            )
          )}

          {primaryAction ? (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                onClick={() => {
                  primaryAction.onClick?.();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#0761d1] text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>{primaryAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  primaryAction.onClick?.();
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0070f3] hover:bg-[#0761d1] text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <span>{primaryAction.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Understood
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
