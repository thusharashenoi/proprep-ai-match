

// Updated Matches.tsx - Employer Dashboard (TypeScript)
import React, { useState, useEffect } from 'react';
import EmployerNavbar from "../components/EmployerNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, User, Briefcase, TrendingUp, Eye, Star, CheckCircle, AlertCircle } from "lucide-react";
// Update this import to use the new standardized service
import { getMatchingCandidatesStandardized } from "../services/matchingService";

// Type definitions
interface MatchBreakdown {
  technicalSkills: number;
  experienceRelevance: number;
  industryKnowledge: number;
  roleFit: number;
  education: number;
}

type RecommendationType = 'STRONG_MATCH' | 'GOOD_MATCH' | 'MODERATE_MATCH' | 'WEAK_MATCH';

interface CandidateMatch {
  id: string;
  name: string;
  profilePic: string;
  matchPercent: number;
  reason: string;
  screenshotUrl?: string;
  recommendation?: RecommendationType;
  breakdown?: MatchBreakdown;
  strengths?: string[];
  gaps?: string[];
}

interface JobInfo {
  role?: string;
  company?: string;
}

interface JobMatches {
  jobInfo: JobInfo;
  matches: CandidateMatch[];
}

interface MatchesByJob {
  [jobId: string]: JobMatches;
}

interface CandidateModalProps {
  candidate: CandidateMatch | null;
  onClose: () => void;
}

