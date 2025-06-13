
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Linkedin, Upload, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { AnalysisService } from "@/services/analysisService";

const Analysis = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setResumeFile(file);
      toast({
        title: "Resume uploaded successfully",
        description: `${file.name} has been uploaded.`
      });
    }
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please paste the job description before starting analysis.",
        variant: "destructive"
      });
      return;
    }

    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume before starting analysis.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setCurrentStep("Initializing analysis...");

    try {
      // Simulate progress updates
      const steps = [
        { progress: 10, step: "Extracting resume content..." },
        { progress: 30, step: "Analyzing job description..." },
        { progress: 50, step: linkedinUrl ? "Scraping LinkedIn profile..." : "Skipping LinkedIn analysis..." },
        { progress: 70, step: "Running AI analysis with Gemini..." },
        { progress: 90, step: "Generating recommendations..." },
        { progress: 100, step: "Analysis complete!" }
      ];

      for (const { progress, step } of steps) {
        setAnalysisProgress(progress);
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Perform actual analysis
      const results = await AnalysisService.performAnalysis({
        jobDescription,
        resumeFile,
        linkedinUrl: linkedinUrl || undefined
      });

      toast({
        title: "Analysis completed successfully!",
        description: "Your job readiness report is ready."
      });

      // Navigate to results page with analysis data
      navigate('/results', { state: { results } });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setCurrentStep("");
    }
  };

  // Show analysis progress overlay
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">Analyzing Your Profile</CardTitle>
              <CardDescription>
                Our AI is processing your resume, LinkedIn profile, and job requirements...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600 mb-6" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{currentStep}</span>
                  <span className="font-medium">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-3" />
              </div>
              
              <p className="text-sm text-gray-500 mt-6">
                This usually takes 30-60 seconds. Please don't close this window.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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

        {/* Steps */}
        <div className="grid gap-6 mb-8">
          {/* Step 1: Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <FileText className="w-5 h-5" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste the job description you're applying for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Step 2: Resume Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                  2
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
                  3
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

        {/* Analyze Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={!jobDescription || !resumeFile || isAnalyzing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              "Start AI Analysis"
            )}
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Analysis typically takes 30-60 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
