// shared/matchingService.ts - Standardized matching logic for both employer and employee sides

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuth, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData
} from "firebase/firestore";

// ================================
// INITIALIZATION
// ================================

const db = getFirestore();
const GEMINI_API_KEY: string = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  throw new Error("❌ Gemini API Key not found");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ================================
// TYPE DEFINITIONS
// ================================

interface MatchBreakdown {
  technicalSkills: number;
  experienceRelevance: number;
  industryKnowledge: number;
  roleFit: number;
  education: number;
}

type RecommendationType = 
  | 'STRONG_MATCH' 
  | 'GOOD_MATCH' 
  | 'MODERATE_MATCH' 
  | 'WEAK_MATCH' 
  | 'POOR_MATCH';

interface StandardizedMatchResult {
  matchPercent: number;
  breakdown: MatchBreakdown;
  reason: string;
  strengths: string[];
  gaps: string[];
  recommendation: RecommendationType;
}

interface CandidateProfile {
  name?: string;
  email?: string;
}

interface CandidateData {
  resumeText: string;
  linkedinText: string;
  profile: CandidateProfile;
}

interface JobData {
  description: string;
  role?: string;
  company?: string;
  requirements?: string;
}

interface MatchingOptions {
  [key: string]: any;
}

interface ExtractedContent {
  resumeText: string;
  linkedinText: string;
}

interface EmployeeData {
  name?: string;
  profilePic?: string;
  profile_pic?: string;
  profilePicture?: string;
  avatar?: string;
  resume64?: string;
  email?: string;
  profile?: CandidateProfile;
  linkedinUrl?: string;
  linkedin?: string;
}

interface JobDescription {
  id: string;
  description: string;
  role?: string;
  title?: string;
  company?: string;
  requirements?: string;
}

interface EmployerData {
  company?: string;
  profilePic?: string;
}

interface CandidateMatch {
  id: string;
  name: string;
  profilePic?: string;
  matchPercent: number;
  reason: string;
  breakdown: MatchBreakdown;
  strengths: string[];
  gaps: string[];
  recommendation: RecommendationType;
  linkedinUrl?: string;
  resume64?: string;
  jobId: string;
  jobData: JobDescription;
}

interface JobMatches {
  jobInfo: JobDescription;
  matches: CandidateMatch[];
}

interface MatchesByJob {
  [jobId: string]: JobMatches;
}

interface EmployeeJobMatch {
  profilePic: string;
  role: string;
  company: string;
  match: number;
  jobId: string;
  breakdown: MatchBreakdown;
  strengths: string[];
  gaps: string[];
  recommendation: RecommendationType;
}

interface JobWithEmployer {
  id: string;
  data: JobDescription;
  employerId: string;
  employerData: EmployerData;
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Convert base64 string to data URL for image display
 * @param base64String - Base64 encoded image string
 * @param mimeType - MIME type of the image (default: image/jpeg)
 * @returns Data URL string or fallback
 */
const formatProfilePicture = (
  base64String?: string, 
  mimeType: string = "image/jpeg"
): string => {
  if (!base64String) {
    return "/default-avatar.png";
  }

  // Check if it's already a data URL
  if (base64String.startsWith('data:')) {
    return base64String;
  }

  // If it's a regular URL, return as is
  if (base64String.startsWith('http')) {
    return base64String;
  }

  // Convert base64 to data URL
  return `data:${mimeType};base64,${base64String}`;
};

/**
 * Take a screenshot of a LinkedIn profile URL using html2canvas or similar
 * Note: This is a client-side approach. For production, consider server-side solutions
 * @param linkedinUrl - The LinkedIn profile URL
 * @returns Promise<{base64: string, mimeType: string} | null>
 */
const captureLinkedInScreenshot = async (
  linkedinUrl: string
): Promise<{base64: string, mimeType: string} | null> => {
  try {
    console.log(`📸 Processing LinkedIn URL: ${linkedinUrl}`);

    const screenshotServiceUrl = `https://api.htmlcsstoimage.com/v1/image`;

    console.log("⚠️ LinkedIn screenshot capture not fully implemented");
    console.log("📝 LinkedIn URL provided:", linkedinUrl);
    console.log("💡 Consider implementing with your preferred screenshot service");

    // Return null for now - the system will continue without LinkedIn data
    return null;

  } catch (error) {
    console.warn("Error with LinkedIn URL processing:", error);
    return null;
  }
};

/**
 * Extract LinkedIn content directly from URL by taking screenshot
 * @param linkedinUrl - The LinkedIn profile URL
 * @returns Promise<string> - Extracted LinkedIn text
 */
const extractLinkedInFromUrl = async (linkedinUrl: string): Promise<string> => {
  console.log("🔗 Processing LinkedIn URL:", linkedinUrl);

  // Take screenshot of the LinkedIn profile
  const screenshotData = await captureLinkedInScreenshot(linkedinUrl);
  if (!screenshotData) {
    console.warn("❌ Could not capture LinkedIn screenshot");
    return "";
  }

  try {
    const linkedinExtractRes = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: screenshotData.mimeType,
                data: screenshotData.base64,
              },
            },
            {
              text: `Extract all professional information from this LinkedIn profile screenshot. 
                     Include experience, skills, education, current role, and any other relevant 
                     professional details. Format as readable text. Focus on work experience, 
                     skills, and qualifications.`,
            },
          ],
        },
      ],
    });

    const extractedText = linkedinExtractRes.response.text();
    console.log("✅ LinkedIn text extracted from URL, length:", extractedText.length);
    return extractedText;

  } catch (error) {
    console.warn("❌ Could not extract LinkedIn data from screenshot:", error);
    return "";
  }
};

