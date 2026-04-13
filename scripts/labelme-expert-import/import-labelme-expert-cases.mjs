#!/usr/bin/env node
/**
 * BoneVisQA — LabelMe → Supabase + Expert case API, with Gemini clinical copy.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_KEY (service role recommended)
 *   EXPERT_JWT_TOKEN, API_BASE_URL, DATASET_FOLDER_PATH
 *   GEMINI_API_KEY — realistic Vietnamese clinical text via PRIORITY_MODELS (2026 IDs).
 *     404 = model ID not valid for this key/region/API version → try next.
 *     429 = quota / rate limit → try next. Placeholder fallback only if every model fails.
 *     ~4s delay between LabelMe files respects ~15 RPM on Flash-Lite tiers.
 *   IMPORT_REPORT_PATH — optional; default: ./import-report.json next to this script
 *
 * npm install
 * node import-labelme-expert-cases.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// Config (env overrides)
// ═══════════════════════════════════════════════════════════════════════════
const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'YOUR_SUPABASE_KEY';
const EXPERT_JWT_TOKEN = process.env.EXPERT_JWT_TOKEN ?? 'YOUR_EXPERT_JWT_TOKEN';
const API_BASE_URL = (process.env.API_BASE_URL ?? 'http://localhost:5046').replace(/\/$/, '');
const DATASET_FOLDER_PATH = process.env.DATASET_FOLDER_PATH ?? '/path/to/your/dataset';
/** Google AI Studio / Gemini API key — `export GEMINI_API_KEY=...` before running. */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
/** 2026 API model IDs, tried in order until one succeeds (404 = ID not enabled; 429 = quota). */
const PRIORITY_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
];

const IMPORT_REPORT_PATH =
  process.env.IMPORT_REPORT_PATH ?? path.join(__dirname, 'import-report.json');

const BUCKET = 'medical-cases';
const UPLOAD_PREFIX = 'expert-workbench';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Map Google Generative AI SDK / REST errors to 404 or 429 when possible so we can
 * log clearly and advance to the next PRIORITY_MODELS entry.
 */
