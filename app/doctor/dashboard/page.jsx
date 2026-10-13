import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Tableau de bord - Docteur | MONGANGA", "robots": {"index": false, "follow": false}};

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
<div className={"doctor-brand-mark"}><i data-lucide={"activity"}></i></div>
<div className={"doctor-brand-text"}>
<strong>{"MONGANGA"}</strong>
<span>{"Doctor"}</span>
</div>
</div>
<nav className={"doctor-nav"} aria-label={"Navigation principale"}>
<a className={"doctor-nav-link active"} href={"/doctor/dashboard"} aria-current={"page"}><i data-lucide={"layout-grid"}></i>{" Tableau de bord"}</a>
<a className={"doctor-nav-link"} href={"/doctor/agenda"}><i data-lucide={"calendar-days"}></i>{" Agenda"}</a>
<a className={"doctor-nav-link"} href={"/doctor/dispo"}><i data-lucide={"clock-3"}></i>{" Disponibilités"}</a>
<a className={"doctor-nav-link"} href={"/doctor/demandes"}><i data-lucide={"inbox"}></i>{" Demandes"}</a>
<a className={"doctor-nav-link"} href={"/doctor/patients"}><i data-lucide={"users"}></i>{" Patients"}</a>
<a className={"doctor-nav-link"} href={"/doctor/ordonnances"}><i data-lucide={"file-text"}></i>{" Ordonnances"}</a>
<a className={"doctor-nav-link"} href={"/doctor/gains"}><i data-lucide={"wallet"}></i>{" Gains"}</a>
</nav>
<a className={"doctor-profile-box"} href={"/doctor/profile"} aria-label={"Ouvrir mon profil"}>
<div className={"doctor-mini-user"}>
<div className={"doctor-mini-avatar"} data-avatar-storage={"monganga_doctor_photo"} data-avatar-alt={"Portrait du médecin"}>{"DM"}</div>
<div className={"doctor-mini-meta"}>
<strong>{"Dr. Manda"}</strong>
<span>{"Cardiologie"}</span>
</div>
</div>
</a>
<div className={"sidebar-controls"}><button className={"btn btn-ghost btn-icon"} type={"button"} data-theme-button={""} aria-label={"Changer de thème"}><i data-lucide={"moon"}></i></button><button className={"btn btn-ghost btn-icon"} type={"button"} data-logout={""} aria-label={"Se déconnecter"}><i data-lucide={"log-out"}></i></button><button className={"btn btn-ghost btn-icon workspace-menu-btn"} type={"button"} data-sidebar-toggle={""} aria-label={"Fermer le menu"}><i data-lucide={"x"}></i></button></div></aside>
<main className={"doctor-main"} id={"main-content"} tabIndex={"-1"}><button className={"btn btn-secondary btn-sm workspace-menu-btn"} type={"button"} data-sidebar-toggle={""} aria-controls={"workspace-sidebar"} aria-expanded={"false"}><i data-lucide={"menu"}></i>{" Menu"}</button><div><p id={"mode-indicator"} className={"layout-demo"} hidden={true}></p><p id={"offline-notice"} className={"notice warning"} role={"status"} hidden={true}>{"Connexion internet indisponible."}</p></div>
<header className={"doctor-topbar"}>
<div>
<h1 className={"doctor-page-title"} id={"dashboard-greeting"}>{"Bonjour, Dr. Manda"}</h1>
<p className={"doctor-page-subtitle"}>{"Voici le résumé de votre journée et de votre activité."}</p>
</div>
<div className={"doctor-header-actions"}>
<button className={"btn btn-secondary btn-sm"} type={"button"} data-legacy-click={"location.href='agenda.html'"}><i data-lucide={"calendar-plus"}></i>{" Nouveau RDV"}</button>
<button className={"btn btn-primary btn-sm"} type={"button"} data-legacy-click={"location.href='ordonnances.html'"}><i data-lucide={"plus"}></i>{" Ajouter"}</button>
<button className={"btn btn-ghost btn-icon"} type={"button"} aria-label={"Ouvrir les notifications"} data-notifications={""}><i data-lucide={"bell"}></i></button>
</div>
</header>
<div id={"page-status"} role={"status"} className={"layout-status"}>{"Chargement de votre espace…"}</div><div className={"doctor-main-grid"} data-dashboard-content={""}>
<section className={"kpi-grid"} data-stagger={""}>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"calendar-check-2"}></i>{" Consultations aujourd'hui"}</div>
<div className={"kpi-value"} id={"metric-0"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-0"}></span>
</article>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"users"}></i>{" Patients suivis"}</div>
<div className={"kpi-value"} id={"metric-1"}>{"—"}</div>
<span className={"kpi-trend neutral"} id={"metric-note-1"}></span>
</article>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"clipboard-check"}></i>{" Demandes en attente"}</div>
<div className={"kpi-value"} id={"metric-2"}>{"—"}</div>
<span className={"kpi-trend warn"} id={"metric-note-2"}></span>
</article>
<article className={"kpi-card"}>
<div className={"kpi-label"}><i data-lucide={"wallet"}></i>{" Gains du mois"}</div>
<div className={"kpi-value"} id={"metric-3"}>{"—"}</div>
<span className={"kpi-trend up"} id={"metric-note-3"}></span>
</article>
</section>
<section className={"section-row"}>
<div className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Agenda du jour"}</h2>
<div className={"card-subtitle"} id={"agenda-date"}>{"Mardi 24 septembre 2026"}</div>
</div>
<a className={"btn btn-secondary btn-sm"} href={"/doctor/agenda"}>{"Voir tout"}</a>
</div>
<div className={"timeline-list"} id={"dashboard-agenda"}></div>
</div>
<div className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Demandes reçues"}</h2>
<div className={"card-subtitle"}>{"À traiter rapidement"}</div>
</div>
<a className={"btn btn-secondary btn-sm"} href={"/doctor/demandes"}>{"Voir"}</a>
</div>
<div className={"list-stack"} id={"dashboard-requests"}></div>
</div>
</section>
<section className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Performance"}</h2>
<div className={"card-subtitle"}>{"Évolution des consultations"}</div>
</div>
<div className={"filters"}>
<select className={"form-input"} aria-label={"Période des performances"} style={{"width": "auto", "height": "34px"}} id={"performance-period"}>
<option value={"month"}>{"Ce mois"}</option>
<option value={"week"}>{"Cette semaine"}</option>
<option value={"year"}>{"Cette année"}</option>
</select>
</div>
</div>
<div className={"bar-chart"} aria-label={"Graphique des consultations"} id={"dashboard-chart"}></div>
</section>
<section className={"dashboard-lower-grid"}>
<div className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Actions rapides"}</h2>
<div className={"card-subtitle"}>{"Les tâches les plus fréquentes"}</div>
</div>
</div>
<div className={"quick-actions-grid"}>
<a className={"btn btn-secondary quick-action"} href={"/doctor/agenda"}><i data-lucide={"video"}></i><span>{"Démarrer un appel"}</span></a>
<a className={"btn btn-secondary quick-action"} href={"/doctor/ordonnances"}><i data-lucide={"file-plus-2"}></i><span>{"Créer une ordonnance"}</span></a>
<a className={"btn btn-secondary quick-action"} href={"/doctor/patients"}><i data-lucide={"folder-search"}></i><span>{"Ouvrir un dossier"}</span></a>
<a className={"btn btn-secondary quick-action"} href={"/doctor/dispo"}><i data-lucide={"clock-3"}></i><span>{"Gérer mes horaires"}</span></a>
</div>
</div>
<div className={"card"}>
<div className={"card-header-row"}>
<div>
<h2 className={"card-title"}>{"Patients récents"}</h2>
<div className={"card-subtitle"}>{"Dernières consultations"}</div>
</div>
<a className={"btn btn-secondary btn-sm"} href={"/doctor/patients"}>{"Tous"}</a>
</div>
<div className={"list-stack"} id={"dashboard-patients"}></div>
</div>
</section>
</div>
</main>
</div>
<div className={"workspace-sidebar-overlay"} data-sidebar-toggle={""} aria-hidden={"true"}></div>
<Runtime body={{"class": "doctor-body", "data-role": "doctor", "data-auth-state": "pending", "data-page": "doctorDashboard", "data-static-layout": "true"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/restored-dashboards.js", "/assets/js/restored-shell.js"]} />
</>);
}
