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

class MyEventEmitter extends EventEmitter {}

const ee = new MyEventEmitter();

export const messageRouter = router({
  getText: publicProcedure.query(async () => {
    return await redisClient.get("welcome");
  }),

  add: publicProcedure
    .input(
      z.object({
        position: z.number(),
        character: z.string().length(1),
      })
    )
    .mutation(async ({ input }) => {
      const currentText = await redisClient.get("welcome");
      const newText =
        currentText?.slice(0, input.position) +
        input.character +
        currentText?.slice(input.position);

      ee.emit("add", newText);
      const message = await redisClient.set("welcome", newText);

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
