"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface DestinationSuggestion {
  id: string;
  name: string;
  state: string;
  slug: string;
}

interface DestinationAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectExisting: (destination: DestinationSuggestion) => void;
  onSelectNew: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DestinationAutocomplete({
  id,
  value,
  onChange,
  onSelectExisting,
  onSelectNew,
  placeholder,
  disabled,
  className,
}: DestinationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<DestinationSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("destinations")
        .select("id, name, state, slug")
        .ilike("name", `%${query}%`)
        .limit(5);
      setResults((data ?? []) as DestinationSuggestion[]);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const trimmed = value.trim();
  const hasExactMatch = results.some((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  const showBuildNew = trimmed.length >= 3 && !hasExactMatch;
  const showDropdown = open && (results.length > 0 || showBuildNew);

  return (
    <div ref={containerRef} className="relative" style={{ isolation: "isolate" }}>
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        className={cn("w-full", className)}
      />
      {showDropdown && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          {results.map((dest) => (
            <li
              key={dest.id}
              onClick={() => {
                onSelectExisting(dest);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-accent"
            >
              <span className="truncate text-foreground">
                {dest.name} — {dest.state}
              </span>
              <Badge variant="destructive" className="shrink-0 text-[10px]">
                Already exists
              </Badge>
            </li>
          ))}
          {showBuildNew && (
            <li
              onClick={() => {
                onSelectNew(trimmed);
                setOpen(false);
              }}
              className="cursor-pointer border-t border-border px-3 py-2 text-sm font-medium text-primary hover:bg-accent"
            >
              ✨ Build &quot;{trimmed}&quot; as new destination
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
