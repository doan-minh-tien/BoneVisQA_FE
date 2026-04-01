# Lecturer Dashboard - BoneVisQA

## Overview
Dashboard dành cho giảng viên/Course Coordinator với focus vào quản lý classes, assignments và theo dõi performance của sinh viên.

## Structure
```
lecturer/
├── dashboard/
│   └── page.tsx          # Main lecturer dashboard
├── layout.tsx            # Lecturer layout with sidebar
└── README.md             # This file
```

## Features Implemented

### 1. **Quick Statistics (4 cards)**
- **Total Students**: 184 students (+12 this semester)
- **Active Classes**: 3 classes (All on track)
- **Avg. Class Performance**: 87% (+5% improvement)
- **Completion Rate**: 92% (Above target)

### 2. **Action Buttons (Top Bar)**
- **New Assignment** (primary action - blue)
- **Send Announcement** (green)
- **View Analytics** (outline button)

### 3. **My Classes Section**
Grid display của active classes:
- **Class Info**:
  - Name + Code (e.g., ORTH-301)
  - Cohort (Year + Cohort year)
  - Status badge (Active/Upcoming/Completed)
- **Quick Stats**:
  - Student count
  - Completion rate
  - Cases assigned
- **Next Session**: Date + time của session tiếp theo

### 4. **Pending Assignments**
Detailed cards cho assignments:
- **Status**: Active/Overdue/Completed với color coding
- **Due Date**: Với countdown visual
- **Progress Bars**:
  - Submission Rate (xanh dương)
  - Grading Progress (xanh lá)
- **Quick Stats**: Graded count, Pending count
- **Class Association**: Hiển thị tên class

### 5. **Student Performance (Right Sidebar)**

#### **Top Performers Section**
- 3 top students
- Avatar initials
- Average score với trend arrows (↑↓)
- Progress bar (completed/total cases)
- Last activity timestamp
- Status: Excellent/Good/Needs-attention

#### **Needs Attention Section**
- Students có performance thấp
- Red border highlight
- Same info structure như Top Performers
- Quick access để follow up

### 6. **Recent Announcements**
- Timeline of recent announcements
- Priority indicators (high = red, normal = blue)
- Timestamp
- Quick preview

### 7. **Bottom Quick Stats (4 metrics)**
- **Sessions This Week**: 12
- **Student Questions**: 28
- **Pending Gradings**: 45
- **Performance Growth**: +8%

## Components Created

### `LecturerSidebar.tsx`
Navigation sidebar cho lecturer portal.

**Menu Items:**
- Dashboard
- My Classes (badge: 3)
- Assignments (badge: 8 pending)
- Schedule
- Analytics
- Student Q&A
- Announcements
- Reports
- Settings

### `ClassCard.tsx`
Card component cho class management.

**Props:**
```typescript
{
  id: string;
  name: string;
  code: string;
  cohort: string;
  studentCount: number;
  completionRate: number;
  nextSession: string;
  status: 'active' | 'upcoming' | 'completed';
}
```

**Features:**
- Status badges với colors
- 3-column stats grid
- Next session highlight (for active classes)
- Hover effects with border color change
- Link to class detail page

### `AssignmentCard.tsx`
Card component cho assignment tracking.

**Props:**
```typescript
{
  id: string;
  title: string;
  className: string;
  dueDate: string;
  totalStudents: number;
  submitted: number;
  graded: number;
  status: 'active' | 'overdue' | 'completed';
}
```

**Features:**
- Dual progress bars (submission + grading)
- Status color coding
- Due date with clock icon
- Quick action indicators
- Auto-calculated percentages

### `StudentPerformanceCard.tsx`
Compact card cho student performance tracking.

**Props:**
```typescript
{
  studentName: string;
  studentId: string;
  averageScore: number;
  trend: 'up' | 'down' | 'stable';
  completedCases: number;
  totalCases: number;
  lastActivity: string;
  status: 'excellent' | 'good' | 'needs-attention';
}
```

**Features:**
- Avatar with initials
- Trend indicators
- Status icons (Award/TrendingUp/AlertTriangle)
- Progress bar
- Last activity tracking

## Design Patterns

### Status System
```typescript
Classes:
- Active: Green badge
- Upcoming: Yellow badge
- Completed: Gray badge

Assignments:
- Active: Blue background
- Overdue: Red background
- Completed: Green background

Students:
- Excellent: Green + Award icon
- Good: Blue + TrendingUp icon
- Needs-attention: Red + AlertTriangle icon
```

### Color Coding Strategy
- **Primary (Blue)**: Normal actions, general info
- **Success (Green)**: Positive metrics, completions
- **Warning (Yellow)**: Attention needed, upcoming
- **Destructive (Red)**: Overdue, urgent, problems
- **Accent (Teal)**: Secondary actions, highlights

## Mock Data Structure

### Active Classes (3 classes)
```typescript
{
  ORTH-301: 68 students, 87% completion
  RAD-205: 72 students, 92% completion
  CLIN-401: 44 students, 95% completion
}
```

### Pending Assignments (3 assignments)
```typescript
{
  Complex Tibial Fractures: 52/68 submitted, 28 graded
  Knee Osteoarthritis Quiz: 45/72 submitted, all graded
  X-ray Interpretation: 8/44 submitted (OVERDUE)
}
```

