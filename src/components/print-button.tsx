"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Exporter PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-muted hover:border-coral hover:text-coral print:hidden"
    >
      <Printer size={13} strokeWidth={2} />
      {label}
    </button>
  );
}
