const puppeteer = require('puppeteer');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8080';
  console.log('Launching headless browser, opening', url);
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const logs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    const location = msg.location ? JSON.stringify(msg.location()) : '';
    const entry = { type, text, location };
    logs.push(entry);
    console.log('[PAGE]', type, text);
  });

  page.on('pageerror', (err) => {
    console.error('[PAGE ERROR]', err && err.stack ? err.stack : err.toString());
    logs.push({ type: 'pageerror', text: err && err.stack ? err.stack : String(err) });
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait a short while for firebase scripts to load
    await page.waitForTimeout(2000);

    // Try to fill the login form with an intentionally malformed credential to trigger an auth error
    const email = 'invalid@example.com';
    const password = 'badpass';

    await page.evaluate((email, password) => {
      const e = document.getElementById('email');
      const p = document.getElementById('password');
      if (e) e.value = email;
      if (p) p.value = password;
    }, email, password);

    // Click login
    await page.click('#loginBtn');

    // Wait to capture logs produced by auth attempt
    await page.waitForTimeout(5000);

    // Dump collected logs to stdout as JSON
    console.log('\n--- COLLECTED PAGE LOGS (JSON) ---');
    console.log(JSON.stringify(logs, null, 2));

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err && err.stack ? err.stack : err);
    await browser.close();
    process.exit(2);
  }
})();
