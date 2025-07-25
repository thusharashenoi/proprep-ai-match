// // src/services/extractResume.ts

// export const extractResume = async (resumeUrl: string) => {
//   try {
//     // Step 1: Fetch the PDF binary
//     const pdfResponse = await fetch(resumeUrl);
//     const pdfBlob = await pdfResponse.blob();

//     // Step 2: Convert PDF Blob to Base64
//     const toBase64 = (blob: Blob): Promise<string> =>
//       new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.readAsDataURL(blob);
//         reader.onloadend = () => {
//           const base64data = reader.result?.toString().split(",")[1];
//           if (base64data) resolve(base64data);
//           else reject("Failed to convert PDF to Base64");
//         };
//       });

//     const base64PDF = await toBase64(pdfBlob);
    // const API_KEY = 'AIzaSyBg5__RmySYRn3eTNtgd0nn1goaEgZSgjU';
//     // Step 3: Call Gemini API with Resume Content
//     const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.API_KEY}`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [
//               {
//                 text: `Extract and return the following from this resume PDF:
// - Skills (as a list)
// - Education (as a list)
// - Work Experience (as a list with title, company, years if present)
// Respond ONLY in JSON format: 
// {
//   "skills": [],
//   "education": [],
//   "experience": []
// }`,
//               },
//               {
//                 inlineData: {
//                   mimeType: "application/pdf",
//                   data: base64PDF,
//                 },
//               },
//             ],
//           },
//         ],
//       }),
//     });

//     const geminiResult = await geminiResponse.json();

//     // Step 4: Parse Gemini Response
//     const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text;
//     const extracted = JSON.parse(rawText || "{}");

//     return extracted;
//   } catch (error) {
//     console.error("Error extracting resume:", error);
//     return null;
//   }
// };
// src/services/extract_resume.ts

// export const extractResume = async (base64Resume: string): Promise<string> => {
//   try {
//     console.log("🟡 Starting resume analysis...");

//     // Clean the base64 string
//     const cleanedBase64 = base64Resume.replace(/^data:application\/pdf;base64,/, "");
//     console.log("📄 Base64 resume cleaned. Length:", cleanedBase64.length);

//     const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

//     console.log("🔗 Gemini URL prepared:", geminiUrl);

//     // Make the Gemini request
//     const response = await fetch(geminiUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             role: "user",
//             parts: [
//               {
//                 inlineData: {
//                   mimeType: "application/pdf",
//                   data: cleanedBase64,
//                 },
//               },
//               {
//                 text: `This is a resume in PDF format. Please extract the following fields and return them as JSON:
// {
//   "name": "...",
//   "email": "...",
//   "skills": ["...", "..."],
//   "education": "...",
//   "experience": "..."
// }`,
//               },
//             ],
//           },
//         ],
//       }),
//     });

//     console.log("📩 Response received from Gemini. Status:", response.status);

//     const result = await response.json();
//     console.log("🧠 Gemini response JSON:", result);

//     if (!response.ok) {
//       console.error("❌ Gemini API error. Response not OK:", result);
//       return "Error: Could not analyze the resume. Gemini API returned non-OK.";
//     }

//     const extractedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

//     if (!extractedText) {
//       console.error("❌ No extracted text found in Gemini response.");
//       return "Error: Resume analysis failed. No output from Gemini.";
//     }

//     console.log("✅ Resume analysis successful.");
//     return extractedText;

//   } catch (error) {
//     console.error("🔥 Unexpected error during resume analysis:", error);
//     return "Error: Unexpected issue occurred during resume analysis.";
//   }
// };


// import { db } from "@/firebase";
// import { doc, setDoc } from "firebase/firestore";

// export const extract_resume = async (
//   base64Resume: string,
//   userId: string
// ): Promise<string> => {
//   try {
//     console.log("🟡 Starting resume analysis...");

//     // Clean the base64 string
//     const cleanedBase64 = base64Resume.replace(
//       /^data:application\/pdf;base64,/,
//       ""
//     );
//     console.log("📄 Base64 resume cleaned. Length:", cleanedBase64.length);

//     const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

//     console.log("🔗 Gemini URL prepared:", geminiUrl);

//     // Call Gemini
//     const response = await fetch(geminiUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [
//           {
//             role: "user",
//             parts: [
//               {
//                 inlineData: {
//                   mimeType: "application/pdf",
//                   data: cleanedBase64,
//                 },
//               },
//               {
//                 text: `This is a resume in PDF format. Please extract the following fields and return them as JSON:
//               {
//                 "name": "...",
//                 "email": "...",
//                 "skills": ["...", "..."],
//                 "education": "...",
//                 "experience": "..."
//               }`,
//               },
//             ],
//           },
//         ],
//       }),
//     });

//     const result = await response.json();
//     console.log("🧠 Gemini response JSON:", result);

//     if (!response.ok) {
//       console.error("❌ Gemini API error:", result);
//       return "Error: Gemini API failed.";
//     }

//     const extractedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

//     if (!extractedText) {
//       console.error("❌ No extracted text found.");
//       return "Error: No output from Gemini.";
//     }

//     const parsed = JSON.parse(extractedText); // Convert string to JSON
//     console.log("✅ Resume analysis successful. Parsed:", parsed);

//     // Write extracted info back to Firestore
//     const analysisRef = doc(db, "Employees", userId, "resume_analysis", "data");
//     await setDoc(analysisRef, parsed);
//     console.log("📝 Analysis data written to Firestore");

//     return "Resume analysis complete and stored.";

//   } catch (error) {
//     console.error("🔥 Unexpected error during resume analysis:", error);
//     return "Error: Unexpected issue occurred.";
//   }
// };
// export default extract_resume;

// @/services/extract_resume.ts
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase";

export const extract_resume = async (
  base64: string,
  manualData: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
  }
): Promise<any> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) throw new Error("User not authenticated.");
  const userId = user.uid;

  const prompt = `Extract the following fields from this PDF resume and return the output strictly in JSON format as per the following schema:
  \`\`\`json
  {
    "name": "",
    "email": "",
    "phone": "",
    "skills": [],
    "education": [
      {
        "degree": "",
        "institution": "",
        "year": "",
        "grade": ""
      }
    ],
    "experience": [
      {
        "title": "",
        "company": "",
        "duration": "",
        "description": ""
      }
    ],
    "projects": [
      {
        "title": "",
        "description": ""
      }
    ],
    "certifications": [
      {
        "name": "",
        "issuer": "",
        "year": ""
      }
    ]
  }
  \`\`\`
  Extract only relevant fields from the resume.
  Do not include any explanation or commentary.
  If a field is not found, leave it empty or as an empty list.`;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key missing");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "application/pdf",
                  data: base64,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error("No text found in Gemini response");

  const match = text.match(/```json([\s\S]*?)```/);
  if (!match) throw new Error("Failed to parse JSON from Gemini response");

  const parsedData = JSON.parse(match[1].trim());

  // Merge manually entered fields (override Gemini values if needed)
  const finalData = {
    ...parsedData,
    name: manualData.name || parsedData.name || "",
    email: manualData.email || parsedData.email || "",
    phone: manualData.phone || parsedData.phone || "",
    linkedin: manualData.linkedin || "",
  };

  // Save merged data to Firestore
  const docRef = doc(db, "Employees", userId, "resume", "ParsedData");
  await setDoc(docRef, finalData);

  return finalData;
};
