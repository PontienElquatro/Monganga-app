import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Créer un compte — MONGANGA", "robots": {"index": false, "follow": false}};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<style>{"\n  .auth-wrapper {\n    min-height: 100vh;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    background: linear-gradient(135deg, #1C2434 0%, #0F172A 100%);\n    padding: 24px;\n    position: relative;\n    overflow: hidden;\n  }\n  .auth-wrapper::before {\n    content: '';\n    position: absolute;\n    width: 600px; height: 600px;\n    border-radius: 50%;\n    background: radial-gradient(circle, rgba(60, 80, 224, 0.25) 0%, transparent 70%);\n    top: -200px; right: -200px;\n    pointer-events: none;\n  }\n  .auth-wrapper::after {\n    content: '';\n    position: absolute;\n    width: 400px; height: 400px;\n    border-radius: 50%;\n    background: radial-gradient(circle, rgba(60, 80, 224, 0.15) 0%, transparent 70%);\n    bottom: -150px; left: -100px;\n    pointer-events: none;\n  }\n  .auth-card {\n    background: #FFFFFF;\n    width: 100%;\n    max-width: 480px;\n    border-radius: var(--r-lg);\n    padding: 40px;\n    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);\n    position: relative;\n    z-index: 1;\n    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);\n  }\n  .auth-brand {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    gap: 10px;\n    margin-bottom: 24px;\n  }\n  .auth-brand-icon {\n    width: 42px; height: 42px;\n    background: linear-gradient(135deg, var(--primary) 0%, #5B6FF0 100%);\n    border-radius: var(--r-md);\n    display: flex; align-items: center; justify-content: center;\n    color: #fff;\n    box-shadow: 0 4px 12px rgba(60, 80, 224, 0.35);\n    transition: transform var(--t);\n    overflow: hidden;\n  }\n  .auth-brand-icon.logo-image-wrap {\n    background: transparent;\n    box-shadow: none;\n    padding: 0;\n  }\n  .auth-brand-icon.logo-image-wrap img {\n    width: 100%;\n    height: 100%;\n    object-fit: cover;\n    display: block;\n  }\n  .auth-brand-icon:hover { transform: rotate(-8deg) scale(1.05); }\n  .auth-brand-icon [data-lucide] { width: 22px; height: 22px; }\n  .auth-brand-text { font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px; }\n  .auth-title { font-size: 22px; font-weight: 800; text-align: center; color: #0F172A; margin-bottom: 6px; }\n  .auth-subtitle { font-size: 13px; color: #64748B; text-align: center; margin-bottom: 24px; }\n  .auth-footer { margin-top: 20px; text-align: center; font-size: 13px; color: #64748B; }\n  .auth-link { color: var(--primary); font-weight: 700; cursor: pointer; }\n  .auth-link:hover { text-decoration: underline; }\n  .auth-back {\n    display: inline-flex; align-items: center; gap: 6px;\n    color: #64748B; font-size: 12.5px; font-weight: 600;\n    cursor: pointer;\n    text-decoration: none;\n    transition: color var(--t);\n  }\n  .auth-back:hover { color: var(--primary); }\n  .auth-back [data-lucide] { width: 14px; height: 14px; }\n\n  /* Role tabs */\n  .role-tabs {\n    display: flex;\n    background: #F1F5F9;\n    padding: 4px;\n    border-radius: var(--r-sm);\n    gap: 2px;\n    margin-bottom: 24px;\n  }\n  .role-tab {\n    flex: 1;\n    padding: 12px;\n    border-radius: 4px;\n    font-size: 13px; font-weight: 700;\n    color: #64748B;\n    cursor: pointer;\n    transition: all var(--t);\n    text-align: center;\n    display: flex; align-items: center; justify-content: center; gap: 6px;\n    font-family: inherit;\n    background: none; border: none;\n  }\n  .role-tab [data-lucide] { width: 15px; height: 15px; }\n  .role-tab:hover { color: #0F172A; }\n  .role-tab.active {\n    background: #FFFFFF;\n    color: var(--primary);\n    box-shadow: 0 1px 3px rgba(0,0,0,0.08);\n  }\n\n  /* Grid 2 cols */\n  .grid-cols-2 {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: 12px;\n  }\n\n  /* Password strength */\n  .password-strength {\n    margin-top: 6px;\n    display: flex;\n    gap: 4px;\n    height: 4px;\n  }\n  .password-strength-bar {\n    flex: 1;\n    background: #E2E8F0;\n    border-radius: 2px;\n    transition: background var(--t);\n  }\n  .password-strength-bar.weak { background: #EF4444; }\n  .password-strength-bar.medium { background: #F59E0B; }\n  .password-strength-bar.strong { background: #10B981; }\n\n  .password-hint {\n    font-size: 11px;\n    color: #94A3B8;\n    margin-top: 6px;\n    display: flex; align-items: center; gap: 4px;\n  }\n  .password-hint [data-lucide] { width: 12px; height: 12px; }\n\n  .otp-notice {\n    display: flex; gap: 10px; align-items: flex-start;\n    padding: 12px 14px;\n    background: #EFF6FF;\n    border: 1px solid #BFDBFE;\n    border-radius: var(--r-sm);\n    font-size: 12.5px;\n    color: #1D4ED8;\n    line-height: 1.5;\n    margin-bottom: 20px;\n  }\n  .otp-notice [data-lucide] { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }\n\n  .form-checkbox {\n    display: flex; gap: 8px; align-items: flex-start;\n    font-size: 12.5px; color: #64748B;\n    line-height: 1.5;\n    cursor: pointer;\n    margin-bottom: 20px;\n  }\n  .form-checkbox input {\n    width: 16px; height: 16px;\n    accent-color: var(--primary);\n    margin-top: 2px;\n    cursor: pointer;\n    flex-shrink: 0;\n  }\n  .form-checkbox a {\n    color: var(--primary);\n    font-weight: 700;\n  }\n\n  @media (max-width: 480px) {\n    .auth-card { padding: 28px 22px; }\n    .grid-cols-2 { grid-template-columns: 1fr; }\n  }\n"}</style>

<div className={"auth-wrapper"}>
<div className={"auth-card"} id={"main-content"} role={"main"}>
<a className={"auth-back"} href={"/"}>
<i data-lucide={"arrow-left"}></i>{" Retour à l'accueil\n    "}</a>
<div className={"auth-brand"} style={{"marginTop": "18px"}}>
<div className={"auth-brand-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"auth-brand-text"}>{"MONGANGA"}</span>
</div>
<h1 className={"auth-title"}>{"Créer un compte"}</h1>
<p className={"auth-subtitle"}>{"Choisissez votre type de compte pour commencer"}</p>

<div className={"role-tabs"} role={"tablist"}>
<button className={"role-tab active"} type={"button"} id={"tab-patient"} data-auth-role={"patient"} role={"tab"} aria-selected={"true"} aria-controls={"form-patient"} tabIndex={"0"}>
<i data-lucide={"user"}></i>{" Patient\n      "}</button>
<button className={"role-tab"} type={"button"} id={"tab-doctor"} data-auth-role={"doctor"} role={"tab"} aria-selected={"false"} aria-controls={"form-doctor"} tabIndex={"-1"}>
<i data-lucide={"stethoscope"}></i>{" Médecin\n      "}</button>
</div>

<div id={"form-patient"} role={"tabpanel"} aria-labelledby={"tab-patient"}>
<form id={"register-form"}>
<div className={"grid-cols-2"}>
<div className={"form-group"}>
<label className={"form-label"} htmlFor={"firstName"}>{"Prénom"}</label>
<input type={"text"} className={"form-input"} placeholder={"Aline"} required={true} name={"firstName"} id={"firstName"} autoComplete={"given-name"} maxLength={"60"} />
</div>
<div className={"form-group"}>
<label className={"form-label"} htmlFor={"lastName"}>{"Nom"}</label>
<input type={"text"} className={"form-input"} placeholder={"Kabila"} required={true} name={"lastName"} id={"lastName"} autoComplete={"family-name"} maxLength={"60"} />
</div>
</div>
<div className={"form-group"}>
<label className={"form-label"} htmlFor={"phone"}>{"Téléphone"}</label>
<div className={"input-wrap"}>
<i data-lucide={"phone"} className={"icon-left"}></i>
<input type={"tel"} className={"form-input"} placeholder={"+243 8XX XXX XXX"} required={true} name={"phone"} id={"phone"} autoComplete={"tel"} pattern={"[+0-9 ()\\-]{9,20}"} />
</div>
</div>
<div className={"form-group"}>
<label className={"form-label"} htmlFor={"email"}>{"Email (optionnel)"}</label>
<div className={"input-wrap"}>
<i data-lucide={"mail"} className={"icon-left"}></i>
<input type={"email"} className={"form-input"} placeholder={"aline@email.com"} name={"email"} id={"email"} autoComplete={"email"} />
</div>
</div>
<div className={"form-group"}>
<label className={"form-label"} htmlFor={"password-patient"}>{"Mot de passe"}</label>
<div className={"input-wrap"}>
<i data-lucide={"lock"} className={"icon-left"}></i>
<input type={"password"} className={"form-input"} id={"password-patient"} placeholder={"Au moins 8 caractères"} required={true} style={{"paddingRight": "42px"}} data-legacy-input={"checkPasswordStrength(this, 'strength-patient')"} name={"password"} autoComplete={"new-password"} minLength={"8"} maxLength={"128"} />
<button type={"button"} className={"password-toggle"} data-password-target={"password-patient"} aria-label={"Afficher le mot de passe"} aria-pressed={"false"}><i data-lucide={"eye"} className={""}></i></button>
</div>
<div className={"password-strength"} id={"strength-patient"}>
<div className={"password-strength-bar"}></div>
<div className={"password-strength-bar"}></div>
<div className={"password-strength-bar"}></div>
<div className={"password-strength-bar"}></div>
</div>
<div className={"password-hint"}>
<i data-lucide={"info"}></i>{"\n            Minimum 8 caractères, avec majuscule et chiffre\n          "}</div>
</div>
<label className={"form-checkbox"}>
<input type={"checkbox"} required={true} name={"consent"} id={"consent"} autoComplete={"off"} />
<span>{"\n            J'accepte les "}<a href={"/public/conditions-utilisation"}>{"conditions d'utilisation"}</a>{" et\n            la "}<a href={"/public/politique-confidentialite"}>{"politique de confidentialité"}</a>{" de MONGANGA.\n          "}</span>
</label>
<p className={"notice danger form-error"} role={"alert"} tabIndex={"-1"} hidden={true}></p><button type={"submit"} className={"btn btn-primary btn-lg btn-block"}>
<i data-lucide={"user-plus"}></i>{" Créer mon compte patient\n        "}</button>
<div className={"otp-notice"} style={{"marginTop": "20px"}}>
<i data-lucide={"message-square"}></i>
<span>{"\n            Un code OTP vous sera envoyé par SMS pour valider votre numéro de téléphone.\n          "}</span>
</div>
</form>
</div>

<div id={"form-doctor"} style={{"display": "none"}} role={"tabpanel"} aria-labelledby={"tab-doctor"}>
<div className={"otp-notice"} style={{"marginBottom": "20px"}}>
<i data-lucide={"shield-check"}></i>
<span>
<strong>{"Processus vérifié."}</strong>{" En tant que médecin, votre dossier\n          sera examiné par notre équipe avant activation de votre compte.\n        "}</span>
</div>
<div style={{"padding": "20px", "background": "#F8FAFC", "borderRadius": "var(--r-md)", "border": "1px solid #E2E8F0", "marginBottom": "20px"}}>
<h3 style={{"fontSize": "14px", "fontWeight": "700", "marginBottom": "12px", "color": "#0F172A"}}>{"\n          Candidature médecin\n        "}</h3>
<p style={{"fontSize": "13px", "color": "#64748B", "lineHeight": "1.6", "marginBottom": "16px"}}>{"\n          Pour devenir médecin partenaire MONGANGA, remplissez le formulaire\n          complet de candidature avec vos pièces justificatives.\n        "}</p>
<ul style={{"listStyle": "none", "display": "flex", "flexDirection": "column", "gap": "8px", "marginBottom": "20px"}}>
<li style={{"display": "flex", "gap": "8px", "fontSize": "12.5px", "color": "#475569"}}>
<i data-lucide={"check-circle-2"} style={{"width": "14px", "height": "14px", "color": "#10B981", "flexShrink": "0", "marginTop": "2px"}}></i>{"\n            Pièce d'identité\n          "}</li>
<li style={{"display": "flex", "gap": "8px", "fontSize": "12.5px", "color": "#475569"}}>
<i data-lucide={"check-circle-2"} style={{"width": "14px", "height": "14px", "color": "#10B981", "flexShrink": "0", "marginTop": "2px"}}></i>{"\n            Diplôme de médecine\n          "}</li>
<li style={{"display": "flex", "gap": "8px", "fontSize": "12.5px", "color": "#475569"}}>
<i data-lucide={"check-circle-2"} style={{"width": "14px", "height": "14px", "color": "#10B981", "flexShrink": "0", "marginTop": "2px"}}></i>{"\n            Inscription à l'Ordre des Médecins\n          "}</li>
<li style={{"display": "flex", "gap": "8px", "fontSize": "12.5px", "color": "#475569"}}>
<i data-lucide={"check-circle-2"} style={{"width": "14px", "height": "14px", "color": "#10B981", "flexShrink": "0", "marginTop": "2px"}}></i>{"\n            CV professionnel\n          "}</li>
</ul>
</div>
<a className={"btn btn-primary btn-lg btn-block"} href={"/public/candidature"}>
<i data-lucide={"edit-3"}></i>{" Remplir le formulaire de candidature\n      "}</a>
<p style={{"textAlign": "center", "fontSize": "12px", "color": "#94A3B8", "marginTop": "16px"}}>{"\n        Durée estimée : 5 minutes\n      "}</p>
</div>
<div className={"auth-footer"}>{"\n      Déjà inscrit ?\n      "}<a className={"auth-link"} href={"/auth/login"}>{"Se connecter"}</a>
</div>
</div>
</div>

<Runtime body={{"data-page": "register", "class": "restored-auth"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/restored-auth.js", "/assets/js/restored-shell.js"]} />
</>);
}
