import { useState } from "react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { db } from "@/firebase";
import { doc, setDoc, collection } from "firebase/firestore";
import { extract_resume } from "@/services/extract_resume";
import { AnalysisService } from "@/services/analyse_resume";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

  const navigate = useNavigate();
  const linkedinAnalyzer = new LinkedInAnalyzerClient();

  const updateProgress = (step: string, message: string) => {
    setCurrentStep(step);
    setProgress(message);
  };

  const handleSignup = async () => {
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
      
      // Show success alert with details
      if (linkedinAnalysisError) {
        alert(`Signup successful!\n\nResume analysis: ✅ Completed\nLinkedIn analysis: ❌ Failed (${linkedinAnalysisError})\n\nYou can retry LinkedIn analysis from your profile later.`);
      } else {
        alert("Signup successful! Resume and LinkedIn analysis completed.");
      }

      // Navigate to login after a short delay to show the final progress
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err: any) {
      console.error("Signup error:", err);
      updateProgress("error", `❌ Signup failed: ${err.message}`);
      
      // Provide specific error messages
      if (err.message.includes("auth/email-already-in-use")) {
        alert("This email is already registered. Please use a different email or try logging in.");
      } else if (err.message.includes("auth/weak-password")) {
        alert("Password is too weak. Please use at least 6 characters.");
      } else if (err.message.includes("LinkedIn")) {
        alert(`LinkedIn analysis error: ${err.message}\n\nPlease check your LinkedIn URL and try again.`);
      } else {
        alert(`Signup failed: ${err.message}`);
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
    <Card className="max-w-xl mx-auto mt-10 p-6 shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Employee Signup</CardTitle>
        {loading && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-full">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              {currentStep && <span className="mr-2 text-xs text-blue-500">Step: {currentStep}</span>}
              {progress}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center mb-4">
            <label htmlFor="profile-pic-upload" className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                {profilePic ? (
                  <img
                    src={URL.createObjectURL(profilePic)}
                    alt="Profile"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.232 5.232l3.536 3.536M9 13h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m4 0v6m0 0a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h2"
                    />
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
            <span className="text-xs text-gray-500 mt-1">Upload Profile Picture</span>
          </div>

        <Input 
          type="text" 
          placeholder="Full Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />

        <Input 
          type="tel" 
          placeholder="Phone Number" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
        />

        <Input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 border rounded-md text-gray-700"
          disabled={loading}
        >
          <option value="">Select Role</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div>
          <Input
            type="url"
            placeholder="LinkedIn Profile URL (e.g., https://www.linkedin.com/in/username/)"
            value={linkedIn}
            onChange={(e) => setLinkedIn(e.target.value)}
            disabled={loading}
            className={!linkedInUrlValid && linkedIn ? "border-red-300 focus:border-red-500" : ""}
          />
          {!linkedInUrlValid && linkedIn && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username/)
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This will be used for AI-powered LinkedIn profile analysis
          </p>
        </div>

        <div>
          <Input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">Upload your resume (PDF format)</p>
        </div>

        <Input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        <Button 
          onClick={handleSignup} 
          disabled={loading || !linkedInUrlValid} 
          className="w-full"
        >
          {loading ? "Processing..." : "Sign Up & Analyze Profile"}
        </Button>

        {/* Information about the process */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What happens during signup:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Account creation and data validation</li>
            <li>• Resume parsing and AI analysis</li>
            <li>• LinkedIn profile screenshot and analysis</li>
            <li>• Secure storage of all analysis results</li>
          </ul>
          <p className="text-xs text-blue-600 mt-2">
            This process may take 1-2 minutes depending on profile complexity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeSignup;


