import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  auth,
  db,
  doc,
  getDoc,
  getDocs,
  collection,
  signOut,
} from "./firebase";

import Navbar from "./components/NavBar";
import StudentCourseResources from "./StudentCourseResources";

const AssignmentCard = ({ assignment, courseName, id, studentId }) => {
  const { title, description, due_date } = assignment;
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const checkSubmission = async () => {
      if (!studentId) return;
      const submissionsRef = collection(db, "assignments", id, "submissions");
      const snapshot = await getDocs(submissionsRef);
      snapshot.forEach((docSnap) => {
        if (docSnap.data().user === studentId) setSubmitted(true);
      });
    };
    checkSubmission();
  }, [id, studentId]);

  const formatDate = (ts) =>
    ts?.toDate ? ts.toDate().toLocaleDateString() : "—";

  const getTimeRemaining = (dueDate) => {
    if (!dueDate?.toDate) return { label: null, color: "" };
    const now = new Date();
    const due = dueDate.toDate();
    const diffMs = due - now;

    if (diffMs <= 0)
      return { label: "Overdue", color: "bg-red-100 text-red-800" };

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);

    let label = "";
    if (diffDays > 0 && diffHours > 0)
      label = `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}, ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    else if (diffDays > 0)
      label = `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
    else label = `Due in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;

    let color = "";
    if (diffDays >= 7) color = "bg-green-100 text-green-800";
    else if (diffDays >= 2) color = "bg-yellow-100 text-yellow-800";
    else color = "bg-orange-100 text-orange-800";

    return { label, color };
  };

  const { label: timeLabel, color: timeColor } = getTimeRemaining(due_date);

  return (
    <li className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-4 shadow hover:shadow-lg transition">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Link
          to={`/assignment-view/${id}/${encodeURIComponent(courseName)}`}
          className="text-lg font-semibold text-blue-600 hover:underline"
        >
          {title || "Untitled Assignment"}
        </Link>

        <div className="flex items-center gap-2">
          {submitted ? (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Submitted
            </span>
          ) : timeLabel === "Overdue" ? (
            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              Overdue
            </span>
          ) : (
            <span className={`inline-block ${timeColor} text-xs px-2 py-1 rounded-full`}>
              ⏳ {timeLabel}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
        <p>
          <span className="font-medium">⏰ Due:</span> {formatDate(due_date)}
        </p>
        <p>
          <span className="font-medium">📝 Description:</span> {description || "—"}
        </p>
      </div>
    </li>
  );
};

const StudentCourse = () => {
  const { courseName } = useParams();
  const decodedCourseName = decodeURIComponent(courseName);
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assignments");
  const [grades, setGrades] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [assignmentCache, setAssignmentCache] = useState({});

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const studentNavItems = [
    { to: "/Student-Dashboard", icon: "🏠", label: "Home" },
    { to: "/Student-myCourse", icon: "📚", label: "My Courses" },
    { to: "/Student-Announcements", icon: "📣", label: "Announcements" },
    { to: "/Student-calendar", icon: "🗓️", label: "Calendar" },
    {
      to: `/Student-Resources/${encodeURIComponent(courseName)}`,
      icon: "📣",
      label: "Resources",
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Signed out successfully.");
      navigate("/login");
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) navigate("/");
      else setStudentId(user.uid);
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const courseRef = doc(db, "classes", decodedCourseName);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) setCourseData(courseSnap.data());
        else setCourseData(null);
      } catch (err) {
        console.error(err);
        setCourseData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [decodedCourseName]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!courseData?.assignments?.length) return;
      const cache = {};
      for (const id of courseData.assignments) {
        const ref = doc(db, "assignments", id);
        const snap = await getDoc(ref);
        if (snap.exists()) cache[id] = snap.data();
      }
      setAssignmentCache(cache);
    };
    if (activeTab === "assignments") fetchAssignments();
  }, [activeTab, courseData]);

  useEffect(() => {
    const fetchStudentGrades = async () => {
      if (!studentId || !courseData?.assignments?.length) return;

      const weights = courseData.gradeWeights || { exams: 1, homework: 1, quizzes: 1 };
      const studentGrades = [];

      for (const assignmentId of courseData.assignments) {
        const assignmentSnap = await getDoc(doc(db, "assignments", assignmentId));
        const assignment = assignmentSnap.exists() ? assignmentSnap.data() : {};
        const title = assignment.title || "Untitled Assignment";
        const type = assignment.type || "other";
        const weight = weights[type] || 1;

        const submissionsSnap = await getDocs(collection(db, "assignments", assignmentId, "submissions"));
        const studentSubs = submissionsSnap.docs.filter((d) => d.data().user === studentId);

        if (!studentSubs.length) {
          studentGrades.push({ assignmentId, title, type, grade: "Not submitted", weight });
          continue;
        }

        let highest = 0;

        for (const sub of studentSubs) {
          const data = sub.data();
          const questionsSnap = await getDocs(collection(db, "assignments", assignmentId, "submissions", sub.id, "questions"));
          let total = 0, earned = 0;

          questionsSnap.forEach((q) => {
            const qData = q.data();
            const pts = qData.points || 1;
            total += pts;
            if (typeof qData.earned_points === "number") earned += qData.earned_points;
            else if (qData.expected_answer?.toString().trim().toLowerCase() === qData.student_answer?.toString().trim().toLowerCase()) earned += pts;
          });

          const percent = data.manualGrade != null ? data.manualGrade : total ? Math.round((earned / total) * 100) : 0;
          if (percent > highest) highest = percent;
        }

        studentGrades.push({ assignmentId, title, type, grade: `${highest}%`, weight });
      }

      setGrades(studentGrades);
    };

    if (activeTab === "grades") fetchStudentGrades();
    else setGrades([]);
  }, [activeTab, courseData, studentId]);

  const calculateWeightedAverage = (gradesList) => {
  if (!gradesList.length) return null;

  // Organize grades by type
  const categories = {};
  gradesList.forEach((g) => {
    if (g.grade === "Not submitted") return;
    const num = parseFloat(g.grade.replace("%",""));
    if (!categories[g.type]) categories[g.type] = [];
    categories[g.type].push(num);
  });

  const weights = courseData.gradeWeights || { exams: 1, homework: 1, quizzes: 1 };

  let totalWeighted = 0;
  let totalWeight = 0;

  // Calculate category average first, then apply weight
  for (const type in categories) {
    const grades = categories[type];
    if (!grades.length) continue;
    const avg = grades.reduce((a,b) => a+b, 0) / grades.length;
    const weight = weights[type] || 0;
    totalWeighted += avg * weight;
    totalWeight += weight;
  }

  return totalWeight ? Math.round(totalWeighted / totalWeight) : null;
};


  if (loading) return <div className="p-6 text-center">Loading course...</div>;
  if (!courseData) return <div className="p-6 text-center">Course not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar onLogout={handleLogout} isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} navItems={studentNavItems} />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? "ml-20" : "ml-64"} p-6 flex flex-col items-center space-y-8`}>
        <header className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold">{courseData.className}</h2>
        </header>

        <div className="w-full flex justify-center gap-4 flex-wrap">
          {["assignments", "resources", "grades"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-medium transition ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border hover:bg-blue-100 dark:hover:bg-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-6 w-full max-w-4xl">
          {activeTab === "assignments" && (
            <div className="space-y-6 w-full max-w-4xl">
              <h3 className="text-xl font-semibold text-center">Your Assignments</h3>
              {courseData.assignments?.length > 0 ? (
                Object.entries(
                  courseData.assignments.reduce((acc, id) => {
                    const assignment = assignmentCache[id];
                    if (!assignment?.due_date?.toDate) return acc;
                    const weekStart = new Date(assignment.due_date.toDate());
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    const key = `${weekStart.getTime()}_${weekEnd.getTime()}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push({ id, data: assignment });
                    return acc;
                  }, {})
                ).map(([weekRange, assignments]) => {
                  const [startTime, endTime] = weekRange.split("_").map(Number);
                  const start = new Date(startTime), end = new Date(endTime), today = new Date();
                  const isCurrentWeek = today >= start && today <= end;

                  return (
                    <div key={weekRange} className={`space-y-4 rounded-lg p-2 ${isCurrentWeek ? "border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-700" : ""}`}>
                      <div className="space-y-2">
                        <h4 className={`text-lg font-semibold text-left ${isCurrentWeek ? "text-blue-700 dark:text-blue-400" : "text-black dark:text-gray-200"}`}>
                          Week of {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {isCurrentWeek && <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">📅 Current Week</span>}
                        </h4>
                        <hr className="border-t border-gray-300 dark:border-gray-700" />
                      </div>
                      <ul className="space-y-4">
                        {assignments.sort((a, b) => a.data.due_date.toDate() - b.data.due_date.toDate())
                          .map(({ id, data }) => <AssignmentCard key={id} id={id} courseName={decodedCourseName} assignment={data} studentId={studentId} />)}
                      </ul>
                    </div>
                  );
                })
              ) : <p className="text-center text-gray-600 dark:text-gray-400">No current assignments for this course.</p>}
            </div>
          )}

          {activeTab === "resources" && <StudentCourseResources courseName={decodedCourseName} />}

          {activeTab === "grades" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center">Your Grades</h3>
              {grades.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400">No grades found.</p>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-4 shadow text-center">
                    <h4 className="font-semibold text-lg mb-2">Category Averages</h4>
                    <div className="flex justify-center gap-6 text-sm">
                      {["quizzes", "homework", "exams"].map((type) => {
                        const values = grades.filter(g => g.type === type && g.grade !== "Not submitted").map(g => parseFloat(g.grade.replace("%","")));
                        const avg = values.length ? (values.reduce((a,b)=>a+b,0)/values.length).toFixed(2) : "—";
                        return <div key={type}><span className="font-medium">{type.charAt(0).toUpperCase()+type.slice(1)}:</span> {avg}%</div>;
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-4 shadow overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-blue-600">Assignment</th>
                          <th className="px-4 py-2 font-semibold text-blue-600">Type</th>
                          <th className="px-4 py-2 font-semibold text-blue-600">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((g, idx) => (
                          <tr key={idx} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <td className="px-4 py-2">{g.title}</td>
                            <td className="px-4 py-2">{{"quizzes":"Quiz","homework":"Homework","exams":"Exam"}[g.type]||"Other"}</td>
                            <td className="px-4 py-2">
                              {g.grade === "Not submitted" ? (
                                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Not submitted</span>
                              ) : (() => {
                                const num = parseFloat(g.grade.replace("%",""));
                                const color = num >= 90 ? "bg-green-100 text-green-800" :
                                              num >= 80 ? "bg-lime-100 text-lime-800" :
                                              num >= 70 ? "bg-yellow-100 text-yellow-800" :
                                              num >= 60 ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800";
                                return <span className={`inline-block ${color} text-xs px-2 py-1 rounded-full`}>{g.grade}</span>;
                              })()}
                            </td>
                          </tr>
                        ))}

                        {/* FINAL GRADE */}
                        {(() => {
                          const finalPct = calculateWeightedAverage(grades);
                          if (finalPct === null) return null;
                          const letter = finalPct>=90?"A":finalPct>=80?"B":finalPct>=70?"C":finalPct>=60?"D":"F";
                          const color = letter==="A"?"bg-green-200 text-green-900":
                                        letter==="B"?"bg-lime-200 text-lime-900":
                                        letter==="C"?"bg-yellow-200 text-yellow-900":
                                        letter==="D"?"bg-orange-200 text-orange-900":"bg-red-200 text-red-900";
                          return (
                            <tr className="border-t-4 border-blue-600 bg-blue-50 dark:bg-blue-900 font-semibold sticky bottom-0">
                              <td className="px-4 py-3 text-blue-800 dark:text-blue-200">FINAL GRADE</td>
                              <td className="px-4 py-3 text-blue-800 dark:text-blue-200">Weighted</td>
                              <td className="px-4 py-3 text-blue-800 dark:text-blue-200">
                                <span className="font-bold">{finalPct}%</span>{" "}
                                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${color}`}>{letter}</span>
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentCourse;
