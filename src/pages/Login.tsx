import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [userType, setUserType] = useState("candidate"); // 'candidate' or 'employer'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === "candidate") {
      const profile = localStorage.getItem("userProfile");
      if (profile) {
        const parsed = JSON.parse(profile);
        if (parsed.email === email && password) {
          localStorage.setItem("isAuthenticated", "true");
          navigate("/jobs");
          return;
        }
      }
      setError("Invalid email or password");
    } else {
      const employer = localStorage.getItem("employerProfile");
      if (employer) {
        const parsed = JSON.parse(employer);
        if (parsed.email === email && parsed.password === password) {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userType", "employer");
          navigate("/employer-dashboard");
          return;
        }
      }
      setError("Invalid employer credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6 mt-16">
        {/* Removed back button from landing/login page */}
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
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign In</button>
        </form>
        <div className="flex flex-col items-center mt-2">
          <Link to="#" className="text-blue-500 hover:underline mb-1">Forgot password?</Link>
          {userType === "candidate" ? (
            <span className="text-sm">New user? <button className="text-blue-500 hover:underline bg-transparent border-none p-0 m-0" onClick={() => navigate("/signup")}>Sign up</button></span>
          ) : (
            <span className="text-sm">New employer? <button className="text-blue-500 hover:underline bg-transparent border-none p-0 m-0" onClick={() => navigate("/employer-signup")}>Apply for License</button></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