function geminiHttpStatus(err) {
  if (err == null) return undefined;

  const fromObject = (e) => {
    if (e == null) return undefined;
    const s = e.status ?? e.statusCode ?? e.response?.status;
    if (typeof s === 'number' && s >= 400) return s;
    const code = e.error?.code ?? e.error?.status;
    if (code === 404 || code === 'NOT_FOUND') return 404;
    if (code === 429 || code === 'RESOURCE_EXHAUSTED') return 429;
    return undefined;
  };

  let st = fromObject(err);
  if (st != null) return st;
  st = fromObject(err.cause);
  if (st != null) return st;

  const msg = String(err.message ?? err);
  const bracket = /\[GoogleGenerativeAI Error\]:\s*(\d{3})/i.exec(msg);
  if (bracket) return Number(bracket[1]);
  if (/RESOURCE_EXHAUSTED|quota exceeded|rate limit|too many requests|limit:\s*0|\b429\b/i.test(msg)) {
    return 429;
  }
  if (
    /\b404\b|NOT_FOUND|not found|is not found for API version|model[\s\w.-]* (is )?not found/i.test(
      msg,
    )
  ) {
    return 404;
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════
// LabelMe → normalized bbox string
// ═══════════════════════════════════════════════════════════════════════════

function toNormalizedBoxString(w, h, xMin, yMin, xMax, yMax) {
  if (!w || !h) {
    throw new Error(`Invalid image dimensions: width=${w}, height=${h}`);
  }
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const box = {
    x: clamp(xMin / w),
    y: clamp(yMin / h),
    width: clamp((xMax - xMin) / w),
    height: clamp((yMax - yMin) / h),
  };
  return JSON.stringify(box);
}

function shapeToAnnotation(shape, imageWidth, imageHeight) {
  if (!shape || typeof shape !== 'object') return null;
  const label = String(shape.label ?? 'object').trim() || 'object';
  const shapeType = String(shape.shape_type ?? '').toLowerCase();
  const points = shape.points;
  if (!Array.isArray(points) || points.length === 0) {
    console.warn(`  [skip] shape "${label}" has no points`);
    return null;
  }

  let xMin;
  let yMin;
  let xMax;
  let yMax;

  if (shapeType === 'rectangle') {
    if (points.length < 2) return null;
    const p0 = points[0];
    const p1 = points[1];
    if (!Array.isArray(p0) || !Array.isArray(p1) || p0.length < 2 || p1.length < 2) return null;
    const x0 = Number(p0[0]);
    const y0 = Number(p0[1]);
    const x1 = Number(p1[0]);
    const y1 = Number(p1[1]);
    if (
      !Number.isFinite(x0) ||
      !Number.isFinite(y0) ||
      !Number.isFinite(x1) ||
      !Number.isFinite(y1)
    ) {
      return null;
    }
    xMin = Math.min(x0, x1);
    yMin = Math.min(y0, y1);
    xMax = Math.max(x0, x1);
    yMax = Math.max(y0, y1);
  } else if (shapeType === 'polygon') {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const pt of points) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const px = Number(pt[0]);
      const py = Number(pt[1]);
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
    if (!Number.isFinite(minX)) return null;
    xMin = minX;
    yMin = minY;
    xMax = maxX;
    yMax = maxY;
  } else {
    console.warn(`  [skip] unsupported shape_type "${shape.shape_type}"`);
    return null;
  }

  if (xMax <= xMin || yMax <= yMin) return null;
  const coordinates = toNormalizedBoxString(imageWidth, imageHeight, xMin, yMin, xMax, yMax);
  return { label, coordinates };
}

function parseLabelMeFile(jsonPath) {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  const imageWidth = Number(data.imageWidth);
  const imageHeight = Number(data.imageHeight);
  const shapes = Array.isArray(data.shapes) ? data.shapes : [];
  const imagePathField = typeof data.imagePath === 'string' ? data.imagePath : null;
  return { imageWidth, imageHeight, shapes, imagePathField };
}

function uniqueShapeLabels(shapes) {
  const set = new Set();
  for (const s of shapes) {
    if (s && typeof s === 'object' && s.label != null) {
      const t = String(s.label).trim();
      if (t) set.add(t);
    }
  }
  return [...set];
}

function resolveImageFile(jsonPath, imagePathField) {
  const dir = path.dirname(jsonPath);
  const candidates = [];
  if (imagePathField) {
    candidates.push(path.join(dir, path.basename(imagePathField)));
    candidates.push(path.resolve(dir, imagePathField));
  }
  const stem = path.basename(jsonPath, path.extname(jsonPath));
  for (const ext of ['.jpeg', '.jpg', '.JPEG', '.JPG']) {
    candidates.push(path.join(dir, stem + ext));
  }
  const seen = new Set();
  for (const p of candidates) {
    const norm = path.normalize(p);
    if (seen.has(norm)) continue;
    seen.add(norm);
    if (fs.existsSync(norm) && fs.statSync(norm).isFile()) return norm;
  }
  return null;
}

function sanitizeRemoteFilename(name) {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'image';
}

// ═══════════════════════════════════════════════════════════════════════════
// Gemini — clinical JSON (no reflectiveQuestions)
// DB: CHECK (difficulty = ANY (ARRAY['Easy','Medium','Hard'])) — case-sensitive
// ═══════════════════════════════════════════════════════════════════════════

const DB_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function sanitizeDifficulty(aiDiff) {
  if (!aiDiff) return 'Medium';
  let raw = String(aiDiff).trim().toLowerCase();
  let formatted = raw.charAt(0).toUpperCase() + raw.slice(1);

  if (formatted === 'Basic') return 'Easy';
  if (formatted === 'Intermediate') return 'Medium';
  if (formatted === 'Advanced') return 'Hard';

  return DB_DIFFICULTIES.includes(formatted) ? formatted : 'Medium';
}

function stripJsonFence(text) {
  let t = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) t = fence[1].trim();
  return t;
}

function fallbackClinicalFromLabels(uniqueLabels, filename) {
  const joined = uniqueLabels.length ? uniqueLabels.join(', ') : 'vùng quan tâm';
  return {
    title: `[Case nhập liệu] ${joined}`,
    description: `Case được nhập tự động từ bộ dữ liệu LabelMe. Tệp: ${filename}`,
    difficulty: 'Medium',
    suggestedDiagnosis: joined,
    keyFindings: `Các vùng được gán nhãn: ${joined}`,
  };
}

/**
 * @param {string} imagePath
 * @param {string} labelForPrompt — comma-separated unique labels
 */
