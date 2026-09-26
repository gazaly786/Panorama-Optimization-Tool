================================================================================
  PANOOPTIX™ PRO — PANORAMA CAMERA & LENS OPTICAL OPTIMIZATION ENGINE
  Creator & Lead Optical Architect: Gazaly Samsadeen
  Version: 2.4.0 (Production Release)
  Platform: Web / Cross-Platform Responsive
================================================================================

TABLE OF CONTENTS
--------------------------------------------------------------------------------
1. EXECUTIVE OVERVIEW & PURPOSE
2. KEY FEATURES & CAPABILITIES
3. COMPREHENSIVE USEFULNESS & PRACTICAL BENEFITS
4. DETAILED FEATURE BREAKDOWN
   4.1 Optical Optimization Engine
   4.2 360° Shots Count Slider & Dynamic "Super Output" Engine
   4.3 Panoramic Head & Nodal Rail Calibration (No-Parallax Point)
   4.4 Dual Standard Units (Metric & Imperial Worldwide Standard)
   4.5 Standard 0.5-Meter Default Distance Architecture
   4.6 Printable Field PDF Specification Sheet (Demographic Infographic)
   4.7 Excel Equipment Database Upload & Deduplication Engine
   4.8 360° Interactive Rotator Compass & Multi-Row Visualizer
   4.9 Dynamic Exposure & AEB HDR Bracketing Calculator
   4.10 Hardware Database Hub (Cameras & Lenses)
5. MATHEMATICAL & OPTICAL FORMULAS APPLIED
6. EXCEL SPREADSHEET IMPORT FORMAT SPECIFICATION
7. SYSTEM ARCHITECTURE & TECHNOLOGY STACK
8. CREATOR & ATTRIBUTION NOTICE
================================================================================


1. EXECUTIVE OVERVIEW & PURPOSE
--------------------------------------------------------------------------------
PanoOptix™ Pro is a deterministic, physics-based optical calculation and rig
calibration workstation engineered specifically for 360° spherical panoramas,
virtual tours, architectural photography, gigapixel imaging, and interactive
VR environments.

Prior to PanoOptix, panorama photographers relied on guesswork, rule-of-thumb
estimates, or painful trial-and-error in post-production stitching software
like PTGui, Hugin, or Mistika VR. Inaccurate nodal rail offsets caused foreground
parallax displacement (table edges jumping across walls), incorrect apertures
caused diffraction softening on high-resolution sensors, and sub-optimal shot
counts resulted in either stitching seam failure (insufficient overlap) or
excessive capture/processing overhead (excessive overlap).

PanoOptix eliminates all uncertainty by mathematically computing the exact
optical configuration, rail positions, click-stop detents, focus distance,
diffraction limits, and HDR exposure brackets tailored to your exact camera
body, lens projection type, and shooting scenario.


2. KEY FEATURES & CAPABILITIES
--------------------------------------------------------------------------------
• Optical Optimization Engine:
  Determines diffraction-limited sweet spot aperture, Airy disk diameter,
  pixel pitch, hyperfocal distance, near/far depth of field, and ISO baseline.

• 360° Shots Count Slider & Dynamic Super Output Engine:
  Allows setting any discrete shot count around 360° (from 3 to 24 shots, with
  dedicated quick chips for 3, 4, 6, 8, 10, 12, 16, 24 shots). Automatically
  calculates step angle, overlap percentage, safety ratings, and one-click
  auto-tuning for guaranteed seamless stitching.

• Panoramic Tripod Head Nodal Rail Calibration:
  Computes precise Upper Rail (No-Parallax Point / Entrance Pupil offset) and
  Lower Rail (sensor optical axis centering) settings in dual millimeters and
  inches for popular panoramic heads (Nodal Ninja, Sunwayfoto, Leofoto, Bushman).

• Dual Standard Units Everywhere (Metric & Imperial):
  All measurements across every page, card, modal, and export display both
  Metric (m, mm) and Imperial / US Customary (ft, in) units simultaneously
  (e.g., 0.50 m / 1.64 ft / 19.7 in; 52.0 mm / 2.05 in).

