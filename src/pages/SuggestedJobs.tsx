// Updated SuggestedJobs.tsx - Employee Dashboard
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Update this import to use the new standardized service
import { matchEmployeeToJobsStandardized } from "@/services/matchingService";
import { getAuth } from "firebase/auth";
import { Loader2, Briefcase, Building2, Star, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";

interface JobMatch {
  profilePic: string;
  role: string;
  company: string;
  match: number;
  jobId: string;
  // New fields from standardized matching
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
}

const SuggestedJobs = () => {
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  const handleMatch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user || !user.uid) {
        throw new Error("Please log in to find job matches");
      }

      console.log("🔍 Starting job matching for user:", user.uid);
      // Use the new standardized matching service
      const matchedJobs = await matchEmployeeToJobsStandardized(user.uid);

      if (!Array.isArray(matchedJobs)) {
        console.error("❌ Invalid response format:", matchedJobs);
        throw new Error("Invalid response format from match service");
      }

      console.log("✅ Received job matches:", matchedJobs.length, "jobs");
      console.log("📋 Full job matches data:", matchedJobs);
      setJobs(matchedJobs);
      
    } catch (err: any) {
      console.error("❌ Error while matching jobs:", err);
      setError(err.message || "Something went wrong while finding matches");
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-50";
    if (percentage >= 60) return "text-blue-600 bg-blue-50";
    if (percentage >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getRecommendationIcon = (recommendation?: string) => {
    switch (recommendation) {
      case 'STRONG_MATCH': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'GOOD_MATCH': return <Star className="h-4 w-4 text-blue-600" />;
      case 'MODERATE_MATCH': return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Job Detail Modal
  const JobDetailModal = ({ job, onClose }: { job: JobMatch | null; onClose: () => void }) => {
    if (!job) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <img
                  src={job.profilePic}
                  alt={job.company}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{job.role}</h2>
                  <p className="text-gray-600 text-lg">{job.company}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getMatchColor(job.match)}`}>
                      {job.match}% Match
                    </div>
                    {job.recommendation && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
                        {getRecommendationIcon(job.recommendation)}
                        <span className="text-sm font-medium text-gray-700">
                          {job.recommendation.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={onClose} size="sm">
                ✕
              </Button>
            </div>

            {/* Match breakdown visualization */}
            {job.breakdown && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Fit Analysis</h3>
                <div className="space-y-3">
                  {Object.entries(job.breakdown).map(([key, value]) => {
                    const maxValue = key.includes('Skills') || key.includes('Experience') ? 25 : 
                                   key === 'education' ? 10 : 20;
                    const percentage = (value / maxValue) * 100;
                    
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span>{value}/{maxValue}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Strengths and improvement areas */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {job.strengths && job.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Your Strengths
                  </h4>
                  <div className="space-y-2">
                    {job.strengths.map((strength, idx) => (
                      <div key={idx} className="p-2 bg-green-50 rounded-lg text-green-700 text-sm">
                        {strength}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {job.gaps && job.gaps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-700 mb-3 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Areas to Develop
                  </h4>
                  <div className="space-y-2">
                    {job.gaps.map((gap, idx) => (
                      <div key={idx} className="p-2 bg-orange-50 rounded-lg text-orange-700 text-sm">
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Apply Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Suggested Jobs
          </h1>
          <p className="text-gray-600 text-lg">
            Find jobs that match your skills and experience
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {jobs.length === 0 && !loading && (
          <div className="text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <Briefcase className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Ready to find your perfect job?
              </h3>
              <p className="text-gray-600 mb-6">
                Click below to analyze your profile and find jobs that match your skills.
              </p>
              <Button 
                onClick={handleMatch} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding Matches...
                  </>
                ) : (
                  "Find My Matches"
                )}
              </Button>
            </div>
          </div>
        )}

        {loading && jobs.length === 0 && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-lg text-gray-600">
              Analyzing your profile and matching with available jobs...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {jobs.length > 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-lg text-gray-700">
                Found <span className="font-bold text-blue-600">{jobs.length}</span> job matches for you!
              </p>
            </div>
            
            {/* Top 3 Matches - Enhanced with new data */}
            {jobs.slice(0, 3).length > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">🏆 Top Matches</h2>
                  <p className="text-gray-600">Your best job opportunities</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl">
                    {jobs.slice(0, 3).map((job, index) => (
                      <Card
                        key={job.jobId}
                        className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-0 transform hover:-translate-y-1 cursor-pointer ${
                          index === 0 ? 'ring-2 ring-yellow-200 shadow-yellow-100' : 
                          index === 1 ? 'ring-2 ring-gray-200 shadow-gray-100' :
                          'ring-2 ring-orange-200 shadow-orange-100'
                        }`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="p-8 text-center">
                          {/* Rank Badge with recommendation */}
                          <div className="mb-4">
                            <div className="flex flex-col items-center space-y-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                index === 1 ? 'bg-gray-100 text-gray-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                #{index + 1} {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} Top Match
                              </span>
                              {job.recommendation && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
                                  {getRecommendationIcon(job.recommendation)}
                                  <span className="text-xs font-medium text-gray-700">
                                    {job.recommendation.replace('_', ' ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Employer Profile Picture */}
                          <div className="mb-6">
                            <img
                              src={job.profilePic}
                              alt={`${job.company} profile`}
                              className="w-24 h-24 rounded-full mx-auto object-cover bg-gray-100 border-4 border-white shadow-md"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/default-company.png";
                              }}
                            />
                          </div>

                          {/* Company Name */}
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {job.company}
                          </h3>

                          {/* Role Name */}
                          <p className="text-lg text-gray-600 mb-4 line-clamp-2 font-medium">
                            {job.role}
                          </p>

                          {/* Enhanced breakdown preview for top matches */}
                          {job.breakdown && (
                            <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                              <div className="text-center">
                                <div className="text-blue-600 font-bold text-sm">
                                  {job.breakdown.technicalSkills}
                                </div>
                                <div className="text-gray-500">Technical</div>
                              </div>
                              <div className="text-center">
                                <div className="text-green-600 font-bold text-sm">
                                  {job.breakdown.experienceRelevance}
                                </div>
                                <div className="text-gray-500">Experience</div>
                              </div>
                              <div className="text-center">
                                <div className="text-purple-600 font-bold text-sm">
                                  {job.breakdown.industryKnowledge}
                                </div>
                                <div className="text-gray-500">Industry</div>
                              </div>
                            </div>
                          )}

                          {/* Top strengths preview */}
                          {job.strengths && job.strengths.length > 0 && (
                            <div className="mb-4">
                              <div className="text-xs font-medium text-green-700 mb-2">Top Strengths</div>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {job.strengths.slice(0, 2).map((strength, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                    {strength.length > 20 ? strength.substring(0, 20) + '...' : strength}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Match Percentage */}
                          <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold ${getMatchColor(job.match)}`}>
                            {job.match}% Match
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Matches - Enhanced with new data */}
            {jobs.length > 3 && (
              <div className="space-y-6">
                <div className="text-center border-t pt-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Other Great Opportunities</h2>
                  <p className="text-gray-600">More jobs that match your profile</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {jobs.slice(3).map((job, index) => (
                    <Card
                      key={job.jobId}
                      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border-0 cursor-pointer"
                      onClick={() => setSelectedJob(job)}
                    >
                      <div className="p-6 text-center">
                        {/* Recommendation badge */}
                        {job.recommendation && (
                          <div className="mb-3 flex justify-center">
                            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
                              {getRecommendationIcon(job.recommendation)}
                              <span className="text-xs font-medium text-gray-700">
                                {job.recommendation.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Employer Profile Picture */}
                        <div className="mb-4">
                          <img
                            src={job.profilePic}
                            alt={`${job.company} profile`}
                            className="w-16 h-16 rounded-full mx-auto object-cover bg-gray-100 border-2 border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/default-company.png";
                            }}
                          />
                        </div>

                        {/* Company Name */}
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {job.company}
                        </h3>

                        {/* Role Name */}
                        <p className="text-md text-gray-600 mb-3 line-clamp-2">
                          {job.role}
                        </p>

                        {/* Quick breakdown */}
                        {job.breakdown && (
                          <div className="grid grid-cols-3 gap-1 text-xs mb-3">
                            <div className="text-center">
                              <div className="text-blue-600 font-semibold">
                                {job.breakdown.technicalSkills}
                              </div>
                              <div className="text-gray-500">Tech</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-600 font-semibold">
                                {job.breakdown.experienceRelevance}
                              </div>
                              <div className="text-gray-500">Exp</div>
                            </div>
                            <div className="text-center">
                              <div className="text-purple-600 font-semibold">
                                {job.breakdown.industryKnowledge}
                              </div>
                              <div className="text-gray-500">Ind</div>
                            </div>
                          </div>
                        )}

                        {/* Match Percentage */}
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getMatchColor(job.match)}`}>
                          {job.match}% Match
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="text-center pt-8">
              <Button 
                onClick={handleMatch} 
                disabled={loading}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  "Refresh Matches"
                )}
              </Button>
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