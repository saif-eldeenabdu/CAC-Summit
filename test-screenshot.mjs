import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  
  await page.goto('http://localhost:3000/login');
  
  // Click Saif-Eldeen div
  const divs = await page.$$('div.glass-card');
  for (const div of divs) {
    const text = await page.evaluate(e => e.textContent, div);
    if (text.includes('Saif-Eldeen')) { await div.click(); break; }
  }
  
  await wait(2000); // Wait for navigation to /
  
  // Click 2Pac link
  const links = await page.$$('a');
  for (const a of links) {
    const text = await page.evaluate(e => e.textContent, a);
    if (text.includes('2Pac')) { await a.click(); break; }
  }
  
  await wait(2000);
  await page.screenshot({ path: 'test-step1.png' });
  
  const addButtons = await page.$$('button');
  for (const b of addButtons) {
    const text = await page.evaluate(e => e.textContent, b);
    if (text.includes('Add Speech')) { await b.click(); break; }
  }
  
  await wait(1000);
  await page.screenshot({ path: 'test-step2.png' });
  
  const saveButtons = await page.$$('[role="dialog"] button');
  for (const b of saveButtons) {
    const text = await page.evaluate(e => e.textContent, b);
    if (text.includes('Save')) { await b.click(); break; }
  }
  
  await wait(2000);
  await page.screenshot({ path: 'test-step3.png' });
  
  await page.reload();
  await wait(3000);
  await page.screenshot({ path: 'test-step4.png' });
  
  await browser.close();
})();
