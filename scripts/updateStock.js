import { chromium } from "playwright";
import fs from "fs";

const URL = "https://www.gamersberg.com/blox-fruits/stock";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"]
  });

  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  });

  let stockData = null;

  // Listen for API responses
  page.on("response", async (response) => {
    const url = response.url();

    if (url.includes("/api") && url.includes("blox")) {
      try {
        const json = await response.json();
        if (json?.data) {
          stockData = json;
        }
      } catch {}
    }
  });

  await page.goto(URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // Give the page time to fire API requests
  await page.waitForTimeout(15000);

  await browser.close();

  if (!stockData) {
    throw new Error("Stock API not captured");
  }

  // Normalize data
  const normal = [];
  const mirage = [];

  for (const block of stockData.data) {
    if (block.normalStock) {
      for (const f of block.normalStock) {
        normal.push({
          name: f.name,
          price: f.price
        });
      }
    }
    if (block.mirageStock) {
      for (const f of block.mirageStock) {
        mirage.push({
          name: f.name,
          price: f.price
        });
      }
    }
  }

  const output = {
    updated_at: new Date().toISOString(),
    normal,
    mirage
  };

  fs.writeFileSync(
    "data/stock.json",
    JSON.stringify(output, null, 2)
  );
})();
