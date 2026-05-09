"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "./nav-icon";

export function NavLink({
  href,
  label,
  iconName,
}: {
  href: string;
  label: string;
  iconName: NavIconName;
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
      <NavIcon name={iconName} size={18} strokeWidth={1.75} />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
