import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
// Importing necessary Firebase functions
const EmployerSignup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phno, setPhno] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePic(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignupSuccess(false);

    if (!name || !company || !role || !email || !phno || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, "Employers", uid), {
        uid,
        name,
        company,
        role,
        email,
        phno,
        profilePic,
        type: "employer",
      });

      setSignupSuccess(true);
    } catch (error: any) {
      console.error("Error during signup:", error);
      setError(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Employer Sign Up</h2>

        {signupSuccess ? (
          <div className="text-center space-y-4">
            <p className="text-green-600 font-medium">Sign up successful!</p>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-700 text-white py-2 px-4 rounded hover:bg-blue-800 transition"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center mb-4">
              <label htmlFor="profile-pic-upload" className="relative cursor-pointer group">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="object-cover w-full h-full" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m4 0v6m0 0a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h2" />
                    </svg>
                  </div>
                </div>
                <input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
              </label>
              <span className="text-xs text-gray-500 mt-1">Upload Profile Picture</span>
            </div>

            <input
              type="text"
              placeholder="Your Name"
              className="w-full border rounded px-3 py-2"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Company Name"
              className="w-full border rounded px-3 py-2"
              value={company}
              onChange={e => setCompany(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Your Role"
              className="w-full border rounded px-3 py-2"
              value={role}
              onChange={e => setRole(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full border rounded px-3 py-2"
              value={phno}
              onChange={e => setPhno(e.target.value)}
              required
            />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
            >
              {loading ? "Creating Account..." : "Apply for License"}
            </button>
          </form>
        )}

        {error && <div className="text-red-500 text-center">{error}</div>}
      </div>
    </div>
  );
};

export default EmployerSignup;