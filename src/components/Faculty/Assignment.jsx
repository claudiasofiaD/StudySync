// src/components/Faculty/Assignment.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, doc, getDoc } from "../../firebase";

const Assignment = ({ id, onDelete, userRole }) => {
  const [assignmentData, setAssignmentData] = useState(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const assignmentRef = doc(db, "assignments", id);
        const assignmentSnap = await getDoc(assignmentRef);
        if (assignmentSnap.exists()) {
          setAssignmentData(assignmentSnap.data());
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
      }
    };
    fetchAssignment();
  }, [id]);

  if (!assignmentData) return <li>Loading assignment...</li>;

  return (
    <li className="flex items-center justify-between mb-2 p-2 bg-white dark:bg-gray-800 rounded shadow-sm">
      {/* Assignment title as link */}
      <Link
        to={`/assignment-editor/${id}`}
        className="text-blue-600 font-semibold hover:underline transition-colors"
      >
        {assignmentData.title}
      </Link>

      {/* Delete button for faculty */}
      {userRole === "faculty" && (
        <button
          onClick={() => onDelete(id)}
          className="
            ml-4
            text-red-600
            hover:text-red-700
            bg-transparent
            hover:bg-red-100
            dark:text-red-400
            dark:hover:bg-red-900
            px-2 py-1
            rounded
            transition-colors
          "
        >
          Delete
        </button>
      )}
    </li>
  );
};

export default Assignment;
