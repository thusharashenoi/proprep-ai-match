import { useState } from "react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { db } from "@/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { extract_resume } from "@/services/extract_resume";
import { AnalysisService } from "@/services/analyse_resume";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const roles = [
  "Data Scientist",
  "Software Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "AI/ML Engineer",
  "Product Manager",
  "UI/UX Designer",
];

// LinkedIn Analyzer API Client
class LinkedInAnalyzerClient {
  constructor(private baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }
  // constructor(private baseUrl = 'https://linkedinanalyzerapi-htmq.onrender.com') {
  //   this.baseUrl = baseUrl;
  // }

  async analyzeProfile(profileUrl: string, onProgress?: (message: string) => void): Promise<any> {
    try {
      if (!this.isValidLinkedInUrl(profileUrl)) {
        throw new Error('Invalid LinkedIn profile URL. Please provide a valid LinkedIn profile URL.');
      }

      if (onProgress) onProgress('🔍 Starting LinkedIn analysis...');

      const response = await fetch(`${this.baseUrl}/api/linkedin/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrl: profileUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (onProgress) onProgress('✅ LinkedIn analysis completed successfully!');
        return result;
      } else {
        throw new Error(result.error || 'LinkedIn analysis failed');
      }

    } catch (error: any) {
      if (onProgress) onProgress(`❌ Error: ${error.message}`);
      throw error;
    }
  }

  async checkStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/linkedin/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('❌ Status check failed:', error);
      throw error;
    }
  }

  private isValidLinkedInUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('linkedin.com') && 
             (url.includes('/in/') || url.includes('/pub/'));
    } catch {
      return false;
    }
  }
}

const EmployeeSignup = () => {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
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
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const navigate = useNavigate();
  const linkedinAnalyzer = new LinkedInAnalyzerClient();

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfilePicPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProgress = (step: string, message: string) => {
    setCurrentStep(step);
    setProgress(message);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignupSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (!resumeFile || !profilePic) {
      setError("Please upload both a resume and a profile picture.");
      return;
    }

    if (!linkedIn.trim()) {
      setError("Please provide a LinkedIn profile URL.");
      return;
    }

    try {
      setLoading(true);
      updateProgress("validation", "🔍 Validating LinkedIn URL...");

      // Validate LinkedIn URL before proceeding
      if (!linkedIn.includes('linkedin.com') || (!linkedIn.includes('/in/') && !linkedIn.includes('/pub/'))) {
        throw new Error("Please provide a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username/)");
      }

      // Check LinkedIn analyzer service status
      updateProgress("service-check", "🔧 Checking LinkedIn analyzer service...");
      try {
        const serviceStatus = await linkedinAnalyzer.checkStatus();
        if (!serviceStatus.success) {
          console.warn("LinkedIn service not fully ready:", serviceStatus.message);
          // Continue anyway - the service might still work for basic functionality
        }
      } catch (error) {
        console.warn("LinkedIn service check failed, continuing anyway:", error);
      }

      // Step 1: Create Firebase user
      updateProgress("firebase", "👤 Creating user account...");
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const employeeId = uuidv4();

      // Convert files to base64
      updateProgress("files", "📁 Processing uploaded files...");
      const profilePicBase64 = await fileToBase64(profilePic);
      const resumeBase64 = await fileToBase64(resumeFile);

      // Step 2: Extract data from resume
      updateProgress("resume-extract", "📄 Extracting data from resume...");
      const parsedData = await extract_resume(resumeBase64, {
        name,
        email,
        phone,
        linkedin: linkedIn,
      });

      // Step 3: Analyze resume using Gemini
      updateProgress("resume-analysis", "🤖 Analyzing resume with AI...");
      const resumeAnalysis = await AnalysisService.analyzeBase64ResumeWithGemini(resumeBase64);

      // Step 4: Analyze LinkedIn profile
      updateProgress("linkedin-analysis", "🔍 Analyzing LinkedIn profile...");
      let linkedinAnalysisData = null;
      let linkedinAnalysisError = null;

      try {
        const linkedinResult = await linkedinAnalyzer.analyzeProfile(
          linkedIn, 
          (progressMessage) => {
            updateProgress("linkedin-analysis", progressMessage);
          }
        );

        if (linkedinResult && linkedinResult.success) {
          linkedinAnalysisData = {
            success: true,
            screenshotPath: linkedinResult.data?.screenshotPath || null,
            screenshotUrl: linkedinResult.data?.screenshotUrl || null,
            reportUrl: linkedinResult.data?.reportUrl || null,
            analysisData: linkedinResult.data?.analysisData || null,
            analyzedAt: new Date().toISOString(),
            profileUrl: linkedIn,
          };

          // If there are warnings, include them
          if (linkedinResult.warnings && linkedinResult.warnings.length > 0) {
            linkedinAnalysisData.warnings = linkedinResult.warnings;
          }

          updateProgress("linkedin-analysis", "✅ LinkedIn analysis completed successfully!");
        } else {
          throw new Error("LinkedIn analysis returned unsuccessful result");
        }
      } catch (error: any) {
        console.error("LinkedIn analysis failed:", error);
        linkedinAnalysisError = error.message;
        linkedinAnalysisData = {
          success: false,
          error: error.message,
          analyzedAt: new Date().toISOString(),
          profileUrl: linkedIn,
        };
        updateProgress("linkedin-analysis", "⚠️ LinkedIn analysis failed, continuing with signup...");
      }

      // Step 5: Store employee profile in Firestore
      updateProgress("firebase-save", "💾 Saving profile to database...");
      const employeeData = {
        id: employeeId,
        name: parsedData.name || name,
        email: parsedData.email || email,
        phone: parsedData.phone || phone,
        linkedIn: parsedData.linkedin || linkedIn,
        profilePic: profilePicBase64,
        role,
        resume64: resumeBase64,
        resumeAnalysis, // Full analysis data from Gemini
        createdAt: new Date().toISOString(),
        // Add LinkedIn analysis status
        linkedinAnalysisStatus: linkedinAnalysisData?.success ? 'completed' : 'failed',
      };

      await setDoc(doc(db, "Employees", user.uid), employeeData);

      // Step 6: Save LinkedIn analysis data in a subcollection
      updateProgress("linkedin-save", "📊 Saving LinkedIn analysis...");
      if (linkedinAnalysisData) {
        const linkedinAnalysisRef = doc(collection(db, "Employees", user.uid, "linkedin_analysis"));
        await setDoc(linkedinAnalysisRef, linkedinAnalysisData);
      }

      // Final success message
      let successMessage = "✅ Signup successful! ";
      if (linkedinAnalysisData?.success) {
        successMessage += "Resume and LinkedIn analysis completed.";
      } else {
        successMessage += "Resume analysis completed. LinkedIn analysis failed but can be retried later.";
      }

      updateProgress("complete", successMessage);
      setSignupSuccess(true);

    } catch (err: any) {
      console.error("Signup error:", err);
      updateProgress("error", `❌ Signup failed: ${err.message}`);
      
      // Provide specific error messages
      if (err.message.includes("auth/email-already-in-use")) {
        setError("This email is already registered. Please use a different email or try logging in.");
      } else if (err.message.includes("auth/weak-password")) {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (err.message.includes("LinkedIn")) {
        setError(`LinkedIn analysis error: ${err.message}\n\nPlease check your LinkedIn URL and try again.`);
      } else {
        setError(`Signup failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64 = (reader.result as string)?.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Helper function to validate LinkedIn URL in real-time
  const isValidLinkedInUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty for now
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
      <div className="max-w-md mx-auto mb-8">
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
            onClick={() => navigate("/login")}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            ← Back to Login
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Join as Employee
            </h2>
            <p className="text-gray-600">Get AI-powered career insights and matching</p>
          </div>

          {/* Progress Indicator */}
          {loading && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-center mb-2">
                <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-700 font-medium text-sm">Processing...</span>
              </div>
              {currentStep && (
                <div className="text-xs text-blue-600 text-center mb-1">
                  Step: {currentStep}
                </div>
              )}
              <div className="text-sm text-blue-700 text-center">
                {progress}
              </div>
            </div>
          )}

          {signupSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome Aboard! 🎉</h3>
                <p className="text-gray-600 mb-6">
                  Your profile has been created and analyzed successfully. You're ready to find amazing opportunities!
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                Continue to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center">
                <label htmlFor="profile-pic-upload" className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                    {profilePicPreview ? (
                      <img src={profilePicPreview} alt="Profile" className="object-cover w-full h-full" />
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
                    onChange={handleProfilePicChange}
                    disabled={loading}
                  />
                </label>
                <span className="text-sm text-gray-500 mt-2 font-medium">Upload Profile Picture</span>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required
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
                      required
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
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      disabled={loading}
                      required
                    >
                      <option value="">Select your role</option>
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                    <input
                      type="url"
                      placeholder="https://www.linkedin.com/in/username/"
                      className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm ${
                        !linkedInUrlValid && linkedIn ? 
                        "border-red-300 focus:ring-red-500" : 
                        "border-gray-200 focus:ring-blue-500"
                      }`}
                      value={linkedIn}
                      onChange={(e) => setLinkedIn(e.target.value)}
                      disabled={loading}
                      required
                    />
                    {!linkedInUrlValid && linkedIn && (
                      <p className="text-xs text-red-500 mt-1">
                        Please enter a valid LinkedIn profile URL
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Used for AI-powered LinkedIn profile analysis
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resume Upload</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload your resume (PDF format only)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      placeholder="Create a secure password"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
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
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !linkedInUrlValid}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Profile...
                  </>
                ) : (
                  "Sign Up & Analyze Profile"
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Features Preview */}
        {!signupSuccess && (
          <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">What you'll get:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">AI-powered resume analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">LinkedIn profile insights and optimization</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">Smart job matching based on your profile</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">Career improvement recommendations</span>
              </div>
            </div>
            <div className="mt-4 bg-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-800 text-center">
                <strong>Analysis Process:</strong> Account creation → Resume parsing → LinkedIn analysis → Secure storage
              </p>
              <p className="text-xs text-blue-600 text-center mt-1">
                This comprehensive process may take 1-2 minutes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSignup;