import { chromium } from 'playwright';

export default async function myFirstScript() {
  console.log("Starting form test...");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://nextbridge.com/contact-us');

  await page.waitForSelector('input[name="LastName"]', { timeout: 10000 });

  await page.fill('input[name="firstName"]', 'TestFirstName'); 
  await page.fill('input[name="LastName"]', 'TestLastName');
  await page.fill('input[name="Email"]', 'test@example.com');
  await page.fill('input[name="mobile"]', '1234567890');

  await page.selectOption('select[name="services"]', { label: 'Product Development' });

  await page.fill('textarea[name="message"]', 'This is a test message from Playwright.');

  await page.click('button.btn.get-started'); 

  console.log("✅ Form submitted!");
  await browser.close();
}

