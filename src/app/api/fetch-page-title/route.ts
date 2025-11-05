import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    // Validate URL
    new URL(url);

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; GDG-UAM-Bot/1.0; +https://gdguam.com)"
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch page" }, { status: response.status });
    }

    const html = await response.text();

    // Try to extract title from various sources
    let title: string | null = null;

    // 1. Try Open Graph title
    const ogTitleMatch = html.match(
      /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
    );
    if (ogTitleMatch) {
      title = ogTitleMatch[1];
    }

    // 2. Try Twitter title
    if (!title) {
      const twitterTitleMatch = html.match(
        /<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i
      );
      if (twitterTitleMatch) {
        title = twitterTitleMatch[1];
      }
    }

    // 3. Try regular title tag
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1];
      }
    }

    if (!title) {
      return NextResponse.json({ error: "No title found" }, { status: 404 });
    }

    // Decode HTML entities
    title = title
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .trim();

    return NextResponse.json({ title });
  } catch (error) {
    console.error("Error fetching page title:", error);
    return NextResponse.json({ error: "Failed to fetch page title" }, { status: 500 });
  }
}
