import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "./firebase";
import { auth, db, getDoc, doc } from "./firebase";
import Footer from "./components/Footer";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          navigate("/Admin-Dashboard");
        } else if (userData.role === "student") {
          navigate("/Student-Dashboard");
        } else if (userData.role === "faculty" || userData.role === "ta") {
          navigate("/Faculty-Dashboard");
        }
      } else {
        alert("User has not been given access.");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            StudySync
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Sign in to your account
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                alert(
                  "Please contact your administrator to reset your password."
                )
              }
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 focus:outline-none bg-transparent hover:bg-transparent transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign up
            </Link>
          </p>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Footer />
          </div>
        </form>
      </div>
    </main>
  );
}

export default Login;