### Student Performance
- Top 3 performers (90%+)
- 2 students needing attention (60-70%)

## Workflows

### Class Management Workflow
```
1. View all classes in dashboard
2. Click class card → Class detail page
3. View student list + performance
4. Assign new cases/quizzes
5. Track completion rates
6. Send announcements to class
```

### Assignment Workflow
```
1. Create new assignment
2. Assign to class(es)
3. Set due date
4. Monitor submission rate
5. Grade submissions
6. View analytics
7. Send feedback
```

### Student Monitoring Workflow
```
1. View performance cards
2. Identify struggling students
3. Click to view detailed profile
4. Review activity history
5. Intervene with messages/meetings
6. Track improvement over time
```

## Routes to Create

```
/lecturer/dashboard            ✅ Done
/lecturer/classes             ⏳ Todo - All classes list
/lecturer/classes/[id]        ⏳ Todo - Class detail + roster
/lecturer/assignments         ⏳ Todo - All assignments
/lecturer/assignments/[id]    ⏳ Todo - Assignment detail + grading
/lecturer/assignments/new     ⏳ Todo - Create assignment
/lecturer/schedule            ⏳ Todo - Calendar view
/lecturer/analytics           ⏳ Todo - Detailed analytics
/lecturer/qa                  ⏳ Todo - Student questions
/lecturer/announcements       ⏳ Todo - Announcement management
/lecturer/reports             ⏳ Todo - Export reports
/lecturer/settings            ⏳ Todo - Settings
```

## API Endpoints Needed

```typescript
// Stats
GET /api/lecturer/stats
GET /api/lecturer/overview

// Classes
GET /api/lecturer/classes
GET /api/lecturer/classes/:id
POST /api/lecturer/classes
PUT /api/lecturer/classes/:id
GET /api/lecturer/classes/:id/students
POST /api/lecturer/classes/:id/assign

// Assignments
GET /api/lecturer/assignments
GET /api/lecturer/assignments/:id
POST /api/lecturer/assignments
PUT /api/lecturer/assignments/:id
POST /api/lecturer/assignments/:id/grade

// Students
GET /api/lecturer/students
GET /api/lecturer/students/:id/performance
GET /api/lecturer/students/top-performers
GET /api/lecturer/students/needs-attention

// Announcements
GET /api/lecturer/announcements
POST /api/lecturer/announcements
PUT /api/lecturer/announcements/:id

// Analytics
GET /api/lecturer/analytics/class/:id
GET /api/lecturer/analytics/student/:id
GET /api/lecturer/analytics/overview
```

## Role-Based Permissions

**Lecturer Can:**
- ✅ View assigned classes
- ✅ Create/Edit assignments
- ✅ Grade student submissions
- ✅ Send announcements to classes
- ✅ View student performance
- ✅ Export reports
- ✅ Schedule sessions
- ❌ Add/Delete cases (Expert only)
- ❌ Manage user accounts (Admin only)
- ❌ Edit knowledge base (Admin only)

## Key Features vs Other Roles

| Feature | Student | Expert | Lecturer |
|---------|---------|--------|----------|
| **View Cases** | ✅ Learn | ✅ Manage | ✅ Assign |
| **Q&A** | ✅ Ask | ✅ Review | ✅ Monitor |
| **Assignments** | ✅ Submit | ❌ | ✅ Create/Grade |
| **Classes** | ✅ Join | ❌ | ✅ Manage |
| **Analytics** | Personal | System-wide | Class-focused |

## Testing Checklist

**Functional:**
- [ ] Dashboard loads with correct stats
- [ ] Class cards display properly
- [ ] Assignment cards show progress bars
- [ ] Student performance cards render
- [ ] Action buttons are clickable
- [ ] Status badges show correct colors
- [ ] Progress calculations are accurate

**Data Accuracy:**
- [ ] Submission rates calculate correctly
- [ ] Grading progress is accurate
- [ ] Completion rates match data
- [ ] Trend indicators show correctly

**Interaction:**
- [ ] Links navigate to correct pages
- [ ] Hover effects work smoothly
- [ ] Cards are clickable
- [ ] Sidebar navigation works

## Future Enhancements

### Short-term:
- [ ] Bulk grading interface
- [ ] Email integration for announcements
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Export class roster to Excel
- [ ] Assignment templates
- [ ] Auto-grading for quizzes

### Long-term:
- [ ] AI-powered student performance predictions
- [ ] Automated feedback generation
- [ ] Video lecture integration
- [ ] Attendance tracking
- [ ] Collaborative grading with TAs
- [ ] Mobile app for quick grading

## Performance Optimization

- Pagination for large class rosters
- Virtual scrolling for assignment lists
- Lazy load student performance data
- Cache class statistics
- Optimize chart rendering
- Debounce search/filter inputs

## Accessibility

- Keyboard navigation for all interactions
- ARIA labels for progress bars
- Screen reader friendly tables
- High contrast mode support
- Focus indicators on all interactive elements

## Integration Points

**With Student Portal:**
- Assignments appear in student dashboard
- Announcements notify students
- Grades sync to student progress

**With Expert Portal:**
- Use cases created by experts
- Reference expert Q&A reviews

**With Admin:**
- Class creation/deletion needs admin approval
- User enrollment managed by admin
