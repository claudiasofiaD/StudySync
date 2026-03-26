// src/components/Faculty/AssignmentList.jsx
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { db, doc, getDoc, updateDoc, arrayRemove } from "../../firebase";
import { deleteDoc, getDocs, collection } from "firebase/firestore";

const AssignmentList = ({ courseData, decodedCourseName, fetchCourse, userRole }) => {
  const [assignmentCache, setAssignmentCache] = useState({});
  const [loading, setLoading] = useState(true);

  // Load assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        if (!courseData?.assignments?.length) {
          setAssignmentCache({});
          return;
        }

        const assignmentPromises = courseData.assignments.map(async (assignmentId) => {
          const ref = doc(db, "assignments", assignmentId);
          const snap = await getDoc(ref);
          return snap.exists() ? [assignmentId, snap.data()] : null;
        });

        const results = await Promise.all(assignmentPromises);
        const assignments = Object.fromEntries(results.filter(Boolean));
        setAssignmentCache(assignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [courseData]);

  // Delete assignment
  const handleDeleteAssignment = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this assignment and all related submissions? This action cannot be undone."
  );
  if (!confirmDelete) return;

  try {
    const assignmentRef = doc(db, "assignments", id);

    // Delete all nested submissions and their questions
    const submissionsRef = collection(db, "assignments", id, "submissions");
    const submissionsSnap = await getDocs(submissionsRef);

    for (const sub of submissionsSnap.docs) {
      const questionsRef = collection(
        db,
        "assignments",
        id,
        "submissions",
        sub.id,
        "questions"
      );
      const questionsSnap = await getDocs(questionsRef);

      // Delete questions first
      for (const q of questionsSnap.docs) {
        await deleteDoc(q.ref);
      }

      // Delete the submission
      await deleteDoc(sub.ref);
    }

    // Delete the assignment document itself
    await deleteDoc(assignmentRef);

    // Remove reference from class doc
    await updateDoc(doc(db, "classes", decodedCourseName), {
      assignments: arrayRemove(id),
    });

    // Update local state
    setAssignmentCache((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    await fetchCourse();
    alert("Assignment deleted successfully.");
  } catch (error) {
    console.error("Error deleting assignment:", error);
    alert("Failed to delete assignment. Check console for details.");
  }
};

  // Group assignments by week (Sunday-Saturday)
  const weekGroups = useMemo(() => {
    const groups = {};
    const sortedAssignments = Object.entries(assignmentCache)
      .filter(([_, data]) => data?.due_date?.toDate)
      .sort(([, a], [, b]) => a.due_date.toDate() - b.due_date.toDate());

    for (const [id, data] of sortedAssignments) {
      const due = data.due_date.toDate();
      const weekStart = new Date(due);
      weekStart.setDate(due.getDate() - due.getDay()); // Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      const key = `${weekStart.getTime()}_${weekEnd.getTime()}`;

      if (!groups[key]) groups[key] = [];
      groups[key].push({ id, data });
    }

    return groups;
  }, [assignmentCache]);

  if (loading)
    return (
      <p className="text-center text-gray-600 dark:text-gray-300">
        Loading assignments...
      </p>
    );

  if (!courseData.assignments?.length)
    return (
      <p className="text-center text-gray-600 dark:text-gray-400">
        No current assignments for this course.
      </p>
    );

  const today = new Date();

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-center">Current Assignments</h3>

      {Object.entries(weekGroups)
        .sort(([a], [b]) => Number(a.split("_")[0]) - Number(b.split("_")[0]))
        .map(([weekRange, assignments]) => {
          const [startTime, endTime] = weekRange.split("_").map(Number);
          const start = new Date(startTime);
          const end = new Date(endTime);
          const isCurrentWeek = today >= start && today <= end;

          return (
            <div
              key={weekRange}
              className={`space-y-4 rounded-lg p-2 ${
                isCurrentWeek
                  ? "border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-700"
                  : ""
              }`}
            >
              {/* Week Header */}
              <div className="space-y-2">
                <h4
                  className={`text-lg font-semibold text-left ${
                    isCurrentWeek
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-black dark:text-gray-200"
                  }`}
                >
                  Week of{" "}
                  {start.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  –{" "}
                  {end.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {isCurrentWeek && (
                    <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      📅 Current Week
                    </span>
                  )}
                </h4>
                <hr className="border-t border-gray-300 dark:border-gray-700" />
              </div>

              {/* Assignments */}
              <ul className="space-y-4">
                {assignments.map(({ id, data }) => {
                  const dueDate = data?.due_date?.toDate?.();
                  const now = new Date();
                  let timeLabel = "";
                  let timeColor = "bg-green-100 text-green-800";

                  if (dueDate) {
                    const diffMs = dueDate - now;
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                    if (diffDays > 0) {
                      timeLabel = `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
                      timeColor =
                        diffDays <= 2
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800";
                    } else if (diffDays === 0) {
                      timeLabel = "Due today";
                      timeColor = "bg-yellow-100 text-yellow-800";
                    } else {
                      timeLabel = `Overdue by ${Math.abs(diffDays)} day${
                        Math.abs(diffDays) > 1 ? "s" : ""
                      }`;
                      timeColor = "bg-red-100 text-red-800";
                    }
                  }

                  return (
                    <li
                      key={id}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-4 shadow hover:shadow-lg transition"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                       <div className="flex items-center gap-3">
  {userRole === "faculty" ? (
    <Link
      to={`/assignment-editor/${id}`}
      className="text-lg font-semibold text-blue-600 hover:underline"
    >
      {data.title || "Untitled Assignment"}
    </Link>
  ) : (
    <span className="text-lg font-semibold text-gray-600 dark:text-gray-300 cursor-not-allowed">
      {data.title || "Untitled Assignment"}
    </span>
  )}

  {userRole === "faculty" && (
    <button
      onClick={() => handleDeleteAssignment(id)}
      className="text-sm text-red-600 border border-transparent rounded px-2 py-1 hover:bg-red-100 dark:hover:bg-red-900 hover:border-red-300 transition-colors"
    >
       Delete
    </button>
  )}
</div>

                        <span
                          className={`inline-block ${timeColor} text-xs px-2 py-1 rounded-full`}
                        >
                          ⏳ {timeLabel}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
                        <p>
                          <span className="font-medium">Due:</span>{" "}
                          {dueDate?.toLocaleDateString() || "—"}
                        </p>
                        <p>
                          <span className="font-medium">Description:</span>{" "}
                          {data.description || "—"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
    </div>
  );
};

export default AssignmentList;
