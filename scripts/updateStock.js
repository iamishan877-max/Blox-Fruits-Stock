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

  // Navigate without networkidle
  await page.goto(URL, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  // Wait for ANY fruit card to appear
  await page.waitForSelector(".fruit-card", {
    timeout: 60000
  });

  const stock = await page.evaluate(() => {
    const read = (tab) => {
      return Array.from(
        document.querySelectorAll(`[data-tab="${tab}"] .fruit-card`)
      )
        .map(card => {
          const name =
            card.querySelector(".fruit-name")?.innerText?.trim();
          const price =
            card.querySelector(".fruit-price")?.innerText?.trim();

          if (!name || !price) return null;
          return { name, price };
        })
        .filter(Boolean);
    };

    return {
      normal: read("normal"),
      mirage: read("mirage")
    };
  });

  await browser.close();

  const output = {
    updated_at: new Date().toISOString(),
    normal: stock.normal,
    mirage: stock.mirage
  };

  fs.writeFileSync(
    "data/stock.json",
    JSON.stringify(output, null, 2)
  );
})();
