import { FileText, Linkedin, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Features = () => {
  const steps = [
    {
      number: "01",
      icon: FileText,
      title: "Upload Job Description",
      description: "Paste the job description or upload a PDF, and let our AI analyze the key requirements and skills.",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      number: "02",
      icon: FileText,
      title: "Upload Your Resume",
      description: "Upload your resume in PDF format, and we’ll extract and assess your experience and qualifications.",
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      number: "03",
      icon: Linkedin,
      title: "Add LinkedIn Profile",
      description: "Share your LinkedIn profile link for a deeper analysis of your online presence and networking potential.",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      number: "04",
      icon: BarChart3,
      title: "Receive AI Insights",
      description: "Get instant feedback, optimization suggestions, and a compatibility score to boost your job prospects.",
      gradient: "from-green-500 to-green-600",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Your AI-Powered Job Search Assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Follow four simple steps to optimize your resume and LinkedIn profile for any job application.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="relative group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${step.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-300 mb-2">{step.number}</div>
                <CardTitle className="text-xl font-bold text-gray-900">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardContent>
              
              {/* Connection line (for larger screens) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 transform -translate-y-1/2" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
