import { chromium } from 'playwright';
import fs from 'fs/promises';
import { createObjectCsvWriter } from 'csv-writer';

export default async function runFormTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const results = [];

  const csvWriter = createObjectCsvWriter({
    path: 'testResults.csv',
    header: [
      { id: 'testName', title: 'Test Name' },
      { id: 'passed', title: 'Passed' },
      { id: 'error', title: 'Error' }
    ]
  });

  // === Test 1: Missing First Name ===
  try {
    await page.goto('https://nextbridge.com/contact-us');
    await page.waitForSelector('input[name="LastName"]', { timeout: 10000 });

    await page.fill('input[name="firstName"]', '');
    await page.fill('input[name="LastName"]', 'Doe');
    await page.fill('input[name="Email"]', 'john.doe@example.com');
    await page.fill('input[name="mobile"]', '1234567890');
    await page.selectOption('select[name="services"]', { label: 'Product Development' });
    await page.fill('textarea[name="message"]', 'Test');

    await page.click('button.btn.get-started');
    await page.waitForTimeout(2000);

    const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
      spans.map(el => el.textContent.trim()).join('; ')
    );

    results.push({
      testName: 'Missing Required Fields (First Name)',
      passed: !!errors,
      error: errors || 'No validation message shown'
    });

  } catch (err) {
    results.push({
      testName: 'Missing Required Fields (First Name)',
      passed: false,
      error: err.message
    });
  }

  // === Test 2: Invalid Email Format ===
  try {
    await page.goto('https://nextbridge.com/contact-us');
    await page.waitForSelector('input[name="LastName"]');

    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="LastName"]', 'Doe');
    await page.fill('input[name="Email"]', 'john.doe@wrong'); // Invalid email
    await page.fill('input[name="mobile"]', '1234567890');
    await page.selectOption('select[name="services"]', { label: 'Product Development' });
    await page.fill('textarea[name="message"]', 'Test');

    await page.click('button.btn.get-started');
    await page.waitForTimeout(2000);

    const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
      spans.map(el => el.textContent.trim()).join('; ')
    );

    results.push({
      testName: 'Invalid Email Format',
      passed: !!errors,
      error: errors || 'No validation message shown'
    });

  } catch (err) {
    results.push({
      testName: 'Invalid Email Format',
      passed: false,
      error: err.message
    });
  }

  // === Test 3: Invalid Mobile Number (Less Digits) ===
  try {
    await page.goto('https://nextbridge.com/contact-us');
    await page.waitForSelector('input[name="LastName"]');

    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="LastName"]', 'Smith');
    await page.fill('input[name="Email"]', 'jane@example.com');
    await page.fill('input[name="mobile"]', '12345');
    await page.selectOption('select[name="services"]', { label: 'Product Development' });
    await page.fill('textarea[name="message"]', 'Invalid mobile test');

    await page.click('button.btn.get-started');
    await page.waitForTimeout(2000);

    const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
      spans.map(el => el.textContent.trim()).join('; ')
    );

    results.push({
      testName: 'Invalid Mobile Number (Less Digits)',
      passed: !!errors,
      error: errors || 'No validation message shown'
    });

  } catch (err) {
    results.push({
      testName: 'Invalid Mobile Number (Less Digits)',
      passed: false,
      error: err.message
    });
  }

  // === Test 4: Empty Message Field ===
  try {
    await page.goto('https://nextbridge.com/contact-us');
    await page.waitForSelector('input[name="LastName"]');

    await page.fill('input[name="firstName"]', 'Ali');
    await page.fill('input[name="LastName"]', 'Raza');
    await page.fill('input[name="Email"]', 'ali@example.com');
    await page.fill('input[name="mobile"]', '03211234567');
    await page.selectOption('select[name="services"]', { label: 'Staff Augmentation' });
    await page.fill('textarea[name="message"]', '');

    await page.click('button.btn.get-started');
    await page.waitForTimeout(2000);

    const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
      spans.map(el => el.textContent.trim()).join('; ')
    );

    results.push({
      testName: 'Empty Message Field',
      passed: !!errors,
      error: errors || 'No validation was enforced for empty message field.'
    });

  } catch (err) {
    results.push({
      testName: 'Empty Message Field',
      passed: false,
      error: err.message
    });
  }

  // === Test 5: Dropdown Service Selection Verification ===
  try {
    await page.goto('https://nextbridge.com/contact-us');
    await page.waitForSelector('input[name="LastName"]');

    await page.fill('input[name="firstName"]', 'Sara');
    await page.fill('input[name="LastName"]', 'Khan');
    await page.fill('input[name="Email"]', 'sara@example.com');
    await page.fill('input[name="mobile"]', '03001234567');
    await page.selectOption('select[name="services"]', { label: 'Staff Augmentation' });
    await page.fill('textarea[name="message"]', 'Dropdown test');

    const selected = await page.$eval('select[name="services"]', el => el.selectedOptions[0].label);
    const dropdownCorrect = selected === 'Staff Augmentation';

    results.push({
      testName: 'Dropdown Service Selection Verification',
      passed: dropdownCorrect,
      error: dropdownCorrect ? '' : `Dropdown value was "${selected}" instead of expected.`
    });

  } catch (err) {
    results.push({
      testName: 'Dropdown Service Selection Verification',
      passed: false,
      error: err.message
    });
  }

  // === Test 6: Submit Button Functionality Test ===
  try {
    await page.goto('https://nextbridge.com/contact-us');
    await page.waitForSelector('input[name="LastName"]');

    await page.fill('input[name="firstName"]', 'SubmitTest');
    await page.fill('input[name="LastName"]', 'ButtonCheck');
    await page.fill('input[name="Email"]', 'submit@test.com');
    await page.fill('input[name="mobile"]', '9876543210');
    await page.selectOption('select[name="services"]', { label: 'Staff Augmentation' });
    await page.fill('textarea[name="message"]', 'Testing if the submit button works correctly.');

    await page.click('button.btn.get-started');
    await page.waitForSelector('.wpcf7-response-output', { timeout: 5000 });

    const confirmationText = await page.$eval('.wpcf7-response-output', el => el.textContent.trim());

    const confirmationShown = confirmationText.includes('Thank you for your message');
    const errorShown = confirmationText.includes('There was an error trying to send your message');

    results.push({
      testName: 'Submit Button Functionality Test',
      passed: confirmationShown || errorShown,
      error: confirmationShown ? '' : `Form responded with error: "${confirmationText}"`
    });

  } catch (err) {
    results.push({
      testName: 'Submit Button Functionality Test',
      passed: false,
      error: err.message
    });
  }

  await browser.close();

  // Save results to JSON
  await fs.writeFile('testResults.json', JSON.stringify(results, null, 2));

  // Save results to CSV
  await csvWriter.writeRecords(results)
    .then(() => console.log('✅ CSV file written successfully!'))
    .catch((err) => console.error('❌ Failed to write CSV:', err));

  return results;
}

