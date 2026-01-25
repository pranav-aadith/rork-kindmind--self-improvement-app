import { createTRPCRouter } from "./create-context";
import { exampleRouter } from "./routes/example";
import { speechToTextRouter } from "./routes/speech-to-text";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  speechToText: speechToTextRouter,
});

export type AppRouter = typeof appRouter;
