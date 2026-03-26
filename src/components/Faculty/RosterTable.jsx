import React from "react";

const RosterTable = ({ rosterNames }) => {
  if (!rosterNames?.length)
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 shadow text-center">
        <h3 className="text-xl font-semibold mb-2">Class Roster</h3>
        <p className="text-gray-600 dark:text-gray-400">
          No students enrolled in this course.
        </p>
      </div>
    );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 shadow space-y-6">
      <h3 className="text-xl font-semibold text-center flex items-center justify-center gap-2">
        Class Roster
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 font-semibold text-blue-600">Name</th>
              <th className="px-4 py-2 font-semibold text-blue-600">Email</th>
            </tr>
          </thead>
          <tbody>
            {rosterNames.map((entry, index) => {
              const [name, emailRaw] = entry.split(" (");
              const email = emailRaw?.replace(")", "");

              return (
                <tr
                  key={index}
                  className="border-t dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {name || "Unnamed Student"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                    {email || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RosterTable;
