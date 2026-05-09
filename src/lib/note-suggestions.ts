/**
 * Heuristic that scans a practitioner note and proposes a follow-up task.
 * Stand-in for a future LLM call. Returns null when nothing relevant matches.
 *
 * Lives in lib/ so both server actions and client components can import it
 * (a "use server" module would turn this sync function into an RPC).
 */
export function suggestTaskFromNote(
  content: string,
): { title: string; dueInDays: number } | null {
  const lower = content.toLowerCase();

  const patterns: Array<{ re: RegExp; title: string; dueInDays: number }> = [
    {
      re: /\b(kin[ée]|kinésith[ée]rapeute|kinesith[ée]rapeute)\b/,
      title: "Prendre rendez-vous chez un kinésithérapeute",
      dueInDays: 7,
    },
    {
      re: /\bost[ée]o(pathe)?\b/,
      title: "Prendre rendez-vous chez un ostéopathe",
      dueInDays: 14,
    },
    {
      re: /\bpodologue|semelles?\b/,
      title: "Prendre rendez-vous chez un podologue",
      dueInDays: 14,
    },
    {
      re: /\b(test d['’]effort|cardio(logique)?|ECG)\b/i,
      title: "Programmer un test d'effort cardiologique",
      dueInDays: 21,
    },
    {
      re: /\b(prise de sang|bilan biologique|nfs|ferritine)\b/i,
      title: "Effectuer le bilan biologique prescrit",
      dueInDays: 7,
    },
    {
      re: /\b(nutritionniste|di[ée]t[ée]ticien)\b/,
      title: "Prendre rendez-vous chez un nutritionniste",
      dueInDays: 14,
    },
    {
      re: /\b[ée]tirements?\b/,
      title: "Étirements quotidiens — 10 min",
      dueInDays: 0,
    },
    {
      re: /\b(gla[çc]age|glace)\b/,
      title: "Glaçage de la zone douloureuse — 3x/jour",
      dueInDays: 5,
    },
    {
      re: /\b(repos|stop|pause).{0,15}(course|entra[ie]nement)\b/,
      title: "Repos course pendant 7 à 10 jours",
      dueInDays: 7,
    },
    {
      re: /\bjournal de (sommeil|douleur)\b/,
      title: "Tenir un journal de suivi quotidien",
      dueInDays: 14,
    },
    {
      re: /\b(hydrat\w+|boire plus)\b/,
      title: "Augmenter l'hydratation à 2 L/j minimum",
      dueInDays: 7,
    },
  ];

  for (const p of patterns) {
    if (p.re.test(lower)) return { title: p.title, dueInDays: p.dueInDays };
  }
  return null;
}
