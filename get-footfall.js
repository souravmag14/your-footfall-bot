const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Util to get today's date string
function getTodayDate() {
  const now = new Date();
  return now.toISOString().split('T')[0]; // e.g., 2025-07-22
}

(async () => {
  const url = 'https://ysmranchi-opac.kohacloud.in/';
  const counterId = '#sfcwyj2htxl5rq5czy877gqsl1cqcl97g6t img';

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for the counter image to load
  await page.waitForSelector(counterId, { timeout: 7000 });

  // Get image URL
  const counterImgUrl = await page.$eval(counterId, img => img.src);
  console.log('🖼️ Counter image URL:', counterImgUrl);

  // Download the image
  const imagePath = path.join(__dirname, 'counter.png');
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

  // OCR processing
  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: m => console.log(m.status)
  });

  const footfall = result.data.text.replace(/\D/g, '');
  console.log(`✅ Footfall Count for ${getTodayDate()}: ${footfall}`);

  // Log to CSV
  const logPath = path.join(__dirname, 'footfall-log.csv');
  const row = `${getTodayDate()},${footfall}\n`;
  fs.appendFileSync(logPath, row);
  console.log('📊 Footfall saved to:', logPath);

  await browser.close();
})();
