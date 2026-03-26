import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth, signOut } from "./firebase";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/NavBar";

const FacultyAnnouncements = () => {
  const [title, setTitle] = useState(localStorage.getItem("draftTitle") || "");
  const [message, setMessage] = useState(
    localStorage.getItem("draftMessage") || ""
  );
  const [course, setCourse] = useState(
    localStorage.getItem("draftCourse") || ""
  );
  const [isPinned, setIsPinned] = useState(
    localStorage.getItem("draftPinned") === "true"
  );
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterCourse, setFilterCourse] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [teacherName, setTeacherName] = useState("");

  const navigate = useNavigate();
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const facultyNavItems = [
    { to: "/Faculty-Dashboard", icon: "🏠", label: "Home" },
    { to: "/Faculty-myCourse", icon: "📚", label: "My Courses" },
    { to: "/Faculty-Announcements", icon: "📣", label: "Announcements" },
    { to: "/Faculty-calendar", icon: "🗓️", label: "Calendar" },
    { to: "/Faculty-Resources", icon: "📣", label: "Resources" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  useEffect(() => {
    localStorage.setItem("draftTitle", title);
    localStorage.setItem("draftMessage", message);
    localStorage.setItem("draftCourse", course);
    localStorage.setItem("draftPinned", isPinned.toString());
  }, [title, message, course, isPinned]);

  const fetchTeacherName = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const data = userSnap.data();
    setTeacherName(data?.name?.trim() || user.email || "Faculty");
  };

  const fetchCourses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const data = userSnap.data();
    const classNames = data.classes || [];

    const classDocs = await Promise.all(
      classNames.map((className) => getDoc(doc(db, "classes", className)))
    );

    const courseList = classDocs.map((docSnap, index) => ({
      name: classNames[index],
      imageUrl: docSnap.data()?.imageUrl || "/assets/default-course.jpg",
    }));

    setCourses(courseList);
  };

  const fetchAnnouncements = async () => {
    const q = query(
      collection(db, "announcements"),
      where("authorRole", "==", "faculty")
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const sorted = data.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.date?.seconds - a.date?.seconds;
    });

    setAnnouncements(sorted);
    setLoading(false);
  };

  useEffect(() => {
    fetchTeacherName();
    fetchCourses();
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    if (!title || !message || !course) {
      setStatusMessage("Please fill in all fields before posting.");
      return;
    }

    try {
      const payload = {
        title,
        message,
        course,
        date: Timestamp.now(),
        authorName: teacherName,
        authorRole: "faculty",
        isPinned,
      };

      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), payload);
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingId ? { ...a, ...payload } : a))
        );
        setEditingId(null);
        setStatusMessage("✅ Announcement updated!");
      } else {
        const docRef = await addDoc(collection(db, "announcements"), payload);
        setAnnouncements((prev) => [{ id: docRef.id, ...payload }, ...prev]);
        setStatusMessage("✅ Announcement posted!");
      }

      // Clear form and localStorage
      localStorage.clear();
      setTitle("");
      setMessage("");
      setCourse("");
      setIsPinned(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error posting announcement:", error);
      setStatusMessage("❌ Failed to post announcement.");
    }
  };

  const handleEdit = (announcement) => {
    setTitle(announcement.title);
    setMessage(announcement.message);
    setCourse(announcement.course);
    setIsPinned(announcement.isPinned || false);
    setEditingId(announcement.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "announcements", id));
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const formatToYYYYMMDD = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate();
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pinnedAnnouncements = announcements.filter((a) => {
    const courseMatch = !filterCourse || a.course === filterCourse;
    const dateMatch =
      !filterDate || formatToYYYYMMDD(a.date.toDate()) === filterDate;
    return a.isPinned && courseMatch && dateMatch;
  });

  const regularAnnouncements = announcements.filter((a) => {
    const courseMatch = !filterCourse || a.course === filterCourse;
    const dateMatch =
      !filterDate || formatToYYYYMMDD(a.date.toDate()) === filterDate;
    return !a.isPinned && courseMatch && dateMatch;
  });

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
        } p-6 space-y-10`}
      >
        <h1 className="text-2xl font-semibold mb-4">Create Announcement</h1>

       <form
  onSubmit={handleSubmit}
  className={`bg-white p-6 rounded-lg shadow space-y-4 transition duration-500 text-left ${
    statusMessage ? "animate-flash" : ""
  }`}
>
  <select
    value={course}
    onChange={(e) => setCourse(e.target.value)}
    required
    className="w-full border rounded px-4 py-2 bg-white dark:bg-gray-900"
  >
    <option value="">Select a course</option>
    {courses.map((c, idx) => (
      <option key={idx} value={c.name}>
        {c.name}
      </option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Title"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    required
    className="w-full border rounded px-4 py-2"
  />

  <textarea
    placeholder="Message to students"
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    rows={4}
    required
    className="w-full border rounded px-4 py-2 resize-none"
  />

  {/* Checkbox above label, left-aligned */}
  <div className="flex items-center justify-start mt-2">
  <label htmlFor="pin" className="flex items-center text-sm font-medium cursor-pointer">
    <input
      type="checkbox"
      id="pin"
      checked={isPinned}
      onChange={(e) => setIsPinned(e.target.checked)}
      className="accent-blue-600 mr-2"
    />
    Pin this announcement
  </label>
</div>




  {/* Centered submit button */}
  <div className="flex justify-center">
    <button
      type="submit"
      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
    >
      {editingId ? "Update Announcement" : "Post Announcement"}
    </button>
  </div>
</form>


        {statusMessage && (
          <p className="text-green-600 font-medium">{statusMessage}</p>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-end justify-between gap-6 mt-6">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1">
              Filter by Course
            </label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full border rounded px-4 py-2 bg-white dark:bg-gray-900"
            >
              <option value="">All Courses</option>
              {courses.map((c, idx) => (
                <option key={idx} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full border rounded px-4 py-2 bg-white dark:bg-gray-900"
            />
          </div>
        </div>

        {/* Announcement Sections */}
        {loading ? (
          <p className="mt-4 text-gray-500">Loading announcements...</p>
        ) : pinnedAnnouncements.length === 0 &&
          regularAnnouncements.length === 0 ? (
          <p className="mt-4 text-gray-500">
            No announcements match your filters.
          </p>
        ) : (
          <>
            {/* 📌 Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <>
                <h3 className="text-xl font-semibold text-black-600 mt-8">
                  📌 Pinned Announcements
                </h3>
                <ul className="mt-4 space-y-4">
                  {pinnedAnnouncements.map(
                    ({ id, title, message, course, date, authorName }) => (
                      <li
                        key={id}
                        className="rounded-xl border p-6 shadow-sm transition hover:shadow-md space-y-4 bg-yellow-50 border-yellow-300 dark:bg-yellow-100/10 dark:border-yellow-500"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                            📌 {title}
                          </h4>
                          <span className="text-sm font-medium text-blue-600">
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
                        <div className="flex justify-center gap-6 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                          <button
                            onClick={() =>
                              handleEdit({
                                id,
                                title,
                                message,
                                course,
                                isPinned: true,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                          <button
                            onClick={async () => {
                              const updated = { isPinned: false };
                              await updateDoc(
                                doc(db, "announcements", id),
                                updated
                              );
                              setAnnouncements((prev) => {
                                const updatedList = prev.map((a) =>
                                  a.id === id ? { ...a, ...updated } : a
                                );
                                return updatedList.sort((a, b) => {
                                  if (a.isPinned && !b.isPinned) return -1;
                                  if (!a.isPinned && b.isPinned) return 1;
                                  return b.date?.seconds - a.date?.seconds;
                                });
                              });
                            }}
                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                          >
                            📍 Unpin
                          </button>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </>
            )}

            {/* 📣 Regular Announcements */}
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-10">
              📣 All Announcements
            </h3>
            {regularAnnouncements.length === 0 ? (
              <p className="mt-4 text-gray-500">
                No regular announcements match your filters.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {regularAnnouncements.map(
                  ({
                    id,
                    title,
                    message,
                    course,
                    date,
                    authorName,
                    isPinned,
                  }) => (
                    <li
                      key={id}
                      className="rounded-xl border p-6 shadow-sm transition hover:shadow-md space-y-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                          {title}
                        </h4>
                        <span className="text-sm font-medium text-blue-600">
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
                      <div className="flex justify-center gap-6 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                        <button
                          onClick={() =>
                            handleEdit({ id, title, message, course, isPinned })
                          }
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={async () => {
                            const updated = { isPinned: true };
                            await updateDoc(
                              doc(db, "announcements", id),
                              updated
                            );
                            setAnnouncements((prev) => {
                              const updatedList = prev.map((a) =>
                                a.id === id ? { ...a, ...updated } : a
                              );
                              return updatedList.sort((a, b) => {
                                if (a.isPinned && !b.isPinned) return -1;
                                if (!a.isPinned && b.isPinned) return 1;
                                return b.date?.seconds - a.date?.seconds;
                              });
                            });
                          }}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                          📌 Pin
                        </button>
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

export default FacultyAnnouncements;
