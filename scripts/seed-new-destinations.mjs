// Seed script: adds new destinations to the destinations table (skips any
// slug that already exists).
// Run with: node --env-file=.env.local scripts/seed-new-destinations.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars. Run with: node --env-file=.env.local scripts/seed-new-destinations.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DESTINATIONS = [
  {
    name: "Mussoorie",
    slug: "mussoorie",
    state: "Uttarakhand",
    tagline: "The Queen of Hills",
    description:
      "Mussoorie is a charming hill station perched at 2,000m in the Garhwal Himalayas, offering sweeping Himalayan views, the famous Mall Road, Kempty Falls, and a colonial-era character that has drawn visitors for nearly two centuries.",
    best_time_to_visit: "March to June, September to November",
    ideal_trip_days_min: 3,
    ideal_trip_days_max: 5,
    latitude: 30.4598,
    longitude: 78.0664,
    status: "active",
    best_months: ["March", "April", "May", "June", "September", "October", "November"],
    okay_months: ["December", "January", "February"],
    avoid_months: ["July", "August"],
    month_notes:
      "Monsoon (Jul–Aug) brings heavy landslides on Dehradun–Mussoorie road, often blocking access for days. Dec–Feb is cold (near 0°C at night) with occasional snowfall — magical but pack heavy. March–June is peak season with pleasant weather.",
    history_culture:
      "Mussoorie was established in 1823 by Captain Young of the British Army and Superintendent Shore who discovered the site on a hunting expedition. It quickly became the summer retreat of the British Raj administration from the United Provinces. The Landour area, slightly higher than Mussoorie, was a British military sanatorium and later home to author Ruskin Bond who has lived here for decades. The famous Woodstock School (1854) and Wynberg-Allen School reflect its deep missionary and colonial roots. The Garhwali people of this region have a distinct culture, dialect, and a tradition of folk music called Jagar.",
  },
  {
    name: "Pachmarhi",
    slug: "pachmarhi",
    state: "Madhya Pradesh",
    tagline: "Satpura's Jewel — MP's Only Hill Station",
    description:
      "Pachmarhi is Madhya Pradesh's sole hill station, hidden in the Satpura ranges at 1,067m. Known as 'Satpura ki Rani', it offers ancient Pandava caves, dramatic waterfalls, dense sal forests, and a peaceful colonial-era cantonment town.",
    best_time_to_visit: "October to June",
    ideal_trip_days_min: 2,
    ideal_trip_days_max: 4,
    latitude: 22.4675,
    longitude: 78.4347,
    status: "active",
    best_months: ["October", "November", "December", "January", "February", "March", "April"],
    okay_months: ["May", "June"],
    avoid_months: ["July", "August", "September"],
    month_notes:
      "Monsoon (Jul–Sep) makes many waterfalls and viewpoints inaccessible due to slippery paths and flash floods. The forests turn strikingly green though. October onwards is ideal — cool, clear, and all attractions open. May–June is warm but manageable and less crowded than peak.",
    history_culture:
      "Pachmarhi's name derives from 'Panch Marhi' — five caves — believed to be the shelter of the Pandavas during their exile as described in the Mahabharata. Rock paintings in the Mahadeo Hills date back to the Mesolithic period, making this one of central India's most significant prehistoric sites. Captain James Forsyth of the Bengal Lancers 'discovered' Pachmarhi in 1857 and established it as a British hill station and military cantonment. The Satpura Tiger Reserve surrounding the town is one of India's best for walking safaris — the only reserve where you can track tigers on foot. The Chauragarh Temple atop a 1,326m peak draws thousands of Shiva devotees during Mahashivratri.",
  },
  {
    name: "Mahabalipuram",
    slug: "mahabalipuram",
    state: "Tamil Nadu",
    tagline: "UNESCO Shore Temples & Ancient Rock Sculptures",
    description:
      "Mahabalipuram (Mamallapuram) is a UNESCO World Heritage town on the Coromandel Coast, 60km from Chennai. Famous for its 7th–8th century Pallava rock-cut temples, the Shore Temple, Arjuna's Penance bas-relief, and Five Rathas — all carved directly from granite boulders.",
    best_time_to_visit: "November to March",
    ideal_trip_days_min: 1,
    ideal_trip_days_max: 2,
    latitude: 12.6269,
    longitude: 80.1927,
    status: "active",
    best_months: ["November", "December", "January", "February", "March"],
    okay_months: ["October", "April"],
    avoid_months: ["May", "June", "July", "August", "September"],
    month_notes:
      "Mahabalipuram faces the north-east monsoon (Oct–Dec) — October can be rainy. May–September is very hot and humid (35°C+) with rough seas. November to March is the sweet spot — cool sea breeze, calm waters, ideal for exploring the monuments.",
    history_culture:
      "Mahabalipuram was the port city of the Pallava dynasty (3rd–9th century CE), one of ancient India's most artistically prolific kingdoms. The Shore Temple, built by Narasimhavarman II around 700 CE, is among the oldest structural stone temples in South India. The famous bas-relief 'Arjuna's Penance' (or 'Descent of the Ganges') is the world's largest open-air rock relief — 27m wide and 9m tall — carved on a single granite face. The Five Rathas (Pancha Rathas) are monolithic temples carved from single rocks, each in a different architectural style. Arab and Chinese traders docked here between the 7th–10th centuries, making it one of early India's most cosmopolitan ports. Local sculptors continue the Pallava stone-carving tradition today — the town's workshops export granite sculptures worldwide.",
  },
  {
    name: "Darjeeling",
    slug: "darjeeling",
    state: "West Bengal",
    tagline: "Land of the Thunderbolt — Tea, Toy Trains & Tiger Hill",
    description:
      "Darjeeling sits at 2,042m in the Himalayan foothills of West Bengal, offering breathtaking views of Kanchenjunga (the world's third highest peak), the UNESCO Darjeeling Himalayan Railway toy train, world-famous tea estates, and a rich Nepali-Tibetan cultural heritage.",
    best_time_to_visit: "March to May, September to November",
    ideal_trip_days_min: 3,
    ideal_trip_days_max: 5,
    latitude: 27.041,
    longitude: 88.2663,
    status: "active",
    best_months: ["March", "April", "May", "September", "October", "November"],
    okay_months: ["December", "January", "February"],
    avoid_months: ["June", "July", "August"],
    month_notes:
      "Monsoon (Jun–Aug) brings very heavy rainfall — roads to Darjeeling frequently wash out and Kanchenjunga stays hidden in clouds. Dec–Feb is bitterly cold (near freezing) but snowfall occasionally creates magical scenes. March–May is peak season — rhododendrons bloom and mountain views are clearest.",
    history_culture:
      "Darjeeling was ceded to the British East India Company in 1835 by the King of Sikkim. It was developed as a sanatorium for British troops and quickly became the summer capital of the Bengal Presidency. The Darjeeling Himalayan Railway, built between 1879–1881 and now a UNESCO World Heritage Site, climbs from 100m to 2,200m using a unique loop-and-reverse zigzag system. Darjeeling tea — grown at high altitude in misty conditions — earned a GI tag and is considered the 'Champagne of teas'. The town is home to the Himalayan Mountaineering Institute founded in 1954 by Tenzing Norgay after his Everest summit. The Nepali, Tibetan, Lepcha and Bhutia communities give Darjeeling its unique multicultural character, distinct from the rest of West Bengal.",
  },
  {
    name: "Puri",
    slug: "puri",
    state: "Odisha",
    tagline: "Jagannath Dham — Sacred Shores & Golden Sands",
    description:
      "Puri is one of Hinduism's four sacred dhams, home to the 12th century Jagannath Temple and its world-famous Rath Yatra chariot festival. Beyond its spiritual significance, Puri offers a stunning 8km beach, fresh seafood, Odissi dance heritage, and the nearby Konark Sun Temple.",
    best_time_to_visit: "October to March",
    ideal_trip_days_min: 2,
    ideal_trip_days_max: 4,
    latitude: 19.8135,
    longitude: 85.8312,
    status: "active",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    month_notes:
      "Puri faces the Bay of Bengal and is cyclone-prone during monsoon (Jun–Aug). May is extremely hot and humid. The famous Rath Yatra falls in June/July — if visiting for the festival, prepare for massive crowds and book months in advance. October to March is ideal — pleasant weather and calm seas.",
    history_culture:
      "The Jagannath Temple in Puri, built in the 12th century by King Anantavarman Chodaganga Deva, is one of the most sacred sites in Hinduism. The word 'Juggernaut' — meaning an unstoppable force — derives from 'Jagannath', referencing the massive temple chariot that devotees once threw themselves under during Rath Yatra. Puri is one of the four dhams (pilgrimage sites) prescribed in Hindu tradition alongside Badrinath, Dwarka and Rameswaram. The Odissi classical dance form, now performed worldwide, originated in the devadasi tradition of the Jagannath Temple. Konark's Sun Temple (UNESCO), 35km away, was built in 1250 CE in the shape of the sun god's chariot and remains one of India's finest medieval architectural achievements.",
  },
];

for (const dest of DESTINATIONS) {
  const { data: existing, error: lookupError } = await supabase
    .from("destinations")
    .select("id")
    .eq("slug", dest.slug)
    .maybeSingle();

  if (lookupError) {
    console.error(`✗ ${dest.slug}: lookup failed — ${lookupError.message}`);
    continue;
  }

  if (existing) {
    console.log(`✓ skipped (already exists): ${dest.slug}`);
    continue;
  }

  const { error: insertError } = await supabase.from("destinations").insert(dest);
  if (insertError) {
    console.error(`✗ ${dest.slug}: insert failed — ${insertError.message}`);
  } else {
    console.log(`✓ inserted: ${dest.slug}`);
  }
}
