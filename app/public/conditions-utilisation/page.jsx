import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Conditions d'utilisation — MONGANGA", "description": "Monganga : consultez un médecin à distance à Kinshasa."};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/ui.css"} />
<a className={"skip-link"} href={"#main-content"}>{"Aller au contenu"}</a>
<header className={"pub-header"}>
<div className={"pub-header-inner"}>
<a className={"logo"} href={"/"}>
<div className={"logo-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"logo-text"}>{"MONGANGA"}</span>
</a>
<nav className={"pub-nav"}>
<a className={"pub-nav-link"} href={"/"}>{"Accueil"}</a>
<a className={"pub-nav-link"} href={"/public/how"}>{"Comment ça marche"}</a>
<a className={"pub-nav-link"} href={"/public/doctors"}>{"Médecins"}</a>
<a className={"pub-nav-link"} href={"/public/pricing"}>{"Tarifs"}</a>
<a className={"pub-nav-link"} href={"/public/faq"}>{"FAQ"}</a>
</nav>
<div className={"pub-actions"}>
<button className={"btn btn-ghost btn-icon"} aria-label={"Thème"} data-theme-button={""}>
<i data-lucide={"moon"} data-theme-icon={""}></i>
</button>
<a className={"btn btn-ghost btn-sm"} href={"/auth/login"}>{"Se connecter"}</a>
<a className={"btn btn-primary btn-sm"} href={"/auth/register"}>{"S'inscrire"}</a>
<button className={"mobile-menu-btn"} data-legacy-click={"toggleMobileMenu()"} aria-label={"Menu"} aria-expanded={"false"} aria-controls={"mobile-menu"}>
<i data-lucide={"menu"}></i>
</button>
</div>
</div>
</header><div id={"mode-indicator"} className={"mode-indicator"} hidden={true}></div>
<div id={"mobile-menu-overlay"} className={"drawer-overlay"} data-legacy-click={"toggleMobileMenu()"}></div>
<aside id={"mobile-menu"} className={"drawer"} style={{"width": "280px", "right": "-300px"}} hidden={true}>
<div className={"drawer-header"}>
<span className={"drawer-title"}>{"Menu"}</span>
<button className={"btn btn-ghost btn-icon"} data-legacy-click={"toggleMobileMenu()"} aria-label={"Fermer le menu"}><i data-lucide={"x"}></i></button>
</div>
<div className={"drawer-content"}>
<a className={"menu-link"} href={"/"}><i data-lucide={"home"}></i>{" Accueil"}</a>
<a className={"menu-link"} href={"/public/how"}><i data-lucide={"book-open"}></i>{" Comment ça marche"}</a>
<a className={"menu-link"} href={"/public/doctors"}><i data-lucide={"stethoscope"}></i>{" Médecins"}</a>
<a className={"menu-link"} href={"/public/pricing"}><i data-lucide={"tag"}></i>{" Tarifs"}</a>
<a className={"menu-link"} href={"/public/faq"}><i data-lucide={"help-circle"}></i>{" FAQ"}</a>
<a className={"menu-link"} href={"/public/contact"}><i data-lucide={"mail"}></i>{" Contact"}</a>
<a className={"menu-link"} href={"/public/candidature"}><i data-lucide={"user-plus"}></i>{" Devenir médecin"}</a>
<div style={{"marginTop": "auto", "paddingTop": "24px", "display": "flex", "flexDirection": "column", "gap": "8px"}}>
<a className={"btn btn-secondary btn-block"} href={"/auth/login"}>{"Se connecter"}</a>
<a className={"btn btn-primary btn-block"} href={"/auth/register"}>{"S'inscrire"}</a>
</div>
</div>
</aside>
<main className={"container section"} style={{"paddingBottom": "72px"}} id={"main-content"} tabIndex={"-1"}>
<div className={"breadcrumb mb-3"}>
<a href={"/"}>{"Accueil"}</a>
<i data-lucide={"chevron-right"}></i>
<span>{"Conditions d'utilisation"}</span>
</div>
<h1 className={"h1 mb-4"}>{"Conditions d'utilisation"}</h1>
<p className={"text-2"} style={{"maxWidth": "720px", "marginBottom": "28px"}}>{"\n    Bienvenue sur MONGANGA. En accédant à nos services, vous acceptez les règles ci-dessous,\n    qui définissent les droits et obligations de chaque utilisateur.\n  "}</p>
<div className={"card card-block"} style={{"maxWidth": "880px"}}>
<div className={"mb-5"}>
<h2 className={"h3 mb-2"}>{"1. Objet du service"}</h2>
<p className={"text-2"}>{"MONGANGA met à disposition une plateforme numérique permettant de trouver un médecin,\n      prendre rendez-vous, gérer la consultation et effectuer des paiements sécurisés."}</p>
</div>
<div className={"mb-5"}>
<h2 className={"h3 mb-2"}>{"2. Acceptation"}</h2>
<p className={"text-2"}>{"L'utilisation du site et des services implique votre acceptation sans réserve des présentes conditions.\n      Si vous n'acceptez pas ces conditions, merci de ne pas utiliser la plateforme."}</p>
</div>
<div className={"mb-5"}>
<h2 className={"h3 mb-2"}>{"3. Compte utilisateur"}</h2>
<p className={"text-2"}>{"Vous êtes responsable de la précision des informations que vous transmettez, ainsi que de la confidentialité\n      de vos identifiants. Toute activité effectuée depuis votre compte est réputée effectuée par vous."}</p>
</div>
<div className={"mb-5"}>
<h2 className={"h3 mb-2"}>{"4. Paiements et rendez-vous"}</h2>
<p className={"text-2"}>{"Les paiements sont traités selon les méthodes disponibles sur la plateforme.  Les rendez-vous\n      sont soumis aux disponibilités des professionnels et à la validation du système."}</p>
</div>
<div className={"mb-5"}>
<h2 className={"h3 mb-2"}>{"5. Responsabilité"}</h2>
<p className={"text-2"}>{"MONGANGA agit comme intermédiaire technologique. Le contenu médical ou administratif partagé via la plateforme\n      reste sous la responsabilité de la personne concernée ou du professionnel de santé."}</p>
</div>
<div>
<h2 className={"h3 mb-2"}>{"6. Modifications"}</h2>
<p className={"text-2"}>{"Ces conditions peuvent être mises à jour pour refléter l'évolution du service, des lois ou des besoins utilisateurs.\n      Les modifications prennent effet dès leur publication sur le site."}</p>
</div>
</div>
</main>
<footer className={"pub-footer"}>
<div className={"container"}>
<div className={"footer-grid"}>
<div className={"footer-brand"}>
<div className={"logo"}>
<div className={"logo-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"logo-text"}>{"MONGANGA"}</span>
</div>
<p>{"Monganga na yo, na tshombo na yo. La santé à portée de main, à Kinshasa."}</p>
</div>
<div className={"footer-col"}>
<h5>{"Produit"}</h5>
<a href={"/public/how"}>{"Comment ça marche"}</a>
<a href={"/public/doctors"}>{"Trouver un médecin"}</a>
<a href={"/public/pricing"}>{"Tarifs"}</a>
</div>
<div className={"footer-col"}>
<h5>{"Aide"}</h5>
<a href={"/public/faq"}>{"FAQ"}</a>
<a href={"/public/contact"}>{"Contact"}</a>
<a href={"/public/candidature"}>{"Devenir médecin"}</a>
</div>
<div className={"footer-col"}>
<h5>{"Légal"}</h5>
<a href={"/public/conditions-utilisation"}>{"Conditions d'utilisation"}</a>
<a href={"/public/politique-confidentialite"}>{"Politique de confidentialité"}</a>
<a href={"/public/mentions-legales"}>{"Mentions légales"}</a>
</div>
</div>
<div className={"footer-bottom"}>
<span>{"© 2026 MONGANGA. Tous droits réservés."}</span>
<span>{"🇨🇩 Fait à Kinshasa"}</span>
</div>
</div>
</footer>

<Runtime body={{}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/public-pages.js"]} />
</>);
}
