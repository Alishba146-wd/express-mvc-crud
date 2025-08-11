import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Step 1: Navigate and fill customer info
  console.log('Navigating to checkout page...');
  await page.goto('https://www.brahelectric.com/Checkout', { waitUntil: 'networkidle' });

  console.log('Filling customer information...');
  await page.fill('input[name="email"]', 'testuser+brah@example.com');
  await page.fill('input[name="first_name"]', 'Test');
  await page.fill('input[name="last_name"]', 'User');
  await page.fill('input[name="phone"]', '5551234567');
  await page.fill('input[placeholder="Company Name (Optional)"]', 'Test Company');
  await page.selectOption('select[placeholder="Customer Type *"]', 'Not a Business');

  // Step 2: Fill shipping address
  console.log('Filling shipping address...');
  const addressInput = await page.$('input.pac-target-input');
  await addressInput.click();
  await addressInput.fill('9800 Fredericksburg Rd');
  await page.waitForTimeout(1000);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.fill('input[name="address2"]', 'Suite 100');
  await page.fill('input[name="city"]', 'San Antonio');
  await page.selectOption('select[name="country"]', 'US');
  await page.selectOption('select[name="state"]', 'TX');
  await page.fill('input[name="zip"]', '78288');

  // Step 3: Get shipping rates
  console.log('Clicking GET SHIPPING RATES button...');
  const getShippingButton = await page.$('button:has-text("GET SHIPPING RATES")');
  const isDisabled = await getShippingButton.getAttribute('disabled');
  if (isDisabled) {
    console.error('Shipping button is disabled! Cannot proceed.');
    await browser.close();
    process.exit(1);
  }
  await getShippingButton.click();

  // Step 4: Select shipping method
  console.log('Waiting for shipping options...');
  try {
    await page.waitForSelector('input[type="radio"][value="UPS® Ground"]', { timeout: 10000 });
    await page.check('input[type="radio"][value="UPS® Ground"]');
    console.log('UPS® Ground shipping selected.');
    await page.waitForTimeout(2000); 
  } catch {
    console.log('Shipping options did not appear.');
    await browser.close();
    process.exit(1);
  }

  // Step 5: Continue to payment
  console.log('Attempting to continue checkout...');
  try {
    const continueButton = await page.waitForSelector('button:has-text("CONTINUE CHECKOUT")', {
      state: 'visible',
      timeout: 10000
    });
    
    await continueButton.scrollIntoViewIfNeeded();
    await page.evaluate(button => button.click(), continueButton);
    
    console.log('Clicked continue button, waiting for payment page...');
    
    // Wait for payment section to load
    await page.waitForSelector('legend:has-text("Payment Method")', { timeout: 15000 });
    console.log('Successfully reached payment page!');
  } catch (error) {
    console.error('Error continuing to payment:', error);
    await page.screenshot({ path: 'payment-error.png' });
    await browser.close();
    process.exit(1);
  }

  // Step 6: Fill payment details
    console.log('Filling payment information...');
    try {
    // Name on card
    await page.fill('input[placeholder="Name On Card"]', 'Test Buyer');
    
    // Card number (already filled with test value in HTML)
    // If you need to modify it:
    await page.fill('input[placeholder="1234-1234-1234-1234"]', '4242424242424242');
    
    // Expiration date - month and year are separate inputs
    await page.fill('input[name="month"]', '12');
    await page.fill('input[name="year"]', '2025'); // Full year in this case
    
    // CVC
    await page.fill('input[placeholder="CVC"]', '123');
    
    console.log('Payment details filled.');
    } catch (error) {
    console.error('Error filling payment details:', error);
    await page.screenshot({ path: 'payment-fill-error.png' });
    await browser.close();
    process.exit(1);
    }

    // Step 7: Modified Place Order Logic
    console.log('Attempting to place order...');
    try {
  // Verify the payment form is complete
  const cardName = await page.inputValue('input[placeholder="Name On Card"]');
  const cardNumber = await page.inputValue('input[placeholder="1234-1234-1234-1234"]');
  const cardCvc = await page.inputValue('input[placeholder="CVC"]');
  
  console.log('Payment details verification:');
  console.log(`- Card Name: ${cardName}`);
  console.log(`- Card Number: ${cardNumber}`);
  console.log(`- CVC: ${cardCvc}`);

  // Scroll to and click Place Order button
  const placeOrderButton = await page.waitForSelector('button:has-text("Place Order")', { 
    state: 'visible',
    timeout: 10000
  });
  
  await placeOrderButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000); // Small delay for stability
  
  // Take screenshot before clicking
  await page.screenshot({ path: 'pre-order.png' });
  
  console.log('Clicking Place Order button...');
  await placeOrderButton.click();
  
  try {
  await page.waitForSelector('.text-red-500.text-sm.pb-4', { timeout: 15000 });
  const messages = await page.$$eval('.text-red-500.text-sm.pb-4', elements =>
    elements.map(el => el.textContent.trim()).filter(Boolean)
  );

  if (messages.length > 0) {
    console.log('Order review message(s) detected:');
    messages.forEach((msg, i) => console.log(`Message ${i + 1}: ${msg}`));
  } else {
    console.log('No order review messages found.');
  }
    } catch {
  console.log('Order review message selector not found within timeout.');
    }

  // Wait for either success or error
  try {
    // Wait for either navigation or confirmation element
    await Promise.race([
      page.waitForNavigation({ timeout: 15000 }),
      page.waitForSelector('.order-confirmation, .thank-you, .error, .alert', { timeout: 15000 })
    ]);
    
    // Check the page content
    const pageContent = await page.textContent('body');
    await page.screenshot({ path: 'post-order.png' });
    
    if (pageContent.match(/thank you|order confirmation|success/i)) {
      console.log('✅ Order successfully placed!');
      // Try to extract order number
      const orderNumber = await page.textContent('* >> text=/order #|number/i') || 'Not found';
      console.log(`📦 Order Number: ${orderNumber.trim()}`);
    } else if (pageContent.match(/error|declined|invalid/i)) {
      console.log('❌ Payment failed!');
      // Try to get more specific error
      const errorMsg = await page.textContent('.error, .alert, .text-red-500, [role="alert"]', { timeout: 2000 })
        .catch(() => 'No specific error message found');
      console.log(`Error details: ${errorMsg}`);
    } else {
      console.log('⚠️ Unknown response after order placement. Check screenshots.');
    }
  } catch (error) {
    console.log('⚠️ No navigation or visible change after order placement.');
    console.log('Possible issues:');
    console.log('- Payment processing is slow');
    console.log('- Form validation failed silently');
    console.log('- Anti-bot protection triggered');
    
    // Check for hidden error messages
    const hiddenErrors = await page.$$eval('.hidden-error, [aria-hidden="true"]', els => 
      els.map(el => el.textContent.trim()).filter(Boolean)
    );
    if (hiddenErrors.length) {
      console.log('Potential hidden errors:', hiddenErrors);
    }
  }
} catch (error) {
  console.error('‼️ Critical error during order placement:', error);
  await page.screenshot({ path: 'critical-error.png' });
}
await browser.close();
})();


