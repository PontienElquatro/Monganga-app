import Runtime from '../components/Runtime';

export const metadata = {"title": "MONGANGA — Téléconsultation médicale à Kinshasa", "description": "Monganga : consultez un médecin à distance à Kinshasa."};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/ui.css"} />
<style>{"\n.hero {\n  display: grid;\n  grid-template-columns: 1.15fr 0.85fr;\n  gap: 56px;\n  align-items: center;\n  padding: 72px 0 56px;\n}\n.hero-title {\n  font-size: clamp(32px, 4.2vw, 52px);\n  font-weight: 800;\n  letter-spacing: -0.035em;\n  line-height: 1.05;\n  margin-bottom: 20px;\n}\n.hero-title em { font-style: normal; color: var(--primary); }\n.hero-desc {\n  font-size: 16px;\n  color: var(--text-2);\n  margin-bottom: 32px;\n  max-width: 520px;\n  line-height: 1.65;\n}\n.hero-cta { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 28px; }\n.hero-trust {\n  display: flex; gap: 12px; flex-wrap: wrap;\n  font-size: 12.5px; color: var(--text-2); font-weight: 600;\n}\n.hero-trust span {\n  display: inline-flex; align-items: center; gap: 8px;\n  padding: 9px 12px; border-radius: var(--r-full);\n  background: rgba(255,255,255,0.7);\n  border: 1px solid var(--border);\n}\n.hero-trust [data-lucide] { width: 15px; height: 15px; color: var(--primary); }\n\n.hero-visual {\n  aspect-ratio: 1 / 0.95;\n  background: linear-gradient(135deg, rgba(60,80,224,0.12) 0%, rgba(125,152,255,0.28) 100%);\n  border-radius: var(--r-xl);\n  display: block;\n  position: relative;\n  overflow: hidden;\n  border: 1px solid rgba(60, 80, 224, 0.15);\n  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 20px 45px rgba(60, 80, 224, 0.12);\n}\n.hero-visual-image {\n  position: absolute;\n  z-index: 0;\n  inset: 0;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: 63% center;\n  filter: saturate(0.94) contrast(0.98);\n}\n\n.steps-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 20px;\n}\n.step-card {\n  padding: 24px;\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--r-md);\n  transition: all var(--t);\n}\n.step-card:hover {\n  border-color: var(--primary);\n  transform: translateY(-3px);\n  box-shadow: var(--shadow-md);\n}\n.step-icon {\n  width: 44px; height: 44px;\n  background: var(--primary-light);\n  color: var(--primary);\n  border-radius: var(--r-md);\n  display: flex; align-items: center; justify-content: center;\n  margin-bottom: 16px;\n  transition: all var(--t);\n}\n.step-icon [data-lucide] { width: 22px; height: 22px; }\n.step-card:hover .step-icon { background: var(--primary); color: #fff; }\n.step-num {\n  font-size: 11px; font-weight: 800;\n  color: var(--primary); letter-spacing: 0.1em;\n  text-transform: uppercase; margin-bottom: 8px;\n}\n.step-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }\n.step-desc { font-size: 13px; color: var(--text-2); line-height: 1.6; }\n\n.diff-card {\n  padding: 28px;\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--r-md);\n  display: flex; flex-direction: column; gap: 14px;\n  transition: all var(--t);\n}\n.diff-card:hover { border-color: var(--primary); box-shadow: var(--shadow-md); }\n.diff-icon {\n  width: 48px; height: 48px;\n  background: var(--primary-light);\n  color: var(--primary);\n  border-radius: var(--r-md);\n  display: flex; align-items: center; justify-content: center;\n}\n.diff-icon [data-lucide] { width: 24px; height: 24px; }\n\n.cta-final {\n  background: var(--text);\n  color: var(--bg);\n  padding: 64px 32px;\n  text-align: center;\n  border-radius: var(--r-lg);\n  position: relative;\n  overflow: hidden;\n}\n.cta-final .btn-secondary {\n  background: rgba(255,255,255,0.1);\n  border-color: rgba(255,255,255,0.15);\n  color: inherit;\n}\n\n.menu-link {\n  display: flex; align-items: center; gap: 12px;\n  padding: 10px 12px;\n  border-radius: var(--r-sm);\n  color: var(--text-2);\n  font-weight: 500;\n  margin-bottom: 3px;\n  cursor: pointer;\n  transition: all var(--t);\n}\n.menu-link:hover { background: var(--surface-2); color: var(--text); }\n.menu-link [data-lucide] { width: 18px; height: 18px; }\n\n@media (max-width: 900px) {\n  .hero { grid-template-columns: 1fr; gap: 40px; padding: 48px 0; }\n  .hero-visual { max-width: 400px; margin: 0 auto; width: 100%; }\n}\n\n@media (max-width: 540px) {\n  .hero-visual-image { object-position: 64% center; }\n}\n"}</style>
<a className={"skip-link"} href={"#main-content"}>{"Aller au contenu"}</a>

