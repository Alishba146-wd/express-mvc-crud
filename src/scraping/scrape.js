import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

export async function scrapeProductFromUrl(productUrl) {
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(productUrl, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    await page.waitForSelector('h1');

    let html = await page.content();
    let $ = cheerio.load(html);

    const product = {
      title: $('h1').text().trim().replace(/\s+/g, ' '),
      sku: $('span[itemprop="name"]').text().trim(),
      price: $('label[itemprop="offers"] span').text().trim() ||
             $('meta[itemprop="price"]').attr('content') || 'N/A',
      description: $('p.mt-2.text-[14px]').first().text().trim(),
      inStock: $('.text-green-600').text().trim(),
      images: [],
      specifications: {},
      
    };

    $('img[alt="Original"]').each((i, el) => {
      let src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        src = 'https://www.brahelectric.com' + src;
      }
      if (src) product.images.push(src);
    });

    $('#specTable tr').each((i, row) => {
      const key = $(row).find('td:first-child').text().trim();
      const value = $(row).find('td:last-child').text().trim();
      if (key && value) {
        product.specifications[key] = value;
      }
    });

    const seeMoreButton = await page.$('span:text("See More")');
    if (seeMoreButton) {
      await seeMoreButton.click();
      await page.waitForTimeout(1000);
      
      html = await page.content();
      $ = cheerio.load(html);

      $('#specTable tr').each((i, row) => {
        const key = $(row).find('td:first-child').text().trim();
        const value = $(row).find('td:last-child').text().trim();
        if (key && value && !product.specifications[key]) {
          product.specifications[key] = value;
        }
      });
    }

    return product;

  } finally {
    if (browser) await browser.close();
  }
}
