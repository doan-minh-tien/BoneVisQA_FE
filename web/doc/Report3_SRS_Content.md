# Report 3 - Software Requirement Specification
## BoneVisQA - Interactive Visual Question Answering System for Bone Diseases

> **Note**: Copy content below into Report3_Software Requirement Specification.docx template.

---

## I. Record of Changes

| Date       | A/M/D | In charge        | Change Description                                    |
|------------|-------|------------------|-------------------------------------------------------|
| 2026-01-15 | A     | Team SP26SE110   | Initial SRS document created                          |
| 2026-02-01 | M     | Team SP26SE110   | Updated use cases and actor descriptions              |
| 2026-02-15 | A     | Team SP26SE110   | Added screen flows and screen descriptions            |
| 2026-03-01 | M     | Team SP26SE110   | Updated functional requirements and screen mockups    |
| 2026-03-04 | M     | Team SP26SE110   | Finalized non-functional requirements and appendix    |

*A - Added, M - Modified, D - Deleted

---

## II. Software Requirement Specification

### 1. Product Overview

**BoneVisQA** (Bone Visual Question Answering) is an interactive multi-platform system designed to support medical students in learning about bone and joint diseases through visual question answering. The system combines AI-based medical image processing with Retrieval-Augmented Generation (RAG) over a curated bone disease knowledge base, enabling students to ask questions about X-ray, CT, and MRI images and receive structured, source-cited answers.

The system serves as a comprehensive educational platform where:
- **Medical students** can study curated bone/joint cases, ask AI-powered questions by topic or by uploading medical images, take quizzes, and track learning progress.
- **Clinical experts** review and approve cases, validate AI-generated answers, and create quiz content.
- **Lecturers** manage classes, assign cases and quizzes, and monitor student performance.
- **Content curators** manage the knowledge base documents, control the RAG indexing pipeline, and ensure content quality.
- **System administrators** manage user accounts, configure system settings, and monitor platform health.

**Context Diagram:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        External Entities                            │
├──────────┬──────────┬──────────┬──────────────┬────────────────────┤
│ Medical  │ Clinical │ Lecturer │ Content      │ System             │
│ Student  │ Expert   │          │ Curator      │ Administrator      │
└────┬─────┴────┬─────┴────┬─────┴──────┬───────┴────────┬───────────┘
     │          │          │            │                │
     ▼          ▼          ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BoneVisQA System                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Web Client   │  │ Mobile Client │  │    API Gateway           │  │
│  │  (Next.js)    │  │ (React Native)│  │    (REST APIs)           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                  │
│         ▼                 ▼                      ▼                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Backend Services                                │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │ Auth & User  │  │ Case & Quiz  │  │ AI Module        │   │   │
│  │  │ Management   │  │ Management   │  │ (Image + RAG)    │   │   │
│  │  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │   │
│  │         │                │                    │              │   │
│  │         ▼                ▼                    ▼              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  Data Layer: PostgreSQL │ Vector DB (FAISS/Chroma)   │   │   │
│  │  │  File Storage │ Knowledge Base Documents             │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 2. User Requirements

#### 2.1 Actors

| # | Actor | Description |
|---|-------|-------------|
| 1 | Medical Student | Medical students who use the platform to study bone/joint disease cases, ask AI-powered questions (by topic or by image upload), take quizzes, and track their learning progress. They access the system via both web and mobile interfaces. |
| 2 | Clinical Expert / Reviewer | Licensed clinicians or radiologists who review and validate cases, assess AI-generated answers for clinical accuracy, approve content, create quiz sets, and provide expert annotations on medical images. |
| 3 | Lecturer / Course Coordinator | University lecturers or course coordinators who manage classes, assign case sets and quizzes to student groups, monitor learning outcomes, and send announcements. They use the web portal exclusively. |
| 4 | Content Curator / Knowledge Base Manager | Personnel responsible for managing the knowledge base documents used by the RAG module. They upload, organize, tag, and version documents, control the embedding/indexing pipeline, and ensure content quality. |
| 5 | System Administrator | Technical administrators who manage user accounts across all roles, configure system parameters (AI thresholds, system settings), monitor system health, logs, and platform statistics. |

#### 2.2 Use Cases

##### 2.2.1 Diagram(s)

**Use Case Diagram - Student Portal:**
```
                        ┌─────────────────────────────────────┐
                        │          BoneVisQA System            │
                        │                                      │
  ┌──────────┐         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-01: Register / Login       │    │
  │          │         │  └─────────────────────────────┘    │
  │          │         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-02: View/Update Profile    │    │
  │          │         │  └─────────────────────────────┘    │
  │          │         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-03: Browse Case Library    │    │
  │ Medical  │         │  └─────────────────────────────┘    │
  │ Student  │         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-04: View Case Details      │    │
  │          │         │  └─────────────────────────────┘    │
  │          │         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-05: AI Q&A by Topic (RAG)  │    │
  │          │         │  └─────────────────────────────┘    │
  │          │         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-06: AI Q&A by Image Upload │    │
  │          │         │  └─────────────────────────────┘    │
  │          │         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-07: Take Quiz              │    │
  │          │         │  └─────────────────────────────┘    │
  │          │         │  ┌─────────────────────────────┐    │
  │          │─────────│──│ UC-08: View Dashboard/Progress│    │
  │          │         │  └─────────────────────────────┘    │
  └──────────┘         │                                      │
                        └─────────────────────────────────────┘
```

**Use Case Diagram - Expert Portal:**
```
                        ┌─────────────────────────────────────┐
                        │          BoneVisQA System            │
  ┌──────────┐         │                                      │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-09: Manage Case Library    │    │
  │ Clinical │         │  └─────────────────────────────┘    │
  │ Expert   │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-10: Review AI Answers      │    │
  │          │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-11: Create/Manage Quizzes  │    │
  └──────────┘         │  └─────────────────────────────┘    │
                        └─────────────────────────────────────┘
```

**Use Case Diagram - Lecturer Portal:**
```
                        ┌─────────────────────────────────────┐
                        │          BoneVisQA System            │
  ┌──────────┐         │                                      │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-12: Manage Classes         │    │
  │ Lecturer │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-13: Assign Cases/Quizzes   │    │
  │          │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-14: Monitor Student Progress│    │
  │          │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-15: Send Announcements     │    │
  └──────────┘         │  └─────────────────────────────┘    │
                        └─────────────────────────────────────┘
```

**Use Case Diagram - Curator Portal:**
```
                        ┌─────────────────────────────────────┐
                        │          BoneVisQA System            │
  ┌──────────┐         │                                      │
  │          │─────────│──┌─────────────────────────────┐    │
  │ Content  │         │  │ UC-16: Manage KB Documents    │    │
  │ Curator  │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-17: Control RAG Pipeline   │    │
  │          │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-18: Monitor Content Quality│    │
  └──────────┘         │  └─────────────────────────────┘    │
                        └─────────────────────────────────────┘
```

