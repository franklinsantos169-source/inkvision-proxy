import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "InkVision proxy active" });
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!API_TOKEN) {
      return res.status(500).json({ error: "Server not configured (REPLICATE_API_TOKEN missing)" });
    }

    // create prediction
    const create = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${API_TOKEN}`,
      },
      body: JSON.stringify({
        version: "ac732df8b0a9f96780e799f4575fba548a0d02b9b1c8f9e2028a7e7f5d0e3b8e",
        input: {
          prompt: `${prompt}, realistic tattoo design, high detail, no background`,
        },
      }),
    });

    const prediction = await create.json();
    if (prediction.error) {
      console.error("Replicate create error:", prediction);
      return res.status(500).json({ error: "Replicate create error" });
    }

    // Polling until finished
    let result = prediction;
    const maxTries = 30; // ~90 seconds
    let tries = 0;
    while (result.status !== "succeeded" && result.status !== "failed" && tries < maxTries) {
      await new Promise(r => setTimeout(r, 3000));
      const check = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { Authorization: `Token ${API_TOKEN}` },
      });
      result = await check.json();
      tries++;
    }

    if (result.status === "succeeded" && result.output) {
      // result.output is usually array of URLs
      return res.json({ output: result.output });
    } else if (result.status === "failed") {
      console.error("Replicate failed:", result);
      return res.status(500).json({ error: "Generation failed" });
    } else {
      return res.status(504).json({ error: "Generation timed out" });
    }
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// start
const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Proxy running on ${port}`));