// ================================
// CORE MATCHING FUNCTIONS
// ================================

/**
 * Standardized matching function that works for both employer and employee perspectives
 * @param candidateData - Contains resume text, linkedin text, and profile info
 * @param jobData - Contains job description and requirements
 * @param options - Additional options for matching
 * @returns Promise<StandardizedMatchResult> - Standardized match result
 */
export const performStandardizedMatch = async (
  candidateData: CandidateData,
  jobData: JobData,
  options: MatchingOptions = {}
): Promise<StandardizedMatchResult> => {
  const { resumeText, linkedinText, profile } = candidateData;
  const { description, role, company, requirements } = jobData;

  // Standardized prompt that ensures consistency
  const prompt = `
You are a professional recruitment AI assistant. Analyze the candidate-job fit using standardized criteria.

CANDIDATE PROFILE:
Name: ${profile?.name || "Not specified"}
Email: ${profile?.email || "Not specified"}

RESUME CONTENT:
${resumeText || "No resume content available"}

LINKEDIN PROFILE CONTENT:
${linkedinText || "No LinkedIn content available"}

JOB DETAILS:
Role: ${role || "Not specified"}
Company: ${company || "Not specified"}
Description: ${description || "No job description available"}
Requirements: ${requirements || "See job description"}

STANDARDIZED ANALYSIS CRITERIA:
1. TECHNICAL SKILLS MATCH (25 points): How well do candidate's technical skills align with job requirements?
2. EXPERIENCE RELEVANCE (25 points): How relevant is candidate's work experience to the role?
3. INDUSTRY KNOWLEDGE (20 points): Does candidate have experience in the relevant industry/domain?
4. ROLE RESPONSIBILITIES FIT (20 points): Can candidate handle the specific responsibilities mentioned?
5. EDUCATIONAL BACKGROUND (10 points): Does candidate's education support the role requirements?

SCORING GUIDELINES:
- 90-100: Exceptional match, candidate exceeds requirements
- 80-89: Strong match, candidate meets most requirements well
- 70-79: Good match, candidate meets basic requirements
- 60-69: Moderate match, some gaps but viable with training
- 50-59: Weak match, significant gaps exist
- Below 50: Poor match, major misalignment

IMPORTANT: Be consistent in scoring. Similar candidates with similar qualifications should receive similar scores regardless of which system calls this function.

Return ONLY a JSON object in this exact format:
{
  "matchPercent": 85,
  "breakdown": {
    "technicalSkills": 22,
    "experienceRelevance": 20,
    "industryKnowledge": 18,
    "roleFit": 17,
    "education": 8
  },
  "reason": "Detailed explanation highlighting specific matches and gaps in each criteria area",
  "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
  "gaps": ["Gap 1", "Gap 2"],
  "recommendation": "STRONG_MATCH"
}
`;

  try {
    console.log(`🤖 Performing standardized match analysis...`);
    const result = await model.generateContent(prompt);
    const raw: string = result.response.text().trim();

    console.log(`📨 Raw Gemini response:`, raw);

    // Clean the response to extract JSON
    let jsonMatch: RegExpMatchArray | null = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      const codeBlockMatch: RegExpMatchArray | null = raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]];
      }
    }

    if (!jsonMatch) {
      console.warn(`⚠️ No valid JSON found in response`);
      throw new Error("Invalid response format from AI");
    }

    const parsed: StandardizedMatchResult = JSON.parse(jsonMatch[0]);
    console.log(`✅ Parsed standardized match result:`, parsed);

    // Validate the response structure
    if (typeof parsed.matchPercent !== 'number' || !parsed.reason) {
      console.warn(`⚠️ Invalid response structure:`, parsed);
      throw new Error("Invalid response structure from AI");
    }

    // Ensure match percent is within valid range
    parsed.matchPercent = Math.max(0, Math.min(100, Math.round(parsed.matchPercent)));

    return parsed;
  } catch (err) {
    console.error(`❌ Error in standardized matching:`, err);
    throw err;
  }
};

