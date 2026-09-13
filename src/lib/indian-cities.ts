export const INDIAN_CITIES = [
  "Agra", "Ahmedabad", "Aizawl", "Ajmer", "Akola", "Aligarh", "Allahabad", "Alwar",
  "Ambala", "Amravati", "Amritsar", "Anantapur", "Aurangabad", "Bangalore", "Bareilly",
  "Belgaum", "Bhilai", "Bhiwandi", "Bhopal", "Bhubaneswar", "Bikaner", "Bilaspur",
  "Bokaro", "Chandigarh", "Chennai", "Coimbatore", "Cuttack", "Dahanu", "Dehradun",
  "Delhi", "Dhanbad", "Dharwad", "Dibrugarh", "Durgapur", "Erode", "Faridabad",
  "Firozabad", "Gaya", "Ghaziabad", "Gorakhpur", "Gulbarga", "Guntur", "Gurgaon",
  "Guwahati", "Gwalior", "Hubli", "Hyderabad", "Imphal", "Indore", "Jabalpur",
  "Jaipur", "Jalandhar", "Jammu", "Jamnagar", "Jamshedpur", "Jodhpur", "Kakinada",
  "Kalyan", "Kannur", "Kanpur", "Karnal", "Kavaratti", "Kochi", "Kohima", "Kolhapur",
  "Kolkata", "Kollam", "Kota", "Kozhikode", "Kurnool", "Leh", "Lucknow", "Ludhiana",
  "Madurai", "Mangalore", "Meerut", "Mumbai", "Mysore", "Nagpur", "Nashik", "Nellore",
  "Noida", "Panaji", "Patna", "Pondicherry", "Pune", "Raipur", "Rajkot", "Ranchi",
  "Rourkela", "Salem", "Shillong", "Shimla", "Siliguri", "Solapur", "Srinagar",
  "Surat", "Thiruvananthapuram", "Thrissur", "Tiruchirapalli", "Tirunelveli",
  "Tirupati", "Udaipur", "Ujjain", "Vadodara", "Varanasi", "Vijayawada",
  "Visakhapatnam", "Warangal",
] as const;

export function matchCities(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];

  const startsWith: string[] = [];
  const contains: string[] = [];
  for (const city of INDIAN_CITIES) {
    const lower = city.toLowerCase();
    if (lower.startsWith(q)) {
      startsWith.push(city);
    } else if (lower.includes(q)) {
      contains.push(city);
    }
  }
  return [...startsWith, ...contains].slice(0, limit);
}
