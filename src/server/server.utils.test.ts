import { expect, test } from "vitest";
import { test_firstPage, getPage, InsertDataType } from "./server.utils";
import { ZodError, z } from "zod";

test("Test Get Page", async () => {
  const page = await getPage(test_firstPage);
  expect(page.data.length).toBe(100);
  expect(page.nextPage).toContain(
    "https://data.typeracer.com/pit/race_history?user=ferealqq&universe=play&n=100&cursor="
  );
  expect(page.currentPage).toBe(test_firstPage);
  const val = InsertDataType.array();
  const data = page.data.map((item) => ({
    ...item,
    username: "ferealqq",
  }));

  expect(val.parse(data)).not.toThrow(ZodError);
});

test("should first", () => {
  console.log("should log to console");
  expect(true);
});
