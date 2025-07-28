import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "../firebase";
import { X, User, FileText, Linkedin, Mail, Phone, Calendar, MapPin, Award, TrendingUp, AlertCircle, CheckCircle, Search } from "lucide-react";

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const ProfileModal = ({ employee, onClose }) => {
    if (!employee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {employee.profilePic && employee.profilePic.trim() !== '' ? (
                <img
                  src={employee.profilePic.startsWith('/9j/') || employee.profilePic.startsWith('iVBORw') 
                    ? `data:image/jpeg;base64,${employee.profilePic}` 
                    : employee.profilePic}
                  alt={employee.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={20} className="text-gray-500" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{employee.name}</h2>
                <p className="text-blue-600">{employee.role}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Personal Information */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <User className="mr-2 text-blue-600" size={20} />
                <h3 className="text-lg font-semibold">Personal Information</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.email && (
                    <div className="flex items-center">
                      <Mail size={16} className="mr-2 text-gray-500" />
                      <span>{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-gray-500" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.linkedIn && (
                    <div className="flex items-center">
                      <Linkedin size={16} className="mr-2 text-gray-500" />
                      <a href={employee.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {employee.createdAt && (
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-500" />
                      <span>Joined: {new Date(employee.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {employee.resumeAnalysis?.personalInfo && Object.keys(employee.resumeAnalysis.personalInfo).length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Additional Details:</h4>
                    <div className="text-sm text-gray-600">
                      {Object.entries(employee.resumeAnalysis.personalInfo).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resume Analysis */}
            {employee.resumeAnalysis && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <FileText className="mr-2 text-green-600" size={20} />
                  <h3 className="text-lg font-semibold">Resume Analysis</h3>
                </div>
                
                {/* ATS Score */}
                {employee.resumeAnalysis.atsScore && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="mr-2 text-green-600" size={20} />
                        <span className="font-semibold">ATS Score</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{employee.resumeAnalysis.atsScore}</span>
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {employee.resumeAnalysis.strengths && employee.resumeAnalysis.strengths.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="mr-2 text-green-500" size={16} />
                      <h4 className="font-semibold text-green-700">Strengths</h4>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <ul className="list-disc list-inside space-y-1">
                        {employee.resumeAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-green-800">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {employee.resumeAnalysis.weaknesses && employee.resumeAnalysis.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="mr-2 text-orange-500" size={16} />
                      <h4 className="font-semibold text-orange-700">Areas for Improvement</h4>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <ul className="list-disc list-inside space-y-1">
                        {employee.resumeAnalysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm text-orange-800">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Projects */}
                {employee.resumeAnalysis.projects && employee.resumeAnalysis.projects.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <TrendingUp className="mr-2 text-blue-500" size={16} />
                      <h4 className="font-semibold text-blue-700">Projects ({employee.resumeAnalysis.projects.length})</h4>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="grid gap-2">
                        {employee.resumeAnalysis.projects.slice(0, 5).map((project, index) => (
                          <div key={index} className="text-sm text-blue-800 bg-white p-2 rounded">
                            {typeof project === 'string' ? project : JSON.stringify(project)}
                          </div>
                        ))}
                        {employee.resumeAnalysis.projects.length > 5 && (
                          <div className="text-sm text-blue-600 italic">
                            +{employee.resumeAnalysis.projects.length - 5} more projects...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Analysis Sections */}
                {employee.resumeAnalysis.competitivePositioning && Object.keys(employee.resumeAnalysis.competitivePositioning).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Competitive Positioning</h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      {Object.entries(employee.resumeAnalysis.competitivePositioning).map(([key, value]) => (
                        <div key={key} className="mb-2">
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>
                          <div className="mt-1 text-gray-700">
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
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Linkedin className="mr-2 text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold">LinkedIn Analysis</h3>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  {typeof employee.linkedinAnalysis === 'string' ? (
                    <div className="text-sm whitespace-pre-wrap">{employee.linkedinAnalysis}</div>
                  ) : (
                    <div className="text-sm">
                      {Object.entries(employee.linkedinAnalysis).map(([key, value]) => (
                        <div key={key} className="mb-3">
                          <strong className="capitalize text-blue-800">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </strong>
                          <div className="mt-1 text-gray-700">
                            {Array.isArray(value) ? (
                              <ul className="list-disc list-inside space-y-1">
                                {value.map((item, index) => (
                                  <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                                ))}
                              </ul>
                            ) : typeof value === 'object' && value !== null ? (
                              <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <span>{value}</span>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        
        {/* Header Section with Search */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover and manage your talent pool</h1>
            </div>
            
            {/* Centered Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search employees by name, role, skills, or qualifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                />
                {search && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearch("")}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Search Results Summary */}
              {search && (
                <div className="mt-2 text-sm text-gray-600">
                  {filtered.length === 0 
                    ? `No results found for "${search}"` 
                    : `${filtered.length} employee${filtered.length === 1 ? '' : 's'} found`
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading employees...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 bg-red-50 p-6 rounded-lg">
              <div className="font-semibold mb-2">Error:</div>
              <div>{error}</div>
            
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {search ? `Search Results` : `Total Candidates registered:`}
                      </h2>
                      
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {filtered.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <User size={48} className="mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {search ? "No matching employees found" : "No employees available"}
                    </h3>
                    <p className="text-gray-500">
                      {search 
                        ? `Try adjusting your search terms or browse all ${candidates.length} employees`
                        : "Start by adding employees to your database"
                      }
                    </p>
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  filtered.map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
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
                              className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-gray-100">
                              <User size={32} className="text-blue-600" />
                            </div>
                          )}
                        </div>
                        
                        {/* Employee Info */}
                        <div className="text-center mb-4">
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {employee.name || "Unknown"}
                          </h3>
                          <p className="text-blue-600 font-medium text-sm mb-2">
                            {employee.role || "No role specified"}
                          </p>
                          
                          {/* ATS Score Badge */}
                          {employee.resumeAnalysis?.atsScore && (
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-3">
                              <Award size={12} className="mr-1" />
                              ATS: {employee.resumeAnalysis.atsScore}
                            </div>
                          )}
                        </div>
                        
                        {/* Contact Information */}
                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                          {employee.email && (
                            <div className="flex items-center justify-center">
                              <Mail size={14} className="mr-2 text-gray-400" />
                              <span className="truncate">{employee.email}</span>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center justify-center">
                              <Phone size={14} className="mr-2 text-gray-400" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        <button 
                          onClick={() => openModal(employee)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          View Full Profile
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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