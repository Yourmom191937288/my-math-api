// 1. Import necessary libraries
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 2. Configure the server
const app = express();
app.use(express.json());
app.use(cors());

// --- ENDPOINT #1: TEXT SOLVER ---
app.post('/solve-math', async (req, res) => {
  try {
    const TEXT_API_URL = "https://api-inference.huggingface.co/models/google/gemma-2b-it";
    const userProblem = req.body.problem;

    if (!userProblem) {
      return res.status(400).json({ error: "No problem provided." });
    }

    // Call the Hugging Face Text API
    const response = await fetch(TEXT_API_URL, {
      headers: { "Authorization": `Bearer ${process.env.HF_TOKEN}` },
      method: "POST",
      body: JSON.stringify({ inputs: userProblem }),
    });

    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    const aiAnswer = result[0].generated_text;

    res.json({ answer: aiAnswer });
  } catch (error) {
    console.error("Error calling Hugging Face Text API:", error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

// --- ENDPOINT #2: IMAGE READER (FROM URL) ---
app.post('/read-image-from-url', async (req, res) => {
  try {
    // The URL for a specific image-to-text model on Hugging Face
    const IMAGE_API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large";
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "An imageUrl is required." });
    }

    // 1. Your server fetches the image from the provided URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error('Failed to fetch the image from the URL.');
    const imageBlob = await imageResponse.blob();

    // 2. Your server sends the raw image data to the Hugging Face Image API
    const hfResponse = await fetch(IMAGE_API_URL, {
      headers: { "Authorization": `Bearer ${process.env.HF_TOKEN}` },
      method: "POST",
      body: imageBlob,
    });

    if (!hfResponse.ok) throw new Error(await hfResponse.text());
    const result = await hfResponse.json();
    const caption = result[0].generated_text;

    res.json({ answer: caption });
  } catch (error) {
    console.error("Error in /read-image-from-url:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// 5. Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
