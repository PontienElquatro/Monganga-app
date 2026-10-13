import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Devenir médecin — MONGANGA", "description": "Devenir médecin sur Monganga, téléconsultation à Kinshasa."};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/styles.css"} />
<link rel="stylesheet" href={"/assets/css/ui.css"} />

<a className={"skip-link"} href={"#main-content"}>{"Aller au contenu"}</a>
<header className={"app-header"}><div className={"app-header-inner"}>
<a className={"app-brand"} href={"/"} aria-label={"Monganga — accueil"}><img src={"/assets/logo/monganga-icone.jpg"} alt={""} width={"32"} height={"38"} /><span>{"MONGANGA"}</span></a>
<nav className={"app-nav"} aria-label={"Navigation principale"}><a href={"/"}>{"Accueil"}</a><a href={"/public/how"}>{"Comment ça marche"}</a><a href={"/public/doctors"}>{"Médecins"}</a><a href={"/public/pricing"}>{"Tarifs"}</a><a href={"/public/faq"}>{"FAQ"}</a></nav>
<div className={"app-header-actions"}><button className={"btn btn-ghost btn-icon"} type={"button"} data-theme-button={""} aria-label={"Changer de thème"}><i data-lucide={"moon"} aria-hidden={"true"}></i></button><a className={"btn btn-primary btn-sm"} href={"/auth/login"}>{"Connexion"}</a><button className={"btn btn-ghost btn-icon menu-toggle"} type={"button"} data-menu-button={""} aria-label={"Ouvrir le menu"} aria-controls={"mobile-menu"} aria-expanded={"false"}><i data-lucide={"menu"} aria-hidden={"true"}></i></button></div>
</div></header>
<div id={"mode-indicator"} className={"mode-indicator"} hidden={true}></div><p className={"offline-notice"} id={"offline-notice"} role={"status"} hidden={true}>{"Connexion internet indisponible. Les opérations en ligne peuvent échouer."}</p>
<div id={"mobile-menu-overlay"} className={"drawer-overlay"} data-legacy-click={"toggleMobileMenu()"}></div><aside id={"mobile-menu"} className={"app-drawer"} hidden={true}><div className={"actions"}><strong>{"Navigation"}</strong><button className={"btn btn-ghost btn-icon"} type={"button"} data-menu-button={""} aria-label={"Fermer le menu"}><i data-lucide={"x"} aria-hidden={"true"}></i></button></div><nav className={"drawer-links"} aria-label={"Navigation mobile"}><a href={"/"}>{"Accueil"}</a><a href={"/public/how"}>{"Comment ça marche"}</a><a href={"/public/doctors"}>{"Médecins"}</a><a href={"/public/pricing"}>{"Tarifs"}</a><a href={"/public/faq"}>{"FAQ"}</a></nav><a className={"btn btn-secondary"} href={"/auth/register"}>{"Créer un compte"}</a></aside>
<main id={"main-content"} className={"workspace"} tabIndex={"-1"}><noscript><p className={"notice warning"}>{"Activez JavaScript pour utiliser les fonctionnalités de cet espace."}</p></noscript><div id={"page-root"} aria-busy={"true"}><p className={"loading-state"} role={"status"}>{"Chargement de votre espace…"}</p></div></main>
<footer className={"app-footer"}><span>{"© Monganga"}</span><a href={"/public/contact"}>{"Contact"}</a><a href={"/public/conditions-utilisation"}>{"Conditions"}</a><a href={"/public/politique-confidentialite"}>{"Confidentialité"}</a></footer>

<Runtime body={{"data-page": "application"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/patient-pages.js", "/assets/js/professional-pages.js", "/assets/js/consultation.js", "/assets/js/application.js"]} />
</>);
}
