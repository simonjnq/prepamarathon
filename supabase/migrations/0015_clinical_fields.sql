-- =============================================================
-- Champs cliniques propres au suivi du coureur (lacune relevée par
-- l'audit clinique).
--   - resting_hr : fréquence cardiaque de repos (bpm)
--   - max_hr : fréquence cardiaque max mesurée (bpm)
--   - vma : vitesse maximale aérobie (km/h)
--   - target_pace : allure cible course (min/km, format texte ex 5:15)
--   - last_ecg_date : date du dernier ECG / test d'effort
--   - surgical_history : antécédents chirurgicaux (texte libre)
--   - vaccinations : statut vaccinal (texte libre)
-- =============================================================

alter table public.patients
  add column if not exists resting_hr smallint,
  add column if not exists max_hr smallint,
  add column if not exists vma numeric(4,1),
  add column if not exists target_pace text,
  add column if not exists last_ecg_date date,
  add column if not exists surgical_history text,
  add column if not exists vaccinations text;

-- Populate les patients de démo (idempotent, ne touche pas les autres)
update public.patients p set
  resting_hr = d.resting_hr,
  max_hr = d.max_hr,
  vma = d.vma,
  target_pace = d.target_pace,
  last_ecg_date = d.last_ecg_date,
  surgical_history = d.surgical_history,
  vaccinations = d.vaccinations
from (values
  ('marie.dubois', 58::smallint, 186::smallint, 14.5, '4:50', date '2026-03-25', null::text, 'DTP à jour (2024), hépatite B à jour'),
  ('thomas.lefebvre', 64::smallint, 173::smallint, 12.0, '5:30', null::date, null::text, 'DTP à jour (2023)'),
  ('camille.martin', 62::smallint, 189::smallint, 13.5, '5:00', null::date, 'Appendicectomie (2012)', 'DTP à jour (2024), hépatite B à jour'),
  ('julien.bernard', 50::smallint, 192::smallint, 16.0, '4:20', date '2026-04-14', null::text, 'DTP à jour (2025), hépatite A+B'),
  ('sophie.petit', 60::smallint, 179::smallint, 12.5, '5:30', date '2026-02-23', 'Ligamentoplastie LCA genou D (juin 2025)', 'DTP à jour, méningocoque ACWY'),
  ('antoine.rousseau', 52::smallint, 184::smallint, 15.5, '4:30', date '2026-02-13', null::text, 'DTP à jour (2024)'),
  ('lea.moreau', 56::smallint, 194::smallint, 14.0, '5:00', date '2026-04-01', null::text, 'DTP à jour (2024), hépatite B'),
  ('nicolas.garcia', 66::smallint, 168::smallint, 11.5, '5:45', date '2026-03-20', 'Cholécystectomie (2018)', 'DTP à jour (2023)')
) as d(username, resting_hr, max_hr, vma, target_pace, last_ecg_date, surgical_history, vaccinations)
join public.profiles pr on pr.username = d.username
where p.id = pr.id;
