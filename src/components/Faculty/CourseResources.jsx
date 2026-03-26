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
} from "firebase/firestore";
import { db, auth } from "../../firebase";

const CourseResources = ({ courseName }) => {
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [resources, setResources] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [teacherName, setTeacherName] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchTeacherName = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDocs(
        query(collection(db, "users"), where("email", "==", user.email))
      );
      const data = snap.docs[0]?.data();
      setTeacherName(data?.name?.trim() || user.email || "Faculty");
    };

    const fetchResources = async () => {
      const q = query(
        collection(db, "resources"),
        where("course", "==", courseName),
        where("authorRole", "==", "faculty")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.date?.seconds - a.date?.seconds;
      });
      setResources(sorted);
    };

    fetchTeacherName();
    fetchResources();
  }, [courseName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    if (!title) {
      setStatusMessage("Please enter a title.");
      return;
    }

    const payload = {
      title,
      message,
      course: courseName,
      date: Timestamp.now(),
      authorName: teacherName,
      authorRole: "faculty",
      isPinned,
      link,
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "resources", editingId), payload);
        setResources((prev) =>
          prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
        );
        setEditingId(null);
        setStatusMessage("✅ Resource updated!");
      } else {
        const docRef = await addDoc(collection(db, "resources"), payload);
        setResources((prev) => [{ id: docRef.id, ...payload }, ...prev]);
        setStatusMessage("✅ Resource posted!");
      }

      setTitle("");
      setLink("");
      setMessage("");
      setIsPinned(false);
    } catch (err) {
      console.error("Error posting resource:", err);
      setStatusMessage("❌ Failed to post resource.");
    }
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

  const handleEdit = (r) => {
    setTitle(r.title);
    setLink(r.link);
    setMessage(r.message);
    setIsPinned(r.isPinned || false);
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "resources", id));
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredResources = resources.filter((r) => {
    const dateMatch =
      !filterDate || formatToYYYYMMDD(r.date.toDate()) === filterDate;
    return r.course === courseName && dateMatch;
  });

  const pinnedResources = filteredResources.filter((r) => r.isPinned);
  const regularResources = filteredResources.filter((r) => !r.isPinned);

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-semibold">📚 Resources for {courseName}</h2>

      <form
        onSubmit={handleSubmit}
        className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition duration-500 ${
          statusMessage ? "animate-flash" : ""
        }`}
      >
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-4 py-2"
        />

        <input
          type="text"
          placeholder="URL (Optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border rounded px-4 py-2"
        />

        <textarea
          placeholder="Description (Optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full border rounded px-4 py-2 resize-none"
        />

        <div className="flex items-center justify-start mt-2">
          <label
            htmlFor="pin"
            className="flex items-center text-sm font-medium cursor-pointer"
          >
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

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          {editingId ? "Update Resource" : "Post Resource"}
        </button>
      </form>

      {statusMessage && (
        <p className="text-green-600 font-medium">{statusMessage}</p>
      )}

      <div className="flex-1 min-w-[250px]">
        <label className="block text-sm font-medium mb-1">Filter by Date</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full border rounded px-4 py-2 bg-white dark:bg-gray-900"
        />
      </div>

      {pinnedResources.length > 0 && (
        <>
          <h3 className="text-xl font-semibold text-black-600 mt-8">
            📌 Pinned Resources
          </h3>
          <ul className="mt-4 space-y-4">
            {pinnedResources.map((r) => (
              <ResourceCard
                key={r.id}
                {...r}
                courseName={courseName}
                onEdit={handleEdit}
                onDelete={handleDelete}
                formatDate={formatDate}
                setResources={setResources}
              />
            ))}
          </ul>
        </>
      )}

      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-10">
        📣 All Resources
      </h3>
      {regularResources.length === 0 ? (
        <p className="mt-4 text-gray-500">No regular resources found.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {regularResources.map((r) => (
            <ResourceCard
              key={r.id}
              {...r}
              courseName={courseName}
              onEdit={handleEdit}
              onDelete={handleDelete}
              formatDate={formatDate}
              setResources={setResources}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

const ResourceCard = ({
  id,
  title,
  link,
  message,
  date,
  authorName,
  isPinned,
  courseName,
  onEdit,
  onDelete,
  formatDate,
  setResources,
}) => {
  return (
    <li
      className={`rounded-xl border p-6 shadow-sm transition hover:shadow-md space-y-4 ${
        isPinned
          ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-100/10 dark:border-yellow-500"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
          {isPinned ? "📌 " : ""}
          {title}
        </h4>
        <span className="text-sm font-medium text-blue-600">{courseName}</span>
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
      <div className="flex justify-center gap-6 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
        <button
          onClick={() => onEdit({ id, title, link, message, isPinned })}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          🗑️ Delete
        </button>
        <button
          onClick={async () => {
            const updated = { isPinned: !isPinned };
            await updateDoc(doc(db, "resources", id), updated);
            setResources((prev) => {
              const updatedList = prev.map((r) =>
                r.id === id ? { ...r, ...updated } : r
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
          {isPinned ? "📍 Unpin" : "📌 Pin"}
        </button>
      </div>
    </li>
  );
};

export default CourseResources;
