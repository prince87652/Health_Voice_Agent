require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");
const OpenAI = require("openai");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.json({
    message: "Health Voice AI Server is running",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.send(
    JSON.stringify({
      type: "connected",
      message: "Connected to Health Voice AI server",
    })
  );

  ws.on("message", async (message, isBinary) => {
    try {
      // Normal JSON messages
      if (!isBinary) {
        const data = JSON.parse(message.toString());

        console.log("Received:", data);

        if (data.type === "start_call") {
          ws.send(
            JSON.stringify({
              type: "ai_message",
              message:
                "Hello! I'm your AI health screening assistant. Could you please tell me your name?",
            })
          );
        }

        if (data.type === "end_call") {
          ws.send(
            JSON.stringify({
              type: "call_ended",
              message: "Call ended successfully",
            })
          );
        }

        return;
      }

      // Audio received as binary
      console.log("Received audio:", message.length, "bytes");

      ws.send(
        JSON.stringify({
          type: "processing",
          message: "Converting speech to text...",
        })
      );

      // STT will be added here next
    } catch (error) {
      console.error("WebSocket message error:", error);

      ws.send(
        JSON.stringify({
          type: "error",
          message: "Something went wrong processing your request.",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});