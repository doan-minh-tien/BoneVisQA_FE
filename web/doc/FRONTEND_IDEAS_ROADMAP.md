# BoneVisQA - Frontend Development Ideas & Roadmap

> **Project**: Interactive Visual Question Answering System for Bone Diseases
> **Role**: Frontend Developer
> **Duration**: 01/01/2026 - 30/04/2026
> **Last Updated**: 29/01/2026

---

## 🎯 Frontend Scope Overview

Bạn sẽ phát triển **2 platforms**:
1. **Web Application** (React/Next.js)
2. **Mobile Application** (React Native/Flutter)

---

## 💡 Ý TƯỞNG CHÍNH CHO FRONTEND

### 1. **Web Platform - Architecture Ideas**

#### 📐 Cấu trúc dự án đề xuất
```
web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (student)/         # Student portal
│   │   │   ├── dashboard/
│   │   │   ├── cases/         # Case library
│   │   │   ├── quiz/          # Quiz mode
│   │   │   └── progress/      # Learning progress
│   │   ├── (expert)/          # Expert portal
│   │   │   ├── dashboard/
│   │   │   ├── cases/manage/  # Manage cases
│   │   │   └── reviews/       # Review Q&A
│   │   ├── (lecturer)/        # Lecturer portal
│   │   │   ├── dashboard/
│   │   │   ├── classes/
│   │   │   └── assignments/
│   │   ├── (curator)/         # Content curator portal
│   │   │   ├── dashboard/
│   │   │   └── knowledge-base/
│   │   └── (admin)/           # Admin portal
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── features/          # Feature-specific components
│   │   │   ├── image-viewer/  # Medical image viewer
│   │   │   ├── annotation/    # Image annotation tool
│   │   │   ├── qa-interface/  # Q&A interface
│   │   │   └── quiz-player/   # Quiz interface
│   │   └── layouts/           # Layout components
│   ├── lib/                   # Utilities & helpers
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API services
│   └── types/                 # TypeScript types
```

---

### 2. **Core Features - Ý tưởng chi tiết**

#### 🖼️ **A. Medical Image Viewer Component**
**Mục tiêu**: Xem ảnh X-ray/CT/MRI với tương tác chuyên nghiệp

**Ý tưởng:**
- [ ] **Zoom & Pan**: Sử dụng `react-image-pan-zoom` hoặc `react-zoom-pan-pinch`
- [ ] **Annotation Tool**: Vẽ hình chữ nhật/vòng tròn đánh dấu vùng nghi ngờ
  - Library gợi ý: `react-konva`, `fabric.js`, hoặc `react-sketch-canvas`
- [ ] **Multi-view Support**: Hiển thị nhiều ảnh cùng lúc (trước/sau, các góc khác nhau)
- [ ] **Window/Level Adjustment**: Điều chỉnh độ sáng/tương phản cho ảnh y tế
- [ ] **Measurement Tools**: Đo khoảng cách, góc trên ảnh
- [ ] **Compare Mode**: So sánh 2 ảnh cạnh nhau

**Tech Stack gợi ý:**
```tsx
// Example: Medical Image Viewer với annotation
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
```

**UI/UX Ideas:**
- Toolbar phía trên: Zoom In/Out, Pan, Annotate, Reset
- Minimap ở góc để xem toàn cảnh
- Hotkeys: `+/-` zoom, `Space + drag` pan, `R` reset
- Dark mode mặc định (dễ nhìn ảnh y tế hơn)

---

#### 💬 **B. Visual Q&A Interface**
**Mục tiêu**: Sinh viên hỏi câu hỏi về ảnh và nhận câu trả lời có cấu trúc

**Ý tưởng:**
- [ ] **Split View**: Ảnh bên trái, Q&A bên phải
- [ ] **Question Input Box** với:
  - Rich text editor (markdown support)
  - Tag vùng trên ảnh khi hỏi ("vùng này là gì?")
  - Quick question templates ("Loại gãy xương?", "Chẩn đoán phân biệt?")
