"use client";

// Teacher portal data now lives in BloomContext (single state store, typed
// storage). This module is kept as a thin adapter so teacher components and
// the parent screen can read the same slice through the `teacher` prop.

import { useBloom } from "./BloomContext";

export type {
  ClassSection,
  AttendanceStatus,
  AttendanceRecord,
  BehaviorNote,
  ScheduleEntry,
  ParentMessage,
} from "./BloomContext";

export function useTeacherData() {
  const {
    teacherSections,
    updateTeacherSection,
    addStudentToSection,
    removeStudentFromSection,
    attendance,
    markAttendance,
    getAttendanceForSection,
    getAttendanceForStudent,
    behaviorNotes,
    addBehaviorNote,
    deleteBehaviorNote,
    getBehaviorForStudent,
    schedule,
    addScheduleEntry,
    removeScheduleEntry,
    getScheduleForDay,
    parentMessages,
    sendParentMessage,
    markMessageRead,
    getMessagesForStudent,
    getUnreadParentMessages,
  } = useBloom();

  return {
    sections: teacherSections,
    updateSection: updateTeacherSection,
    addStudentToSection,
    removeStudentFromSection,
    attendance,
    markAttendance,
    getAttendanceForSection,
    getAttendanceForStudent,
    behaviorNotes,
    addBehaviorNote,
    deleteBehaviorNote,
    getBehaviorForStudent,
    schedule,
    addScheduleEntry,
    removeScheduleEntry,
    getScheduleForDay,
    parentMessages,
    sendParentMessage,
    markMessageRead,
    getMessagesForStudent,
    getUnreadParentMessages,
  };
}

export type UseTeacherData = ReturnType<typeof useTeacherData>;
