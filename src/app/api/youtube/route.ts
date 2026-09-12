import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export interface YoutubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  viewCount: number | null;
  publishedAt: string;
}

export async function GET(request: NextRequest) {
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "YouTube service is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const maxResults = Math.min(Number(searchParams.get("maxResults") ?? "6") || 6, 12);

  if (!query) {
    return NextResponse.json({ error: "Missing query." }, { status: 400 });
  }

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", String(maxResults));
    searchUrl.searchParams.set("key", key);

    const searchRes = await fetch(searchUrl.toString(), {
      next: { revalidate: 86400 },
    });
    if (!searchRes.ok) {
      return NextResponse.json(
        { error: "Couldn't fetch videos right now." },
        { status: 502 }
      );
    }
    const searchData = await searchRes.json();
    const items: Array<{ id: { videoId: string }; snippet: Record<string, unknown> }> =
      searchData.items ?? [];
    const videoIds = items.map((item) => item.id.videoId).filter(Boolean);

    let viewCounts: Record<string, number> = {};
    if (videoIds.length > 0) {
      const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      statsUrl.searchParams.set("part", "statistics");
      statsUrl.searchParams.set("id", videoIds.join(","));
      statsUrl.searchParams.set("key", key);
      const statsRes = await fetch(statsUrl.toString(), {
        next: { revalidate: 86400 },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        viewCounts = Object.fromEntries(
          (statsData.items ?? []).map((v: { id: string; statistics: { viewCount: string } }) => [
            v.id,
            Number(v.statistics.viewCount),
          ])
        );
      }
    }

    const videos: YoutubeVideo[] = items.map((item) => {
      const snippet = item.snippet as {
        title: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
      return {
        id: item.id.videoId,
        title: snippet.title,
        thumbnail: snippet.thumbnails.medium?.url ?? snippet.thumbnails.default?.url ?? "",
        channelTitle: snippet.channelTitle,
        viewCount: viewCounts[item.id.videoId] ?? null,
        publishedAt: snippet.publishedAt,
      };
    });

    return NextResponse.json({ videos });
  } catch {
    return NextResponse.json(
      { error: "Couldn't fetch videos right now." },
      { status: 502 }
    );
  }
}
