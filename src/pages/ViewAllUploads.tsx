import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { X, Menu, User, Briefcase, Upload, Eye } from "lucide-react";

interface JobSummary {
  id: string;
  role: string;
  priority: string;
}

interface FullJobDetails extends JobSummary {
  category?: string;
  description?: string;
  location?: string;
  pay?: string;
  requirements?: string;
  timestamp?: any;
  type?: string;
  tagline?: string;
}

const ViewAllUploads = () => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<JobSummary[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<FullJobDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("⚠️ User not logged in");
        navigate("/login");
        setLoading(false);
        return;
      }

      const uid = user.uid;
      setEmployerId(uid);

      try {
        // ✅ Fetch profile image from correct field: profilePic
        const employerDocRef = doc(db, "Employers", uid);
        const employerSnap = await getDoc(employerDocRef);

        if (employerSnap.exists()) {
          const data = employerSnap.data();
          setProfileImage(data.profilePic || null);
          setEmployerProfile(data);
        }

        // Fetch job summaries
        const jdsRef = collection(db, "Employers", uid, "jobDescriptions");
        const snapshot = await getDocs(jdsRef);

        const jobs: JobSummary[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<JobSummary, "id">),
        }));

        setUploads(jobs);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleJobClick = async (jobId: string) => {
    if (!employerId) return;

    setModalLoading(true);
    const jobRef = doc(db, "Employers", employerId, "jobDescriptions", jobId);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
      const jobData = jobSnap.data() as Omit<FullJobDetails, "id">;
      setSelectedJob({ id: jobId, ...jobData });
    } else {
      console.warn("⚠️ No job found with ID:", jobId);
    }

    setModalLoading(false);
  };

  const closeModal = () => setSelectedJob(null);

  const handleCloseRequest = async () => {
    if (!employerId || !selectedJob?.id) return;

    try {
      const jobRef = doc(db, "Employers", employerId, "jobDescriptions", selectedJob.id);
      await updateDoc(jobRef, { tagline: "Not accepting responses" });

      // Update local state to reflect the change
      setSelectedJob((prev) =>
        prev ? { ...prev, tagline: "Not accepting responses" } : prev
      );

      alert("✅ Job marked as 'Not accepting responses'");
    } catch (err) {
      console.error("Error closing request:", err);
      alert("❌ Failed to close request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center items-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loading your uploads...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left side - Menu and Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  className="flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-blue-100 focus:outline-none transition-all duration-200"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6 text-gray-800" />
                </button>
                {menuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 z-50">
                    <div className="py-2">
                      <button
                        className="flex items-center w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/employer-dashboard");
                        }}
                      >
                        <User className="w-5 h-5 mr-3 text-blue-600 group-hover:text-purple-600 transition-colors" />
                        Candidate Dashboard
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/upload-job-descriptions");
                        }}
                      >
                        <Upload className="w-5 h-5 mr-3 text-blue-600 group-hover:text-purple-600 transition-colors" />
                        Upload Job Descriptions
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/matches");
                        }}
                      >
                        <Briefcase className="w-5 h-5 mr-3 text-blue-600 group-hover:text-purple-600 transition-colors" />
                        View Matches
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 group bg-gradient-to-r from-blue-50 to-purple-50"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/view-all-uploads");
                        }}
                      >
                        <Eye className="w-5 h-5 mr-3 text-purple-600" />
                        All Uploads
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">PP</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  proprep.ai
                </h1>
              </div>
            </div>

            {/* Right side - Profile */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {employerProfile?.company || "Employer"}
                </span>
              </div>
              {profileImage && (
                <button
                  className="focus:outline-none transition-all duration-200 hover:scale-105"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowProfile(true);
                  }}
                  aria-label="View Profile"
                >
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 hover:shadow-lg transition-all duration-200"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <Card className="bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Job Postings
              </span>
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Manage and view all your uploaded job descriptions
            </p>
          </CardHeader>
          <CardContent className="p-8">
            {uploads.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">No job descriptions yet</h3>
                <p className="text-gray-500 text-lg mb-6">
                  Start by uploading your first job description to find the perfect candidates.
                </p>
                <button
                  onClick={() => navigate("/upload-job-descriptions")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Upload Job Description
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {uploads.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job.id)}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20 group"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <img
                        src={profileImage || "https://via.placeholder.com/64"}
                        alt="Company"
                        className="w-14 h-14 rounded-full object-cover border-2 border-white"
                      />
                    </div>
                    <h3 className="font-bold text-lg text-center text-gray-800 mb-3">
                      {job.role}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          job.priority === "High"
                            ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700"
                            : job.priority === "Medium"
                            ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700"
                            : "bg-gradient-to-r from-green-100 to-green-200 text-green-700"
                        }`}
                      >
                        {job.priority} Priority
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all duration-200"
            >
              <X size={24} />
            </button>

            {modalLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Loading job details...</p>
              </div>
            ) : (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {selectedJob.role}
                  </h2>
                  <p className="text-gray-600 text-lg">{selectedJob.location}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                      <span className="font-semibold text-gray-800">Category:</span>
                      <p className="text-gray-700 mt-1">{selectedJob.category || "N/A"}</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                      <span className="font-semibold text-gray-800">Type:</span>
                      <p className="text-gray-700 mt-1">{selectedJob.type || "N/A"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                      <span className="font-semibold text-gray-800">Priority:</span>
                      <div className="mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            selectedJob.priority === "High"
                              ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700"
                              : selectedJob.priority === "Medium"
                              ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700"
                              : "bg-gradient-to-r from-green-100 to-green-200 text-green-700"
                          }`}
                        >
                          {selectedJob.priority}
                        </span>
                      </div>
                    </div>
                    {selectedJob.pay && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                        <span className="font-semibold text-gray-800">Pay:</span>
                        <p className="text-gray-700 mt-1">{selectedJob.pay}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="font-semibold text-gray-800 mb-3 text-lg">Description</h3>
                    <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                      {selectedJob.description || "No description provided."}
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="font-semibold text-gray-800 mb-3 text-lg">Requirements</h3>
                    <p className="whitespace-pre-line text-gray-700 leading-relaxed">
                      {selectedJob.requirements || "Not specified."}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  {selectedJob.tagline !== "Not accepting responses" ? (
                    <button
                      onClick={handleCloseRequest}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Close Request
                    </button>
                  ) : (
                    <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium">
                      Request Closed
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && employerProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-md relative shadow-2xl border border-white/20">
            <button
              onClick={() => setShowProfile(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all duration-200"
            >
              <X size={20} />
            </button>
            <div className="p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1">
                  <img
                    src={employerProfile.profilePic}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl text-gray-800">
                    {employerProfile.name || "Name"}
                  </h3>
                  <p className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                    {employerProfile.company || "Company"}
                  </p>
                  <p className="text-gray-600">{employerProfile.role || "Role"}</p>
                  <p className="text-gray-500 text-sm">{employerProfile.email || "Email"}</p>
                  <p className="text-gray-500 text-sm">{employerProfile.phno || "Phone"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAllUploads;