import EmployerNavbar from "../components/EmployerNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Simulated matches data for demo
const mockMatches = [
  {
    id: 1,
    profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Alice Smith",
    matchPercent: 92,
    jobTitle: "Data Scientist",
  },
  {
    id: 2,
    profilePic: "https://randomuser.me/api/portraits/men/46.jpg",
    name: "Bob Johnson",
    matchPercent: 87,
    jobTitle: "AI Engineer",
  },
  {
    id: 3,
    profilePic: "https://randomuser.me/api/portraits/women/47.jpg",
    name: "Carol Lee",
    matchPercent: 78,
    jobTitle: "UI/UX Designer",
  },
];

const Matches = () => {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 flex flex-col items-center">
        <Card className="w-full max-w-4xl p-8">
          <CardHeader>
            <CardTitle>Matched Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {mockMatches.map((match) => (
                <div key={match.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
                  <img src={match.profilePic} alt={match.name} className="w-20 h-20 rounded-full mb-4 object-cover" />
                  <div className="font-bold text-lg text-center mb-1">{match.name}</div>
                  <div className="text-blue-700 text-md mb-1">{match.jobTitle}</div>
                  <div className="text-green-600 text-sm font-semibold">{match.matchPercent}% Match</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Matches;
