const s=(body,w=24)=>`<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const map={
home:s('<path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/>'),
learn:s('<path d="M4 5h7v15H4z"/><path d="M13 4h7v16h-7z"/>'),
solve:s('<path d="M12 4v16"/><path d="M6 7h12"/><path d="M8 7 5 12h6L8 7Z"/><path d="M16 7 13 12h6l-3-5Z"/><path d="M8 20h8"/>'),
search:s('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
profile:s('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.7-3.5 5-5 8-5s6.3 1.5 8 5"/>'),
corporate:s('<rect x="5" y="8" width="14" height="12" rx="1.5"/><path d="M9 20V4h6v16M8 12h1m6 0h1m-8 4h1m6 0h1"/>'),
tax:s('<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/>'),
immigration:s('<path d="M4 20h16M6 20V9h12v11M8 9V6h8v3M10 13h4"/>'),
estate:s('<path d="M4 10.5 12 4l8 6.5M6 10v10h12V10M10 20v-5h4v5"/>'),
arrow:s('<path d="M5 12h14m-6-6 6 6-6 6"/>'),
back:s('<path d="m15 5-7 7 7 7"/>'),
lock:s('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/>'),
check:s('<path d="m5 12 4 4 10-10"/>'),
bookmark:s('<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1Z"/>'),
shield:s('<path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="m9.5 12 1.6 1.6 3.4-3.7"/>'),
external:s('<path d="M14 5h5v5M10 14l9-9M19 14v5H5V5h5"/>'),
info:s('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'),
review:s('<path d="M4 12a8 8 0 1 0 2.3-5.7L4 9"/><path d="M4 4v5h5"/>'),
plus:s('<path d="M12 5v14M5 12h14"/>'),
minus:s('<path d="M5 12h14"/>'),
moon:s('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"/>'),
sun:s('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>')};
export function icon(name){return map[name]||''}
export const pathIcon=p=>icon({Corporate:'corporate',Tax:'tax',Immigration:'immigration','Real Estate':'estate'}[p]||'info');
