// Scraper service for BeyondChats blog
// Strategy:
// 1) Parse pagination on /blogs to find the last page number
// 2) Fetch last page, extract article links
// 3) Sort by oldest (assume last page holds oldest; pick 5)
// 4) For each article, fetch title, date, and full content
const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://beyondchats.com';
const BLOGS_URL = `${BASE_URL}/blogs/`;

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    headers: {
      // Pretend to be a browser to avoid basic bot blocks
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    timeout: 20000,
  });
  return data;
}

async function getLastPageNumber() {
  const html = await fetchHTML(BLOGS_URL);
  const $ = cheerio.load(html);
  let max = 1;
  // Heuristics: find pagination anchors that look like page numbers
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = ($(el).text() || '').trim();
    const m = text.match(/^\d+$/);
    if (m) {
      const num = Number(m[0]);
      if (!Number.isNaN(num)) max = Math.max(max, num);
    }
    // Alternative: look for URLs like /blogs/page/<n> or ?page=<n>
    const m2 = href.match(/blogs\/page\/(\d+)/) || href.match(/[?&]page=(\d+)/);
    if (m2 && m2[1]) {
      const num = Number(m2[1]);
      if (!Number.isNaN(num)) max = Math.max(max, num);
    }
  });
  return max;
}

async function extractArticlesFromPage(pageNumber) {
  const pageUrl =
    pageNumber && pageNumber > 1 ? `${BLOGS_URL}page/${pageNumber}/` : BLOGS_URL;
  const html = await fetchHTML(pageUrl);
  const $ = cheerio.load(html);
  const links = [];
  // Heuristic selectors for blog cards/lists
  $('a').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = ($(el).text() || '').trim();
    if (
      href.startsWith(BASE_URL) ||
      (href.startsWith('/blogs/') && !href.endsWith('/blogs/'))
    ) {
      // Avoid non-article navigations (filter by content-ish text)
      if (text.length > 0) {
        links.push(new URL(href, BASE_URL).toString());
      }
    }
  });
  // Deduplicate and keep unique article URLs likely under /blogs/
  const unique = Array.from(new Set(links)).filter((u) =>
    u.includes('/blogs/')
  );
  return unique;
}

async function scrapeArticle(url) {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // Title heuristics
  const title =
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    url;

  // Date heuristics
  const dateText =
    $('time').first().attr('datetime') ||
    $('time').first().text().trim() ||
    $('meta[property="article:published_time"]').attr('content') ||
    '';

  // Content heuristics: prefer main/article
  let contentHTML = $('main').first().html();
  if (!contentHTML) contentHTML = $('article').first().html();
  if (!contentHTML) {
    contentHTML = $('section').first().html();
  }
  if (!contentHTML) {
    // Fallback: collect paragraphs
    contentHTML = $('p')
      .map((_, el) => $.html(el))
      .get()
      .join('\n');
  }
  const cleanHTML = contentHTML || '';

  return {
    title,
    url,
    publishedDate: dateText,
    contentHTML: cleanHTML,
  };
}

async function scrapeFiveOldestFromLastPage() {
  const last = await getLastPageNumber();
  const urls = await extractArticlesFromPage(last);
  // On the last page, items are already the oldest by pagination; pick 5 oldest
  const target = urls.slice(-5); // ensure we pick last 5 if the array is longer
  const results = [];
  for (const u of target) {
    try {
      const a = await scrapeArticle(u);
      results.push(a);
    } catch (err) {
      // Continue even if one article fails
      console.error('Failed to scrape article:', u, err.message);
    }
  }
  return results;
}

module.exports = {
  scrapeFiveOldestFromLastPage,
  scrapeArticle,
};

