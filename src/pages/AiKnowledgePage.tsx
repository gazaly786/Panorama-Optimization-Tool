import React, { useState } from 'react';
import { usePanorama } from '../context/PanoramaContext';
import {
  Sparkles,
  Send,
  HelpCircle,
  BookOpen,
  Compass,
  Layers,
  Camera,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';

interface KnowledgeArticle {
  title: string;
  category: string;
  snippet: string;
  content: string;
}

const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    title: 'Why f/8 is the Golden Aperture for 360° Panoramas (and why f/16 destroys sharpness)',
    category: 'Optical Sharpness',
    snippet: 'Photographers often think f/16 gives maximum depth of field, but on modern 24MP–60MP sensors, diffraction severely softens fine architectural details.',
    content: `In 360° panorama photography, especially with ultra-wide and fisheye lenses (e.g. Sigma 8mm, 10mm, or 12mm), depth of field at f/8 already spans from ~0.35m to infinity when focused at hyperfocal distance!

Stopping down to f/16 or f/22 causes the Airy disk (diffraction pattern) to swell to over 21μm across. On high-density sensors like the Canon EOS 90D (3.2μm pixels) or Sony A7R V (3.76μm pixels), that Airy disk spills across 6 to 7 neighboring pixels. The result is a muddy, mushy image where wood grain, brickwork, and texture micro-contrast are permanently lost.

Recommendation: Shoot at f/5.6 or f/8. You achieve razor sharpness, zero diffraction penalty, and full foreground-to-infinity focus.`,
  },
  {
    title: 'Fisheye vs Rectilinear Lenses for 360° Photography',
    category: 'Lens Geometry',
    snippet: 'Why circular and fullframe fisheyes require only 4 to 6 shots for a full spherical panorama, whereas rectilinear lenses require 20 to 40 shots.',
    content: `Standard lenses use rectilinear projection, where straight lines remain straight. However, rectilinear projection stretches objects at the edges to infinity as angles approach 90°, making single-row 360° coverage impossible.

Fisheye lenses intentionally compress angles (using Equidistant, Equisolid, or Stereographic mappings), allowing a 180° field of view to fit cleanly on the sensor.
- A circular fisheye on APS-C (e.g. Sigma 8mm on Canon 90D) covers a full 360° × 180° sphere in just 6 horizontal shots plus 1 zenith and 1 nadir patch (8 frames total).
- A 16mm rectilinear lens on full frame requires at least 3 rows (e.g. +45°, 0°, -45°) with 8–10 shots per row, totaling 24–32 images plus zenith and nadir!

Fisheyes dramatically accelerate field workflow and reduce parallax alignment risks.`,
  },
  {
    title: 'How to Accurately Calibrate the Lens Entrance Pupil (No-Parallax Point)',
    category: 'Panoramic Heads',
    snippet: 'Step-by-step field procedure to eliminate foreground parallax shift on your panoramic head.',
    content: `1. Mount your camera on the panoramic head in vertical (portrait) orientation.
2. Align the lower rail so the center of the lens barrel is directly over the rotating base screw.
3. Align two vertical references: Place a near vertical object (like a light stand or window frame) 1 meter away, and align it with a distant background vertical (like a distant doorframe or building edge 10 meters away) in Live View.
4. Rotate the camera to the left: If the near object shifts to the right relative to the background, your camera is mounted too far backward. Slide the upper rail forward.
5. Rotate to the right: If the near object shifts to the left, slide the upper rail backward.
6. When you can rotate the head completely from left to right and the near object remains perfectly pinned against the distant object, you have found the true Entrance Pupil (No-Parallax Point)! Record the millimeter setting on your rail for future setups.`,
  },
  {
    title: 'Why Automatic Exposure and Auto White Balance Ruin Stitched Panoramas',
    category: 'Exposure Protocol',
    snippet: 'Frame-to-frame exposure or color shifts cause visible banding and tile checkerboarding.',
    content: `When shooting a 360° rotation, one shot faces directly toward a bright window, while the next faces an unlit hallway corner. If the camera is set to Aperture Priority (Av) or Auto White Balance (AWB):
- The camera will change shutter speed between shots, creating jarring brightness boundaries.
- The camera will change color temperature (Kelvin) between frames, making one wall look blue and the adjacent wall look orange.
- Even advanced blending algorithms in PTGui cannot cleanly fix wide Kelvin shifts across overlapping tiles.

Solution: Always use MANUAL (M) mode and LOCKED White Balance (Daylight 5500K or Custom Kelvin). If the dynamic range is wide, use AEB bracketing—all tiles must maintain identical baseline shutter, aperture, and color temperature.`,
  },
  {
    title: 'Camera Modes Compared: Why Tv (Shutter Priority) & Sports Modes Ruin 360° Panoramas',
    category: 'Camera Modes & Exposure',
    snippet: 'Why using Tv (Shutter Priority) or Sport Mode causes varying apertures, mismatched depth of field, and stitching seams across your 360° tour.',
    content: `Many photographers default to Tv (Time Value / Shutter Priority) in general photography because they want to control camera shake. However, in 360° panorama photography, Tv is one of the most dangerous settings you can use!

Here is why:
1. When you rotate 360° around a room or landscape, the brightness changes drastically.
   - When facing a bright window or the midday sun, the camera in Tv mode will automatically force a narrow aperture like f/16 or f/22 to keep the shutter speed constant.
   - When you turn around to face a dark hallway or shadow, the camera will automatically force a wide aperture like f/3.5 or f/2.8!
2. The Consequences for Stitching:
   - Tile 1 (at f/22) will have massive diffraction blur and deep depth of field.
   - Tile 4 (at f/3.5) will have sharp center, softened corners, high vignetting, and shallow depth of field!
   - When PTGui or Hugin tries to blend these overlapping tiles, the differing optical characteristics create blurred seams, vignette banding, and ghosting.
3. What about Sport Mode?
   - Sport mode is designed for fast moving athletes. It enables continuous autofocus (AI Servo/AF-C) which refocuses on different depths between frames, boosts ISO to noisy levels, and constantly shifts shutter and aperture. It completely destroys panorama exposure consistency.

THE GOLD STANDARD FOR 360° PANORAMAS:
• Set mode dial to MANUAL (M).
• Lock Aperture to the optical sweet spot (e.g. f/8).
• Lock Shutter Speed to balance the room (e.g. 1/80s or 1/4s on tripod).
• Lock ISO to native base (ISO 100).
• If contrast is extreme, turn on AEB (Auto Exposure Bracketing) in Manual Mode (e.g. 3 shots ±2 EV).
Now every tile around the circle shares the exact same optical sharpness, depth of field, and exposure!`,
  },
  {
    title: 'The Truth About Infinity Focus (∞): Why Focusing at the ∞ Mark Causes Blurry Panoramas',
    category: 'Focusing Optics',
    snippet: 'Why focusing at the Infinity mark wastes foreground sharpness, and why modern lenses focus "past infinity".',
    content: `A common myth is: "To get everything crisp and clear in a wide panoramic shot, just turn the focus ring to the Infinity symbol (∞)."

In reality, focusing directly at Infinity often ruins panorama sharpness. Here is the optical physics:

1. Wasting Front Depth of Field:
   - If you focus directly at Infinity (∞), the near limit of sharpness starts at the Hyperfocal Distance (H).
   - For example, with an 8mm lens at f/8, H is ~0.45m.
   - But if you focus at the Hyperfocal Distance (0.45m), the near limit drops to HALF the hyperfocal distance (H / 2 = ~0.23m), while the far limit STILL extends all the way to Infinity (∞)!
   - Focusing at Hyperfocal literally doubles your sharp foreground zone for free, with zero loss of infinity sharpness.

2. The "Past Infinity" Hard Stop Trap:
   - On almost all modern autofocus and zoom lenses, the physical focus ring can turn PAST the Infinity symbol (∞). Manufacturers design this tolerance so internal glass elements can expand or contract with temperature changes without binding.
   - If you simply turn the focus ring until it hits the hard mechanical stop, your lens is focused "past infinity," and BOTH distant mountains AND foreground objects will be soft and out of focus!

RECOMMENDED FOCUSING PROCEDURE FOR CRISP PANORAMAS:
1. Mount camera securely on the leveled tripod.
2. Activate Live View on the LCD screen.
3. Zoom in to 10× magnification on a subject approximately 1.2m to 1.5m away (or your calculated hyperfocal distance).
4. Manually rotate the focus ring until the details (edges, wood texture, text) snap into tack-sharp clarity.
5. Switch the lens switch from AF to MANUAL FOCUS (MF).
6. Never touch the focus ring during the rotation. Your entire 360° panorama will be razor-sharp from ~0.3m to infinity!`,
  },
];

