import * as XLSX from 'xlsx';
import { CameraSpec, LensSpec, SensorFormat, ProjectionType, PanoHeadSpec, PanoHeadType } from '../types';

export interface ParseExcelResult {
  newCameras: CameraSpec[];
  newLenses: LensSpec[];
  newPanoHeads: PanoHeadSpec[];
  skippedCameras: string[];
  skippedLenses: string[];
  skippedPanoHeads: string[];
  errors: string[];
}

/**
 * Standard Sensor Dimension Reference Table
 */
const SENSOR_FORMAT_DEFAULTS: Record<string, { format: SensorFormat; w: number; h: number; crop: number }> = {
  'full-frame': { format: 'Full-Frame', w: 35.9, h: 23.9, crop: 1.0 },
  'full frame': { format: 'Full-Frame', w: 35.9, h: 23.9, crop: 1.0 },
  'fx': { format: 'Full-Frame', w: 35.9, h: 23.9, crop: 1.0 },
  '35mm': { format: 'Full-Frame', w: 35.9, h: 23.9, crop: 1.0 },
  'aps-c canon': { format: 'APS-C Canon', w: 22.3, h: 14.9, crop: 1.61 },
  'aps-c (canon)': { format: 'APS-C Canon', w: 22.3, h: 14.9, crop: 1.61 },
  'aps-c': { format: 'APS-C (Nikon/Sony/Fuji)', w: 23.5, h: 15.6, crop: 1.53 },
  'dx': { format: 'APS-C (Nikon/Sony/Fuji)', w: 23.5, h: 15.6, crop: 1.53 },
  'aps-c (nikon/sony/fuji)': { format: 'APS-C (Nikon/Sony/Fuji)', w: 23.5, h: 15.6, crop: 1.53 },
  'micro four thirds': { format: 'Micro Four Thirds', w: 17.3, h: 13.0, crop: 2.0 },
  'mft': { format: 'Micro Four Thirds', w: 17.3, h: 13.0, crop: 2.0 },
  'm4/3': { format: 'Micro Four Thirds', w: 17.3, h: 13.0, crop: 2.0 },
  '1 inch': { format: '1 inch', w: 13.2, h: 8.8, crop: 2.73 },
  '1"': { format: '1 inch', w: 13.2, h: 8.8, crop: 2.73 },
  'medium format': { format: 'Medium Format 44x33', w: 43.8, h: 32.9, crop: 0.79 },
  'medium format 44x33': { format: 'Medium Format 44x33', w: 43.8, h: 32.9, crop: 0.79 },
};

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findValue(row: Record<string, any>, possibleKeys: string[]): any {
  const rowKeys = Object.keys(row);
  for (const targetKey of possibleKeys) {
    const normTarget = normalizeKey(targetKey);
    for (const rk of rowKeys) {
      if (normalizeKey(rk) === normTarget) {
        return row[rk];
      }
    }
  }
  return undefined;
}

/**
 * Parses an Excel (.xlsx / .xls / .csv) file array buffer and returns extracted cameras, lenses, and pano heads.
 * Automatically skips existing gear to prevent duplicates.
 */
