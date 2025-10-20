type LanguageDef = { native: string; code: string };

const LANGUAGES: LanguageDef[] = [
  { native: "Afrikaans", code: "af" },
  { native: "አማርኛ", code: "am" },
  { native: "العربية", code: "ar" },
  { native: "অসমীয়া", code: "as" },
  { native: "Azərbaycan", code: "az" },
  { native: "Башҡорт", code: "ba" },
  { native: "беларуская", code: "be" },
  { native: "български", code: "bg" },
  { native: "বাংলা", code: "bn" },
  { native: "བོད་ཡིག", code: "bo" },
  { native: "brezhoneg", code: "br" },
  { native: "bosanski/босански", code: "bs" },
  { native: "català", code: "ca" },
  { native: "کوردیی ناوەندی", code: "ckb" },
  { native: "Corsu", code: "co" },
  { native: "čeština", code: "cs" },
  { native: "Cymraeg", code: "cy" },
  { native: "dansk", code: "da" },
  { native: "Deutsch", code: "de" },
  { native: "ދިވެހިބަސް", code: "dv" },
  { native: "Ελληνικά", code: "el" },
  { native: "English", code: "en" },
  { native: "Español", code: "es" },
  { native: "Eesti", code: "et" },
  { native: "Euskara", code: "eu" },
  { native: "فارسى", code: "fa" },
  { native: "Suomi", code: "fi" },
  { native: "Filipino", code: "fil" },
  { native: "Føroyskt", code: "fo" },
  { native: "Français", code: "fr" },
  { native: "Frysk", code: "fy" },
  { native: "Gaeilge", code: "ga" },
  { native: "Gàidhlig", code: "gd" },
  { native: "Galego", code: "gl" },
  { native: "ગુજરાતી", code: "gu" },
  { native: "Hausa", code: "ha" },
  { native: "עברית", code: "he" },
  { native: "हिंदी", code: "hi" },
  { native: "Hrvatski", code: "hr" },
  { native: "Magyar", code: "hu" },
  { native: "Հայերեն", code: "hy" },
  { native: "Bahasa Indonesia", code: "id" },
  { native: "Igbo", code: "ig" },
  { native: "Íslenska", code: "is" },
  { native: "Italiano", code: "it" },
  { native: "日本語", code: "ja" },
  { native: "ქართული", code: "ka" },
  { native: "Қазақша", code: "kk" },
  { native: "Kalaallisut", code: "kl" },
  { native: "ខ្មែរ", code: "km" },
  { native: "ಕನ್ನಡ", code: "kn" },
  { native: "한국어", code: "ko" },
  { native: "Kurdî/کوردی", code: "ku" },
  { native: "Кыргыз", code: "ky" },
  { native: "Lëtzebuergesch", code: "lb" },
  { native: "ລາວ", code: "lo" },
  { native: "Lietuvių", code: "lt" },
  { native: "Latviešu", code: "lv" },
  { native: "Reo Māori", code: "mi" },
  { native: "македонски јазик", code: "mk" },
  { native: "മലയാളം", code: "ml" },
  { native: "Монгол хэл/ᠮᠤᠨᠭᠭᠤᠯ ᠬᠡᠯᠡ", code: "mn" },
  { native: "मराठी", code: "mr" },
  { native: "Bahasa Malaysia", code: "ms" },
  { native: "Malti", code: "mt" },
  { native: "မြန်မာဘာသာ", code: "my" },
  { native: "norsk (bokmål)", code: "nb" },
  { native: "नेपाली (नेपाल)", code: "ne" },
  { native: "Nederlands", code: "nl" },
  { native: "norsk (nynorsk)", code: "nn" },
  { native: "Norsk", code: "no" },
  { native: "Occitan", code: "oc" },
  { native: "ଓଡ଼ିଆ", code: "or" },
  { native: "Papiamentu", code: "pap" },
  { native: "ਪੰਜਾਬੀ/پنجابی", code: "pa" },
  { native: "Polski", code: "pl" },
  { native: "پښتو", code: "ps" },
  { native: "Português", code: "pt" },
  { native: "Runasimi", code: "qu" },
  { native: "Rumantsch", code: "rm" },
  { native: "Română", code: "ro" },
  { native: "Русский", code: "ru" },
  { native: "Kinyarwanda", code: "rw" },
  { native: "Davvisámegiella", code: "se" },
  { native: "සිංහල", code: "si" },
  { native: "Slovenčina", code: "sk" },
  { native: "Slovenščina", code: "sl" },
  { native: "Shqip", code: "sq" },
  { native: "Srpski/српски", code: "sr" },
  { native: "Sesotho", code: "st" },
  { native: "Svenska", code: "sv" },
  { native: "Kiswahili", code: "sw" },
  { native: "தமிழ்", code: "ta" },
  { native: "తెలుగు", code: "te" },
  { native: "Тоҷикӣ", code: "tg" },
  { native: "ไทย", code: "th" },
  { native: "Türkmençe", code: "tk" },
  { native: "Setswana", code: "tn" },
  { native: "Türkçe", code: "tr" },
  { native: "Татарча", code: "tt" },
  { native: "ئۇيغۇرچە", code: "ug" },
  { native: "українська", code: "uk" },
  { native: "اُردو", code: "ur" },
  { native: "Uzbek/Ўзбек", code: "uz" },
  { native: "Tiếng Việt", code: "vi" },
  { native: "IsiXhosa", code: "xh" },
  { native: "Yoruba", code: "yo" },
  { native: "中文", code: "zh" },
  { native: "IsiZulu", code: "zu" }
];

// Cache translated labels per getLabel function to avoid recomputing on each search
const labelCache: WeakMap<(code: string) => string, Map<string, string>> = new WeakMap();

function getCachedLabelLower(getLabel: (code: string) => string, code: string): string {
  let map = labelCache.get(getLabel);
  if (!map) {
    map = new Map<string, string>();
    labelCache.set(getLabel, map);
  }
  const cached = map.get(code);
  if (cached !== undefined) return cached;
  let value = "";
  try {
    const raw = getLabel(code);
    value = typeof raw === "string" ? raw.toLowerCase() : "";
  } catch {
    value = "";
  }
  map.set(code, value);
  return value;
}

export function searchLanguages(query: string, getLabel?: (code: string) => string) {
  const q = query.trim().toLowerCase();
  if (!q) return LANGUAGES;
  return LANGUAGES.filter((l) => {
    const codeLower = l.code.toLowerCase();
    if (codeLower.includes(q)) return true;
    const nativeLower = l.native.toLowerCase();
    if (nativeLower.includes(q)) return true;
    if (getLabel) {
      const labelLower = getCachedLabelLower(getLabel, l.code);
      if (labelLower && labelLower.includes(q)) return true;
    }
    return false;
  });
}
