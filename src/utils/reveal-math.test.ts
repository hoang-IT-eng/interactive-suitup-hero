import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCoverDimensions,
  computeStampScale,
  computeInterpolation,
  computeAutoWanderPosition,
} from './reveal-math';

test('computeCoverDimensions scales to cover canvas and anchors bottom', () => {
  // Case 1: Tall image in wider canvas
  const canvasW = 600;
  const canvasH = 800;
  const imgW = 1536;
  const imgH = 2048; // aspect 3:4, same as canvas 600:800
  const dims = computeCoverDimensions(canvasW, canvasH, imgW, imgH);

  assert.equal(dims.sw, 600);
  assert.equal(dims.sh, 800);
  assert.equal(dims.sx, 0);
  assert.equal(dims.sy, 0);

  // Case 2: Image wider than canvas (canvas aspect narrower than image)
  // Canvas 300x800, image 1536x2048 (0.75 aspect vs 0.375 aspect)
  const dims2 = computeCoverDimensions(300, 800, 1536, 2048);
  assert.equal(dims2.sh, 800);
  assert.equal(dims2.sw, 600);
  assert.equal(dims2.sx, (300 - 600) / 2); // -150, centred horizontally
  assert.equal(dims2.sy, 800 - 800); // 0, anchored to bottom

  // Case 3: Canvas wider aspect ratio (e.g. 1000x800)
  const dims3 = computeCoverDimensions(1000, 800, 1536, 2048);
  // scale = 1000 / 1536 ≈ 0.651, sh = 2048 * (1000/1536) ≈ 1333.33
  assert.equal(dims3.sw, 1000);
  assert.ok(dims3.sh > 800);
  assert.equal(dims3.sx, 0);
  assert.equal(dims3.sy, 800 - dims3.sh); // anchored to bottom: negative sy so top is cropped, bottom is flush
});

test('computeStampScale holds at 1.0 for first 25% then scales down to 0', () => {
  const LIFE = 1100;

  // Fresh stamp: age = 0 -> k = 1.0 -> scale = 1.0
  assert.equal(computeStampScale(0, LIFE), 1.0);

  // 20% into life: age = 220 -> k = 0.8 -> k >= 0.75 -> scale = 1.0 (holds)
  assert.equal(computeStampScale(220, LIFE), 1.0);

  // Exactly at boundary k = 0.75: age = 275 -> scale = 1.0
  assert.equal(computeStampScale(275, LIFE), 1.0);

  // 50% into life: k = 0.5 -> scale = 0.5 / 0.75 = 0.6666...
  assert.ok(Math.abs(computeStampScale(550, LIFE) - (0.5 / 0.75)) < 1e-4);

  // At end of life: age = 1100 -> k = 0 -> scale = 0
  assert.equal(computeStampScale(1100, LIFE), 0);
});

test('computeInterpolation generates intermediate points without exceeding cap', () => {
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 100, y: 0 };
  const step = 20;

  const points = computeInterpolation(p1, p2, step, 40);
  // dist = 100, count = min(floor(100/20), 40) = 5
  assert.equal(points.length, 5);
  assert.ok(points[0].x > 0 && points[0].x < points[4].x);

  // Test cap at 40
  const pFar = { x: 10000, y: 0 };
  const cappedPoints = computeInterpolation(p1, pFar, step, 40);
  assert.equal(cappedPoints.length, 40);
});

test('computeAutoWanderPosition stays within figure bounds', () => {
  const W = 500;
  const H = 700;

  for (let t = 0; t < 10; t += 0.5) {
    const pos = computeAutoWanderPosition(W, H, t);
    // x is W * (0.5 + sin(...) * 0.28) -> between W * 0.22 and W * 0.78
    assert.ok(pos.x >= W * 0.22 - 1 && pos.x <= W * 0.78 + 1);
    // y is H * (0.32 + sin(...) * 0.22) -> between H * 0.10 and H * 0.54
    assert.ok(pos.y >= H * 0.10 - 1 && pos.y <= H * 0.54 + 1);
  }
});
