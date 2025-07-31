import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { matchEmployeeToJobsStandardized } from "@/services/matchingService";
import { getAuth as getFirebaseAuth } from "firebase/auth";
import { 
  Loader2, 
  Briefcase, 
  Building2, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Search,
  User,
  LogOut,
  Menu,
  X,
  FileText,
  Linkedin,
  Target,
  MapPin,
  Clock,
  DollarSign,
  Award,
  Zap,
  Filter,
  SortDesc
} from "lucide-react";

// Mock Firebase setup - replace with your actual firebase config
const auth = getFirebaseAuth();
const db = {}; // Replace with your Firestore instance

const navLinks = [
  { label: "Jobs", to: "/jobs" },
  { label: "Resume Analysis", to: "/resume-analysis" },
  { label: "LinkedIn Analysis", to: "/linkedin-analysis" },
  { label: "Suggested Jobs", to: "/suggested-jobs" },
];

interface JobMatch {
  profilePic: string;
  role: string;
  company: string;
  match: number;
  jobId: string;
  location?: string;
  salary?: string;
  experience?: string;
  jobType?: string;
  breakdown?: {
    technicalSkills: number;
    experienceRelevance: number;
    industryKnowledge: number;
    roleFit: number;
    education: number;
  };
  strengths?: string[];
  gaps?: string[];
  recommendation?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
}

