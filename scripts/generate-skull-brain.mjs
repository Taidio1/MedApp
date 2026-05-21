/**
 * Generates a placeholder multi-mesh skull+brain GLB model.
 *
 * Mesh names: skull_left, skull_right, brain, brainstem
 * License: CC0 (generated procedurally)
 *
 * The shapes are anatomically-inspired approximations suitable for
 * development/testing. Replace with a real scan-based model for production.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// GLTFExporter needs a DOM-like environment; we'll use a minimal shim
// Three.js GLTFExporter uses TextEncoder and Blob concepts
// We'll serialize manually via the low-level GLTF JSON approach instead.

/**
 * Creates a GLTF 2.0 binary (GLB) buffer from a set of meshes described
 * as { name, positions, indices, color } objects.
 */
function buildGLB(meshDefs) {
  // --- Build GLTF JSON ---
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];
  const binaryChunks = []; // ArrayBuffers

  let byteOffset = 0;

  function addBufferView(data, target) {
    const view = {
      buffer: 0,
      byteOffset,
      byteLength: data.byteLength,
    };
    if (target !== undefined) view.target = target;
    bufferViews.push(view);
    binaryChunks.push(data);
    byteOffset += data.byteLength;
    // Pad to 4-byte alignment
    const pad = (4 - (data.byteLength % 4)) % 4;
    if (pad > 0) {
      const padding = new Uint8Array(pad);
      binaryChunks.push(padding.buffer);
      byteOffset += pad;
    }
    return bufferViews.length - 1;
  }

  function addAccessor(bufferViewIdx, componentType, type, count, min, max) {
    const accessor = {
      bufferView: bufferViewIdx,
      componentType,
      type,
      count,
    };
    if (min !== undefined) accessor.min = min;
    if (max !== undefined) accessor.max = max;
    accessors.push(accessor);
    return accessors.length - 1;
  }

  for (const mesh of meshDefs) {
    const { name, positions, indices, color } = mesh;

    // Positions: Float32Array of [x,y,z, x,y,z, ...]
    const posData = new Float32Array(positions);
    const posView = addBufferView(posData.buffer, 34962); // ARRAY_BUFFER

    // Compute min/max for accessor
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < posData.length; i += 3) {
      if (posData[i] < minX) minX = posData[i];
      if (posData[i+1] < minY) minY = posData[i+1];
      if (posData[i+2] < minZ) minZ = posData[i+2];
      if (posData[i] > maxX) maxX = posData[i];
      if (posData[i+1] > maxY) maxY = posData[i+1];
      if (posData[i+2] > maxZ) maxZ = posData[i+2];
    }

    const posAccessor = addAccessor(
      posView, 5126 /* FLOAT */, 'VEC3', posData.length / 3,
      [minX, minY, minZ], [maxX, maxY, maxZ]
    );

    // Indices: Uint16Array or Uint32Array
    const useU32 = indices.some(i => i > 65535);
    const indData = useU32 ? new Uint32Array(indices) : new Uint16Array(indices);
    const indView = addBufferView(indData.buffer, 34963); // ELEMENT_ARRAY_BUFFER
    const indAccessor = addAccessor(
      indView, useU32 ? 5125 : 5123 /* UNSIGNED_INT / UNSIGNED_SHORT */,
      'SCALAR', indices.length
    );

    // Material with a flat color
    const materialIdx = meshes.length; // use mesh index as material index placeholder
    meshes.push({
      name,
      primitives: [{
        attributes: { POSITION: posAccessor },
        indices: indAccessor,
        material: materialIdx,
      }],
    });

    nodes.push({ mesh: meshes.length - 1, name });
  }

  // Build materials (one per mesh)
  const materials = meshDefs.map(m => ({
    name: m.name + '_mat',
    pbrMetallicRoughness: {
      baseColorFactor: m.color,
      metallicFactor: 0.0,
      roughnessFactor: 0.8,
    },
  }));

  // Total binary buffer size
  let totalBinary = 0;
  for (const chunk of binaryChunks) {
    totalBinary += chunk instanceof ArrayBuffer ? chunk.byteLength : chunk.buffer.byteLength;
  }

  const gltfJson = {
    asset: { version: '2.0', generator: 'MedApp GLB Generator (CC0)' },
    scene: 0,
    scenes: [{ name: 'skull_brain', nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: totalBinary }],
  };

  const jsonStr = JSON.stringify(gltfJson);
  const jsonBytes = Buffer.from(jsonStr, 'utf8');
  // Pad JSON to 4-byte boundary with spaces
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  const jsonPadded = Buffer.concat([jsonBytes, Buffer.alloc(jsonPad, 0x20)]); // space padding

  // Combine binary chunks
  const binBuffers = binaryChunks.map(c =>
    c instanceof ArrayBuffer ? Buffer.from(c) : Buffer.from(c.buffer)
  );
  const binBuffer = Buffer.concat(binBuffers);

  // GLB header: magic(4) + version(4) + length(4) = 12 bytes
  // JSON chunk: length(4) + type(4) + data
  // BIN chunk:  length(4) + type(4) + data
  const totalLength = 12 + 8 + jsonPadded.length + 8 + binBuffer.length;

  const glb = Buffer.alloc(totalLength);
  let offset = 0;

  // Header
  glb.writeUInt32LE(0x46546C67, offset); offset += 4; // magic: 'glTF'
  glb.writeUInt32LE(2, offset); offset += 4;           // version: 2
  glb.writeUInt32LE(totalLength, offset); offset += 4; // total length

  // JSON chunk
  glb.writeUInt32LE(jsonPadded.length, offset); offset += 4;
  glb.writeUInt32LE(0x4E4F534A, offset); offset += 4; // type: 'JSON'
  jsonPadded.copy(glb, offset); offset += jsonPadded.length;

  // BIN chunk
  glb.writeUInt32LE(binBuffer.length, offset); offset += 4;
  glb.writeUInt32LE(0x004E4942, offset); offset += 4; // type: 'BIN\0'
  binBuffer.copy(glb, offset); offset += binBuffer.length;

  return glb;
}

