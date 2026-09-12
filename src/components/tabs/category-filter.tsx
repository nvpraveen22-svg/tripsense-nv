import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

function toLabel(category: string): string {
  if (category === "all") return "All";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function CategoryFilter({ categories, active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {["all", ...categories].map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            "flex-none rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            active === category
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {toLabel(category)}
        </button>
      ))}
    </div>
  );
}
