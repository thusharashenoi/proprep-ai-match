import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/firebase";
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Search, X, Menu, User, BarChart3, FileText, Target, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";

const navLinks = [
  { label: "Jobs", to: "/jobs" },
  { label: "Resume Analysis", to: "/resume-analysis" },
  { label: "LinkedIn Analysis", to: "/linkedin-analysis" },
  { label: "Suggested Jobs", to: "/suggested-jobs" },
];

const LinkedinAnalysis: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mock LinkedIn analysis data for demonstration
  // Profile authentication effect
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

  useEffect(() => {
    const fetchLinkedInAnalysis = async () => {
      setLoading(true);
      setError("");
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) throw new Error("User not logged in");

        // Get the most recent LinkedIn analysis from Firebase
        const analysisCollectionRef = collection(db, "Employees", user.uid, "linkedin_analysis");
        const analysisQuery = query(analysisCollectionRef, orderBy("analyzedAt", "desc"), limit(1));
        const analysisSnapshot = await getDocs(analysisQuery);

        if (analysisSnapshot.empty) {
          throw new Error("No LinkedIn analysis found. Please run an analysis first.");
        }

        const latestAnalysis = analysisSnapshot.docs[0].data();
        const reportUrl = latestAnalysis.reportUrl;

        if (!reportUrl) {
          throw new Error("Report URL not found in analysis data");
        }

        // Construct the full URL for the report
        // const fullReportUrl = `http://localhost:3000${reportUrl}`;
        const fullReportUrl = `https://linkedinanalyzerapi-htmq.onrender.com${reportUrl}`;

        // Fetch the HTML content from the report URL
        const res = await fetch(fullReportUrl);
        if (!res.ok) throw new Error(`Failed to fetch LinkedIn analysis HTML: ${res.statusText}`);
        
        const html = await res.text();
        setHtmlContent(html);

      } catch (err: any) {
        console.error("Error fetching LinkedIn analysis:", err);
        setError(err.message || "Error fetching LinkedIn analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedInAnalysis();
  }, []);

  // Inject scripts after HTML is rendered
  useEffect(() => {
    if (!htmlContent || !containerRef.current) return;

    // Remove any previous scripts
    const prevScripts = containerRef.current.querySelectorAll("script[data-injected='true']");
    prevScripts.forEach(s => s.remove());

    // Extract and inject scripts
    const doc = document.implementation.createHTMLDocument();
    doc.body.innerHTML = htmlContent;
    const scripts = doc.querySelectorAll("script");

    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      let scriptText = oldScript.textContent || "";

      // Patch: If script uses DOMContentLoaded, strip the wrapper and run immediately
      if (scriptText.includes('DOMContentLoaded')) {
        const match = scriptText.match(/document.addEventListener\(['"]DOMContentLoaded['"], function\(\) \{([\s\S]*)\}\);?/);
        if (match && match[1]) {
          scriptText = match[1];
        }
      }

      // Wrap in setTimeout to ensure DOM is ready and React has flushed
      newScript.textContent = `setTimeout(function(){${scriptText}}, 0);`;
      newScript.async = false;
      newScript.setAttribute("data-injected", "true");
      containerRef.current!.appendChild(newScript);
    });
  }, [htmlContent]);

  const handleNavigation = (path: string) => {
    setMenuOpen(false);
    window.location.href = path;
  };

  const handleProfileClick = () => {
    window.location.href = "/profile";
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      {/* TOP-LEVEL NAVIGATION BAR - This is the main outer navigation */}
      <div className="bg-white/90 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            
            {/* Left Side - Hamburger Menu & Logo */}
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu */}
              <div className="relative">
                <button
                  className="flex flex-col justify-center items-center w-12 h-12 rounded-xl hover:bg-blue-100 focus:outline-none transition-all duration-200 group"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Open menu"
                >
                  <span className={`block w-6 h-0.5 bg-gray-700 mb-1.5 rounded transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                  <span className={`block w-6 h-0.5 bg-gray-700 mb-1.5 rounded transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                  <span className={`block w-6 h-0.5 bg-gray-700 rounded transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </button>
                
                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-25 z-40 backdrop-blur-sm"
                      onClick={() => setMenuOpen(false)}
                    />
                    {/* Menu */}
                    <div className="absolute left-0 mt-3 w-72 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl z-50 border border-white/30 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      <div className="p-2">
                        {navLinks.map((link, index) => (
                          <button
                            key={link.to}
                            onClick={() => handleNavigation(link.to)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 mb-1 ${
                              link.to === '/linkedin-analysis' 
                                ? 'font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200' 
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {link.to === '/jobs' && <FileText className="w-4 h-4" />}
                              {link.to === '/resume-analysis' && <FileText className="w-4 h-4" />}
                              {link.to === '/linkedin-analysis' && <BarChart3 className="w-4 h-4" />}
                              {link.to === '/suggested-jobs' && <Target className="w-4 h-4" />}
                              <span>{link.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Logo & Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">JP</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Job Portal
                  </h1>
                  <p className="text-sm text-gray-600 hidden sm:block font-medium">LinkedIn Profile Analysis</p>
                </div>
              </div>
            </div>

            {/* Center - Page Title (visible on larger screens) */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">LinkedIn Analysis</h2>
                <p className="text-xs text-gray-500">Profile Optimization Report</p>
              </div>
            </div>

            {/* Right Side - Actions & Profile */}
            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/90 hover:border-white/60 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh Analysis"
              >
                <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {loading ? 'Loading...' : 'Refresh'}
                </span>
              </button>

              {/* Profile */}
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Profile"
              >
                <div className="relative">
                  <img
                    src={
                      profile?.profilePic
                        ? `data:image/jpeg;base64,${profile.profilePic}`
                        : "/api/placeholder/40/40"
                    }
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="font-medium text-gray-700 hidden lg:inline max-w-24 truncate">
                  {profile?.name || "Profile"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA - This contains the LinkedIn analysis content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  LinkedIn Profile Analysis
                </h2>
                <p className="text-gray-600 mt-1">Comprehensive analysis and optimization recommendations</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-sm font-medium text-gray-700">Just now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  loading ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  error ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}>
                  {loading ? <RefreshCw className="w-7 h-7 text-white animate-spin" /> :
                   error ? <AlertCircle className="w-7 h-7 text-white" /> :
                   <CheckCircle className="w-7 h-7 text-white" />}
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Analysis Status</p>
                <p className="text-xl font-bold text-gray-900">
                  {loading ? 'Processing...' : error ? 'Error' : 'Complete'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Report Type</p>
                <p className="text-xl font-bold text-gray-900">LinkedIn Analysis</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Focus Area</p>
                <p className="text-xl font-bold text-gray-900">Profile Optimization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Content Container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl overflow-hidden">
          
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center p-20 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <RefreshCw className="w-10 h-10 text-white animate-spin" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-20 animate-pulse"></div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Analyzing Your LinkedIn Profile</h3>
                <p className="text-gray-600 text-lg">Processing your profile data and generating insights...</p>
                <div className="mt-4 flex justify-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-8">
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-3xl p-10">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-800 mb-3">Analysis Error</h3>
                    <p className="text-red-700 mb-6 text-lg">{error}</p>
                    <button
                      onClick={handleRefresh}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State with LinkedIn Analysis Content */}
          {!loading && !error && htmlContent && (
            <div className="p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    <CheckCircle className="w-7 h-7 text-green-600 mr-3" />
                    Analysis Complete
                  </h3>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Analysis
                  </button>
                </div>
                <p className="text-gray-600 mt-2 text-lg">Here's your comprehensive LinkedIn profile analysis with actionable recommendations</p>
              </div>
              
              {/* LinkedIn Analysis Content - This is where the internal HTML content is displayed */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-3xl p-8 shadow-inner">
                <div
                  ref={containerRef}
                  className="prose max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-800 prose-lg"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !htmlContent && (
            <div className="flex flex-col items-center justify-center p-20 space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Analysis Available</h3>
                <p className="text-gray-600 mb-6 text-lg">No analysis content was found. Please run a new analysis.</p>
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl font-semibold"
                >
                  <RefreshCw className="w-5 h-5" />
                  Run New Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkedinAnalysis;

