// src/components/DashboardHome.jsx
const DashboardHome = () => {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Welcome, Admin 👋</h2>
      <p className="text-light-subtext dark:text-gray-300">
        Use the navigation on the left to manage users, classes, assignments, or removals.
      </p>
      <ul className="list-disc list-inside space-y-1 text-light-subtext dark:text-gray-300">
        <li>Modify user roles or statuses</li>
        <li>Create new classes</li>
        <li>Assign students, TAs, or faculty to classes</li>
        <li>Remove users from classes</li>
      </ul>
    </div>
  );
};

export default DashboardHome;