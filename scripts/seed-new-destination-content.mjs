// Seed script: adds attractions, temples, hotels, and activities for the 5
// destinations added in the previous sprint (Mussoorie, Pachmarhi,
// Mahabalipuram, Darjeeling, Puri). Idempotent — skips any row whose
// (destination_id, name) pair already exists.
//
// Run with: node --env-file=.env.local scripts/seed-new-destination-content.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing env vars. Run with: node --env-file=.env.local scripts/seed-new-destination-content.mjs"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const DESTINATIONS = {
  mussoorie: {
    attractions: [
      {
        name: "Kempty Falls",
        category: "nature",
        description:
          "A multi-tiered waterfall cascading from 4,500ft, ringed by pools popular for a dip. Best time to visit: Mar-Jun, Sep-Nov. Tip: Go early morning to beat the crowds and the cable-car queue.",
        distance_from_center_km: 15,
        entry_fee_adult: 20,
        entry_fee_child: 10,
        timings: "8AM-7PM",
        duration_hours: 2,
        rating: 4.1,
      },
      {
        name: "Mall Road",
        category: "heritage",
        description:
          "Mussoorie's colonial-era promenade lined with cafes, shops and viewpoints, closed to non-essential traffic in the evenings. Best time to visit: year-round evenings. Tip: Walk it at sunset for the best light over the valley.",
        distance_from_center_km: 0,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "10AM-10PM",
        duration_hours: 2,
        rating: 4.3,
      },
      {
        name: "Gun Hill",
        category: "nature",
        description:
          "Mussoorie's second-highest point, reached by a scenic cable car, with panoramic Himalayan and valley views. Best time to visit: Oct-Feb for the clearest peaks. Tip: The ropeway queue gets long by mid-morning on weekends.",
        distance_from_center_km: 1.5,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "8AM-8PM",
        duration_hours: 1.5,
        rating: 4.2,
      },
      {
        name: "Camel's Back Road",
        category: "nature",
        description:
          "A 3km horseshoe-shaped walking trail past a naturally camel-shaped rock formation, ending near Kulri Bazaar. Best time to visit: Apr-Jun, Sep-Nov. Tip: Best walked around sunset when the crowds thin out.",
        distance_from_center_km: 2,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "24 hours",
        duration_hours: 1.5,
        rating: 4.0,
      },
      {
        name: "Lal Tibba",
        category: "nature",
        description:
          "Mussoorie's highest point, in Landour, with a coin-operated telescope pointed at the snow-capped Himalayan range. Best time to visit: Oct-Feb for clear skylines. Tip: Carry a jacket — it's noticeably colder than the town below.",
        distance_from_center_km: 6,
        entry_fee_adult: 10,
        entry_fee_child: 5,
        timings: "8AM-6PM",
        duration_hours: 1,
        rating: 4.3,
      },
      {
        name: "Company Garden (Municipal Garden)",
        category: "nature",
        description:
          "A landscaped garden with a small lake for boating, a toy train for kids and manicured lawns. Best time to visit: Mar-Jun. Tip: Good option on a rainy day when outdoor treks aren't possible.",
        distance_from_center_km: 3,
        entry_fee_adult: 40,
        entry_fee_child: 20,
        timings: "8AM-7PM",
        duration_hours: 1.5,
        rating: 3.9,
      },
      {
        name: "Cloud's End",
        category: "nature",
        description:
          "A quiet forest viewpoint at the western edge of Mussoorie, marking where the motorable road once ended, with valley and Aglar river views. Best time to visit: Sep-Nov. Tip: Far less crowded than Gun Hill or Mall Road.",
        distance_from_center_km: 7,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "9AM-5PM",
        duration_hours: 1.5,
        rating: 4.0,
      },
      {
        name: "Landour Bazaar & Char Dukan",
        category: "heritage",
        description:
          "A sleepy 19th-century cantonment quarter above Mussoorie with old bakeries, a British-era clock tower, and the famous Char Dukan tea stalls. Best time to visit: year-round mornings. Tip: Try the bun-omelette at Char Dukan — a Landour institution.",
        distance_from_center_km: 5,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "8AM-8PM",
        duration_hours: 2,
        rating: 4.4,
      },
    ],
    temples: [],
    hotels: [
      {
        name: "JW Marriott Mussoorie Walnut Grove Resort & Spa",
        stars: 5,
        rating: 4.6,
        price_min: 12000,
        price_max: 22000,
        address: "Kanataal Road, Mussoorie",
        amenities: ["Spa", "Multiple Restaurants", "Valley View", "Pool", "WiFi"],
        ai_summary:
          "Sprawling luxury resort just outside the main town with unmatched valley views and a full spa. 1,240 reviews. Tip: rooms on the valley-facing side cost more but are worth it.",
      },
      {
        name: "Fortune Resort Sunrise Park",
        stars: 4,
        rating: 4.2,
        price_min: 6500,
        price_max: 10500,
        address: "The Mall Road, Mussoorie",
        amenities: ["Restaurant", "WiFi", "Parking", "Mountain View"],
        ai_summary:
          "Solid mid-range choice right on Mall Road with easy walking access to Gun Hill. 690 reviews. Tip: book a mountain-view room, garden-view rooms feel cramped.",
      },
      {
        name: "Kasmanda Palace Heritage Hotel",
        stars: 4,
        rating: 4.3,
        price_min: 7000,
        price_max: 13000,
        address: "The Mall Road, Mussoorie",
        amenities: ["Heritage Property", "Restaurant", "Garden", "WiFi"],
        ai_summary:
          "A former royal palace turned heritage hotel with colonial architecture and antique furnishings. 410 reviews. Tip: ask for a room in the original palace wing, not the newer annexe.",
      },
      {
        name: "Zostel Mussoorie",
        stars: 3,
        rating: 4.0,
        price_min: 900,
        price_max: 2200,
        address: "Near Library Bus Stand, Mussoorie",
        amenities: ["Dorms & Private Rooms", "WiFi", "Common Lounge", "Cafe"],
        ai_summary:
          "Popular backpacker hostel with a social common area and easy access to the Mall. 980 reviews. Tip: book private rooms 2-3 weeks ahead in peak season, dorms fill faster.",
      },
    ],
    activities: [
      {
        name: "Cable Car Ride to Gun Hill",
        category: "leisure",
        description:
          "A short ropeway ride from Mall Road up to Gun Hill for panoramic Himalayan views. Difficulty: Easy. Best season: year-round. Tip: go near sunset for the best light.",
        duration_hours: 0.5,
        price_per_person: 200,
      },
      {
        name: "Trekking to Cloud's End",
        category: "adventure",
        description:
          "A moderate forest trail from Mussoorie to the quiet Cloud's End viewpoint. Difficulty: Easy-Moderate. Best season: Sep-Nov. Tip: hire a local guide for the return trail through the forest.",
        duration_hours: 3,
        price_per_person: 500,
      },
      {
        name: "Paragliding near Mussoorie",
        category: "adventure",
        description:
          "Tandem paragliding flights over the valley, operated from designated launch points outside town. Difficulty: Moderate. Best season: Mar-Jun, Sep-Nov. Tip: weather-dependent, mornings have the most stable winds.",
        duration_hours: 1,
        price_per_person: 2500,
      },
      {
        name: "Horse Riding on Camel's Back Road",
        category: "leisure",
        description:
          "A guided horse ride along the scenic Camel's Back Road loop. Difficulty: Easy. Best season: Apr-Jun. Tip: negotiate the rate upfront, it's usually per lap.",
        duration_hours: 1,
        price_per_person: 400,
      },
      {
        name: "Skating at Mussoorie Skating Rink",
        category: "leisure",
        description:
          "One of India's oldest roller-skating rinks, on Mall Road, open to visitors for skating sessions. Difficulty: Easy. Best season: year-round. Tip: skate rental is included in the entry ticket.",
        duration_hours: 1,
        price_per_person: 150,
      },
    ],
  },

  pachmarhi: {
    attractions: [
      {
        name: "Bee Fall (Rajat Prapat)",
        category: "nature",
        description:
          "A tall waterfall named for the bee-like buzz of water hitting the rocks below, with a popular swimming pool at its base. Best time to visit: Jul-Sep for full flow, Oct-Feb for swimming. Tip: the descent is steep — wear proper shoes.",
        distance_from_center_km: 3,
        entry_fee_adult: 15,
        entry_fee_child: 5,
        timings: "8AM-6PM",
        duration_hours: 1.5,
        rating: 4.2,
      },
      {
        name: "Pandav Caves",
        category: "heritage",
        description:
          "A cluster of ancient rock-cut caves believed to have sheltered the Pandavas during their exile, now a protected monument in the middle of town. Best time to visit: Oct-Apr. Tip: visit early to avoid the midday sun on the open walkway.",
        distance_from_center_km: 1,
        entry_fee_adult: 25,
        entry_fee_child: 10,
        timings: "8AM-6PM",
        duration_hours: 1,
        rating: 4.0,
      },
      {
        name: "Dhoopgarh",
        category: "nature",
        description:
          "The highest point in Madhya Pradesh, famous as Pachmarhi's best sunset point over the Satpura range. Best time to visit: Oct-Mar. Tip: carry a torch for the walk back to the parking area after sunset.",
        distance_from_center_km: 11,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "4PM-7PM (sunset visits)",
        duration_hours: 2,
        rating: 4.5,
      },
      {
        name: "Apsara Vihar (Fairy Pool)",
        category: "nature",
        description:
          "A natural rock pool fed by a small waterfall, tucked into the forest a short walk from the road. Best time to visit: Aug-Feb. Tip: the rocks are slippery — swim only in the marked safe zone.",
        distance_from_center_km: 4,
        entry_fee_adult: 15,
        entry_fee_child: 5,
        timings: "8AM-5:30PM",
        duration_hours: 1,
        rating: 4.0,
      },
      {
        name: "Handi Khoh",
        category: "nature",
        description:
          "A deep, horseshoe-shaped gorge cloaked in dense forest, viewed from a protected platform. Best time to visit: Jul-Sep for the mist, Oct-Feb for clarity. Tip: photography is best in the soft morning light.",
        distance_from_center_km: 2,
        entry_fee_adult: 10,
        entry_fee_child: 5,
        timings: "8AM-6PM",
        duration_hours: 0.5,
        rating: 3.9,
      },
      {
        name: "Priyadarshini Point (Forsyth Point)",
        category: "nature",
        description:
          "The viewpoint from which Captain James Forsyth is said to have first spotted Pachmarhi in 1857, with sweeping views over the plateau. Best time to visit: Oct-Mar. Tip: pair it with a visit to Handi Khoh nearby.",
        distance_from_center_km: 2.5,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "8AM-6PM",
        duration_hours: 0.5,
        rating: 3.8,
      },
    ],
    temples: [
      {
        name: "Jatashankar Temple",
        deity: "Lord Shiva",
        description:
          "A cave shrine built around a natural rock formation resembling Shiva's matted locks (jata), with a stream running through the cavern. Special puja: Mahashivratri draws large crowds. Best time to visit: Oct-Mar. Rating: 4.4/5. Tip: the cave floor can be wet and slippery, wear grip shoes.",
        distance_from_center_km: 5,
        timings: "6AM-7PM",
        entry_fee: 0,
      },
      {
        name: "Chauragarh Temple",
        deity: "Lord Shiva",
        description:
          "A hilltop shrine atop a 1,326m peak, reached by over 1,300 steps and famous for the thousands of trishuls (tridents) devotees leave behind as offerings. Special puja: Mahashivratri sees an overnight pilgrim trail. Best time to visit: Oct-Mar. Rating: 4.6/5. Tip: start the climb by early morning, there's no shade on the stairway.",
        distance_from_center_km: 14,
        timings: "5AM-6PM",
        entry_fee: 0,
      },
    ],
    hotels: [
      {
        name: "MPT Amaltas Resort",
        stars: 4,
        rating: 4.1,
        price_min: 5500,
        price_max: 9000,
        address: "Near Bison Lodge, Pachmarhi",
        amenities: ["Restaurant", "Garden", "WiFi", "Parking"],
        ai_summary:
          "Government-run (MP Tourism) resort in a quiet, forested setting close to the main sights. 520 reviews. Tip: rooms book out fast around Mahashivratri, reserve well ahead.",
      },
      {
        name: "Glen View Resort",
        stars: 3,
        rating: 4.0,
        price_min: 3500,
        price_max: 6000,
        address: "Panarpani Road, Pachmarhi",
        amenities: ["Restaurant", "Valley View", "Bonfire", "Parking"],
        ai_summary:
          "Mid-range resort with pleasant valley-facing rooms and a popular in-house restaurant. 340 reviews. Tip: ask for a room on the upper floor for the view.",
      },
      {
        name: "Reyti Retreat by Ambrosia",
        stars: 3,
        rating: 3.9,
        price_min: 3000,
        price_max: 5500,
        address: "Near Rajendra Giri Chowk, Pachmarhi",
        amenities: ["Restaurant", "Garden", "WiFi"],
        ai_summary:
          "Clean, no-frills mid-range stay close to the town centre. 210 reviews. Tip: good value if you're mainly there for sightseeing, not resort amenities.",
      },
      {
        name: "Highland Resort Pachmarhi",
        stars: 3,
        rating: 3.7,
        price_min: 1800,
        price_max: 3200,
        address: "Nehru Marg, Pachmarhi",
        amenities: ["Restaurant", "Parking", "WiFi"],
        ai_summary:
          "Budget-friendly option in the town centre, walkable to Pandav Caves. 180 reviews. Tip: basic rooms, but the location saves on cab costs.",
      },
    ],
    activities: [
      {
        name: "Jeep Safari in Satpura Tiger Reserve",
        category: "wildlife",
        description:
          "A guided jeep safari through the Satpura Tiger Reserve's sal and bamboo forests, spotting deer, bison and occasionally tiger or leopard. Difficulty: Easy. Best season: Oct-Jun. Tip: book the early-morning slot for the best wildlife sightings.",
        duration_hours: 3,
        price_per_person: 1800,
      },
      {
        name: "Walking Safari",
        category: "wildlife",
        description:
          "Satpura is one of India's only reserves permitting walking safaris with an armed guide and naturalist. Difficulty: Moderate. Best season: Nov-Apr. Tip: book several weeks in advance, permits are limited per day.",
        duration_hours: 3,
        price_per_person: 2500,
      },
      {
        name: "Trekking to Dhoopgarh Sunset Point",
        category: "adventure",
        description:
          "A scenic trek up to Madhya Pradesh's highest point, timed to catch the sunset over the Satpura range. Difficulty: Moderate. Best season: Oct-Mar. Tip: carry a headlamp for the descent.",
        duration_hours: 3,
        price_per_person: 600,
      },
      {
        name: "Boating at Pachmarhi Lake",
        category: "leisure",
        description:
          "Pedal and row boats on the small lake near the town centre, a relaxed break between sightseeing stops. Difficulty: Easy. Best season: year-round. Tip: go in the late afternoon for cooler weather.",
        duration_hours: 1,
        price_per_person: 250,
      },
      {
        name: "Cave Exploration Tour",
        category: "heritage",
        description:
          "A guided walking tour covering Pandav Caves, Jatashankar and other rock-cut sites around town. Difficulty: Easy. Best season: Oct-Apr. Tip: combine with an early Bee Fall visit before the day heats up.",
        duration_hours: 3,
        price_per_person: 700,
      },
    ],
  },

  mahabalipuram: {
    attractions: [
      {
        name: "Shore Temple",
        category: "heritage",
        description:
          "A 7th-century structural stone temple standing directly on the Bay of Bengal shoreline, among the oldest of its kind in South India. Best time to visit: Nov-Mar, early morning or sunset. Tip: come at sunrise for the best light and fewest crowds.",
        distance_from_center_km: 1,
        entry_fee_adult: 40,
        entry_fee_child: 0,
        timings: "6AM-6PM",
        duration_hours: 1,
        rating: 4.5,
      },
      {
        name: "Pancha Rathas (Five Rathas)",
        category: "heritage",
        description:
          "Five monolithic temples, each carved from a single granite boulder in a distinct architectural style, commissioned by the Pallava dynasty. Best time to visit: Nov-Mar. Tip: an ASI guide at the entrance can point out details easy to miss on your own.",
        distance_from_center_km: 2,
        entry_fee_adult: 40,
        entry_fee_child: 0,
        timings: "6AM-6PM",
        duration_hours: 1.5,
        rating: 4.4,
      },
      {
        name: "Arjuna's Penance",
        category: "heritage",
        description:
          "The world's largest open-air rock relief, a 27m granite panel depicting a scene from the Mahabharata, carved directly into a natural rock face. Best time to visit: Nov-Mar. Tip: the detail is easiest to make out in soft morning light.",
        distance_from_center_km: 1.5,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "6AM-6PM",
        duration_hours: 0.5,
        rating: 4.5,
      },
      {
        name: "Krishna's Butter Ball",
        category: "nature",
        description:
          "A giant granite boulder resting improbably on a sloped hillside, seemingly balanced without support. Best time to visit: year-round. Tip: it's a short walk from Arjuna's Penance, worth combining both stops.",
        distance_from_center_km: 1.8,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "6AM-6PM",
        duration_hours: 0.5,
        rating: 4.2,
      },
      {
        name: "Tiger Cave",
        category: "heritage",
        description:
          "A rock-cut shrine framed by carved tiger heads, believed to have been an open-air performance space for Pallava royalty. Best time to visit: Nov-Mar. Tip: quieter than the main monument cluster, good for a slower visit.",
        distance_from_center_km: 5,
        entry_fee_adult: 25,
        entry_fee_child: 0,
        timings: "8AM-5:30PM",
        duration_hours: 1,
        rating: 4.1,
      },
      {
        name: "Mahabalipuram Beach",
        category: "beach",
        description:
          "A wide sandy beach beside the Shore Temple, popular for sunrise walks and seaside seafood shacks. Best time to visit: Nov-Mar. Tip: the water can be rough — stick to wading rather than swimming out.",
        distance_from_center_km: 0.5,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "24 hours",
        duration_hours: 1.5,
        rating: 4.0,
      },
    ],
    temples: [
      {
        name: "Sthalasayana Perumal Temple",
        deity: "Lord Vishnu",
        description:
          "An active Vaishnavite shrine and one of the 108 Divya Desams, located inside the same complex as the Shore Temple. Special puja: Vaikunta Ekadasi draws large crowds. Best time to visit: Nov-Mar. Rating: 4.3/5. Tip: modest dress is expected, shoulders and knees covered.",
        distance_from_center_km: 1,
        timings: "6AM-12PM & 4PM-8PM",
        entry_fee: 0,
      },
    ],
    hotels: [
      {
        name: "Radisson Blu Resort Temple Bay Mamallapuram",
        stars: 5,
        rating: 4.5,
        price_min: 10000,
        price_max: 18000,
        address: "East Raja Street, Mahabalipuram",
        amenities: ["Beachfront", "Pool", "Spa", "Multiple Restaurants", "WiFi"],
        ai_summary:
          "Beachfront resort right next to the Shore Temple, the most-booked luxury stay in town. 1,050 reviews. Tip: sea-facing rooms sell out first for weekend stays.",
      },
      {
        name: "GRT Temple Bay",
        stars: 5,
        rating: 4.3,
        price_min: 8500,
        price_max: 15000,
        address: "Kovalam Road, Mahabalipuram",
        amenities: ["Beachfront", "Pool", "Restaurant", "WiFi"],
        ai_summary:
          "Large beachfront property popular with families, with direct beach access. 780 reviews. Tip: book a garden-facing room if you want more quiet than the pool-facing wing.",
      },
      {
        name: "InterContinental Chennai Mahabalipuram Resort",
        stars: 5,
        rating: 4.4,
        price_min: 12000,
        price_max: 20000,
        address: "ECR, Mahabalipuram",
        amenities: ["Beachfront", "Spa", "Pool", "Multiple Restaurants"],
        ai_summary:
          "Upscale resort on the East Coast Road with an expansive private beach. 640 reviews. Tip: about 20 minutes from the main monument cluster, factor in cab time.",
      },
      {
        name: "Ideal Beach Resort",
        stars: 3,
        rating: 4.0,
        price_min: 3500,
        price_max: 6000,
        address: "ECR, Mahabalipuram",
        amenities: ["Restaurant", "Pool", "Garden", "Parking"],
        ai_summary:
          "Long-running mid-range resort with a pleasant garden and a loyal repeat crowd. 590 reviews. Tip: solid value, but book a renovated-wing room if offered.",
      },
    ],
    activities: [
      {
        name: "Stone Sculpture Workshop Visit",
        category: "culture",
        description:
          "Mahabalipuram's sculptors still carve granite using techniques passed down since the Pallava era — several workshops welcome visitors to watch. Difficulty: Easy. Best season: year-round. Tip: many workshops also sell small carvings to take home.",
        duration_hours: 1,
        price_per_person: 0,
      },
      {
        name: "Sunrise Photography at Shore Temple",
        category: "leisure",
        description:
          "A guided early walk to catch the Shore Temple silhouetted against sunrise over the Bay of Bengal. Difficulty: Easy. Best season: Nov-Mar. Tip: arrive 30 minutes before official sunrise time to set up.",
        duration_hours: 1.5,
        price_per_person: 500,
      },
      {
        name: "Cycling Tour of Heritage Monuments",
        category: "heritage",
        description:
          "A guided cycling route linking the Shore Temple, Five Rathas, and Arjuna's Penance without the midday car traffic. Difficulty: Easy. Best season: Nov-Feb, early morning. Tip: start by 7AM before the heat sets in.",
        duration_hours: 2.5,
        price_per_person: 600,
      },
      {
        name: "Beach Horse Riding",
        category: "leisure",
        description:
          "A short horseback ride along Mahabalipuram Beach, arranged with local handlers near the Shore Temple. Difficulty: Easy. Best season: Nov-Mar. Tip: negotiate the per-round rate before mounting.",
        duration_hours: 0.5,
        price_per_person: 300,
      },
      {
        name: "Crocodile Bank Visit",
        category: "wildlife",
        description:
          "A short drive to the Madras Crocodile Bank Trust, home to thousands of crocodiles, alligators and gharials across several species. Difficulty: Easy. Best season: year-round. Tip: feeding sessions happen a few times a week, check ahead.",
        duration_hours: 2,
        price_per_person: 100,
      },
    ],
  },

  darjeeling: {
    attractions: [
      {
        name: "Tiger Hill",
        category: "nature",
        description:
          "Darjeeling's most famous sunrise point, with Kanchenjunga — the world's third-highest peak — lighting up gold at dawn on a clear day. Best time to visit: Oct-Dec for the clearest views. Tip: jeeps leave town around 4AM to make it in time.",
        distance_from_center_km: 11,
        entry_fee_adult: 30,
        entry_fee_child: 15,
        timings: "4:30AM-7AM (sunrise visits)",
        duration_hours: 2.5,
        rating: 4.5,
      },
      {
        name: "Batasia Loop",
        category: "heritage",
        description:
          "A spiral railway loop where the toy train circles a war memorial garden, with views over the town and hills below. Best time to visit: Mar-May, Sep-Nov. Tip: catch it as a stop on the toy train ride rather than a separate visit.",
        distance_from_center_km: 5,
        entry_fee_adult: 20,
        entry_fee_child: 10,
        timings: "7AM-6PM",
        duration_hours: 1,
        rating: 4.2,
      },
      {
        name: "Padmaja Naidu Himalayan Zoological Park",
        category: "wildlife",
        description:
          "A high-altitude zoo specialising in Himalayan species, including one of the few captive breeding programmes for the red panda and snow leopard. Best time to visit: Mar-Jun, Sep-Nov. Tip: pair with the adjoining Mountaineering Institute museum.",
        distance_from_center_km: 3,
        entry_fee_adult: 60,
        entry_fee_child: 30,
        timings: "8:30AM-4PM",
        duration_hours: 2,
        rating: 4.3,
      },
      {
        name: "Peace Pagoda",
        category: "heritage",
        description:
          "A gleaming white Japanese Buddhist stupa on Jalapahar Hill, with panoramic views over Darjeeling town. Best time to visit: year-round mornings. Tip: quiet and contemplative, worth visiting outside peak tourist hours.",
        distance_from_center_km: 3,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "4:30AM-7PM",
        duration_hours: 1,
        rating: 4.3,
      },
      {
        name: "Darjeeling Ropeway",
        category: "adventure",
        description:
          "A cable car ride over tea gardens and forested valleys between North Point and Singla Bazaar. Best time to visit: Mar-May, Sep-Nov. Tip: mornings offer the clearest views before afternoon haze sets in.",
        distance_from_center_km: 3,
        entry_fee_adult: 300,
        entry_fee_child: 150,
        timings: "10AM-4PM",
        duration_hours: 1,
        rating: 4.1,
      },
      {
        name: "Happy Valley Tea Estate",
        category: "nature",
        description:
          "One of Darjeeling's oldest working tea estates, open for factory tours showing how the leaves are withered, rolled and dried. Best time to visit: Mar-May (first flush season). Tip: the factory is closed on Sundays and during monsoon processing breaks.",
        distance_from_center_km: 3,
        entry_fee_adult: 50,
        entry_fee_child: 20,
        timings: "8AM-4:30PM",
        duration_hours: 1.5,
        rating: 4.2,
      },
      {
        name: "Observatory Hill",
        category: "heritage",
        description:
          "A forested hilltop sacred to both Hindus and Buddhists, home to a small shrine and prayer flags, with views over the town. Best time to visit: year-round mornings. Tip: langurs roam the area — keep food out of sight.",
        distance_from_center_km: 1.5,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "5AM-7PM",
        duration_hours: 1,
        rating: 4.0,
      },
    ],
    temples: [],
    hotels: [
      {
        name: "Mayfair Darjeeling",
        stars: 5,
        rating: 4.6,
        price_min: 11000,
        price_max: 19000,
        address: "Opposite Governor's House, Darjeeling",
        amenities: ["Spa", "Multiple Restaurants", "Garden", "Mountain View"],
        ai_summary:
          "Heritage-style luxury property set in landscaped gardens with excellent Kanchenjunga views. 920 reviews. Tip: book a mountain-facing cottage room, not the main-block rooms.",
      },
      {
        name: "Windamere Hotel",
        stars: 4,
        rating: 4.4,
        price_min: 8000,
        price_max: 14000,
        address: "Observatory Hill, Darjeeling",
        amenities: ["Heritage Property", "Fireplace Rooms", "Restaurant", "Garden"],
        ai_summary:
          "A genuine colonial-era institution — former planters' club turned hotel, full of period character. 610 reviews. Tip: no in-room WiFi in some cottages, ask before booking if connectivity matters.",
      },
      {
        name: "Cedar Inn",
        stars: 3,
        rating: 4.1,
        price_min: 4000,
        price_max: 7000,
        address: "Jawahar Road, Darjeeling",
        amenities: ["Restaurant", "Mountain View", "WiFi", "Parking"],
        ai_summary:
          "Comfortable mid-range hotel with solid Kanchenjunga views from upper floors. 410 reviews. Tip: request an upper-floor room at booking, lower floors face the street.",
      },
      {
        name: "Zostel Darjeeling",
        stars: 3,
        rating: 4.0,
        price_min: 900,
        price_max: 2300,
        address: "Near Chowrasta, Darjeeling",
        amenities: ["Dorms & Private Rooms", "Common Lounge", "WiFi", "Cafe"],
        ai_summary:
          "Popular backpacker stay near Chowrasta square, easy walking distance to the Mall. 730 reviews. Tip: common lounge gets lively in the evenings — bring earplugs if you're an early sleeper.",
      },
    ],
    activities: [
      {
        name: "Darjeeling Himalayan Railway Joy Ride",
        category: "heritage",
        description:
          "A short round-trip on the UNESCO-listed toy train between Darjeeling and Ghum, the highest railway station in India. Difficulty: Easy. Best season: year-round. Tip: book the morning slot, afternoon rides get crowded.",
        duration_hours: 2,
        price_per_person: 1000,
      },
      {
        name: "Tea Estate Tour & Tasting",
        category: "culture",
        description:
          "A guided walk through Happy Valley Tea Estate's plucking fields and processing factory, ending with a tasting session. Difficulty: Easy. Best season: Mar-May, Oct-Nov. Tip: buy leaves directly at the estate — often cheaper than in town shops.",
        duration_hours: 2,
        price_per_person: 400,
      },
      {
        name: "Sunrise Trip to Tiger Hill",
        category: "nature",
        description:
          "A shared or private jeep trip departing before dawn to catch sunrise over Kanchenjunga from Tiger Hill. Difficulty: Easy. Best season: Oct-Dec. Tip: dress warmly, it's well below freezing at that hour.",
        duration_hours: 3,
        price_per_person: 350,
      },
      {
        name: "Himalayan Mountaineering Institute Museum Visit",
        category: "culture",
        description:
          "A museum founded by Tenzing Norgay after his 1953 Everest summit, with mountaineering gear, expedition history and Everest relief models. Difficulty: Easy. Best season: year-round. Tip: allow time for the adjoining Everest Museum in the same complex.",
        duration_hours: 1.5,
        price_per_person: 60,
      },
      {
        name: "Paragliding near Darjeeling",
        category: "adventure",
        description:
          "Tandem paragliding flights over the surrounding hills, operated seasonally from a few designated sites near town. Difficulty: Moderate. Best season: Mar-May, Oct-Nov. Tip: availability is very weather-dependent, keep a backup day.",
        duration_hours: 1,
        price_per_person: 3000,
      },
    ],
  },

  puri: {
    attractions: [
      {
        name: "Puri Beach (Golden Beach)",
        category: "beach",
        description:
          "An 8km stretch of golden sand along the Bay of Bengal, one of India's most visited beaches, lined with fishing boats and beachfront shacks. Best time to visit: Oct-Mar. Tip: mornings are best for a quiet walk before the crowds arrive.",
        distance_from_center_km: 1,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "24 hours",
        duration_hours: 2,
        rating: 4.2,
      },
      {
        name: "Konark Sun Temple",
        category: "heritage",
        description:
          "A UNESCO World Heritage 13th-century temple built in the shape of a colossal stone chariot dedicated to the sun god, 35km from Puri. Best time to visit: Nov-Feb. Tip: hire a guide at the entrance — the carvings are easy to miss without context.",
        distance_from_center_km: 35,
        entry_fee_adult: 40,
        entry_fee_child: 0,
        timings: "6AM-8PM",
        duration_hours: 2.5,
        rating: 4.6,
      },
      {
        name: "Chilika Lake",
        category: "nature",
        description:
          "Asia's largest brackish water lagoon, home to migratory birds in winter and a resident population of Irrawaddy dolphins. Best time to visit: Nov-Feb for birdwatching. Tip: take the earliest boat for the best chance of dolphin sightings.",
        distance_from_center_km: 55,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "6AM-5PM (boat rides)",
        duration_hours: 4,
        rating: 4.3,
      },
      {
        name: "Puri Beach Sand Art Institute",
        category: "culture",
        description:
          "A gallery and open studio on Puri Beach showcasing large-scale sand sculptures, founded by celebrated sand artist Sudarsan Pattnaik. Best time to visit: year-round. Tip: sculptures rotate with themes and festivals, worth a repeat visit.",
        distance_from_center_km: 1,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "6AM-6PM",
        duration_hours: 1,
        rating: 4.1,
      },
      {
        name: "Raghurajpur Heritage Crafts Village",
        category: "culture",
        description:
          "A traditional artisan village where nearly every household practises Pattachitra scroll painting, passed down through generations. Best time to visit: Oct-Mar. Tip: buying directly from an artist's home is cheaper than shops in Puri town.",
        distance_from_center_km: 14,
        entry_fee_adult: 0,
        entry_fee_child: 0,
        timings: "9AM-6PM",
        duration_hours: 2,
        rating: 4.2,
      },
    ],
    temples: [
      {
        name: "Jagannath Temple",
        deity: "Lord Jagannath (Krishna)",
        description:
          "A 12th-century temple and one of Hinduism's four sacred Char Dham sites, famous for its towering shikhara and the annual Rath Yatra chariot festival. Special puja: Rath Yatra in Jun/Jul draws millions of pilgrims. Best time to visit: Oct-Mar. Rating: 4.7/5. Tip: entry is restricted to Hindus, and phones/cameras aren't allowed inside.",
        distance_from_center_km: 0,
        timings: "5AM-12AM",
        entry_fee: 0,
      },
      {
        name: "Gundicha Temple",
        deity: "Lord Jagannath (Krishna)",
        description:
          "The 'garden house' temple where Jagannath, Balabhadra and Subhadra are ceremonially taken during Rath Yatra, then returned nine days later. Special puja: The Rath Yatra return journey (Bahuda Yatra). Best time to visit: Oct-Mar, or during Rath Yatra for the festival atmosphere. Rating: 4.3/5. Tip: far less crowded than the main Jagannath Temple outside festival season.",
        distance_from_center_km: 2,
        timings: "6AM-12PM & 4PM-8PM",
        entry_fee: 0,
      },
    ],
    hotels: [
      {
        name: "Mayfair Heritage Puri",
        stars: 5,
        rating: 4.5,
        price_min: 9000,
        price_max: 16000,
        address: "Chakratirtha Road, Puri",
        amenities: ["Beachfront", "Pool", "Spa", "Multiple Restaurants"],
        ai_summary:
          "Beachfront luxury property with landscaped gardens and direct sea access. 870 reviews. Tip: cottage rooms closer to the beach cost more but are worth it for the setting.",
      },
      {
        name: "Toshali Sands",
        stars: 4,
        rating: 4.2,
        price_min: 6000,
        price_max: 10000,
        address: "Konark Marine Drive, Puri",
        amenities: ["Cottage Rooms", "Pool", "Restaurant", "Garden"],
        ai_summary:
          "Resort-style property with individual cottages set in palm groves near the beach. 640 reviews. Tip: good base if you're also planning the Konark day trip, it's on the Marine Drive route.",
      },
      {
        name: "Hotel Lotus Eco Beach Resort",
        stars: 3,
        rating: 4.0,
        price_min: 3500,
        price_max: 6000,
        address: "New Marine Drive, Puri",
        amenities: ["Beach View", "Restaurant", "WiFi", "Parking"],
        ai_summary:
          "Mid-range beachfront option popular with families. 420 reviews. Tip: ask specifically for a sea-view room, some blocks face inland.",
      },
      {
        name: "Zostel Puri",
        stars: 3,
        rating: 3.9,
        price_min: 800,
        price_max: 2000,
        address: "CT Road, Puri",
        amenities: ["Dorms & Private Rooms", "Common Lounge", "WiFi"],
        ai_summary:
          "Budget backpacker hostel a short walk from the beach and the Jagannath Temple area. 510 reviews. Tip: book dorms early during Rath Yatra season, they sell out weeks in advance.",
      },
    ],
    activities: [
      {
        name: "Sunrise Beach Walk & Fishing Village Visit",
        category: "culture",
        description:
          "An early walk along Puri Beach as local fishing boats come in with the morning catch. Difficulty: Easy. Best season: Oct-Mar. Tip: go before 6:30AM to see the boats actually landing.",
        duration_hours: 1.5,
        price_per_person: 0,
      },
      {
        name: "Konark Sun Temple Day Trip",
        category: "heritage",
        description:
          "A half-day guided trip to the UNESCO-listed Konark Sun Temple, often combined with a stop at Chandrabhaga Beach. Difficulty: Easy. Best season: Nov-Feb. Tip: start early to avoid the midday heat on the exposed temple grounds.",
        duration_hours: 4,
        price_per_person: 800,
      },
      {
        name: "Chilika Lake Dolphin Spotting Boat Ride",
        category: "wildlife",
        description:
          "A motorboat ride into Chilika Lake's dolphin zone, with stops at Kalijai Island temple along the way. Difficulty: Easy. Best season: Nov-Feb. Tip: dolphin sightings are more likely on the earliest departure of the day.",
        duration_hours: 3,
        price_per_person: 700,
      },
      {
        name: "Pattachitra Painting Workshop",
        category: "culture",
        description:
          "A hands-on session with a Raghurajpur artisan learning the basics of traditional Pattachitra scroll painting on cloth. Difficulty: Easy. Best season: year-round. Tip: materials to keep your finished piece are usually included.",
        duration_hours: 2,
        price_per_person: 500,
      },
      {
        name: "Jagannath Temple Heritage Walk",
        category: "heritage",
        description:
          "A guided walk around the Jagannath Temple complex and the surrounding old town, covering its history and the Rath Yatra route. Difficulty: Easy. Best season: Oct-Mar. Tip: the temple's inner sanctum is Hindus-only, but the walk still covers the full outer complex and grand road.",
        duration_hours: 2,
        price_per_person: 400,
      },
    ],
  },
};

