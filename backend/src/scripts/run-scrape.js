// CLI script to scrape and store the 5 oldest articles from the last page
require('dotenv').config();
const { connectDB } = require('../utils/db');
const { scrapeFiveOldestFromLastPage } = require('../services/scraper');
const Article = require('../models/Article');

(async () => {
  try {
    await connectDB();
    const items = await scrapeFiveOldestFromLastPage();
    for (const it of items) {
      const originalContent = it.contentHTML || '';
      const payload = {
        title: it.title,
        content: originalContent,
        originalContent,
        sourceUrl: it.url,
        publishedDate: it.publishedDate,
        type: 'original',
        references: [],
      };
      // Upsert by title+sourceUrl to avoid duplicates
      await Article.updateOne(
        { title: payload.title, sourceUrl: payload.sourceUrl },
        { $setOnInsert: payload },
        { upsert: true }
      );
      console.log('Stored:', payload.title);
    }
    console.log('Scraping completed. Count:', items.length);
    process.exit(0);
  } catch (err) {
    console.error('Scraping failed:', err);
    process.exit(1);
  }
})();