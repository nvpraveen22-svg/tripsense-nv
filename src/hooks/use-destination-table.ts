"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types";

type TableName = keyof Database["public"]["Tables"];
type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];

const untypedSupabase = supabase as unknown as SupabaseClient;

interface UseDestinationTableResult<T extends TableName> {
  data: Row<T>[];
  loading: boolean;
  error: string | null;
}

export function useDestinationTable<T extends TableName>(
  table: T,
  destinationId: string | undefined,
  orderColumn: string = "display_order"
): UseDestinationTableResult<T> {
  const [data, setData] = useState<Row<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destinationId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const { data: rows, error: fetchError } = await untypedSupabase
        .from(table)
        .select("*")
        .eq("destination_id", destinationId as string)
        .order(orderColumn, { ascending: true, nullsFirst: false });

      if (cancelled) return;

      if (fetchError) {
        setError("Couldn't load this section. Please try again.");
        setData([]);
      } else {
        setData((rows ?? []) as Row<T>[]);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [table, destinationId, orderColumn]);

  return { data, loading, error };
}
