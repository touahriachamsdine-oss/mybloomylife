# Teacher Role Upgrade Implementation Plan

**Goal:** Bring the teacher role to parity with student/parent roles by adding section-based class management, attendance, behavior notes, schedule, parent messaging, and cross-role upgrades for parent and psychologist.

**Architecture:** New `TeacherContext` (localStorage-backed) holds all teacher-specific data. Teacher screens are extracted to `src/components/teacher/*.tsx`. BloomContext is untouched.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, framer-motion, lucide-react

---

### Task 1: TeacherContext

**Files:**
- Create: `src/context/TeacherContext.tsx`

Data types: Section, AttendanceRecord, BehaviorNote, ScheduleEntry, ParentMessage

Provider with all CRUD actions + localStorage persistence.

---

### Task 2: Teacher Screens

**Files:**
- Create: `src/components/teacher/TeacherDashboard.tsx`
- Create: `src/components/teacher/AttendanceTracker.tsx`
- Create: `src/components/teacher/BehaviorNotes.tsx`
- Create: `src/components/teacher/TeacherSchedule.tsx`
- Create: `src/components/teacher/ParentMessages.tsx`

---

### Task 3: Update page.tsx

- Add teacher screens to drawer nav (6 items)
- Wire teacher screen routing
- Parent upgrades: attendance + behavior tabs
- Psychologist upgrades: mood trends + reply
- Admin upgrades: user management

---

### Task 4: Locale strings

**File:**
- Modify: `src/app/locales.json`

Add ~60 new keys across all 4 languages.

---

### Task 5: Build verification

Run `tsc --noEmit` and `npm run build`
