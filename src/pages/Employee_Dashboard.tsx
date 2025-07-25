import { useState } from "react";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar"; // make sure this is the correct path

const jobSections = [
  {
    title: "Data Science",
    jobs: [
      { logo: "/placeholder.svg", role: "Data Scientist", exp: "2-4 yrs" },
      { logo: "/placeholder.svg", role: "ML Engineer", exp: "1-3 yrs" },
      { logo: "/placeholder.svg", role: "AI Researcher", exp: "3-5 yrs" },
      { logo: "/placeholder.svg", role: "Data Analyst", exp: "0-2 yrs" },
      { logo: "/placeholder.svg", role: "BI Developer", exp: "2-4 yrs" },
    ],
  },
  {
    title: "Mechanical",
    jobs: [
      { logo: "/placeholder.svg", role: "Mechanical Engineer", exp: "3-5 yrs" },
      { logo: "/placeholder.svg", role: "CAD Designer", exp: "1-2 yrs" },
      { logo: "/placeholder.svg", role: "Thermal Analyst", exp: "2-4 yrs" },
      { logo: "/placeholder.svg", role: "Production Engineer", exp: "2-3 yrs" },
      { logo: "/placeholder.svg", role: "Automotive Engineer", exp: "4-6 yrs" },
    ],
  },
  {
    title: "Electrical",
    jobs: [
      { logo: "/placeholder.svg", role: "Electrical Engineer", exp: "2-4 yrs" },
      { logo: "/placeholder.svg", role: "Power Systems Analyst", exp: "4-6 yrs" },
      { logo: "/placeholder.svg", role: "Circuit Designer", exp: "1-3 yrs" },
      { logo: "/placeholder.svg", role: "Control Systems Engineer", exp: "3-5 yrs" },
      { logo: "/placeholder.svg", role: "Embedded Engineer", exp: "2-4 yrs" },
    ],
  },
];

const JobDescriptionsDashboard = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="flex flex-col gap-12 px-8 py-6">
        {jobSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
              {section.jobs
                .filter((j) => j.role.toLowerCase().includes(search.toLowerCase()))
                .slice(0, 5)
                .map((job) => (
                  <Card
                    key={job.role}
                    className="bg-white rounded-xl shadow-md flex flex-col items-center py-8 w-full"
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                      <img
                        src={job.logo}
                        alt={job.role}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="text-lg font-semibold mb-1 text-center">
                      {job.role}
                    </div>
                    <div className="text-gray-500 text-sm text-center">
                      {job.exp}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobDescriptionsDashboard;
