// File: pages/api/image-gen.js
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
