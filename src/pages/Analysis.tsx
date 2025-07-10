import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Linkedin, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { AnalysisService } from "@/services/analysisService";
import Navbar from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

const Analysis = () => {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isResumeAnalyzing, setIsResumeAnalyzing] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);

  // Prefill from profile if available
  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.linkedinUrl) setLinkedinUrl(parsed.linkedinUrl);
      if (parsed.resumeAnalysis) setResumeAnalysis(parsed.resumeAnalysis);
      // Resume file cannot be prefilled for security reasons
    }
  }, []);

  // Always show the analysis from profile by default
  if (resumeAnalysis) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col pt-16">
        {/* pt-16 ensures content starts just below the fixed Navbar, with minimal gap */}
        <div className="w-full flex items-center justify-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 tracking-tight">Resume Analysis</h1>
        </div>
        {/* Option to re-analyze a new resume */}
        <div className="w-full flex justify-center mt-2 mb-2">
          <Button variant="outline" onClick={() => { setResumeAnalysis(null); setResumeFile(null); }}>Analyze a Different Resume</Button>
        </div>
        {/* ATS Score Bar */}
        <div className="w-full flex flex-col items-center mt-4 mb-4">
          <div className="w-full max-w-3xl flex flex-col items-center">
            <div className="flex items-baseline justify-between w-full mb-1 px-1">
              <span className="text-xs text-gray-500 font-semibold">ATS Score</span>
              <span className="text-2xl font-extrabold text-blue-700 drop-shadow-lg">{resumeAnalysis.atsScore ?? 'N/A'}</span>
              <span className="text-base font-semibold text-gray-500">/100</span>
            </div>
            <Progress value={resumeAnalysis.atsScore ?? 0} className="h-5 w-full rounded-full shadow-lg bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-blue-700" />
          </div>
        </div>
        {/* ATS Subscores 2x2 Grid (refined order and labels) */}
        {resumeAnalysis.atsSubscores && (
          <div className="w-full max-w-3xl mx-auto grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow border border-blue-100 p-3 flex flex-col items-center">
              <span className="text-xs text-gray-500 font-semibold mb-1">Content Quality</span>
              <span className="text-lg font-bold text-blue-700">{resumeAnalysis.atsSubscores.contentQuality}/100</span>
            </div>
            <div className="bg-white rounded-xl shadow border border-blue-100 p-3 flex flex-col items-center">
              <span className="text-xs text-gray-500 font-semibold mb-1">Visual Design</span>
              <span className="text-lg font-bold text-blue-700">{resumeAnalysis.atsSubscores.visualDesign}/100</span>
            </div>
            <div className="bg-white rounded-xl shadow border border-blue-100 p-3 flex flex-col items-center">
              <span className="text-xs text-gray-500 font-semibold mb-1">Readability</span>
              <span className="text-lg font-bold text-blue-700">{resumeAnalysis.atsSubscores.readability}/100</span>
            </div>
            <div className="bg-white rounded-xl shadow border border-blue-100 p-3 flex flex-col items-center">
              <span className="text-xs text-gray-500 font-semibold mb-1">Technical Compliance</span>
              <span className="text-lg font-bold text-blue-700">{resumeAnalysis.atsSubscores.technicalCompliance}/100</span>
            </div>
          </div>
        )}
        {/* 4-Box Grid: Strengths, Weaknesses, Layout Improvements, Resume Content Improvements */}
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="min-h-[180px] max-h-64 bg-white rounded-xl shadow-xl border border-green-200 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-lg font-bold text-green-700 mb-2">Strengths</h3>
            <ul className="list-disc pl-5 text-green-800 text-sm space-y-1">
              {(resumeAnalysis.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div className="min-h-[180px] max-h-64 bg-white rounded-xl shadow-xl border border-red-200 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-lg font-bold text-red-700 mb-2">Weaknesses</h3>
            <ul className="list-disc pl-5 text-red-800 text-sm space-y-1">
              {(resumeAnalysis.weaknesses || []).map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          </div>
          <div className="min-h-[180px] max-h-64 bg-white rounded-xl shadow-xl border border-blue-200 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-lg font-bold text-blue-700 mb-2">Layout & Visual Improvements</h3>
            <ul className="list-disc pl-5 text-blue-800 text-sm space-y-1">
              {(resumeAnalysis.atsImprovementTips || []).map((tip: string, i: number) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
          <div className="min-h-[180px] max-h-64 bg-white rounded-xl shadow-xl border border-blue-200 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-lg font-bold text-blue-700 mb-2">Resume Content Improvements</h3>
            <ul className="list-disc pl-5 text-blue-800 text-sm space-y-1">
              {(resumeAnalysis.resumeImprovementTips || resumeAnalysis.suggestions || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 8px;
          }
        `}</style>
      </div>
    );
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      setResumeFile(file);
      setIsResumeAnalyzing(true);
      setResumeAnalysis(null);
      toast({
        title: "Resume uploaded successfully",
        description: `${file.name} has been uploaded.`
      });
      try {
        const analysis = await AnalysisService.analyzeResumeWithGemini(file);
        setResumeAnalysis(analysis);
      } catch (error) {
        toast({
          title: "Resume analysis failed",
          description: error instanceof Error ? error.message : "An error occurred during resume analysis.",
          variant: "destructive"
        });
        setResumeFile(null);
      } finally {
        setIsResumeAnalyzing(false);
      }
    }
  };

  if (isResumeAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">Analyzing Resume...</CardTitle>
              <CardDescription>
                Extracting skills, experience, and ATS score from your resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600 mb-6" />
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                This usually takes 10-20 seconds. Please don't close this window.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Job Readiness Analysis
          </h1>
          <p className="text-xl text-gray-600">
            Upload your materials and get instant AI-powered insights to improve your job application success.
          </p>
        </div>

        {/* Only show resume and LinkedIn fields */}
        <div className="grid gap-6 mb-8">
          {/* Step 2: Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <FileText className="w-5 h-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume in PDF format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  {resumeFile ? (
                    <p className="text-green-600 font-medium">{resumeFile.name}</p>
                  ) : (
                    <p className="text-gray-600">
                      Drop your resume here or{" "}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                        browse files
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                      </label>
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: LinkedIn Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <Linkedin className="w-5 h-5" />
                LinkedIn Profile (Optional)
              </CardTitle>
              <CardDescription>
                Add your public LinkedIn profile URL for additional insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="url"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://www.linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