// ---------------------------------------------------------------------------
// Geometry generators
// ---------------------------------------------------------------------------

/**
 * Generates a half-ellipsoid (cranium approximation).
 * segments: latitude/longitude subdivisions
 * scaleX, scaleY, scaleZ: radii
 * Returns { positions: number[], indices: number[] }
 */
function halfEllipsoid(scaleX, scaleY, scaleZ, latSegs = 12, lonSegs = 16, flip = false) {
  const positions = [];
  const indices = [];

  // Only upper hemisphere (theta: 0..PI/2) for skull top
  // Full sphere for brain
  for (let lat = 0; lat <= latSegs; lat++) {
    const theta = (Math.PI / 2) * (lat / latSegs); // 0..PI/2
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonSegs; lon++) {
      const phi = (2 * Math.PI) * (lon / lonSegs) * (flip ? -1 : 1);
      const x = scaleX * sinTheta * Math.cos(phi);
      const y = scaleY * cosTheta;
      const z = scaleZ * sinTheta * Math.sin(phi);
      positions.push(x, y, z);
    }
  }

  for (let lat = 0; lat < latSegs; lat++) {
    for (let lon = 0; lon < lonSegs; lon++) {
      const a = lat * (lonSegs + 1) + lon;
      const b = a + lonSegs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return { positions, indices };
}

/**
 * Full sphere for brain mesh.
 */
function sphere(scaleX, scaleY, scaleZ, latSegs = 14, lonSegs = 18, offsetY = 0) {
  const positions = [];
  const indices = [];

  for (let lat = 0; lat <= latSegs; lat++) {
    const theta = Math.PI * (lat / latSegs); // 0..PI
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonSegs; lon++) {
      const phi = 2 * Math.PI * (lon / lonSegs);
      const x = scaleX * sinTheta * Math.cos(phi);
      const y = scaleY * cosTheta + offsetY;
      const z = scaleZ * sinTheta * Math.sin(phi);
      positions.push(x, y, z);
    }
  }

  for (let lat = 0; lat < latSegs; lat++) {
    for (let lon = 0; lon < lonSegs; lon++) {
      const a = lat * (lonSegs + 1) + lon;
      const b = a + lonSegs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return { positions, indices };
}

/**
 * Cylinder for brainstem.
 */
function cylinder(radiusTop, radiusBottom, height, segs = 16, offsetY = 0) {
  const positions = [];
  const indices = [];

  // Top circle
  for (let i = 0; i <= segs; i++) {
    const phi = 2 * Math.PI * (i / segs);
    positions.push(radiusTop * Math.cos(phi), height / 2 + offsetY, radiusTop * Math.sin(phi));
  }
  // Bottom circle
  for (let i = 0; i <= segs; i++) {
    const phi = 2 * Math.PI * (i / segs);
    positions.push(radiusBottom * Math.cos(phi), -height / 2 + offsetY, radiusBottom * Math.sin(phi));
  }

  const n = segs + 1;
  for (let i = 0; i < segs; i++) {
    const a = i, b = i + n;
    indices.push(a, b, a + 1);
    indices.push(b, b + 1, a + 1);
  }
  // Top cap
  const topCenter = positions.length / 3;
  positions.push(0, height / 2 + offsetY, 0);
  for (let i = 0; i < segs; i++) {
    indices.push(topCenter, i + 1, i);
  }
  // Bottom cap
  const botCenter = positions.length / 3;
  positions.push(0, -height / 2 + offsetY, 0);
  for (let i = 0; i < segs; i++) {
    indices.push(botCenter, i + n, i + n + 1);
  }

  return { positions, indices };
}

/**
 * Translate all positions by (dx, dy, dz).
 */
function translate(geo, dx, dy, dz) {
  for (let i = 0; i < geo.positions.length; i += 3) {
    geo.positions[i] += dx;
    geo.positions[i + 1] += dy;
    geo.positions[i + 2] += dz;
  }
  return geo;
}

/**
 * Scale all positions by (sx, sy, sz).
 */
function scale(geo, sx, sy, sz) {
  for (let i = 0; i < geo.positions.length; i += 3) {
    geo.positions[i] *= sx;
    geo.positions[i + 1] *= sy;
    geo.positions[i + 2] *= sz;
  }
  return geo;
}

// ---------------------------------------------------------------------------
// Build the meshes
// ---------------------------------------------------------------------------

// Skull dimensions (human skull ~20cm wide, 17cm deep, 14cm tall)
// We'll work in meters: skull ~0.20 x 0.17 x 0.14 m

// skull_left: left half of cranium (x < 0 side)
const skullLeft = halfEllipsoid(0.10, 0.14, 0.085, 14, 18, false);
// Shift slightly left
translate(skullLeft, -0.005, 0.10, 0.0);

// skull_right: right half of cranium (mirrored)
const skullRight = halfEllipsoid(0.10, 0.14, 0.085, 14, 18, true);
translate(skullRight, 0.005, 0.10, 0.0);

// brain: slightly smaller ellipsoid inside skull
const brainMesh = sphere(0.085, 0.11, 0.075, 16, 20, 0.10);

// brainstem: narrow cylinder below brain
const brainstemMesh = cylinder(0.020, 0.015, 0.06, 14, 0.03);

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const outputPath = resolve(__dirname, '../public/models/glowa.glb');

const glb = buildGLB([
  {
    name: 'skull_left',
    ...skullLeft,
    color: [0.92, 0.88, 0.78, 1.0], // ivory/bone color
  },
  {
    name: 'skull_right',
    ...skullRight,
    color: [0.92, 0.88, 0.78, 1.0],
  },
  {
    name: 'brain',
    ...brainMesh,
    color: [0.85, 0.55, 0.55, 1.0], // pinkish-gray
  },
  {
    name: 'brainstem',
    ...brainstemMesh,
    color: [0.75, 0.50, 0.50, 1.0], // slightly darker
  },
]);

mkdirSync(resolve(__dirname, '../public/models'), { recursive: true });
writeFileSync(outputPath, glb);
console.log(`Written: ${outputPath} (${(glb.length / 1024).toFixed(1)} KB)`);
console.log('Mesh names: skull_left, skull_right, brain, brainstem');
console.log('License: CC0 (procedurally generated placeholder)');