• Standard 0.5-Meter Default Distance:
  Default distance is calibrated to 0.5 m (1.64 ft) across all initial states,
  presets, and nodal formulas to protect close foreground interior objects.

• Printable Field PDF Specification Sheet:
  Generates a high-aesthetic demographic infographic card ready for field use.
  Includes Paper White and Dark Room previews, clean browser PDF printing via
  custom @media print rules, offline HTML download, and a 6-point pre-flight
  field checklist.

• Excel Equipment Database Upload & Deduplication Engine (.xlsx, .xls, .csv):
  Allows batch updating the camera and lens database directly from Excel files.
  Features intelligent column recognition, automatic duplicate skipping,
  creator vs. visitor local mode, and downloadable sample Excel templates.

• 360° Rotation Compass & Multi-Row Visualizers:
  Interactive SVG circular radar compass demonstrating field of view cones,
  overlap intersections, individual shot positions (e.g. 0° Front, 90° Right,
  180° Back, 270° Left), and multi-row zenith/nadir requirements.

• AEB HDR Dynamic Range Planning:
  Calculates exposure EV requirements, bracketing stops (±1 to ±3 EV),
  number of frames (3 to 9), and total RAW file counts.


3. COMPREHENSIVE USEFULNESS & PRACTICAL BENEFITS
--------------------------------------------------------------------------------
FOR REAL ESTATE & VIRTUAL TOUR PHOTOGRAPHERS:
  - Fast 4-Shot Workflow: Quickly determine if your fisheye lens can achieve
    sufficient overlap (>25%) in a 4-shot setup (90° rotations) to slash room
    capture time from 5 minutes down to 30 seconds.
  - Zero Parallax Errors: Eliminate seam tearing across narrow interior doorways,
    hallways, and tight bathroom spaces where objects are within 0.5 meters.
  - Consistent White Balance & Exposure: Clear step-by-step lock-down
    instructions prevent exposure pulsation between rotation frames.

FOR ARCHITECTURAL & COMMERCIAL PHOTOGRAPHERS:
  - Peak Sharpness Delivery: Prevents diffraction softening by calculating the
    exact sensor pixel pitch and diffraction threshold aperture (f/5.6 vs f/8
    vs f/11) for high-megapixel bodies like Canon R5, Sony A7R V, and Nikon Z9.
  - Full Dynamic Range Window Coverage: AEB bracketing calculations ensure bright
    exterior window views and deep interior corners blend without noise or blowouts.

FOR GIGAPIXEL & MULTI-ROW PANORAMA SPECIALISTS:
  - Multi-Row Calculation: Calculates pitch angles for multi-tier gigapixel panos
    (e.g., -30°, 0°, +30°) and verifies complete coverage from zenith to nadir.
  - Massive Time Savings: Avoids returning to the field due to missing coverage
    or unfocused foregrounds.

FOR WORKSHOP INSTRUCTORS & PHOTOGRAPHY TEAMS:
  - Printable Field Reference Cards: Print out physical field cards or save
    PDFs on smartphones to give camera assistants clear setup instructions.
  - Team Database Synchronization: Update the studio gear database via Excel
    spreadsheets and export standardized configurations.


4. DETAILED FEATURE BREAKDOWN
--------------------------------------------------------------------------------
4.1 OPTICAL OPTIMIZATION ENGINE
--------------------------------------------------------------------------------
• Inputs: Camera body, lens model, current focal length, target distance,
  lighting condition (EV), quality priority (Maximum Quality, Balanced, Fast).
• Computations:
  - Physical sensor diagonal and crop factor.
  - True sensor pixel pitch (in micrometers / µm).
  - Diffraction Airy disk diameter based on Rayleigh optical criterion.
  - Hyperfocal distance (H) and depth of field near limit (H/2).
  - Exposure parameters: Manual shutter speed, base ISO, and white balance lock.
• Safety Guardrails: Warns when selected aperture exceeds diffraction limit or
  when focus distance leaves foreground objects soft.

