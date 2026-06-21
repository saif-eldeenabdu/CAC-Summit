import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    console.log('PAGE LOG:', text);
    if (text.startsWith('PAYLOAD_TO_SEND ')) {
      import('fs').then(fs => fs.writeFileSync('payload.json', text.replace('PAYLOAD_TO_SEND ', '')));
    }
  });
  
  await page.goto('http://localhost:3000/login');
  
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('.glass-card')).some(c => c.textContent.includes('Saif-Eldeen'));
  }, { timeout: 10000 });
  
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.glass-card'));
    const target = cards.find(c => c.textContent.includes('Saif-Eldeen'));
    target.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await page.goto('http://localhost:3000/delegation/2Pac');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Add Speech'));
    if (addBtn) addBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const modals = Array.from(document.querySelectorAll('.modal-backdrop'));
    if (modals.length > 0) {
      const saveBtn = Array.from(modals[0].querySelectorAll('button')).find(b => b.textContent === 'Add Speech');
      if (saveBtn) saveBtn.click();
    }
  });
  
  await new Promise(r => setTimeout(r, 10000));
  
  await page.reload();
  await new Promise(r => setTimeout(r, 5000));
  
  const speechCount = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    return rows.length;
  });
  console.log("Speech count after reload:", speechCount);
  
  // Also check Firebase directly
  const fbData = await page.evaluate(async () => {
    return new Promise(resolve => {
      const db = window.__db; // Let's attach db to window in firebase.ts
      if (!db) resolve("NO DB ON WINDOW");
      import("firebase/database").then(m => {
        m.get(m.ref(db, "committee-data/chair-saif")).then(snap => resolve(snap.val())).catch(e => resolve("ERR " + e.message));
      });
    });
  });
  console.log("Firebase Data:", fbData);
  
  await browser.close();
})();
