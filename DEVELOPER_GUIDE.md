# BoneVisQA — Hướng dẫn dev (FE repo)

Tài liệu này giúp **FE và BE** (và AI assistant trong Cursor) thống nhất cách làm việc. Backend thường là repo GitHub riêng; **mở hai cửa sổ Cursor** (một workspace trỏ repo FE, một trỏ repo BE) là cách hợp lệ — không bắt phải “một repo duy nhất”.

## 1. Kiến trúc project — thư mục & module

| Vị trí | Nội dung |
|--------|----------|
| `web/` | Ứng dụng **Next.js 16** (App Router). Mọi `npm` script chạy từ đây. |
| `web/src/app/` | Route theo vai trò: `student/`, `lecturer/`, `expert/`, `admin/`, `auth/`. |
| `web/src/components/` | Component dùng lại; theo role hoặc `shared/`, `ui/`. |
| `web/src/lib/api/` | **Axios** qua `client.ts`, helpers theo domain (`student-visual-qa.ts`, `lecturer-triage.ts`, `expert-reviews.ts`, `admin-cases.ts`, …). |
| `web/src/lib/` | Utils, hooks (`useAuth`, SignalR), chuẩn hóa Visual QA (`normalize-visual-qa.ts`, `visual-qa-workflow.ts`). |
| `mobile/` | React Native (tùy task; không bắt buộc cho mọi thay đổi web). |
| `scripts/` | Script tiện ích (ví dụ import LabelMe) — không phải runtime của app. |
| `_ai-context/` | Spec tóm tắt & **API_CONTRACTS** để đồng bộ với BE; nên đối chiếu với bản tương ứng trên repo BE nếu có. |

**Luồng nghiệp vụ Visual QA (rút gọn):**

1. **Student** — `/student/qa/image`: upload/ROI, hỏi → `POST /api/student/visual-qa/ask` (xem `student-visual-qa.ts`, `ChatConversation`). Lịch sử: history pages + normalize session.
2. **Lecturer** — `/lecturer/qa-triage`: hàng đợi → `lecturer-triage.ts` / `lecturer.ts`; duyệt, trả lời, escalate.
3. **Expert** — `/expert/reviews`: review câu escalated → `expert-reviews.ts`.

Chi tiết endpoint: `_ai-context/API_CONTRACTS.md`.

## 2. Convention — đặt tên & style

- **TypeScript** strict; tránh `any` (trừ chỗ legacy đã có).
- File component / component export: **PascalCase** (`ChatComposer.tsx`).
- Props, biến, hàm: **camelCase**.
- Route App Router: thư mục **kebab-case** hoặc theo Next (`[id]`).
- API response: chuẩn hóa PascalCase/camelCase ở layer `normalize*` / `map*` trong `web/src/lib/api/`.
- Lỗi HTTP: `getApiErrorMessage` / `getApiProblemDetails` từ `@/lib/api/client`.
- Comment logic domain phức tạp: **tiếng Việt**, ngắn (theo convention team).

**ESLint:** cấu hình `web/eslint.config.mjs` + `eslint-config-next`.

## 3. Quy tắc quan trọng

- **Không commit** secret (`.env.local`, khóa API). `.env.example` (nếu có) chỉ chứa placeholder.
- **Không sửa** output build: `web/.next/`, cache Turbopack — đã nên nằm trong `.gitignore`.
- **Không chỉnh** `package-lock.json` / `node_modules` trừ khi đổi dependency có chủ đích (`npm install <pkg>`).
- Thay đổi contract API: cập nhật **`_ai-context/API_CONTRACTS.md`** và type trong `web/src/lib/api/types.ts` (hoặc file domain) cho khớp BE.
- **Trước khi commit / PR:** chạy lint + build (mục 4). Với thay đổi Visual QA, kiểm tra nhanh luồng Student → Lecturer → Expert trên môi trường có BE.

## 4. Build & test / kiểm tra

Chạy trong thư mục `web/`:

```bash
cd web
npm install
npm run lint
npm run build
npm run dev
```

- **`npm run dev`:** [http://localhost:3000](http://localhost:3000) — cần `NEXT_PUBLIC_API_URL` trỏ origin BE (ví dụ `http://localhost:5046`) trong `web/.env.local`.
- **`npm run build`:** kiểm tra TypeScript + bundle production.
- **Tests tự động:** hiện dự án **không** có script `npm test` mặc định; regression = lint + build + kiểm tra tay luồng QA theo role.

## Tài liệu liên quan

| File | Mục đích |
|------|-----------|
| `README.md` | Cài đặt nhanh, link vào guide này. |
| `_ai-context/PROJECT_SPEC.md` | Bối cảnh sản phẩm & stack. |
| `_ai-context/API_CONTRACTS.md` | Bảng path API (đồng bộ với BE). |
| `_ai-context/FRONTEND_CONTEXT_BLOCK.md` | Khối copy-paste cho prompt Cursor. |