const SuggestedJobs = () => {
  // Navigation state
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Jobs state
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'company' | 'role'>('match');
  const [filterBy, setFilterBy] = useState<'all' | 'strong' | 'good' | 'moderate'>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState("");

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth state management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && db) {
        try {
          const docRef = doc(db, "Employees", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setProfile(profileData);
            localStorage.setItem("userProfile", JSON.stringify(profileData));
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setMenuOpen(false);
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userProfile");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleMatch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;

      if (!user || !user.uid) {
        throw new Error("Please log in to find job matches");
      }

      console.log("🔍 Starting job matching for user:", user.uid);
      const matchedJobs = await matchEmployeeToJobsStandardized(user.uid);

      if (!Array.isArray(matchedJobs)) {
        console.error("❌ Invalid response format:", matchedJobs);
        throw new Error("Invalid response format from match service");
      }

      // Add mock additional data for better UI demonstration
      const enhancedJobs = matchedJobs.map((job, index) => ({
        ...job,
        location: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Remote'][index % 5],
        salary: ['$80k - $120k', '$90k - $140k', '$70k - $110k', '$100k - $160k', '$85k - $125k'][index % 5],
        experience: ['2-4 years', '3-5 years', '1-3 years', '5+ years', '2-6 years'][index % 5],
        jobType: ['Full-time', 'Contract', 'Part-time', 'Full-time', 'Remote'][index % 5],
        description: 'Join our dynamic team and work on cutting-edge projects that make a real impact.',
        requirements: [
          'Bachelor\'s degree in relevant field',
          'Strong communication skills',
          'Experience with modern technologies',
          'Problem-solving mindset'
        ],
        benefits: [
          'Health insurance',
          'Flexible working hours',
          '401(k) matching',
          'Professional development budget'
        ]
      }));

      console.log("✅ Received job matches:", enhancedJobs.length, "jobs");
      setJobs(enhancedJobs);
      
    } catch (err: any) {
      console.error("❌ Error while matching jobs:", err);
      setError(err.message || "Something went wrong while finding matches");
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (percentage >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getRecommendationIcon = (recommendation?: string) => {
    switch (recommendation) {
      case 'STRONG_MATCH': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'GOOD_MATCH': return <Star className="h-4 w-4 text-blue-600" />;
      case 'MODERATE_MATCH': return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredAndSortedJobs = jobs
    .filter(job => {
      if (filterBy === 'all') return true;
      if (filterBy === 'strong') return job.match >= 80;
      if (filterBy === 'good') return job.match >= 60 && job.match < 80;
      if (filterBy === 'moderate') return job.match >= 40 && job.match < 60;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return b.match - a.match;
      if (sortBy === 'company') return a.company.localeCompare(b.company);
      if (sortBy === 'role') return a.role.localeCompare(b.role);
      return 0;
    });

  // Job Detail Modal
  const JobDetailModal = ({ job, onClose }: { job: JobMatch | null; onClose: () => void }) => {
    if (!job) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={job.profilePic}
                    alt={job.company}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9,22 9,12 15,12 15,22'/%3E%3C/svg%3E";
                    }}
                  />
                  <div className="absolute -top-2 -right-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getMatchColor(job.match)}`}>
                      {job.match}%
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{job.role}</h2>
                  <div className="flex items-center space-x-2 text-lg text-gray-600 mb-3">
                    <Building2 className="w-5 h-5" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {job.location && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.salary && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}
                    {job.experience && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{job.experience}</span>
                      </div>
                    )}
                  </div>
                  {job.recommendation && (
                    <div className="flex items-center space-x-2 mt-3">
                      {getRecommendationIcon(job.recommendation)}
                      <span className="text-sm font-medium text-gray-700">
                        {job.recommendation.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Match breakdown visualization */}
            {job.breakdown && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-600" />
                  Your Fit Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(job.breakdown).map(([key, value]) => {
                    const maxValue = key.includes('Skills') || key.includes('Experience') ? 25 : 
                                   key === 'education' ? 10 : 20;
                    const percentage = (value / maxValue) * 100;
                    
                    return (
                      <div key={key} className="bg-gray-50 rounded-xl p-4">
                        <div className="text-center mb-3">
                          <div className="text-2xl font-bold text-blue-600">{value}/{maxValue}</div>
                          <div className="text-xs text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Job Description */}
            {job.description && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">About this role</h4>
                <p className="text-gray-700 leading-relaxed">{job.description}</p>
              </div>
            )}

            {/* Strengths and improvement areas */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {job.strengths && job.strengths.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6">
                  <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Your Strengths
                  </h4>
                  <div className="space-y-3">
                    {job.strengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-green-700 text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {job.gaps && job.gaps.length > 0 && (
                <div className="bg-orange-50 rounded-xl p-6">
                  <h4 className="font-semibold text-orange-800 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Areas to Develop
                  </h4>
                  <div className="space-y-3">
                    {job.gaps.map((gap, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Target className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span className="text-orange-700 text-sm">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Requirements and Benefits */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {job.requirements && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {job.benefits && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Benefits</h4>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button 
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Updated Navbar - Employee Dashboard Style */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            
            {/* Left Side - Hamburger Menu & Logo */}
            <div className="flex items-center space-x-4">
              {/* Hamburger Menu */}
              <div className="relative menu-container">
                <button
                  className="flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-blue-100 focus:outline-none transition-colors duration-200"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Open menu"
                >
                  <span className="block w-6 h-0.5 bg-gray-700 mb-1 rounded transition-all" />
                  <span className="block w-6 h-0.5 bg-gray-700 mb-1 rounded transition-all" />
                  <span className="block w-6 h-0.5 bg-gray-700 rounded transition-all" />
                </button>
                
                {menuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-20 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    {/* Menu */}
                    <div className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl z-50 border border-white/30 overflow-hidden">
                      {navLinks.map((link, index) => (
                        <button
                          key={link.to}
                          onClick={() => handleNavigation(link.to)}
                          className={`w-full text-left px-6 py-4 hover:bg-blue-50 transition-colors duration-200 ${
                            index !== navLinks.length - 1 ? 'border-b border-gray-100' : ''
                          } ${
                            location.pathname === link.to ? 'font-semibold text-blue-700 bg-blue-50' : 'text-gray-700'
                          }`}
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Logo & Brand */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">PP</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    proprep.ai
                  </h1>
                  <p className="text-sm text-gray-600 hidden sm:block">Find your perfect job match</p>
                </div>
              </div>
            </div>
            
            {/* Center - Search Bar */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={internalSearchQuery}
                  onChange={(e) => setInternalSearchQuery(e.target.value)}
                  placeholder="Search suggested jobs..."
                  className="block w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-lg transition-all duration-200"
                />
                {internalSearchQuery && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                      onClick={() => setInternalSearchQuery("")}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Profile */}
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Profile"
            >
              <img
                src={
                  profile?.profilePic
                    ? `data:image/jpeg;base64,${profile.profilePic}`
                    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
                }
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
              />
              <span className="font-medium text-gray-700 hidden lg:inline">
                {profile?.name || "Profile"}
              </span>
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={internalSearchQuery}
                onChange={(e) => setInternalSearchQuery(e.target.value)}
                placeholder="Search suggested jobs..."
                className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white/80 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-lg"
              />
              {internalSearchQuery && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setInternalSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/20 mb-6">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">AI-Powered Job Matching</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Suggested Jobs
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover perfect job opportunities tailored to your skills, experience, and career goals
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 text-center">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {jobs.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-12 max-w-2xl mx-auto border border-white/20">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Briefcase className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">
                Ready to find your dream job?
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Our AI will analyze your profile and find jobs that perfectly match your skills, 
                experience, and career aspirations.
              </p>
              <button 
                onClick={handleMatch} 
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-medium hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Finding Your Perfect Matches...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Zap className="w-6 h-6" />
                    <span>Find My Dream Jobs</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && jobs.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-12 max-w-lg mx-auto border border-white/20">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Analyzing Your Profile
              </h3>
              <p className="text-gray-600 mb-2">
                Our AI is finding the perfect jobs for you...
              </p>
              <p className="text-sm text-gray-500">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

        {/* Jobs Results */}
        {jobs.length > 0 && (
          <div className="space-y-8">
            
            {/* Results Header with Filters */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Found <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{filteredAndSortedJobs.length}</span> perfect matches!
                  </h2>
                  <p className="text-gray-600">Tailored job opportunities based on your profile</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Filter Dropdown */}
                  <div className="relative menu-container">
                    <button
                      onClick={() => setFilterOpen(!filterOpen)}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/80 border border-gray-200 rounded-lg hover:bg-white transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium">Filter</span>
                    </button>
                    
                    {filterOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 py-2 z-10">
                        {[
                          { value: 'all', label: 'All Matches', count: jobs.length },
                          { value: 'strong', label: 'Strong Match (80%+)', count: jobs.filter(j => j.match >= 80).length },
                          { value: 'good', label: 'Good Match (60-79%)', count: jobs.filter(j => j.match >= 60 && j.match < 80).length },
                          { value: 'moderate', label: 'Moderate (40-59%)', count: jobs.filter(j => j.match >= 40 && j.match < 60).length }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFilterBy(option.value as any);
                              setFilterOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                              filterBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{option.label}</span>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{option.count}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 bg-white/80 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="match">Sort by Match %</option>
                    <option value="company">Sort by Company</option>
                    <option value="role">Sort by Role</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Top 3 Matches - Premium Display */}
            {filteredAndSortedJobs.slice(0, 3).length > 0 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full border border-yellow-200 mb-4">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Top Recommendations</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">🏆 Your Best Matches</h2>
                  <p className="text-gray-600 text-lg">These opportunities align perfectly with your profile</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {filteredAndSortedJobs.slice(0, 3).map((job, index) => (
                    <div
                      key={job.jobId}
                      className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 transform hover:-translate-y-2 cursor-pointer ${
                        index === 0 ? 'ring-2 ring-yellow-300 shadow-yellow-100' : 
                        index === 1 ? 'ring-2 ring-gray-300 shadow-gray-100' :
                        'ring-2 ring-orange-300 shadow-orange-100'
                      }`}
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="p-8 text-center relative">
                        {/* Rank Badge */}
                        <div className="absolute -top-3 -right-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                            'bg-gradient-to-r from-orange-400 to-orange-600'
                          }`}>
                            #{index + 1}
                          </div>
                        </div>

                        {/* Match Percentage - Prominent */}
                        <div className="mb-6">
                          <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-2xl font-bold border-2 ${getMatchColor(job.match)}`}>
                            {job.match}% Match
                          </div>
                          {job.recommendation && (
                            <div className="flex items-center justify-center space-x-2 mt-3">
                              {getRecommendationIcon(job.recommendation)}
                              <span className="text-sm font-medium text-gray-700">
                                {job.recommendation.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Company Logo */}
                        <div className="mb-6">
                          <img
                            src={job.profilePic}
                            alt={`${job.company} profile`}
                            className="w-20 h-20 rounded-2xl mx-auto object-cover bg-gray-100 border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9,22 9,12 15,12 15,22'/%3E%3C/svg%3E";
                            }}
                          />
                        </div>

                        {/* Job Details */}
                        <div className="space-y-3 mb-6">
                          <h3 className="text-xl font-bold text-gray-900">
                            {job.company}
                          </h3>
                          <p className="text-lg text-gray-700 font-medium line-clamp-2">
                            {job.role}
                          </p>
                          
                          {/* Job Info */}
                          <div className="space-y-2 text-sm text-gray-600">
                            {job.location && (
                              <div className="flex items-center justify-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                            )}
                            {job.salary && (
                              <div className="flex items-center justify-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>{job.salary}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Skills Breakdown Preview */}
                        {job.breakdown && (
                          <div className="grid grid-cols-3 gap-3 text-xs mb-6">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-blue-600 font-bold">{job.breakdown.technicalSkills}</span>
                              </div>
                              <div className="text-gray-500">Technical</div>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-green-600 font-bold">{job.breakdown.experienceRelevance}</span>
                              </div>
                              <div className="text-gray-500">Experience</div>
                            </div>
                            <div className="text-center">
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="text-purple-600 font-bold">{job.breakdown.industryKnowledge}</span>
                              </div>
                              <div className="text-gray-500">Industry</div>
                            </div>
                          </div>
                        )}

                        {/* Top Strengths Preview */}
                        {job.strengths && job.strengths.length > 0 && (
                          <div className="mb-6">
                            <div className="text-sm font-medium text-green-700 mb-3">Key Strengths</div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              {job.strengths.slice(0, 2).map((strength, idx) => (
                                <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  {strength.length > 15 ? strength.substring(0, 15) + '...' : strength}
                                </span>
                              ))}
                              {job.strengths.length > 2 && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  +{job.strengths.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Details Button */}
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                          View Full Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Matches - Compact Grid */}
            {filteredAndSortedJobs.length > 3 && (
              <div className="space-y-8">
                <div className="text-center border-t pt-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">More Great Opportunities</h2>
                  <p className="text-gray-600">Additional jobs that match your profile</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedJobs.slice(3).map((job) => (
                    <div
                      key={job.jobId}
                      className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-0 cursor-pointer transform hover:-translate-y-1"
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="p-6 text-center">
                        {/* Match Percentage */}
                        <div className="mb-4">
                          <div className={`inline-flex items-center px-4 py-2 rounded-xl text-lg font-bold border ${getMatchColor(job.match)}`}>
                            {job.match}%
                          </div>
                          {job.recommendation && (
                            <div className="flex items-center justify-center space-x-1 mt-2">
                              {getRecommendationIcon(job.recommendation)}
                              <span className="text-xs font-medium text-gray-700">
                                {job.recommendation.replace('_', ' ')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Company Logo */}
                        <div className="mb-4">
                          <img
                            src={job.profilePic}
                            alt={`${job.company} profile`}
                            className="w-16 h-16 rounded-xl mx-auto object-cover bg-gray-100 border-2 border-gray-200 group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9,22 9,12 15,12 15,22'/%3E%3C/svg%3E";
                            }}
                          />
                        </div>

                        {/* Job Details */}
                        <div className="space-y-2 mb-4">
                          <h3 className="font-bold text-gray-900 text-lg">
                            {job.company}
                          </h3>
                          <p className="text-gray-700 text-sm line-clamp-2 font-medium">
                            {job.role}
                          </p>
                          
                          {/* Compact Job Info */}
                          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                            {job.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{job.location.split(',')[0]}</span>
                              </div>
                            )}
                            {job.salary && (
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-3 h-3" />
                                <span>{job.salary.split(' ')[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Skills Preview */}
                        {job.breakdown && (
                          <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                            <div className="text-center">
                              <div className="text-blue-600 font-bold text-sm">
                                {job.breakdown.technicalSkills}
                              </div>
                              <div className="text-gray-500">Tech</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-600 font-bold text-sm">
                                {job.breakdown.experienceRelevance}
                              </div>
                              <div className="text-gray-500">Exp</div>
                            </div>
                            <div className="text-center">
                              <div className="text-purple-600 font-bold text-sm">
                                {job.breakdown.industryKnowledge}
                              </div>
                              <div className="text-gray-500">Ind</div>
                            </div>
                          </div>
                        )}

                        {/* View Details Button */}
                        <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center pt-12 space-y-4">
              <button 
                onClick={handleMatch} 
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-70"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Refreshing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Refresh Matches</span>
                  </div>
                )}
              </button>
              
              <p className="text-sm text-gray-500">
                Job matches are updated based on your latest profile information
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Job Detail Modal */}
      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
};

export default SuggestedJobs;