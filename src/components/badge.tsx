import type { ReactNode } from "react";

type Variant =
  | "neutral"
  | "coral"
  | "leaf"
  | "amber"
  | "rust"
  | "stone"
  | "soft";

const styles: Record<Variant, string> = {
  neutral: "bg-cream-soft text-ink-muted",
  coral: "bg-coral-bg text-coral",
  leaf: "bg-leaf-bg text-leaf",
  amber: "bg-amber-bg text-amber",
  rust: "bg-rust-bg text-rust",
  stone: "bg-stone-bg text-stone",
  soft: "bg-surface-warm text-ink-muted border border-line",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`badge ${styles[variant]} ${className}`}>{children}</span>
  );
}

export function statusBadgeVariant(
  s: "done" | "in_progress" | "upcoming" | string,
): Variant {
  if (s === "done") return "leaf";
  if (s === "in_progress") return "coral";
  return "neutral";
}

export function severityBadgeVariant(
  s: "info" | "warning" | "urgent" | string,
): Variant {
  if (s === "urgent") return "rust";
  if (s === "warning") return "amber";
  return "stone";
}
