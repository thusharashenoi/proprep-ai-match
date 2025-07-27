
import { db } from "@/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  throw new Error("❌ Gemini API Key missing. Set it in .env as VITE_GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface JobMatch {
  profilePic: string;
  role: string;
  company: string;
  match: number;
  jobId: string;
}

function createPrompt(resumeText: string, profile: any, linkedinText: string, jdText: string): string {
  return `
You are a smart recruitment assistant. Match the candidate to the job and provide a score.

Candidate Resume:
${resumeText || "No resume available"}

Candidate Profile:
Name: ${profile?.name || "Not specified"}
Email: ${profile?.email || "Not specified"}

LinkedIn Profile Information:
${linkedinText || "No LinkedIn data available"}

Job Description:
${jdText}

Analyze the compatibility between the candidate and job based on:
1. Skills match
2. Experience relevance  
3. Role requirements alignment
4. Industry fit
5. Educational background

Note: Work with available information. If some data is missing, focus on what's available.

Respond in JSON format only:
{
  "match_percentage": <number between 0-100>
}
`;
}

// Export the debug function so you can call it separately
export { debugDatabaseStructure };

// Debug function to explore database structure
async function debugDatabaseStructure() {
  console.log("🔍 Debugging database structure...");
  
  try {
    // Check root collections
    const collections = ['JobDescriptions', 'Employers', 'Employees'];
    
    for (const collectionName of collections) {
      try {
        const snap = await getDocs(collection(db, collectionName));
        console.log(`📂 Collection "${collectionName}": ${snap.size} documents`);
        
        if (snap.size > 0) {
          const firstDoc = snap.docs[0];
          console.log(`📄 Sample document from ${collectionName}:`, firstDoc.id, firstDoc.data());
        }
      } catch (err) {
        console.log(`❌ Cannot access collection "${collectionName}":`, err);
      }
    }
  } catch (error) {
    console.error("❌ Error during database structure debug:", error);
  }
}

