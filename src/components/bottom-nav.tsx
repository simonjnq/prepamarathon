"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "./nav-icon";

export function BottomNav({
  items,
}: {
  items: Array<{ href: string; label: string; iconName: NavIconName }>;
}) {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map(({ href, label, iconName }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href as never}
            className={`flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] font-bold ${
              active ? "text-coral" : "text-ink-light"
            }`}
          >
            <NavIcon
              name={iconName}
              size={20}
              strokeWidth={active ? 2 : 1.75}
            />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