export function parseExcelGearFile(
  fileBuffer: ArrayBuffer,
  existingCameras: CameraSpec[],
  existingLenses: LensSpec[],
  isCreatorMode = false,
  existingPanoHeads: PanoHeadSpec[] = []
): ParseExcelResult {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const newCameras: CameraSpec[] = [];
  const newLenses: LensSpec[] = [];
  const newPanoHeads: PanoHeadSpec[] = [];
  const skippedCameras: string[] = [];
  const skippedLenses: string[] = [];
  const skippedPanoHeads: string[] = [];
  const errors: string[] = [];

  // Build existing lookup keys
  const existingCamKeys = new Set(
    existingCameras.map((c) => `${c.brand.trim().toLowerCase()}|${c.model.trim().toLowerCase()}`)
  );
  const existingLensKeys = new Set(
    existingLenses.map((l) => `${l.brand.trim().toLowerCase()}|${l.model.trim().toLowerCase()}`)
  );
  const existingHeadKeys = new Set(
    existingPanoHeads.map((h) => `${h.brand.trim().toLowerCase()}|${h.model.trim().toLowerCase()}`)
  );

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (!rows || rows.length === 0) return;

    const lowerSheet = sheetName.toLowerCase();
    const isCameraSheet =
      lowerSheet.includes('cam') ||
      lowerSheet.includes('body') ||
      lowerSheet.includes('sensor');
    const isLensSheet =
      lowerSheet.includes('len') ||
      lowerSheet.includes('optic') ||
      lowerSheet.includes('glass');
    const isPanoHeadSheet =
      lowerSheet.includes('head') ||
      lowerSheet.includes('pano') ||
      lowerSheet.includes('rotator') ||
      lowerSheet.includes('mount');

    rows.forEach((row, rowIndex) => {
      // Check if this row looks like gear
      const brand = findValue(row, ['Brand/Manufacturer', 'Brand', 'Make', 'Manufacturer', 'Company']);
      const model = findValue(row, ['Model', 'Camera Model', 'Lens Model', 'Name', 'Gear Name', 'Pano Head']);

      if (!brand || !model || String(brand).trim() === '' || String(model).trim() === '') {
        return; // skip empty or invalid rows
      }

      const brandStr = String(brand).trim();
      const modelStr = String(model).trim();
      const lookupKey = `${brandStr.toLowerCase()}|${modelStr.toLowerCase()}`;

      // Check whether this row is a Pano Head, Lens, or Camera
      const hasHeadIndicators =
        findValue(row, ['Load Capacity', 'Rotator Detent Options', 'Rotator Detent', 'Setup Method', 'Camera/Lens Compatibility']) !== undefined;
      const hasLensIndicators =
        findValue(row, ['Focal Length', 'Focal Length Min', 'Aperture', 'Max Aperture', 'Projection', 'NPP', 'Entrance Pupil']) !== undefined;
      const hasCameraIndicators =
        findValue(row, ['Sensor Format', 'Megapixels', 'MP', 'Crop Factor', 'ISO', 'AEB']) !== undefined;

      const treatAsHead = isPanoHeadSheet || (!isCameraSheet && !isLensSheet && hasHeadIndicators);
      const treatAsLens = !treatAsHead && (isLensSheet || (!isCameraSheet && hasLensIndicators && !hasCameraIndicators));
      const treatAsCamera = !treatAsHead && !treatAsLens && (isCameraSheet || hasCameraIndicators || true);

      if (treatAsHead) {
        // Panoramic Head Processing
        if (existingHeadKeys.has(lookupKey)) {
          skippedPanoHeads.push(`${brandStr} ${modelStr}`);
          return;
        }

        existingHeadKeys.add(lookupKey);

        try {
          const rawType = String(findValue(row, ['Type', 'Head Type', 'Pano Head Type']) || 'Multi-row Spherical');
          const rawCapacity = String(findValue(row, ['Load Capacity', 'Capacity', 'Weight Limit']) || '~3.5kg');
          const rawDetents = String(findValue(row, ['Rotator Detent Options', 'Rotator Detent', 'Detent Stops', 'Click Stops']) || 'Standard detents');
          const rawSetup = String(findValue(row, ['Setup Method', 'Method', 'Setup']) || 'Sliding rails with mm scales');
          const rawCompat = String(findValue(row, ['Camera/Lens Compatibility', 'Compatibility']) || 'Universal');
          const rawStatus = String(findValue(row, ['Status', 'Active Status']) || 'Active');

          const isRingClamp = rawType.toLowerCase().includes('ring') || modelStr.toLowerCase().includes('ring') || rawSetup.toLowerCase().includes('clamp');
          const isSlant = rawType.toLowerCase().includes('slant') || modelStr.toLowerCase().includes('slant');

          // Derive detent degrees from text or defaults
          let detents: number[] = [90, 60, 45, 30];
          if (rawDetents.includes('10, 15, 30, 45, 90') || rawDetents.includes('300N')) {
            detents = [90, 45, 30, 15, 10];
          } else if (rawDetents.includes('12, 15, 18, 20, 24')) {
            detents = [30, 24, 20, 18, 15];
          } else if (rawDetents.includes('3, 4, 6, 8')) {
            detents = [120, 90, 60, 45];
          } else if (isSlant) {
            detents = [120, 90];
          }

          const headItem: PanoHeadSpec = {
            id: `head-${normalizeKey(brandStr)}-${normalizeKey(modelStr)}-${Date.now()}`,
            brand: brandStr,
            model: modelStr,
            type: rawType as PanoHeadType,
            loadCapacity: rawCapacity,
            rotatorDetentOptions: rawDetents,
            detentStopsDeg: detents,
            supportedShots: detents.map(d => Math.round(360 / d)),
            setupMethod: rawSetup,
            compatibility: rawCompat,
            status: rawStatus.includes('Legacy') && !rawStatus.includes('Active') ? 'Legacy' : rawStatus.includes('Legacy/Active') ? 'Legacy/Active' : 'Active',
            lowerRailMaxMm: isRingClamp ? 0 : 130,
            upperRailMaxMm: isRingClamp ? 0 : 150,
            isRingClamp,
            isSlant,
            provenance: {
              source: isCreatorMode ? 'Gazaly Samsadeen Curated Master Database (Excel)' : 'User Excel Import (Local Device)',
              status: isCreatorMode ? 'MANUFACTURER DATA' : 'USER VERIFIED',
              confidence: 'HIGH',
              dateVerified: new Date().toISOString().split('T')[0],
            },
          };

          newPanoHeads.push(headItem);
        } catch (err: any) {
          errors.push(`Row ${rowIndex + 1} (Pano Head ${modelStr}): ${err.message || 'Parse error'}`);
        }
      } else if (treatAsLens) {
        // Lens Processing
        if (existingLensKeys.has(lookupKey)) {
          skippedLenses.push(`${brandStr} ${modelStr}`);
          return;
        }

        existingLensKeys.add(lookupKey);

        try {
          const rawMinFl = parseFloat(findValue(row, ['Focal Length Min', 'Focal Length', 'Min Focal Length', 'focalLengthMinMm', 'FocalLength']) || '8');
          const rawMaxFl = parseFloat(findValue(row, ['Focal Length Max', 'Max Focal Length', 'focalLengthMaxMm']) || String(rawMinFl));
          const rawAp = parseFloat(findValue(row, ['Max Aperture', 'Aperture', 'f-stop', 'maxAperture', 'F-Stop']) || '3.5');
          const rawNpp = parseFloat(findValue(row, ['Entrance Pupil', 'Entrance Pupil Offset (mm)', 'NPP', 'Nodal Offset', 'entrancePupilOffsetMm']) || '42');
          const rawMount = String(findValue(row, ['Lens Mount', 'Mount', 'mount', 'lensMount']) || 'Universal / Arca');
          const rawProjection = String(findValue(row, ['Projection', 'Projection Type', 'Type', 'projectionType']) || '').toLowerCase();

          let projectionType: ProjectionType = 'rectilinear';
          if (rawProjection.includes('circular') || modelStr.toLowerCase().includes('circular')) {
            projectionType = 'fisheye_circular';
          } else if (rawProjection.includes('equisolid')) {
            projectionType = 'fisheye_equisolid';
          } else if (rawProjection.includes('equidistant')) {
            projectionType = 'fisheye_equidistant';
          } else if (rawProjection.includes('orthographic')) {
            projectionType = 'fisheye_orthographic';
          } else if (rawProjection.includes('stereographic')) {
            projectionType = 'fisheye_stereographic';
          } else if (rawProjection.includes('fisheye') || modelStr.toLowerCase().includes('fisheye') || rawMinFl <= 12) {
            projectionType = 'fisheye_fullframe';
          }

          const lensItem: LensSpec = {
            id: `lens-${normalizeKey(brandStr)}-${normalizeKey(modelStr)}-${Date.now()}`,
            brand: brandStr,
            model: modelStr,
            focalLengthMinMm: isNaN(rawMinFl) || rawMinFl <= 0 ? 8 : rawMinFl,
            focalLengthMaxMm: isNaN(rawMaxFl) || rawMaxFl < rawMinFl ? rawMinFl : rawMaxFl,
            maxAperture: isNaN(rawAp) || rawAp <= 0 ? 3.5 : rawAp,
            minAperture: 22,
            projectionType,
            lensMount: rawMount,
            sensorCompatibility: ['Full-Frame', 'APS-C Canon', 'APS-C (Nikon/Sony/Fuji)', 'Micro Four Thirds'],
            minFocusDistanceM: 0.2,
            sweetSpotAperture: 'f/5.6 - f/8',
            entrancePupilOffsetMm: isNaN(rawNpp) ? 42 : rawNpp,
            opticalStabilization: false,
            filterSupport: false,
            provenance: {
              source: isCreatorMode ? 'Gazaly Samsadeen Master Database (Excel)' : 'User Excel Import (Local Device)',
              status: isCreatorMode ? 'MANUFACTURER DATA' : 'USER VERIFIED',
              confidence: 'HIGH',
              dateVerified: new Date().toISOString().split('T')[0],
            },
          };

          newLenses.push(lensItem);
        } catch (err: any) {
          errors.push(`Row ${rowIndex + 1} (Lens ${modelStr}): ${err.message || 'Parse error'}`);
        }
      } else if (treatAsCamera) {
        // Camera Processing
        if (existingCamKeys.has(lookupKey)) {
          skippedCameras.push(`${brandStr} ${modelStr}`);
          return;
        }

        existingCamKeys.add(lookupKey);

        try {
          const rawFormatStr = String(findValue(row, ['Sensor Format', 'Format', 'Sensor Size', 'Sensor', 'sensorFormat']) || 'Full-Frame').toLowerCase();
          const formatConfig = SENSOR_FORMAT_DEFAULTS[rawFormatStr] || SENSOR_FORMAT_DEFAULTS['full-frame'];

          const rawWidth = parseFloat(findValue(row, ['Sensor Width', 'Sensor Width (mm)', 'Width mm', 'sensorWidthMm']) || String(formatConfig.w));
          const rawHeight = parseFloat(findValue(row, ['Sensor Height', 'Sensor Height (mm)', 'Height mm', 'sensorHeightMm']) || String(formatConfig.h));
          const rawMp = parseFloat(findValue(row, ['Megapixels', 'MP', 'Resolution MP', 'megapixels']) || '24');
          const rawCrop = parseFloat(findValue(row, ['Crop Factor', 'Crop', 'cropFactor']) || String(formatConfig.crop));
          const rawMount = String(findValue(row, ['Lens Mount', 'Mount', 'mount', 'lensMount']) || 'Standard Mount');

          const rawResWidth = parseFloat(findValue(row, ['Resolution Width', 'X Resolution', 'Width Px']) || '6000');
          const rawResHeight = parseFloat(findValue(row, ['Resolution Height', 'Y Resolution', 'Height Px']) || '4000');

          const sw = isNaN(rawWidth) || rawWidth <= 0 ? formatConfig.w : rawWidth;
          const sh = isNaN(rawHeight) || rawHeight <= 0 ? formatConfig.h : rawHeight;
          const sd = Math.round(Math.sqrt(sw ** 2 + sh ** 2) * 100) / 100;
          const rw = isNaN(rawResWidth) || rawResWidth <= 0 ? 6000 : rawResWidth;
          const rh = isNaN(rawResHeight) || rawResHeight <= 0 ? 4000 : rawResHeight;
          const pitch = Math.round((sw / rw) * 1000 * 100) / 100;

          const cameraItem: CameraSpec = {
            id: `cam-${normalizeKey(brandStr)}-${normalizeKey(modelStr)}-${Date.now()}`,
            brand: brandStr,
            model: modelStr,
            cameraType: modelStr.toLowerCase().includes('mark') || modelStr.toLowerCase().includes('eos') ? 'Mirrorless' : 'Mirrorless',
            sensorFormat: formatConfig.format,
            sensorWidthMm: sw,
            sensorHeightMm: sh,
            sensorDiagonalMm: sd,
            cropFactor: isNaN(rawCrop) || rawCrop <= 0 ? formatConfig.crop : rawCrop,
            megapixels: isNaN(rawMp) || rawMp <= 0 ? 24 : rawMp,
            nativeResolution: [rw, rh],
            pixelPitchUm: pitch,
            isoRange: [100, 25600],
            nativeIso: 100,
            rawSupport: true,
            rawBitDepth: 14,
            ibis: false,
            mechanicalShutter: true,
            electronicShutter: true,
            maxShutterSpeed: '1/8000',
            minShutterSpeed: '30s',
            aebCapability: true,
            maxAebFrameCount: 5,
            maxAebRangeEv: 3,
            mirrorLockUp: false,
            efcs: true,
            selfTimerSeconds: [2, 10],
            remoteTriggerSupport: true,
            lensMount: rawMount,
            provenance: {
              source: isCreatorMode ? 'Gazaly Samsadeen Master Database (Excel)' : 'User Excel Import (Local Device)',
              status: isCreatorMode ? 'MANUFACTURER DATA' : 'USER VERIFIED',
              confidence: 'HIGH',
              dateVerified: new Date().toISOString().split('T')[0],
            },
          };

          newCameras.push(cameraItem);
        } catch (err: any) {
          errors.push(`Row ${rowIndex + 1} (Camera ${modelStr}): ${err.message || 'Parse error'}`);
        }
      }
    });
  });

  return {
    newCameras,
    newLenses,
    newPanoHeads,
    skippedCameras,
    skippedLenses,
    skippedPanoHeads,
    errors,
  };
}

