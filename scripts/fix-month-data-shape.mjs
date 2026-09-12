// One-time correction: scripts/seed-month-data.mjs seeded full month names
// ("October") instead of the 3-letter abbreviations the app's MonthCalendar
// component matches against ("Oct"), stored month_notes as a plain string
// instead of a {"range label": "note"} object, used slug "araku-valley"
// instead of this app's actual slug "araku" (so Araku never got seeded),
// and never set best_time_to_visit for Dandeli. This fixes all four in place.
//
// Run with: node --env-file=.env.local scripts/fix-month-data-shape.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars. Run with: node --env-file=.env.local scripts/fix-month-data-shape.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MONTH_ABBR = {
  January: "Jan",
  February: "Feb",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Jun",
  July: "Jul",
  August: "Aug",
  September: "Sep",
  October: "Oct",
  November: "Nov",
  December: "Dec",
};

function toAbbr(months) {
  return (months ?? []).map((m) => MONTH_ABBR[m] ?? m);
}

function rangeLabel(months) {
  const abbrs = toAbbr(months);
  if (abbrs.length === 0) return null;
  if (abbrs.length <= 2) return abbrs.join(", ");
  return `${abbrs[0]}-${abbrs[abbrs.length - 1]}`;
}

// Corrected data: same month groupings the original script chose (so the
// underlying judgment calls aren't second-guessed), just reshaped, plus
// the missing Araku Valley entry (correct slug) and Dandeli's
// best_time_to_visit.
const FIXES = [
  {
    slug: "dandeli",
    best_time_to_visit: "Oct-Mar",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "May"],
    avoid_months: ["June", "July", "August", "September"],
    notes: {
      best: "Perfect weather, all activities open",
      okay: "Hot but manageable",
      avoid: "Heavy monsoon, rafting closed, leeches",
    },
  },
  {
    slug: "goa",
    best_months: ["November", "December", "January", "February", "March"],
    okay_months: ["October", "April"],
    avoid_months: ["May", "June", "July", "August", "September"],
    notes: {
      best: "Peak season, all beach shacks and water sports open",
      okay: "Shoulder season, fewer crowds, some operators open",
      avoid: "Monsoon - most shacks and water sports shut down; May is very humid pre-monsoon",
    },
  },
  {
    slug: "gokarna",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    notes: {
      best: "Calm seas, pleasant beach weather",
      okay: "Transitional - warm but manageable",
      avoid: "Heavy monsoon rain, dangerous beaches, slippery trek paths",
    },
  },
  {
    slug: "coorg",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    notes: {
      best: "Lush coffee estates, mist-covered hills, best sightseeing",
      okay: "Warm transitional months",
      avoid: "Heaviest rainfall, roads to Talacauvery and Abbey Falls can be blocked",
    },
  },
  {
    slug: "ooty",
    best_time_to_visit: "Oct-Nov, Mar-May",
    best_months: ["October", "November", "March", "April", "May"],
    okay_months: ["December", "January", "February"],
    avoid_months: ["June", "July", "August", "September"],
    notes: {
      best: "Peak season, Flower Show in May, pleasant weather",
      okay: "Cold (down to 5C at night) but clear and scenic",
      avoid: "Heavy south-west monsoon",
    },
  },
  {
    slug: "kodaikanal",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    notes: {
      best: "Lighter rain, clear and beautiful, cold but scenic winters",
      okay: "Warm transitional months",
      avoid: "Heavy fog and rain from both monsoons reduce visibility",
    },
  },
  {
    slug: "araku",
    best_time_to_visit: "Oct-Mar",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["June", "July", "August"],
    notes: {
      best: "Coffee and orange harvest season, best toy train views",
      okay: "Warm transitional months",
      avoid: "Heavy monsoon rainfall makes roads difficult",
    },
  },
  {
    slug: "vizag",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    notes: {
      best: "Pleasant for beaches and Araku day trips",
      okay: "Warm but manageable",
      avoid: "Very hot and humid, monsoon and cyclone risk",
    },
  },
  {
    slug: "pondicherry",
    best_time_to_visit: "Jan-Mar, Oct-Nov",
    best_months: ["January", "February", "March", "October", "November"],
    okay_months: ["December", "April"],
    avoid_months: ["May", "June", "July", "August", "September"],
    notes: {
      best: "Sweet spot weather for beaches, cycling and Auroville",
      okay: "Mild north-east monsoon rain or approaching heat",
      avoid: "Peak heat (38C+) into monsoon season",
    },
  },
];

async function run() {
  console.log(`Fixing month data shape for ${FIXES.length} destinations...\n`);

  for (const fix of FIXES) {
    const { data: rows, error: lookupError } = await supabase
      .from("destinations")
      .select("id, name")
      .eq("slug", fix.slug)
      .limit(1);

    const dest = rows?.[0];
    if (lookupError || !dest) {
      console.error(`  ✗ ${fix.slug}: not found (${lookupError?.message ?? "no row"})`);
      continue;
    }

    const bestLabel = rangeLabel(fix.best_months);
    const okayLabel = rangeLabel(fix.okay_months);
    const avoidLabel = rangeLabel(fix.avoid_months);

    const month_notes = {
      ...(bestLabel ? { [bestLabel]: fix.notes.best } : {}),
      ...(okayLabel ? { [okayLabel]: fix.notes.okay } : {}),
      ...(avoidLabel ? { [avoidLabel]: fix.notes.avoid } : {}),
    };

    const update = {
      best_months: toAbbr(fix.best_months),
      okay_months: toAbbr(fix.okay_months),
      avoid_months: toAbbr(fix.avoid_months),
      month_notes,
      ...(fix.best_time_to_visit ? { best_time_to_visit: fix.best_time_to_visit } : {}),
    };

    const { error: updateError } = await supabase
      .from("destinations")
      .update(update)
      .eq("id", dest.id);

    if (updateError) {
      console.error(`  ✗ ${dest.name} (${fix.slug}): ${updateError.message}`);
    } else {
      console.log(`  ✓ ${dest.name} (${fix.slug}): fixed`);
    }
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
