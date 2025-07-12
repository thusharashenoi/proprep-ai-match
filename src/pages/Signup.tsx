import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisService } from "@/services/analysisService";

const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // If already signed in, redirect to jobs dashboard
  useEffect(() => {
    if (localStorage.getItem("isAuthenticated") === "true") {
      const userType = localStorage.getItem("userType");
      navigate("/jobs"); // Redirect to jobs dashboard for candidates
      
    }
  }, [navigate]);

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf" && file.size <= 10 * 1024 * 1024) {
      setResumeFile(file);
    } else {
      setError("Please upload a valid PDF file under 10MB.");
    }
  };

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
    if (!name || !email || !phone || !resumeFile) {
      setError("All fields except LinkedIn are required.");
      return;
    }
    if (!password || !confirmPassword) {
      setPasswordError("Please enter and confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError("");
    setIsSubmitting(true);
    let resumeAnalysis;
    try {
      resumeAnalysis = await AnalysisService.analyzeResumeWithGemini(resumeFile);
    } catch (err) {
      setError("Resume parsing failed. Please try again.");
      setIsSubmitting(false);
      return;
    }
    // Do NOT store resumeFile in localStorage profile
    const profile = { name, email, phone, linkedinUrl, resumeAnalysis, profilePic, type: "candidate" };
    try {
      localStorage.setItem("userProfile", JSON.stringify(profile));
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userType", "candidate");
    } catch (err) {
      setError("Profile data is too large to save. Please use a smaller profile picture or try again.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    navigate("/jobs"); // Open jobs dashboard after candidate profile creation
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center mb-6">
              <label htmlFor="profile-pic-upload" className="relative cursor-pointer group">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="object-cover w-full h-full" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2h2m4 0v6m0 0a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2h2" /></svg>
                  </div>
                </div>
                <input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
              </label>
              <span className="text-xs text-gray-500 mt-2">Click to upload profile picture</span>
            </div>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border rounded px-3 py-2"
              value={name}
              onChange={e => setName(e.target.value)} 
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
              type="tel"
              placeholder="Phone Number"
              className="w-full border rounded px-3 py-2"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
            <label className="block w-full">
              <span className="block mb-1 font-medium text-gray-700">Upload Resume (PDF)</span>
              <input
                type="file"
                accept="application/pdf"
                className="w-full"
                onChange={handleResumeUpload}
                required
              />
            </label>
            <input
              type="url"
              placeholder="LinkedIn Profile URL (optional)"
              className="w-full border rounded px-3 py-2"
              value={linkedinUrl}
              onChange={e => setLinkedinUrl(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full border rounded px-3 py-2"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating Profile..." : "Create Profile"}</Button>
            <div className="flex flex-col items-center mt-2">
              <span className="text-sm">Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign in</Link></span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
