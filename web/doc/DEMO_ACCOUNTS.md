# Demo Accounts

> Temporary accounts for development and testing. Will be removed after authentication API integration.

## Credentials

All accounts use the same password: `123456`

| Role     | Email                     | Password | Dashboard Route      |
|----------|---------------------------|----------|----------------------|
| Student  | student@bonevisqa.com     | 123456   | /student/dashboard   |
| Lecturer | lecturer@bonevisqa.com    | 123456   | /lecturer/dashboard  |
| Expert   | expert@bonevisqa.com      | 123456   | /expert/dashboard    |
| Curator  | curator@bonevisqa.com     | 123456   | /curator/dashboard   |
| Admin    | admin@bonevisqa.com       | 123456   | /admin/dashboard     |

## How to Use

1. Go to `/login`
2. Enter email and password manually, then click **Sign in**
3. Or click one of the **Demo Accounts** buttons below the login form to login instantly

## Role Descriptions

- **Student**: Access case library, AI Q&A, quizzes, progress tracking
- **Lecturer**: Manage classes, assignments, view student analytics
- **Expert**: Review Q&A, manage cases, approve content
- **Curator**: Manage document library, RAG indexing pipeline, content quality
- **Admin**: System management, user management, roles & permissions, reports

## Source

Demo account logic is defined in `src/app/login/page.tsx`.
