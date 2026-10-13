import Runtime from '../../../components/Runtime';

export const metadata = {"title": "Connexion — MONGANGA", "robots": {"index": false, "follow": false}};

export default function Page() {
  return (<>
<link rel="stylesheet" href={"/assets/css/style.css"} />
<link rel="stylesheet" href={"/assets/css/animations.css"} />
<link rel="stylesheet" href={"/assets/css/fonts.css"} />
<link rel="stylesheet" href={"/assets/css/restored.css"} />
<style>{"\n  .auth-wrapper {\n    min-height: 100vh;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    background: linear-gradient(135deg, #1C2434 0%, #0F172A 100%);\n    padding: 24px;\n    position: relative;\n    overflow: hidden;\n  }\n  .auth-wrapper::before {\n    content: '';\n    position: absolute;\n    width: 600px; height: 600px;\n    border-radius: 50%;\n    background: radial-gradient(circle, rgba(60, 80, 224, 0.25) 0%, transparent 70%);\n    top: -200px; right: -200px;\n    pointer-events: none;\n  }\n  .auth-wrapper::after {\n    content: '';\n    position: absolute;\n    width: 400px; height: 400px;\n    border-radius: 50%;\n    background: radial-gradient(circle, rgba(60, 80, 224, 0.15) 0%, transparent 70%);\n    bottom: -150px; left: -100px;\n    pointer-events: none;\n  }\n  .auth-card {\n    background: #FFFFFF;\n    width: 100%;\n    max-width: 440px;\n    border-radius: var(--r-lg);\n    padding: 40px;\n    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.25);\n    position: relative;\n    z-index: 1;\n    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);\n  }\n  .auth-brand {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    gap: 10px;\n    margin-bottom: 26px;\n  }\n  .auth-brand-icon {\n    width: 42px; height: 42px;\n    background: linear-gradient(135deg, var(--primary) 0%, #5B6FF0 100%);\n    border-radius: var(--r-md);\n    display: flex; align-items: center; justify-content: center;\n    color: #fff;\n    box-shadow: 0 4px 12px rgba(60, 80, 224, 0.35);\n    transition: transform var(--t);\n    overflow: hidden;\n  }\n  .auth-brand-icon.logo-image-wrap {\n    background: transparent;\n    box-shadow: none;\n    padding: 0;\n  }\n  .auth-brand-icon.logo-image-wrap img {\n    width: 100%;\n    height: 100%;\n    object-fit: cover;\n    display: block;\n  }\n  .auth-brand-icon:hover { transform: rotate(-8deg) scale(1.05); }\n  .auth-brand-icon [data-lucide] { width: 22px; height: 22px; }\n  .auth-brand-text { font-size: 20px; font-weight: 800; color: #0F172A; letter-spacing: -0.3px; }\n  .auth-title { font-size: 22px; font-weight: 800; text-align: center; color: #0F172A; margin-bottom: 6px; }\n  .auth-subtitle { font-size: 13px; color: #64748B; text-align: center; margin-bottom: 26px; }\n  .auth-footer { margin-top: 20px; text-align: center; font-size: 13px; color: #64748B; }\n  .auth-link { color: var(--primary); font-weight: 700; cursor: pointer; }\n  .auth-link:hover { text-decoration: underline; }\n  .auth-back {\n    display: inline-flex; align-items: center; gap: 6px;\n    color: #64748B; font-size: 12.5px; font-weight: 600;\n    cursor: pointer;\n    text-decoration: none;\n    transition: color var(--t);\n  }\n  .auth-back:hover { color: var(--primary); }\n  .auth-back [data-lucide] { width: 14px; height: 14px; }\n  .demo-hint {\n    background: #EFF6FF;\n    border: 1px solid #BFDBFE;\n    color: #1D4ED8;\n    font-size: 12px;\n    padding: 12px 14px;\n    border-radius: var(--r-sm);\n    margin-top: 20px;\n    display: flex;\n    gap: 8px;\n    align-items: flex-start;\n    line-height: 1.5;\n  }\n  .demo-hint [data-lucide] { width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px; }\n  .demo-hint code {\n    background: rgba(29, 78, 216, 0.1);\n    padding: 1px 5px;\n    border-radius: 3px;\n    font-size: 11px;\n    font-family: 'Courier New', monospace;\n    font-weight: 700;\n  }\n  .role-chips {\n    display: flex;\n    gap: 6px;\n    margin-top: 10px;\n    flex-wrap: wrap;\n  }\n  .role-chip {\n    font-size: 11px;\n    padding: 4px 10px;\n    background: rgba(29, 78, 216, 0.08);\n    border-radius: var(--r-full);\n    font-weight: 600;\n    cursor: pointer;\n    transition: all var(--t);\n  }\n  .role-chip:hover { background: rgba(29, 78, 216, 0.18); }\n"}</style>

<div className={"auth-wrapper"}>
<div className={"auth-card"} id={"main-content"} role={"main"}>
<a className={"auth-back"} href={"/"}>
<i data-lucide={"arrow-left"}></i>{" Retour à l'accueil\n    "}</a>
<div className={"auth-brand"} style={{"marginTop": "18px"}}>
<div className={"auth-brand-icon logo-image-wrap"}><img src={"/assets/logo/monganga-icone.jpg"} alt={"MONGANGA"} /></div>
<span className={"auth-brand-text"}>{"MONGANGA"}</span>
</div>
<h1 className={"auth-title"}>{"Bon retour"}</h1>
<p className={"auth-subtitle"}>{"Connectez-vous pour accéder à votre espace"}</p>
<form id={"login-form"}>
<div className={"form-group"}>
<label className={"form-label"} htmlFor={"loginEmail"}>{"Email ou téléphone"}</label>
<div className={"input-wrap"}>
<i data-lucide={"mail"} className={"icon-left"}></i>
<input type={"text"} id={"loginEmail"} className={"form-input"} placeholder={"vous@monganga.cd"} required={true} name={"email"} autoComplete={"username"} />
</div>
</div>
<div className={"form-group"}>
<label className={"form-label"} htmlFor={"loginPassword"}>{"Mot de passe"}</label>
<div className={"input-wrap"}>
<i data-lucide={"lock"} className={"icon-left"}></i>
<input type={"password"} id={"loginPassword"} className={"form-input"} placeholder={"••••••••"} required={true} style={{"paddingRight": "42px"}} name={"password"} autoComplete={"current-password"} />
<button type={"button"} className={"password-toggle"} data-password-target={"loginPassword"} aria-label={"Afficher le mot de passe"} aria-pressed={"false"}><i data-lucide={"eye"} className={""} style={{"cursor": "pointer"}}></i></button>
</div>
</div>
<div style={{"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "20px"}}>
<label style={{"fontSize": "12px", "display": "flex", "gap": "6px", "alignItems": "center", "cursor": "pointer", "color": "#64748B"}}>
<input type={"checkbox"} style={{"accentColor": "var(--primary)"}} name={"remember"} />{" Se souvenir\n        "}</label>
<a className={"auth-link"} style={{"fontSize": "12px"}} href={"/auth/forgot"}>{"Mot de passe oublié ?"}</a>
</div>
<p className={"notice danger form-error"} role={"alert"} tabIndex={"-1"} hidden={true}></p><button type={"submit"} className={"btn btn-primary btn-lg btn-block"}>{"\n        Se connecter "}<i data-lucide={"arrow-right"}></i>
</button>
</form>
<div className={"demo-hint"} hidden={true}>
<i data-lucide={"info"}></i>
<div><strong>{"Démo :"}</strong>{" choisissez un compte de test."}<div className={"role-chips"}><button type={"button"} className={"role-chip"} data-demo-id={"admin-demo"}>{"Admin"}</button><button type={"button"} className={"role-chip"} data-demo-id={"user-ilunga"}>{"Médecin"}</button><button type={"button"} className={"role-chip"} data-demo-id={"patient-demo"}>{"Patient"}</button></div></div>
</div>
<div className={"auth-footer"}>{"\n      Pas encore de compte ?\n      "}<a className={"auth-link"} href={"/auth/register"}>{"Créer un compte"}</a>
</div>
</div>
</div>

<Runtime body={{"data-page": "login", "class": "restored-auth"}} scripts={["/assets/js/theme.js", "/assets/vendor/lucide-0.468.0.min.js", "/assets/js/api.js", "/assets/js/catalog.js", "/assets/js/data.js", "/assets/js/app.js", "/assets/js/pages.js", "/assets/js/restored-auth.js", "/assets/js/restored-shell.js"]} />
</>);
}