async function generateClinicalWithGemini(imagePath, labelForPrompt) {
  if (!GEMINI_API_KEY) {
    return null;
  }

  const buf = fs.readFileSync(imagePath);
  const base64 = buf.toString('base64');
  const mimeType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const labelQuoted = JSON.stringify(labelForPrompt);
  const prompt =
    'You are an orthopedic expert creating a medical case study for students based on this X-ray. ' +
    `The image has an annotation labeled: ${labelQuoted}. ` +
    'Generate a realistic clinical JSON object in Vietnamese. DO NOT use markdown, return ONLY raw JSON matching this schema: ' +
    '{"title": "A concise clinical title (Vietnamese)", "description": "A realistic patient clinical vignette (symptoms, history in Vietnamese)", ' +
    '"difficulty": "Easy" | "Medium" | "Hard", "suggestedDiagnosis": "The exact medical diagnosis (Vietnamese/Medical terms)", ' +
    '"keyFindings": "Key imaging findings observable on the X-ray (Vietnamese)"} ' +
    'The difficulty value MUST be exactly one of these three capitalized English words: Easy, Medium, or Hard.';

  const imagePart = { inlineData: { data: base64, mimeType } };

  let lastErrorMsg = '';
  for (const modelId of PRIORITY_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response?.text?.() ?? '';
      const cleaned = stripJsonFence(text);
      const parsed = JSON.parse(cleaned);

      const difficulty = sanitizeDifficulty(parsed.difficulty);

      return {
        title: String(parsed.title ?? '').trim() || undefined,
        description: String(parsed.description ?? '').trim() || undefined,
        difficulty,
        suggestedDiagnosis: String(parsed.suggestedDiagnosis ?? '').trim() || undefined,
        keyFindings: String(parsed.keyFindings ?? '').trim() || undefined,
      };
    } catch (ge) {
      lastErrorMsg = ge?.message ?? String(ge);
      const st = geminiHttpStatus(ge);
      if (st === 404) {
        console.warn(
          `  [Gemini ${modelId}] 404 Not Found — this model ID is not available for your API key, region, or API version. Trying the next model in PRIORITY_MODELS.`,
        );
      } else if (st === 429) {
        console.warn(
          `  [Gemini ${modelId}] 429 Too Many Requests — quota or rate limit exceeded. Trying the next model in PRIORITY_MODELS.`,
        );
      } else {
        console.warn(
          `  [Gemini ${modelId}] request failed (${lastErrorMsg}). Trying the next model in PRIORITY_MODELS.`,
        );
      }
    }
  }

  throw new Error(
    `All ${PRIORITY_MODELS.length} Gemini model(s) in PRIORITY_MODELS failed — using local placeholder clinical text. Last error: ${lastErrorMsg}`,
  );
}

