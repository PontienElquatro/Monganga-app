'use client';

import { useEffect, useState } from 'react';

// These widgets own their DOM once mounted. Links intentionally perform a full
// document navigation, so listeners, timers and media tracks cannot leak from
// one workspace into another. Never replace these anchors with Next Link until
// the corresponding widget has been rewritten with React state and cleanup.
let bootPromise;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.body.append(script);
  });
}

function canonicalizeLinks() {
  document.querySelectorAll('a[href]').forEach(anchor => {
    const url = new URL(anchor.getAttribute('href'), window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return;
    url.pathname = url.pathname === '/index.html' ? '/' : url.pathname.slice(0, -5);
    anchor.setAttribute('href', url.pathname + url.search + url.hash);
  });
}

function bindOriginalActions() {
  const allowed = new Set(['toggleMobileMenu', 'toggleTheme']);
  document.querySelectorAll('[data-legacy-click]').forEach(element => {
    const action = element.getAttribute('data-legacy-click');
    const call = /^([a-zA-Z]+)\(\)$/.exec(action);
    if (call && allowed.has(call[1]) && !element.hasAttribute('data-theme-button')) {
      element.addEventListener('click', () => window[call[1]]?.());
    }
    const navigation = /^location\.href='(reports|agenda|ordonnances)\.html'$/.exec(action);
    if (navigation) {
      element.addEventListener('click', () => {
        const url = new URL(navigation[1], window.location.href);
        window.location.assign(url.pathname);
      });
    }
  });
  document.querySelectorAll('[data-legacy-input]').forEach(input => {
    if (input.getAttribute('data-legacy-input') === "checkPasswordStrength(this, 'strength-patient')") {
      input.addEventListener('input', () => window.checkPasswordStrength?.(input, 'strength-patient'));
    }
  });
}

async function boot(body, scripts) {
  for (const [name, value] of Object.entries(body)) document.body.setAttribute(name, value);
  window.MONGANGA_CONFIG = Object.freeze({
    mode: process.env.NEXT_PUBLIC_MONGANGA_MODE || 'demo',
    apiBaseUrl: '/api/v1',
    timeoutMs: 15000,
    timeZone: 'Africa/Kinshasa',
    paymentOrigins: (process.env.NEXT_PUBLIC_PAYMENT_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean),
    documentOrigins: (process.env.NEXT_PUBLIC_DOCUMENT_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean),
  });
  if (!['demo', 'api'].includes(window.MONGANGA_CONFIG.mode)) throw new Error('Mode MONGANGA invalide : choisissez demo ou api.');
  // Theme is already initialized by the root layout, before hydration.
  for (const src of scripts) if (!src.endsWith('/theme.js')) await loadScript(src);
  bindOriginalActions();
  document.dispatchEvent(new Event('monganga:ready'));
  canonicalizeLinks();
  const observer = new MutationObserver(canonicalizeLinks);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  document.body.dataset.runtime = 'ready';
}

export default function Runtime({ body, scripts }) {
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    // A single promise also prevents React Strict Mode from binding twice.
    bootPromise ||= boot(body, scripts);
    bootPromise.catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [body, scripts]);
  if (!error) return null;
  return <div role="alert" className="notice danger">
    <p>{error}</p>
    <button type="button" onClick={() => window.location.reload()}>Recharger la page</button>
  </div>;
}
