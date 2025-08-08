import { scrapeProductFromUrl } from '../scraping/scrape.js';

export async function scrapeFromUrl(req, res) {
  const { url } = req.body;

  if (!url || !url.startsWith('https://www.brahelectric.com/')) {
    return res.status(400).json({ error: 'Invalid or missing URL.' });
  }

  try {
    const data = await scrapeProductFromUrl(url);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Scraping failed:', error);
    res.status(500).json({ error: 'Failed to scrape product data.' });
  }
}
