import { useEffect, useState } from "react";
import { auth, db, doc, getDoc, collection, query, getDocs } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import AssignmentCalendar from "./AssignmentCalendar";

const UserCalendarWrapper = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.data();
        const classNames = data.classes || [];

        const classDocs = await Promise.all(
          classNames.map((className) => getDoc(doc(db, "classes", className)))
        );

        const coursesData = classDocs.map((docSnap, index) => {
          const classData = docSnap.exists() ? docSnap.data() : {};
          return {
            name: classNames[index],
            imageUrl: classData.imageUrl || "/assets/default-course.jpg",
          };
        });

        setCourses(coursesData);

        const q = query(collection(db, "assignments"));
        const snaps = await getDocs(q);
        const filteredAssignments = snaps.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((a) => classNames.includes(a.course));

        setAssignments(filteredAssignments);
      } catch (err) {
        console.error("Calendar load error", err);
      }
    });

    return () => unsub();
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-6 justify-center mb-6">
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1">Filter by Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border rounded px-3 py-2 w-full bg-white dark:bg-gray-900 dark:text-white"
          >
            <option value="">All Courses</option>
            {courses.map((course, idx) => (
              <option key={idx} value={course.name}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-1">
            Filter by Assignment Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="border rounded px-3 py-2 w-full bg-white dark:bg-gray-900 dark:text-white"
          >
            <option value="">All Assignment Types</option>
            <option value="Quiz">Quizzes</option>
            <option value="Test">Exams</option>
            <option value="Homework">Homework</option>
          </select>
        </div>
      </div>

      <AssignmentCalendar
        assignments={assignments}
        selectedCourse={selectedCourse}
        selectedType={selectedType}
      />
    </div>
  );
};

export default UserCalendarWrapper;
