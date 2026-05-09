"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase realtime changes on the given tables and refreshes
 * the current route's server data when something changes. Debounced to avoid
 * thrashing on bulk inserts (e.g. a seed run).
 */
export function RealtimeRefresh({
  tables,
  channel = "app-changes",
}: {
  tables: string[];
  channel?: string;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(channel);
    const queueRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 250);
    };
    for (const table of tables) {
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        queueRefresh,
      );
    }
    ch.subscribe();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, tables.join("|"), channel]);

  return null;
}
