import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse large JSON requests (for base64 images)
  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // 1. Generate Story from Image
  app.post("/api/generate-story", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64 || !mimeType) {
        return res.status(400).json({ error: "Missing image data" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: "Analyze the mood, setting, and potential characters in this image. Ghostwrite a captivating, immersive opening paragraph to a fictional story set in this world. The output should ONLY be the story paragraph, no meta-commentary.",
            },
          ],
        },
      });

      res.json({ story: response.text });
    } catch (error: any) {
      console.error("Story generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate story" });
    }
  });

  // 2. Text to Speech
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Puck" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        res.status(500).json({ error: "No audio generated" });
      }
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: error.message || "Failed to generate audio" });
    }
  });

  // 3. Chat to continue story
  app.post("/api/chat", async (req, res) => {
    try {
      const { history, message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing message" });
      }

      // Convert history to contents format expected by API
      const contents = history.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      // Append the new message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction: "You are an imaginative ghostwriter and dungeon master collaborating with the user to continue a story. Keep your responses concise, engaging, and in character with the world established in the story. You do not break character.",
        },
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to generate chat reply" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
