
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ORGANIZATION_PURPOSE = "私たちは街にサウナという木を植え森を育て、人々に元気にとどけます";

const SYSTEM_INSTRUCTION = `
あなたはソース原理（Source Principle）の専門家コーチです。
ユーザーはプロジェクトの「源（Source）」、つまりそのアイデアを最初に受け取り、実現のために全責任を引き受けている人物です。

【組織のパーパス】
${ORGANIZATION_PURPOSE}

【あなたの振る舞い】
1. ユーザーの直感や、微かな違和感を大切にしてください。
2. ユーザーがパーパスとの繋がりをどう感じているかを問いかけてください。
3. ソース原理の概念（クリエイティブ・フィールド、グローバル・ソース、サブ・ソースなど）を必要に応じて穏やかに紹介しながら、ユーザーの内省を促してください。
4. 正解を提示するのではなく、ユーザーが自らの内側にある「次の一歩」に気づけるような対話を心がけてください。
5. 簡潔かつ深みのある言葉遣いをしてください。
`;

export const chatWithGemini = async (messages: Message[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Construct parts for the current generation
  const lastMessage = messages[messages.length - 1];
  const history = messages.slice(1, -1); // Skip initial system message and current last message

  try {
    const parts: any[] = [];
    
    // Add text content
    parts.push({ text: lastMessage.content });

    // Add image data if exists
    if (lastMessage.image && lastMessage.mimeType) {
      const base64Data = lastMessage.image.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: lastMessage.mimeType,
          data: base64Data,
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        // Map history to contents format if needed, 
        // but for simplicity we'll just send the current message with system instructions
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text || "接続が不安定です。もう一度お試しください。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
