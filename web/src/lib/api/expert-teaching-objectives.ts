import { http, getApiErrorMessage } from './client';

export interface ExpertTeachingObjectivesDto {
  classId: string;
  className?: string;
  lecturerId: string;
  lecturerName?: string;
  semester?: string;
  focusLevel?: string;
  targetStudentLevel?: string;
  currentObjectives: TeachingObjectiveItem[];
  myPendingSuggestions: TeachingObjectiveSuggestionDto[];
  lastUpdated?: string;
}

interface TeachingObjectiveItem {
  id: string;
  topic: string;
  objective: string;
  level: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeachingObjectiveSuggestionDto {
  id: string;
  classId: string;
  expertId: string;
  expertName?: string;
  topic: string;
  objective: string;
  level: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SuggestObjectiveRequestDto {
  classId: string;
  topic: string;
  objective: string;
  level: string;
}

export async function fetchExpertClassObjectives(classId: string): Promise<ExpertTeachingObjectivesDto> {
  try {
    const { data } = await http.get<unknown>(`/api/expert/class/${classId}/objectives`);
    return mapExpertTeachingObjectives(data as Record<string, unknown>);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchAllExpertClassObjectives(): Promise<ExpertTeachingObjectivesDto[]> {
  try {
    const { data } = await http.get<unknown[]>('/api/expert/class/objectives/all');
    return (data as unknown[]).map(mapExpertTeachingObjectives);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function suggestObjective(request: SuggestObjectiveRequestDto): Promise<TeachingObjectiveSuggestionDto> {
  try {
    const { data } = await http.post<unknown>('/api/expert/class/objectives/suggest', request);
    return mapSuggestion(data as Record<string, unknown>);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchMyPendingSuggestions(): Promise<TeachingObjectiveSuggestionDto[]> {
  try {
    const { data } = await http.get<unknown[]>('/api/expert/class/objectives/my-suggestions');
    return (data as unknown[]).map(mapSuggestion);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

function mapExpertTeachingObjectives(raw: Record<string, unknown>): ExpertTeachingObjectivesDto {
  const currentObjectives = Array.isArray(raw.currentObjectives ?? raw.CurrentObjectives)
    ? (raw.currentObjectives as unknown[]).map(mapObjectiveItem)
    : [];
  const myPendingSuggestions = Array.isArray(raw.myPendingSuggestions ?? raw.MyPendingSuggestions)
    ? (raw.myPendingSuggestions as unknown[]).map(mapSuggestion)
    : [];

  return {
    classId: String(raw.classId ?? raw.ClassId ?? ''),
    className: optStr(raw.className ?? raw.ClassName),
    lecturerId: String(raw.lecturerId ?? raw.LecturerId ?? ''),
    lecturerName: optStr(raw.lecturerName ?? raw.LecturerName),
    semester: optStr(raw.semester ?? raw.Semester),
    focusLevel: optStr(raw.focusLevel ?? raw.FocusLevel),
    targetStudentLevel: optStr(raw.targetStudentLevel ?? raw.TargetStudentLevel),
    currentObjectives,
    myPendingSuggestions,
    lastUpdated: optStr(raw.lastUpdated ?? raw.LastUpdated),
  };
}

function mapObjectiveItem(raw: unknown): TeachingObjectiveItem {
  const o = raw as Record<string, unknown>;
  return {
    id: String(o.id ?? o.Id ?? ''),
    topic: String(o.topic ?? o.Topic ?? ''),
    objective: String(o.objective ?? o.Objective ?? ''),
    level: String(o.level ?? o.Level ?? 'Basic'),
    order: Number(o.order ?? o.Order ?? 0),
    isActive: Boolean(o.isActive ?? o.IsActive ?? true),
    createdAt: optStr(o.createdAt ?? o.CreatedAt),
    updatedAt: optStr(o.updatedAt ?? o.UpdatedAt),
  };
}

function mapSuggestion(raw: Record<string, unknown>): TeachingObjectiveSuggestionDto {
  return {
    id: String(raw.id ?? ''),
    classId: String(raw.classId ?? raw.ClassId ?? ''),
    expertId: String(raw.expertId ?? raw.ExpertId ?? ''),
    expertName: optStr(raw.expertName ?? raw.ExpertName),
    topic: String(raw.topic ?? raw.Topic ?? ''),
    objective: String(raw.objective ?? raw.Objective ?? ''),
    level: String(raw.level ?? raw.Level ?? 'Basic'),
    status: String(raw.status ?? raw.Status ?? 'Pending'),
    rejectionReason: optStr(raw.rejectionReason ?? raw.RejectionReason),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
    reviewedAt: optStr(raw.reviewedAt ?? raw.ReviewedAt),
  };
}

function optStr(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  const s = String(v).trim();
  return s || undefined;
}
