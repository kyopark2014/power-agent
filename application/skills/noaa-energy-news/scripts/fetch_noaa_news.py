#!/usr/bin/env python3
"""
fetch_noaa_news.py - Fetch NOAA weather/climate news and analyze energy impacts.

Usage:
    python fetch_noaa_news.py [--feed FEED] [--limit N] [--keyword KEYWORD]

Arguments:
    --feed      Feed name: 'all' | 'noaa' | 'highlights' | 'climate' | 'enso' | 'billion-dollar'
                Default: 'all'
    --limit     Max articles per feed (default: 5)
    --keyword   Filter articles by keyword (optional)

Output:
    Prints structured JSON with articles and energy impact tags to stdout.
"""

import argparse
import json
import re
import sys
import requests
from xml.etree import ElementTree as ET
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

# Available RSS feeds
FEEDS = {
    "noaa": {
        "name": "NOAA Main News",
        "url": "https://www.noaa.gov/rss.xml",
        "category": "general"
    },
    "highlights": {
        "name": "NOAA Climate.gov Highlights",
        "url": "https://www.climate.gov/feeds/news-features/highlights.rss",
        "category": "climate"
    },
    "climate": {
        "name": "NOAA Climate & Life",
        "url": "https://www.climate.gov/feeds/news-features/climateand.rss",
        "category": "climate"
    },
    "enso": {
        "name": "NOAA ENSO Blog",
        "url": "https://www.climate.gov/feeds/news-features/enso.rss",
        "category": "climate"
    },
    "billion-dollar": {
        "name": "NOAA Billion-Dollar Disasters",
        "url": "https://www.climate.gov/feeds/news-features/beyond-the-data.rss",
        "category": "disaster"
    },
    "understanding": {
        "name": "NOAA Understanding Climate",
        "url": "https://www.climate.gov/feeds/news-features/understandingclimate.rss",
        "category": "climate"
    },
}

# Energy impact keyword classification
ENERGY_IMPACT_RULES = {
    "electricity_demand": {
        "keywords": [
            "heat wave", "cold snap", "polar vortex", "extreme cold", "extreme heat",
            "temperature record", "heat dome", "winter storm", "power demand",
            "electricity demand", "peak load", "grid stress", "blackout", "brownout",
            "record high temperature", "record low temperature", "cooling degree",
            "heating degree", "AC demand", "air conditioning"
        ],
        "label": "⚡ 전력 수요 변화",
        "description": "극단적 기온 이벤트로 인한 냉난방 전력 수요 급증/감소"
    },
    "renewable_energy": {
        "keywords": [
            "solar radiation", "cloud cover", "wind speed", "wind pattern",
            "wind energy", "solar energy", "renewable energy", "offshore wind",
            "drought", "precipitation", "hydropower", "water level", "snowpack",
            "sea ice", "arctic amplification", "jet stream", "atmospheric river"
        ],
        "label": "🌱 재생에너지 영향",
        "description": "태양광·풍력·수력 발전량에 영향을 주는 기후 요인"
    },
    "fossil_fuel": {
        "keywords": [
            "hurricane", "tropical storm", "flooding", "flood", "storm surge",
            "pipeline", "refinery", "natural gas", "oil production", "Gulf of Mexico",
            "offshore platform", "energy infrastructure", "power plant", "coal"
        ],
        "label": "🛢️ 화석연료 인프라",
        "description": "허리케인·홍수 등으로 인한 발전소·파이프라인 운영 영향"
    },
    "wildfire_energy": {
        "keywords": [
            "wildfire", "fire weather", "red flag warning", "fire season",
            "smoke", "air quality", "power line", "utility", "PSPS",
            "Public Safety Power Shutoff", "transmission line"
        ],
        "label": "🔥 산불·전력망 영향",
        "description": "산불 리스크로 인한 전력망 가동 중단·예방 차단 영향"
    },
    "climate_long_term": {
        "keywords": [
            "global warming", "climate change", "sea level rise", "permafrost",
            "carbon", "CO2", "greenhouse gas", "emission", "temperature trend",
            "decarbonization", "net zero", "ENSO", "El Nino", "La Nina",
            "Arctic", "glacier", "ice sheet", "ocean warming"
        ],
        "label": "🌍 장기 기후 리스크",
        "description": "기후변화로 인한 에너지 시스템 장기 전환 압력"
    },
    "severe_weather_grid": {
        "keywords": [
            "tornado", "severe thunderstorm", "hail", "ice storm", "derecho",
            "outage", "power outage", "damage", "infrastructure damage",
            "flooding", "storm", "blizzard", "nor'easter"
        ],
        "label": "🌪️ 기상재해·전력망",
        "description": "극단적 기상 현상으로 인한 전력 공급 차질"
    }
}