4.2 360° SHOTS COUNT SLIDER & DYNAMIC SUPER OUTPUT ENGINE
--------------------------------------------------------------------------------
• Interactive Slider: Continuous adjustment from 3 to 24 shots per 360° circle.
• Preset Chips:
  - 3 Shots (120° step)  -> Ultra fisheye circular lenses (>= 180° HFOV)
  - 4 Shots (90° step)   -> Fast 4-sides standard (e.g. 0°, 90°, 180°, 270°)
  - 6 Shots (60° step)   -> Golden standard for 8mm - 12mm diagonal fisheyes
  - 8 Shots (45° step)   -> 8-sides octagonal high-redundancy setup
  - 10 Shots (36° step)  -> Tight interior panoramic coverage
  - 12 Shots (30° step)  -> Ultra-wide rectilinear lenses (14mm - 18mm)
  - 16 Shots (22.5° step)-> High-resolution wide-angle setup
  - 24 Shots (15° step)  -> Gigapixel standard telephoto rows
• Real-Time Overlap Gauge:
  - < 15%: Critical Risk (red) — High probability of stitch failure
  - 15% - 24%: Marginal (amber) — Requires distinct textures across seams
  - 25% - 40%: Optimal Sweet Spot (emerald) — Perfect blend speed & safety
  - > 40%: High Redundancy (sky blue) — Excellent for moving foliage / clouds
• 1-Click Auto-Tune for Super Output:
  Instantly selects optimal shot count, sweet spot aperture (f/8), 30% overlap,
  and 0.5m foreground distance for the active camera and lens.

4.3 PANORAMIC HEAD & NODAL RAIL CALIBRATION (ENTRANCE PUPIL)
--------------------------------------------------------------------------------
• Upper Rail Offset: Positions the entrance pupil (no-parallax point) directly
  over the horizontal panning axis.
• Lower Rail Offset: Aligns the optical center of the lens directly above the
  vertical rotator axis.
• Parallax Sensitivity Rating:
  - Extreme (< 0.8 m)
  - High (0.8 m – 1.8 m)
  - Moderate (1.8 m – 5.0 m)
  - Low (> 5.0 m)
• Pre-loaded Panoramic Heads:
  - Nodal Ninja 4 (Fanotec)
  - Nodal Ninja 3 MKII
  - Nodal Ninja 6
  - Leofoto PAN-02 / Bushman
  - Sunwayfoto CR-30
  - Custom Panoramic Heads (user adjustable rails)

4.4 DUAL STANDARD UNITS (METRIC & IMPERIAL)
--------------------------------------------------------------------------------
Every measurement across PanoOptix includes simultaneous Metric and Imperial
readings to satisfy global photographic standards:
• Distance: "0.50 m (1.64 ft / 19.7 in)" or "2.0 m (6.56 ft)"
• Rails & NPP: "42.0 mm (1.65 in)" and "52.0 mm (2.05 in)"
• Sensor Dimensions: "35.9 × 23.9 mm (1.41 × 0.94 in)"
• Focal Length: "8.0 mm (0.31 in)"
• Circle of Confusion: "0.019 mm (0.00075 in)"

4.5 STANDARD 0.5-METER DEFAULT DISTANCE ARCHITECTURE
--------------------------------------------------------------------------------
All calculation engines, initial application states, rig presets, and distance
sliders default to 0.5 meters (50 cm / 19.7 inches).
Why 0.5 meters?
In 360° interior tours, foreground door frames, furniture edges, counter tops,
and tripods regularly fall within 0.5 meters. Aligning and focusing for 0.5m
guarantees that foreground objects remain tack-sharp and completely parallax-free.

4.6 PRINTABLE FIELD PDF SPECIFICATION SHEET (DEMOGRAPHIC INFOGRAPHIC)
--------------------------------------------------------------------------------
• Visual Demographic Layout: Clean infographic layout organized into 7 distinct
  demographic blocks:
  1. Header Demographic: Rig title, date, field ID, quick-reference pill badge.
  2. Camera & Sensor Demographic: Format, dimensions (dual mm/in), crop, MP, pitch.
  3. Lens & Optical Demographic: Projection, focal length, FOV, mount, portrait note.
  4. Panoramic Head Calibration: Upper rail, lower rail, detent stop, rail ruler gauge.
  5. 360° Rotation Compass: Detent angles table (0°, 90°, 180°, 270°, Zenith, Nadir).
  6. Optical Sweet Spot & DOF: Focus distance, hyperfocal, sharp zone to infinity.
  7. Exposure & AEB HDR Plan: Shutter, ISO, white balance, dynamic range stops.
  8. Pre-Flight Checklist: 6 physical verification steps with checkboxes.
