/** Site-wide languages: the ten most spoken languages (Ethnologue), English first. */
export interface LocaleInfo {
  /** Endonym shown in the language menu. */
  name: string;
  /** English name, used in the English-language half of the suggestion prompt. */
  english: string;
  /** BCP 47 tag for the html lang attribute. */
  lang: string;
  dir: 'ltr' | 'rtl';
  /** Intl locale for dates and numbers. */
  intl: string;
  /** Suggestion prompt, written in the language itself. */
  prompt: string;
  accept: string;
  /** Extra Google Fonts families the script needs ('' when the Latin fonts already cover it). */
  fonts: string;
}

export const locales = {
  en: {name: 'English', english: 'English', lang: 'en', dir: 'ltr', intl: 'en-US', prompt: '', accept: '', fonts: ''},
  zh: {name: '简体中文', english: 'Chinese', lang: 'zh-Hans', dir: 'ltr', intl: 'zh-CN', prompt: '要用简体中文浏览本站吗？', accept: '切换到中文', fonts: 'family=Noto+Sans+SC:wght@400;600;800'},
  hi: {name: 'हिन्दी', english: 'Hindi', lang: 'hi', dir: 'ltr', intl: 'hi-IN', prompt: 'क्या आप यह साइट हिन्दी में देखना चाहेंगे?', accept: 'हिन्दी में देखें', fonts: 'family=Noto+Sans+Devanagari:wght@400;600;800'},
  es: {name: 'Español', english: 'Spanish', lang: 'es', dir: 'ltr', intl: 'es', prompt: '¿Prefieres ver este sitio en español?', accept: 'Ver en español', fonts: ''},
  ar: {name: 'العربية', english: 'Arabic', lang: 'ar', dir: 'rtl', intl: 'ar-u-nu-latn', prompt: 'هل تفضّل تصفّح الموقع بالعربية؟', accept: 'التصفّح بالعربية', fonts: 'family=IBM+Plex+Sans+Arabic:wght@400;600&family=Noto+Kufi+Arabic:wght@600;800'},
  fr: {name: 'Français', english: 'French', lang: 'fr', dir: 'ltr', intl: 'fr-FR', prompt: 'Vous préférez lire ce site en français ?', accept: 'Passer en français', fonts: ''},
  bn: {name: 'বাংলা', english: 'Bengali', lang: 'bn', dir: 'ltr', intl: 'bn-BD', prompt: 'সাইটটি বাংলায় পড়তে চান?', accept: 'বাংলায় দেখুন', fonts: 'family=Noto+Sans+Bengali:wght@400;600;800'},
  pt: {name: 'Português', english: 'Portuguese', lang: 'pt-BR', dir: 'ltr', intl: 'pt-BR', prompt: 'Prefere ver este site em português?', accept: 'Ver em português', fonts: ''},
  ru: {name: 'Русский', english: 'Russian', lang: 'ru', dir: 'ltr', intl: 'ru-RU', prompt: 'Хотите читать сайт на русском?', accept: 'Перейти на русский', fonts: 'family=Inter+Tight:wght@600;800'},
  ur: {name: 'اردو', english: 'Urdu', lang: 'ur', dir: 'rtl', intl: 'ur-PK-u-nu-latn', prompt: 'کیا آپ یہ سائٹ اردو میں پڑھنا چاہیں گے؟', accept: 'اردو میں دیکھیں', fonts: 'family=Noto+Nastaliq+Urdu:wght@400;600'},
} satisfies Record<string, LocaleInfo>;

export type SiteLocale = keyof typeof locales;
export const localeCodes = Object.keys(locales) as SiteLocale[];
export const defaultLocale: SiteLocale = 'en';
export const isLocale = (value: unknown): value is SiteLocale => typeof value === 'string' && value in locales;

/** Shared preference key: the portfolio, Lab and Quizora all read and write it. */
export const LOCALE_STORAGE_KEY = 'site.locale';

/**
 * Where a visitor probably is, inferred from the device time zone. No network
 * lookup is made, so nothing about the visitor leaves the browser.
 * Entries ending in "/" match every zone under that prefix.
 */
