import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { firstPage, getPage } from "~/server/server.utils";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const data = await ctx.prisma.data.findMany();
    return data;
  }),
  fetchPersonalData: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      // const url = firstPage(input.username);
      // const currentPage = await getPage(url);
      // while (await getPage(url)) return {};
    }),
});
