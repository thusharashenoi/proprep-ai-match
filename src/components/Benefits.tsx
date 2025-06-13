
import { CheckCircle, Users, Briefcase, TrendingUp, Zap, Shield } from "lucide-react";

export const Benefits = () => {
  const benefits = [
    {
      icon: Users,
      title: "Perfect for Fresh Graduates",
      description: "Get the edge you need to land your first job with AI-optimized application materials."
    },
    {
      icon: Briefcase,
      title: "Career Switchers Welcome",
      description: "Transitioning industries? We'll help align your transferable skills with new opportunities."
    },
    {
      icon: TrendingUp,
      title: "Boost Interview Chances",
      description: "Improve your ATS compatibility score and get past automated screening systems."
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "No waiting around. Get comprehensive analysis and actionable insights in minutes."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is never stored. All analysis happens in-session for maximum privacy."
    },
    {
      icon: CheckCircle,
      title: "No Sign-up Required",
      description: "Start improving your job applications immediately without creating an account."
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose ProPrep.ai?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of job seekers who have improved their application success rate with our AI-powered insights
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
