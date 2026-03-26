import { useRef, useState } from "react";
import DashboardHome from "./DashboardHome";
import { AnimatePresence, motion } from "framer-motion";
import Footer from "./Footer";
import { deleteField, updateDoc, doc, db } from "../firebase.js";

const AdminLayout = ({
  activeSection,
  setActiveSection,
  message,
  onLogout,
  users,
  updateUser,
  capitalize,
  classes,
  newClassName,
  setNewClassName,
  createNewClass,
  deleteClass,
  assignEmail,
  setAssignEmail,
  assignClass,
  setAssignClass,
  assignRole,
  setAssignRole,
  userFilter,
  setUserFilter,
  selectAll,
  setSelectAll,
  filteredUsers,
  assignUser,
  removeUsersFromClass,
  newClassRoom,
  setNewClassRoom,
  newClassDescription,
  setNewClassDescription,
  newGradeWeights,
  setNewGradeWeights,
  newClassImage,
  setNewClassImage,
  children,
}) => {
  const contentRef = useRef(null);
  const [editingClass, setEditingClass] = useState(null);
  const [editValues, setEditValues] = useState({
    className: "",
    room: "",
    description: "",
    gradeWeights: {
      homework: "",
      quizzes: "",
      exams: "",
      projects: "",
    },
  });

  // Modify this based off what file your images are stored
  const presetImages = [
    "/assets/default-course.jpg",
    "/assets/geo.jpg",
    "/assets/math.jpg",
    "/assets/science.jpg",
  ];

  const SectionButton = ({ label, sectionKey }) => (
    <button
      onClick={() => setActiveSection(sectionKey)}
      className={`block w-full text-left px-5 py-3 rounded-lg text-base font-medium transition-colors duration-200 ease-in-out ${
        activeSection === sectionKey
          ? "bg-blue-600 text-white"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {label}
    </button>
  );

  const sectionVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  // Helper to check if user is assigned to a class in a given role
  const isUserInClassRole = (userEmail, cls, role) => {
    if (!cls) return false;
    if (role === "Faculty") return cls.faculty?.includes(userEmail);
    if (role === "TA") return cls.tas?.includes(userEmail);
    if (role === "Student") return cls.students?.includes(userEmail);
    return false;
  };

  //
  const startEditClass = (cls) => {
    setEditingClass(cls.className);
    setEditValues({
      className: cls.className,
      room: cls.room || "",
      description: cls.description || "",
      gradeWeights: {
        homework: cls.gradeWeights?.homework || "",
        quizzes: cls.gradeWeights?.quizzes || "",
        exams: cls.gradeWeights?.exams || "",
        projects: cls.gradeWeights?.projects || "",
      },
    });
  };

  const saveClassEdits = () => {
    const updatedClass = {
      ...editValues,
      gradeWeights: {
        homework: parseFloat(editValues.gradeWeights.homework) || 0,
        quizzes: parseFloat(editValues.gradeWeights.quizzes) || 0,
        exams: parseFloat(editValues.gradeWeights.exams) || 0,
        projects: parseFloat(editValues.gradeWeights.projects) || 0,
      },
    };

    // You may be calling a Firebase function here:
    updateClass(editingClass, updatedClass);

    setEditingClass(null);
  };

  const updateClass = (className, updatedData) => {
    // Example: Firebase Firestore
    const docRef = doc(db, "classes", className);
    updateDoc(docRef, updatedData)
      .then(() => {
        console.log("Class updated.");
        // Optional: Refresh state
      })
      .catch((err) => console.error("Error updating class:", err));
  };

  return (
    <main className="min-h-screen flex flex-col bg-light-bg dark:bg-gray-900 text-light-text dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-6 bg-light-card dark:bg-gray-800 border-b border-light-border dark:border-gray-700">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar navigation */}
        <aside className="w-60 flex flex-col bg-light-card dark:bg-gray-800 border-r border-light-border dark:border-gray-700 p-6">
          <div className="space-y-3">
            <SectionButton label="Modify Users" sectionKey="modifyuser" />
            <SectionButton label="Create Class" sectionKey="createclass" />
            <SectionButton label="Assign User" sectionKey="assignuser" />
            <SectionButton label="Remove User" sectionKey="removeuser" />
          </div>
          <div className="flex-grow" /> {/* spacer */}
          <button
            onClick={onLogout}
            className="mt-6 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors duration-200"
          >
            Logout
          </button>
        </aside>

        {/* Section content */}
        <section
          className="flex-1 p-8 overflow-auto relative"
          ref={contentRef}
          aria-live="polite"
        >
          {/* Global message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-yellow-100 dark:bg-yellow-800 border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-md text-yellow-800 dark:text-yellow-200 z-10"
              role="alert"
            >
              {message}
            </motion.div>
          )}

          {/* AnimatePresence handles smooth section transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection || "home"}
              variants={sectionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Default home section */}
              {(!activeSection || activeSection === "") && <DashboardHome />}

              {/* Modify Users Section */}
              {activeSection === "modifyuser" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Users</h2>
                  <div className="overflow-x-auto bg-light-card dark:bg-gray-800 rounded-lg shadow-sm">
                    <table className="w-full min-w-max border-collapse">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          {[
                            "Name",
                            "Email",
                            "Role",
                            "Suggested Role",
                            "Status",
                            "Actions",
                          ].map((hdr) => (
                            <th
                              key={hdr}
                              className="px-6 py-3 text-left text-sm font-medium border-b border-light-border dark:border-gray-700"
                            >
                              {hdr}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <tr
                            key={i}
                            className={`transition-colors duration-200 ${
                              i % 2 === 0
                                ? "bg-white dark:bg-gray-900"
                                : "bg-gray-50 dark:bg-gray-800"
                            } hover:bg-blue-50 dark:hover:bg-gray-700`}
                          >
                            <td className="px-6 py-3">{u.name}</td>
                            <td className="px-6 py-3">{u.email}</td>
                            <td className="px-6 py-3">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  updateUser(u.email, { role: e.target.value })
                                }
                                className="min-w-max px-3 py-1 text-sm rounded-md border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="unassigned">Unassigned</option>
                                <option value="student">Student</option>
                                <option value="ta">TA</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-3">
                              {capitalize(u.suggestedRole || "N/A")}
                            </td>
                            <td className="px-6 py-3">
                              <select
                                value={u.status || "pending"} // Default to "pending" if undefined
                                onChange={(e) =>
                                  updateUser(u.email, {
                                    status: e.target.value,
                                  })
                                }
                                className="min-w-max px-3 py-1 text-sm rounded-md border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="unverified">Unverified</option>
                                <option value="approved">Approved</option>
                              </select>
                            </td>
                            <td className="px-6 py-3">
                              {u.role !== u.suggestedRole && u.suggestedRole ? (
                                <button
                                  onClick={() =>
                                    updateUser(u.email, {
                                      role: u.suggestedRole,
                                      status: "approved",
                                      suggestedRole: deleteField(),
                                    })
                                  }
                                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs transition-colors duration-200"
                                >
                                  Confirm
                                </button>
                              ) : (
                                <span>—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Create Class Section */}
              {activeSection === "createclass" && (
                <div className="w-full min-h-screen px-6 py-8 bg-light-bg dark:bg-gray-900 space-y-10">
                  <h2 className="text-2xl font-bold">Create Class</h2>

                  {/* Class Info Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Class Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CS101"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                    </div>

                    {/* Select Course Image */}

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Room Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Room 202"
                        value={newClassRoom}
                        onChange={(e) => setNewClassRoom(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="max-w-4xl">
                    <label className="block text-sm font-medium mb-1">
                      Class Description
                    </label>
                    <textarea
                      placeholder="Enter a short description of the class"
                      value={newClassDescription}
                      onChange={(e) => setNewClassDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="max-w-4xl">
                    <button
                      onClick={createNewClass}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                      Create Class
                    </button>
                  </div>

                  {/* Class Table */}
                  <div className="overflow-x-auto bg-light-card dark:bg-gray-800 rounded-lg shadow-sm mt-10">
                    <table className="w-full min-w-max border-collapse">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          {[
                            "Class",
                            "Students",
                            "TA",
                            "Faculty",
                            "Actions",
                          ].map((hdr) => (
                            <th
                              key={hdr}
                              className="px-6 py-3 text-left text-sm font-medium border-b border-light-border dark:border-gray-700 whitespace-nowrap"
                            >
                              {hdr}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((cls, i) => (
                          <tr
                            key={i}
                            className={`transition-colors duration-200 ${
                              i % 2 === 0
                                ? "bg-white dark:bg-gray-900"
                                : "bg-gray-50 dark:bg-gray-800"
                            } hover:bg-blue-50 dark:hover:bg-gray-700`}
                          >
                            <td className="px-6 py-3 whitespace-nowrap">
                              {cls.className}
                            </td>
                            <td
                              className="px-6 py-3 break-words max-w-xs"
                              title={(cls.students || []).join(", ")}
                            >
                              {(cls.students || []).join(", ")}
                            </td>
                            <td
                              className="px-6 py-3 break-words max-w-xs"
                              title={(cls.tas || []).join(", ")}
                            >
                              {(cls.tas || []).join(", ")}
                            </td>
                            <td
                              className="px-6 py-3 break-words max-w-xs"
                              title={(cls.faculty || []).join(", ")}
                            >
                              {(cls.faculty || []).join(", ")}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap space-x-2">
                              <button
                                onClick={() => startEditClass(cls)}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs transition-colors duration-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteClass(cls.className)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Edit Class Modal */}
                  {editingClass && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white dark:bg-gray-800 w-full max-w-2xl p-6 rounded-lg shadow-lg relative">
                        <h2 className="text-xl font-semibold mb-4">
                          Edit Class: {editingClass}
                        </h2>

                        {/* Close button */}
                        <button
                          className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl font-bold"
                          onClick={() => setEditingClass(null)}
                        >
                          ×
                        </button>

                        {/* Editable Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Room
                            </label>
                            <input
                              type="text"
                              value={editValues.room}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  room: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={editValues.description}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700"
                            />
                          </div>
                        </div>


                        {/* Buttons */}
                        <div className="flex justify-end space-x-4">
                          <button
                            onClick={() => setEditingClass(null)}
                            className="px-5 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveClassEdits}
                            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assign User Section */}
              {activeSection === "assignuser" && (
                <div className="space-y-6 max-w-5xl">
                  <h2 className="text-xl font-semibold">
                    Assign Users to Classes
                  </h2>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mx-auto">
                      {/* Role Selector */}
                      <div>
                        <label className="block text-sm mb-1 font-medium">
                          Role
                        </label>
                        <select
                          value={assignRole}
                          onChange={(e) => {
                            setAssignRole(e.target.value);
                            setAssignEmail([]);
                            setSelectAll(false);
                          }}
                          className="w-full px-5 py-3 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Student">Student</option>
                          <option value="Faculty">Faculty</option>
                          <option value="TA">TA</option>
                        </select>
                      </div>

                      {/* Class Selector */}
                      <div>
                        <label className="block text-sm mb-1 font-medium">
                          Class
                        </label>
                        <select
                          value={assignClass}
                          onChange={(e) => {
                            setAssignClass(e.target.value);
                            setAssignEmail([]);
                            setSelectAll(false);
                          }}
                          className="w-full px-5 py-3 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls, idx) => (
                            <option key={idx} value={cls.className}>
                              {cls.className}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* User Filter */}
                      <div>
                        <label className="block text-sm mb-1 font-medium">
                          Search Users
                        </label>
                        <input
                          type="text"
                          placeholder="Name or Email"
                          value={userFilter}
                          onChange={(e) => setUserFilter(e.target.value)}
                          className="w-full px-5 py-3 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Select All */}
                  <div>
                    <label className="flex justify-start items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const eligibleEmails = filteredUsers
                            .filter((u) => {
                              const cls = classes.find(
                                (c) => c.className === assignClass
                              );
                              return !isUserInClassRole(
                                u.email,
                                cls,
                                assignRole
                              );
                            })
                            .map((u) => u.email);

                          setAssignEmail(checked ? eligibleEmails : []);
                          setSelectAll(checked);
                        }}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Select All</span>
                    </label>
                  </div>

                  {/* User List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-auto border border-light-border dark:border-gray-600 rounded-lg p-3 bg-light-card dark:bg-gray-800">
                    {filteredUsers.map((u, idx) => {
                      const cls = classes.find(
                        (c) => c.className === assignClass
                      );
                      const alreadyAssigned = isUserInClassRole(
                        u.email,
                        cls,
                        assignRole
                      );

                      return (
                        <label
                          key={idx}
                          className={`flex items-center space-x-2 p-3 rounded-lg border border-light-border dark:border-gray-600 transition-colors duration-200 cursor-pointer ${
                            alreadyAssigned
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={u.email}
                            checked={assignEmail.includes(u.email)}
                            disabled={alreadyAssigned}
                            onChange={(e) => {
                              const value = e.target.value;
                              const checked = e.target.checked;
                              setAssignEmail((prev) =>
                                checked
                                  ? [...prev, value]
                                  : prev.filter((email) => email !== value)
                              );
                              setSelectAll(false);
                            }}
                            className="form-checkbox h-5 w-5 text-blue-600 transition duration-200"
                          />
                          <span className="text-sm">
                            {u.name} ({u.email}) {alreadyAssigned && "✅"}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    onClick={assignUser}
                    disabled={!assignEmail.length || !assignClass}
                    className={`mt-4 px-6 py-3 rounded-lg text-white transition-colors duration-200 ${
                      assignEmail.length && assignClass
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Assign Selected Users
                  </button>
                </div>
              )}

              {/* Remove User Section */}
              {activeSection === "removeuser" && (
                <div className="space-y-6 max-w-5xl">
                  <h2 className="text-xl font-semibold">
                    Remove Users from Classes
                  </h2>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg">
                      {/* Role Selector */}
                      <div>
                        <label className="block text-sm mb-1 font-medium">
                          Role
                        </label>
                        <select
                          value={assignRole}
                          onChange={(e) => {
                            setAssignRole(e.target.value);
                            setAssignEmail([]);
                            setSelectAll(false);
                          }}
                          className="w-full px-5 py-3 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Student">Student</option>
                          <option value="Faculty">Faculty</option>
                          <option value="TA">TA</option>
                        </select>
                      </div>

                      {/* Class Selector */}
                      <div>
                        <label className="block text-sm mb-1 font-medium">
                          Class
                        </label>
                        <select
                          value={assignClass}
                          onChange={(e) => {
                            setAssignClass(e.target.value);
                            setAssignEmail([]);
                            setSelectAll(false);
                          }}
                          className="w-full px-5 py-3 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls, idx) => (
                            <option key={idx} value={cls.className}>
                              {cls.className}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* User Filter */}
                      <div>
                        <label className="block text-sm mb-1 font-medium">
                          Search Users
                        </label>
                        <input
                          type="text"
                          placeholder="Name or Email"
                          value={userFilter}
                          onChange={(e) => setUserFilter(e.target.value)}
                          className="w-full px-5 py-3 rounded-lg border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 transition duration-200 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Select All */}
                  <div>
                    <label className="flex justify-start items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const cls = classes.find(
                            (c) => c.className === assignClass
                          );
                          // Only include users who ARE assigned in this role for removal
                          const eligibleEmails = filteredUsers
                            .filter((u) =>
                              isUserInClassRole(u.email, cls, assignRole)
                            )
                            .map((u) => u.email);

                          setAssignEmail(checked ? eligibleEmails : []);
                          setSelectAll(checked);
                        }}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Select All</span>
                    </label>
                  </div>

                  {/* User List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-auto border border-light-border dark:border-gray-600 rounded-lg p-3 bg-light-card dark:bg-gray-800">
                    {filteredUsers.map((u, idx) => {
                      const cls = classes.find(
                        (c) => c.className === assignClass
                      );
                      const assigned = isUserInClassRole(
                        u.email,
                        cls,
                        assignRole
                      );

                      return (
                        <label
                          key={idx}
                          className={`flex items-center space-x-2 p-3 rounded-lg border border-light-border dark:border-gray-600 transition-colors duration-200 cursor-pointer ${
                            !assigned
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={u.email}
                            checked={assignEmail.includes(u.email)}
                            disabled={!assigned}
                            onChange={(e) => {
                              const value = e.target.value;
                              const checked = e.target.checked;
                              setAssignEmail((prev) =>
                                checked
                                  ? [...prev, value]
                                  : prev.filter((email) => email !== value)
                              );
                              setSelectAll(false);
                            }}
                            className="form-checkbox h-5 w-5 text-blue-600 transition duration-200"
                          />
                          <span className="text-sm">
                            {u.name} ({u.email}) {assigned && "✅"}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    onClick={removeUsersFromClass}
                    disabled={!assignEmail.length || !assignClass}
                    className={`mt-4 px-6 py-3 rounded-lg text-white transition-colors duration-200 ${
                      assignEmail.length && assignClass
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Remove Selected Users
                  </button>
                </div>
              )}

              {/* Children passed in */}
              {children}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default AdminLayout;
