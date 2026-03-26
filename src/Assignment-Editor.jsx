import { useEffect, useState } from "react";
import {
  db,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  collection,
} from "./firebase";
import "./style/assignment-editor.css";
import { Timestamp } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

// Utility to recalculate total points for the assignment
const recalculateTotalPoints = async (assignmentId) => {
  const questionSnap = await getDocs(
    collection(db, "assignments", assignmentId, "questions")
  );
  let totalPoints = 0;

  questionSnap.forEach((docSnap) => {
    const data = docSnap.data();
    totalPoints += Number(data.points) || 0;
  });

  const assignmentRef = doc(db, "assignments", assignmentId);
  await updateDoc(assignmentRef, {
    points: totalPoints,
  });
};

// ─────────────────────────────────────────────────────────────
// Component: AddQuestion
const AddQuestion = ({ assignmentId }) => {
  const [type, setType] = useState("TXT"); // Default is 'Short Answer'
  const [text, setText] = useState("");
  const [head, setHead] = useState("");
  const [tail, setTail] = useState("");
  const [correct, setCorrect] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [points, setPoints] = useState(0);

  // Table
  const [tableRows, setTableRows] = useState([
    { col1: "", col2: "", col3: "" },
  ]);
  const [headers, setHeaders] = useState({
    col1: "Account Title",
    col2: "Debit",
    col3: "Credit",
  });

  const [showScrollUp, setShowScrollUp] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollUp(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateTableRow = (index, field, value) => {
    const updatedRows = [...tableRows];
    updatedRows[index][field] = value;
    setTableRows(updatedRows);
  };

  const addTableRow = () => {
    setTableRows([...tableRows, { col1: "", col2: "", col3: "" }]);
  };

  const removeTableRow = (index) => {
    const updatedRows = tableRows.filter((_, i) => i !== index);
    setTableRows(updatedRows);
  };

  const addQuestion = async () => {
    try {
      if (!text.trim() || !correct.trim()) {
        alert("Question and Answer cannot be empty.");
        return;
      }

      const data = {
        text,
        head,
        tail,
        type,
        correct,
        points: Number(points),
        optionA,
        optionB,
        optionC,
        optionD,
      };

      if (type === "TABLE") {
        data.tableData = tableRows;
        data.tableHeaders = headers;
      }

      await addDoc(
        collection(db, "assignments", assignmentId, "questions"),
        data
      );

      // Update total points
      await recalculateTotalPoints(assignmentId);

      alert("Question created successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Question creation error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 w-full max-w-3xl mx-auto mb-8">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white text-center">
        Add Question
      </h1>

      {/* Question Type */}
      <div className="flex items-center justify-between mb-4">
        <label className="text-gray-800 dark:text-gray-100 font-medium w-1/3">
          Question Type:
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="TXT">Short Answer</option>
          <option value="TF">True / False</option>
          <option value="MCQ">Multiple Choice</option>
          <option value="TABLE">Table</option>
          <option value="FIB_EXACT">Fill in the blank (short answer)</option>
          <option value="FIB_MC">Fill in the blank (dropdown)</option>
        </select>
      </div>

      {/* Question Input */}
      {type === "FIB_MC" || type === "FIB_EXACT" ? (
        <div className="space-y-4 mb-4">
          <div className="flex justify-between items-center">
            <label className="w-1/3 text-gray-800 dark:text-gray-100">
              Before blank:
            </label>
            <input
              type="text"
              value={head}
              onChange={(e) => {
                setHead(e.target.value);
                setText(`${e.target.value} ____ ${tail}`);
              }}
              className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-between items-center">
            <label className="w-1/3 text-gray-800 dark:text-gray-100">
              After blank:
            </label>
            <input
              type="text"
              value={tail}
              onChange={(e) => {
                setTail(e.target.value);
                setText(`${head} ____ ${e.target.value}`);
              }}
              className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center mb-4">
          <label className="w-1/3 text-gray-800 dark:text-gray-100">
            Question:
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {/* Answer */}
      <div className="flex justify-between items-center mb-4">
        <label className="w-1/3 text-gray-800 dark:text-gray-100">
          Answer:
        </label>
        <input
          type="text"
          value={correct}
          onChange={(e) => setCorrect(e.target.value)}
          className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* MCQ Options */}
      {(type === "MCQ" || type === "FIB_MC") && (
        <div className="space-y-2 mb-4">
          {[optionA, optionB, optionC, optionD].map((opt, i) => (
            <div key={i} className="flex justify-between items-center">
              <label className="w-1/3 text-gray-800 dark:text-gray-100">
                Option {String.fromCharCode(65 + i)}:
              </label>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const setter = [
                    setOptionA,
                    setOptionB,
                    setOptionC,
                    setOptionD,
                  ][i];
                  setter(e.target.value);
                }}
                className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          ))}
        </div>
      )}

      {/* Table Builder */}
      {type === "TABLE" && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Customize Table
          </h3>
          <div className="space-y-2 mb-4">
            {["col1", "col2", "col3"].map((col, i) => (
              <div key={col} className="flex justify-between items-center">
                <label className="w-1/3 text-gray-800 dark:text-gray-100">
                  Header {i + 1}:
                </label>
                <input
                  type="text"
                  value={headers[col]}
                  onChange={(e) =>
                    setHeaders({ ...headers, [col]: e.target.value })
                  }
                  className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            ))}
          </div>

          {/* Rows */}
          <table className="w-full mb-4 text-left">
            <thead>
              <tr>
                <th className="pr-2">{headers.col1}</th>
                <th className="pr-2">{headers.col2}</th>
                <th className="pr-2">{headers.col3}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr key={idx}>
                  {["col1", "col2", "col3"].map((col) => (
                    <td key={col} className="pr-2">
                      <input
                        type="text"
                        value={row[col]}
                        onChange={(e) =>
                          updateTableRow(idx, col, e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      onClick={() => removeTableRow(idx)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right">
            <button
              type="button"
              onClick={addTableRow}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Add Row
            </button>
          </div>
        </div>
      )}

      {/* Points */}
      <div className="flex justify-between items-center mb-6">
        <label className="w-1/3 text-gray-800 dark:text-gray-100">
          Points:
        </label>
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-2/3 px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Submit */}
      <div className="text-center">
        <input
          type="submit"
          onClick={addQuestion}
          value="Add Question"
          disabled={!text.trim() || !correct.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition cursor-pointer"
        />
      </div>

      {/* Scroll to Top Button */}
      {showScrollUp && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition"
        >
          ↑
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Component: DeleteQuestion
const DeleteQuestion = ({ assignmentId, qid, text, pts }) => {
  const delQuestion = async () => {
    const questionRef = doc(db, "assignments", assignmentId, "questions", qid);
    const docSnap = await getDoc(questionRef);

    if (docSnap.exists()) {
      await deleteDoc(questionRef);

      // Recalculate total points
      await recalculateTotalPoints(assignmentId);

      alert("Deleted successfully");
      window.location.reload();
    } else {
      alert("Question doesn't exist");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-3 flex justify-between items-center">
      <span className="text-gray-800 dark:text-gray-100">
        {text} ({pts} pts)
      </span>
      <button
        type="button"
        onClick={delQuestion}
        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
      >
        ✕
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Component: ModifyDetails
const ModifyDetails = ({
  title: initTitle,
  pts: initPts,
  due,
  id,
  type: initType,
  submissionLimit: initLimit,
}) => {
  const [title, setTitle] = useState(initTitle || "");
  const [pts, setPts] = useState(initPts || 0);
  const [dueDate, setDueDate] = useState(
    due && typeof due.toDate === "function"
      ? due.toDate().toISOString().slice(0, 16)
      : ""
  );

  // Use the passed type from Firestore or default to 'quizzes'
  const [assignmentType, setAssignmentType] = useState(initType || "quizzes");

  // Use passed submission limit or default to 1
  const [submissionLimit, setSubmissionLimit] = useState(initLimit ?? 1);

  const updateData = async () => {
    try {
      const assignmentRef = doc(db, "assignments", id);
      const newDue = Timestamp.fromDate(new Date(dueDate));

      await updateDoc(assignmentRef, {
        title,
        points: Number(pts),
        due_date: newDue,
        type: assignmentType,
        submission_limit: Number(submissionLimit),
      });

      alert("Assignment updated");
      window.location.reload();
    } catch (err) {
      console.error("Error updating assignment:", err);
      alert("Failed to update assignment");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 w-full max-w-3xl mb-8">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
        Edit Assignment Details
      </h1>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div>
          <label className="block text-gray-800 dark:text-gray-100 mb-1">
            New Title:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-gray-800 dark:text-gray-100 mb-1">
            Total Points:
          </label>
          <input
            type="number"
            value={pts}
            readOnly
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-gray-800 dark:text-gray-100 mb-1">
            New Due Date:
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-gray-800 dark:text-gray-100 mb-1">
            Assignment Type:
          </label>
          <select
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value)}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="quizzes">Quiz</option>
            <option value="homework">Homework</option>
            <option value="exams">Test</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-800 dark:text-gray-100 mb-1">
            Submission Limit:
          </label>
          <input
            type="number"
            min="1"
            value={submissionLimit}
            onChange={(e) => setSubmissionLimit(Number(e.target.value))}
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="text-center">
          <input
            type="submit"
            onClick={updateData}
            value="Update Assignment"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
          />
        </div>
      </form>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Component: AssignmentEditor
const AssignmentEditor = () => {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState(null);
  const [pts, setPts] = useState(null);
  const [due, setDue] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [type, setType] = useState("");
  const [submissionLimit, setSubmissionLimit] = useState(null);
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const assignmentRef = doc(db, "assignments", assignmentId);
        const assignSnap = await getDoc(assignmentRef);

        if (assignSnap.exists()) {
          const data = assignSnap.data();
          setTitle(data.title || "Untitled");
          setPts(data.points || 0);
          setDue(data.due_date || null);
          setType(data.type || "Not specified");
          setSubmissionLimit(data.submission_limit ?? "No limit");
          setCourseName(data.course);

          const questionSnap = await getDocs(
            collection(db, "assignments", assignmentId, "questions")
          );
          const questionList = [];
          questionSnap.forEach((docSnap) => {
            const q = docSnap.data();
            questionList.push({
              id: docSnap.id,
              text: q.text,
              pts: q.points,
            });
          });

          setQuestions(questionList);

          // Optional: recalculate total points just in case
          await recalculateTotalPoints(assignmentId);
        } else {
          alert("Assignment not found");
        }
      } catch (err) {
        console.error("Error fetching assignment:", err);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  if (!title) {
    return (
      <h1 className="text-center text-xl text-gray-800 dark:text-gray-100 mt-10">
        Loading assignment...
      </h1>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex flex-col items-center">
      <AddQuestion assignmentId={assignmentId} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 w-full max-w-3xl mb-8">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
          Delete Questions
        </h1>
        {questions.map((q) => (
          <DeleteQuestion
            key={q.id}
            qid={q.id}
            text={q.text}
            pts={q.pts}
            assignmentId={assignmentId}
          />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 w-full max-w-3xl mb-8">
        <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white text-center">
          Current Assignment Details
        </h1>
        <p className="text-gray-800 dark:text-gray-100 mb-2">Title: {title}</p>
        <p className="text-gray-800 dark:text-gray-100 mb-2">Points: {pts}</p>
        <p className="text-gray-800 dark:text-gray-100 mb-2">
          Due:{" "}
          {due && typeof due.toDate === "function"
            ? `${due.toDate().toLocaleDateString()} - ${due
                .toDate()
                .toLocaleTimeString()}`
            : "Not set"}
        </p>
        <p className="text-gray-800 dark:text-gray-100 mb-2">Type: {type}</p>
        <p className="text-gray-800 dark:text-gray-100 mb-4">
          Submission Limit: {submissionLimit}
        </p>
      </div>

      <ModifyDetails title={title} pts={pts} due={due} id={assignmentId} />

      {courseName && (
        <button
          onClick={() =>
            navigate(`/Faculty-Courses/${encodeURIComponent(courseName)}`)
          }
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          Back to Course Page
        </button>
      )}
    </div>
  );
};

export default AssignmentEditor;
