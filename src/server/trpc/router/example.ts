import { router, publicProcedure } from "../trpc";
import redisClient from "../../../utils/redisClient";
import { z } from "zod";

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(async ({ input }) => {
      return await redisClient.get("welcome");
    }),
});
