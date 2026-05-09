"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requirePractitioner } from "@/lib/auth";

export type AISuggestion = {
  title: string;
  dueInDays: number;
  reasoning: string;
};

export type AIResult = {
  source: "claude" | "unavailable" | "error";
  suggestions: AISuggestion[];
  error?: string;
};

const SYSTEM_PROMPT = `Tu es l'assistant IA d'une plateforme de coordination médicale pour la préparation marathon (Via Sana — PrépaMarathon).

Un praticien vient de saisir une note libre concernant un patient. Ton rôle est d'identifier des actions concrètes que le PATIENT (pas le praticien) devrait entreprendre suite à cette note.

Règles strictes :
- Tu réponds UNIQUEMENT en JSON valide. Pas de markdown, pas de texte hors du JSON, pas de \`\`\`.
- Format exact : {"suggestions": [{"title": string, "dueInDays": number, "reasoning": string}]}
- "title" : phrase impérative courte en français adressée au patient. Commence par un verbe à l'infinitif. Ex : "Prendre rendez-vous chez un kinésithérapeute", "Effectuer la prise de sang prescrite". Max 90 caractères. Pas de point final.
- "dueInDays" : nombre entier de jours avant l'échéance recommandée (0 = aujourd'hui même, 7 = sous une semaine, 30 = un mois). Choisis une échéance réaliste selon l'urgence implicite.
- "reasoning" : UNE seule phrase courte en français expliquant pourquoi cette tâche découle de la note. Max 15 mots. Doit citer un élément concret de la note.
- 0 à 3 suggestions max. Mieux vaut un tableau vide qu'inventer.
- Ne suggère jamais une action que le praticien doit faire (ex : "examiner le patient", "rédiger une ordonnance"). Uniquement des actions PATIENT.
- N'invente pas d'examens ou de traitements non mentionnés dans la note.
- Si la note est purement descriptive ou observationnelle sans appel à l'action, renvoie {"suggestions": []}.`;

export async function aiSuggestFromNote(content: string): Promise<AIResult> {
  await requirePractitioner();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { source: "unavailable", suggestions: [] };

  const trimmed = content.trim();
  if (!trimmed) return { source: "claude", suggestions: [] };

  const client = new Anthropic({ apiKey });

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Note du praticien :\n\n"""\n${trimmed}\n"""`,
        },
      ],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    let parsed: { suggestions?: AISuggestion[] } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // Sometimes models wrap output. Try to extract a JSON object.
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

    return { source: "claude", suggestions };
  } catch (err) {
    return {
      source: "error",
      suggestions: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
