# Clinical Expert Dashboard - BoneVisQA

## Overview
Dashboard dành cho chuyên gia lâm sàng (Clinical Expert/Reviewer) với tập trung vào quản lý case library và review câu trả lời AI cho sinh viên.

## Structure
```
expert/
├── dashboard/
│   └── page.tsx          # Main expert dashboard
├── layout.tsx            # Expert layout with sidebar
└── README.md             # This file
```

## Features Implemented

### 1. **Quick Statistics Overview**
4 stat cards với trend indicators:
- **Total Cases**: 156 cases (+12% ↑)
- **Pending Reviews**: 23 reviews (-15% ↓ - good sign!)
- **Approved This Month**: 48 cases (+8% ↑)
- **Student Interactions**: 2,847 interactions (+23% ↑)

### 2. **Action Buttons**
- Add New Case (primary action)
- Filter Cases

### 3. **Pending Q&A Reviews Section**
Card-based layout cho từng review request:
- **Priority Badges**: High/Normal/Low
- **Student Info**: Name + timestamp
- **Question Preview**: Line-clamp 2 lines
- **AI Answer Preview**: Background highlight
- **Quick Actions**:
  - Review (primary button)
  - Approve (green checkmark)
  - Reject (red X)

### 4. **Case Management Section**
Grid hiển thị cases với detailed info:
- **Status Badges**: Draft/Pending/Approved/Rejected
- **Difficulty Badges**: Basic/Intermediate/Advanced
- **Meta Information**:
  - Added by (author)
  - Date added
  - View count
  - Usage count (how many times used in learning)
- **Actions**: View, Edit, Delete

### 5. **This Week Activity (Right Sidebar)**
- Bar chart progression cho mỗi ngày
- Total reviews per day
- Average daily reviews calculation

### 6. **Performance Metrics**
3 key metrics:
- **Avg Review Time**: 8.5 minutes
- **Approval Rate**: 94%
- **Quality Score**: 4.8/5

### 7. **Alerts Section**
Highlight urgent items:
- High-priority reviews > 24 hours old
- Quick action button

### 8. **Bottom Stats Grid**
4 cumulative statistics:
- Total Q&A Reviewed: 347
- Cases Approved: 156
- Student Satisfaction: 89%
- Expert Ranking: Top 5%

## Components Created

### `ExpertSidebar.tsx`
Navigation sidebar cho expert portal.

**Menu Items:**
- Dashboard
- Case Library (badge: 8)
- Q&A Reviews (badge: 12)
- Approved Cases
- Quiz Management
- Reports
- Pending Items (badge: 5)
- Settings

**Features:**
- Badge notifications for pending items
- Active state highlighting
- Expert profile display

### `ReviewCard.tsx`
Card component cho Q&A reviews.

**Props:**
```typescript
{
  id: string;
  studentName: string;
  caseTitle: string;
  question: string;
  aiAnswer: string;
  submittedAt: string;
  priority: 'high' | 'normal' | 'low';
  category: string;
}
```

**Features:**
- Priority color coding (high = red border)
- AI answer preview with background
- Student info with timestamp
- Quick action buttons
- Category tags

### `CaseManagementCard.tsx`
Card component cho case management.

**Props:**
```typescript
{
  id: string;
  title: string;
  boneLocation: string;
  lesionType: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  addedBy: string;
  addedDate: string;
  viewCount: number;
  usageCount: number;
}
```

**Features:**
- Status icons (Clock/Alert/Check)
- Difficulty color coding
- Usage analytics display
- CRUD actions (View/Edit/Delete)

### `QuickStatsCard.tsx`
Statistics card với trend indicators.

**Props:**
```typescript
{
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
}
```

**Features:**
- Trend arrows (up/down/neutral)
- Color-coded trends
- Icon with custom colors
- Large value display

## Design Patterns

### Priority System
```typescript
High Priority:
- Red/destructive colors
- Border highlight
- Urgent action required

Normal Priority:
- Yellow/warning colors
- Standard display

Low Priority:
- Gray/muted colors
- Can be reviewed later
```

### Status System
```typescript
Draft: Gray + Clock icon
Pending: Yellow + Alert icon
Approved: Green + Check icon
Rejected: Red + Alert icon
```

### Difficulty System
```typescript
Basic: Green background
Intermediate: Yellow background
Advanced: Red background
```

