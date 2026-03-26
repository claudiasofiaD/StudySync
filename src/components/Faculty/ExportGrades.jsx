// src/components/Faculty/ExportGrades.jsx
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const ExportGrades = ({ courseName }) => {
  const [grades, setGrades] = useState([]);
  const [filter, setFilter] = useState({ student: "", assignment: "" });
  const [exportType, setExportType] = useState("xlsx");
  const [groupByStudent, setGroupByStudent] = useState(true);
  const [exporting, setExporting] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gradesSnapshot = await getDocs(collection(db, "grades"));
        const usersSnapshot = await getDocs(collection(db, "users"));

        const usersMap = {};
        usersSnapshot.docs.forEach((doc) => {
          usersMap[doc.id] = doc.data();
        });

        const mergedGrades = gradesSnapshot.docs.map((doc) => {
          const g = doc.data();
          return {
            ...g,
            studentName: g.studentName || "",
            courseName: g.courseName || "",
            assignmentTitle: g.assignmentTitle || g.assignmentId,
            earnedPoints: g.earnedPoints ?? "",
            totalPoints: g.totalPoints ?? "",
            gradePercent: g.gradePercent ?? "",
            updatedAt: g.updatedAt
              ? g.updatedAt.toDate?.() ?? new Date(g.updatedAt.seconds * 1000)
              : null,
          };
        });

        // Only keep grades for the course the teacher is viewing
        const filteredByCourse = mergedGrades.filter(
          (g) => g.courseName === courseName
        );

        setGrades(filteredByCourse);
      } catch (err) {
        console.error("Error fetching grades:", err);
      }
    };

    fetchData();
  }, [db, courseName]);

  const filteredGrades = grades.filter((g) => {
    const matchStudent = filter.student
      ? g.studentName.toLowerCase().includes(filter.student.toLowerCase())
      : true;
    const matchAssignment = filter.assignment
      ? g.assignmentTitle.toLowerCase().includes(filter.assignment.toLowerCase())
      : true;
    return matchStudent && matchAssignment;
  });

  const handleExport = () => {
    if (!filteredGrades.length) {
      alert("No grades to export!");
      return;
    }

    setExporting(true);
    try {
      let formattedData = [];

      if (groupByStudent) {
        const allAssignments = Array.from(
          new Set(filteredGrades.map((g) => g.assignmentTitle))
        ).sort();
        const studentsMap = {};

        filteredGrades.forEach((g) => {
          if (!studentsMap[g.studentEmail]) {
            studentsMap[g.studentEmail] = {
              "Student Name": g.studentName || "",
              Email: g.studentEmail || "",
            };
          }
          studentsMap[g.studentEmail][g.assignmentTitle] = `${g.earnedPoints}/${g.totalPoints} (${g.gradePercent}%)`;
        });

        formattedData = Object.values(studentsMap).map((row) => {
          allAssignments.forEach((title) => {
            if (!(title in row)) row[title] = "";
          });
          return row;
        });
      } else {
        formattedData = filteredGrades.map((g) => ({
          "Student Name": g.studentName || "",
          Course: g.courseName || "",
          "Assignment Title": g.assignmentTitle || "",
          "Earned Points": g.earnedPoints,
          "Total Points": g.totalPoints,
          "Grade %": g.gradePercent,
          "Updated At": g.updatedAt ? g.updatedAt.toLocaleString() : "",
        }));
      }

      const ws = XLSX.utils.json_to_sheet(formattedData, { origin: "A1" });

      const colWidths = Object.keys(formattedData[0]).map((key) => ({
        wch: Math.max(
          key.length,
          ...formattedData.map((row) => String(row[key]).length)
        ) + 2,
      }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Grades");

      const fileName = `grades.${exportType}`;
      XLSX.writeFile(wb, fileName, { bookType: exportType });

      alert(`Grades exported successfully as ${exportType.toUpperCase()}!`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("An error occurred while exporting.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 px-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 border border-gray-100 dark:border-gray-700 transition-all">
        <h2 className="text-4xl font-bold text-center mb-4 text-blue-600 dark:text-blue-400">
          Export Grades
        </h2>

        {/* Filters */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by student name..."
            value={filter.student}
            onChange={(e) =>
              setFilter({ ...filter, student: e.target.value })
            }
            className="w-full md:w-3/4 px-6 py-3 text-lg rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/40 focus:outline-none transition-all"
          />
          <input
            type="text"
            placeholder="Search by assignment title..."
            value={filter.assignment}
            onChange={(e) =>
              setFilter({ ...filter, assignment: e.target.value })
            }
            className="w-full md:w-3/4 px-6 py-3 text-lg rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/40 focus:outline-none transition-all"
          />
        </div>

        {/* Export Options */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700 dark:text-gray-300 text-lg">
              Export as:
            </span>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="px-5 py-2 text-lg rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-500/40 outline-none transition"
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="font-medium text-gray-700 dark:text-gray-300 text-lg">
              Group by student:
            </label>
            <input
              type="checkbox"
              checked={groupByStudent}
              onChange={() => setGroupByStudent(!groupByStudent)}
              className="h-5 w-5"
            />
          </div>
        </div>

        {/* Export Button */}
        <div className="text-center mb-4">
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-10 py-4 text-lg rounded-full text-white font-semibold shadow-md transition-all ${
              exporting
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {exporting ? "Exporting..." : "Export Grades"}
          </button>
        </div>

        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          Showing {filteredGrades.length} record
          {filteredGrades.length !== 1 && "s"} matching filters.
        </p>
      </div>
    </div>
  );
};

export default ExportGrades;
