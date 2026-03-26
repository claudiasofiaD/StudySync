import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth, signOut } from "./firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/NavBar";

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const studentNavItems = [
    { to: "/Student-Dashboard", icon: "🏠", label: "Home" },
    { to: "/Student-myCourse", icon: "📚", label: "My Courses" },
    { to: "/Student-Announcements", icon: "📣", label: "Announcements" },
    { to: "/Student-calendar", icon: "🗓️", label: "Calendar" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  useEffect(() => {
    const fetchFacultyAnnouncements = async () => {
      try {
        const q = query(
          collection(db, "announcements"),
          where("authorRole", "==", "faculty")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const sorted = data.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.date?.seconds - a.date?.seconds;
        });

        setAnnouncements(sorted);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyAnnouncements();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return "Unknown";
    return timestamp.toDate().toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pinned = announcements.filter((a) => a.isPinned);
  const regular = announcements.filter((a) => !a.isPinned);

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
        } p-6 space-y-10`}
      >
        {loading ? (
          <p className="text-gray-500">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-gray-500">
            No announcements have been posted yet.
          </p>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <h2 className="text-2xl font-semibold mb-4">
                  📌 Pinned Announcements
                </h2>
                <ul className="space-y-6">
                  {pinned.map(
                    ({ id, title, message, date, course, authorName }) => (
                      <li
                        key={id}
                        className="rounded-xl border p-6 shadow-sm transition hover:shadow-md space-y-4 bg-yellow-50 dark:bg-yellow-100/10 border-yellow-300 dark:border-yellow-500"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <h4 className="text-xl font-semibold text-blue-600 dark:text-white mb-2 sm:mb-0">
                            📌 {title}
                          </h4>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {course}
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-100 whitespace-pre-line text-left">
                          {message}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Posted by: {authorName || "Faculty"}</span>
                          <span>{formatDate(date)}</span>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </>
            )}

            <h2 className="text-2xl font-semibold mb-4">
              📣 All Announcements
            </h2>
            {regular.length === 0 ? (
              <p className="text-gray-500">
                No regular announcements available.
              </p>
            ) : (
              <ul className="space-y-6">
                {regular.map(
                  ({ id, title, message, date, course, authorName }) => (
                    <li
                      key={id}
                      className="rounded-xl border p-6 shadow-sm transition hover:shadow-md space-y-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h4 className="text-xl font-semibold text-blue-600 dark:text-white mb-2 sm:mb-0">
                          {title}
                        </h4>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {course}
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-100 whitespace-pre-line text-left">
                        {message}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Posted by: {authorName || "Faculty"}</span>
                        <span>{formatDate(date)}</span>
                      </div>
                    </li>
                  )
                )}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default StudentAnnouncements;