// import { chromium } from 'playwright';
// import fs from 'fs/promises';

// export default async function runFormTests() {
//   const browser = await chromium.launch({ headless: true });
//   const context = await browser.newContext();
//   const page = await context.newPage();
//   const results = [];

//   // === Test 1: Missing First Name ===
//   try {
//     await page.goto('https://nextbridge.com/contact-us');
//     await page.waitForSelector('input[name="LastName"]', { timeout: 10000 });

//     await page.fill('input[name="firstName"]', '');
//     await page.fill('input[name="LastName"]', 'Doe');
//     await page.fill('input[name="Email"]', 'john.doe@example.com');
//     await page.fill('input[name="mobile"]', '1234567890');
//     await page.selectOption('select[name="services"]', { label: 'Product Development' });
//     await page.fill('textarea[name="message"]', 'Test');

//     await page.click('button.btn.get-started');
//     await page.waitForTimeout(2000); // Wait for UI error messages

//     const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
//       spans.map(el => el.textContent.trim()).join('; ')
//     );

//     results.push({
//       testName: 'Missing Required Fields (First Name)',
//       passed: !!errors,
//       error: errors || 'No validation message shown'
//     });

//   } catch (err) {
//     results.push({
//       testName: 'Missing Required Fields (First Name)',
//       passed: false,
//       error: err.message
//     });
//   }

//       // === Test 2: Invalid Email Format ===
//   try {
//     await page.goto('https://nextbridge.com/contact-us');
//     await page.waitForSelector('input[name="LastName"]');

//     await page.fill('input[name="firstName"]', 'John');
//     await page.fill('input[name="LastName"]', 'Doe');
//     await page.fill('input[name="Email"]', 'john.doe@wrong'); // Invalid email
//     await page.fill('input[name="mobile"]', '1234567890');
//     await page.selectOption('select[name="services"]', { label: 'Product Development' });
//     await page.fill('textarea[name="message"]', 'Test');

//     await page.click('button.btn.get-started');
//     await page.waitForTimeout(2000);

//     const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
//       spans.map(el => el.textContent.trim()).join('; ')
//     );

//     results.push({
//       testName: 'Invalid Email Format',
//       passed: !!errors,
//       error: errors || 'No validation message shown'
//     });

//   } catch (err) {
//     results.push({
//       testName: 'Invalid Email Format',
//       passed: false,
//       error: err.message
//     });
//   }

//   // === Test 3: Invalid Mobile Number (Less Digits) ===
//   try {
//     await page.goto('https://nextbridge.com/contact-us');
//     await page.waitForSelector('input[name="LastName"]');

