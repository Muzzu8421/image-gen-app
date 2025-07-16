// File: src/components/ImageGenApp.jsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export default function ImageGenApp() {
  const [prompt, setPrompt] = useState("");
  const [seedImage, setSeedImage] = useState(null);
  const [outputImage, setOutputImage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    setSeedImage(e.target.files[0] || null);
  };

  const generateImage = async (mode) => {
    setLoading(true);
    setOutputImage("");

    try {
      // Prepare payload for self-hosted model
      const payload = new FormData();
      payload.append("prompt", prompt);
      payload.append("mode", mode);
      if (mode === "img2img" && seedImage) {
        payload.append("image", seedImage);
      }

      // Call your self-hosted inference API
      const resp = await fetch(process.env.NEXT_PUBLIC_DIFFUSION_API_URL || "http://localhost:5000/generate", {
        method: "POST",
        body: payload,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Generation failed");

      // Expecting base64 image or URL
      setOutputImage(data.imageUrl || `data:image/png;base64,${data.imageBase64}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-md rounded-2xl p-4">
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Self-Hosted Image Gen</h2>
          <Textarea
            placeholder="Enter your prompt..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mb-4"
          />
          <Input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
          <div className="flex space-x-2">
            <Button onClick={() => generateImage("text2img")} disabled={loading || !prompt}>
              {loading ? "Generating..." : "Text → Image"}
            </Button>
            <Button onClick={() => generateImage("img2img")} disabled={loading || !prompt || !seedImage}>
              {loading ? "Generating..." : "Image → Image"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md rounded-2xl p-4">
        <CardContent>
          <h2 className="text-xl font-bold mb-2">Output</h2>
          {outputImage ? (
            <img src={outputImage} alt="Generated" className="rounded-xl w-full" />
          ) : (
            <div className="text-gray-500">No image yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// File: pages/api/image-gen.js (Proxy to self-hosted server)
import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

export const config = { api: { bodyParser: false } };

const DIFFUSION_API = process.env.DIFFUSION_API_URL || 'http://localhost:5000/generate';

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parse error' });

    try {
      const formData = new FormData();
      formData.append('prompt', fields.prompt);
      formData.append('mode', fields.mode || 'text2img');
      if (files.image) {
        formData.append('image', fs.createReadStream(files.image.filepath), files.image.originalFilename);
      }

      const response = await fetch(DIFFUSION_API, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Inference error');

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });
}