export const timeZoneLocales: Record<Exclude<SiteLocale, 'en'>, string[]> = {
  bn: ['Asia/Dhaka', 'Asia/Dacca'],
  hi: ['Asia/Kolkata', 'Asia/Calcutta'],
  ur: ['Asia/Karachi'],
  zh: ['Asia/Shanghai', 'Asia/Chongqing', 'Asia/Chungking', 'Asia/Harbin', 'Asia/Urumqi', 'Asia/Kashgar', 'PRC'],
  ru: ['Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Europe/Volgograd', 'Europe/Saratov', 'Europe/Ulyanovsk', 'Europe/Astrakhan', 'Europe/Kirov', 'Europe/Minsk', 'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Barnaul', 'Asia/Tomsk', 'Asia/Novokuznetsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Chita', 'Asia/Yakutsk', 'Asia/Khandyga', 'Asia/Vladivostok', 'Asia/Ust-Nera', 'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk', 'Asia/Kamchatka', 'Asia/Anadyr', 'Asia/Almaty', 'Asia/Qostanay', 'Asia/Bishkek', 'W-SU'],
  pt: ['America/Sao_Paulo', 'America/Rio_Branco', 'America/Manaus', 'America/Cuiaba', 'America/Campo_Grande', 'America/Belem', 'America/Fortaleza', 'America/Recife', 'America/Araguaina', 'America/Maceio', 'America/Bahia', 'America/Santarem', 'America/Porto_Velho', 'America/Boa_Vista', 'America/Eirunepe', 'America/Noronha', 'Brazil/', 'Europe/Lisbon', 'Atlantic/Madeira', 'Atlantic/Azores', 'Africa/Luanda', 'Africa/Maputo', 'Africa/Bissau', 'Atlantic/Cape_Verde', 'Africa/Sao_Tome'],
  es: ['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta', 'America/Mexico_City', 'America/Cancun', 'America/Merida', 'America/Monterrey', 'America/Matamoros', 'America/Chihuahua', 'America/Ciudad_Juarez', 'America/Ojinaga', 'America/Mazatlan', 'America/Bahia_Banderas', 'America/Hermosillo', 'America/Tijuana', 'Mexico/', 'America/Argentina/', 'America/Buenos_Aires', 'America/Bogota', 'America/Lima', 'America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter', 'America/Caracas', 'America/Guayaquil', 'Pacific/Galapagos', 'America/La_Paz', 'America/Asuncion', 'America/Montevideo', 'America/Havana', 'America/Santo_Domingo', 'America/Puerto_Rico', 'America/Guatemala', 'America/El_Salvador', 'America/Tegucigalpa', 'America/Managua', 'America/Costa_Rica', 'America/Panama', 'Africa/Malabo'],
  fr: ['Europe/Paris', 'Europe/Monaco', 'Africa/Dakar', 'Africa/Abidjan', 'Africa/Bamako', 'Africa/Ouagadougou', 'Africa/Niamey', 'Africa/Conakry', 'Africa/Lome', 'Africa/Porto-Novo', 'Africa/Douala', 'Africa/Libreville', 'Africa/Kinshasa', 'Africa/Lubumbashi', 'Africa/Brazzaville', 'Africa/Bangui', 'Africa/Ndjamena', 'Africa/Bujumbura', 'Indian/Antananarivo', 'Indian/Comoro', 'Indian/Reunion', 'Indian/Mayotte', 'America/Martinique', 'America/Guadeloupe', 'America/Cayenne', 'America/Port-au-Prince', 'America/Miquelon', 'Pacific/Tahiti', 'Pacific/Noumea', 'Pacific/Wallis'],
  ar: ['Asia/Riyadh', 'Asia/Dubai', 'Asia/Qatar', 'Asia/Kuwait', 'Asia/Bahrain', 'Asia/Muscat', 'Asia/Baghdad', 'Asia/Amman', 'Asia/Damascus', 'Asia/Beirut', 'Asia/Aden', 'Asia/Gaza', 'Asia/Hebron', 'Africa/Cairo', 'Egypt', 'Africa/Tripoli', 'Libya', 'Africa/Tunis', 'Africa/Algiers', 'Africa/Casablanca', 'Africa/El_Aaiun', 'Africa/Khartoum', 'Africa/Nouakchott'],
};

/** Data the browser-side language script needs, kept small. */
export function clientLocaleData() {
  return {
    storageKey: LOCALE_STORAGE_KEY,
    locales: Object.fromEntries(localeCodes.map((code) => {
      const {name, english, prompt, accept, dir} = locales[code];
      return [code, {name, english, prompt, accept, dir}];
    })),
    zones: timeZoneLocales,
  };
}
