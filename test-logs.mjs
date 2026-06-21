import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/login');
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Saif-Eldeen via evaluate
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.glass-card'));
    const target = cards.find(c => c.textContent.includes('Saif-Eldeen'));
    if (target) {
      console.log("Found chair card, clicking it...");
      target.click();
    } else {
      console.log("Chair card not found!");
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Now we should be on the dashboard, navigate to 2Pac
  await page.goto('http://localhost:3000/delegation/2Pac');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Add Speech
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add Speech'));
    if (addBtn) {
      console.log("Found Add Speech, clicking...");
      addBtn.click();
    } else {
      console.log("Add Speech button not found!");
    }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Save
  await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    if (dialogs.length > 0) {
      const saveBtn = Array.from(dialogs[0].querySelectorAll('button')).find(b => b.textContent.includes('Save'));
      if (saveBtn) {
        console.log("Found Save button, clicking...");
        saveBtn.click();
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Reloading...");
  await page.reload();
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