def classify_energy_impact(title: str, description: str) -> list[dict]:
    """Classify article into energy impact categories."""
    text = (title + " " + description).lower()
    impacts = []
    for key, rule in ENERGY_IMPACT_RULES.items():
        matched = [kw for kw in rule["keywords"] if kw.lower() in text]
        if matched:
            impacts.append({
                "category": key,
                "label": rule["label"],
                "description": rule["description"],
                "matched_keywords": matched[:5]
            })
    return impacts


def fetch_feed(feed_key: str, limit: int = 5, keyword: str = None) -> list[dict]:
    """Fetch and parse a single RSS feed."""
    feed_info = FEEDS[feed_key]
    try:
        resp = requests.get(feed_info["url"], headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return [{"error": f"Failed to fetch {feed_info['name']}: {e}"}]

    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError as e:
        return [{"error": f"XML parse error for {feed_info['name']}: {e}"}]

    channel = root.find("channel")
    if channel is None:
        return [{"error": f"No channel element in {feed_info['name']}"}]

    articles = []
    for item in channel.findall("item"):
        title = item.findtext("title", "").strip()
        link = item.findtext("link", "").strip()
        pub_date = item.findtext("pubDate", "").strip()
        description = re.sub(r"<[^>]+>", " ", item.findtext("description", "")).strip()

        # Keyword filter
        if keyword:
            combined = (title + " " + description).lower()
            if keyword.lower() not in combined:
                continue

        # Energy impact classification
        impacts = classify_energy_impact(title, description)

        articles.append({
            "feed": feed_info["name"],
            "feed_category": feed_info["category"],
            "title": title,
            "link": link,
            "pub_date": pub_date,
            "description": description[:300] + ("..." if len(description) > 300 else ""),
            "energy_impacts": impacts,
            "has_energy_relevance": len(impacts) > 0
        })

        if len(articles) >= limit:
            break

    return articles


def fetch_all(limit_per_feed: int = 5, keyword: str = None) -> dict:
    """Fetch all feeds and aggregate results."""
    all_articles = []
    fetch_errors = []

    for feed_key in FEEDS:
        results = fetch_feed(feed_key, limit=limit_per_feed, keyword=keyword)
        for r in results:
            if "error" in r:
                fetch_errors.append(r["error"])
            else:
                all_articles.append(r)

    # Sort by energy relevance first, then by date
    all_articles.sort(key=lambda x: (not x["has_energy_relevance"], x.get("pub_date", "")))

    return {
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "total_articles": len(all_articles),
        "energy_relevant_count": sum(1 for a in all_articles if a["has_energy_relevance"]),
        "articles": all_articles,
        "errors": fetch_errors
    }


def main():
    parser = argparse.ArgumentParser(description="Fetch NOAA news with energy impact analysis")
    parser.add_argument("--feed", default="all",
                        choices=list(FEEDS.keys()) + ["all"],
                        help="RSS feed to fetch")
    parser.add_argument("--limit", type=int, default=5,
                        help="Max articles per feed")
    parser.add_argument("--keyword", type=str, default=None,
                        help="Filter articles by keyword")
    args = parser.parse_args()

    if args.feed == "all":
        result = fetch_all(limit_per_feed=args.limit, keyword=args.keyword)
    else:
        articles = fetch_feed(args.feed, limit=args.limit, keyword=args.keyword)
        result = {
            "fetched_at": datetime.utcnow().isoformat() + "Z",
            "total_articles": len(articles),
            "energy_relevant_count": sum(1 for a in articles if a.get("has_energy_relevance")),
            "articles": articles,
            "errors": []
        }

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
