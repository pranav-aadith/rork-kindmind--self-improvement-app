import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

export const speechToTextRouter = createTRPCRouter({
  transcribe: publicProcedure
    .input(
      z.object({
        audioBase64: z.string(),
        fileType: z.string(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Starting transcription request...");

      const binaryData = Buffer.from(input.audioBase64, "base64");
      const mimeType = `audio/${input.fileType}`;

      const blob = new Blob([binaryData], { type: mimeType });

      const formData = new FormData();
      formData.append("audio", blob, `recording.${input.fileType}`);

      if (input.language) {
        formData.append("language", input.language);
      }

      const response = await fetch("https://toolkit.rork.com/stt/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Transcription failed:", errorText);
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Transcription successful:", data);

      return {
        text: data.text as string,
        language: data.language as string,
      };
    }),
});