## Mock Data Structure

### Pending Reviews
- 3 reviews with different priorities
- Categories: Fracture, Degenerative, Dislocation
- Time range: 2 hours to 1 day ago

### Recent Cases
- 4 cases with different statuses
- Mixed difficulty levels
- Usage analytics included

### Weekly Activity
- 7 days of activity data
- Reviews and cases added per day

## Workflow

### Q&A Review Workflow
```
1. Expert views pending reviews
2. Click "Review" → Navigate to detail page
3. Review student question + AI answer
4. Edit/approve/reject answer
5. Add clinical notes (optional)
6. Mark as "approved"
```

### Case Management Workflow
```
1. Expert adds new case
2. Upload images + description
3. Tag with location, type, difficulty
4. Status: Draft
5. Expert reviews → Pending
6. Final approval → Approved
7. Visible to students
```

## Routes to Create

```
/expert/dashboard          ✅ Done
/expert/cases             ⏳ Todo - Full case library
/expert/cases/[id]        ⏳ Todo - Case detail/edit
/expert/cases/new         ⏳ Todo - Add new case
/expert/reviews           ⏳ Todo - All Q&A reviews
/expert/reviews/[id]      ⏳ Todo - Review detail
/expert/approved          ⏳ Todo - Approved cases
/expert/quiz              ⏳ Todo - Quiz management
/expert/reports           ⏳ Todo - Analytics reports
/expert/pending           ⏳ Todo - All pending items
/expert/settings          ⏳ Todo - Settings
```

## API Endpoints Needed

```typescript
// Stats
GET /api/expert/stats
GET /api/expert/activity/weekly

// Cases
GET /api/expert/cases?status=...&difficulty=...
POST /api/expert/cases
PUT /api/expert/cases/:id
DELETE /api/expert/cases/:id
PATCH /api/expert/cases/:id/approve

// Reviews
GET /api/expert/reviews?priority=...&status=...
GET /api/expert/reviews/:id
PUT /api/expert/reviews/:id
PATCH /api/expert/reviews/:id/approve
PATCH /api/expert/reviews/:id/reject

// Quiz
GET /api/expert/quiz
POST /api/expert/quiz
PUT /api/expert/quiz/:id
```

## Role-Based Access Control

**Expert Permissions:**
- ✅ View all cases
- ✅ Add/Edit/Delete cases
- ✅ Review Q&A submissions
- ✅ Approve/Reject answers
- ✅ Create quiz questions
- ✅ View student statistics
- ❌ Manage user accounts (Admin only)
- ❌ Assign students to classes (Lecturer only)

## Testing Checklist

**Functional Testing:**
- [ ] Dashboard loads with correct stats
- [ ] Priority badges display correctly
- [ ] Review cards show proper information
- [ ] Case management cards render
- [ ] Action buttons are clickable
- [ ] Trend indicators show correct direction
- [ ] Weekly activity chart renders
- [ ] Sidebar badges update correctly

**Integration Testing:**
- [ ] Navigation between sections works
- [ ] Filter functionality (when implemented)
- [ ] Approve/Reject actions trigger correctly
- [ ] Case CRUD operations work
- [ ] Real-time updates (when implemented)

**Performance Testing:**
- [ ] Dashboard loads in < 2s
- [ ] Large lists are paginated
- [ ] Images lazy load
- [ ] No memory leaks with long sessions

## Accessibility

- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] ARIA labels for buttons
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader friendly
- [ ] Priority levels announced to screen readers

## Future Enhancements

### Short-term:
- [ ] Real-time notifications for new reviews
- [ ] Bulk approve/reject functionality
- [ ] Advanced filtering (date range, author, etc.)
- [ ] Export reports to PDF/Excel
- [ ] Case versioning system

### Long-term:
- [ ] AI-assisted review suggestions
- [ ] Collaborative review with multiple experts
- [ ] Automated quality checks
- [ ] Video annotation support
- [ ] Integration with PACS systems

## Performance Optimization

- Use React Query for caching reviews
- Implement virtual scrolling for large lists
- Lazy load images with Next.js Image
- Pagination for case library
- Debounce search/filter inputs

## Security Considerations

- Validate expert permissions server-side
- Sanitize user inputs in reviews
- Audit log for case approvals/rejections
- Rate limiting for API calls
- Secure file uploads for case images
