import { toast } from "@/hooks/use-toast";
import Tesseract from 'tesseract.js';
// import * as pdfjsLib from 'pdfjs-dist/webpack';


interface AnalysisData {
  jobDescription: string;
  resumeFile: File;
  linkedinUrl?: string;
}

interface LinkedInProfile {
  name: string;
  headline: string;
  experience: string[];
  skills: string[];
  education: string[];
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
    profileStrength: number;
    missingElements: string[];
    recommendations: string[];
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

  static async performAnalysis(data: AnalysisData): Promise<AnalysisResults> {
    try {
      console.log("Received Analysis Data:", data);

      // Step 1: Parse Job Description
      console.log("Parsing Job Description...");
      const parsedJobDescription = await this.parseJobDescription(data.jobDescription);
      console.log("Parsed Job Description:", parsedJobDescription);

      // Step 2: Send PDF Resume Directly to Gemini
      console.log("Sending Resume PDF to Gemini for analysis...");
      const resumeText = await this.analyzePDFWithGemini(data.resumeFile);
      console.log("Resume Analysis Received:", resumeText);

      // Step 3: Extract LinkedIn Profile (if provided)
      let linkedinProfile: LinkedInProfile | null = null;
      if (data.linkedinUrl) {
        console.log("Fetching LinkedIn Profile for:", data.linkedinUrl);
        linkedinProfile = await this.extractLinkedInData(data.linkedinUrl);
        console.log("LinkedIn Profile Data:", JSON.stringify(linkedinProfile, null, 2));
      } else {
        console.log("No LinkedIn URL Provided - Skipping Profile Scraping.");
      }
      
      // Step 4: Perform Final Analysis using Gemini
      console.log("Sending Extracted Data to Gemini for Final Analysis...");
      return await this.analyzeWithGemini(parsedJobDescription, resumeText, linkedinProfile);
    } catch (error) {
      console.error("Analysis failed:", error);
      throw new Error("Analysis failed. Please try again.");
    }
  }

  // -------------------- STEP 1: Job Description Parsing --------------------

  private static async parseJobDescription(jobDescription: string): Promise<string> {
    console.log("Received Job Description:", jobDescription);

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

  // -------------------- STEP 2: Send PDF Resume Directly to Gemini --------------------

  private static async analyzePDFWithGemini(pdfFile: File): Promise<string> {
    try {
      console.log("Encoding PDF as Base64 for Gemini...");
      const base64PDF = await this.convertPDFToBase64(pdfFile);
      console.log("Base64 Conversion Successful");

      const prompt = `Analyze the attached resume for relevant insights.
      
      Please provide structured details in JSON format:
      - Key skills
      - Experience highlights
      - Education details
      - Missing ATS elements`;

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

      console.log("Sending PDF and Prompt to Gemini...");
      console.log("Request Payload:", JSON.stringify(requestPayload, null, 2));

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
      console.log("Gemini Response:", JSON.stringify(data, null, 2));

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API Call Failed:", error);
      throw new Error("Failed to communicate with Gemini API.");
    }
  }

  private static async convertPDFToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1]; // Extract Base64 content
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error("Error converting PDF to Base64:", error);
        reject("Failed to encode PDF.");
      };
      reader.readAsDataURL(file);
    });
  }

  // -------------------- STEP 3: LinkedIn Profile Extraction --------------------

    
  private static async extractLinkedInData(linkedinUrl: string): Promise<LinkedInProfile | null> {
    try {
      console.log("Validating LinkedIn URL:", linkedinUrl);
      if (!linkedinUrl.includes("linkedin.com")) {
        throw new Error("Invalid LinkedIn URL.");
      }

      console.log("Scraping LinkedIn Profile...");
      const response = await fetch(`/api/linkedin?url=${encodeURIComponent(linkedinUrl)}`);
      if (!response.ok) {
        console.error("Failed LinkedIn Fetch:", response.statusText);
        throw new Error("Failed to fetch LinkedIn data.");
      }

      return await response.json();
    } catch (error) {
      console.error("LinkedIn Data Extraction Failed:", error);
      return null;
    }
  }
  // -------------------- STEP 3: Fetch LinkedIn Profile Data from Backend --------------------

  private static async fetchLinkedInDataFromBackend(linkedinUrl: string): Promise<LinkedInProfile | null> {
    try {
      console.log("Requesting LinkedIn profile data from backend...");
      const response = await fetch(`http://localhost:5000/api/linkedin?url=${encodeURIComponent(linkedinUrl)}`);

      if (!response.ok) {
        console.error("Failed LinkedIn Fetch:", response.statusText);
        throw new Error("Failed to fetch LinkedIn data.");
      }

      const profileData = await response.json();
      console.log("Fetched LinkedIn Profile Data:", JSON.stringify(profileData, null, 2));
      
      return profileData;
    } catch (error) {
      console.error("LinkedIn Data Fetch Failed:", error);
      return null;
    }
  }

  // -------------------- STEP 4: Final Analysis with Gemini --------------------
private static async analyzeWithGemini(jobDescription: string, resumeText: string, linkedinProfile: LinkedInProfile | null): Promise<AnalysisResults> {
  const prompt = `Analyze the following career-related inputs and provide structured insights:

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeText}

${linkedinProfile ? `LINKEDIN PROFILE:
Name: ${linkedinProfile.name}
Headline: ${linkedinProfile.headline}
Experience: ${linkedinProfile.experience.join(", ")}
Skills: ${linkedinProfile.skills.join(", ")}
Education: ${linkedinProfile.education.join(", ")}` : "LINKEDIN PROFILE: Not provided"}

Return results **strictly in JSON format**, following this structure:

{
  "overallScore": <Numeric Score (0-100)>,
  "resumeAnalysis": {
    "strengths": [<List of strengths identified from resume>],
    "weaknesses": [<List of weaknesses identified from resume>],
    "suggestions": [<List of improvements>],
    "atsScore": <Numeric ATS compatibility score (0-100)>
  },
  "linkedinAnalysis": {
    "profileStrength": <Numeric profile strength score (0-100)>,
    "missingElements": [<List of missing LinkedIn elements>],
    "recommendations": [<List of improvements for LinkedIn>]
  },
  "jobMatch": {
    "matchPercentage": <Numeric match percentage (0-100)>,
    "keywordAlignment": <Numeric keyword alignment score (0-100)>,
    "skillsMatch": [<List of matched skills>],
    "skillsGap": [<List of missing skills>]
  },
  "recommendations": {
    "immediate": [<Immediate action items>],
    "shortTerm": [<Short-term improvements>],
    "longTerm": [<Long-term career strategy>]
  }
}

**DO NOT** include Markdown formatting (like \`\`\`json). The response **must** be valid JSON without extra text, code blocks, or explanations.`;


  const rawResponse = await this.sendToGemini(prompt);

  // **Extract JSON from response** by removing Markdown formatting
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Failed to find JSON in Gemini response:", rawResponse);
    throw new Error("Gemini response does not contain valid JSON.");
  }

  const cleanedResponse = jsonMatch[0]; // Extract the JSON portion

  try {
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Failed to parse Gemini response:", cleanedResponse);
    throw new Error("Gemini returned an invalid JSON format.");
  }
}


  // -------------------- HELPER FUNCTION: Send Request to Gemini API --------------------

  private static async sendToGemini(prompt: string): Promise<string> {
    try {
      console.log("Sending Request to Gemini API...");
      console.log("Generated Prompt:", prompt);

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
      console.log("Raw Gemini API Response:", JSON.stringify(data, null, 2));

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API Call Failed:", error);
      throw new Error("Failed to communicate with Gemini API.");
    }
  }
}



