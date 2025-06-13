
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface PDFExportProps {
  results: AnalysisResults;
  className?: string;
}

const PDFExport = ({ results, className }: PDFExportProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    
    try {
      // Create a temporary container for PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '800px';
      tempContainer.style.padding = '40px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Generate PDF content
      tempContainer.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">AI Job Readiness Analysis Report</h1>
          <p style="color: #6b7280; font-size: 16px;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
          <h2 style="font-size: 24px; margin-bottom: 15px;">Overall Job Readiness Score</h2>
          <div style="font-size: 48px; font-weight: bold;">${results.overallScore}%</div>
          <p style="margin-top: 10px; opacity: 0.9;">
            ${results.overallScore >= 80 ? "Excellent job readiness!" : 
              results.overallScore >= 60 ? "Good foundation, room for improvement" : 
              "Significant improvements needed"}
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Resume Analysis</h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #16a34a; font-size: 18px; margin-bottom: 10px;">✓ Strengths</h3>
            <ul style="margin-left: 20px;">
              ${results.resumeAnalysis.strengths.map(strength => `<li style="margin-bottom: 5px;">${strength}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px;">⚠ Areas for Improvement</h3>
            <ul style="margin-left: 20px;">
              ${results.resumeAnalysis.weaknesses.map(weakness => `<li style="margin-bottom: 5px;">${weakness}</li>`).join('')}
            </ul>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="font-size: 18px; margin-bottom: 10px;">ATS Compatibility Score: ${results.resumeAnalysis.atsScore}%</h3>
            <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
              <div style="background: ${results.resumeAnalysis.atsScore >= 80 ? '#16a34a' : results.resumeAnalysis.atsScore >= 60 ? '#eab308' : '#dc2626'}; height: 100%; width: ${results.resumeAnalysis.atsScore}%;"></div>
            </div>
            <ul style="margin-top: 15px; margin-left: 20px;">
              ${results.resumeAnalysis.suggestions.map(suggestion => `<li style="margin-bottom: 5px; font-size: 14px;">${suggestion}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">LinkedIn Profile Analysis</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="font-size: 18px; margin-bottom: 10px;">Profile Strength: ${results.linkedinAnalysis.profileStrength}%</h3>
            <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
              <div style="background: ${results.linkedinAnalysis.profileStrength >= 80 ? '#16a34a' : results.linkedinAnalysis.profileStrength >= 60 ? '#eab308' : '#dc2626'}; height: 100%; width: ${results.linkedinAnalysis.profileStrength}%;"></div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px;">Missing Elements</h3>
            <ul style="margin-left: 20px;">
              ${results.linkedinAnalysis.missingElements.map(element => `<li style="margin-bottom: 5px;">${element}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #2563eb; font-size: 18px; margin-bottom: 10px;">Recommendations</h3>
            <ul style="margin-left: 20px;">
              ${results.linkedinAnalysis.recommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Job Match Analysis</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="font-size: 18px; margin-bottom: 10px;">Job Match Score: ${results.jobMatch.matchPercentage}%</h3>
            <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
              <div style="background: ${results.jobMatch.matchPercentage >= 80 ? '#16a34a' : results.jobMatch.matchPercentage >= 60 ? '#eab308' : '#dc2626'}; height: 100%; width: ${results.jobMatch.matchPercentage}%;"></div>
            </div>
            <p style="margin-top: 10px; font-size: 14px;">Keyword Alignment: ${results.jobMatch.keywordAlignment}%</p>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #16a34a; font-size: 18px; margin-bottom: 10px;">Matching Skills</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${results.jobMatch.skillsMatch.map(skill => `<span style="background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 14px;">${skill}</span>`).join('')}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #dc2626; font-size: 18px; margin-bottom: 10px;">Skills Gap</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${results.jobMatch.skillsGap.map(skill => `<span style="background: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 20px; font-size: 14px;">${skill}</span>`).join('')}
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #2563eb; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Action Plan</h2>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #16a34a; font-size: 18px; margin-bottom: 10px;">Immediate Actions (This Week)</h3>
            <ul style="margin-left: 20px;">
              ${results.recommendations.immediate.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #2563eb; font-size: 18px; margin-bottom: 10px;">Short-term Goals (This Month)</h3>
            <ul style="margin-left: 20px;">
              ${results.recommendations.shortTerm.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 20px;">
            <h3 style="color: #7c3aed; font-size: 18px; margin-bottom: 10px;">Long-term Development (Next 3 Months)</h3>
            <ul style="margin-left: 20px;">
              ${results.recommendations.longTerm.map(action => `<li style="margin-bottom: 8px;">${action}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>This report was generated using AI analysis powered by Gemini.</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      `;

      document.body.appendChild(tempContainer);

      // Convert HTML to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `job-readiness-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF Export Successful",
        description: `Your analysis report has been downloaded as ${fileName}`,
      });

    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={generatePDF}
      disabled={isExporting}
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </>
      )}
    </Button>
  );
};

export default PDFExport;
