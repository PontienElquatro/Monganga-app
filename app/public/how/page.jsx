import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Comment ça marche — MONGANGA"};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<style>{"\n.breadcrumb {\n  display: flex; align-items: center; gap: 8px;\n  font-size: 12.5px; color: var(--text-3);\n}\n.breadcrumb a:hover { color: var(--primary); }\n.breadcrumb [data-lucide] { width: 14px; height: 14px; }\n\n.steps-detail { display: flex; flex-direction: column; gap: 32px; }\n.step-detail {\n  display: grid;\n  grid-template-columns: 80px 1fr;\n  gap: 28px;\n  align-items: start;\n  padding: 32px;\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--r-md);\n  transition: all var(--t);\n}\n.step-detail:hover { border-color: var(--primary); box-shadow: var(--shadow-md); transform: translateX(4px); }\n.step-badge {\n  width: 64px; height: 64px;\n  background: linear-gradient(135deg, var(--primary) 0%, #5B6FF0 100%);\n  color: #fff;\n  border-radius: var(--r-md);\n  display: flex; align-items: center; justify-content: center;\n  font-size: 28px; font-weight: 800;\n  box-shadow: 0 4px 12px rgba(60, 80, 224, 0.3);\n}\n.step-content { flex: 1; }\n.step-ico {\n  width: 44px; height: 44px;\n  background: var(--primary-light);\n  color: var(--primary);\n  border-radius: var(--r-md);\n  display: flex; align-items: center; justify-content: center;\n  margin-bottom: 16px;\n}\n.step-ico [data-lucide] { width: 22px; height: 22px; }\n\n.feature-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }\n.feature-list li { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--text-2); }\n.feature-list [data-lucide] { width: 16px; height: 16px; color: var(--success); flex-shrink: 0; }\n\n.diff-mockup { margin-top: 16px; padding: 16px; background: var(--surface-2); border-radius: var(--r-sm); }\n\n.ticket-preview {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--r-sm);\n  overflow: hidden;\n  max-width: 280px;\n}\n.ticket-header {\n  background: var(--text);\n  color: var(--bg);\n  padding: 12px;\n  text-align: center;\n}\n.ticket-header span { display: block; font-size: 9px; letter-spacing: 0.25em; opacity: 0.6; }\n.ticket-header strong { font-size: 14px; letter-spacing: 0.1em; }\n.ticket-body { padding: 12px; display: flex; flex-direction: column; gap: 6px; }\n.ticket-body div { display: flex; justify-content: space-between; font-size: 11px; }\n.ticket-body span { color: var(--text-3); }\n\n@media (max-width: 640px) {\n  .step-detail { grid-template-columns: 1fr; padding: 24px; }\n  .step-badge { width: 52px; height: 52px; font-size: 22px; }\n}\n"}</style>

<header className={"pub-header"}>
<div className={"pub-header-inner"}>
<a className={"logo"} href={"/"}>
<div className={"logo-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"logo-text"}>{"MONGANGA"}</span>
</a>
<nav className={"pub-nav"}>
<a className={"pub-nav-link"} href={"/"}>{"Accueil"}</a>
<a className={"pub-nav-link active"} href={"/public/how"}>{"Comment ça marche"}</a>
<a className={"pub-nav-link"} href={"/public/doctors"}>{"Médecins"}</a>
<a className={"pub-nav-link"} href={"/public/pricing"}>{"Tarifs"}</a>
<a className={"pub-nav-link"} href={"/public/faq"}>{"FAQ"}</a>
</nav>
<div className={"pub-actions"}>
<button className={"btn btn-ghost btn-icon"} data-legacy-click={"toggleTheme()"} aria-label={"Thème"}>
<i data-lucide={"moon"} data-theme-icon={""}></i>
</button>
<a className={"btn btn-ghost btn-sm"} href={"/auth/login"}>{"Se connecter"}</a>
<a className={"btn btn-primary btn-sm"} href={"/auth/register"}>{"S'inscrire"}</a>
<button className={"mobile-menu-btn"} data-legacy-click={"toggleMobileMenu()"} aria-label={"Menu"}>
<i data-lucide={"menu"}></i>
</button>
</div>
</div>
</header>
<div id={"mobile-menu-overlay"} className={"drawer-overlay"} data-legacy-click={"toggleMobileMenu()"}></div>
<aside id={"mobile-menu"} className={"drawer"} style={{"width": "280px", "right": "-300px"}}>
<div className={"drawer-header"}>
<span className={"drawer-title"}>{"Menu"}</span>
<button className={"btn btn-ghost btn-icon"} data-legacy-click={"toggleMobileMenu()"}><i data-lucide={"x"}></i></button>
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
<main id={"main-content"}>
<section className={"container section"}>
<div className={"fade-in"}>
<div className={"breadcrumb mb-4"}>
<a href={"/"}>{"Accueil"}</a>
<i data-lucide={"chevron-right"}></i>
<span>{"Comment ça marche"}</span>
</div>
<h1 className={"h1 mb-4"}>{"Comment ça marche"}</h1>
<p className={"text-2"} style={{"fontSize": "16px", "maxWidth": "680px"}}>{"\n        MONGANGA simplifie l'accès aux soins de santé à Kinshasa.\n        En 4 étapes, consultez un médecin vérifié depuis votre téléphone.\n      "}</p>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "72px"}}>
<div className={"steps-detail"} data-stagger={""}>
<div className={"step-detail"}>
<div className={"step-badge"}>{"1"}</div>
<div className={"step-content"}>
<div className={"step-ico"}><i data-lucide={"user-plus"}></i></div>
<h2 className={"h3 mb-2"}>{"Créez votre compte"}</h2>
<p className={"text-2 mb-4"}>{"\n            Inscription rapide par téléphone avec code OTP sécurisé. Un profil complet\n            en moins d'une minute : nom, commune, informations médicales de base.\n          "}</p>
<ul className={"feature-list"}>
<li><i data-lucide={"check-circle-2"}></i>{" Inscription par téléphone"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Validation OTP sécurisée"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Profil médical personnalisé"}</li>
</ul>
</div>
</div>
<div className={"step-detail"}>
<div className={"step-badge"}>{"2"}</div>
<div className={"step-content"}>
<div className={"step-ico"}><i data-lucide={"search"}></i></div>
<h2 className={"h3 mb-2"}>{"Trouvez votre médecin"}</h2>
<p className={"text-2 mb-4"}>{"\n            Filtrez par spécialité, commune ou disponibilité. Consultez les profils\n            détaillés, les avis et choisissez le praticien qui vous convient.\n          "}</p>
<ul className={"feature-list"}>
<li><i data-lucide={"check-circle-2"}></i>{" Filtres par spécialité et commune"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Profils vérifiés par l'Ordre"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Choix du créneau en temps réel"}</li>
</ul>
</div>
</div>
<div className={"step-detail"}>
<div className={"step-badge"}>{"3"}</div>
<div className={"step-content"}>
<div className={"step-ico"}><i data-lucide={"credit-card"}></i></div>
<h2 className={"h3 mb-2"}>{"Payez en Mobile Money"}</h2>
<p className={"text-2 mb-4"}>{"\n            Paiement transparent via M-Pesa, Orange Money, Airtel Money ou carte bancaire.\n            Confirmation instantanée, reçu téléchargeable.\n          "}</p>
<ul className={"feature-list"}>
<li><i data-lucide={"check-circle-2"}></i>{" M-Pesa, Orange, Airtel Money"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Cartes bancaires acceptées"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Reçu automatique téléchargeable"}</li>
</ul>
</div>
</div>
<div className={"step-detail"}>
<div className={"step-badge"}>{"4"}</div>
<div className={"step-content"}>
<div className={"step-ico"}><i data-lucide={"video"}></i></div>
<h2 className={"h3 mb-2"}>{"Consultez à distance"}</h2>
<p className={"text-2 mb-4"}>{"\n            Consultation vidéo HD, audio ou chat sécurisé. Envoyez photos et documents\n            au médecin, recevez votre ordonnance numérique immédiatement après.\n          "}</p>
<ul className={"feature-list"}>
<li><i data-lucide={"check-circle-2"}></i>{" Vidéo HD, audio, chat"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Envoi de documents médicaux"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Ordonnance numérique sécurisée"}</li>
</ul>
</div>
</div>
</div>
</section>
<section className={"section section-alt"}>
<div className={"container"}>
<h2 className={"h2 text-center mb-8"}>{"Nos différenciateurs"}</h2>
<div className={"grid-2"}>
<div className={"diff-card"}>
<div className={"diff-icon"}><i data-lucide={"wifi-off"}></i></div>
<h3 className={"h3 mb-2"}>{"Bascule audio automatique"}</h3>
<p className={"text-2"}>{"\n            Si votre connexion est instable, MONGANGA détecte automatiquement la qualité\n            du réseau et vous propose de passer en mode audio en un clic — sans couper\n            la consultation.\n          "}</p>
<div className={"diff-mockup"}>
<div className={"alert warning"} style={{"margin": "0"}}>
<i data-lucide={"wifi-off"}></i>
<span><strong>{"Connexion faible détectée."}</strong>{" Passer en audio ?"}</span>
</div>
</div>
</div>
<div className={"diff-card"}>
<div className={"diff-icon"}><i data-lucide={"file-badge"}></i></div>
<h3 className={"h3 mb-2"}>{"Ordonnance numérique"}</h3>
<p className={"text-2"}>{"\n            Une carte numérique sécurisée au format ticket, immédiatement montrable\n            en pharmacie. Vérifiable par QR code, téléchargeable et archivée dans\n            votre historique médical.\n          "}</p>
<div className={"diff-mockup"}>
<div className={"ticket-preview"}>
<div className={"ticket-header"}>
<span>{"ORDONNANCE"}</span>
<strong>{"MONGANGA"}</strong>
</div>
<div className={"ticket-body"}>
<div><span>{"Patient"}</span><strong>{"Aline K."}</strong></div>
<div><span>{"Date"}</span><strong>{"24/09/2026"}</strong></div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
<section className={"container section"}>
<div className={"cta-final"}>
<h2 className={"h1 mb-2"} style={{"color": "inherit"}}>{"Prêt à commencer ?"}</h2>
<p style={{"opacity": "0.85", "marginBottom": "28px"}}>{"\n        Créez votre compte en 1 minute et prenez votre premier rendez-vous.\n      "}</p>
<div className={"row"} style={{"justifyContent": "center", "flexWrap": "wrap", "gap": "12px"}}>
<a className={"btn btn-primary btn-lg"} href={"/auth/register"}>
<i data-lucide={"user-plus"}></i>{" Créer un compte\n        "}</a>
<a className={"btn btn-secondary btn-lg"} href={"/public/doctors"}>
<i data-lucide={"stethoscope"}></i>{" Voir les médecins\n        "}</a>
</div>
</div>
</section>
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


<Runtime body={{}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/restored-public.js", "/assets/js/restored-shell.js"]} />
</>);
}
