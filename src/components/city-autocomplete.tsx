"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { matchCities } from "@/lib/indian-cities";
import { cn } from "@/lib/utils";

interface CityAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export function CityAutocomplete({
  id,
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => matchCities(value), [value]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function selectCity(city: string) {
    onChange(city);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ isolation: "isolate" }}
    >
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
          } else if (e.key === "Enter") {
            setOpen(false);
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-[100] overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          {suggestions.map((city) => (
            <li
              key={city}
              onClick={() => selectCity(city)}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
