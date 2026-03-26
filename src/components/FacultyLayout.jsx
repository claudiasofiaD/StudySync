import { useState } from "react";
import Navbar from "./NavBar";
import Footer from "./Footer";

const FacultyLayout = ({ children, onLogout }) => {
  /* State to manage sidebar collapse */
  const [isCollapsed, setIsCollapsed] = useState(false);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex flex-1">
        {/* Sidebar */}
        <Navbar
          onLogout={onLogout}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />

        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto p-6 transition-all duration-300 ${
            /*Adjusts left margin based on sidebar state*/
            isCollapsed ? "ml-20" : "ml-64"
          }`}
        >
          {children}
        </main>
      </div>

      {/*Footer */}
      <Footer />
    </div>
  );
};

export default FacultyLayout;
