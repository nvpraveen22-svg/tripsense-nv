// Run with: node --env-file=.env.local scripts/seed-mulki.mjs
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Upsert destination
const { data: dest, error: destError } = await supabase
  .from("destinations")
  .upsert({
    name: "Mulki",
    slug: "mulki",
    state: "Karnataka",
    tagline: "India's Surfing Capital",
    description: "A laid-back coastal town where the Shambhavi River meets the Arabian Sea, 30km north of Mangalore. Home to Mantra Surf Club — India's original and most famous surf school — Mulki draws surfers, kayakers, and beach lovers seeking an uncrowded, authentic Karnataka coast experience.",
    best_time_to_visit: "October to February",
    ideal_trip_days_min: 2,
    ideal_trip_days_max: 3,
    latitude: 13.0631,
    longitude: 74.7902,
    status: "active",
    best_months: ["October","November","December","January","February"],
    okay_months: ["March","April","September"],
    avoid_months: ["May","June","July","August"],
    month_notes: "Monsoon (Jun–Aug) brings rough seas and water sports shut down completely. May is pre-monsoon and very humid. September is transitional — some operators start opening. October to February is peak season with calm seas and consistent surf.",
    history_culture: "Mulki sits at the mouth of the Shambhavi River on the Karnataka Konkan coast, a region shaped by centuries of maritime trade and the Tulu cultural identity. The Sri Durga Parameshwari Temple here is one of the most revered shrines in coastal Karnataka, drawing pilgrims from across the region. The surrounding villages practice Yakshagana — an ancient theatre form combining dance, music, and elaborate costume unique to coastal Karnataka — and Bhootha Kola, a ritual spirit worship ceremony. Mulki entered the national spotlight in 2005 when Mantra Surf Club opened here, transforming the quiet fishing village into India's first dedicated surf destination."
  }, { onConflict: "slug" })
  .select("id, name")
  .single();

if (destError) { console.error("Destination upsert failed:", destError.message); process.exit(1); }
console.log("✓ Destination:", dest.name, dest.id);
const destinationId = dest.id;

// Helper
async function seedRows(table, rows, withSortOrder = false) {
  let sortOrder = 1;
  for (const row of rows) {
    const { data: existing } = await supabase.from(table).select("id").eq("destination_id", destinationId).eq("name", row.name).maybeSingle();
    if (existing) { console.log(`  ⏭ skipped: ${row.name}`); sortOrder++; continue; }
    const payload = { ...row, destination_id: destinationId, ...(withSortOrder ? { sort_order: sortOrder } : {}) };
    const { error } = await supabase.from(table).insert(payload);
    if (error) console.error(`  ✗ ${row.name}:`, error.message);
    else console.log(`  ✓ inserted: ${row.name}`);
    sortOrder++;
  }
}

// 2. Attractions
console.log("\nAttractions:");
await seedRows("attractions", [
  { name: "Sasihithlu Beach", category: "beach", description: "The main surf beach where the Shambhavi River meets the Arabian Sea — a unique estuary setting with consistent 2–3ft waves, clean sand, and dolphins regularly spotted offshore. Best time: Oct–Feb. Tip: arrive early morning for the best waves and fewer people.", distance_from_center_km: 3, entry_fee_adult: 0, entry_fee_child: 0, timings: "24 hours", duration_hours: 3, rating: 4.5 },
  { name: "Mantra Surf Club", category: "adventure", description: "India's original and most famous surf school, founded in 2005, offering beginner to advanced lessons, board rental, yoga, and SUP. The place that put Mulki on the map. Best time: Oct–Feb. Tip: book lessons at least a day ahead in peak season.", distance_from_center_km: 3, entry_fee_adult: 0, entry_fee_child: 0, timings: "7AM-6PM", duration_hours: 3, rating: 4.6 },
  { name: "Shambhavi River", category: "nature", description: "A calm, wide river estuary ideal for kayaking, paddleboarding, and sunset boat rides — sheltered from ocean swells, making it perfect for beginners and families. Best time: Oct–Mar. Tip: the river mouth at golden hour is one of Karnataka's most photogenic spots.", distance_from_center_km: 2, entry_fee_adult: 0, entry_fee_child: 0, timings: "6AM-7PM", duration_hours: 2, rating: 4.4 },
  { name: "Sri Durga Parameshwari Temple", category: "heritage", description: "One of the most revered temples on the Karnataka coast, dedicated to Goddess Durga Parameshwari, drawing pilgrims from across the Tulu Nadu region. Best time: Oct–Mar. Tip: the annual Brahmakalashotsava festival draws huge crowds — plan around or for it.", distance_from_center_km: 1, entry_fee_adult: 0, entry_fee_child: 0, timings: "6AM-8PM", duration_hours: 1, rating: 4.3 },
  { name: "Kadike Beach", category: "beach", description: "A quieter, less-visited beach just south of Sasihithlu, backed by coconut groves and fishing villages — ideal for a peaceful walk away from the surf crowd. Best time: Oct–Feb. Tip: visit in the morning when local fishing boats return with the catch.", distance_from_center_km: 5, entry_fee_adult: 0, entry_fee_child: 0, timings: "24 hours", duration_hours: 1.5, rating: 4.1 },
  { name: "Pilikula Nisargadhama", category: "nature", description: "An eco-tourism park 20km away near Mangalore with a zoo, botanical garden, boating lake, and heritage village — good add-on for families with children. Best time: Oct–Mar. Tip: allow at least half a day, the park is large.", distance_from_center_km: 22, entry_fee_adult: 60, entry_fee_child: 30, timings: "9AM-5:30PM", duration_hours: 3, rating: 4.0 },
], true);