function mergeClinical(aiPartial, uniqueLabels, filename) {
  const fb = fallbackClinicalFromLabels(uniqueLabels, filename);
  return {
    title: aiPartial?.title || fb.title,
    description: aiPartial?.description || fb.description,
    difficulty: sanitizeDifficulty(aiPartial?.difficulty ?? fb.difficulty),
    suggestedDiagnosis: aiPartial?.suggestedDiagnosis || fb.suggestedDiagnosis,
    keyFindings: aiPartial?.keyFindings || fb.keyFindings,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Supabase + API
// ═══════════════════════════════════════════════════════════════════════════

async function uploadImage(supabase, localPath, remoteName) {
  const buf = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage.from(BUCKET).upload(remoteName, buf, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(data?.path ?? remoteName);
  if (!pub?.publicUrl) throw new Error('Could not resolve public URL after upload');
  return pub.publicUrl;
}

async function createExpertCase(token, payload) {
  const url = `${API_BASE_URL}/api/expert/cases`;
  return axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  if (!fs.existsSync(DATASET_FOLDER_PATH) || !fs.statSync(DATASET_FOLDER_PATH).isDirectory()) {
    console.error(`DATASET_FOLDER_PATH is not a directory: ${DATASET_FOLDER_PATH}`);
    process.exit(1);
  }

  if (
    SUPABASE_URL.includes('YOUR_PROJECT') ||
    SUPABASE_KEY.startsWith('YOUR_') ||
    EXPERT_JWT_TOKEN.startsWith('YOUR_')
  ) {
    console.warn(
      'Warning: Set SUPABASE_URL, SUPABASE_KEY, EXPERT_JWT_TOKEN in the environment.\n',
    );
  }
  if (!GEMINI_API_KEY) {
    console.warn(
      'GEMINI_API_KEY not set — using Vietnamese placeholder fallback (not Gemini-generated).\n',
    );
  } else {
    console.log(`Gemini: trying models in order → ${PRIORITY_MODELS.join(' → ')}\n`);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const jsonFiles = fs
    .readdirSync(DATASET_FOLDER_PATH)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .map((f) => path.join(DATASET_FOLDER_PATH, f))
    .sort();

  /** @type {Array<Record<string, unknown>>} */
  const importResults = [];

  if (jsonFiles.length === 0) {
    console.log(`No .json files in ${DATASET_FOLDER_PATH}`);
    fs.writeFileSync(IMPORT_REPORT_PATH, JSON.stringify({ finishedAt: new Date().toISOString(), importResults }, null, 2), 'utf8');
    console.log(`Wrote ${IMPORT_REPORT_PATH}`);
    return;
  }

  console.log(`Found ${jsonFiles.length} LabelMe JSON file(s). API: ${API_BASE_URL}\n`);

  let ok = 0;
  let fail = 0;

  for (let fileIdx = 0; fileIdx < jsonFiles.length; fileIdx++) {
    const jsonPath = jsonFiles[fileIdx];
    const jsonBasename = path.basename(jsonPath);
    const filename = jsonBasename;
    /** @type {Record<string, unknown>} */
    const row = {
      jsonFile: jsonPath,
      imageFile: null,
      success: false,
      httpStatus: null,
      caseId: null,
      error: null,
      requestPayload: null,
      responseBody: null,
      geminiUsed: false,
      geminiError: null,
    };

    console.log(`— ${jsonBasename}`);

    try {
      const { imageWidth, imageHeight, shapes, imagePathField } = parseLabelMeFile(jsonPath);
      const imageFile = resolveImageFile(jsonPath, imagePathField);
      row.imageFile = imageFile;

      if (!imageFile) {
        throw new Error(
          `No matching image (imagePath: ${imagePathField ?? 'none'})`,
        );
      }

      const uniqueLabels = uniqueShapeLabels(shapes);
      const labelPrompt = uniqueLabels.length ? uniqueLabels.join(', ') : path.basename(imageFile, path.extname(imageFile));

      const annotations = [];
      for (const shape of shapes) {
        const ann = shapeToAnnotation(shape, imageWidth, imageHeight);
        if (ann) annotations.push(ann);
      }

      let aiPartial = null;
      if (GEMINI_API_KEY) {
        try {
          console.log(`  Gemini (priority fallback chain) …`);
          aiPartial = await generateClinicalWithGemini(imageFile, labelPrompt);
          row.geminiUsed = true;
        } catch (ge) {
          row.geminiError = ge?.message ?? String(ge);
          console.warn(
            `  Gemini: every model in PRIORITY_MODELS failed — ${row.geminiError} — using local placeholder text only.`,
          );
        }
      }

      const clinical = mergeClinical(aiPartial, uniqueLabels, filename);

      const imageBaseName = sanitizeRemoteFilename(path.basename(imageFile));
      const remoteKey = `${UPLOAD_PREFIX}/seed-${Date.now()}-${imageBaseName}`;
      console.log(`  Uploading → ${BUCKET}/${remoteKey}`);
      const imageUrl = await uploadImage(supabase, imageFile, remoteKey);
      console.log(`  Public URL: ${imageUrl}`);

      /** CreateExpertMedicalCaseJsonRequest — do not send reflectiveQuestions */
      const payload = {
        title: clinical.title,
        description: clinical.description,
        difficulty: sanitizeDifficulty(clinical.difficulty),
        categoryId: null,
        suggestedDiagnosis: clinical.suggestedDiagnosis,
        keyFindings: clinical.keyFindings,
        tagIds: [],
        medicalImages: [
          {
            imageUrl,
            modality: 'X-Ray',
            annotations,
          },
        ],
      };

      row.requestPayload = payload;

      console.log(`  POST /api/expert/cases (${annotations.length} annotation(s))`);
      const res = await createExpertCase(EXPERT_JWT_TOKEN, payload);
      row.httpStatus = res.status;
      row.responseBody = res.data;

      if (res.status >= 200 && res.status < 300) {
        row.success = true;
        row.caseId =
          res.data?.caseId ??
          res.data?.CaseId ??
          res.data?.result?.id ??
          res.data?.result?.Id ??
          null;
        console.log(`  OK HTTP ${res.status} caseId=${row.caseId ?? '?'}`);
        ok += 1;
      } else {
        throw new Error(
          `HTTP ${res.status}: ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`,
        );
      }
    } catch (err) {
      fail += 1;
      row.success = false;
      if (axios.isAxiosError(err) && err.response) {
        row.httpStatus = err.response.status;
        row.responseBody = err.response.data;
        row.error = `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`;
      } else {
        row.error = err?.message ?? String(err);
      }
      console.error(`  ERROR: ${row.error}`);
    }

    importResults.push(row);
    console.log('');

    // Strict 4s gap between files (~15 RPM ceiling for Flash-Lite–class limits).
    if (fileIdx < jsonFiles.length - 1) {
      await delay(4000);
    }
  }

  const report = {
    finishedAt: new Date().toISOString(),
    summary: { success: ok, failed: fail, total: jsonFiles.length },
    apiBaseUrl: API_BASE_URL,
    importResults,
  };

  fs.writeFileSync(IMPORT_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Done. Success: ${ok}, failed: ${fail}`);
  console.log(`Full report: ${IMPORT_REPORT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
