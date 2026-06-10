export const THEME_STORAGE_KEY = "songscription-theme";

/** Inline <head> script: sets the theme class before first paint (no FOUC). */
export const themeBootstrap = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
