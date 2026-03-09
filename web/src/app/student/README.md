# Student Dashboard - BoneVisQA

## Overview
Dashboard dành riêng cho sinh viên y khoa với tập trung vào trải nghiệm học tập tương tác.

## Structure
```
student/
├── dashboard/
│   └── page.tsx          # Main student dashboard
├── layout.tsx            # Student layout with sidebar
└── README.md             # This file
```

## Features Implemented

### 1. **Statistics Overview**
4 stat cards hiển thị:
- Cases Studied (số ca đã học)
- Quiz Score (điểm quiz trung bình)
- Study Streak (chuỗi ngày học liên tục)
- Accuracy Rate (tỷ lệ chính xác)

### 2. **Quick Actions**
4 action cards cho phép:
- Start Quick Quiz (quiz nhanh 5 phút)
- Upload Image (upload ảnh X-ray)
- Ask a Question (đặt câu hỏi)
- View Schedule (xem lịch học)

### 3. **Continue Learning Section**
- Grid hiển thị các case đang học
- Mỗi CaseCard có:
  - Thumbnail
  - Title & description
  - Tags (bone location, lesion type)
  - Difficulty badge (basic/intermediate/advanced)
  - Progress bar
  - Duration estimate

### 4. **Progress Tracking**
- Overall progress ring (visual progress indicator)
- Progress by topic (4 topics với progress bars)
- Recent activity feed

### 5. **Learning Insights**
4 insight cards:
- Accuracy improvement
- Study time this week
- Badges earned
- Goal achievement

## Components Created

### `CaseCard.tsx`
Card component cho case library.

**Props:**
```typescript
{
  id: string;
  title: string;
  thumbnail: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  duration?: string;
  progress?: number;
}
```

**Features:**
- Difficulty color coding
- Progress bar overlay
- Hover effects
- Tags for categorization

### `ProgressRing.tsx`
Circular progress indicator.

**Props:**
```typescript
{
  progress: number;         // 0-100
  size?: number;           // default: 120
  strokeWidth?: number;    // default: 8
  color?: string;          // CSS color
}
```

**Features:**
- Animated SVG circle
- Center text display
- Customizable size and colors

### `QuickActionCard.tsx`
Action button card with icon.

**Props:**
```typescript
{
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  iconColor?: string;
  badge?: string;
}
```

**Features:**
- Icon with custom colors
- Optional badge (e.g., "New")
- Hover scale effect
- Link integration

## Sidebar (StudentSidebar.tsx)

Menu items:
1. Dashboard
2. Case Library
3. Q&A
4. Quizzes
5. My Progress
6. Schedule
7. Upload Image
8. Settings

## Design System

**Colors Used:**
- Primary: Medical Teal (#0891B2)
- Accent: Health Green (#22C55E)
- Warning: #F59E0B
- Success: #22C55E
- Destructive: #EF4444

**Typography:**
- Font: Figtree / Noto Sans
- Headings: font-semibold
- Body: font-normal

## Mock Data

Currently using mock data for:
- Student stats
- Recent cases (4 cases)
- Topic progress (4 topics)
- Recent activity (4 items)

**TODO**: Replace with API calls.

## Next Steps

### Immediate:
- [ ] Connect to backend APIs
- [ ] Add loading states (skeleton screens)
- [ ] Add error handling
- [ ] Implement real image thumbnails

### Short-term:
- [ ] Case detail page
- [ ] Q&A interface
- [ ] Quiz player
- [ ] Progress analytics page
- [ ] Image upload functionality

### Long-term:
- [ ] Real-time notifications
- [ ] Social features (leaderboard)
- [ ] Personalized recommendations
- [ ] Offline mode support

## Routes to Create

```
/student/dashboard          ✅ Done
/student/cases             ⏳ Todo - Case library
/student/cases/[id]        ⏳ Todo - Case detail
/student/qa                ⏳ Todo - Q&A list
/student/qa/new            ⏳ Todo - New question
/student/quiz              ⏳ Todo - Quiz list
/student/quiz/[id]         ⏳ Todo - Quiz player
/student/progress          ⏳ Todo - Progress analytics
/student/schedule          ⏳ Todo - Schedule view
/student/upload            ⏳ Todo - Image upload
/student/settings          ⏳ Todo - Settings
```

## API Endpoints Needed

```typescript
// Stats
GET /api/student/stats

// Cases
GET /api/student/cases?category=...&difficulty=...
GET /api/student/cases/:id
POST /api/student/cases/:id/progress

// Q&A
GET /api/student/qa
POST /api/student/qa/ask

// Quiz
GET /api/student/quiz
POST /api/student/quiz/:id/submit

// Progress
GET /api/student/progress/overall
GET /api/student/progress/by-topic
GET /api/student/activity/recent
```

## Testing

**Manual Testing Checklist:**
- [ ] Dashboard loads without errors
- [ ] All stat cards display correctly
- [ ] Quick action cards are clickable
- [ ] Case cards show proper difficulty badges
- [ ] Progress ring animates smoothly
- [ ] Topic progress bars render correctly
- [ ] Sidebar navigation works
- [ ] Responsive on mobile (375px, 768px, 1024px)
- [ ] Dark mode works (if enabled)

## Performance Notes

- Use Next.js Image component for case thumbnails
- Implement lazy loading for case grid
- Add pagination for long lists
- Consider virtual scrolling for large datasets

## Accessibility

- All interactive elements have focus states ✅
- Color contrast meets WCAG AA ✅
- Keyboard navigation supported ✅
- ARIA labels needed for progress rings
- Alt text for case images (when real images added)
