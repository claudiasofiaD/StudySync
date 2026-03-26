import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login.jsx";
import SignUp from "./SignUp.jsx";
import VerifyEmail from "./VerifyEmail.jsx";
import AdminDashboard from "./Admin-Dashboard.jsx";
import StudentDashboard from "./Student-Dashboard.jsx";
import FacultyDashboard from "./Faculty-Dashboard.jsx";
import StudentCourse from "./Student-Course.jsx";
import FacultyCourse from "./components/Faculty/FacultyCourse.jsx";
import AssignmentView from "./Assignment-View.jsx";
import AssignmentEditor from "./Assignment-Editor.jsx";
import FacultyMyCourse from "./Faculty-myCourse.jsx";
import StudentMyCourse from "./Student-myCourse.jsx";
import StudentAnnouncements from "./StudentAnnouncements.jsx";
import FacultyAnnouncements from "./FacultyAnnouncements.jsx";
import StudentResources from "./StudentResources.jsx";
import FacultyResources from "./FacultyResources.jsx";
import DashboardHome from "./components/DashboardHome.jsx";
import StudentCalendarPage from "./StudentCalendarPage.jsx";
import FacultyCalendarPage from "./FacultyCalendarPage.jsx";
import Landing from "./Landing.jsx";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
      document.title = 'StudySync';
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 text-gray-900 dark:text-gray-100">
      {/* Dark mode toggle button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 z-50 bg-gray-300 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 px-3 py-1 rounded-md shadow-md"
      >
        {isDarkMode ? "☀ Light" : "🌙 Dark"}
      </button>

      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/VerifyEmail" element={<VerifyEmail />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
          <Route
            path="/student-courses/:courseName"
            element={<StudentCourse />}
          />
          <Route
            path="/faculty-courses/:courseName"
            element={<FacultyCourse />}
          />
          <Route path="/assignment-view" element={<AssignmentView />} />
          <Route
            path="/assignment-view/:id/:courseName"
            element={<AssignmentView />}
          />
          <Route path="/assignment-editor/:id" element={<AssignmentEditor />} />
          <Route path="/student-mycourse" element={<StudentMyCourse />} />
          <Route path="/faculty-mycourse" element={<FacultyMyCourse />} />
          <Route
            path="/Student-Announcements"
            element={<StudentAnnouncements />}
          />
          <Route
            path="/Faculty-Announcements"
            element={<FacultyAnnouncements />}
          />
          <Route
            path="/Student-Resources/:courseName"
            element={<StudentResources />}
          />
          <Route path="/Faculty-Resources" element={<FacultyResources />} />
          <Route path="/Student-calendar" element={<StudentCalendarPage />} />
          <Route path="/Faculty-calendar" element={<FacultyCalendarPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
