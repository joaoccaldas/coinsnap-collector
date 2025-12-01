services/geminiService.tsimport { GoogleGenAI } from "@google/genai";
import { CoinAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const identifyCoin = async (frontImage: string, backImage: string): Promise<CoinAnalysisResult> => {
  // Remove data URL prefix
  const cleanFront = frontImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  const cleanBack = backImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        {
          text: `You are an expert numismatist. Analyze the provided images of a coin (Front/Obverse and Back/Reverse). 
          
          Identify the coin, its origin, year, denomination, and composition.
          SEARCH for the current market value (in USD) and assess its rarity based on mintage numbers and current collector demand.
          
          Determine if the coin is considered "Rare" (e.g., low mintage, high value > $100, key date, error coin, or historical significance).
          Estimate the condition (e.g., Poor, Good, Fine, Mint) based on visual wear.

          CRITICAL FOR ESTIMATED VALUE:
          - Return a SINGLE NUMBER for "estimatedValue" (e.g., 10.50).
          - If a price range is found (e.g., $10-$20), return the average (e.g., 15).
          - If the value is purely face value, return that amount.
          - Do NOT return strings like "10-20", "$10", or "varies".
          - If the value is completely unknown/unfindable, return 0.

          Return a JSON object with the following structure:
          {
            "name": "Full name of the coin",
            "year": 1999 (number or null),
            "country": "Country Name",
            "denomination": "Face Value",
            "estimatedValue": 10.50,
            "composition": "Silver, Gold, etc.",
            "description": "Brief history and facts",
            "conditionEstimate": "Visual grade",
            "isRare": true/false,
            "rarityDetails": "Why is it rare? or 'Common coin' if not rare."
          }
          
          IMPORTANT: Return ONLY the JSON object. Do not include markdown formatting like \`\`\`json.`
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanFront,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBack,
          },
        }
      ],
    },
    config: {
      // search grounding for live market data
      tools: [{ googleSearch: {} }],
      // responseMimeType and responseSchema are NOT allowed with googleSearch
    },
  });

  if (!response.text) {
    throw new Error("No analysis result returned from Gemini.");
  }

  // Extract sources from grounding metadata
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map(chunk => chunk.web?.uri)
    .filter((uri): uri is string => !!uri) || [];

  // Parse JSON from the text response (which might contain grounding artifacts or markdown)
  try {
    let jsonString = response.text;
    // Attempt to extract JSON if wrapped in code blocks or mixed with text
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    const result = JSON.parse(jsonString) as CoinAnalysisResult;
    
    // Clean up estimatedValue to ensure it is a number
    if (typeof result.estimatedValue === 'string') {
      // Remove '$', ',', and other non-numeric chars (allow decimal point)
      const cleaned = parseFloat((result.estimatedValue as string).replace(/[^0-9.]/g, ''));
      result.estimatedValue = isNaN(cleaned) ? 0 : cleaned;
    } else if (typeof result.estimatedValue !== 'number') {
      result.estimatedValue = 0;
    }

    // Attach found sources to the result
    result.sources = sources;
    
    return result;
  } catch (error) {
    console.error("Failed to parse Gemini response", response.text, error);
    throw new Error("Failed to parse coin analysis results.");
  }
};
