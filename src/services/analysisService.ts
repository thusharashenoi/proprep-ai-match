// import { toast } from "@/hooks/use-toast";
// import Tesseract from 'tesseract.js';
// // import * as pdfjsLib from 'pdfjs-dist/webpack';


// interface AnalysisData {
//   jobDescription: string;
//   resumeFile: File;
//   linkedinUrl?: string;
// }

// interface LinkedInProfile {
//   name: string;
//   headline: string;
//   experience: string[];
//   skills: string[];
//   education: string[];
// }

// interface AnalysisResults {
//   overallScore: number;
//   resumeAnalysis: {
//     strengths: string[];
//     weaknesses: string[];
//     suggestions: string[];
//     atsScore: number;
//   };
//   linkedinAnalysis: {
//     overallScore: number;
//     missingElements: string[];
//     recommendations: string[];
//   };
//   jobMatch: {
//     matchPercentage: number;
//     keywordAlignment: number;
//     skillsMatch: string[];
//     skillsGap: string[];
//   };
//   recommendations: {
//     immediate: string[];
//     shortTerm: string[];
//     longTerm: string[];
//   };
// }

// export class AnalysisService {
//   private static GEMINI_API_KEY = 'AIzaSyBg5__RmySYRn3eTNtgd0nn1goaEgZSgjU';
  
//   // Configure your backend URL - change this to match your actual setup
//   private static BACKEND_URL = process.env.NODE_ENV === 'production' 
//     ? 'https://your-production-backend.com' 
//     : 'http://localhost:3000'; // Note: HTTP not HTTPS for localhost

//   static async performAnalysis(data: AnalysisData): Promise<AnalysisResults> {
//     try {
//       console.log("Received Analysis Data:", data);

//       // Step 1: Parse Job Description
//       console.log("Parsing Job Description...");
//       const parsedJobDescription = await this.parseJobDescription(data.jobDescription);
//       console.log("Parsed Job Description:", parsedJobDescription);

//       // Step 2: Send PDF Resume Directly to Gemini
//       console.log("Sending Resume PDF to Gemini for analysis...");
//       const resumeText = await this.analyzePDFWithGemini(data.resumeFile);
//       console.log("Resume Analysis Received:", resumeText);

//       // Step 3: Extract LinkedIn Profile (if provided)
//       let linkedinProfile: LinkedInProfile | null = null;
//       if (data.linkedinUrl) {
//         console.log("Fetching LinkedIn Profile for:", data.linkedinUrl);
//         linkedinProfile = await this.fetchLinkedInDataFromBackend(data.linkedinUrl);
//         console.log("LinkedIn Profile Data:", JSON.stringify(linkedinProfile, null, 2));
//       } else {
//         console.log("No LinkedIn URL Provided - Skipping Profile Scraping.");
//       }
      
//       // Step 4: Perform Final Analysis using Gemini
//       console.log("Sending Extracted Data to Gemini for Final Analysis...");
//       return await this.analyzeWithGemini(parsedJobDescription, resumeText, linkedinProfile);
//     } catch (error) {
//       console.error("Analysis failed:", error);
//       throw new Error("Analysis failed. Please try again.");
//     }
//   }

//   // -------------------- FIXED: LinkedIn Profile Extraction --------------------
  
//   private static async fetchLinkedInDataFromBackend(linkedinUrl: string): Promise<LinkedInProfile | null> {
//     try {
//       console.log("Requesting LinkedIn profile data from backend...");
      
//       // Option 1: Use the full analysis endpoint (recommended)
//       const response = await fetch(`${this.BACKEND_URL}/api/linkedin/analyze`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           profileUrl: linkedinUrl
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
//         console.error("Failed LinkedIn Fetch:", response.statusText, errorData);
//         throw new Error(`Failed to fetch LinkedIn data: ${errorData.error || response.statusText}`);
//       }

//       const result = await response.json();
//       console.log("Backend Response:", JSON.stringify(result, null, 2));
      
//       if (result.success && result.data?.analysisData) {
//         // Convert the backend analysis data to your expected format
//         return this.convertBackendDataToLinkedInProfile(result.data.analysisData);
//       } else {
//         console.warn("No analysis data returned from backend, using screenshot-only mode");
//         // You could still return some basic data or null
//         return null;
//       }
      
//     } catch (error) {
//       console.error("LinkedIn Data Fetch Failed:", error);
      
