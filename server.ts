import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();

// Parse port from CLI flags e.g. --port 3000 or process.env.PORT
const portArgIndex = process.argv.indexOf('--port');
const portFromArg = portArgIndex !== -1 ? parseInt(process.argv[portArgIndex + 1], 10) : NaN;
const PORT = !isNaN(portFromArg) ? portFromArg : parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

// Enable CORS for all origins and methods
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, User-Agent');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Initialize Gemini SDK with telemetry header if key is available
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (e) {
    console.error('Failed to initialize GoogleGenAI client:', e);
  }
}

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', engine: 'PanoOptix Optical Engine', timestamp: new Date().toISOString() });
});

// API Route: Server-side AI Explanation
app.post('/api/ai/explain', async (req, res) => {
  const { prompt, camera, lens, scenario, currentSettings } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // If Gemini API is available and initialized, attempt AI generation
  if (ai) {
    try {
      const systemInstruction = `You are an optical physicist and master 360° panoramic photographer.
The user is using the PanoOptix optimizer.
Current Equipment & Scene:
- Camera: ${camera?.brand || ''} ${camera?.model || ''} (${camera?.sensorFormat || ''}, crop factor: ${camera?.cropFactor || 1}x, pixel pitch: ${camera?.pixelPitchUm || 4}μm)
- Lens: ${lens?.brand || ''} ${lens?.model || ''} (${lens?.projectionType || ''}, focal length: ${lens?.focalLength || 8}mm, sweet spot: ${lens?.sweetSpot || 'f/5.6 - f/8'})
- Scenario: ${scenario || 'Panorama'}
- Current Settings:
  * Aperture: ${currentSettings?.aperture || 'f/8'}
  * Focus: ${currentSettings?.focus || '1.2m'}
  * ISO: ${currentSettings?.iso || 100}
  * Shutter: ${currentSettings?.shutter || '1/80s'}
  * Shots: ${currentSettings?.shots || 6} around (${currentSettings?.rotation || '60°'})
  * Overlap: ${currentSettings?.overlap || '30%'}

Explain precisely WHY these settings were chosen based on optical physics (depth of field, Airy disk diffraction versus pixel pitch, entrance pupil / no-parallax alignment, exposure locking). Do NOT hallucinate features. Keep it concise, practical, and technically accurate.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || 'Explanation generated based on optical calculations.';
      return res.json({ reply, source: 'Gemini 3.8 Flash' });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local deterministic response:', err.message);
    }
  }

  // Graceful deterministic optical fallback
  const fallback = generateDeterministicResponse(prompt, camera, lens, currentSettings);
  return res.json({ reply: fallback, source: 'Deterministic Optical Engine (Local)' });
});

function generateDeterministicResponse(
  q: string,
  camera: any,
  lens: any,
  settings: any
): string {
  const qLower = (q || '').toLowerCase();

  if (qLower.includes('aperture') || qLower.includes('f/8') || qLower.includes('f/16') || qLower.includes('diffraction')) {
    const pitch = camera?.pixelPitchUm ? `${camera.pixelPitchUm}μm` : '3.2μm';
    return `For the ${camera?.model || 'selected camera'} with ${pitch} pixel pitch, ${settings?.aperture || 'f/8'} is optimal. Ultra-wide/fisheye lenses provide extensive depth of field at f/8 (focusing at ${settings?.focus || '1.2m'} covers from foreground to infinity). Stopping down to f/16 causes Airy disk diffraction to expand to ~21.5μm (spanning over 6 pixels), causing noticeable micro-contrast loss across the final panorama.`;
  }
  if (qLower.includes('shot') || qLower.includes('rotation') || qLower.includes('overlap')) {
    return `We recommend taking ${settings?.shots || 6} shots around the 360° circle using a ${settings?.rotation || '60°'} rotator detent. This achieves ~${settings?.overlap || '30%'} overlap. In panorama stitching (PTGui / Hugin), 25%–35% overlap gives algorithms enough feature keypoints to blend seams invisibly, without inflating image processing time.`;
  }
  if (qLower.includes('focus') || qLower.includes('hyperfocal') || qLower.includes('manual')) {
    return `We recommend focusing at ${settings?.focus || '1.2m'}. Set focus once using Live View 10x magnification on a subject ~1.2m away, then lock the lens to MANUAL FOCUS (MF). Never allow autofocus between shots, as varying focus planes between tiles prevents seamless stitching.`;
  }
  if (qLower.includes('nodal') || qLower.includes('parallax') || qLower.includes('rail')) {
    return `To prevent foreground parallax errors, the camera must rotate about the entrance pupil of the ${lens?.model || 'lens'} (~42–45mm from the front element or mount index). If the camera rotates around the tripod screw, nearby tables or doorposts will shift against distant walls, ruining the stitch.`;
  }
  return `For your ${camera?.brand || ''} ${camera?.model || 'camera'} and ${lens?.brand || ''} ${lens?.model || 'lens'}, the recommended configuration is ${settings?.aperture || 'f/8'}, ISO ${settings?.iso || 100}, ${settings?.shutter || '1/80s'}, with ${settings?.shots || 6} shots around (${settings?.rotation || '60°'} rotation). This maximizes sharpness while keeping diffraction low and depth of field sufficient.`;
}

// Development with Vite Middlewares or Production Static Serving
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback HTML handler in dev
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
