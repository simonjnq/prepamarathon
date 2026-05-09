"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { requirePractitioner } from "@/lib/auth";

export type AISuggestion = {
  title: string;
  dueInDays: number;
  reasoning: string;
};

export type AIResult = {
  source: "gemini" | "unavailable" | "error";
  suggestions: AISuggestion[];
  error?: string;
};

const SYSTEM_PROMPT = `Tu es l'assistant IA d'une plateforme de coordination médicale pour la préparation marathon (Via Sana — PrépaMarathon).

Un praticien vient de saisir une note libre concernant un patient. Ton rôle est d'identifier des actions concrètes que le PATIENT (pas le praticien) devrait entreprendre suite à cette note.

Règles strictes :
- "title" : phrase impérative courte en français adressée au patient. Commence par un verbe à l'infinitif. Ex : "Prendre rendez-vous chez un kinésithérapeute", "Effectuer la prise de sang prescrite". Max 90 caractères. Pas de point final.
- "dueInDays" : nombre entier de jours avant l'échéance recommandée (0 = aujourd'hui même, 7 = sous une semaine, 30 = un mois). Choisis une échéance réaliste selon l'urgence implicite.
- "reasoning" : UNE seule phrase courte en français expliquant pourquoi cette tâche découle de la note. Max 15 mots. Doit citer un élément concret de la note.
- 0 à 3 suggestions max. Mieux vaut un tableau vide qu'inventer.
- Ne suggère jamais une action que le praticien doit faire (ex : "examiner le patient", "rédiger une ordonnance"). Uniquement des actions PATIENT.
- N'invente pas d'examens ou de traitements non mentionnés dans la note.
- Si la note est purement descriptive ou observationnelle sans appel à l'action, renvoie un tableau vide.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          dueInDays: { type: Type.INTEGER },
          reasoning: { type: Type.STRING },
        },
        required: ["title", "dueInDays", "reasoning"],
        propertyOrdering: ["title", "dueInDays", "reasoning"],
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
          typeof s?.dueInDays === "number" &&
          typeof s?.reasoning === "string",
      )
      .slice(0, 3);

    return { source: "gemini", suggestions };
  } catch (err) {
    return {
      source: "error",
      suggestions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
