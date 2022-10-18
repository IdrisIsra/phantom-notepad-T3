import { router, publicProcedure } from "../trpc";
import redisClient from "../../../utils/redisClient";
import { z } from "zod";
import { observable } from "@trpc/server/observable";
import { clearInterval } from "timers";

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string().nullish() }).nullish())
    .query(async ({ input }) => {
      return await redisClient.get("welcome");
    }),

  randomNumber: publicProcedure.subscription(() => {
    return observable<number>((emit) => {
      const int = setInterval(() => {
        emit.next(Math.random());
      }, 500);
      return () => {
        clearInterval(int);
      };
    });
  }),
});
