const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const https = require('https');

(async () => {
  const url = 'https://ysmranchi-opac.kohacloud.in/';
  const counterId = '#sfcwyj2htxl5rq5czy877gqsl1cqcl97g6t img';

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  await page.waitForSelector(counterId, { timeout: 5000 });
  const counterImgUrl = await page.$eval(counterId, img => img.src);
  console.log('🖼️ Counter image URL:', counterImgUrl);

  const imagePath = 'counter.png';
  const file = fs.createWriteStream(imagePath);

  await new Promise((resolve, reject) => {
    https.get(counterImgUrl, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });

  console.log('📥 Image downloaded:', imagePath);

  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: m => console.log(m.status)
  });

  const text = result.data.text.replace(/\D/g, '');
  console.log('✅ Footfall Count:', text);

  const timestamp = new Date().toISOString();
  fs.appendFileSync('footfall-log.csv', `${timestamp},${text}\n`);

  await browser.close();
})();