async function findDestinationId(slug) {
  const { data, error } = await supabase
    .from("destinations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`destination lookup failed for ${slug}: ${error.message}`);
  if (!data) throw new Error(`destination not found for slug: ${slug}`);
  return data.id;
}

async function seedRows(table, destinationId, rows, extra = {}) {
  let sortOrder = 1;
  for (const row of rows) {
    const { data: existing, error: lookupError } = await supabase
      .from(table)
      .select("id")
      .eq("destination_id", destinationId)
      .eq("name", row.name)
      .maybeSingle();

    if (lookupError) {
      console.error(`  ✗ ${row.name}: lookup failed — ${lookupError.message}`);
      continue;
    }
    if (existing) {
      console.log(`  ⏭ skipped (exists): ${row.name}`);
      sortOrder += 1;
      continue;
    }

    const payload = {
      ...row,
      destination_id: destinationId,
      ...("sort_order" in extra ? { sort_order: sortOrder } : {}),
    };
    const { error: insertError } = await supabase.from(table).insert(payload);
    if (insertError) {
      console.error(`  ✗ ${row.name}: insert failed — ${insertError.message}`);
    } else {
      console.log(`  ✓ inserted: ${row.name}`);
    }
    sortOrder += 1;
  }
}

for (const [slug, content] of Object.entries(DESTINATIONS)) {
  console.log(`\n=== ${slug} ===`);
  const destinationId = await findDestinationId(slug);

  console.log(" Attractions:");
  await seedRows("attractions", destinationId, content.attractions, { sort_order: true });

  console.log(" Temples:");
  await seedRows("temples", destinationId, content.temples, { sort_order: true });

  console.log(" Hotels:");
  await seedRows("hotels", destinationId, content.hotels);

  console.log(" Activities:");
  await seedRows("activities", destinationId, content.activities, { sort_order: true });
}

console.log("\nDone.");