//     await page.fill('input[name="firstName"]', 'Jane');
//     await page.fill('input[name="LastName"]', 'Smith');
//     await page.fill('input[name="Email"]', 'jane@example.com');
//     await page.fill('input[name="mobile"]', '12345'); // Invalid mobile
//     await page.selectOption('select[name="services"]', { label: 'Product Development' });
//     await page.fill('textarea[name="message"]', 'Invalid mobile test');

//     await page.click('button.btn.get-started');
//     await page.waitForTimeout(2000);

//     const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
//       spans.map(el => el.textContent.trim()).join('; ')
//     );

//     results.push({
//       testName: 'Invalid Mobile Number (Less Digits)',
//       passed: !!errors,
//       error: errors || 'No validation message shown'
//     });

//   } catch (err) {
//     results.push({
//       testName: 'Invalid Mobile Number (Less Digits)',
//       passed: false,
//       error: err.message
//     });
//   }

//   // === Test 4: Empty Message Field ===
//   try {
//     await page.goto('https://nextbridge.com/contact-us');
//     await page.waitForSelector('input[name="LastName"]');

//     await page.fill('input[name="firstName"]', 'Ali');
//     await page.fill('input[name="LastName"]', 'Raza');
//     await page.fill('input[name="Email"]', 'ali@example.com');
//     await page.fill('input[name="mobile"]', '03211234567');
//     await page.selectOption('select[name="services"]', { label: 'Staff Augmentation' });
//     await page.fill('textarea[name="message"]', ''); // Empty

//     await page.click('button.btn.get-started');
//     await page.waitForTimeout(2000);

//     const errors = await page.$$eval('.wpcf7-not-valid-tip', spans =>
//       spans.map(el => el.textContent.trim()).join('; ')
//     );

//     results.push({
//       testName: 'Empty Message Field',
//       passed: !!errors,
//       error: errors || 'No validation was enforced for empty message field.'
//     });

//   } catch (err) {
//     results.push({
//       testName: 'Empty Message Field',
//       passed: false,
//       error: err.message
//     });
//   }

//   // === Test 5: Dropdown Service Selection Verification ===
//   try {
//     await page.goto('https://nextbridge.com/contact-us');
//     await page.waitForSelector('input[name="LastName"]');

//     await page.fill('input[name="firstName"]', 'Sara');
//     await page.fill('input[name="LastName"]', 'Khan');
//     await page.fill('input[name="Email"]', 'sara@example.com');
//     await page.fill('input[name="mobile"]', '03001234567');
//     await page.selectOption('select[name="services"]', { label: 'Staff Augmentation' });
//     await page.fill('textarea[name="message"]', 'Dropdown test');

//     const selected = await page.$eval('select[name="services"]', el => el.selectedOptions[0].label);
//     const dropdownCorrect = selected === 'Staff Augmentation';

//     results.push({
//       testName: 'Dropdown Service Selection Verification',
//       passed: dropdownCorrect,
//       error: dropdownCorrect ? '' : `Dropdown value was "${selected}" instead of expected.`
//     });

//   } catch (err) {
//     results.push({
//       testName: 'Dropdown Service Selection Verification',
//       passed: false,
//       error: err.message
//     });
//   }
//     // === Test 6: Submit Button Functionality Test ===
//   try {
//     await page.goto('https://nextbridge.com/contact-us');
//     await page.waitForSelector('input[name="LastName"]');

//     await page.fill('input[name="firstName"]', 'SubmitTest');
//     await page.fill('input[name="LastName"]', 'ButtonCheck');
//     await page.fill('input[name="Email"]', 'submit@test.com');
//     await page.fill('input[name="mobile"]', '9876543210');
//     await page.selectOption('select[name="services"]', { label: 'Staff Augmentation' });
//     await page.fill('textarea[name="message"]', 'Testing if the submit button works correctly.');

//     await page.click('button.btn.get-started');

//     // Wait for form response message
//     await page.waitForSelector('.wpcf7-response-output', { timeout: 5000 });

//     const confirmationText = await page.$eval('.wpcf7-response-output', el => el.textContent.trim());

//     const confirmationShown = confirmationText.includes('Thank you for your message');
//     const errorShown = confirmationText.includes('There was an error trying to send your message');

//     results.push({
//       testName: 'Submit Button Functionality Test',
//       passed: confirmationShown || errorShown, // Still considers test passed if form responds
//       error: confirmationShown
//         ? ''
//         : `Form responded with error: "${confirmationText}"`
//     });

//   } catch (err) {
//     results.push({
//       testName: 'Submit Button Functionality Test',
//       passed: false,
//       error: err.message
//     });
//   }



//     await browser.close();
//   await fs.writeFile('testResults.json', JSON.stringify(results, null, 2));
//   return results;
// }
