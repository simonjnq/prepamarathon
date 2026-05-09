"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export function NavLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href as never}
      className={`flex min-w-max items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors lg:min-w-0 ${
        active
          ? "bg-coral-bg text-coral"
          : "text-ink-muted hover:bg-cream-soft hover:text-ink"
      }`}
    >
      <Icon size={18} strokeWidth={1.75} />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
