import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Dashboard Admin | MONGANGA", "robots": {"index": false, "follow": false}};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/styles.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/doctor.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<a className={"skip-link"} href={"#main-content"}>{"Aller au contenu"}</a>
<div className={"doctor-shell"}>
<aside className={"doctor-sidebar"} id={"workspace-sidebar"}>
<div className={"doctor-brand"}>
<div className={"doctor-brand-mark logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<div className={"doctor-brand-text"}>
<strong>{"MONGANGA"}</strong>
<span>{"Admin"}</span>
</div>
</div>
<nav className={"doctor-nav"} aria-label={"Navigation admin"}>
<a className={"doctor-nav-link active"} href={"/admin/dashboard"} aria-current={"page"}><i data-lucide={"layout-grid"}></i>{" Tableau de bord"}</a>
<a className={"doctor-nav-link"} href={"/admin/validations"}><i data-lucide={"shield-check"}></i>{" Validations"}</a>
<a className={"doctor-nav-link"} href={"/admin/transactions"}><i data-lucide={"wallet"}></i>{" Transactions"}</a>
<a className={"doctor-nav-link"} href={"/admin/users"}><i data-lucide={"users"}></i>{" Utilisateurs"}</a>
<a className={"doctor-nav-link"} href={"/admin/reports"}><i data-lucide={"bar-chart-3"}></i>{" Rapports"}</a>
</nav>
<div className={"doctor-profile-box"}>
<div className={"doctor-mini-user"}>
<div className={"doctor-mini-avatar"}>{"AD"}</div>
<div className={"doctor-mini-meta"}>
<strong>{"Admin"}</strong>
<span>{"Superviseur"}</span>
</div>
</div>
</div>
<div className={"sidebar-controls"}><button className={"btn btn-ghost btn-icon"} type={"button"} data-theme-button={""} aria-label={"Changer de thème"}><i data-lucide={"moon"}></i></button><button className={"btn btn-ghost btn-icon"} type={"button"} data-logout={""} aria-label={"Se déconnecter"}><i data-lucide={"log-out"}></i></button><button className={"btn btn-ghost btn-icon workspace-menu-btn"} type={"button"} data-sidebar-toggle={""} aria-label={"Fermer le menu"}><i data-lucide={"x"}></i></button></div></aside>
<main className={"doctor-main"} id={"main-content"} tabIndex={"-1"}><button className={"btn btn-secondary btn-sm workspace-menu-btn"} type={"button"} data-sidebar-toggle={""} aria-controls={"workspace-sidebar"} aria-expanded={"false"}><i data-lucide={"menu"}></i>{" Menu"}</button><div><p id={"mode-indicator"} className={"layout-demo"} hidden={true}></p><p id={"offline-notice"} className={"notice warning"} role={"status"} hidden={true}>{"Connexion internet indisponible."}</p></div>
<header className={"doctor-topbar"}>
<div>
<h1 className={"doctor-page-title"}>{"Tableau de bord"}</h1>
<p className={"doctor-page-subtitle"}>{"Vue d’ensemble de la plateforme et des performances."}</p>
</div>
<div className={"doctor-header-actions"}>
<button className={"btn btn-secondary btn-sm"} type={"button"} id={"export-summary"}><i data-lucide={"download"}></i>{" Exporter"}</button>
<button className={"btn btn-primary btn-sm"} type={"button"} data-legacy-click={"location.href='reports.html'"}><i data-lucide={"plus"}></i>{" Nouveau rapport"}</button>
<button className={"btn btn-ghost btn-icon"} type={"button"} aria-label={"Ouvrir les notifications"} data-notifications={""}><i data-lucide={"bell"}></i></button>
</div>
</header>
<div id={"page-status"} role={"status"} className={"layout-status"}>{"Chargement de votre espace…"}</div><div className={"doctor-main-grid"} data-dashboard-content={""}>
<section className={"kpi-grid"} data-stagger={""}>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"users"}></i>{" Utilisateurs actifs"}</div>
<div className={"kpi-value"} id={"metric-0"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-0"}></span>
</article>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"stethoscope"}></i>{" Médecins inscrits"}</div>
<div className={"kpi-value"} id={"metric-1"}>{"—"}</div>
<span className={"kpi-trend neutral"} id={"metric-note-1"}></span>
</article>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"clipboard-check"}></i>{" Demandes validées"}</div>
<div className={"kpi-value"} id={"metric-2"}>{"—"}</div>
<span className={"kpi-trend success"} id={"metric-note-2"}></span>
</article>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"wallet"}></i>{" Volume transactions"}</div>
<div className={"kpi-value"} id={"metric-3"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-3"}></span>
</article>
</section>
<section className={"section-row"}>
<div className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Croissance utilisateurs"}</h2>
<div className={"card-subtitle"} id={"growth-range"}>{"6 derniers mois"}</div>
</div>
<select className={"form-input"} aria-label={"Période de croissance"} style={{"width": "auto", "height": "34px"}} id={"growth-period"}><option value={"month"}>{"Mois"}</option><option value={"week"}>{"Semaine"}</option><option value={"year"}>{"Année"}</option></select></div>
<div className={"bar-chart"} aria-label={"Graphique de croissance utilisateurs"} id={"dashboard-chart"}></div>
</div>
<div className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Activités récentes"}</h2>
<div className={"card-subtitle"}>{"Évolution système"}</div>
</div>
</div>
<div className={"timeline-list"} id={"dashboard-activity"}></div>
</div>
</section>
<section className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Performance globale"}</h2>
<div className={"card-subtitle"}>{"Vue synthétique"}</div>
</div>
</div>
<div className={"perf-grid"}>
<div className={"perf-card"}>
<div style={{"fontSize": "12px", "color": "var(--text-2)", "marginBottom": "8px"}}>{"Taux de rétention"}</div>
<div style={{"fontSize": "28px", "fontWeight": "800"}} id={"performance-0"}>{"—"}</div>
</div>
<div className={"perf-card"}>
<div style={{"fontSize": "12px", "color": "var(--text-2)", "marginBottom": "8px"}}>{"Consultations/mois"}</div>
<div style={{"fontSize": "28px", "fontWeight": "800"}} id={"performance-1"}>{"—"}</div>
</div>
<div className={"perf-card"}>
<div style={{"fontSize": "12px", "color": "var(--text-2)", "marginBottom": "8px"}}>{"Satisfaction"}</div>
<div style={{"fontSize": "28px", "fontWeight": "800"}} id={"performance-2"}>{"—"}</div>
</div>
</div>
</section>
<section className={"section-row admin-alerts-grid"}>
<div className={"card"}>
<div className={"card-header-row"}>
<div><h2 className={"card-title"}>{"Alertes opérationnelles"}</h2><div className={"card-subtitle"}>{"Éléments nécessitant une action"}</div></div>
</div>
<div className={"list-stack"} id={"dashboard-alerts"}></div>
</div>
<div className={"card"}>
<div className={"card-header-row"}><div><h2 className={"card-title"}>{"Journal système"}</h2><div className={"card-subtitle"}>{"Dernières actions administratives"}</div></div></div>
<div className={"list-stack"} id={"dashboard-audit"}></div>
</div>
</section>
</div>
</main>
</div>
<div className={"workspace-sidebar-overlay"} data-sidebar-toggle={""} aria-hidden={"true"}></div>
<Runtime body={{"class": "doctor-body", "data-role": "admin", "data-auth-state": "pending", "data-page": "adminDashboard", "data-static-layout": "true"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/restored-dashboards.js", "/assets/js/restored-shell.js"]} />
</>);
}
