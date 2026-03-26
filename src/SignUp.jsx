import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  doc,
  setDoc,
  onAuthStateChanged,
} from "./firebase";
import Footer from "./components/Footer";

function SignUp() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !selectedRole) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: fullName,
        email: user.email,
        status: "unverified",
        role: "unassigned",
        suggestedRole: selectedRole,
        classes: [],
        assignments: [],
        announcements: [],
        notifications: [],
        createdAt: new Date().toISOString(),
      });

      alert("Account created successfully!");
      navigate("/VerifyEmail");
    } catch (error) {
      console.error("Sign-up error:", error);
      alert(error.message);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      console.log(user ? "User is signed in" : "User is signed out");
    });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">StudySync</h1>
          <p className="mt-2 text-light-text dark:text-gray-300">Create a new account</p>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="bg-light-card dark:bg-gray-800 border border-light-border dark:border-gray-700 shadow-md rounded-lg p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-light-text dark:text-gray-200">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-light-border dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-light-text dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text dark:text-gray-200">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-light-border dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-light-text dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text dark:text-gray-200">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-light-border dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-light-text dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text dark:text-gray-200">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-2 border border-light-border dark:border-gray-600 bg-white dark:bg-gray-700 text-light-text dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="student">Student</option>
              <option value="ta">TA</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>

          <button
            type="submit"
            onClick={handleSignUp}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign Up
          </button>

          <p className="text-center text-sm text-light-subtext dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400">
              Login
            </Link>
          </p>

          <div className="pt-4 border-t border-light-border dark:border-gray-700">
            <Footer />
          </div>
        </form>
      </div>
    </main>
  );
}

export default SignUp;
