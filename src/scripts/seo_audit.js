import fetch from "node-fetch";
import { chromium } from "playwright";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";

const SITEMAP_URL = "https://www.brahelectric.com/sitemap.xml";
const OUTPUT_CSV = "./seo_audit_results.csv";

async function getUrlsFromSitemap(url) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const response = await fetch(url);
  const xml = await response.text();
  const parsed = parser.parse(xml);

  let urls = [];

  // Case 1: Direct URL set
  if (parsed.urlset && parsed.urlset.url) {
    urls = Array.isArray(parsed.urlset.url)
      ? parsed.urlset.url.map(u => u.loc)
      : [parsed.urlset.url.loc];
  }
  // Case 2: Sitemap index
  else if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
    const sitemapUrls = Array.isArray(parsed.sitemapindex.sitemap)
      ? parsed.sitemapindex.sitemap.map(s => s.loc)
      : [parsed.sitemapindex.sitemap.loc];

    for (const smUrl of sitemapUrls) {
      const smResp = await fetch(smUrl);
      const smXml = await smResp.text();
      const smParsed = parser.parse(smXml);

      if (smParsed.urlset && smParsed.urlset.url) {
        const smUrls = Array.isArray(smParsed.urlset.url)
          ? smParsed.urlset.url.map(u => u.loc)
          : [smParsed.urlset.url.loc];
        urls.push(...smUrls);
      }
    }
  }

  return urls;
}

async function auditUrls(urls) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const url of urls.slice(0, 25)) { // Limit to first 5 for testing
    console.log(`\n🔍 Auditing: ${url}`);
    let title, metaDescription, h1;

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      title = await page.title() || "❌ No title";
      metaDescription = await page.$eval(
        "meta[name='description']",
        el => el.getAttribute("content"),
      ).catch(() => "❌ No meta description");
      h1 = await page.$eval(
        "h1",
        el => el.innerText.trim(),
      ).catch(() => "❌ No H1 tag");

      console.log(`Title: ${title}`);
      console.log(`Meta Description: ${metaDescription}`);
      console.log(`H1: ${h1}`);

    } catch (err) {
      console.log(`❌ Error visiting page: ${err.message}`);
      title = "Error loading page";
      metaDescription = "";
      h1 = "";
    }

    results.push({ url, title, metaDescription, h1 });
  }

  await browser.close();
  return results;
}

function saveResultsToCSV(results, filename) {
  const header = "URL,Title,Meta Description,H1\n";
  const rows = results.map(r =>
    `"${r.url}","${r.title.replace(/"/g, '""')}","${r.metaDescription.replace(/"/g, '""')}","${r.h1.replace(/"/g, '""')}"`
  );
  fs.writeFileSync(filename, header + rows.join("\n"), "utf-8");
  console.log(`\n📄 CSV saved to ${filename}`);
}

(async () => {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);
  const urls = await getUrlsFromSitemap(SITEMAP_URL);

  if (!urls.length) {
    console.error("❌ Could not find URLs in sitemap(s).");
    process.exit(1);
  }

  console.log(`✅ Found ${urls.length} URLs. Starting audit...`);
  const results = await auditUrls(urls);

  saveResultsToCSV(results, OUTPUT_CSV);
})();

