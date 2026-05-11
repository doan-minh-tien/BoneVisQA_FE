# BoneVisQA — Frontend (PROJECT_SPEC)

> **Nguồn:** Bản này được duy trì ở repo FE (`BoneVisQA_FE/_ai-context/`). Nếu repo Backend có `_ai-context/PROJECT_SPEC.md`, hãy đối chiếu và cập nhật cho khớp hệ thống end-to-end.

## Mục tiêu sản phẩm

Ứng dụng web quản lý học tập y khoa / case study với **Visual QA** (hỏi đáp trên ảnh X-quang), phân quyền **Student / Lecturer / Expert / Admin**, RAG/tài liệu, quiz, và thông báo real-time (SignalR).

## Công nghệ

| Hạng mục | Giá trị |
|----------|---------|
| Framework | **Next.js 16** (App Router), **React 19** |
| Ngôn ngữ | **TypeScript** |
| HTTP | **Axios** (`web/src/lib/api/client.ts` — `NEXT_PUBLIC_API_URL`, dev fallback `http://localhost:5046`) |
| Realtime | **@microsoft/signalr** (`web/src/hooks/useSignalR.ts`) |
| State / data | **TanStack React Query** (một số trang), hooks cục bộ |
| UI | Tailwind CSS, Radix UI, lucide-react, i18next |

## Cấu trúc thư mục chính

- `web/` — mã nguồn Next.js (đây là thư mục chạy `npm run dev` / `npm run build`).
- `web/src/app/` — routes theo role: `student/`, `lecturer/`, `expert/`, `admin/`, `auth/`.
- `web/src/lib/api/` — client API, types, normalize (Visual QA, notifications, admin, …).
- `web/src/components/` — component tái sử dụng theo role hoặc shared.
- `mobile/` — RN (tùy scope; không bắt buộc cho mọi task FE web).

## Quy ước FE

- Gọi API chỉ qua `http` + helpers trong `web/src/lib/api/*` (Bearer từ `localStorage` token).
- Chuẩn hóa response PascalCase/camelCase tại layer `normalize*` / `map*` khi cần.
- Component file: **PascalCase**; props: **camelCase**.
- Logic domain phức tạp: comment ngắn bằng **tiếng Việt** (theo team rule).

## Biến môi trường

- `NEXT_PUBLIC_API_URL` — origin API (không có suffix `/api`).

## Liên kết nội bộ

- Chi tiết endpoint: `API_CONTRACTS.md` (cùng thư mục).
- Hướng dẫn dev đầy đủ (gốc repo): `../DEVELOPER_GUIDE.md`.