**Use Case Diagram - Admin Portal:**
```
                        ┌─────────────────────────────────────┐
                        │          BoneVisQA System            │
  ┌──────────┐         │                                      │
  │          │─────────│──┌─────────────────────────────┐    │
  │ System   │         │  │ UC-19: Manage User Accounts   │    │
  │ Admin    │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-20: Configure System       │    │
  │          │         │  └─────────────────────────────┘    │
  │          │─────────│──┌─────────────────────────────┐    │
  │          │         │  │ UC-21: Monitor System Health  │    │
  └──────────┘         │  └─────────────────────────────┘    │
                        └─────────────────────────────────────┘
```

##### 2.2.2 Descriptions

| ID | Use Case | Actors | Use Case Description |
|----|----------|--------|---------------------|
| UC-01 | Register / Login | All roles | Users register with email, school info (students), and credentials. Login authenticates via email + password and redirects to the role-appropriate dashboard. Supports "Remember me" and "Forgot password" flows. |
| UC-02 | View/Update Profile | Medical Student | Student views and edits personal information (name, phone, DOB, gender) and academic info (student ID, university, faculty, cohort). Avatar upload supported. |
| UC-03 | Browse Case Library | Medical Student | Student browses curated bone/joint cases with filters by bone location (Upper Limb, Lower Limb, Spine, Pelvis), lesion type (Fracture, Degenerative, Tumor, Dislocation), difficulty level (Basic, Intermediate, Advanced), search by title/keyword, and sort options. Displays cases in a grid with thumbnails, progress bars, and metadata. |
| UC-04 | View Case Details | Medical Student | Student opens a specific case to view medical images (X-ray/CT/MRI) with zoom/pan, case description, diagnosis, key imaging signs, and related references. Can annotate regions of interest on images. |
| UC-05 | AI Q&A by Topic (RAG) | Medical Student | Student selects a bone/joint topic from categorized list (Upper Extremity, Lower Extremity, Axial Skeleton, Other), then enters a chatbot interface to ask free-form questions. The system uses RAG to retrieve relevant documents from the knowledge base, generates structured answers with cited sources, suggested diagnosis, differential diagnoses, and key imaging signs. |
| UC-06 | AI Q&A by Image Upload | Medical Student | Student uploads X-ray, CT, MRI, or DICOM images. The AI module analyzes the image, extracts features, identifies regions of interest, and generates a structured report. Student can then ask follow-up questions about the uploaded image in a chatbot interface. |
| UC-07 | Take Quiz | Medical Student | Student takes quizzes filtered by difficulty level. Quizzes consist of multiple-choice questions with bone images. After completion, student views score, correct/wrong breakdown, and explanations. Student can retry completed quizzes. |
| UC-08 | View Dashboard/Progress | Medical Student | Student views overview dashboard with stats (cases studied, quiz scores, study streak, accuracy rate), quick actions, progress by topic, recent activity, and learning insights. |
| UC-09 | Manage Case Library | Clinical Expert | Expert adds new cases (images + description + diagnosis + key learning points), tags cases by specialty/location/type/difficulty, and approves or hides cases pending review. |
| UC-10 | Review AI Answers | Clinical Expert | Expert reviews student questions and AI-generated answers, assesses clinical accuracy, edits/upgrades answers, adds clinical notes, and marks approved content. |
| UC-11 | Create/Manage Quizzes | Clinical Expert | Expert creates quiz sets with scoring criteria, proposes topic-based quizzes, and defines correct answers with explanations. |
| UC-12 | Manage Classes | Lecturer | Lecturer creates classes (e.g., "Orthopedics - Class A - Cohort 2023"), assigns students, and imports class lists from files. |
| UC-13 | Assign Cases/Quizzes | Lecturer | Lecturer assigns case sets and configures quiz sessions (topic, number of questions, open/close time) for classes or student groups. |
| UC-14 | Monitor Student Progress | Lecturer | Lecturer views statistics by class/group/individual: cases studied, quiz scores by topic, common interpretation errors. Can export reports. |
| UC-15 | Send Announcements | Lecturer | Lecturer sends announcements about new cases, quizzes, or required tasks to students via the platform. |
| UC-16 | Manage KB Documents | Content Curator | Curator uploads, updates, organizes, and tags knowledge base documents (guidelines, textbooks, teaching materials). Manages document versions and marks outdated content. |
| UC-17 | Control RAG Pipeline | Content Curator | Curator triggers embedding generation and re-indexing when documents change. Views indexing logs, handles errors, and adjusts chunking strategies. |
| UC-18 | Monitor Content Quality | Content Curator | Curator monitors which documents are frequently retrieved, detects low-quality or outdated content, and flags items for expert/lecturer review. |
| UC-19 | Manage User Accounts | System Administrator | Admin views users by role, activates/deactivates accounts, assigns/revokes roles. Manages bulk user operations. |
| UC-20 | Configure System | System Administrator | Admin configures AI confidence thresholds, system parameters, and manages case data privacy/anonymization requirements. |
| UC-21 | Monitor System Health | System Administrator | Admin monitors system logs, usage statistics (questions asked, case views, load), error tracking, and platform performance metrics. |

---

### 3. Functional Requirements

#### 3.1 System Functional Overview

##### 3.1.1 Screens Flow

**Login Flow:**
```
[Login Page] ──── (authenticate) ────► [Role Dashboard]
     │                                    │
     ├── Student ──► [Student Dashboard]  │
     ├── Lecturer ──► [Lecturer Dashboard]│
     ├── Expert ──► [Expert Dashboard]    │
     ├── Curator ──► [Curator Dashboard]  │
     └── Admin ──► [Admin Dashboard]      │
```

**Student Portal Screen Flow:**
```
[Student Dashboard]
    │
    ├──► [Case Library] ──► [Case Detail] ──► [Image Viewer + Annotations]
    │
    ├──► [AI Q&A Landing]
    │       ├──► [Q&A by Topic] ──► [Topic Selection] ──► [Topic Chatbot]
    │       └──► [Q&A by Image] ──► [Image Upload Chatbot]
    │
    ├──► [Quizzes List]
    │       ├──► [Start Quiz] ──► [Quiz Session] ──► [Quiz Results]
    │       └──► [Retry Quiz]
    │
    ├──► [Profile] ──► [Edit Profile]
    │
    └──► [Settings]
```