- [ ] **Answer Display** format:
  ```
  📋 Chẩn đoán chính: [...]
  🔍 Chẩn đoán phân biệt: [...]
  🎯 Dấu hiệu hình ảnh quan trọng: [...]
  💡 Gợi ý học tập: [...]
  📚 Tài liệu tham khảo: [liên kết]
  ```
- [ ] **AI Thinking Indicator**: Loading với animation khi AI đang xử lý
- [ ] **Citation Links**: Click vào nguồn trích dẫn để xem chi tiết
- [ ] **Bookmark/Save Answer**: Lưu câu trả lời hay

**UI Components:**
```tsx
<ImageQAInterface>
  <ImageViewerPanel>
    <MedicalImageViewer />
    <AnnotationOverlay />
  </ImageViewerPanel>

  <QAPanel>
    <QuestionInput />
    <AnswerDisplay>
      <DiagnosisSection />
      <KeyFindingsSection />
      <CitationsSection />
    </AnswerDisplay>
  </QAPanel>
</ImageQAInterface>
```

---

#### 🎮 **C. Interactive Quiz Mode**
**Mục tiêu**: Quiz tương tác với ảnh xương

**Ý tưởng:**
- [ ] **Quiz Types**:
  - Multiple choice trên ảnh
  - Drag & drop labels lên vùng đúng
  - Spot the lesion (tìm vùng tổn thương)
  - Case-based scenarios
- [ ] **Gamification**:
  - Progress bar
  - Score tracking
  - Streak system (làm đúng liên tiếp)
  - Leaderboard (optional)
- [ ] **Instant Feedback**:
  - Đúng: Hiện giải thích ngắn + highlight vùng đúng
  - Sai: Hiện vùng đúng + giải thích tại sao
- [ ] **Mobile-optimized**: Touch-friendly cho mobile quiz

**Quiz Flow:**
```
Start Quiz → Question + Image → Student Answer →
Instant Feedback → Next Question → Summary Report
```

---

#### 📚 **D. Case Library Browser**
**Mục tiêu**: Duyệt thư viện ca bệnh dễ dàng

**Ý tưởng:**
- [ ] **Advanced Filters**:
  - Bone location (long bones, spine, knee, hip...)
  - Lesion type (fracture, dislocation, degenerative...)
  - Difficulty level (basic, intermediate, advanced)
  - Imaging modality (X-ray, CT, MRI, Ultrasound)
- [ ] **Search**: Full-text search + tag-based search
- [ ] **View Modes**:
  - Grid view (thumbnails)
  - List view (detailed)
  - Timeline view (recent first)
- [ ] **Quick Preview**: Hover để xem preview nhanh
- [ ] **Bookmarks**: Đánh dấu ca yêu thích

**UI Layout:**
```tsx
<CaseLibrary>
  <FilterSidebar />
  <SearchBar />
  <ViewModeToggle />
  <CaseGrid>
    {cases.map(case => (
      <CaseCard
        thumbnail={case.thumbnail}
        title={case.title}
        tags={case.tags}
        difficulty={case.difficulty}
      />
    ))}
  </CaseGrid>
</CaseLibrary>
```

---

#### 📊 **E. Learning Progress Dashboard**
**Mục tiêu**: Theo dõi tiến độ học tập

**Ý tưởng:**
- [ ] **Statistics Cards**:
  - Cases studied
  - Questions asked
  - Quiz accuracy rate
  - Study time
- [ ] **Charts**:
  - Progress over time (line chart)
  - Performance by topic (radar chart)
  - Common mistakes (bar chart)
- [ ] **Achievement Badges**: Unlock badges khi đạt milestone
- [ ] **Study Streak Calendar**: Heatmap như GitHub contributions
- [ ] **Weak Areas Suggestions**: AI gợi ý topic cần ôn

**Chart Libraries:**
- `recharts` - Simple & React-friendly
- `chart.js` - Versatile
- `visx` - D3-based, powerful

---

### 3. **Mobile App - Ideas**

#### 📱 **Mobile-Specific Features**

