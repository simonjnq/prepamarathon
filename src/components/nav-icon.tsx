"use client";

import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  ClipboardList,
  FileText,
  Footprints,
  Home,
  Users,
} from "lucide-react";

export type NavIconName =
  | "home"
  | "users"
  | "alert"
  | "calendar"
  | "footprints"
  | "check"
  | "file"
  | "clipboard";

const MAP = {
  home: Home,
  users: Users,
  alert: AlertTriangle,
  calendar: Calendar,
  footprints: Footprints,
  check: CheckSquare,
  file: FileText,
  clipboard: ClipboardList,
} as const;

export function NavIcon({
  name,
  size,
  strokeWidth,
}: {
  name: NavIconName;
  size?: number;
  strokeWidth?: number;
}) {
  const C = MAP[name];
  return <C size={size} strokeWidth={strokeWidth} />;
}
