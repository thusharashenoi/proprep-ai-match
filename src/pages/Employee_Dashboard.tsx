import { useEffect, useState } from "react";

import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Search, X, MapPin, Clock, DollarSign, Briefcase, AlertCircle } from "lucide-react";

interface Job {
  id: string;
  role: string;
  exp: string;
  category?: string;
  location?: string;
  description?: string;
  type?: string;
  pay?: string;
  requirements?: string;
  priority?: string;
  employerId?: string;
  logo: string;
  company: string;
  tagline?: string;
}

interface GroupedJobs {
  [category: string]: Job[];
}

interface JobDescriptionsDashboardProps {
  searchQuery?: string;
}
const JobDescriptionsDashboard = ({ searchQuery: propSearchQuery = "" }: JobDescriptionsDashboardProps) => {
  const [groupedJobs, setGroupedJobs] = useState<GroupedJobs>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [totalJobs, setTotalJobs] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);

  const searchQuery = propSearchQuery || internalSearchQuery;

  const isNotAcceptingResponses = (job: Job) => {
    return job.tagline === "not accepting responses";
  };

  useEffect(() => {
    const fetchAllEmployersAndJobs = async () => {
      try {
        const employerSnapshots = await getDocs(collection(db, "Employers"));
        const allJobs: Job[] = [];

        for (const employerDoc of employerSnapshots.docs) {
          const employerId = employerDoc.id;
          const employerData = employerDoc.data();
          const profilePic = employerData.profilePic || "/placeholder.svg";
          const company = employerData.company || "Unknown Company";

          const jobSnap = await getDocs(
            collection(db, "Employers", employerId, "jobDescriptions")
          );

          jobSnap.forEach((docSnap) => {
            const data = docSnap.data();

            allJobs.push({
              id: docSnap.id,
              role: data.role || "Unknown Role",
              exp: data.exp || "N/A",
              category: data.category || "Others",
              location: data.location || "",
              description: data.description || "",
              type: data.type || "",
              pay: data.pay || "",
              requirements: data.requirements || "",
              priority: data.priority || "Low",
              employerId,
              logo: profilePic,
              company: company,
              tagline: data.tagline || "",
            });
          });
        }

        const grouped: GroupedJobs = {};
        allJobs.forEach((job) => {
          const cat = job.category || "Others";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(job);
        });

        setGroupedJobs(grouped);
        setTotalJobs(allJobs.length);
        setActiveJobs(allJobs.filter(job => !isNotAcceptingResponses(job)).length);
      } catch (error) {
        console.error("❌ Error fetching jobs:", error);
      }
    };

    fetchAllEmployersAndJobs();
  }, []);

  const handleCardClick = (job: Job) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const filterJobs = (jobs: Job[]) => {
    if (!searchQuery.trim()) return jobs;
    return jobs.filter((job) =>
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      "Technology": "💻",
      "Engineering": "⚙️",
      "Design": "🎨",
      "Marketing": "📈",
      "Sales": "💼",
      "Finance": "💰",
      "HR": "👥",
      "Healthcare": "🏥",
      "Education": "📚",
      "Others": "🔧"
    };
    return icons[category] || "🔧";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "from-red-500 to-red-600";
      case "medium": return "from-yellow-500 to-yellow-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">PP</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Job Portal
                </h1>
                <p className="text-sm text-gray-600">Discover your next career opportunity</p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="w-full md:w-96">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={internalSearchQuery}
                  onChange={(e) => setInternalSearchQuery(e.target.value)}
                  placeholder="Search jobs, companies, or locations..."
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
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Openings</p>
                <p className="text-2xl font-bold text-gray-900">{activeJobs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedJobs).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Categories */}
        <div className="space-y-12">
          {Object.entries(groupedJobs).map(([category, jobs]) => {
            const filteredJobs = filterJobs(jobs);
            
            if (filteredJobs.length === 0) return null;

            return (
              <div key={category}>
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl">{getCategoryIcon(category)}</span>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {category}
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredJobs.map((job) => (
                    <Card
                      key={job.id}
                      className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                        isNotAcceptingResponses(job) 
                          ? "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200" 
                          : "bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white/90"
                      }`}
                      onClick={() => handleCardClick(job)}
                    >
                      {/* Priority Indicator */}
                      {job.priority && job.priority !== "Low" && (
                        <div className={`absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] bg-gradient-to-r ${getPriorityColor(job.priority)}`} 
                             style={{ borderTopColor: job.priority === "High" ? "#ef4444" : "#eab308" }}>
                          <span className="absolute -top-8 -right-1 text-white text-xs font-bold transform rotate-45">
                            {job.priority === "High" ? "!" : "◦"}
                          </span>
                        </div>
                      )}

                      <div className="p-6 flex flex-col items-center text-center space-y-4">
                        {/* Company Logo */}
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-md">
                            <img
                              src={job.logo}
                              alt={`${job.company} logo`}
                              className="w-12 h-12 object-cover rounded-xl"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder.svg";
                              }}
                            />
                          </div>
                          {isNotAcceptingResponses(job) && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <X className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Job Title */}
                        <div>
                          <h3 className={`text-lg font-bold line-clamp-2 ${
                            isNotAcceptingResponses(job) ? "text-red-800" : "text-gray-800"
                          }`}>
                            {job.role}
                          </h3>
                          <p className={`text-sm font-medium ${
                            isNotAcceptingResponses(job) ? "text-red-600" : "text-blue-600"
                          }`}>
                            {job.company}
                          </p>
                        </div>

                        {/* Job Details */}
                        <div className="space-y-2 w-full">
                          {job.location && (
                            <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                            <Briefcase className="w-3 h-3" />
                            <span>{job.exp}</span>
                          </div>

                          {job.type && (
                            <div className="flex justify-center">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                {job.type}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        {isNotAcceptingResponses(job) && (
                          <div className="w-full">
                            <div className="bg-red-100 border border-red-300 rounded-lg px-2 py-1">
                              <span className="text-xs font-medium text-red-800 flex items-center justify-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Not Accepting Applications
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results Message */}
        {searchQuery && Object.values(groupedJobs).every(jobs => filterJobs(jobs).length === 0) && (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 border border-white/20 shadow-xl max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                No jobs match your search for "{searchQuery}". Try adjusting your search terms.
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Job Details Modal */}
        {selectedJob && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-sm border border-white/20">
              <DialogHeader className="flex-shrink-0 pb-6 border-b border-gray-200">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                    <img
                      src={selectedJob.logo}
                      alt={`${selectedJob.company} logo`}
                      className="w-16 h-16 object-cover rounded-xl"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedJob.role}
                    </DialogTitle>
                    <p className="text-xl text-blue-600 font-semibold mb-4">
                      {selectedJob.company}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {selectedJob.type || "Full-time"}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedJob.location || "Remote"}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <Clock className="w-4 h-4 mr-1" />
                        {selectedJob.exp}
                      </span>
                      {selectedJob.pay && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {selectedJob.pay}
                        </span>
                      )}
                      <span 
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedJob.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : selectedJob.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedJob.priority} Priority
                      </span>
                      {isNotAcceptingResponses(selectedJob) && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Not Accepting Applications
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-6 space-y-8">
                {/* Alert for non-accepting positions */}
                {isNotAcceptingResponses(selectedJob) && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-xl">
                    <div className="flex items-center">
                      <AlertCircle className="w-6 h-6 text-red-400 mr-3" />
                      <div>
                        <h4 className="text-red-800 font-semibold">Position Currently Closed</h4>
                        <p className="text-red-700 mt-1">
                          This position is currently not accepting new applications. Please check back later or explore other opportunities.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {selectedJob.description && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📋</span>
                      Job Description
                    </h3>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {selectedJob.requirements && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">✅</span>
                      Requirements
                    </h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.requirements}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Button */}
              {!isNotAcceptingResponses(selectedJob) && (
                <div className="flex-shrink-0 pt-6 border-t border-gray-200">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    size="lg"
                  >
                    Apply for this Position
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default JobDescriptionsDashboard;