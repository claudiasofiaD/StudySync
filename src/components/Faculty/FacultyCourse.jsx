import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  auth,
  db,
  doc,
  getDoc,
  getDocs,
  onAuthStateChanged,
  signOut,
  query,
  collection,
  where,
} from "../../firebase";

import Navbar from "../NavBar";
import AssignmentList from "./AssignmentList";
import CreateAssignmentForm from "./CreateAssignmentForm";
import RosterTable from "./RosterTable";
import GradesTable from "./GradesTable";
import SubmissionModal from "./SubmissionsModal";
import GradeToolsAccordion from "./GradeToolsAccordion";
import CourseResources from "./CourseResources";

const FacultyCourse = () => {
  const { courseName } = useParams();
  const decodedCourseName = decodeURIComponent(courseName);
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [rosterNames, setRosterNames] = useState([]);
  const [activeTab, setActiveTab] = useState("assignments");
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Grading-related states
  const [submissionView, setSubmissionView] = useState(null);
  const [grades, setGrades] = useState([]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  const [error, setError] = useState(null);

  const facultyNavItems = [
    { to: "/Faculty-Dashboard", icon: "🏠", label: "Home" },
    { to: "/Faculty-myCourse", icon: "📚", label: "My Courses" },
    { to: "/Faculty-Announcements", icon: "📣", label: "Announcements" },
    { to: "/Faculty-calendar", icon: "🗓️", label: "Calendar" },
    { to: "/Faculty-Resources", icon: "📣", label: "Resources" },
  ];

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  // Authentication & role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/", { replace: true });
        return;
      }
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role);
        localStorage.setItem("userRole", userSnap.data().role);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch course and roster
  const fetchCourse = async () => {
    setLoading(true);
    try {
      const courseRef = doc(db, "classes", decodedCourseName);
      const courseSnap = await getDoc(courseRef);
      if (!courseSnap.exists()) {
        setCourseData(null);
        return;
      }

      const data = courseSnap.data();
      setCourseData(data);

      // Fetch student names in parallel
      const names = await Promise.all(
        (data.students || []).map(async (email) => {
          const snap = await getDocs(
            query(collection(db, "users"), where("email", "==", email))
          );
          return !snap.empty ? `${snap.docs[0].data().name} (${email})` : null;
        })
      );

      setRosterNames(names.filter(Boolean));
    } catch (err) {
      console.error("Error fetching course:", err);
      setError("Failed to load course data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [decodedCourseName]);

  if (loading) return <div>Loading course...</div>;
  if (!courseData) return <div>Course not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        navItems={facultyNavItems}
      />

      <main className={`transition-all p-6 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <header className="mb-6 text-3xl font-semibold">
          {courseData.className}
        </header>

        {/* Tabs */}
        <div className="flex justify-center gap-3 mb-8">
          {[
            "assignments",
            "create",
            "resources",
            "roster",
            "grades",
            "grade-tools",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2 rounded font-medium transition-colors duration-200
                ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700"
                }
              `}
            >
              {tab === "create"
                ? "Create Assignment"
                : tab === "grade-tools"
                ? "Export"
                : tab === "resources"
                ? "Resources"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "assignments" && (
          <AssignmentList
            courseData={courseData}
            decodedCourseName={decodedCourseName}
            fetchCourse={fetchCourse}
            userRole={userRole}
          />
        )}

        {activeTab === "create" && userRole === "faculty" && (
          <CreateAssignmentForm
            decodedCourseName={decodedCourseName}
            fetchCourse={fetchCourse}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "resources" && userRole === "faculty" && (
          <CourseResources courseName={decodedCourseName} />
        )}

        {activeTab === "roster" && <RosterTable rosterNames={rosterNames} />}

        {activeTab === "grades" && (
          <GradesTable
            courseData={courseData}
            grades={grades}
            setGrades={setGrades}
            setSubmissionView={setSubmissionView}
          />
        )}

        {submissionView && (
          <SubmissionModal
            submissionView={submissionView}
            setSubmissionView={setSubmissionView}
            setGrades={setGrades}
          />
        )}

        {activeTab === "grade-tools" && userRole === "faculty" && (
          <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8">
            <GradeToolsAccordion courseName={decodedCourseName} />
          </div>
        )}
      </main>
    </div>
  );
};

export default FacultyCourse;