**Expert Portal Screen Flow:**
```
[Expert Dashboard]
    │
    ├──► [Case Management] ──► [Add/Edit Case] ──► [Image Upload + Tag]
    │
    ├──► [Review Center]
    │       ├──► [Student Questions List] ──► [Review Answer Detail]
    │       └──► [Approve/Edit Answer]
    │
    ├──► [Quiz Management] ──► [Create/Edit Quiz] ──► [Add Questions]
    │
    └──► [Settings]
```

**Lecturer Portal Screen Flow:**
```
[Lecturer Dashboard]
    │
    ├──► [Class Management]
    │       ├──► [Create Class]
    │       ├──► [Class Detail] ──► [Student List]
    │       └──► [Import Students]
    │
    ├──► [Assignments]
    │       ├──► [Assign Cases]
    │       └──► [Configure Quiz Session]
    │
    ├──► [Student Reports]
    │       ├──► [Class Statistics]
    │       ├──► [Individual Student Report]
    │       └──► [Export Report]
    │
    └──► [Announcements] ──► [Create Announcement]
```

**Curator Portal Screen Flow:**
```
[Curator Dashboard]
    │
    ├──► [Document Management]
    │       ├──► [Upload Document]
    │       ├──► [Edit/Tag Document]
    │       └──► [Version History]
    │
    ├──► [Indexing Pipeline]
    │       ├──► [Trigger Re-index]
    │       ├──► [Indexing Logs]
    │       └──► [Chunking Settings]
    │
    └──► [Content Quality]
            ├──► [Retrieval Statistics]
            └──► [Flag for Review]
```

**Admin Portal Screen Flow:**
```
[Admin Dashboard]
    │
    ├──► [User Management]
    │       ├──► [User List (by role)]
    │       ├──► [User Detail] ──► [Activate/Deactivate]
    │       └──► [Role Assignment]
    │
    ├──► [Case Data Management]
    │       ├──► [All Cases] ──► [Approve/Hide Case]
    │       └──► [Data Privacy Settings]
    │
    ├──► [System Configuration]
    │       ├──► [AI Thresholds]
    │       └──► [Technical Parameters]
    │
    ├──► [System Monitoring]
    │       ├──► [Activity Logs]
    │       ├──► [Error Tracking]
    │       └──► [Usage Statistics]
    │
    └──► [Reports & Analytics]
```

##### 3.1.2 Screen Descriptions

| # | Feature | Screen | Description |
|---|---------|--------|-------------|
| 1 | Authentication | Login Page | Central login screen with email/password form, "Remember me" checkbox, "Forgot password" link, and demo account quick-login buttons for 5 roles. Redirects to role-specific dashboard upon successful authentication. |
| 2 | Student - Dashboard | Student Dashboard | Overview page showing 4 stat cards (Cases Studied, Quiz Score, Study Streak, Accuracy Rate), quick actions (AI Q&A by Topic, AI Q&A by Image, Quick Quiz, View Schedule), continue learning section with recent case cards, overall progress ring, progress by topic bars, and recent activity feed. |
| 3 | Student - Case Library | Case Library | Grid view of curated bone/joint cases with search bar, difficulty filter pills (All/Basic/Intermediate/Advanced), region filter (All/Upper Limb/Lower Limb/Spine/Pelvis), sort options (Recommended/Difficulty/Duration/Progress). Each case card shows thumbnail, title, bone location tag, lesion type tag, difficulty badge, duration, and progress bar. |
| 4 | Student - AI Q&A Landing | AI Q&A Selection | Landing page with two mode cards: "Q&A by Topic" (topic-based RAG chatbot) and "Q&A by Image" (image upload analysis chatbot). Each card has description and navigation link. |
| 5 | Student - Topic Selection | Topic Selection | Categorized topic list organized into 4 groups: Upper Extremity (Shoulder, Elbow, Wrist, Hand), Lower Extremity (Hip, Knee, Ankle, Foot), Axial Skeleton (Cervical Spine, Thoracic Spine, Lumbar Spine, Pelvis), Other (Skull & Face, Ribs & Sternum, Long Bone Fractures, Bone Tumors). Includes search/filter functionality. |
| 6 | Student - Topic Chatbot | Topic Q&A Chat | Chatbot interface with conversation history. User messages appear right-aligned (blue), AI responses left-aligned (white card with border). AI responses include structured answers with references (BookOpen icon). Header shows topic name and back button. Loading state shows "Analyzing with knowledge base..." spinner. |
| 7 | Student - Image Chatbot | Image Q&A Chat | Chatbot interface with image upload capability. Upload button opens file picker (JPEG, PNG, WebP, DICOM). Image preview strip shown before sending. Uploaded images displayed inline in chat. AI provides structured image analysis (assessment, findings, diagnosis, recommendations). Follow-up questions supported. |
| 8 | Student - Quizzes | Quizzes List | Summary stats (Total Quizzes, Completed, Not Started, Avg Score). Tabs: All Quizzes / Not Started / Completed. Difficulty filter dropdown. Completed quizzes show score (color-coded: green >=80%, yellow >=60%, red <60%), correct/wrong counts with check/X icons, and Retry button. Not-started quizzes show Start Quiz button. |
| 9 | Student - Profile | Student Profile | Personal info form (First Name, Last Name, Email (disabled), Phone, DOB, Gender dropdown). Academic info section (read-only: Student ID, University, Faculty, Cohort). Avatar with camera button for upload. Save button with success message. |
| 10 | Expert - Dashboard | Expert Dashboard | Overview page with stats (Cases to Review, Pending Answers, Approved Cases, Active Quizzes). Quick stats, recent review requests, and case management cards. |
| 11 | Lecturer - Dashboard | Lecturer Dashboard | Overview page with stats (Total Classes, Active Students, Assignments, Avg Performance). Class cards, assignment cards, and student performance summaries. |
| 12 | Curator - Dashboard | Curator Dashboard | Overview page with stats (Total Documents, Pending Index, Active Topics, Retrieval Rate). Document cards, indexing job status, and content quality metrics. |
| 13 | Admin - Dashboard | Admin Dashboard | Overview page with stats (Total Users: 3,156; Students: 2,847; Lecturers: 156; Active Courses: 48). Recent users table, user distribution by role bar chart, system activity feed, platform stats, and bottom stats row (Uptime, Completion Rate, AI Rating, Certificates). |

##### 3.1.3 Screen Authorization

