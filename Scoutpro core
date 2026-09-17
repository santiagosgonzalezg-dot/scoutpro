/* ═══════════════════════════════════════════════════════════════════
   ScoutPRO · CORE de identidad (v2)
   ───────────────────────────────────────────────────────────────────
   UN solo lugar para: login, creación de cuenta, confirmación de
   email, recuperación de contraseña, registro inicial (onboarding)
   y perfil del coach (nombre · rol · club · equipo).

   Cómo se usa (ya está cableado en todas las secciones):
       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
       <script src="scoutpro-core.js"></script>

   Qué expone:
       window.ScoutPro.ready        → Promise que resuelve {user, profile}
                                      cuando hay sesión y registro completo
       window.ScoutPro.profile()    → perfil actual {nombre, apellido, rol,
                                      club, equipo, categoria, temporada}
       window.ScoutPro.editProfile()→ abre el asistente para editar el perfil
       window.ScoutPro.logout()     → cierra sesión
       window._sb                   → cliente Supabase compartido
       evento 'sp:profile'          → se dispara con el perfil en detail

   Qué siembra para que TODAS las secciones adopten el equipo:
       localStorage.sp_coach        → {nombre, apellido, rol, club,
                                       equipo, categoria, temporada}
       localStorage.esf_mi_equipo   → nombre del equipo (sección Esfuerzo)
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__spCore) return; window.__spCore = 1;

  /* ── Configuración ─────────────────────────────────────────────── */
  var SB_URL = 'https://jqudeomgafqilqmqcqzg.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxdWRlb21nYWZxaWxxbXFjcXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjY1MTQsImV4cCI6MjA5NTg0MjUxNH0.0tl4jVOnuOE8DxTOQfGF2qirCeMIKRdv5RCZ0dGzBl8';
  var LS_COACH = 'sp_coach';
  var LS_ESF = 'esf_mi_equipo';
  var ROLES = [
    ['head', 'Head coach'],
    ['asistente', 'Asistente'],
    ['pf', 'Preparador físico'],
    ['analista', 'Analista de video'],
    ['otro', 'Otro']
  ];

  /* URL de retorno para los emails (confirmación / recuperación).
     Solo tiene sentido cuando la app corre en un servidor http(s). */
  function returnURL() {
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return null;
    var base = location.origin + location.pathname;
    // Los emails siempre vuelven al index, que es la puerta de entrada.
    return base.replace(/[^/]*$/, '') + 'index.html';
  }

  /* ── Cliente Supabase compartido ──────────────────────────────── */
  var sb = null;
  try {
    if (window._sb) sb = window._sb;
    else if (window.supabase && window.supabase.createClient) {
      sb = window.supabase.createClient(SB_URL, SB_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    window._sb = sb;
  } catch (e) { }

  /* ── Rastros del retorno desde un email (antes de que Supabase limpie la URL) ── */
  var rawHash = location.hash || '', rawSearch = location.search || '';
  var FROM_EMAIL = /access_token=/.test(rawHash) || /[?&]code=/.test(rawSearch);
  var IS_RECOVERY = /type=recovery/.test(rawHash) || /type=recovery/.test(rawSearch);
  var EMAIL_ERROR = null;
  (function () {
    var m = (rawHash + rawSearch).match(/error_description=([^&]+)/);
    if (m) { try { EMAIL_ERROR = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { EMAIL_ERROR = m[1]; } }
  })();
  function cleanURL() {
    try { history.replaceState(null, '', location.pathname); } catch (e) { }
  }

  /* ── Perfil (metadata de la cuenta ⇄ storage compartido) ──────── */
  function readLocal() {
    try { var s = localStorage.getItem(LS_COACH); return s ? (JSON.parse(s) || {}) : {}; } catch (e) { return {}; }
  }
  function writeLocal(p) {
    var cur = readLocal();
    Object.keys(p || {}).forEach(function (k) { if (p[k] != null) cur[k] = p[k]; });
    try { localStorage.setItem(LS_COACH, JSON.stringify(cur)); } catch (e) { }
    if (p && (p.equipo || '').trim()) {
      try { localStorage.setItem(LS_ESF, p.equipo.trim()); } catch (e) { }
    }
    return cur;
  }
  function profileFromMeta(meta) {
    meta = meta || {};
    return {
      nombre: (meta.nombre || meta.full_name || meta.name || '').trim(),
      apellido: (meta.apellido || '').trim(),
      rol: (meta.rol || '').trim(),
      club: (meta.club || '').trim(),
      equipo: (meta.equipo || '').trim(),
      categoria: (meta.categoria || '').trim(),
      temporada: (meta.temporada || '').trim()
    };
  }
  var CURRENT = { user: null, profile: readLocal() };
  function currentProfile() { return CURRENT.profile || readLocal(); }

  function broadcast() {
    try { document.dispatchEvent(new CustomEvent('sp:profile', { detail: currentProfile() })); } catch (e) { }
  }

  /* Guarda perfil en la cuenta + siembra el storage que leen las secciones */
  function persistProfile(p, done) {
    var meta = {
      nombre: p.nombre, apellido: p.apellido, rol: p.rol,
      club: p.club, equipo: p.equipo, categoria: p.categoria, temporada: p.temporada,
      full_name: (p.nombre + ' ' + (p.apellido || '')).trim(),
      onboarded: true
    };
    CURRENT.profile = p;
    writeLocal(p);
    broadcast();
    if (!sb) { done && done(); return; }
    sb.auth.updateUser({ data: meta }).then(function () { done && done(); })
      .catch(function () { done && done(); });
  }

  /* ── Promise pública ──────────────────────────────────────────── */
  var readyResolve;
  var ready = new Promise(function (r) { readyResolve = r; });

  window.ScoutPro = {
    sb: sb,
    ready: ready,
    profile: currentProfile,
    logout: doLogout,
    editProfile: function () { openWizard(true); }
  };
  if (!window.authLogout) window.authLogout = doLogout;

  function doLogout() {
    var fin = function () {
      try { localStorage.removeItem(LS_COACH); } catch (e) { }
      location.href = 'index.html';
    };
    if (sb) sb.auth.signOut().then(fin).catch(fin); else fin();
  }

  /* ═══════════════════════ UI ═══════════════════════ */

  var css = ''
    + '#spc-root{position:fixed;inset:0;z-index:9500;display:none;align-items:center;justify-content:center;padding:22px;'
    + 'background:radial-gradient(130% 100% at 22% 18%,#15171f 0%,#0a0b10 58%,#07080c 100%);'
    + "font-family:'DM Sans',system-ui,-apple-system,sans-serif;color:#fff;overflow:auto}"
    + '#spc-root.on{display:flex}'
    + 'body.spc-locked>*:not(#spc-root){filter:blur(6px) saturate(.7);pointer-events:none;user-select:none}'
    + '.spc-card{width:408px;max-width:100%;background:#0f1117;border:1px solid rgba(255,255,255,.09);border-radius:20px;'
    + 'padding:30px 28px 26px;box-shadow:0 30px 80px rgba(0,0,0,.55);margin:auto}'
    + ".spc-logo{font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:34px;letter-spacing:.01em;text-transform:uppercase;line-height:1;text-align:center}"
    + '.spc-logo span{color:#f97316}'
    + ".spc-tag{font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:#8891a0;text-align:center;margin:7px 0 22px}"
    + '.spc-tabs{display:flex;gap:5px;background:#161820;padding:4px;border-radius:11px;margin-bottom:20px}'
    + ".spc-tab{flex:1;text-align:center;padding:9px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;"
    + 'color:#8891a0;border-radius:8px;cursor:pointer;border:1px solid transparent;transition:.15s}'
    + '.spc-tab.active{color:#f97316;background:rgba(249,115,22,.14);border-color:rgba(249,115,22,.4)}'
    + '.spc-field{display:flex;flex-direction:column;gap:6px;margin-bottom:13px}'
    + ".spc-field label{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#8891a0}"
    + '.spc-field input,.spc-field select{background:#161820;border:1px solid rgba(255,255,255,.09);border-radius:10px;color:#fff;'
    + "padding:11px 13px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;width:100%;transition:border-color .15s}"
    + '.spc-field input:focus,.spc-field select:focus{border-color:rgba(249,115,22,.55)}'
    + '.spc-field select{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'7\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%238891a0\' stroke-width=\'1.6\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E");'
    + 'background-repeat:no-repeat;background-position:right 13px center;padding-right:34px}'
    + '.spc-row{display:flex;gap:10px}.spc-row .spc-field{flex:1}'
    + '.spc-btn{width:100%;padding:13px;border:none;border-radius:11px;cursor:pointer;'
    + "font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:17px;letter-spacing:.06em;text-transform:uppercase;"
    + 'background:linear-gradient(135deg,#f97316,#c2410c);color:#fff;transition:.15s;margin-top:4px}'
    + '.spc-btn:hover{filter:brightness(1.08)}.spc-btn:disabled{opacity:.55;cursor:default}'
    + '.spc-btn.ghost{background:#161820;border:1px solid rgba(255,255,255,.12);color:#c4cad6}'
    + '.spc-msg{margin-top:12px;font-size:12.5px;line-height:1.5;text-align:center;color:#8891a0;min-height:16px}'
    + '.spc-msg.err{color:#f87171}.spc-msg.ok{color:#4ade80}'
    + ".spc-link{display:block;margin-top:14px;text-align:center;font-family:'DM Mono',monospace;font-size:11px;"
    + 'letter-spacing:.06em;color:#8891a0;cursor:pointer;text-decoration:none}'
    + '.spc-link:hover{color:#f97316}'
    + '.spc-steps{display:flex;gap:7px;justify-content:center;margin:2px 0 20px}'
    + '.spc-step{width:26px;height:4px;border-radius:2px;background:#1e202a;transition:.2s}'
    + '.spc-step.on{background:#f97316}'
    + ".spc-h{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:24px;letter-spacing:.02em;text-transform:uppercase;text-align:center;margin-bottom:4px}"
    + '.spc-sub{font-size:13px;color:#8891a0;text-align:center;line-height:1.55;margin-bottom:20px}'
    + '.spc-sum{background:#161820;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px 16px;margin-bottom:16px}'
    + '.spc-sum div{display:flex;justify-content:space-between;gap:14px;padding:5px 0;font-size:13px}'
    + ".spc-sum b{font-weight:600}.spc-sum span{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#8891a0;padding-top:2px}"
    + '.spc-mail{width:58px;height:58px;border-radius:16px;background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.4);'
    + 'display:flex;align-items:center;justify-content:center;margin:0 auto 16px}'
    + '.spc-mail svg{width:26px;height:26px;stroke:#f97316}'
    + '@media(max-width:480px){.spc-card{padding:24px 18px}.spc-row{flex-direction:column;gap:0}}';

  var style = document.createElement('style'); style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  /* Fuentes: si la página no las cargó, las traemos nosotros */
  (function () {
    var has = !!document.querySelector('link[href*="Barlow+Condensed"]');
    if (!has) {
      var l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap';
      (document.head || document.documentElement).appendChild(l);
    }
  })();

  var root = null;
  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div'); root.id = 'spc-root';
    if (document.body) document.body.appendChild(root);
    else document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(root); });
    return root;
  }
  function show(html) {
    ensureRoot();
    var paint = function () {
      root.innerHTML = html;
      root.classList.add('on');
      document.body.classList.add('spc-locked');
      document.body.classList.add('auth-locked'); // compatibilidad con el CSS previo de cada sección
    };
    if (document.body) paint(); else document.addEventListener('DOMContentLoaded', paint);
  }
  function hide() {
    if (root) { root.classList.remove('on'); root.innerHTML = ''; }
    if (document.body) {
      document.body.classList.remove('spc-locked');
      document.body.classList.remove('auth-locked');
    }
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function setMsg(t, k) { var m = $('spc-msg'); if (!m) return; m.textContent = t || ''; m.className = 'spc-msg' + (k ? ' ' + k : ''); }
  function head() {
    return '<div class="spc-logo">Scout<span>Pro</span></div>'
      + '<div class="spc-tag">Basketball Intelligence</div>';
  }

  function humanErr(e) {
    var m = (e && e.message) ? e.message : String(e || '');
    if (/Invalid login/i.test(m)) return 'Email o contraseña incorrectos.';
    if (/already registered|already exists|User already/i.test(m)) return 'Ese email ya tiene cuenta. Probá ingresar.';
    if (/at least 6|password should be|weak/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
    if (/Email not confirmed|confirm/i.test(m)) return 'Tu email todavía no está confirmado. Revisá tu bandeja de entrada.';
    if (/rate limit|too many|security purposes/i.test(m)) return 'Demasiados intentos. Esperá un minuto y volvé a probar.';
    if (/expired|invalid.*token|otp/i.test(m)) return 'El enlace del email venció o ya fue usado. Pedí uno nuevo.';
    if (/network|fetch/i.test(m)) return 'No hay conexión con el servidor. Revisá tu internet.';
    return m;
  }

  /* ── Vista: login / crear cuenta ──────────────────────────────── */
  var mode = 'login';
  function viewAuth(preMsg, preKind) {
    show('<div class="spc-card">' + head()
      + '<div class="spc-tabs">'
      + '<div class="spc-tab' + (mode === 'login' ? ' active' : '') + '" id="spc-tab-login">Ingresar</div>'
      + '<div class="spc-tab' + (mode === 'signup' ? ' active' : '') + '" id="spc-tab-signup">Crear cuenta</div>'
      + '</div>'
      + '<div class="spc-field"><label>Email</label><input type="email" id="spc-email" placeholder="tu@email.com" autocomplete="email"></div>'
      + '<div class="spc-field"><label>Contraseña</label><input type="password" id="spc-pass" placeholder="••••••••" autocomplete="' + (mode === 'signup' ? 'new-password' : 'current-password') + '"></div>'
      + '<button class="spc-btn" id="spc-submit">' + (mode === 'login' ? 'Ingresar' : 'Crear cuenta') + '</button>'
      + '<div class="spc-msg" id="spc-msg"></div>'
      + (mode === 'login' ? '<a class="spc-link" id="spc-forgot">¿Olvidaste tu contraseña?</a>' : '<div class="spc-msg" style="min-height:0">Después de crearla te pedimos los datos de tu equipo.</div>')
      + '</div>');
    if (preMsg) setMsg(preMsg, preKind || '');
    $('spc-tab-login').onclick = function () { mode = 'login'; viewAuth(); };
    $('spc-tab-signup').onclick = function () { mode = 'signup'; viewAuth(); };
    $('spc-pass').onkeydown = function (ev) { if (ev.key === 'Enter') submitAuth(); };
    $('spc-email').onkeydown = function (ev) { if (ev.key === 'Enter') $('spc-pass').focus(); };
    $('spc-submit').onclick = submitAuth;
    var fg = $('spc-forgot'); if (fg) fg.onclick = viewForgot;
    setTimeout(function () { var e = $('spc-email'); if (e) e.focus(); }, 40);
  }

  function submitAuth() {
    if (!sb) { setMsg('No se pudo conectar al servidor. Recargá la página.', 'err'); return; }
    var email = ($('spc-email').value || '').trim(), pass = $('spc-pass').value || '';
    if (!email || !pass) { setMsg('Completá email y contraseña.', 'err'); return; }
    var btn = $('spc-submit'); btn.disabled = true; setMsg('');
    if (mode === 'signup') {
      var opts = {};
      var ru = returnURL(); if (ru) opts.emailRedirectTo = ru;
      sb.auth.signUp({ email: email, password: pass, options: opts })
        .then(function (r) {
          if (r.error) throw r.error;
          if (r.data && r.data.session) {
            // Confirmación de email desactivada en el proyecto → directo al registro
            openWizard(false);
          } else {
            viewCheckEmail(email);
          }
        })
        .catch(function (e) { btn.disabled = false; setMsg(humanErr(e), 'err'); });
    } else {
      sb.auth.signInWithPassword({ email: email, password: pass })
        .then(function (r) {
          if (r.error) throw r.error;
          // Recarga limpia: todas las secciones arrancan ya con sesión
          location.reload();
        })
        .catch(function (e) { btn.disabled = false; setMsg(humanErr(e), 'err'); });
    }
  }

  /* ── Vista: revisá tu email ───────────────────────────────────── */
  function viewCheckEmail(email) {
    show('<div class="spc-card">' + head()
      + '<div class="spc-mail"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg></div>'
      + '<div class="spc-h">Revisá tu email</div>'
      + '<div class="spc-sub">Te enviamos un enlace de confirmación a<br><b style="color:#fff">' + esc(email) + '</b><br><br>'
      + 'Al tocarlo volvés acá y seguimos con el registro de tu equipo. Si no aparece, mirá en correo no deseado.</div>'
      + '<button class="spc-btn ghost" id="spc-resend">Reenviar email</button>'
      + '<div class="spc-msg" id="spc-msg"></div>'
      + '<a class="spc-link" id="spc-back">← Volver</a>'
      + '</div>');
    $('spc-back').onclick = function () { mode = 'login'; viewAuth(); };
    $('spc-resend').onclick = function () {
      var b = $('spc-resend'); b.disabled = true;
      var opts = { type: 'signup', email: email };
      var ru = returnURL(); if (ru) opts.options = { emailRedirectTo: ru };
      sb.auth.resend(opts)
        .then(function (r) { if (r.error) throw r.error; setMsg('Listo, te lo reenviamos.', 'ok'); setTimeout(function () { b.disabled = false; }, 30000); })
        .catch(function (e) { b.disabled = false; setMsg(humanErr(e), 'err'); });
    };
  }

  /* ── Vista: recuperar contraseña ──────────────────────────────── */
  function viewForgot() {
    show('<div class="spc-card">' + head()
      + '<div class="spc-h">Recuperar acceso</div>'
      + '<div class="spc-sub">Escribí tu email y te mandamos un enlace para definir una contraseña nueva.</div>'
      + '<div class="spc-field"><label>Email</label><input type="email" id="spc-email" placeholder="tu@email.com" autocomplete="email"></div>'
      + '<button class="spc-btn" id="spc-send">Enviar enlace</button>'
      + '<div class="spc-msg" id="spc-msg"></div>'
      + '<a class="spc-link" id="spc-back">← Volver a ingresar</a>'
      + '</div>');
    $('spc-back').onclick = function () { mode = 'login'; viewAuth(); };
    $('spc-send').onclick = function () {
      var email = ($('spc-email').value || '').trim();
      if (!email) { setMsg('Escribí tu email.', 'err'); return; }
      var b = $('spc-send'); b.disabled = true;
      var opts = {}; var ru = returnURL(); if (ru) opts.redirectTo = ru;
      sb.auth.resetPasswordForEmail(email, opts)
        .then(function (r) { if (r.error) throw r.error; setMsg('Enlace enviado. Revisá tu email.', 'ok'); })
        .catch(function (e) { setMsg(humanErr(e), 'err'); })
        .then(function () { setTimeout(function () { b.disabled = false; }, 20000); });
    };
  }

  /* ── Vista: nueva contraseña (llegó desde email de recuperación) ─ */
  function viewNewPassword() {
    show('<div class="spc-card">' + head()
      + '<div class="spc-h">Nueva contraseña</div>'
      + '<div class="spc-sub">Definí la contraseña con la que vas a entrar de ahora en más.</div>'
      + '<div class="spc-field"><label>Nueva contraseña</label><input type="password" id="spc-p1" placeholder="Mínimo 6 caracteres" autocomplete="new-password"></div>'
      + '<div class="spc-field"><label>Repetila</label><input type="password" id="spc-p2" placeholder="••••••••" autocomplete="new-password"></div>'
      + '<button class="spc-btn" id="spc-save">Guardar y entrar</button>'
      + '<div class="spc-msg" id="spc-msg"></div>'
      + '</div>');
    $('spc-save').onclick = function () {
      var a = $('spc-p1').value || '', b = $('spc-p2').value || '';
      if (a.length < 6) { setMsg('Mínimo 6 caracteres.', 'err'); return; }
      if (a !== b) { setMsg('Las contraseñas no coinciden.', 'err'); return; }
      var btn = $('spc-save'); btn.disabled = true;
      sb.auth.updateUser({ password: a })
        .then(function (r) { if (r.error) throw r.error; cleanURL(); location.reload(); })
        .catch(function (e) { btn.disabled = false; setMsg(humanErr(e), 'err'); });
    };
  }

  /* ── Asistente de registro (onboarding) ───────────────────────── */
  var wiz = { step: 1, data: {}, editing: false };

  function openWizard(editing) {
    var p = currentProfile();
    var meta = (CURRENT.user && CURRENT.user.user_metadata) || {};
    var base = profileFromMeta(meta);
    wiz = {
      step: 1, editing: !!editing,
      data: {
        nombre: p.nombre || base.nombre || '',
        apellido: p.apellido || base.apellido || '',
        rol: p.rol || base.rol || '',
        club: p.club || base.club || '',
        equipo: p.equipo || base.equipo || '',
        categoria: p.categoria || base.categoria || '',
        temporada: p.temporada || base.temporada || ''
      }
    };
    renderWizard();
  }

  function stepsBar() {
    var h = '<div class="spc-steps">';
    for (var i = 1; i <= 3; i++) h += '<div class="spc-step' + (i <= wiz.step ? ' on' : '') + '"></div>';
    return h + '</div>';
  }
  function grab(ids) {
    ids.forEach(function (id) {
      var el = $('spc-' + id); if (el) wiz.data[id] = (el.value || '').trim();
    });
  }

  function renderWizard() {
    var d = wiz.data, body = '', confirmedNote = '';
    if (!wiz.editing && FROM_EMAIL && wiz.step === 1) {
      confirmedNote = '<div class="spc-msg ok" style="margin:-8px 0 14px">✓ Email confirmado</div>';
    }
    if (wiz.step === 1) {
      body = '<div class="spc-h">' + (wiz.editing ? 'Tu perfil' : 'Bienvenido a ScoutPRO') + '</div>'
        + '<div class="spc-sub">' + (wiz.editing ? 'Actualizá tus datos. Todas las secciones los toman de acá.' : 'Primero, contanos quién sos.') + '</div>'
        + confirmedNote
        + '<div class="spc-row">'
        + '<div class="spc-field"><label>Nombre</label><input id="spc-nombre" value="' + esc(d.nombre) + '" placeholder="Ej: Santiago" autocomplete="given-name"></div>'
        + '<div class="spc-field"><label>Apellido</label><input id="spc-apellido" value="' + esc(d.apellido) + '" placeholder="Ej: García" autocomplete="family-name"></div>'
        + '</div>'
        + '<div class="spc-field"><label>Rol en el staff</label><select id="spc-rol">'
        + '<option value="">— Elegí tu rol —</option>'
        + ROLES.map(function (r) { return '<option value="' + r[0] + '"' + (d.rol === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('')
        + '</select></div>'
        + '<button class="spc-btn" id="spc-next">Siguiente</button>'
        + '<div class="spc-msg" id="spc-msg"></div>';
    } else if (wiz.step === 2) {
      body = '<div class="spc-h">Tu equipo</div>'
        + '<div class="spc-sub">Con esto cada sección — partidos, estadístico, esfuerzo, video — ya sabe para qué equipo trabaja.</div>'
        + '<div class="spc-field"><label>Club</label><input id="spc-club" value="' + esc(d.club) + '" placeholder="Ej: Malvín"></div>'
        + '<div class="spc-field"><label>Equipo (como figura en las planillas)</label><input id="spc-equipo" value="' + esc(d.equipo) + '" placeholder="Ej: MALVIN"></div>'
        + '<div class="spc-row">'
        + '<div class="spc-field"><label>Categoría</label><input id="spc-categoria" value="' + esc(d.categoria) + '" placeholder="Ej: U19 / Primera"></div>'
        + '<div class="spc-field"><label>Temporada</label><input id="spc-temporada" value="' + esc(d.temporada) + '" placeholder="Ej: 2026"></div>'
        + '</div>'
        + '<button class="spc-btn" id="spc-next">Siguiente</button>'
        + '<div class="spc-msg" id="spc-msg"></div>'
        + '<a class="spc-link" id="spc-prev">← Atrás</a>';
    } else {
      var rolTxt = (ROLES.filter(function (r) { return r[0] === d.rol; })[0] || ['', '—'])[1];
      body = '<div class="spc-h">Todo listo</div>'
        + '<div class="spc-sub">Revisá que esté bien. Lo podés cambiar cuando quieras desde tu perfil.</div>'
        + '<div class="spc-sum">'
        + '<div><span>Coach</span><b>' + esc((d.nombre + ' ' + d.apellido).trim() || '—') + '</b></div>'
        + '<div><span>Rol</span><b>' + esc(rolTxt) + '</b></div>'
        + '<div><span>Club</span><b>' + esc(d.club || '—') + '</b></div>'
        + '<div><span>Equipo</span><b>' + esc(d.equipo || '—') + '</b></div>'
        + (d.categoria ? '<div><span>Categoría</span><b>' + esc(d.categoria) + '</b></div>' : '')
        + (d.temporada ? '<div><span>Temporada</span><b>' + esc(d.temporada) + '</b></div>' : '')
        + '</div>'
        + '<button class="spc-btn" id="spc-finish">' + (wiz.editing ? 'Guardar cambios' : 'Entrar a ScoutPRO') + '</button>'
        + '<div class="spc-msg" id="spc-msg"></div>'
        + '<a class="spc-link" id="spc-prev">← Atrás</a>';
    }
    show('<div class="spc-card">' + head() + stepsBar() + body + '</div>');

    var next = $('spc-next'), prev = $('spc-prev'), fin = $('spc-finish');
    if (next) next.onclick = function () {
      if (wiz.step === 1) {
        grab(['nombre', 'apellido', 'rol']);
        if (!wiz.data.nombre) { setMsg('Escribí tu nombre.', 'err'); return; }
        if (!wiz.data.rol) { setMsg('Elegí tu rol en el staff.', 'err'); return; }
      } else if (wiz.step === 2) {
        grab(['club', 'equipo', 'categoria', 'temporada']);
        if (!wiz.data.club) { setMsg('Escribí el nombre de tu club.', 'err'); return; }
        if (!wiz.data.equipo) { setMsg('Escribí el nombre de tu equipo.', 'err'); return; }
      }
      wiz.step++; renderWizard();
    };
    if (prev) prev.onclick = function () { wiz.step--; renderWizard(); };
    if (fin) fin.onclick = function () {
      fin.disabled = true;
      persistProfile(wiz.data, function () {
        cleanURL();
        if (wiz.editing) { hide(); finishReady(); }
        else location.reload();
      });
    };
    setTimeout(function () {
      var f = $('spc-nombre') || $('spc-club'); if (f && !wiz.editing) f.focus();
    }, 40);
  }

  /* ── Cierre: sesión válida + registro completo ────────────────── */
  var resolved = false;
  function finishReady() {
    hide();
    if (!resolved) { resolved = true; readyResolve({ user: CURRENT.user, profile: currentProfile() }); }
    broadcast();
  }

  /* ── Arranque ─────────────────────────────────────────────────── */
  function boot() {
    if (!sb) {
      show('<div class="spc-card">' + head()
        + '<div class="spc-h">Sin conexión</div>'
        + '<div class="spc-sub">No se pudo conectar al servidor. Revisá tu internet y recargá la página.</div>'
        + '<button class="spc-btn" onclick="location.reload()">Recargar</button></div>');
      return;
    }

    sb.auth.onAuthStateChange(function (ev) {
      if (ev === 'PASSWORD_RECOVERY') viewNewPassword();
    });

    sb.auth.getSession().then(function (r) {
      var session = r && r.data && r.data.session;
      if (session) {
        CURRENT.user = session.user;
        var meta = session.user.user_metadata || {};
        if (IS_RECOVERY) { viewNewPassword(); return; }
        if (meta.onboarded) {
          // La cuenta manda: sembramos el storage compartido para que
          // cada sección adopte el mismo equipo desde el arranque.
          CURRENT.profile = profileFromMeta(meta);
          writeLocal(CURRENT.profile);
          if (FROM_EMAIL) cleanURL();
          finishReady();
        } else {
          if (FROM_EMAIL) cleanURL();
          openWizard(false);   // registro inicial: identidad + equipo
        }
      } else {
        if (EMAIL_ERROR) { mode = 'login'; viewAuth(humanErr({ message: EMAIL_ERROR }), 'err'); }
        else { mode = 'login'; viewAuth(); }
      }
    }).catch(function () { mode = 'login'; viewAuth(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
