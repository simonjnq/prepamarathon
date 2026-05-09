import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  ClipboardList,
  FileText,
  Footprints,
  Home,
  LogOut,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { Avatar } from "@/components/avatar";
import type { SessionProfile } from "@/lib/auth";
import { SPECIALTY_LABELS } from "@/lib/labels";

type NavItem = { href: string; label: string; Icon: LucideIcon };

const PRACTITIONER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Vue d'ensemble", Icon: Home },
  { href: "/patients", label: "Patients", Icon: Users },
  { href: "/alerts", label: "Alertes", Icon: AlertTriangle },
  { href: "/agenda", label: "Mon agenda", Icon: Calendar },
];

const PATIENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Accueil", Icon: Home },
  { href: "/mon-parcours", label: "Mon parcours", Icon: Footprints },
  { href: "/mes-rdv", label: "Mes rendez-vous", Icon: Calendar },
  { href: "/mes-taches", label: "Mes tâches", Icon: CheckSquare },
  { href: "/mes-documents", label: "Mes documents", Icon: FileText },
  { href: "/mon-questionnaire", label: "Questionnaire", Icon: ClipboardList },
];

export function AppShell({
  profile,
  specialty,
  children,
}: {
  profile: SessionProfile;
  specialty?: string | null;
  children: React.ReactNode;
}) {
  const isPractitioner =
    profile.role === "practitioner" || profile.role === "admin";
  const nav = isPractitioner ? PRACTITIONER_NAV : PATIENT_NAV;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-line bg-surface lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-5 lg:px-6 lg:py-7">
          <div>
            <p className="font-accent text-base text-coral leading-none">
              Via Sana
            </p>
            <p className="mt-1 text-lg font-extrabold leading-none">
              PrépaMarathon
            </p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <Avatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              size={36}
            />
            <form action={logoutAction}>
              <button
                aria-label="Se déconnecter"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-muted hover:border-coral hover:text-coral"
              >
                <LogOut size={16} strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-3 lg:pb-3">
          {nav.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href as never}
              className="flex min-w-max items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-cream-soft hover:text-ink lg:min-w-0"
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden border-t border-line p-4 lg:block">
          <div className="flex items-center gap-3">
            <Avatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="truncate text-xs text-ink-light">
                {isPractitioner
                  ? specialty
                    ? SPECIALTY_LABELS[specialty] ?? specialty
                    : "Praticien"
                  : "Patient"}
              </p>
            </div>
          </div>
          <form action={logoutAction} className="mt-3">
            <button className="w-full rounded-sm border border-line bg-surface-warm px-3 py-2 text-xs font-bold text-ink-muted hover:border-coral hover:text-coral">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden bg-cream">
        <div className="mx-auto max-w-280 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
