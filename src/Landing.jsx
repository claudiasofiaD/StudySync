import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            StudySync
          </h1>
          <nav className="space-x-6">
            <Link to="/login" className="hover:text-indigo-600">
              Login
            </Link>
            <Link to="/signup" className="hover:text-indigo-600">
              Sign Up
            </Link>
            <a href="#about" className="hover:text-indigo-600">
              About
            </a>
          </nav>
        </div>
      </header>

      {/* Top Section */}
      <section className="flex-1 bg-indigo-50 dark:bg-gray-800 py-20 flex items-center justify-center">
        <div className="text-center px-6 max-w-2xl">
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Expanding Access to Affordable Education
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            StudySync is a secure and scalable learning platform where educator
            can upload files, create assignments, and automate grading.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/login"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg shadow hover:bg-gray-300"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="container mx-auto px-6">
          <h3 className="text-3xl font-bold text-center mb-12">
            Why Choose StudySync?
          </h3>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Affordable Access
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Delivers powerful educational tools at a fraction of the cost,
                or even possibly free, making learning more accessible for all.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Educator-Centered Design
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Empowers teachers to build assignments and learning experiences
                tailored to their students’ needs.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Student Impact
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Supports student success through instant feedback, intuitive
                design, and inclusive learning features, such as dynamic
                calendar and announcements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-white dark:bg-gray-800 py-12">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <h3 className="text-3xl font-bold text-indigo-600 mb-6">
            About the Developers
          </h3>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            StudySync is a senior capstone project developed by Claudia, Jordan,
            and Jennifer, Computer Science majors at Southern Illinois
            University Edwardsville (SIUE).
          </p>

          {/* Profiles */}
          <div className="grid md:grid-cols-3 gap-10">
            {/* Claudia */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow hover:shadow-lg">
              <img
                src="/images/claudia.jpg"
                alt="Claudia"
                className="w-32 h-32 mx-auto rounded-full mb-4 object-cover"
              />
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Claudia De La Cruz
              </h4>
              <a
                href="https://www.linkedin.com/in/claudiadelacruz2098/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                LinkedIn Profile
              </a>
            </div>

            {/* Jordan */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow hover:shadow-lg">
              <img
                src="/Images/jordan.png"
                alt="Jordan"
                className="w-32 h-32 mx-auto rounded-full mb-4 object-cover"
              />
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Jordan Asselmeier
              </h4>
              <a
                href="https://www.linkedin.com/in/jordan-asselmeier-b547bb289/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                LinkedIn Profile
              </a>
            </div>

            {/* Jennifer */}
            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow hover:shadow-lg">
              <img
                src="/images/jennifer.jpg"
                alt="Jennifer"
                className="w-32 h-32 mx-auto rounded-full mb-4 object-cover"
              />
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Jennifer Hooks
              </h4>
              <a
                href="https://www.linkedin.com/in/jennifer-hooks-9b769b397/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                LinkedIn Profile
              </a>
            </div>
          </div>

          {/* Client Info */}
          <div className="mt-12 max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              Our client, Andrew Gross, Chair of Accounting at SIUE, is
              collaborating with the School of Business to create dual credit
              courses for high school students. This initiative is focused on
              expanding access to college-level education for low-income and
              underrepresented students.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Our goal is to build a secure, scalable platform that supports
              educators in designing flexible assignments, sharing resources,
              and improving college readiness for students who need it most.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 shadow mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-gray-600 dark:text-gray-300">
          <p>&copy; 2025 StudySync. All rights reserved.</p>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg"
      >
        ↑
      </button>
    </div>
  );
}

export default Landing;
