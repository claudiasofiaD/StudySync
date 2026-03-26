import { useEffect, useState } from "react";
import {
  db,
  doc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  setDoc,
  query,
  where,
} from "../../firebase";
import SubmissionModal from "./SubmissionsModal";
import toast from "react-hot-toast";

const GradesTable = ({ courseData }) => {
  const [gradesByAssignment, setGradesByAssignment] = useState({});
  const [studentNames, setStudentNames] = useState({});
  const [manualInputs, setManualInputs] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [submissionView, setSubmissionView] = useState(null);
  const [weights, setWeights] = useState({});
  const [weightErrors, setWeightErrors] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const forceReload = () => setLoading(true);

  /* ------------------- LOAD CLASS WEIGHTS ------------------- */
  useEffect(() => {
    if (!courseData?.className) return;
    const classRef = doc(db, "classes", courseData.className);
    getDoc(classRef).then((snap) => {
      if (snap.exists() && snap.data().gradeWeights) {
        const { projects, ...rest } = snap.data().gradeWeights;
        setWeights(rest);
      } else {
        setWeights({ exams: 0, homework: 0, quizzes: 0 });
      }
    });
  }, [courseData]);

  /* ------------------- VALIDATE WEIGHTS ------------------- */
  useEffect(() => {
    const total = Object.values(weights).reduce(
      (sum, v) => sum + Number(v || 0),
      0
    );
    setWeightErrors(
      total !== 100 ? `Total must equal 100%. Current: ${total}%` : ""
    );
  }, [weights]);

  const autoNormalizeWeights = () => {
    const total = Object.values(weights).reduce(
      (sum, v) => sum + Number(v || 0),
      0
    );
    if (!total) return;
    const normalized = {};
    for (const key in weights) normalized[key] = (weights[key] / total) * 100;
    setWeights(normalized);
  };

  const saveWeights = async () => {
    const total = Object.values(weights).reduce(
      (sum, v) => sum + Number(v || 0),
      0
    );
    if (total !== 100)
      return toast.error("Weights must total 100% before saving.");
    try {
      await setDoc(
        doc(db, "classes", courseData.className),
        { gradeWeights: weights },
        { merge: true }
      );
      toast.success("Weights updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update weights");
    }
  };

  /* ------------------- FETCH SUBMISSIONS ------------------- */
  useEffect(() => {
    if (!courseData?.assignments?.length) return;

    const unsubscribers = [];

    const fetchSubmissions = async () => {
      setLoading(true);

      for (const assignmentId of courseData.assignments) {
        const assignmentRef = doc(db, "assignments", assignmentId);
        const assignmentSnap = await getDoc(assignmentRef);
        if (!assignmentSnap.exists()) continue;

        const { title: assignmentTitle = "Untitled", type = "other", due_date } =
          assignmentSnap.data();
        const dueDate = due_date?.toDate?.() ?? null;

        const submissionsRef = collection(
          db,
          "assignments",
          assignmentId,
          "submissions"
        );

        const unsubscribe = onSnapshot(submissionsRef, async (snapshot) => {
          const subsByStudent = {};

          for (const s of snapshot.docs) {
            const data = s.data();
            const studentId = data.user;

            // Fetch student name if not cached
            let studentName = studentNames[studentId];
            if (!studentName) {
              const userSnap = await getDoc(doc(db, "users", studentId));
              studentName = userSnap.exists()
                ? userSnap.data().name || studentId
                : studentId;
              setStudentNames((prev) => ({ ...prev, [studentId]: studentName }));
            }

            // Calculate total points
            const questionsSnap = await getDocs(
              collection(
                db,
                "assignments",
                assignmentId,
                "submissions",
                s.id,
                "questions"
              )
            );
            let totalEarned = 0,
              totalPoints = 0;
            questionsSnap.forEach((q) => {
              const qData = q.data();
              totalEarned += qData.earned_points ?? 0;
              totalPoints += qData.points ?? 0;
            });

            const gradePercent =
              data.manualGrade ??
              (totalPoints ? (totalEarned / totalPoints) * 100 : null);

            const submittedAt = data.submittedAt?.toDate?.() ?? null;

            let timingLabel = "-";
            if (submittedAt && dueDate) {
              const diffDays = Math.round((submittedAt - dueDate) / 86400000);
              timingLabel =
                diffDays > 0
                  ? `${diffDays} days late`
                  : diffDays < 0
                  ? `${Math.abs(diffDays)} days early`
                  : "On time";
            }

            if (
              !subsByStudent[studentId] ||
              (gradePercent != null &&
                gradePercent > subsByStudent[studentId].gradePercent)
            ) {
              subsByStudent[studentId] = {
                submissionId: s.id,
                studentId,
                studentName,
                assignmentId,
                assignmentTitle,
                type,
                earnedPoints: totalEarned,
                totalPoints,
                gradePercent,
                manualGrade: data.manualGrade ?? "",
                submittedAt,
                timingLabel,
              };
            }
          }

          setGradesByAssignment((prev) => ({
            ...prev,
            [assignmentTitle]: Object.values(subsByStudent),
          }));
          setLoading(false);
        });

        unsubscribers.push(unsubscribe);
      }
    };

    fetchSubmissions();
    return () => unsubscribers.forEach((u) => u());
  }, [courseData]);

  /* ------------------- FETCH IMPORTED / MANUAL GRADES ------------------- */
  useEffect(() => {
    if (!courseData?.className) return;

    const fetchImportedGrades = async () => {
      const gradesRef = collection(db, "grades");
      const q = query(
        gradesRef,
        where("courseName", "==", courseData.className)
      );
      const snap = await getDocs(q);

      const importedByAssignment = {};
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const {
          assignmentTitle,
          studentId,
          gradePercent,
          assignmentId,
          earnedPoints,
          totalPoints,
          manualGrade,
          submittedAt,
          timingLabel,
        } = data;

        let type = "other";
        if (assignmentId) {
          const assignmentSnap = await getDoc(doc(db, "assignments", assignmentId));
          if (assignmentSnap.exists()) type = assignmentSnap.data().type || "other";
        }

        if (!importedByAssignment[assignmentTitle])
          importedByAssignment[assignmentTitle] = {};

        const importedRow = {
          ...data,
          type,
          submissionId: `${assignmentId}_${studentId}`,
          manualGrade: manualGrade ?? "",
          submittedAt: submittedAt ?? null,
          timingLabel: timingLabel ?? "-",
          earnedPoints: earnedPoints ?? 0,
          totalPoints: totalPoints ?? 0,
        };

        if (
          !importedByAssignment[assignmentTitle][studentId] ||
          gradePercent > importedByAssignment[assignmentTitle][studentId].gradePercent
        ) {
          importedByAssignment[assignmentTitle][studentId] = importedRow;
        }
      }

      setGradesByAssignment((prev) => {
        const merged = { ...prev };
        for (const [title, students] of Object.entries(importedByAssignment)) {
          merged[title] = [
            ...(merged[title] || []).filter(
              (s) =>
                !students[s.studentId] ||
                s.gradePercent > students[s.studentId].gradePercent
            ),
            ...Object.values(students),
          ];
        }
        return merged;
      });
    };

    fetchImportedGrades();
  }, [courseData]);

  /* ------------------- SAVE MANUAL GRADE ------------------- */
  const saveManualGrade = async (
    assignmentId,
    submissionId,
    assignmentTitle,
    studentName,
    studentId,
    earnedPoints = 0,
    totalPoints = 0,
    isImported = false
  ) => {
    const value = manualInputs[submissionId];
    if (value === "" || isNaN(value))
      return toast.error("Enter a valid grade 0–100");
    const grade = Number(value);
    if (grade < 0 || grade > 100)
      return toast.error("Grade must be between 0 and 100");

    try {
      const batch = writeBatch(db);

      if (!isImported) {
        batch.update(
          doc(db, "assignments", assignmentId, "submissions", submissionId),
          { manualGrade: grade, updatedAt: new Date() }
        );
      }

      batch.set(
        doc(db, "grades", `${assignmentId}_${studentId}`),
        {
          courseName: courseData.className ?? "",
          assignmentId,
          submissionId: isImported ? null : submissionId,
          assignmentTitle,
          studentName,
          studentId,
          gradePercent: grade,
          earnedPoints,
          totalPoints,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      await batch.commit();
      toast.success("Manual grade saved!");
      setManualInputs((p) => ({ ...p, [submissionId]: "" }));
      forceReload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save manual grade");
    }
  };

  /* ------------------- CALCULATE TOTAL WEIGHTED GRADES ------------------- */
  const studentTotals = {};
  Object.values(gradesByAssignment).forEach((submissions) => {
    submissions.forEach((s) => {
      if (!studentTotals[s.studentId])
        studentTotals[s.studentId] = {
          name: s.studentName,
          perType: {},
          assignments: [],
        };
      if (!studentTotals[s.studentId].perType[s.type])
        studentTotals[s.studentId].perType[s.type] = { sum: 0, count: 0 };
      if (s.gradePercent != null) {
        studentTotals[s.studentId].perType[s.type].sum += s.gradePercent;
        studentTotals[s.studentId].perType[s.type].count += 1;
      }
      studentTotals[s.studentId].assignments.push(s);
    });
  });

  const normalizedGrades = Object.entries(studentTotals).map(
    ([id, data]) => {
      let weightedSum = 0,
        totalWeightUsed = 0;
      for (const [type, tData] of Object.entries(data.perType)) {
        const avg = tData.count > 0 ? tData.sum / tData.count : 0;
        const w = (weights[type] ?? 0) / 100;
        if (tData.count > 0 && w > 0) {
          weightedSum += avg * w;
          totalWeightUsed += w;
        }
      }
      return {
        studentId: id,
        name: data.name,
        total:
          totalWeightUsed > 0 ? weightedSum / totalWeightUsed : 0,
        assignments: data.assignments,
      };
    }
  );

  /* ------------------- RENDER ------------------- */

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600 dark:text-gray-300">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg">Loading grades...</p>
      </div>
    );

  const assignmentTitles = Object.keys(gradesByAssignment);
  if (!assignmentTitles.length)
    return <p className="text-center mt-8">No submissions yet.</p>;

  return (
    <div>
      {/* WEIGHTS EDITOR */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg shadow p-4 mb-6">
        <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">
          Assignment Type Weights
        </h3>
        <table className="w-full text-sm mb-3">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-center">Weight (%)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(weights).map(([type, value]) => (
              <tr key={type} className="border-t">
                <td className="px-3 py-2 capitalize">{type}</td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    step="0.01"
                    value={value}
                    className={`border rounded px-2 py-1 w-24 text-center ${
                      weightErrors ? "border-red-500" : ""
                    }`}
                    onChange={(e) =>
                      setWeights((p) => ({
                        ...p,
                        [type]: Number(e.target.value),
                      }))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {weightErrors && (
          <p className="text-red-600 font-medium mb-2">
            {weightErrors}
          </p>
        )}
        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
            onClick={autoNormalizeWeights}
          >
            Auto-Normalize (→ 100%)
          </button>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            onClick={saveWeights}
            disabled={!!weightErrors}
          >
            Save Weights
          </button>
        </div>
      </div>

      {/* ASSIGNMENTS */}
      {assignmentTitles.map((title) => {
        const submissions = gradesByAssignment[title] || [];
        const isOpen = expanded[title];
        return (
          <div key={title} className="mb-6 border rounded overflow-hidden">
            <button
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [title]: !prev[title],
                }))
              }
              className={`w-full flex justify-between items-center px-4 py-3 text-left font-semibold text-lg transition ${
                isOpen
                  ? "bg-blue-100 dark:bg-gray-700 hover:bg-blue-200 dark:hover:bg-gray-600"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700"
              }`}
            >
              <span>{title}</span>
              <span>{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div className="overflow-x-auto bg-white dark:bg-gray-800">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2">Student</th>
                      <th className="px-4 py-2 text-center">Points</th>
                      <th className="px-4 py-2 text-center">Grade (%)</th>
                      <th className="px-4 py-2 text-center">Manual Grade</th>
                      <th className="px-4 py-2 text-center">Submitted</th>
                      <th className="px-4 py-2 text-center">Lateness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr
                        key={s.submissionId}
                        className="border-t hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={(e) => {
                          if (e.target.closest(".manual-grade-cell")) return;
                          setSubmissionView({
                            assignmentId: s.assignmentId,
                            submissionId: s.submissionId,
                            studentId: s.studentId,
                            onRefresh: forceReload,
                          });
                        }}
                      >
                        <td className="px-4 py-2">{s.studentName}</td>
                        <td className="px-4 py-2 text-center">
                          {s.earnedPoints}/{s.totalPoints}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {s.gradePercent != null
                            ? s.gradePercent.toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-center manual-grade-cell">
                          <div className="flex gap-2 justify-center">
                            <input
                              type="number"
                              className="border rounded px-2 py-1 w-20 text-center"
                              placeholder={s.manualGrade || ""}
                              value={
                                manualInputs[s.submissionId] ??
                                s.manualGrade ??
                                ""
                              }
                              onChange={(e) =>
                                setManualInputs((prev) => ({
                                  ...prev,
                                  [s.submissionId]: e.target.value,
                                }))
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveManualGrade(
                                  s.assignmentId,
                                  s.submissionId,
                                  s.assignmentTitle,
                                  s.studentName,
                                  s.studentId,
                                  s.earnedPoints ?? 0,
                                  s.totalPoints ?? 0,
                                  s.submissionId.startsWith("imported")
                                );
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {s.submittedAt
                            ? s.submittedAt.toLocaleString()
                            : "-"}
                        </td>
                        <td
                          className={`px-4 py-2 text-center ${
                            s.timingLabel.includes("late")
                              ? "text-red-600"
                              : s.timingLabel.includes("early")
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {s.timingLabel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* TOTAL WEIGHTED GRADES */}
      <div className="mt-6 bg-white dark:bg-gray-800 border rounded-lg shadow p-4">
        <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">
          Total Weighted Grades
        </h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Student</th>
              <th className="px-4 py-2 text-center">Weighted Total (%)</th>
            </tr>
          </thead>
          <tbody>
            {normalizedGrades.map((s) => {
              const isExpanded = expanded[`student_${s.studentId}`];

              return (
                <>

                  <tr
                    key={s.studentId}
                    className="border-t hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [`student_${s.studentId}`]:
                          !prev[`student_${s.studentId}`],
                      }))
                    }
                  >
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2 text-center font-semibold">
                      {s.total.toFixed(2)}%
                    </td>
                  </tr>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                    <tr>
                      <td
                        colSpan={2}
                        className="bg-gray-50 dark:bg-gray-800 p-4"
                      >
                        {/* CATEGORY BREAKDOWN */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-blue-600 mb-2">
                            Category Breakdown
                          </h4>

                          <ul className="text-sm space-y-1">
                            {Object.entries(
                              s.assignments.reduce((acc, a) => {
                                if (!acc[a.type])
                                  acc[a.type] = { sum: 0, count: 0 };
                                if (a.gradePercent != null) {
                                  acc[a.type].sum += a.gradePercent;
                                  acc[a.type].count += 1;
                                }
                                return acc;
                              }, {})
                            ).map(([type, info]) => (
                              <li key={type}>
                                <span className="capitalize">{type}: </span>
                                <span className="font-medium">
                                  {info.count
                                    ? (info.sum / info.count).toFixed(2)
                                    : "—"}
                                  %
                                </span>
                                <span className="text-gray-500 ml-2">
                                  ({info.count} items)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* ASSIGNMENT LIST */}
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-2">
                            Assignments
                          </h4>
                          <table className="w-full text-xs border">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                              <tr>
                                <th className="px-2 py-1 text-left">Title</th>
                                <th className="px-2 py-1 text-center">
                                  Type
                                </th>
                                <th className="px-2 py-1 text-center">
                                  Points
                                </th>
                                <th className="px-2 py-1 text-center">
                                  Grade (%)
                                </th>
                                <th className="px-2 py-1 text-center">
                                  Submitted
                                </th>
                                <th className="px-2 py-1 text-center">
                                  Timing
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.assignments.map((a) => (
                                <tr key={a.submissionId} className="border-t">
                                  <td className="px-2 py-1">
                                    {a.assignmentTitle}
                                  </td>
                                  <td className="px-2 py-1 text-center capitalize">
                                    {a.type}
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    {a.earnedPoints}/{a.totalPoints}
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    {a.gradePercent != null
                                      ? a.gradePercent.toFixed(2)
                                      : "Missing"}
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    {a.submittedAt
                                      ? a.submittedAt.toLocaleString()
                                      : "—"}
                                  </td>
                                  <td
                                    className={`px-2 py-1 text-center ${
                                      a.timingLabel.includes("late")
                                        ? "text-red-600"
                                        : a.timingLabel.includes("early")
                                        ? "text-green-600"
                                        : "text-yellow-600"
                                    }`}
                                  >
                                    {a.timingLabel}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {submissionView && (
        <SubmissionModal
          {...submissionView}
          onClose={() => setSubmissionView(null)}
        />
      )}
    </div>
  );
};

export default GradesTable;
