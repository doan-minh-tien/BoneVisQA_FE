#!/usr/bin/env node
import axios from 'axios';
import fs from 'fs';
import path from 'path';

function must(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return String(v).trim();
}

function optional(name, fallback = '') {
  const v = process.env[name];
  return v == null ? fallback : String(v).trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeKey(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isCompletedStatus(v) {
  const key = normalizeKey(v);
  return key === 'completed' || key === 'done' || key === 'success';
}

function getHeaderToken(token) {
  return token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`;
}

function createClient(baseURL, token) {
  return axios.create({
    baseURL,
    headers: {
      Authorization: getHeaderToken(token),
    },
    timeout: 20000,
    validateStatus: () => true,
  });
}

function findBySessionOrQuestion(rows, sessionId, questionId) {
  return rows.find((row) => {
    const r = row ?? {};
    const sid = String(r.sessionId ?? r.SessionId ?? '').trim();
    const qid = String(r.questionId ?? r.QuestionId ?? r.id ?? r.Id ?? '').trim();
    return sid === sessionId || qid === questionId;
  });
}

async function waitCompleted(getStatusFn, timeoutMs = 120000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await getStatusFn();
    if (isCompletedStatus(status)) return status;
    await sleep(3000);
  }
  throw new Error('Timed out waiting for completed indexing status.');
}

async function run() {
  const API_BASE_URL = optional('API_BASE_URL', 'http://localhost:5046').replace(/\/$/, '');
  const ADMIN_TOKEN = must('ADMIN_TOKEN');
  const STUDENT_TOKEN = must('STUDENT_TOKEN');
  const LECTURER_TOKEN = must('LECTURER_TOKEN');
  const EXPERT_TOKEN = must('EXPERT_TOKEN');
  const CLASS_ID = must('CLASS_ID');
  const STUDENT_QUESTION_TEXT = optional(
    'STUDENT_QUESTION_TEXT',
    'Vui long danh gia ton thuong tai vung ROI nay.',
  );
  const STUDENT_IMAGE_PATH = must('STUDENT_IMAGE_PATH');
  const STUDENT_ROI_JSON = optional(
    'STUDENT_ROI_JSON',
    JSON.stringify([
      { x: 0.35, y: 0.32 },
      { x: 0.58, y: 0.32 },
      { x: 0.58, y: 0.56 },
      { x: 0.35, y: 0.56 },
    ]),
  );
  const ADMIN_DOCUMENT_ID = optional('ADMIN_DOCUMENT_ID');
  const PROMOTE_DESCRIPTION = optional('PROMOTE_DESCRIPTION', 'Case promoted from expert review');
  const PROMOTE_DIAGNOSIS = optional('PROMOTE_DIAGNOSIS', 'Fracture pattern requires clinical correlation');
  const PROMOTE_KEY_FINDINGS = optional('PROMOTE_KEY_FINDINGS', 'Cortical disruption near ROI');
  const PROMOTE_REFLECTIVE = optional(
    'PROMOTE_REFLECTIVE',
    'What additional projection would increase confidence?',
  );

  const admin = createClient(API_BASE_URL, ADMIN_TOKEN);
  const student = createClient(API_BASE_URL, STUDENT_TOKEN);
  const lecturer = createClient(API_BASE_URL, LECTURER_TOKEN);
  const expert = createClient(API_BASE_URL, EXPERT_TOKEN);

  console.log('== Main Flow Signoff ==');

  if (ADMIN_DOCUMENT_ID) {
    console.log('[A] Verify admin indexing status...');
    const status = await waitCompleted(async () => {
      const res = await admin.get(`/api/admin/documents/${encodeURIComponent(ADMIN_DOCUMENT_ID)}/status`);
      assert(res.status === 200, `Admin status API failed: ${res.status}`);
      return String(res.data?.status ?? res.data?.Status ?? '');
    });
    console.log(`   ✓ Index status: ${status}`);
  } else {
    console.log('[A] Skipped admin status check (ADMIN_DOCUMENT_ID not provided).');
  }

  console.log('[B] Student ask visual question...');
  const form = new FormData();
  form.append('questionText', STUDENT_QUESTION_TEXT);
  form.append('question', STUDENT_QUESTION_TEXT);
  form.append('customPolygon', STUDENT_ROI_JSON);
  form.append(
    'customImage',
    new Blob([fs.readFileSync(path.resolve(STUDENT_IMAGE_PATH))]),
    path.basename(STUDENT_IMAGE_PATH),
  );
  const askRes = await student.post('/api/student/visual-qa/ask', form);
  assert(askRes.status === 200, `Student ask failed: ${askRes.status}`);
  const sessionId = String(
    askRes.data?.sessionId ??
      askRes.data?.SessionId ??
      askRes.data?.result?.sessionId ??
      '',
  ).trim();
  const latestTurn =
    askRes.data?.latestTurn ??
    askRes.data?.LatestTurn ??
    askRes.data?.result?.latestTurn ??
    null;
  const turnId = String(latestTurn?.turnId ?? latestTurn?.TurnId ?? '').trim();
  assert(sessionId, 'Missing sessionId from ask response.');
  assert(turnId, 'Missing latest turnId from ask response.');
  console.log(`   ✓ sessionId=${sessionId}`);
  console.log(`   ✓ turnId=${turnId}`);

  console.log('[B] Verify history restore and request review...');
  const historyRes = await student.get(`/api/student/visual-qa/history/${encodeURIComponent(sessionId)}`);
  assert(historyRes.status === 200, `History fetch failed: ${historyRes.status}`);
  const requestReviewRes = await student.post(
    `/api/student/visual-qa/turns/${encodeURIComponent(turnId)}/request-review`,
    null,
    { params: { sessionId } },
  );
  assert(
    requestReviewRes.status === 200 || requestReviewRes.status === 204,
    `Request review failed: ${requestReviewRes.status}`,
  );
  console.log('   ✓ Review requested.');

  console.log('[C] Lecturer triage selected-pair invariant (with refresh simulation)...');
  const triageRes1 = await lecturer.get('/api/lecturer/triage', { params: { classId: CLASS_ID } });
  assert(triageRes1.status === 200, `Triage list failed: ${triageRes1.status}`);
  const triageRows1 = Array.isArray(triageRes1.data)
    ? triageRes1.data
    : Array.isArray(triageRes1.data?.items)
      ? triageRes1.data.items
      : [];
  const row1 = findBySessionOrQuestion(triageRows1, sessionId, '');
  assert(row1, 'Cannot find requested session in lecturer triage list.');
  const requestedReviewMessageId = String(row1.requestedReviewMessageId ?? row1.RequestedReviewMessageId ?? '').trim();
  const selectedUserMessageId = String(row1.selectedUserMessageId ?? row1.SelectedUserMessageId ?? '').trim();
  const selectedAssistantMessageId = String(
    row1.selectedAssistantMessageId ?? row1.SelectedAssistantMessageId ?? '',
  ).trim();
  assert(requestedReviewMessageId, 'Missing requestedReviewMessageId in triage row.');
  assert(selectedUserMessageId, 'Missing selectedUserMessageId in triage row.');
  assert(selectedAssistantMessageId, 'Missing selectedAssistantMessageId in triage row.');
  assert(
    requestedReviewMessageId === selectedAssistantMessageId,
    'selectedAssistantMessageId must match requestedReviewMessageId.',
  );

  const triageRes2 = await lecturer.get('/api/lecturer/triage', { params: { classId: CLASS_ID } });
  assert(triageRes2.status === 200, `Triage refresh failed: ${triageRes2.status}`);
  const triageRows2 = Array.isArray(triageRes2.data)
    ? triageRes2.data
    : Array.isArray(triageRes2.data?.items)
      ? triageRes2.data.items
      : [];
  const row2 = findBySessionOrQuestion(triageRows2, sessionId, '');
  assert(row2, 'Cannot re-find requested session in triage list after refresh.');
  assert(
    String(row2.requestedReviewMessageId ?? row2.RequestedReviewMessageId ?? '').trim() === requestedReviewMessageId,
    'requestedReviewMessageId drifted after refresh.',
  );
  assert(
    String(row2.selectedAssistantMessageId ?? row2.SelectedAssistantMessageId ?? '').trim() ===
      selectedAssistantMessageId,
    'selectedAssistantMessageId drifted after refresh.',
  );
  assert(
    String(row2.selectedUserMessageId ?? row2.SelectedUserMessageId ?? '').trim() === selectedUserMessageId,
    'selectedUserMessageId drifted after refresh.',
  );
  console.log('   ✓ Selected-pair invariant stable after refresh.');

  const questionId = String(row1.questionId ?? row1.QuestionId ?? row1.id ?? row1.Id ?? '').trim();
  const answerText = String(row1.answerText ?? row1.AnswerText ?? 'Escalate for expert review').trim();
  assert(questionId, 'Missing questionId for lecturer respond.');
  const lecturerRespond = await lecturer.put(
    `/api/lecturer/classes/${encodeURIComponent(CLASS_ID)}/questions/${encodeURIComponent(questionId)}/respond`,
    {
      answerText,
      decision: 'approve_and_escalate',
    },
  );
  assert(lecturerRespond.status === 200, `Lecturer approve_and_escalate failed: ${lecturerRespond.status}`);
  console.log('   ✓ Lecturer decision=approve_and_escalate succeeded.');

  console.log('[D] Expert queue selected-pair invariant + resolve...');
  const expertQueue1 = await expert.get('/api/expert/reviews/escalated');
  assert(expertQueue1.status === 200, `Expert queue failed: ${expertQueue1.status}`);
  const expertRows1 = Array.isArray(expertQueue1.data)
    ? expertQueue1.data
    : Array.isArray(expertQueue1.data?.items)
      ? expertQueue1.data.items
      : [];
  const erow1 = findBySessionOrQuestion(expertRows1, sessionId, questionId);
  assert(erow1, 'Cannot find escalated session in expert queue.');
  const exRequestedId = String(
    erow1.requestedReviewMessageId ?? erow1.RequestedReviewMessageId ?? '',
  ).trim();
  const exSelectedAssistantId = String(
    erow1.selectedAssistantMessageId ?? erow1.SelectedAssistantMessageId ?? '',
  ).trim();
  const exSelectedUserId = String(erow1.selectedUserMessageId ?? erow1.SelectedUserMessageId ?? '').trim();
  assert(exRequestedId && exSelectedAssistantId && exSelectedUserId, 'Expert row missing selected-pair ids.');
  assert(exRequestedId === exSelectedAssistantId, 'Expert selectedAssistantMessageId mismatch.');

  const expertQueue2 = await expert.get('/api/expert/reviews/escalated');
  assert(expertQueue2.status === 200, `Expert queue refresh failed: ${expertQueue2.status}`);
  const expertRows2 = Array.isArray(expertQueue2.data)
    ? expertQueue2.data
    : Array.isArray(expertQueue2.data?.items)
      ? expertQueue2.data.items
      : [];
  const erow2 = findBySessionOrQuestion(expertRows2, sessionId, questionId);
  assert(erow2, 'Cannot re-find escalated session in expert queue after refresh.');
  assert(
    String(erow2.selectedAssistantMessageId ?? erow2.SelectedAssistantMessageId ?? '').trim() === exSelectedAssistantId,
    'Expert selectedAssistantMessageId drifted after refresh.',
  );
  assert(
    String(erow2.selectedUserMessageId ?? erow2.SelectedUserMessageId ?? '').trim() === exSelectedUserId,
    'Expert selectedUserMessageId drifted after refresh.',
  );
  console.log('   ✓ Expert selected-pair invariant stable after refresh.');

  const resolveRes = await expert.post(`/api/expert/reviews/${encodeURIComponent(sessionId)}/resolve`, {
    answerText: `${answerText}\n\n[Expert validated]`,
    reviewNote: 'Resolved by integration signoff script',
  });
  assert(resolveRes.status === 200, `Expert resolve failed: ${resolveRes.status}`);
  console.log('   ✓ Expert resolve succeeded.');

  console.log('[E] Promote to case library...');
  const promoteRes = await expert.post(`/api/expert/reviews/${encodeURIComponent(sessionId)}/promote`, {
    description: PROMOTE_DESCRIPTION,
    suggestedDiagnosis: PROMOTE_DIAGNOSIS,
    keyFindings: PROMOTE_KEY_FINDINGS,
    reflectiveQuestions: PROMOTE_REFLECTIVE,
  });
  assert(promoteRes.status === 200, `Promote failed: ${promoteRes.status}`);
  const promotedCaseId = String(
    promoteRes.data?.caseId ??
      promoteRes.data?.CaseId ??
      promoteRes.data?.promotedCaseId ??
      promoteRes.data?.PromotedCaseId ??
      promoteRes.data?.result?.caseId ??
      '',
  ).trim();
  assert(promotedCaseId, 'Promote success but caseId is missing.');
  console.log(`   ✓ Promoted caseId=${promotedCaseId}`);

  console.log('== PASS: Main flow signoff completed ==');
}

run().catch((error) => {
  console.error(`== FAIL: ${error instanceof Error ? error.message : String(error)} ==`);
  process.exit(1);
});

