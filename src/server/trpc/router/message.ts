import { router, publicProcedure } from "../trpc";
import redisClient from "../../../utils/redisClient";
import { z } from "zod";
import { EventEmitter } from "events";
import { observable } from "@trpc/server/observable";
import { clearInterval } from "timers";

type TypeInput = {
  selectionStart: number;
  selectionEnd: number;
  text: string;
};

interface MyEvents {
  add: (data: TypeInput) => void;
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
        selectionStart: z.number(),
        selectionEnd: z.number(),
        text: z.string().length(1),
      })
    )
    .mutation(async ({ input }) => {
      const currentText = await redisClient.get("welcome");
      const newText =
        currentText?.slice(0, input.selectionStart) +
        input.text +
        currentText?.slice(input.selectionEnd);

      const message = await redisClient.set("welcome", newText);
      ee.emit("add", input);

      return message;
    }),

  onAdd: publicProcedure.subscription(() => {
    return observable<TypeInput>((emit) => {
      const onAdd = (data: TypeInput) => emit.next(data);
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
