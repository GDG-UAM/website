declare module "marked-highlight" {
  export function markedHighlight(options: {
    langPrefix?: string;
    highlight?: (code: string, lang?: string) => string;
  }): unknown;
}

declare module "highlight.js" {
  export function highlight(code: string, opts: { language: string }): { value: string };
  export function highlightAuto(code: string): { value: string };
  export function getLanguage(lang: string): unknown | undefined;
  const _default: {
    highlight: typeof highlight;
    highlightAuto: typeof highlightAuto;
    getLanguage: typeof getLanguage;
  };
  export default _default;
}
