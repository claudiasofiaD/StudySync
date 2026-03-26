import React, { useEffect, useState } from 'react';
import {
    db,
    auth,
    doc,
    deleteDoc,
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    collection,
    query,
    where,
} from './firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import styles from './style/assignment-view.module.css';
import { serverTimestamp } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────
// MCQ Question
const MCQ = (props) => {
  const options = [props.optionA, props.optionB, props.optionC, props.optionD];

  return (
    <div className="mt-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {props.text}{' '}
        <span className="text-sm text-gray-500">({props.pts} pts)</span>
      </h3>

      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => (
          <label
            key={idx}
            className="flex items-center gap-3 border border-gray-200 rounded-lg bg-gray-50 px-4 py-2 cursor-pointer hover:bg-gray-100 transition"
          >
            <input
              required
              type="radio"
              name={props.qid}
              value={opt}
              className="accent-blue-600 scale-110"
            />
            <span className="text-gray-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// True/False Question
const TrueFalse = (props) => (
  <div className="mt-2">
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      {props.text}{' '}
      <span className="text-sm text-gray-500">({props.pts} pts)</span>
    </h3>
    <div className="flex flex-col gap-2">
      {['True', 'False'].map((val, idx) => (
        <label
          key={idx}
          className="flex items-center gap-3 border border-gray-200 rounded-lg bg-gray-50 px-4 py-2 cursor-pointer hover:bg-gray-100 transition"
        >
          <input
            required
            type="radio"
            name={props.qid}
            value={val}
            className="accent-blue-600 scale-110"
          />
          <span className="text-gray-700">{val}</span>
        </label>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Text Entry Question
const TextEntry = (props) => {
  const [answer, setAnswer] = useState('');

  return (
    <div className="mt-2">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {props.text}{' '}
        <span className="text-sm text-gray-500">({props.pts} pts)</span>
      </h3>
      <input
        required
        type="text"
        value={answer}
        name={props.qid}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full max-w-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Component: Fill in the blank question
const FillInTheBlank = (props) => {
    const [answer, setAnswer] = useState('');

    return (
        <div className={styles['question-block']}>
            {props.head}
            <input
                required
                type="text"
                value={answer}
                name={props.qid}
                onChange={(e) => setAnswer(e.target.value)}
                className={styles['text-input']}
            />
            {props.tail}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Component: Fill in the blank question (Drop-down/Multiple choice variant)
const FillInTheBlankMC = (props) => {
    const [answer, setAnswer] = useState('');
    const options = [props.optionA, props.optionB, props.optionC, props.optionD];

    return (
        <div className={styles['question-block']}>
            {props.head}
                <select
                    name={props.qid}
                >
                {options.map((opt, idx) => (
                    <option 
                        name={props.qid} 
                        value={opt}
                        onChange={(e) => setAnswer(e.target.value)}
                    >{opt}
                    </option>
                ))}
                </select>
            {props.tail}
        </div>
    );
};

const Table = (props) => {
    const [answer, setAnswer] = useState('');
    const tableData = props.tableData;
    const tableHeaders = props.tableHeaders;

    return (
        <div className={styles['question-block']}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {props.text}{' '}
                <span className="text-sm text-gray-500">({props.pts} pts)</span>
            </h3>     

            <table>
                <thead>
                    <tr>
                        <th>{tableHeaders['col1']}</th>
                        <th>{tableHeaders['col2']}</th>
                        <th>{tableHeaders['col3']}</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, id) => (
                        <tr>
                            <td>
                                {tableData[id]['col1']}
                            </td>
                            <td>
                                {tableData[id]['col2']}
                            </td>
                            <td>
                                {tableData[id]['col3']}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <br/>
            <input
                required
                type="text"
                value={answer}
                name={props.qid}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full max-w-lg border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
        </div>
    );
};

// Component: Unified Question Renderer
// ─────────────────────────────────────────────────────────────
const Question = (props) => {
  const type = props.type?.toUpperCase();
    return (
        <div className={styles['question-wrapper']}>
            <h2>Question {props.index + 1} of {props.total}</h2>
            {(() => {
                switch (type) {
                    case "TABLE":
                        return <Table {...props} />;
                    case "TF":
                        return <TrueFalse {...props} />;
                    case "MCQ":
                        return <MCQ {...props} />;
                    case "TXT":
                        return <TextEntry {...props} />;
                    case "FIB_EXACT":
                        return <FillInTheBlank {...props} />;
                    case "FIB_MC":
                        return <FillInTheBlankMC {...props} />;
                    default:
                        console.error(`❌ Invalid question type: "${props.type}" for question ID: ${props.qid}`);
                        return (
                            <div className={styles.error}>
                                <strong>Error:</strong> Invalid question type "{props.type}" (ID: {props.qid})
                            </div>
                        );
                }
            })()}
            <br />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Buttons
const ButtonGroup = ({ onBack, onStart, showStart }) => (
  <div className="flex justify-center gap-4 mt-8">
    <button
      onClick={onBack}
      type="button"
      className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-md transition"
    >
      ← Back to Course
    </button>

    {showStart && (
      <button
        onClick={onStart}
        type="button"
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition"
      >
        🚀 Start Assignment
      </button>
    )}
  </div>
);


// ─────────────────────────────────────────────────────────────
// Component: FeedbackCard 
const FeedbackCard = ({ assignmentId, submission, index }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchSubmissionQuestions = async () => {
      try {
        const questionsRef = collection(
          db,
          "assignments",
          assignmentId,
          "submissions",
          submission.id,
          "questions"
        );
        const snapshot = await getDocs(questionsRef);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setQuestions(data);
      } catch (err) {
        console.error("Error loading submission feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionQuestions();
  }, [assignmentId, submission.id]);

  const getGrade = () => {
    if (submission.manualOverride && submission.manualGrade !== undefined) {
      return submission.manualGrade;
    }

    const total = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    const earned = questions.reduce((sum, q) => sum + (q.earned_points || 0), 0);
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4 shadow-sm">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
  <div>
    <h4 className="text-lg font-semibold text-gray-800">
      Submission #{index + 1}
    </h4>
    {/* Submission Time */}
    {submission.submittedAt && (
      <p className="text-gray-500 text-sm">
        Submitted: {submission.submittedAt.toDate().toLocaleString()}
      </p>
    )}
  </div>

  <div className="flex items-center gap-4 mt-2 sm:mt-0">
    <p className="text-gray-700">
      <strong>Score:</strong>{" "}
      <span className="text-blue-600 font-semibold">{getGrade()}%</span>
    </p>
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition"
    >
      {expanded ? "Hide Details" : "Show Details"}
    </button>
  </div>
</div>

      {/* Feedback Table */}
      {expanded && (
        <div className="mt-3">
          {loading ? (
            <p className="text-gray-500 italic">Loading feedback...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-100 text-gray-800 font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-left border-b border-gray-200">Question</th>
                    <th className="py-2 px-3 text-left border-b border-gray-200">Your Answer</th>
                    <th className="py-2 px-3 text-left border-b border-gray-200">Correct Answer</th>
                    <th className="py-2 px-3 text-left border-b border-gray-200">Points</th>
                    <th className="py-2 px-3 text-left border-b border-gray-200">Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr
                      key={q.id}
                      className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <td className="py-2 px-3 border-b border-gray-200 text-gray-800">
                        {q.question_text}
                      </td>
                      <td className="py-2 px-3 border-b border-gray-200 text-gray-700">
                        {q.student_answer || "N/A"}
                      </td>
                      <td className="py-2 px-3 border-b border-gray-200 text-gray-700">
                        {q.expected_answer || "N/A"}
                      </td>
                      <td className="py-2 px-3 border-b border-gray-200 text-gray-700">
                        {q.points || 0}
                      </td>
                      <td
                        className={`py-2 px-3 border-b border-gray-200 font-semibold ${
                          q.earned_points > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {q.earned_points ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Component: Assignment View
const AssignmentView = ({ studentId }) => {
    const { id: DEBUG_ID, courseName } = useParams();
    const navigate = useNavigate();
    //const { id, courseName } = useParams();
    const decodedCourseName = decodeURIComponent(courseName);

    const [title, setTitle] = useState(null);
    const [pts, setPts] = useState(null);
    const [due, setDue] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [user, setUser] = useState(null);
    const [type, setType] = useState('');
    const [submissionLimit, setSubmissionLimit] = useState(1);
    const [hasStarted, setHasStarted] = useState(false);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [existingSubmissions, setExistingSubmissions] = useState([]);
    const [timeLeft, setTimeLeft] = useState('');
    const [assignmentData, setAssignmentData] = useState(null);


    // Auth check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    setUser(user);
                } else {
                    console.warn('User document not found.');
                }
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Load assignment details and questions
    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const assignRef = await getDoc(doc(db, "assignments", DEBUG_ID));
                if (!assignRef.exists()) {
                    alert("Assignment does not exist or was not found");
                    return;
                }

                const data = assignRef.data();
                setTitle(data.title);
                setPts(data.points);
                setDue(data.due_date);
                setType(data.type || 'Quiz');
                setSubmissionLimit(data.submission_limit || 1);
                setAssignmentData(data);

                const querySnapshot = await getDocs(collection(db, "assignments", DEBUG_ID, "questions"));
                const questionsData = [];

                querySnapshot.forEach((docSnap, index) => {
                    const qData = docSnap.data();
                    const questionType = qData.type?.toUpperCase();

                    if (!["MCQ", "TF", "TXT", "FIB_EXACT", "FIB_MC", "TABLE"].includes(questionType)) {
                        console.warn(`Skipping invalid question type "${qData.type}" in question ID: ${docSnap.id}`);
                        return;
                    }

                    questionsData.push({
                        key: index,
                        qid: docSnap.id,
                        type: questionType,
                        text: qData.text,
                        pts: qData.points,
                        correct: qData.correct,
                        optionA: qData.optionA,
                        optionB: qData.optionB,
                        optionC: qData.optionC,
                        optionD: qData.optionD,
                        head: qData.head,
                        tail: qData.tail,
                        tableData: qData.tableData,
                        tableHeaders: qData.tableHeaders,
                    });
                });

                setQuestions(questionsData);
            } catch (err) {
                console.error("Error loading assignment:", err);
                alert("There was an error loading the assignment.");
            }
        };

        fetchAssignment();
    }, [DEBUG_ID]);

    // Load timer for due date
    useEffect(() => {
    if (!due || typeof due.toDate !== 'function') return;

    const interval = setInterval(() => {
        const now = new Date();
        const deadline = due.toDate();
        const diff = deadline - now;

        if (diff <= 0) {
            setTimeLeft("⚠️ Assignment is past due!");
            clearInterval(interval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(
            `${days}d ${hours}h ${minutes}m ${seconds}s`
        );
    }, 1000);

    return () => clearInterval(interval);
    }, [due]);

    // Load existing submissions after user is loaded
    useEffect(() => {
        if (!user) return;

        const getSubmissions = async () => {
            const submissionRef = collection(db, 'assignments', DEBUG_ID, 'submissions');
            const q = query(submissionRef, where('user', '==', user.uid));
            const querySnapshot = await getDocs(q);

            const submissions = [];
            querySnapshot.forEach(doc => submissions.push({ id: doc.id, ...doc.data() }));

            setSubmissionCount(submissions.length);
            setExistingSubmissions(submissions);
        };

        getSubmissions();
    }, [user, DEBUG_ID]);

    // Submission form logic
    const scoreAnswers = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  if (!user) return;

  // Calculate score
  let earnedPoints = 0;
  let totalPoints = 0;

  for (let i = 0; i < questions.length; i++) {
    const expected = questions[i].correct?.toString().trim().toLowerCase();
    const answer = formData.get(questions[i].qid)?.toString().trim().toLowerCase();

    totalPoints += questions[i].pts;
    if (expected === answer) earnedPoints += questions[i].pts;
  }

  const gradePercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

  // Save submission under assignments/assignmentID/submissions
  const submissionRef = await addDoc(
    collection(db, "assignments", DEBUG_ID, "submissions"),
    {
      user: user.uid,
      submittedAt: serverTimestamp(),
      score: gradePercent,
      earnedPoints,
      totalPoints,
    }
  );

  // Save each question response
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const answer = formData.get(q.qid);

    await addDoc(
      collection(db, "assignments", DEBUG_ID, "submissions", submissionRef.id, "questions"),
      {
        question_id: q.qid,
        question_text: q.text,
        points: q.pts,
        expected_answer: q.correct,
        student_answer: answer,
        earned_points:
          q.correct?.toString().trim().toLowerCase() ===
          answer?.toString().trim().toLowerCase()
            ? q.pts
            : 0,
      }
    );
  }

  // Get student and assignment info
  const userSnap = await getDoc(doc(db, "users", user.uid));
  const studentName = userSnap.exists() ? userSnap.data().name : "Unknown Student";

  const assignSnap = await getDoc(doc(db, "assignments", DEBUG_ID));
  const assignmentTitle = assignSnap.exists() ? assignSnap.data().title : "Untitled Assignment";

  const courseNameFinal = decodeURIComponent(courseName) || "Unknown Class";

  // Update grades document (highest grade only, no need to store each submission here)
  const gradeDocRef = doc(db, "grades", `${DEBUG_ID}_${user.uid}`);
  const gradeDocSnap = await getDoc(gradeDocRef);

  let highestGrade = gradePercent;

  if (gradeDocSnap.exists()) {
    const prevGrade = gradeDocSnap.data().gradePercent || 0;
    highestGrade = Math.max(prevGrade, gradePercent);
  }

  await setDoc(
    gradeDocRef,
    {
      assignmentId: DEBUG_ID,
      assignmentTitle,
      courseName: courseNameFinal,
      userId: user.uid,
      studentName,
      gradePercent: highestGrade,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Navigate back to course
  navigate(`/student-courses/${encodeURIComponent(courseNameFinal)}`);
};

    if (title === null || pts === null || user === null) {
        return <h1>Loading...</h1>;
    }

    // Submission limit reached
    if (submissionCount >= submissionLimit) {
        return (
            <div className={styles['assignment-container']}>
                <div className={styles.header}>
                    <h1>{title}</h1>
                    <p><strong>You have used all submission attempts.</strong></p>
                    <p>Total Submissions: {submissionCount}</p>

                    {existingSubmissions.map((submission, idx) => (
                        <FeedbackCard
                            key={submission.id}
                            assignmentId={DEBUG_ID}
                            submission={submission}
                            index={idx}
                        />
                    ))}

                    <div className={styles['button-group']}>
                        <button
                            className={styles['back-button']}
                            onClick={() => navigate(`/student-courses/${encodeURIComponent(courseName)}`)}
                            type="button"
                        >
                            ← Back to Course
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Start screen
    if (!hasStarted) {
    return (
        <div className={styles['assignment-container']}>
            <div className={styles['buffer-wrapper']}>
                <div className={styles['buffer-header']}>
                    <h1>{title}</h1>
                </div>

                <div className={styles['buffer-meta']}>
                    <p><strong>📘 Type:</strong> {type}</p>
                    <p><strong>📌 Max Submissions:</strong> {submissionLimit}</p>
                    <p><strong>⏰ Due:</strong> {due && typeof due.toDate === 'function'
                        ? `${due.toDate().toLocaleDateString()} at ${due.toDate().toLocaleTimeString()}`
                        : 'Not set'}
                    </p>

                    {timeLeft && (
                        <div className={styles['countdown-timer']}>
                            ⏳ Time Remaining: {timeLeft}
                        </div>
                    )}

                    <p><strong>🧮 Total Points:</strong> {pts}</p>
                </div>

                <div className={styles['instructions']}>
                    <p>
                        Please read all instructions carefully. Once you begin the assignment, you must complete it in one session. 
                        Ensure a stable internet connection and enough time to finish all questions.
                    </p>
                </div>

                <div className={styles['button-group']}>
                    <button 
                        className={styles['back-button']}
                        onClick={() => navigate(`/student-courses/${encodeURIComponent(courseName)}`)}
                        type="button"
                    >
                        ← Back to Course
                    </button>

                    <button 
                        className={styles['start-button']}
                        onClick={() => setHasStarted(true)}
                        type="button"
                    >
                        🚀 Start Assignment
                    </button>
                </div>
            </div>
        </div>
    );
}


    return (
        <div className={styles['assignment-container']}>
            <div className={styles.header}>
                <h1>{title}</h1>
            </div>

            <form onSubmit={scoreAnswers}>
                <div>
                    {questions.length > 0 ? (
                        questions.map((q, index) => (
                            <Question
                                key={q.key}
                                index={index}
                                total={questions.length}
                                {...q}
                            />
                        ))
                    ) : (
                        <p className={styles.error}>
                            No valid questions available for this assignment.
                        </p>
                    )}
                </div>
                <br />
                <button type="submit" className={styles['submit-button']}>Submit</button>
            </form>
        </div>
    );
};

export default AssignmentView;
