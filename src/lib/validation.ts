import { z } from "zod";

/** Strip basic HTML/script tags to neutralize XSS via PDF/email pipelines. */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&[#a-z0-9]+;/gi, "");
}

const txt = (max: number, min = 1) =>
  z
    .string()
    .min(min)
    .max(max)
    .transform((s) => stripHtml(s).trim());

const optTxt = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((s) => (s ? stripHtml(s).trim() : ""));

export const Schemas = {
  uuid: z.string().uuid(),
  optUuid: z.string().uuid().optional().nullable(),

  noteContent: txt(5000),
  taskTitle: txt(200),
  taskDescription: optTxt(2000),
  apptReason: txt(200),
  apptSummary: optTxt(5000),
  apptLocation: optTxt(200),
  documentTitle: txt(200),
  documentDescription: optTxt(500),
  message: txt(2000),
  reminderMessage: txt(1000),
  flagMessage: optTxt(2000),
  questionnaireAnswer: optTxt(1000),

  duration: z.coerce.number().int().min(5).max(240),
  dueInDays: z.coerce.number().int().min(0).max(365),

  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD attendu"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM attendu"),

  taskStatus: z.enum(["pending", "in_progress", "done", "snoozed"]),
  appointmentStatus: z.enum([
    "scheduled",
    "completed",
    "cancelled",
    "no_show",
  ]),
  alertSeverity: z.enum(["info", "warning", "urgent"]),
  reminderChannel: z.enum(["whatsapp", "sms", "email", "notification"]),
  documentType: z.enum([
    "ordonnance",
    "compte_rendu",
    "recommandation",
    "examen",
    "autre",
  ]),
  flagCategory: z.enum([
    "pain_increase",
    "pain_persistent",
    "appointment_missed",
    "fatigue",
    "other",
  ]),
  stepStatus: z.enum(["done", "in_progress", "upcoming"]),
};

/** Helper : extract a field from FormData and parse via a Zod schema.
 * Returns null on failure so server actions can no-op silently. */
export function field<T>(
  formData: FormData,
  key: string,
  schema: z.ZodType<T>,
): T | null {
  const raw = formData.get(key);
  if (raw == null) {
    const r = schema.safeParse(undefined);
    return r.success ? r.data : null;
  }
  const r = schema.safeParse(raw);
  return r.success ? r.data : null;
}
