/* ScoutPRO · Menú de navegación compartido
   ───────────────────────────────────────────────
   Cómo usarlo: agregá esta línea antes de </body> en CADA sección:
       <script src="scoutpro-nav.js"></script>
   El menú se inyecta solo, marca la sección actual y es igual en todas las páginas.
   Para cambiar los botones o los enlaces, editá SOLO este archivo. */
(function(){
  if(window.__spnav) return; window.__spnav=1;

  // Secciones de la app. home:true es la pantalla de inicio (Menú).
  var items=[
    { label:'Menú',           href:'index.html',       home:true,
      icon:'<path d="M3 9.5 12 3l9 6.5"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>' },
    { label:'Cargar Partido', href:'quintetos.html',
      icon:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
    { label:'Estadístico',    href:'estadistico.html',
      icon:'<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="7"/><rect x="12" y="7" width="3" height="11"/><rect x="17" y="13" width="3" height="5"/>' },
    { label:'Video',          href:'video.html',
      icon:'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>' },
    { label:'Defensa',        href:'defensa.html',
      icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
    { label:'Tareas',         href:'tareas.html',
      icon:'<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>' },
    { label:'Plantel',        href:'plantel.html',
      icon:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { label:'Perfil',         href:'perfil.html',
      icon:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' }
  ];

  var css = ''
    + '.spnav{position:fixed;top:14px;right:16px;z-index:500;display:flex;gap:8px;flex-wrap:wrap;'
    + 'justify-content:flex-end;max-width:calc(100vw - 32px);'
    + "font-family:'DM Sans',system-ui,-apple-system,sans-serif}"
    + '.spnav a{display:inline-flex;align-items:center;gap:8px;text-decoration:none;padding:9px 13px;'
    + 'border-radius:11px;background:rgba(22,24,32,.85);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);'
    + 'border:1px solid rgba(255,255,255,.12);color:#c4cad6;font-size:13px;font-weight:600;'
    + 'letter-spacing:.01em;line-height:1;white-space:nowrap;transition:background .15s,border-color .15s,color .15s,transform .15s}'
    + '.spnav a:hover{background:rgba(30,32,42,.96);border-color:rgba(255,255,255,.28);color:#fff;transform:translateY(-1px)}'
    + '.spnav a.active{color:#f97316;border-color:rgba(249,115,22,.5);background:rgba(249,115,22,.12)}'
    + '.spnav a svg{width:17px;height:17px;flex:none}'
    + '@media(max-width:680px){.spnav{top:10px;right:10px;gap:6px}.spnav a{padding:9px 10px}.spnav .lbl{display:none}}';

  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  var cur=(location.pathname.split('/').pop()||'').toLowerCase();
  var nav=document.createElement('nav'); nav.className='spnav'; nav.setAttribute('aria-label','Navegación');

  items.forEach(function(it){
    var a=document.createElement('a'); a.href=it.href;
    var f=it.href.toLowerCase();
    var isHomeNow = it.home && (cur==='' || cur.indexOf('index')===0);
    if(f===cur || isHomeNow) a.className='active';
    a.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
      +'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+it.icon+'</svg>'
      +'<span class="lbl">'+it.label+'</span>';
    nav.appendChild(a);
  });

  function mount(){ if(document.body) document.body.appendChild(nav); }
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded',mount);
})();
