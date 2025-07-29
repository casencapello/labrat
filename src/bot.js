import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch"; // node-fetch v2 is required for CommonJS
import cron from "node-cron";
import express from "express";

dotenv.config();

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // required to read/send messages
  ],
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Start Express server to keep Render alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));

// Bot ready logic
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (channel) {
      const message = await generateMotivation();
      channel.send(message);
    }
  } catch (err) {
    console.error("Failed to send first message:", err);
  }

  // Daily scheduled motivation at 9:00 AM (server time)
  cron.schedule("0 9 * * *", async () => {
    try {
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (channel) {
        const message = await generateMotivation();
        channel.send(message);
      }
    } catch (err) {
      console.error("Failed to send scheduled message:", err);
    }
  });
});

// Generate motivational message from OpenAI
async function generateMotivation() {
  const prompt =
    "You are a no-fluff motivator who delivers exactly one unique motivational message each time you are asked. Each message should be different from any previous message, covering a mix of topics including fitness, money, mindset, side hustles, or personal growth. The message should be raw, real, and actionable—designed to push someone to take immediate action. Do not repeat any message you've given before. Output only the single motivational message — no introductions or explanations. Your message should be 1-2 paragraphs and include a related quote from someone famous at the end.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Stay hard.";
  } catch (err) {
    console.error("Error from OpenAI:", err);
    return "Push through the pain. No excuses.";
  }
}

// Login bot
client.login(process.env.BOT_TOKEN);
