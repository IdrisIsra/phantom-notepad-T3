// src/server/router/_app.ts
import { router } from "../trpc";

import { messageRouter } from "./message";

export const appRouter = router({
  message: messageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
