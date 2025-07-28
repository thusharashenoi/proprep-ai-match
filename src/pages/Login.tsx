import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<"candidate" | "employer">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Check both collections to determine the actual user type
      const employeeRef = doc(db, "Employees", uid);
      const employerRef = doc(db, "Employers", uid);
      
      const [employeeSnap, employerSnap] = await Promise.all([
        getDoc(employeeRef),
        getDoc(employerRef)
      ]);

      let actualUserType: "candidate" | "employer" | null = null;
      let userData = null;

      if (employeeSnap.exists()) {
        actualUserType = "candidate";
        userData = employeeSnap.data();
      } else if (employerSnap.exists()) {
        actualUserType = "employer";
        userData = employerSnap.data();
      }

      if (!actualUserType || !userData) {
        // Sign out the user since no profile exists
        await auth.signOut();
        setError("Profile not found. Please contact support.");
        return;
      }

      // Verify that the selected user type matches the actual user type
      if (userType !== actualUserType) {
        // Sign out the user to prevent unauthorized access
        await auth.signOut();
        const expectedType = actualUserType === "candidate" ? "Employee/Candidate" : "Employer/Company";
        setError(`Invalid login type. Please select "${expectedType}" and try again.`);
        return;
      }

      // Login successful - navigate to appropriate dashboard
      console.log("Login Success:", userData);
      if (actualUserType === "candidate") {
        navigate("/jobs");
      } else if (actualUserType === "employer") {
        navigate("/employer-dashboard");
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6 mt-16">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2 text-blue-700">Welcome to proprep.ai</h1>
          <p className="text-gray-700 text-base">
            Your one step platform to analyse your resume, LinkedIn and apply for relevant jobs.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${userType === "candidate" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setUserType("candidate")}
          >
            Employee/Candidate
          </button>
          <button
            className={`px-4 py-2 rounded ${userType === "employer" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setUserType("employer")}
          >
            Employer/Company
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Sign In
          </button>
        </form>

        <div className="flex flex-col items-center mt-2">
          <Link to="#" className="text-blue-500 hover:underline mb-1">Forgot password?</Link>
          {userType === "candidate" ? (
            <span className="text-sm">
              New user?{" "}
              <button
                className="text-blue-500 hover:underline bg-transparent border-none p-0 m-0"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
            </span>
          ) : (
            <span className="text-sm">
              New employer?{" "}
              <button
                className="text-blue-500 hover:underline bg-transparent border-none p-0 m-0"
                onClick={() => navigate("/employer-signup")}
              >
                Apply for License
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;