| Screen | Student | Expert | Lecturer | Curator | Admin |
|--------|---------|--------|----------|---------|-------|
| Login Page | X | X | X | X | X |
| Student Dashboard | X | | | | |
| Case Library (Browse) | X | | | | |
| Case Detail (View) | X | | | | |
| AI Q&A by Topic | X | | | | |
| AI Q&A by Image | X | | | | |
| Quizzes (Take) | X | | | | |
| Student Profile | X | | | | |
| Student Settings | X | | | | |
| Expert Dashboard | | X | | | |
| Case Management (CRUD) | | X | | | |
| Review AI Answers | | X | | | |
| Quiz Management (CRUD) | | X | | | |
| Expert Settings | | X | | | |
| Lecturer Dashboard | | | X | | |
| Class Management | | | X | | |
| Assign Cases/Quizzes | | | X | | |
| Student Reports | | | X | | |
| Announcements | | | X | | |
| Lecturer Settings | | | X | | |
| Curator Dashboard | | | | X | |
| Document Management | | | | X | |
| Indexing Pipeline | | | | X | |
| Content Quality Monitor | | | | X | |
| Curator Settings | | | | X | |
| Admin Dashboard | | | | | X |
| User Management | | | | | X |
| Case Data Management | | | | | X |
| System Configuration | | | | | X |
| System Monitoring | | | | | X |
| Reports & Analytics | | | | | X |

##### 3.1.4 Non-Screen Functions

| # | Feature | System Function | Description |
|---|---------|----------------|-------------|
| 1 | AI Module | Image Feature Extraction | Background service that processes uploaded medical images (X-ray/CT/MRI), detects regions suspected of containing lesions, and extracts image features for retrieval and RAG enhancement. Runs on Python FastAPI. |
| 2 | AI Module | RAG Query Processing | When a student submits a question, the system combines question embedding and image features (if applicable) to retrieve relevant documents from the vector database, then uses an LLM to generate structured answers with citations. |
| 3 | AI Module | Embedding Generation | Batch process that encodes text segments and case descriptions from the knowledge base into vector embeddings stored in FAISS/Chroma. Triggered by Content Curator when documents are added/updated. |
| 4 | Knowledge Base | Document Indexing Pipeline | Automated pipeline that chunks documents, generates embeddings, and indexes them in the vector database. Includes logging, error handling, and configurable chunking strategies. |
| 5 | Notification | Push Notification Service | Sends notifications to students about new cases, quizzes, announcements from lecturers, and learning task reminders. Supports both web and mobile push. |
| 6 | Reporting | Report Generation | Scheduled and on-demand generation of learning reports for lecturers, including student statistics, quiz scores by topic, and common interpretation errors. Exportable to PDF/Excel. |
| 7 | Authentication | JWT Token Management | REST API service for user authentication, token issuance, refresh, and role-based authorization middleware. |
| 8 | Data | Image Anonymization | Service ensuring medical images meet anonymization and privacy requirements before storage and display. Strips DICOM metadata containing patient identifiers. |

##### 3.1.5 Entity Relationship Diagram

**Main Entities:**

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│   User   │────<│ UserRole   │>────│    Role      │
│          │     │            │     │              │
└──────────┘     └───────────┘     └──────────────┘
     │
     │           ┌───────────┐     ┌──────────────┐
     ├──────────<│StudentCase│>────│    Case      │
     │           │ Progress   │     │              │
     │           └───────────┘     └──────────────┘
     │                                   │
     │           ┌───────────┐           │
     ├──────────<│  QASession │>──────────┘
     │           │            │
     │           └───────────┘     ┌──────────────┐
     │                │            │  CaseImage   │
     │                │            └──────────────┘
     │           ┌───────────┐            │
     │           │  Message   │            │
     │           │            │     ┌──────────────┐
     │           └───────────┘     │  Annotation  │
     │                             └──────────────┘
     │           ┌───────────┐
     ├──────────<│ QuizAttempt│>────┐
     │           └───────────┘     │
     │                │            │
     │           ┌───────────┐     │  ┌──────────────┐
     │           │AttemptAnswer│    ├──│    Quiz      │
     │           └───────────┘     │  └──────────────┘
     │                             │       │
     │                             │  ┌──────────────┐
     │                             └──│ QuizQuestion │
     │                                └──────────────┘
     │
     │           ┌───────────┐     ┌──────────────┐
     ├──────────<│ClassMember │>────│    Class     │
     │           └───────────┘     └──────────────┘
     │
     │           ┌───────────────┐
     └──────────<│ KBDocument    │
                 │               │
                 └───────────────┘
                        │
                 ┌───────────────┐
                 │DocumentChunk  │
                 │ (Embeddings)  │
                 └───────────────┘
