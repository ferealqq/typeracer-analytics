import puppeteer from "puppeteer";
import { type EvaluateReturn, type Page } from "./types";

export const test_firstPage =
  "https://data.typeracer.com/pit/race_history?user=ferealqq&universe=play&n=100&cursor=&startDate=";

export const firstPage = (username: string) =>
  `https://data.typeracer.com/pit/race_history?user=${username}&universe=play&n=100&cursor=&startDate=`;

export const getPage = async (currentPage: string): Promise<Page> => {
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  const browser = await puppeteer.launch({
    headless: "new",
  });

  // Open a new page
  const page = await browser.newPage();

  // On this new page:
  // - open the "http://quotes.toscrape.com/" website
  // - wait until the dom content is loaded (HTML is ready)
  await page.goto(currentPage, {
    waitUntil: "domcontentloaded",
  });

  // Get page data
  const evaluateData = await page.evaluate(() => {
    // Fetch the first element with class "quote"
    const rows = document.querySelectorAll("div.Scores__Table__Row");
    const all: EvaluateReturn[] = [];
    rows.forEach((row) => {
      const wpmAndPercentage = row.querySelectorAll(
        "div.profileTableHeaderRaces"
      );
      let wpm = 0;
      let percentage = 0;
      wpmAndPercentage.forEach((value) => {
        if (value.innerHTML.includes("WPM")) {
          wpm = parseInt(value.innerHTML);
        } else {
          percentage = parseFloat(value.innerHTML.replace("%", ""));
        }
      });
      const raceNumber = parseInt(
        row.querySelector("div.profileTableHeaderUniverse > a")?.innerHTML ??
          "0"
      );
      const dateElem = row.querySelector("div.profileTableHeaderDate");
      const dateStr = dateElem?.innerHTML.trim().includes("today")
        ? undefined
        : dateElem?.innerHTML.trim();
      all.push({
        raceNumber,
        wpm,
        percentage,
        date: dateStr,
      });
    });

    let nextPage;

    const ahrefs = document.querySelectorAll("a");
    ahrefs.forEach((value) => {
      if (value.innerText.includes("load older results")) {
        nextPage = value.href;
      }
    });

    return { data: all, nextPage };
  });
  const data = {
    nextPage: evaluateData.nextPage,
    data: evaluateData.data.map((item) => ({
      ...item,
      date: item.date ? new Date(item.date) : new Date(), // for some reason this cannot be done inside the evaluate
    })),
  };

  // Close the browser
  await browser.close();

  return { currentPage, nextPage: data.nextPage, data: data.data };
};
