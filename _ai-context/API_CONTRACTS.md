# BoneVisQA — API contracts (FE view)

> **Nguồn:** Tổng hợp từ `web/src/lib/api/*.ts`. BE chính thức có thể mở rộng; khi Backend cung cấp `_ai-context/API_CONTRACTS.md`, merge và ghi version/ngày cập nhật.

**Base URL:** `NEXT_PUBLIC_API_URL` (ví dụ `http://localhost:5046`). Mọi path dưới đây là suffix sau origin.

**Auth header:** `Authorization: Bearer <token>` (axios interceptor trong `client.ts`).

---

## Auth

| Method | Path | Ghi chú |
|--------|------|---------|
| POST | `/api/auths/login` | body login |
| POST | `/api/auths/register` | |
| POST | `/api/auths/forgot-password` | `{ email }` |
| POST | `/api/auths/reset-password` | |
| POST | `/api/auths/google-register` | `{ idToken }` |
| POST | `/api/auths/request-medical-verification` | |

## Profile / user chung

| Method | Path |
|--------|------|
| GET/PUT | `/api/profile` |
| POST | `/api/profile/avatar` | multipart |
| GET | `/api/users/me` | student profile |
| PUT | `/api/users/me` | |
| GET | `/api/search` | `?q=` |

## Student

| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/student/progress` | |
| GET | `/api/student/progress/topic-stats` | |
| GET | `/api/student/progress/recent-activity` | |
| GET | `/api/student/announcements` | |
| GET | `/api/students/classes` | |
| POST | `/api/student/visual-qa/ask` | multipart Visual QA |
| POST | `/api/student/visual-qa/turns/{assistantMessageId}/request-review` | query `sessionId`; path id is the **assistant (AI) message** id for that turn |
| GET | `/api/student/visual-qa/history/cases` | |
| GET | `/api/student/visual-qa/history/personal` | |
| GET | `/api/student/cases/catalog` | query params |
| GET | `/api/cases/filters` | |
| GET | `/api/student/quizzes` | |
| GET | `/api/student/quizzes/practice` | |
| POST | `/api/student/quizzes/practice/generate` | |
| POST | `/api/student/quizzes/submit` | |
| GET | `/api/student/quizzes/history` | |

## Lecturer

| Method | Path |
|--------|------|
| GET/POST | `/api/lecturer/classes` |
| GET | `/api/lecturer/cases` |
| GET | `/api/lecturer/experts` |
| GET | `/api/lecturer/quizzes` |
| GET | `/api/lecturer/quizzes/batch` |
| POST | `/api/lecturer` | tạo quiz (legacy path trong code) |
| GET | `/api/lecturer/dashboard/stats` |
| GET | `/api/lecturer/dashboard/analytics` |
| GET | `/api/lecturer/monitoring/class-leaderboard` |
| GET | `/api/lecturer/triage` | query `classId` … |
| GET/PUT | `/api/lecturer/profile` |
| POST | `/api/lecturer/ai/generate-quiz` |
| POST | `/api/lecturer/ai/suggest-questions` |
| POST | `/api/lecturer/ai/create-quiz` |

## Expert

| Method | Path |
|--------|------|
| POST | `/api/expert/cases` |
| GET | `/api/expert/tags` | alias of `/api/expert/tag`; query `pageIndex`, `pageSize` |
| GET | `/api/expert/tag` | query `pageIndex`, `pageSize` |
| POST | `/api/expert/images` |
| POST | `/api/expert/annotations` |
| POST | `/api/expert/case-tag` |
| GET | `/api/expert/reviews/case-answer` |
| GET | `/api/expert/reviews/escalated` |
| GET | `/api/expert/dashboard/stats` |
| GET | `/api/expert/dashboard/pending-reviews` |
| GET | `/api/expert/dashboard/recent-cases` |
| GET | `/api/expert/dashboard/activity` |
| GET/POST | `/api/expert/quizzes` |
| POST | `/api/expert/quizzes/assign` |
| POST | `/api/expert/assign` | |

## Admin

| Method | Path |
|--------|------|
| GET | `/api/admin/users` | query `page`, `pageSize` |
| GET | `/api/admin/role/:role` | fallback directory |
| GET/POST | `/api/admin/classes` | enrollments, … |
| GET | `/api/admin/cases` |
| GET | `/api/admin/documents` |
| GET | `/api/admin/monitoring/users` |
| GET | `/api/admin/monitoring/activity` | `from`, `to` ISO |
| GET | `/api/admin/monitoring/rag` |
| GET | `/api/admin/monitoring/reviews` |
| GET/PUT | `/api/admin/profile` |

## Notifications & upload

| Method | Path |
|--------|------|
| GET | `/api/notifications` |
| PUT | `/api/notifications/:id/read` |
| POST | `/api/upload/image` | multipart |

## SignalR (không phải REST)

- Hub theo cấu hình FE (`useSignalR`): nhận `ReceiveNotification`, payload khớp `NotificationDto` (có `route`, `targetUrl`, …).

## Visual QA thread (REST)

- Các route thread/session nằm trong `student-visual-qa.ts`, `normalize-visual-qa.ts`, và trang `web/src/app/student/qa/image/page.tsx` — xem code cho query `sessionId`, `roiBoundingBox`, `questionCoordinates`.

---

**Khi đổi contract BE:** cập nhật `web/src/lib/api/types.ts` + mapper + file này.
