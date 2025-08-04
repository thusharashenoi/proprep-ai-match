// Load Gemini API key from environment
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load Gemini API key from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("❌ Gemini API key not found in environment variables.");
  throw new Error("Gemini API key is required.");
}

// ✅ You forgot this line
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Analyze a base64-encoded JD PDF and extract structured job info.
 * @param base64PDF - PDF in base64 format (no data URL prefix)
 * @returns Extracted job fields as JSON
 */
export async function analyzeBase64JDWithGemini(base64PDF: string): Promise<any> {
  console.log("📤 Sending base64 JD to Gemini for analysis...");

  const model = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash",
  });

  const prompt = `
You are a recruiter AI. Analyze this job description PDF and extract the following:
- category (e.g., Data Science, AI, Marketing)
- role (e.g., Software Engineer)
- location
- type (Full Time, Part Time, Internship, Contract)
- pay (salary, stipend, etc.)
- description (full description)
- requirements (qualifications and skills)
- priority (High, Medium, Low) [you can guess based on urgency tone]

Return a JSON in the format:
{
  "category": "",
  "role": "",
  "location": "",
  "type": "",
  "pay": "",
  "description": "",
  "requirements": "",
  "priority": ""
}
`;

  try {
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "application/pdf", data: base64PDF } },
    ]);

    const rawResponse = result.response.text();
    console.log("📥 Raw Gemini response:", rawResponse);

    const jsonStart = rawResponse.indexOf("{");
    const jsonEnd = rawResponse.lastIndexOf("}") + 1;
    const jsonString = rawResponse.slice(jsonStart, jsonEnd);

    const parsed = JSON.parse(jsonString);

    console.log("✅ Parsed JD JSON:", parsed);

    return parsed;
  } catch (err) {
    console.error("❌ Failed to analyze JD with Gemini:", err);
    throw new Error("JD analysis failed");
  }
}