export async function matchEmployeeToJobs(employeeId: string): Promise<JobMatch[]> {
  try {
    console.log("🚀 Starting job matching for employee:", employeeId);
    
    // Debug database structure first
    await debugDatabaseStructure();
    
    // Get employee data
    const empDoc = await getDoc(doc(db, "Employees", employeeId));
    if (!empDoc.exists()) {
      throw new Error(`No employee found with ID: ${employeeId}`);
    }

    const empData = empDoc.data();
    console.log("📄 Employee data retrieved:", empData);
    
    const profile = empData.profile;
    console.log("👤 Profile data:", profile);
    
    const resumeBase64 = empData.resume64;
    console.log("📋 Resume available:", !!resumeBase64);

    // Get LinkedIn screenshot data
    console.log("🔍 Looking for LinkedIn data...");
    const linkedinSnap = await getDocs(collection(db, `Employees/${employeeId}/linkedin_analysis`));
    let linkedinScreenshotUrl = null;
    
    console.log("📱 LinkedIn documents found:", linkedinSnap.size);
    
    if (!linkedinSnap.empty) {
      // Get the first document's screenshot URL
      const linkedinDoc = linkedinSnap.docs[0].data();
      console.log("📱 LinkedIn document data:", linkedinDoc);
      linkedinScreenshotUrl = linkedinDoc.screenshotUrl;
      console.log("🖼️ LinkedIn screenshot URL:", linkedinScreenshotUrl);
    } else {
      console.log("⚠️ No LinkedIn analysis documents found");
    }

    // Extract data from available sources
    let resumeText = "";
    let linkedinText = "";

    console.log("📖 Starting data extraction...");

    // Extract resume text if available
    if (resumeBase64) {
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
                    data: resumeBase64,
                  },
                },
                {
                  text: "Extract all important information in plain text from this resume PDF. Include skills, experience, education, and any relevant details.",
                },
              ],
            },
          ],
        });
        resumeText = resumeExtractRes.response.text();
        console.log("✅ Resume text extracted, length:", resumeText.length);
        console.log("📋 Resume preview:", resumeText.substring(0, 200) + "...");
      } catch (error) {
        console.warn("❌ Could not extract resume text:", error);
      }
    } else {
      console.log("⚠️ No resume available for extraction");
    }

    // Extract LinkedIn profile information from screenshot if available
    if (linkedinScreenshotUrl) {
      console.log("🖼️ Extracting LinkedIn data from screenshot...");
      try {
        // Fetch the screenshot image
        const response = await fetch(linkedinScreenshotUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        const linkedinExtractRes = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: "image/png", // or "image/jpeg" depending on your screenshot format
                    data: base64Image,
                  },
                },
                {
                  text: "Extract all professional information from this LinkedIn profile screenshot. Include experience, skills, education, current role, and any other relevant professional details.",
                },
              ],
            },
          ],
        });
        linkedinText = linkedinExtractRes.response.text();
        console.log("✅ LinkedIn text extracted, length:", linkedinText.length);
        console.log("📱 LinkedIn preview:", linkedinText.substring(0, 200) + "...");
      } catch (error) {
        console.warn("❌ Could not extract LinkedIn data:", error);
      }
    } else {
      console.log("⚠️ No LinkedIn screenshot available for extraction");
    }

    // Check if we have at least some data to work with
    if (!resumeText && !linkedinText && (!profile || !profile.name)) {
      throw new Error("Insufficient profile data. Please upload a resume or ensure your LinkedIn profile is connected.");
    }

    console.log("📊 Data summary:");
    console.log("- Resume text length:", resumeText.length);
    console.log("- LinkedIn text length:", linkedinText.length);
    console.log("- Profile available:", !!profile);
    console.log("- Profile name:", profile?.name || "Not available");

    // Get all job descriptions from all employers
    console.log("💼 Fetching job descriptions from all employers...");
    
    // First get all employers
    const employersSnap = await getDocs(collection(db, "Employers"));
    console.log("👔 Found", employersSnap.size, "employers");
    
    if (employersSnap.size === 0) {
      throw new Error("No employers found in the database.");
    }
    
    const allJobs: Array<{
      id: string;
      data: any;
      employerId: string;
      employerData: any; // Add employer data to access profile info
    }> = [];
    
    // Loop through each employer and get their job descriptions
    for (const employerDoc of employersSnap.docs) {
      const employerId = employerDoc.id;
      const employerData = employerDoc.data(); // Get employer data for profile info
      console.log(`🏢 Fetching jobs for employer: ${employerId}`, employerData);
      
      try {
        const jobDescSnap = await getDocs(collection(db, `Employers/${employerId}/jobDescriptions`));
        console.log(`📋 Found ${jobDescSnap.size} jobs for employer ${employerId}`);
        
        jobDescSnap.docs.forEach(jobDoc => {
          const jobData = jobDoc.data();
          console.log(`📄 Job ${jobDoc.id} from employer ${employerId}:`, {
            role: jobData.role,
            company: jobData.company,
            hasDescription: !!jobData.description
          });
          
          allJobs.push({
            id: jobDoc.id,
            data: jobData,
            employerId: employerId,
            employerData: employerData // Store employer data for profile access
          });
        });
        
      } catch (err) {
        console.warn(`⚠️ Could not access jobDescriptions for employer ${employerId}:`, err);
      }
    }
    
    console.log("📚 Total jobs collected from all employers:", allJobs.length);
    
    if (allJobs.length === 0) {
      throw new Error("No job descriptions found. Please ensure employers have added job descriptions.");
    }
    
    const matchPromises: Promise<JobMatch | null>[] = [];

    // Process each job
    for (const job of allJobs) {
      const jobId = job.id;
      const jobData = job.data;
      const employerId = job.employerId;
      const employerData = job.employerData;

      console.log(`🔍 Processing job ${jobId} from employer ${employerId}:`, {
        role: jobData.role,
        company: jobData.company,
        hasDescription: !!jobData.description,
        employerProfile: employerData?.profile
      });

      const jdText = jobData.description || "";
      
      // Get job role - try multiple possible field names
      const jobRole = jobData.role || jobData.title || jobData.position || "Unknown Role";
      
      // Get company name - from employer collection's company field
      const jobCompany = employerData?.company || 
                         jobData.company || 
                         jobData.companyName || 
                         "Unknown Company";
      
      // Get profile picture - from employer collection's profilePic field
      const employerProfilePic = employerData?.profilePic || 
                                jobData.profilePic || 
                                jobData.employerProfile || 
                                "/default-company.png";

      console.log(`📋 Job details for ${jobId}:`, {
        role: jobRole,
        company: jobCompany,
        profilePic: employerProfilePic,
        employerData: employerData?.profile || employerData
      });

      // Create a promise for each job matching
      const matchPromise = (async (): Promise<JobMatch | null> => {
        try {
          console.log(`🤖 Matching with job ${jobId} (${jobRole} at ${jobCompany}) from employer ${employerId}...`);
          const prompt = createPrompt(resumeText, profile, linkedinText, jdText);
          const result = await model.generateContent(prompt);
          const responseText = result.response.text().trim();
          
          console.log(`📝 Raw Gemini response for job ${jobId}:`, responseText);
          
          // Clean the response text to extract JSON
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.warn(`⚠️ No JSON found in response for job ${jobId}`);
            return null;
          }

          const parsed = JSON.parse(jsonMatch[0]);
          const matchPercentage = parsed.match_percentage || 0;

          console.log(`✅ Match result for job ${jobId}: ${matchPercentage}%`);

          const jobMatch: JobMatch = {
            profilePic: employerProfilePic,
            role: jobRole,
            company: jobCompany,
            match: Math.round(matchPercentage),
            jobId: `${employerId}_${jobId}`, // Include employer ID to make it unique
          };

          console.log(`📤 Returning job match:`, jobMatch);

          return jobMatch;
        } catch (err) {
          console.error(`❌ Error matching job ${jobId} from employer ${employerId}:`, err);
          return null;
        }
      })();

      matchPromises.push(matchPromise);
    }

    // Wait for all matches to complete
    console.log("⏳ Waiting for all job matches to complete...");
    const matchResults = await Promise.all(matchPromises);
    
    // Filter out null results and sort by match percentage
    const validMatches = matchResults
      .filter((match): match is JobMatch => match !== null)
      .sort((a, b) => b.match - a.match);

    console.log(`🎯 Final results: ${validMatches.length} valid matches out of ${matchResults.length} total jobs`);
    console.log("📊 Top 5 matches:", validMatches.slice(0, 5).map(m => ({
      role: m.role,
      company: m.company,
      match: m.match,
      profilePic: m.profilePic
    })));

    return validMatches;

  } catch (error) {
    console.error("❌ Error in matchEmployeeToJobs:", error);
    throw error;
  }
}