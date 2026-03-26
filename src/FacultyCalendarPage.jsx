import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signOut } from "./firebase";
import Navbar from "./components/NavBar";
import UserCalendarWrapper from "./components/UserCalendarWrapper";

const FacultyCalendarPage = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const facultyNavItems = [
    { to: "/Faculty-Dashboard", icon: "🏠", label: "Home" },
    { to: "/Faculty-myCourse", icon: "📚", label: "My Courses" },
    { to: "/Faculty-Announcements", icon: "📣", label: "Announcements" },
    { to: "/Faculty-calendar", icon: "🗓️", label: "Calendar" },
    { to: "/Faculty-Resources", icon: "📣", label: "Resources" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar
        onLogout={handleLogout}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        navItems={facultyNavItems}
      />

      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        } p-6`}
      >
        <h2 className="text-2xl font-semibold mb-4">🗓️ Faculty Calendar</h2>
        <UserCalendarWrapper role="faculty" />
      </main>
    </div>
  );
};

export default FacultyCalendarPage;
