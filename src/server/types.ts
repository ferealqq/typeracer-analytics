import { z } from "zod";

export type PageRowItem = {
  wpm?: number;
  percentage?: number;
  date?: Date;
  raceNumber?: number;
};

export type Page = {
  nextPage: string | undefined;
  data: PageRowItem[];
  currentPage: string;
};

export type EvaluateReturn = Pick<
  PageRowItem,
  "wpm" | "percentage" | "raceNumber"
> & {
  date?: string;
};

export const DataType = z.object({
  id: z.string(),
  raceNumber: z.number(),
  wpm: z.number(),
  percentage: z.number(),
  username: z.string(),
  date: z.date(),
});

export type DataType = z.infer<typeof DataType>;

export const InsertDataType = DataType.pick({
  wpm: true,
  raceNumber: true,
  percentage: true,
  username: true,
  date: true,
});

export type InsertDataType = z.infer<typeof InsertDataType>;
