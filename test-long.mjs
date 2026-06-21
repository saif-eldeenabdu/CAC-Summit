import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('http://localhost:3000/login');
  
  console.log("Waiting for chairs to load...");
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('.glass-card')).some(c => c.textContent.includes('Saif-Eldeen'));
  }, { timeout: 10000 });
  
  console.log("Clicking Saif-Eldeen...");
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.glass-card'));
    const target = cards.find(c => c.textContent.includes('Saif-Eldeen'));
    target.click();
  });
  
  // Wait for redirect and data load
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Navigating to 2Pac...");
  await page.goto('http://localhost:3000/delegation/2Pac');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Adding speech...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add Speech'));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Saving speech...");
  await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('[role="dialog"]'));
    if (dialogs.length > 0) {
      const saveBtn = Array.from(dialogs[0].querySelectorAll('button')).find(b => b.textContent === 'Add Speech');
      if (saveBtn) saveBtn.click();
    }
  });
  
  console.log("Waiting 10 SECONDS for Firebase to sync...");
  await new Promise(r => setTimeout(r, 10000));
  
  console.log("Reloading...");
  await page.reload();
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Check if speech persisted...");
  const url = await page.evaluate(() => window.location.href);
  console.log("Current URL after reload:", url);
  const speechCount = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    return rows.length;
  });
  console.log("Speech count after reload:", speechCount);
  
  await browser.close();
})();
