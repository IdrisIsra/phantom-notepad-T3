import { router, publicProcedure } from "../trpc";
import redisClient from "../../../utils/redisClient";
import { z } from "zod";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";
import { clearInterval } from "timers";

interface MyEvents {
  add: (data: string) => void;
  isTypingUpdate: () => void;
}
declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MyEventEmitter extends EventEmitter {}

const ee = new MyEventEmitter();

export const exampleRouter = router({
  hello: publicProcedure.query(async ({ input }) => {
    return await redisClient.get("welcome");
  }),

  add: publicProcedure
    .input(
      z.object({
        key: z.string(),
        text: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const message = await redisClient.set(input.key, input.text);
      ee.emit("add", input.text);

      return message;
    }),

  onAdd: publicProcedure.subscription(() => {
    return observable<string>((emit) => {
      const onAdd = (data: string) => emit.next(data);
      ee.on("add", onAdd);
      return () => {
        ee.off("add", onAdd);
      };
    });
  }),

  randomNumber: publicProcedure.subscription(() => {
    return observable<number>((emit) => {
      const int = setInterval(() => {
        emit.next(Math.random());
      }, 5000);
      return () => {
        clearInterval(int);
      };
    });
  }),
});
