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
