"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { requirePractitioner } from "@/lib/auth";

export type AISuggestion = {
  kind: "task" | "alert" | "pain_point";
  title: string;
  reasoning: string;
  // Pour task
  dueInDays?: number | null;
  // Pour alert
  alertSeverity?: "info" | "warning" | "urgent" | null;
  // Pour pain_point
  painBodyZone?: string | null;
  painSeverity?: number | null;
};

export type AIResult = {
  source: "gemini" | "unavailable" | "error";
  suggestions: AISuggestion[];
  error?: string;
};

const SYSTEM_PROMPT = `Tu es l'assistant IA d'une plateforme de coordination médicale (Via Sana — PrépaMarathon).

Un praticien vient de saisir une note libre concernant un patient. Ton rôle est d'extraire de cette note 0 à 5 items concrets à enregistrer dans le dossier patient. Tu peux proposer 3 types d'items :

- "task" : action que doit faire le PATIENT (prendre un RDV, étirements, repos, glaçage, journal de sommeil…). Champ "dueInDays" (entier, jours avant échéance, 0 = aujourd'hui).
- "alert" : signal à remonter à l'équipe pour suivi (douleur persistante, signe de surentraînement, RDV manqué, contre-indication observée…). Champ "alertSeverity" ("info" | "warning" | "urgent").
- "pain_point" : douleur ou blessure précise mentionnée dans la note, à enregistrer dans le suivi. Champs "painBodyZone" (zone courte en français, ex "Mollet droit", "Lombaires bas", "Tendon achille gauche") et "painSeverity" (entier 0-10 estimé).

Règles strictes :
- "title" : phrase courte en français, max 90 caractères, pas de point final.
- "reasoning" : UNE phrase courte (max 15 mots) expliquant ce qui dans la note motive l'item.
- 0 à 5 items max au total. Mieux vaut un tableau vide qu'inventer.
- Pour chaque item, ne renseigne QUE les champs adaptés à son "kind". Les autres restent absents/null.
- Ne propose pas une action que le praticien doit faire (rédiger ordonnance, examiner). Uniquement actions PATIENT pour les "task".
- Si la note évoque une douleur (mollet, dos, achille, etc.) → presque toujours créer un "pain_point" avec la zone et l'intensité estimée.
- Si la note évoque un risque ou une recrudescence → "alert".
- Si la note recommande une action → "task".
- Si la note est purement descriptive (ex "patient en forme, RAS") → tableau vide.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          kind: {
            type: Type.STRING,
            enum: ["task", "alert", "pain_point"],
          },
          title: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          dueInDays: { type: Type.INTEGER, nullable: true },
          alertSeverity: {
            type: Type.STRING,
            enum: ["info", "warning", "urgent"],
            nullable: true,
          },
          painBodyZone: { type: Type.STRING, nullable: true },
          painSeverity: { type: Type.INTEGER, nullable: true },
        },
        required: ["kind", "title", "reasoning"],
      },
    },
  },
  required: ["suggestions"],
};

export async function aiSuggestFromNote(content: string): Promise<AIResult> {
  await requirePractitioner();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { source: "unavailable", suggestions: [] };

  const trimmed = content.trim();
  if (!trimmed) return { source: "gemini", suggestions: [] };

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Note du praticien :\n\n"""\n${trimmed}\n"""`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    });

    const text = response.text ?? "";
    let parsed: { suggestions?: AISuggestion[] } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const suggestions = (parsed.suggestions ?? [])
      .filter(
        (s): s is AISuggestion =>
          typeof s?.title === "string" &&
          typeof s?.reasoning === "string" &&
          ["task", "alert", "pain_point"].includes(s?.kind),
      )
      .slice(0, 5);

    return { source: "gemini", suggestions };
  } catch (err) {
    return {
      source: "error",
      suggestions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
