// src/components/Faculty/CreateAssignmentForm.jsx
import { useState } from "react";
import {
  db,
  addDoc,
  collection,
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "../../firebase";

const CreateAssignmentForm = ({ decodedCourseName, fetchCourse, setActiveTab }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
  });

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const assignmentRef = await addDoc(collection(db, "assignments"), {
        title: form.title.trim(),
        description: form.description.trim(),
        due_date: form.due_date ? Timestamp.fromDate(new Date(form.due_date)) : null,
        createdAt: serverTimestamp(),
        course: decodedCourseName,
      });

      await updateDoc(doc(db, "classes", decodedCourseName), {
        assignments: arrayUnion(assignmentRef.id),
      });

      setForm({ title: "", description: "", due_date: "" });
      await fetchCourse();
      setActiveTab("assignments");
    } catch (error) {
      console.error("Error adding assignment:", error);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow max-w-lg mx-auto">
      <h3 className="text-xl font-semibold mb-4 text-center text-blue-600">
        Create Assignment
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            name="title"
            placeholder="Assignment Title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            placeholder="Assignment Description"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full border rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 active:scale-95 transition"
        >
          Add Assignment
        </button>
      </form>
    </div>
  );
};

export default CreateAssignmentForm;
