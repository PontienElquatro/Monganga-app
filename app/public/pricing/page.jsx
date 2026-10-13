import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Tarifs — MONGANGA", "description": "Monganga : consultez un médecin à distance à Kinshasa."};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/ui.css"} />
<style>{"\n.breadcrumb {\n  display: flex; align-items: center; gap: 8px;\n  font-size: 12.5px; color: var(--text-3);\n}\n.breadcrumb a:hover { color: var(--primary); }\n.breadcrumb [data-lucide] { width: 14px; height: 14px; }\n\n.trust-bar {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));\n  gap: 12px;\n  max-width: 820px;\n  margin: 0 auto;\n}\n.trust-pill {\n  display: flex; align-items: center; gap: 10px;\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--r-md);\n  padding: 12px 14px;\n  font-size: 12.5px; font-weight: 700; color: var(--text-2);\n}\n.trust-pill [data-lucide] {\n  width: 16px; height: 16px; color: var(--primary);\n}\n\n.pricing-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 20px;\n  max-width: 800px;\n  margin: 0 auto;\n}\n\n.pricing-card {\n  background: var(--surface);\n  border: 2px solid var(--border);\n  border-radius: var(--r-md);\n  padding: 32px 28px;\n  text-align: center;\n  transition: all var(--t);\n  position: relative;\n  display: flex; flex-direction: column;\n}\n.pricing-card:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: var(--shadow-lg); }\n\n.pricing-card.featured {\n  border-color: var(--primary);\n  box-shadow: 0 10px 30px rgba(60, 80, 224, 0.15);\n}\n\n.pricing-badge {\n  position: absolute;\n  top: -12px; left: 50%;\n  transform: translateX(-50%);\n  background: var(--primary);\n  color: #fff;\n  padding: 4px 12px;\n  border-radius: var(--r-full);\n  font-size: 11px; font-weight: 800;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n}\n\n.pricing-badge-soft {\n  display: inline-block;\n  background: var(--primary-light);\n  color: var(--primary);\n  padding: 4px 12px;\n  border-radius: var(--r-full);\n  font-size: 11px; font-weight: 800;\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  margin-bottom: 12px;\n}\n\n.plan-name {\n  font-size: 14px; font-weight: 800;\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  color: var(--primary);\n  margin-bottom: 12px;\n}\n.pricing-card:not(.featured) .plan-name { color: var(--text-2); }\n\n.price { display: flex; align-items: baseline; justify-content: center; gap: 6px; margin-bottom: 6px; }\n.price-value { font-size: 42px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }\n.price-unit { font-size: 14px; font-weight: 500; color: var(--text-2); }\n\n.price-sub { font-size: 13px; color: var(--text-2); margin-bottom: 24px; }\n\n.pricing-features {\n  list-style: none;\n  text-align: left;\n  margin-bottom: 28px;\n  flex: 1;\n}\n.pricing-features li {\n  padding: 8px 0;\n  font-size: 13px;\n  display: flex; gap: 8px; align-items: flex-start;\n  color: var(--text-2);\n}\n.pricing-features [data-lucide] {\n  width: 16px; height: 16px;\n  color: var(--success);\n  flex-shrink: 0;\n  margin-top: 2px;\n}\n\n.payment-methods-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 16px;\n  max-width: 900px;\n  margin: 0 auto;\n}\n.payment-card {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--r-md);\n  padding: 22px;\n  text-align: center;\n  transition: all var(--t);\n}\n.payment-card:hover { border-color: var(--primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }\n.payment-icon {\n  width: 48px; height: 48px;\n  background: var(--primary-light);\n  color: var(--primary);\n  border-radius: var(--r-md);\n  display: flex; align-items: center; justify-content: center;\n  margin: 0 auto 16px;\n}\n.payment-icon [data-lucide] { width: 24px; height: 24px; }\n\n.cta-final {\n  background: var(--text);\n  color: var(--bg);\n  padding: 64px 32px;\n  text-align: center;\n  border-radius: var(--r-lg);\n  position: relative;\n  overflow: hidden;\n}\n.cta-final .btn-secondary {\n  background: rgba(255,255,255,0.1);\n  border-color: rgba(255,255,255,0.15);\n  color: inherit;\n}\n\n@media (max-width: 640px) {\n  .price-value { font-size: 36px; }\n  .pricing-card { padding: 28px 22px; }\n}\n"}</style>
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
<a className={"pub-nav-link active"} href={"/public/pricing"} aria-current={"page"}>{"Tarifs"}</a>
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
<main id={"main-content"} tabIndex={"-1"}>
<section className={"container section"}>
<div className={"fade-in text-center"}>
<div className={"breadcrumb"} style={{"justifyContent": "center", "marginBottom": "16px"}}>
<a href={"/"}>{"Accueil"}</a>
<i data-lucide={"chevron-right"}></i>
<span>{"Tarifs"}</span>
</div>
<h1 className={"h1 mb-4"}>{"Tarifs des consultations"}</h1>
<p className={"text-2 mx-auto"} style={{"fontSize": "15px", "maxWidth": "640px"}}>{"\n        Les tarifs sont fixés par MONGANGA pour garantir la transparence\n        et l'équité. Aucun frais caché.\n      "}</p>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "24px"}}>
<div className={"trust-bar"} data-stagger={""}>
<div className={"trust-pill"}>
<i data-lucide={"shield-check"}></i>
<span>{"Paiement sécurisé"}</span>
</div>
<div className={"trust-pill"}>
<i data-lucide={"wallet"}></i>
<span>{"Mobile Money + carte"}</span>
</div>
<div className={"trust-pill"}>
<i data-lucide={"tag"}></i>
<span>{"Sans frais cachés"}</span>
</div>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "32px"}}>
<div className={"pricing-grid"} data-stagger={""}>
<div className={"pricing-card"}>
<div className={"pricing-badge-soft"}>{"Standard"}</div>
<div className={"plan-name"}>{"Consultation Standard"}</div>
<div className={"price"}>
<span className={"price-value"}>{"20 $"}</span>
<span className={"price-unit"}>{"/ séance"}</span>
</div>
<div className={"price-sub"}>{"Vidéo, audio ou chat — 30 min"}</div>
<ul className={"pricing-features"}>
<li><i data-lucide={"check-circle-2"}></i>{" Consultation avec médecin généraliste vérifié"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Ordonnance numérique sécurisée"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Suivi de dossier médical"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Bascule audio automatique"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Reçu téléchargeable"}</li>
</ul>
<a className={"btn btn-primary btn-block btn-lg"} href={"/auth/register"}>{"\n          Prendre RDV "}<i data-lucide={"arrow-right"}></i>
</a>
</div>
<div className={"pricing-card featured"}>
<div className={"pricing-badge"}>{"Recommandé"}</div>
<div className={"plan-name"}>{"Consultation Spécialiste"}</div>
<div className={"price"}>
<span className={"price-value"}>{"30 $"}</span>
<span className={"price-unit"}>{"/ séance"}</span>
</div>
<div className={"price-sub"}>{"Vidéo HD — 45 min"}</div>
<ul className={"pricing-features"}>
<li><i data-lucide={"check-circle-2"}></i>{" Consultation avec spécialiste vérifié"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Envoi de documents (radios, analyses)"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Ordonnance numérique sécurisée"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Suivi prioritaire"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Assistance technique dédiée"}</li>
</ul>
<a className={"btn btn-primary btn-block btn-lg"} href={"/auth/register"}>{"\n          Prendre RDV "}<i data-lucide={"arrow-right"}></i>
</a>
</div>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "32px"}}>
<div className={"alert info"} style={{"maxWidth": "640px", "margin": "0 auto"}}>
<i data-lucide={"info"}></i>
<span>{"\n        Les tarifs incluent les frais de service.\n        Le paiement s'effectue en Mobile Money (M-Pesa, Orange Money, Airtel Money)\n        ou par carte bancaire.\n      "}</span>
</div>
</section>
<section className={"container section"}>
<h2 className={"h2 text-center mb-8"}>{"Moyens de paiement acceptés"}</h2>
<div className={"payment-methods-grid"} data-stagger={""}>
<div className={"payment-card"}>
<div className={"payment-icon"}><i data-lucide={"smartphone"}></i></div>
<h4 className={"h4 mb-2"}>{"M-Pesa"}</h4>
<p className={"text-2"} style={{"fontSize": "12.5px"}}>{"Paiement instantané via votre compte M-Pesa"}</p>
</div>
<div className={"payment-card"}>
<div className={"payment-icon"}><i data-lucide={"smartphone"}></i></div>
<h4 className={"h4 mb-2"}>{"Orange Money"}</h4>
<p className={"text-2"} style={{"fontSize": "12.5px"}}>{"Payez directement depuis votre téléphone"}</p>
</div>
<div className={"payment-card"}>
<div className={"payment-icon"}><i data-lucide={"smartphone"}></i></div>
<h4 className={"h4 mb-2"}>{"Airtel Money"}</h4>
<p className={"text-2"} style={{"fontSize": "12.5px"}}>{"Solutions Mobile Money disponibles partout"}</p>
</div>
<div className={"payment-card"}>
<div className={"payment-icon"}><i data-lucide={"credit-card"}></i></div>
<h4 className={"h4 mb-2"}>{"Carte bancaire"}</h4>
<p className={"text-2"} style={{"fontSize": "12.5px"}}>{"Visa, Mastercard acceptées en toute sécurité"}</p>
</div>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "72px"}}>
<div className={"cta-final"}>
<h2 className={"h1 mb-2"} style={{"color": "inherit"}}>{"Une question sur les tarifs ?"}</h2>
<p style={{"opacity": "0.85", "marginBottom": "28px"}}>{"\n        Notre équipe est à votre disposition pour répondre à vos questions.\n      "}</p>
<div className={"row"} style={{"justifyContent": "center", "flexWrap": "wrap", "gap": "12px"}}>
<a className={"btn btn-primary btn-lg"} href={"/public/contact"}>
<i data-lucide={"mail"}></i>{" Nous contacter\n        "}</a>
<a className={"btn btn-secondary btn-lg"} href={"/public/faq"}>{"Voir la FAQ"}</a>
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
