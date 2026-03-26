import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const AssignmentCalendar = ({
  assignments = [],
  selectedCourse,
  selectedType,
}) => {
  const events = useMemo(() => {
    return assignments
      .filter((a) => {
        const courseMatch = !selectedCourse || a.course === selectedCourse;
        const typeMatch = !selectedType || a.type === selectedType;
        return courseMatch && typeMatch;
      })
      .map((a) => {
        let date = a.due_date;
        if (a.due_date?.toDate) {
          date = a.due_date.toDate().toISOString().split("T")[0];
        }
        return {
          id: a.id,
          title: a.title,
          date,
          backgroundColor:
            a.type === "exams"
              ? "#dc2626"
              : a.type === "quizzes"
              ? "#3b82f6"
              : a.type === "homework"
              ? "#10b981"
              : "#6b7280",
          textColor: "#fff",
          extendedProps: {
            points: a.points,
            submissionLimit: a.submission_limit,
            type: a.type,
            course: a.course,
          },
        };
      });
  }, [assignments, selectedCourse, selectedType]);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={(info) => {
          const { points, submissionLimit, type, course } =
            info.event.extendedProps;
          alert(
            `Title: ${info.event.title}\n` +
              `Due: ${info.event.startStr}\n` +
              `Course: ${course}\n` +
              `Type: ${type}\n` +
              `Points: ${points}\n` +
              `Submission Limit: ${submissionLimit}`
          );
        }}
        height="auto"
      />
    </div>
  );
};

export default AssignmentCalendar;
