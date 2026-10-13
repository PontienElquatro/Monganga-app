import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Ordonnances — MONGANGA", "description": "Ordonnances sur Monganga, téléconsultation à Kinshasa.", "robots": {"index": false, "follow": false}};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/styles.css"} />
<link rel="stylesheet" href={"/assets/css/ui.css"} />
<link rel="stylesheet" href={"/assets/css/doctor.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<a className={"skip-link"} href={"#main-content"}>{"Aller au contenu"}</a><div className={"doctor-shell"}><aside className={"doctor-sidebar"} id={"workspace-sidebar"}>
<div className={"doctor-brand"}>
<div className={"doctor-brand-mark"}><i data-lucide={"activity"}></i></div>
<div className={"doctor-brand-text"}>
<strong>{"MONGANGA"}</strong>
<span>{"Doctor"}</span>
</div>
</div>
<nav className={"doctor-nav"} aria-label={"Navigation principale"}>
<a className={"doctor-nav-link"} href={"/doctor/dashboard"}><i data-lucide={"layout-grid"}></i>{" Tableau de bord"}</a>
<a className={"doctor-nav-link"} href={"/doctor/agenda"}><i data-lucide={"calendar-days"}></i>{" Agenda"}</a>
<a className={"doctor-nav-link"} href={"/doctor/dispo"}><i data-lucide={"clock-3"}></i>{" Disponibilités"}</a>
<a className={"doctor-nav-link"} href={"/doctor/demandes"}><i data-lucide={"inbox"}></i>{" Demandes"}</a>
<a className={"doctor-nav-link"} href={"/doctor/patients"}><i data-lucide={"users"}></i>{" Patients"}</a>
<a className={"doctor-nav-link active"} href={"/doctor/ordonnances"} aria-current={"page"}><i data-lucide={"file-text"}></i>{" Ordonnances"}</a>
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
<div className={"sidebar-controls"}><button className={"btn btn-ghost btn-icon"} type={"button"} data-theme-button={""} aria-label={"Changer de thème"}><i data-lucide={"moon"}></i></button><button className={"btn btn-ghost btn-icon"} type={"button"} data-logout={""} aria-label={"Se déconnecter"}><i data-lucide={"log-out"}></i></button><button className={"btn btn-ghost btn-icon workspace-menu-btn"} type={"button"} data-sidebar-toggle={""} aria-label={"Fermer le menu"}><i data-lucide={"x"}></i></button></div></aside><main id={"main-content"} className={"doctor-main"} tabIndex={"-1"}><button className={"btn btn-secondary btn-sm workspace-menu-btn"} type={"button"} data-sidebar-toggle={""} aria-controls={"workspace-sidebar"} aria-expanded={"false"}><i data-lucide={"menu"}></i>{" Menu"}</button><div><p id={"mode-indicator"} className={"layout-demo"} hidden={true}></p><p id={"offline-notice"} className={"notice warning"} role={"status"} hidden={true}>{"Connexion internet indisponible."}</p></div><noscript><p className={"notice warning"}>{"Activez JavaScript pour utiliser les fonctionnalités de cet espace."}</p></noscript><div id={"page-root"} aria-busy={"true"}><p className={"loading-state"} role={"status"}>{"Chargement de votre espace…"}</p></div></main></div><div className={"workspace-sidebar-overlay"} data-sidebar-toggle={""} aria-hidden={"true"}></div>
<Runtime body={{"data-page": "prescriptions", "data-role": "doctor", "data-auth-state": "pending", "class": "doctor-body restored-space"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/patient-pages.js", "/assets/js/professional-pages.js", "/assets/js/consultation.js", "/assets/js/application.js", "/assets/js/restored-shell.js"]} />
</>);
}
