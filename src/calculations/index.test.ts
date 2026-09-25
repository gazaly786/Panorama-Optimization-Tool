import { INITIAL_CAMERAS } from '../data/cameras';
import { INITIAL_LENSES } from '../data/lenses';
import { PANORAMA_SCENARIOS } from '../data/scenarios';
import { calculateFov } from './fov';
import { calculateDof, getCircleOfConfusionMm } from './dof';
import { calculateHyperfocalDistanceM, getHyperfocalTable } from './hyperfocal';
import { calculatePixelPitchUm } from './pixelPitch';
import { assessDiffraction, calculateAiryDiskUm } from './diffraction';
import { calculatePanoramaGeometry } from './panorama';
import { calculateExposure } from './exposure';
import { optimizePanoramaSettings } from './recommendations';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('--- RUNNING OPTICAL & PANORAMA ENGINE VERIFICATION SUITE ---\n');

// 1. Camera validation: Canon EOS 90D
const canon90d = INITIAL_CAMERAS.find(c => c.id === 'canon-90d')!;
assert(!!canon90d, 'Canon EOS 90D exists in database');
assert(canon90d.cropFactor === 1.61, 'Canon 90D crop factor is 1.61x');

const pitch90d = calculatePixelPitchUm(canon90d);
assert(pitch90d >= 3.15 && pitch90d <= 3.25, `Canon 90D pixel pitch is ~3.20 um (got ${pitch90d})`);

const coc90d = getCircleOfConfusionMm(canon90d);
assert(coc90d >= 0.017 && coc90d <= 0.019, `Canon 90D CoC is ~0.018 mm (got ${coc90d})`);

// 2. Lens validation: Sigma 8mm f/3.5 Circular Fisheye
const sigma8mm = INITIAL_LENSES.find(l => l.id === 'sigma-8mm-f35-fisheye')!;
assert(!!sigma8mm, 'Sigma 8mm Fisheye exists in database');
assert(sigma8mm.projectionType === 'fisheye_circular', 'Sigma 8mm is registered as circular fisheye');

// 3. FOV Calculation Test
const fovFisheye = calculateFov(canon90d, sigma8mm, 8);
assert(fovFisheye.isFisheye === true, 'Fisheye projection correctly identified');
assert(fovFisheye.horizontalDeg >= 120 && fovFisheye.horizontalDeg <= 180, `Sigma 8mm on 90D HFOV is wide (got ${fovFisheye.horizontalDeg}°)`);

// Test Rectilinear FOV: Canon 10-18mm at 10mm
const canon1018 = INITIAL_LENSES.find(l => l.id === 'canon-efs-10-18mm')!;
const fovRectilinear = calculateFov(canon90d, canon1018, 10);
assert(fovRectilinear.isFisheye === false, 'Rectilinear lens correctly identified');
assert(fovRectilinear.effectiveFocalLengthMm === 16.1, 'Effective focal length = 10 * 1.61 = 16.1mm');
assert(fovRectilinear.horizontalDeg >= 90 && fovRectilinear.horizontalDeg <= 100, `Rectilinear 10mm on APS-C gives ~96° HFOV (got ${fovRectilinear.horizontalDeg}°)`);

// 4. Hyperfocal Calculation Test
// At f/8 on 8mm with CoC = 0.0179 mm: H = 8^2 / (8 * 0.0179) + 8 = 64 / 0.1432 + 8 ≈ 455 mm ≈ 0.45 m
const H_8mm_f8 = calculateHyperfocalDistanceM(8, 8, coc90d);
assert(H_8mm_f8 >= 0.40 && H_8mm_f8 <= 0.55, `8mm at f/8 hyperfocal distance is ~0.45m (got ${H_8mm_f8}m)`);

// 5. Depth of Field Test
// Focusing at 1.2m with 8mm at f/8:
const dof8mm = calculateDof(8, 8, 1.2, coc90d);
assert(dof8mm.farLimitM === 'Infinity', 'Far limit reaches infinity when focused beyond hyperfocal');
assert(dof8mm.nearLimitM <= 0.40, `Near limit is under 0.40m (got ${dof8mm.nearLimitM}m)`);

// 6. Diffraction Assessment Test
const diffF8 = assessDiffraction(8, canon90d, sigma8mm);
assert(diffF8.status === 'LOW' || diffF8.status === 'MODERATE', `f/8 on 90D has LOW or MODERATE diffraction (got ${diffF8.status})`);
const diffF22 = assessDiffraction(22, canon90d, sigma8mm);
assert(diffF22.status === 'VERY HIGH', `f/22 on 90D has VERY HIGH diffraction`);

// 7. Panorama Shot Count and Overlap Test
const panoGeo = calculatePanoramaGeometry(canon90d, sigma8mm, 8, 0.30, '360x180', true);
assert(panoGeo.shotsPerCircle === 6, `Sigma 8mm on APS-C recommends 6 shots around (got ${panoGeo.shotsPerCircle})`);
assert(panoGeo.rotatorClickStopDeg === 60, `6 shots corresponds to 60° rotator click-stop (got ${panoGeo.rotatorClickStopDeg}°)`);
assert(panoGeo.actualOverlapPct >= 20, `Actual overlap is >= 20% (got ${panoGeo.actualOverlapPct}%)`);
assert(panoGeo.estimatedPanoWidthPx >= 8000, `Estimated panorama width is high resolution (got ${panoGeo.estimatedPanoWidthPx}px)`);

// 8. Exposure Engine Test
const exp = calculateExposure(canon90d, 8, 8, true, false, 'MAXIMUM_QUALITY');
assert(exp.iso === 100, `Base ISO 100 chosen on tripod`);
assert(exp.shutterSeconds > 0, `Shutter speed calculated (${exp.shutterSpeedFraction})`);
assert(exp.vibrationMitigation.selfTimerSeconds === 2, '2-second self timer recommended for tripod stability');

// 9. Full Master Recommendation Engine Test
const realEstateScenario = PANORAMA_SCENARIOS.find(s => s.id === 'real-estate-interior')!;
const recipe = optimizePanoramaSettings({
  camera: canon90d,
  lens: sigma8mm,
  scenario: realEstateScenario,
  focalLengthMm: 8,
  subjectDistanceM: 2.0,
  targetOverlapPct: 0.30,
  qualityPriority: 'MAXIMUM_QUALITY',
  tripodOn: true,
});

assert(recipe.recommendedAperture === 8, `Recommended aperture is f/8 (got ${recipe.recommendedApertureString})`);
assert(recipe.shotsPerCircle === 6, `Recommended shots per circle = 6`);
assert(recipe.focusMode === 'MANUAL + LOCK', `Recommended focus mode is MANUAL + LOCK`);
assert(recipe.aebRecommended === true, `AEB is recommended for real estate interior with windows`);
assert(recipe.checklist.length >= 10, `Checklist contains full actionable steps (${recipe.checklist.length} steps)`);

console.log('\n🎉 ALL OPTICAL AND PANORAMA CALCULATION TESTS PASSED WITH 100% ACCURACY!\n');
