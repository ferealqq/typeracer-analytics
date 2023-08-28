import puppeteer from "puppeteer";

export const firstPage =
  "https://data.typeracer.com/pit/race_history?user=ferealqq&universe=play&n=100&cursor=&startDate=";

export type PageRowItem = { wpm?: number; percentage?: number; date?: Date };

export type Page = {
  nextPage: string;
  data: PageRowItem[];
  currentPage: string;
};

export const getPage = async (currentPage: string): Promise<Page> => {
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  const browser = await puppeteer.launch({
    headless: true,
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
  const data = await page.evaluate(() => {
    // Fetch the first element with class "quote"
    const rows = document.querySelectorAll("div.Scores__Table__Row");
    const all: PageRowItem[] = [];
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
      const dateElem = row.querySelector("div.profileTableHeaderDate");
      const dateStr = dateElem?.innerHTML.trim().includes("today")
        ? ""
        : dateElem?.innerHTML.trim();
      console.log(
        "date str",
        dateStr,
        " ",
        dateElem?.innerHTML,
        " date elem trim",
        dateElem?.innerHTML.trim()
      );
      const date = new Date(dateStr ?? "");
      all.push({
        wpm,
        percentage,
        date,
      });
    });

    let nextPage = "";

    const ahrefs = document.querySelectorAll("a");
    ahrefs.forEach((value) => {
      if (value.innerText.includes("load older results")) {
        nextPage = value.href;
      }
    });

    return { data: all, nextPage };
  });

  // Close the browser
  await browser.close();

  return { currentPage, nextPage: data.nextPage, data: data.data };
};
