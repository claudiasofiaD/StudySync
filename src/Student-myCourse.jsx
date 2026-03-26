import { useEffect, useState } from "react";
import { auth, db, doc, getDoc, signOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/NavBar";
import CourseCard from "./components/CourseCard";

function StudentMyCourse() {
  const [userName, setUserName] = useState("");
  const [courses, setCourses] = useState([]);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.name || "Student");

          const classNames = userData.classes || [];

          const classDocs = await Promise.all(
            classNames.map((className) => getDoc(doc(db, "classes", className)))
          );

          const fullCourses = classDocs.map((docSnap, index) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              return {
                name: classNames[index],
                imageUrl: data.imageUrl || "/assets/default-course.jpg",
                description: data.description || "",
                roomNumber: data.roomNumber || "",
              };
            }
            return {
              name: classNames[index],
              imageUrl: "/assets/default-course.jpg",
              description: "",
              roomNumber: "",
            };
          });

          setCourses(fullCourses);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

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
        } p-6 space-y-12`}
      >
        <section>
          <h3 className="text-2xl font-semibold mb-4">📚 My Courses</h3>

          {loading ? (
            <p className="text-gray-500">Loading your courses...</p>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {courses.map((course, idx) => (
                <CourseCard course={course} key={idx} role="student" />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No courses assigned. Please contact your administrator.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default StudentMyCourse;
