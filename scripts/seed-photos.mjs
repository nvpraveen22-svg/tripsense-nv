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
  mussoorie: "Mussoorie hill station Himalayas India",
  pachmarhi: "Pachmarhi hills Madhya Pradesh India",
  mahabalipuram: "Mahabalipuram shore temple India",
  darjeeling: "Darjeeling tea gardens Himalayas India",
  puri: "Puri beach Odisha India",
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

  // Goa
  "Baga Beach": "Baga beach Goa",
  "Basilica of Bom Jesus": "Bom Jesus Basilica Goa",
  "Dudhsagar Falls": "waterfall forest India",
  "Fort Aguada": "Fort Aguada Goa",
  "Anjuna Flea Market": "Anjuna flea market Goa",

  // Gokarna
  "Om Beach": "Om beach Gokarna",
  "Kudle Beach": "Kudle beach Gokarna",
  "Mirjan Fort": "old fort India ruins",
  "Half Moon Beach": "secluded beach cliff India",
  "Yana Caves": "black rock cave formation",

  // Coorg
  "Abbey Falls": "Abbey falls Coorg",
  "Raja's Seat": "hill viewpoint sunset",
  "Dubare Elephant Camp": "elephant river camp India",
  "Namdroling Golden Temple": "Namdroling monastery Bylakuppe",
  "Talacauvery": "Talacauvery Coorg hills",
  "Mandalpatti Viewpoint": "green hills viewpoint",

  // Ooty
  "Ooty Lake": "Ooty lake boating",
  "Government Botanical Garden": "botanical garden Ooty",
  "Nilgiri Mountain Railway": "Nilgiri toy train",
  "Doddabetta Peak": "Doddabetta peak Ooty",
  "Tea Museum & Factory": "tea factory India",

  // Kodaikanal
  "Kodaikanal Lake": "Kodaikanal lake",
  "Coaker's Walk": "Kodaikanal cliff walk",
  "Pillar Rocks": "Pillar rocks Kodaikanal",
  "Bryant Park": "botanical garden flowers India",
  "Guna Caves (Devil's Kitchen)": "rock cave forest India",

  // Araku Valley
  "Borra Caves": "cave formation India",
  "Araku Tribal Museum": "tribal museum India",
  "Katiki Waterfalls": "waterfall forest India",
  "Araku Valley Coffee Plantations": "coffee plantation India hills",
  "Padmapuram Gardens": "terraced garden India hills",

  // Vizag
  Kailasagiri: "Kailasagiri hill park Vizag",
  "Ramakrishna Beach (RK Beach)": "RK beach Visakhapatnam",
  "INS Kursura Submarine Museum": "submarine museum India",
  "Rushikonda Beach": "Rushikonda beach Vizag",
  "TU 142 Aircraft Museum": "military aircraft",
  "Yarada Beach": "hilltop beach India coast",

  // Pondicherry
  "Promenade Beach (Rock Beach)": "Pondicherry promenade beach",
  Auroville: "Auroville Matrimandir India",
  "French Quarter (White Town)": "colonial street India",
  "Basilica of the Sacred Heart of Jesus": "gothic church India",
  "Paradise Beach": "Paradise beach Pondicherry",

  // Mussoorie
  "Kempty Falls": "waterfall pool hills India",
  "Mall Road": "Mall Road Mussoorie hill town",
  "Gun Hill": "cable car hill viewpoint India",
  "Camel's Back Road": "walking trail hills sunset India",
  "Lal Tibba": "Himalayan mountain viewpoint India",
  "Company Garden (Municipal Garden)": "hill station garden lake India",
  "Cloud's End": "forest viewpoint hills India",
  "Landour Bazaar & Char Dukan": "colonial hill town bazaar India",

  // Pachmarhi
  "Bee Fall (Rajat Prapat)": "waterfall forest India",
  "Pandav Caves": "rock cut caves India",
  Dhoopgarh: "hilltop sunset viewpoint India",
  "Apsara Vihar (Fairy Pool)": "natural rock pool forest India",
  "Handi Khoh": "forest gorge canyon India",
  "Priyadarshini Point (Forsyth Point)": "plateau viewpoint hills India",

  // Mahabalipuram
  "Shore Temple": "Shore Temple Mahabalipuram India",
  "Pancha Rathas (Five Rathas)": "rock cut temple monolith India",
  "Arjuna's Penance": "rock relief carving India",
  "Krishna's Butter Ball": "giant balanced boulder India",
  "Tiger Cave": "rock cut shrine carving India",
  "Mahabalipuram Beach": "beach Tamil Nadu India",

  // Darjeeling
  "Tiger Hill": "Kanchenjunga sunrise mountain India",
  "Batasia Loop": "toy train spiral loop hills India",
  "Padmaja Naidu Himalayan Zoological Park": "red panda zoo Himalayas India",
  "Peace Pagoda": "white pagoda hilltop India",
  "Darjeeling Ropeway": "cable car tea garden hills India",
  "Happy Valley Tea Estate": "tea garden plantation Darjeeling India",
  "Observatory Hill": "hilltop prayer flags forest India",

  // Puri
  "Puri Beach (Golden Beach)": "golden beach fishing boats India",
  "Konark Sun Temple": "Konark Sun Temple India",
  "Chilika Lake": "lagoon lake birds India",
  "Puri Beach Sand Art Institute": "sand sculpture beach India",
  "Raghurajpur Heritage Crafts Village": "artisan village painting India",
};

