import Anthropic from "@anthropic-ai/sdk";
import {
  campaignGenerationSchema,
  type CampaignGeneration,
} from "./process-transcript";

export interface CampaignRefinementInput {
  name: string;
  subjectLine: string;
  htmlBody: string;
  textBody: string;
  targetAudience?: string;
  tone?: string;
  cta?: string;
  keyPoints?: string[];
}

const SYSTEM_PROMPT = `You are an expert email marketing copywriter refining an existing email campaign. The user will provide the current campaign as JSON and a refinement instruction.

Your job is to apply the requested changes while preserving everything else. Only modify what the user asks you to change.

You MUST respond with valid JSON only (no markdown fences, no extra text). The JSON must match this exact structure:

{
  "campaignName": "A short, descriptive name for the campaign",
  "subjectLines": ["Subject line option 1", "Subject line option 2", "Subject line option 3"],
  "htmlBody": "<html>...responsive, inline-styled HTML email body...</html>",
  "textBody": "Plain text version of the email body",
  "targetAudience": "Description of who this email is for",
  "tone": "The tone of the email (e.g., professional, casual, urgent, friendly)",
  "cta": "The main call-to-action",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}

Rules:
- Apply ONLY the requested refinement. Keep everything else intact.
- Always return exactly 3 subject line options (update them if the refinement affects subject lines)
- The HTML body must remain responsive with inline styles and a max-width of 600px centered layout
- Include a clear call-to-action button in the HTML body
- The plain text version should match the HTML content
- ONLY output the JSON object. No additional text, no markdown, no explanation.`;

export async function refineCampaign(
  currentCampaign: CampaignRefinementInput,
  refinementInstruction: string
): Promise<CampaignGeneration> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });

  const currentCampaignJson = JSON.stringify(
    {
      campaignName: currentCampaign.name,
      subjectLines: [currentCampaign.subjectLine],
      htmlBody: currentCampaign.htmlBody,
      textBody: currentCampaign.textBody,
      targetAudience: currentCampaign.targetAudience ?? "General audience",
      tone: currentCampaign.tone ?? "Professional",
      cta: currentCampaign.cta ?? "Learn more",
      keyPoints: currentCampaign.keyPoints ?? [],
    },
    null,
    2
  );

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Here is the current campaign:\n\n${currentCampaignJson}\n\nRefinement instruction: "${refinementInstruction}"\n\nApply the refinement and return the updated campaign as JSON.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  const rawText = textBlock.text.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  const result = campaignGenerationSchema.parse(parsed);
  return result;
}
