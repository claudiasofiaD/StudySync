import { useState } from "react";
import * as XLSX from "xlsx";
import {
  getFirestore,
  doc,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { toast } from "react-hot-toast";

const ImportGrades = ({ courseName }) => {
  const db = getFirestore();
  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handlePreview = async () => {
    if (!file) return toast.error("Please upload a file.");

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (!rows.length) return toast.error("File contains no data.");

      const required = ["userId", "assignmentId", "assignmentTitle", "gradePercent", "studentName"];
      for (const r of required)
        if (!Object.keys(rows[0]).includes(r))
          return toast.error(`Missing column: ${r}`);

      const normalized = rows.map((r, i) => {
        if (!r.studentName || r.studentName.trim() === "")
          throw new Error(`Row ${i + 2} is missing studentName.`); // +2 for header + 0-index

        return {
          userId: r.userId?.trim(),
          assignmentId: r.assignmentId?.trim(),
          assignmentTitle: r.assignmentTitle?.trim(),
          gradePercent: Number(r.gradePercent),
          studentName: r.studentName?.trim(),
          earnedPoints: r.earnedPoints ?? null,
          totalPoints: r.totalPoints ?? null,
          manualGrade: r.manualGrade ?? null,
          submittedAt: r.submittedAt ?? null,
          timingLabel: r.timingLabel ?? "-",
          type: r.type?.trim() || "other",
        };
      });

      setPreviewRows(normalized);
      toast.success("Preview loaded!");
    } catch (err) {
      toast.error(err.message || "Invalid or unreadable file.");
      console.error(err);
    }
  };

  const handleImport = async () => {
  if (!previewRows.length) return toast.error("No rows to import.");

  try {
    setImporting(true);
    const batch = writeBatch(db);
    let count = 0;

    for (const row of previewRows) {
      let {
        userId,
        assignmentId,
        assignmentTitle,
        gradePercent,
        studentName,
        earnedPoints,
        totalPoints,
        type,
        manualGrade,
        submittedAt,
        timingLabel,
      } = row;

      // Validate required fields
      if (!userId || !assignmentId || isNaN(gradePercent)) continue;

      userId = userId.trim();
      assignmentId = assignmentId.trim();
      assignmentTitle = assignmentTitle?.trim() || "Untitled Assignment";
      studentName = studentName?.trim() || userId;
      earnedPoints = Number(earnedPoints ?? 0);
      totalPoints = Number(totalPoints ?? 0);
      gradePercent = Number(gradePercent ?? 0);
      type = type?.trim() || "other";

      const submissionRef = doc(db, "assignments", assignmentId, "submissions", userId);
      const gradeRef = doc(db, "grades", `${assignmentId}_${userId}`);

      const [submissionSnap, gradeSnap] = await Promise.all([
        getDoc(submissionRef),
        getDoc(gradeRef),
      ]);

      let highestGrade = gradePercent;

      if (submissionSnap.exists()) {
        const existingGrade = submissionSnap.data().manualGrade ?? 0;
        if (gradePercent > existingGrade) {
          batch.update(submissionRef, { manualGrade: gradePercent });
        }
      } else {
        batch.set(submissionRef, {
          user: userId,
          manualGrade: gradePercent,
          autoCreated: true,
          submittedAt: submittedAt ?? null,
          timingLabel: timingLabel ?? "-",
          createdAt: new Date(),
        });
      }

      if (gradeSnap.exists()) {
        highestGrade = Math.max(gradeSnap.data().gradePercent ?? 0, gradePercent);
      }

      batch.set(
        gradeRef,
        {
          assignmentId,
          assignmentTitle,
          courseName,
          studentName,
          userId,
          gradePercent: highestGrade,
          earnedPoints,
          totalPoints,
          type,
          manualGrade,
          submittedAt,
          timingLabel,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      count++;
    }

    await batch.commit();
    toast.success(`Imported ${count} grades successfully!`);
    setPreviewRows([]);
    setFile(null);
  } catch (err) {
    toast.error("Import failed.");
    console.error(err);
  } finally {
    setImporting(false);
  }
};


  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400 text-center">
        Import Grades
      </h2>

      <div className="flex flex-col items-center gap-4 mb-6">
        <input
          type="file"
          accept=".csv, .xlsx"
          onChange={handleFileChange}
          className="block w-full max-w-xs px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 
                     border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 
                     shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        />

        <div className="flex gap-4">
          <button
            onClick={handlePreview}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Preview
          </button>

          <button
            onClick={handleImport}
            disabled={importing || !previewRows.length}
            className={`px-5 py-2 rounded-lg shadow text-white ${
              importing || !previewRows.length
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {importing ? "Importing…" : "Import"}
          </button>
        </div>
      </div>

      {previewRows.length > 0 && (
        <div className="overflow-x-auto max-h-72 border rounded-lg">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 sticky top-0">
              <tr>
                <th className="p-2 border">User ID</th>
                <th className="p-2 border">Student Name</th>
                <th className="p-2 border">Assignment</th>
                <th className="p-2 border">Type</th> 
                <th className="p-2 border">Grade %</th>
                <th className="p-2 border">Earned</th>
                <th className="p-2 border">Total</th>
              </tr>
            </thead>

            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700">
                  <td className="p-2 border">{row.userId}</td>
                  <td className="p-2 border">{row.studentName}</td>
                  <td className="p-2 border">{row.assignmentTitle}</td>
                  <td className="p-2 border">{row.type}</td> 
                  <td className="p-2 border">{row.gradePercent}</td>
                  <td className="p-2 border">{row.earnedPoints ?? "-"}</td>
                  <td className="p-2 border">{row.totalPoints ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ImportGrades;
