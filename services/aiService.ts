import { GoogleGenAI } from "@google/genai";
import { DashboardStats, DeptChartData } from '../types';

export const generateDashboardInsights = async (
  stats: DashboardStats,
  topDepts: DeptChartData[],
  year: string
): Promise<string> => {
  try {
    // Initialize Gemini API Client inside the function scope
    // This prevents "process is not defined" errors from crashing the entire app on load
    // and ensures the SDK is only instantiated when needed.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.warn("API Key is missing in process.env");
      return "Unable to access AI service. API Key is missing in the environment configuration.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const deptSummary = topDepts.slice(0, 5).map(d => `- ${d.name}: ${d.value} sheets`).join('\n');
    
    const prompt = `
      You are an expert Environmental Data Analyst. Analyze the paper usage data for our organization (${year === 'All' ? 'All Time' : `Year ${year}`}).

      **Key Statistics:**
      - Total Sheets Used: ${stats.totalSheets.toLocaleString()}
      - Total Print Requests: ${stats.totalRequests.toLocaleString()}
      - Estimated Cost: ${stats.estimatedCost.toLocaleString()} THB
      - Environmental Impact: ${stats.treesConsumed} trees consumed, ${stats.co2Emitted} kg CO2 emitted.
      - Efficiency: ${stats.sheetsSaved.toLocaleString()} sheets saved via double-sided printing.

      **Top 5 Departments by Usage:**
      ${deptSummary}

      **Task:**
      1. Provide a brief assessment of the current sustainability performance.
      2. Identify the biggest area of concern based on the department usage.
      3. Suggest 3 specific, actionable policies or tips to reduce paper consumption and costs.
      
      Keep the tone professional yet encouraging (Eco-friendly vibe). Format with clear headings or bullet points. Keep it under 200 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No insights could be generated at this time.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    return "An error occurred while communicating with the AI service. Please check your network connection or API quota.";
  }
};