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
import { Search, X } from "lucide-react";

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
  company: string; // Using 'company' field as specified
  tagline?: string; // Added tagline field
}

interface GroupedJobs {
  [category: string]: Job[];
}

interface JobDescriptionsDashboardProps {
  searchQuery?: string; // Accept search query from parent/navbar
}

const JobDescriptionsDashboard = ({ searchQuery: propSearchQuery = "" }: JobDescriptionsDashboardProps) => {
  const [groupedJobs, setGroupedJobs] = useState<GroupedJobs>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  
  // Use prop searchQuery if provided, otherwise use internal search
  const searchQuery = propSearchQuery || internalSearchQuery;

  // Helper function to check if job is not accepting responses
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
          const company = employerData.company || "Unknown Company"; // Get company from employer document

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
              company: company, // Use company field from employer document
              tagline: data.tagline || "", // Added tagline field
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

  // Filter jobs based on search query
  const filterJobs = (jobs: Job[]) => {
    if (!searchQuery.trim()) return jobs;
    return jobs.filter((job) =>
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Search Bar - Overlapping navbar center only */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-50 pt-4 pointer-events-none">
        <div className="w-96 pointer-events-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              placeholder="Search jobs by role or company..."
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-lg"
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

      <div className="flex flex-col gap-12 px-8 py-6 pt-20">{/* Added pt-20 for spacing below search bar */}
        {Object.entries(groupedJobs).map(([category, jobs]) => {
          const filteredJobs = filterJobs(jobs);
          
          // Don't render category if no jobs match search
          if (filteredJobs.length === 0) return null;

          return (
            <div key={category}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
                {filteredJobs.map((job) => (
                  <Card
                    key={job.id}
                    className={`rounded-xl shadow-md flex flex-col items-center py-8 w-full cursor-pointer hover:scale-105 transition-transform duration-200 ${
                      isNotAcceptingResponses(job) 
                        ? "bg-red-50 border-2 border-red-200" 
                        : "bg-white"
                    }`}
                    onClick={() => handleCardClick(job)}
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                      <img
                        src={job.logo}
                        alt={`${job.company} logo`}
                        className="w-12 h-12 object-cover rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div className={`text-lg font-semibold mb-2 text-center px-2 ${
                      isNotAcceptingResponses(job) ? "text-red-700" : ""
                    }`}>
                      {job.role}
                    </div>
                    <div className={`text-sm text-center px-2 ${
                      isNotAcceptingResponses(job) ? "text-red-600" : "text-gray-600"
                    }`}>
                      {job.company}
                    </div>
                    {isNotAcceptingResponses(job) && (
                      <div className="mt-2 px-2 py-1 bg-red-100 border border-red-300 rounded-full">
                        <span className="text-xs font-medium text-red-800">
                          Not Accepting Applications
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* Show message if no jobs found */}
        {searchQuery && Object.values(groupedJobs).every(jobs => filterJobs(jobs).length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No jobs found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Enhanced Job Details Modal */}
        {selectedJob && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
              <DialogHeader className="flex-shrink-0 pb-4 border-b">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      src={selectedJob.logo}
                      alt={`${selectedJob.company} logo`}
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedJob.role}
                    </DialogTitle>
                    <p className="text-lg text-blue-600 font-semibold mb-2">
                      {selectedJob.company}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedJob.type || "Full-time"}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {selectedJob.location || "Remote"}
                      </span>
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Not Accepting Applications
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-4 space-y-6">
                {/* Show notice if not accepting responses */}
                {isNotAcceptingResponses(selectedJob) && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">
                          This position is currently not accepting new applications.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">Experience Required</h4>
                    <p className="text-gray-700">{selectedJob.exp}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">Compensation</h4>
                    <p className="text-gray-700">{selectedJob.pay || "Competitive"}</p>
                  </div>
                </div>

                {/* Job Description */}
                {selectedJob.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Requirements */}
                {selectedJob.requirements && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <div className="bg-white border rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.requirements}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Apply Button - Only show if accepting responses */}
              {!isNotAcceptingResponses(selectedJob) && (
                <div className="flex-shrink-0 pt-4 border-t bg-white">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
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