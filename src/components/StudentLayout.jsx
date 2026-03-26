import { useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';


const StudentLayout = ({ children, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItemClass =
    'flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition text-blue-600 dark:text-blue-400 hover:underline';

  const navItems = [
    { to: '/Student-Dashboard', icon: '🏠', label: 'Home' },
    { to: '/Student-myCourse', icon: '📚', label: 'My Courses' },
    { to: '/Student-Announcements', icon: '📣', label: 'Announcements' },
  ];

  return (
    <Footer>
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-screen z-50 border-r bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="px-4 py-4 flex items-center justify-between">
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                StudySync
              </h1>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              ≣
            </button>
          </div>

          <nav className="flex-1 px-2 space-y-2">
            {navItems.map((item) => (
              <Link to={item.to} key={item.to} className={navItemClass}>
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}

            <button
              type="button"
              onClick={onLogout}
              className={`${navItemClass} w-full text-left`}
            >
              <span className="text-lg">🔓</span>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto p-6 transition-all duration-300 ${
            isCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          {children}
        </main>
      </div>
    </Footer>
  );
};

export default StudentLayout;
