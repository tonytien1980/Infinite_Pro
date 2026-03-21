from __future__ import annotations

import html
import re
from dataclasses import dataclass
from urllib import parse, request

SEARCH_ENDPOINT = "https://duckduckgo.com/html/"
RESULT_LINK_RE = re.compile(
    r'<a[^>]+class="result__a"[^>]+href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>',
    re.IGNORECASE | re.DOTALL,
)
RESULT_SNIPPET_RE = re.compile(
    r'<a[^>]+class="result__snippet"[^>]*>(?P<snippet>.*?)</a>|'
    r'<div[^>]+class="result__snippet"[^>]*>(?P<snippet_div>.*?)</div>',
    re.IGNORECASE | re.DOTALL,
)


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str


def _clean_html_fragment(value: str) -> str:
    cleaned = re.sub(r"<[^>]+>", " ", value)
    cleaned = html.unescape(cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


def _decode_duckduckgo_redirect(url: str) -> str:
    parsed = parse.urlparse(url)
    if parsed.netloc != "duckduckgo.com" or not parsed.path.startswith("/l/"):
        return url

    query = parse.parse_qs(parsed.query)
    if "uddg" in query and query["uddg"]:
        return parse.unquote(query["uddg"][0])
    return url


def search_external_sources(
    query: str,
    *,
    max_results: int = 3,
    timeout_seconds: int = 20,
) -> list[SearchResult]:
    search_query = query.strip()
    if not search_query:
        return []

    search_url = f"{SEARCH_ENDPOINT}?{parse.urlencode({'q': search_query})}"
    http_request = request.Request(
        search_url,
        headers={
            "User-Agent": "Infinite-Pro/0.1 (+https://localhost)",
        },
    )

    with request.urlopen(http_request, timeout=timeout_seconds) as response:
        raw_html = response.read().decode("utf-8", errors="ignore")

    links = list(RESULT_LINK_RE.finditer(raw_html))
    snippets = list(RESULT_SNIPPET_RE.finditer(raw_html))
    results: list[SearchResult] = []
    seen_urls: set[str] = set()

    for index, match in enumerate(links):
        if len(results) >= max_results:
            break

        url = _decode_duckduckgo_redirect(html.unescape(match.group("href")).strip())
        title = _clean_html_fragment(match.group("title"))
        snippet_match = snippets[index] if index < len(snippets) else None
        snippet = ""
        if snippet_match:
            snippet = _clean_html_fragment(
                snippet_match.group("snippet") or snippet_match.group("snippet_div") or ""
            )

        if not url or not title or url in seen_urls:
            continue

        seen_urls.add(url)
        results.append(SearchResult(title=title, url=url, snippet=snippet))

    return results
