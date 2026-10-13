import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Mes ordonnances — MONGANGA", "description": "Mes ordonnances sur Monganga, téléconsultation à Kinshasa.", "robots": {"index": false, "follow": false}};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/styles.css"} />
<link rel="stylesheet" href={"/assets/css/ui.css"} />
<link rel="stylesheet" href={"/assets/css/patient.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<a className={"skip-link"} href={"#main-content"}>{"Aller au contenu"}</a><header className={"pat-header"}>
<div className={"pat-header-inner"}>
<a className={"logo"} href={"/"}>
<div className={"logo-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"logo-text"}>{"MONGANGA"}</span>
</a>
<nav className={"pat-nav"}>
<a className={"pat-nav-link"} href={"/patient/dashboard"}><i data-lucide={"home"}></i>{" Accueil"}</a>
<a className={"pat-nav-link"} href={"/patient/search"}><i data-lucide={"search"}></i>{" Rechercher"}</a>
<a className={"pat-nav-link"} href={"/patient/history"}><i data-lucide={"calendar"}></i>{" Mes RDV"}</a>
<a className={"pat-nav-link active"} href={"/patient/prescription"} aria-current={"page"}><i data-lucide={"file-text"}></i>{" Ordonnances"}</a>
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
</header><div className={"pat-menu-overlay"} id={"patMenuOverlay"} data-legacy-click={"toggleMenu()"}></div><aside className={"pat-menu"} id={"patMenu"}>
<div className={"pat-menu-header"}>
<span style={{"fontWeight": "800"}}>{"Menu"}</span>
<button className={"btn btn-ghost btn-icon"} data-legacy-click={"toggleMenu()"}><i data-lucide={"x"}></i></button>
</div>
<div className={"pat-menu-content"}>
<a className={"pat-menu-item"} href={"/patient/dashboard"}><i data-lucide={"home"}></i>{" Accueil"}</a>
<a className={"pat-menu-item"} href={"/patient/search"}><i data-lucide={"search"}></i>{" Rechercher"}</a>
<a className={"pat-menu-item"} href={"/patient/history"}><i data-lucide={"calendar"}></i>{" Mes RDV"}</a>
<a className={"pat-menu-item active"} href={"/patient/prescription"} aria-current={"page"}><i data-lucide={"file-text"}></i>{" Ordonnances"}</a>
<a className={"pat-menu-item"} href={"/patient/profile"}><i data-lucide={"user"}></i>{" Profil"}</a>
<div style={{"marginTop": "24px", "paddingTop": "16px", "borderTop": "1px solid var(--border)"}}>
<a className={"pat-menu-item"} data-logout={""} role={"button"} tabIndex={"0"}><i data-lucide={"log-out"}></i>{" Déconnexion"}</a>
</div>
</div>
</aside><main id={"main-content"} className={"pat-main"} tabIndex={"-1"}><div className={"pat-content"}><div><p id={"mode-indicator"} className={"layout-demo"} hidden={true}></p><p id={"offline-notice"} className={"notice warning"} role={"status"} hidden={true}>{"Connexion internet indisponible."}</p></div><noscript><p className={"notice warning"}>{"Activez JavaScript pour utiliser les fonctionnalités de cet espace."}</p></noscript><div id={"page-root"} aria-busy={"true"}><p className={"loading-state"} role={"status"}>{"Chargement de votre espace…"}</p></div></div></main><nav className={"pat-mobile-nav"}>
<a className={"pat-mobile-item"} href={"/patient/dashboard"}><i data-lucide={"home"}></i><span>{"Accueil"}</span></a>
<a className={"pat-mobile-item"} href={"/patient/search"}><i data-lucide={"search"}></i><span>{"Rechercher"}</span></a>
<a className={"pat-mobile-item"} href={"/patient/history"}><i data-lucide={"calendar"}></i><span>{"Mes RDV"}</span></a>
<a className={"pat-mobile-item active"} href={"/patient/prescription"} aria-current={"page"}><i data-lucide={"file-text"}></i><span>{"Ordonnances"}</span></a>
<a className={"pat-mobile-item"} href={"/patient/profile"}><i data-lucide={"user"}></i><span>{"Profil"}</span></a>
</nav>
<Runtime body={{"data-page": "prescriptions", "data-role": "patient", "data-auth-state": "pending"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/patient-pages.js", "/assets/js/professional-pages.js", "/assets/js/consultation.js", "/assets/js/application.js", "/assets/js/restored-shell.js"]} />
</>);
}