• Print Engine: Integrated @media print CSS styles automatically format the
  sheet to clean black-and-white or high-contrast color for paper/PDF print,
  stripping away web buttons and modal chrome.
• Download HTML: Single-click export of a standalone HTML spec sheet for offline use.

4.7 EXCEL EQUIPMENT DATABASE UPLOAD & DEDUPLICATION ENGINE
--------------------------------------------------------------------------------
• Supported Formats: Microsoft Excel (.xlsx, .xls) and CSV (.csv).
• Multi-Sheet Support: Automatically processes separate "Cameras" and "Lenses"
  worksheets or combined equipment sheets.
• Intelligent Column Recognition: Matches various naming conventions (e.g.
  "Focal Length", "Min Focal Length", "focalLengthMinMm", "FocalLength").
• Automatic Deduplication: Cross-checks all incoming items against the current
  database. Any gear matching Brand and Model is skipped to preserve existing
  calibrations.
• Dual Operation Modes:
  - Creator Mode (Gazaly Samsadeen): Updates the Master Database with verified
    manufacturer provenance tags.
  - Visitor / User Mode: Stores gear in browser localStorage for the current
    device only without altering defaults.
• Sample Template: Click "Get Sample Excel" to download a pre-formatted
  template (PanoOptix_Gear_Database_Template_By_Gazaly_Samsadeen.xlsx).

4.8 360° ROTATOR COMPASS & MULTI-ROW VISUALIZER
--------------------------------------------------------------------------------
• Interactive SVG Radar Compass: Displays field of view coverage cones radiating
  from the panoramic head center.
• Live Detent Numbering: Highlights each shot position around the circle.
• Row Elevation Visualizer: Illustrates multi-tier vertical pitch angles
  and indicates whether a Zenith (+90°) or Nadir (-90°) patch shot is required.

4.9 DYNAMIC EXPOSURE & AEB HDR BRACKETING CALCULATOR
--------------------------------------------------------------------------------
• Evaluates ambient Scene EV from EV 3 (night interior) to EV 16 (bright beach).
• Evaluates dynamic range span (e.g. 14 EV sensor + 4 EV AEB = 18 EV headroom).
• Determines bracket count (1, 3, 5, 7 frames) and step size (±1.0, ±2.0 EV).
• Calculates total RAW frames to shoot: (Horizontal Shots + Zenith + Nadir) × AEB Frames.

4.10 HARDWARE DATABASE HUB
--------------------------------------------------------------------------------
• Pre-loaded with extensive camera models across Canon, Sony, Nikon, Fujifilm,
  Panasonic, Leica, Olympus / OM System, and Hasselblad.
• Pre-loaded with fisheye and rectilinear lenses from Sigma, Canon, Sony, Nikon,
  Samyang / Rokinon, Laowa (Venus Optics), Tokina, and Meike.
• Includes CRUD operations: Add custom gear, edit parameters, and export/import
  JSON or CSV backups.


5. MATHEMATICAL & OPTICAL FORMULAS APPLIED
--------------------------------------------------------------------------------
1. FIELD OF VIEW (FOV):
   - Rectilinear:
     FOV = 2 * arctan(sensorDimension / (2 * focalLength))

   - Fisheye Equidistant (r = f * θ):
     θ = r / f  ->  FOV = 2 * (sensorDimension / (2 * focalLength)) [radians]

   - Fisheye Equisolid (r = 2 * f * sin(θ/2)):
     θ = 2 * arcsin(sensorDimension / (4 * focalLength)) [radians]

   - Fisheye Orthographic (r = f * sin(θ)):
     θ = arcsin(sensorDimension / (2 * focalLength)) [radians]

   - Fisheye Stereographic (r = 2 * f * tan(θ/2)):
     θ = 2 * arctan(sensorDimension / (4 * focalLength)) [radians]

