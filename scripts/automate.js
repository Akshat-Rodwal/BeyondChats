/**
 * Automation: rewrite original articles using reliable Google results via SerpAPI
 * - Fetch original articles from backend
 * - Search Google with "<title>" -site:beyondchats.com using SerpAPI
 * - Validate top 2 organic results: blog/article + content length > 800 chars
 * - Scrape main content via jsdom + @mozilla/readability
 * - Call LLM (OpenAI or Gemini) only when 2 references available
 * - Save updated via POST /api/articles with type="updated" and references
 */
require("dotenv").config();
const axios = require("axios");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const API_BASE = process.env.API_BASE || "http://localhost:5000";
const BACKEND_ARTICLES = `${API_BASE}/api/articles`;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

function isValidUrl(u) {
    try {
        const url = new URL(u);
        return ["http:", "https:"].includes(url.protocol);
    } catch {
        return false;
    }
}

function looksLikeArticle(url) {
    const u = url.toLowerCase();
    return (
        u.includes("/blog") ||
        u.includes("/blogs") ||
        u.includes("/article") ||
        u.includes("/posts/") ||
        u.includes("/news/") ||
        u.includes("/insights/") ||
        /\/\d{4}\/\d{2}\//.test(u) // common date-based article paths
    );
}

function extractKeywordsFromTitle(title) {
    const stop = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "of",
        "for",
        "to",
        "in",
        "on",
        "with",
        "without",
        "by",
        "about",
        "is",
        "are",
        "was",
        "were",
        "be",
        "being",
        "been",
        "how",
        "what",
        "which",
        "why",
        "when",
        "when",
    ]);
    const words = (title || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w && !stop.has(w) && w.length > 3);
    // pick top 5 unique keywords
    const uniq = Array.from(new Set(words));
    return uniq.slice(0, 5).join(" ");
}

async function serpApiSearch(query, num = 10) {
    if (!SERPAPI_KEY) {
        throw new Error("Missing SERPAPI_KEY");
    }
    const params = {
        engine: "google",
        q: query,
        api_key: SERPAPI_KEY,
        num,
    };
    const { data } = await axios.get("https://serpapi.com/search.json", {
        params,
        timeout: 20000,
    });
    const results = (data.organic_results || [])
        .map((r) => r.link)
        .filter(Boolean);
    return results;
}

async function scrapeReadable(url) {
    const { data: html } = await axios.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
        timeout: 20000,
    });
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const contentHTML = article?.content || "";
    const textContent = article?.textContent || "";
    const title =
        article?.title ||
        dom.window.document.querySelector("title")?.textContent ||
        url;
    return { title, contentHTML, textContent };
}

function buildPrompt({ originalTitle, originalHTML, refs }) {
    const refsText = refs
        .map(
            (r, i) =>
                `Reference ${i + 1}: ${
                    r.url
                }\nContent (truncated): ${r.text.slice(0, 2000)}`
        )
        .join("\n\n");
    return `
You are an expert technical writer. Rewrite the following article to improve formatting, readability, and SEO.
Inspiration: Use the ideas and structure cues from the reference articles, but avoid any plagiarism. Do not copy sentences verbatim. Produce clean HTML with semantic tags (h2/h3, p, ul/ol, strong/em, code where needed).

Original Title:
${originalTitle}

Original Article HTML:
${originalHTML}

References:
${refsText}

Rules:
- Preserve the factual meaning of the original article.
- Improve clarity, flow, and scannability.
- Use concise headings and bullet lists when helpful.
- Avoid overly flowery language. Keep professional tone.
- Output only HTML for the rewritten content body (no <html> or <body>).
`;
}

async function callLLM(prompt) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (openaiKey) {
        const openai = new OpenAI({ apiKey: openaiKey });
        const resp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful writing assistant.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.4,
        });
        return resp.choices[0].message.content;
    } else if (geminiKey) {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const resp = await model.generateContent(prompt);
        return resp.response.text();
    }
    throw new Error(
        "Missing LLM API key: provide OPENAI_API_KEY or GEMINI_API_KEY"
    );
}

async function findTwoValidReferences(title) {
    const baseQuery = `"${title}" -site:beyondchats.com`;
    let links = await serpApiSearch(baseQuery, 10);
    links = links.filter(
        (u) => isValidUrl(u) && !u.includes("beyondchats.com")
    );

    const candidates = [];
    for (const url of links) {
        try {
            const {
                title: rt,
                contentHTML,
                textContent,
            } = await scrapeReadable(url);
            if (looksLikeArticle(url) && (textContent || "").length > 800) {
                candidates.push({
                    url,
                    title: rt,
                    html: contentHTML,
                    text: textContent,
                });
            }
            if (candidates.length >= 2) break;
        } catch (err) {
            // ignore bad refs
        }
    }
    if (candidates.length >= 2) return candidates.slice(0, 2);

    // Retry with keywords extracted from title
    const kw = extractKeywordsFromTitle(title);
    if (kw) {
        let links2 = await serpApiSearch(`"${kw}" -site:beyondchats.com`, 10);
        links2 = links2.filter(
            (u) => isValidUrl(u) && !u.includes("beyondchats.com")
        );
        for (const url of links2) {
            try {
                const {
                    title: rt,
                    contentHTML,
                    textContent,
                } = await scrapeReadable(url);
                if (looksLikeArticle(url) && (textContent || "").length > 800) {
                    candidates.push({
                        url,
                        title: rt,
                        html: contentHTML,
                        text: textContent,
                    });
                }
                if (candidates.length >= 2) break;
            } catch (err) {
                // ignore bad refs
            }
        }
    }
    return candidates.slice(0, 2);
}

async function run() {
    const { data } = await axios.get(
        `${BACKEND_ARTICLES}?type=original&limit=50`
    );
    const originals = data.items || [];
    console.log("Originals fetched:", originals.length);

    for (const art of originals) {
        try {
            const refs = await findTwoValidReferences(art.title);
            if (refs.length < 2) {
                console.warn(
                    "Skipping (not enough valid references):",
                    art.title
                );
                continue;
            }
            const prompt = buildPrompt({
                originalTitle: art.title,
                originalHTML: art.originalContent,
                refs,
            });
            const rewrittenHTML = await callLLM(prompt);
            const finalHTML =
                `${rewrittenHTML}\n\n<hr/>\n<section>\n<h3>References</h3>\n<ul>\n` +
                refs
                    .map(
                        (r) =>
                            `<li><a href="${
                                r.url
                            }" target="_blank" rel="noopener">${
                                r.title || r.url
                            }</a></li>`
                    )
                    .join("\n") +
                `\n</ul>\n</section>`;

            const payload = {
                title: art.title,
                content: finalHTML,
                originalContent: art.originalContent,
                sourceUrl: art.sourceUrl,
                type: "updated",
                references: refs.map((r) => r.url),
            };
            const { data: saved } = await axios.post(
                BACKEND_ARTICLES,
                payload,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
            console.log("Updated article saved:", saved._id, art.title);
        } catch (err) {
            console.error(
                "Automation error for article:",
                art.title,
                err.message
            );
        }
    }
    console.log("Automation completed.");
}

run().catch((err) => {
    console.error("Fatal automation error:", err);
    process.exit(1);
});