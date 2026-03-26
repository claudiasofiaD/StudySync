import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signOut } from "./firebase";
import Navbar from "./components/NavBar";
import UserCalendarWrapper from "./components/UserCalendarWrapper";

const StudentCalendarPage = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

const studentNavItems = [
  { to: "/Student-Dashboard", icon: "🏠", label: "Home" },
  { to: "/Student-myCourse", icon: "📚", label: "My Courses" },
  { to: "/Student-Announcements", icon: "📣", label: "Announcements" },
  { to: "/Student-calendar", icon: "🗓️", label: "Calendar" },
];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        navItems={studentNavItems}
      />

      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        } p-6`}
      >
        <h2 className="text-2xl font-semibold mb-4">🗓️ Assignment Calendar</h2>
        <UserCalendarWrapper role="student" />
      </main>
    </div>
  );
};

export default StudentCalendarPage;
