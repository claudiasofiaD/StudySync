import { useEffect, useState } from "react";
import {
  db,
  collection,
  getDocs,
  doc,
  writeBatch,
  setDoc,
} from "../../firebase";
import toast from "react-hot-toast";

const SubmissionModal = ({
  assignmentId,
  submissionId,
  studentId,
  onRefresh,
  onClose
}) => {
  const [questions, setQuestions] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [editedGrades, setEditedGrades] = useState({});
  const [pointsMap, setPointsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ---------------- LOAD QUESTION DETAILS ---------------- */
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);

      try {
        const snap = await getDocs(
          collection(
            db,
            "assignments",
            assignmentId,
            "submissions",
            submissionId,
            "questions"
          )
        );

        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setQuestions(data);

        const f = {};
        const g = {};
        const p = {};

        data.forEach((q) => {
          f[q.id] = q.feedback || "";
          g[q.id] = q.score ?? q.earned_points ?? 0;
          p[q.id] = q.points ?? 1;
        });

        setFeedbackMap(f);
        setEditedGrades(g);
        setPointsMap(p);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load submission details");
      }

      setLoading(false);
    };

    fetchDetails();
  }, [assignmentId, submissionId]);

  /* ---------------- HANDLE EDITS ---------------- */
  const handleEdit = (qid, field, value) => {
    if (field === "grade") {
      setEditedGrades((p) => ({ ...p, [qid]: Number(value) }));
    } else if (field === "feedback") {
      setFeedbackMap((p) => ({ ...p, [qid]: value }));
    } else if (field === "points") {
      setPointsMap((p) => ({ ...p, [qid]: Number(value) }));
    }
  };

  /* ---------------- SAVE ALL GRADES ---------------- */
  const handleSave = async () => {
    setSaving(true);

    try {
      const batch = writeBatch(db);

      let earned = 0;
      let possible = 0;

      for (const q of questions) {
        const score = editedGrades[q.id] ?? 0;
        const points = pointsMap[q.id] ?? 1;

        earned += score;
        possible += points;

        batch.update(
          doc(
            db,
            "assignments",
            assignmentId,
            "submissions",
            submissionId,
            "questions",
            q.id
          ),
          {
            feedback: feedbackMap[q.id],
            score,
            points,
            earned_points: score,
          }
        );
      }

      const gradePercent =
        possible > 0 ? Math.round((earned / possible) * 100) : 0;

      batch.update(
        doc(db, "assignments", assignmentId, "submissions", submissionId),
        {
          manualGrade: gradePercent,
          earned_points: earned,
          total_points: possible,
          updatedAt: new Date(),
        }
      );

      batch.set(
        doc(db, "grades", `${assignmentId}_${studentId}`),
        {
          assignmentId,
          submissionId,
          studentId,
          gradePercent,
          earnedPoints: earned,
          totalPoints: possible,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      await batch.commit();

      toast.success("Grades saved!");

      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save grades.");
    }

    setSaving(false);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-11/12 max-w-5xl relative overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Submission Details
          </h3>

          <button
            onClick={onClose}
            className="hover:bg-blue-100 dark:hover:bg-gray-700 rounded px-2 py-1"
          >
            ✕ Close
          </button>
        </div>

        {loading ? (
          <p className="text-center py-10">Loading submission...</p>
        ) : (
          <>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="border px-3 py-2">Question</th>
                  <th className="border px-3 py-2">Answer</th>
                  <th className="border px-3 py-2">Expected</th>
                  <th className="border px-3 py-2">Points</th>
                  <th className="border px-3 py-2">Score</th>
                  <th className="border px-3 py-2">Feedback</th>
                </tr>
              </thead>

              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-t">
                    <td className="border px-3 py-2">{q.question_text}</td>
                    <td className="border px-3 py-2">{q.student_answer}</td>
                    <td className="border px-3 py-2">{q.expected_answer}</td>

                    <td className="border px-3 py-2 w-16">
                      <input
                        type="number"
                        min="1"
                        className="border rounded px-2 py-1 w-16 text-center"
                        value={pointsMap[q.id]}
                        onChange={(e) =>
                          handleEdit(q.id, "points", e.target.value)
                        }
                      />
                    </td>

                    <td className="border px-3 py-2 w-16">
                      <input
                        type="number"
                        min="0"
                        className="border rounded px-2 py-1 w-16 text-center"
                        value={editedGrades[q.id]}
                        onChange={(e) =>
                          handleEdit(q.id, "grade", e.target.value)
                        }
                      />
                    </td>

                    <td className="border px-3 py-2">
                      <textarea
                        className="w-full border rounded px-2 py-1"
                        value={feedbackMap[q.id]}
                        onChange={(e) =>
                          handleEdit(q.id, "feedback", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 text-center">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded font-medium ${
                  saving
                    ? "bg-gray-400 cursor-wait"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {saving ? "Saving..." : "Save Grades & Feedback"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SubmissionModal;