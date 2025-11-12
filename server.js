import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { image, prompt } = req.body;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Token r8_QectgBKZYD9i0a1isBSuYQeqruEyaWx1npYTs",
      },
      body: JSON.stringify({
        version:
          "a16acaa9b8a4a302a5a30e8c5e7a1dffb9a69f7d86de52f8f3e8b3c7e1a4f7b7",
        input: {
          prompt: `Tatuagem ${prompt} aplicada na pele da pessoa da foto`,
          image: image,
        },
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar imagem" });
  }
});

app.listen(10000, () => console.log("Servidor rodando na porta 10000"));
