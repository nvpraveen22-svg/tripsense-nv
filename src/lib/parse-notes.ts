// Several tables store supplementary facts (tips, difficulty, best season, toll
// breakdowns, ...) as prose inside a `description`-style column because the
// schema has no dedicated column for them. These helpers pull that structured
// data back out of text we generated in a consistent "Label: value." shape.

export interface ExtractedField {
  value: string | null;
  rest: string;
}

export function extractLabeled(text: string | null, label: string): ExtractedField {
  if (!text) return { value: null, rest: "" };
  const re = new RegExp(`${label}:\\s*([^.]+)\\.`, "i");
  const match = re.exec(text);
  if (!match || match.index == null) return { value: null, rest: text };
  const rest = (
    text.slice(0, match.index) + text.slice(match.index + match[0].length)
  )
    .replace(/\s+/g, " ")
    .trim();
  return { value: match[1].trim(), rest };
}

export interface TollPoint {
  name: string;
  amount: number;
  kmFromStart: number;
}

export interface TollBreakdown {
  points: TollPoint[];
  miscAmount: number | null;
}

export function parseTollBreakdown(routeDescription: string | null): TollBreakdown {
  if (!routeDescription) return { points: [], miscAmount: null };

  const points: TollPoint[] = [];
  const pointRe = /([A-Za-z][A-Za-z .]*?)\s*₹(\d+)\s*\((\d+)km\)/g;
  let match: RegExpExecArray | null;
  while ((match = pointRe.exec(routeDescription)) !== null) {
    points.push({
      name: match[1].trim(),
      amount: Number(match[2]),
      kmFromStart: Number(match[3]),
    });
  }

  const miscMatch = /roughly ₹(\d+) in miscellaneous/i.exec(routeDescription);
  const miscAmount = miscMatch ? Number(miscMatch[1]) : null;

  return { points, miscAmount };
}

export interface CostRange {
  min: number;
  max: number;
}

export function parseCostRange(text: string | null): CostRange | null {
  if (!text) return null;
  const match = /₹(\d[\d,]*)\s*-\s*(\d[\d,]*)/.exec(text);
  if (!match) return null;
  return {
    min: Number(match[1].replace(/,/g, "")),
    max: Number(match[2].replace(/,/g, "")),
  };
}

export function parseTaxiAddon(text: string | null): number {
  if (!text) return 0;
  const match = /plus ₹(\d[\d,]*)/.exec(text);
  return match ? Number(match[1].replace(/,/g, "")) : 0;
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
