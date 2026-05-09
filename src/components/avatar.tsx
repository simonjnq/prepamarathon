import { initials } from "@/lib/labels";

const palette = [
  "bg-coral-bg text-coral",
  "bg-leaf-bg text-leaf",
  "bg-stone-bg text-stone",
  "bg-amber-bg text-amber",
  "bg-cream-soft text-ink-muted",
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  firstName,
  lastName,
  size = 40,
  className = "",
}: {
  firstName?: string | null;
  lastName?: string | null;
  size?: number;
  className?: string;
}) {
  const seed = `${firstName ?? ""}${lastName ?? ""}`;
  const tone = palette[hash(seed) % palette.length];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold ${tone} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(firstName, lastName)}
    </span>
  );
}
