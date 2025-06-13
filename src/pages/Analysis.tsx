
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Linkedin, Upload, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Analysis = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleAnalyze = () => {
    console.log("Starting analysis with:", {
      jobDescription,
      resumeFile: resumeFile?.name,
      linkedinUrl
    });
    // TODO: Implement analysis logic
  };

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
            disabled={!jobDescription || !resumeFile}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start AI Analysis
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
