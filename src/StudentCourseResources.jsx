import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

const StudentCourseResources = ({ courseName }) => {
  const decodedCourseName = decodeURIComponent(courseName);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(
          collection(db, "resources"),
          where("course", "==", decodedCourseName)
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

        setResources(sorted);
      } catch (err) {
        console.error("Error fetching resources:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [decodedCourseName]);

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

  const filteredResources = resources.filter((r) => {
    const dateMatch =
      !filterDate || formatToYYYYMMDD(r.date.toDate()) === filterDate;
    return r.course === courseName && dateMatch;
  });

  const pinned = filteredResources.filter((r) => r.isPinned);
  const regular = filteredResources.filter((r) => !r.isPinned);

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold">
        📚 Resources for {decodedCourseName}
      </h2>

      <div className="flex-1 min-w-[250px]">
        <label className="block text-sm font-medium mb-1">Filter by Date</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full border rounded px-4 py-2 bg-white dark:bg-gray-900"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading resources...</p>
      ) : resources.length === 0 ? (
        <p className="text-gray-500">No resources posted yet.</p>
      ) : (
        <>
          {pinned.length > 0 && (
            <>
              <h3 className="text-xl font-semibold mt-6">
                📌 Pinned Resources
              </h3>
              <ul className="space-y-6 mt-4">
                {pinned.map(
                  ({ id, title, link, message, date, authorName }) => (
                    <li
                      key={id}
                      className="rounded-xl border p-6 shadow-sm bg-yellow-50 dark:bg-yellow-100/10 border-yellow-300 dark:border-yellow-500 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                        <h4 className="text-xl font-semibold text-blue-600 dark:text-white">
                          📌 {title}
                        </h4>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {decodedCourseName}
                        </span>
                      </div>
                      {link && (
                        <p className="text-left text-blue-600 dark:text-blue-400 break-words">
                          <a href={link}>{link}</a>
                        </p>
                      )}
                      <p className="text-left text-gray-800 dark:text-gray-100 whitespace-pre-line">
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

          <h3 className="text-xl font-semibold mt-10">📣 All Resources</h3>
          {regular.length === 0 ? (
            <p className="text-gray-500">No regular resources available.</p>
          ) : (
            <ul className="space-y-6 mt-4">
              {regular.map(({ id, title, link, message, date, authorName }) => (
                <li
                  key={id}
                  className="rounded-xl border p-6 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <h4 className="text-xl font-semibold text-blue-600 dark:text-white">
                      {title}
                    </h4>
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {decodedCourseName}
                    </span>
                  </div>
                  {link && (
                    <p className="text-left text-blue-600 dark:text-blue-400 break-words">
                      <a href={link}>{link}</a>
                    </p>
                  )}
                  <p className="text-left text-gray-800 dark:text-gray-100 whitespace-pre-line">
                    {message}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Posted by: {authorName || "Faculty"}</span>
                    <span>{formatDate(date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default StudentCourseResources;
