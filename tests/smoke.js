const { chromium } = require('playwright');
const fs = require('node:fs');

const base = 'http://127.0.0.1:8000';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  // The scanner is tested separately for a pinned version. Keep smoke tests independent
  // of the external CDN and camera permissions.
  await page.route('https://unpkg.com/**', route => route.abort());
  const check = (condition, message) => { if (!condition) throw new Error(message); };

  try {
    await page.goto(base);
    await page.getByRole('button', { name: 'Add / Scan' }).click();
    await page.locator('#seriesName').fill('TEST Series');
    await page.locator('#issue').fill('1');
    await page.locator('#publisher').fill('Test Publisher');
    await page.locator('#paid').fill('2.50');
    await page.locator('#value').fill('5');
    await page.getByRole('button', { name: 'Save comic' }).click();
    await page.getByRole('button', { name: 'Inventory', exact: true }).click();
    check(await page.locator('#inventoryBody').getByText('TEST Series').count() === 1, 'Add comic failed');

    await page.locator('#inventoryBody button[data-action="edit"]').click();
    await page.locator('#issue').fill('2');
    await page.getByRole('button', { name: 'Save comic' }).click();
    check(await page.locator('#inventoryBody').getByText('#2').count() === 1, 'Edit comic failed');

    page.once('dialog', d => d.accept());
    await page.locator('#inventoryBody button[data-action="delete"]').click();
    check(await page.locator('#inventoryBody').getByText('TEST Series').count() === 0, 'Delete comic failed');

    await page.getByRole('button', { name: 'Add / Scan' }).click();
    await page.locator('#seriesName').fill('Series Goal Test');
    await page.locator('#issue').fill('1');
    await page.getByRole('button', { name: 'Save comic' }).click();
    await page.getByRole('button', { name: 'Series', exact: true }).click();
    page.once('dialog', d => d.accept('10'));
    await page.locator('#seriesBody button[data-action="goal"]').click();
    check((await page.locator('#seriesBody').innerText()).includes('10%'), 'Series goal save or completion calculation failed');

    await page.getByRole('button', { name: 'Backup & Data' }).click();
    page.once('dialog', d => d.accept());
    await page.locator('#jsonFile').setInputFiles({
      name: 'trusted-test.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({comics:[{id:'attacker-controlled-id',series:'Imported Test',issue:'7',status:'Owned',paid:1,value:3}],seriesGoals:{'Imported Test':10}}))
    });
    check((await page.locator('#inventoryBody').innerText()).includes('Imported Test') === false, 'Unexpected view after JSON restore');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('comicVault.personal.v1')));
    check(stored.comics.length === 1 && stored.comics[0].series === 'Imported Test', 'Valid JSON restore failed');
    check(stored.comics[0].id !== 'attacker-controlled-id', 'Imported comic ID was not regenerated');

    page.once('dialog', d => d.accept());
    await page.locator('#jsonFile').setInputFiles({
      name: 'invalid-test.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({comics:[{series:'',issue:'1'}]}))
    });
    const afterInvalid = await page.evaluate(() => JSON.parse(localStorage.getItem('comicVault.personal.v1')));
    check(afterInvalid.comics.length === 1 && afterInvalid.comics[0].series === 'Imported Test', 'Invalid JSON replaced the existing collection');

    await page.locator('#csvFile').setInputFiles({
      name: 'test.csv', mimeType: 'text/csv',
      buffer: Buffer.from('series,issue,publisher,paid,value,status\nCSV Test,3,Test Publisher,4,8,Owned\n')
    });
    page.once('dialog', d => d.accept());
    const afterCsv = await page.evaluate(() => JSON.parse(localStorage.getItem('comicVault.personal.v1')));
    check(afterCsv.comics.length === 2 && afterCsv.comics.some(c => c.series === 'CSV Test' && c.issue === '3'), 'CSV import failed');

    const html = fs.readFileSync('index.html', 'utf8');
    check(html.includes('@zxing/browser@0.2.1') && !html.includes('@zxing/browser@latest'), 'Scanner dependency is not pinned');
    check(failures.length === 0, 'Browser console errors: ' + failures.join('; '));
    console.log('PASS: add/edit/delete, series goal, valid and invalid JSON restore, CSV import, scanner version pin.');
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exit(1); });
