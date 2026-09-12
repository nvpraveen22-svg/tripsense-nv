// Seed script: updates destinations with month-by-month visit data and history/culture text.
// Run with: node --env-file=.env.local scripts/seed-month-data.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars. Run with: node --env-file=.env.local scripts/seed-month-data.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MONTH_DATA = [
  {
    slug: "dandeli",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "May"],
    avoid_months: ["June", "July", "August", "September"],
    month_notes:
      "Monsoon (Jun–Sep) brings heavy rainfall making roads treacherous and river activities suspended. October marks the sweet spot when forests turn lush green post-monsoon but weather stabilises.",
    history_culture:
      "Dandeli sits in the Western Ghats of northern Karnataka, historically part of the Bombay Presidency before Karnataka's reorganisation. The town grew around a paper mill established in 1938 by the Dandeli Paper & Pulp Mill, which shaped its economy for decades. The Kali River — named after the goddess Kali — is sacred to local communities and forms the lifeline of the Dandeli Wildlife Sanctuary, declared a Tiger Reserve in 2007. Indigenous Gawli and Siddi communities have called these forests home for centuries.",
  },
  {
    slug: "goa",
    best_months: ["November", "December", "January", "February", "March"],
    okay_months: ["October", "April"],
    avoid_months: ["May", "June", "July", "August", "September"],
    month_notes:
      "Monsoon (Jun–Sep) sees most shacks and water sports shut down. May is pre-monsoon and very humid. October and April are shoulder months — fewer crowds, some operators open.",
    history_culture:
      "Goa was a Portuguese colony for 451 years until liberation in 1961, leaving an indelible mark on its architecture, cuisine, and Catholic traditions. The Old Goa churches — including the Basilica of Bom Jesus housing St Francis Xavier's relics — are UNESCO World Heritage Sites. Before the Portuguese, Goa was ruled by the Kadamba dynasty, then the Bahmani Sultanate and Bijapur Sultanate. The unique Konkani culture blends Hindu and Portuguese Catholic influences, visible in the Carnival festival and the Goan fish curry served at Sunday mass feasts.",
  },
  {
    slug: "gokarna",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    month_notes:
      "Monsoon (Jun–Aug) brings extremely heavy rain along Karnataka coast — beaches become dangerous and trek paths to Om Beach turn slippery. September is transitional. April is hot but manageable.",
    history_culture:
      "Gokarna is one of the seven sacred cities (Sapta Moksha Puris) of Karnataka, mentioned in the Skanda Purana. The Mahabaleshwara Temple here is said to house the Atma Linga — an object of great reverence in Hindu mythology. Pilgrims have walked this coastal town for over 1,500 years. The name Gokarna means 'cow's ear' — the shape of the land where the Aghanashini River meets the sea. Beyond its spiritual identity, Gokarna quietly became a backpacker haven in the 1990s, attracting travellers seeking a quieter alternative to Goa.",
  },
  {
    slug: "coorg",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    month_notes:
      "Coorg receives some of India's heaviest rainfall during monsoon — roads to Talacauvery and Abbey Falls get blocked. The post-monsoon season from October onwards reveals lush coffee estates and mist-covered hills.",
    history_culture:
      "Coorg (Kodagu) is home to the Kodava people — a warrior community with a distinct language, customs, and a tradition of carrying ceremonial swords called Peeche Katti. Historically Coorg was an independent kingdom before being annexed by Hyder Ali and then Tipu Sultan, and later coming under direct British rule in 1834 after the capture of Chikkaveerarajendra. The region is India's largest coffee-producing district, with estates dating back to British-era cultivation. Field Marshal K.M. Cariappa, India's first Commander-in-Chief, was a Kodava from Coorg.",
  },
  {
    slug: "ooty",
    best_months: ["October", "November", "March", "April", "May"],
    okay_months: ["December", "January", "February"],
    avoid_months: ["June", "July", "August", "September"],
    month_notes:
      "Ooty gets heavy monsoon from the south-west (Jun–Aug). December–February are cold (down to 5°C at night) — pleasant for some but uncomfortable for young children. March–May before the monsoon is peak tourist season with Flower Show in May.",
    history_culture:
      "Ooty (Udhagamandalam) was the summer capital of the Madras Presidency during British rule, developed from the 1820s by Collector John Sullivan who built the first Nilgiri bungalow here. The Todas — an ancient pastoral tribe — have inhabited the Nilgiris for thousands of years and their distinctive barrel-shaped stone huts can still be seen around Ooty. The famous Nilgiri Mountain Railway (UNESCO World Heritage) has operated since 1908, climbing from Mettupalayam to Ooty through steep gradient rack-and-pinion sections. Ooty is also home to the Government Botanical Gardens established in 1848.",
  },
  {
    slug: "kodaikanal",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    month_notes:
      "Kodaikanal faces both south-west (Jun–Aug) and north-east (Oct–Dec) monsoons, but October–November rain is lighter. May–August sees heavy fog and rain reducing visibility. Winters (Dec–Jan) are cold at 8–10°C but clear and beautiful.",
    history_culture:
      "Kodaikanal was established in 1845 as a hill retreat for American missionaries and European planters. Unlike most Indian hill stations, it was developed primarily by Americans — the Kodaikanal International School founded in 1901 continues to operate today. The Palani Hills here are sacred to Murugan worship, and the Kurinji flower (Strobilanthes kunthiana) blooms here once every 12 years, a rare sight that draws pilgrims and botanists alike. The Kodai Lake was artificially created in 1863 by damming a stream — today it is the town's social centre.",
  },
  {
    slug: "araku-valley",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["June", "July", "August"],
    month_notes:
      "Araku Valley receives heavy monsoon rainfall from June–August making road conditions difficult. The valley is beautiful post-monsoon when coffee estates and orange orchards are in full yield. Winter months (Dec–Jan) can be surprisingly cold at night — carry a jacket.",
    history_culture:
      "Araku Valley is home to 19 Adivasi (tribal) communities including the Kondh, Bagata, Gadaba, and Konda Dora peoples who have lived in the Eastern Ghats for millennia. The Vistadome train journey from Visakhapatnam to Araku (1,300m altitude gain over 115km) is an engineering marvel built across 58 tunnels and 84 bridges. Araku Coffee — grown by tribal farmers at 900–1,100m altitude — has earned international acclaim and a GI tag. The Tribal Museum in Araku preserves the heritage, art, and instruments of the region's indigenous communities.",
  },
  {
    slug: "vizag",
    best_months: ["October", "November", "December", "January", "February", "March"],
    okay_months: ["April", "September"],
    avoid_months: ["May", "June", "July", "August"],
    month_notes:
      "Vizag faces the Bay of Bengal and is prone to cyclones during the monsoon (especially Oct–Nov for north-east monsoon). May–June is very hot and humid. October onwards is pleasant for beaches and the Araku Valley trip.",
    history_culture:
      "Visakhapatnam (Vizag) is Andhra Pradesh's largest city and India's only port city with a natural harbour. The region's history stretches back to the 3rd century BCE when it was part of the Kalinga kingdom. The city hosted Buddhist monasteries — remnants found at Thotlakonda. Under the British, Vizag became a key naval base and India's Eastern Naval Command still operates here. INS Kursura, a decommissioned submarine turned museum, sits on the RK Beach. The city's Simhachalam Temple, dedicated to Narasimha, has been an active pilgrimage site since the 11th century.",
  },
  {
    slug: "pondicherry",
    best_months: ["January", "February", "March", "October", "November"],
    okay_months: ["December", "April"],
    avoid_months: ["May", "June", "July", "August", "September"],
    month_notes:
      "Pondicherry is unusual — it faces the north-east monsoon (Oct–Dec) more than the south-west. October–November gets rain but is still pleasant. The south-west monsoon (Jun–Aug) is lighter here than in Kerala/Karnataka. May is peak heat (38°C+). January–March is the sweet spot.",
    history_culture:
      "Pondicherry (Puducherry) was a French colony for 138 years until 1954, longer than any other French territory in India. The French Quarter (White Town) retains its colonial grid — yellow buildings with French street signs, Catholic churches, and a boulevard facing the Bay of Bengal. Sri Aurobindo Ghosh — freedom fighter turned philosopher — established his Ashram here in 1926 with The Mother (Mirra Alfassa), attracting seekers worldwide. The nearby Auroville, founded in 1968, is a UNESCO-recognised experimental township built on principles of human unity, home to 3,500 residents from 60 nations.",
  },
];

async function run() {
  console.log(`Seeding month data for ${MONTH_DATA.length} destinations...\n`);

  for (const entry of MONTH_DATA) {
    const { slug, ...updateData } = entry;

    // Look up destination by slug
    const { data: rows, error: lookupError } = await supabase
      .from("destinations")
      .select("id, name")
      .eq("slug", slug)
      .limit(1);

    const dest = rows?.[0];

    if (lookupError || !dest) {
      console.error(`  ✗ ${slug}: not found (${lookupError?.message ?? "no row"})`);
      continue;
    }

    // Update the row
    const { error: updateError } = await supabase
      .from("destinations")
      .update(updateData)
      .eq("id", dest.id);

    if (updateError) {
      console.error(`  ✗ ${dest.name} (${slug}): update failed — ${updateError.message}`);
    } else {
      console.log(`  ✓ ${dest.name} (${slug}): updated`);
    }
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
