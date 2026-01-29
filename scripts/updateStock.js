import { chromium } from "playwright";
import fs from "fs";

const URL = "https://www.gamersberg.com/blox-fruits/stock";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(URL, { waitUntil: "networkidle" });

  const stock = await page.evaluate(() => {
    function read(tab) {
      return Array.from(
        document.querySelectorAll(`[data-tab="${tab}"] .fruit-card`)
      )
        .map(card => {
          const name = card.querySelector(".fruit-name")?.innerText?.trim();
          const price = card.querySelector(".fruit-price")?.innerText?.trim();
          if (!name || !price) return null;
          return { name, price };
        })
        .filter(Boolean);
    }

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

  fs.writeFileSync("data/stock.json", JSON.stringify(output, null, 2));
})();
