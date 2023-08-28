import { expect, test } from "vitest";
import { test_firstPage, getPage } from "./server.utils";

test("Test Get Page", async () => {
  const page = await getPage(test_firstPage);
  // console.log(page);
  expect(page.data.length).toBe(100);
  expect(page.nextPage).toBe(
    "https://data.typeracer.com/pit/race_history?user=ferealqq&universe=play&n=100&cursor=ClYKFgoJdGltZXN0YW1wEgkI-OvYqqDugAMSOGoTc350eXBlcmFjZXJkYXRhLWhyZHIhCxIKR2FtZVJlc3VsdCIRX3RyOmZlcmVhbHFxXzE0OTMMGAAgAQ==&prevCursor=&startDate="
  );
  expect(page.currentPage).toBe(test_firstPage);
});