//       // Try fallback: screenshot-only mode
//       try {
//         console.log("Attempting screenshot-only fallback...");
//         return await this.fetchLinkedInScreenshotOnly(linkedinUrl);
//       } catch (fallbackError) {
//         console.error("Screenshot fallback also failed:", fallbackError);
//         return null;
//       }
//     }
//   }

//   // Alternative: Screenshot-only mode as fallback
//   private static async fetchLinkedInScreenshotOnly(linkedinUrl: string): Promise<LinkedInProfile | null> {
//     try {
//       const response = await fetch(`${this.BACKEND_URL}/api/linkedin/quick-screenshot`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           profileUrl: linkedinUrl
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
//         throw new Error(`Screenshot failed: ${errorData.error || response.statusText}`);
//       }

//       const result = await response.json();
//       console.log("Screenshot taken:", result.data?.screenshotUrl);
      
//       // Return minimal profile data since we only have screenshot
//       return {
//         name: "Profile captured via screenshot",
//         headline: "Analysis pending",
//         experience: ["Screenshot analysis mode"],
//         skills: ["Manual review required"],
//         education: ["See screenshot for details"]
//       };
      
//     } catch (error) {
//       console.error("Screenshot fallback failed:", error);
//       throw error;
//     }
//   }

//   // Helper to convert backend analysis data to your expected format
//   private static convertBackendDataToLinkedInProfile(analysisData: any): LinkedInProfile {
//     // This depends on what your backend's AI analysis returns
//     // You'll need to adjust this based on the actual structure
//     return {
//       name: analysisData.name || analysisData.fullName || "Name not extracted",
//       headline: analysisData.headline || analysisData.title || "Headline not extracted", 
//       experience: Array.isArray(analysisData.experience) ? analysisData.experience : 
//                  analysisData.workExperience ? [analysisData.workExperience] : ["Experience not extracted"],
//       skills: Array.isArray(analysisData.skills) ? analysisData.skills : 
//               analysisData.skillsList ? analysisData.skillsList : ["Skills not extracted"],
//       education: Array.isArray(analysisData.education) ? analysisData.education :
//                  analysisData.educationBackground ? [analysisData.educationBackground] : ["Education not extracted"]
//     };
//   }

//   // Add a method to check backend status
//   static async checkBackendStatus(): Promise<boolean> {
//     try {
//       const response = await fetch(`${this.BACKEND_URL}/api/linkedin/status`);
//       const status = await response.json();
//       console.log("Backend status:", status);
//       return status.success;
//     } catch (error) {
//       console.error("Backend status check failed:", error);
//       return false;
//     }
//   }

//   // Rest of your existing methods remain the same...
  
//   private static async parseJobDescription(jobDescription: string): Promise<string> {
//     console.log("Received Job Description:", jobDescription);

//     const prompt = `Extract key insights from the following job description:

//     JOB DESCRIPTION:
//     ${jobDescription}

//     Provide structured details in JSON format:
//     - Key job responsibilities
//     - Required skills
//     - Experience level
//     - Industry relevance`;

//     return await this.sendToGemini(prompt);
//   }

//   private static async analyzePDFWithGemini(pdfFile: File): Promise<string> {
//     try {
//       console.log("Encoding PDF as Base64 for Gemini...");
//       const base64PDF = await this.convertPDFToBase64(pdfFile);
//       console.log("Base64 Conversion Successful");

//       const prompt = `Analyze the attached resume for relevant insights.
      
//       Please provide structured details in JSON format:
//       - Key skills
//       - Experience highlights
//       - Education details
//       - Missing ATS elements`;

//       const requestPayload = {
//         contents: [
//           {
//             parts: [
//               { text: prompt },
//               { inlineData: { mimeType: "application/pdf", data: base64PDF } }
//             ]
//           }
//         ],
//         generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
//       };

//       console.log("Sending PDF and Prompt to Gemini...");
//       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestPayload),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Gemini API Error:", errorData);
//         throw new Error(`Gemini API error: ${response.statusText}`);
//       }

//       const data = await response.json();
//       console.log("Gemini Response:", JSON.stringify(data, null, 2));

//       return data.candidates[0].content.parts[0].text;
//     } catch (error) {
//       console.error("Gemini API Call Failed:", error);
//       throw new Error("Failed to communicate with Gemini API.");
//     }
//   }

//   private static async convertPDFToBase64(file: File): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => {
//         const base64String = (reader.result as string).split(',')[1];
//         resolve(base64String);
//       };
//       reader.onerror = (error) => {
//         console.error("Error converting PDF to Base64:", error);
//         reject("Failed to encode PDF.");
//       };
//       reader.readAsDataURL(file);
//     });
//   }