// 3. Hotels
console.log("\nHotels:");
await seedRows("hotels", [
  { name: "Mantra Surf Club Stay", stars: 3, rating: 4.4, price_min: 2500, price_max: 5000, address: "Sasihithlu Beach, Mulki", amenities: ["Beachfront", "Surf Lessons Included", "Yoga", "Restaurant", "WiFi"], ai_summary: "Stay right at the surf club — accommodation, lessons, and board rental all in one place. 780 reviews. Tip: the surf packages (stay + lessons) are better value than booking separately." },
  { name: "The Kama by Nitesh Hotels", stars: 4, rating: 4.3, price_min: 5500, price_max: 9000, address: "NH66, Mulki", amenities: ["Pool", "Restaurant", "WiFi", "Parking", "River View"], ai_summary: "The most upscale property near Mulki with a pool and solid restaurant. 420 reviews. Tip: 10 minutes from the beach — good if you want comfort over proximity to surf." },
  { name: "Zostel Mulki", stars: 3, rating: 4.2, price_min: 800, price_max: 2200, address: "Near Sasihithlu Beach, Mulki", amenities: ["Dorms & Private Rooms", "Common Lounge", "WiFi", "Surf Desk"], ai_summary: "The social backpacker choice, popular with young surfers and solo travellers. 610 reviews. Tip: dorm beds sell out in peak season — book at least a week ahead." },
  { name: "Sea View Home Stay", stars: 3, rating: 4.0, price_min: 1200, price_max: 2500, address: "Kadike Village, Mulki", amenities: ["Home Cooked Meals", "Sea View", "Parking"], ai_summary: "A family-run homestay with the best home-cooked Mangalorean seafood meals in the area. 190 reviews. Tip: tell them a day ahead if you want fish curry for dinner — they buy fresh from the market." },
]);

// 4. Activities
console.log("\nActivities:");
await seedRows("activities", [
  { name: "Surf Lessons (Beginner)", category: "adventure", description: "A 2-hour beginner surf lesson with an experienced instructor at Sasihithlu Beach — board and rash vest included. Difficulty: Easy. Best season: Oct–Feb. Tip: morning sessions (7–9AM) have the most consistent waves.", duration_hours: 2, price_per_person: 1500, family_friendly: true },
  { name: "Kayaking on Shambhavi River", category: "adventure", description: "Guided single or tandem kayaking on the calm Shambhavi River estuary — no ocean waves, great for beginners and families. Difficulty: Easy. Best season: Oct–Mar. Tip: the sunset paddle (4–6PM slot) is the most scenic.", duration_hours: 1.5, price_per_person: 600, family_friendly: true },
  { name: "Stand-Up Paddleboarding (SUP)", category: "adventure", description: "SUP sessions on the river or beach with instructor guidance — a full-body workout on calm water. Difficulty: Easy-Moderate. Best season: Oct–Feb. Tip: try the river first before attempting ocean SUP.", duration_hours: 1, price_per_person: 700, family_friendly: true },
  { name: "Sunset Boat Ride on the Estuary", category: "leisure", description: "A relaxed motorboat ride at the Shambhavi river mouth at golden hour, often with dolphin sightings. Difficulty: Easy. Best season: Oct–Mar. Tip: dolphins are most often spotted between October and January.", duration_hours: 1, price_per_person: 400, family_friendly: true },
  { name: "Yakshagana Cultural Show", category: "culture", description: "An evening performance of Yakshagana — coastal Karnataka's traditional theatre form combining elaborate costumes, dance, and Tulu/Kannada mythology. Difficulty: Easy. Best season: Oct–Mar. Tip: shows are usually held at local temples and community halls — ask your host for upcoming dates.", duration_hours: 2.5, price_per_person: 200, family_friendly: true },
], true);

// 5. How to Reach
console.log("\nHow to Reach:");
const howToReachRows = [
  { mode: "road", description: "From Hyderabad: NH44 to Bangalore, then NH75 to Mangalore, then NH66 north 30km to Mulki. Estimated cost: ₹4500–5500 in fuel", distance_from_hyderabad_km: 780, duration_from_hyderabad: "13–14 hours", tips: "Best to split over 2 days — stay overnight in Bangalore or Mangalore. NH66 (old NH17) from Mangalore to Mulki is a smooth coastal highway." },
  { mode: "train", description: "Mulki has its own station on the Konkan Railway line. Trains from Hyderabad connect via Mangalore Central (30km away) with onward local trains or autos.", nearest_railway_station: "Mulki Railway Station (Konkan Railway)", tips: "The Konkan Railway journey itself is scenic — book a window seat. From Mangalore Central, local trains to Mulki take 40 minutes." },
  { mode: "air", description: "Mangalore International Airport (25km) has direct flights from Hyderabad, Mumbai, Bangalore, and Chennai on IndiGo, Air India, and SpiceJet.", nearest_airport: "Mangalore International Airport (IXE)", tips: "Pre-book a cab from Mangalore airport to Mulki — about 40 minutes. Ola and Uber operate in Mangalore." },
];
for (const row of howToReachRows) {
  const { data: existing } = await supabase.from("how_to_reach").select("id").eq("destination_id", destinationId).eq("mode", row.mode).maybeSingle();
  if (existing) { console.log(`  ⏭ skipped: ${row.mode}`); continue; }
  const { error } = await supabase.from("how_to_reach").insert({ ...row, destination_id: destinationId });
  if (error) console.error(`  ✗ ${row.mode}:`, error.message);
  else console.log(`  ✓ inserted: ${row.mode}`);
}

console.log("\nDone.");
