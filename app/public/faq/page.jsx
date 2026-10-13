import Runtime from '../../../components/Runtime';

export const metadata = {"title": "FAQ — MONGANGA"};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<style>{"\n.breadcrumb {\n  display: flex; align-items: center; gap: 8px;\n  font-size: 12.5px; color: var(--text-3);\n}\n.breadcrumb a:hover { color: var(--primary); }\n.breadcrumb [data-lucide] { width: 14px; height: 14px; }\n\n.faq-categories {\n  display: flex; gap: 8px; flex-wrap: wrap;\n  justify-content: center;\n}\n\n.faq-list {\n  max-width: 780px;\n  margin: 0 auto;\n  display: flex; flex-direction: column; gap: 12px;\n}\n\n.faq-item {\n  background: var(--surface);\n  border: 1px solid var(--border);\n  border-radius: var(--r-md);\n  overflow: hidden;\n  transition: all var(--t);\n  cursor: pointer;\n}\n.faq-item:hover { border-color: var(--primary-soft); }\n.faq-item.open { border-color: var(--primary); box-shadow: var(--shadow-md); }\n\n.faq-question {\n  padding: 18px 22px;\n  display: flex; align-items: center; gap: 14px;\n  font-size: 14px; font-weight: 600;\n  user-select: none;\n}\n.faq-icon {\n  width: 36px; height: 36px;\n  border-radius: var(--r-sm);\n  background: var(--primary-light);\n  color: var(--primary);\n  display: flex; align-items: center; justify-content: center;\n  flex-shrink: 0;\n  transition: all var(--t);\n}\n.faq-icon [data-lucide] { width: 18px; height: 18px; }\n.faq-item.open .faq-icon { background: var(--primary); color: #fff; }\n\n.faq-question > span { flex: 1; }\n\n.faq-chevron {\n  transition: transform var(--t);\n  color: var(--text-3);\n  flex-shrink: 0;\n}\n.faq-item.open .faq-chevron { transform: rotate(180deg); color: var(--primary); }\n\n.faq-answer {\n  max-height: 0;\n  overflow: hidden;\n  transition: all 0.3s ease;\n  padding: 0 22px;\n  font-size: 13.5px;\n  color: var(--text-2);\n  line-height: 1.7;\n}\n.faq-item.open .faq-answer { max-height: 500px; padding: 0 22px 20px 72px; }\n\n.faq-list-simple {\n  list-style: none;\n  display: flex; flex-direction: column;\n  gap: 6px;\n  margin: 8px 0;\n}\n.faq-list-simple li { display: flex; gap: 8px; align-items: center; font-size: 13px; }\n.faq-list-simple [data-lucide] { width: 14px; height: 14px; color: var(--success); flex-shrink: 0; }\n\n.cta-final {\n  background: var(--text);\n  color: var(--bg);\n  padding: 64px 32px;\n  text-align: center;\n  border-radius: var(--r-lg);\n  position: relative;\n  overflow: hidden;\n}\n.cta-final .btn-secondary {\n  background: rgba(255,255,255,0.1);\n  border-color: rgba(255,255,255,0.15);\n  color: inherit;\n}\n\n@media (max-width: 640px) {\n  .faq-question { padding: 16px 18px; font-size: 13.5px; }\n  .faq-icon { width: 32px; height: 32px; }\n  .faq-item.open .faq-answer { padding: 0 18px 18px 18px; }\n}\n"}</style>

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
<a className={"pub-nav-link active"} href={"/public/faq"}>{"FAQ"}</a>
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
<div className={"fade-in text-center"}>
<div className={"breadcrumb"} style={{"justifyContent": "center", "marginBottom": "16px"}}>
<a href={"/"}>{"Accueil"}</a>
<i data-lucide={"chevron-right"}></i>
<span>{"FAQ"}</span>
</div>
<h1 className={"h1 mb-4"}>{"Questions fréquentes"}</h1>
<p className={"text-2 mx-auto"} style={{"fontSize": "15px", "maxWidth": "640px"}}>{"\n        Retrouvez les réponses aux questions les plus posées par nos utilisateurs.\n      "}</p>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "48px"}}>
<div className={"faq-categories"} data-stagger={""}>
<button className={"chip active"} data-filter={"all"} aria-pressed={"true"}>{"Toutes"}</button>
<button className={"chip"} data-filter={"prise-rdv"} aria-pressed={"false"}>{"Prise de RDV"}</button>
<button className={"chip"} data-filter={"paiement"} aria-pressed={"false"}>{"Paiement"}</button>
<button className={"chip"} data-filter={"consultation"} aria-pressed={"false"}>{"Consultation"}</button>
<button className={"chip"} data-filter={"medecin"} aria-pressed={"false"}>{"Devenir médecin"}</button>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "72px"}}>
<div className={"faq-list fade-in"}>
<div className={"faq-item"} data-category={"prise-rdv"}>
<button type={"button"} className={"faq-question"} id={"faq-question-0"} aria-expanded={"false"} aria-controls={"faq-answer-0"}>
<div className={"faq-icon"}><i data-lucide={"calendar-check"}></i></div>
<span>{"Comment prendre un rendez-vous ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-0"} aria-labelledby={"faq-question-0"}>
<p>{"Créez un compte gratuit, recherchez un médecin par spécialité ou commune,\n          choisissez un créneau disponible et payez en Mobile Money. Vous recevrez une\n          confirmation immédiate par notification et email."}</p>
<p className={"mt-2"}>{"Vous pourrez ensuite rejoindre la consultation depuis votre espace personnel\n          à l'heure prévue."}</p>
</div>
</div>
<div className={"faq-item"} data-category={"paiement"}>
<button type={"button"} className={"faq-question"} id={"faq-question-1"} aria-expanded={"false"} aria-controls={"faq-answer-1"}>
<div className={"faq-icon"}><i data-lucide={"credit-card"}></i></div>
<span>{"Quels sont les moyens de paiement acceptés ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-1"} aria-labelledby={"faq-question-1"}>
<p>{"Nous acceptons plusieurs moyens de paiement adaptés au contexte local :"}</p>
<ul className={"faq-list-simple"}>
<li><i data-lucide={"check-circle-2"}></i>{" M-Pesa"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Orange Money"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Airtel Money"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Cartes bancaires Visa et Mastercard"}</li>
</ul>
<p className={"mt-2"}>{"Tous les paiements sont sécurisés et confirmés instantanément."}</p>
</div>
</div>
<div className={"faq-item"} data-category={"consultation"}>
<button type={"button"} className={"faq-question"} id={"faq-question-2"} aria-expanded={"false"} aria-controls={"faq-answer-2"}>
<div className={"faq-icon"}><i data-lucide={"wifi-off"}></i></div>
<span>{"Que faire si ma connexion est faible pendant une consultation ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-2"} aria-labelledby={"faq-question-2"}>
<p>{"MONGANGA détecte automatiquement la qualité du réseau et vous propose\n          de basculer en mode audio en un clic, sans couper la consultation.\n          Vous pouvez aussi ignorer la suggestion et continuer en vidéo."}</p>
<p className={"mt-2"}>{"Si la connexion revient à la normale, vous pouvez repasser en vidéo\n          à tout moment."}</p>
</div>
</div>
<div className={"faq-item"} data-category={"consultation"}>
<button type={"button"} className={"faq-question"} id={"faq-question-3"} aria-expanded={"false"} aria-controls={"faq-answer-3"}>
<div className={"faq-icon"}><i data-lucide={"file-text"}></i></div>
<span>{"Comment obtenir mon ordonnance après la consultation ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-3"} aria-labelledby={"faq-question-3"}>
<p>{"L'ordonnance est émise directement par le médecin à la fin de la consultation.\n          Elle apparaît immédiatement dans votre espace personnel sous forme de carte\n          numérique sécurisée."}</p>
<p className={"mt-2"}>{"Vous pouvez la montrer en pharmacie, la télécharger en PDF\n          ou l'archiver dans votre historique médical."}</p>
</div>
</div>
<div className={"faq-item"} data-category={"prise-rdv"}>
<button type={"button"} className={"faq-question"} id={"faq-question-4"} aria-expanded={"false"} aria-controls={"faq-answer-4"}>
<div className={"faq-icon"}><i data-lucide={"calendar-x"}></i></div>
<span>{"Comment annuler ou reporter un rendez-vous ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-4"} aria-labelledby={"faq-question-4"}>
<p>{"Depuis votre espace personnel, dans \"Mes rendez-vous\", cliquez sur le rendez-vous\n          concerné puis choisissez \"Annuler\" ou \"Reporter\"."}</p>
<p className={"mt-2"}>{"Annulation gratuite jusqu'à 24h avant le rendez-vous.\n          Passé ce délai, des conditions particulières peuvent s'appliquer."}</p>
</div>
</div>
<div className={"faq-item"} data-category={"medecin"}>
<button type={"button"} className={"faq-question"} id={"faq-question-5"} aria-expanded={"false"} aria-controls={"faq-answer-5"}>
<div className={"faq-icon"}><i data-lucide={"stethoscope"}></i></div>
<span>{"Comment devenir médecin partenaire MONGANGA ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-5"} aria-labelledby={"faq-question-5"}>
<p>{"Rendez-vous sur la page \"Devenir médecin\" et remplissez le formulaire\n          de candidature en ligne. Vous devrez fournir :"}</p>
<ul className={"faq-list-simple"}>
<li><i data-lucide={"check-circle-2"}></i>{" Pièce d'identité"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Diplôme de médecine"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" Attestation d'inscription à l'Ordre"}</li>
<li><i data-lucide={"check-circle-2"}></i>{" CV professionnel"}</li>
</ul>
<p className={"mt-2"}>{"Notre équipe examine votre dossier sous 48h et vous contactera\n          par email."}</p>
</div>
</div>
<div className={"faq-item"} data-category={"consultation"}>
<button type={"button"} className={"faq-question"} id={"faq-question-6"} aria-expanded={"false"} aria-controls={"faq-answer-6"}>
<div className={"faq-icon"}><i data-lucide={"shield-check"}></i></div>
<span>{"Comment mes données médicales sont-elles protégées ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-6"} aria-labelledby={"faq-question-6"}>
<p>{"Vos données médicales sont chiffrées et stockées dans des serveurs sécurisés.\n          Seuls votre médecin traitant et vous-même pouvez y accéder."}</p>
<p className={"mt-2"}>{"Nous ne partageons jamais vos informations avec des tiers sans\n          votre consentement explicite."}</p>
</div>
</div>
<div className={"faq-item"} data-category={"consultation"}>
<button type={"button"} className={"faq-question"} id={"faq-question-7"} aria-expanded={"false"} aria-controls={"faq-answer-7"}>
<div className={"faq-icon"}><i data-lucide={"smartphone"}></i></div>
<span>{"Ai-je besoin d'une application mobile pour utiliser MONGANGA ?"}</span>
<i data-lucide={"chevron-down"} className={"faq-chevron"}></i>
</button>
<div className={"faq-answer"} id={"faq-answer-7"} aria-labelledby={"faq-question-7"}>
<p>{"Non. MONGANGA est une plateforme web accessible depuis n'importe quel\n          navigateur moderne (Chrome, Safari, Firefox) sur ordinateur, tablette\n          ou smartphone."}</p>
<p className={"mt-2"}>{"Une application mobile native est en cours de développement."}</p>
</div>
</div>
</div>
</section>
<section className={"container"} style={{"paddingBottom": "72px"}}>
<div className={"cta-final"}>
<h2 className={"h1 mb-2"} style={{"color": "inherit"}}>{"Vous n'avez pas trouvé votre réponse ?"}</h2>
<p style={{"opacity": "0.85", "marginBottom": "28px"}}>{"\n        Notre équipe est disponible pour vous aider.\n      "}</p>
<div className={"row"} style={{"justifyContent": "center", "flexWrap": "wrap", "gap": "12px"}}>
<a className={"btn btn-primary btn-lg"} href={"/public/contact"}>
<i data-lucide={"mail"}></i>{" Nous contacter\n        "}</a>
<a className={"btn btn-secondary btn-lg"} href={"/public/how"}>{"Voir comment ça marche"}</a>
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
