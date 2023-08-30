import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { DataType, type PageRowItem } from "~/server/types";
import { firstPage, getPage } from "~/server/server.utils";
import { v4 as uuid } from "uuid";
import { TRPCError } from "@trpc/server";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  getAll: publicProcedure.input(String).query(async ({ ctx, input }) => {
    const data = await ctx.prisma.data.findMany({
      where: { username: input },
      orderBy: { date: "desc" },
    });
    if (data.length === 0) {
      const url = firstPage(input);
      let currentPage = await getPage(url);
      if (!currentPage.nextPage) {
        // TODO error handling
        throw new Error("nextPage not found");
      }
      const insertData = (rows: PageRowItem[]) => {
        const validatedData = DataType.array().parse(
          rows.map((item) => ({
            ...item,
            username: input,
            // TODO what the fuck
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            id: uuid(),
          }))
        );
        // TODO maybe innsert query via raw because this uses the select shit by default?
        return validatedData.map((item) =>
          ctx.prisma.data.create({ data: item })
        );
      };

      const promises = insertData(currentPage.data);
      while (currentPage.nextPage) {
        currentPage = await getPage(currentPage.nextPage);
        promises.push(...insertData(currentPage.data));
      }

      return await Promise.all(promises);
    }
    return data;
  }),
  refreshUserData: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const first = await ctx.prisma.data.findFirst({
        where: {
          username: input.username,
        },
        orderBy: {
          raceNumber: "desc",
        },
      });
      if (first) {
        const url = firstPage(input.username);
        let currentPage = await getPage(url);
        if (!currentPage.nextPage) {
          // TODO error handling
          throw new Error("nextPage not found");
        }
        const rows = currentPage.data;
        while (
          currentPage.nextPage &&
          (currentPage.data[currentPage.data.length - 1]?.raceNumber ??
            first.raceNumber) > first.raceNumber
        ) {
          currentPage = await getPage(currentPage.nextPage);
          rows.push(...currentPage.data);
        }
        const validatedData = DataType.array().parse(
          rows
            .filter(
              ({ raceNumber }) => (raceNumber ?? Infinity) > first.raceNumber
            )
            .map((item) => ({
              ...item,
              username: input.username,
              // TODO what the fuck
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              id: uuid(),
            }))
        );
        return await Promise.all(
          validatedData.map((item) => ctx.prisma.data.create({ data: item }))
        );
      }

      return [];
    }),
});
