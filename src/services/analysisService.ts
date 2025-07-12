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
  
  private static BACKEND_URL = 'http://localhost:3000';

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

  // Make analyzeResumeWithGemini public so it can be called from Analysis.tsx
  public static async analyzeResumeWithGemini(pdfFile: File): Promise<any> {
    try {
      console.log("Encoding PDF as Base64 for Gemini (Brutal Analysis)...");
      const base64PDF = await this.convertPDFToBase64(pdfFile);
      console.log("Base64 Conversion Successful");

      // Use the full brutal analysis prompt provided by the user
      const brutalPrompt = `Professional Resume Analyzer - Industry Standards Compliance\n\nYou are a senior-level resume analyst and recruiting consultant with 15+ years of experience in talent acquisition across Fortune 500 companies. Your role is to provide brutally honest, industry-standard assessments that mirror real-world hiring decisions. Do not sugarcoat feedback - candidates need raw, actionable truth to compete effectively.\n\n## Core Mandate: BRUTAL HONESTY & INDUSTRY STANDARDS\n\n- Apply the same scrutiny used by top-tier companies (Google, Amazon, Microsoft, Goldman Sachs)\n- Identify resume flaws that would result in immediate rejection\n- Use harsh but constructive language when necessary\n- Focus on market realities, not feel-good advice\n- Benchmark against industry leaders and current market standards\n\n## Detailed Analysis Framework:\n\n### 1. Personal Information Audit\n**Extract and verify completeness:**\n- Full name (flag if unprofessional)\n- Phone number (format verification)\n- Professional email address (assess professionalism)\n- Physical address (relevance check)\n- LinkedIn profile URL (validate existence/quality)\n- GitHub profile URL (code quality assessment)\n- Portfolio/website (professional presentation)\n\n**RED FLAGS to identify:**\n- Unprofessional email addresses\n- Missing critical contact information\n- Broken or non-existent URLs\n- Inappropriate social media links\n\n### 2. Professional Content Dissection\n\n**Skills Analysis - Zero Tolerance for Fluff:**\n- Technical skills: Verify depth vs. breadth claims\n- Soft skills: Eliminate generic buzzwords\n- Certifications: Validate relevance and currency\n- Languages: Assess professional utility\n\n**Experience Evaluation - Results-Driven Focus:**\n- Job progression logic and timeline gaps\n- Quantifiable achievements (revenue, users, efficiency gains)\n- Leadership scope and team size\n- Industry reputation of employers\n- Role complexity and seniority appropriateness\n\n**Education Assessment:**\n- Institution prestige and program reputation\n- GPA disclosure (flag if missing for recent graduates)\n- Relevant coursework alignment with career goals\n- Continuing education and professional development\n\n**Projects Portfolio:**\n- Technical complexity and business impact\n- Individual vs. team contributions clarity\n- Technology stack relevance to target roles\n- Scalability and real-world application\n\n### 3. ATS Score - Industry Benchmark Standards\n\n**Scoring Methodology (1-100 scale):**\n\n**Technical Compliance (40 points):**\n- File format (.pdf preferred): __/10\n- Standard section headers: __/10\n- Keyword density and relevance: __/10\n- Font and formatting consistency: __/10\n\n**Content Quality (35 points):**\n- Quantified achievements: __/15\n- Industry-specific terminology: __/10\n- Progressive responsibility growth: __/10\n\n**Professional Presentation (25 points):**\n- Grammar and spelling accuracy: __/10\n- Logical flow and readability: __/10\n- Length appropriateness (1-2 pages): __/5\n\n**FINAL ATS SCORE: __/100**\n\n**Industry Benchmarks:**\n- 90-100: Top 5% - Premium companies ready\n- 80-89: Strong - Competitive for most roles\n- 70-79: Average - Needs targeted improvements\n- 60-69: Below par - Significant overhaul required\n- Below 60: Unemployable - Complete reconstruction needed\n\n### 4. Brutal Strengths & Weaknesses Assessment\n\n**Genuine Strengths (No False Praise):**\n- List only objectively impressive elements\n- Compare against industry standards\n- Highlight unique competitive advantages\n- Quantify impact where possible\n\n**Critical Weaknesses (No Mercy):**\n- Fatal flaws that guarantee rejection\n- Missing industry-standard requirements\n- Mediocre achievements presented as impressive\n- Formatting disasters and readability issues\n- Experience gaps and questionable transitions\n\n### 5. Professional Improvement Strategy & Actionable Recommendations\n\n**Immediate Critical Fixes (Next 24 Hours):**\n- Fix grammatical errors and typos with specific examples\n- Correct formatting inconsistencies (fonts, spacing, alignment)\n- Remove weak or irrelevant content that dilutes impact\n- Add missing critical information gaps\n- Restructure contact information for maximum accessibility\n\n**Strategic Content Overhauls (Next 1-2 Weeks):**\n\n**Achievement Rewriting Framework:**\n- Transform weak statements into STAR format (Situation, Task, Action, Result)\n- Add quantifiable metrics: percentages, dollar amounts, team sizes, timelines\n- Include specific technologies, methodologies, and tools used\n- Demonstrate progression and increasing responsibility\n\n**Content Enhancement Strategies:**\n- Reorganize sections for logical flow and maximum impact\n- Add industry-specific keywords and technical terminology\n- Create compelling summary/objective statements\n- Eliminate space-wasting fluff and redundant information\n- Optimize bullet points for ATS parsing and human readability\n\n**Professional Presentation Improvements:**\n- Implement consistent formatting hierarchy (headers, subheaders, body text)\n- Use professional typography and appropriate white space\n- Ensure consistent date formats and alignment\n- Create scannable sections with clear visual hierarchy\n- Optimize for both digital and print formats\n\n**Skill Development & Positioning:**\n\n**Technical Competency Gaps:**\n- Identify missing competencies for target roles with specific recommendations\n- Recommend industry-standard certifications with timelines and providers\n- Suggest portfolio projects to build credibility and demonstrate skills\n- Propose specific training programs or courses to address weaknesses\n\n**Professional Branding Enhancements:**\n- Develop compelling personal brand statement\n- Align LinkedIn profile with resume messaging\n- Create consistent professional narrative across all platforms\n- Establish thought leadership through relevant content creation\n\n**Industry-Specific Optimization:**\n- Tailor resume variations for different target roles\n- Research and incorporate company-specific keywords\n- Align experience descriptions with job posting requirements\n- Create industry-relevant case studies and examples\n\n**Advanced Professional Suggestions:**\n\n**Networking & Visibility Strategy:**\n- Leverage professional associations and industry groups\n- Develop strategic LinkedIn content calendar\n- Identify and engage with industry influencers\n- Build portfolio of published work or speaking engagements\n\n**Interview Preparation Alignment:**\n- Prepare detailed STAR stories for each resume bullet point\n- Develop portfolio pieces that demonstrate claimed skills\n- Create presentation materials that support resume claims\n- Practice articulating value proposition clearly and concisely\n\n**Long-term Career Positioning:**\n- Identify clear career progression pathway\n- Develop strategic skill acquisition plan\n- Build measurable track record of results\n- Create professional development timeline with milestones\n\n### 6. Market Reality Check\n\n**Industry Competitiveness Assessment:**\n- Current market saturation in candidate's field\n- Salary expectations vs. resume strength\n- Geographic market considerations\n- Remote work viability\n\n**Hiring Manager Perspective:**\n- First impression impact (5-second scan test)\n- Interview invitation likelihood\n- Perceived seniority and compensation level\n- Cultural fit indicators\n\n**Competitive Positioning:**\n- Ranking against typical candidate pool\n- Unique value proposition strength\n- Market differentiation factors\n\n## Output Standards:\n\n**Language Requirements:**\n- Use direct, unambiguous language\n- Avoid diplomatic softening of harsh truths\n- Provide specific, actionable recommendations\n- Include industry statistics where relevant\n\n**Professional Tone:**\n- Maintain respect while delivering hard truths\n- Focus on business impact and ROI\n- Use recruiter and hiring manager terminology\n- Reference real-world hiring scenarios\n\n**Professional Improvement Examples:**\n\n**Before/After Transformations:**\n- Provide specific examples of weak statements and their improved versions\n- Show how to quantify achievements effectively\n- Demonstrate proper keyword integration techniques\n- Illustrate optimal formatting and structure choices\n\n**Industry Best Practices:**\n- Share proven templates and formats that work\n- Provide examples of compelling summary statements\n- Demonstrate effective use of action verbs and power words\n- Show how to handle employment gaps and career transitions\n\n**Competitive Positioning Strategy:**\n- Analyze top performers in candidate's field\n- Identify unique value propositions to emphasize\n- Recommend differentiation strategies\n- Suggest ways to stand out in crowded markets\n\n**Technology and Tools Recommendations:**\n- Suggest specific software for resume optimization\n- Recommend ATS-friendly formatting tools\n- Provide resources for skills assessment and improvement\n- Share platforms for building professional portfolios\n\n**Follow-up Action Plan:**\n- Create prioritized improvement checklist with deadlines\n- Establish measurable milestones for progress tracking\n- Provide templates and resources for implementation\n- Include quality assurance checkpoints for validation\n\n## Critical Success Factors:\n\n1. **Zero Tolerance for Mediocrity:** If it's not impressive by industry standards, call it out\n2. **Quantify Everything:** Provide specific metrics and benchmarks\n3. **Reality-Based Feedback:** Ground all advice in actual hiring practices\n4. **Competitive Context:** Always compare against top-tier candidates\n5. **ROI Focus:** Emphasize changes that maximize interview potential\n\n**Remember:** Your job is to prepare candidates for the brutal reality of modern hiring, not to make them feel good about subpar work. Be the harsh but necessary voice they need to hear.\n\nNow analyze the provided resume with uncompromising professional standards.\n\nReturn your analysis strictly as a valid JSON object with the following structure (do not include any extra text, explanations, or markdown):\n{\n  "atsScore": <number>,\n  "atsSubscores": {\n    "contentQuality": <number>,\n    "visualDesign": <number>,\n    "readability": <number>,\n    "technicalCompliance": <number>\n  },\n  "strengths": [<string>],\n  "weaknesses": [<string>],\n  "atsImprovementTips": [<string>],\n  "resumeImprovementTips": [<string>],\n  "personalInfo": {<key>: <value>},\n  "improvementDirectives": {\n    "immediate": [<string>],\n    "strategic": [<string>],\n    "skillDevelopment": [<string>]\n  },\n  "projects": [<string>],\n  "marketReality": {<key>: <value>},\n  "hiringManagerPerspective": {<key>: <value>},\n  "competitivePositioning": {<key>: <value>}\n}\nDO NOT include markdown, explanations, or any text outside the JSON object. Only output valid JSON.`;

      const requestPayload = {
        contents: [
          {
            parts: [
              { text: brutalPrompt },
              { inlineData: { mimeType: "application/pdf", data: base64PDF } }
            ]
          }
        ],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 4096 }
      };

      console.log("Sending PDF and Brutal Analysis Prompt to Gemini...");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error (Brutal):", errorData);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      console.log("Gemini Brutal Analysis (raw text):", rawText);

      // Extract JSON from Gemini output
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Failed to find JSON in Gemini brutal analysis response:", rawText);
        throw new Error("Gemini brutal analysis response does not contain valid JSON.");
      }
      const cleanedResponse = jsonMatch[0];
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (error) {
        console.error("Failed to parse Gemini brutal analysis response:", cleanedResponse);
        throw new Error("Gemini brutal analysis returned an invalid JSON format.");
      }
      // Normalize ATS subscores if present
      if (parsed.atsSubscores) {
        parsed.atsSubscores = this.normalizeATSSubscores(parsed.atsSubscores);
      }
      // --- Ensure education, experience, and skills are always present ---
      if (!parsed.education || !parsed.education.length || !parsed.experience || !parsed.experience.length || !parsed.skills || !parsed.skills.length) {
        try {
          const extracted = await this.extractResumeProfileData(pdfFile);
          if (!parsed.education || !parsed.education.length) parsed.education = extracted.education;
          if (!parsed.experience || !parsed.experience.length) parsed.experience = extracted.experience;
          if (!parsed.skills || !parsed.skills.length) parsed.skills = extracted.skills;
        } catch (extractionError) {
          console.error("Fallback extraction of education/experience/skills failed:", extractionError);
          // fallback: leave as empty arrays
          parsed.education = parsed.education || [];
          parsed.experience = parsed.experience || [];
          parsed.skills = parsed.skills || [];
        }
      }
      // --- Ensure projects are always mapped to { name, brief } objects for Profile page, with 5-6 line brief ---
      if (parsed.projects && Array.isArray(parsed.projects)) {
        parsed.projects = await Promise.all(parsed.projects.map(async (proj: any) => {
          let name = '', brief = '';
          if (typeof proj === 'object' && proj !== null) {
            name = proj.name || proj.title || '';
            brief = proj.brief || proj.summary || '';
          } else if (typeof proj === 'string') {
            const match = proj.match(/^(.*?):\s*(.*)$/);
            if (match) {
              name = match[1].trim();
              brief = match[2] ? match[2].trim() : '';
            } else {
              name = proj;
              brief = '';
            }
          }
          // If brief is too short, expand it to 5-6 lines using Gemini
          if (brief.split(/[.!?]\s/).length < 5 && brief.length > 0) {
            try {
              const expansionPrompt = `Expand the following project description into a detailed, 5-6 sentence summary, including tools, technologies, challenges, impact, and your specific contributions. Do not add information not present in the original, but elaborate on all aspects mentioned.\n\nOriginal Description:\n${brief}`;
              const expanded = await AnalysisService.sendToGemini(expansionPrompt);
              // Extract only the expanded text (strip any markdown or extra text)
              const expandedText = expanded.replace(/^[`]*[a-zA-Z]*\n*/, '').trim();
              brief = expandedText;
            } catch (expErr) {
              // fallback: keep original brief
            }
          }
          return { name, brief };
        }));
      } else {
        parsed.projects = [];
      }
      return parsed;
    } catch (error) {
      console.error("Gemini API Call Failed (Brutal):", error);
      throw new Error("Failed to communicate with Gemini API (Brutal Analysis).");
    }
  }

  /**
   * Brutally honest, industry-standard resume analysis for the Analysis page
   * Uses the full user-provided prompt for deep, ATS-style, harsh analysis
   * Returns a structured Gemini output (JSON object) for display.
   */
  public static async analyzeResumeWithGeminiBrutal(pdfFile: File): Promise<any> {
    try {
      console.log("Encoding PDF as Base64 for Gemini (Brutal Analysis)...");
      const base64PDF = await this.convertPDFToBase64(pdfFile);
      console.log("Base64 Conversion Successful");

      // FULL brutal analysis prompt (no truncation)
      const brutalPrompt = `Professional Resume Analyzer - Industry Standards Compliance
You are a senior-level resume analyst and recruiting consultant with 15+ years of experience in talent acquisition across Fortune 500 companies. Your role is to provide brutally honest, industry-standard assessments that mirror real-world hiring decisions. Do not sugarcoat feedback - candidates need raw, actionable truth to compete effectively.

Core Mandate: BRUTAL HONESTY & INDUSTRY STANDARDS
Apply the same scrutiny used by top-tier companies (Google, Amazon, Microsoft, Goldman Sachs)
Identify resume flaws that would result in immediate rejection
Use harsh but constructive language when necessary
Focus on market realities, not feel-good advice
Benchmark against industry leaders and current market standards
Detailed Analysis Framework:
1. Personal Information Audit
Extract and verify completeness:
Full name (flag if unprofessional)
Phone number (format verification)
Professional email address (assess professionalism)
Physical address (relevance check)
LinkedIn profile URL (validate existence/quality)
GitHub profile URL (code quality assessment)
Portfolio/website (professional presentation)
RED FLAGS to identify:
Unprofessional email addresses
Missing critical contact information
Broken or non-existent URLs
Inappropriate social media links
2. Professional Content Dissection
Skills Analysis - Zero Tolerance for Fluff:
Technical skills: Verify depth vs. breadth claims
Soft skills: Eliminate generic buzzwords
Certifications: Validate relevance and currency
Languages: Assess professional utility
Experience Evaluation - Results-Driven Focus:
Job progression logic and timeline gaps
Quantifiable achievements (revenue, users, efficiency gains)
Leadership scope and team size
Industry reputation of employers
Role complexity and seniority appropriateness
Education Assessment:
Institution prestige and program reputation
GPA disclosure (flag if missing for recent graduates)
Relevant coursework alignment with career goals
Continuing education and professional development
Projects Portfolio:
Technical complexity and business impact
Individual vs. team contributions clarity
Technology stack relevance to target roles
Scalability and real-world application
3. ATS Score & Visual Design Analysis - Industry Benchmark Standards
Scoring Methodology (1-100 scale):
Technical Compliance (25 points):
File format (.pdf preferred): __/8
Standard section headers: __/8
Keyword density and relevance: __/9
Content Quality (30 points):
Quantified achievements: __/12
Industry-specific terminology: __/9
Progressive responsibility growth: __/9
Visual Design & Layout (25 points):
Typography and font choices: __/6
White space utilization: __/6
Visual hierarchy and organization: __/6
Color scheme and professional aesthetics: __/4
Consistency in formatting elements: __/3
Readability & Clarity (20 points):
Scanning ease (5-second test): __/8
Information density balance: __/6
Grammar and spelling accuracy: __/6
FINAL ATS SCORE: __/100
Industry Benchmarks:
90-100: Top 5% - Premium companies ready
80-89: Strong - Competitive for most roles
70-79: Average - Needs targeted improvements
60-69: Below par - Significant overhaul required
Below 60: Unemployable - Complete reconstruction needed
4. Brutal Strengths & Weaknesses Assessment
Genuine Strengths (No False Praise):
List only objectively impressive elements
Compare against industry standards
Highlight unique competitive advantages
Quantify impact where possible
Critical Weaknesses (No Mercy):
Fatal flaws that guarantee rejection
Missing industry-standard requirements
Mediocre achievements presented as impressive
Formatting disasters and readability issues
Experience gaps and questionable transitions
5. Professional Improvement Strategy & Actionable Recommendations
Immediate Critical Fixes (Next 24 Hours):
Fix grammatical errors and typos with specific examples
Correct formatting inconsistencies (fonts, spacing, alignment)
Remove weak or irrelevant content that dilutes impact
Add missing critical information gaps
Restructure contact information for maximum accessibility
Strategic Content Overhauls (Next 1-2 Weeks):
Achievement Rewriting Framework:
Transform weak statements into STAR format (Situation, Task, Action, Result)
Add quantifiable metrics: percentages, dollar amounts, team sizes, timelines
Include specific technologies, methodologies, and tools used
Demonstrate progression and increasing responsibility
Content Enhancement Strategies:
Reorganize sections for logical flow and maximum impact
Add industry-specific keywords and technical terminology
Create compelling summary/objective statements
Eliminate space-wasting fluff and redundant information
Optimize bullet points for ATS parsing and human readability
Professional Presentation Improvements:
Implement consistent formatting hierarchy (headers, subheaders, body text)
Use professional typography and appropriate white space
Ensure consistent date formats and alignment
Create scannable sections with clear visual hierarchy
Optimize for both digital and print formats
Skill Development & Positioning:
Technical Competency Gaps:
Identify missing competencies for target roles with specific recommendations
Recommend industry-standard certifications with timelines and providers
Suggest portfolio projects to build credibility and demonstrate skills
Propose specific training programs or courses to address weaknesses
Professional Branding Enhancements:
Develop compelling personal brand statement
Align LinkedIn profile with resume messaging
Create consistent professional narrative across all platforms
Establish thought leadership through relevant content creation
Industry-Specific Optimization:
Tailor resume variations for different target roles
Research and incorporate company-specific keywords
Align experience descriptions with job posting requirements
Create industry-relevant case studies and examples
Advanced Professional Suggestions:
Networking & Visibility Strategy:
Leverage professional associations and industry groups
Develop strategic LinkedIn content calendar
Identify and engage with industry influencers
Build portfolio of published work or speaking engagements
Interview Preparation Alignment:
Prepare detailed STAR stories for each resume bullet point
Develop portfolio pieces that demonstrate claimed skills
Create presentation materials that support resume claims
Practice articulating value proposition clearly and concisely
Long-term Career Positioning:
Identify clear career progression pathway
Develop strategic skill acquisition plan
Build measurable track record of results
Create professional development timeline with milestones
7. Visual Design & Layout Assessment
Typography & Readability Analysis:
Font selection appropriateness (professional vs. casual)
Font size consistency and hierarchy (headers, subheaders, body text)
Line spacing and paragraph spacing optimization
Text density and readability balance
Use of bold, italics, and emphasis appropriately
Visual Design Evaluation:
Overall aesthetic appeal and professionalism
Color scheme effectiveness (if applicable)
Visual balance and symmetry
Consistent margins and padding
Professional presentation quality
Layout Structure Assessment:
Logical information flow and organization
Section separation and clarity
White space utilization effectiveness
Visual hierarchy strength
Scanning ease and eye movement patterns
Design Scoring Breakdown:
Typography Quality: __/25
Visual Aesthetics: __/25
Layout Organization: __/25
Readability Factor: __/25
Overall Design Score: __/100
Design Benchmarks:
90-100: Exceptional - Visually stunning and highly professional
80-89: Strong - Clean, professional, and well-organized
70-79: Adequate - Functional but unremarkable
60-69: Poor - Formatting issues that detract from content
Below 60: Unacceptable - Major design flaws that guarantee rejection
8. Layout & Design Improvement Recommendations
Immediate Visual Fixes:
Font standardization and size corrections
Spacing and alignment adjustments
Color scheme optimization for professionalism
Header hierarchy establishment
Margin and padding corrections
Professional Design Enhancements:
Implementation of consistent visual branding
Strategic use of white space for improved readability
Professional color palette recommendations
Typography improvements for better impact
Section divider and visual element optimization
Layout Restructuring Strategy:
Optimal section ordering for maximum impact
Information grouping and categorization
Visual flow optimization for scanning
Balance between text density and white space
Mobile and print format considerations
Design Best Practices Implementation:
Industry-standard resume templates and layouts
Professional typography guidelines
Color psychology for business documents
Visual hierarchy principles for effective communication
Cross-platform compatibility considerations
Specific Design Critiques:
Identify cramped or cluttered sections
Flag inconsistent formatting elements
Highlight poor font choices or mixing
Point out distracting design elements
Call out unprofessional visual choices
Tools & Resources for Design Improvement:
Professional resume design software recommendations
Template sources for industry-specific layouts
Typography and color palette generators
PDF optimization tools for file quality
Print and digital format testing guidelines
9. Market Reality Check
Industry Competitiveness Assessment:
Current market saturation in candidate's field
Salary expectations vs. resume strength
Geographic market considerations
Remote work viability
Hiring Manager Perspective:
First impression impact (5-second scan test)
Interview invitation likelihood
Perceived seniority and compensation level
Cultural fit indicators
Competitive Positioning:
Ranking against typical candidate pool
Unique value proposition strength
Market differentiation factors
Output Standards:
Use direct, unambiguous language
Avoid diplomatic softening of harsh truths
Provide specific, actionable recommendations
Include industry statistics where relevant
Professional Tone:
Maintain respect while delivering hard truths
Focus on business impact and ROI
Use recruiter and hiring manager terminology
Reference real-world hiring scenarios
Professional Improvement Examples:
Before/After Transformations:
Provide specific examples of weak statements and their improved versions
Show how to quantify achievements effectively
Demonstrate proper keyword integration techniques
Illustrate optimal formatting and structure choices
Industry Best Practices:
Share proven templates and formats that work
Provide examples of compelling summary statements
Demonstrate effective use of action verbs and power words
Show how to handle employment gaps and career transitions
Competitive Positioning Strategy:
Analyze top performers in candidate's field
Identify unique value propositions to emphasize
Recommend differentiation strategies
Suggest ways to stand out in crowded markets
Technology and Tools Recommendations:
Suggest specific software for resume optimization
Recommend ATS-friendly formatting tools
Provide resources for skills assessment and improvement
Share platforms for building professional portfolios
Follow-up Action Plan:
Create prioritized improvement checklist with deadlines
Establish measurable milestones for progress tracking
Provide templates and resources for implementation
Include quality assurance checkpoints for validation
Critical Success Factors:
Zero Tolerance for Mediocrity: If it's not impressive by industry standards, call it out
Quantify Everything: Provide specific metrics and benchmarks
Reality-Based Feedback: Ground all advice in actual hiring practices
Competitive Context: Always compare against top-tier candidates
ROI Focus: Emphasize changes that maximize interview potential
Remember: Your job is to prepare candidates for the brutal reality of modern hiring, not to make them feel good about subpar work. Be the harsh but necessary voice they need to hear.

Now analyze the provided resume with uncompromising professional standards.

Return your analysis strictly as a valid JSON object with the following structure (do not include any extra text, explanations, or markdown):
{
  "atsScore": <number>,
  "atsSubscores": {
    "contentQuality": <number>,
    "visualDesign": <number>,
    "readability": <number>,
    "technicalCompliance": <number>
  },
  "strengths": [<string>],
  "weaknesses": [<string>],
  "atsImprovementTips": [<string>],
  "resumeImprovementTips": [<string>],
  "personalInfo": {<key>: <value>},
  "improvementDirectives": {
    "immediate": [<string>],
    "strategic": [<string>],
    "skillDevelopment": [<string>]
  },
  "projects": [<string>],
  "marketReality": {<key>: <value>},
  "hiringManagerPerspective": {<key>: <value>},
  "competitivePositioning": {<key>: <value>}
}
DO NOT include markdown, explanations, or any text outside the JSON object. Only output valid JSON.`;

      const requestPayload = {
        contents: [
          {
            parts: [
              { text: brutalPrompt },
              { inlineData: { mimeType: "application/pdf", data: base64PDF } }
            ]
          }
        ],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 4096 }
      };

      console.log("Sending PDF and Brutal Analysis Prompt to Gemini...");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error (Brutal):", errorData);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      console.log("Gemini Brutal Analysis (raw text):", rawText);

      // Extract JSON from Gemini output
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Failed to find JSON in Gemini brutal analysis response:", rawText);
        throw new Error("Gemini brutal analysis response does not contain valid JSON.");
      }
      const cleanedResponse = jsonMatch[0];
      let parsed;
      try {
        parsed = JSON.parse(cleanedResponse);
      } catch (error) {
        console.error("Failed to parse Gemini brutal analysis response:", cleanedResponse);
        throw new Error("Gemini brutal analysis returned an invalid JSON format.");
      }
      // Normalize ATS subscores if present
      if (parsed.atsSubscores) {
        parsed.atsSubscores = this.normalizeATSSubscores(parsed.atsSubscores);
      }
      // --- Ensure education, experience, and skills are always present ---
      if (!parsed.education || !parsed.education.length || !parsed.experience || !parsed.experience.length || !parsed.skills || !parsed.skills.length) {
        try {
          const extracted = await this.extractResumeProfileData(pdfFile);
          if (!parsed.education || !parsed.education.length) parsed.education = extracted.education;
          if (!parsed.experience || !parsed.experience.length) parsed.experience = extracted.experience;
          if (!parsed.skills || !parsed.skills.length) parsed.skills = extracted.skills;
        } catch (extractionError) {
          console.error("Fallback extraction of education/experience/skills failed:", extractionError);
          // fallback: leave as empty arrays
          parsed.education = parsed.education || [];
          parsed.experience = parsed.experience || [];
          parsed.skills = parsed.skills || [];
        }
      }
      // --- Ensure projects are always mapped to { name, brief } objects for Profile page, with 5-6 line brief ---
      if (parsed.projects && Array.isArray(parsed.projects)) {
        parsed.projects = await Promise.all(parsed.projects.map(async (proj: any) => {
          let name = '', brief = '';
          if (typeof proj === 'object' && proj !== null) {
            name = proj.name || proj.title || '';
            brief = proj.brief || proj.summary || '';
          } else if (typeof proj === 'string') {
            const match = proj.match(/^(.*?):\s*(.*)$/);
            if (match) {
              name = match[1].trim();
              brief = match[2] ? match[2].trim() : '';
            } else {
              name = proj;
              brief = '';
            }
          }
          // If brief is too short, expand it to 5-6 lines using Gemini
          if (brief.split(/[.!?]\s/).length < 5 && brief.length > 0) {
            try {
              const expansionPrompt = `Expand the following project description into a detailed, 5-6 sentence summary, including tools, technologies, challenges, impact, and your specific contributions. Do not add information not present in the original, but elaborate on all aspects mentioned.\n\nOriginal Description:\n${brief}`;
              const expanded = await AnalysisService.sendToGemini(expansionPrompt);
              // Extract only the expanded text (strip any markdown or extra text)
              const expandedText = expanded.replace(/^[`]*[a-zA-Z]*\n*/, '').trim();
              brief = expandedText;
            } catch (expErr) {
              // fallback: keep original brief
            }
          }
          return { name, brief };
        }));
      } else {
        parsed.projects = [];
      }
      return parsed;
    } catch (error) {
      console.error("Gemini API Call Failed (Brutal):", error);
      throw new Error("Failed to communicate with Gemini API (Brutal Analysis).");
    }
  }

  /**
   * Structured extraction for profile page (education, experience, skills)
   * Uses the structured extraction prompt only
   */
  public static async extractResumeProfileData(pdfFile: File): Promise<{ education: any[], experience: any[], skills: string[] }> {
    try {
      console.log("Encoding PDF as Base64 for Gemini (Profile Extraction)...");
      const base64PDF = await this.convertPDFToBase64(pdfFile);
      console.log("Base64 Conversion Successful");

      // Structured extraction prompt (for profile page)
      const mainPrompt = `# Resume Data Extractor - Structured Information Parser\n\nYou are a precise resume data extraction specialist. Your task is to analyze the provided resume and extract key information in a specific structured format for frontend consumption. Extract only factual information from the resume without adding assumptions or external data.\n\n## Extraction Requirements:\n\n### Data Categories to Extract:\n1. **Education** - All educational qualifications\n2. **Experience** - All work experience entries\n3. **Skills** - All technical and professional skills mentioned\n\n## Output Format Requirements:\n\n### EDUCATION Section:\nFor each educational qualification, provide:\n\nEDUCATION\nName of Institute: [Exact institution name as written]\nLocation: [City, State/Country as mentioned]\nGrade: [GPA, percentage, or grade if mentioned, otherwise \"Not specified\"]\n\n### EXPERIENCE Section:\nFor each work experience, provide:\n\nEXPERIENCE\nName of Company: [Exact company name as written]\nLocation: [City, State/Country as mentioned]\nBrief Job: [Paraphrased summary of role and key responsibilities in 2-3 sentences, maintaining all important details including technologies used, achievements, and scope of work]\n\n### SKILLS Section:\nList all skills categorically:\n\nSKILLS\nTechnical Skills: [Programming languages, frameworks, tools, software]\nProfessional Skills: [Management, leadership, communication, etc.]\nCertifications: [Any certifications mentioned]\nLanguages: [Spoken/written languages if mentioned]\n`;

      const requestPayload = {
        contents: [
          {
            parts: [
              { text: mainPrompt },
              { inlineData: { mimeType: "application/pdf", data: base64PDF } }
            ]
          }
        ],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
      };

      console.log("Sending PDF and Profile Extraction Prompt to Gemini...");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error (Profile Extraction):", errorData);
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      console.log("Gemini Profile Extraction (raw text):", rawText);

      // Extract raw education, experience, and skills text blocks
      const educationBlocks = rawText.match(/EDUCATION[\s\S]*?(?=EDUCATION|EXPERIENCE|SKILLS|$)/g) || [];
      const experienceBlocks = rawText.match(/EXPERIENCE[\s\S]*?(?=EDUCATION|EXPERIENCE|SKILLS|$)/g) || [];
      const skillsBlockMatch = rawText.match(/SKILLS[\s\S]*$/);
      const educationText = educationBlocks.join("\n").replace(/EDUCATION/g, "").trim();
      const experienceText = experienceBlocks.join("\n").replace(/EXPERIENCE/g, "").trim();
      const skillsText = skillsBlockMatch ? skillsBlockMatch[0].replace(/SKILLS/g, "").trim() : "";

      // Debug: Log the extracted text blocks for the profile
      console.log("[Gemini Extraction] educationText:", educationText);
      console.log("[Gemini Extraction] experienceText:", experienceText);
      console.log("[Gemini Extraction] skillsText:", skillsText);

      // Run the highly structured extraction step
      let structured = { education: [], experience: [], skills: [] };
      try {
        structured = await this.postProcessEducationExperience(educationText, experienceText, skillsText);
      } catch (err) {
        console.error("Structured extraction failed, falling back to raw blocks.", err);
        // fallback: treat each block as a string entry
        structured.education = educationBlocks.length ? educationBlocks.map(b => b.replace(/EDUCATION/g, "").trim()) : [];
        structured.experience = experienceBlocks.length ? experienceBlocks.map(b => b.replace(/EXPERIENCE/g, "").trim()) : [];
        structured.skills = skillsText ? skillsText.split(/,|\n/).map(s => s.trim()).filter(Boolean) : [];
      }

      // Always return the structured output for education, experience, and skills
      return {
        education: structured.education,
        experience: structured.experience,
        skills: structured.skills,
      };
    } catch (error) {
      console.error("Gemini API Call Failed (Profile Extraction):", error);
      throw new Error("Failed to communicate with Gemini API (Profile Extraction).");
    }
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

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
    if (!jsonMatch) {
      console.error("Failed to find JSON in Gemini response:", rawResponse);
      throw new Error("Gemini response does not contain valid JSON.");
    }

    const cleanedResponse = jsonMatch[0];

    try {
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse Gemini response:", cleanedResponse);
      throw new Error("Gemini returned an invalid JSON format.");
    }
  }

  private static async sendToGemini(prompt: string): Promise<string> {
    try {
      console.log("Sending Request to Gemini API...");
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

  // If you have extracted raw education/experience/skills text, analyze it again for structured output
  // Gemini prompt for post-processing extracted education/experience/skills text
  private static async postProcessEducationExperience(educationText: string, experienceText: string, skillsText: string): Promise<{ education: any[], experience: any[], skills: string[] }> {
    const postProcessPrompt = `You are an expert resume parser. Given the following extracted education, experience, and skills text, return a JSON array for each section with the following structure:

For education, each entry must have:
- "institution": Name of institution (capitalize only the first letter, rest lowercase, e.g. 'Stanford university')
- "location": Location (city, state/country)
- "grade": Grade or GPA if present, else empty string

For experience, each entry must have:
- "company": Name of company (capitalize only the first letter, rest lowercase)
- "role": Job title (capitalize only the first letter, rest lowercase)
- "duration": Dates or years
- "summary": A brief, 5-6 sentence summary of the experience, shortened and focused on the most important details

For skills, extract all unique skills (technical, soft, tools, languages, etc.) mentioned anywhere in the resume. Return as a flat array of strings, no duplicates, and ensure all are relevant. Do not group or categorize, just a single array.

Format each field on a separate line in the JSON output. Only the institution/company name should be bold (if rendering as HTML/Markdown, but here just plain text). Do not bold other fields. Do not return any extra text, only the JSON.

Input:
EDUCATION TEXT:
<EDUCATION_TEXT>

EXPERIENCE TEXT:
<EXPERIENCE_TEXT>

SKILLS TEXT:
<SKILLS_TEXT>

Return:
{
  "education": [ { "institution": ..., "location": ..., "grade": ... } ],
  "experience": [ { "company": ..., "role": ..., "duration": ..., "summary": ... } ],
  "skills": [<string>]
}`;

    const rawResponse = await this.sendToGemini(postProcessPrompt);

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to find JSON in Gemini response:", rawResponse);
      throw new Error("Gemini response does not contain valid JSON.");
    }

    const cleanedResponse = jsonMatch[0];

    try {
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse Gemini response:", cleanedResponse);
      throw new Error("Gemini returned an invalid JSON format.");
    }
  }

  // Helper to normalize ATS subscores to 0-100
  private static normalizeATSSubscores(subscores: any) {
    // Known max values from prompt
    const max = {
      contentQuality: 30,
      visualDesign: 25,
      readability: 20,
      technicalCompliance: 25
    };
    if (!subscores) return { contentQuality: 0, visualDesign: 0, readability: 0, technicalCompliance: 0 };
    return {
      contentQuality: Math.round((Number(subscores.contentQuality || 0) / max.contentQuality) * 100),
      visualDesign: Math.round((Number(subscores.visualDesign || 0) / max.visualDesign) * 100),
      readability: Math.round((Number(subscores.readability || 0) / max.readability) * 100),
      technicalCompliance: Math.round((Number(subscores.technicalCompliance || 0) / max.technicalCompliance) * 100)
    };
  }
}

// export interface LinkedInProfile {
//   name: string;
//   headline: string;
//   experience: string[];
//   skills: string[];
//   education: string[];
// }

export interface LinkedInProfile {
  name: string;
  headline: string;
  experience: string[];
  skills: string[];
  education: string[];
}