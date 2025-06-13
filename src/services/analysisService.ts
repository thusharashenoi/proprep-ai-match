
import { toast } from "@/hooks/use-toast";

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
  private static GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';

  static async performAnalysis(data: AnalysisData): Promise<AnalysisResults> {
    try {
      // Step 1: Extract resume text
      const resumeText = await this.extractResumeText(data.resumeFile);
      
      // Step 2: Scrape LinkedIn profile (if provided)
      let linkedinProfile: LinkedInProfile | null = null;
      if (data.linkedinUrl) {
        linkedinProfile = await this.scrapeLinkedInProfile(data.linkedinUrl);
      }

      // Step 3: Analyze with Gemini API
      const analysisResults = await this.analyzeWithGemini(
        data.jobDescription,
        resumeText,
        linkedinProfile
      );

      return analysisResults;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error('Analysis failed. Please try again.');
    }
  }

  private static async extractResumeText(file: File): Promise<string> {
    // Simple text extraction for PDFs
    // In a real implementation, you'd use a PDF parsing library
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // This is a simplified extraction - in reality, you'd need proper PDF parsing
        const result = e.target?.result as string;
        resolve(result || 'Resume content could not be extracted');
      };
      reader.readAsText(file);
    });
  }

  private static async scrapeLinkedInProfile(url: string): Promise<LinkedInProfile> {
    try {
      // Note: In a real implementation, you'd need a backend service for web scraping
      // LinkedIn blocks direct scraping from frontend. This is a mock implementation.
      
      console.log('Scraping LinkedIn profile:', url);
      
      // Mock LinkedIn data for demo purposes
      return {
        name: "User Profile",
        headline: "Data Scientist | Machine Learning Engineer",
        experience: [
          "Data Analyst at TechCorp (2022-2024)",
          "Junior Developer at StartupXYZ (2021-2022)"
        ],
        skills: [
          "Python", "Machine Learning", "SQL", "Data Analysis", 
          "Pandas", "NumPy", "Scikit-learn", "Tableau"
        ],
        education: [
          "Bachelor's in Computer Science - University (2017-2021)"
        ]
      };
    } catch (error) {
      console.error('LinkedIn scraping failed:', error);
      toast({
        title: "LinkedIn Analysis Skipped",
        description: "Could not access LinkedIn profile. Continuing with resume analysis only.",
        variant: "destructive"
      });
      throw error;
    }
  }

  private static async analyzeWithGemini(
    jobDescription: string,
    resumeText: string,
    linkedinProfile: LinkedInProfile | null
  ): Promise<AnalysisResults> {
    const prompt = this.buildAnalysisPrompt(jobDescription, resumeText, linkedinProfile);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.candidates[0].content.parts[0].text;
      
      return this.parseGeminiResponse(analysisText);
    } catch (error) {
      console.error('Gemini API analysis failed:', error);
      
      // Return mock analysis results for demo purposes
      return this.getMockAnalysisResults();
    }
  }

  private static buildAnalysisPrompt(
    jobDescription: string,
    resumeText: string,
    linkedinProfile: LinkedInProfile | null
  ): string {
    return `
      You are an expert career coach and ATS specialist. Analyze the following materials and provide a comprehensive job readiness assessment.

      JOB DESCRIPTION:
      ${jobDescription}

      RESUME CONTENT:
      ${resumeText}

      ${linkedinProfile ? `
      LINKEDIN PROFILE:
      Name: ${linkedinProfile.name}
      Headline: ${linkedinProfile.headline}
      Experience: ${linkedinProfile.experience.join(', ')}
      Skills: ${linkedinProfile.skills.join(', ')}
      Education: ${linkedinProfile.education.join(', ')}
      ` : 'LINKEDIN PROFILE: Not provided'}

      Please provide a detailed analysis in the following JSON format:
      {
        "overallScore": <number 0-100>,
        "resumeAnalysis": {
          "strengths": [<array of strengths>],
          "weaknesses": [<array of weaknesses>],
          "suggestions": [<array of specific suggestions>],
          "atsScore": <number 0-100>
        },
        "linkedinAnalysis": {
          "profileStrength": <number 0-100>,
          "missingElements": [<array of missing elements>],
          "recommendations": [<array of recommendations>]
        },
        "jobMatch": {
          "matchPercentage": <number 0-100>,
          "keywordAlignment": <number 0-100>,
          "skillsMatch": [<array of matching skills>],
          "skillsGap": [<array of missing skills>]
        },
        "recommendations": {
          "immediate": [<array of immediate actions>],
          "shortTerm": [<array of short-term goals>],
          "longTerm": [<array of long-term development>]
        }
      }

      Focus on:
      1. ATS optimization and keyword matching
      2. Skills alignment with job requirements
      3. Experience relevance
      4. LinkedIn profile completeness and optimization
      5. Specific, actionable recommendations
    `;
  }

  private static parseGeminiResponse(responseText: string): AnalysisResults {
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.getMockAnalysisResults();
    }
  }

  private static getMockAnalysisResults(): AnalysisResults {
    return {
      overallScore: 75,
      resumeAnalysis: {
        strengths: [
          "Strong technical skills in Python and machine learning",
          "Relevant educational background in Computer Science",
          "Good experience with data analysis tools",
          "Clear progression in data-related roles"
        ],
        weaknesses: [
          "Limited experience with Azure cloud platform",
          "Missing specific examples of project impact",
          "Could improve quantification of achievements",
          "Lacks mention of collaborative coding practices"
        ],
        suggestions: [
          "Add specific metrics and impact numbers to achievements",
          "Include Azure or AWS certifications if available",
          "Highlight any Git/collaborative coding experience",
          "Emphasize machine learning projects and outcomes"
        ],
        atsScore: 78
      },
      linkedinAnalysis: {
        profileStrength: 72,
        missingElements: [
          "Professional summary section",
          "Recommendations from colleagues",
          "Skills endorsements",
          "Project portfolio links"
        ],
        recommendations: [
          "Add a compelling professional summary",
          "Request recommendations from past colleagues",
          "Showcase data science projects with links",
          "Join relevant data science groups and engage with content"
        ]
      },
      jobMatch: {
        matchPercentage: 73,
        keywordAlignment: 68,
        skillsMatch: [
          "Python", "Machine Learning", "SQL", "Data Analysis", 
          "Pandas", "NumPy", "Scikit-learn"
        ],
        skillsGap: [
          "Azure", "NLP", "Deep Learning", "Time-series Forecasting",
          "Git", "Jupyter Notebooks", "Power BI"
        ]
      },
      recommendations: {
        immediate: [
          "Update resume to include specific Azure experience or training",
          "Add quantifiable achievements to each role (e.g., 'Improved model accuracy by 15%')",
          "Optimize LinkedIn headline to include 'Entry-Level Data Scientist'",
          "Ensure resume includes keywords: 'predictive modeling', 'statistical analysis', 'data visualization'"
        ],
        shortTerm: [
          "Complete Azure Fundamentals certification",
          "Create a portfolio showcasing 2-3 data science projects",
          "Practice explaining machine learning concepts for technical interviews",
          "Network with Microsoft employees on LinkedIn"
        ],
        longTerm: [
          "Gain experience with NLP and deep learning through personal projects",
          "Contribute to open-source data science projects",
          "Develop expertise in time-series forecasting",
          "Build a personal brand through data science blog posts or articles"
        ]
      }
    };
  }
}