//   private static async analyzeWithGemini(jobDescription: string, resumeText: string, linkedinProfile: LinkedInProfile | null): Promise<AnalysisResults> {
//     const prompt = `Analyze the following career-related inputs and provide structured insights:

// JOB DESCRIPTION:
// ${jobDescription}

// RESUME CONTENT:
// ${resumeText}


// ${linkedinProfile ? `LINKEDIN PROFILE:
// Name: ${linkedinProfile.name}
// Headline: ${linkedinProfile.headline}
// Experience: ${linkedinProfile.experience.join(", ")}
// Skills: ${linkedinProfile.skills.join(", ")}
// Education: ${linkedinProfile.education.join(", ")}` : "LINKEDIN PROFILE: Not provided"}

// Return results **strictly in JSON format**, following this structure:

// {
//   "overallScore": <Numeric Score (0-100)>,
//   "resumeAnalysis": {
//     "strengths": [<List of strengths identified from resume>],
//     "weaknesses": [<List of weaknesses identified from resume>],
//     "suggestions": [<List of improvements>],
//     "atsScore": <Numeric ATS compatibility score (0-100)>
//   },
//   "linkedinAnalysis": {
//     "profileStrength": <Numeric profile strength score (0-100)>,
//     "missingElements": [<List of missing LinkedIn elements>],
//     "recommendations": [<List of improvements for LinkedIn>]
//   },
//   "jobMatch": {
//     "matchPercentage": <Numeric match percentage (0-100)>,
//     "keywordAlignment": <Numeric keyword alignment score (0-100)>,
//     "skillsMatch": [<List of matched skills>],
//     "skillsGap": [<List of missing skills>]
//   },
//   "recommendations": {
//     "immediate": [<Immediate action items>],
//     "shortTerm": [<Short-term improvements>],
//     "longTerm": [<Long-term career strategy>]
//   }
// }

// **DO NOT** include Markdown formatting (like \`\`\`json). The response **must** be valid JSON without extra text, code blocks, or explanations.`;

//     const rawResponse = await this.sendToGemini(prompt);

//     const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
//     if (!jsonMatch) {
//       console.error("Failed to find JSON in Gemini response:", rawResponse);
//       throw new Error("Gemini response does not contain valid JSON.");
//     }

//     const cleanedResponse = jsonMatch[0];

//     try {
//       return JSON.parse(cleanedResponse);
//     } catch (error) {
//       console.error("Failed to parse Gemini response:", cleanedResponse);
//       throw new Error("Gemini returned an invalid JSON format.");
//     }
//   }

//   private static async sendToGemini(prompt: string): Promise<string> {
//     try {
//       console.log("Sending Request to Gemini API...");
//       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: prompt }] }],
//           generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Gemini API Error:", errorData);
//         throw new Error(`Gemini API error: ${response.statusText}`);
//       }

//       const data = await response.json();
//       return data.candidates[0].content.parts[0].text;
//     } catch (error) {
//       console.error("Gemini API Call Failed:", error);
//       throw new Error("Failed to communicate with Gemini API.");
//     }
//   }
// }


import { toast } from "@/hooks/use-toast";
import Tesseract from 'tesseract.js';

interface AnalysisData {
  jobDescription: string;
  resumeFile: File;
  linkedinUrl?: string;
}

// Updated interface to match your backend's analysis structure
interface BackendLinkedInAnalysis {
  overall_score: number;
  overall_feedback: string;
  critical_issues: string[];
  competitive_advantages: string[];
  sections: Array<{
    name: string;
    coordinates: [number, number];
    criticality: 'red' | 'yellow' | 'green';
    score: number;
    comment: string;
    priority: number;
    improvements: string[];
    industry_benchmark: string;
    impact_on_opportunities: string;
    detailed_analysis: string;
  }>;
  missing_elements: string[];
  next_steps: string[];
}

