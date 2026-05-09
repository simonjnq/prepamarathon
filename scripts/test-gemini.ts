import { GoogleGenAI, Type } from "@google/genai";
import { config } from "dotenv";
config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY missing in .env.local");
  process.exit(1);
}

const SYSTEM_PROMPT = `Tu es l'assistant IA d'une plateforme de coordination médicale pour la préparation marathon.

Le praticien vient de saisir une note. Identifie 0 à 3 actions concrètes pour le PATIENT.

- title : phrase impérative en français commencant par un verbe à l'infinitif. Max 90 chars.
- dueInDays : nombre entier (0 = aujourd'hui).
- reasoning : 1 phrase, max 15 mots, citant un élément de la note.
- Renvoie un tableau vide si la note est descriptive sans appel à l'action.`;

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
      },
    },
  },
  required: ["suggestions"],
};

const NOTES = [
  "Patiente signale recrudescence douleur mollet droit après sortie longue. Recommander semelles podologiques + repos course 7 jours.",
  "Tendinite achille D débutante, douleur 5/10 le matin. Probable cause : montée trop rapide en volume. Repos course 10 jours, glace 3x/jour.",
  "Patient en forme, RAS, récupération bonne.",
];

async function run() {
  const ai = new GoogleGenAI({ apiKey: apiKey! });

  for (const note of NOTES) {
    console.log("\n─────────────────────────────────");
    console.log("NOTE:", note);
    const t0 = Date.now();
    const r = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Note du praticien :\n\n"""\n${note}\n"""`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    });
    const dt = Date.now() - t0;
    const parsed = JSON.parse(r.text ?? "{}");
    console.log(`✓ ${dt} ms  ·  ${parsed.suggestions?.length ?? 0} suggestion(s)`);
    for (const s of parsed.suggestions ?? []) {
      console.log(`  • ${s.title}`);
      console.log(`    échéance: ${s.dueInDays}j  —  « ${s.reasoning} »`);
    }
  }
}

run().catch((e) => {
  console.error("ERREUR:", e.message ?? e);
  process.exit(1);
});
