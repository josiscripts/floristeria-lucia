export type CampaignTheme = "valentine" | "mothers-day" | "christmas" | "seasonal";
export type CampaignAnimation = "light-particles" | "falling-petals" | "snow-particles" | "none";
export type CampaignStatus = "open" | "soon" | "available" | "full" | "past";

export type SeasonalCampaign = {
  /** clave i18n usada en home.seasonal.campaigns.<i18nKey> */
  id: string;
  i18nKey: string;
  type: "special" | "permanent";
  theme: CampaignTheme;
  animation: CampaignAnimation;
  /** formato "MM-DD" */
  startDate?: string;
  endDate?: string;
};

export const seasonalCampaigns: SeasonalCampaign[] = [
  {
    id: "valentine",
    i18nKey: "san-valentin",
    type: "special",
    theme: "valentine",
    animation: "light-particles",
    startDate: "01-20",
    endDate: "02-14",
  },
  {
    id: "mothers-day",
    i18nKey: "dia-de-la-madre",
    type: "special",
    theme: "mothers-day",
    animation: "falling-petals",
    startDate: "04-15",
    endDate: "05-05",
  },
  {
    id: "christmas",
    i18nKey: "navidad",
    type: "special",
    theme: "christmas",
    animation: "snow-particles",
    startDate: "11-20",
    endDate: "12-24",
  },
];

export const seasonalCollection: SeasonalCampaign = {
  id: "seasonal-flowers",
  i18nKey: "temporada",
  type: "permanent",
  theme: "seasonal",
  animation: "none",
};

function toMd(value: string) {
  const [m = 1, d = 1] = value.split("-").map(Number);
  return m * 100 + d;
}

function nowMd(date: Date) {
  return (date.getMonth() + 1) * 100 + date.getDate();
}

export function isCampaignActive(campaign: SeasonalCampaign, date: Date) {
  if (campaign.type !== "special" || !campaign.startDate || !campaign.endDate) return false;
  const md = nowMd(date);
  const from = toMd(campaign.startDate);
  const to = toMd(campaign.endDate);
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

/** Distancia en días-calendario aproximados hasta el próximo inicio de campaña. */
function daysUntilStart(campaign: SeasonalCampaign, date: Date) {
  if (!campaign.startDate) return Number.POSITIVE_INFINITY;
  const [m = 1, d = 1] = campaign.startDate.split("-").map(Number);
  const year = date.getFullYear();
  let start = new Date(year, m - 1, d);
  const today = new Date(year, date.getMonth(), date.getDate());
  if (start.getTime() < today.getTime()) start = new Date(year + 1, m - 1, d);
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

/** Días transcurridos desde el último final de campaña (ciclo anual). */
function daysSinceEnd(campaign: SeasonalCampaign, date: Date) {
  if (!campaign.endDate) return Number.POSITIVE_INFINITY;
  const [m = 1, d = 1] = campaign.endDate.split("-").map(Number);
  const year = date.getFullYear();
  let end = new Date(year, m - 1, d);
  const today = new Date(year, date.getMonth(), date.getDate());
  if (end.getTime() > today.getTime()) end = new Date(year - 1, m - 1, d);
  return Math.round((today.getTime() - end.getTime()) / 86_400_000);
}

/** Ventana (en días) durante la que una campaña finalizada se marca como "temporada anterior". */
const PAST_WINDOW_DAYS = 45;

export type CampaignSlot = { campaign: SeasonalCampaign; status: CampaignStatus };

/**
 * Calcula dinámicamente qué campaña es protagonista y la lista completa de
 * campañas secundarias (ordenadas por proximidad, con ciclo anual automático).
 * La campaña activa nunca aparece entre las secundarias.
 */
export function resolveSeasonalLineup(date: Date = new Date()): {
  hero: CampaignSlot;
  /** Campañas no activas ordenadas por proximidad temporal. */
  upcoming: CampaignSlot[];
} {
  const active = seasonalCampaigns.find((c) => isCampaignActive(c, date));
  const upcoming = seasonalCampaigns
    .filter((c) => c.id !== active?.id)
    .sort((a, b) => daysUntilStart(a, date) - daysUntilStart(b, date))
    .map<CampaignSlot>((campaign) => ({
      campaign,
      status: daysSinceEnd(campaign, date) <= PAST_WINDOW_DAYS ? "past" : "soon",
    }));

  if (active) {
    return { hero: { campaign: active, status: "open" }, upcoming };
  }

  return {
    hero: { campaign: seasonalCollection, status: "available" },
    upcoming,
  };
}
