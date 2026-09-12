// The destination's local language is derivable from its state, so this is a
// lookup rather than a stored column - avoids duplicating data that's
// already implied by `destinations.state`.

const STATE_LANGUAGE: Record<string, string> = {
  Karnataka: "Kannada",
  Goa: "Konkani",
  "Tamil Nadu": "Tamil",
  "Andhra Pradesh": "Telugu",
  Puducherry: "Tamil, French",
};

export function languageForState(state: string): string {
  return STATE_LANGUAGE[state] ?? "Hindi";
}

export type BudgetLevel = "Budget" | "Mid-range" | "Luxury";

// Derived from the destination's own hotel prices rather than a curated
// column, so it stays honest and in sync with the actual seeded data.
export function budgetLevelFromHotelPrices(avgPriceMin: number | null): BudgetLevel | null {
  if (avgPriceMin == null) return null;
  if (avgPriceMin < 3000) return "Budget";
  if (avgPriceMin <= 6000) return "Mid-range";
  return "Luxury";
}