```

**Entities Description:**

| # | Entity | Description |
|---|--------|-------------|
| 1 | User | Stores user account information: id, email, password_hash, first_name, last_name, phone, dob, gender, avatar_url, status (active/inactive), created_at, updated_at. |
| 2 | Role | System roles: Student, Expert, Lecturer, Curator, Admin. Fields: id, name, description. |
| 3 | UserRole | Junction table for user-role assignment (many-to-many). Fields: user_id, role_id, assigned_at. |
| 4 | Case | Bone/joint clinical case: id, title, description, diagnosis, key_findings, bone_location, lesion_type, difficulty (basic/intermediate/advanced), duration_minutes, status (draft/published/archived), created_by (Expert), approved_by, created_at. |
| 5 | CaseImage | Medical images for a case: id, case_id, image_url, image_type (xray/ct/mri), description, display_order. |
| 6 | Annotation | User annotations on case images: id, case_image_id, user_id, region_data (JSON coordinates), note, created_at. |
| 7 | StudentCaseProgress | Tracks student progress on cases: id, user_id, case_id, progress_percentage, last_accessed_at, completed_at. |
| 8 | QASession | AI Q&A conversation session: id, user_id, session_type (topic/image), topic_id (nullable), created_at. |
| 9 | Message | Individual messages within a Q&A session: id, session_id, role (user/assistant), content, image_url (for image uploads), references (JSON array of citations), created_at. |
| 10 | Quiz | Quiz definition: id, title, topic, difficulty, total_questions, duration_minutes, created_by (Expert), status (active/inactive), created_at. |
| 11 | QuizQuestion | Individual quiz questions: id, quiz_id, question_text, image_url, options (JSON array), correct_answer, explanation, order_index. |
| 12 | QuizAttempt | Student's quiz attempt: id, user_id, quiz_id, score, correct_count, wrong_count, started_at, completed_at. |
| 13 | AttemptAnswer | Student's answers in a quiz attempt: id, attempt_id, question_id, selected_answer, is_correct. |
| 14 | Class | Lecturer's class/course: id, name, description, lecturer_id, semester, created_at. |
| 15 | ClassMember | Students assigned to a class: id, class_id, user_id, enrolled_at. |
| 16 | KBDocument | Knowledge base document: id, title, content, topic, tags (array), version, status (active/outdated), uploaded_by, created_at, updated_at. |
| 17 | DocumentChunk | Chunked and embedded segments for RAG: id, document_id, chunk_text, embedding_vector, chunk_index, created_at. |
| 18 | Announcement | Lecturer announcements: id, class_id, lecturer_id, title, content, created_at. |

---

#### 3.2 Authentication & User Management

##### 3.2.1 Login

- **Function trigger**: User navigates to `/login` (root `/` redirects to `/login`).
- **Function description**: All roles authenticate via email + password. The system matches credentials against the database, issues a JWT token, and redirects to the role-appropriate dashboard (`/student/dashboard`, `/lecturer/dashboard`, `/expert/dashboard`, `/curator/dashboard`, `/admin/dashboard`).
- **Screen layout**: Centered card with BoneVisQA logo (Stethoscope icon), email input, password input with show/hide toggle, "Remember me" checkbox, "Forgot password" link, Sign In button. Below: Demo Accounts section with quick-login buttons for all 5 roles.
- **Function Details**:
  - Email field: Required, email format validation.
  - Password field: Required, minimum 6 characters, show/hide toggle (Eye/EyeOff icons).
  - On submit: POST `/api/auth/login` with `{ email, password }`. Returns `{ token, user, role }`.
  - Error: "Invalid email or password" message displayed in red banner.
  - Success: Store JWT token, redirect to `/{role}/dashboard`.
  - Demo mode: Quick-login buttons bypass form, directly authenticate with preset credentials.

##### 3.2.2 Student Profile

- **Function trigger**: Student navigates to `/student/profile` from sidebar menu.
- **Function description**: Student views and edits personal information and academic details.
- **Screen layout**: Left side: Avatar circle with camera upload button. Right side: Two-column form with personal info (First Name, Last Name, Email (disabled), Phone, DOB, Gender) and academic info (Student ID, University, Faculty, Cohort - all read-only). Save Changes button at bottom.
- **Function Details**:
  - First Name, Last Name: Required, max 50 characters.
  - Email: Displayed but disabled (cannot change).
  - Phone: Optional, format validation for Vietnamese phone numbers.
  - Date of Birth: Date picker input.
  - Gender: Dropdown (Male/Female/Other/Prefer not to say).
  - Academic info: Read-only fields populated from admin/enrollment system.
  - Save: PUT `/api/users/profile` with updated fields. Shows success toast "Profile updated successfully!".
  - Avatar: Click camera icon to upload image. Accepted formats: JPEG, PNG. Max 5MB.

---

#### 3.3 Student - Case Library

##### 3.3.1 Browse Case Library

- **Function trigger**: Student clicks "Case Library" in sidebar or navigates to `/student/cases`.
- **Function description**: Displays all published bone/joint cases in a responsive grid. Students can search, filter, and sort cases.
- **Screen layout**: Top bar with search input, filter/grid view buttons, and sort dropdown. Difficulty filter pills (All/Basic/Intermediate/Advanced). Region filter row (All regions/Upper Limb/Lower Limb/Spine/Pelvis). Results count. Grid of CaseCard components (1-4 columns responsive).
- **Function Details**:
  - Search: Filters cases by title, bone location, or lesion type (client-side for demo; API for production).
  - Difficulty filter: Highlights active pill. Filters cases by `difficulty` field.
  - Region filter: Highlights active button. Filters cases by `boneLocation` mapped to region.
  - Sort options: Recommended (default), Difficulty, Duration, Progress.
  - Case Card displays: Thumbnail placeholder (gradient with BookOpen icon), difficulty badge (top-right: green=Basic, yellow=Intermediate, red=Advanced), progress bar (bottom of thumbnail), title, bone location tag (primary color), lesion type tag (accent color), duration (Clock icon), progress percentage (TrendingUp icon).
  - Click card: Navigate to `/student/cases/{id}`.
  - Data: GET `/api/cases?status=published&page=1&limit=20`.

##### 3.3.2 View Case Detail

- **Function trigger**: Student clicks a case card in the Case Library.
- **Function description**: Displays the full case with medical images, description, diagnosis, and key findings.
- **Screen layout**: Header with back button and case title. Image viewer section with zoom/pan controls. Case information panel (description, diagnosis, key findings, differential diagnoses). References section.
- **Function Details**:
  - Image viewer: Displays case images (X-ray/CT/MRI) with zoom in/out and pan functionality.
  - Case info: Structured display of description, suggested diagnosis, key imaging signs, and differential diagnoses.
  - Progress tracking: Automatically updates `StudentCaseProgress` when student opens/reads the case.
  - Data: GET `/api/cases/{id}`.

---

#### 3.4 Student - AI Q&A

##### 3.4.1 AI Q&A Mode Selection

- **Function trigger**: Student clicks "AI Q&A" in sidebar or navigates to `/student/qa`.
- **Function description**: Landing page presenting two Q&A modes for the student to choose from.
- **Screen layout**: Two large cards side by side:
  1. "Q&A by Topic" card - Icon: BotMessageSquare, description about selecting a bone/joint topic and asking questions using RAG. Links to `/student/qa/topic`.
  2. "Q&A by Image" card - Icon: ImageIcon, description about uploading X-ray/CT/MRI images for AI analysis. Links to `/student/qa/image`.
- **Function Details**:
  - Navigation only - no API calls on this screen.
  - Cards have hover effect and clear visual distinction.

##### 3.4.2 Topic Selection

- **Function trigger**: Student clicks "Q&A by Topic" card on the AI Q&A landing page.
- **Function description**: Displays categorized bone/joint topics for the student to select before entering the chatbot.
- **Screen layout**: Header with back button. Search/filter input. Four category sections:
  - Upper Extremity: Shoulder, Elbow, Wrist & Hand
  - Lower Extremity: Hip, Knee, Ankle & Foot
  - Axial Skeleton: Cervical Spine, Thoracic Spine, Lumbar Spine, Pelvis
  - Other: Skull & Face, Ribs & Sternum, Long Bone Fractures, Bone Tumors
- **Function Details**:
  - Each topic card shows icon, name, and brief description.
  - Search filters topics by name (client-side).
  - Click topic: Navigate to `/student/qa/topic/{topicId}`.
  - Topics are pre-defined (not user-created) to ensure the RAG system can provide quality responses.

##### 3.4.3 Topic Q&A Chatbot

- **Function trigger**: Student selects a specific topic from the topic selection page.
- **Function description**: Chatbot interface where student asks questions about the selected bone/joint topic. AI generates answers using RAG from the knowledge base.
- **Screen layout**:
  - Header: Back button, topic name, "RAG-powered" badge.
  - Messages area: Scrollable conversation. AI messages (left, white card) with avatar (Bot icon), text with markdown formatting, and references section. User messages (right, blue) with avatar (User icon).
  - Input area: Text input + Send button. Enter to send, Shift+Enter for newline.
- **Function Details**:
  - Initial greeting: AI introduces itself for the specific topic (e.g., "Hi! I'm your assistant for Shoulder Joint questions...").
  - User message: POST `/api/qa/topic` with `{ topicId, message, sessionId }`.
  - AI response: Structured answer including diagnosis suggestions, key findings, differential diagnoses, and cited references from the knowledge base.
  - References: Displayed below AI message with BookOpen icon, title, and source.
  - Loading state: "Analyzing with knowledge base..." with spinner.
  - Session persistence: Conversation history maintained per session.

##### 3.4.4 Image Q&A Chatbot

- **Function trigger**: Student clicks "Q&A by Image" card on the AI Q&A landing page.
- **Function description**: Chatbot interface where student uploads medical images and asks questions about them. AI analyzes images and generates structured reports.
- **Screen layout**:
  - Header: Back button, "Image Q&A" title, "Image Analysis" badge.
  - Messages area: Same as topic chatbot, but with inline image display in user messages.
  - Upload preview strip: Shows uploaded image thumbnail, filename, "Ready to send" status, and remove (X) button.
  - Input area: Upload button (Upload icon) + text input + Send button.
- **Function Details**:
  - File upload: Accepts JPEG, PNG, WebP, DICOM (.dcm). Validation on file type.
  - Image preview: Shown in a strip above the input area before sending.
  - Send with image: POST `/api/qa/image` with `{ image (base64/multipart), message, sessionId }`.
  - AI image analysis response: Structured format - Initial Assessment (image type, region, quality), Key Findings (numbered list), Suggested Diagnosis, Recommendations.
  - Follow-up questions: Subsequent messages without new images use the context of the uploaded image.
  - Loading states: "Analyzing image..." (first upload) vs "Thinking..." (follow-up).

---

#### 3.5 Student - Quizzes

##### 3.5.1 Quizzes List

- **Function trigger**: Student clicks "Quizzes" in sidebar or navigates to `/student/quiz`.
- **Function description**: Displays all available quizzes with their completion status, scores, and filtering options.
- **Screen layout**:
  - Summary stats row: Total Quizzes, Completed (green), Not Started (yellow), Avg. Score (color-coded).
  - Tab bar: All Quizzes | Not Started | Completed.
  - Difficulty filter dropdown (All Levels/Basic/Intermediate/Advanced).
  - Quiz list (vertical cards).
- **Function Details**:
  - Each quiz card shows: Title, difficulty badge (color-coded), topic, question count (Trophy icon), duration (Clock icon), completion date (if applicable).
  - Completed quizzes additionally show: Score percentage (large, color-coded: green >=80%, yellow >=60%, red <60%), correct count (CheckCircle green), wrong count (XCircle red), Retry button.
  - Not started quizzes show: "Start Quiz" button (blue, primary).
  - Tabs filter by status. Difficulty dropdown filters by difficulty level.
  - Empty state: Trophy icon with "No quizzes found" message.
  - Data: GET `/api/quizzes?status={tab}&difficulty={filter}`.
  - Click Start/Retry: Navigate to `/student/quiz/{id}`.

##### 3.5.2 Take Quiz

- **Function trigger**: Student clicks "Start Quiz" or "Retry" on a quiz card.
- **Function description**: Interactive quiz session with questions, images, and timer.
- **Screen layout**: Question header with progress bar. Question text and image (if applicable). Multiple-choice options. Navigation buttons (Previous/Next/Submit).
- **Function Details**:
  - Timer: Countdown based on quiz duration.
  - Questions: Display one at a time with image (if any) and 4 options.
  - Answer selection: Click to select, click again to deselect.
  - Navigation: Previous/Next buttons. Progress indicator (e.g., "Question 3 of 10").
  - Submit: Confirm dialog before submission. POST `/api/quizzes/{id}/submit` with `{ answers: [{questionId, selectedAnswer}] }`.
  - Results: Score, correct/wrong breakdown, review each question with correct answer and explanation.

---

#### 3.6 Expert - Case Management

##### 3.6.1 Manage Cases

- **Function trigger**: Expert navigates to Case Management from sidebar.
- **Function description**: Expert can add, edit, tag, and approve bone/joint cases in the case library.
- **Function Details**:
  - Add Case: Form with title, description, diagnosis, key findings, bone location (dropdown), lesion type (dropdown), difficulty level, image upload (multiple).
  - Tag Cases: Assign specialty tags, bone location, lesion type, difficulty level.
  - Approve/Hide: Toggle case status between published/draft/archived.
  - Image upload: Support JPEG, PNG, DICOM. Maximum 10 images per case.

##### 3.6.2 Review AI Answers

- **Function trigger**: Expert navigates to Review Center from sidebar.
- **Function description**: Expert reviews student Q&A sessions and AI-generated answers for clinical accuracy.
- **Function Details**:
  - Filter by case, time, student, keyword.
  - View original question + AI answer side by side.
  - Actions: Approve, Edit (modify answer text/references), Add clinical notes, Flag as inaccurate.

---

#### 3.7 Lecturer - Class Management

##### 3.7.1 Manage Classes

- **Function trigger**: Lecturer navigates to Class Management from sidebar.
- **Function description**: Create and manage classes, assign students, import student lists.
- **Function Details**:
  - Create class: Name (e.g., "Orthopedics - Class A - Cohort 2023"), description, semester.
  - Student management: Add individual students, import from CSV/Excel file.
  - Class detail: View enrolled students with their progress stats.

##### 3.7.2 Monitor Student Progress

- **Function trigger**: Lecturer navigates to Student Reports from sidebar.
- **Function description**: View detailed learning statistics per class, group, or individual student.
- **Function Details**:
  - Class-level stats: Average scores, completion rates, common errors.
  - Individual student report: Cases studied, quiz scores by topic, Q&A sessions.
  - Export: Generate PDF/Excel reports.

---

#### 3.8 Curator - Knowledge Base Management

##### 3.8.1 Manage Documents

- **Function trigger**: Curator navigates to Document Management from sidebar.
- **Function description**: Upload, organize, tag, and version knowledge base documents.
- **Function Details**:
  - Upload: PDF, DOCX, TXT files. Maximum 50MB per file.
  - Organization: Assign topics and subtopics, add tags (e.g., "fracture classification", "osteoarthritis").
  - Versioning: Track document versions, mark outdated documents for update.
  - Bulk operations: Upload multiple documents, batch tagging.

##### 3.8.2 Control RAG Pipeline

- **Function trigger**: Curator navigates to Indexing Pipeline from sidebar.
- **Function description**: Trigger and monitor the embedding/indexing pipeline for RAG.
- **Function Details**:
  - Trigger re-indexing: Button to start embedding generation for new/updated documents.
  - Indexing logs: View processing status, errors, completion timestamps.
  - Chunking settings: Configure chunk size, overlap, and strategy.

---

#### 3.9 Admin - System Administration

##### 3.9.1 User Management

- **Function trigger**: Admin navigates to User Management from sidebar.
- **Function description**: View, manage, and control user accounts across all roles.
- **Screen layout**: Table view with columns: Name, Email, Role (badge), Status (Active/Pending/Inactive), Joined date. Filter by role. Search by name/email. Action buttons: View, Edit, Activate/Deactivate.
- **Function Details**:
  - Role filter: Dropdown to filter by Student/Expert/Lecturer/Curator/Admin.
  - Status management: Activate/deactivate accounts with confirmation dialog.
  - Role assignment: Assign or revoke roles for each user.
  - Bulk actions: Select multiple users for batch status changes.

##### 3.9.2 System Monitoring

- **Function trigger**: Admin navigates to System Monitoring from sidebar.
- **Function description**: Monitor platform health, activity logs, and usage statistics.
- **Function Details**:
  - Dashboard stats: System Uptime (99.8%), Completion Rate (94.2%), Avg AI Rating (4.6/5), Total Cases, Quizzes Created, AI Q&A Sessions, Avg Response Time.
  - Activity feed: Real-time system events (user registrations, RAG indexing, course creation, backups).
  - User distribution: Visual bar chart showing user counts by role.
  - Error tracking: System error logs with severity levels.

---

### 4. Non-Functional Requirements

#### 4.1 External Interfaces

**User Interfaces:**
- **Web Application**: Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4. Responsive design supporting desktop (1920px+), laptop (1366px), and tablet (768px) viewports. Medical teal color scheme (#0891B2 primary) with dark mode support.
- **Mobile Application**: React Native (or Flutter) app for iOS and Android, synchronized with web backend. Supports touch gestures for image zoom/pan.
- **Design System**: Figtree + Noto Sans fonts. CSS custom properties for theming. Lucide React icons. Consistent component library (Header, StatCard, CaseCard, Sidebar).

**Software Interfaces:**
- **Backend API**: RESTful API (Node.js/C#/.NET/Spring Boot) communicating via JSON over HTTPS.
- **AI Module API**: Python FastAPI service for image processing and RAG queries. Communicates with backend via internal REST calls.
- **Vector Database**: FAISS or ChromaDB for storing document embeddings. Accessed by the AI module.
- **PostgreSQL Database**: Primary relational database accessed via ORM (Prisma/TypeORM).
- **File Storage**: Cloud storage (AWS S3 or equivalent) for medical images and documents.

**Communication Interfaces:**
- HTTPS (TLS 1.3) for all client-server communication.
- WebSocket for real-time notifications (optional).
- Push notifications via Firebase Cloud Messaging (mobile).

#### 4.2 Quality Attributes

##### 4.2.1 Usability

- **Learning Curve**: Medical students should be able to navigate the case library and AI Q&A features within 10 minutes of first use without training.
- **Accessibility**: WCAG 2.1 Level AA compliance. Keyboard navigation support. Reduced motion media query support. Focus state styling for all interactive elements.
- **Language**: Primary language is Vietnamese with possibility to extend to English. All UI text is localizable.
- **Responsive Design**: Full functionality on desktop (1366px+) and tablet (768px+) browsers. Mobile-optimized for React Native app.
- **Error Handling**: Clear, user-friendly error messages. Form validation with inline error messages. Toast notifications for success/failure states.
- **Consistency**: Unified design system across all 5 role portals. Consistent navigation patterns (sidebar + header). Consistent color-coding (green=success, yellow=warning, red=error).

##### 4.2.2 Reliability

- **Availability**: 99.5% uptime during academic hours (7:00 AM - 11:00 PM, UTC+7). Planned maintenance windows on weekends with 48-hour advance notice.
- **Mean Time Between Failures (MTBF)**: Minimum 720 hours (30 days) between critical failures.
- **Mean Time To Repair (MTTR)**: Maximum 4 hours for critical issues, 24 hours for non-critical issues.
- **Data Integrity**: All database transactions are ACID-compliant. Automatic daily backups with 30-day retention.
- **Error Recovery**: Graceful degradation when AI module is unavailable (show "AI service temporarily unavailable" message, allow browsing cases and previous Q&A sessions). Auto-retry for failed API calls (max 3 retries with exponential backoff).
- **Maximum Defect Rate**: Less than 2 critical bugs per release. Less than 5 bugs per 1,000 lines of code (KLOC).

##### 4.2.3 Performance

- **Response Time**:
  - Page load (initial): < 3 seconds (LCP).
  - Page navigation (SPA): < 500ms.
  - API response (CRUD operations): < 1 second (average), < 3 seconds (maximum).
  - AI Q&A response (RAG): < 5 seconds (average), < 15 seconds (maximum).
  - Image analysis response: < 10 seconds (average), < 30 seconds (maximum).
  - Quiz submission and scoring: < 2 seconds.
- **Throughput**: Support minimum 100 concurrent users with acceptable performance.
- **Capacity**:
  - Up to 5,000 registered users.
  - Up to 2,000 bone/joint cases with associated images.
  - Up to 500 knowledge base documents.
  - Up to 1,000 quizzes.
- **Resource Utilization**:
  - Client-side: < 200MB browser memory usage.
  - Server-side: Scalable cloud infrastructure (auto-scaling based on load).
  - AI module: GPU-accelerated for image processing (recommended NVIDIA T4 or equivalent).

##### 4.2.4 Security

- **Authentication**: JWT-based authentication with token expiration (access: 1 hour, refresh: 7 days). Bcrypt password hashing with minimum 10 salt rounds.
- **Authorization**: Role-Based Access Control (RBAC) with 5 defined roles. API middleware validates role permissions for every request.
- **Data Protection**: All API communication encrypted via HTTPS (TLS 1.3). Medical image data anonymized (DICOM metadata stripped). Sensitive data (passwords, tokens) never logged or exposed in API responses.
- **Input Validation**: All user inputs sanitized to prevent XSS, SQL injection, and other OWASP Top 10 vulnerabilities. File upload validation (type, size, content).
- **Session Management**: Automatic session timeout after 30 minutes of inactivity. Secure cookie flags (HttpOnly, Secure, SameSite).

##### 4.2.5 Scalability

- **Horizontal Scaling**: Backend services designed as stateless, deployable across multiple instances behind a load balancer.
- **Database Scaling**: Read replicas for PostgreSQL to handle increased read load. Vector database supports incremental indexing.
- **Storage Scaling**: Cloud-based file storage with virtually unlimited capacity for medical images and documents.
- **AI Module Scaling**: AI service can be scaled independently based on Q&A request volume.

---

### 5. Requirement Appendix

#### 5.1 Business Rules

| ID | Rule Definition |
|----|----------------|
| BR-01 | Students can only access published cases. Draft and archived cases are visible only to Experts and Admins. |
| BR-02 | AI Q&A responses must include at least one reference from the knowledge base when available. |
| BR-03 | Students must select a topic before accessing the topic-based Q&A chatbot. Free-form questions without topic context are not supported. |
| BR-04 | Quiz scores are calculated as: (correct answers / total questions) * 100, rounded to the nearest integer. |
| BR-05 | Only Clinical Experts can create, modify, or approve bone/joint cases in the case library. |
| BR-06 | Content Curators must trigger re-indexing after uploading or modifying knowledge base documents for changes to take effect in RAG responses. |
| BR-07 | Medical images uploaded by students for Q&A are stored temporarily (30 days) and then automatically deleted. |
| BR-08 | Each quiz attempt is recorded. Students can retry quizzes unlimited times; the highest score is displayed. |
| BR-09 | Lecturers can only view progress and statistics for students enrolled in their classes. |
| BR-10 | System Administrators cannot modify case content directly; they can only hide/show cases and manage user permissions. |
| BR-11 | Uploaded medical images must not exceed 20MB per file. Accepted formats: JPEG, PNG, WebP, DICOM. |
| BR-12 | Knowledge base documents must not exceed 50MB per file. Accepted formats: PDF, DOCX, TXT. |
| BR-13 | The system must display a confidence disclaimer with every AI-generated answer: "This is an AI-generated educational response. Always consult qualified medical professionals for clinical decisions." |
| BR-14 | All user accounts require email verification before activation (except demo accounts). |
| BR-15 | Difficulty levels are defined as: Basic (introductory concepts, common conditions), Intermediate (differential diagnosis, pattern recognition), Advanced (rare conditions, complex presentations). |

#### 5.2 Common Requirements

| ID | Requirement |
|----|------------|
| CR-01 | All pages must include a role-specific sidebar navigation with active state highlighting. |
| CR-02 | All pages must include a Header component displaying the page title and subtitle. |
| CR-03 | All forms must validate required fields before submission and display inline error messages. |
| CR-04 | All tables and lists must support pagination (20 items per page default). |
| CR-05 | All date/time values must be displayed in the user's local timezone (default: UTC+7 for Vietnam). |
| CR-06 | All API responses must follow a consistent format: `{ success: boolean, data: any, message: string, pagination?: {...} }`. |
| CR-07 | All destructive actions (delete, deactivate) must require confirmation via dialog. |
| CR-08 | Loading states must be displayed for all asynchronous operations (spinner or skeleton). |
| CR-09 | Empty states must display helpful messages and suggested actions. |
| CR-10 | The system must support both light mode (default) and dark mode via `prefers-color-scheme` media query. |

#### 5.3 Application Messages List

| # | Message Code | Message Type | Context | Content |
|---|-------------|-------------|---------|---------|
| 1 | MSG-01 | Toast (success) | Login successful | Welcome back, {user_name}! |
| 2 | MSG-02 | Banner (error) | Login failed | Invalid email or password. Try a demo account below. |
| 3 | MSG-03 | Inline (error) | Required field empty | This field is required. |
| 4 | MSG-04 | Inline (error) | Invalid email format | Please enter a valid email address. |
| 5 | MSG-05 | Inline (error) | Password too short | Password must be at least 6 characters. |
| 6 | MSG-06 | Toast (success) | Profile updated | Profile updated successfully! |
| 7 | MSG-07 | Toast (success) | Quiz submitted | Quiz completed! Your score: {score}%. |
| 8 | MSG-08 | Inline (info) | No search results | No cases found matching your search. |
| 9 | MSG-09 | Inline (info) | No quizzes found | No quizzes found. Try changing the filter. |
| 10 | MSG-10 | Chat (loading) | AI Q&A topic | Analyzing with knowledge base... |
| 11 | MSG-11 | Chat (loading) | AI Q&A image | Analyzing image... |
| 12 | MSG-12 | Chat (loading) | AI Q&A follow-up | Thinking... |
| 13 | MSG-13 | Alert (error) | File type invalid | Please upload a valid image file (JPEG, PNG, WebP, or DICOM). |
| 14 | MSG-14 | Alert (error) | File size exceeded | File size exceeds the maximum limit of {max_size}MB. |
| 15 | MSG-15 | Disclaimer (info) | AI response footer | This is an AI-generated educational response. Always consult qualified medical professionals for clinical decisions. |
| 16 | MSG-16 | Toast (success) | Case created | Case created successfully. Pending expert approval. |
| 17 | MSG-17 | Toast (success) | Document uploaded | Document uploaded successfully. Re-indexing required. |
| 18 | MSG-18 | Toast (info) | Indexing started | Indexing pipeline started. This may take a few minutes. |
| 19 | MSG-19 | Toast (success) | User activated | User account activated successfully. |
| 20 | MSG-20 | Toast (success) | User deactivated | User account deactivated. |
| 21 | MSG-21 | Dialog (confirm) | Delete action | Are you sure you want to delete this item? This action cannot be undone. |
| 22 | MSG-22 | Banner (warning) | AI unavailable | AI service is temporarily unavailable. You can still browse cases and previous Q&A sessions. |
| 23 | MSG-23 | Toast (success) | Announcement sent | Announcement sent to {count} students. |
| 24 | MSG-24 | Inline (error) | Max length exceeded | Input exceeds maximum length of {max_length} characters. |

#### 5.4 Other Requirements

**Technology Stack:**
- **Frontend Web**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Lucide React icons
- **Frontend Mobile**: React Native (or Flutter)
- **Backend**: Node.js / C# .NET / Java Spring Boot (REST APIs)
- **AI Module**: Python FastAPI (Image processing + RAG)
- **Database**: PostgreSQL with ORM (Prisma/TypeORM/Sequelize)
- **Vector Database**: FAISS or ChromaDB
- **File Storage**: AWS S3 or equivalent cloud storage
- **Authentication**: JWT-based
- **Deployment**: Docker containers, cloud hosting (AWS/Azure/GCP)

**Browser Compatibility:**
- Google Chrome 100+ (primary)
- Mozilla Firefox 100+
- Microsoft Edge 100+
- Safari 16+

**Mobile Compatibility:**
- iOS 15+
- Android 12+
