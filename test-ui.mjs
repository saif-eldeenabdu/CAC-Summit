import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`BROWSER ERROR: ${error.message}`);
  });

  console.log("Navigating to http://localhost:3000/login ...");
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  console.log("Logging in as chair-saif...");
  // Find the button for Saif-Eldeen
  await page.waitForSelector('button');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes("Saif-Eldeen")) {
      await btn.click();
      break;
    }
  }

  console.log("Waiting for navigation to combined-scores...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("Navigating to /delegation/2Pac ...");
  await page.goto('http://localhost:3000/delegation/2Pac', { waitUntil: 'networkidle2' });

  console.log("Clicking Add Speech...");
  // Add a speech
  const addButtons = await page.$$('button');
  for (const btn of addButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes("Add Speech")) {
      await btn.click();
      break;
    }
  }

  // Wait for dialog
  await page.waitForSelector('dialog, [role="dialog"]', { timeout: 2000 }).catch(() => {});
  
  // Submit the speech
  const saveButtons = await page.$$('button');
  for (const btn of saveButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes("Save")) {
      await btn.click();
      break;
    }
  }

  console.log("Speech saved, waiting 2 seconds for firebase write...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("Reloading page...");
  await page.reload({ waitUntil: 'networkidle2' });

  console.log("Waiting 2 seconds to see if score persists...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("Done.");
  await browser.close();
})();
