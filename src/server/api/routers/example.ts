import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  DataType,
  InsertDataType,
  PageRowItem,
  firstPage,
  getPage,
} from "~/server/server.utils";
import { v4 as uuid } from "uuid";

// const fetchPageRecursive = (url : string) => {
//   let nextPage = url;

// }

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
  createPersonalData: publicProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const url = firstPage(input.username);
      let currentPage = await getPage(url);
      if (!currentPage.nextPage) {
        throw new Error("nextPage not found");
      }
      const rows = currentPage.data;
      while (currentPage.nextPage) {
        console.log(`length ${rows.length}`);
        currentPage = await getPage(currentPage.nextPage);
        rows.push(...currentPage.data);
      }
      console.log(`all user data fetched`);

      // insert all the new data into the database
      // TODO cache / upsert etc?
      // first let's add username to the data
      // const data: DataType[] =
      const validatedData = DataType.array().parse(
        rows.map((item) => ({
          ...item,
          username: input.username,
          // TODO what the fuck
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          id: uuid() as string,
        }))
      );
      console.log(`starting to create data`);
      const promises = validatedData.map((item) =>
        ctx.prisma.data.create({ data: item })
      );
      return await Promise.all(promises);
    }),
});
