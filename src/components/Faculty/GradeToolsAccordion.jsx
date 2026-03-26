import { useState } from "react";
import ExportGrades from "./ExportGrades";
// import ImportGrades from "./ImportGrades";

const GradeToolsAccordion = ({ courseName }) => {
  const [open, setOpen] = useState(null);

  const toggle = (section) => {
    setOpen((prev) => (prev === section ? null : section));
  };

  return (
    <div className="w-full space-y-4">

      {/* EXPORT PANEL */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggle("export")}
          className="
            w-full px-6 py-4 text-left flex justify-between items-center 
            text-xl font-semibold text-gray-900 dark:text-gray-100 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition
          "
        >
          <span>Export Grades</span>
          <span className="text-2xl">{open === "export" ? "−" : "+"}</span>
        </button>

        <div
          className={`transition-all overflow-hidden duration-300 ${
            open === "export"
              ? "max-h-[3000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <ExportGrades courseName={courseName} />
          </div>
        </div>
      </div>

      {/* IMPORT PANEL */}
      {/*
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggle("import")}
          className="
            w-full px-6 py-4 text-left flex justify-between items-center 
            text-xl font-semibold text-gray-900 dark:text-gray-100 
            hover:bg-gray-100 dark:hover:bg-gray-700 transition
          "
        >
          <span>Import Grades</span>
          <span className="text-2xl">{open === "import" ? "−" : "+"}</span>
        </button>

        <div
          className={`transition-all overflow-hidden duration-300 ${
            open === "import"
              ? "max-h-[3000px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <ImportGrades courseName={courseName} />
          </div>
        </div>
      </div>
      */}

    </div>
  );
};

export default GradeToolsAccordion;
