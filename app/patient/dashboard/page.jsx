import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Mon espace — MONGANGA", "robots": {"index": false, "follow": false}};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/patient.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<a className={"skip-link"} href={"#main-content"}>{"Aller au contenu"}</a>
<header className={"pat-header"}>
<div className={"pat-header-inner"}>
<a className={"logo"} href={"/"}>
<div className={"logo-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"logo-text"}>{"MONGANGA"}</span>
</a>
<nav className={"pat-nav"}>
<a className={"pat-nav-link active"} href={"/patient/dashboard"} aria-current={"page"}><i data-lucide={"home"}></i>{" Accueil"}</a>
<a className={"pat-nav-link"} href={"/patient/search"}><i data-lucide={"search"}></i>{" Rechercher"}</a>
<a className={"pat-nav-link"} href={"/patient/history"}><i data-lucide={"calendar"}></i>{" Mes RDV"}</a>
<a className={"pat-nav-link"} href={"/patient/prescription"}><i data-lucide={"file-text"}></i>{" Ordonnances"}</a>
<a className={"pat-nav-link"} href={"/patient/profile"}><i data-lucide={"user"}></i>{" Profil"}</a>
</nav>
<div className={"pat-header-actions"}>
<button className={"btn btn-ghost btn-icon"} aria-label={"Thème"} data-theme-button={""}>
<i data-lucide={"moon"} data-theme-icon={""}></i>
</button>
<button className={"btn btn-ghost btn-icon"} aria-label={"Ouvrir les notifications"} data-notifications={""}>
<i data-lucide={"bell"}></i>
</button>
<button className={"btn btn-ghost btn-icon"} aria-label={"Déconnexion"} data-logout={""}>
<i data-lucide={"log-out"}></i>
</button>
<button className={"btn btn-ghost btn-icon"} data-legacy-click={"toggleMenu()"} aria-label={"Menu"} style={{"display": "none"}} id={"patMenuBtn"}>
<i data-lucide={"menu"}></i>
</button>
</div>
</div>
</header>
<div className={"pat-menu-overlay"} id={"patMenuOverlay"} data-legacy-click={"toggleMenu()"}></div>
<aside className={"pat-menu"} id={"patMenu"}>
<div className={"pat-menu-header"}>
<span style={{"fontWeight": "800"}}>{"Menu"}</span>
<button className={"btn btn-ghost btn-icon"} data-legacy-click={"toggleMenu()"}><i data-lucide={"x"}></i></button>
</div>
<div className={"pat-menu-content"}>
<a className={"pat-menu-item active"} href={"/patient/dashboard"} aria-current={"page"}><i data-lucide={"home"}></i>{" Accueil"}</a>
<a className={"pat-menu-item"} href={"/patient/search"}><i data-lucide={"search"}></i>{" Rechercher"}</a>
<a className={"pat-menu-item"} href={"/patient/history"}><i data-lucide={"calendar"}></i>{" Mes RDV"}</a>
<a className={"pat-menu-item"} href={"/patient/prescription"}><i data-lucide={"file-text"}></i>{" Ordonnances"}</a>
<a className={"pat-menu-item"} href={"/patient/profile"}><i data-lucide={"user"}></i>{" Profil"}</a>
<div style={{"marginTop": "24px", "paddingTop": "16px", "borderTop": "1px solid var(--border)"}}>
<a className={"pat-menu-item"} data-logout={""} role={"button"} tabIndex={"0"}><i data-lucide={"log-out"}></i>{" Déconnexion"}</a>
</div>
</div>
</aside>
<main className={"pat-main"} id={"main-content"} tabIndex={"-1"}>
<div id={"page-status"} role={"status"} className={"layout-status"}>{"Chargement de votre espace…"}</div><div className={"pat-content"} data-dashboard-content={""}><div><p id={"mode-indicator"} className={"layout-demo"} hidden={true}></p><p id={"offline-notice"} className={"notice warning"} role={"status"} hidden={true}>{"Connexion internet indisponible."}</p></div>
<div className={"fade-in"} style={{"marginBottom": "32px"}}>
<h1 className={"pat-page-title"} id={"dashboard-greeting"}>{"Bonjour Aline 👋"}</h1>
<p className={"pat-page-sub"}>{"Que puis-je faire pour vous aujourd'hui ?"}</p>
</div>

<div className={"kpi-grid"} data-stagger={""} style={{"marginBottom": "32px"}}>
<div className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"calendar-check"}></i>{" Prochains RDV"}</div>
<div className={"kpi-value"} id={"metric-0"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-0"}></span>
</div>
<div className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"file-text"}></i>{" Ordonnances"}</div>
<div className={"kpi-value"} id={"metric-1"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-1"}></span>
</div>
<div className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"history"}></i>{" Consultations"}</div>
<div className={"kpi-value"} id={"metric-2"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-2"}></span>
</div>
<div className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"credit-card"}></i>{" Dépenses ce mois"}</div>
<div className={"kpi-value"} id={"metric-3"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-3"}></span>
</div>
</div>

<div className={"card card-block mb-6 slide-up"}>
<div className={"card-header-row"}>
<div>
<div className={"card-title"}>{"Prochain rendez-vous"}</div>
<div className={"card-subtitle"} id={"next-rdv-label"}>{"Jeudi 24 septembre 2026 — 10h00"}</div>
</div>
<span className={"badge success"} id={"next-rdv-status"}><i data-lucide={"check-circle-2"}></i>{" Confirmé"}</span>
</div>
<div style={{"display": "flex", "gap": "14px", "alignItems": "center", "padding": "16px", "background": "var(--surface-2)", "borderRadius": "var(--r-md)", "flexWrap": "wrap"}}>
<div className={"table-avatar"} id={"next-rdv-avatar"} style={{"width": "48px", "height": "48px", "fontSize": "15px"}}>{"DI"}</div>
<div style={{"flex": "1", "minWidth": "180px"}}>
<div style={{"fontWeight": "700", "fontSize": "15px"}} id={"next-rdv-doctor"}>{"Dr Ilunga"}</div>
<div style={{"fontSize": "12.5px", "color": "var(--text-2)"}} id={"next-rdv-specialty"}>{"Consultation générale • Vidéo"}</div>
</div>
<a className={"btn btn-primary"} href={"/patient/consult"} id={"next-rdv-link"}>
<i data-lucide={"video"}></i>{" Rejoindre\n        "}</a>
</div>
</div>

<div className={"card card-block slide-up"}>
<div className={"card-header-row"}>
<div className={"card-title"}>{"Actions rapides"}</div>
</div>
<div className={"grid-3"}>
<a className={"btn btn-secondary"} style={{"justifyContent": "flex-start", "padding": "16px", "height": "auto"}} href={"/patient/search"}>
<i data-lucide={"search"}></i>{" Trouver un médecin\n        "}</a>
<a className={"btn btn-secondary"} style={{"justifyContent": "flex-start", "padding": "16px", "height": "auto"}} href={"/patient/history"}>
<i data-lucide={"calendar"}></i>{" Voir mes RDV\n        "}</a>
<a className={"btn btn-secondary"} style={{"justifyContent": "flex-start", "padding": "16px", "height": "auto"}} href={"/patient/prescription"}>
<i data-lucide={"file-text"}></i>{" Mes ordonnances\n        "}</a>
</div>
</div>
</div>
</main>
<nav className={"pat-mobile-nav"}>
<a className={"pat-mobile-item active"} href={"/patient/dashboard"} aria-current={"page"}><i data-lucide={"home"}></i><span>{"Accueil"}</span></a>
<a className={"pat-mobile-item"} href={"/patient/search"}><i data-lucide={"search"}></i><span>{"Rechercher"}</span></a>
<a className={"pat-mobile-item"} href={"/patient/history"}><i data-lucide={"calendar"}></i><span>{"Mes RDV"}</span></a>
<a className={"pat-mobile-item"} href={"/patient/prescription"}><i data-lucide={"file-text"}></i><span>{"Ordonnances"}</span></a>
<a className={"pat-mobile-item"} href={"/patient/profile"}><i data-lucide={"user"}></i><span>{"Profil"}</span></a>
</nav>

<Runtime body={{"data-role": "patient", "data-auth-state": "pending", "data-page": "patientDashboard", "data-static-layout": "true"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/restored-dashboards.js", "/assets/js/restored-shell.js"]} />
</>);
}