interface AnalysisResults {
  overallScore: number;
  resumeAnalysis: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    atsScore: number;
  };
  linkedinAnalysis: {
    overallScore: number;
    missingElements: string[];
    recommendations: string[];
    detailedSections: BackendLinkedInAnalysis['sections'];
    criticalIssues: string[];
    competitiveAdvantages: string[];
  };
  jobMatch: {
    matchPercentage: number;
    keywordAlignment: number;
    skillsMatch: string[];
    skillsGap: string[];
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class AnalysisService {
  private static GEMINI_API_KEY = 'AIzaSyBg5__RmySYRn3eTNtgd0nn1goaEgZSgjU';
  
  private static BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-backend.com' 
    : 'http://localhost:3000';

  static async performAnalysis(data: AnalysisData): Promise<AnalysisResults> {
    try {
      console.log("Received Analysis Data:", data);

      // Step 1: Parse Job Description
      console.log("Parsing Job Description...");
      const parsedJobDescription = await this.parseJobDescription(data.jobDescription);
      console.log("Parsed Job Description:", parsedJobDescription);

      // Step 2: Analyze Resume with Gemini
      console.log("Analyzing Resume PDF...");
      const resumeAnalysis = await this.analyzeResumeWithGemini(data.resumeFile);
      console.log("Resume Analysis:", resumeAnalysis);

      // Step 3: Get LinkedIn Analysis from Backend (if provided)
      let linkedinAnalysis: BackendLinkedInAnalysis | null = null;
      if (data.linkedinUrl) {
        console.log("Getting LinkedIn Analysis from Backend...");
        linkedinAnalysis = await this.getLinkedInAnalysisFromBackend(data.linkedinUrl);
        console.log("LinkedIn Analysis Received:", linkedinAnalysis);
      }
      
      // Step 4: Combine analyses and generate job matching
      console.log("Combining analyses and generating final results...");
      return await this.combineAnalyses(parsedJobDescription, resumeAnalysis, linkedinAnalysis);
      
    } catch (error) {
      console.error("Analysis failed:", error);
      throw new Error("Analysis failed. Please try again.");
    }
  }

  // Get the full LinkedIn analysis from your Python backend
  private static async getLinkedInAnalysisFromBackend(linkedinUrl: string): Promise<BackendLinkedInAnalysis | null> {
    try {
      console.log("Requesting LinkedIn analysis from backend...");
      
      const response = await fetch(`${this.BACKEND_URL}/api/linkedin/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrl: linkedinUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error("LinkedIn analysis failed:", response.statusText, errorData);
        throw new Error(`LinkedIn analysis failed: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      console.log("Backend Response:", JSON.stringify(result, null, 2));
      
      // Check if the backend returned analysis data
      if (result.success && result.data?.analysis) {
        return result.data.analysis; // Return the full analysis object
      } else if (result.success && result.data?.analysisData) {
        return result.data.analysisData; // Alternative path
      } else {
        console.warn("No analysis data returned from backend");
        return null;
      }
      
    } catch (error) {
      console.error("LinkedIn analysis fetch failed:", error);
      return null;
    }
  }

  // Analyze resume specifically for job matching
  private static async analyzeResumeWithGemini(pdfFile: File): Promise<any> {
    try {
      console.log("Encoding PDF as Base64 for Gemini...");
      const base64PDF = await this.convertPDFToBase64(pdfFile);
      console.log("Base64 Conversion Successful");

      const prompt = `Analyze this resume and extract structured information for job matching purposes.

      Please provide analysis in JSON format with:
      - strengths: Array of key strengths from the resume
      - weaknesses: Array of areas for improvement
      - suggestions: Array of specific suggestions for improvement
      - atsScore: Numeric score (0-100) for ATS compatibility
      - skills: Array of identified skills
      - experience: Array of experience highlights
      - keywords: Array of important keywords found

      Focus on extracting concrete, actionable insights.`;

      const requestPayload = {
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "application/pdf", data: base64PDF } }
            ]
          }
        ],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.candidates[0].content.parts[0].text;

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to extract JSON from Gemini response");
      }

    } catch (error) {
      console.error("Resume analysis failed:", error);
      throw new Error("Failed to analyze resume.");
    }
  }

  // Combine all analyses into final results
  private static async combineAnalyses(
    jobDescription: string, 
    resumeAnalysis: any, 
    linkedinAnalysis: BackendLinkedInAnalysis | null
  ): Promise<AnalysisResults> {
    
    // Generate job matching analysis
    const jobMatchAnalysis = await this.generateJobMatchAnalysis(
      jobDescription, 
      resumeAnalysis, 
      linkedinAnalysis
    );

    // Calculate overall score
    const resumeScore = resumeAnalysis.atsScore || 0;
    const linkedinScore = linkedinAnalysis?.overall_score || 0;
    const jobMatchScore = jobMatchAnalysis.matchPercentage || 0;

    // Weight the scores: Resume 40%, LinkedIn 30%, Job Match 30%
    const overallScore = Math.round(
      (resumeScore * 0.4) + (linkedinScore * 0.3) + (jobMatchScore * 0.3)
    );

    return {
      overallScore,
      resumeAnalysis: {
        strengths: resumeAnalysis.strengths || [],
        weaknesses: resumeAnalysis.weaknesses || [],
        suggestions: resumeAnalysis.suggestions || [],
        atsScore: resumeAnalysis.atsScore || 0
      },
      linkedinAnalysis: {
        overallScore: linkedinAnalysis?.overall_score || 0,
        missingElements: linkedinAnalysis?.missing_elements || [],
        recommendations: linkedinAnalysis?.next_steps || [],
        detailedSections: linkedinAnalysis?.sections || [],
        criticalIssues: linkedinAnalysis?.critical_issues || [],
        competitiveAdvantages: linkedinAnalysis?.competitive_advantages || []
      },
      jobMatch: jobMatchAnalysis,
      recommendations: {
        immediate: [
          ...(linkedinAnalysis?.critical_issues?.slice(0, 2) || []),
          ...(resumeAnalysis.suggestions?.slice(0, 2) || [])
        ],
        shortTerm: [
          ...(linkedinAnalysis?.next_steps?.slice(0, 3) || []),
          ...(resumeAnalysis.suggestions?.slice(2, 4) || [])
        ],
        longTerm: [
          ...(linkedinAnalysis?.next_steps?.slice(3) || []),
          "Continuously update profile based on industry trends",
          "Build thought leadership through content creation"
        ]
      }
    };
  }

  // Generate job matching analysis using Gemini
  private static async generateJobMatchAnalysis(
    jobDescription: string,
    resumeAnalysis: any,
    linkedinAnalysis: BackendLinkedInAnalysis | null
  ): Promise<any> {
    
    const prompt = `Analyze job matching between the candidate and job requirements.

JOB DESCRIPTION:
${jobDescription}

RESUME ANALYSIS:
${JSON.stringify(resumeAnalysis, null, 2)}

LINKEDIN ANALYSIS:
${linkedinAnalysis ? JSON.stringify({
  score: linkedinAnalysis.overall_score,
  strengths: linkedinAnalysis.competitive_advantages,
  sections: linkedinAnalysis.sections.map(s => ({
    name: s.name,
    score: s.score,
    comment: s.comment
  }))
}, null, 2) : "Not available"}

Provide job matching analysis in JSON format:
{
  "matchPercentage": <0-100>,
  "keywordAlignment": <0-100>,
  "skillsMatch": ["matched skills"],
  "skillsGap": ["missing skills"],
  "matchingStrengths": ["areas where candidate excels"],
  "improvementAreas": ["areas needing work for this role"]
}`;

    try {
      const response = await this.sendToGemini(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // Fallback analysis
        return {
          matchPercentage: 70,
          keywordAlignment: 65,
          skillsMatch: resumeAnalysis.skills?.slice(0, 5) || [],
          skillsGap: ["Skills analysis requires manual review"],
          matchingStrengths: resumeAnalysis.strengths?.slice(0, 3) || [],
          improvementAreas: resumeAnalysis.weaknesses?.slice(0, 3) || []
        };
      }
    } catch (error) {
      console.error("Job match analysis failed:", error);
      // Return basic fallback
      return {
        matchPercentage: 70,
        keywordAlignment: 65,
        skillsMatch: [],
        skillsGap: [],
        matchingStrengths: [],
        improvementAreas: []
      };
    }
  }

  // Existing helper methods remain the same
  private static async parseJobDescription(jobDescription: string): Promise<string> {
    const prompt = `Extract key insights from the following job description:

    JOB DESCRIPTION:
    ${jobDescription}

    Provide structured details in JSON format:
    - Key job responsibilities
    - Required skills
    - Experience level
    - Industry relevance`;

    return await this.sendToGemini(prompt);
  }

  private static async convertPDFToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error("Error converting PDF to Base64:", error);
        reject("Failed to encode PDF.");
      };
      reader.readAsDataURL(file);
    });
  }

  private static async sendToGemini(prompt: string): Promise<string> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API Call Failed:", error);
      throw new Error("Failed to communicate with Gemini API.");
    }
  }

  // Add method to check backend status
  static async checkBackendStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/linkedin/status`);
      const status = await response.json();
      console.log("Backend status:", status);
      return status.success;
    } catch (error) {
      console.error("Backend status check failed:", error);
      return false;
    }
  }
}