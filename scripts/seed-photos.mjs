// One-time seed script: resolves real Unsplash photos for destinations,
// attractions, hotels, and activities, and persists the URLs into Supabase.
//
// Run with: node --env-file=.env.local scripts/seed-photos.mjs
// Add --force to re-fetch photos even for rows that already have one.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const FORCE = process.argv.includes("--force");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !UNSPLASH_KEY) {
  console.error(
    "Missing env vars. Run with: node --env-file=.env.local scripts/seed-photos.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getUnsplashPhoto(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=1&orientation=landscape&client_id=${UNSPLASH_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  ⚠️  Unsplash request failed (${res.status}) for "${query}"`);
    return null;
  }
  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) return null;
  return { regular: photo.urls.regular, small: photo.urls.small };
}

const destinationQueries = {
  dandeli: "Dandeli forest river Karnataka India",
  goa: "Goa beach sunset India",
  gokarna: "Gokarna beach Karnataka India",
  coorg: "Coorg coffee plantation misty hills India",
  ooty: "Ooty tea garden Nilgiris India",
  kodaikanal: "Kodaikanal lake hills Tamil Nadu India",
  araku: "Araku Valley India",
  vizag: "Visakhapatnam beach Andhra Pradesh India",
  pondicherry: "Pondicherry France India",
};

const attractionQueries = {
  "Syntheri Rocks": "rock formation river Karnataka India",
  "Kavala Caves": "limestone cave",
  "Dandeli Wildlife Sanctuary": "wildlife jungle forest India tiger",
  "Supa Dam": "dam reservoir",
  "Ulavi Forest": "dense jungle forest Karnataka India",
  "Kali River": "river jungle western ghats India",
  "Crocodile Point": "river nature Karnataka India",
  "Anshi National Park": "national park forest wildlife India",
};

const hotelQueries = {
  "Evolve Back Kali Adventure Camp": "luxury jungle resort tented camp India",
  "The Bison Resort": "jungle resort India",
  "Old Magazine House": "heritage bungalow forest guesthouse India",
  "Jungle Retreat Dandeli": "jungle resort riverside India",
  "Dandeli Jungle Camp": "camping forest bonfire riverside India",
};

const activityQueries = {
  "White Water Rafting": "white water rafting river adventure India",
  "Jungle Safari (Jeep)": "jungle jeep safari wildlife India",
  Kayaking: "kayaking river India adventure",
  "Coracle Ride": "coracle boat river India",
  "Night Jungle Walk": "jungle night forest torch India",
  "Bird Watching": "birdwatching binoculars forest India",
  Zipline: "zipline forest canopy adventure India",
  Camping: "riverside camping bonfire stars India",
};

async function seedTable({
  table,
  selectCols,
  matchKey,
  queries,
  buildUpdate,
  hasPhoto,
  label,
}) {
  console.log(`\n${label}`);
  const { data: rows, error } = await supabase.from(table).select(selectCols);
  if (error) {
    console.error(`  ⚠️  Couldn't read ${table}:`, error.message);
    return;
  }

  for (const row of rows ?? []) {
    const key = row[matchKey];
    const query = queries[key];
    if (!query) continue;

    if (!FORCE && hasPhoto(row)) {
      console.log(`  ⏭  ${key} already has a photo, skipping`);
      continue;
    }

    console.log(`  📸 ${key}...`);
    const photos = await getUnsplashPhoto(query);
    if (!photos) {
      console.log(`  ✗  ${key}: no result`);
      continue;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(buildUpdate(photos))
      .eq("id", row.id);

    console.log(updateError ? `  ✗  ${key}: ${updateError.message}` : `  ✅ ${key} done`);

    // Stay well under Unsplash's 50 req/hour demo rate limit.
    await new Promise((r) => setTimeout(r, 300));
  }
}

async function main() {
  console.log("🚀 Seeding photos from Unsplash...");

  await seedTable({
    table: "destinations",
    selectCols: "id, slug, cover_image_url, hero_url",
    matchKey: "slug",
    queries: destinationQueries,
    buildUpdate: (p) => ({ cover_image_url: p.small, hero_url: p.regular }),
    hasPhoto: (row) => Boolean(row.cover_image_url && row.hero_url),
    label: "🌍 Destinations",
  });

  await seedTable({
    table: "attractions",
    selectCols: "id, name, photo_url",
    matchKey: "name",
    queries: attractionQueries,
    buildUpdate: (p) => ({ photo_url: p.small }),
    hasPhoto: (row) => Boolean(row.photo_url),
    label: "🏞️  Attractions",
  });

  await seedTable({
    table: "hotels",
    selectCols: "id, name, photo_url",
    matchKey: "name",
    queries: hotelQueries,
    buildUpdate: (p) => ({ photo_url: p.regular }),
    hasPhoto: (row) => Boolean(row.photo_url),
    label: "🏨 Hotels",
  });

  await seedTable({
    table: "activities",
    selectCols: "id, name, photo_url",
    matchKey: "name",
    queries: activityQueries,
    buildUpdate: (p) => ({ photo_url: p.small }),
    hasPhoto: (row) => Boolean(row.photo_url),
    label: "🎯 Activities",
  });

  console.log("\n✅ Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
