import { GoogleGenAI, Type } from "@google/genai";
import { getGeminiApiKey } from './adminStorage';

// Scan result types
export enum ScanActionType {
  OPEN_URL = 'OPEN_URL',
  SEARCH_PRODUCT = 'SEARCH_PRODUCT',
  COPY_TEXT = 'COPY_TEXT',
  WIFI_CONNECT = 'WIFI_CONNECT',
  UNKNOWN = 'UNKNOWN'
}

export interface ScanResult {
  found: boolean;
  data: string;
  format: string; // e.g., "QR Code", "UPC-A", "Data Matrix"
  summary: string; // AI generated description
  actionType: ScanActionType;
  timestamp: number;
}

// Get Gemini API Key from admin storage or fallback to environment variable
const getGeminiApiKeyFromAdmin = async (): Promise<string | undefined> => {
  const adminKey = await getGeminiApiKey();
  if (adminKey) {
    return adminKey;
  }
  // Fallback to environment variable for backwards compatibility
  return process.env.API_KEY || process.env.GEMINI_API_KEY;
};

/**
 * Analyzes an image (base64) to find and interpret barcodes/QR codes using Gemini 3.
 * Used for manual capture fallback when native BarcodeDetector fails.
 */
export const analyzeImageWithGemini = async (base64Image: string): Promise<ScanResult> => {
  try {
    const apiKey = await getGeminiApiKeyFromAdmin();
    
    if (!apiKey) {
      return {
        found: false,
        data: "",
        format: "Error",
        summary: "API Key is missing. Please configure Gemini API Key in the admin settings.",
        actionType: ScanActionType.UNKNOWN,
        timestamp: Date.now()
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Remove data URL prefix if present for the API call data payload
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: `Analyze this image for any machine-readable codes (QR Code, Barcode, UPC, EAN, Data Matrix, PDF417, etc.). 
            If a code is found:
            1. Extract the raw data exactly.
            2. Identify the format.
            3. Provide a helpful summary (e.g., "Official Website of X", "Product ID for Y", "WiFi Network Config").
            4. Determine the best user action.
            
            If no code is clearly visible or decipherable, set found to false.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            found: { 
              type: Type.BOOLEAN, 
              description: "Whether a valid barcode or QR code was detected and decoded." 
            },
            data: { 
              type: Type.STRING, 
              description: "The raw string content encoded in the barcode." 
            },
            format: { 
              type: Type.STRING, 
              description: "The type of code, e.g., 'QR_CODE', 'UPC_A', 'EAN_13'." 
            },
            summary: { 
              type: Type.STRING, 
              description: "A short, human-readable description of what the content is." 
            },
            actionType: { 
              type: Type.STRING, 
              enum: [
                ScanActionType.OPEN_URL, 
                ScanActionType.SEARCH_PRODUCT, 
                ScanActionType.COPY_TEXT, 
                ScanActionType.WIFI_CONNECT, 
                ScanActionType.UNKNOWN
              ],
              description: "The recommended action for the user to take."
            }
          },
          required: ["found", "data", "format", "summary", "actionType"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(text);

    return {
      found: result.found,
      data: result.data || "",
      format: result.format || "Unknown",
      summary: result.summary || "No description available.",
      actionType: (result.actionType as ScanActionType) || ScanActionType.UNKNOWN,
      timestamp: Date.now()
    };

  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    const errorMessage = error.message || "Unknown error";
    
    // Provide a more helpful message if possible
    let userMessage = "Could not analyze image. Please try again.";
    if (errorMessage.includes("500") || errorMessage.includes("xhr")) {
        userMessage = "Network or Server Error (500). Please try again.";
    } else if (errorMessage.includes("API") || errorMessage.includes("key")) {
        userMessage = "API Key error. Please check admin settings.";
    }

    return {
      found: false,
      data: "",
      format: "Error",
      summary: userMessage,
      actionType: ScanActionType.UNKNOWN,
      timestamp: Date.now()
    };
  }
};

