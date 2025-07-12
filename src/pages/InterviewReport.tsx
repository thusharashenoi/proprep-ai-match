import { Card } from "@/components/ui/card";

const mockReport = {
  summary: "You performed well in the mock interview. Your communication was clear, and you answered most questions confidently. Consider improving your technical depth and structuring answers more concisely.",
  strengths: ["Clear communication", "Confident demeanor", "Good problem-solving"],
  areasForImprovement: ["Technical depth", "Conciseness", "More examples"],
  score: 78,
  recommendations: "Practice more technical questions and use the STAR method for behavioral answers."
};

const InterviewReport = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto p-6 rounded-xl shadow-2xl bg-white border border-gray-200 flex flex-col items-center justify-center" style={{ margin: '32px' }}>
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Gemini Interview Report</h1>
        <Card className="w-full p-8 mb-6">
          <div className="mb-4 text-lg text-gray-800 font-semibold">Overall Score: <span className="text-blue-600 text-2xl font-bold">{mockReport.score}%</span></div>
          <div className="mb-4 text-gray-700"><strong>Summary:</strong> {mockReport.summary}</div>
          <div className="mb-4">
            <strong>Strengths:</strong>
            <ul className="list-disc pl-6 text-green-700">
              {mockReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="mb-4">
            <strong>Areas for Improvement:</strong>
            <ul className="list-disc pl-6 text-red-700">
              {mockReport.areasForImprovement.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
          <div className="mb-4 text-gray-700"><strong>Recommendations:</strong> {mockReport.recommendations}</div>
        </Card>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition mt-4"
          onClick={() => window.location.href = '/jobs'}
        >
          Back to Jobs
        </button>
      </div>
    </div>
  );
};

export default InterviewReport;