/**
 * Generates and downloads a clean, beautifully formatted sample Excel (.xlsx) template
 * with sample Cameras, Lenses, and Panoramic Heads sheets.
 */
export function downloadSampleExcelTemplate(): void {
  const cameraHeaders = [
    {
      Brand: 'Canon',
      Model: 'EOS R5',
      'Sensor Format': 'Full-Frame',
      'Sensor Width (mm)': 36.0,
      'Sensor Height (mm)': 24.0,
      Megapixels: 45.0,
      'Resolution Width': 8192,
      'Resolution Height': 5464,
      'Crop Factor': 1.0,
      'Lens Mount': 'Canon RF',
      'AEB Frames': 7,
      'AEB EV Range': 3,
    },
    {
      Brand: 'Sony',
      Model: 'A7R V',
      'Sensor Format': 'Full-Frame',
      'Sensor Width (mm)': 35.7,
      'Sensor Height (mm)': 23.8,
      Megapixels: 61.0,
      'Resolution Width': 9504,
      'Resolution Height': 6336,
      'Crop Factor': 1.0,
      'Lens Mount': 'Sony E',
      'AEB Frames': 9,
      'AEB EV Range': 3,
    },
    {
      Brand: 'Fujifilm',
      Model: 'X-T5',
      'Sensor Format': 'APS-C (Nikon/Sony/Fuji)',
      'Sensor Width (mm)': 23.5,
      'Sensor Height (mm)': 15.7,
      Megapixels: 40.2,
      'Resolution Width': 7728,
      'Resolution Height': 5152,
      'Crop Factor': 1.53,
      'Lens Mount': 'Fuji X',
      'AEB Frames': 7,
      'AEB EV Range': 3,
    },
  ];

  const lensHeaders = [
    {
      Brand: 'Sigma',
      Model: '8mm f/3.5 EX DG Circular Fisheye',
      'Projection Type': 'fisheye_circular',
      'Focal Length Min (mm)': 8,
      'Focal Length Max (mm)': 8,
      'Max Aperture': 3.5,
      'Entrance Pupil Offset (mm)': 42.0,
      'Lens Mount': 'Canon EF / Sigma / Nikon F',
    },
    {
      Brand: 'Samyang / Rokinon',
      Model: '7.5mm f/3.5 UMC Fisheye MFT',
      'Projection Type': 'fisheye_equisolid',
      'Focal Length Min (mm)': 7.5,
      'Focal Length Max (mm)': 7.5,
      'Max Aperture': 3.5,
      'Entrance Pupil Offset (mm)': 38.0,
      'Lens Mount': 'Micro Four Thirds',
    },
    {
      Brand: 'Canon',
      Model: 'RF 15-35mm f/2.8L IS USM',
      'Projection Type': 'rectilinear',
      'Focal Length Min (mm)': 15,
      'Focal Length Max (mm)': 35,
      'Max Aperture': 2.8,
      'Entrance Pupil Offset (mm)': 68.0,
      'Lens Mount': 'Canon RF',
    },
  ];

  const panoHeadHeaders = [
    {
      'Brand/Manufacturer': 'Fanotec / Nodal Ninja',
      Model: 'NN3 MKII/MK3',
      Type: 'Multi-row Spherical',
      'Load Capacity': '~1.5kg',
      'Rotator Detent Options': 'Interchangeable detent rings (e.g. 4, 6, 8, 10, 12 stops)',
      'Setup Method': 'Sliding rails with mm scales for no-parallax point (NPP)',
      'Camera/Lens Compatibility': 'Compact and Mirrorless cameras',
      Status: 'Legacy/Active',
    },
    {
      'Brand/Manufacturer': 'Fanotec / Nodal Ninja',
      Model: 'NN4',
      Type: 'Multi-row Spherical',
      'Load Capacity': '~3.5kg',
      'Rotator Detent Options': 'Interchangeable detent rings or advanced rotator',
      'Setup Method': 'Sliding rails with mm scales',
      'Camera/Lens Compatibility': 'Standard DSLRs with standard/wide lenses',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Fanotec / Nodal Ninja',
      Model: 'NN6',
      Type: 'Multi-row Spherical',
      'Load Capacity': 'Advanced load handling',
      'Rotator Detent Options': 'RD10/RD16/RD8 Advanced Rotators (click stops switchable on the fly)',
      'Setup Method': 'Sliding rails',
      'Camera/Lens Compatibility': 'DSLR and heavy setups',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Fanotec / Nodal Ninja',
      Model: 'R1 / R10 / R20 Series',
      Type: 'Single-row Ring Mount',
      'Load Capacity': 'Lens specific',
      'Rotator Detent Options': 'Mini rotator with fixed or adjustable click stops',
      'Setup Method': 'Lens ring clamp with fixed offset for specific fisheye lenses',
      'Camera/Lens Compatibility': 'Specific circular/full-frame fisheye lenses (e.g., Samyang 8mm, Sigma 8mm)',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Fanotec / Nodal Ninja',
      Model: 'Ultimate M1 / M2',
      Type: 'Multi-row Spherical Gigapixel',
      'Load Capacity': 'Up to 10kg',
      'Rotator Detent Options': 'Heavy duty RD series rotators',
      'Setup Method': 'Geared or sliding rails',
      'Camera/Lens Compatibility': 'Telephoto lenses, large heavy camera systems',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Manfrotto',
      Model: '303SPH',
      Type: 'Multi-row Spherical',
      'Load Capacity': '~4kg',
      'Rotator Detent Options': '300N rotation unit with selectable click stops (10, 15, 30, 45, 90 degrees)',
      'Setup Method': 'Sliding plates with etched mm scales',
      'Camera/Lens Compatibility': 'DSLR medium to heavy',
      Status: 'Active/Legacy',
    },
    {
      'Brand/Manufacturer': 'Manfrotto',
      Model: 'MH057A5 / 303',
      Type: 'Single/Multi-row',
      'Load Capacity': '5kg',
      'Rotator Detent Options': 'Built-in click stops',
      'Setup Method': 'Micro-positioning sliding plates',
      'Camera/Lens Compatibility': 'Pro DSLRs',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Bushman Panoramic',
      Model: 'Gobi',
      Type: 'Multi-row Spherical',
      'Load Capacity': '1.9kg',
      'Rotator Detent Options': 'Built-in rotator with selectable click stops (12, 15, 18, 20, 24 stops)',
      'Setup Method': 'Compact sliding rails',
      'Camera/Lens Compatibility': 'Mirrorless, lightweight DSLRs. Extremely compact.',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Bushman Panoramic',
      Model: 'Kalahari',
      Type: 'Multi-row Spherical',
      'Load Capacity': '~3kg',
      'Rotator Detent Options': 'Built-in click stops',
      'Setup Method': 'Sliding rails',
      'Camera/Lens Compatibility': 'Standard DSLRs',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Novoflex',
      Model: 'VR-System PRO II',
      Type: 'Multi-row Spherical',
      'Load Capacity': 'Heavy duty',
      'Rotator Detent Options': 'Panorama=Q PRO rotator with selectable stops',
      'Setup Method': 'Arca-compatible sliding rails',
      'Camera/Lens Compatibility': 'Professional DSLRs',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Novoflex',
      Model: 'VR-System Slant',
      Type: 'Slant/Single-row',
      'Load Capacity': 'Light/Medium',
      'Rotator Detent Options': 'Click stop rotator',
      'Setup Method': 'Pre-angled at 60 degrees (requires fewer shots for spherical pano)',
      'Camera/Lens Compatibility': 'Fisheye lenses',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Really Right Stuff (RRS)',
      Model: 'PG-02',
      Type: 'Multi-row Spherical (Gimbal type)',
      'Load Capacity': 'Heavy Duty (22kg+)',
      'Rotator Detent Options': 'Panning base with degree markings (requires separate leveling/indexing base for click stops like PC-LR)',
      'Setup Method': 'Precision sliding rails with laser-engraved scales',
      'Camera/Lens Compatibility': 'Heavy Pro DSLRs',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Really Right Stuff (RRS)',
      Model: 'PG-01',
      Type: 'Multi-row Spherical / Single row',
      'Load Capacity': '3.6kg',
      'Rotator Detent Options': 'Panning base (indexing optional)',
      'Setup Method': 'Compact sliding rails',
      'Camera/Lens Compatibility': 'Mirrorless',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Sunwayfoto',
      Model: 'CR-3015 / CR-30',
      Type: 'Multi-row Spherical',
      'Load Capacity': '8kg',
      'Rotator Detent Options': 'Indexing Rotator (IRC-64 or similar) with multiple detent intervals',
      'Setup Method': 'Arca-Swiss compatible sliding rails with scales',
      'Camera/Lens Compatibility': 'DSLRs',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': 'Tom Shot 360',
      Model: 'Tom Shot 360',
      Type: 'Single-row Ring mount',
      'Load Capacity': 'Lightweight',
      'Rotator Detent Options': 'Compact detent rotator',
      'Setup Method': 'Lens clamp set to specific lens NPP',
      'Camera/Lens Compatibility': 'Specific fisheye lenses',
      Status: 'Active',
    },
    {
      'Brand/Manufacturer': '360Precision',
      Model: 'Absolute / Adjuste',
      Type: 'Multi-row / Single-row',
      'Load Capacity': 'High',
      'Rotator Detent Options': 'Precision machined detents',
      'Setup Method': 'Some models are custom-machined for specific camera/lens combinations (no adjustment needed), Adjuste has rails',
      'Camera/Lens Compatibility': 'Pro DSLRs',
      Status: 'Legacy',
    },
  ];

  const wb = XLSX.utils.book_new();
  const wsCameras = XLSX.utils.json_to_sheet(cameraHeaders);
  const wsLenses = XLSX.utils.json_to_sheet(lensHeaders);
  const wsHeads = XLSX.utils.json_to_sheet(panoHeadHeaders);

  XLSX.utils.book_append_sheet(wb, wsCameras, 'Cameras');
  XLSX.utils.book_append_sheet(wb, wsLenses, 'Lenses');
  XLSX.utils.book_append_sheet(wb, wsHeads, 'Panoramic Heads');

  XLSX.writeFile(wb, 'PanoOptix_Gear_Database_Template_By_Gazaly_Samsadeen.xlsx');
}
