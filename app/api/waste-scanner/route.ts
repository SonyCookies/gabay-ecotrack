import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = process.env.GOOGLE_AI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Fallback if API key is missing
    if (!genAI) {
      console.warn("GOOGLE_AI_API_KEY is not set. Returning mock response.");
      return NextResponse.json(getMockResponse());
    }

    const model = genAI.getGenerativeModel(
      { model: "gemini-2.5-flash" },
      { apiVersion: "v1" }
    );

    // Remove the data aspect of the base64 string
    const base64Data = image.split(",")[1] || image;

    const prompt = `
      Analyze this image of waste. 
      Identify what it is and classify it into exactly one of these categories:
      - biodegradable (Organic Waste like food, leaves)
      - recyclable (Plastic bottles, paper, tin cans, glass)
      - residual (Non-recyclable like diapers, candy wrappers, sachets)
      - bulk (Large items like furniture, appliances)
      - hazardous (Batteries, light bulbs, chemicals, medical waste)

      Respond ONLY with a JSON object in this format:
      {
        "category": "category_id",
        "identifiedItem": "Name of the item identified",
        "confidence": 0.95,
        "briefAdvice": "Short advice on how to dispose of this specifically"
      }
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ]);

    const text = result.response.text();
    
    // Attempt to parse JSON from response
    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}") + 1;
      const jsonStr = text.substring(jsonStart, jsonEnd);
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json({
        category: "residual",
        identifiedItem: "Unknown Item",
        confidence: 0.5,
        briefAdvice: "We couldn't identify this clearly. Please check the Guidance section."
      });
    }

  } catch (error: any) {
    console.error("Waste Scanner Error:", error);
    
    // Provide specific guidance for 404 (Model Not Found)
    if (error.status === 404) {
      return NextResponse.json({ 
        error: "Model not found. Please ensure you are using a Gemini API Key from Google AI Studio (aistudio.google.com) and that the model 'gemini-1.5-flash' is available in your region.",
        details: error.message 
      }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}

function getMockResponse() {
  const categories = ["biodegradable", "recyclable", "residual", "bulk", "hazardous"];
  const randomCat = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    category: randomCat,
    identifiedItem: "Simulated Item",
    confidence: 0.99,
    briefAdvice: "This is a simulated response. Please provide a GOOGLE_AI_API_KEY to enable real identification.",
    isMock: true
  };
}
