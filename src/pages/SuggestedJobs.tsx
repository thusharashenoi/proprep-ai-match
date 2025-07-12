import { useState } from "react";
import { Card } from "@/components/ui/card";

const mockSuggestedJobs = [
  {
    profilePic: "/placeholder.svg",
    role: "Data Scientist",
    match: 92,
  },
  {
    profilePic: "/placeholder.svg",
    role: "Frontend Developer",
    match: 87,
  },
  {
    profilePic: "/placeholder.svg",
    role: "AI Researcher",
    match: 80,
  },
  {
    profilePic: "/placeholder.svg",
    role: "Product Manager",
    match: 75,
  },
];

const SuggestedJobs = () => {
  const [jobs] = useState(mockSuggestedJobs);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-3xl font-bold mb-8 text-blue-700">Suggested Jobs</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {jobs.map((job, idx) => (
            <Card key={idx} className="bg-white rounded-xl shadow-md flex flex-col items-center py-8 w-full">
              <img
                src={job.profilePic}
                alt={job.role}
                className="w-16 h-16 rounded-full bg-gray-100 mb-4 object-cover border"
              />
              <div className="text-lg font-semibold mb-1 text-center">{job.role}</div>
              <div className="text-blue-600 text-xl font-bold mb-2">{job.match}% match</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuggestedJobs;