/**
 * Extract text content from resume and LinkedIn data
 * @param resume64 - Base64 encoded resume
 * @param linkedinUrl - LinkedIn profile URL (not screenshot URL)
 * @returns Promise<ExtractedContent> - Extracted text content
 */
export const extractCandidateContent = async (
  resume64?: string,
  linkedinUrl?: string
): Promise<ExtractedContent> => {
  let resumeText = "";
  let linkedinText = "";

  console.log("📖 Starting content extraction...");

  // Extract resume text if available
  if (resume64) {
    console.log("📋 Extracting resume text...");
    try {
      const resumeExtractRes = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: resume64,
                },
              },
              {
                text: `Extract all important information in plain text from this resume PDF. 
                       Include skills, experience, education, and any relevant details. 
                       Format as readable text.`,
              },
            ],
          },
        ],
      });
      resumeText = resumeExtractRes.response.text();
      console.log("✅ Resume text extracted, length:", resumeText.length);
    } catch (error) {
      console.warn("❌ Could not extract resume text:", error);
    }
  }

  // Extract LinkedIn content from URL
  if (linkedinUrl && linkedinUrl.includes('linkedin.com')) {
    console.log("🖼️ Processing LinkedIn profile URL...");
    linkedinText = await extractLinkedInFromUrl(linkedinUrl);
  }

  return { resumeText, linkedinText };
};

// ================================
// EMPLOYER-SIDE USAGE
// ================================

/**
 * Get matching candidates for all jobs posted by the current employer
 * @returns Promise<MatchesByJob> - Matches organized by job ID
 */
export const getMatchingCandidatesStandardized = async (): Promise<MatchesByJob> => {
  const auth = getAuth();
  const user: User | null = auth.currentUser;
  if (!user) {
    throw new Error("❌ Employer not authenticated");
  }

  const employerId: string = user.uid;
  console.log(`🔐 Employer authenticated: ${employerId}`);

  // Get job descriptions
  const jdSnapshot: QuerySnapshot<DocumentData> = await getDocs(
    collection(db, "Employers", employerId, "jobDescriptions")
  );
  const employerJDs: JobDescription[] = jdSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  } as JobDescription));

  if (employerJDs.length === 0) return {};

  // Get all employees
  const employeeSnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, "Employees"));
  const employees = employeeSnapshot.docs;

  const matchesByJob: MatchesByJob = {};

  // Initialize result structure
  employerJDs.forEach((jd: JobDescription) => {
    matchesByJob[jd.id] = { jobInfo: jd, matches: [] };
  });

  for (const empDoc of employees) {
    const empId: string = empDoc.id;
    const empData: EmployeeData = empDoc.data() as EmployeeData;

    // Try different possible field names for profile picture
    const profilePicBase64 = empData.profilePic || 
                             empData.profile_pic || 
                             empData.profilePicture || 
                             empData.avatar || "";
    const profilePicUrl = formatProfilePicture(profilePicBase64);
    const { name = "Unnamed", resume64 = "" } = empData;

    // Debug logging to check if profilePic is being read correctly
    console.log(`👤 Processing employee: ${name}`);
    console.log(`🖼️ Profile pic base64 length: ${profilePicBase64.length} chars`);
    console.log(`🔗 Profile pic URL: ${profilePicUrl.substring(0, 50)}...`);
    console.log(`📊 Employee data keys:`, Object.keys(empData));

    // Get LinkedIn profile URL from user data
    const linkedinUrl: string = empData.linkedinUrl || empData.linkedin || "";

    // Extract content using standardized method
    const { resumeText, linkedinText }: ExtractedContent = await extractCandidateContent(
      resume64, 
      linkedinUrl
    );

    // Match against each job
    for (const jd of employerJDs) {
      try {
        const candidateData: CandidateData = {
          resumeText,
          linkedinText,
          profile: { name, email: empData.email }
        };

        const jobData: JobData = {
          description: jd.description,
          role: jd.role,
          company: jd.company,
          requirements: jd.requirements
        };

        const matchResult: StandardizedMatchResult = await performStandardizedMatch(
          candidateData, 
          jobData
        );

        if (matchResult.matchPercent >= 70) {
          matchesByJob[jd.id].matches.push({
            id: empId,
            name,
            profilePic: profilePicUrl, // Now properly formatted as data URL
            matchPercent: matchResult.matchPercent,
            reason: matchResult.reason,
            breakdown: matchResult.breakdown,
            strengths: matchResult.strengths,
            gaps: matchResult.gaps,
            recommendation: matchResult.recommendation,
            linkedinUrl,
            resume64,
            jobId: jd.id,
            jobData: jd
          });
        }
      } catch (err) {
        console.error(`❌ Error matching employee ${name} to job ${jd.id}:`, err);
      }
    }
  }

  // Sort matches by percentage
  Object.keys(matchesByJob).forEach((jobId: string) => {
    matchesByJob[jobId].matches.sort(
      (a: CandidateMatch, b: CandidateMatch) => b.matchPercent - a.matchPercent
    );
  });

  return matchesByJob;
};