const hotelQueries = {
  "Evolve Back Kali Adventure Camp": "luxury jungle resort tented camp India",
  "The Bison Resort": "jungle resort India",
  "Old Magazine House": "heritage bungalow forest guesthouse India",
  "Jungle Retreat Dandeli": "jungle resort riverside India",
  "Dandeli Jungle Camp": "camping forest bonfire riverside India",

  // Goa
  "Taj Fort Aguada Resort & Spa": "luxury beach resort India",
  "W Goa": "beach resort pool Goa",
  "Fairfield by Marriott Goa": "hotel pool Goa",
  "Zostel Goa": "backpacker hostel Goa",

  // Gokarna
  SwaSwara: "beach resort wellness India",
  "Kudle Beach Resort": "beach resort Gokarna",
  "Gokarna International Beach Resort": "beach resort pool India",
  "Namaste Cafe & Rooms": "beach shack cafe India",

  // Coorg
  "Taj Madikeri Resort & Spa": "luxury resort coffee estate",
  "Orange County Coorg": "plantation resort Coorg",
  "Coorg Wilderness Resort": "forest lodge India",
  "Coorg Cliffs Resort": "hillside resort Coorg",

  // Ooty
  "The Savoy (IHCL SeleQtions)": "heritage hotel garden India",
  "Sterling Ooty Elk Hill": "hillside hotel Ooty",
  "Fortune Resort Sullivan Court": "hotel India",
  "YWCA Anandagiri": "budget guesthouse hills India",

  // Kodaikanal
  "The Carlton (CGH Earth)": "lake hotel India",
  "Sterling Kodai Lake": "hillside hotel Kodaikanal",
  "Villa Retreat": "hillside hotel valley view",
  "Cloud Street Backpackers": "hostel India",

  // Araku Valley
  "Haritha Valley Resort (APTDC)": "valley resort hills India",
  "Mayuri Hill Resort": "hill resort India",
  "Bamboo Valley Resort": "nature resort hills India",
  "Aara Valley Homestay": "village homestay India",

  // Vizag
  "Novotel Visakhapatnam Varun Beach": "beachfront hotel Vizag",
  "The Park Visakhapatnam": "hotel beach India",
  "Fortune Park Centra": "city hotel India",
  "Zostel Visakhapatnam": "backpacker hostel India",

  // Pondicherry
  "Palais de Mahe (CGH Earth)": "French colonial hotel India",
  "The Promenade": "beachfront hotel Pondicherry",
  "Ginger Puducherry": "hotel Pondicherry",
  "Kailash Guest House": "guesthouse garden India",

  // Mussoorie
  "JW Marriott Mussoorie Walnut Grove Resort & Spa": "luxury resort mountain view India",
  "Fortune Resort Sunrise Park": "hotel hill station India",
  "Kasmanda Palace Heritage Hotel": "heritage palace hotel India",
  "Zostel Mussoorie": "backpacker hostel hill town India",

  // Pachmarhi
  "MPT Amaltas Resort": "forest resort hills India",
  "Glen View Resort": "valley view resort India",
  "Reyti Retreat by Ambrosia": "hill town resort India",
  "Highland Resort Pachmarhi": "budget hotel hills India",

  // Mahabalipuram
  "Radisson Blu Resort Temple Bay Mamallapuram": "beachfront resort pool India",
  "GRT Temple Bay": "beach resort India",
  "InterContinental Chennai Mahabalipuram Resort": "luxury beach resort India",
  "Ideal Beach Resort": "garden resort pool India",

  // Darjeeling
  "Mayfair Darjeeling": "luxury hotel garden mountain India",
  "Windamere Hotel": "colonial heritage hotel India",
  "Cedar Inn": "hotel mountain view India",
  "Zostel Darjeeling": "backpacker hostel hill town India",

  // Puri
  "Mayfair Heritage Puri": "beachfront resort garden India",
  "Toshali Sands": "cottage resort palm grove India",
  "Hotel Lotus Eco Beach Resort": "beach hotel India",
  "Zostel Puri": "backpacker hostel beach India",
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

  // Goa
  "Parasailing at Baga Beach": "parasailing beach India",
  "Scuba Diving at Grande Island": "scuba diving India sea",
  "Spice Plantation Tour": "spice plantation India",
  "Sunset Cruise on Mandovi River": "river cruise sunset India",
  "Casino Cruise": "casino boat river",

  // Gokarna
  "Beach Trekking (Om to Half Moon to Paradise)": "coastal cliff trail",
  "Sunset Yoga at Kudle Beach": "beach yoga sunset",
  "Dolphin Spotting Boat Ride": "dolphin boat ride sea",
  "Surfing Lessons": "surfing lesson beach India",
  "Meditation & Wellness Retreat Session": "meditation retreat India",

  // Coorg
  "Coffee Plantation Walk & Tasting": "coffee plantation walk India",
  "River Rafting on Barapole River": "river rafting India forest",
  "Trekking to Tadiandamol Peak": "mountain trek India hills",
  "Elephant Bathing at Dubare Camp": "elephant bathing river India",
  "Kodava Cuisine Cooking Class": "Indian cooking",

  // Ooty
  "Nilgiri Toy Train Ride": "toy train hills India",
  "Horse Riding at Ooty Lake": "horse riding lake India",
  "Trekking in the Nilgiris": "mountain trekking India forest",
  "Tea Tasting Tour": "tea tasting India plantation",
  "Pedal Boating at Ooty Lake": "pedal boat lake India",

  // Kodaikanal
  "Boating at Kodaikanal Lake": "lake boating India hills",
  "Cycling Around the Lake": "cycling lake",
  "Trekking to Dolphin's Nose": "cliff viewpoint trek India",
  "Homemade Chocolate & Eucalyptus Shopping Tour": "chocolate shop hill town",
  "Guna Caves & Pillar Rocks Photo Trail": "rock formation India",

  // Araku Valley
  "Araku Valley Toy Train": "scenic train hills India",
  "Coffee Estate & Tribal Village Tour": "tribal village India hills",
  "Borra Caves Trekking & Exploration": "cave exploration India",
  "Katiki Waterfall Trek": "waterfall trek India forest",
  "Zip-lining at Araku Adventure Park": "zipline forest canopy India",

  // Vizag
  "Kailasagiri Ropeway Ride": "cable car ropeway hill India",
  "Submarine Museum Tour": "submarine museum India",
  "Water Sports at Rushikonda Beach": "jet ski beach India",
  "Yarada Beach Sunset Drive": "coastal drive sunset India",
  "Simhachalam Temple Darshan Trip": "hilltop temple India",

  // Pondicherry
  "Cycling Tour of French Quarter": "cycling colonial street India",
  "Auroville & Matrimandir Visit": "Auroville Matrimandir India",
  "Boating to Paradise Beach": "boat ride beach India",
  "Scuba Diving": "scuba diving India coast",
  "Pondicherry Heritage Walk": "heritage walk colonial India",

  // Mussoorie
  "Cable Car Ride to Gun Hill": "cable car mountain ride India",
  "Trekking to Cloud's End": "forest trek hills India",
  "Paragliding near Mussoorie": "paragliding mountain valley India",
  "Horse Riding on Camel's Back Road": "horse riding hill road India",
  "Skating at Mussoorie Skating Rink": "roller skating rink India",

  // Pachmarhi
  "Jeep Safari in Satpura Tiger Reserve": "jeep safari forest tiger India",
  "Walking Safari": "walking safari forest India",
  "Trekking to Dhoopgarh Sunset Point": "hilltop sunset trek India",
  "Boating at Pachmarhi Lake": "lake boating hills India",
  "Cave Exploration Tour": "rock cave exploration India",

  // Mahabalipuram
  "Stone Sculpture Workshop Visit": "stone sculpture carving India",
  "Sunrise Photography at Shore Temple": "sunrise temple beach India",
  "Cycling Tour of Heritage Monuments": "cycling heritage monument India",
  "Beach Horse Riding": "horse riding beach India",
  "Crocodile Bank Visit": "crocodile sanctuary India",

  // Darjeeling
  "Darjeeling Himalayan Railway Joy Ride": "toy train mountain railway India",
  "Tea Estate Tour & Tasting": "tea estate plantation India",
  "Sunrise Trip to Tiger Hill": "sunrise mountain viewpoint India",
  "Himalayan Mountaineering Institute Museum Visit": "mountaineering museum India",
  "Paragliding near Darjeeling": "paragliding hills India",

  // Puri
  "Sunrise Beach Walk & Fishing Village Visit": "fishing boats beach sunrise India",
  "Konark Sun Temple Day Trip": "Konark Sun Temple India",
  "Chilika Lake Dolphin Spotting Boat Ride": "dolphin boat ride lake India",
  "Pattachitra Painting Workshop": "traditional painting workshop India",
  "Jagannath Temple Heritage Walk": "temple town heritage walk India",
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

    // Every call counts against Unsplash's 50 req/hour demo quota, whether
    // it found a photo or not. This delay doesn't raise that hourly cap -
    // once it's spent, only waiting (or a production API key) resets it -
    // it just avoids needlessly bursting through a hard failure run with
    // zero pacing (the previous bug: misses had no delay at all).
    await new Promise((r) => setTimeout(r, 500));

    if (!photos) {
      console.log(`  ✗  ${key}: no result`);
      continue;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update(buildUpdate(photos))
      .eq("id", row.id);

    console.log(updateError ? `  ✗  ${key}: ${updateError.message}` : `  ✅ ${key} done`);
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