export const AiKnowledgePage: React.FC = () => {
  const {
    selectedCamera,
    selectedLens,
    selectedScenario,
    results,
  } = usePanorama();

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; text: string; source?: string }[]
  >([
    {
      role: 'assistant',
      text: `Hello! I am your Optical Panorama Assistant. I have analyzed your active setup (${selectedCamera.brand} ${selectedCamera.model} + ${selectedLens.brand} ${selectedLens.model} in ${selectedScenario.name}). Ask me anything about aperture choice, hyperfocal focus, parallax calibration, or shooting advice!`,
      source: 'Deterministic Optical Engine + AI Knowledge Base',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(KNOWLEDGE_ARTICLES[0]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userQ = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', text: userQ }]);
    setLoading(true);

    try {
      // Call server-side AI endpoint with 5-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: userQ,
          camera: {
            brand: selectedCamera.brand,
            model: selectedCamera.model,
            sensorFormat: selectedCamera.sensorFormat,
            cropFactor: selectedCamera.cropFactor,
            megapixels: selectedCamera.megapixels,
            pixelPitchUm: results.pixelPitchUm,
          },
          lens: {
            brand: selectedLens.brand,
            model: selectedLens.model,
            projectionType: selectedLens.projectionType,
            focalLength: results.effectiveFocalLengthMm,
            sweetSpot: selectedLens.sweetSpotAperture,
          },
          scenario: selectedScenario.name,
          currentSettings: {
            aperture: results.recommendedApertureString,
            focus: `${results.focusDistanceM}m`,
            iso: results.recommendedIso,
            shutter: results.recommendedShutterSpeed,
            shots: results.shotsPerCircle,
            rotation: `${results.rotationIncrementDeg}°`,
            overlap: `${results.overlapPct}%`,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.reply, source: data.source || 'Gemini 3.8 Flash' },
        ]);
      } else {
        const fallbackReply = generateLocalOpticalAnswer(userQ, selectedCamera, selectedLens, results);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: fallbackReply, source: 'Deterministic Optical Engine' },
        ]);
      }
    } catch (_err) {
      // Graceful fallback to deterministic optical explanation
      const fallbackReply = generateLocalOpticalAnswer(userQ, selectedCamera, selectedLens, results);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: fallbackReply,
          source: 'Deterministic Optical Engine (Offline / Local Mode)',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateLocalOpticalAnswer = (
    q: string,
    cam: any,
    lens: any,
    res: any
  ) => {
    const qLower = q.toLowerCase();
    if (qLower.includes('infinity') || qLower.includes('sharp clear') || qLower.includes('crisp')) {
      return `Setting the lens directly to the "∞" (Infinity) symbol is actually NOT optimal for panoramas!
1. When you focus at Infinity, your near limit is the Hyperfocal Distance (H = ${res.hyperfocalDistanceM.toFixed(2)}m). Everything closer than that becomes blurry!
2. If you instead focus at the Hyperfocal Distance (~${res.focusDistanceM.toFixed(1)}m), the near limit drops in half to ~${res.hyperfocalNearLimitM.toFixed(2)}m, while the far limit STILL reaches all the way to Infinity (∞)! You get double the depth of field with zero penalty.
3. Modern lenses focus "past infinity" to accommodate temperature changes. If you rotate to the physical hard stop, both infinity and foreground will be soft.
Pro Tip: Zoom in to 10× Live View on a subject ~1.2m away, focus manually until crisp, switch lens to MANUAL FOCUS (MF), and lock it!`;
    }
    if (qLower.includes('tv') || qLower.includes('time value') || qLower.includes('shutter priority') || qLower.includes('mode') || qLower.includes('sport')) {
      return `Using Tv (Time Value / Shutter Priority) or Sport Mode is DANGEROUS for 360° panoramas!
Why Tv mode breaks panoramas:
• When you rotate 360°, scene lighting changes (e.g. facing a bright window vs a dark interior corner).
• In Tv mode, the camera keeps shutter speed fixed and continuously alters the APERTURE between shots (e.g. stopping down to f/22 at the window, opening to f/3.5 in shadows).
• Different apertures cause varying depth-of-field, diffraction differences, and corner vignetting across tiles, which causes stitch errors and blurry seams in PTGui or Hugin!
• Sport Mode is even worse because it enables continuous autofocus (AI Servo/AF-C), changing focus distance between frames.

THE BEST MODE FOR PANORAMAS:
Always use MANUAL (M) Mode!
Lock Aperture to ${res.recommendedApertureString}, Shutter to ${res.recommendedShutterSpeed}, ISO to ${res.recommendedIso}, and White Balance. If lighting contrast is high, use AEB bracketing (e.g. ${res.aebFrames} frames ±${res.aebEvStep} EV in Manual mode). Every tile will have identical optical sharpness and exposure!`;
    }
    if (qLower.includes('aperture') || qLower.includes('f/8') || qLower.includes('f/16') || qLower.includes('diffraction')) {
      return `For your ${cam.model} (${res.pixelPitchUm.toFixed(2)}μm pixel pitch) and ${lens.model}, ${res.recommendedApertureString} is recommended because it provides sufficient depth of field (${res.nearLimitM}m to ${res.farLimitM === 'Infinity' ? '∞' : res.farLimitM + 'm'}) while avoiding diffraction softening. On this sensor, f/16 causes Airy disks to span over 6 pixels, noticeably reducing fine detail.`;
    }
    if (qLower.includes('shot') || qLower.includes('rotation') || qLower.includes('detent') || qLower.includes('overlap')) {
      return `With ${lens.model} on ${cam.model}, your effective horizontal angle of view is ${res.horizontalFovDeg}°. We recommend ${res.shotsPerCircle} shots around (rotating ${res.rotationIncrementDeg}° per shot). This guarantees ~${res.overlapPct}% overlap, which is the sweet spot for seamless control-point generation in PTGui or Hugin without excessive processing time.`;
    }
    if (qLower.includes('focus') || qLower.includes('hyperfocal') || qLower.includes('manual')) {
      return `Recommended focus distance is ~${res.focusDistanceM.toFixed(1)}m. Hyperfocal distance is ${res.hyperfocalDistanceM.toFixed(2)}m (with near limit at ${res.hyperfocalNearLimitM.toFixed(2)}m). We strongly advise setting focus manually on a subject ~1.2m–1.5m away using 10x Live View zoom, then locking the lens to MANUAL FOCUS. Do NOT use autofocus between tiles!`;
    }
    if (qLower.includes('aeb') || qLower.includes('hdr') || qLower.includes('bracket')) {
      return `${res.aebRecommended ? `AEB is recommended: ${res.aebFrames} frames spaced ±${res.aebEvStep} EV. This protects window highlights from blowing out while lifting room shadows.` : 'Single frame RAW capture is sufficient under current lighting conditions.'}`;
    }
    return `Based on your ${cam.model} and ${lens.model}, the recommended settings are ${res.recommendedApertureString}, ISO ${res.recommendedIso}, ${res.recommendedShutterSpeed}, focused at ~${res.focusDistanceM.toFixed(1)}m with ${res.shotsPerCircle} shots around (${res.rotationIncrementDeg}° click-stop). This achieves maximum optical sharpness, sufficient depth of field, and reliable stitching margins.`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">AI Knowledge Engine & Optical Guides</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Learn why settings are chosen, understand optical physics and diffraction, or ask the AI assistant custom questions about your camera setup.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Assistant Chat (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col h-[560px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Optical AI Assistant
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ground Truth Engine Active
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl flex flex-col gap-1 ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium self-end max-w-[85%]'
                      : 'bg-slate-950/80 border border-slate-800/80 text-slate-200 self-start max-w-[92%]'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.source && (
                    <span className="text-[9px] font-mono opacity-60 mt-1">
                      Source: {msg.source}
                    </span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs self-start flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Consulting optical calculation engine & AI model...</span>
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-800/80 text-[11px]">
              {[
                'Why f/8 instead of f/16?',
                'Infinity focus setting?',
                'Why avoid Tv or Sport mode?',
                'Where should I focus?',
                'How many shots around?',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuestion(suggestion)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono whitespace-nowrap transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAsk} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Ask about your camera, lens, focus, or panorama technique..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Curated Optical Knowledge Library (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Core Panorama Optics Library</span>
            </h3>

            {/* Article Selector List */}
            <div className="flex flex-col gap-2">
              {KNOWLEDGE_ARTICLES.map((article, idx) => {
                const isSelected = selectedArticle?.title === article.title;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase mb-1">
                      <span>{article.category}</span>
                      {isSelected && <span className="text-amber-400 font-bold">Reading</span>}
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">{article.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{article.snippet}</p>
                  </button>
                );
              })}
            </div>

            {/* Selected Article Viewer */}
            {selectedArticle && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  {selectedArticle.category}
                </span>
                <h4 className="text-sm font-bold text-white leading-snug">
                  {selectedArticle.title}
                </h4>
                <div className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap mt-1">
                  {selectedArticle.content}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
