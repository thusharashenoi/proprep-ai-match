import { useState } from "react";
// Note: Replace with your actual imports
// import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
// import { db } from "@/firebase";
// import { doc, setDoc, collection } from "firebase/firestore";
// import { extract_resume } from "@/services/extract_resume";
// import { AnalysisService } from "@/services/analyse_resume";
// import { useNavigate } from "react-router-dom";
// import { v4 as uuidv4 } from "uuid";

const roles = [
  "Data Scientist",
  "Software Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "AI/ML Engineer",
  "Product Manager",
  "UI/UX Designer",
];

const EmployeeSignup = () => {
  // Note: Replace with your actual navigation solution
  const navigate = (path: string) => console.log(`Navigate to: ${path}`);
  
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const updateProgress = (step: string, message: string) => {
    setCurrentStep(step);
    setProgress(message);
  };

  const handleSignup = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!resumeFile || !profilePic) {
      alert("Please upload both a resume and a profile picture.");
      return;
    }

    if (!linkedIn.trim()) {
      alert("Please provide a LinkedIn profile URL.");
      return;
    }

    // Simulate the signup process for demo
    setLoading(true);
    
    const steps = [
      { step: "validation", message: "🔍 Validating LinkedIn URL..." },
      { step: "service-check", message: "🔧 Checking LinkedIn analyzer service..." },
      { step: "firebase", message: "👤 Creating user account..." },
      { step: "files", message: "📁 Processing uploaded files..." },
      { step: "resume-extract", message: "📄 Extracting data from resume..." },
      { step: "resume-analysis", message: "🤖 Analyzing resume with AI..." },
      { step: "linkedin-analysis", message: "🔍 Analyzing LinkedIn profile..." },
      { step: "firebase-save", message: "💾 Saving profile to database..." },
      { step: "linkedin-save", message: "📊 Saving LinkedIn analysis..." },
      { step: "complete", message: "✅ Signup successful! Resume and LinkedIn analysis completed." }
    ];

    let currentStepIndex = 0;
    const progressInterval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        updateProgress(steps[currentStepIndex].step, steps[currentStepIndex].message);
        currentStepIndex++;
      } else {
        clearInterval(progressInterval);
        setLoading(false);
        setSignupSuccess(true);
      }
    }, 800);
  };

  // Helper function to validate LinkedIn URL
  const isValidLinkedInUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('linkedin.com') && 
             (url.includes('/in/') || url.includes('/pub/'));
    } catch {
      return false;
    }
  };

  const linkedInUrlValid = isValidLinkedInUrl(linkedIn);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">PP</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              proprep.ai
            </h1>
          </div>
          <button
            onClick={() => navigate("./pages/Login")}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">Join as Job Seeker</h2>
            <p className="text-blue-100">Get AI-powered resume and LinkedIn analysis</p>
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-800">{progress}</div>
                  {currentStep && (
                    <div className="text-xs text-gray-500 mt-1">Step: {currentStep}</div>
                  )}
                </div>
              </div>
              
              {/* Progress visualization */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStep === "complete" ? 100 : Math.min(90, (progress.length / 10) * 10))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {signupSuccess ? (
            <div className="p-8 text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Welcome to ProPrep! 🎉</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Your account has been created successfully and your profile analysis is complete!
                </p>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <div className="text-sm text-green-800 space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Resume Analysis: Completed</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>LinkedIn Analysis: Completed</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Profile Setup: Complete</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 text-lg"
              >
                Continue to Login
              </button>
            </div>
          ) : (
            <div className="p-8 space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center">
                <label htmlFor="profile-pic-upload" className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                    {profilePic ? (
                      <img
                        src={URL.createObjectURL(profilePic)}
                        alt="Profile"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    id="profile-pic-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
                  />
                </label>
                <span className="text-sm text-gray-500 mt-2 font-medium">Upload Profile Picture</span>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter your phone number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm text-gray-700"
                    disabled={loading}
                  >
                    <option value="">Select your role</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LinkedIn URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/username/"
                  className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm ${
                    !linkedInUrlValid && linkedIn 
                      ? "border-red-300 focus:ring-red-500" 
                      : "border-gray-200 focus:ring-blue-500"
                  }`}
                  value={linkedIn}
                  onChange={(e) => setLinkedIn(e.target.value)}
                  disabled={loading}
                />
                {!linkedInUrlValid && linkedIn && (
                  <p className="text-xs text-red-500 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Please enter a valid LinkedIn profile URL
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Used for AI-powered LinkedIn profile analysis and recommendations
                </p>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume Upload</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    disabled={loading}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:font-medium"
                  />
                  {resumeFile && (
                    <div className="mt-2 flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {resumeFile.name}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload your resume in PDF format for AI analysis</p>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="Create a secure password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSignup}
                disabled={loading || !linkedInUrlValid}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center text-lg"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Your Profile...
                  </>
                ) : (
                  "Create Account & Analyze Profile"
                )}
              </button>

              {/* Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What happens during signup:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Account creation and validation
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
                      Resume parsing and AI analysis
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      LinkedIn profile analysis
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                      Secure data storage
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4 font-medium">
                  ⏱️ This process takes 1-2 minutes and provides comprehensive insights about your profile.
                </p>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => navigate("./pages/Login")}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSignup;