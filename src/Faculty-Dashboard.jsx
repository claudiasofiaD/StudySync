// src/FacultyDashboard.jsx
import { useEffect, useState } from "react";
import CourseCard from "./components/CourseCard";
import {
  auth,
  db,
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  signOut,
} from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import UserCalendarWrapper from "./components/UserCalendarWrapper";
import Navbar from "./components/NavBar";

const FacultyDashboard = () => {
  const [userName, setUserName] = useState("");
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true); // Loading indicator
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

  /* detect auth state and fetch user data */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserName(data.name || "Faculty");

          const classNames = data.classes || [];

          // Fetch class docs for all classes the user has
          const classDocs = await Promise.all(
            classNames.map((className) => getDoc(doc(db, "classes", className)))
          );

          // Map classes to { name, imageUrl, description, roomNumber }
          const coursesData = classDocs.map((docSnap, index) => {
            if (docSnap.exists()) {
              const classData = docSnap.data();
              return {
                name: classNames[index],
                imageUrl: classData.imageUrl || "/assets/default-course.jpg",
                description: classData.description || "",
                roomNumber: classData.roomNumber || "",
              };
            } else {
              return {
                name: classNames[index],
                imageUrl: "/assets/default-course.jpg",
                description: "-",
                roomNumber: "-",
              };
            }
          });

          setCourses(coursesData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCourses(false); // ✅ Done loading
      }
    });

    return () => unsub();
  }, [navigate]);

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
        } p-6 space-y-12`}
      >
        <header className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold">
            Welcome, <span className="text-blue-600">{userName}</span>
          </h2>
        </header>

        <section>
          <h3 className="text-2xl font-semibold mb-4">📚 My Courses</h3>

          {loadingCourses ? (
            <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {courses.map((course, idx) => (
                <CourseCard course={course} key={idx} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No courses yet. Please contact your admin.
            </p>
          )}
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-4">🗓️ Assignment Calendar</h3>
          <UserCalendarWrapper />
        </section>
      </main>
    </div>
  );
};

export default FacultyDashboard;