**Ý tưởng:**
- [ ] **Offline Mode**: Download cases để học offline
- [ ] **Push Notifications**:
  - New case available
  - Quiz reminder
  - Assignment from lecturer
- [ ] **Quick Quiz**: 5-minute micro-learning sessions
- [ ] **Camera Integration**: Chụp ảnh X-ray từ màn hình/sách → hỏi câu hỏi
- [ ] **Touch Gestures**:
  - Pinch to zoom
  - Swipe between cases
  - Long press for quick actions
- [ ] **Voice Input**: Hỏi câu hỏi bằng giọng nói (optional)

**Mobile Navigation:**
```
Bottom Tab Navigator:
- Home (Dashboard)
- Cases (Library)
- Quiz (Quick quiz)
- Profile (Progress)
```

---

### 4. **UI/UX Design System**

#### 🎨 **Design Tokens (Đã có sẵn từ Medical Design System)**

```css
/* Colors */
--primary: #0891B2 (Medical Teal)
--accent: #22C55E (Health Green)
--background: #F0FDFA (Light mint)
--card: #FFFFFF

/* Typography */
font-family: 'Figtree', 'Noto Sans', sans-serif
```

#### 🧩 **Component Library Ideas**

**Nên build custom hoặc dùng:**
- [ ] **Option 1**: Build từ đầu với Tailwind
- [ ] **Option 2**: Shadcn/ui (recommended - highly customizable)
- [ ] **Option 3**: Material-UI + customization
- [ ] **Option 4**: Ant Design (nhiều component sẵn)

**Core Components cần:**
- Button, Input, Select, Checkbox, Radio
- Card, Modal, Drawer, Popover
- Table, Pagination, Tabs
- Toast/Notification
- Loading indicators
- Image gallery
- File uploader

---

### 5. **State Management**

**Ý tưởng:**
- [ ] **React Context + Hooks** (cho app nhỏ)
- [ ] **Zustand** (recommended - simple & powerful)
- [ ] **Redux Toolkit** (nếu app phức tạp)
- [ ] **TanStack Query (React Query)** cho API calls

**Stores cần:**
- `authStore` - User authentication
- `caseStore` - Case library data
- `quizStore` - Quiz state
- `annotationStore` - Image annotations
- `progressStore` - Learning progress

---

### 6. **API Integration Ideas**

**Ý tưởng:**
- [ ] **API Client Setup**:
  ```tsx
  // lib/api-client.ts
  import axios from 'axios';

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  ```

- [ ] **API Services**:
  - `authService` - login, register, logout
  - `caseService` - getCases, getCaseById, uploadCase
  - `qaService` - askQuestion, getAnswers
  - `quizService` - getQuiz, submitAnswer
  - `progressService` - getStats, updateProgress

- [ ] **Error Handling**: Toast notifications cho lỗi API
- [ ] **Loading States**: Skeleton screens cho UX tốt hơn
- [ ] **Optimistic Updates**: Update UI trước, sync với server sau

---

### 7. **Performance Optimization Ideas**

- [ ] **Image Optimization**:
  - Next.js Image component cho auto-optimization
  - Lazy load images
  - WebP format cho ảnh thumbnail
  - Progressive loading cho ảnh lớn
- [ ] **Code Splitting**:
  - Route-based splitting (Next.js tự động)
  - Component-level lazy loading với `React.lazy`
- [ ] **Caching**:
  - SWR/React Query cho API caching
  - IndexedDB cho offline storage (mobile)
- [ ] **Bundle Size**:
  - Analyze bundle với `@next/bundle-analyzer`
  - Tree-shaking unused code
  - Dynamic imports cho libraries lớn

---

### 8. **Accessibility (A11y) Checklist**

- [ ] Keyboard navigation support
- [ ] ARIA labels cho screen readers
- [ ] Focus indicators rõ ràng
- [ ] Alt text cho tất cả images
- [ ] Color contrast đạt WCAG AA (4.5:1)
- [ ] Skip to content link
- [ ] Form validation messages rõ ràng

---

### 9. **Testing Ideas**

