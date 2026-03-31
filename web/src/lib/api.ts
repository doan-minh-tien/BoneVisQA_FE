const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bonevisqa.onrender.com';

interface LoginResponse {
  success: boolean;
  message: string;
  userId: string;
  fullName: string;
  email: string;
  token: string;
  roles: string[];
}

// --- Classes ---

export interface ClassItem {
  id: string;
  className: string;
  semester: string;
  lecturerId: string;
  createdAt: string;
}

export async function createClass(
  body: { className: string; semester: string; lecturerId: string },
  token: string,
): Promise<ClassItem> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function getLecturerClasses(lecturerId: string, token: string): Promise<ClassItem[]> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes?lecturerId=${lecturerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

// --- Students ---

export interface StudentEnrollment {
  enrollmentId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  studentCode: string | null;
  className: string | null;
  enrolledAt: string | null;
}

export async function getClassStudents(classId: string, token: string): Promise<StudentEnrollment[]> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function getAvailableStudents(classId: string, token: string): Promise<StudentEnrollment[]> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/students/available`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function enrollStudent(classId: string, studentId: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ studentId }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

export async function removeStudent(classId: string, studentId: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/students/${studentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}

// --- Lecturer Cases ---

export interface CaseDto {
  id: string;
  title: string | null;
  description: string | null;
  difficulty: string | null;
  categoryName: string | null;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string | null;
}

export async function getLecturerCases(token: string): Promise<CaseDto[]> {
  const res = await fetch(`${API_URL}/api/Lecturers/cases`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function assignCasesToClass(
  classId: string,
  caseIds: string[],
  token: string,
): Promise<CaseDto[]> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ caseIds }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204) return [];
  return res.json();
}

export async function approveCase(
  caseId: string,
  isApproved: boolean,
  token: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/Lecturers/cases/${caseId}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isApproved }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// --- Announcements ---

export interface Announcement {
  id: string;
  classId: string;
  className: string;
  title: string;
  content: string;
  createdAt: string;
}

export async function getClassAnnouncements(classId: string, token: string): Promise<Announcement[]> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/announcements`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function createAnnouncement(
  classId: string,
  body: { title: string; content: string },
  token: string,
): Promise<Announcement> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return { id: '', classId, className: '', title: body.title, content: body.content, createdAt: new Date().toISOString() };
  }

  return res.json();
}

// --- Class Stats ---

export interface ClassStats {
  classId: string;
  totalStudents: number;
  totalCasesViewed: number;
  totalQuestionsAsked: number;
  avgQuizScore: number | null;
}

export async function getClassStats(classId: string, token: string): Promise<ClassStats> {
  const res = await fetch(`${API_URL}/api/Lecturers/classes/${classId}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

// --- Auth ---

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/Auths/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
  fullName: string;
  email: string;
  token: string | null;
  roles: string[] | null;
}

export async function register(data: {
  fullName: string;
  email: string;
  password: string;
  schoolCohort: string;
}): Promise<RegisterResponse> {
  const res = await fetch(`${API_URL}/api/Auths/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const bodyData = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(bodyData?.message || `HTTP ${res.status}`);
  }

  return bodyData;
}

export async function assignAdminRole(id: string, role: string, token: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/Admin/${id}/assign-role?role=${encodeURIComponent(role)}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    }
  });

  const responseText = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${responseText || "Unknown Error"}`);
  try { return responseText ? JSON.parse(responseText) : { success: true }; } catch (e) { return { success: true, message: responseText }; }
}

export async function revokeAdminRole(id: string, token: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/Admin/${id}/revoke-role`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    }
  });

  const responseText = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${responseText || "Unknown Error"}`);
  try { return responseText ? JSON.parse(responseText) : { success: true }; } catch (e) { return { success: true, message: responseText }; }
}

// --- Admin ---

export async function getAdminUsersByRole(role: string, token: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/Admin/role/${role}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let errText = "Unknown";
    try { errText = await res.text(); } catch (e) {}
    throw new Error(`HTTP ${res.status} - ${errText}`);
  }

  return res.json();
}

export interface DocumentDto {
  id: string;
  title: string;
  filePath: string;
  categoryId: string | null;
  indexingStatus: string;
  version: number;
  isOutdated: boolean;
  createdAt: string;
}

export async function getAdminDocuments(token: string): Promise<DocumentDto[]> {
  const res = await fetch(`${API_URL}/api/Admin/document`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let errText = "Unknown";
    try { errText = await res.text(); } catch (e) {}
    throw new Error(`HTTP ${res.status} - ${errText}`);
  }

  return res.json();
}

export async function getAdminDocumentById(id: string, token: string): Promise<DocumentDto> {
  const res = await fetch(`${API_URL}/api/Admin/document/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let errText = "Unknown";
    try { errText = await res.text(); } catch (e) {}
    throw new Error(`HTTP ${res.status} - ${errText}`);
  }

  return res.json();
}

export async function uploadAdminDocument(formData: FormData, token: string): Promise<DocumentDto> {
  const res = await fetch(`${API_URL}/api/Admin/document-upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    let errText = "Unknown error";
    try { errText = await res.text(); } catch (e) {}
    throw new Error(`Upload failed (${res.status}): ${errText}`);
  }

  return res.json();
}

export async function reindexAdminDocument(id: string, token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/Admin/document/${id}/reindex`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let errText = "Unknown error";
    try { errText = await res.text(); } catch (e) {}
    throw new Error(`Reindex failed (${res.status}): ${errText}`);
  }

  return res.json();
}