2. ROTATION ANGLE & OVERLAP:
   - Step Angle = 360° / ShotsCount
   - Actual Overlap % = [1 - (StepAngle / HFOV)] * 100

3. CIRCLE OF CONFUSION (CoC):
   - CoC = SensorDiagonalMm / 1500 (Zeiss standard criterion)

4. HYPERFOCAL DISTANCE (H):
   - H = (FocalLength^2) / (Aperture * CoC) + FocalLength

5. DEPTH OF FIELD LIMITS:
   - Near Limit = (H * FocusDistance) / (H + (FocusDistance - FocalLength))
   - Far Limit = (H * FocusDistance) / (H - (FocusDistance - FocalLength))
   - If FocusDistance >= H, Far Limit = Infinity (∞)

6. AIRY DISK & DIFFRACTION:
   - Airy Disk Diameter = 2.44 * λ * Aperture (λ = 0.55 µm green light)
   - Pixel Pitch = (SensorWidthMm / NativeResolutionWidthPx) * 1000 [µm]
   - Diffraction Warning triggered when Airy Disk > 2.5 * Pixel Pitch


6. EXCEL SPREADSHEET IMPORT FORMAT SPECIFICATION
--------------------------------------------------------------------------------
To batch upload cameras or lenses via Excel, create a workbook with either two
separate sheets named "Cameras" and "Lenses", or a single sheet with the
following columns:

CAMERA SHEET COLUMNS:
• Brand               (e.g., Canon, Sony, Nikon, Fujifilm)
• Model               (e.g., EOS R5, A7 IV, Z8, X-T5)
• Sensor Format       (Full-Frame, APS-C Canon, APS-C, Micro Four Thirds, 1 inch, Medium Format)
• Sensor Width (mm)   (e.g., 35.9, 22.3, 23.5, 17.3)
• Sensor Height (mm)  (e.g., 23.9, 14.9, 15.6, 13.0)
• Megapixels          (e.g., 45.0, 32.5, 24.2, 61.0)
• Resolution Width    (e.g., 8192, 6960, 6000, 9504)
• Resolution Height   (e.g., 5464, 4640, 4000, 6336)
• Crop Factor         (e.g., 1.0, 1.6, 1.53, 2.0)
• Lens Mount          (e.g., Canon RF, Sony E, Nikon Z, Fuji X)

LENS SHEET COLUMNS:
• Brand                     (e.g., Sigma, Canon, Samyang, Sony)
• Model                     (e.g., 8mm f/3.5 EX DG Fisheye, 14mm f/1.8 GM)
• Projection Type           (rectilinear, fisheye_circular, fisheye_equisolid, fisheye_fullframe)
• Focal Length Min (mm)     (e.g., 8, 14, 15, 24)
• Focal Length Max (mm)     (e.g., 8, 24, 35, 70)
• Max Aperture              (e.g., 1.8, 2.8, 3.5, 4.0)
• Entrance Pupil Offset (mm)(Distance from lens front/mount to NPP, e.g., 42.0)
• Lens Mount                (e.g., Canon EF, Sony E, Micro Four Thirds)


7. SYSTEM ARCHITECTURE & TECHNOLOGY STACK
--------------------------------------------------------------------------------
• Framework: React 19 (TypeScript)
• Build System: Vite
• Styling & Design: Tailwind CSS v4 with professional dark photography studio UI
• Spreadsheet Engine: SheetJS (XLSX)
• Icons: Lucide React
• State Management: React Context API with persistent localStorage caching
• Print Architecture: Zero-dependency browser print styling (@media print)


8. CREATOR & ATTRIBUTION NOTICE
--------------------------------------------------------------------------------
PanoOptix™ Pro was conceptualized, designed, and architected by:

  GAZALY SAMSADEEN
  Lead Optical Architect & Creator

All benchmark optical presets, entrance pupil calibrations, sensor metric
lookups, and panoramic workflow heuristics are curated and verified by
Gazaly Samsadeen for professional field deployment.

For updates, gear additions, or field support, refer to the in-app Admin Hub
or contact via the official project repository.

================================================================================
  END OF README.TXT — PANOOPTIX™ PRO FIELD OPTICS SPECIFICATION
================================================================================
