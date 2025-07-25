// import { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";

// const Login = () => {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [userType, setUserType] = useState("candidate"); // 'candidate' or 'employer'

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (userType === "candidate") {
//       const profile = localStorage.getItem("userProfile");
//       if (profile) {
//         const parsed = JSON.parse(profile);
//         if (parsed.email === email && password) {
//           localStorage.setItem("isAuthenticated", "true");
//           navigate("/jobs");
//           return;
//         }
//       }
//       setError("Invalid email or password");
//     } else {
//       const employer = localStorage.getItem("employerProfile");
//       if (employer) {
//         const parsed = JSON.parse(employer);
//         if (parsed.email === email && parsed.password === password) {
//           localStorage.setItem("isAuthenticated", "true");
//           localStorage.setItem("userType", "employer");
//           navigate("/employer-dashboard");
//           return;
//         }
//       }
//       setError("Invalid employer credentials");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
//       <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6 mt-16">
//         {/* Removed back button from landing/login page */}
//         <div className="text-center mb-4">
//           <h1 className="text-3xl font-bold mb-2 text-blue-700">Welcome to proprep.ai</h1>
//           <p className="text-gray-700 text-base">
//             Your one step platform to analyse your resume, LinkedIn and apply for relevant jobs.
//           </p>
//         </div>
//         <div className="flex justify-center gap-4 mb-4">
//           <button
//             className={`px-4 py-2 rounded ${userType === "candidate" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
//             onClick={() => setUserType("candidate")}
//           >
//             Employee/Candidate
//           </button>
//           <button
//             className={`px-4 py-2 rounded ${userType === "employer" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
//             onClick={() => setUserType("employer")}
//           >
//             Employer/Company
//           </button>
//         </div>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <input
//             type="email"
//             placeholder="Email"
//             className="w-full border rounded px-3 py-2"
//             value={email}
//             onChange={e => setEmail(e.target.value)}
//             required
//           />
//           <input
//             type="password"
//             placeholder="Password"
//             className="w-full border rounded px-3 py-2"
//             value={password}
//             onChange={e => setPassword(e.target.value)}
//             required
//           />
//           {error && <div className="text-red-500 text-sm">{error}</div>}
//           <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Sign In</button>
//         </form>
//         <div className="flex flex-col items-center mt-2">
//           <Link to="#" className="text-blue-500 hover:underline mb-1">Forgot password?</Link>
//           {userType === "candidate" ? (
//             <span className="text-sm">New user? <button className="text-blue-500 hover:underline bg-transparent border-none p-0 m-0" onClick={() => navigate("/signup")}>Sign up</button></span>
//           ) : (
//             <span className="text-sm">New employer? <button className="text-blue-500 hover:underline bg-transparent border-none p-0 m-0" onClick={() => navigate("/employer-signup")}>Apply for License</button></span>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;







///////////////////////////////////////////////////////////////////////////////////////
// // src/pages/Login.jsx
// import { useState } from 'react';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth, db } from '../firebase';
// import { doc, getDoc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';

// export default function Login({ userType }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError('');

//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       const uid = userCredential.user.uid;

//       // Fetch profile from Firestore
//       const userRef = doc(db, userType === 'employer' ? 'employers' : 'employees', uid);
//       const userSnap = await getDoc(userRef);

//       if (userSnap.exists()) {
//         console.log('Profile:', userSnap.data());
//         // Redirect based on user type
//         navigate(`/${userType}/dashboard`);
//       } else {
//         setError('Profile not found. Please contact support.');
//       }
//     } catch (err) {
//       setError('Invalid email or password');
//     }
//   };

//   return (
//     <div className="login-container">
//       <h2>{userType === 'employer' ? 'Employer' : 'Employee'} Login</h2>
//       <form onSubmit={handleLogin}>
//         <input
//           type="email"
//           placeholder="Email"
//           required
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           required
//           onChange={(e) => setPassword(e.target.value)}
//         />
//         <button type="submit">Login</button>
//         {error && <p style={{ color: 'red' }}>{error}</p>}
//       </form>
//     </div>
//   );
// }

// //////////////////////////////////////////////////////////////////
// src/pages/Login.tsx
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

      const collectionName = userType === "employer" ? "Employers" : "Employees";
      const userRef = doc(db, collectionName, uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log("Login Success:", userSnap.data());
        if (userType === "candidate") {
          navigate("/jobs");
        } else if (userType === "employer") {
          navigate("/EmployerDashboard");
        }
      } else {
        setError("Profile not found. Please contact support.");
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