<header className={"pub-header"}>
<div className={"pub-header-inner"}>
<a className={"logo"} href={"/"}>
<div className={"logo-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"logo-text"}>{"MONGANGA"}</span>
</a>
<nav className={"pub-nav"}>
<a className={"pub-nav-link active"} href={"/"} aria-current={"page"}>{"Accueil"}</a>
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
<button className={"btn btn-ghost btn-icon"} data-legacy-click={"toggleMobileMenu()"} aria-label={"Fermer le menu"}>
<i data-lucide={"x"}></i>
</button>
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
<main id={"main-content"} tabIndex={"-1"}>

<section className={"container"}>
<div className={"hero"}>
<div className={"slide-in-left"}>
<h1 className={"hero-title"}>{"\n          Monganga na yo,"}<br />
<em>{"na tshombo na yo"}</em>
</h1>
<p className={"hero-desc"}>{"\n          Consultez un médecin vérifié depuis chez vous, sans vous déplacer.\n          La santé à portée de main, à Kinshasa.\n        "}</p>
<div className={"hero-cta"}>
<a className={"btn btn-primary btn-lg"} href={"/public/doctors"}>
<i data-lucide={"video"}></i>{" Trouver un médecin\n          "}</a>
<a className={"btn btn-secondary btn-lg"} href={"/public/how"}>
<i data-lucide={"play-circle"}></i>{" Comment ça marche\n          "}</a>
</div>
<div className={"hero-trust"}>
<span><i data-lucide={"shield-check"}></i>{" Médecins vérifiés"}</span>
<span><i data-lucide={"smartphone"}></i>{" Mobile Money"}</span>
<span><i data-lucide={"lock"}></i>{" Données sécurisées"}</span>
</div>
</div>
<div className={"hero-visual slide-in-right"}>
<img className={"hero-visual-image"} src={"/assets/images/doctor-teleconsultation.webp"} alt={"Médecin en téléconsultation avec un patient"} width={"1600"} height={"1067"} fetchpriority={"high"} decoding={"async"} />
</div>
</div>
</section>

<section className={"section section-alt"}>
<div className={"container"}>
<h2 className={"h2 text-center mb-8"}>{"Comment ça marche ?"}</h2>
<div className={"steps-grid"} data-stagger={""}>
<div className={"step-card"}>
<div className={"step-icon"}><i data-lucide={"search"}></i></div>
<div className={"step-num"}>{"Étape 1"}</div>
<div className={"step-title"}>{"Trouvez un médecin"}</div>
<div className={"step-desc"}>{"Recherchez par spécialité, commune ou disponibilité."}</div>
</div>
<div className={"step-card"}>
<div className={"step-icon"}><i data-lucide={"calendar-check"}></i></div>
<div className={"step-num"}>{"Étape 2"}</div>
<div className={"step-title"}>{"Choisissez un créneau"}</div>
<div className={"step-desc"}>{"Sélectionnez l'heure qui vous convient."}</div>
</div>
<div className={"step-card"}>
<div className={"step-icon"}><i data-lucide={"credit-card"}></i></div>
<div className={"step-num"}>{"Étape 3"}</div>
<div className={"step-title"}>{"Payez en Mobile Money"}</div>
<div className={"step-desc"}>{"M-Pesa, Orange Money, Airtel Money."}</div>
</div>
<div className={"step-card"}>
<div className={"step-icon"}><i data-lucide={"file-text"}></i></div>
<div className={"step-num"}>{"Étape 4"}</div>
<div className={"step-title"}>{"Recevez votre ordonnance"}</div>
<div className={"step-desc"}>{"Vidéo, audio ou chat puis ordonnance numérique."}</div>
</div>
</div>
</div>
</section>

<section className={"section"}>
<div className={"container"}>
<h2 className={"h2 text-center mb-8"}>{"Pourquoi MONGANGA ?"}</h2>
<div className={"grid-2"}>
<div className={"diff-card"}>
<div className={"diff-icon"}><i data-lucide={"wifi-off"}></i></div>
<h3 className={"h3 mb-2"}>{"Connexion instable ? Privilégiez l’audio"}</h3>
<p className={"text-2"}>{"\n            Désactivez la caméra pendant l’appel pour réduire la consommation de données.\n            Les commandes de la consultation restent accessibles.\n          "}</p>
</div>
<div className={"diff-card"}>
<div className={"diff-icon"}><i data-lucide={"file-badge"}></i></div>
<h3 className={"h3 mb-2"}>{"Votre ordonnance, toujours avec vous"}</h3>
<p className={"text-2"}>{"\n            Une carte numérique sécurisée, montrable en pharmacie.\n            Plus besoin d'imprimer.\n          "}</p>
</div>
</div>
</div>
</section>

<section className={"container"} style={{"padding": "0 24px 72px"}}>
<div className={"cta-final"}>
<h2 className={"h1 mb-2"} style={{"color": "inherit"}}>{"Prêt à consulter un médecin ?"}</h2>
<p style={{"opacity": "0.85", "marginBottom": "28px"}}>{"\n        Créez votre compte en 1 minute et prenez votre premier rendez-vous.\n      "}</p>
<div className={"row"} style={{"justifyContent": "center", "flexWrap": "wrap", "gap": "12px"}}>
<a className={"btn btn-primary btn-lg"} href={"/auth/register"}>{"Créer un compte"}</a>
<a className={"btn btn-secondary btn-lg"} href={"/public/doctors"}>{"Voir les médecins"}</a>
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




<Runtime body={{}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/public-pages.js"]} />
</>);
}
