import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface WeatherResponse {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  icon: string;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weather service is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  if (!lat && !lon && !city) {
    return NextResponse.json(
      { error: "Provide either lat/lon or city." },
      { status: 400 }
    );
  }

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  if (lat && lon) {
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
  } else if (city) {
    url.searchParams.set("q", `${city},IN`);
  }
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 1800 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Couldn't fetch weather right now." },
        { status: 502 }
      );
    }
    const data = await res.json();

    const payload: WeatherResponse = {
      temp: Math.round(data.main?.temp),
      feelsLike: Math.round(data.main?.feels_like),
      condition: data.weather?.[0]?.main ?? "Unknown",
      description: data.weather?.[0]?.description ?? "",
      humidity: data.main?.humidity,
      icon: data.weather?.[0]?.icon ?? "01d",
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Couldn't fetch weather right now." },
      { status: 502 }
    );
  }
}
