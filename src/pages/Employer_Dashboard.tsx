import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { X, User, FileText, Linkedin, Mail, Phone, Calendar, MapPin, Award, TrendingUp, AlertCircle, CheckCircle, Search, Filter, LogOut } from "lucide-react";

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterByATS, setFilterByATS] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setDebugInfo(prev => prev + "\n✓ User authenticated: " + user.uid);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch employees from Firebase with enhanced debugging
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        setDebugInfo("Starting employee fetch...");
        
        // Check if user is authenticated
        if (!auth.currentUser) {
          setDebugInfo(prev => prev + "\n❌ No authenticated user");
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        setDebugInfo(prev => prev + "\n✓ User authenticated: " + auth.currentUser.uid);
        
        // Check if db is properly initialized
        if (!db) {
          setDebugInfo(prev => prev + "\n❌ Database not initialized");
          setError("Database connection not initialized");
          setLoading(false);
          return;
        }

        setDebugInfo(prev => prev + "\n✓ Database connection available");
        
        // Fetch from Employees collection (capitalized to match Firestore rules)
        const employeesRef = collection(db, "Employees");
        setDebugInfo(prev => prev + "\n✓ Collection reference created for 'Employees'");
        
        const querySnapshot = await getDocs(employeesRef);
        setDebugInfo(prev => prev + "\n✓ Query executed successfully");
        setDebugInfo(prev => prev + "\n📊 Documents found: " + querySnapshot.size);
        
        if (querySnapshot.empty) {
          setDebugInfo(prev => prev + "\n⚠️ Query returned empty results");
          setError("No documents found in 'employees' collection. Please verify:");
          setLoading(false);
          return;
        }
        
        const employeesData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          setDebugInfo(prev => prev + "\n📄 Processing doc: " + doc.id);
          
          // Log the raw data structure
          console.log(`Document ${doc.id} raw data:`, data);
          
          const employeeRecord = {
            id: doc.id,
            name: data.name || data.fullName || data.displayName || "No Name",
            profilePic: data.profilePic || data.profilePicture || data.avatar || "",
            role: data.role || data.position || data.jobTitle || "No Role",
            email: data.email || "",
            phone: data.phone || "",
            linkedIn: data.linkedIn || data.linkedin || "",
            createdAt: data.createdAt || "",
            // Handle resumeAnalysis object - extract key information
            resumeAnalysis: data.resumeAnalysis ? {
              atsScore: data.resumeAnalysis.atsScore || "N/A",
              strengths: data.resumeAnalysis.strengths || [],
              weaknesses: data.resumeAnalysis.weaknesses || [],
              projects: data.resumeAnalysis.projects || [],
              summary: data.resumeAnalysis.summary || "",
              atsSubscores: data.resumeAnalysis.atsSubscores || {},
              competitivePositioning: data.resumeAnalysis.competitivePositioning || {},
              marketReality: data.resumeAnalysis.marketReality || {},
              hiringManagerPerspective: data.resumeAnalysis.hiringManagerPerspective || {},
              personalInfo: data.resumeAnalysis.personalInfo || {},
              improvementDirectives: data.resumeAnalysis.improvementDirectives || [],
              resumeImprovementTips: data.resumeAnalysis.resumeImprovementTips || [],
              atsImprovementTips: data.resumeAnalysis.atsImprovementTips || []
            } : null,
            // Handle linkedinAnalysis (store the full object if it exists)
            linkedinAnalysis: data.linkedinAnalysis || null,
            linkedinAnalysisStatus: data.linkedinAnalysisStatus || "",
            ...data // Include any other fields
          };
          
          employeesData.push(employeeRecord);
          setDebugInfo(prev => prev + "\n✓ Added employee: " + (employeeRecord.name || doc.id));
        });
        
        setDebugInfo(prev => prev + "\n✅ Total employees processed: " + employeesData.length);
        setCandidates(employeesData);
        
        if (employeesData.length === 0) {
          setError("No employee records could be processed from the database.");
        }
        
      } catch (err) {
        console.error("Error fetching employees:", err);
        setDebugInfo(prev => prev + "\n❌ Error: " + err.message);
        
        let errorMessage = "Failed to load employees: ";
        
        switch (err.code) {
          case 'permission-denied':
            errorMessage += "Permission denied. Check Firestore security rules.";
            break;
          case 'unavailable':
            errorMessage += "Firestore service unavailable. Check internet connection.";
            break;
          case 'not-found':
            errorMessage += "Collection 'employees' not found.";
            break;
          default:
            errorMessage += err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setDebugInfo(prev => prev + "\n🔄 Auth state changed - user logged in");
        fetchEmployees();
      } else {
        setDebugInfo(prev => prev + "\n🔄 Auth state changed - user logged out");
        setError("User not authenticated");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const filtered = search
    ? candidates.filter(
        (employee) =>
          employee.name?.toLowerCase().includes(search.toLowerCase()) ||
          employee.role?.toLowerCase().includes(search.toLowerCase()) ||
          employee.email?.toLowerCase().includes(search.toLowerCase()) ||
          // Search in resume analysis strengths and weaknesses
          (employee.resumeAnalysis?.strengths && 
           employee.resumeAnalysis.strengths.some(strength => 
             strength.toLowerCase().includes(search.toLowerCase())
           )) ||
          (employee.resumeAnalysis?.weaknesses && 
           employee.resumeAnalysis.weaknesses.some(weakness => 
             weakness.toLowerCase().includes(search.toLowerCase())
           )) ||
          (typeof employee.linkedinAnalysis === 'string' && 
           employee.linkedinAnalysis.toLowerCase().includes(search.toLowerCase()))
      )
    : candidates;

  // Apply ATS filter if enabled
  const finalFiltered = filterByATS 
    ? filtered.filter(employee => employee.resumeAnalysis?.atsScore && employee.resumeAnalysis.atsScore !== "N/A")
    : filtered;

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getATSScoreColor = (score) => {
    if (!score || score === "N/A") return "bg-gray-100 text-gray-600";
    const numScore = parseInt(score);
    if (numScore >= 80) return "bg-green-100 text-green-800";
    if (numScore >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const ProfileModal = ({ employee, onClose }) => {
    if (!employee) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-6 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-4">
              {employee.profilePic && employee.profilePic.trim() !== '' ? (
                <img
                  src={employee.profilePic.startsWith('/9j/') || employee.profilePic.startsWith('iVBORw') 
                    ? `data:image/jpeg;base64,${employee.profilePic}` 
                    : employee.profilePic}
                  alt={employee.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg">
                  <User size={24} className="text-blue-600" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
                <p className="text-blue-600 font-medium">{employee.role}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Personal Information */}
            <div>
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <User className="text-blue-600" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 rounded-xl border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.email && (
                    <div className="flex items-center bg-white p-3 rounded-lg">
                      <Mail size={16} className="mr-3 text-gray-500" />
                      <span className="text-gray-700">{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center bg-white p-3 rounded-lg">
                      <Phone size={16} className="mr-3 text-gray-500" />
                      <span className="text-gray-700">{employee.phone}</span>
                    </div>
                  )}
                  {employee.linkedIn && (
                    <div className="flex items-center bg-white p-3 rounded-lg">
                      <Linkedin size={16} className="mr-3 text-gray-500" />
                      <a href={employee.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 transition-colors">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {employee.createdAt && (
                    <div className="flex items-center bg-white p-3 rounded-lg">
                      <Calendar size={16} className="mr-3 text-gray-500" />
                      <span className="text-gray-700">Joined: {new Date(employee.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {employee.resumeAnalysis?.personalInfo && Object.keys(employee.resumeAnalysis.personalInfo).length > 0 && (
                  <div className="mt-6 bg-white p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-900">Additional Details:</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      {Object.entries(employee.resumeAnalysis.personalInfo).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <strong className="capitalize text-gray-800">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resume Analysis */}
            {employee.resumeAnalysis && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <FileText className="text-green-600" size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Resume Analysis</h3>
                </div>
                
                {/* ATS Score */}
                {employee.resumeAnalysis.atsScore && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl mb-6 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg mr-3">
                          <Award className="text-green-600" size={24} />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 text-lg">ATS Score</span>
                          <p className="text-sm text-gray-600">Applicant Tracking System compatibility</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-bold text-green-600">{employee.resumeAnalysis.atsScore}</span>
                        <p className="text-sm text-gray-500">out of 100</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strengths */}
                  {employee.resumeAnalysis.strengths && employee.resumeAnalysis.strengths.length > 0 && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="mr-2 text-green-600" size={20} />
                        <h4 className="font-semibold text-green-800 text-lg">Strengths</h4>
                      </div>
                      <ul className="space-y-2">
                        {employee.resumeAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-sm text-green-800">{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {employee.resumeAnalysis.weaknesses && employee.resumeAnalysis.weaknesses.length > 0 && (
                    <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                      <div className="flex items-center mb-4">
                        <AlertCircle className="mr-2 text-orange-600" size={20} />
                        <h4 className="font-semibold text-orange-800 text-lg">Areas for Improvement</h4>
                      </div>
                      <ul className="space-y-2">
                        {employee.resumeAnalysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <span className="text-sm text-orange-800">{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Projects */}
                {employee.resumeAnalysis.projects && employee.resumeAnalysis.projects.length > 0 && (
                  <div className="mt-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <div className="flex items-center mb-4">
                      <TrendingUp className="mr-2 text-blue-600" size={20} />
                      <h4 className="font-semibold text-blue-800 text-lg">Projects ({employee.resumeAnalysis.projects.length})</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {employee.resumeAnalysis.projects.slice(0, 5).map((project, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                          <span className="text-sm text-blue-800">
                            {typeof project === 'string' ? project : JSON.stringify(project)}
                          </span>
                        </div>
                      ))}
                      {employee.resumeAnalysis.projects.length > 5 && (
                        <div className="text-sm text-blue-600 italic text-center py-2">
                          +{employee.resumeAnalysis.projects.length - 5} more projects...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Analysis Sections */}
                {employee.resumeAnalysis.competitivePositioning && Object.keys(employee.resumeAnalysis.competitivePositioning).length > 0 && (
                  <div className="mt-6 bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <h4 className="font-semibold mb-4 text-purple-800 text-lg">Competitive Positioning</h4>
                    <div className="space-y-3">
                      {Object.entries(employee.resumeAnalysis.competitivePositioning).map(([key, value]) => (
                        <div key={key} className="bg-white p-4 rounded-lg">
                          <strong className="capitalize text-purple-800 block mb-2">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </strong>
                          <div className="text-sm text-gray-700">
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LinkedIn Analysis */}
            {employee.linkedinAnalysis && (
              <div>
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Linkedin className="text-blue-600" size={20} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">LinkedIn Analysis</h3>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                  {typeof employee.linkedinAnalysis === 'string' ? (
                    <div className="text-sm whitespace-pre-wrap text-gray-700 bg-white p-4 rounded-lg">
                      {employee.linkedinAnalysis}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(employee.linkedinAnalysis).map(([key, value]) => (
                        <div key={key} className="bg-white p-4 rounded-lg">
                          <strong className="capitalize text-blue-800 text-lg block mb-3">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </strong>
                          <div className="text-gray-700">
                            {Array.isArray(value) ? (
                              <ul className="space-y-2">
                                {value.map((item, index) => (
                                  <li key={index} className="flex items-start">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <span className="text-sm">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : typeof value === 'object' && value !== null ? (
                              <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-sm">{value}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">PP</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    proprep.ai
                  </h1>
                  <p className="text-sm text-gray-600">Employer Dashboard</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm">Logout</span>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Discover and manage your talent pool</h2>
              <p className="text-gray-600">Find the perfect candidates with AI-powered insights</p>
            </div>
            
            {/* Search and Filter Section */}
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search employees by name, role, skills, or qualifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl bg-white/90 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg text-sm transition-all"
                />
                {search && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <button
                      onClick={() => setSearch("")}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Filter Options */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setFilterByATS(!filterByATS)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterByATS 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                      : 'bg-white/70 text-gray-700 hover:bg-white border border-gray-200'
                  }`}
                >
                  <Filter size={16} />
                  <span>ATS Analyzed Only</span>
                </button>
              </div>
              
              {/* Search Results Summary */}
              {search && (
                <div className="text-center text-sm text-gray-600">
                  {finalFiltered.length === 0 
                    ? `No results found for "${search}"` 
                    : `${finalFiltered.length} candidate${finalFiltered.length === 1 ? '' : 's'} found`
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <span className="text-gray-600 font-medium">Loading candidates...</span>
              <span className="text-sm text-gray-500 mt-2">Please wait while we fetch the talent pool</span>
            </div>
          ) : error ? (
            <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8">
              <div className="text-red-600 font-semibold text-lg mb-2">Error Loading Candidates</div>
              <div className="text-red-700 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="mb-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {search || filterByATS ? `Filtered Results` : `Total Candidates Available`}
                      </h3>
                      <p className="text-gray-600">
                        {search && `Matching "${search}"`}
                        {filterByATS && ` • ATS analyzed candidates only`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {finalFiltered.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        of {candidates.length} total
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {finalFiltered.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
                      <div className="text-gray-400 mb-6">
                        <User size={64} className="mx-auto" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        {search ? "No matching candidates found" : "No candidates available"}
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {search 
                          ? `Try adjusting your search terms or browse all ${candidates.length} candidates`
                          : "Start by inviting employees to join your talent pool"
                        }
                      </p>
                      {search && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setFilterByATS(false);
                          }}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  finalFiltered.map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/20 hover:scale-105"
                    >
                      <div className="p-6">
                        {/* Profile Picture */}
                        <div className="flex justify-center mb-4">
                          {employee.profilePic && employee.profilePic.trim() !== '' ? (
                            <img
                              src={employee.profilePic.startsWith('/9j/') || employee.profilePic.startsWith('iVBORw') 
                                ? `data:image/jpeg;base64,${employee.profilePic}` 
                                : employee.profilePic}
                              alt={employee.name || "Employee"}
                              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg">
                              <User size={32} className="text-blue-600" />
                            </div>
                          )}
                        </div>
                        
                        {/* Employee Info */}
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {employee.name || "Unknown"}
                          </h3>
                          <p className="text-blue-600 font-medium text-sm mb-3">
                            {employee.role || "No role specified"}
                          </p>
                          
                          {/* ATS Score Badge */}
                          {employee.resumeAnalysis?.atsScore && employee.resumeAnalysis.atsScore !== "N/A" && (
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 ${getATSScoreColor(employee.resumeAnalysis.atsScore)}`}>
                              <Award size={12} className="mr-1" />
                              ATS: {employee.resumeAnalysis.atsScore}/100
                            </div>
                          )}
                        </div>
                        
                        {/* Contact Information */}
                        <div className="space-y-2 mb-6 text-sm text-gray-600">
                          {employee.email && (
                            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2">
                              <Mail size={14} className="mr-2 text-gray-400" />
                              <span className="truncate">{employee.email}</span>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2">
                              <Phone size={14} className="mr-2 text-gray-400" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Skills Preview */}
                        {employee.resumeAnalysis?.strengths && employee.resumeAnalysis.strengths.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs text-gray-500 mb-2">Key Strengths:</div>
                            <div className="flex flex-wrap gap-1">
                              {employee.resumeAnalysis.strengths.slice(0, 2).map((strength, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                  {strength.length > 15 ? strength.substring(0, 15) + '...' : strength}
                                </span>
                              ))}
                              {employee.resumeAnalysis.strengths.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  +{employee.resumeAnalysis.strengths.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Button */}
                        <button 
                          onClick={() => openModal(employee)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl text-sm font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          View Full Profile
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Additional Statistics */}
              {candidates.length > 0 && (
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {candidates.filter(c => c.resumeAnalysis?.atsScore && c.resumeAnalysis.atsScore !== "N/A").length}
                    </div>
                    <div className="text-gray-600 text-sm">Candidates with ATS Analysis</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {candidates.filter(c => c.linkedinAnalysis).length}
                    </div>
                    <div className="text-gray-600 text-sm">LinkedIn Profiles Analyzed</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {Math.round(candidates.filter(c => c.resumeAnalysis?.atsScore && parseInt(c.resumeAnalysis.atsScore) >= 70).length / candidates.length * 100) || 0}%
                    </div>
                    <div className="text-gray-600 text-sm">High ATS Score (70+)</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Profile Modal */}
        {showModal && selectedEmployee && (
          <ProfileModal employee={selectedEmployee} onClose={closeModal} />
        )}
      </div>
    </>
  );
};

export default EmployerDashboard;