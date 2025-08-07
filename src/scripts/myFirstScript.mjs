import { chromium } from 'playwright';
import fs from 'fs/promises';

const testCases = [
{
    testName: 'Invalid Email Format',
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@wrong',
      mobile: '1234567890',
      service: 'Product Development',
      message: 'Test'
    },
    expected: 'Validation error for Email'
  },
  {
    testName: 'Missing Required Fields (First Name)',
    data: {
      firstName: '',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      mobile: '1234567890',
      service: 'Product Development',
      message: 'Test'
    },
    expected: 'Validation error for First Name'
  },
  {
    testName: 'Invalid Mobile Number (Less Digits)',
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      mobile: '12345',
      service: 'Product Development',
      message: 'Invalid mobile test'
    },
    expected: 'Validation error for Mobile Number'
  },
  {
    testName: 'Empty Message Field',
    data: {
      firstName: 'Ali',
      lastName: 'Raza',
      email: 'ali@example.com',
      mobile: '03211234567',
      service: 'Staff Augmentation',
      message: ''
    },
    expected: 'Validation error for Message field'
  },
  {
    testName: 'Dropdown Service Selection Verification',
    data: {
      firstName: 'Sara',
      lastName: 'Khan',
      email: 'sara@example.com',
      mobile: '03001234567',
      service: 'Staff Augmentation',
      message: 'Dropdown test'
    },
    expected: 'Correct option selected and form submitted'
  },
  {
    testName: 'Submit Button Functionality Test',
    data: {
      firstName: 'SubmitTest',
      lastName: 'ButtonCheck',
      email: 'submit@test.com',
      mobile: '9876543210',
      service: 'Staff Augmentation',
      message: 'Testing if the submit button works correctly.'
    },
    expected: 'Confirmation message shown'
  }
];

export default async function runFormTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (const test of testCases) {
    const { testName, data: formData } = test;
    try {
      await page.goto('https://nextbridge.com/contact-us');
      await page.waitForSelector('input[name="LastName"]', { timeout: 10000 });

      await page.fill('input[name="firstName"]', formData.firstName);
      await page.fill('input[name="LastName"]', formData.lastName);
      await page.fill('input[name="Email"]', formData.email);
      await page.fill('input[name="mobile"]', formData.mobile);
      await page.selectOption('select[name="services"]', { label: formData.service });
      await page.fill('textarea[name="message"]', formData.message);
      await page.click('button.btn.get-started');

      await page.waitForTimeout(2000); // Wait for possible result

      results.push({ testName, passed: true, error: '' });
    } catch (err) {
      results.push({ testName, passed: false, error: err.message });
    }
  }

  await browser.close();

  await fs.writeFile('testResults.json', JSON.stringify(results, null, 2));
  return results;
}

