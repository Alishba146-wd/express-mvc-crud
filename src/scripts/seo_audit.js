import fetch from "node-fetch";
import { chromium } from "playwright";
import { XMLParser } from "fast-xml-parser";
import fs from "fs";
import path from "path";

const SITEMAP_URL = "https://www.brahelectric.com/sitemap.xml";
const BASE_URL = "https://www.brahelectric.com";

const OUTPUT_CSV = path.join(process.cwd(), "seo_audit_report.csv");

async function checkRobotsAndSitemap(baseUrl, sitemapUrl) {
  const robotsUrl = `${baseUrl}/robots.txt`;
  let robotsExists = false;
  let sitemapInRobots = false;
  let sitemapExists = false;

  try {
    const res = await fetch(robotsUrl);
    if (res.ok) {
      robotsExists = true;
      const text = await res.text();
      if (text.includes(sitemapUrl)) {
        sitemapInRobots = true;
      }
    }
  } catch {
    robotsExists = false;
  }

  try {
    const res = await fetch(sitemapUrl);
    if (res.ok) {
      sitemapExists = true;
    }
  } catch {
    sitemapExists = false;
  }

  return { robotsExists, sitemapExists, sitemapInRobots };
}

async function getUrlsFromSitemap(url) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const response = await fetch(url);
  const xml = await response.text();
  const parsed = parser.parse(xml);

  let urls = [];

  if (parsed.urlset && parsed.urlset.url) {
    urls = Array.isArray(parsed.urlset.url)
      ? parsed.urlset.url.map(u => u.loc)
      : [parsed.urlset.url.loc];
  } else if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
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

  for (const url of urls.slice(0, 25)) {
    console.log(`\n🔍 Auditing: ${url}`);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      const title = await page.title();
      const metaDescription = await page
        .$eval("meta[name='description']", el => el.getAttribute("content"))
        .catch(() => "❌ No meta description");

      const h1 = await page
        .$eval("h1", el => el.innerText.trim())
        .catch(() => "❌ No H1 tag");

      results.push({ url, title, metaDescription, h1 });
      console.log(`Title: ${title || "❌ No title"}`);
      console.log(`Meta Description: ${metaDescription}`);
      console.log(`H1: ${h1}`);
    } catch (err) {
      results.push({ url, title: "❌ Error", metaDescription: "", h1: "", error: err.message });
      console.log(`❌ Error visiting page: ${err.message}`);
    }
  }

  await browser.close();
  return results;
}

function saveCsv(reportData, seoData) {
  // Make sure folder exists if OUTPUT_CSV is in subfolder
  const folderPath = path.dirname(OUTPUT_CSV);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  let csv = "Check,Result\n";
  csv += `Robots.txt Exists,${reportData.robotsExists}\n`;
  csv += `Sitemap.xml Exists,${reportData.sitemapExists}\n`;
  csv += `Sitemap in Robots.txt,${reportData.sitemapInRobots}\n\n`;

  csv += "URL,Title,Meta Description,H1\n";
  seoData.forEach(r => {
    csv += `"${r.url}","${r.title}","${r.metaDescription}","${r.h1}"\n`;
  });

  fs.writeFileSync(OUTPUT_CSV, csv);
  console.log(`\n✅ CSV report saved to: ${OUTPUT_CSV}`);
}

(async () => {
  console.log(`Fetching sitemap: ${SITEMAP_URL}`);

  const checks = await checkRobotsAndSitemap(BASE_URL, SITEMAP_URL);
  console.log("Robots.txt Exists:", checks.robotsExists);
  console.log("Sitemap.xml Exists:", checks.sitemapExists);
  console.log("Sitemap in Robots.txt:", checks.sitemapInRobots);

  const urls = await getUrlsFromSitemap(SITEMAP_URL);
  if (!urls.length) {
    console.error("❌ Could not find URLs in sitemap(s).");
    process.exit(1);
  }

  console.log(`✅ Found ${urls.length} URLs. Starting audit...`);
  const seoResults = await auditUrls(urls);

  saveCsv(checks, seoResults);
})();