// ================================
// EMPLOYEE-SIDE USAGE
// ================================

/**
 * Match an employee to all available jobs in the system
 * @param employeeId - The ID of the employee to match
 * @returns Promise<EmployeeJobMatch[]> - Array of job matches sorted by match percentage
 */
export const matchEmployeeToJobsStandardized = async (
  employeeId: string
): Promise<EmployeeJobMatch[]> => {
  // Get employee data
  const empDoc: DocumentSnapshot<DocumentData> = await getDoc(doc(db, "Employees", employeeId));
  if (!empDoc.exists()) {
    throw new Error(`No employee found with ID: ${employeeId}`);
  }

  const empData: EmployeeData = empDoc.data() as EmployeeData;
  const { profile, resume64 } = empData;

  // Get profile picture with fallback options and convert base64 to data URL
  const profilePicBase64 = empData.profilePic || 
                           empData.profile_pic || 
                           empData.profilePicture || 
                           empData.avatar || "";
  const candidateProfilePic = formatProfilePicture(profilePicBase64);

  console.log(`👤 Processing employee for job matching`);
  console.log(`🖼️ Profile pic base64 length: ${profilePicBase64.length} chars`);
  console.log(`🔗 Profile pic URL: ${candidateProfilePic.substring(0, 50)}...`);

  // Get LinkedIn profile URL from employee data
  const linkedinUrl: string = empData.linkedinUrl || empData.linkedin || "";

  // Extract content using standardized method
  const { resumeText, linkedinText }: ExtractedContent = await extractCandidateContent(
    resume64, 
    linkedinUrl
  );

  // Get all jobs from all employers
  const employersSnap: QuerySnapshot<DocumentData> = await getDocs(collection(db, "Employers"));
  const allJobs: JobWithEmployer[] = [];

  for (const employerDoc of employersSnap.docs) {
    const employerId: string = employerDoc.id;
    const employerData: EmployerData = employerDoc.data() as EmployerData;

    const jobDescSnap: QuerySnapshot<DocumentData> = await getDocs(
      collection(db, `Employers/${employerId}/jobDescriptions`)
    );

    jobDescSnap.docs.forEach(jobDoc => {
      allJobs.push({
        id: jobDoc.id,
        data: jobDoc.data() as JobDescription,
        employerId,
        employerData
      });
    });
  }

  const matchResults: EmployeeJobMatch[] = [];

  // Process each job using standardized matching
  for (const job of allJobs) {
    try {
      const candidateData: CandidateData = {
        resumeText,
        linkedinText,
        profile: profile || {}
      };

      const jobData: JobData = {
        description: job.data.description,
        role: job.data.role || job.data.title,
        company: job.employerData?.company || job.data.company,
        requirements: job.data.requirements
      };

      const matchResult: StandardizedMatchResult = await performStandardizedMatch(
        candidateData, 
        jobData
      );

      matchResults.push({
        profilePic: job.employerData?.profilePic 
          ? formatProfilePicture(job.employerData.profilePic) 
          : "/default-company.png",
        role: jobData.role || "Unknown Role",
        company: jobData.company || "Unknown Company",
        match: matchResult.matchPercent,
        jobId: `${job.employerId}_${job.id}`,
        breakdown: matchResult.breakdown,
        strengths: matchResult.strengths,
        gaps: matchResult.gaps,
        recommendation: matchResult.recommendation
      });
    } catch (err) {
      console.error(`❌ Error matching job ${job.id}:`, err);
    }
  }

  return matchResults.sort(
    (a: EmployeeJobMatch, b: EmployeeJobMatch) => b.match - a.match
  );
};