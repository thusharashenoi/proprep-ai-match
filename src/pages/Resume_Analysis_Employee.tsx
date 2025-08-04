import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Linkedin, Upload, ArrowLeft, Loader2, Menu } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AnalysisService } from "@/services/analyse_resume";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

const navLinks = [
  { label: "Jobs", to: "/jobs" },
  { label: "Resume Analysis", to: "/resume-analysis" },
  { label: "LinkedIn Analysis", to: "/linkedin-analysis" },
  { label: "Suggested Jobs", to: "/suggested-jobs" },
];

const Analysis = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  
  // Navbar states
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Navbar effects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "Employees", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);
          localStorage.setItem("userProfile", JSON.stringify(profileData));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Prefill from profile if available
  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.linkedinUrl) setLinkedinUrl(parsed.linkedinUrl);
      if (parsed.resumeAnalysis) setResumeAnalysis(parsed.resumeAnalysis);
      // Resume file cannot be prefilled for security reasons
    }
  }, []);

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      setResumeFile(file);
      setIsResumeAnalyzing(true);
      setResumeAnalysis(null);
      toast({
        title: "Resume uploaded successfully",
        description: `${file.name} has been uploaded.`
      });
      try {
        const analysis = await AnalysisService.analyzeBase64ResumeWithGemini(file);
        setResumeAnalysis(analysis);
        
        // Save to localStorage
        const currentProfile = localStorage.getItem("userProfile");
        if (currentProfile) {
          const parsed = JSON.parse(currentProfile);
          parsed.resumeAnalysis = analysis;
          localStorage.setItem("userProfile", JSON.stringify(parsed));
        }
      } catch (error) {
        toast({
          title: "Resume analysis failed",
          description: error instanceof Error ? error.message : "An error occurred during resume analysis.",
          variant: "destructive"
        });
        setResumeFile(null);
      } finally {
        setIsResumeAnalyzing(false);
      }
    }
  };

  const handleNewAnalysis = () => {
    setResumeAnalysis(null);
    setResumeFile(null);
    setLinkedinUrl("");
  };

  // Loading state
  if (isResumeAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Integrated Navbar */}
        <nav className="w-full flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50 shadow-sm">
          {/* Hamburger Menu */}
          <div className="relative">
            <button
              className="flex flex-col justify-center items-center w-10 h-10 rounded hover:bg-blue-100 focus:outline-none transition-colors duration-200"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
              <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
              <span className="block w-7 h-0.5 bg-gray-800 rounded transition-all" />
            </button>
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black bg-opacity-25 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                {/* Menu */}
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                  {navLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`block px-4 py-3 hover:bg-blue-50 transition-colors duration-200 ${
                        location.pathname === link.to ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700'
                      } ${link === navLinks[0] ? 'rounded-t-lg' : ''} ${link === navLinks[navLinks.length - 1] ? 'rounded-b-lg' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Resume Analysis Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resume Analysis
              </h1>
            </div>
          </div>

          {/* Profile Button */}
          <button
            className="flex items-center gap-2 ml-4 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200"
            onClick={() => navigate("/profile")}
            aria-label="Profile"
          >
            <img
              src={
                profile?.profilePic
                  ? `data:image/jpeg;base64,${profile.profilePic}`
                  : "/placeholder.svg"
              }
              alt="Profile"
              className="w-8 h-8 rounded-full border object-cover shadow-sm"
            />
            <span className="font-medium text-gray-700 hidden md:inline text-sm">
              {profile?.name || "Profile"}
            </span>
          </button>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-20">
          <Card className="text-center bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Analyzing Resume...
              </CardTitle>
              <CardDescription>
                Extracting skills, experience, and ATS score from your resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600 mb-6" />
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                This usually takes 10-20 seconds. Please don't close this window.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Analysis results view
  if (resumeAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Integrated Navbar */}
        <nav className="w-full flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50 shadow-sm">
          {/* Hamburger Menu */}
          <div className="relative">
            <button
              className="flex flex-col justify-center items-center w-10 h-10 rounded hover:bg-blue-100 focus:outline-none transition-colors duration-200"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
              <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
              <span className="block w-7 h-0.5 bg-gray-800 rounded transition-all" />
            </button>
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black bg-opacity-25 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                {/* Menu */}
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                  {navLinks.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`block px-4 py-3 hover:bg-blue-50 transition-colors duration-200 ${
                        location.pathname === link.to ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700'
                      } ${link === navLinks[0] ? 'rounded-t-lg' : ''} ${link === navLinks[navLinks.length - 1] ? 'rounded-b-lg' : ''}`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Resume Analysis Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Resume Analysis
              </h1>
            </div>
          </div>

          {/* Profile Button */}
          <button
            className="flex items-center gap-2 ml-4 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200"
            onClick={() => navigate("/profile")}
            aria-label="Profile"
          >
            <img
              src={
                profile?.profilePic
                  ? `data:image/jpeg;base64,${profile.profilePic}`
                  : "/placeholder.svg"
              }
              alt="Profile"
              className="w-8 h-8 rounded-full border object-cover shadow-sm"
            />
            <span className="font-medium text-gray-700 hidden md:inline text-sm">
              {profile?.name || "Profile"}
            </span>
          </button>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with New Analysis Button */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Resume Analysis Results
              </h2>
              <p className="text-gray-600">Your comprehensive resume evaluation and improvement suggestions</p>
            </div>
            <Button 
              onClick={handleNewAnalysis}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              New Analysis
            </Button>
          </div>

          {/* ATS Score Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">ATS Compatibility Score</h3>
              <p className="text-gray-600">How well your resume performs with Applicant Tracking Systems</p>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {resumeAnalysis.atsScore ?? 'N/A'}
                </div>
                <div className="text-2xl font-semibold text-gray-500">/100</div>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <Progress 
                value={resumeAnalysis.atsScore ?? 0} 
                className="h-6 w-full rounded-full shadow-lg bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-purple-600" 
              />
            </div>
          </div>

          {/* ATS Subscores Grid */}
          {resumeAnalysis.atsSubscores && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">📝</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Content Quality</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {resumeAnalysis.atsSubscores.contentQuality}/30
                </p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">🎨</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Visual Design</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {resumeAnalysis.atsSubscores.visualDesign}/25
                </p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">👁️</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Readability</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {resumeAnalysis.atsSubscores.readability}/20
                </p>
              </div>
              
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">⚙️</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Technical Compliance</h4>
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {resumeAnalysis.atsSubscores.technicalCompliance}/25
                </p>
              </div>
            </div>
          )}

          {/* Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Strengths */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  Strengths
                </h3>
              </div>
              <div className="p-6 max-h-80 overflow-y-auto">
                <ul className="space-y-3">
                  {(resumeAnalysis.strengths || []).map((strength: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Weaknesses */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-3">❌</span>
                  Areas for Improvement
                </h3>
              </div>
              <div className="p-6 max-h-80 overflow-y-auto">
                <ul className="space-y-3">
                  {(resumeAnalysis.weaknesses || []).map((weakness: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Layout Improvements */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-3">🎨</span>
                  Layout & Visual Improvements
                </h3>
              </div>
              <div className="p-6 max-h-80 overflow-y-auto">
                <ul className="space-y-3">
                  {(resumeAnalysis.atsImprovementTips || []).map((tip: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Content Improvements */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-3">📝</span>
                  Content Improvements
                </h3>
              </div>
              <div className="p-6 max-h-80 overflow-y-auto">
                <ul className="space-y-3">
                  {(resumeAnalysis.resumeImprovementTips || resumeAnalysis.suggestions || []).map((suggestion: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 8px;
          }
        `}</style>
      </div>
    );
  }

  // Upload form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Integrated Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50 shadow-sm">
        {/* Hamburger Menu */}
        <div className="relative">
          <button
            className="flex flex-col justify-center items-center w-10 h-10 rounded hover:bg-blue-100 focus:outline-none transition-colors duration-200"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open menu"
          >
            <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
            <span className="block w-7 h-0.5 bg-gray-800 mb-1 rounded transition-all" />
            <span className="block w-7 h-0.5 bg-gray-800 rounded transition-all" />
          </button>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-25 z-40"
                onClick={() => setMenuOpen(false)}
              />
              {/* Menu */}
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-4 py-3 hover:bg-blue-50 transition-colors duration-200 ${
                      location.pathname === link.to ? 'font-bold text-blue-700 bg-blue-50' : 'text-gray-700'
                    } ${link === navLinks[0] ? 'rounded-t-lg' : ''} ${link === navLinks[navLinks.length - 1] ? 'rounded-b-lg' : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Resume Analysis Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Resume Analysis
            </h1>
          </div>
        </div>

        {/* Profile Button */}
        <button
          className="flex items-center gap-2 ml-4 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors duration-200"
          onClick={() => navigate("/profile")}
          aria-label="Profile"
        >
          <img
            src={
              profile?.profilePic
                ? `data:image/jpeg;base64,${profile.profilePic}`
                : "/placeholder.svg"
            }
            alt="Profile"
            className="w-8 h-8 rounded-full border object-cover shadow-sm"
          />
          <span className="font-medium text-gray-700 hidden md:inline text-sm">
            {profile?.name || "Profile"}
          </span>
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/jobs" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            AI Resume Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Upload your resume and get instant AI-powered insights to improve your job application success.
          </p>
        </div>

        {/* Upload Cards Grid */}
        <div className="grid gap-8 mb-8 max-w-4xl mx-auto">
          {/* Resume Upload Card */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <FileText className="w-6 h-6 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">Upload Resume</span>
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Upload your resume in PDF format for comprehensive analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <div className="mb-6">
                  {resumeFile ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <p className="text-green-600 font-medium text-lg">{resumeFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 text-lg mb-2">
                        Drop your resume here or{" "}
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline font-semibold">
                          browse files
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleResumeUpload}
                            className="hidden"
                          />
                        </label>
                      </p>
                      <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
                    </div>
                  )}
                </div>
                {resumeFile && (
                  <Button 
                    onClick={handleResumeUpload}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Analyze Resume
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Profile Card (Optional) */}
          <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <Linkedin className="w-6 h-6 text-purple-600" />
                <span className="text-2xl font-bold text-gray-900">LinkedIn Profile</span>
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">Optional</span>
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Add your public LinkedIn profile URL for additional insights and cross-platform analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="url"
                  className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-lg transition-all duration-200 shadow-sm"
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  We'll analyze your profile for consistency with your resume
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-8">
            What You'll Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "📊",
                title: "ATS Score",
                description: "Comprehensive score showing how well your resume performs with applicant tracking systems"
              },
              {
                icon: "✅",
                title: "Strengths Analysis",
                description: "Detailed breakdown of what's working well in your current resume"
              },
              {
                icon: "🎯",
                title: "Improvement Tips",
                description: "Specific, actionable recommendations to enhance your resume's effectiveness"
              },
              {
                icon: "🎨",
                title: "Format Optimization",
                description: "Layout and design suggestions to improve readability and visual appeal"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;