- [ ] **Unit Tests**: Jest + React Testing Library
- [ ] **Component Tests**: Storybook cho UI components
- [ ] **E2E Tests**: Playwright/Cypress cho critical flows
- [ ] **Visual Regression**: Chromatic hoặc Percy

**Priority Test Cases:**
- Login/Register flow
- Case viewing & annotation
- Q&A submission & display
- Quiz flow
- Image viewer interactions

---

## 📅 FRONTEND DEVELOPMENT ROADMAP

### **Phase 1: Foundation (Week 1-2)**
- [x] Setup Next.js project ✅
- [x] Design system setup ✅
- [ ] Component library choice & setup
- [ ] Authentication UI (login/register)
- [ ] Basic routing structure
- [ ] API client setup

### **Phase 2: Core Features (Week 3-6)**
- [ ] Medical Image Viewer component
- [ ] Annotation tool
- [ ] Case Library browser
- [ ] Q&A interface (question input)
- [ ] Answer display component
- [ ] Student dashboard

### **Phase 3: Advanced Features (Week 7-9)**
- [ ] Quiz mode implementation
- [ ] Progress tracking dashboard
- [ ] Expert portal (case management)
- [ ] Lecturer portal (class management)
- [ ] Curator portal (knowledge base)
- [ ] Admin portal

### **Phase 4: Mobile App (Week 10-12)**
- [ ] React Native/Flutter setup
- [ ] Mobile navigation
- [ ] Adapt web components for mobile
- [ ] Touch gestures
- [ ] Offline mode
- [ ] Push notifications

### **Phase 5: Polish & Testing (Week 13-15)**
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing
- [ ] Mobile testing (iOS/Android)
- [ ] Bug fixes
- [ ] User testing feedback

### **Phase 6: Documentation & Deployment (Week 16)**
- [ ] User manual
- [ ] Developer documentation
- [ ] Deployment setup
- [ ] Final demo preparation

---

## 🔧 TECH STACK RECOMMENDATIONS

### **Web**
- **Framework**: Next.js 16 (App Router) ✅
- **Language**: TypeScript ✅
- **Styling**: Tailwind CSS 4 ✅
- **UI Components**: Shadcn/ui (recommended)
- **State**: Zustand + TanStack Query
- **Icons**: Lucide React ✅
- **Forms**: React Hook Form + Zod validation
- **Image Handling**: react-konva (annotation) + react-zoom-pan-pinch
- **Charts**: Recharts

### **Mobile**
- **Framework**: React Native (recommended) hoặc Flutter
- **Navigation**: React Navigation
- **State**: Same as web (Zustand)
- **UI**: React Native Paper hoặc NativeBase
- **Offline**: @react-native-async-storage/async-storage

---

## 💭 YOUR IDEAS & NOTES

### Ý tưởng của tôi:
<!-- Thêm ý tưởng của bạn ở đây -->

**Example:**
```
- [ ] Thêm dark mode toggle cho student dashboard
- [ ] Animation khi hiển thị câu trả lời từ AI
- [ ] Export quiz results as PDF
- [ ] Social sharing cho high scores
```

---

### Questions/Blockers:
<!-- Ghi câu hỏi hoặc vấn đề cần giải quyết -->

**Example:**
```
- API endpoint nào để upload ảnh? (hỏi backend team)
- Format của annotation data? (JSON structure?)
- Authentication flow? (JWT? Session?)
```

---

### Resources & References:
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Shadcn/ui](https://ui.shadcn.com)
- [React Konva](https://konvajs.org/docs/react/)
- [Medical Imaging UI Patterns](https://www.nngroup.com/articles/medical-device-design/)

---

## 📝 CHANGELOG

### 2026-01-29
- ✅ Initial project setup with Next.js 16
- ✅ Design system implementation (Medical teal + Health green)
- ✅ Basic dashboard layout with sidebar
- 📝 Created this roadmap document

### [Date]
<!-- Update progress here -->

---

**Note**: File này là living document - cập nhật thường xuyên khi có ý tưởng mới hoặc hoàn thành task!
