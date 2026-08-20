function enhanceA11y(root=document){
  root.querySelectorAll('button.round-go:not([aria-label])').forEach(button=>{
    button.setAttribute('aria-label','Открыть следующий урок');
  });
  root.querySelectorAll('.update a[target="_blank"]:not([aria-label])').forEach(link=>{
    const title=link.closest('.update')?.querySelector('h3')?.textContent?.trim();
    link.setAttribute('aria-label',title?`Открыть официальный источник: ${title}`:'Открыть официальный источник');
  });
  root.querySelectorAll('button[aria-label] svg,a[aria-label] svg').forEach(svg=>svg.setAttribute('aria-hidden','true'));
}

let scheduled=false;
function scheduleEnhance(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;enhanceA11y()});
}

const observer=new MutationObserver(scheduleEnhance);
observer.observe(document.documentElement,{childList:true,subtree:true});
enhanceA11y();

export{enhanceA11y};
