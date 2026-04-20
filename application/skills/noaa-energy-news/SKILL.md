---
name: noaa-energy-news
description: >
  Fetches recent U.S. weather and climate news from NOAA (noaa.gov) and
  NOAA Climate.gov RSS feeds, then summarizes them from an energy impact
  perspective — covering electricity demand shifts, renewable output,
  fossil fuel infrastructure risk, wildfire/grid disruption, and
  long-term climate risk.

  Use when the user asks about:
  - NOAA weather or climate news / articles
  - U.S. extreme weather and its energy impact
  - Climate events affecting power grids, natural gas, renewables, or fuel prices
  - Weekly/daily energy-weather briefings
  - Queries like "NOAA 뉴스 에너지 영향", "최근 미국 기후 기사 에너지 관점으로 정리",
    "NOAA news energy impact", "weather news power grid", "기상 뉴스 전력 영향"
---

# NOAA Energy News Skill

Fetch NOAA weather/climate RSS feeds and summarize from energy perspective.

## Workflow

1. **Run** `scripts/fetch_noaa_news.py` to fetch and classify articles
2. **Filter** for energy-relevant articles (or show all if few results)
3. **Summarize** using output format from `references/energy-impact-guide.md`
4. **Present** results in Korean unless user requests English

## Script Usage

```bash
# All feeds, 5 articles each
python skills/noaa-energy-news/scripts/fetch_noaa_news.py

# Specific feed
python skills/noaa-energy-news/scripts/fetch_noaa_news.py --feed highlights --limit 10

# Keyword filter
python skills/noaa-energy-news/scripts/fetch_noaa_news.py --keyword "hurricane" --limit 5
```

**Feed options**: `all` | `noaa` | `highlights` | `climate` | `enso` | `billion-dollar` | `understanding`

## Output Format

Parse the JSON from the script. For each article:
- `energy_impacts[]` → list of matched categories with `label` and `matched_keywords`
- `has_energy_relevance` → boolean for quick filtering

### Display Rules
- **에너지 관련 기사 우선 표시** (has_energy_relevance=true)
- 에너지 무관 기사도 요청 시 포함
- 각 기사에 에너지 영향 카테고리 이모지 레이블 표시
- 시사점(implications) 1-2줄 추가 (업계·투자자 관점)

### Standard Output Structure

```
## 🌦️ NOAA 날씨·기후 뉴스 — 에너지 영향 요약
**조회 시각**: ...  |  **에너지 관련 기사**: N건

---
### 1. [기사 제목](URL)
📅 날짜 | 📡 출처
**요약**: ...
**에너지 영향**: ⚡ 전력 수요 변화 — ...
**시사점**: ...
```

## Energy Impact Reference

For detailed category definitions, US grid context, and price impact rules:
→ Read `references/energy-impact-guide.md` when user asks for deeper analysis
   or when writing implications beyond keyword matching.

## Error Handling

- If script fails (network error), fall back to `tavily_web_search` with query:
  `"NOAA weather climate news site:noaa.gov OR site:climate.gov"`
- If no energy-relevant articles found, present top 5 general articles and note
  that no direct energy impact was detected in current headlines.
