// import { db } from "@/firebase";
// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   doc,
//   getDoc,
//   collectionGroup,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// if (!GEMINI_API_KEY) throw new Error("❌ Gemini API Key not found");

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// export const getMatchingCandidates = async () => {
//   const auth = getAuth();
//   const user = auth.currentUser;
//   if (!user) throw new Error("❌ Employer not authenticated");

//   const employerId = user.uid;

//   // ✅ 1. Get only the logged-in employer's job descriptions
//   const jdSnapshot = await getDocs(
//     query(collection(db, "jobDescriptions"), where("postedBy", "==", employerId))
//   );

//   const employerJDs = jdSnapshot.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   }));

//   if (employerJDs.length === 0) return [];

//   // ✅ 2. Fetch all employee documents
//   const employeeSnapshot = await getDocs(collection(db, "employees"));
//   const employees = employeeSnapshot.docs;

//   const matches = [];

//   for (const empDoc of employees) {
//     const empId = empDoc.id;
//     const empData = empDoc.data();
//     const {
//       name = "Unnamed",
//       profilePic = `https://api.dicebear.com/8.x/thumbs/svg?seed=${name}`,
//       resume64 = "",
//       jobDescription: appliedJD = "Not specified",
//     } = empData;

//     // ✅ 3. Fetch LinkedIn Analysis subcollection (first document)
//     const linkedinAnalysisSnap = await getDocs(
//       collection(db, "employees", empId, "linkedin_analysis")
//     );

//     const linkedinAnalysis = linkedinAnalysisSnap.empty
//       ? null
//       : linkedinAnalysisSnap.docs[0].data();

//     const screenshotUrl = linkedinAnalysis?.screenshotUrl || "";
//     const linkedinSummary = linkedinAnalysis?.summaryText || "Not available";

//     // ✅ 4. Prepare Gemini Prompt
//     const prompt = `
// You are an AI system that matches candidates to job descriptions based on profile information, resume, and LinkedIn data.

// Candidate:
// - Name: ${name}
// - Applied to JD: ${appliedJD}
// - Resume (in base64, assume pre-parsed): ${resume64.slice(0, 500)}...
// - LinkedIn Summary: ${linkedinSummary}
// - LinkedIn Screenshot URL: ${screenshotUrl}

// Here are job descriptions posted by the employer:
// $${employerJDs
//   .map((jd) => JSON.stringify(jd, null, 2))
//   .join("\n")}

// Return a JSON array like:
// [
//   {
//     "jobTitle": "JD Title",
//     "matchPercent": 85,
//     "reason": "Short explanation"
//   }
// ]
// `;

//     try {
//       const result = await model.generateContent(prompt);
//       const raw = result.response.text();
//       const parsed = JSON.parse(raw);

//       for (const match of parsed) {
//         if (match.matchPercent >= 80) {
//           matches.push({
//             id: empId,
//             name,
//             profilePic,
//             jobTitle: match.jobTitle,
//             matchPercent: match.matchPercent,
//             reason: match.reason,
//           });
//         }
//       }
//     } catch (err) {
//       console.error(`❌ Error matching employee ${name}:`, err);
//     }
//   }

//   return matches;
// };



import { db } from "@/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) throw new Error("❌ Gemini API Key not found");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const getMatchingCandidates = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    console.error("❌ Employer not authenticated");
    throw new Error("❌ Employer not authenticated");
  }

  const employerId = user.uid;
  console.log(`🔐 Employer authenticated: ${employerId}`);

  // ✅ 1. Get only the logged-in employer's job descriptions
  console.log("📥 Fetching job descriptions for employer...");
  const jdSnapshot = await getDocs(
    query(collection(db, "jobDescriptions"), where("postedBy", "==", employerId))
  );

  const employerJDs = jdSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  console.log(`📄 Found ${employerJDs.length} job descriptions`);

  if (employerJDs.length === 0) {
    console.warn("⚠️ No job descriptions found for this employer");
    return [];
  }

  // ✅ 2. Fetch all employee documents
  console.log("📥 Fetching all employee documents...");
  const employeeSnapshot = await getDocs(collection(db, "employees"));
  const employees = employeeSnapshot.docs;
  console.log(`👥 Found ${employees.length} employees`);

  const matches = [];

  for (const empDoc of employees) {
    const empId = empDoc.id;
    const empData = empDoc.data();
    const {
      name = "Unnamed",
      profilePic = `https://api.dicebear.com/8.x/thumbs/svg?seed=${name}`,
      resume64 = "",
      jobDescription: appliedJD = "Not specified",
    } = empData;

    console.log(`🔍 Processing employee: ${name} (${empId})`);

    // ✅ 3. Fetch LinkedIn Analysis subcollection (first document)
    const linkedinAnalysisSnap = await getDocs(
      collection(db, "employees", empId, "linkedin_analysis")
    );

    const linkedinAnalysis = linkedinAnalysisSnap.empty
      ? null
      : linkedinAnalysisSnap.docs[0].data();

    const screenshotUrl = linkedinAnalysis?.screenshotUrl || "";
    const linkedinSummary = linkedinAnalysis?.summaryText || "Not available";
    console.log(`📊 LinkedIn data loaded for ${name}`);

    // ✅ 4. Prepare Gemini Prompt
    const prompt = `
You are an AI system that matches candidates to job descriptions based on profile information, resume, and LinkedIn data.

Candidate:
- Name: ${name}
- Applied to JD: ${appliedJD}
- Resume (in base64, assume pre-parsed): ${resume64.slice(0, 500)}...
- LinkedIn Summary: ${linkedinSummary}
- LinkedIn Screenshot URL: ${screenshotUrl}

Here are job descriptions posted by the employer:
$${employerJDs
  .map((jd) => JSON.stringify(jd, null, 2))
  .join("\n")}

Return a JSON array like:
[
  {
    "jobTitle": "JD Title",
    "matchPercent": 85,
    "reason": "Short explanation"
  }
]
`;

    try {
      console.log(`🧠 Sending prompt to Gemini for ${name}...`);
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      console.log(`📨 Gemini response for ${name}: ${raw}`);

      const parsed = JSON.parse(raw);

      for (const match of parsed) {
        if (match.matchPercent >= 80) {
          console.log(`✅ Match found for ${name}: ${match.jobTitle} (${match.matchPercent}%)`);
          matches.push({
            id: empId,
            name,
            profilePic,
            jobTitle: match.jobTitle,
            matchPercent: match.matchPercent,
            reason: match.reason,
          });
        } else {
          console.log(`ℹ️ ${name} not a strong match (${match.matchPercent}%) for ${match.jobTitle}`);
        }
      }
    } catch (err) {
      console.error(`❌ Error matching employee ${name}:`, err);
    }
  }

  console.log(`🎯 Total strong matches found: ${matches.length}`);
  return matches;
};
