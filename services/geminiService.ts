import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

// Lazy initialization to ensure process.env is ready when called
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeText = async (text: string, prompt: string): Promise<AIAnalysisResult | null> => {
  try {
    const ai = getAIClient();
    const model = "gemini-3-flash-preview";
    
    // We want a structured JSON response for the UI to render nicely
    const response = await ai.models.generateContent({
      model: model,
      contents: `
        Analyze the following text based on this user prompt: "${prompt}".
        
        Text to analyze:
        """
        ${text.substring(0, 3000)}
        """
        
        Provide a deep literary analysis. 
        Return JSON with a 'summary' paragraph and a list of 3 distinct 'points'.
        Each point should have a short 'title' (max 5 words) and a 'description'.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            points: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "description"]
              }
            }
          },
          required: ["summary", "points"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    return null;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
