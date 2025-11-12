import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { image, prompt } = req.body;

    // Cria a previsão (pedido para gerar imagem)
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

    const prediction = await response.json();
    if (prediction.error) {
      throw new Error(prediction.error.message);
    }

    // Aguarda o resultado da IA antes de responder
    let statusUrl = prediction.urls.get;
    let output = null;

    while (!output) {
      const statusResponse = await fetch(statusUrl, {
        headers: {
          Authorization: "Token r8_QectgBKZYD9i0a1isBSuYQeqruEyaWx1npYTs",
        },
      });
      const statusData = await statusResponse.json();

      if (statusData.status === "succeeded") {
        output = statusData.output[0];
        break;
      } else if (statusData.status === "failed") {
        throw new Error("A geração da tatuagem falhou.");
      }

      // espera 3 segundos antes de tentar novamente
      await new Promise((r) => setTimeout(r, 3000));
    }

    res.json({ output: [output] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar imagem" });
  }
});

app.listen(10000, () => console.log("✅ Servidor InkVision ativo na porta 10000"));
