# Context block — copy-paste cho Cursor

Sao chép khối dưới và điền `[...]` trước khi gửi.

---

```
Context: Đây là dự án BoneVisQA (ứng dụng y khoa / case study + Visual QA). FE dùng Next.js 16 + React 19 + TypeScript, mã trong thư mục web/.

API endpoint: [dán từ API_CONTRACTS.md — ví dụ GET /api/student/visual-qa/... hoặc POST /api/student/visual-qa/ask]

Response schema: [dán struct từ web/src/lib/api/types.ts hoặc từ BE OpenAPI]

Yêu cầu: Tạo component [TênComponent] với chức năng [mô tả ngắn].

Theo convention: file PascalCase.tsx, props camelCase; gọi API qua @/lib/api/* và http từ @/lib/api/client.

Đã có component liên quan: [ví dụ ChatComposer, ChatConversation, TopHeader — kiểm tra web/src/components]
```

---

## Gợi ý nhanh

- Visual QA image: `web/src/app/student/qa/image/page.tsx`
- API student VQA: `web/src/lib/api/student-visual-qa.ts`
- Thông báo: `web/src/lib/api/notifications.ts`, `web/src/hooks/useSignalR.ts`