const Matches: React.FC = () => {
  const [matchesByJob, setMatchesByJob] = useState<MatchesByJob>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatch | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      // Use the new standardized matching service
      const matches = await getMatchingCandidatesStandardized();
      setMatchesByJob(matches);
    } catch (err) {
      console.error("Error fetching matches:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch matches";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 80) return "bg-blue-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getMatchLabel = (percentage: number): string => {
    if (percentage >= 90) return "Excellent Match";
    if (percentage >= 80) return "Good Match";
    if (percentage >= 70) return "Fair Match";
    return "Poor Match";
  };

  const getRecommendationIcon = (recommendation: RecommendationType): JSX.Element => {
    switch (recommendation) {
      case 'STRONG_MATCH': 
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'GOOD_MATCH': 
        return <Star className="h-4 w-4 text-blue-600" />;
      case 'MODERATE_MATCH': 
        return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default: 
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const CandidateModal: React.FC<CandidateModalProps> = ({ candidate, onClose }) => {
    if (!candidate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <img 
                  src={candidate.profilePic} 
                  alt={candidate.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{candidate.name}</h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={`${getMatchColor(candidate.matchPercent)} text-white`}>
                      {candidate.matchPercent}% Match
                    </Badge>
                    {candidate.recommendation && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full">
                        {getRecommendationIcon(candidate.recommendation)}
                        <span className="text-sm font-medium text-gray-700">
                          {candidate.recommendation.replace('_', ' ')}
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

            {/* Enhanced Breakdown Section */}
            {candidate.breakdown && (
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-4 text-gray-900">Detailed Assessment</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Technical Skills</div>
                    <div className="text-lg font-bold text-blue-600">
                      {candidate.breakdown.technicalSkills || 0}/25
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Experience</div>
                    <div className="text-lg font-bold text-green-600">
                      {candidate.breakdown.experienceRelevance || 0}/25
                    </div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Industry Knowledge</div>
                    <div className="text-lg font-bold text-purple-600">
                      {candidate.breakdown.industryKnowledge || 0}/20
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Role Fit</div>
                    <div className="text-lg font-bold text-orange-600">
                      {candidate.breakdown.roleFit || 0}/20
                    </div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-xs font-medium text-gray-600 mb-1">Education</div>
                    <div className="text-lg font-bold text-indigo-600">
                      {candidate.breakdown.education || 0}/10
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths and Gaps */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {candidate.strengths && candidate.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Key Strengths
                  </h4>
                  <div className="space-y-2">
                    {candidate.strengths.map((strength: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-green-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {candidate.gaps && candidate.gaps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-700 mb-3 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Development Areas
                  </h4>
                  <div className="space-y-2">
                    {candidate.gaps.map((gap: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-orange-700">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Match Reason */}
            <div className="mb-6">
              <h4 className="font-semibold text-lg mb-3 text-gray-900">Assessment Details</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{candidate.reason}</p>
              </div>
            </div>

            {/* LinkedIn Section */}
            {candidate.screenshotUrl && (
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3 text-gray-900">LinkedIn Profile</h4>
                <img 
                  src={candidate.screenshotUrl} 
                  alt="LinkedIn Profile"
                  className="w-full max-w-2xl mx-auto rounded-lg border shadow-sm"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Contact Candidate
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <EmployerNavbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Finding matches...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <EmployerNavbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-2">⚠️ Error</div>
              <p className="text-gray-700 mb-4">{error}</p>
              <Button onClick={fetchMatches}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const jobIds: string[] = Object.keys(matchesByJob);
  const totalMatches: number = Object.values(matchesByJob).reduce(
    (sum: number, job: JobMatches) => sum + job.matches.length, 
    0
  );

  return (
    <>
      <EmployerNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Candidate Matches</h1>
            <p className="text-gray-600">
              Found {totalMatches} total matches across {jobIds.length} job descriptions
            </p>
          </div>

          {jobIds.length === 0 ? (
            <Card className="w-full max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Job Descriptions Found</h3>
                <p className="text-gray-500">Please add job descriptions to start finding matches.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {jobIds.map((jobId: string) => {
                const jobData: JobMatches = matchesByJob[jobId];
                const { jobInfo, matches } = jobData;

                return (
                  <Card key={jobId} className="w-full">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-5 w-5" />
                          <span>{jobInfo.role || `Job ID: ${jobId}`}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white text-blue-600">
                          {matches.length} matches
                        </Badge>
                      </CardTitle>
                      <p className="text-blue-100 text-sm mt-2">
                        {jobInfo.company && `Company: ${jobInfo.company}`}
                      </p>
                    </CardHeader>
                    <CardContent className="p-6">
                      {matches.length === 0 ? (
                        <div className="text-center py-8">
                          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No matches found for this position</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {matches.map((match: CandidateMatch) => (
                            <div 
                              key={match.id} 
                              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border"
                              onClick={() => setSelectedCandidate(match)}
                            >
                              <div className="flex flex-col items-center text-center">
                                <img 
                                  src={match.profilePic} 
                                  alt={match.name}
                                  className="w-16 h-16 rounded-full mb-3 object-cover border-2 border-gray-200" 
                                />
                                <h4 className="font-bold text-lg mb-1">{match.name}</h4>
                                
                                {/* Enhanced badge with recommendation */}
                                <div className="flex flex-col items-center space-y-2 mb-3">
                                  <Badge className={`${getMatchColor(match.matchPercent)} text-white`}>
                                    {match.matchPercent}% Match
                                  </Badge>
                                  {match.recommendation && (
                                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                                      {getRecommendationIcon(match.recommendation)}
                                      <span>{match.recommendation.replace('_', ' ')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Quick breakdown preview */}
                                {match.breakdown && (
                                  <div className="grid grid-cols-3 gap-1 text-xs mb-3 w-full">
                                    <div className="text-center">
                                      <div className="text-blue-600 font-semibold">
                                        {match.breakdown.technicalSkills || 0}
                                      </div>
                                      <div className="text-gray-500">Tech</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-green-600 font-semibold">
                                        {match.breakdown.experienceRelevance || 0}
                                      </div>
                                      <div className="text-gray-500">Exp</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-purple-600 font-semibold">
                                        {match.breakdown.industryKnowledge || 0}
                                      </div>
                                      <div className="text-gray-500">Ind</div>
                                    </div>
                                  </div>
                                )}

                                <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                  {match.reason}
                                </p>
                                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                                  <Eye className="h-3 w-3" />
                                  <span>View Details</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Candidate Modal */}
      <CandidateModal 
        candidate={selectedCandidate} 
        onClose={() => setSelectedCandidate(null)} 
      />
    </>
  );
};

export default Matches;