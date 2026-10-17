import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  auth, ouvirAuth, cadastrar, entrar, sair, getPersonal, setPersonal,
  getShared, setShared, ouvirShared,
  ouvirEntidades, salvarEntidade as salvarEntidadeBase, removerEntidadeDoc, ouvirRoster, adicionarItemArray,
  ouvirHistorico, adicionarHistorico,
  migrarDadosAntigos, ouvirErrosSalvamento,
} from "./firebase.js";

/* Toda ficha salva leva junto os máximos reais de Vida e Nen (com bônus de poderes). A extensão do Owlbear
   lê esse campo "hud" para desenhar as barras sobre os tokens. */
function calcHud(e) {
  try { return { pvMax: pvMaxCalc(e), nenMax: nenMaxCalc(e) }; } catch { return e?.hud || null; }
}
const salvarEntidade = (e) => salvarEntidadeBase(e && typeof e === "object" ? { ...e, hud: calcHud(e) } : e);

/* ---------- estilo global ---------- */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

    html, body { margin: 0; padding: 0; background: #0e0e12; }
    #root { min-height: 100vh; }
    .mm3 * { box-sizing: border-box; }
    .mm3 {
      --bg: #0e0e12; --surface: #16161c; --surface2: #1e1e27; --surface3: #24242f;
      --border: rgba(255,255,255,0.08);
      --accent: #e8c84a; --accent-soft: rgba(232,200,74,0.12);
      --text: #f0eeea; --muted: #8a8a92;
      --success: #4cba7a; --success-bg: rgba(76,186,122,0.12); --success-border: rgba(76,186,122,0.3);
      --warn: #e8964a; --warn-bg: rgba(232,150,74,0.12); --warn-border: rgba(232,150,74,0.3);
      --danger: #e85a5a; --danger-bg: rgba(232,90,90,0.12); --danger-border: rgba(232,90,90,0.3);
      --crit: #c084fc; --crit-bg: rgba(192,132,252,0.12); --crit-border: rgba(192,132,252,0.35);
      background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif;
      min-height: 100vh; width: 100%; padding: 1.5rem 0.6rem 3rem 1.2rem; display: flex; flex-direction: column; align-items: center;
    }
    .mm3 h1 { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
    .mm3 .wrap { width: 100%; max-width: 1760px; }

    .mm3 header.top { text-align:center; margin-bottom: 1.4rem; }
    .mm3 header.top h1 { font-size: clamp(2.2rem, 7vw, 3.4rem); color: var(--accent); line-height:1; }
    .mm3 header.top p { font-size:0.78rem; color: var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-top:0.3rem; }

    .mm3 .card { background: var(--surface); border:1px solid var(--border); border-radius:16px; padding:1.4rem; margin-bottom: 1rem; }
    .mm3 .ficha-footer-fixa { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; background: var(--surface); border-top: 1px solid var(--border); padding: 0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom)); box-shadow: 0 -4px 16px rgba(0,0,0,0.25); }
    .mm3 .aviso-erro-salvar { background: var(--danger-bg); border: 1px solid var(--danger-border); color: var(--danger); border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; margin-bottom: 8px; }
    .mm3 .ficha-footer-fixa .grid2 { max-width: 700px; margin: 0 auto; gap: 10px; }
    .mm3 .subcard { background: var(--surface2); border:1px solid var(--border); border-radius:12px; padding:1rem; margin-bottom:10px; }
    .mm3 .subcard2 { background: var(--surface3); border:1px solid var(--border); border-radius:10px; padding:0.85rem; margin-bottom:8px; }
    .mm3 .label { display:block; font-size:0.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; }
    .mm3 input[type="text"], .mm3 input[type="number"], .mm3 select {
      width:100%; background:var(--surface3); border:1px solid var(--border); border-radius:10px;
      padding:11px 12px; font-size:0.95rem; color:var(--text); outline:none; font-family:'DM Sans',sans-serif;
    }
    .mm3 .subcard input[type="text"], .mm3 .subcard input[type="number"], .mm3 .subcard select { background: var(--surface); }
    .mm3 .subcard2 input[type="text"], .mm3 .subcard2 input[type="number"], .mm3 .subcard2 select { background: var(--surface2); }
    .mm3 textarea.outros-textarea {
      width:100%; background:var(--surface3); border:1px solid var(--border); border-radius:10px;
      padding:11px 12px; font-size:0.95rem; color:var(--text); outline:none; font-family:'DM Sans',sans-serif; resize:vertical;
    }
    .mm3 .subcard2 textarea.outros-textarea { background:var(--surface2); }
    .mm3 textarea.outros-textarea:focus { border-color: var(--accent); }
    .mm3 input:focus, .mm3 select:focus { border-color: var(--accent); }
    .mm3 input:disabled { opacity:0.6; }

    .mm3 .ssel { position:relative; }
    .mm3 .ssel input[type="text"] { cursor:pointer; }
    .mm3 .ssel-lista {
      position:absolute; z-index:400; top:calc(100% + 4px); left:0; right:0; max-height:220px; overflow-y:auto;
      background:var(--surface3); border:1px solid var(--accent); border-radius:10px; box-shadow:0 10px 28px rgba(0,0,0,0.45);
      padding:4px;
    }
    .mm3 .ssel-opt { padding:9px 10px; border-radius:7px; cursor:pointer; font-size:0.9rem; color:var(--text); }
    .mm3 .ssel-opt.destacado { background:var(--accent-soft); color:var(--accent); }
    .mm3 .ssel-vazio { padding:9px 10px; font-size:0.85rem; color:var(--muted); }
    .mm3 input.in-vida { background: rgba(76,186,122,0.2); border-color: rgba(76,186,122,0.45); color:#e3f8ea; }
    .mm3 input.in-nen { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.28); color:#f5f5f5; }
    .mm3 input.in-vida-temp { background: rgba(56,189,248,0.2); border-color: rgba(56,189,248,0.45); color:#e1f5fe; }
    .mm3 .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .mm3 .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
    .mm3 .grid4 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px; }
    .mm3 .grid5 { display:grid; grid-template-columns:1fr 1fr 1fr 1fr 1fr; gap:10px; }
    @media (max-width: 480px) { .mm3 .grid4, .mm3 .grid5 { grid-template-columns:1fr 1fr; } }

    .mm3 .btn {
      display:inline-flex; align-items:center; justify-content:center; gap:6px;
      padding:12px 16px; border-radius:10px; border:none; cursor:pointer;
      font-family:'Bebas Neue',sans-serif; font-size:1.05rem; letter-spacing:0.06em;
      transition: transform 0.08s, opacity 0.2s;
    }
    .mm3 .btn:active { transform: scale(0.97); }
    .mm3 .btn-accent { background:var(--accent); color:#0e0e12; }
    .mm3 .btn-ghost { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
    .mm3 .btn-danger { background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger-border); }
    .mm3 .btn-block { width:100%; }
    .mm3 .btn-sm { padding:7px 12px; font-size:0.85rem; }
    .mm3 .btn:disabled { opacity:0.35; cursor:not-allowed; }

    .mm3 .identbar { display:flex; align-items:center; justify-content:space-between; width:100%; max-width:1760px; margin-bottom:1.2rem;
      background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:10px 16px; font-size:0.82rem; }
    .mm3 .identbar b { color: var(--accent); }
    .mm3 .identbar .link { color:var(--muted); background:none; border:none; cursor:pointer; text-decoration:underline; font-size:0.78rem; }

    .mm3 .split-wrap { display:flex; gap:14px; width:100%; align-items:flex-start; }
    .mm3 .split-col { min-width:0; max-height: 84vh; overflow-y:auto; padding-right:4px; }
    .mm3 .split-col.col-fichas { flex: 1 1 auto; }
    .mm3 .split-col.col-lateral { flex: 0 0 340px; max-width: 340px; }
    @media (max-width: 980px) { .mm3 .split-col.col-lateral { flex: 0 0 300px; max-width: 300px; } }
    @media (max-width: 820px) { .mm3 .split-wrap { flex-direction:column; } .mm3 .split-col { max-height:none; width:100%; } .mm3 .split-col.col-lateral { max-width:100%; } }

    .mm3 .ent-item { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:12px 14px; margin-bottom:10px; }
    .mm3 .ent-item .head { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:10px; }
    .mm3 .ent-item .head-left { display:flex; align-items:center; gap:10px; min-width:0; }
    .mm3 .ent-item .nome { font-family:'Bebas Neue',sans-serif; font-size:1.15rem; letter-spacing:0.03em; }
    .mm3 .ent-item .rotulo { font-size:0.65rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; }
    .mm3 .ent-item .vitals { display:flex; gap:14px; font-size:0.74rem; color:var(--muted); margin-bottom:10px; flex-wrap:wrap; align-items:center; }
    .mm3 .ent-item .vitals b { color:var(--text); }
    .mm3 .ent-item .vitals input[type="number"] { width:56px; padding:4px 6px; font-size:0.78rem; display:inline-block; }
    .mm3 .ent-item .actions { display:flex; gap:6px; flex-shrink:0; }
    /* fontes maiores na ficha (modo leitura) */
    .mm3 .ent-item .nome { font-size:1.4rem; }
    .mm3 .ent-item .ent-collapsed .nome { font-size:1.25rem; }
    .mm3 .ent-item .ent-collapsed .meta { font-size:0.88rem; }
    .mm3 .ent-item .rotulo { font-size:0.82rem; }
    .mm3 .ent-item .vitals { font-size:0.95rem; }
    .mm3 .ent-item .vitals input[type="number"] { width:66px; font-size:0.95rem; }
    .mm3 .ent-item .stat-group-label { font-size:0.88rem; }
    .mm3 .ent-item .acoes-header .arrow { font-size:0.9rem; }
    .mm3 .ent-item .stat-chip { font-size:0.92rem; padding:6px 12px; }
    .mm3 .ent-item .stat-chip b { font-size:1.08rem; }
    .mm3 .ent-item .acao-tipo { font-size:0.72rem; }
    .mm3 .ent-item .badge-status { font-size:0.78rem; }
    .mm3 .ent-item .readonly-grid { font-size:0.98rem; }
    .mm3 .ent-item .field-note { font-size:0.84rem; }
    .mm3 .ent-item .plano-card .pd { font-size:0.88rem; }
    .mm3 .ent-item .plano-card .pt { font-size:1.2rem; }
    .mm3 .ent-item .status-toggle { font-size:0.78rem; }
    .mm3 .ent-item .checkbox-row { font-size:0.95rem; }
    .mm3 .stat-group { margin-bottom:8px; }
    .mm3 .stat-group-label { font-size:0.62rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px; }
    .mm3 .chip-row { display:flex; flex-wrap:wrap; gap:6px; }
    .mm3 .stat-chip {
      background:var(--surface3); border:1px solid var(--border); color:var(--text); border-radius:8px;
      padding:5px 10px; font-size:0.74rem; cursor:pointer; display:inline-flex; gap:5px; align-items:center; font-family:'DM Sans',sans-serif;
    }
    .mm3 .stat-chip:hover { border-color:var(--accent); }
    .mm3 .stat-chip b { color:var(--accent); font-family:'Bebas Neue',sans-serif; font-size:0.9rem; letter-spacing:0.02em; }
    .mm3 .ataque-chip { background:var(--accent-soft); border-color:rgba(232,200,74,0.3); }
    .mm3 .ataque-chip b { color:var(--accent); }
    .mm3 .item-quebrado { opacity:0.65; border-style:dashed; }
    .mm3 .vantagem-chip.ativo { border-color:var(--accent); background:var(--accent-soft); color:var(--accent); }
    .mm3 .passiva-chip { gap:7px; }
    .mm3 .passiva-chip-dot { width:7px; height:7px; border-radius:50%; background:var(--muted); flex-shrink:0; transition:background .15s ease, box-shadow .15s ease; }
    .mm3 .passiva-chip.ativo { border-color:var(--accent); background:var(--accent-soft); color:var(--accent); }
    .mm3 .passiva-chip.ativo .passiva-chip-dot { background:var(--accent); box-shadow:0 0 6px var(--accent); }
    .mm3 .passiva-chip:disabled { cursor:default; opacity:0.85; }

    .mm3 .sync-erro-banner {
      position:fixed; top:14px; left:50%; transform:translateX(-50%); z-index:950;
      background:#241417; border:1px solid var(--danger-border); color:#ffb3b3; border-radius:12px;
      padding:10px 14px; font-size:0.8rem; display:flex; align-items:center; gap:10px;
      box-shadow:0 10px 28px rgba(0,0,0,0.45); max-width:min(92vw, 460px);
      opacity:0; transform:translateX(-50%) translateY(-10px); animation:sync-erro-in 0.25s ease forwards;
    }
    @keyframes sync-erro-in { to { opacity:1; transform:translateX(-50%) translateY(0); } }
    .mm3 .sync-erro-banner span { flex:1; line-height:1.4; }
    .mm3 .sync-erro-banner button { background:none; border:none; color:inherit; cursor:pointer; font-size:1.05rem; line-height:1; opacity:0.7; flex-shrink:0; padding:2px; }
    .mm3 .sync-erro-banner button:hover { opacity:1; }
    .mm3 .ent-collapsed { display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer; }
    .mm3 .ent-collapsed .nome-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0; }
    .mm3 .ent-collapsed .nome { font-family:'Bebas Neue',sans-serif; font-size:1.05rem; letter-spacing:0.03em; }
    .mm3 .ent-collapsed .meta { font-size:0.72rem; color:var(--muted); }
    .mm3 .nome-clicavel { cursor:pointer; }
    .mm3 .vantagem-row { display:grid; grid-template-columns:1fr 70px auto; gap:8px; align-items:center; margin-bottom:6px; }
    .mm3 .vantagem-row select, .mm3 .vantagem-row .ssel input[type="text"] { font-size:0.85rem; }
    .mm3 .foto-thumb { border-radius:8px; object-fit:cover; flex-shrink:0; }
    .mm3 .foto-upload-row { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
    .mm3 .foto-preview { width:72px; height:72px; border-radius:12px; object-fit:cover; background:var(--surface3); border:1px solid var(--border); flex-shrink:0; }

    .mm3 .hist-item { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:9px 12px; margin-bottom:6px;
      display:grid; grid-template-columns:auto 1fr auto; gap:10px; align-items:center; }
    .mm3 .hist-item.hc { border-color: var(--crit-border); }
    .mm3 .hist-hora { font-size:0.68rem; color:var(--muted); min-width:40px; }
    .mm3 .hist-desc { font-size:0.82rem; }
    .mm3 .hist-detalhe { font-size:0.68rem; color:var(--muted); }
    .mm3 .hist-total { font-family:'Bebas Neue',sans-serif; font-size:1.1rem; text-align:right; }
    .mm3 .hs .hist-total { color:var(--success); } .mm3 .hw .hist-total { color:var(--warn); }
    .mm3 .hd .hist-total { color:var(--danger); } .mm3 .hc .hist-total { color:var(--crit); }

    .mm3 .empty { text-align:center; font-size:0.8rem; color:var(--muted); padding:1.4rem 0; opacity:0.6; }
    .mm3 .divider { height:1px; background:var(--border); margin:0.9rem 0; }
    .mm3 .section-title { font-size:0.72rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); margin-bottom:8px; }
    .mm3 .role-choice { display:flex; gap:10px; margin-bottom:14px; }
    .mm3 .role-card { flex:1; padding:16px; border-radius:12px; border:1px solid var(--border); background:var(--surface2);
      text-align:center; cursor:pointer; }
    .mm3 .role-card.sel { border-color:var(--accent); background:var(--accent-soft); }
    .mm3 .role-card .rt { font-family:'Bebas Neue',sans-serif; font-size:1.3rem; color:var(--text); }
    .mm3 .role-card.sel .rt { color:var(--accent); }
    .mm3 .pill { display:inline-block; font-size:0.65rem; padding:2px 8px; border-radius:20px; background:var(--surface3); color:var(--muted); margin-left:6px; }
    .mm3 .row-inline { display:flex; gap:8px; align-items:center; margin-bottom:6px; }
    .mm3 .small-btn { background:var(--surface3); border:1px solid var(--border); color:var(--muted); border-radius:8px; width:30px; height:30px;
      cursor:pointer; font-size:1rem; line-height:1; flex-shrink:0; }
    .mm3 .small-btn:disabled { opacity:0.3; cursor:default; }
    .mm3 .reorder-btns { display:flex; flex-direction:column; gap:2px; flex-shrink:0; }
    .mm3 .reorder-btns .small-btn { width:24px; height:16px; font-size:0.6rem; }
    .mm3 .item-pv-box { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:10px 12px; }
    .mm3 .item-pv-head { display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--muted); margin-bottom:6px; }
    .mm3 .item-pv-track { height:8px; border-radius:6px; background:var(--surface3); overflow:hidden; margin-bottom:8px; }
    .mm3 .item-pv-fill { height:100%; border-radius:6px; transition:width 0.25s ease; }
    .mm3 .item-pv-restaurar { width:100%; }
    .mm3 .item-pv-restaurar:disabled { opacity:0.45; cursor:default; }
    .mm3 .checkbox-row { display:flex; align-items:center; gap:8px; font-size:0.82rem; color:var(--text); margin:8px 0; user-select:none; cursor:pointer; }
    .mm3 .checkbox-row input[type="checkbox"] {
      appearance:none; -webkit-appearance:none; width:18px; height:18px; border:1px solid rgba(255,255,255,0.25);
      border-radius:5px; background:var(--surface3); cursor:pointer; position:relative; flex-shrink:0;
    }
    .mm3 .checkbox-row input[type="checkbox"]:checked { background:var(--accent); border-color:var(--accent); }
    .mm3 .checkbox-row input[type="checkbox"]:checked::after {
      content:''; position:absolute; left:5px; top:2px; width:4px; height:8px; border:2px solid #0e0e12; border-top:none; border-left:none; transform:rotate(45deg);
    }
    .mm3 .pericias-grid { display:flex; flex-direction:column; gap:6px; font-size:0.82rem; }
    .mm3 .pericias-grid .pe-row { display:grid; grid-template-columns:1fr 70px 60px; gap:8px; align-items:center; padding:6px 0; border-bottom:1px solid var(--border); }
    .mm3 .pericias-grid .pe-row input { padding:6px 8px; font-size:0.82rem; }
    .mm3 .pericias-grid .pe-row .total { text-align:right; color:var(--accent); font-family:'Bebas Neue',sans-serif; font-size:1rem; }
    .mm3 .readonly-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 14px; font-size:0.82rem; margin-bottom:10px; }
    .mm3 .readonly-grid .ro-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); }
    .mm3 .readonly-grid .ro-row b { color:var(--accent); }
    .mm3 .field-note { font-size:0.68rem; color:var(--muted); margin: -4px 0 8px; white-space: pre-line; }
    .mm3 .pp-box { display:flex; justify-content:space-between; align-items:center; background:var(--surface3); border-radius:10px; padding:12px 14px; margin-bottom:10px; }
    .mm3 .pp-box .pp-val { font-family:'Bebas Neue',sans-serif; font-size:1.3rem; }
    .mm3 .pp-box.excedido { border:1px solid var(--danger-border); background:var(--danger-bg); color:var(--danger); }
    .mm3 .erro-box { background:var(--danger-bg); border:1px solid var(--danger-border); color:var(--danger); border-radius:10px; padding:10px 14px; margin-bottom:10px; font-size:0.82rem; }

    .mm3 .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.65); display:flex; align-items:center; justify-content:center;
      z-index:100; padding:16px; }
    .mm3 .modal-box { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:1.3rem; max-width:420px; width:100%;
      max-height:86vh; overflow-y:auto; }
    .mm3 .modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
    .mm3 .modal-head .mt { font-family:'Bebas Neue',sans-serif; font-size:1.3rem; color:var(--accent); letter-spacing:0.03em; }
    .mm3 .modal-close { background:none; border:none; color:var(--muted); font-size:1.3rem; cursor:pointer; line-height:1; }
    .mm3 .modal-desc { font-size:0.85rem; line-height:1.5; color:var(--text); margin-bottom:12px; white-space: pre-line; }

    .mm3 .result-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px; }
    .mm3 .result-cell { background:var(--surface2); border-radius:10px; padding:10px 12px; text-align:center; }
    .mm3 .result-cell .cl { font-size:0.66rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:4px; }
    .mm3 .result-cell .cv { font-family:'Bebas Neue',sans-serif; font-size:1.7rem; color:var(--text); line-height:1; }
    .mm3 .result-cell.crit { background:var(--crit-bg); border:1px solid var(--crit-border); }
    .mm3 .result-cell.crit .cv, .mm3 .result-cell.crit .cl { color:var(--crit); }
    .mm3 .meta-row { display:flex; justify-content:space-between; font-size:0.78rem; color:var(--muted); padding:4px 2px 10px; }
    .mm3 .meta-row span.v { color:var(--text); font-weight:500; }
    .mm3 .grau-card { border-radius:12px; padding:1rem; text-align:center; border:1px solid var(--border); margin-bottom:8px; }
    .mm3 .grau-card .gl { font-size:0.7rem; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px; opacity:0.8; }
    .mm3 .grau-card .gn { font-family:'Bebas Neue',sans-serif; font-size:1.9rem; letter-spacing:0.05em; line-height:1; margin-bottom:4px; }
    .mm3 .grau-card .gd { font-size:0.76rem; opacity:0.7; }
    .mm3 .grau-card.success { background:var(--success-bg); border-color:var(--success-border); color:var(--success); }
    .mm3 .grau-card.warn { background:var(--warn-bg); border-color:var(--warn-border); color:var(--warn); }
    .mm3 .grau-card.danger { background:var(--danger-bg); border-color:var(--danger-border); color:var(--danger); }
    .mm3 .crit-badge { background:var(--crit-bg); border:1px solid var(--crit-border); color:var(--crit); border-radius:8px;
      padding:6px 12px; font-size:0.74rem; text-align:center; margin-bottom:8px; letter-spacing:0.05em; }
    .mm3 .efeito-card { border-radius:12px; padding:0.9rem 1.1rem; margin-bottom:6px; }
    .mm3 .efeito-card.ok { background:var(--success-bg); border:1px solid var(--success-border); color:var(--success); }
    .mm3 .efeito-card.dano { background:var(--danger-bg); border:1px solid var(--danger-border); color:var(--danger); }
    .mm3 .efeito-t { font-size:0.66rem; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:3px; opacity:0.75; }
    .mm3 .efeito-n { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; line-height:1; margin-bottom:4px; }
    .mm3 .efeito-f { font-size:0.78rem; opacity:0.85; }

    .mm3 .acoes-header { display:flex; align-items:center; justify-content:space-between; cursor:pointer; user-select:none; padding:2px 0; }
    .mm3 .acoes-header .stat-group-label { margin-bottom:0; }
    .mm3 .acoes-header .arrow { color:var(--muted); font-size:0.7rem; transition: transform 0.15s; }
    .mm3 .acoes-header .arrow.open { transform: rotate(90deg); }
    .mm3 .acao-chip { background:var(--surface3); }
    .mm3 .ent-item.arrastavel .ent-collapsed { cursor:grab; }

    /* ---- tela de edição da ficha ---- */
    .mm3 .ficha-edit { padding:1rem; }
    .mm3 .ed-hero { margin:0 0 16px; }
    .mm3 .ed-retrato { position:relative; }
    .mm3 .ed-retrato img { width:100%; height:100%; object-fit:cover; display:block; }
    .mm3 .ed-retrato-dica { position:absolute; left:0; right:0; bottom:0; font-style:normal; font-size:0.68rem; text-align:center; padding:4px 0; background:rgba(14,14,18,0.72); color:var(--accent); opacity:0; transition:opacity .15s; }
    .mm3 .ed-retrato:hover .ed-retrato-dica, .mm3 .ed-retrato:focus-within .ed-retrato-dica { opacity:1; }
    @media (hover:none) { .mm3 .ed-retrato-dica { opacity:1; } }
    .mm3 .ed-hero-info { flex:1; min-width:180px; }
    .mm3 .ed-hero input.ed-nome { font-family:'Bebas Neue',sans-serif; font-size:1.9rem; letter-spacing:0.03em; padding:6px 12px; background:rgba(14,14,18,0.55); }
    .mm3 .ed-hero input, .mm3 .ed-hero .ssel input[type="text"] { background:rgba(14,14,18,0.55); }
    .mm3 .ed-sec { background:var(--surface2); border:1px solid var(--border); border-radius:14px; padding:14px 14px 8px; margin-bottom:12px; }
    .mm3 .ed-sec > .section-title { display:flex; align-items:center; gap:8px; font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:0.05em; color:var(--text); text-transform:none; margin-bottom:12px; }
    .mm3 .ed-sec > .section-title::before { content:""; width:4px; height:1.05em; border-radius:2px; background:var(--accent); }
    .mm3 .ed-sec > .section-title.colapsavel { cursor:pointer; user-select:none; }
    .mm3 .ed-sec input[type="text"], .mm3 .ed-sec input[type="number"], .mm3 .ed-sec select, .mm3 .ed-sec textarea { background:var(--surface); }
    .mm3 .ed-sec .subcard { background:var(--surface); }
    .mm3 .ed-sec .subcard2 { background:var(--surface3); }
    .mm3 .ed-sec .subcard input, .mm3 .ed-sec .subcard select { background:var(--surface2); }
    .mm3 .ed-barras { display:flex; flex-direction:column; gap:10px; margin-bottom:12px; }
    .mm3 .ed-attr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(96px,1fr)); gap:8px; }
    .mm3 .ed-attr { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:8px 8px 10px; text-align:center; }
    .mm3 .ed-attr .label { text-align:center; margin-bottom:4px; }
    .mm3 .ed-attr input[type="number"] { text-align:center; font-family:'Bebas Neue',sans-serif; font-size:1.7rem; color:var(--accent); padding:2px 4px; background:transparent; border-color:transparent; }
    .mm3 .ed-attr:focus-within { border-color:var(--accent); }
    .mm3 .ed-sec .ed-defesas { grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:8px; }
    .mm3 .ed-defesas .ro-row { flex-direction:column; align-items:center; gap:2px; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:8px 4px; }
    .mm3 .ed-defesas .ro-row span { font-size:0.68rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); }
    .mm3 .ed-defesas .ro-row b { font-family:'Bebas Neue',sans-serif; font-size:1.7rem; line-height:1; }
    .mm3 .ed-sec .pericias-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:6px 12px; }
    .mm3 .ed-sec .pericias-grid .pe-row { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:6px 10px; }
    .mm3 .ed-vant { background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--accent); border-radius:10px; padding:10px; margin-bottom:8px; }
    .mm3 .ed-vant .vantagem-row { margin-bottom:4px; }
    .mm3 .ed-vant input, .mm3 .ed-vant select { background:var(--surface2) !important; }
    .mm3 .ed-sec .pp-box { flex-wrap:wrap; gap:8px; background:var(--surface); border:1px solid var(--border); }
    .mm3 .ed-pp-trilho { flex-basis:100%; height:8px; border-radius:6px; background:var(--surface3); overflow:hidden; }
    .mm3 .ed-pp-fill { height:100%; border-radius:6px; background:linear-gradient(90deg,#a8902a,var(--accent)); transition:width .3s; }
    .mm3 .pp-box.excedido .ed-pp-fill { background:var(--danger); }
    .mm3 .ed-vazio { text-align:center; color:var(--muted); font-size:0.85rem; border:1px dashed var(--border); border-radius:12px; padding:16px; margin-bottom:10px; }
    .mm3 .ed-hab { position:relative; padding-left:1.2rem; border-radius:12px; overflow:hidden; }
    .mm3 .ed-hab::before { content:""; position:absolute; left:0; top:0; bottom:0; width:5px; background:linear-gradient(180deg,var(--accent),transparent); }
    .mm3 .ed-hab.passiva::before { background:linear-gradient(180deg,#5cc3f5,transparent); }
    .mm3 .ed-hab-topo input[type="text"] { font-family:'Bebas Neue',sans-serif; font-size:1.25rem; letter-spacing:0.03em; }
    .mm3 .ed-hab-tags { display:flex; flex-wrap:wrap; gap:6px; margin:2px 0 4px; }
    .mm3 .ed-hab-img { background:var(--surface2); border:1px dashed var(--border); border-radius:12px; padding:10px; }
    .mm3 .ed-hab-img .foto-preview { width:84px; height:84px; }
    .mm3 .ed-sub { font-family:'Bebas Neue',sans-serif; font-size:1.05rem !important; letter-spacing:0.05em; color:var(--text) !important; text-transform:none !important; margin-top:6px; }
    .mm3 .ed-colapso-head { background:var(--surface3); border:1px solid var(--border); border-radius:10px; padding:8px 12px; margin-bottom:8px; }
    .mm3 .ed-colapso-head .section-title { color:var(--text); }
    .mm3 .ed-colapso-head:hover { border-color:var(--accent); }
    .mm3 .ed-efeito { border-left:3px solid var(--danger-border); background:var(--surface3); }
    @media (max-width:560px) { .mm3 .ficha-edit { padding:0.7rem; } .mm3 .ed-sec { padding:12px 10px 6px; } .mm3 .ed-hero input.ed-nome { font-size:1.6rem; } .mm3 .ed-sec .pericias-grid { grid-template-columns:1fr; } }

    /* ---- ajuste de imagem ---- */
    .mm3 .aj-img { width:100%; }
    .mm3 .aj-caixa { position:relative; width:100%; overflow:hidden; border-radius:14px; border:2px solid var(--accent); background:var(--surface3); cursor:grab; touch-action:none; user-select:none; }
    .mm3 .aj-caixa:active { cursor:grabbing; }
    .mm3 .aj-caixa img { width:100%; height:100%; object-fit:cover; display:block; pointer-events:none; }
    .mm3 .aj-grade { position:absolute; inset:0; pointer-events:none; background:linear-gradient(to right,transparent 33%,rgba(255,255,255,0.18) 33%,rgba(255,255,255,0.18) calc(33% + 1px),transparent calc(33% + 1px),transparent 66%,rgba(255,255,255,0.18) 66%,rgba(255,255,255,0.18) calc(66% + 1px),transparent calc(66% + 1px)), linear-gradient(to bottom,transparent 33%,rgba(255,255,255,0.18) 33%,rgba(255,255,255,0.18) calc(33% + 1px),transparent calc(33% + 1px),transparent 66%,rgba(255,255,255,0.18) 66%,rgba(255,255,255,0.18) calc(66% + 1px),transparent calc(66% + 1px)); }
    .mm3 .aj-controles { display:flex; align-items:center; gap:8px; margin:10px 0 4px; max-width:380px; }
    .mm3 .aj-controles input[type="range"] { flex:1; accent-color:var(--accent); }
    .mm3 .ed-foto-botoes { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
    .mm3 .ed-hab-prev { overflow:hidden; padding:0; }
    .mm3 .ed-hab-prev img { width:100%; height:100%; object-fit:cover; display:block; }
    .mm3 .hero-retrato img { width:100%; height:100%; object-fit:cover; display:block; }
    .mm3 .hab-card .hab-img-wrap { height:104px; overflow:hidden; }
    .mm3 .hab-card .hab-img-wrap .hab-img { height:100%; }
    .mm3 .hab-img-modal-wrap { width:100%; aspect-ratio:5 / 2; max-height:190px; overflow:hidden; border-radius:12px; margin-bottom:12px; }
    .mm3 .hab-img-modal-wrap .hab-img-modal { width:100%; height:100%; max-height:none; margin:0; border-radius:0; }
    .mm3 .foto-thumb-wrap { display:inline-block; overflow:hidden; border-radius:8px; flex-shrink:0; vertical-align:middle; }
    /* ---- dashboard ---- */
    .mm3 .dash { display:flex; flex-direction:column; gap:14px; padding-bottom:8px; }
    .mm3 .dash-tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:8px; }
    .mm3 .dash-tile { background:var(--surface); border:1px solid var(--border); border-top:3px solid var(--tile,var(--accent)); border-radius:12px; padding:10px 12px; display:flex; flex-direction:column; gap:2px; }
    .mm3 .dash-tile-rot { font-size:0.66rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); }
    .mm3 .dash-tile-val { font-family:'Bebas Neue',sans-serif; font-size:2rem; line-height:1; color:var(--tile,var(--accent)); }
    .mm3 .dash-tile-sub { font-size:0.72rem; color:var(--muted); }
    .mm3 .dash-destaque { background:var(--accent-soft); border:1px solid rgba(232,200,74,0.3); border-radius:12px; padding:10px 14px; font-size:0.9rem; }
    .mm3 .dash-destaque b { color:var(--accent); }
    .mm3 .dash-bloco { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:12px 14px; }
    .mm3 .dash-titulo { font-family:'Bebas Neue',sans-serif; font-size:1.1rem; letter-spacing:0.05em; margin-bottom:10px; }
    .mm3 .dash-chips { display:flex; flex-wrap:wrap; gap:8px; }
    .mm3 .dash-chip { display:inline-flex; align-items:center; gap:8px; background:var(--surface3); border:1px solid var(--border); color:var(--text); border-radius:999px; padding:6px 12px; font-size:0.85rem; cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity .15s, border-color .15s; }
    .mm3 .dash-chip small { color:var(--muted); font-size:0.72rem; }
    .mm3 .dash-chip:hover { border-color:var(--accent); }
    .mm3 .dash-chip.off { opacity:0.42; text-decoration:line-through; }
    .mm3 .dash-chip.off small { text-decoration:none; }
    .mm3 .dash-dot { display:inline-block; width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-right:6px; vertical-align:middle; }
    .mm3 .dash-chip .dash-dot { margin-right:0; }
    .mm3 .dash-acoes { display:flex; gap:6px; margin-top:10px; }
    .mm3 .dash-svg { width:100%; height:auto; display:block; }
    .mm3 .dash-grade { stroke:var(--border); stroke-width:1; }
    .mm3 .dash-eixo { fill:var(--muted); font-size:10.5px; font-family:'DM Sans',sans-serif; }
    .mm3 .dash-legenda { display:flex; flex-wrap:wrap; gap:6px 14px; font-size:0.78rem; color:var(--muted); margin-top:6px; }
    .mm3 .dash-legenda.vertical { flex-direction:column; gap:6px; margin:0; font-size:0.85rem; color:var(--text); }
    .mm3 .dash-legenda i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; vertical-align:middle; }
    .mm3 .dash-barra-pilha { display:flex; height:16px; border-radius:8px; overflow:hidden; background:var(--surface3); gap:2px; }
    .mm3 .dash-barra-pilha span { height:100%; min-width:2px; }
    .mm3 .dash-barra-pilha.grau { height:12px; }
    .mm3 .dash-tabela-wrap { overflow-x:auto; }
    .mm3 .dash-tabela { width:100%; border-collapse:collapse; font-size:0.84rem; }
    .mm3 .dash-tabela th { text-align:left; font-size:0.66rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); font-weight:500; padding:6px 8px; border-bottom:1px solid var(--border); white-space:nowrap; }
    .mm3 .dash-tabela td { padding:8px; border-bottom:1px solid var(--border); vertical-align:middle; }
    .mm3 .dash-tabela tr.off td { opacity:0.45; }
    .mm3 .dash-linha-clicavel { cursor:pointer; transition:background .15s; }
    .mm3 .dash-linha-clicavel:hover td { background:rgba(255,255,255,0.04); }
    .mm3 .dash-linha-clicavel.solo td { background:var(--accent-soft); }
    .mm3 .dash-linha-clicavel.solo td:first-child { box-shadow:inset 3px 0 0 var(--accent); }
    .mm3 .dash-mini { font-size:0.7rem; color:var(--muted); }
    .mm3 .dash-celula-acao { white-space:nowrap; text-align:right; }
    .mm3 .dash-usos { display:inline-flex; align-items:center; gap:3px; color:var(--muted); margin-right:6px; }
    .mm3 .dash-usos input { width:44px; padding:4px 6px; font-size:0.82rem; }
    .mm3 .dash-bloco .field-note { margin-top:10px; }
    .mm3 .dash-lista { display:flex; flex-direction:column; gap:6px; }
    .mm3 .dash-linha { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:8px 12px; font-size:0.86rem; line-height:1.45; }
    .mm3 .dash-linha.dano { border-left:3px solid var(--danger); }
    .mm3 .dash-linha.cura { border-left:3px solid var(--success); }
    .mm3 .dash-aq { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
    .mm3 .dash-aq span { background:var(--surface3); border:1px solid var(--border); border-radius:8px; min-width:30px; text-align:center; padding:3px 8px; font-family:'Bebas Neue',sans-serif; font-size:1.05rem; }
    .mm3 .dash-aq span.pronto { background:var(--accent); color:#0e0e12; border-color:var(--accent); }
    .mm3 .dash-pp { display:flex; flex-wrap:wrap; align-items:center; gap:18px; margin-bottom:12px; }
    .mm3 .dash-rosca { width:150px; height:150px; flex-shrink:0; }
    .mm3 .dash-rosca-num { fill:var(--text); font-family:'Bebas Neue',sans-serif; font-size:22px; }
    .mm3 .dash-hbars { display:flex; flex-direction:column; gap:7px; }
    .mm3 .dash-hbar { display:grid; grid-template-columns:minmax(80px,170px) 1fr 54px; gap:10px; align-items:center; font-size:0.84rem; }
    .mm3 .dash-hbar-nome { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .mm3 .dash-hbar-trilho { height:10px; border-radius:6px; background:var(--surface3); overflow:hidden; display:block; }
    .mm3 .dash-hbar-trilho span { display:block; height:100%; border-radius:6px; }
    .mm3 .dash-hbar b { text-align:right; }
    .mm3 .dash-efeito-topo { font-size:0.85rem; margin-bottom:5px; }
    .mm3 .dash-efeito-topo small { color:var(--muted); }
    .mm3 .dash-duplo { display:grid; grid-template-columns:minmax(220px,300px) 1fr; gap:14px; align-items:center; }
    .mm3 .dash-radar { width:100%; max-width:300px; height:auto; margin:0 auto; }
    @media (max-width:640px) { .mm3 .dash-duplo { grid-template-columns:1fr; } .mm3 .dash-hbar { grid-template-columns:90px 1fr 46px; } }
    .mm3 .ed-dash > .section-title { color:var(--accent); }
    /* ---- ficha em modo leitura: cabeçalho com retrato ---- */
    .mm3 .ficha-hero { position:relative; overflow:hidden; border-radius:16px; border:1px solid var(--border); margin:-6px -6px 14px; background:var(--surface); }
    .mm3 .ficha-hero .hero-bg { position:absolute; inset:-24px; background-size:cover; background-position:center; filter:blur(24px) saturate(1.2); opacity:0.42; transform:scale(1.15); z-index:0; }
    .mm3 .ficha-hero::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(14,14,18,0.10) 0%, rgba(14,14,18,0.88) 100%); z-index:0; pointer-events:none; }
    .mm3 .ficha-hero .hero-conteudo { position:relative; z-index:1; padding:16px; }
    .mm3 .hero-linha { display:flex; flex-wrap:wrap; gap:14px; align-items:flex-start; margin-bottom:14px; }
    @media (max-width:560px) { .mm3 .hero-retrato { width:84px; height:84px; border-radius:16px; } .mm3 .ent-item .ficha-hero .nome { font-size:1.7rem; } .mm3 .hero-acoes { width:100%; } .mm3 .ficha-hero .hero-conteudo { padding:12px; } }
    .mm3 .hero-retrato { flex-shrink:0; width:108px; height:108px; border-radius:20px; overflow:hidden; border:2px solid var(--accent); box-shadow:0 0 0 4px var(--accent-soft), 0 10px 26px rgba(0,0,0,0.5); background:var(--surface3); display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .mm3 .hero-retrato img { width:100%; height:100%; object-fit:cover; display:block; }
    .mm3 .hero-retrato span { font-family:'Bebas Neue',sans-serif; font-size:3.2rem; color:var(--accent); }
    .mm3 .hero-info { flex:1; min-width:140px; }
    .mm3 .ent-item .ficha-hero .nome { font-size:2.1rem; line-height:1; display:block; text-shadow:0 2px 10px rgba(0,0,0,0.6); }
    .mm3 .ficha-hero .rotulo { margin-top:4px; }
    .mm3 .hero-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
    .mm3 .hero-acoes { display:flex; gap:6px; flex-shrink:0; }
    .mm3 .tag-cond { border-radius:999px; padding:3px 11px; font-size:0.8rem; border:1px solid; cursor:default; font-family:'DM Sans',sans-serif; }
    .mm3 .tag-cond.pode { cursor:pointer; }
    .mm3 .tag-cond.dano { color:#ff8f8f; background:rgba(232,90,90,0.16); border-color:rgba(232,90,90,0.45); }
    .mm3 .tag-cond.controle { color:#caa6ff; background:rgba(176,123,224,0.16); border-color:rgba(176,123,224,0.45); }
    .mm3 .tag-cond.fraqueza { color:#ffbb70; background:rgba(255,160,70,0.15); border-color:rgba(255,160,70,0.42); }
    .mm3 .tag-cond.neutro { color:#92d8ea; background:rgba(90,169,230,0.15); border-color:rgba(90,169,230,0.42); }
    .mm3 .tag-cond.status { color:var(--accent); background:var(--accent-soft); border-color:rgba(232,200,74,0.4); }
    .mm3 .barra-vital { margin-bottom:10px; }
    .mm3 .barra-vital .bv-topo { display:flex; justify-content:space-between; align-items:baseline; gap:8px; margin-bottom:5px; font-size:0.95rem; }
    .mm3 .barra-vital .bv-nome { text-transform:uppercase; letter-spacing:0.1em; font-size:0.74rem; color:var(--muted); }
    .mm3 .barra-vital .bv-num b { color:var(--text); font-size:1.05rem; }
    .mm3 .barra-vital .bv-num { color:var(--muted); }
    .mm3 .barra-vital .bv-num input[type="number"] { width:64px; padding:3px 6px; font-size:0.95rem; display:inline-block; }
    .mm3 .bv-trilho { position:relative; height:16px; border-radius:999px; background:rgba(255,255,255,0.07); overflow:hidden; border:1px solid var(--border); }
    .mm3 .bv-trilho .bv-seg { position:absolute; top:0; bottom:0; border-radius:999px; transition:width .6s cubic-bezier(.2,.8,.2,1), left .6s cubic-bezier(.2,.8,.2,1); }
    .mm3 .bv-vida .bv-seg.principal { left:0; background:linear-gradient(90deg,#2f8f55,#4cba7a); box-shadow:0 0 12px rgba(76,186,122,0.5); }
    .mm3 .bv-vida.baixa .bv-seg.principal { animation:bv-pulso 1.3s ease-in-out infinite; }
    .mm3 .bv-vida .bv-seg.temp { background:linear-gradient(90deg,#3f8fae,#86c8e8); }
    .mm3 .bv-nen .bv-seg.principal { left:0; background:linear-gradient(90deg,#2b72b8,#5cc3f5); box-shadow:0 0 12px rgba(92,195,245,0.45); }
    @keyframes bv-pulso { 0%,100% { filter:brightness(1); } 50% { filter:brightness(1.5); } }
    .mm3 .info-chips { display:flex; flex-wrap:wrap; gap:6px; margin:4px 0 12px; }
    .mm3 .info-chip { font-size:0.82rem; color:var(--muted); background:rgba(255,255,255,0.06); border:1px solid var(--border); border-radius:999px; padding:3px 11px; display:inline-flex; align-items:center; gap:6px; }
    .mm3 .info-chip b { color:var(--text); }
    .mm3 .info-chip input[type="number"] { width:56px; padding:2px 5px; font-size:0.85rem; display:inline-block; }
    .mm3 .cartoes-stat { margin-bottom:14px; display:grid; grid-template-columns:repeat(auto-fill,minmax(92px,1fr)); gap:8px; }
    .mm3 .cartao-stat { background:var(--surface3); border:1px solid var(--border); border-radius:12px; padding:10px 6px 9px; text-align:center; cursor:pointer; color:var(--text); font-family:'DM Sans',sans-serif; transition:border-color .15s ease, transform .15s ease, box-shadow .15s ease; }
    .mm3 .cartao-stat:hover { border-color:var(--accent); transform:translateY(-2px); box-shadow:0 8px 18px rgba(0,0,0,0.35); }
    .mm3 .cartao-stat .cs-valor { display:block; font-family:'Bebas Neue',sans-serif; font-size:2.1rem; line-height:1; color:var(--accent); }
    .mm3 .cartao-stat .cs-rot { display:block; margin-top:5px; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); }
    .mm3 .cartao-stat.def { border-top:3px solid #5aa9e6; }
    .mm3 .cartao-stat.def .cs-valor { color:#8cc8f5; }
    .mm3 .cartao-stat.neg .cs-valor { color:var(--danger); }
    .mm3 .hab-grid { margin-bottom:14px; display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }
    .mm3 .hab-card { position:relative; display:flex; flex-direction:column; text-align:left; padding:0; overflow:hidden; background:var(--surface3); border:1px solid var(--border); border-radius:12px; cursor:pointer; color:var(--text); font-family:'DM Sans',sans-serif; transition:border-color .15s ease, transform .15s ease, box-shadow .15s ease; }
    .mm3 .hab-card:hover { border-color:var(--accent); transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.38); }
    .mm3 .hab-card:disabled { cursor:default; transform:none; }
    .mm3 .hab-card .hab-img { width:100%; height:104px; object-fit:cover; object-position:center 25%; display:block; }
    .mm3 .hab-card .hab-faixa { height:4px; background:linear-gradient(90deg,var(--accent),transparent); }
    .mm3 .hab-card.passiva .hab-faixa { background:linear-gradient(90deg,#5aa9e6,transparent); }
    .mm3 .hab-card .hab-corpo { padding:10px 12px 12px; }
    .mm3 .acao-card .acao-linha { font-size:0.78rem; color:var(--text); opacity:0.88; margin-top:7px; line-height:1.35; }
    .mm3 .acao-card .acao-linha b { display:block; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.09em; color:var(--muted); font-weight:600; margin-bottom:1px; }
    .mm3 .acao-card:hover { border-color:var(--hab-cor); }
    .mm3 .hab-card .hab-nome { font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:0.03em; line-height:1.1; }
    .mm3 .hab-card .hab-tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:7px; }
    .mm3 .hab-tag { font-size:0.68rem; padding:2px 8px; border-radius:999px; background:rgba(255,255,255,0.07); color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; display:inline-flex; align-items:center; gap:5px; }
    .mm3 .hab-tag .hab-dot { width:7px; height:7px; border-radius:50%; background:var(--hab-cor); }
    .mm3 .hab-tag.nen { color:#7fd0f7; background:rgba(92,195,245,0.13); }
    .mm3 .hab-tag.vida { color:#ff9a9a; background:rgba(232,90,90,0.13); }
    .mm3 .hab-tag.ligada { color:#0e0e12; background:var(--accent); font-weight:700; }
    .mm3 .hab-card.passiva.ativo { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent) inset, 0 0 16px var(--accent-soft); }
    .mm3 .hab-card.item-quebrado { opacity:0.55; }
    .mm3 .ent-item .secao-titulo { background:var(--surface3); border:1px solid var(--border); border-radius:10px; padding:8px 12px; }
    .mm3 .ent-item .secao-titulo:hover { border-color:rgba(232,200,74,0.4); }
    .mm3 .hab-img-modal { width:100%; max-height:190px; object-fit:cover; border-radius:12px; margin-bottom:12px; display:block; }
    .mm3 .acoes-bolinhas { display:flex; align-items:center; gap:10px; margin:0 0 10px; flex-wrap:wrap; }
    .mm3 .acoes-bolinhas .ab-label { font-size:0.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; }
    .mm3 .acao-bolinha { width:20px; height:20px; border-radius:50%; border:2px solid var(--ab-cor); background:var(--ab-cor); box-shadow:0 0 8px var(--ab-cor); padding:0; transition:background .2s ease, box-shadow .2s ease, opacity .2s ease, transform .15s ease; cursor:default; }
    .mm3 .acao-bolinha.pode { cursor:pointer; }
    .mm3 .acao-bolinha.pode:hover { transform:scale(1.15); }
    .mm3 .acao-bolinha.gasta { background:transparent; box-shadow:none; opacity:0.35; }
    .mm3 .acao-tipo { font-size:0.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; display:block; margin-top:1px; }
    .mm3 .modal-tag { display:inline-block; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent); background:var(--accent-soft); border-radius:20px; padding:2px 9px; margin-bottom:8px; }
    .mm3 .versus-row { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; margin-bottom:10px; }
    .mm3 .versus-row .vs-cell { background:var(--surface2); border-radius:10px; padding:10px; text-align:center; }
    .mm3 .versus-row .vs-cell .vsn { font-size:0.68rem; color:var(--muted); margin-bottom:3px; }
    .mm3 .versus-row .vs-cell .vsv { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; }
    .mm3 .versus-row .vsx { font-family:'Bebas Neue',sans-serif; color:var(--muted); font-size:0.9rem; }
    .mm3 .oponente-check-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid var(--border); font-size:0.85rem; }
    .mm3 .oponente-check-row:last-child { border-bottom:none; }
    .mm3 .oponente-check-row .res { margin-left:auto; font-size:0.72rem; font-family:'Bebas Neue',sans-serif; }
    .mm3 .oponente-check-row .res.ok { color:var(--success); } .mm3 .oponente-check-row .res.fail { color:var(--danger); }
    .mm3 .plano-card { background:var(--accent-soft); border:1px solid rgba(232,200,74,0.35); border-radius:12px; padding:0.9rem 1rem; margin-bottom:10px; }
    .mm3 .plano-card .pt { font-family:'Bebas Neue',sans-serif; color:var(--accent); font-size:1.05rem; letter-spacing:0.03em; margin-bottom:2px; }
    .mm3 .plano-card .pd { font-size:0.72rem; color:var(--muted); margin-bottom:8px; }
    .mm3 .ajuda-chip { background:rgba(76,186,122,0.14); border-color:rgba(76,186,122,0.35); color:var(--success); }
    .mm3 .badge-status { display:inline-flex; align-items:center; gap:4px; font-size:0.66rem; text-transform:uppercase; letter-spacing:0.05em;
      background:var(--surface3); color:var(--accent); border-radius:20px; padding:3px 9px; margin-right:6px; cursor:pointer; }

    .mm3 .tabs-row { display:flex; gap:6px; margin-bottom:12px; }
    .mm3 .tab-btn { flex:1; background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:9px; text-align:center;
      cursor:pointer; font-family:'Bebas Neue',sans-serif; letter-spacing:0.04em; color:var(--muted); font-size:0.95rem; }
    .mm3 .tab-btn.sel { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }

    .mm3 .tipo-toggle { display:inline-flex; background:var(--surface3); border:1px solid var(--border); border-radius:999px; padding:3px; gap:2px; flex-shrink:0; }
    .mm3 .tipo-toggle button {
      border:none; background:none; color:var(--muted); font-family:'Bebas Neue',sans-serif; letter-spacing:0.04em;
      font-size:0.85rem; padding:8px 16px; border-radius:999px; cursor:pointer;
      display:inline-flex; align-items:center; gap:6px; transition:background .15s ease, color .15s ease;
    }
    .mm3 .tipo-toggle button .dot { width:6px; height:6px; border-radius:50%; background:currentColor; opacity:0.55; }
    .mm3 .tipo-toggle button:not(.sel):hover { color:var(--text); }
    .mm3 .tipo-toggle button.sel { background:var(--accent); color:#0e0e12; }
    .mm3 .tipo-toggle button.sel .dot { opacity:1; }

    .mm3 .init-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
    .mm3 .init-rodada { font-family:'Bebas Neue',sans-serif; font-size:1.2rem; color:var(--accent); }
    .mm3 .init-controls { display:flex; gap:6px; }
    .mm3 .init-item { display:flex; align-items:center; gap:10px; background:var(--surface2); border:1px solid var(--border); border-radius:10px;
      padding:9px 12px; margin-bottom:6px; }
    .mm3 .init-item.atual { border-color:var(--accent); background:var(--accent-soft); }
    .mm3 .init-val { font-family:'Bebas Neue',sans-serif; font-size:1.3rem; width:34px; text-align:center; flex-shrink:0; }
    .mm3 .init-item.atual .init-val { color:var(--accent); }
    .mm3 .init-nome { font-size:0.88rem; flex:1; }
    .mm3 .init-turno-tag { font-size:0.62rem; color:var(--accent); text-transform:uppercase; letter-spacing:0.06em; }

    .mm3 .oculto-box { background:var(--surface2); border:1px dashed var(--border); border-radius:10px; padding:10px 12px; margin-bottom:12px; }
    .mm3 .hist-item.oculto { border-style:dashed; opacity:0.9; }
    .mm3 .hist-oculto-tag { font-size:0.6rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; }

    .mm3 .modal-box, .mm3 .split-col, .mm3 .rich-editor { scrollbar-color: var(--border) var(--surface2); scrollbar-width: thin; }
    .mm3 .modal-box::-webkit-scrollbar, .mm3 .split-col::-webkit-scrollbar, .mm3 .rich-editor::-webkit-scrollbar { width:8px; height:8px; }
    .mm3 .modal-box::-webkit-scrollbar-track, .mm3 .split-col::-webkit-scrollbar-track, .mm3 .rich-editor::-webkit-scrollbar-track { background: var(--surface2); border-radius:8px; }
    .mm3 .modal-box::-webkit-scrollbar-thumb, .mm3 .split-col::-webkit-scrollbar-thumb, .mm3 .rich-editor::-webkit-scrollbar-thumb { background: var(--border); border-radius:8px; }
    .mm3 .modal-box::-webkit-scrollbar-thumb:hover, .mm3 .split-col::-webkit-scrollbar-thumb:hover, .mm3 .rich-editor::-webkit-scrollbar-thumb:hover { background: var(--accent); }

    .mm3 .oponente-toggle { display:flex; align-items:center; gap:6px; font-size:0.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; }
    .mm3 .oponente-toggle input { width:auto; }
    .mm3 .status-toggle-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
    .mm3 .status-toggle { display:inline-flex; align-items:center; gap:7px; font-size:0.68rem; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:var(--muted); background:var(--surface3); border:1px solid var(--border); border-radius:999px; padding:7px 13px 7px 10px; cursor:pointer; user-select:none; transition:border-color .15s ease, background .15s ease, color .15s ease; }
    .mm3 .status-toggle:hover { border-color:var(--muted); }
    .mm3 .status-toggle input { display:none; width:0; height:0; }
    .mm3 .status-toggle-dot { width:8px; height:8px; border-radius:50%; background:var(--muted); flex-shrink:0; transition:background .15s ease, box-shadow .15s ease; }
    .mm3 .status-toggle-danger.ativo { color:var(--danger); background:var(--danger-bg); border-color:var(--danger-border); }
    .mm3 .status-toggle-danger.ativo .status-toggle-dot { background:var(--danger); box-shadow:0 0 6px var(--danger); }
    .mm3 .status-toggle-crit.ativo { color:var(--crit); background:var(--crit-bg); border-color:var(--crit-border); }
    .mm3 .status-toggle-crit.ativo .status-toggle-dot { background:var(--crit); box-shadow:0 0 6px var(--crit); }
    .mm3 .rich-toolbar { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px; }
    .mm3 .rich-swatches { display:flex; gap:6px; margin-bottom:6px; }
    .mm3 .rich-swatch { width:22px; height:22px; border-radius:6px; border:1px solid var(--border); cursor:pointer; padding:0; }
    .mm3 .rich-swatch:hover { outline:2px solid var(--accent); outline-offset:1px; }
    .mm3 .rich-toolbar button { background:var(--surface3); border:1px solid var(--border); border-radius:6px; color:var(--text); padding:4px 9px; cursor:pointer; font-size:0.82rem; }
    .mm3 .rich-toolbar button.on { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }
    .mm3 .rich-toolbar select, .mm3 .rich-toolbar input[type="color"] { width:auto; padding:4px 6px; font-size:0.8rem; }
    .mm3 .rich-editor { min-height:110px; max-height:260px; overflow-y:auto; background:var(--surface3); border:1px solid var(--border); border-radius:10px;
      padding:10px 12px; font-size:0.9rem; outline:none; }
    .mm3 .rich-display { background:var(--surface3); border:1px solid var(--border); border-radius:10px; padding:10px 12px; font-size:0.88rem; word-break:break-word; }

    /* ---------- animações de rolagem (estilo Baldur's Gate 3) ---------- */
    .mm3 .anim-overlay-wrap {
      position:fixed; top:18px; left:50%; transform:translateX(-50%); z-index:900;
      display:flex; flex-direction:column; gap:12px; align-items:center; pointer-events:none;
      max-width:94vw;
    }
    .mm3 .anim-card {
      pointer-events:none; background:rgba(12,12,16,0.94); backdrop-filter:blur(8px);
      border:1px solid var(--border); border-radius:18px; padding:18px 26px 22px; min-width:200px;
      text-align:center; box-shadow:0 14px 40px rgba(0,0,0,0.55);
      opacity:0; transform:translateY(-16px) scale(0.9); animation:anim-card-in 0.35s ease forwards;
    }
    .mm3 .anim-card.fase-saindo { animation:anim-card-out 0.55s ease forwards; }
    @keyframes anim-card-in { to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes anim-card-out { to { opacity:0; transform:translateY(-12px) scale(0.92); } }
    .mm3 .anim-nome { font-family:'Bebas Neue',sans-serif; letter-spacing:0.04em; font-size:1rem; color:var(--accent); margin-bottom:8px; }

    .mm3 .anim-dado {
      position:relative; display:flex; align-items:center; justify-content:center; margin:0 auto;
      background:linear-gradient(145deg, var(--surface3), var(--surface2)); border:2px solid var(--accent);
      clip-path:polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      box-shadow:0 6px 16px rgba(0,0,0,0.45);
    }
    .mm3 .anim-dado span { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; color:var(--text); }
    .mm3 .anim-dado.girando { animation:anim-dado-spin 0.5s linear infinite; }
    @keyframes anim-dado-spin { 0% { transform:rotate(0deg) scale(1); } 50% { transform:rotate(180deg) scale(1.14); } 100% { transform:rotate(360deg) scale(1); } }
    .mm3 .anim-dado.nat20 { border-color:#ffd873; box-shadow:0 0 24px rgba(255,216,115,0.8); animation:anim-dado-pop 0.4s ease; }
    .mm3 .anim-dado.nat20 span { color:#ffd873; }
    .mm3 .anim-dado.nat1 { border-color:var(--danger); box-shadow:0 0 20px rgba(232,90,90,0.65); animation:anim-dado-shake 0.4s ease; }
    @keyframes anim-dado-pop { 0% { transform:scale(0.6); } 60% { transform:scale(1.28); } 100% { transform:scale(1); } }
    @keyframes anim-dado-shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-5px); } 75% { transform:translateX(5px); } }

    .mm3 .anim-soma { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Bebas Neue',sans-serif; font-size:1.35rem; margin-top:10px; opacity:0; animation:anim-fade-in 0.3s ease forwards; }
    .mm3 .anim-soma .total { color:var(--accent); font-size:1.7rem; }
    .mm3 .anim-soma .op { color:var(--muted); }
    .mm3 .anim-soma.pequeno { font-size:1rem; gap:5px; }
    @keyframes anim-fade-in { to { opacity:1; } }

    .mm3 .anim-resultado { margin-top:10px; border-radius:10px; padding:7px 12px; opacity:0; animation:anim-pop-in 0.3s ease forwards; }
    @keyframes anim-pop-in { 0% { opacity:0; transform:scale(0.85); } 100% { opacity:1; transform:scale(1); } }
    .mm3 .anim-resultado.sucesso { background:var(--success-bg); border:1px solid var(--success-border); color:var(--success); }
    .mm3 .anim-resultado.falha { background:var(--danger-bg); border:1px solid var(--danger-border); color:var(--danger); }
    .mm3 .anim-resultado.crit { background:var(--crit-bg); border:1px solid var(--crit-border); color:var(--crit); }
    .mm3 .anim-resultado .cd-linha { font-size:0.68rem; text-transform:uppercase; letter-spacing:0.06em; opacity:0.85; }
    .mm3 .anim-resultado .grau { font-family:'Bebas Neue',sans-serif; font-size:1.15rem; margin-top:2px; }

    .mm3 .anim-oposta { display:flex; align-items:flex-start; gap:18px; position:relative; padding-bottom:6px; }
    .mm3 .anim-lado { display:flex; flex-direction:column; align-items:center; gap:6px; width:110px;
      transition:transform 0.4s cubic-bezier(.34,1.56,.64,1), opacity 0.4s; }
    .mm3 .anim-oposta.fase-colisao .esquerda { transform:translateX(30px); }
    .mm3 .anim-oposta.fase-colisao .direita { transform:translateX(-30px); }
    .mm3 .anim-oposta.fase-resultado .lado-vencedor.esquerda, .mm3 .anim-oposta.fase-saindo .lado-vencedor.esquerda { transform:translateX(16px) scale(1.06); }
    .mm3 .anim-oposta.fase-resultado .lado-vencedor.direita, .mm3 .anim-oposta.fase-saindo .lado-vencedor.direita { transform:translateX(-16px) scale(1.06); }
    .mm3 .anim-oposta.fase-resultado .lado-perdedor.esquerda, .mm3 .anim-oposta.fase-saindo .lado-perdedor.esquerda { transform:translateX(-8px) translateY(10px) rotate(-9deg); opacity:0.82; }
    .mm3 .anim-oposta.fase-resultado .lado-perdedor.direita, .mm3 .anim-oposta.fase-saindo .lado-perdedor.direita { transform:translateX(8px) translateY(10px) rotate(9deg); opacity:0.82; }

    .mm3 .anim-vs { align-self:center; font-family:'Bebas Neue',sans-serif; color:var(--muted); font-size:1rem; position:relative; margin-top:30px; }
    .mm3 .anim-flash { position:absolute; left:50%; top:50%; width:10px; height:10px; border-radius:50%;
      background:radial-gradient(circle, #fff, var(--accent) 45%, transparent 72%); transform:translate(-50%,-50%);
      animation:anim-flash-burst 0.5s ease-out forwards; }
    @keyframes anim-flash-burst { 0% { width:8px; height:8px; opacity:1; } 100% { width:170px; height:170px; opacity:0; } }

    .mm3 .anim-retrato { position:relative; width:88px; height:88px; border-radius:14px; overflow:hidden;
      border:2px solid var(--border); background:var(--surface3); }
    .mm3 .anim-retrato.vencedor { border-color:var(--accent); box-shadow:0 0 18px rgba(232,200,74,0.55); }
    .mm3 .anim-retrato-vazio { width:100%; height:100%; display:flex; align-items:center; justify-content:center;
      font-family:'Bebas Neue',sans-serif; font-size:2.1rem; color:var(--muted); }
    .mm3 .anim-retrato .metade { position:absolute; top:0; width:100%; height:100%; object-fit:cover;
      transition:transform 0.5s cubic-bezier(.36,.07,.19,.97), filter 0.5s; }
    .mm3 .anim-retrato .metade.esq { clip-path:polygon(0 0, 53% 0, 43% 100%, 0% 100%); }
    .mm3 .anim-retrato .metade.dir { clip-path:polygon(53% 0, 100% 0, 100% 100%, 43% 100%); }
    .mm3 .anim-retrato.quebrado .metade.esq { transform:translate(-11px, 5px) rotate(-10deg); filter:brightness(0.6) saturate(0.5); }
    .mm3 .anim-retrato.quebrado .metade.dir { transform:translate(11px, -5px) rotate(10deg); filter:brightness(0.6) saturate(0.5); }
    .mm3 .anim-retrato.quebrado .rachadura { opacity:1; }
    .mm3 .anim-retrato .rachadura { position:absolute; inset:0; opacity:0; transition:opacity 0.2s; pointer-events:none; }
    .mm3 .anim-retrato .rachadura polyline { fill:none; stroke:rgba(255,255,255,0.85); stroke-width:2.4; filter:drop-shadow(0 0 2px rgba(0,0,0,0.8)); }

    .mm3 .anim-veredito { margin-top:12px; font-family:'Bebas Neue',sans-serif; color:var(--accent); font-size:1.05rem;
      opacity:0; animation:anim-fade-in 0.3s ease forwards; text-align:center; }
  `}</style>
);

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function lerComoDataUrl(file) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = (e) => resolve(e.target.result); r.onerror = reject; r.readAsDataURL(file); });
}
function resizeImageFile(file, maxDimParam = 300, qualidade = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = maxDimParam;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; } }
        else { if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; } }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TIPOS_ACERTO = [
  { v: "corpo", l: "Corpo-a-corpo" }, { v: "distancia", l: "À distância" },
  { v: "area", l: "Área" }, { v: "percepcao", l: "Percepção" },
];
const NEN_TIPOS = ["Fortificador", "Emissor", "Transmutador", "Manipulador", "Conjurador", "Especialista", "Modelador", "Nenhum"];

const ATRIBUTOS = [
  { k: "forca", l: "Força" }, { k: "agilidade", l: "Agilidade" }, { k: "vigor", l: "Vigor" }, { k: "inteligencia", l: "Inteligência" },
  { k: "presenca", l: "Presença" }, { k: "prontidao", l: "Prontidão" }, { k: "luta", l: "Luta" }, { k: "destreza", l: "Destreza" },
];
const ATRIBUTOS_VAZIOS = ATRIBUTOS.reduce((acc, a) => ({ ...acc, [a.k]: 0 }), {});

const PERICIAS = [
  { nome: "Acrobacia", atributo: "agilidade" }, { nome: "Atletismo", atributo: "forca" },
  { nome: "Enganação", atributo: "presenca" }, { nome: "Furtividade", atributo: "agilidade" },
  { nome: "Intimidação", atributo: "presenca" }, { nome: "Intuição", atributo: "prontidao" },
  { nome: "Investigação", atributo: "inteligencia" }, { nome: "Percepção", atributo: "prontidao" },
  { nome: "Persuasão", atributo: "presenca" }, { nome: "Prestidigitação", atributo: "agilidade" },
  { nome: "Tecnologia", atributo: "inteligencia" }, { nome: "Tratamento", atributo: "inteligencia" },
];
const PERICIA_PONTOS_VAZIO = PERICIAS.reduce((acc, p) => ({ ...acc, [p.nome]: 0 }), {});

const DESLOC_TABELA = ["1m","2m","3m","6m","9m","12m","15m","18m","21m","24m","27m","30m","36m","42m","54m","66m","78m","90m","102m","114m","126m","138m","150m","162m","200m","300m","400m"];

/* ---------- tabela de medidas (graduações -2 a 20, referência p/ massa/tempo/distância/volume) ---------- */
const TABELA_MEDIDAS = [
  { g: -2, massa: 5, tempo: "1 segundo", distancia: 1, volume: 5 },
  { g: -1, massa: 10, tempo: "3 segundos", distancia: 2, volume: 10 },
  { g: 0, massa: 15, tempo: "1 turno (6s)", distancia: 3, volume: 15 },
  { g: 1, massa: 30, tempo: "3 turnos", distancia: 6, volume: 30 },
  { g: 2, massa: 45, tempo: "5 turnos", distancia: 9, volume: 45 },
  { g: 3, massa: 60, tempo: "7 turnos", distancia: 12, volume: 60 },
  { g: 4, massa: 75, tempo: "1 min (10 turnos)", distancia: 15, volume: 75 },
  { g: 5, massa: 100, tempo: "3 min", distancia: 18, volume: 100 },
  { g: 6, massa: 125, tempo: "5 min", distancia: 21, volume: 125 },
  { g: 7, massa: 150, tempo: "7 min", distancia: 24, volume: 150 },
  { g: 8, massa: 175, tempo: "10 min", distancia: 27, volume: 175 },
  { g: 9, massa: 200, tempo: "15 min", distancia: 30, volume: 200 },
  { g: 10, massa: 250, tempo: "30 min", distancia: 36, volume: 250 },
  { g: 11, massa: 300, tempo: "1 hora", distancia: 42, volume: 300 },
  { g: 12, massa: 350, tempo: "3 horas", distancia: 54, volume: 350 },
  { g: 13, massa: 400, tempo: "6 horas", distancia: 66, volume: 400 },
  { g: 14, massa: 450, tempo: "9 horas", distancia: 78, volume: 450 },
  { g: 15, massa: 500, tempo: "12 horas", distancia: 90, volume: 500 },
  { g: 16, massa: 550, tempo: "15 horas", distancia: 102, volume: 550 },
  { g: 17, massa: 600, tempo: "18 horas", distancia: 114, volume: 600 },
  { g: 18, massa: 650, tempo: "21 horas", distancia: 126, volume: 650 },
  { g: 19, massa: 700, tempo: "24 horas", distancia: 138, volume: 700 },
  { g: 20, massa: 800, tempo: "48 horas", distancia: 150, volume: 800 },
];
function linhaMedida(g) {
  const gi = Math.round(g || 0);
  if (gi <= -2) return TABELA_MEDIDAS[0];
  if (gi >= 20) return TABELA_MEDIDAS[TABELA_MEDIDAS.length - 1];
  return TABELA_MEDIDAS[gi + 2];
}
function graduacaoParaMassa(g) {
  const gi = Math.round(g || 0);
  if (gi > 20) return 800 + (gi - 20) * 100;
  return linhaMedida(gi).massa;
}
function graduacaoParaDistancia(g) {
  const gi = Math.round(g || 0);
  if (gi > 20) return 150 + (gi - 20) * 25;
  return linhaMedida(gi).distancia;
}
/* Busca reversa na Tabela de Medidas: dada uma massa em kg, acha a menor graduação cuja
   capacidade (massa) já é suficiente pra carregar/mover esse peso. Usada em Mover Objetos
   pra sugerir a graduação de dano de um objeto arremessado a partir do peso dele. */
function massaParaGraduacao(kg) {
  const peso = Math.max(0, Number(kg) || 0);
  for (let g = -2; g <= 20; g++) {
    if (graduacaoParaMassa(g) >= peso) return g;
  }
  return 20 + Math.ceil((peso - 800) / 100);
}

const VANTAGENS = [
  { nome: "Agarrar Aprimorado", desc: "Você pode agarrar com apenas um braço, não ficando vulnerável enquanto agarra.", graduacaoMax: 1 },
  { nome: "Agarrar Rápido", desc: "Quando acerta um ataque desarmado, você pode fazer um teste de agarrar imediatamente contra o alvo como uma ação livre. Seu ataque desarmado causa dano normal e conta como o teste de ataque inicial exigido para agarrar seu oponente.", graduacaoMax: 1 },
  { nome: "Agarrar Preciso", desc: "Você pode usar Acrobacia no lugar de Atletismo para agarrar.", graduacaoMax: 1 },
  { nome: "Ambiente Favorito", desc: "Você é especialmente adaptado para lutar em determinado ambiente. Quando estiver no seu ambiente favorito, você ganha um bônus de circunstância de +2 em testes de ataque, esquiva ou aparar (escolha) e duas perícias a sua escolha.", mecanica: { modo: "toggle", bonus: 2, alvos: ["ataque"], escolheDefesa: true, escolhePericias: 2 }, graduacaoMax: 1 },
  { nome: "Armação", desc: "Você pode transferir os benefícios do uso de uma perícia de interação em combate para um ou mais companheiros. Por exemplo, você pode fintar e deixar seu alvo vulnerável contra um ou mais aliados em seu(s) próximo(s) ataque(s), em vez de deixá-lo vulnerável contra você. Cada graduação nesta vantagem permite que você transfira o benefício para mais um aliado." },
  { nome: "Assustar", desc: "Você pode usar Intimidação no lugar de Enganação para fintar em combate. Os alvos resistem com Intuição, Intimidação ou Vontade.", graduacaoMax: 1 },
  { nome: "Ataque Acurado", desc: "Quando faz um ataque acurado, você pode aceitar uma penalidade de até −5 no CD do ataque e somar o mesmo número no bônus de ataque.", graduacaoMax: 1 },
  { nome: "Ataque Defensivo", desc: "Quando faz um ataque defensivo, você pode aceitar uma penalidade de até −5 no bônus de ataque e somar o mesmo número em suas duas defesas ativas (Esquiva e Aparar).", graduacaoMax: 1 },
  { nome: "Ataque Dominó", desc: "Ao zerar os pontos de vida de uma criatura com um ataque que use uma jogada de ataque, você pode dar um ataque adicional neste turno sem custo de ação. Com duas graduações, você também pode se mover no seu deslocamento sem custo de ação neste turno.", graduacaoMax: 2 },
  { nome: "Ataque Imprudente", desc: "Quando faz um ataque imprudente, você pode aceitar uma penalidade de até −5 em suas defesas ativas (Esquiva ou Aparar) e somar o mesmo número (até +5) no bônus de ataque.", graduacaoMax: 1 },
  { nome: "Ataque Poderoso", desc: "Quando faz um ataque poderoso, você pode aceitar uma penalidade de até −5 no bônus de ataque e somar o mesmo número (até +5) no modificador de efeito do ataque.", graduacaoMax: 1 },
  { nome: "Ataque Preciso", desc: "Quando faz ataques corpo-a-corpo ou à distância, você ignora as penalidades no teste de ataque devido a cobertura ou camuflagem (escolha um), embora cobertura total ainda o impeça de realizar ataques. Com duas graduações você pode ignorar cobertura e camuflagem.", graduacaoMax: 2 },
  { nome: "Atraente", desc: "Você é bonito, o que concede um bônus de +2 em testes de Enganação e de Persuasão para enganar, seduzir ou mudar a atitude de qualquer um que possa ser atraído por você. Com 2 graduações, aumenta o bônus para +5.", graduacaoMax: 2, mecanica: { modo: "condicional", bonusTabela: { 1: 2, 2: 5 }, alvos: ["Enganação", "Persuasão"] } },
  { nome: "Avaliação", desc: "Escolha um alvo que possa perceber e faça um teste de Intuição como uma ação livre, oposto pelo teste de Enganação do alvo. Se você vencer, peça ao mestre o atributo que deseja descobrir com exatidão ou o tipo de Nen do alvo. A cada grau de sucesso adicional, você descobre um atributo a mais do alvo ou o tipo de Nen caso não tenha sido escolhido anteriormente. Se perder o teste oposto, você não descobre nada.", graduacaoMax: 1 },
  { nome: "Bem Informado", desc: "Quando encontrar um indivíduo ou organização pela primeira vez, você pode fazer um teste das perícias Investigação ou Persuasão para ver se seu personagem já ouviu alguma coisa sobre o alvo. Use as diretrizes para obter informações na descrição da perícia Investigação para determinar o nível de informação que você obtém. Você recebe apenas um teste por alvo na primeira vez que o encontrar." },
  { nome: "Benefício", desc: "Você possui um benefício, escolha entre uma das 6 opções. Graduações adicionais nessa vantagem permite você escolher o benefício adicional.\nAmbidestria: você é igualmente apto com as duas mãos, e não sofre penalidades de circunstância por usar sua mão inepta." },
  { nome: "Crítico Aprimorado", desc: "Escolha uma habilidade sua que faça jogada de ataque, ou uma perícia (ao editar esta vantagem). Cada graduação aumenta a ameaça de crítico em 1, até um máximo de ameaça 16-20 com 4 graduações. Em habilidade, a rolagem de ataque passa a considerar crítico. Em perícia, todo teste com ela que atingir a ameaça soma +5 no resultado (não é sucesso automático).", graduacaoMax: 4, pedeHabilidade: true },
  { nome: "De Pé", desc: "Você passa de caído para de pé sem custo de ação sem a necessidade de um teste da perícia Acrobacia.", graduacaoMax: 1 },
  { nome: "Defesa Aprimorada", desc: "Quando usa a ação defender-se e rolar um teste de resistência e tirar um resultado abaixo de 10 no d20, o resultado se torna a 10.", graduacaoMax: 1 },
  { nome: "Derrubar Aprimorado", desc: "Quando acerta um ataque desarmado, você pode fazer um teste de derrubar imediatamente contra o alvo como uma ação livre. Seu ataque desarmado causa dano normal e conta como o teste de ataque inicial exigido para derrubar seu oponente.", graduacaoMax: 1 },
  { nome: "Desarmar Aprimorado", desc: "Você não sofre penalidades em seu teste de ataque para desarmar um oponente e ao segurar a arma, pode dar um ataque com ela como uma ação livre no oponente desarmado.", graduacaoMax: 1 },
  { nome: "Destemido", desc: "Você é imune a todos os efeitos de medo. Na prática, isto é o efeito Imunidade a Medo.", graduacaoMax: 1 },
  { nome: "Empatia com Animais", desc: "Você recebe um bônus de +5 em perícias de interação para falar com animais, bestas ou criaturas não verbais. Você pode usar Prontidão no lugar de Presença em perícias de interação contra elas.", graduacaoMax: 1 },
  { nome: "Equipamento", desc: "Você tem 5 pontos por graduação nesta vantagem para gastar em equipamento. Isso inclui veículos e quartel-general.", graduacaoMax: 999 },
  { nome: "Esconder-se à Plena Vista", desc: "Você pode se esconder sem necessidade de um teste de Enganação ou de Intimidação e sem qualquer tipo de distração, e sem penalidade no seu teste de Furtividade. Você ainda precisa ter algum tipo de cobertura ou camuflagem ao alcance de sua velocidade normal para se esconder.", graduacaoMax: 1 },
  { nome: "Esquiva Fabulosa", desc: "Você não fica vulnerável quando surpreso ou de outra maneira pego desatento. Você ainda fica vulnerável devido a efeitos que limitam sua mobilidade.", graduacaoMax: 1 },
  { nome: "Estrangular", desc: "Se você for bem-sucedido em agarrar e imobilizar um oponente, você pode estrangulá-lo, fazendo seu oponente começar a sufocar enquanto você o imobiliza.", graduacaoMax: 1 },
  { nome: "Evasão", desc: "Você tem um bônus de circunstância de +2 em testes de salvamento de Esquiva para evitar efeitos de área. Se tiver 2 graduações nesta vantagem, seu bônus de circunstância aumenta para +5.", graduacaoMax: 2 },
  { nome: "Fascinar", desc: "Uma de suas perícias de interação é tão eficaz que você pode capturar e prender a atenção de outras pessoas com ela. Escolha Enganação, Intimidação ou Persuasão ao adquirir esta vantagem. Use uma ação livre e faça um teste de perícia de interação contra um teste oposto de seu alvo (Intuição ou a defesa Vontade). Caso seja bem-sucedido, o alvo fica em transe. Você pode manter o efeito com uma ação livre por rodada, concedendo ao alvo um novo teste de salvamento. O efeito termina quando você para de atuar, quando o alvo resistir com sucesso, ou caso qualquer outro perigo imediato se apresente. Você pode comprar esta vantagem mais de uma vez; a cada nova compra, ela se aplica a uma perícia diferente.", graduacaoMax: 3 },
  { nome: "Ferramentas Improvisadas", desc: "Você pode inventar dispositivos temporários. Com uma ação de descanso, você pode criar um dispositivo, os pontos de poder que esse dispositivo pode ter, é igual a quantidade de pontos que você gastou nessa vantagem. Ao montar o seu dispositivo faça um teste de Tecnologia CD 10 + Custo do dispositivo, ao ser bem sucedido você pode usar esse dispositivo como se fosse um efeito de poder seu, mas ao utilizá-lo, ele descarrega, se desfaz ou é destruído.", graduacaoMax: 999 },
  { nome: "Finta Ágil", desc: "Você pode usar seu bônus de Acrobacia ou suas graduações de movimento no lugar de Enganação para fintar e realizar truques em combate como se o seu bônus de Acrobacia ou suas graduações de velocidade fossem o seu bônus de Enganação. Seu adversário se opõe a essa tentativa com Acrobacia ou Intuição (o que for melhor).", graduacaoMax: 1 },
  { nome: "Imobilizar Aprimorado", desc: "Quando você agarra, é difícil escapar. Oponentes agarrados sofrem uma penalidade de −2 em testes para escapar. Com duas graduações nessa vantagem, ela se torna -5.", graduacaoMax: 2 },
  { nome: "Inimigo Favorito", desc: "Você tem um tipo especial de oponente que estudou ou contra o qual é especialmente eficaz. Pode ser um tipo de criatura, uma profissão ou qualquer outra categoria que o mestre aprove. Categorias especialmente amplas como humanos ou vilões não são permitidas. Você ganha um bônus de circunstância de +2 em testes de ataque, Enganação, Intimidação, Intuição e Percepção ao lidar com seu Inimigo Favorito. Você só pode ter 1 inimigo favorito, mas sempre que aumentar o seu nível, você pode mudá-lo.", graduacaoMax: 1, mecanica: { modo: "condicional", bonus: 2, alvos: ["ataque", "Enganação", "Intimidação", "Intuição", "Percepção"], pedeTexto: true } },
  { nome: "Interpor-se", desc: "Quando um aliado dentro do alcance de sua velocidade normal for acertado por um ataque, você pode escolher se colocar entre o atacante e seu aliado como uma reação, tornando-se o alvo do ataque no lugar dele. O ataque acerta você em vez de seu aliado, e você sofre os efeitos normalmente. Você não pode usar esta vantagem contra efeitos de área ou contra ataques de percepção à distância, apenas contra aqueles que exigem um teste de ataque.", graduacaoMax: 1 },
  { nome: "Luta no Chão", desc: "Você não sofre penalidade de circunstância em testes de ataque por estar caído, e oponentes adjacentes não ganham o bônus de circunstância de costume para ataques corpo-a-corpo contra você.", graduacaoMax: 1 },
  { nome: "Mira Aprimorada", desc: "Com uma ação livre, você pode ganhar +5 na sua próxima jogada de ataque.", graduacaoMax: 1 },
  { nome: "Parceiro", desc: "Você tem outro personagem que atua como seu parceiro e ajudante. Crie o parceiro como um personagem independente com (graduações na vantagem x 5) pontos de poder, limitado pelo nível de poder da série. O total de pontos de poder de um parceiro deve ser menor que o seu. Seu parceiro é um personagem do mestre, mas é automaticamente prestativo e leal a você. Caso seu parceiro morra, você recupera os pontos de poder investidos na vantagem no próximo nível." },
  { nome: "Prender Arma", desc: "Quando usa a ação defender-se e você se defende com sucesso de um ataque corpo-a-corpo com arma, você pode tentar desarmar seu oponente de imediato, como uma reação. A tentativa de desarme é feita normalmente, incluindo a oportunidade que o atacante ganha para desarmar você.", graduacaoMax: 1 },
  { nome: "Quebrar Aprimorado", desc: "Você não sofre penalidades em testes de ataque para acertar um objeto segurado por outro personagem.", graduacaoMax: 1 },
  { nome: "Quebrar Arma", desc: "Quando usa a ação defender-se e você se defende com sucesso de um ataque corpo-a-corpo com arma, você pode fazer um ataque contra a arma do atacante de imediato como uma reação. Isso exige um teste de ataque e causa dano normal à arma, caso acerte.", graduacaoMax: 1 },
  { nome: "Reativo", desc: "Você pode gastar uma ação livre no seu turno, para ter uma reação adicional até o começo do seu próximo turno.", graduacaoMax: 1 },
  { nome: "Redirecionar", desc: "Se você for bem-sucedido em ludibriar um oponente, pode redirecionar um ataque contra você que tenha falhado para outro alvo como uma reação. O novo alvo deve estar adjacente a você e dentro do alcance do ataque. O atacante faz um novo teste de ataque com os mesmos modificadores contra o novo alvo.", graduacaoMax: 1 },
  { nome: "Tolerância Maior", desc: "Você tem um bônus de +5 em testes para evitar ficar fatigado e em testes para prender a respiração, para evitar dano devido à fome ou à sede, para evitar dano de ambientes quentes ou frios e para resistir à sufocação e ao afogamento.", graduacaoMax: 1 },
  { nome: "Tontear", desc: "Você pode fazer um teste de Enganação ou de Intimidação (escolha qual perícia ao comprar esta vantagem) para fazer com que seu oponente hesite em combate. Faça um teste de perícia como uma ação padrão contra o teste de salvamento do alvo (a mesma perícia, Intuição ou a defesa Vontade, o que tiver bônus mais alto). Se você vencer, seu alvo fica Tonto (capaz de realizar apenas uma ação padrão) até o fim da sua próxima rodada. A habilidade para deixar alguém Tonto com Enganação e com Intimidação são vantagens diferentes; compre duas graduações desta vantagem para ser capaz de fazer as duas coisas.", graduacaoMax: 2 },
  { nome: "Trabalho em Equipe", desc: "+5 de circunstância ao ajudar em um teste de equipe ou na ação Auxílio.", graduacaoMax: 1 },
  { nome: "Zombar", desc: "Usa uma perícia de interação (ação livre) para irritar o alvo, impondo penalidade em seus próximos testes.", graduacaoMax: 1 },
];
function bonusDeGraduacao(info, graduacoes) {
  if (!info?.mecanica) return 0;
  if (info.mecanica.bonusTabela) {
    const chaves = Object.keys(info.mecanica.bonusTabela).map(Number).sort((a, b) => a - b);
    const g = Math.min(graduacoes || 1, chaves[chaves.length - 1]);
    return info.mecanica.bonusTabela[g] ?? 0;
  }
  return (info.mecanica.bonus || 0) * (graduacoes || 1);
}

const ACOES_PADRAO = [
  { id: "agarrar", nome: "Agarrar", tag: "Ação Padrão", resolvedor: "oposto", periciaOposta: ["Atletismo"],
    desc: "Teste de ataque corpo-a-corpo. Se acertar, um teste oposto de Atletismo decide o resultado: 1 grau de vitória deixa o alvo agarrado, 2+ graus o deixam amarrado." },
  { id: "ajudar", nome: "Ajudar", tag: "Ação Padrão", resolvedor: "ajudar",
    desc: "Escolha um aliado adjacente e um teste para ajudá-lo, fazendo esse mesmo teste com CD 10. Se passar, o aliado ganha +2 por grau de sucesso na próxima vez que fizer aquele teste." },
  { id: "defender", nome: "Defender-se", tag: "Ação Padrão", resolvedor: "buffDefesa",
    desc: "Reduz todo dano recebido em um valor igual ao seu Vigor até o começo do seu próximo turno. Não pode ser usada se você estiver indefeso." },
  { id: "derrubar", nome: "Derrubar", tag: "Ação Padrão", resolvedor: "oposto", penalidade: -2, periciaOposta: ["Acrobacia", "Atletismo"],
    desc: "Teste de ataque com -2. Se acertar, um teste oposto (o maior entre Acrobacia e Atletismo dos dois lados) decide se o oponente cai." },
  { id: "desarmar", nome: "Desarmar", tag: "Ação Padrão", resolvedor: "desarmar", penalidade: -2,
    desc: "Teste de ataque com -2. Se acertar, o alvo faz um teste de Força contra a CD de dano do seu ataque; se falhar, solta o item." },
  { id: "escapar", nome: "Escapar", tag: "Ação de Movimento", resolvedor: "simples", periciaEscolha: ["Atletismo", "Acrobacia"], cdPadrao: 15,
    desc: "Se estiver com a condição agarrado, tente escapar com um teste de Atletismo ou Acrobacia contra a CD do agarrão." },
  { id: "fugir", nome: "Fugir de Vista", tag: "Ação de Movimento", resolvedor: "furtividadeMulti",
    desc: "Teste de Furtividade contra a Percepção de todos os oponentes selecionados, usando seu deslocamento para alcançar cobertura ou camuflagem." },
  { id: "levantarse", nome: "Levantar-se", tag: "Ação de Movimento", resolvedor: "simples", pericia: "Acrobacia", cdPadrao: 20,
    desc: "Levanta-se do chão. Teste de Acrobacia CD 20 sem custo de ação; se falhar, perde a ação de movimento e continua caído." },
  { id: "levantamento", nome: "Levantamento", tag: "Ação Padrão", resolvedor: "levantamento",
    desc: "Levanta ou arremessa objetos. Objetos até a graduação da sua Força são fáceis; acima disso, teste de Atletismo CD 10 + graduações de massa extra." },
  { id: "mirar", nome: "Mirar", tag: "Ação Padrão", resolvedor: "buffMira",
    desc: "Fica indefeso e imóvel, mas seu próximo teste de ataque recebe +10. Sofrer dano pode cancelar a mira (teste de Prestidigitação CD 15 ou o dano sofrido, o que for maior)." },
  { id: "mover", nome: "Mover-se", tag: "Ação de Movimento", resolvedor: "simples", pericia: "Atletismo", cdPadrao: 15,
    desc: "Move-se por uma graduação de distância igual à sua Agilidade. Teste de Atletismo CD 15 opcional: cada grau de sucesso aumenta sua velocidade em +1 por uma rodada." },
  { id: "quebrar", nome: "Quebrar", tag: "Ação Padrão", resolvedor: "ataqueObjeto",
    desc: "Tenta danificar um item vestido ou segurado por um oponente. Teste de ataque contra a defesa do personagem, com -2 se o item estiver sendo segurado." },
];

/* ---------- ações de descanso ---------- */
const DESCANSO_BONUS_MAP = {
  Atletismo: "exercitar", Acrobacia: "exercitar", Furtividade: "exercitar",
  Investigação: "pesquisar", Tecnologia: "pesquisar", Tratamento: "pesquisar",
  Enganação: "discurso", Intimidação: "discurso", Persuasão: "discurso",
};
const DESCANSO_BONUS_LABEL = { exercitar: "Exercitar-se", pesquisar: "Pesquisar", discurso: "Preparar Discurso" };
function descansoAtivoPara(ent, ...pericias) {
  for (const p of pericias) {
    const chave = DESCANSO_BONUS_MAP[p];
    if (chave && (ent?.descansoAtivos || {})[chave]) return chave;
  }
  return null;
}

const MANOBRAS = [
  { id: "desmoralizar", nome: "Desmoralizar", tag: "Ação Livre", resolvedor: "oposicaoCondicao", pericia: "Intimidação", condicao: "Prejudicado",
    desc: "Teste de Intimidação (ação livre) oposto pelo melhor entre Intimidação e Vontade do alvo. Se vencer, o alvo fica Prejudicado até o início do seu próximo turno." },
  { id: "fintar", nome: "Fintar", tag: "Ação Livre", resolvedor: "oposicaoCondicao", pericia: "Enganação", condicao: "Vulnerável",
    desc: "Teste de Enganação (ação livre) oposto pelo melhor entre Enganação e Vontade do alvo. Se vencer, o alvo fica Vulnerável contra seu próximo ataque, até o fim do seu próximo turno." },
  { id: "encontrao", nome: "Encontrão", tag: "Ação Padrão", resolvedor: "encontrao",
    desc: "Ao usar todo o deslocamento em linha reta antes de atacar, ganha +1 de bônus no ataque para cada graduação que se moveu. Se errar, o alvo pode reagir com Agarrar, Derrubar ou Desarmar em você." },
  { id: "lubridiar", nome: "Lubridiar", tag: "Reação", resolvedor: "lubridiar",
    desc: "Ao ser alvo de um ataque, substitui suas defesas ativas por 10 + seu bônus de Enganação. Não pode ser usada se estiver indefeso; se estiver vulnerável, o bônus de Enganação é reduzido pela metade." },
  { id: "planejarManobra", nome: "Planejar", tag: "Ação Padrão", resolvedor: "planoCombate",
    desc: "Teste de Investigação CD 10. Cada grau de sucesso concede uma Ação de Planejamento, usada a qualquer momento como reação para aplicar Agora!, Cuidado, Nosso Alvo ou Reposicionar." },
];

const PLANO_EFEITOS = [
  { subtipo: "agora", nome: "Agora!", desc: "Escolha um inimigo para mostrar uma abertura. A Fortitude, Resistência e Vontade dele são reduzidas em 2." },
  { subtipo: "cuidado", nome: "Cuidado", desc: "Um aliado à sua escolha recebe +2 em Esquiva ou Aparar até o começo do seu próximo turno." },
  { subtipo: "nossoAlvo", nome: "Nosso Alvo", desc: "O próximo aliado a atacar o alvo designado recebe +2 no teste de ataque. Efeito perdido se ninguém atacar o alvo até o começo do seu próximo turno." },
  { subtipo: "reposicionar", nome: "Reposicionar", desc: "Um aliado pode usar uma ação de movimento fora do turno dele, desde que relacionada à movimentação." },
];

/* ---------- economia de ações (bolinhas na ficha) ---------- */
const ACOES_TIPOS = [
  { k: "padrao", nome: "Ação Padrão", curto: "padrão", cor: "#e8c84a" },
  { k: "movimento", nome: "Ação de Movimento", curto: "movimento", cor: "#5aa9e6" },
  { k: "livre", nome: "Ação Livre", curto: "livre", cor: "#5fcf80" },
  { k: "reacao", nome: "Reação", curto: "reação", cor: "#b07be0" },
];
const ACOES_USO_OPCOES = ["Ação Padrão", "Ação Livre", "Ação de Movimento", "Reação"];
const ACOES_SUSTENTAR_OPCOES = ["Ação Padrão", "Ação Livre", "Reação", "Nenhuma"];
function chaveAcaoDeNome(nome) {
  const n = String(nome || "");
  if (n.startsWith("Ação Padrão")) return "padrao";
  if (n.startsWith("Ação de Movimento")) return "movimento";
  if (n.startsWith("Ação Livre")) return "livre";
  if (n.startsWith("Reação")) return "reacao";
  return null;
}

/* Resumo curto (teste + efeito) das ações e manobras, mostrado nos cartões da ficha. */
const RESUMO_ACOES = {
  agarrar: { teste: "Ataque corpo a corpo; se acertar, Atletismo oposto.", efeito: "1 grau: alvo agarrado. 2+ graus: amarrado." },
  ajudar: { teste: "O mesmo teste do aliado, com CD 10.", efeito: "Se passar, o aliado ganha +2 por grau no próximo teste igual." },
  defender: { teste: "Sem teste.", efeito: "Reduz todo dano recebido pelo seu Vigor até o seu próximo turno." },
  derrubar: { teste: "Ataque com −2; se acertar, Acrobacia/Atletismo oposto.", efeito: "Se vencer, o alvo cai." },
  desarmar: { teste: "Ataque com −2; o alvo testa Força contra a CD de dano.", efeito: "Se o alvo falhar, solta o item." },
  escapar: { teste: "Atletismo ou Acrobacia contra a CD do agarrão (padrão 15).", efeito: "Se passar, escapa do agarrão." },
  fugir: { teste: "Furtividade contra a Percepção dos oponentes escolhidos.", efeito: "Quem passar em todos fica furtivo, usando o deslocamento para cobertura." },
  levantarse: { teste: "Acrobacia CD 20.", efeito: "Levanta-se do chão; se falhar, perde a ação de movimento e continua caído." },
  levantamento: { teste: "Atletismo CD 10 + graduações de massa extra.", efeito: "Levanta ou arremessa objetos; até a graduação de Força é automático." },
  mirar: { teste: "Sem teste.", efeito: "Fica indefeso e imóvel; o próximo ataque recebe +10." },
  mover: { teste: "Atletismo CD 15 (opcional).", efeito: "Move-se pela graduação da Agilidade; cada grau dá +1 de velocidade por uma rodada." },
  quebrar: { teste: "Ataque contra a defesa do personagem (−2 se o item estiver sendo segurado).", efeito: "Danifica o item vestido ou segurado." },
  agarrao: { teste: "Sem teste.", efeito: "Mantém o agarrão ativo sobre o alvo." },
  desmoralizar: { teste: "Intimidação oposta ao melhor entre Intimidação e Vontade do alvo.", efeito: "Se vencer, o alvo fica Prejudicado até o início do seu próximo turno." },
  fintar: { teste: "Enganação oposta ao melhor entre Enganação e Vontade do alvo.", efeito: "Se vencer, o alvo fica Vulnerável contra o seu próximo ataque." },
  encontrao: { teste: "Ataque, após usar todo o deslocamento em linha reta.", efeito: "+1 no ataque por graduação percorrida; se errar, o alvo pode reagir com Agarrar, Derrubar ou Desarmar." },
  lubridiar: { teste: "Defesas ativas viram 10 + bônus de Enganação.", efeito: "Reação ao ser alvo de ataque; não vale se estiver indefeso (vulnerável: Enganação pela metade)." },
  planejarManobra: { teste: "Investigação CD 10.", efeito: "Cada grau dá uma Ação de Planejamento: Agora!, Cuidado, Nosso Alvo ou Reposicionar." },
};
function CartaoAcao({ a, onClick, rotuloExtra, titulo }) {
  const k = chaveAcaoDeNome(a.tag);
  const cor = ACOES_TIPOS.find((t) => t.k === k)?.cor || "var(--muted)";
  const r = RESUMO_ACOES[a.id] || { teste: "", efeito: a.desc };
  return (
    <button type="button" className="hab-card acao-card" onClick={onClick} title={titulo || "Clique para usar"} style={{ "--hab-cor": cor }}>
      <div className="hab-faixa" style={{ background: `linear-gradient(90deg, ${cor}, transparent)` }} />
      <div className="hab-corpo">
        <div className="hab-nome">{a.nome}</div>
        <div className="hab-tags">
          <span className="hab-tag" style={{ "--hab-cor": cor }}><span className="hab-dot" />{a.tag}</span>
          {rotuloExtra && <span className="hab-tag">{rotuloExtra}</span>}
        </div>
        {r.teste && <div className="acao-linha"><b>Teste</b>{r.teste}</div>}
        {r.efeito && <div className="acao-linha"><b>Efeito</b>{r.efeito}</div>}
      </div>
    </button>
  );
}
function acaoDaHabilidade(a) { return a?.acao || (a?.tipo === "passiva" ? "Ação Livre" : "Ação Padrão"); }
function rotuloAcaoCurto(nome) { const k = chaveAcaoDeNome(nome); return ACOES_TIPOS.find((x) => x.k === k)?.curto || ""; }
/* ---------- Rapidez (efeito passivo): graduações = pontos para comprar habilidades ---------- */
const MANOBRAS_MAQUINA_PALAVRAS = { fintar: "Fintar", lubridiar: "Lubridiar", desmoralizar: "Desmoralizar" };
const RAPIDEZ_LOJA = [
  { id: "maquinaPalavras", nome: "Máquina de Palavras", custo: 1,
    desc: "Uma vez por turno, você pode usar as ações Fintar, Ludibriar ou Desmoralizar (escolha uma) sem custo de ação.",
    escolha: { tipo: "manobra", label: "Qual ação?", padrao: "fintar" } },
  { id: "elusivo", nome: "Elusivo", custo: 3, desc: "Uma vez por turno, você pode esconder-se sem o custo de ação." },
  { id: "carente", nome: "Carente", custo: 3, desc: "Manter um agarrão não exige mais uma ação livre." },
  { id: "mestreNen", nome: "Mestre do Nen", custo: 5,
    desc: "Uma vez por turno, você pode usar uma habilidade que seja de ação livre sem custo de ação (escolha a habilidade ao comprar esse efeito). Ao invés disso, você pode escolher que uma habilidade sustentada não use sua ação livre para manter o efeito. (Só informativo na ficha.)",
    escolha: { tipo: "texto", label: "Habilidade escolhida" } },
  { id: "adrenalina", nome: "Adrenalina", custo: 10, desc: "Uma vez por turno, você pode se mover sem custo de ação de movimento." },
  { id: "apressado", nome: "Apressado", custo: 15, desc: "Você obtém uma ação livre extra nas suas rodadas em um combate." },
  { id: "mestreCombate", nome: "Mestre do Combate", custo: 20, desc: "Você obtém uma ação padrão extra nas suas rodadas em um combate." },
];
/* Usos "uma vez por turno" que viram marcadores na ficha (voltam a cada turno). */
const RAPIDEZ_GRATIS = [
  { id: "maquinaPalavras", nome: "Máquina de Palavras" },
  { id: "elusivo", nome: "Elusivo" },
  { id: "adrenalina", nome: "Adrenalina" },
];
/* O que a ficha tem comprado na Rapidez (só de efeitos passivos ativos). Ex.: { elusivo: true, maquinaPalavras: "fintar" } */
function rapidezDe(ent) {
  const out = {};
  if (!ent) return out;
  instanciasPassivasAtivas(ent).forEach(({ inst }) => {
    if (inst.tipoId !== "rapidez") return;
    const c = inst.campos?.compras || {};
    const es = inst.campos?.escolhas || {};
    RAPIDEZ_LOJA.forEach((it) => { if (c[it.id]) out[it.id] = it.escolha ? (es[it.id] || it.escolha.padrao || true) : true; });
  });
  return out;
}
/* Bolinhas de ação visíveis: as 4 padrão + as extras da Rapidez (Apressado / Mestre do Combate). */
function acoesVisiveis(ent) {
  const rap = rapidezDe(ent);
  const out = [];
  ACOES_TIPOS.forEach((t) => {
    out.push(t);
    if (t.k === "padrao" && rap.mestreCombate) out.push({ k: "padrao2", nome: "Ação Padrão extra (Mestre do Combate)", curto: "padrão extra", cor: t.cor });
    if (t.k === "livre" && rap.apressado) out.push({ k: "livre2", nome: "Ação Livre extra (Apressado)", curto: "livre extra", cor: t.cor });
  });
  return out;
}
/* Gasta a ação de uma habilidade/ação. "acaoId" (opcional) é o id da ação/manobra usada: se a Rapidez der o
   primeiro uso do turno de graça (Adrenalina, Elusivo, Máquina de Palavras), nenhuma ação é gasta. Se a ação
   normal já foi usada e há uma extra (Apressado / Mestre do Combate), a extra é usada. */
function gastarAcao(atualizarCampo, entId, nomeAcao, acaoId) {
  const k = chaveAcaoDeNome(nomeAcao);
  if (!k || !atualizarCampo) return;
  atualizarCampo(entId, "*", (e) => {
    const rap = rapidezDe(e);
    let gratis = null;
    if (acaoId === "mover" && rap.adrenalina) gratis = "adrenalina";
    else if (acaoId === "fugir" && rap.elusivo) gratis = "elusivo";
    else if (acaoId && rap.maquinaPalavras === acaoId) gratis = "maquinaPalavras";
    if (gratis && !(e.rapidezUsos || {})[gratis]) return { ...e, rapidezUsos: { ...(e.rapidezUsos || {}), [gratis]: true } };
    const g = { ...(e.acoesGastas || {}) };
    let chave = k;
    if (g[k] && k === "padrao" && rap.mestreCombate && !g.padrao2) chave = "padrao2";
    else if (g[k] && k === "livre" && rap.apressado && !g.livre2) chave = "livre2";
    g[chave] = true;
    return { ...e, acoesGastas: g };
  });
}

/* ---------- condições ---------- */
const CONDICOES_LISTA = [
  { nome: "Adoecido", desc: "-2 em testes de Fortitude.", efeito: { fortitude: -2 } },
  { nome: "Atordoado", desc: "Perde a ação padrão e a ação livre." },
  { nome: "Compelido", desc: "Luta pelo controle da mente; ação de movimento controlada por outro." },
  { nome: "Controlado", desc: "Não tem vontade própria; ações ditadas por quem controla." },
  { nome: "Debilitado", desc: "-5 em todos os testes.", efeito: { testesGerais: -5 } },
  { nome: "Em Chamas", desc: "Perde vida por turno (2 se natural, Nível de vida se Nen). Pode encerrar com ação padrão." },
  { nome: "Envenenado", desc: "-5 em testes de Fortitude.", efeito: { fortitude: -5 } },
  { nome: "Imóvel", desc: "Perde a ação de movimento; falha automaticamente esquiva em área." },
  { nome: "Impedido", desc: "Movimento reduzido à metade." },
  { nome: "Indefeso", desc: "Aparar e Esquiva ficam em 1 (CD 1 para acertá-lo).", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Machucado", desc: "-1 em Fortitude, Resistência e Vontade. Acumula com novas aplicações.", efeito: { fortitude: -1, resistencia: -1, vontade: -1 }, stackable: true },
  { nome: "Molhado", desc: "+5 em Resistência/Fortitude contra fogo, -5 contra elétrico." },
  { nome: "Prejudicado", desc: "-2 de circunstância em todos os testes.", efeito: { testesGerais: -2 } },
  { nome: "Prendendo a Respiração", desc: "Imune a poderes de olfato; pode prender a respiração por 1 + Vigor rodadas." },
  { nome: "Surdo", desc: "Perde o sentido Audição." },
  { nome: "Sangrando", desc: "Perde 10% da vida máxima por turno até tratamento CD 10 ou cura." },
  { nome: "Sufocando", desc: "Teste de Fortitude CD 10 no início do turno ou fica Exausto." },
  { nome: "Tonto", desc: "Perde a ação livre." },
  { nome: "Vulnerável", desc: "Aparar e Esquiva pela metade (a CD para acertá-lo é cortada pela metade).", efeito: { aparar: "metade", esquiva: "metade" } },
  { nome: "Zetsu", desc: "Não pode usar habilidades de nenhum tipo de Nen." },
  { nome: "Amarrado", desc: "Imóvel, indefeso e não pode usar braços ou pernas.", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Agarrado", desc: "Imóvel e vulnerável.", efeito: { aparar: "metade", esquiva: "metade" } },
  { nome: "Caído", desc: "-5 em ataques corpo-a-corpo próprios; oponentes corpo-a-corpo +5, à distância -5 contra você. Impedido.", efeito: { aparar: -5, esquiva: 5 }, penalidadeAtaqueCorpoProprio: -5 },
  { nome: "Cego", desc: "Perde a Visão; vulnerável a corpo-a-corpo, indefeso vs. à distância e prejudicado.", efeito: { testesGerais: -2, aparar: "metade", esquiva: "zero" } },
  { nome: "Exausto", desc: "Impedido e debilitado.", efeito: { testesGerais: -5 } },
  { nome: "Fatigado", desc: "Impedido e prejudicado.", efeito: { testesGerais: -2 } },
  { nome: "Incapacitado", desc: "Perde todas as ações, caído e efeitos de poder desabilitados.", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Morrendo", desc: "Incapacitado e próximo da morte. Contador de 3 turnos: desce 1 no começo do seu turno, e cada teste de morte (Fortitude, CD 15 ou a vida negativa) passado sobe 1. Chegou a 0, morre. Se for curado, sai de Morrendo e fica Machucado.", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Morto", desc: "Morreu (o contador de Morrendo chegou a 0)." },
  { nome: "Paralisado", desc: "Indefeso; não pode agir, exceto ações puramente mentais.", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Surpreso", desc: "Vulnerável e é o último na ordem de iniciativa.", efeito: { aparar: "metade", esquiva: "metade" } },
  { nome: "Transe", desc: "Só presta atenção ao efeito que o mantém em transe." },
];
const NORMALIZAR_CONDICAO = { "Em transe": "Transe", "Em chamas": "Em Chamas" };
function normalizarCondicao(nome) { return NORMALIZAR_CONDICAO[nome] || nome; }

function calcModCondicoes(ent) {
  const mod = { testesGerais: 0, fortitude: 0, vontade: 0, resistencia: 0, apararAj: [], esquivaAj: [] };
  Object.entries(ent?.condicoes || {}).forEach(([nome, qtd]) => {
    const item = CONDICOES_LISTA.find((c) => c.nome === nome);
    const efeito = item?.efeito;
    if (!efeito) return;
    for (let i = 0; i < (qtd || 1); i++) {
      if (efeito.testesGerais) mod.testesGerais += efeito.testesGerais;
      if (efeito.fortitude) mod.fortitude += efeito.fortitude;
      if (efeito.vontade) mod.vontade += efeito.vontade;
      if (efeito.resistencia) mod.resistencia += efeito.resistencia;
      if (efeito.aparar !== undefined) mod.apararAj.push(efeito.aparar);
      if (efeito.esquiva !== undefined) mod.esquivaAj.push(efeito.esquiva);
    }
  });
  return mod;
}
function aplicarAjusteDefesa(valor, ajustes) {
  if (ajustes.includes("zero")) return 0;
  let v = valor;
  ajustes.filter((a) => typeof a === "number").forEach((n) => { v += n; });
  if (ajustes.includes("metade")) v = Math.floor(v / 2);
  return v;
}
function condicaoAtiva(ent, nome) { return !!(ent?.condicoes && ent.condicoes[nome]); }
/* Exigir Teste agora é falha de cada efeito (como Efeito Colateral). Habilidades antigas, que tinham
   a falha na habilidade inteira, continuam funcionando (e são migradas ao editar a ficha). */
function exigirTestesDe(ataque) {
  const itens = ataque?.tipo === "passiva" ? passivosDe(ataque) : (ataque?.efeitos || []);
  const out = itens.filter((i) => i?.exigirTeste?.ativo).map((i) => ({ id: i.id, cfg: i.exigirTeste, rotulo: i.categoria || (PODERES_PASSIVOS.find((p) => p.id === i.tipoId)?.nome) || "efeito" }));
  if (ataque?.exigirTeste?.ativo) out.push({ id: "legado", cfg: ataque.exigirTeste, rotulo: "habilidade" });
  return out;
}
function migrarFalhasLegado(a) {
  if (!a || (!a.exigirTeste?.ativo && !a.peculiaridade?.ativo)) return a;
  const { exigirTeste, peculiaridade, ...resto } = a;
  if (a.tipo === "passiva") {
    return { ...resto, passivos: passivosDe(a).map((it) => ({ ...it, ...(exigirTeste?.ativo && !it.exigirTeste ? { exigirTeste } : {}) })) };
  }
  return { ...resto, efeitos: (a.efeitos || []).map((it) => ({ ...it, ...(exigirTeste?.ativo && !it.exigirTeste ? { exigirTeste } : {}), ...(peculiaridade?.ativo && !it.peculiaridade ? { peculiaridade } : {}) })) };
}
/* Crítico Aprimorado em perícia: o alvo da vantagem é "pericia:Nome". Ao tirar no dado o limiar ou mais, soma +5 no resultado (não é sucesso automático). */
function limiarCriticoPericia(ent, nomePericia) {
  const v = (ent?.vantagens || []).find((x) => x.nome === "Crítico Aprimorado" && x.alvoId === `pericia:${nomePericia}`);
  if (!v) return 99;
  return Math.max(16, 20 - (v.graduacoes || 1));
}
function bonusCriticoPericia(ent, nomePericia, dado) { return nomePericia && dado >= limiarCriticoPericia(ent, nomePericia) ? 5 : 0; }
function melhorPericiaDe(ent, nomes) {
  return nomes.reduce((m, n) => (bonusPericia(ent, n) > bonusPericia(ent, m) ? n : m), nomes[0]);
}
function limiarCritico(ent, ataqueId) {
  if (!ataqueId) return 20;
  const v = (ent?.vantagens || []).find((x) => x.nome === "Crítico Aprimorado" && x.alvoId === ataqueId);
  if (!v) return 20;
  return Math.max(16, 20 - (v.graduacoes || 1));
}

/* ---------- helpers de valores derivados ---------- */
function attrBase(ent, key) { return (ent && ent.atributos && ent.atributos[key]) || 0; }
function reducaoAtributoTemp(ent, key) {
  return (ent?.duracoes || []).filter((d) => d.tipo === "atributo" && d.chave === key).reduce((t, d) => t + (d.valor || 0), 0);
}
function attr(ent, key) { return attrBase(ent, key) + bonusAtributoPassivo(ent, key) - reducaoAtributoTemp(ent, key); }

/* ---------- efeitos passivos (habilidades que não fazem rolagem: viram bônus fixos na ficha) ----------
   Cada tipo define custoBase (pontos por graduação), extras/falhas (checkboxes que ajustam o custo,
   e quando é numericamente claro, também entram no cálculo), e aplicar1()/aplicar2() que somam os
   efeitos num acumulador. aplicar1 roda antes de saber os atributos finais (pode alterar atributos e
   tamanho); aplicar2 roda depois (pode usar attr() já com os bônus de aplicar1, útil para deslocamento). */
const SENTIDOS_BASE = ["Visão", "Audição", "Olfato", "Paladar"];
const SENTIDOS_ESPECIAIS = ["Infravisão", "Percepção às Cegas", "Rastrear", "Sentido de Perigo", "Sentido Sísmico", "Ver Nen", "Visão no Escuro"];

/* Lista de variantes do efeito passivo "Característica" (mudanças sob medida pra ficha).
   Pra adicionar uma nova no futuro: (1) acrescente o nome aqui, e (2) se ela alterar alguma
   regra do sistema (como a Fejonetto faz com Enganação/Persuasão), adicione a checagem
   correspondente usando o helper temCaracteristica(ent, "NomeAqui") no lugar certo do código. */
const CARACTERISTICAS_ESPECIAIS = ["Fejonetto", "Diogo"];

const PODERES_PASSIVOS = [
  { id: "camuflagem", nome: "Camuflagem (pessoal)", categoria: "Coringa", custoBase: 2,
    desc: "Escolha um sentido: você fica camuflado contra ele (CD 15 + graduação para ser detectado por outro sentido ou por Percepção). O sentido Tato não pode ser camuflado.",
    campoEscolha: { chave: "sentido", label: "Sentido camuflado", opcoes: [...SENTIDOS_BASE, ...SENTIDOS_ESPECIAIS] },
    extras: [], falhas: [],
    cdInfo: (inst) => ({ cd: 15 + (inst.graduacao || 0), teste: `Percepção (ou teste do sentido) para detectar apesar da camuflagem contra ${inst.campos?.sentido || "o sentido escolhido"}` }),
    aplicar1() {}, aplicar2(ent, inst, acc) { if (inst.campos?.sentido) acc.notas.push(`Camuflado contra ${inst.campos.sentido}`); } },

  { id: "caracteristica", nome: "Característica Aumentada", categoria: "Fortificador", custoBase: 2,
    desc: "Aumenta um atributo em graduações iguais à graduação deste efeito, até o máximo de nível+4.",
    campoEscolha: { chave: "atributo", label: "Atributo aumentado", opcoes: ATRIBUTOS.map((a) => a.k), rotulos: ATRIBUTOS },
    extras: [
      { chave: "explosao", label: "Explosão (+3 no atributo até o início do próximo turno; ao acabar, no começo do próximo turno, fica Fatigado automaticamente — ligue no botão que aparece na ficha)", custoPorGrad: 1 },
      { chave: "brutal", label: "Brutal (+2 na CD por ponto ao acertar um crítico de ataque com este atributo)", custoPorGrad: 1, pontos: true },
    ], falhas: [],
    temBotaoExplosao: true,
    aplicar1(ent, inst, acc) {
      const chave = inst.campos?.atributo; if (!chave) return;
      const base = attrBase(ent, chave);
      const teto = (ent?.nivel || 1) + 4;
      const bonus = Math.max(0, Math.min(inst.graduacao || 0, teto - base));
      const explosao = inst.extrasAtivos?.explosao && inst.explosaoLigada ? 3 : 0;
      acc.atributos[chave] = (acc.atributos[chave] || 0) + bonus + explosao;
    }, aplicar2() {} },

  { id: "comunicacao", nome: "Comunicação", categoria: "Emissor", custoBase: 2,
    desc: "Comunicação por um meio diferente da voz normal. Alcance base 10m, dobrando a cada graduação adicional.",
    campoEscolha: { chave: "meio", label: "Meio de comunicação", opcoes: ["Telepatia", "Rádio (Nen)", "Vibração", "Outro"] },
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) { const g = inst.graduacao || 0; acc.comunicacaoAlcance = Math.max(acc.comunicacaoAlcance, 10 * Math.pow(2, Math.max(0, g))); if (inst.campos?.meio) acc.notas.push(`Comunicação via ${inst.campos.meio} (${Math.round(10 * Math.pow(2, Math.max(0, g)))}m)`); } },

  { id: "sorte", nome: "Controle de Sorte", categoria: "Manipulador", custoBase: 6,
    desc: "Você tem pontos de sorte (igual à graduação) para refazer uma rolagem de d20 e ficar com o maior resultado. Recupera todos ao descansar.",
    extras: [
      { chave: "azar", label: "Azar (pode inverter para o alvo ficar com o pior resultado)", custoPorGrad: 1 },
      { chave: "sortudo", label: "Sortudo (recupera 1 ponto ao tirar um crítico natural)", custoPorGrad: 1 },
    ],
    falhas: [
      { chave: "ataque", label: "Ataque (usar em outros exige um teste de ataque, mesmo em aliados)", custoPorGrad: -1 },
      { chave: "azarado", label: "Azarado (perde 1 ponto ao tirar uma falha crítica, mesmo se mudou o resultado)", custoPorGrad: -1 },
      { chave: "resistir", label: "Resistir (o alvo pode resistir com Vontade CD 15+graduação)", custoPorGrad: -1 },
    ],
    aplicar1(ent, inst, acc) { acc.pontosSorteMax = Math.max(acc.pontosSorteMax, inst.graduacao || 0); }, aplicar2() {} },

  { id: "crescimento", nome: "Crescimento", categoria: "Modelador", custoBase: 6,
    desc: "Para cada graduação, Tamanho, Força, Vigor e Alcance de Ataque aumentam 1, mas Esquiva, Aparar e Furtividade diminuem 1.",
    extras: [
      { chave: "musculosDensos", label: "Músculos Densos (controla o quanto cresce, sem precisar do tamanho máximo)", custoPorGrad: 1 },
      { chave: "soTamanho", label: "Só Tamanho (não perde Esquiva/Aparar, mas também não ganha Vigor)", custoFixo: 1 },
    ],
    falhas: [ { chave: "pesadoDemais", label: "Pesado Demais (-1 Agilidade por graduação, dinâmico)", custoDinamico: (g) => -2 * g } ],
    aplicar1(ent, inst, acc) {
      const g = inst.graduacao || 0; const soT = !!inst.extrasAtivos?.soTamanho;
      acc.tamanho += g;
      acc.atributos.forca = (acc.atributos.forca || 0) + g;
      if (!soT) acc.atributos.vigor = (acc.atributos.vigor || 0) + g;
      if (!soT) { acc.esquiva -= g; acc.aparar -= g; }
      acc.furtividade -= g;
      if (inst.extrasAtivos?.pesadoDemais) acc.atributos.agilidade = (acc.atributos.agilidade || 0) - g;
      if (g > 0) acc.notas.push(`Alcance de ataque +${g} graduação(ões) (Crescimento)`);
    }, aplicar2() {} },

  { id: "deflexao", nome: "Deflexão", categoria: "Fortificador", custoBase: 6,
    desc: "Pode usar Aparar para se defender de ataques à distância, e recebe um bônus em Aparar igual à graduação.",
    extras: [
      { chave: "queVaiVolta", label: "O Que Vai Volta (2+ graduações: pode refletir o ataque no atacante)", custoPorGrad: 1 },
      { chave: "multitarefas", label: "Multitarefas (pode usar Deflexão num ataque adicional na rodada)", custoPorGrad: 1 },
    ], falhas: [],
    aplicar1(ent, inst, acc) { acc.aparar += (inst.graduacao || 0); acc.temDeflexao = true; }, aplicar2() {} },

  { id: "encolhimento", nome: "Encolhimento", categoria: "Modelador", custoBase: 2,
    desc: "Para cada graduação, Tamanho, Força e Agilidade diminuem 1, mas Esquiva, Aparar e Furtividade aumentam 1.",
    extras: [
      { chave: "forcaNormal", label: "Força Normal (não reduz mais Força e Agilidade)", custoPorGrad: 2 },
      { chave: "encolhedor", label: "Encolhedor (equipamentos e itens também encolhem com você)", custoPorGrad: 1 },
    ], falhas: [],
    aplicar1(ent, inst, acc) {
      const g = inst.graduacao || 0; const fn = !!inst.extrasAtivos?.forcaNormal;
      acc.tamanho -= g;
      if (!fn) { acc.atributos.forca = (acc.atributos.forca || 0) - g; acc.atributos.agilidade = (acc.atributos.agilidade || 0) - g; }
      acc.esquiva += g; acc.aparar += g; acc.furtividade += g;
    }, aplicar2() {} },

  { id: "escavacao", nome: "Escavação", categoria: "Modelador", custoBase: 1,
    desc: "Move-se através da terra e areia a uma graduação de velocidade igual à sua graduação de Escavação -3.",
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) { acc.deslocamentos.escavacao = Math.max(acc.deslocamentos.escavacao, (inst.graduacao || 0) - 3); acc.deslocamentos.temEscavacao = true; } },

  { id: "membrosExtras", nome: "Membros Extras", categoria: "Modelador", custoBase: 4,
    desc: "Cada graduação concede um membro manipulador extra (considerado inábil). +1 em Aparar e Fintar por graduação.",
    extras: [], falhas: [],
    aplicar1(ent, inst, acc) { acc.membrosExtras += (inst.graduacao || 0); acc.aparar += (inst.graduacao || 0); }, aplicar2() {} },

  { id: "movimento", nome: "Movimento Especial", categoria: "Coringa", custoBase: 3,
    desc: "Para cada graduação, escolha uma forma especial de movimento: Andar na Água, Balançar-se, Deslizar, Escalar Paredes ou Permear.",
    campoEscolha: { chave: "opcoes", multi: true, label: "Opções (uma por graduação)", opcoes: ["Andar na Água", "Balançar-se", "Deslizar", "Escalar Paredes", "Permear"] },
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) { (inst.campos?.opcoes || []).forEach((o) => acc.notas.push(`Movimento: ${o}`)); } },

  { id: "natacao", nome: "Natação", categoria: "Coringa", custoBase: 1,
    desc: "Velocidade aquática igual à sua velocidade terrestre -1. Com 2 graduações, igual à terrestre; a cada graduação acima, +1.",
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) {
      const g = inst.graduacao || 0; if (g <= 0) return;
      const idxAgil = Math.max(-2, Math.min(24, attr(ent, "agilidade")));
      let idxAgua = g === 1 ? idxAgil - 1 : idxAgil + (g - 2);
      acc.deslocamentos.natacao = Math.max(acc.deslocamentos.natacao, idxAgua);
      acc.deslocamentos.temNatacao = true;
    } },

  { id: "protecao", nome: "Proteção", categoria: "Fortificador", custoBase: 4,
    desc: "Reduz qualquer dano em uma quantidade igual à graduação (sem limite de nível).",
    extras: [], falhas: [{ chave: "limitado", label: "Limitado (a redução só se aplica se marcar o checkbox \"Proteção\" ao rolar o teste de Resistência)" }],
    aplicar1(ent, inst, acc, ataque) {
      const g = inst.graduacao || 0;
      const reducao = Math.max(0, g);
      if (inst.extrasAtivos?.limitado) {
        acc.reducaoDanoLimitado += reducao;
        acc.notas.push(`Proteção (Limitado): ${reducao} de redução de dano só se aplica se marcar o checkbox "Proteção" ao rolar o teste de Resistência`);
      } else if (ataque?.equipamento) {
        acc.reducaoDanoItens.push({ ataqueId: ataque.id, nome: ataque.nome || "Equipamento", valor: reducao });
        acc.notas.push(`Proteção (${ataque.nome || "Equipamento"}): ${reducao} de redução de dano — o item perde PV igual ao dano que absorver`);
      } else {
        acc.reducaoDano += reducao;
      }
    }, aplicar2() {} },

  { id: "regeneracao", nome: "Regeneração", categoria: "Modelador", custoBase: 3,
    desc: "Recupera em PV a graduação neste efeito por turno. Com 10 graduações, recupera membros perdidos em 1 minuto.",
    extras: [], falhas: [],
    aplicar1(ent, inst, acc) { acc.regenPorTurno += (inst.graduacao || 0); }, aplicar2() {} },

  { id: "sentidos", nome: "Sentidos", categoria: "Coringa", custoBase: 3,
    desc: "Escolha um sentido especial (aumentar graduações neste efeito melhora esse sentido).",
    campoEscolha: { chave: "sentido", label: "Sentido especial", opcoes: SENTIDOS_ESPECIAIS },
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) { if (inst.campos?.sentido) acc.notas.push(`${inst.campos.sentido} (graduação ${inst.graduacao || 0})`); } },

  { id: "sentidoRemoto", nome: "Sentido Remoto", categoria: "Emissor", custoBase: 4,
    desc: "Desloca um ou mais sentidos para longe. Custa 4 pontos por graduação para um tipo, 5 para dois tipos, 6 para todos os tipos.",
    campoEscolha: { chave: "abrangencia", label: "Abrangência", opcoes: ["Um tipo de sentido", "Dois tipos", "Todos os tipos"] },
    extras: [
      { chave: "camuflagemSR", label: "Camuflagem (o sentido remoto ganha camuflagem)", custoPorGrad: 1 },
      { chave: "formaAstral", label: "Forma Astral (o sentido remoto se move e atravessa objetos)", custoPorGrad: 3 },
      { chave: "simultanea", label: "Simultânea (usa o sentido remoto e os normais ao mesmo tempo, sem ficar vulnerável)", custoPorGrad: 2 },
    ], falhas: [],
    custoBasePorAbrangencia: { "Um tipo de sentido": 4, "Dois tipos": 5, "Todos os tipos": 6 },
    cdInfo: (inst) => ({ cd: 10 + (inst.graduacao || 0), teste: "Percepção para notar que está sendo observado por um sentido deslocado" }),
    aplicar1() {}, aplicar2(ent, inst, acc) { acc.notas.push(`Sentido Remoto (${inst.campos?.abrangencia || "um tipo"}, alcance graduação ${inst.graduacao || 0})`); } },

  { id: "velocidade", nome: "Velocidade", categoria: "Fortificador", custoBase: 3,
    desc: "Move-se mais rápido que o normal. Graduações somam na sua graduação de deslocamento terrestre.",
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) { acc.deslocamentos.base += (inst.graduacao || 0); } },

  { id: "voo", nome: "Voo", categoria: "Coringa", custoBase: 5,
    desc: "Pode voar (incluindo flutuar no lugar) com graduação de velocidade de voo igual à graduação neste efeito.",
    extras: [ { chave: "aquatico", label: "Aquático (velocidade na água igual à graduação em Voo)", custoPorGrad: 1 } ],
    falhas: [
      { chave: "asas", label: "Asas (não pode voar se estiver imobilizado, amarrado ou preso)", custoPorGrad: -1 },
      { chave: "levitacao", label: "Levitação (só se move na vertical, não para os lados)", custoPorGrad: -1 },
      { chave: "planar", label: "Planar (não ganha altura com o voo, plana a até o dobro da altitude)", custoPorGrad: -2 },
      { chave: "plataforma", label: "Plataforma (depende de ficar de pé ou sentado sobre algo; falha em salvamento ou ser agarrado derruba)", custoPorGrad: -1 },
    ],
    aplicar1() {}, aplicar2(ent, inst, acc) {
      const g = inst.graduacao || 0;
      let vooEfetivo = g;
      if (inst.extrasAtivos?.asas && (condicaoAtiva(ent, "Amarrado") || condicaoAtiva(ent, "Agarrado") || condicaoAtiva(ent, "Imóvel"))) vooEfetivo = 0;
      acc.deslocamentos.voo = Math.max(acc.deslocamentos.voo, vooEfetivo);
      acc.deslocamentos.temVoo = true;
      if (inst.extrasAtivos?.aquatico) { acc.deslocamentos.natacao = Math.max(acc.deslocamentos.natacao, g); acc.deslocamentos.temNatacao = true; }
    } },

  { id: "bonusPericiaPassivo", nome: "Característica Aumentada (Bônus de Perícia)", categoria: "Coringa", custoBase: 1,
    desc: "Concede um bônus fixo, igual à graduação, numa perícia escolhida.",
    campoEscolha: { chave: "pericia", label: "Perícia", opcoes: PERICIAS.map((p) => p.nome) },
    extras: [], falhas: [],
    aplicar1(ent, inst, acc) {
      const nome = inst.campos?.pericia; if (!nome) return;
      const g = inst.graduacao || 0;
      if (nome === "Furtividade") acc.furtividade += g;
      else acc.periciasBonus[nome] = (acc.periciasBonus[nome] || 0) + g;
    }, aplicar2() {} },

  { id: "caracteristicaEspecial", nome: "Característica", categoria: "Coringa", custoBase: 1,
    desc: "Efeito sob medida: escolha uma característica da lista. Cada uma altera uma regra específica da ficha de um jeito próprio (veja a descrição de cada uma ao escolher).",
    campoEscolha: { chave: "nome", label: "Qual?", opcoes: CARACTERISTICAS_ESPECIAIS,
      descricoes: {
        Fejonetto: "Tudo na ficha que usaria o bônus de Enganação passa a usar o bônus de Persuasão no lugar.",
        Diogo: "Inimigo Favorito funciona diferente: em vez de um alvo fixo, ao ter sucesso em um teste de Leitura Mental contra alguém, enquanto você sustentar esse efeito, esse alvo conta como seu Inimigo Favorito. Na prática: quando rolar ataque/Enganação/Intimidação/Intuição/Percepção contra quem você estiver lendo a mente, marque a caixinha de Inimigo Favorito que aparece na rolagem (ela já é manual — o site não trava num alvo fixo pra nenhum jogador). No campo de texto do Inimigo Favorito, pode escrever algo como \"quem eu estiver lendo a mente\".",
      } },
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) { if (inst.campos?.nome) acc.notas.push(`Característica: ${inst.campos.nome}`); } },

  { id: "rapidez", nome: "Rapidez", categoria: "Coringa", custoBase: 1,
    desc: "Você pode executar ações com mais rapidez. As graduações de Rapidez são pontos para comprar habilidades. Você pode ter graduações de Rapidez sem depender de Nen, mudando sua duração para permanente.",
    extras: [], falhas: [],
    aplicar1() {},
    aplicar2(ent, inst, acc) {
      const c = inst.campos?.compras || {};
      const es = inst.campos?.escolhas || {};
      RAPIDEZ_LOJA.forEach((it) => {
        if (!c[it.id]) return;
        const extra = it.id === "maquinaPalavras" ? ` (${MANOBRAS_MAQUINA_PALAVRAS[es.maquinaPalavras || "fintar"]})` : (it.id === "mestreNen" && es.mestreNen ? `: ${es.mestreNen}` : "");
        acc.notas.push(`Rapidez — ${it.nome}${extra}`);
      });
    } },

  { id: "shuNota", nome: "Shu (absorver dano de item)", categoria: "Coringa", custoBase: 1, oculto: true,
    desc: "Enquanto ativo: quando um item seu sofrer dano, em vez de perder Pontos de Vida do item, esse tanto é descontado dos seus Pontos de Nen. (Aplicado automaticamente ao usar a ação Quebrar contra um item seu.)",
    extras: [], falhas: [],
    aplicar1() {}, aplicar2(ent, inst, acc) { acc.notas.push("Shu: dano em itens é absorvido pelos seus Pontos de Nen"); } },
];

/* ---------- Fundamentos (Ren/Zetsu/Shu/Ken/Gyo/Em) ----------
   São habilidades passivas pré-montadas e gratuitas (não custam Pontos de Poder).
   Marcar o checkbox na aba "Fundamentos" adiciona a habilidade correspondente à lista
   de Habilidades da ficha (desativada, igual qualquer habilidade nova); desmarcar remove
   essa habilidade. Uma vez adquirida, ela funciona e é editada exatamente como qualquer
   outra habilidade passiva — inclusive o liga/desliga fica no chip normal de Habilidades.
   O campo "fundamento" (id estável) é só uma marcação interna pra saber qual checkbox
   corresponde a qual habilidade — pode renomear a habilidade livremente que continua
   funcionando.
   custoNen aqui é o custo por turno enquanto sustentada — o app não tem (ainda) um
   sistema automático de "gasto por turno" pra nenhuma habilidade (nem Regeneração tem,
   por exemplo), então esse valor fica visível no campo "Custo de Nen" da habilidade só
   como referência, pra descontar manualmente cada turno. */
const FUNDAMENTOS = [
  { id: "ren", nome: "Ren", custoNen: 2, sustentado: true,
    desc: "Característica Aumentada em Força, Agilidade e Vigor (graduação 1 cada). Ação livre pra ativar; sustentado; custa 2 de Nen por turno enquanto ativo.",
    passivos: () => [
      { id: uid(), tipoId: "caracteristica", graduacao: 1, campos: { atributo: "forca" }, extrasAtivos: {} },
      { id: uid(), tipoId: "caracteristica", graduacao: 1, campos: { atributo: "agilidade" }, extrasAtivos: {} },
      { id: uid(), tipoId: "caracteristica", graduacao: 1, campos: { atributo: "vigor" }, extrasAtivos: {} },
    ] },
  { id: "zetsu", nome: "Zetsu", custoNen: 0, sustentado: true,
    desc: "Camuflagem contra Ver Nen (graduação 4) + 1 de Furtividade. Ação livre pra ativar; sustentado; sem custo de Nen por turno.",
    passivos: () => [
      { id: uid(), tipoId: "camuflagem", graduacao: 4, campos: { sentido: "Ver Nen" }, extrasAtivos: {} },
      { id: uid(), tipoId: "bonusPericiaPassivo", graduacao: 1, campos: { pericia: "Furtividade" }, extrasAtivos: {} },
    ] },
  { id: "shu", nome: "Shu", custoNen: 0, sustentado: false,
    desc: "Quando um item seu sofrer dano com o Shu ativo, esse dano é descontado dos seus Pontos de Nen em vez dos Pontos de Vida do item (aplicado automaticamente na ação Quebrar).",
    passivos: () => [{ id: uid(), tipoId: "shuNota", graduacao: 1, campos: {}, extrasAtivos: {} }] },
  { id: "ken", nome: "Ken", custoNen: 1, sustentado: true,
    desc: "Proteção (graduação 1). Ação livre pra ativar; sustentado; custa 1 de Nen por turno enquanto ativo.",
    passivos: () => [{ id: uid(), tipoId: "protecao", graduacao: 1, campos: {}, extrasAtivos: {} }] },
  { id: "gyo", nome: "Gyo", custoNen: 1, sustentado: true,
    desc: "Sentido Ver Nen (graduação 1) + 1 de Percepção. Ação livre pra ativar; sustentado; custa 1 de Nen por turno; enquanto sustentado, você fica Vulnerável.",
    passivos: () => [
      { id: uid(), tipoId: "sentidos", graduacao: 1, campos: { sentido: "Ver Nen" }, extrasAtivos: {}, colateral: { ativo: true, condicao: "Vulnerável", comTeste: false } },
      { id: uid(), tipoId: "bonusPericiaPassivo", graduacao: 1, campos: { pericia: "Percepção" }, extrasAtivos: {} },
    ] },
  { id: "em", nome: "Em", custoNen: 2, sustentado: true,
    desc: "Sentido Percepção às Cegas (graduação 1). Ação livre pra ativar; sustentado; custa 2 de Nen por turno enquanto ativo.",
    passivos: () => [{ id: uid(), tipoId: "sentidos", graduacao: 1, campos: { sentido: "Percepção às Cegas" }, extrasAtivos: {} }] },
];
function construirFundamento(def) {
  return {
    id: uid(), nome: def.nome, tipo: "passiva", tipoAcerto: "corpo", custoVida: 0, custoNen: def.custoNen,
    extras: {}, equipamento: false, ativo: false, sustentado: !!def.sustentado, fundamento: def.id,
    efeitos: [{ id: uid(), ...efeitoPadrao("Dano") }],
    passivos: def.passivos(),
  };
}

function custoPassivo(inst, def) {
  if (!def) return 0;
  const g = Math.max(0, inst?.graduacao || 0);
  let base = def.custoBasePorAbrangencia ? (def.custoBasePorAbrangencia[inst?.campos?.abrangencia] || def.custoBase) : def.custoBase;
  let total = base * g;
  (def.extras || []).forEach((ex) => {
    if (!inst?.extrasAtivos?.[ex.chave]) return;
    if (ex.custoFixo) total += ex.custoFixo;
    else if (ex.custoPorGrad) total += ex.custoPorGrad * g * (ex.pontos ? Math.max(1, inst?.extrasPontos?.[ex.chave] || 1) : 1);
  });
  (def.falhas || []).forEach((fa) => {
    if (!inst?.extrasAtivos?.[fa.chave]) return;
    if (fa.custoDinamico) total += fa.custoDinamico(g);
    else if (fa.custoFixo) total += fa.custoFixo;
    else if (fa.custoPorGrad) total += fa.custoPorGrad * g;
  });
  return Math.max(1, total);
}

function acumuladorPassivoVazio() {
  return {
    atributos: {}, tamanho: 0, aparar: 0, esquiva: 0, furtividade: 0, temDeflexao: false,
    reducaoDano: 0, reducaoDanoLimitado: 0, reducaoDanoItens: [], regenPorTurno: 0, pontosSorteMax: 0, membrosExtras: 0,
    comunicacaoAlcance: 0, deslocamentos: { base: 0, voo: 0, natacao: 0, escavacao: 0, temVoo: false, temNatacao: false, temEscavacao: false },
    periciasBonus: {}, notas: [],
  };
}
/* ---------- suporte a múltiplos efeitos passivos por habilidade ----------
   Formato novo: ataque.passivos é uma LISTA de instâncias { id, tipoId, graduacao,
   campos, extrasAtivos, explosaoLigada } — igual "efeitos" já funciona pras
   habilidades ativas. O ativo/desativado da habilidade como um todo mora em
   ataque.ativo (nível da habilidade, não de cada efeito).
   Formato antigo (fichas salvas antes desta versão): ataque.passivo era um
   objeto ÚNICO, com "ativo" dentro dele mesmo. As funções abaixo leem os dois
   formatos sem exigir nenhuma migração manual — ao editar e salvar a
   habilidade pelo formulário (ou só ligar/desligar ela na ficha), ela já é
   regravada automaticamente no formato novo. */
function passivosDe(ataque) {
  if (Array.isArray(ataque?.passivos)) return ataque.passivos;
  if (ataque?.passivo && (ataque.passivo.tipoId || ataque.passivo.graduacao)) {
    const { ativo, ...inst } = ataque.passivo;
    return [inst];
  }
  return [];
}
function passivaEstaAtiva(ataque) {
  return !!(ataque?.ativo ?? ataque?.passivo?.ativo);
}
function instanciasPassivasAtivas(ent) {
  const out = [];
  (ent?.ataques || []).forEach((a) => {
    if (a.tipo !== "passiva" || !passivaEstaAtiva(a)) return;
    passivosDe(a).forEach((inst, idx) => { if (inst?.tipoId && !(ent?.efeitosPerdidos || {})[inst.id]) out.push({ ataque: a, inst: comAquecimento(inst, ent), idx }); });
  });
  return out;
}
function habilidadesPassivasAtivas(ent) {
  const vistos = new Set();
  return instanciasPassivasAtivas(ent).map((x) => x.ataque).filter((a) => (vistos.has(a.id) ? false : (vistos.add(a.id), true)));
}
function rotuloPassivos(ataque) {
  const nomes = passivosDe(ataque).map((p) => PODERES_PASSIVOS.find((x) => x.id === p.tipoId)?.nome).filter(Boolean);
  if (!nomes.length) return "passiva";
  return nomes.length === 1 ? nomes[0] : `${nomes[0]} +${nomes.length - 1}`;
}
/* Checa se a entidade tem uma variante específica do efeito passivo "Característica" ativa
   (ex: temCaracteristica(ent, "Fejonetto")). Usado pra ligar regras especiais no lugar certo do código. */
function temCaracteristica(ent, nomeCaracteristica) {
  return instanciasPassivasAtivas(ent).some(({ inst }) => inst.tipoId === "caracteristicaEspecial" && inst.campos?.nome === nomeCaracteristica);
}
/* Checa se a entidade adquiriu (e tem ativado) um Fundamento específico pelo id estável
   (ex: temFundamento(ent, "shu")) — independe do nome de exibição da habilidade. */
function temFundamento(ent, idFundamento) {
  return (ent?.ataques || []).some((a) => a.fundamento === idFundamento && a.tipo === "passiva" && passivaEstaAtiva(a));
}
/* Lista efeitos colaterais atualmente "em jogo": efeitos passivos ativos, e efeitos de
   habilidades ativas que estejam sendo sustentadas (a.sustentado). Cada item retornado
   é { ataque, item } onde "item" é o efeito/instância que carrega o .colateral. */
function efeitosColateraisAtivos(ent) {
  const out = [];
  (ent?.ataques || []).forEach((a) => {
    if (a.tipo === "passiva" && passivaEstaAtiva(a)) {
      passivosDe(a).forEach((inst) => { if (inst?.colateral?.ativo && !(ent?.efeitosPerdidos || {})[inst.id]) out.push({ ataque: a, item: inst }); });
    } else if (a.tipo !== "passiva" && a.sustentado && a.sustentando) {
      (a.efeitos || []).forEach((ef) => { if (ef?.colateral?.ativo && !(ent?.efeitosPerdidos || {})[ef.id]) out.push({ ataque: a, item: ef }); });
    }
  });
  return out;
}
/* ---------- Vida, Morrendo e Mirar (pós-processamento automático de qualquer alteração na ficha) ---------- */
function danoComTemp(e, dano) {
  const pt = Math.max(0, e.pvTemp || 0);
  const abs = Math.min(pt, Math.max(0, dano));
  return { pvTemp: pt - abs, pvAtual: (e.pvAtual || 0) - (dano - abs), absorvido: abs };
}
function posProcessarEntidade(prev, ne) {
  let r = ne;
  if (!!prev.mirando !== !!r.mirando) {
    const c = { ...(r.condicoes || {}) };
    if (r.mirando) {
      const add = ["Indefeso", "Imóvel"].filter((n) => !c[n]);
      add.forEach((n) => { c[n] = 1; });
      r = { ...r, condicoes: c, mirarAplicou: add };
    } else {
      (r.mirarAplicou || []).forEach((n) => { delete c[n]; });
      const { mirarAplicou, ...resto } = r;
      r = { ...resto, condicoes: c };
    }
  }
  if ((prev.pvAtual || 0) !== (r.pvAtual || 0)) {
    const c = { ...(r.condicoes || {}) };
    if ((r.pvAtual || 0) <= 0 && !c["Morrendo"] && !c["Morto"]) {
      c["Morrendo"] = 1;
      r = { ...r, condicoes: c, morrendoContador: 3 };
    } else if ((r.pvAtual || 0) > 0 && c["Morrendo"]) {
      delete c["Morrendo"];
      c["Machucado"] = (c["Machucado"] || 0) + 1;
      const { morrendoContador, testeMorteAguardando, ...resto } = r;
      r = { ...resto, condicoes: c };
    }
  }
  return r;
}

/* ---------- Efeito Colateral automático ---------- */
function itensColaterais(ataque) {
  const lista = ataque?.tipo === "passiva" ? passivosDe(ataque) : (ataque?.efeitos || []);
  return lista.filter((i) => i?.colateral?.ativo && i.colateral.condicao);
}
/* liga/desliga a condição de um efeito colateral, lembrando (colateraisAplicados) o que ele mesmo aplicou */
function mutarColateral(e, itemId, nome, ligar) {
  const rastro = { ...(e.colateraisAplicados || {}) };
  const c = { ...(e.condicoes || {}) };
  const def = CONDICOES_LISTA.find((x) => x.nome === nome);
  if (ligar) {
    if (rastro[itemId] && c[nome]) return e;
    if (!def?.stackable && c[nome]) return e; // já tinha por outra fonte: não mexe
    c[nome] = def?.stackable ? (c[nome] || 0) + 1 : 1;
    rastro[itemId] = nome;
    // Em Chamas por Efeito Colateral é poder de Nen: dano por turno igual ao nível da ficha.
    if (nome === "Em Chamas") return { ...e, condicoes: c, colateraisAplicados: rastro, condOrigem: { ...(e.condOrigem || {}), "Em Chamas": Math.max(1, e.nivel || 1) } };
  } else {
    const n = rastro[itemId];
    if (!n) return e;
    if (c[n]) { c[n] -= 1; if (c[n] <= 0) delete c[n]; }
    delete rastro[itemId];
  }
  return { ...e, condicoes: c, colateraisAplicados: rastro };
}
/* Rola o teste do Efeito Colateral com teste; devolve true se resistiu. */
function rolarTesteColateral(entidade, item, registrar) {
  const col = item.colateral;
  const cd = 10 + (item.graduacao || item.graduacaoNulificar || 0);
  const dado = rolarD20();
  const bonus = salvBonus(entidade, col.salvamento);
  const r = montarTeste(dado, bonus, cd);
  if (registrar) {
    registrar({
      tipo: "rolagem",
      desc: `${entidade.nome} testa Efeito Colateral (${col.salvamento})`,
      detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${r.total} vs CD ${cd}${fmtMods(notasModsDefesa(entidade, CHAVE_SALV[col.salvamento] || "fortitude"))}`,
      total: r.sucesso ? "Resistiu" : `Falhou — fica ${col.condicao}`,
      tipoClasse: r.sucesso ? "hs" : "hw",
    });
  }
  return r.sucesso;
}
function ativarColaterais(ent, ataque, atualizarCampo, registrar) {
  if (!atualizarCampo) return;
  itensColaterais(ataque).forEach((item) => {
    const col = item.colateral;
    let ligar = true;
    if (col.comTeste && col.salvamento) ligar = !rolarTesteColateral(ent, item, registrar);
    else if (registrar) registrar({ tipo: "rolagem", desc: `${ent.nome} fica ${col.condicao} (Efeito Colateral de "${ataque.nome || "habilidade"}")`, detalhe: "Aplicado automaticamente", total: col.condicao, tipoClasse: "hw" });
    atualizarCampo(ent.id, "*", (e) => mutarColateral(e, item.id, col.condicao, ligar));
  });
}
function desativarColaterais(ent, ataque, atualizarCampo) {
  if (!atualizarCampo) return;
  itensColaterais(ataque).forEach((item) => atualizarCampo(ent.id, "*", (e) => mutarColateral(e, item.id, item.colateral.condicao, false)));
}
function modificadoresPassivos(ent) {
  const acc = acumuladorPassivoVazio();
  const instancias = instanciasPassivasAtivas(ent);
  instancias.forEach(({ ataque, inst }) => {
    if (ataque?.equipamento && itemQuebrado(ataque)) return; // item quebrado não concede mais seus bônus
    const def = PODERES_PASSIVOS.find((p) => p.id === inst.tipoId);
    if (def) def.aplicar1(ent, inst, acc, ataque);
  });
  instancias.forEach(({ ataque, inst }) => {
    if (ataque?.equipamento && itemQuebrado(ataque)) return;
    const def = PODERES_PASSIVOS.find((p) => p.id === inst.tipoId);
    if (def) def.aplicar2(ent, inst, acc, ataque);
  });
  return acc;
}
function bonusAtributoPassivo(ent, key) {
  if (!ent) return 0;
  let total = 0;
  instanciasPassivasAtivas(ent).forEach(({ inst }) => {
    const def = PODERES_PASSIVOS.find((p) => p.id === inst.tipoId);
    if (!def) return;
    const acc = acumuladorPassivoVazio();
    def.aplicar1(ent, inst, acc);
    total += acc.atributos[key] || 0;
  });
  return total;
}
function tamanhoPassivo(ent) { return modificadoresPassivos(ent).tamanho; }
function deslocamentoIndexPara(ent, chave) {
  const acc = modificadoresPassivos(ent);
  if (chave === "voo") return acc.deslocamentos.voo > 0 ? acc.deslocamentos.voo : null;
  if (chave === "natacao") return acc.deslocamentos.natacao !== 0 ? acc.deslocamentos.natacao : null;
  if (chave === "escavacao") return acc.deslocamentos.escavacao !== -3 ? acc.deslocamentos.escavacao : null;
  return null;
}
function deslocamentoTextoDe(idx) {
  const gi = Math.max(-2, Math.min(24, Math.round(idx || 0)));
  return DESLOC_TABELA[gi + 2];
}

/* ---------- helpers de valores derivados ---------- */

function bonusVantagemToggle(ent, chave) {
  let total = 0;
  (ent?.vantagens || []).forEach((v) => {
    if (!v.ativo) return;
    const info = VANTAGENS.find((x) => x.nome === v.nome);
    if (!info || !info.mecanica || info.mecanica.modo !== "toggle") return;
    const alvos = info.mecanica.alvos || [];
    const escolhidas = v.periciasEscolhidas || [];
    let aplica = alvos.includes(chave) || escolhidas.includes(chave);
    if (info.mecanica.escolheDefesa && v.defesaEscolhida === chave) aplica = true;
    if (aplica) total += bonusDeGraduacao(info, v.graduacoes);
  });
  return total;
}
function vantagensCondicionaisPara(ent, chave) {
  return (ent?.vantagens || []).map((v) => ({ v, info: VANTAGENS.find((x) => x.nome === v.nome) }))
    .filter(({ info }) => info && info.mecanica && info.mecanica.modo === "condicional" && (info.mecanica.alvos || []).includes(chave));
}
function temVantagem(ent, nome) { return (ent?.vantagens || []).some((v) => v.nome === nome); }

function bonusPericia(ent, nomePericia) {
  if (!ent) return 0;
  // Fejonetto: tudo que usaria o bônus de Enganação passa a usar o de Persuasão no lugar.
  const nomeReal = nomePericia === "Enganação" && temCaracteristica(ent, "Fejonetto") ? "Persuasão" : nomePericia;
  const p = PERICIAS.find((x) => x.nome === nomeReal);
  if (!p) return 0;
  const passivos = modificadoresPassivos(ent);
  const bonusPassivo = (nomeReal === "Furtividade" ? passivos.furtividade : 0) + (passivos.periciasBonus?.[nomeReal] || 0);
  return attr(ent, p.atributo) + ((ent.periciaPontos && ent.periciaPontos[nomeReal]) || 0) + bonusVantagemToggle(ent, nomeReal) + calcModCondicoes(ent).testesGerais + bonusPassivo;
}
function melhorDe(ent, nomesPericias) {
  return Math.max(...nomesPericias.map((n) => bonusPericia(ent, n)));
}
function ajudaDisponivelPara(ent, chave) {
  return (ent?.buffsAjuda || []).find((b) => b.chave === chave) || null;
}
function somaEfeitoManobra(ent, tipo, chave) {
  return (ent?.efeitosManobra || []).filter((m) => m.tipo === tipo && (!chave || m.chave === chave)).reduce((s, m) => s + m.valor, 0);
}
function statDefesa(ent, key, cru = false) {
  if (!ent) return 0;
  let total;
  if ((key === "aparar" || key === "esquiva") && ent.lubridiando && !condicaoAtiva(ent, "Indefeso")) {
    let bonusEng = bonusPericia(ent, "Enganação");
    if (condicaoAtiva(ent, "Vulnerável")) bonusEng = Math.floor(bonusEng / 2);
    total = 10 + bonusEng;
  } else {
    let base = 0;
    if (key === "aparar") base = attr(ent, "luta");
    else if (key === "esquiva") base = attr(ent, "destreza");
    else if (key === "fortitude") base = attr(ent, "vigor");
    else if (key === "vontade") base = attr(ent, "prontidao");
    else if (key === "resistencia") base = attr(ent, "vigor");
    total = base + bonusVantagemToggle(ent, key);
    const passivo = modificadoresPassivos(ent);
    if (key === "aparar") total += passivo.aparar;
    if (key === "esquiva") total += passivo.esquiva;
  }
  const mods = calcModCondicoes(ent);
  if (key === "fortitude") total += mods.testesGerais + mods.fortitude + somaEfeitoManobra(ent, "agora");
  if (key === "vontade") total += mods.testesGerais + mods.vontade + somaEfeitoManobra(ent, "agora");
  if (key === "resistencia") total += mods.testesGerais + mods.resistencia + somaEfeitoManobra(ent, "agora");
  if (key === "aparar") total = aplicarAjusteDefesa(total + somaEfeitoManobra(ent, "cuidado", "aparar"), cru ? mods.apararAj.filter((a) => typeof a === "number") : mods.apararAj);
  if (key === "esquiva") total = aplicarAjusteDefesa(total + somaEfeitoManobra(ent, "cuidado", "esquiva"), cru ? mods.esquivaAj.filter((a) => typeof a === "number") : mods.esquivaAj);
  return total;
}
/* CD pra acertar Aparar/Esquiva: 10 + bônus. Vulnerável (e afins) = a CD inteira pela metade;
   Indefeso (e afins) = CD 1. (statDefesa continua devolvendo só o bônus, usado nos testes de quem defende.) */
function cdDefesa(ent, key) {
  if (key !== "aparar" && key !== "esquiva") return 10 + statDefesa(ent, key);
  const mods = calcModCondicoes(ent);
  const aj = key === "aparar" ? mods.apararAj : mods.esquivaAj;
  if (aj.includes("zero")) return 1;
  const cd = 10 + statDefesa(ent, key, true);
  // Lubridiar já reduz o bônus de Enganação pela metade se estiver Vulnerável: não corta duas vezes.
  return aj.includes("metade") && !ent?.lubridiando ? Math.floor(cd / 2) : cd;
}
/* Brutal (extra de Característica Aumentada): cada ponto soma +2 na CD quando um ATAQUE acerta crítico.
   Vale se o atributo da característica é o do teste de ataque (Luta corpo-a-corpo, Destreza à distância)
   ou o atributo do "Dano Baseado Em" do efeito. */
function bonusBrutal(ent, ataque, efeito) {
  const attrs = new Set();
  if (ataque?.tipoAcerto === "corpo") attrs.add("luta");
  if (ataque?.tipoAcerto === "distancia") attrs.add("destreza");
  if (efeito?.baseadoAtivo !== false && efeito?.atributoBase) attrs.add(efeito.atributoBase);
  let total = 0;
  instanciasPassivasAtivas(ent).forEach(({ ataque: a, inst }) => {
    if (a?.equipamento && itemQuebrado(a)) return;
    if (inst.tipoId !== "caracteristica" || !inst.extrasAtivos?.brutal) return;
    if (!attrs.has(inst.campos?.atributo)) return;
    total += 2 * Math.max(1, inst.extrasPontos?.brutal || 1);
  });
  return total;
}
/* ---------- resumo de bônus/penalidades pro histórico ---------- */
function fmtMods(notas) { const l = (notas || []).filter(Boolean); return l.length ? ` · Mods: ${l.join(", ")}` : ""; }
function notasCondicoesGerais(ent) {
  const n = [];
  Object.entries(ent?.condicoes || {}).forEach(([nome, qtd]) => {
    const ef = CONDICOES_LISTA.find((c) => c.nome === nome)?.efeito;
    if (ef?.testesGerais) n.push(`${nome} ${fmtBonus(ef.testesGerais * (qtd || 1))}`);
  });
  return n;
}
function notasModsDefesa(ent, key) {
  const n = [];
  const geral = ["fortitude", "vontade", "resistencia"].includes(key);
  Object.entries(ent?.condicoes || {}).forEach(([nome, qtd]) => {
    const ef = CONDICOES_LISTA.find((c) => c.nome === nome)?.efeito;
    if (!ef) return;
    const q = qtd || 1;
    if (geral) {
      const v = ((ef.testesGerais || 0) + (ef[key] || 0)) * q;
      if (v) n.push(`${nome} ${fmtBonus(v)}`);
    } else if (ef[key] === "zero") n.push(`${nome}: defesa em 1`);
    else if (ef[key] === "metade") n.push(`${nome}: defesa pela metade`);
    else if (typeof ef[key] === "number") n.push(`${nome} ${fmtBonus(ef[key] * q)}`);
  });
  (ent?.efeitosManobra || []).forEach((m) => {
    if (geral && m.tipo === "agora") n.push(`Agora! ${fmtBonus(m.valor)}`);
    if (!geral && m.tipo === "cuidado" && m.chave === key) n.push(`Cuidado ${fmtBonus(m.valor)}`);
  });
  const vt = bonusVantagemToggle(ent, key);
  if (vt) n.push(`Vantagem ${fmtBonus(vt)}`);
  if (!geral && (key === "aparar" || key === "esquiva")) {
    const p = modificadoresPassivos(ent);
    const v = key === "aparar" ? p.aparar : p.esquiva;
    if (v) n.push(`Habilidade passiva ${fmtBonus(v)}`);
  }
  return n;
}
const CHAVE_SALV = { "Fortitude": "fortitude", "Vontade": "vontade", "Resistência": "resistencia", "Aparar": "aparar", "Esquiva": "esquiva" };
/* Peculiaridade: a "chave" de um turno na iniciativa (rodada + posição) e a do turno imediatamente anterior. */
function chaveTurnoIniciativa(ini) { return (ini?.rodada || 1) * 1000 + (ini?.turnoAtual || 0); }
function chaveTurnoAnterior(ini) {
  const tam = (ini?.ordem || []).length;
  if ((ini?.turnoAtual || 0) > 0) return chaveTurnoIniciativa(ini) - 1;
  return Math.max(0, (ini?.rodada || 1) - 1) * 1000 + Math.max(0, tam - 1);
}
function notasPericiaEnt(ent, nomePericia) {
  const n = notasCondicoesGerais(ent);
  const vt = bonusVantagemToggle(ent, nomePericia);
  if (vt) n.push(`Vantagem ${fmtBonus(vt)}`);
  const p = modificadoresPassivos(ent);
  const bp = (nomePericia === "Furtividade" ? p.furtividade : 0) + (p.periciasBonus?.[nomePericia] || 0);
  if (bp) n.push(`Habilidade passiva ${fmtBonus(bp)}`);
  return n;
}
function computeBonusBase(ent, tipo, chave) {
  if (tipo === "atributo") return attr(ent, chave) + calcModCondicoes(ent).testesGerais;
  if (tipo === "pericia") return bonusPericia(ent, chave);
  if (tipo === "defesa") return statDefesa(ent, chave);
  return 0;
}
function pvMaxCalc(ent) { return (5 + attr(ent, "vigor")) * (ent?.nivel || 1); }
function nenMaxCalc(ent) { return (3 + attr(ent, "prontidao")) * (ent?.nivel || 1); }
function deslocamentoTexto(ent) {
  const g = Math.max(-2, Math.min(24, attr(ent, "agilidade") + modificadoresPassivos(ent).deslocamentos.base));
  return DESLOC_TABELA[g + 2];
}
function pontosPoderMax(ent) {
  const base = ent?.rotulo === "Invocação" ? 15 : 25;
  const complic = Math.max(0, Math.min(2, ent?.complicacoes?.pontos || 0));
  return base + (Math.max(1, ent?.nivel || 1) - 1) * 15 + complic;
}
function custoAtaque(a) {
  if (a.equipamento) return 0;
  return a.pp || 0;
}
function pontosPoderGastos(ent) {
  const custoAtr = Object.values(ent?.atributos || {}).reduce((s, v) => s + (v || 0), 0) * 2;
  const custoPer = Object.values(ent?.periciaPontos || {}).reduce((s, v) => s + (v || 0), 0) * 1;
  const custoVant = (ent?.vantagens || []).reduce((s, v) => s + (v.graduacoes || 1), 0) * 1;
  const custoHabilidades = (ent?.ataques || []).reduce((s, a) => s + custoAtaque(a), 0);
  return custoAtr + custoPer + custoVant + custoHabilidades;
}
function pontosEquipamentoMax(ent) {
  const eq = (ent?.vantagens || []).find((v) => v.nome === "Equipamento");
  return eq ? (eq.graduacoes || 1) * 5 : 0;
}
function pontosEquipamentoGastos(ent) {
  return (ent?.ataques || []).reduce((s, a) => s + (a.equipamento ? (a.pp || 0) : 0), 0);
}
function itemQuebrado(a) { return !!a?.equipamento && (a.pvItemMax || 0) > 0 && (a.pvItemAtual ?? a.pvItemMax) <= 0; }
function atributoMax(nivel) { return (nivel || 1) + 2; }
function periciaPontosMax(nivel) { return Math.max(1, Math.floor((nivel || 1) / 2)); }

const DEFESAS_OPCOES = [
  { key: "aparar", label: "Aparar" }, { key: "esquiva", label: "Esquiva" },
  { key: "fortitude", label: "Fortitude" }, { key: "vontade", label: "Vontade" }, { key: "resistencia", label: "Resistência" },
];
function salvBonus(ent, salvamento) {
  if (salvamento === "Fortitude") return statDefesa(ent, "fortitude");
  if (salvamento === "Vontade") return statDefesa(ent, "vontade");
  if (salvamento === "Aparar") return statDefesa(ent, "aparar");
  if (salvamento === "Esquiva") return statDefesa(ent, "esquiva");
  return statDefesa(ent, "resistencia");
}
function valorAlvoComoCD(ent, key) {
  if (!ent) return 10;
  if (key === "aparar" || key === "esquiva") return cdDefesa(ent, key);
  if (key === "fortitude" || key === "vontade" || key === "resistencia") return 10 + statDefesa(ent, key);
  return 10 + bonusPericia(ent, key);
}

const EFEITO_CATEGORIAS = ["Dano", "Cura", "Aflição", "Enfraquecer", "Camuflagem", "Nulificar", "Leitura Mental", "Mover Objetos"];
const SALVAMENTOS_ESCOLHA = ["Fortitude", "Vontade"];
const SALVAMENTOS_ESCOLHA_ALT = ["Fortitude", "Vontade", "Aparar", "Esquiva"];
const AFLICOES_G1 = ["Adoecido", "Caído", "Impedido", "Machucado", "Tonto", "Vulnerável"];
const AFLICOES_G2 = ["Atordoado", "Compelido", "Em chamas", "Envenenado", "Imóvel", "Indefeso", "Sangrando", "Em transe"];
const AFLICOES_G3 = ["Controlado", "Incapacitado", "Paralisado"];

function efeitoPadrao(categoria) {
  if (categoria === "Dano") return { categoria, graduacao: 0, baseadoAtivo: false, atributoBase: "", danoAdicional: 0 };
  if (categoria === "Cura") return { categoria, graduacao: 5 };
  if (categoria === "Aflição") return { categoria, salvamento: "Fortitude", graduacao: 5, condicaoExtra: false, resistenciaAlternativa: false, cumulativo: false, recuperacaoInstantanea: false, graus: 3, grau1: "", grau1b: "", grau2: "", grau2b: "", grau3: "", grau3b: "" };
  if (categoria === "Enfraquecer") return { categoria, salvamento: "Fortitude", graduacao: 5, caracteristica: "" };
  if (categoria === "Camuflagem") return { categoria, salvamento: "Fortitude", graduacao: 5, sentidos: [] };
  if (categoria === "Nulificar") return { categoria, graduacaoNulificar: 5, salvamento: "Vontade" };
  if (categoria === "Leitura Mental") return { categoria, graduacao: 5 };
  if (categoria === "Outros") return { categoria, texto: "" };
  if (categoria === "Mover Objetos") return { categoria, graduacao: 0, concentracao: false, objetos: [] };
  return { categoria };
}
function dadosEfeito(efeito, oponente, critico, brutal = 0) {
  const bonusCrit = critico ? 5 + brutal : 0;
  if (efeito.categoria === "Dano") return { bonus: statDefesa(oponente, "resistencia"), cd: 15 + (efeito.graduacao || 0) + bonusCrit, salvLabel: "Resistência" };
  if (efeito.categoria === "Cura") return { bonus: efeito.graduacao || 0, cd: 10, salvLabel: "Cura (CD 10)", quemRolaAtacante: true };
  if (efeito.categoria === "Aflição") return { bonus: salvBonus(oponente, efeito.salvamento), cd: 10 + (efeito.graduacao || 0) + bonusCrit, salvLabel: efeito.salvamento };
  if (efeito.categoria === "Enfraquecer") return { bonus: salvBonus(oponente, efeito.salvamento), cd: 10 + (efeito.graduacao || 0) + bonusCrit, salvLabel: efeito.salvamento };
  if (efeito.categoria === "Camuflagem") return { bonus: salvBonus(oponente, efeito.salvamento), cd: 15 + (efeito.graduacao || 0) + bonusCrit, salvLabel: efeito.salvamento };
  if (efeito.categoria === "Nulificar") { const sv = efeito.salvamento === "Fortitude" ? "Fortitude" : "Vontade"; return { bonus: efeito.graduacaoNulificar || 0, cd: 10 + statDefesa(oponente, sv.toLowerCase()), salvLabel: `${sv} do alvo`, quemRolaAtacante: true }; }
  if (efeito.categoria === "Leitura Mental") return { bonus: salvBonus(oponente, "Vontade"), cd: 10 + (efeito.graduacao || 0) + bonusCrit, salvLabel: "Vontade" };
  return { bonus: 0, cd: 10 };
}

function fmtBonus(n) { return (n >= 0 ? "+" : "") + n; }
function horaAgora() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}
function calcGraus(diff) {
  if (diff >= 0) return 1 + Math.floor(diff / 5);
  return -Math.floor((-diff - 1) / 5) - 1;
}
function rolarD20() { return Math.floor(Math.random() * 20) + 1; }
/* Bônus BASE de uma perícia, usado só na CD do Exigir Teste: atributo base + pontos da perícia.
   Não entra nada de características/passivos, vantagens situacionais (Atraente, Ambiente Favorito...)
   nem condições — só o que a ficha tem "de fábrica". */
function bonusBasePericia(ent, nomePericia) {
  if (!ent) return 0;
  const nomeReal = nomePericia === "Enganação" && temCaracteristica(ent, "Fejonetto") ? "Persuasão" : nomePericia;
  const p = PERICIAS.find((x) => x.nome === nomeReal);
  if (!p) return 0;
  return attrBase(ent, p.atributo) + ((ent.periciaPontos && ent.periciaPontos[nomeReal]) || 0);
}
/* Rola o teste exigido pela falha "Exigir Teste" de um efeito.
   CD = 10 + (pontos de Exigir Teste - 1) + bônus base da perícia escolhida.
   A rolagem soma o bônus COMPLETO da perícia (com todos os buffs/debuffs). Um natural 1 sempre falha.
   Passar libera todas as graduações do efeito; falhar cancela só aquele efeito.
   (Falhas antigas, sem perícia escolhida, usam o atributo que tinham até a ficha ser editada.) */
function rolarExigirTeste(ent, exigirTeste) {
  const pontos = Math.max(1, Number(exigirTeste?.graduacoes) || 1);
  const pericia = exigirTeste?.pericia || "";
  const atrLegado = exigirTeste?.atributo || "luta";
  const base = pericia ? bonusBasePericia(ent, pericia) : attrBase(ent, atrLegado);
  const cd = 10 + (pontos - 1) + base;
  const dado = rolarD20();
  const bonus = pericia ? bonusPericia(ent, pericia) : attr(ent, atrLegado);
  const total = dado + bonus;
  const falhaAutomatica = dado === 1;
  const sucesso = !falhaAutomatica && total >= cd;
  return { dado, bonus, total, cd, falhaAutomatica, sucesso, pericia };
}
function textoResultadoExigirTeste(r) {
  if (r.falhaAutomatica) return "Falha automática (1 natural) — efeito perdido";
  return r.sucesso ? "Sucesso — todas as graduações do efeito" : "Falhou — efeito perdido";
}
/* Aquecimento: o efeito começa com graduação reduzida e vai ganhando graduações até chegar na total em
   N turnos (3, 5 ou 10). "c" é quantas vezes o efeito já "aqueceu" (turnos de combate com ele ativo, se
   sustentado; usos, se instantâneo). Exemplos: 10 grad. em 3 turnos = 4, 7, 10; 10 grad. em 10 turnos =
   1, 2, ... 10; 5 grad. em 10 turnos = 1 e +1 a cada 2 turnos. */
function graduacaoAquecida(total, turnos, c) {
  const G = Math.max(0, Math.floor(total || 0));
  const N = Math.max(1, Number(turnos) || 3);
  const passos = Math.max(0, c || 0);
  if (G <= 1) return G;
  if (G >= N) {
    const ganho = Math.floor(G / N);
    const inicio = G - ganho * (N - 1);
    return Math.min(G, inicio + ganho * passos);
  }
  const intervalo = Math.max(1, Math.floor(N / G));
  return Math.min(G, 1 + Math.floor(passos / intervalo));
}
/* Devolve o efeito já com a graduação "aquecida". Se o efeito também tem Exigir Teste, quem passa no teste
   usa todas as graduações normalmente, então o Aquecimento não reduz nada. "snap" permite congelar a contagem
   (o modal de rolagem guarda a contagem de quando abriu). */
function comAquecimento(item, ent, snap) {
  if (!item?.aquecimento?.ativo || item?.exigirTeste?.ativo) return item;
  const c = ((snap || ent?.aquecimento || {})[item.id]) || 0;
  const out = { ...item };
  if (typeof item.graduacao === "number") out.graduacao = graduacaoAquecida(item.graduacao, item.aquecimento.turnos, c);
  if (typeof item.graduacaoNulificar === "number") out.graduacaoNulificar = graduacaoAquecida(item.graduacaoNulificar, item.aquecimento.turnos, c);
  return out;
}
function montarTeste(dado, bonus, cd, limiarCrit = 20) {
  const total = dado + bonus;
  const diff = total - cd;
  const graus = calcGraus(diff);
  const ehCrit = dado >= limiarCrit;
  let tipoClasse, grauLabel, grauTexto, desc;
  if (graus > 0) {
    tipoClasse = ehCrit ? "hc" : "hs";
    grauLabel = ehCrit ? "Natural 20!" : "Sucesso";
    grauTexto = graus + (graus === 1 ? " Grau de Sucesso" : " Graus de Sucesso");
    desc = diff === 0 ? "Passou exatamente na CD" : `Superou a CD por ${diff} pontos`;
  } else {
    const absG = Math.abs(graus);
    tipoClasse = absG >= 2 ? "hd" : "hw";
    grauLabel = "Falha";
    grauTexto = absG + (absG === 1 ? " Grau de Falha" : " Graus de Falha");
    desc = `Ficou abaixo da CD por ${Math.abs(diff)} pontos`;
  }
  return { dado, bonus, total, cd, diff, graus, tipoClasse, grauLabel, grauTexto, desc, ehCrit, sucesso: graus > 0 };
}
function grausAflicao(efeito) { return Math.max(1, Math.min(3, efeito?.graus ?? 3)); }
function textoAflicao(efeito, graus) {
  const nivel = Math.min(Math.abs(graus), grausAflicao(efeito));
  if (nivel === 0) return "Sem efeito";
  const par = (g, gb) => (efeito.condicaoExtra && gb ? `${g || "—"} ou ${gb || "—"}` : (g || "—"));
  if (nivel === 1) return `1 grau — ${par(efeito.grau1, efeito.grau1b)}`;
  if (nivel === 2) return `2 graus — ${par(efeito.grau2, efeito.grau2b)}`;
  return `3 graus — ${par(efeito.grau3, efeito.grau3b)}`;
}
const LEITURA_MENTAL_GRAUS = [
  "1º grau — Pensamentos superficiais: lê o que o alvo está pensando agora (transcende idiomas)",
  "2º grau — Pensamentos pessoais: pode fazer uma pergunta e recebe a resposta da mente do alvo (ou descobre que ele não sabe)",
  "3º grau — Memória: lê as lembranças do alvo com a exatidão de como ele se recorda delas, uma lembrança por rodada",
  "4º grau — Subconsciente: lê memórias que nem o alvo sabe conscientemente — reprimidas, traumas ou outras personalidades",
];
function textoLeituraMental(graus) {
  const nivel = Math.min(Math.abs(graus), 4);
  if (nivel === 0) return "Sem contato — o alvo resistiu";
  return LEITURA_MENTAL_GRAUS[nivel - 1];
}
function textoNulificar(graus) {
  if (graus <= 0) return "Sem efeito — não superou a defesa do alvo";
  if (graus === 1) return "1 grau: reduz a graduação de uma habilidade pela metade";
  if (graus === 2) return "2 graus: nulifica uma habilidade do alvo";
  if (graus === 3) return "3 graus: nulifica todas as habilidades de um tipo de Nen escolhido";
  return "4+ graus: nulifica tudo e deixa o alvo Indefeso";
}

/* ---------- helpers: graduação, duração, variáveis, desgastante ---------- */
/* Dano Baseado Em: graduação = atributo do atacante (ao vivo) + dano adicional. Sem a opção, é o campo normal. */
function graduacaoEfetiva(efeito, ent) {
  if (efeito?.categoria === "Dano" && efeito.baseadoAtivo && efeito.atributoBase) {
    return Math.max(0, attr(ent, efeito.atributoBase) + (efeito.danoAdicional || 0));
  }
  return efeito?.graduacao || 0;
}
function maiorGraduacaoEfeitos(efeitos, ent) {
  return Math.max(0, ...(efeitos || [])
    .filter((ef) => ef.categoria !== "Outros" && ef.categoria !== "Mover Objetos")
    .map((ef) => (ef.categoria === "Nulificar" ? (ef.graduacaoNulificar || 0) : graduacaoEfetiva(ef, ent))));
}
function graduacaoAtaque(ataque, ent) {
  if (ataque?.tipo === "passiva") return Math.max(0, ...passivosDe(ataque).map((p) => p.graduacao || 0));
  return maiorGraduacaoEfeitos(ataque?.efeitos, ent);
}

/* Durações: efeitos que acabam no início/fim do turno de alguém (normalmente de quem aplicou).
   ent.duracoes = [{ id, tipo: "condicao"|"atributo", nome|chave, valor, quando: "inicio"|"fim", turnoDeId, pular }].
   "pular": aplicado durante o próprio turno e com "fim" — o 1º fim de turno (o atual) não conta. */
function ehTurnoDe(iniciativa, id) {
  const ordem = iniciativa?.ordem || [];
  return ordem[iniciativa?.turnoAtual || 0]?.entidadeId === id;
}
function aplicarCondicaoTemporaria(atualizarCampo, alvo, nome, quando, turnoDeId, iniciativa) {
  const atuais = { ...(alvo.condicoes || {}) };
  atuais[nome] = (atuais[nome] || 0) + 1;
  atualizarCampo(alvo.id, "condicoes", atuais);
  atualizarCampo(alvo.id, "duracoes", [...(alvo.duracoes || []), {
    id: uid(), tipo: "condicao", nome, quando, turnoDeId, pular: quando === "fim" && ehTurnoDe(iniciativa, turnoDeId),
  }]);
}

/* Variáveis (Munição / Carga) — uma lista por ficha: ent.variaveis = [{ id, nome, tipo, atributo, valor }]. */
function maxVariavel(ent, v) { return Math.max(0, attr(ent, v?.atributo || "forca")); }
function valorVariavel(ent, v) {
  if (v?.tipo === "municao") return Math.max(0, Math.min(v.valor ?? maxVariavel(ent, v), maxVariavel(ent, v)));
  return Math.max(0, v?.valor ?? 0);
}
function valorInicialVariavel(ent, v) { return v?.tipo === "municao" ? maxVariavel(ent, v) : 0; }
/* Confere se a habilidade pode ser usada e calcula os novos valores (sem gravar nada). */
function aplicarUsoVariaveis(ent, ataque) {
  const usos = (ataque?.usoVariaveis || []).filter((u) => u.variavelId && u.delta);
  if (!usos.length) return { ok: true, variaveis: null };
  const vars = ent?.variaveis || [];
  const vals = {};
  vars.forEach((v) => { vals[v.id] = valorVariavel(ent, v); });
  for (const u of usos) {
    const v = vars.find((x) => x.id === u.variavelId);
    if (!v) continue;
    const novo = vals[v.id] + u.delta;
    if (novo < 0) return { ok: false, motivo: `${v.nome || "Variável"} insuficiente: tem ${vals[v.id]} e a habilidade gasta ${-u.delta}.` };
    vals[v.id] = v.tipo === "municao" ? Math.min(novo, maxVariavel(ent, v)) : novo;
  }
  return { ok: true, variaveis: vars.map((v) => ({ ...v, valor: vals[v.id] })) };
}

/* Falha Desgastante: reduz atributos de quem usa até o início do próximo turno dele.
   Automático = só reduz. Com teste = Fortitude ou Vontade CD 10 + graduação; passou, não sofre. */
function usarDesgastante(ent, ataque, atualizarCampo, registrar, animar) {
  const d = ataque?.desgastante;
  const reds = (d?.reducoes || []).filter((r) => r.atributo && (r.valor || 0) > 0);
  if (!d?.ativo || !reds.length || !atualizarCampo) return null;
  const rotulo = reds.map((r) => `-${r.valor} ${ATRIBUTOS.find((a) => a.k === r.atributo)?.l || r.atributo}`).join(", ");
  const nomeHab = ataque.nome || "Habilidade";
  let teste = null;
  if (d.modo === "teste") {
    const sal = d.salvamento || "Fortitude";
    const cd = 10 + graduacaoAtaque(ataque, ent);
    const dado = rolarD20();
    const bonus = salvBonus(ent, sal);
    const r = montarTeste(dado, bonus, cd);
    teste = { ...r, sal };
    if (registrar) registrar({ tipo: "rolagem", desc: `${ent.nome} testa Desgastante (${sal}) — "${nomeHab}"`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${r.total} vs CD ${cd}`, total: r.sucesso ? "Resistiu" : `Falhou — ${rotulo}`, tipoClasse: r.sucesso ? "hs" : "hw" });
    if (animar) animar({ modo: "simples", nome: `${ent.nome} — Desgastante`, foto: ent.foto, dado, bonus, total: r.total, cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Resistiu" : "Sofreu a redução" });
    if (r.sucesso) return { teste, aplicado: false, texto: `Resistiu ao Desgastante (${sal}) — nenhuma redução`, rotulo };
  }
  const novas = reds.map((r) => ({ id: uid(), tipo: "atributo", chave: r.atributo, valor: r.valor, quando: "inicio", turnoDeId: ent.id, origem: nomeHab }));
  atualizarCampo(ent.id, "duracoes", [...(ent.duracoes || []), ...novas]);
  if (registrar && d.modo !== "teste") registrar({ tipo: "rolagem", desc: `${ent.nome} sofre Desgastante — "${nomeHab}"`, detalhe: `${rotulo} até o início do próximo turno`, total: "Atributos reduzidos", tipoClasse: "hw" });
  return { teste, aplicado: true, texto: `${rotulo} até o início do seu próximo turno`, rotulo };
}

/* ---------- resultado visual ---------- */
function ResultadoCard({ r, efeito }) {
  if (!r) return null;
  return (
    <div>
      <div className="result-row">
        <div className={"result-cell" + (r.ehCrit ? " crit" : "")}><div className="cl">Dado</div><div className="cv">{r.dado}</div></div>
        <div className="result-cell"><div className="cl">Bônus</div><div className="cv">{r.bonus >= 0 ? "+" : ""}{r.bonus}</div></div>
        <div className="result-cell"><div className="cl">Total</div><div className="cv">{r.total}</div></div>
      </div>
      <div className="meta-row">
        <span>vs CD <span className="v">{r.cd}</span></span>
        <span>Diferença: <span className="v">{r.diff >= 0 ? "+" : ""}{r.diff}</span></span>
      </div>
      {r.ehCrit && <div className="crit-badge">★ Natural 20!</div>}
      <div className={"grau-card " + (r.graus > 0 ? "success" : Math.abs(r.graus) >= 2 ? "danger" : "warn")}>
        <div className="gl">{r.grauLabel}</div><div className="gn">{r.grauTexto}</div><div className="gd">{r.desc}</div>
      </div>
      {efeito && (
        <div className={"efeito-card " + efeito.classe}>
          <div className="efeito-t">{efeito.titulo}</div>
          {efeito.valor !== undefined && <div className="efeito-n">{efeito.valor}</div>}
          <div className="efeito-f">{efeito.formula}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- animação de rolagem (estilo Baldur's Gate 3) ---------- */
function DiceFace({ valor, rolando, tamanho = 64 }) {
  const [mostrado, setMostrado] = useState(valor);
  useEffect(() => {
    if (!rolando) { setMostrado(valor); return; }
    const iv = setInterval(() => setMostrado(1 + Math.floor(Math.random() * 20)), 55);
    return () => clearInterval(iv);
  }, [rolando, valor]);
  const critico = !rolando && valor === 20;
  const critFalha = !rolando && valor === 1;
  return (
    <div className={"anim-dado" + (rolando ? " girando" : "") + (critico ? " nat20" : "") + (critFalha ? " nat1" : "")} style={{ width: tamanho, height: tamanho }}>
      <span>{mostrado}</span>
    </div>
  );
}

function AnimRetrato({ foto, nome, quebrado, vencedor }) {
  return (
    <div className={"anim-retrato" + (vencedor ? " vencedor" : "") + (quebrado ? " quebrado" : "")}>
      {foto ? (
        <>
          <img className="metade esq" src={foto} alt="" />
          <img className="metade dir" src={foto} alt="" />
        </>
      ) : (
        <div className="anim-retrato-vazio">{(nome || "?").trim().slice(0, 1).toUpperCase()}</div>
      )}
      <svg className="rachadura" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="50,0 44,18 58,26 38,42 54,52 34,66 47,100" />
        <polyline points="20,8 33,32 14,48 28,62 12,78" />
      </svg>
    </div>
  );
}

/* aplica a classe "quebrado" após o retrato já estar montado, para o corte animar */
function useAtraso(ativo, ms) {
  const [valor, setValor] = useState(false);
  useEffect(() => {
    if (!ativo) { setValor(false); return; }
    const t = setTimeout(() => setValor(true), ms);
    return () => clearTimeout(t);
  }, [ativo, ms]);
  return valor;
}

function AnimacaoEvento({ evento, onTerminar }) {
  const [fase, setFase] = useState("rolando");
  useEffect(() => {
    const timers = [];
    if (evento.modo === "oposta" || evento.modo === "cd") {
      timers.push(setTimeout(() => setFase("revelado"), 850));
      timers.push(setTimeout(() => setFase("soma"), 1400));
      timers.push(setTimeout(() => setFase("colisao"), 2300));
      timers.push(setTimeout(() => setFase("resultado"), 2750));
      timers.push(setTimeout(() => setFase("saindo"), 4500));
      timers.push(setTimeout(() => onTerminar(evento.id), 5050));
    } else {
      timers.push(setTimeout(() => setFase("revelado"), 750));
      timers.push(setTimeout(() => setFase("soma"), 1250));
      timers.push(setTimeout(() => setFase("resultado"), 1850));
      timers.push(setTimeout(() => setFase("saindo"), 3400));
      timers.push(setTimeout(() => onTerminar(evento.id), 3950));
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.id]);

  const rolando = fase === "rolando";
  const mostrarSoma = fase !== "rolando";
  const mostrarResultado = fase === "resultado" || fase === "saindo";

  if (evento.modo === "oposta") {
    const quebradoA = mostrarResultado && evento.vencedor === "B";
    const quebradoB = mostrarResultado && evento.vencedor === "A";
    return (
      <div className={"anim-card anim-oposta fase-" + fase}>
        <div className={"anim-lado esquerda" + (evento.vencedor === "A" ? " lado-vencedor" : evento.vencedor === "B" ? " lado-perdedor" : "")}>
          <AnimRetratoComAtraso foto={evento.fotoA} nome={evento.nomeA} quebrar={quebradoA} vencedor={evento.vencedor === "A"} />
          <div className="anim-nome">{evento.nomeA}</div>
          <DiceFace tamanho={46} valor={evento.dadoA} rolando={rolando} />
          {mostrarSoma && (
            <div className="anim-soma pequeno">
              <span>{evento.dadoA} {evento.bonusA >= 0 ? "+" : ""}{evento.bonusA}</span>
              <span className="total">{evento.totalA}</span>
            </div>
          )}
        </div>
        <div className="anim-vs">
          {fase === "colisao" && <div className="anim-flash" />}
          VS
        </div>
        <div className={"anim-lado direita" + (evento.vencedor === "B" ? " lado-vencedor" : evento.vencedor === "A" ? " lado-perdedor" : "")}>
          <AnimRetratoComAtraso foto={evento.fotoB} nome={evento.nomeB} quebrar={quebradoB} vencedor={evento.vencedor === "B"} />
          <div className="anim-nome">{evento.nomeB}</div>
          <DiceFace tamanho={46} valor={evento.dadoB} rolando={rolando} />
          {mostrarSoma && (
            <div className="anim-soma pequeno">
              <span>{evento.dadoB} {evento.bonusB >= 0 ? "+" : ""}{evento.bonusB}</span>
              <span className="total">{evento.totalB}</span>
            </div>
          )}
        </div>
        {mostrarResultado && (
          <div className="anim-veredito" style={{ position: "absolute", left: 0, right: 0, bottom: -30 }}>
            {evento.vencedor === "empate" ? "Empate!" : `${evento.vencedor === "A" ? evento.nomeA : evento.nomeB} leva a melhor!`}
          </div>
        )}
      </div>
    );
  }

  if (evento.modo === "cd") {
    const quebradoAtacante = mostrarResultado && !evento.sucesso;
    const quebradoAlvo = mostrarResultado && evento.sucesso;
    return (
      <div className={"anim-card anim-oposta fase-" + fase}>
        <div className={"anim-lado esquerda" + (mostrarResultado ? (evento.sucesso ? " lado-vencedor" : " lado-perdedor") : "")}>
          <AnimRetratoComAtraso foto={evento.foto} nome={evento.nome} quebrar={quebradoAtacante} vencedor={mostrarResultado && evento.sucesso} />
          <div className="anim-nome">{evento.nome}</div>
          <DiceFace tamanho={46} valor={evento.dado} rolando={rolando} />
          {mostrarSoma && (
            <div className="anim-soma pequeno">
              <span>{evento.dado} {evento.bonus >= 0 ? "+" : ""}{evento.bonus}</span>
              <span className="total">{evento.total}</span>
            </div>
          )}
        </div>
        <div className="anim-vs">
          {fase === "colisao" && <div className="anim-flash" />}
          VS
        </div>
        <div className={"anim-lado direita" + (mostrarResultado ? (!evento.sucesso ? " lado-vencedor" : " lado-perdedor") : "")}>
          <AnimRetratoComAtraso foto={evento.fotoAlvo} nome={evento.nomeAlvo} quebrar={quebradoAlvo} vencedor={mostrarResultado && !evento.sucesso} />
          <div className="anim-nome">{evento.nomeAlvo}</div>
          <div className="anim-dado" style={{ width: 46, height: 46 }}><span style={{ fontSize: "0.85rem" }}>CD</span></div>
          {mostrarSoma && (
            <div className="anim-soma pequeno">
              <span className="total">{evento.cd}</span>
            </div>
          )}
        </div>
        {mostrarResultado && (
          <div className="anim-veredito" style={{ position: "absolute", left: 0, right: 0, bottom: -30 }}>
            {evento.grauTexto || (evento.sucesso ? "Sucesso!" : "Falha")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={"anim-card anim-simples fase-" + fase}>
      <div className="anim-nome">{evento.nome}</div>
      <DiceFace valor={evento.dado} rolando={rolando} />
      {mostrarSoma && (
        <div className="anim-soma">
          <span>{evento.dado}</span>
          <span className="op">{evento.bonus >= 0 ? "+" : ""}{evento.bonus}</span>
          <span className="op">=</span>
          <span className="total">{evento.total}</span>
        </div>
      )}
      {mostrarResultado && (
        evento.cd !== undefined && evento.cd !== null ? (
          <div className={"anim-resultado" + (evento.ehCrit ? " crit" : evento.sucesso ? " sucesso" : " falha")}>
            <div className="cd-linha">vs CD {evento.cd}</div>
            <div className="grau">{evento.grauTexto}</div>
          </div>
        ) : (
          <div className="anim-resultado sucesso">
            <div className="cd-linha">{evento.rotulo || "Resultado"}</div>
            <div className="grau">{evento.total}</div>
          </div>
        )
      )}
    </div>
  );
}

/* pequeno wrapper para dar 1 frame antes de "quebrar" o retrato, garantindo a transição CSS */
function AnimRetratoComAtraso({ foto, nome, quebrar, vencedor }) {
  const quebrado = useAtraso(quebrar, 40);
  return <AnimRetrato foto={foto} nome={nome} quebrado={quebrado} vencedor={vencedor} />;
}

function AnimacaoOverlay({ eventos, onTerminar }) {
  if (!eventos || eventos.length === 0) return null;
  return (
    <div className="anim-overlay-wrap">
      {eventos.map((ev) => <AnimacaoEvento key={ev.id} evento={ev} onTerminar={onTerminar} />)}
    </div>
  );
}

/* ---------- modal de descrição / ativação de vantagem ---------- */
/* ---------- modal de confirmação (ex: excluir ficha) ---------- */
/* ---------- select com busca ----------
   Substituto de <SearchableSelect> que funciona igual (mesmo value, mesmo onChange recebendo um
   evento com .target.value) — então dá pra trocar <SearchableSelect>...</SearchableSelect> por
   <SearchableSelect>...</SearchableSelect> sem mexer no resto do código. Ao clicar,
   abre uma lista; digitar filtra pelas opções que COMEÇAM com o texto digitado. */
function normalizarBusca(txt) {
  return (txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function SearchableSelect({ value, onChange, children, style, disabled, placeholder, listaCheia }) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState(null);
  const [busca, setBusca] = useState("");
  const [destacado, setDestacado] = useState(0);
  const ref = useRef(null);

  const opcoes = React.Children.toArray(children)
    .filter((c) => c && c.props && c.props.value !== undefined)
    .map((c) => ({ value: c.props.value, label: typeof c.props.children === "string" ? c.props.children : String(c.props.children ?? c.props.value) }));

  const atual = opcoes.find((o) => o.value === value);
  const filtradas = busca ? opcoes.filter((o) => normalizarBusca(o.label).startsWith(normalizarBusca(busca))) : opcoes;

  useEffect(() => {
    if (!aberto) return;
    const aoClicar = (ev) => { if (ref.current && !ref.current.contains(ev.target)) { setAberto(false); setBusca(""); } };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  /* listaCheia (seletores de alvo): a lista abre com toda a altura que couber na tela (para baixo, ou para cima se
     faltar espaço) e só rola se mesmo assim não couber. Fica "fixa" na tela para o modal não cortar a lista. */
  React.useLayoutEffect(() => {
    if (!aberto || !listaCheia) { setPos(null); return; }
    const calcular = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const abaixo = vh - r.bottom - 12;
      const acima = r.top - 12;
      const paraCima = abaixo < 220 && acima > abaixo;
      setPos(paraCima
        ? { bottom: vh - r.top + 4, left: r.left, width: r.width, maxHeight: Math.max(120, acima) }
        : { top: r.bottom + 4, left: r.left, width: r.width, maxHeight: Math.max(120, abaixo) });
    };
    calcular();
    window.addEventListener("resize", calcular);
    window.addEventListener("scroll", calcular, true);
    return () => { window.removeEventListener("resize", calcular); window.removeEventListener("scroll", calcular, true); };
  }, [aberto, listaCheia]);

  const escolher = (opt) => {
    onChange({ target: { value: opt.value } });
    setAberto(false);
    setBusca("");
  };
  const aoTeclar = (ev) => {
    if (ev.key === "ArrowDown") { ev.preventDefault(); setAberto(true); setDestacado((d) => Math.min(d + 1, filtradas.length - 1)); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setDestacado((d) => Math.max(d - 1, 0)); }
    else if (ev.key === "Enter") { ev.preventDefault(); if (aberto && filtradas[destacado]) escolher(filtradas[destacado]); }
    else if (ev.key === "Escape") { setAberto(false); setBusca(""); }
  };

  return (
    <div className="ssel" ref={ref} style={style}>
      <input
        type="text"
        disabled={disabled}
        value={aberto ? busca : (atual?.label ?? "")}
        placeholder={placeholder || atual?.label || ""}
        onFocus={() => { setAberto(true); setBusca(""); setDestacado(0); }}
        onClick={() => { setAberto(true); setBusca(""); setDestacado(0); }}
        onChange={(e) => { setBusca(e.target.value); setDestacado(0); setAberto(true); }}
        onKeyDown={aoTeclar}
        readOnly={disabled}
      />
      {aberto && !disabled && (
        <div className="ssel-lista" style={listaCheia && pos ? { position: "fixed", top: pos.top ?? "auto", bottom: pos.bottom ?? "auto", left: pos.left, width: pos.width, right: "auto", maxHeight: pos.maxHeight } : undefined}>
          {filtradas.length === 0 && <div className="ssel-vazio">Nada encontrado…</div>}
          {filtradas.map((o, i) => (
            <div key={String(o.value)} className={"ssel-opt" + (i === destacado ? " destacado" : "")}
              onMouseEnter={() => setDestacado(i)}
              onMouseDown={(ev) => { ev.preventDefault(); escolher(o); }}>
              {o.label || <>&nbsp;</>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmModal({ titulo, mensagem, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", perigo = true, onConfirmar, onCancelar }) {
  return (
    <div className="modal-backdrop" onClick={(ev) => { if (ev.target === ev.currentTarget) onCancelar(); }}>
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div className="modal-head"><span className="mt">{titulo}</span><button className="modal-close" onClick={onCancelar}>×</button></div>
        <div className="modal-desc">{mensagem}</div>
        <div className="grid2">
          <button className="btn btn-ghost" onClick={onCancelar}>{textoCancelar}</button>
          <button className={"btn " + (perigo ? "btn-danger" : "btn-accent")} onClick={onConfirmar}>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  );
}

function VantagemModal({ ctx, onFechar, onToggle }) {
  const { entidade, vantagem, info, editavel } = ctx;
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="modal-box">
        <div className="modal-head"><span className="mt">{vantagem.nome}</span><button className="modal-close" onClick={onFechar}>×</button></div>
        <div className="modal-desc">{info?.desc}</div>
        {vantagem.graduacoes > 1 && <div className="field-note">Graduações: {vantagem.graduacoes}</div>}
        {(vantagem.periciasEscolhidas || []).some(Boolean) && <div className="field-note">Perícias escolhidas: {vantagem.periciasEscolhidas.filter(Boolean).join(", ")}</div>}
        {vantagem.textoExtra != null && <div className="field-note">Alvo: {vantagem.textoExtra || "não definido"}</div>}
        {editavel && info?.mecanica?.modo === "toggle" && (
          <button className={"btn btn-block " + (vantagem.ativo ? "btn-accent" : "btn-ghost")} onClick={() => onToggle(entidade.id, vantagem.id, !vantagem.ativo)}>
            {vantagem.ativo ? "Ativada — clique para desativar" : "Desativada — clique para ativar"}
          </button>
        )}
        {info?.mecanica?.modo === "condicional" && <div className="field-note">Esta vantagem aparece como opção ao rolar {info.mecanica.alvos.join(", ")}.</div>}
      </div>
    </div>
  );
}

/* ---------- Ponto Fraco: janela do dono da habilidade ---------- */
function PontoFracoJanela({ origem, entidades, pf, nomeHabilidade, onFechar, registrar, animar, enviarPontoFraco }) {
  const [sel, setSel] = useState({});
  const [res, setRes] = useState(null);
  const alvos = entidades.filter((e) => e.id !== origem.id && e.oponente);
  const rolar = () => {
    const marcados = alvos.filter((a) => sel[a.id]);
    if (!marcados.length || res) return;
    const bEng = bonusPericia(origem, "Enganação");
    const dEng = rolarD20();
    const totEng = dEng + bEng;
    const resultados = marcados.map((a) => {
      const b = bonusPericia(a, "Investigação");
      const d = rolarD20();
      return { id: a.id, nome: a.nome, dado: d, bonus: b, total: d + b, sucesso: d + b >= totEng };
    });
    setRes({ dEng, bEng, totEng, resultados });
    const passaram = resultados.filter((r) => r.sucesso);
    if (passaram.length && enviarPontoFraco) {
      enviarPontoFraco(passaram.map((r) => ({ alvoId: r.id, alvoNome: r.nome, deNome: origem.nome, habilidade: nomeHabilidade, texto: pf.texto || "" })));
    }
    registrar({
      tipo: "rolagem",
      desc: `${origem.nome} expõe o Ponto Fraco de "${nomeHabilidade}"`,
      detalhe: `Enganação d20(${dEng}) ${fmtBonus(bEng)} = ${totEng} vs Investigação: ${resultados.map((r) => `${r.nome} ${r.total}`).join(" · ")}`,
      total: passaram.length ? `${passaram.length} de ${resultados.length} perceberam` : "Ninguém percebeu",
      tipoClasse: passaram.length ? "hs" : "hw",
    });
    if (animar) animar({ modo: "simples", nome: `${origem.nome} — Enganação (Ponto Fraco)`, foto: origem.foto, dado: dEng, bonus: bEng, total: totEng, rotulo: "Enganação" });
  };
  return (
    <div className="modal-backdrop" onClick={(ev) => { if (ev.target === ev.currentTarget) onFechar(); }}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div className="modal-head"><span className="mt">Ponto Fraco — {nomeHabilidade || "Habilidade"}</span><button className="modal-close" onClick={onFechar} title="Fechar sem rolar">×</button></div>
        {!res && (
          <>
            <div className="field-note" style={{ marginBottom: 8 }}>Marque as criaturas engajadas que vão tentar notar o ponto fraco. Cada uma faz Investigação contra um único teste de Enganação seu. Fechar no × não rola nada.</div>
            <div className="subcard2" style={{ marginBottom: 12 }}>
              {alvos.length === 0 && <div className="field-note">Nenhuma criatura engajada.</div>}
              {alvos.map((a) => (
                <label key={a.id} className="checkbox-row">
                  <input type="checkbox" checked={!!sel[a.id]} onChange={(ev) => setSel((x) => ({ ...x, [a.id]: ev.target.checked }))} />
                  {a.nome}
                </label>
              ))}
            </div>
            <button className="btn btn-accent btn-block" disabled={!alvos.some((a) => sel[a.id])} onClick={rolar}>⚄ Rolar</button>
          </>
        )}
        {res && (
          <>
            <div className="grau-card warn" style={{ marginBottom: 10 }}>
              <div className="gl">Enganação de {origem.nome}</div>
              <div className="gn">d20({res.dEng}) {fmtBonus(res.bEng)} = {res.totEng}</div>
            </div>
            {res.resultados.map((r) => (
              <div key={r.id} className={"efeito-card " + (r.sucesso ? "dano" : "ok")} style={{ marginBottom: 6 }}>
                <div className="efeito-t">{r.nome}: Investigação d20({r.dado}) {fmtBonus(r.bonus)} = {r.total}</div>
                <div className="efeito-f">{r.sucesso ? "Percebeu o ponto fraco (o texto aparece na tela dele)" : "Não percebeu"}</div>
              </div>
            ))}
            <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={onFechar}>Fechar</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- modal de rolagem ---------- */
function RollModal({ contexto, entidades, onFechar, registrar, animar, aplicarDano, atualizarCampo, enviarPontoFraco, iniciativa }) {
  const [escolha, setEscolha] = useState(null);
  const [cdManual, setCdManual] = useState(15);
  const [oponenteId, setOponenteId] = useState("");
  const [oponentesArea, setOponentesArea] = useState({});
  const [statOponente, setStatOponente] = useState("");
  const [resultado, setResultado] = useState(null);
  const [ultimoRoll, setUltimoRoll] = useState(null);
  const [ataqueAcertoR, setAtaqueAcertoR] = useState(null);
  const [efeitosR, setEfeitosR] = useState({});
  const [condMarcadas, setCondMarcadas] = useState({});
  const [agarrarMarcado, setAgarrarMarcado] = useState(false);
  const [agarraoR, setAgarraoR] = useState(null);
  const [usarBonusDescanso, setUsarBonusDescanso] = useState(false);
  const [usarBonusTreino, setUsarBonusTreino] = useState(false);
  const [exigirTesteR, setExigirTesteR] = useState({});
  const [esquivaArea, setEsquivaArea] = useState({});
  const [desgastanteR, setDesgastanteR] = useState(null);
  const [pfAberto, setPfAberto] = useState(() => contexto.tipo === "ataque" && !!contexto.ataque?.pontoFraco?.ativo);
  // Se uma variável (Munição/Carga) não aguenta o uso, a habilidade não pode ser usada — checado uma vez, na abertura.
  const [bloqueioVar] = useState(() => {
    if (contexto.tipo !== "ataque") return null;
    const o = entidades.find((e) => e.id === contexto.origem.id) || contexto.origem;
    const r = aplicarUsoVariaveis(o, contexto.ataque);
    return r.ok ? null : r.motivo;
  });

  const origemAtual = entidades.find((e) => e.id === contexto.origem.id) || contexto.origem;
  // Aquecimento: a contagem de quando o modal abriu fica congelada (usar o efeito sobe a contagem para o próximo uso).
  const [aquecSnap] = useState(() => ({ ...(origemAtual.aquecimento || {}) }));
  const oponente = entidades.find((e) => e.id === oponenteId);
  const ehAtaque = contexto.tipo === "ataque";
  const fotoAtq = (ehAtaque && contexto.ataque?.imagem) || origemAtual.foto; // a imagem da habilidade substitui o retrato na animação
  const isArea = ehAtaque && contexto.ataque?.tipoAcerto === "area";
  const alvosArea = entidades.filter((e) => e.id !== origemAtual.id && oponentesArea[e.id]);
  const fechar = () => onFechar();

  const chaveCondicional = ehAtaque ? "ataque" : contexto.chave;
  const condicionaisDisponiveis = vantagensCondicionaisPara(origemAtual, chaveCondicional);
  const bonusCondicionalTotal = condicionaisDisponiveis.reduce((s, { v, info }) => s + (condMarcadas[v.id] ? bonusDeGraduacao(info, v.graduacoes) : 0), 0);
  const ajudaAtiva = atualizarCampo ? ajudaDisponivelPara(origemAtual, chaveCondicional) : null;
  const consumirAjudaSeHouver = () => { if (ajudaAtiva && atualizarCampo) atualizarCampo(origemAtual.id, "buffsAjuda", (origemAtual.buffsAjuda || []).filter((b) => b.id !== ajudaAtiva.id)); };

  const notasSimples = (alvoRolagem) => {
    const n = [];
    if (contexto.tipo === "defesa") n.push(...notasModsDefesa(origemAtual, contexto.chave));
    else {
      n.push(...notasCondicoesGerais(origemAtual));
      const vt = bonusVantagemToggle(origemAtual, contexto.chave);
      if (vt) n.push(`Vantagem ${fmtBonus(vt)}`);
    }
    if (bonusCondicionalTotal) n.push(`Vantagem condicional ${fmtBonus(bonusCondicionalTotal)}`);
    if (bonusDescansoValor) n.push("Bônus de descanso +2");
    if (ajudaAtiva) n.push(`Ajuda de ${ajudaAtiva.deNome} ${fmtBonus(ajudaAtiva.bonus)}`);
    if (alvoRolagem && CHAVE_SALV[statOponente]) n.push(...notasModsDefesa(alvoRolagem, CHAVE_SALV[statOponente]).map((t) => `alvo: ${t}`));
    else if (alvoRolagem && ["aparar", "esquiva", "fortitude", "vontade", "resistencia"].includes(statOponente)) n.push(...notasModsDefesa(alvoRolagem, statOponente).map((t) => `alvo: ${t}`));
    return n;
  };
  const rolarSimples = (bonus, cd, alvoRolagem) => {
    const dado = rolarD20();
    const critP = contexto.tipo === "pericia" ? bonusCriticoPericia(origemAtual, contexto.chave, dado) : 0;
    const bonusFinal = bonus + (ajudaAtiva ? ajudaAtiva.bonus : 0) + critP;
    const r = montarTeste(dado, bonusFinal, cd, critP ? limiarCriticoPericia(origemAtual, contexto.chave) : 20);
    setResultado(r);
    setUltimoRoll({ tipo: "simples", bonus: bonusFinal, cd, alvoRolagem });
    consumirAjudaSeHouver();
    registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} testa ${contexto.label}`,
      detalhe: `d20(${dado}) ${fmtBonus(bonusFinal)}${ajudaAtiva ? ` (com ajuda de ${ajudaAtiva.deNome})` : ""} = ${r.total} vs CD ${cd}${fmtMods([...notasSimples(alvoRolagem), ...(critP ? ["Crítico aprimorado +5"] : [])])}`,
      total: r.grauTexto, tipoClasse: r.tipoClasse,
    });
    if (animar) {
      if (alvoRolagem) {
        animar({ modo: "cd", nome: origemAtual.nome, foto: fotoAtq, nomeAlvo: alvoRolagem.nome, fotoAlvo: alvoRolagem.foto, dado, bonus: bonusFinal, total: r.total, cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.grauTexto });
      } else {
        animar({ modo: "simples", nome: `${origemAtual.nome} — ${contexto.label}`, foto: fotoAtq, dado, bonus: bonusFinal, total: r.total, cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.grauTexto });
      }
    }
  };

  const infoAtaque = () => {
    const a = contexto.ataque;
    const mods = calcModCondicoes(origemAtual);
    const penalCaido = condicaoAtiva(origemAtual, "Caído") ? -5 : 0;
    const nossoAlvoBuff = (oponente?.efeitosManobra || []).find((m) => m.tipo === "nossoAlvo");
    const bonusVant = bonusVantagemToggle(origemAtual, "ataque") + bonusCondicionalTotal + (ajudaAtiva ? ajudaAtiva.bonus : 0) + (origemAtual.mirando ? 10 : 0) + mods.testesGerais + (nossoAlvoBuff ? nossoAlvoBuff.valor : 0);
    if (a.tipoAcerto === "corpo") return { bonus: attr(origemAtual, "luta") + bonusVant + penalCaido, defKey: "aparar", defLabel: "Aparar" };
    if (a.tipoAcerto === "distancia") {
      const usaAparar = !!modificadoresPassivos(oponente).temDeflexao;
      return { bonus: attr(origemAtual, "destreza") + bonusVant, defKey: usaAparar ? "aparar" : "esquiva", defLabel: usaAparar ? "Aparar (Deflexão)" : "Esquiva" };
    }
    return null;
  };

  const treinoDisponivel = ehAtaque && !!(origemAtual.descansoAtivos || {}).treinar;
  const bonusTreinoValor = usarBonusTreino && treinoDisponivel ? 2 : 0;
  const consumirBonusTreino = () => {
    if (!usarBonusTreino || !treinoDisponivel || !atualizarCampo) return;
    atualizarCampo(origemAtual.id, "descansoAtivos", { ...(origemAtual.descansoAtivos || {}), treinar: false });
  };

  const testesExigidos = ehAtaque ? exigirTestesDe(contexto.ataque) : [];
  // Efeito cujo Exigir Teste falhou: não funciona nesta ação (a falha antiga, da habilidade inteira, derruba todos).
  const falhouTeste = (ef) => !!exigirTesteR && (exigirTesteR.legado?.sucesso === false || exigirTesteR[ef?.id]?.sucesso === false);
  const renderExigirTestes = (mb) => testesExigidos.map((it) => {
    const r = exigirTesteR?.[it.id];
    return (
      <div key={it.id} className="subcard2" style={{ marginBottom: mb }}>
        <div className="section-title">Exigir Teste — {it.rotulo}</div>
        {!r && <div className="field-note">Rolando o teste…</div>}
        {r && (
          <div className={"grau-card " + (r.sucesso ? "success" : "warn")}>
            <div className="gl">d20({r.dado}) {fmtBonus(r.bonus)} = {r.total} vs CD {r.cd}{r.pericia ? ` (${r.pericia})` : ""}</div>
            <div className="gn">{textoResultadoExigirTeste(r)}</div>
          </div>
        )}
      </div>
    );
  });
  const notasAcerto = (info) => {
    const n = [];
    if (origemAtual.mirando) n.push("Mirar +10");
    n.push(...notasCondicoesGerais(origemAtual));
    if (contexto.ataque?.tipoAcerto === "corpo" && condicaoAtiva(origemAtual, "Caído")) n.push("Caído -5");
    const vt = bonusVantagemToggle(origemAtual, "ataque");
    if (vt) n.push(`Vantagem ${fmtBonus(vt)}`);
    if (bonusCondicionalTotal) n.push(`Vantagem condicional ${fmtBonus(bonusCondicionalTotal)}`);
    if (ajudaAtiva) n.push(`Ajuda de ${ajudaAtiva.deNome} ${fmtBonus(ajudaAtiva.bonus)}`);
    const nossoAlvo = (oponente?.efeitosManobra || []).find((m) => m.tipo === "nossoAlvo");
    if (nossoAlvo) n.push(`Nosso Alvo ${fmtBonus(nossoAlvo.valor)}`);
    if (bonusTreinoValor) n.push("Treinamento +2");
    n.push(...notasModsDefesa(oponente, info.defKey).map((t) => `alvo: ${t}`));
    return n;
  };
  const rolarAcerto = () => {
    const info = infoAtaque();
    const nossoAlvoBuff = (oponente?.efeitosManobra || []).find((m) => m.tipo === "nossoAlvo");
    const consumirNossoAlvo = () => { if (nossoAlvoBuff && atualizarCampo) atualizarCampo(oponente.id, "efeitosManobra", (oponente.efeitosManobra || []).filter((m) => m.id !== nossoAlvoBuff.id)); };
    if (!info) {
      setAtaqueAcertoR("auto");
      registrar({ tipo: "rolagem", desc: `${origemAtual.nome} usa "${contexto.ataque.nome}" em ${oponente.nome}`, detalhe: "Sem rolagem de acerto — vai direto para os efeitos", total: "Aplica efeitos", tipoClasse: "hs" });
      return;
    }
    const bonusFinal = info.bonus + bonusTreinoValor;
    const dado = rolarD20();
    const defVal = cdDefesa(oponente, info.defKey);
    const limiar = limiarCritico(origemAtual, contexto.ataque?.id);
    const r = montarTeste(dado, bonusFinal, defVal, limiar);
    setAtaqueAcertoR(r);
    setUltimoRoll({ tipo: "acerto", bonus: bonusFinal, cd: defVal, limiar });
    consumirAjudaSeHouver();
    consumirNossoAlvo();
    consumirBonusTreino();
    if (atualizarCampo && origemAtual.mirando) atualizarCampo(origemAtual.id, "mirando", false);
    registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} ataca ${oponente.nome} com "${contexto.ataque.nome}"`,
      detalhe: `d20(${dado}) ${fmtBonus(bonusFinal)}${ajudaAtiva ? ` (com ajuda de ${ajudaAtiva.deNome})` : ""}${bonusTreinoValor ? " (com bônus de Treinamento)" : ""} = ${r.total} vs ${info.defLabel} ${defVal}${fmtMods(notasAcerto(info))}`,
      total: r.sucesso ? "Acertou" : "Errou", tipoClasse: r.tipoClasse,
    });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: fotoAtq, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus: bonusFinal, total: r.total, cd: defVal, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Acertou!" : "Errou" });
  };

  /* pontos de sorte: refaz a ÚLTIMA rolagem de d20 (mesmo bônus/CD) e fica com o maior dos dois totais */
  const pontosSorteMaxOrigem = modificadoresPassivos(origemAtual).pontosSorteMax;
  const pontosSorteDisponiveis = pontosSorteMaxOrigem > 0 ? (origemAtual.pontosSorteAtual ?? pontosSorteMaxOrigem) : 0;
  const rerolarComSorte = () => {
    if (!ultimoRoll || pontosSorteDisponiveis <= 0 || !atualizarCampo) return;
    atualizarCampo(origemAtual.id, "pontosSorteAtual", Math.max(0, pontosSorteDisponiveis - 1));
    const dado = rolarD20();
    const r2 = montarTeste(dado, ultimoRoll.bonus, ultimoRoll.cd, ultimoRoll.limiar || 20);
    const anterior = ultimoRoll.tipo === "acerto" ? ataqueAcertoR : resultado;
    const melhor = anterior && anterior !== "auto" && anterior.total >= r2.total ? anterior : r2;
    registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} gasta um ponto de sorte para rerolar`,
      detalhe: `Novo d20(${dado}) ${fmtBonus(ultimoRoll.bonus)} = ${r2.total} vs CD ${ultimoRoll.cd} — fica com o maior (${melhor.total})`,
      total: melhor.grauTexto, tipoClasse: melhor.tipoClasse,
    });
    if (ultimoRoll.tipo === "acerto") setAtaqueAcertoR(melhor); else setResultado(melhor);
  };
  const BotaoSorte = () => {
    const r = ultimoRoll?.tipo === "acerto" ? ataqueAcertoR : resultado;
    if (!ultimoRoll || !r || r === "auto" || r.sucesso || pontosSorteDisponiveis <= 0) return null;
    return <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={rerolarComSorte}>🍀 Rerolar com ponto de sorte ({pontosSorteDisponiveis} restante{pontosSorteDisponiveis === 1 ? "" : "s"})</button>;
  };

  /* rolarEfeitoGenerico: resolve a resistência de UM efeito contra UM alvo específico e aplica
     os efeitos colaterais (dano na vida, condições, etc). Não mexe em estado de UI — quem chama
     decide onde guardar o resultado. Isso permite reaproveitar a mesma lógica tanto no fluxo normal
     quanto no Multiataque (vários alvos/ataques) e no Dividido (efeito com graduação repartida). */
  const rolarEfeitoGenerico = (efeito, alvo, aplicarProtecaoLimitada, critico, cdMetade = false) => {
    const efeitoOriginal = efeito;
    // Dano Baseado Em: a graduação vem do atributo (+ dano adicional) do atacante, ao vivo.
    if (efeito.categoria === "Dano") efeito = { ...efeito, graduacao: graduacaoEfetiva(efeito, origemAtual), baseadoAtivo: false };
    efeito = comAquecimento(efeito, origemAtual, aquecSnap); // Aquecimento: graduação reduzida nos primeiros usos/turnos
    const brutal = critico ? bonusBrutal(origemAtual, contexto.ataque, efeitoOriginal) : 0;
    const dados = dadosEfeito(efeito, alvo, critico, brutal);
    const notasRes = [];
    if (!dados.quemRolaAtacante) {
      notasRes.push(...notasModsDefesa(alvo, CHAVE_SALV[dados.salvLabel] || "resistencia"));
      if (critico) notasRes.push(brutal ? `Crítico: CD +5, Brutal +${brutal}` : "Crítico: CD +5");
      const pec = efeito.peculiaridade || contexto.ataque?.peculiaridade;
      if (pec?.ativo && alvo.ultimoDanoTurno !== undefined && alvo.ultimoDanoTurno === chaveTurnoAnterior(iniciativa)) {
        const b = Number(pec.bonus) || 2;
        dados.bonus += b;
        notasRes.push(`⚠ Peculiaridade ativada: ${alvo.nome} sofreu dano no turno anterior, ${fmtBonus(b)} para resistir`);
      }
    } else if (efeito.categoria === "Nulificar") {
      notasRes.push(...notasModsDefesa(alvo, efeito.salvamento === "Fortitude" ? "fortitude" : "vontade").map((t) => `alvo: ${t}`));
      // Peculiaridade no Nulificar: quem rola é o atacante, então o bônus de resistência do alvo sobe a CD.
      const pecN = efeito.peculiaridade || contexto.ataque?.peculiaridade;
      if (pecN?.ativo && alvo.ultimoDanoTurno !== undefined && alvo.ultimoDanoTurno === chaveTurnoAnterior(iniciativa)) {
        const bN = Number(pecN.bonus) || 2;
        dados.cd += bN;
        notasRes.push(`⚠ Peculiaridade ativada: ${alvo.nome} sofreu dano no turno anterior, CD ${fmtBonus(bN)}`);
      }
    }
    if (dados.quemRolaAtacante) {
      const dado = rolarD20();
      const r = montarTeste(dado, dados.bonus, dados.cd);
      if (efeito.categoria === "Cura") {
        const cura = r.sucesso ? (efeito.graduacao || 0) * Math.max(1, r.graus) : 0;
        if (cura > 0) aplicarDano(alvo.id, -cura);
        registrar({
          tipo: "rolagem",
          desc: `${origemAtual.nome} tenta Curar ${alvo.nome}`,
          detalhe: `d20(${dado}) ${fmtBonus(dados.bonus)} = ${r.total} vs CD ${dados.cd}`,
          total: cura > 0 ? `Curou ${cura} PV` : "Sem efeito", tipoClasse: r.tipoClasse,
        });
        if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: fotoAtq, nomeAlvo: alvo.nome, fotoAlvo: alvo.foto, dado, bonus: dados.bonus, total: r.total, cd: dados.cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: cura > 0 ? `Curou ${cura} PV` : "Sem efeito" });
        return { r, cura, texto: cura > 0 ? `Curou ${cura} PV` : "Sem efeito" };
      }
      registrar({
        tipo: "rolagem",
        desc: `${origemAtual.nome} tenta Nulificar em ${alvo.nome}`,
        detalhe: `d20(${dado}) ${dados.bonus >= 0 ? "+" : ""}${dados.bonus} = ${r.total} vs CD ${dados.cd}${fmtMods(notasRes)}`,
        total: r.sucesso ? r.grauTexto : "Sem efeito", tipoClasse: r.tipoClasse,
      });
      if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: fotoAtq, nomeAlvo: alvo.nome, fotoAlvo: alvo.foto, dado, bonus: dados.bonus, total: r.total, cd: dados.cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? r.grauTexto : "Sem efeito" });
      return { r, texto: textoNulificar(r.graus) };
    }
    // Esquivou do efeito em área: a CD do teste de resistência cai pela metade.
    if (cdMetade) { dados.cd = Math.max(1, Math.floor(dados.cd / 2)); notasRes.push("Esquivou: CD pela metade"); }
    const dado = rolarD20();
    const r = montarTeste(dado, dados.bonus, dados.cd);
    let extra = {};
    if (efeito.categoria === "Dano") {
      const nivelAtacante = Math.max(1, origemAtual.nivel || 1);
      const graduacaoDano = Math.min(efeito.graduacao || 0, nivelAtacante);
      const danoPreReducao = r.sucesso ? 0 : graduacaoDano * Math.abs(r.graus);
      const passivosAlvo = modificadoresPassivos(alvo);
      const reducaoNormal = passivosAlvo.reducaoDano || 0;
      const reducaoLimitada = aplicarProtecaoLimitada ? (passivosAlvo.reducaoDanoLimitado || 0) : 0;
      const reducaoItens = passivosAlvo.reducaoDanoItens || [];
      // A proteção de itens só perde PV pelo tanto que de fato absorver (nunca mais que o dano recebido),
      // e é consumida só depois da proteção "normal"/limitada (ordem: inata > limitada > itens).
      let restante = danoPreReducao;
      restante = Math.max(0, restante - reducaoNormal);
      restante = Math.max(0, restante - reducaoLimitada);
      const reducaoDefesa = alvo.defendendo ? Math.max(0, attr(alvo, "vigor")) : 0;
      restante = Math.max(0, restante - reducaoDefesa);
      extra.reducaoDefesa = reducaoDefesa;
      const absorcoesItens = [];
      for (const it of reducaoItens) {
        const absorvido = Math.min(it.valor, restante);
        if (absorvido > 0) absorcoesItens.push({ ataqueId: it.ataqueId, valor: absorvido });
        restante -= absorvido;
      }
      extra.dano = Math.max(0, restante);
      extra.absorcoesItens = absorcoesItens;
      if (!r.sucesso && Math.abs(r.graus) >= 2) {
        const graduacaoArremesso = Math.floor((efeito.graduacao || 0) / 2);
        let distancia = graduacaoParaDistancia(graduacaoArremesso);
        if (Math.abs(r.graus) >= 3) distancia *= 2;
        extra.arremesso = distancia;
      }
    }
    if (efeito.categoria === "Aflição" && atualizarCampo) {
      const cumulKey = `afl:${efeito.id}`;
      if (r.sucesso) {
        // Resistiu com sucesso: zera o progresso cumulativo desse efeito nesse alvo.
        if (efeito.cumulativo && alvo.aflicoesCumulativas?.[cumulKey]) {
          const semEsse = { ...alvo.aflicoesCumulativas };
          delete semEsse[cumulKey];
          atualizarCampo(alvo.id, "aflicoesCumulativas", semEsse);
        }
      } else {
        const grausMax = grausAflicao(efeito);
        let nivel = Math.min(Math.abs(r.graus), grausMax);
        const nivelAnterior = efeito.cumulativo ? (alvo.aflicoesCumulativas?.[cumulKey] || 0) : 0;
        // Cumulativo: impor de novo o mesmo grau (1 ou 2) que o alvo já está sofrendo
        // deste efeito faz ele escalar um grau acima, em vez de se repetir.
        const escalou = efeito.cumulativo && (nivel === 1 || nivel === 2) && nivel === nivelAnterior && nivel < grausMax;
        if (escalou) nivel = Math.min(nivel + 1, 3);
        const condNome = nivel === 1 ? efeito.grau1 : nivel === 2 ? efeito.grau2 : nivel === 3 ? efeito.grau3 : null;
        if (condNome) {
          const nome = normalizarCondicao(condNome);
          const atuais = { ...(alvo.condicoes || {}) };
          if (escalou) {
            // A condição anterior "vira" a nova, em vez de empilhar as duas.
            const nomeAnterior = normalizarCondicao(nivelAnterior === 1 ? efeito.grau1 : efeito.grau2);
            if (nomeAnterior && atuais[nomeAnterior] > 0) atuais[nomeAnterior] -= 1;
          }
          atuais[nome] = (atuais[nome] || 0) + 1;
          atualizarCampo(alvo.id, "condicoes", atuais);
          if (nome === "Em Chamas") atualizarCampo(alvo.id, "condOrigem", (o) => ({ ...(o || {}), [nome]: Math.max(1, origemAtual.nivel || 1) }));
          // Recuperação Instantânea: a condição acaba no começo do turno do alvo (com dano antes, se Em Chamas/Sangrando).
          if (efeito.recuperacaoInstantanea) {
            atualizarCampo(alvo.id, "duracoes", [...(alvo.duracoes || []), { id: uid(), tipo: "condicao", nome, quando: "inicio", turnoDeId: alvo.id, instantanea: true, nivelOrigem: Math.max(1, origemAtual.nivel || 1) }]);
          }
        }
        extra.texto = textoAflicao(efeito, nivel);
        if (efeito.cumulativo) atualizarCampo(alvo.id, "aflicoesCumulativas", { ...(alvo.aflicoesCumulativas || {}), [cumulKey]: nivel });
      }
    } else if (efeito.categoria === "Aflição") {
      extra.texto = r.sucesso ? "Resistiu" : textoAflicao(efeito, r.graus);
    }
    if (efeito.categoria === "Leitura Mental") extra.texto = r.sucesso ? "Resistiu" : textoLeituraMental(r.graus);
    if (efeito.categoria === "Enfraquecer") extra.perda = r.sucesso ? 0 : Math.min(Math.abs(r.diff), efeito.graduacao || 0);
    if (efeito.categoria === "Camuflagem") extra.sentidos = r.sucesso ? [] : (efeito.sentidos || []);
    registrar({
      tipo: "rolagem",
      desc: `${alvo.nome} resiste a ${efeito.categoria} (${dados.salvLabel})${cdMetade ? " — esquivou, CD pela metade" : ""}`,
      detalhe: `d20(${dado}) ${dados.bonus >= 0 ? "+" : ""}${dados.bonus} = ${r.total} vs CD ${dados.cd}${extra.reducaoDefesa > 0 && !r.sucesso ? ` · Defender-se reduz ${extra.reducaoDefesa} de dano` : ""}${fmtMods(notasRes)}`,
      total: r.sucesso ? "Resistiu" : "Sofreu efeito", tipoClasse: r.tipoClasse,
    });
    if (animar) animar({ modo: "cd", nome: alvo.nome, foto: alvo.foto, nomeAlvo: origemAtual.nome, fotoAlvo: origemAtual.foto, dado, bonus: dados.bonus, total: r.total, cd: dados.cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Resistiu" : "Sofreu efeito" });
    if (efeito.categoria === "Dano" && extra.dano > 0) aplicarDano(alvo.id, extra.dano);
    if (efeito.categoria === "Dano" && extra.absorcoesItens?.length && atualizarCampo) {
      const novosAtaques = (alvo.ataques || []).map((a) => {
        const abs = extra.absorcoesItens.find((x) => x.ataqueId === a.id);
        if (!abs) return a;
        const atual = a.pvItemAtual ?? a.pvItemMax ?? 0;
        return { ...a, pvItemAtual: Math.max(0, atual - abs.valor) };
      });
      atualizarCampo(alvo.id, "ataques", novosAtaques);
    }
    return { r, ...extra };
  };

  /* ----- esquiva em área: CD 10 + maior graduação de efeito da habilidade; sucesso = nenhum efeito ----- */
  const cdEsquivaArea = 10 + maiorGraduacaoEfeitos(contexto.ataque?.efeitos, origemAtual);
  const rolarEsquivaArea = (alvo) => {
    if (esquivaArea[alvo.id]) return;
    const cd = cdEsquivaArea;
    if (condicaoAtiva(alvo, "Imóvel")) {
      setEsquivaArea((x) => ({ ...x, [alvo.id]: { auto: true, sucesso: false, cd } }));
      registrar({ tipo: "rolagem", desc: `${alvo.nome} tenta esquivar de "${contexto.ataque.nome}"`, detalhe: `CD ${cd}`, total: "Imóvel — falha automática", tipoClasse: "hw" });
      return;
    }
    const dado = rolarD20();
    const bonus = statDefesa(alvo, "esquiva");
    const r = montarTeste(dado, bonus, cd);
    setEsquivaArea((x) => ({ ...x, [alvo.id]: { ...r, auto: false } }));
    registrar({ tipo: "rolagem", desc: `${alvo.nome} tenta esquivar de "${contexto.ataque.nome}"`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${r.total} vs CD ${cd}${fmtMods(notasModsDefesa(alvo, "esquiva"))}`, total: r.sucesso ? "Esquivou — CD de resistência pela metade" : "Falhou na esquiva", tipoClasse: r.tipoClasse });
    if (animar) animar({ modo: "cd", nome: alvo.nome, foto: alvo.foto, nomeAlvo: origemAtual.nome, fotoAlvo: origemAtual.foto, dado, bonus, total: r.total, cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Esquivou!" : "Falhou na esquiva" });
  };
  const renderEsquivaArea = (alvo) => {
    const esq = esquivaArea[alvo.id];
    if (!esq) {
      const imovel = condicaoAtiva(alvo, "Imóvel");
      return (
        <button className="btn btn-ghost btn-block" style={{ marginBottom: 10 }} onClick={() => rolarEsquivaArea(alvo)}>
          {imovel ? "Esquiva (Imóvel — falha automática)" : `⚄ Rolar Esquiva (CD ${cdEsquivaArea})`}
        </button>
      );
    }
    if (esq.auto) return <div className="efeito-card dano" style={{ marginBottom: 10 }}><div className="efeito-t">Imóvel — falhou na esquiva (CD {esq.cd})</div></div>;
    return <div style={{ marginBottom: 10 }}><ResultadoCard r={esq} efeito={{ classe: esq.sucesso ? "ok" : "dano", titulo: esq.sucesso ? "Esquivou — CD de resistência pela metade" : "Falhou na esquiva" }} /></div>;
  };

  const [protecaoLimitada, setProtecaoLimitada] = useState({});
  const renderProtecaoLimitada = (efeito, alvo, key) => {
    if (efeito.categoria !== "Dano") return null;
    const reducaoLim = modificadoresPassivos(alvo).reducaoDanoLimitado || 0;
    if (reducaoLim <= 0) return null;
    return (
      <label className="checkbox-row">
        <input type="checkbox" checked={!!protecaoLimitada[key]} onChange={(e) => setProtecaoLimitada((s) => ({ ...s, [key]: e.target.checked }))} />
        Proteção (Limitado) — reduz {reducaoLim} de dano se marcado
      </label>
    );
  };
  const rolarEfeito = (efeito, alvoParam, keyOverride) => {
    const alvo = alvoParam || oponente;
    const key = keyOverride || (isArea ? `${alvo.id}:${efeito.id}` : efeito.id);
    // Crítico (natural 20, ou limiar de ameaça reduzido por Crítico Aprimorado) soma +5 na CD
    // de TODOS os efeitos desse ataque — não só no dano. Área não tem rolagem de acerto, então
    // não crítica.
    const critico = !isArea && ataqueAcertoR && ataqueAcertoR !== "auto" && ataqueAcertoR.ehCrit;
    const res = rolarEfeitoGenerico(efeito, alvo, !!protecaoLimitada[key], critico, isArea && !!esquivaArea[alvo.id]?.sucesso);
    setEfeitosR((s) => ({ ...s, [key]: res }));
  };

  /* ----- Multiataque: ataque extra com penalidade fixa no teste de ataque —
     -10 se for repetido no mesmo alvo do ataque principal, -5 se for em outro alvo engajado ----- */
  const temMultiataque = ehAtaque && !isArea && !!contexto.ataque?.extras?.multiataque && !contexto.ataque?.extras?.dividido;
  const [multiAtaques, setMultiAtaques] = useState([]);
  const [multiAlvoEscolha, setMultiAlvoEscolha] = useState("");
  const alvosEngajados = entidades.filter((e2) => e2.id !== origemAtual.id && e2.oponente);
  const efeitosDoAtaque = (contexto.ataque?.efeitos || []).filter((ef) => ef.categoria !== "Outros" && ef.categoria !== "Mover Objetos" && !falhouTeste(ef));

  const rolarMultiataque = (alvoId) => {
    const alvoMA = entidades.find((e2) => e2.id === alvoId);
    if (!alvoMA) return;
    const info = infoAtaque();
    const mesmoAlvo = oponente && alvoMA.id === oponente.id;
    const penalidade = mesmoAlvo ? -10 : -5;
    const idMA = uid();
    if (!info) {
      setMultiAtaques((s) => [...s, { id: idMA, alvo: alvoMA, penalidade: 0, r: "auto", efeitosR: {} }]);
      registrar({ tipo: "rolagem", desc: `${origemAtual.nome} usa Multiataque com "${contexto.ataque.nome}" em ${alvoMA.nome}`, detalhe: "Sem rolagem de acerto — vai direto para os efeitos", total: "Aplica efeitos", tipoClasse: "hs" });
      setMultiAlvoEscolha("");
      return;
    }
    const bonusFinal = info.bonus + penalidade;
    const dado = rolarD20();
    const defVal = cdDefesa(alvoMA, info.defKey);
    const r = montarTeste(dado, bonusFinal, defVal, limiarCritico(origemAtual, contexto.ataque?.id));
    setMultiAtaques((s) => [...s, { id: idMA, alvo: alvoMA, penalidade, r, efeitosR: {} }]);
    registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} usa Multiataque (${penalidade}${mesmoAlvo ? ", mesmo alvo" : ", outro alvo"}) com "${contexto.ataque.nome}" em ${alvoMA.nome}`,
      detalhe: `d20(${dado}) ${fmtBonus(bonusFinal)} = ${r.total} vs ${info.defLabel} ${defVal}`,
      total: r.sucesso ? "Acertou" : "Errou", tipoClasse: r.tipoClasse,
    });
    if (animar) animar({ modo: "cd", nome: `${origemAtual.nome} (Multiataque)`, foto: fotoAtq, nomeAlvo: alvoMA.nome, fotoAlvo: alvoMA.foto, dado, bonus: bonusFinal, total: r.total, cd: defVal, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Acertou!" : "Errou" });
    setMultiAlvoEscolha("");
  };

  const rolarEfeitoMulti = (maId, efeito) => {
    const ma = multiAtaques.find((m) => m.id === maId);
    if (!ma) return;
    const key = `multi:${maId}:${efeito.id}`;
    const critico = ma.r && ma.r !== "auto" && ma.r.ehCrit;
    const res = rolarEfeitoGenerico(efeito, ma.alvo, !!protecaoLimitada[key], critico);
    setMultiAtaques((s) => s.map((m) => (m.id === maId ? { ...m, efeitosR: { ...m.efeitosR, [efeito.id]: res } } : m)));
  };

  /* ----- Dividido: reparte a graduação de um efeito resistível entre dois alvos ----- */
  const temDividido = ehAtaque && !isArea && !!contexto.ataque?.extras?.dividido;
  const [usarDividido, setUsarDividido] = useState(false);
  const [dividAlvo2Id, setDividAlvo2Id] = useState("");
  const [dividGrad, setDividGrad] = useState({});
  const efeitosResistiveisDividido = efeitosDoAtaque.filter((ef) => ef.categoria !== "Nulificar" && ef.categoria !== "Cura" && ef.categoria !== "Leitura Mental");
  const alvo2Dividido = entidades.find((e2) => e2.id === dividAlvo2Id);

  const montarEfeitoCard = (efeito, res) => {
    if (!res) return null;
    if (efeito.categoria === "Dano") return { classe: res.dano === 0 ? "ok" : "dano", titulo: res.dano === 0 ? "Sem dano" : "Dano sofrido (já descontado da Vida)", valor: res.dano, formula: res.arremesso ? `Arremessado ${res.arremesso}m em direção oposta ao atacante` : undefined };
    if (efeito.categoria === "Cura") return { classe: res.cura > 0 ? "ok" : "dano", titulo: res.cura > 0 ? "Vida curada (já somada à Vida)" : "Sem efeito", valor: res.cura };
    if (efeito.categoria === "Nulificar") return { classe: res.r.sucesso ? "dano" : "ok", titulo: res.texto };
    if (efeito.categoria === "Aflição") return { classe: res.r.sucesso ? "ok" : "dano", titulo: res.texto };
    if (efeito.categoria === "Leitura Mental") return { classe: res.r.sucesso ? "ok" : "dano", titulo: res.texto };
    if (efeito.categoria === "Enfraquecer") return { classe: res.perda > 0 ? "dano" : "ok", titulo: res.perda > 0 ? `-${res.perda} em ${efeito.caracteristica || "característica"}` : "Sem efeito" };
    if (efeito.categoria === "Camuflagem") return { classe: res.sentidos.length ? "dano" : "ok", titulo: res.sentidos.length ? `Perde: ${res.sentidos.filter(Boolean).join(", ")}` : "Sem efeito" };
    return null;
  };

  /* ----- agarrar rápido (checkbox em ataques corpo-a-corpo) ----- */
  const podeAgarrarRapido = ehAtaque && !isArea && contexto.ataque?.tipoAcerto === "corpo" && temVantagem(origemAtual, "Agarrar Rápido");
  const efeitosPendentesAgarrar = (contexto.ataque?.efeitos || []).filter((ef) => ef.categoria !== "Outros" && !falhouTeste(ef));
  const todosEfeitosResolvidos = efeitosPendentesAgarrar.every((ef) => !!efeitosR[ef.id]);
  const rolarAgarrao = () => {
    if (!oponente) return;
    const bAt = melhorDe(origemAtual, ["Atletismo"]);
    const bDef = melhorDe(oponente, ["Atletismo"]);
    const dAt = rolarD20(), dDef = rolarD20();
    const totalAt = dAt + bAt, totalDef = dDef + bDef;
    const diff = totalAt - totalDef, vitoria = diff > 0;
    const graus = vitoria ? calcGraus(diff) : 0;
    setAgarraoR({ dAt, bAt, totalAt, dDef, bDef, totalDef, diff, vitoria, graus });
    let resultadoTxt;
    if (vitoria) {
      const nomeCondicao = graus >= 2 ? "Amarrado" : "Agarrado";
      const atuaisAlvo = { ...(oponente.condicoes || {}) };
      atuaisAlvo[nomeCondicao] = (atuaisAlvo[nomeCondicao] || 0) + 1;
      atualizarCampo(oponente.id, "condicoes", atuaisAlvo);
      if (!temVantagem(origemAtual, "Agarrar Aprimorado")) {
        const atuaisOrigem = { ...(origemAtual.condicoes || {}) };
        atuaisOrigem["Vulnerável"] = (atuaisOrigem["Vulnerável"] || 0) + 1;
        atualizarCampo(origemAtual.id, "condicoes", atuaisOrigem);
      }
      resultadoTxt = graus >= 2 ? "Alvo ficou AMARRADO" : "Alvo ficou AGARRADO";
    } else resultadoTxt = "Alvo resistiu / escapou";
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} agarra ${oponente.nome} (Agarrar Rápido, sem novo teste de ataque)`, detalhe: `${totalAt} (d20 ${dAt}${fmtBonus(bAt)}) vs ${totalDef} (d20 ${dDef}${fmtBonus(bDef)})`, total: resultadoTxt, tipoClasse: vitoria ? "hs" : "hw" });
    if (animar) animar({ modo: "oposta", nomeA: origemAtual.nome, fotoA: origemAtual.foto, dadoA: dAt, bonusA: bAt, totalA: totalAt, nomeB: oponente.nome, fotoB: oponente.foto, dadoB: dDef, bonusB: bDef, totalB: totalDef, vencedor: vitoria ? "A" : (totalAt === totalDef ? "empate" : "B") });
  };

  /* ----- bônus de descanso (exercitar-se / pesquisar / preparar discurso) ----- */
  const chaveDescanso = !ehAtaque && contexto.tipo === "pericia" ? DESCANSO_BONUS_MAP[contexto.chave] : null;
  const descansoDisponivel = chaveDescanso && !!(origemAtual.descansoAtivos || {})[chaveDescanso];
  const bonusDescansoValor = usarBonusDescanso && descansoDisponivel ? 2 : 0;
  const consumirBonusDescanso = () => {
    if (!usarBonusDescanso || !descansoDisponivel || !atualizarCampo) return;
    atualizarCampo(origemAtual.id, "descansoAtivos", { ...(origemAtual.descansoAtivos || {}), [chaveDescanso]: false });
  };

  const custoVida = Number(ehAtaque ? contexto.ataque?.custoVida : 0) || 0;
  const custoNen = Number(ehAtaque ? contexto.ataque?.custoNen : 0) || 0;
  // Se a habilidade é um Equipamento com PV próprio, o custo de vida sai do item, não da ficha.
  const itemComPv = ehAtaque && contexto.ataque?.equipamento && (contexto.ataque?.pvItemMax || 0) > 0;
  const custoAplicadoRef = useRef(false);
  useEffect(() => {
    if (!ehAtaque || custoAplicadoRef.current || !atualizarCampo) return;
    if (bloqueioVar) return;
    const usoVar = aplicarUsoVariaveis(origemAtual, contexto.ataque);
    const temDesgastante = !!contexto.ataque?.desgastante?.ativo;
    if (custoVida <= 0 && custoNen <= 0 && !usoVar.variaveis && !temDesgastante) return;
    custoAplicadoRef.current = true;
    if (usoVar.variaveis) {
      atualizarCampo(origemAtual.id, "variaveis", usoVar.variaveis);
      registrar({
        tipo: "rolagem",
        desc: `${origemAtual.nome} usa "${contexto.ataque.nome}"`,
        detalhe: (contexto.ataque.usoVariaveis || []).filter((u) => u.variavelId && u.delta).map((u) => { const v = (origemAtual.variaveis || []).find((x) => x.id === u.variavelId); return `${v?.nome || "Variável"} ${u.delta > 0 ? "+" : ""}${u.delta}`; }).join(" · "),
        total: "Variáveis atualizadas", tipoClasse: "hw",
      });
    }
    if (temDesgastante) setDesgastanteR(usarDesgastante(origemAtual, contexto.ataque, atualizarCampo, registrar, animar));
    if (custoVida > 0) {
      if (itemComPv) {
        const atualItem = contexto.ataque.pvItemAtual ?? contexto.ataque.pvItemMax;
        const novosAtaques = (origemAtual.ataques || []).map((a) => (a.id === contexto.ataque.id ? { ...a, pvItemAtual: Math.max(0, atualItem - custoVida) } : a));
        atualizarCampo(origemAtual.id, "ataques", novosAtaques);
      } else {
        atualizarCampo(origemAtual.id, "pvAtual", (origemAtual.pvAtual || 0) - custoVida);
      }
    }
    if (custoNen > 0) atualizarCampo(origemAtual.id, "nenAtual", (origemAtual.nenAtual || 0) - custoNen);
    if (custoVida > 0 || custoNen > 0) registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} paga o custo de "${contexto.ataque.nome}"`,
      detalhe: `${custoVida > 0 ? `-${custoVida} ${itemComPv ? "PV do item" : "Vida"}` : ""}${custoVida > 0 && custoNen > 0 ? " · " : ""}${custoNen > 0 ? `-${custoNen} Nen` : ""}`,
      total: "Custo pago", tipoClasse: "hw",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Usar uma habilidade gasta a ação dela. */
  const acaoHabRef = useRef(false);
  useEffect(() => {
    if (!ehAtaque || acaoHabRef.current || !atualizarCampo || bloqueioVar || !contexto.ataque) return;
    acaoHabRef.current = true;
    gastarAcao(atualizarCampo, origemAtual.id, acaoDaHabilidade(contexto.ataque));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Exigir Teste (falha de efeito): rolado automaticamente ao usar a habilidade, ANTES de qualquer outra rolagem.
     Quem falha perde só aquele efeito (a ação já foi gasta). Também sobe a contagem do Aquecimento dos efeitos
     instantâneos usados (habilidades sustentadas sobem a contagem no começo de cada turno). */
  const testeAutoRef = useRef(false);
  useEffect(() => {
    if (!ehAtaque || testeAutoRef.current || !atualizarCampo || bloqueioVar || !contexto.ataque) return;
    testeAutoRef.current = true;
    const a = contexto.ataque;
    const efs = a.tipo === "passiva" ? [] : (a.efeitos || []);
    const res = {};
    exigirTestesDe(a).forEach((it) => {
      const r = rolarExigirTeste(origemAtual, it.cfg);
      res[it.id] = r;
      registrar({
        tipo: "rolagem",
        desc: `${origemAtual.nome} testa Exigir Teste (${a.nome || "Habilidade"} — ${it.rotulo})`,
        detalhe: `d20(${r.dado}) ${fmtBonus(r.bonus)} = ${r.total} vs CD ${r.cd}${r.pericia ? ` (${r.pericia})` : ""}${fmtMods(notasCondicoesGerais(origemAtual))}`,
        total: textoResultadoExigirTeste(r),
        tipoClasse: r.sucesso ? "hs" : "hw",
      });
      if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} — Exigir Teste`, foto: fotoAtq, dado: r.dado, bonus: r.bonus, total: r.total, cd: r.cd, sucesso: r.sucesso, ehCrit: false, grauTexto: r.falhaAutomatica ? "Falha automática" : (r.sucesso ? "Passou" : "Falhou — efeito perdido") });
    });
    setExigirTesteR(res);
    const falhos = Object.keys(res).filter((id) => !res[id].sucesso && id !== "legado");
    atualizarCampo(origemAtual.id, "*", (e) => {
      const perd = { ...(e.efeitosPerdidos || {}) };
      efs.forEach((ef) => { delete perd[ef.id]; }); // usar de novo = novo teste
      falhos.forEach((id) => { perd[id] = true; });
      let n = { ...e, efeitosPerdidos: perd };
      if (!a.sustentado) {
        const aq = { ...(e.aquecimento || {}) };
        efs.forEach((ef) => { if (ef.aquecimento?.ativo && !ef.exigirTeste?.ativo && res.legado?.sucesso !== false) aq[ef.id] = (aq[ef.id] || 0) + 1; });
        n.aquecimento = aq;
      }
      return n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Habilidade ativa sustentada: ao usar, passa a "sustentar" e o Efeito Colateral entra em jogo. */
  const sustRef = useRef(false);
  useEffect(() => {
    if (!ehAtaque || sustRef.current || !atualizarCampo || bloqueioVar) return;
    const a = contexto.ataque;
    if (!a || a.tipo === "passiva" || !a.sustentado) return;
    sustRef.current = true;
    const atual = (origemAtual.ataques || []).find((x) => x.id === a.id);
    if (atual?.sustentando) return;
    atualizarCampo(origemAtual.id, "ataques", (lista) => (lista || []).map((x) => (x.id === a.id ? { ...x, sustentando: true } : x)));
    ativarColaterais(origemAtual, a, atualizarCampo, registrar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const atualizarEfeitoMoverObjetos = (efeitoId, novoMO) => {
    if (!atualizarCampo || !ehAtaque || !ataqueAtual) return;
    const novosEfeitos = (ataqueAtual.efeitos || []).map((ef) => (ef.id === efeitoId ? { ...ef, ...novoMO } : ef));
    const novosAtaques = (origemAtual.ataques || []).map((a) => (a.id === ataqueAtual.id ? { ...a, efeitos: novosEfeitos } : a));
    atualizarCampo(origemAtual.id, "ataques", novosAtaques);
  };
  // Usa a versão mais atual do ataque (vinda de origemAtual/entidades, que é reativo) em vez do
  // "contexto.ataque" capturado na abertura do modal — assim os campos de Mover Objetos refletem
  // a digitação/edição em tempo real, e não uma foto congelada de quando o modal abriu.
  const ataqueAtual = ehAtaque ? ((origemAtual.ataques || []).find((a) => a.id === contexto.ataque?.id) || contexto.ataque) : null;
  const efeitosMoverObjetos = ehAtaque ? (ataqueAtual?.efeitos || []).filter((ef) => ef.categoria === "Mover Objetos") : [];
  const criarAtaqueArremesso = (nomeObjeto, graduacaoDano) => {
    if (!atualizarCampo) return;
    const novo = {
      id: uid(), nome: `Arremesso: ${nomeObjeto || "Objeto"}`, tipo: "ativa", tipoAcerto: "distancia", custoVida: 0, custoNen: 0, extras: {}, ativo: false,
      efeitos: [{ id: uid(), categoria: "Dano", graduacao: Math.max(0, graduacaoDano || 0) }],
      passivos: [],
    };
    atualizarCampo(origemAtual.id, "ataques", [...(origemAtual.ataques || []), novo]);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} monta um ataque de arremesso com "${nomeObjeto || "objeto"}"`, detalhe: `Novo ataque à distância criado (Dano graduação ${graduacaoDano})`, total: "Criado", tipoClasse: "hs" });
  };

  if (bloqueioVar) return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="modal-box">
        <div className="modal-head"><span className="mt">{contexto.label}</span><button className="modal-close" onClick={fechar}>×</button></div>
        <div className="efeito-card dano"><div className="efeito-t">Não pode ser usada</div><div className="efeito-f">{bloqueioVar}</div></div>
      </div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="modal-box">
        <div className="modal-head"><span className="mt">{contexto.label}</span><button className="modal-close" onClick={fechar}>×</button></div>
        {ehAtaque && contexto.ataque?.imagem && <div className="hab-img-modal-wrap"><ImgAj className="hab-img-modal" src={contexto.ataque.imagem} aj={contexto.ataque.imagemAj} /></div>}
        {desgastanteR && (
          <div className="subcard2" style={{ marginBottom: 12 }}>
            <div className="section-title">Desgastante</div>
            {desgastanteR.teste && (
              <div className={"grau-card " + (desgastanteR.teste.sucesso ? "success" : "warn")}>
                <div className="gl">{desgastanteR.teste.sal}: d20({desgastanteR.teste.dado}) {fmtBonus(desgastanteR.teste.bonus)} = {desgastanteR.teste.total} vs CD {desgastanteR.teste.cd}</div>
                <div className="gn">{desgastanteR.texto}</div>
              </div>
            )}
            {!desgastanteR.teste && <div className="efeito-card dano"><div className="efeito-f">{desgastanteR.texto}</div></div>}
          </div>
        )}
        {ehAtaque && contexto.ataque?.textoFormatado && (
          <div className="rich-display" style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: contexto.ataque.textoFormatado }} />
        )}

        {efeitosMoverObjetos.map((ef) => (
          <div className="subcard2" key={ef.id} style={{ marginBottom: 12 }}>
            <div className="section-title">Mover Objetos</div>
            <MoverObjetosCampos mo={ef} onMudar={(novo) => atualizarEfeitoMoverObjetos(ef.id, novo)} onCriarArremesso={criarAtaqueArremesso} />
          </div>
        ))}

        {(temMultiataque || temDividido) && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {temMultiataque && <span className="stat-chip ataque-chip" style={{ cursor: "default" }}>⚔ Multiataque — -10 no mesmo alvo / -5 em outro alvo</span>}
            {temDividido && <span className="stat-chip ataque-chip" style={{ cursor: "default" }}>🔀 Dividido — reparte a graduação entre dois alvos diferentes</span>}
          </div>
        )}

        {condicionaisDisponiveis.length > 0 && (
          <div className="subcard2">
            <div className="section-title">Vantagens aplicáveis</div>
            {condicionaisDisponiveis.map(({ v, info }) => (
              <label key={v.id} className="checkbox-row">
                <input type="checkbox" checked={!!condMarcadas[v.id]} onChange={(e) => setCondMarcadas((s) => ({ ...s, [v.id]: e.target.checked }))} />
                {v.nome}{v.textoExtra ? ` (${v.textoExtra})` : ""} — +{bonusDeGraduacao(info, v.graduacoes)}
              </label>
            ))}
          </div>
        )}

        {ehAtaque && testesExigidos.length > 0 && renderExigirTestes(12)}

        {ehAtaque && isArea && (
          <>
            <label className="label">Alvos (área — múltiplos)</label>
            <div className="subcard2" style={{ marginBottom: 12 }}>
              {entidades.filter((e) => e.id !== origemAtual.id && e.oponente).length === 0 && <div className="field-note">Nenhum oponente marcado pelo Mestre.</div>}
              {entidades.filter((e) => e.id !== origemAtual.id && e.oponente).map((e) => (
                <label key={e.id} className="checkbox-row">
                  <input type="checkbox" checked={!!oponentesArea[e.id]} onChange={(ev) => setOponentesArea((s) => ({ ...s, [e.id]: ev.target.checked }))} />
                  {e.nome}
                </label>
              ))}
            </div>
            {alvosArea.map((alvo) => (
              <div className="subcard" key={alvo.id}>
                <div className="section-title">{alvo.nome}</div>
                {renderEsquivaArea(alvo)}
                {(contexto.ataque.efeitos || []).filter((efeito) => efeito.categoria !== "Mover Objetos" && !falhouTeste(efeito)).map((efeito) => {
                  const key = `${alvo.id}:${efeito.id}`;
                  const res = efeitosR[key];
                  return (
                    <div key={efeito.id} style={{ marginBottom: 10 }}>
                      <div className="acao-tipo" style={{ marginBottom: 4 }}>{efeito.categoria}</div>
                      {efeito.categoria === "Outros" ? (
                        <div className="efeito-card ok"><div className="efeito-f">{efeito.texto || "(sem descrição)"}</div></div>
                      ) : (
                        <>
                          {!res && renderProtecaoLimitada(efeito, alvo, key)}
                          {!res && <button className="btn btn-ghost btn-block" onClick={() => rolarEfeito(efeito, alvo)}>⚄ Rolar Resistência</button>}
                          {res && <ResultadoCard r={res.r} efeito={montarEfeitoCard(efeito, res)} />}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}

        {ehAtaque && !isArea && (
          <>
            <label className="label">Oponente</label>
            <SearchableSelect listaCheia value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setAtaqueAcertoR(null); setEfeitosR({}); setMultiAtaques([]); setMultiAlvoEscolha(""); setUsarDividido(false); setDividAlvo2Id(""); setDividGrad({}); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {entidades.filter((e) => e.id !== origemAtual.id && e.oponente).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </SearchableSelect>

            {oponente && podeAgarrarRapido && !ataqueAcertoR && (
              <label className="checkbox-row" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={agarrarMarcado} onChange={(e) => setAgarrarMarcado(e.target.checked)} />
                Agarrar (Agarrar Rápido — não precisa de novo teste de ataque)
              </label>
            )}

            {oponente && treinoDisponivel && !ataqueAcertoR && (
              <label className="checkbox-row" style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={usarBonusTreino} onChange={(e) => setUsarBonusTreino(e.target.checked)} />
                Usar bônus de Treinamento — +2 no ataque
              </label>
            )}

            {oponente && (
              <>
                <button className="btn btn-accent btn-block" onClick={rolarAcerto} disabled={ataqueAcertoR !== null} style={{ marginBottom: 12 }}>
                  ⚄ {infoAtaque() ? "Rolar Acerto" : "Aplicar Efeitos"}
                </button>
                {ataqueAcertoR && ataqueAcertoR !== "auto" && (
                  <div className="subcard"><ResultadoCard r={ataqueAcertoR} efeito={{ classe: ataqueAcertoR.sucesso ? "ok" : "dano", titulo: ataqueAcertoR.sucesso ? "Acertou!" : "Errou" }} /><BotaoSorte /></div>
                )}
                {temDividido && (ataqueAcertoR === "auto" || (ataqueAcertoR && ataqueAcertoR.sucesso)) && efeitosResistiveisDividido.length > 0 && (
                  <label className="checkbox-row" style={{ marginBottom: 12 }}>
                    <input type="checkbox" checked={usarDividido} onChange={(e) => { setUsarDividido(e.target.checked); setDividAlvo2Id(""); setDividGrad({}); }} />
                    Dividir o efeito entre este alvo e outro engajado
                  </label>
                )}

                {(!temDividido || !usarDividido) && (ataqueAcertoR === "auto" || (ataqueAcertoR && ataqueAcertoR.sucesso)) && (contexto.ataque.efeitos || []).filter((efeito) => efeito.categoria !== "Mover Objetos" && !falhouTeste(efeito)).map((efeito) => {
                  const res = efeitosR[efeito.id];
                  return (
                    <div className="subcard" key={efeito.id}>
                      <div className="section-title">{efeito.categoria}</div>
                      {efeito.categoria === "Outros" ? (
                        <div className="efeito-card ok"><div className="efeito-f">{efeito.texto || "(sem descrição)"}</div></div>
                      ) : (
                        <>
                          {!res && renderProtecaoLimitada(efeito, oponente, efeito.id)}
                          {!res && <button className="btn btn-ghost btn-block" onClick={() => rolarEfeito(efeito)}>⚄ Rolar Resistência</button>}
                          {res && <ResultadoCard r={res.r} efeito={montarEfeitoCard(efeito, res)} />}
                        </>
                      )}
                    </div>
                  );
                })}

                {temDividido && usarDividido && (ataqueAcertoR === "auto" || (ataqueAcertoR && ataqueAcertoR.sucesso)) && (
                  <div className="subcard2" style={{ marginBottom: 12 }}>
                    <div className="section-title">Divisão do efeito</div>
                    <label className="label">Segundo alvo (diferente do primeiro)</label>
                    <SearchableSelect value={dividAlvo2Id} onChange={(e) => { setDividAlvo2Id(e.target.value); setDividGrad({}); }} style={{ marginBottom: 10 }}>
                      <option value="">Selecione…</option>
                      {alvosEngajados.filter((e2) => e2.id !== oponente.id).map((e2) => <option key={e2.id} value={e2.id}>{e2.nome}</option>)}
                    </SearchableSelect>

                    {!dividAlvo2Id && <div className="field-note">Escolha um segundo alvo, diferente de {oponente.nome}, entre os oponentes engajados no combate. Não é permitido dividir o efeito duas vezes no mesmo alvo.</div>}

                    {alvo2Dividido && efeitosResistiveisDividido.map((efeito) => {
                      const total = graduacaoEfetiva(efeito, origemAtual);
                      const g1 = dividGrad[efeito.id] != null ? dividGrad[efeito.id] : Math.ceil(total / 2);
                      const g2 = Math.max(0, total - g1);
                      const res1 = efeitosR[`div1:${efeito.id}`];
                      const res2 = efeitosR[`div2:${efeito.id}`];
                      return (
                        <div className="subcard" key={efeito.id} style={{ marginBottom: 10 }}>
                          <div className="acao-tipo" style={{ marginBottom: 6 }}>{efeito.categoria} — graduação total {total}</div>
                          <div className="grid2" style={{ marginBottom: 8 }}>
                            <div>
                              <label className="label">{oponente.nome}</label>
                              <input type="number" min={0} max={total} value={g1} disabled={!!res1}
                                onChange={(e) => { const v = Math.max(0, Math.min(total, Number(e.target.value) || 0)); setDividGrad((s) => ({ ...s, [efeito.id]: v })); }} />
                            </div>
                            <div>
                              <label className="label">{alvo2Dividido.nome}</label>
                              <input type="number" value={g2} disabled />
                            </div>
                          </div>
                          {!res1 ? (
                            <>
                              {renderProtecaoLimitada(efeito, oponente, `div1:${efeito.id}`)}
                              <button className="btn btn-ghost btn-block" style={{ marginBottom: 6 }}
                                onClick={() => rolarEfeito({ ...efeito, graduacao: g1, baseadoAtivo: false }, oponente, `div1:${efeito.id}`)}>
                                ⚄ Rolar para {oponente.nome} (graduação {g1})
                              </button>
                            </>
                          ) : <div style={{ marginBottom: 6 }}><ResultadoCard r={res1.r} efeito={montarEfeitoCard(efeito, res1)} /></div>}
                          {!res2 ? (
                            <>
                              {renderProtecaoLimitada(efeito, alvo2Dividido, `div2:${efeito.id}`)}
                              <button className="btn btn-ghost btn-block"
                                onClick={() => rolarEfeito({ ...efeito, graduacao: g2, baseadoAtivo: false }, alvo2Dividido, `div2:${efeito.id}`)}>
                                ⚄ Rolar para {alvo2Dividido.nome} (graduação {g2})
                              </button>
                            </>
                          ) : <ResultadoCard r={res2.r} efeito={montarEfeitoCard(efeito, res2)} />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {agarrarMarcado && ataqueAcertoR && ataqueAcertoR !== "auto" && ataqueAcertoR.sucesso && todosEfeitosResolvidos && !agarraoR && (
                  <button className="btn btn-accent btn-block" onClick={rolarAgarrao} style={{ marginBottom: 12 }}>⚄ Rolar Agarrão (Atletismo)</button>
                )}
                {agarraoR && (
                  <div className="subcard">
                    <div className="versus-row">
                      <div className="vs-cell"><div className="vsn">{origemAtual.nome}</div><div className="vsv">{agarraoR.totalAt}</div></div>
                      <div className="vsx">vs</div>
                      <div className="vs-cell"><div className="vsn">{oponente.nome}</div><div className="vsv">{agarraoR.totalDef}</div></div>
                    </div>
                    <div className={"grau-card " + (agarraoR.vitoria ? "success" : "warn")}>
                      <div className="gl">{agarraoR.vitoria ? "Vitória" : "Sem efeito"}</div>
                      <div className="gn">{agarraoR.vitoria ? (agarraoR.graus >= 2 ? "Amarrado" : "Agarrado") : "Resistiu"}</div>
                    </div>
                    {agarraoR.vitoria && !temVantagem(origemAtual, "Agarrar Aprimorado") && (
                      <div className="field-note">Sem Agarrar Aprimorado: {origemAtual.nome} fica Vulnerável enquanto agarra.</div>
                    )}
                  </div>
                )}

                {temMultiataque && ataqueAcertoR !== null && (
                  <div className="subcard2" style={{ marginTop: 12 }}>
                    <div className="section-title">Multiataque</div>
                    {multiAtaques.map((ma) => (
                      <div className="subcard" key={ma.id} style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: "0.82rem", marginBottom: 8 }}>
                          2º ataque em <b>{ma.alvo.nome}</b>{ma.penalidade ? ` (${ma.penalidade} no teste de ataque)` : ""}
                        </div>
                        {ma.r === "auto" ? (
                          <div className="field-note" style={{ marginBottom: 8 }}>Sem rolagem de acerto — vai direto para os efeitos.</div>
                        ) : (
                          <div style={{ marginBottom: 8 }}><ResultadoCard r={ma.r} efeito={{ classe: ma.r.sucesso ? "ok" : "dano", titulo: ma.r.sucesso ? "Acertou!" : "Errou" }} /></div>
                        )}
                        {(ma.r === "auto" || ma.r.sucesso) && efeitosDoAtaque.map((efeito) => {
                          const res = ma.efeitosR[efeito.id];
                          return (
                            <div key={efeito.id} style={{ marginBottom: 8 }}>
                              {!res && renderProtecaoLimitada(efeito, ma.alvo, `multi:${ma.id}:${efeito.id}`)}
                              {!res && <button className="btn btn-ghost btn-block" onClick={() => rolarEfeitoMulti(ma.id, efeito)}>⚄ Rolar Resistência ({efeito.categoria})</button>}
                              {res && <ResultadoCard r={res.r} efeito={montarEfeitoCard(efeito, res)} />}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {multiAtaques.length === 0 ? (
                      <>
                        <label className="label">Alvo do ataque extra (mesmo alvo ou outro engajado)</label>
                        <SearchableSelect listaCheia value={multiAlvoEscolha} onChange={(e) => setMultiAlvoEscolha(e.target.value)} style={{ marginBottom: 10 }}>
                          <option value="">Selecione…</option>
                          {alvosEngajados.map((e2) => <option key={e2.id} value={e2.id}>{e2.nome}{e2.id === oponente.id ? " (mesmo alvo)" : ""}</option>)}
                        </SearchableSelect>
                        <button className="btn btn-accent btn-block" disabled={!multiAlvoEscolha} onClick={() => rolarMultiataque(multiAlvoEscolha)}>
                          ⚄ Atacar ({multiAlvoEscolha && oponente && multiAlvoEscolha === oponente.id ? "-10, mesmo alvo" : "-5, outro alvo"})
                        </button>
                      </>
                    ) : (
                      <div className="field-note">Multiataque já usado neste ataque — apenas um ataque extra é permitido.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {!ehAtaque && !escolha && (
          <div className="grid2">
            <button className="btn btn-ghost" onClick={() => setEscolha("cd")}>Contra CD</button>
            <button className="btn btn-ghost" onClick={() => setEscolha("oponente")}>Contra Oponente</button>
          </div>
        )}

        {!ehAtaque && descansoDisponivel && !resultado && (
          <label className="checkbox-row" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={usarBonusDescanso} onChange={(e) => setUsarBonusDescanso(e.target.checked)} />
            Usar bônus de descanso ({DESCANSO_BONUS_LABEL[chaveDescanso]}) — +2
          </label>
        )}

        {!ehAtaque && escolha === "cd" && !resultado && (
          <>
            <label className="label">CD</label>
            <input type="number" value={cdManual} onChange={(e) => setCdManual(e.target.value)} style={{ marginBottom: 12 }} />
            <button className="btn btn-accent btn-block" onClick={() => { rolarSimples(computeBonusBase(origemAtual, contexto.tipo, contexto.chave) + bonusCondicionalTotal + bonusDescansoValor, Number(cdManual) || 0); consumirBonusDescanso(); }}>⚄ Rolar d20</button>
          </>
        )}

        {!ehAtaque && escolha === "oponente" && !resultado && (
          <>
            <label className="label">Oponente</label>
            <SearchableSelect listaCheia value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setStatOponente(""); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {entidades.filter((e) => e.id !== origemAtual.id && e.oponente).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </SearchableSelect>
            {oponente && (
              <>
                <label className="label">Perícia ou defesa do oponente</label>
                <SearchableSelect value={statOponente} onChange={(e) => setStatOponente(e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="">Selecione…</option>
                  <optgroup label="Defesas">{DEFESAS_OPCOES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</optgroup>
                  <optgroup label="Perícias">{PERICIAS.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}</optgroup>
                </SearchableSelect>
                <button className="btn btn-accent btn-block" disabled={!statOponente}
                  onClick={() => { rolarSimples(computeBonusBase(origemAtual, contexto.tipo, contexto.chave) + bonusCondicionalTotal + bonusDescansoValor, valorAlvoComoCD(oponente, statOponente), oponente); consumirBonusDescanso(); }}>⚄ Rolar d20</button>
              </>
            )}
          </>
        )}

        {!ehAtaque && resultado && <div style={{ marginTop: 10 }}><ResultadoCard r={resultado} /><BotaoSorte /></div>}
      </div>
      {pfAberto && <PontoFracoJanela origem={origemAtual} entidades={entidades} pf={contexto.ataque.pontoFraco} nomeHabilidade={contexto.ataque.nome}
        onFechar={() => setPfAberto(false)} registrar={registrar} animar={animar} enviarPontoFraco={enviarPontoFraco} />}
    </div>
  );
}

/* ---------- lista combinada de "o que ajudar" ---------- */
const AJUDA_CHAVES = [
  { v: "ataque", l: "Ataque", tipo: "ataque" },
  ...DEFESAS_OPCOES.map((d) => ({ v: d.key, l: d.label, tipo: "defesa" })),
  ...ATRIBUTOS.map((a) => ({ v: a.k, l: a.l, tipo: "atributo" })),
  ...PERICIAS.map((p) => ({ v: p.nome, l: p.nome, tipo: "pericia" })),
];

/* ---------- modal de ações padrão ---------- */
function AcaoModal({ ctx, entidades, roster, onFechar, registrar: registrarProp, animar, atualizarCampo, iniciativa }) {
  const { origem, acao } = ctx;
  // Usar a ação/manobra gasta a ação correspondente (uma vez só por abertura da janela).
  const acaoGastaRef = useRef(false);
  const gastarAcaoDaManobra = () => {
    if (acaoGastaRef.current) return;
    acaoGastaRef.current = true;
    gastarAcao(atualizarCampo, origem.id, acao.tag, acao.id);
  };
  const registrar = (entry) => { registrarProp(entry); gastarAcaoDaManobra(); };
  const origemAtual = entidades.find((e) => e.id === origem.id) || origem;
  const outros = entidades.filter((e) => e.id !== origemAtual.id);
  const oponentesDisponiveis = outros.filter((e) => e.oponente);
  // O roster é uma lista pública enxuta (só id + nome) que existe justamente pra isso: deixar
  // qualquer um escolher um aliado pra ajudar sem precisar ter acesso à ficha completa dele.
  const aliadosDisponiveis = (roster || []).filter((r) => r.id !== origemAtual.id);

  const [oponenteId, setOponenteId] = useState("");
  const [oponentesMulti, setOponentesMulti] = useState({});
  const [cd, setCd] = useState(acao.cdPadrao || 15);
  const [periciaEscolhida, setPericiaEscolhida] = useState(acao.pericia || (acao.periciaEscolha ? acao.periciaEscolha[0] : ""));
  const [chaveAjuda, setChaveAjuda] = useState("");
  const [aliadoId, setAliadoId] = useState("");
  const [itemSegurado, setItemSegurado] = useState(true);
  const [itemAlvoId, setItemAlvoId] = useState("");
  const [graduacoesMovidas, setGraduacoesMovidas] = useState(0);
  const [defesaCuidado, setDefesaCuidado] = useState("esquiva");
  const [gradMassa, setGradMassa] = useState(0);

  const [r1, setR1] = useState(null);
  const [r2, setR2] = useState(null);
  const [r3, setR3] = useState(null);
  const [multiResultados, setMultiResultados] = useState(null);
  const [usarBonusDescansoAcao, setUsarBonusDescansoAcao] = useState(false);

  const oponente = entidades.find((e) => e.id === oponenteId);
  // Idem: usa o registro completo se disponível (ex.: já é oponente engajado, ou é o dono da
  // própria ficha), senão cai pro nome público do roster — o suficiente pra registrar quem foi
  // ajudado, já que rolarAjuda() usa só os atributos de quem está ajudando, não do aliado.
  const aliado = entidades.find((e) => e.id === aliadoId) || aliadosDisponiveis.find((r) => r.id === aliadoId);
  const fechar = () => onFechar();

  const fintaAgilAtiva = acao.id === "fintar" && temVantagem(origemAtual, "Finta Ágil");

  /* ----- bônus de descanso (exercitar-se / pesquisar / preparar discurso) aplicado a qualquer ação/manobra que use a perícia ----- */
  const periciasRelevantesDescanso =
    acao.resolvedor === "oposto" ? (acao.periciaOposta || []) :
    acao.resolvedor === "simples" ? [acao.pericia || periciaEscolhida] :
    acao.resolvedor === "oposicaoCondicao" ? (fintaAgilAtiva ? [acao.pericia, "Acrobacia"] : [acao.pericia]) :
    acao.resolvedor === "planoCombate" ? ["Investigação"] :
    acao.resolvedor === "furtividadeMulti" ? ["Furtividade"] :
    acao.resolvedor === "levantamento" ? ["Atletismo"] :
    (acao.resolvedor === "ajudar" && chaveAjuda && AJUDA_CHAVES.find((c) => c.v === chaveAjuda)?.tipo === "pericia") ? [chaveAjuda] :
    [];
  const chaveDescansoAcao = descansoAtivoPara(origemAtual, ...periciasRelevantesDescanso);
  const bonusDescansoAcaoValor = usarBonusDescansoAcao && chaveDescansoAcao ? 2 : 0;
  const consumirBonusDescansoAcao = () => {
    if (!usarBonusDescansoAcao || !chaveDescansoAcao) return;
    atualizarCampo(origemAtual.id, "descansoAtivos", { ...(origemAtual.descansoAtivos || {}), [chaveDescansoAcao]: false });
  };
  const resultadoDescansoJaObtido =
    acao.resolvedor === "oposto" ? !!r2 :
    acao.resolvedor === "simples" ? !!r1 :
    acao.resolvedor === "oposicaoCondicao" ? !!r2 :
    acao.resolvedor === "planoCombate" ? !!r1 :
    acao.resolvedor === "furtividadeMulti" ? !!multiResultados :
    acao.resolvedor === "levantamento" ? !!r1 :
    acao.resolvedor === "ajudar" ? !!r1 :
    true;

  const consumirAjuda = (entidadeAlvo, chave) => {
    const buff = ajudaDisponivelPara(entidadeAlvo, chave);
    if (!buff) return 0;
    atualizarCampo(entidadeAlvo.id, "buffsAjuda", (entidadeAlvo.buffsAjuda || []).filter((b) => b.id !== buff.id));
    return buff.bonus;
  };

  const bonusAtaque = (ent, penal, ajudaBonus) => {
    const mods = calcModCondicoes(ent);
    const penalCaido = condicaoAtiva(ent, "Caído") ? -5 : 0;
    return attr(ent, "luta") + penal + bonusVantagemToggle(ent, "ataque") + ajudaBonus + (ent.mirando ? 10 : 0) + mods.testesGerais + penalCaido;
  };
  const limparMira = (ent) => { if (ent.mirando) atualizarCampo(ent.id, "mirando", false); };
  /* resumos de bônus/penalidades pro histórico */
  const nAtq = (penal, ajuda, alvo, defKey, extra) => {
    const n = [];
    if (origemAtual.mirando) n.push("Mirar +10");
    n.push(...notasCondicoesGerais(origemAtual));
    if (condicaoAtiva(origemAtual, "Caído")) n.push("Caído -5");
    const vt = bonusVantagemToggle(origemAtual, "ataque");
    if (vt) n.push(`Vantagem ${fmtBonus(vt)}`);
    if (penal) n.push(`${acao.nome} ${fmtBonus(penal)}`);
    if (extra) n.push(extra);
    if (ajuda) n.push(`Ajuda ${fmtBonus(ajuda)}`);
    if (alvo) n.push(...notasModsDefesa(alvo, defKey).map((t) => `alvo: ${t}`));
    return n;
  };
  let critNota = 0; // preenchido por cada rolagem de perícia que teve Crítico Aprimorado
  const nDescanso = () => [...(bonusDescansoAcaoValor ? ["Bônus de descanso +2"] : []), ...(critNota ? ["Crítico aprimorado +5"] : [])];

  /* ----- oposto: agarrar / derrubar ----- */
  const rolarAtaqueOposto = () => {
    if (!oponente) return;
    const ajudaBonus = consumirAjuda(origemAtual, "ataque");
    const bonus = bonusAtaque(origemAtual, acao.penalidade || 0, ajudaBonus);
    const dado = rolarD20();
    const cdDef = cdDefesa(oponente, "aparar");
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta ${acao.nome} em ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Aparar ${cdDef}${fmtMods(nAtq(acao.penalidade || 0, ajudaBonus, oponente, "aparar"))}`, total: res.sucesso ? "Acertou" : "Errou", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdDef, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Acertou!" : "Errou" });
  };
  const rolarOpostoContestado = () => {
    if (!oponente) return;
    const bAt0 = melhorDe(origemAtual, acao.periciaOposta) + bonusDescansoAcaoValor, bDef = melhorDe(oponente, acao.periciaOposta);
    const dAt = rolarD20(), dDef = rolarD20();
    critNota = bonusCriticoPericia(origemAtual, melhorPericiaDe(origemAtual, acao.periciaOposta), dAt);
    const bAt = bAt0 + critNota;
    const totalAt = dAt + bAt, totalDef = dDef + bDef;
    const diff = totalAt - totalDef, vitoria = diff > 0;
    const graus = vitoria ? calcGraus(diff) : 0;
    setR2({ dAt, bAt, totalAt, dDef, bDef, totalDef, diff, vitoria, graus });
    let resultadoTxt;
    if (acao.id === "agarrar") {
      if (vitoria) {
        const nomeCondicao = graus >= 2 ? "Amarrado" : "Agarrado";
        const atuaisAlvo = { ...(oponente.condicoes || {}) };
        atuaisAlvo[nomeCondicao] = (atuaisAlvo[nomeCondicao] || 0) + 1;
        atualizarCampo(oponente.id, "condicoes", atuaisAlvo);
        if (!temVantagem(origemAtual, "Agarrar Aprimorado")) {
          const atuaisOrigem = { ...(origemAtual.condicoes || {}) };
          atuaisOrigem["Vulnerável"] = (atuaisOrigem["Vulnerável"] || 0) + 1;
          atualizarCampo(origemAtual.id, "condicoes", atuaisOrigem);
        }
        resultadoTxt = graus >= 2 ? "Alvo ficou AMARRADO" : "Alvo ficou AGARRADO";
      } else {
        resultadoTxt = "Alvo resistiu / escapou";
      }
    }
    else resultadoTxt = vitoria ? "Oponente CAIU" : "Oponente resistiu";
    registrar({ tipo: "rolagem", desc: `Teste oposto (${acao.periciaOposta.join("/")}): ${origemAtual.nome} vs ${oponente.nome}`, detalhe: `${totalAt} (d20 ${dAt}${fmtBonus(bAt)}) vs ${totalDef} (d20 ${dDef}${fmtBonus(bDef)})${fmtMods([...notasCondicoesGerais(origemAtual), ...nDescanso(), ...notasCondicoesGerais(oponente).map((t) => `alvo: ${t}`)])}`, total: resultadoTxt, tipoClasse: vitoria ? "hs" : "hw" });
    if (animar) animar({ modo: "oposta", nomeA: origemAtual.nome, fotoA: origemAtual.foto, dadoA: dAt, bonusA: bAt, totalA: totalAt, nomeB: oponente.nome, fotoB: oponente.foto, dadoB: dDef, bonusB: bDef, totalB: totalDef, vencedor: vitoria ? "A" : (totalAt === totalDef ? "empate" : "B") });
    consumirBonusDescansoAcao();
  };

  /* ----- desarmar ----- */
  const rolarAtaqueDesarmar = () => {
    if (!oponente) return;
    const ajudaBonus = consumirAjuda(origemAtual, "ataque");
    const bonus = bonusAtaque(origemAtual, acao.penalidade || 0, ajudaBonus);
    const dado = rolarD20();
    const cdDef = cdDefesa(oponente, "aparar");
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Desarmar ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Aparar ${cdDef}${fmtMods(nAtq(acao.penalidade || 0, ajudaBonus, oponente, "aparar"))}`, total: res.sucesso ? "Acertou" : "Errou", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdDef, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Acertou!" : "Errou" });
  };
  const rolarSalvamentoForca = () => {
    const dado = rolarD20(), bonus = attr(oponente, "forca") + calcModCondicoes(oponente).testesGerais;
    const res = montarTeste(dado, bonus, Number(cd) || 15);
    setR2(res);
    registrar({ tipo: "rolagem", desc: `${oponente.nome} resiste ao Desarmar`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD ${cd}${fmtMods(notasCondicoesGerais(oponente))}`, total: res.sucesso ? "Manteve o item" : "Soltou o item", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: oponente.nome, foto: oponente.foto, nomeAlvo: origemAtual.nome, fotoAlvo: origemAtual.foto, dado, bonus, total: res.total, cd: Number(cd) || 15, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Manteve o item" : "Soltou o item" });
  };

  /* ----- quebrar ----- */
  const equipamentosAlvo = (oponente?.ataques || []).filter((a) => a.equipamento);
  const itemAlvo = equipamentosAlvo.find((a) => a.id === itemAlvoId) || null;
  const rolarQuebrar = () => {
    if (!oponente || !itemAlvo) return;
    const ajudaBonus = consumirAjuda(origemAtual, "ataque");
    const penal = itemSegurado ? -2 : 0;
    const bonus = bonusAtaque(origemAtual, penal, ajudaBonus);
    const dado = rolarD20();
    const cdDef = cdDefesa(oponente, "aparar");
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Quebrar "${itemAlvo.nome}" de ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Defesa ${cdDef}${fmtMods(nAtq(0, ajudaBonus, oponente, "aparar", penal ? "Item segurado -2" : ""))}`, total: res.sucesso ? "Acertou o item" : "Errou", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdDef, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Acertou o item!" : "Errou" });
  };
  const rolarDanoItem = () => {
    if (!oponente || !itemAlvo) return;
    const dado = rolarD20();
    const bonus = attr(origemAtual, "forca") + calcModCondicoes(origemAtual).testesGerais;
    const cdItem = 10 + (itemAlvo.resistenciaItem || 0);
    const res = montarTeste(dado, bonus, cdItem);
    const dano = res.sucesso ? Math.max(1, res.graus) : 0;
    setR3({ ...res, dano });
    if (dano > 0) {
      if (temFundamento(oponente, "shu")) {
        const nenAtual = oponente.nenAtual || 0;
        const novoNen = Math.max(0, nenAtual - dano);
        atualizarCampo(oponente.id, "nenAtual", novoNen);
        registrar({ tipo: "rolagem", desc: `Dano em "${itemAlvo.nome}" (${oponente.nome}) — absorvido pelo Shu`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Resistência ${cdItem}`, total: `-${dano} Nen (${novoNen}/${nenMaxCalc(oponente)})`, tipoClasse: "hw" });
        if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: `${itemAlvo.nome} (${oponente.nome})`, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdItem, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: `Shu absorve: -${dano} Nen` });
      } else {
        const max = itemAlvo.pvItemMax || 0;
        const atualPv = itemAlvo.pvItemAtual ?? max;
        const novoPv = Math.max(0, atualPv - dano);
        const novosAtaques = (oponente.ataques || []).map((a) => a.id === itemAlvo.id ? { ...a, pvItemAtual: novoPv } : a);
        atualizarCampo(oponente.id, "ataques", novosAtaques);
        registrar({ tipo: "rolagem", desc: `Dano em "${itemAlvo.nome}" (${oponente.nome})`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Resistência ${cdItem}`, total: novoPv <= 0 ? `-${dano} PV — QUEBRADO` : `-${dano} PV (${novoPv}/${max})`, tipoClasse: novoPv <= 0 ? "hs" : "hw" });
        if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: `${itemAlvo.nome} (${oponente.nome})`, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdItem, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: novoPv <= 0 ? "Item quebrado!" : `-${dano} PV do item` });
      }
    } else {
      registrar({ tipo: "rolagem", desc: `Dano em "${itemAlvo.nome}" (${oponente.nome})`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Resistência ${cdItem}`, total: "Sem efeito", tipoClasse: "hw" });
      if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: `${itemAlvo.nome} (${oponente.nome})`, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdItem, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: "Sem efeito" });
    }
  };

  /* ----- testes simples: escapar / levantar-se / levantamento / mover-se ----- */
  const periciaUsada = acao.pericia || periciaEscolhida;
  const rolarSimplesAcao = () => {
    const bonusBase = periciaUsada === "inteligencia" ? attr(origemAtual, "inteligencia") : bonusPericia(origemAtual, periciaUsada);
    const ajudaBonus = consumirAjuda(origemAtual, periciaUsada);
    let bonus = bonusBase + ajudaBonus + bonusDescansoAcaoValor;
    const dado = rolarD20();
    critNota = periciaUsada !== "inteligencia" ? bonusCriticoPericia(origemAtual, periciaUsada, dado) : 0;
    bonus += critNota;
    const res = montarTeste(dado, bonus, Number(cd) || 10);
    setR1(res);
    if (acao.id === "escapar" && res.sucesso) {
      const atuais = { ...(origemAtual.condicoes || {}) };
      let mudou = false;
      if (atuais["Agarrado"]) { delete atuais["Agarrado"]; mudou = true; }
      if (atuais["Amarrado"]) { delete atuais["Amarrado"]; mudou = true; }
      if (mudou) atualizarCampo(origemAtual.id, "condicoes", atuais);
    }
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} testa ${acao.nome} (${periciaUsada === "inteligencia" ? "Inteligência" : periciaUsada})`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD ${cd}${fmtMods([...(periciaUsada === "inteligencia" ? notasCondicoesGerais(origemAtual) : notasPericiaEnt(origemAtual, periciaUsada)), ...nDescanso(), ...(ajudaBonus ? [`Ajuda ${fmtBonus(ajudaBonus)}`] : [])])}`, total: acao.id === "escapar" ? (res.sucesso ? "Escapou! Condição removida" : "Continua preso") : res.grauTexto, tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} testa ${acao.nome}`, foto: origemAtual.foto, dado, bonus, total: res.total, cd: Number(cd) || 10, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: acao.id === "escapar" ? (res.sucesso ? "Escapou!" : "Continua preso") : res.grauTexto });
    consumirBonusDescansoAcao();
  };

  /* ----- levantamento ----- */
  const forcaGrad = attr(origemAtual, "forca");
  const pesoFacil = graduacaoParaMassa(forcaGrad);
  const extraMassa = Number(gradMassa) || 0;
  const pesoAlvoLevantamento = graduacaoParaMassa(forcaGrad + extraMassa);
  const cdLevantamento = 10 + extraMassa;
  const rolarLevantamento = () => {
    const bonusBase = bonusPericia(origemAtual, "Atletismo");
    const ajudaBonus = consumirAjuda(origemAtual, "Atletismo");
    let bonus = bonusBase + ajudaBonus + bonusDescansoAcaoValor;
    const dado = rolarD20();
    critNota = bonusCriticoPericia(origemAtual, "Atletismo", dado);
    bonus += critNota;
    const res = montarTeste(dado, bonus, cdLevantamento);
    setR1(res);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Levantamento (até ${pesoAlvoLevantamento}kg)`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD ${cdLevantamento}${fmtMods([...notasPericiaEnt(origemAtual, "Atletismo"), ...nDescanso(), ...(ajudaBonus ? [`Ajuda ${fmtBonus(ajudaBonus)}`] : []), ...(gradMassa ? [`Massa extra: CD +${gradMassa}`] : [])])}`, total: res.grauTexto, tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} testa Levantamento`, foto: origemAtual.foto, dado, bonus, total: res.total, cd: cdLevantamento, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.grauTexto });
    consumirBonusDescansoAcao();
  };

  /* ----- fugir de vista ----- */
  const rolarFuga = () => {
    const bonusBase = bonusPericia(origemAtual, "Furtividade");
    const ajudaBonus = consumirAjuda(origemAtual, "Furtividade");
    let bonus = bonusBase + ajudaBonus + bonusDescansoAcaoValor;
    const dado = rolarD20();
    critNota = bonusCriticoPericia(origemAtual, "Furtividade", dado);
    bonus += critNota;
    const total = dado + bonus;
    const selecionados = outros.filter((o) => oponentesMulti[o.id]);
    const resultados = selecionados.map((o) => { const cdP = valorAlvoComoCD(o, "Percepção"); return { id: o.id, nome: o.nome, cd: cdP, sucesso: total >= cdP }; });
    setMultiResultados({ dado, bonus, total, resultados });
    const passouTudo = resultados.length > 0 && resultados.every((r) => r.sucesso);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Fugir de Vista de ${resultados.length || "nenhum"} oponente(s)`, detalhe: `Furtividade d20(${dado}) ${fmtBonus(bonus)} = ${total}${fmtMods([...notasPericiaEnt(origemAtual, "Furtividade"), ...nDescanso(), ...(ajudaBonus ? [`Ajuda ${fmtBonus(ajudaBonus)}`] : [])])}`, total: resultados.length === 0 ? "Sem alvos selecionados" : passouTudo ? "Ficou furtivo" : "Foi percebido", tipoClasse: resultados.length && passouTudo ? "hs" : "hw" });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} tenta Fugir de Vista`, foto: origemAtual.foto, dado, bonus, total, rotulo: resultados.length === 0 ? "Sem alvos selecionados" : passouTudo ? "Ficou furtivo!" : "Foi percebido" });
    consumirBonusDescansoAcao();
  };

  /* ----- ajudar ----- */
  const rolarAjuda = () => {
    if (!aliado || !chaveAjuda) return;
    const infoChave = AJUDA_CHAVES.find((c) => c.v === chaveAjuda);
    let bonus = (infoChave.tipo === "ataque" ? Math.max(attr(origemAtual, "luta"), attr(origemAtual, "destreza")) : computeBonusBase(origemAtual, infoChave.tipo, chaveAjuda)) + bonusDescansoAcaoValor;
    const dado = rolarD20();
    critNota = infoChave.tipo === "pericia" ? bonusCriticoPericia(origemAtual, chaveAjuda, dado) : 0;
    bonus += critNota;
    const res = montarTeste(dado, bonus, 10);
    setR1(res);
    if (res.sucesso) {
      const grau = Math.max(1, res.graus);
      const buff = { id: uid(), chave: chaveAjuda, bonus: grau * 2, deNome: origemAtual.nome };
      adicionarItemArray(aliado.id, "buffsAjuda", buff);
    }
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} ajuda ${aliado.nome} em ${infoChave.l}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD 10${fmtMods([...notasCondicoesGerais(origemAtual), ...nDescanso()])}`, total: res.sucesso ? `+${Math.max(1, res.graus) * 2} para ${aliado.nome}` : "Não ajudou", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} ajuda ${aliado.nome}`, foto: origemAtual.foto, dado, bonus, total: res.total, cd: 10, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? `+${Math.max(1, res.graus) * 2} para ${aliado.nome}` : "Não ajudou" });
    consumirBonusDescansoAcao();
  };

  /* ----- defender-se / mirar (toggles) ----- */
  const toggleDefender = () => { if (!origemAtual.defendendo) gastarAcaoDaManobra(); atualizarCampo(origemAtual.id, "defendendo", !origemAtual.defendendo); };
  const toggleMirar = () => { if (!origemAtual.mirando) gastarAcaoDaManobra(); atualizarCampo(origemAtual.id, "mirando", !origemAtual.mirando); };

  /* ----- manobras: desmoralizar / fintar ----- */
  const rolarOposicaoCondicao = () => {
    if (!oponente) return;
    const bAt0 = (fintaAgilAtiva ? melhorDe(origemAtual, [acao.pericia, "Acrobacia"]) : bonusPericia(origemAtual, acao.pericia)) + bonusDescansoAcaoValor;
    const bDef = Math.max(bonusPericia(oponente, acao.pericia), statDefesa(oponente, "vontade"));
    const dAt = rolarD20(), dDef = rolarD20();
    critNota = bonusCriticoPericia(origemAtual, fintaAgilAtiva ? melhorPericiaDe(origemAtual, [acao.pericia, "Acrobacia"]) : acao.pericia, dAt);
    const bAt = bAt0 + critNota;
    const totalAt = dAt + bAt, totalDef = dDef + bDef;
    const vitoria = totalAt > totalDef;
    setR2({ dAt, bAt, totalAt, dDef, bDef, totalDef, vitoria });
    // Desmoralizar: até o INÍCIO do próximo turno de quem usou. Fintar: até o FIM do próximo turno de quem usou.
    if (vitoria) aplicarCondicaoTemporaria(atualizarCampo, oponente, acao.condicao, acao.id === "fintar" ? "fim" : "inicio", origemAtual.id, iniciativa);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} usa ${acao.nome} em ${oponente.nome}${fintaAgilAtiva ? " (Finta Ágil: Acrobacia/Enganação)" : ""}`, detalhe: `${totalAt} (d20 ${dAt}${fmtBonus(bAt)}) vs ${totalDef} (d20 ${dDef}${fmtBonus(bDef)})${fmtMods([...notasPericiaEnt(origemAtual, acao.pericia), ...nDescanso(), ...notasPericiaEnt(oponente, acao.pericia).map((t) => `alvo: ${t}`)])}`, total: vitoria ? `${oponente.nome} fica ${acao.condicao}` : "Sem efeito", tipoClasse: vitoria ? "hs" : "hw" });
    if (animar) animar({ modo: "oposta", nomeA: origemAtual.nome, fotoA: origemAtual.foto, dadoA: dAt, bonusA: bAt, totalA: totalAt, nomeB: oponente.nome, fotoB: oponente.foto, dadoB: dDef, bonusB: bDef, totalB: totalDef, vencedor: vitoria ? "A" : (totalAt === totalDef ? "empate" : "B") });
    consumirBonusDescansoAcao();
  };

  /* ----- manobra: encontrão ----- */
  const rolarEncontrao = () => {
    if (!oponente) return;
    const ajudaBonus = consumirAjuda(origemAtual, "ataque");
    const bonus = bonusAtaque(origemAtual, 0, ajudaBonus) + (Number(graduacoesMovidas) || 0);
    const dado = rolarD20();
    const cdDef = cdDefesa(oponente, "aparar");
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Encontrão em ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Aparar ${cdDef}${fmtMods(nAtq(0, ajudaBonus, oponente, "aparar", Number(graduacoesMovidas) ? `Deslocamento ${fmtBonus(Number(graduacoesMovidas))}` : ""))}`, total: res.sucesso ? "Acertou" : "Errou (alvo pode reagir com Agarrar, Derrubar ou Desarmar)", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdDef, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Acertou!" : "Errou" });
  };

  /* ----- manobra: lubridiar (toggle) ----- */
  const toggleLubridiar = () => { if (!origemAtual.lubridiando) gastarAcaoDaManobra(); atualizarCampo(origemAtual.id, "lubridiando", !origemAtual.lubridiando); };

  /* ----- manobra: planejar (criação do plano) ----- */
  const rolarPlano = () => {
    let bonus = bonusPericia(origemAtual, "Investigação") + bonusDescansoAcaoValor;
    const dado = rolarD20();
    critNota = bonusCriticoPericia(origemAtual, "Investigação", dado);
    bonus += critNota;
    const res = montarTeste(dado, bonus, 10);
    setR1(res);
    if (res.sucesso) atualizarCampo(origemAtual.id, "plano", { acoes: Math.max(1, res.graus) });
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} testa Planejar`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD 10${fmtMods([...notasPericiaEnt(origemAtual, "Investigação"), ...nDescanso()])}`, total: res.sucesso ? `${Math.max(1, res.graus)} Ação(ões) de Planejamento` : "Sem plano", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} testa Planejar`, foto: origemAtual.foto, dado, bonus, total: res.total, cd: 10, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? `${Math.max(1, res.graus)} Ação(ões) de Planejamento` : "Sem plano" });
    consumirBonusDescansoAcao();
  };

  /* ----- manobra: gastar ação de planejamento ----- */
  const usarAcaoPlano = () => {
    const plano = origemAtual.plano;
    if (!plano) return;
    let alvo = null, entrada = null, desc = "";
    if (acao.subtipo === "agora") {
      alvo = oponente;
      if (!alvo) return;
      entrada = { id: uid(), tipo: "agora", valor: -2, deNome: origemAtual.nome, consumo: "manual" };
      desc = `${origemAtual.nome} usa Agora! em ${alvo.nome} (Fort/Res/Vont -2)`;
    } else if (acao.subtipo === "cuidado") {
      alvo = aliado;
      if (!alvo) return;
      entrada = { id: uid(), tipo: "cuidado", chave: defesaCuidado, valor: 2, deNome: origemAtual.nome, consumo: "turnoDe", turnoDeId: origemAtual.id };
      desc = `${origemAtual.nome} usa Cuidado em ${alvo.nome} (+2 ${defesaCuidado === "esquiva" ? "Esquiva" : "Aparar"})`;
    } else if (acao.subtipo === "nossoAlvo") {
      alvo = oponente;
      if (!alvo) return;
      entrada = { id: uid(), tipo: "nossoAlvo", valor: 2, deNome: origemAtual.nome, consumo: "ataque", turnoDeId: origemAtual.id };
      desc = `${origemAtual.nome} designa ${alvo.nome} como Nosso Alvo (+2 pro próximo aliado que atacá-lo)`;
    } else if (acao.subtipo === "reposicionar") {
      alvo = aliado;
      if (!alvo) return;
      desc = `${origemAtual.nome} usa Reposicionar: ${alvo.nome} pode usar uma ação de movimento fora do turno`;
    }
    if (entrada && alvo) {
      if (alvo === aliado) adicionarItemArray(alvo.id, "efeitosManobra", entrada);
      else atualizarCampo(alvo.id, "efeitosManobra", [...(alvo.efeitosManobra || []), entrada]);
    }
    const novasAcoes = plano.acoes - 1;
    atualizarCampo(origemAtual.id, "plano", novasAcoes > 0 ? { ...plano, acoes: novasAcoes } : null);
    setR1("feito");
    registrar({ tipo: "rolagem", desc, detalhe: "Ação de Planejamento usada", total: `${Math.max(0, novasAcoes)} restante(s)`, tipoClasse: "hs" });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="modal-box">
        <div className="modal-head"><span className="mt">{acao.nome}</span><button className="modal-close" onClick={fechar}>×</button></div>
        <span className="modal-tag">{acao.tag}</span>
        <div className="modal-desc">{acao.desc}</div>

        {chaveDescansoAcao && !resultadoDescansoJaObtido && (acao.resolvedor !== "levantamento" || extraMassa > 0) && (
          <label className="checkbox-row" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={usarBonusDescansoAcao} onChange={(e) => setUsarBonusDescansoAcao(e.target.checked)} />
            Usar bônus de descanso ({DESCANSO_BONUS_LABEL[chaveDescansoAcao]}) — +2
          </label>
        )}

        {(acao.resolvedor === "oposto" || acao.resolvedor === "desarmar" || acao.resolvedor === "ataqueObjeto") && (
          <>
            <label className="label">Oponente</label>
            <SearchableSelect listaCheia value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setR1(null); setR2(null); setR3(null); setItemAlvoId(""); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </SearchableSelect>

            {acao.resolvedor === "ataqueObjeto" && oponente && (
              <>
                <label className="label">Equipamento do alvo</label>
                <SearchableSelect value={itemAlvoId} onChange={(e) => { setItemAlvoId(e.target.value); setR1(null); setR3(null); }} style={{ marginBottom: 12 }}>
                  <option value="">Selecione…</option>
                  {equipamentosAlvo.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome || "(sem nome)"}{(a.pvItemMax || 0) > 0 ? ` — PV ${a.pvItemAtual ?? a.pvItemMax}/${a.pvItemMax}${itemQuebrado(a) ? " (quebrado)" : ""}` : ""}
                    </option>
                  ))}
                </SearchableSelect>
                {equipamentosAlvo.length === 0 && <div className="field-note">{oponente.nome} não tem equipamentos cadastrados.</div>}
                <label className="checkbox-row"><input type="checkbox" checked={itemSegurado} onChange={(e) => setItemSegurado(e.target.checked)} />Item está sendo segurado (-2 no ataque)</label>
              </>
            )}

            {oponente && !r1 && (acao.resolvedor !== "ataqueObjeto" || itemAlvo) && (
              <button className="btn btn-accent btn-block" style={{ marginBottom: 12 }}
                onClick={acao.resolvedor === "desarmar" ? rolarAtaqueDesarmar : acao.resolvedor === "ataqueObjeto" ? rolarQuebrar : rolarAtaqueOposto}>
                ⚄ Rolar Ataque{acao.penalidade ? ` (${acao.penalidade})` : ""}
              </button>
            )}
            {r1 && <div className="subcard"><ResultadoCard r={r1} efeito={{ classe: r1.sucesso ? "ok" : "dano", titulo: r1.sucesso ? "Acertou!" : "Errou" }} /></div>}

            {acao.resolvedor === "oposto" && r1 && r1.sucesso && !r2 && (
              <button className="btn btn-accent btn-block" onClick={rolarOpostoContestado}>⚄ Rolar teste oposto ({acao.periciaOposta.join("/")})</button>
            )}
            {acao.resolvedor === "oposto" && r2 && (
              <div className="subcard">
                <div className="versus-row">
                  <div className="vs-cell"><div className="vsn">{origemAtual.nome}</div><div className="vsv">{r2.totalAt}</div></div>
                  <div className="vsx">vs</div>
                  <div className="vs-cell"><div className="vsn">{oponente.nome}</div><div className="vsv">{r2.totalDef}</div></div>
                </div>
                <div className={"grau-card " + (r2.vitoria ? "success" : "warn")}>
                  <div className="gl">{r2.vitoria ? "Vitória" : "Sem efeito"}</div>
                  <div className="gn">{acao.id === "agarrar" ? (r2.vitoria ? (r2.graus >= 2 ? "Amarrado" : "Agarrado") : "Resistiu") : (r2.vitoria ? "Caiu" : "Resistiu")}</div>
                </div>
                {acao.id === "agarrar" && r2.vitoria && !temVantagem(origemAtual, "Agarrar Aprimorado") && (
                  <div className="field-note">Sem Agarrar Aprimorado: {origemAtual.nome} fica Vulnerável enquanto agarra.</div>
                )}
              </div>
            )}

            {acao.resolvedor === "ataqueObjeto" && r1 && r1.sucesso && itemAlvo && (
              <>
                {!r3 && <button className="btn btn-accent btn-block" onClick={rolarDanoItem}>⚄ Rolar Dano vs Resistência ({itemAlvo.resistenciaItem || 0})</button>}
                {r3 && (
                  <div className="subcard">
                    <ResultadoCard r={r3} efeito={{ classe: r3.dano > 0 ? "dano" : "ok", titulo: r3.dano > 0 ? `-${r3.dano} PV no item` : "Sem efeito" }} />
                    <div className="field-note">
                      PV do item: {Math.max(0, (itemAlvo.pvItemAtual ?? itemAlvo.pvItemMax ?? 0))}/{itemAlvo.pvItemMax || 0}
                      {itemQuebrado({ ...itemAlvo, pvItemAtual: Math.max(0, (itemAlvo.pvItemAtual ?? itemAlvo.pvItemMax ?? 0)) }) && <b style={{ color: "var(--danger, #e05a5a)" }}> — QUEBRADO</b>}
                    </div>
                  </div>
                )}
              </>
            )}

            {acao.resolvedor === "desarmar" && r1 && r1.sucesso && (
              <>
                <label className="label">CD do salvamento (10 + dano do ataque)</label>
                <input type="number" value={cd} onChange={(e) => setCd(e.target.value)} style={{ marginBottom: 12 }} />
                {!r2 && <button className="btn btn-accent btn-block" onClick={rolarSalvamentoForca}>⚄ Rolar Força do alvo</button>}
                {r2 && <div className="subcard"><ResultadoCard r={r2} efeito={{ classe: r2.sucesso ? "ok" : "dano", titulo: r2.sucesso ? "Manteve o item" : "Soltou o item" }} /></div>}
              </>
            )}
          </>
        )}

        {acao.resolvedor === "buffDefesa" && (
          <>
            <div className="field-note">Reduz o dano recebido em {attr(origemAtual, "vigor")} (seu Vigor) até o início do seu próximo turno.</div>
            <button className={"btn btn-block " + (origemAtual.defendendo ? "btn-accent" : "btn-ghost")} onClick={toggleDefender}>
              {origemAtual.defendendo ? "Defendendo — clique para cancelar" : "Ativar Defender-se"}
            </button>
          </>
        )}

        {acao.resolvedor === "buffMira" && (
          <>
            <div className="field-note">Você fica indefeso e imóvel; seu próximo ataque recebe +10.</div>
            <button className={"btn btn-block " + (origemAtual.mirando ? "btn-accent" : "btn-ghost")} onClick={toggleMirar}>
              {origemAtual.mirando ? "Mirando — clique para cancelar" : "Ativar Mirar"}
            </button>
          </>
        )}

        {acao.resolvedor === "simples" && (
          <>
            {acao.periciaEscolha && (
              <><label className="label">Perícia</label>
              <SearchableSelect value={periciaEscolhida} onChange={(e) => setPericiaEscolhida(e.target.value)} style={{ marginBottom: 12 }}>
                {acao.periciaEscolha.map((p) => <option key={p} value={p}>{p}</option>)}
              </SearchableSelect></>
            )}
            <label className="label">CD</label>
            <input type="number" value={cd} onChange={(e) => setCd(e.target.value)} style={{ marginBottom: 12 }} />
            {!r1 && <button className="btn btn-accent btn-block" onClick={rolarSimplesAcao}>⚄ Rolar {periciaUsada === "inteligencia" ? "Inteligência" : periciaUsada}</button>}
            {r1 && <div className="subcard"><ResultadoCard r={r1} /></div>}
          </>
        )}

        {acao.resolvedor === "levantamento" && (
          <>
            <div className="field-note">Força {fmtBonus(forcaGrad)}: levanta facilmente até <b>{pesoFacil}kg</b>.</div>
            <label className="label" style={{ marginTop: 10 }}>Graduações de massa a mais (além do que levanta fácil)</label>
            <input type="number" value={gradMassa} onChange={(e) => { setGradMassa(e.target.value); setR1(null); }} style={{ marginBottom: 8 }} />
            <div className="field-note" style={{ marginBottom: 12 }}>
              Tentando levantar até <b>{pesoAlvoLevantamento}kg</b>{extraMassa > 0 ? ` — CD ${cdLevantamento}` : " — dentro do que levanta fácil, sem necessidade de teste"}.
            </div>
            {extraMassa <= 0 && (
              <div className="grau-card success"><div className="gl">Sucesso automático</div><div className="gn">Levanta facilmente</div></div>
            )}
            {extraMassa > 0 && !r1 && <button className="btn btn-accent btn-block" onClick={rolarLevantamento}>⚄ Rolar Atletismo</button>}
            {r1 && <div className="subcard"><ResultadoCard r={r1} /></div>}
          </>
        )}

        {acao.resolvedor === "furtividadeMulti" && (
          <>
            <label className="label">Oponentes que podem te ver</label>
            <div className="subcard2" style={{ marginBottom: 12 }}>
              {oponentesDisponiveis.length === 0 && <div className="field-note">Nenhum oponente marcado pelo Mestre.</div>}
              {oponentesDisponiveis.map((o) => (
                <label key={o.id} className="checkbox-row">
                  <input type="checkbox" checked={!!oponentesMulti[o.id]} onChange={(e) => setOponentesMulti((s) => ({ ...s, [o.id]: e.target.checked }))} />
                  {o.nome}
                </label>
              ))}
            </div>
            {!multiResultados && <button className="btn btn-accent btn-block" onClick={rolarFuga}>⚄ Rolar Furtividade</button>}
            {multiResultados && (
              <div className="subcard">
                <div className="meta-row"><span>Furtividade</span><span className="v">d20({multiResultados.dado}) {fmtBonus(multiResultados.bonus)} = {multiResultados.total}</span></div>
                {multiResultados.resultados.map((r) => (
                  <div key={r.id} className="oponente-check-row">
                    {r.nome} <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>(CD {r.cd})</span>
                    <span className={"res " + (r.sucesso ? "ok" : "fail")}>{r.sucesso ? "NÃO VIU" : "PERCEBEU"}</span>
                  </div>
                ))}
                {multiResultados.resultados.length === 0 && <div className="field-note">Selecione ao menos um oponente.</div>}
              </div>
            )}
          </>
        )}

        {acao.resolvedor === "ajudar" && (
          <>
            <label className="label">Aliado a ajudar</label>
            <SearchableSelect listaCheia value={aliadoId} onChange={(e) => setAliadoId(e.target.value)} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {aliadosDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </SearchableSelect>
            {aliado && (
              <>
                <label className="label">Teste que deseja ajudar</label>
                <SearchableSelect value={chaveAjuda} onChange={(e) => setChaveAjuda(e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="">Selecione…</option>
                  {AJUDA_CHAVES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </SearchableSelect>
                {chaveAjuda && !r1 && <button className="btn btn-accent btn-block" onClick={rolarAjuda}>⚄ Rolar (CD 10)</button>}
                {r1 && <div className="subcard"><ResultadoCard r={r1} efeito={r1.sucesso ? { classe: "ok", titulo: `+${Math.max(1, r1.graus) * 2} concedido a ${aliado.nome}` } : { classe: "dano", titulo: "Não conseguiu ajudar" }} /></div>}
              </>
            )}
          </>
        )}

        {acao.resolvedor === "oposicaoCondicao" && (
          <>
            <label className="label">Alvo</label>
            <SearchableSelect listaCheia value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setR2(null); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </SearchableSelect>
            {oponente && !r2 && <button className="btn btn-accent btn-block" onClick={rolarOposicaoCondicao}>⚄ Rolar {acao.pericia}</button>}
            {r2 && (
              <div className="subcard">
                <div className="versus-row">
                  <div className="vs-cell"><div className="vsn">{origemAtual.nome}</div><div className="vsv">{r2.totalAt}</div></div>
                  <div className="vsx">vs</div>
                  <div className="vs-cell"><div className="vsn">{oponente.nome}</div><div className="vsv">{r2.totalDef}</div></div>
                </div>
                <div className={"grau-card " + (r2.vitoria ? "success" : "warn")}>
                  <div className="gl">{r2.vitoria ? "Vitória" : "Sem efeito"}</div>
                  <div className="gn">{r2.vitoria ? `${oponente.nome} fica ${acao.condicao}` : "Alvo resistiu"}</div>
                </div>
              </div>
            )}
          </>
        )}

        {acao.resolvedor === "encontrao" && (
          <>
            <label className="label">Oponente</label>
            <SearchableSelect listaCheia value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setR1(null); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </SearchableSelect>
            <label className="label">Graduações de deslocamento antes do ataque</label>
            <input type="number" value={graduacoesMovidas} onChange={(e) => setGraduacoesMovidas(e.target.value)} style={{ marginBottom: 12 }} />
            {oponente && !r1 && <button className="btn btn-accent btn-block" onClick={rolarEncontrao}>⚄ Rolar Ataque (+{Number(graduacoesMovidas) || 0})</button>}
            {r1 && <div className="subcard"><ResultadoCard r={r1} efeito={{ classe: r1.sucesso ? "ok" : "dano", titulo: r1.sucesso ? "Acertou!" : "Errou — alvo pode reagir" }} /></div>}
          </>
        )}

        {acao.resolvedor === "lubridiar" && (
          <>
            <div className="field-note">Substitui Aparar e Esquiva por 10 + seu bônus de Enganação (atual: {statDefesa(origemAtual, "aparar")} / {statDefesa(origemAtual, "esquiva")}) até você decidir cancelar.</div>
            {condicaoAtiva(origemAtual, "Indefeso") ? (
              <div className="field-note">Você está Indefeso e não pode usar Lubridiar.</div>
            ) : (
              <button className={"btn btn-block " + (origemAtual.lubridiando ? "btn-accent" : "btn-ghost")} onClick={toggleLubridiar}>
                {origemAtual.lubridiando ? "Lubridiando — clique para cancelar" : "Ativar Lubridiar"}
              </button>
            )}
          </>
        )}

        {acao.resolvedor === "planoCombate" && (
          <>
            {origemAtual.plano ? (
              <div className="field-note">Você já tem um plano ativo com {origemAtual.plano.acoes} Ação(ões) de Planejamento. Use o card "Plano Ativo" na ficha para gastá-las.</div>
            ) : (
              <>
                {!r1 && <button className="btn btn-accent btn-block" onClick={rolarPlano}>⚄ Rolar Investigação (CD 10)</button>}
                {r1 && <div className="subcard"><ResultadoCard r={r1} efeito={r1.sucesso ? { classe: "ok", titulo: `${Math.max(1, r1.graus)} Ação(ões) de Planejamento criada(s)` } : { classe: "dano", titulo: "Sem plano" }} /></div>}
              </>
            )}
          </>
        )}

        {acao.resolvedor === "planoEfeito" && (
          <>
            {origemAtual.plano ? (
              <>
                <div className="field-note">Ações de Planejamento restantes: {origemAtual.plano.acoes}</div>
                {(acao.subtipo === "agora" || acao.subtipo === "nossoAlvo") && (
                  <>
                    <label className="label">Inimigo</label>
                    <SearchableSelect listaCheia value={oponenteId} onChange={(e) => setOponenteId(e.target.value)} style={{ marginBottom: 12 }}>
                      <option value="">Selecione…</option>
                      {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </SearchableSelect>
                  </>
                )}
                {(acao.subtipo === "cuidado" || acao.subtipo === "reposicionar") && (
                  <>
                    <label className="label">Aliado</label>
                    <SearchableSelect listaCheia value={aliadoId} onChange={(e) => setAliadoId(e.target.value)} style={{ marginBottom: 12 }}>
                      <option value="">Selecione…</option>
                      {aliadosDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </SearchableSelect>
                  </>
                )}
                {acao.subtipo === "cuidado" && (
                  <>
                    <label className="label">Defesa</label>
                    <SearchableSelect value={defesaCuidado} onChange={(e) => setDefesaCuidado(e.target.value)} style={{ marginBottom: 12 }}>
                      <option value="esquiva">Esquiva</option>
                      <option value="aparar">Aparar</option>
                    </SearchableSelect>
                  </>
                )}
                {r1 !== "feito" && <button className="btn btn-accent btn-block" onClick={usarAcaoPlano}>Usar Ação de Planejamento</button>}
                {r1 === "feito" && <div className="subcard"><div className="field-note">Efeito aplicado.</div></div>}
              </>
            ) : <div className="field-note">Nenhum plano ativo.</div>}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- app principal ---------- */
const INICIATIVA_VAZIA = { ordem: [], turnoAtual: 0, rodada: 1 };

export default function MesaMM3() {
  const [authCarregando, setAuthCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [identidade, setIdentidade] = useState(null);
  const [entidades, setEntidades] = useState([]);
  const [roster, setRoster] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [iniciativa, setIniciativa] = useState(INICIATIVA_VAZIA);
  const [modalCtx, setModalCtx] = useState(null);
  const [acaoCtx, setAcaoCtx] = useState(null);
  const [abaDireita, setAbaDireita] = useState("iniciativa");
  const [eventosAnim, setEventosAnim] = useState([]);
  const [erroSync, setErroSync] = useState(null);
  const [pastas, setPastas] = useState([]);
  const [avisosPF, setAvisosPF] = useState([]);
  const pfSeenRef = useRef(new Set());
  const duracoesLogadasRef = useRef(new Set());
  const entidadesRef = useRef([]);
  useEffect(() => { entidadesRef.current = entidades; }, [entidades]);
  const animSeenRef = useRef(new Set());
  const erroSyncTimeoutRef = useRef(null);

  /* mostra um aviso no topo sempre que uma escrita no Firestore falhar de verdade
     (sem internet, permissão negada, etc.) — antes essas falhas eram 100% silenciosas
     e é isso que fazia fichas "sumirem sem aviso". Ver src/firebase.js. */
  useEffect(() => {
    const unsub = ouvirErrosSalvamento((mensagem) => {
      setErroSync(mensagem);
      if (erroSyncTimeoutRef.current) clearTimeout(erroSyncTimeoutRef.current);
      erroSyncTimeoutRef.current = setTimeout(() => setErroSync(null), 9000);
    });
    return () => { unsub(); if (erroSyncTimeoutRef.current) clearTimeout(erroSyncTimeoutRef.current); };
  }, []);

  /* ---- escrita serializada no storage compartilhado ----
     Cada chamada a setShared(chave, valor) é assíncrona e "solta". Se duas escritas na MESMA
     chave saem quase juntas (ex: rolagem de acerto seguida da rolagem de resistência), a rede
     pode entregá-las fora de ordem — e como o storage é "last write wins", a mais antiga pode
     sobrescrever a mais nova, apagando a entrada mais recente. Para evitar isso, encadeamos as
     escritas por chave num Promise chain: a próxima só começa depois que a anterior terminou,
     garantindo que a última a ser enfileirada seja sempre a última a ser gravada. */
  const filasEscritaRef = useRef({});
  const escreverCompartilhado = useCallback((chave, valor) => {
    const anterior = filasEscritaRef.current[chave] || Promise.resolve();
    const atual = anterior.then(() => setShared(chave, valor)).catch(() => {});
    filasEscritaRef.current[chave] = atual;
    return atual;
  }, []);

  /* recarga manual (botão "↻ Atualizar" do histórico) — fichas e histórico já
     chegam sozinhos em tempo real pelos listeners abaixo; isso só força uma
     releitura da iniciativa, por garantia. */
  const carregarTudo = useCallback(async () => {
    const ini = await getShared("iniciativa");
    setIniciativa(ini && !Array.isArray(ini) && ini.ordem ? ini : INICIATIVA_VAZIA);
  }, []);

  const removerEventoAnim = useCallback((id) => {
    setEventosAnim((atual) => atual.filter((e) => e.id !== id));
  }, []);

  /* dispara uma animação de rolagem para todos os presentes na mesa (fila compartilhada + exibição local imediata) */
  const dispararAnimacao = useCallback((payload) => {
    const evento = { id: uid(), ts: Date.now(), ...payload };
    animSeenRef.current.add(evento.id);
    setEventosAnim((atual) => [...atual, evento]);
    (async () => {
      const filaAtual = await getShared("animQueue");
      const base = Array.isArray(filaAtual) ? filaAtual : [];
      const agora = Date.now();
      const nova = [...base.filter((e) => e && agora - (e.ts || 0) < 20000), evento].slice(-20);
      await escreverCompartilhado("animQueue", nova);
    })();
  }, [escreverCompartilhado]);

  /* observa o login (Firebase Auth) */
  useEffect(() => {
    const unsub = ouvirAuth((u) => {
      setUsuario(u);
      setAuthCarregando(false);
    });
    return unsub;
  }, []);

  /* depois de logado, busca o perfil (nome + papel) salvo para esta conta */
  useEffect(() => {
    if (authCarregando) return;
    if (!usuario) { setIdentidade(null); setCarregando(false); return; }
    (async () => {
      setCarregando(true);
      const perfil = await getPersonal(usuario.uid);
      if (perfil && perfil.papel) setIdentidade(perfil);
      setPastas(Array.isArray(perfil?.pastas) ? perfil.pastas : []);
      setCarregando(false);
    })();
  }, [usuario, authCarregando]);

  /* listeners em tempo real: qualquer mudança feita por outro jogador chega
     na hora, sem precisar dar refresh nem esperar um polling */
  useEffect(() => {
    if (!identidade) return;
    migrarDadosAntigos();
    const unsubEnt = ouvirEntidades(
      (lista) => setEntidades(Array.isArray(lista) ? lista : []),
      { papel: identidade.papel, uid: usuario.uid }
    );
    const unsubRoster = ouvirRoster((lista) => setRoster(Array.isArray(lista) ? lista : []));
    const unsubHist = ouvirHistorico((lista) => setHistorico(Array.isArray(lista) ? lista : []));
    const unsubIni = ouvirShared("iniciativa", (v) => setIniciativa(v && !Array.isArray(v) && v.ordem ? v : INICIATIVA_VAZIA));
    const unsubPF = ouvirShared("pontoFraco", (fila) => {
      if (!Array.isArray(fila)) return;
      const agora = Date.now();
      const novos = fila.filter((ev) => ev && !pfSeenRef.current.has(ev.id) && agora - (ev.ts || 0) < 20000);
      novos.forEach((ev) => pfSeenRef.current.add(ev.id));
      const meus = novos.filter((ev) => {
        const alvo = entidadesRef.current.find((e) => e.id === ev.alvoId);
        return alvo && (alvo.donoUid ? alvo.donoUid === usuario.uid : alvo.dono === identidade.nome);
      });
      if (meus.length) setAvisosPF((a) => [...a, ...meus]);
    });
    const unsubAnim = ouvirShared("animQueue", (fila) => {
      if (!Array.isArray(fila)) return;
      const agora = Date.now();
      const novos = fila.filter((ev) => ev && !animSeenRef.current.has(ev.id) && agora - (ev.ts || 0) < 15000);
      if (novos.length) {
        novos.forEach((ev) => animSeenRef.current.add(ev.id));
        setEventosAnim((atual) => [...atual, ...novos]);
      }
    });
    return () => { unsubEnt(); unsubRoster(); unsubHist(); unsubIni(); unsubAnim(); unsubPF(); };
  }, [identidade, usuario]);

  const escolherIdentidade = async (papel, nome) => {
    const id = { papel, nome: nome.trim() || (papel === "mestre" ? "Mestre" : "Jogador") };
    setIdentidade(id);
    await setPersonal(usuario.uid, id);
  };
  /* volta pra tela de escolha de papel/nome sem deslogar */
  const editarPerfil = () => setIdentidade(null);
  /* desloga da conta */
  const trocarIdentidade = async () => { await sair(); setIdentidade(null); };
  /* salva a lista inteira vinda do FichasTab (criar/editar/excluir ficha), mas
     grava no Firestore só o que de fato mudou — documento por documento — em
     vez de sobrescrever a coleção inteira. Assim, se outro jogador mexeu numa
     ficha diferente enquanto isso, a mudança dele não é apagada. */
  const salvarEntidades = async (novaLista) => {
    let antigas;
    setEntidades((atual) => { antigas = atual; return novaLista; });
    const idsAntigos = new Set(antigas.map((e) => e.id));
    const idsNovos = new Set(novaLista.map((e) => e.id));
    const tarefas = [];
    for (const ent of novaLista) {
      const anterior = antigas.find((e) => e.id === ent.id);
      if (!anterior || JSON.stringify(anterior) !== JSON.stringify(ent)) tarefas.push(salvarEntidade(ent));
    }
    for (const id of idsAntigos) if (!idsNovos.has(id)) tarefas.push(removerEntidadeDoc(id));
    const resultados = await Promise.all(tarefas);
    // Se qualquer escrita falhar (ex.: sem permissão, sem internet), avisamos quem chamou —
    // salvarEntidade()/removerEntidadeDoc() já mostram o aviso vermelho no topo sozinhos, mas
    // quem chamou (o formulário de ficha) também precisa saber, pra não fechar como se tivesse
    // dado tudo certo e a pessoa achar que salvou quando na verdade perdeu a edição.
    return resultados.every((r) => r !== false);
  };
  const registrar = async (entry) => {
    await adicionarHistorico({ tipo: "sistema", ...entry, hora: horaAgora() });
  };
  /* dano > 0 tira primeiro da Vida Temporária; dano < 0 é cura. */
  const aplicarDano = async (entidadeId, dano) => {
    const antes = entidades.find((x) => x.id === entidadeId);
    if (antes && dano > 0 && (antes.pvTemp || 0) > 0) {
      const abs = Math.min(antes.pvTemp, dano);
      registrar({ tipo: "rolagem", desc: `${antes.nome} perde Vida Temporária`, detalhe: `${abs} PV temporários absorveram o dano`, total: `${antes.pvTemp - abs} PV temp.`, tipoClasse: "hw" });
    }
    const chaveTurno = chaveTurnoIniciativa(iniciativa);
    atualizarCampo(entidadeId, "*", (e) => { const d = danoComTemp(e, dano); return { ...e, pvTemp: d.pvTemp, pvAtual: d.pvAtual, ...(dano > 0 ? { ultimoDanoTurno: chaveTurno } : {}) }; });
  };
  /* "valor" pode ser uma função (recebe o valor mais recente do campo). O campo especial "*" recebe uma função
     que transforma a ficha inteira. Mirar e Morrendo são tratados em posProcessarEntidade. */
  const atualizarCampo = async (id, campo, valor) => {
    setEntidades((atual) => {
      const nova = atual.map((e) => {
        if (e.id !== id) return e;
        const ne = campo === "*" ? valor(e) : { ...e, [campo]: typeof valor === "function" ? valor(e[campo]) : valor };
        return posProcessarEntidade(e, ne);
      });
      const alvo = nova.find((e) => e.id === id);
      if (alvo) salvarEntidade(alvo);
      return nova;
    });
  };
  /* Migração automática: fichas antigas foram criadas só com "dono" (nome em texto),
     sem vínculo com a conta de login. Regras de segurança novas do Firestore precisam
     de um uid de verdade ("donoUid") pra saber quem pode ver/editar cada ficha. Sempre
     que o dono de uma ficha antiga (identificado pelo nome ainda bater) entra no site,
     a gente completa esse campo sozinho, uma vez, sem precisar de nada manual. */
  useEffect(() => {
    if (!identidade || !usuario) return;
    entidades.forEach((e) => {
      if (!e.donoUid && e.dono === identidade.nome) atualizarCampo(e.id, "donoUid", usuario.uid);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidades, identidade, usuario]);
  const salvarIniciativa = async (nova) => { setIniciativa(nova); await escreverCompartilhado("iniciativa", nova); };
  const rolarIniciativa = async (entidade) => {
    const dado = rolarD20();
    const bonus = attr(entidade, "agilidade");
    const valor = dado + bonus;
    const restante = (iniciativa.ordem || []).filter((o) => o.entidadeId !== entidade.id);
    const nova = [...restante, { entidadeId: entidade.id, nome: entidade.nome, valor }].sort((a, b) => b.valor - a.valor);
    const proximaIniciativa = { ...iniciativa, ordem: nova };
    await salvarIniciativa(proximaIniciativa);
    registrar({ tipo: "rolagem", desc: `${entidade.nome} rola Iniciativa`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${valor}`, total: valor, tipoClasse: "hs" });
    dispararAnimacao({ modo: "simples", nome: `${entidade.nome} rola Iniciativa`, foto: entidade.foto, dado, bonus, total: valor, rotulo: "Iniciativa" });
  };
  /* Ponto Fraco: manda o texto pra tela do dono de cada alvo que passou no teste (fila compartilhada). */
  const enviarPontoFraco = useCallback(async (payloads) => {
    const lista = Array.isArray(payloads) ? payloads : [payloads];
    const eventos = lista.map((p) => ({ id: uid(), ts: Date.now(), ...p }));
    const filaAtual = await getShared("pontoFraco");
    const base = Array.isArray(filaAtual) ? filaAtual : [];
    const agora = Date.now();
    await escreverCompartilhado("pontoFraco", [...base.filter((e) => e && agora - (e.ts || 0) < 60000), ...eventos].slice(-30));
  }, [escreverCompartilhado]);
  const salvarPastas = async (novas) => {
    setPastas(novas);
    if (usuario) await setPersonal(usuario.uid, { pastas: novas });
  };

  /* Início do turno: tira "Defendendo", efeitos de manobra que duravam "até o começo do turno" de quem os
     aplicou (Cuidado, Nosso Alvo) e as durações do tipo "início" desse mesmo dono do turno. */
  const limparTurnoFlags = (entidadeId) => {
    atualizarCampo(entidadeId, "defendendo", false);
    setEntidades((atual) => {
      const nova = atual.map((e) => {
        const em = e.efeitosManobra || [];
        const em2 = em.filter((m) => !((e.id === entidadeId && m.consumo === "turno" && !m.turnoDeId) || (m.turnoDeId === entidadeId && m.consumo !== "manual")));
        if (em2.length === em.length) return e;
        const ne = { ...e, efeitosManobra: em2 };
        salvarEntidade(ne);
        return ne;
      });
      return nova;
    });
  };
  /* Expira condições/reduções ligadas ao turno de alguém. quando: "inicio" | "fim". */
  const processarDuracoes = (entidadeId, quando) => {
    setEntidades((atual) => atual.map((e) => {
      const ds = e.duracoes || [];
      if (!ds.some((d) => d.turnoDeId === entidadeId && d.quando === quando)) return e;
      const cond = { ...(e.condicoes || {}) };
      const resto = [];
      let dano = 0;
      ds.forEach((d) => {
        if (!(d.turnoDeId === entidadeId && d.quando === quando)) { resto.push(d); return; }
        if (quando === "fim" && d.pular) { resto.push({ ...d, pular: false }); return; }
        if (d.tipo === "condicao" && cond[d.nome]) {
          // Recuperação Instantânea: o dano da condição acontece antes dela acabar.
          if (d.instantanea) {
            let danoCond = 0;
            if (d.nome === "Em Chamas") danoCond = d.nivelOrigem || e.nivel || 1;
            if (d.nome === "Sangrando") danoCond = Math.max(1, Math.round(pvMaxCalc(e) * 0.1));
            if (danoCond > 0) {
              dano += danoCond;
              if (!duracoesLogadasRef.current.has(d.id)) {
                duracoesLogadasRef.current.add(d.id);
                registrar({ tipo: "rolagem", desc: `${e.nome} sofre dano de ${d.nome} no começo do turno`, detalhe: `-${danoCond} PV, depois a condição acaba (Recuperação Instantânea)`, total: `-${danoCond} PV`, tipoClasse: "hd" });
              }
            }
          }
          cond[d.nome] -= 1; if (cond[d.nome] <= 0) delete cond[d.nome];
        }
      });
      let ne = { ...e, condicoes: cond, duracoes: resto };
      if (dano > 0) { const d = danoComTemp(ne, dano); ne = posProcessarEntidade(e, { ...ne, pvTemp: d.pvTemp, pvAtual: d.pvAtual }); }
      salvarEntidade(ne);
      return ne;
    }));
  };
  /* Tudo que acontece sozinho no começo do turno de uma ficha. */
  const iniciarTurnoAutomatico = (entidadeId) => {
    const ent = entidades.find((x) => x.id === entidadeId);
    if (!ent) return;
    atualizarCampo(entidadeId, "acoesGastas", {});
    if (ent.rapidezUsos && Object.keys(ent.rapidezUsos).length) atualizarCampo(entidadeId, "rapidezUsos", {});
    if (condicaoAtiva(ent, "Morto")) return;
    const logs = [];
    const log = (desc, detalhe, total, tipoClasse = "hw") => logs.push({ tipo: "rolagem", desc, detalhe, total, tipoClasse });
    const pvMax = pvMaxCalc(ent);
    let pvSim = ent.pvAtual || 0;
    // Regeneração
    const regen = modificadoresPassivos(ent).regenPorTurno || 0;
    const cura = regen > 0 ? Math.max(0, Math.min(regen, pvMax - pvSim)) : 0;
    if (cura > 0) { pvSim += cura; log(`${ent.nome} regenera no começo do turno`, `+${cura} PV (Regeneração ${regen})`, `${pvSim}/${pvMax} PV`, "hs"); }
    // Custo de Nen das habilidades sustentadas
    let nen = ent.nenAtual || 0;
    let nenGasto = 0;
    const paradas = [];
    (ent.ataques || []).forEach((a) => {
      const sustentada = a.tipo === "passiva" ? (passivaEstaAtiva(a) && a.sustentado) : (a.sustentado && a.sustentando);
      const custo = Number(a.custoNen) || 0;
      if (!sustentada || custo <= 0) return;
      if (nen >= custo) { nen -= custo; nenGasto += custo; log(`${ent.nome} paga o Nen de "${a.nome}" (sustentada)`, `-${custo} Nen`, `${nen} Nen restante`); }
      else { paradas.push(a.id); log(`${ent.nome} não tem Nen para sustentar "${a.nome}"`, `precisa de ${custo}, tem ${nen}`, "Habilidade encerrada"); }
    });
    // Dano de Em Chamas / Sangrando (quem tem Recuperação Instantânea ou expira agora já é tratado em processarDuracoes)
    const jaTratadas = new Set((ent.duracoes || []).filter((d) => d.turnoDeId === entidadeId && d.quando === "inicio").map((d) => d.nome));
    let danoTotal = 0;
    if (condicaoAtiva(ent, "Em Chamas") && !jaTratadas.has("Em Chamas")) {
      const d = ent.condOrigem?.["Em Chamas"] || 2;
      danoTotal += d; log(`${ent.nome} sofre dano de Em Chamas`, `-${d} PV`, "Em Chamas", "hd");
    }
    if (condicaoAtiva(ent, "Sangrando") && !jaTratadas.has("Sangrando")) {
      const d = Math.max(1, Math.round(pvMax * 0.1));
      danoTotal += d; log(`${ent.nome} sofre dano de Sangrando`, `-${d} PV (10% da vida máxima)`, "Sangrando", "hd");
    }
    if (danoTotal > 0 && (ent.pvTemp || 0) > 0) log(`${ent.nome} perde Vida Temporária`, `${Math.min(ent.pvTemp, danoTotal)} PV temporários absorveram o dano`, "", "hw");
    // Exigir Teste dos efeitos de habilidades que continuam sustentadas: testa todo começo de turno.
    // Quem falha perde só aquele efeito (e o jogador é avisado).
    const perdidosNovos = [];
    const avisosNovos = [];
    (ent.ataques || []).forEach((a) => {
      const sustentada = a.tipo === "passiva" ? (passivaEstaAtiva(a) && a.sustentado) : (a.sustentado && a.sustentando);
      if (!sustentada || paradas.includes(a.id)) return;
      const lista = a.tipo === "passiva" ? passivosDe(a) : (a.efeitos || []);
      lista.forEach((it) => {
        if (!it?.exigirTeste?.ativo || (ent.efeitosPerdidos || {})[it.id]) return;
        const rotulo = it.categoria || (PODERES_PASSIVOS.find((p) => p.id === it.tipoId)?.nome) || "efeito";
        const r = rolarExigirTeste(ent, it.exigirTeste);
        log(`${ent.nome} testa Exigir Teste (${a.nome || "Habilidade"} — ${rotulo}) no começo do turno`, `d20(${r.dado}) ${fmtBonus(r.bonus)} = ${r.total} vs CD ${r.cd}${r.pericia ? ` (${r.pericia})` : ""}`, r.sucesso ? "Passou — mantém todas as graduações" : textoResultadoExigirTeste(r), r.sucesso ? "hs" : "hd");
        if (!r.sucesso) {
          perdidosNovos.push(it);
          avisosNovos.push({ id: uid(), texto: `${rotulo} de "${a.nome || "Habilidade"}" foi perdido: ${ent.nome} falhou no Exigir Teste no começo do turno.` });
        }
      });
    });
    const idsPerdidos = perdidosNovos.map((it) => it.id);
    // Aquecimento: efeitos ativos (sustentados) ganham 1 passo a cada começo de turno da ficha.
    const novoAquec = { ...(ent.aquecimento || {}) };
    let mudouAquec = false;
    (ent.ataques || []).forEach((a) => {
      const ativa = a.tipo === "passiva" ? passivaEstaAtiva(a) : (a.sustentado && a.sustentando);
      if (!ativa || paradas.includes(a.id)) return;
      (a.tipo === "passiva" ? passivosDe(a) : (a.efeitos || [])).forEach((it) => {
        if (!it?.aquecimento?.ativo || it?.exigirTeste?.ativo || idsPerdidos.includes(it.id) || (ent.efeitosPerdidos || {})[it.id]) return;
        novoAquec[it.id] = (novoAquec[it.id] || 0) + 1;
        mudouAquec = true;
      });
    });
    // Efeito Colateral das habilidades que continuam sustentadas
    const colatOps = [];
    efeitosColateraisAtivos(ent).forEach(({ ataque: a, item }) => {
      if (paradas.includes(a.id) || idsPerdidos.includes(item.id)) return;
      const col = item.colateral;
      if (!col.condicao) return;
      let ligar = true;
      if (col.comTeste && col.salvamento) ligar = !rolarTesteColateral(ent, item, (x) => logs.push(x));
      else log(`${ent.nome} segue ${col.condicao} (Efeito Colateral de "${a.nome}")`, "Aplicado automaticamente", col.condicao);
      colatOps.push([item.id, col.condicao, ligar]);
    });
    // Explosão acaba no começo do turno e deixa Fatigado
    const teveExplosao = (ent.ataques || []).some((a) => a.tipo === "passiva" && passivosDe(a).some((p) => p.explosaoLigada));
    if (teveExplosao) log(`A Explosão de ${ent.nome} acabou`, "Fica Fatigado", "Fatigado", "hw");
    // Morrendo: contador desce e abre o teste de morte
    const morrendo = condicaoAtiva(ent, "Morrendo") && (pvSim - danoTotal) <= 0;
    if (morrendo) log(`${ent.nome} está Morrendo`, `Contador desce para ${(ent.morrendoContador ?? 3) - 1}`, "Teste de morte pendente", "hd");

    // Ação para sustentar: quem continua sustentando uma habilidade já começa o turno com essa ação gasta.
    const marcasSustentar = {};
    (ent.ataques || []).forEach((a) => {
      const sustentada = a.tipo === "passiva" ? (passivaEstaAtiva(a) && a.sustentado) : (a.sustentado && a.sustentando);
      const k = chaveAcaoDeNome(a.acaoSustentar);
      if (sustentada && k && !paradas.includes(a.id)) marcasSustentar[k] = true;
    });
    atualizarCampo(entidadeId, "*", (e) => {
      let n = { ...e, acoesGastas: marcasSustentar };
      if (cura > 0) n.pvAtual = Math.min(pvMax, (n.pvAtual || 0) + cura);
      if (nenGasto > 0) n.nenAtual = (n.nenAtual || 0) - nenGasto;
      if (danoTotal > 0) { const d = danoComTemp(n, danoTotal); n.pvTemp = d.pvTemp; n.pvAtual = d.pvAtual; }
      if (paradas.length) {
        n.ataques = (n.ataques || []).map((a) => (paradas.includes(a.id) ? (a.tipo === "passiva" ? { ...a, ativo: false } : { ...a, sustentando: false }) : a));
        (e.ataques || []).filter((a) => paradas.includes(a.id)).forEach((a) => itensColaterais(a).forEach((it) => { n = mutarColateral(n, it.id, it.colateral.condicao, false); }));
      }
      colatOps.forEach(([id, nome, ligar]) => { n = mutarColateral(n, id, nome, ligar); });
      if (mudouAquec) n.aquecimento = novoAquec;
      if (perdidosNovos.length) {
        n.efeitosPerdidos = { ...(n.efeitosPerdidos || {}), ...Object.fromEntries(idsPerdidos.map((id) => [id, true])) };
        n.avisosPerdidos = [...(n.avisosPerdidos || []), ...avisosNovos];
        perdidosNovos.forEach((it) => { if (it.colateral?.ativo && it.colateral.condicao) n = mutarColateral(n, it.id, it.colateral.condicao, false); });
      }
      if (teveExplosao) {
        n.ataques = (n.ataques || []).map((a) => (a.tipo === "passiva" ? { ...a, passivos: passivosDe(a).map((p) => ({ ...p, explosaoLigada: false })) } : a));
        n.condicoes = { ...(n.condicoes || {}), Fatigado: (n.condicoes || {}).Fatigado || 1 };
      }
      if (morrendo && n.condicoes?.Morrendo && (n.pvAtual || 0) <= 0) { n.morrendoContador = (n.morrendoContador ?? 3) - 1; n.testeMorteAguardando = true; }
      return n;
    });
    logs.forEach((l) => registrar(l));
  };
  /* Teste de morte: Fortitude contra CD 15 ou a vida negativa (o que for maior). */
  const rolarTesteMorte = (ent) => {
    const cd = Math.max(15, -(ent.pvAtual || 0));
    const dado = rolarD20();
    const bonus = salvBonus(ent, "Fortitude");
    const r = montarTeste(dado, bonus, cd);
    const novo = (ent.morrendoContador ?? 0) + (r.sucesso ? 1 : 0);
    const morreu = novo <= 0;
    registrar({ tipo: "rolagem", desc: `${ent.nome} faz o teste de morte`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${r.total} vs CD ${cd}${fmtMods(notasModsDefesa(ent, "fortitude"))}`, total: morreu ? "Morreu" : (r.sucesso ? `Sobreviveu — contador ${novo}` : `Falhou — contador ${novo}`), tipoClasse: r.sucesso ? "hs" : "hd" });
    dispararAnimacao({ modo: "simples", nome: `${ent.nome} · teste de morte`, foto: ent.foto, dado, bonus, total: r.total, rotulo: "Teste de morte" });
    atualizarCampo(ent.id, "*", (e) => {
      const { testeMorteAguardando, ...resto } = e;
      const novoC = (e.morrendoContador ?? 0) + (r.sucesso ? 1 : 0);
      if (novoC <= 0) { const c = { ...(resto.condicoes || {}) }; delete c["Morrendo"]; c["Morto"] = 1; return { ...resto, condicoes: c, morrendoContador: 0 }; }
      return { ...resto, morrendoContador: novoC };
    });
  };
  const avancarTurno = async () => {
    const ordem = iniciativa.ordem || [];
    if (ordem.length === 0) return;
    let prox = iniciativa.turnoAtual + 1, rodada = iniciativa.rodada;
    if (prox >= ordem.length) { prox = 0; rodada += 1; }
    const quemTerminou = ordem[iniciativa.turnoAtual];
    if (quemTerminou) processarDuracoes(quemTerminou.entidadeId, "fim");
    await salvarIniciativa({ ...iniciativa, turnoAtual: prox, rodada });
    const alvo = ordem[prox];
    if (alvo) { limparTurnoFlags(alvo.entidadeId); processarDuracoes(alvo.entidadeId, "inicio"); iniciarTurnoAutomatico(alvo.entidadeId); }
  };
  const retrocederTurno = async () => {
    const ordem = iniciativa.ordem || [];
    if (ordem.length === 0) return;
    let prox = iniciativa.turnoAtual - 1, rodada = iniciativa.rodada;
    if (prox < 0) { prox = ordem.length - 1; rodada = Math.max(1, rodada - 1); }
    await salvarIniciativa({ ...iniciativa, turnoAtual: prox, rodada });
  };
  const zerarIniciativa = async () => {
    // Fim do combate: o Aquecimento de todas as fichas volta ao começo.
    (entidades || []).forEach((en) => { if (en.aquecimento && Object.keys(en.aquecimento).length) atualizarCampo(en.id, "aquecimento", {}); });
    return salvarIniciativa(INICIATIVA_VAZIA);
  };

  if (authCarregando || carregando) return <div className="mm3"><GlobalStyle /><div className="wrap"><div className="empty">Carregando mesa…</div></div></div>;
  if (!usuario) return <div className="mm3"><GlobalStyle /><TelaLogin onCadastrar={cadastrar} onEntrar={entrar} /></div>;
  if (!identidade) return <div className="mm3"><GlobalStyle /><TelaIdentidade onEscolher={escolherIdentidade} /></div>;

  return (
    <div className="mm3">
      <GlobalStyle />
      {erroSync && (
        <div className="sync-erro-banner">
          <span>⚠ {erroSync}</span>
          <button onClick={() => setErroSync(null)} aria-label="Fechar aviso">×</button>
        </div>
      )}
      <header className="top"><h1>Zona Liminal</h1></header>
      <div className="identbar">
        <div>Logado como <b>{identidade.nome}</b> <span className="pill">{identidade.papel === "mestre" ? "Mestre" : "Jogador"}</span> <span style={{ opacity: 0.6 }}>({usuario.email})</span></div>
        <div>
          <button className="link" onClick={editarPerfil} style={{ marginRight: 12 }}>editar perfil</button>
          <button className="link" onClick={trocarIdentidade}>sair</button>
        </div>
      </div>
      <div className="wrap">
        <div className="split-wrap">
          <div className="split-col col-fichas">
            <FichasTab entidades={entidades} salvar={salvarEntidades} identidade={identidade} usuario={usuario} registrar={registrar}
              onAbrirRolagem={setModalCtx} onAbrirAcao={setAcaoCtx} atualizarCampo={atualizarCampo} onRolarIniciativa={rolarIniciativa}
              pastas={pastas} onSalvarPastas={salvarPastas} />
          </div>
          <div className="split-col col-lateral">
            <div className="tabs-row">
              <div className={"tab-btn" + (abaDireita === "iniciativa" ? " sel" : "")} onClick={() => setAbaDireita("iniciativa")}>Iniciativa</div>
              <div className={"tab-btn" + (abaDireita === "historico" ? " sel" : "")} onClick={() => setAbaDireita("historico")}>Histórico</div>
            </div>
            {abaDireita === "iniciativa" && (
              <IniciativaTab iniciativa={iniciativa} identidade={identidade} onAvancar={avancarTurno} onRetroceder={retrocederTurno} onZerar={zerarIniciativa} />
            )}
            {abaDireita === "historico" && (
              <HistoricoTab historico={historico} onAtualizar={carregarTudo} identidade={identidade} registrar={registrar} />
            )}
          </div>
        </div>
      </div>
      {modalCtx && <RollModal contexto={modalCtx} entidades={entidades} onFechar={() => setModalCtx(null)} registrar={registrar} animar={dispararAnimacao} aplicarDano={aplicarDano} atualizarCampo={atualizarCampo} enviarPontoFraco={enviarPontoFraco} iniciativa={iniciativa} />}
      {acaoCtx && <AcaoModal ctx={acaoCtx} entidades={entidades} roster={roster} onFechar={() => setAcaoCtx(null)} registrar={registrar} animar={dispararAnimacao} atualizarCampo={atualizarCampo} iniciativa={iniciativa} />}
      {avisosPF.length > 0 && (
        <div className="modal-backdrop" onClick={(ev) => { if (ev.target === ev.currentTarget) setAvisosPF((a) => a.slice(1)); }}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-head"><span className="mt">Ponto Fraco descoberto</span><button className="modal-close" onClick={() => setAvisosPF((a) => a.slice(1))}>×</button></div>
            <div className="field-note" style={{ marginBottom: 8 }}>{avisosPF[0].alvoNome} percebeu um ponto fraco em {avisosPF[0].deNome}{avisosPF[0].habilidade ? ` (${avisosPF[0].habilidade})` : ""}:</div>
            <div className="modal-desc" style={{ whiteSpace: "pre-wrap" }}>{avisosPF[0].texto || "(sem texto)"}</div>
          </div>
        </div>
      )}
      {(() => {
        const perdido = entidades.find((x) => (x.avisosPerdidos || []).length > 0 && (identidade.papel === "mestre" || x.donoUid === usuario.uid || x.dono === identidade.nome));
        if (!perdido) return null;
        const aviso = perdido.avisosPerdidos[0];
        return (
          <div className="modal-backdrop">
            <div className="modal-box" style={{ maxWidth: 420 }}>
              <div className="modal-head"><span className="mt">Efeito perdido — {perdido.nome}</span></div>
              <div className="modal-desc">{aviso.texto}</div>
              <div className="field-note" style={{ marginTop: 8 }}>Os outros efeitos da habilidade continuam. Para recuperar este efeito, é preciso ativar a habilidade de novo (e passar no teste).</div>
              <button className="btn btn-accent btn-block" style={{ marginTop: 10 }} onClick={() => atualizarCampo(perdido.id, "avisosPerdidos", (perdido.avisosPerdidos || []).slice(1))}>Ok</button>
            </div>
          </div>
        );
      })()}
      {(() => {
        const pend = entidades.find((x) => x.testeMorteAguardando && (identidade.papel === "mestre" || x.donoUid === usuario.uid || x.dono === identidade.nome));
        if (!pend) return null;
        const cd = Math.max(15, -(pend.pvAtual || 0));
        return (
          <div className="modal-backdrop">
            <div className="modal-box" style={{ maxWidth: 420 }}>
              <div className="modal-head"><span className="mt">Teste de morte — {pend.nome}</span></div>
              <div className="field-note" style={{ marginBottom: 8 }}>{pend.nome} está Morrendo. Contador: <b>{pend.morrendoContador ?? 0}</b> turno(s).</div>
              <div className="modal-desc">Fortitude {fmtBonus(salvBonus(pend, "Fortitude"))} contra CD {cd} (15 ou a vida negativa, o que for maior). Passar sobe o contador em 1; se o contador chegar a 0, {pend.nome} morre.</div>
              <button className="btn btn-accent btn-block" style={{ marginTop: 10 }} onClick={() => rolarTesteMorte(pend)}>⚄ Rolar teste de morte</button>
            </div>
          </div>
        );
      })()}
      <AnimacaoOverlay eventos={eventosAnim} onTerminar={removerEventoAnim} />
    </div>
  );
}

/* ---------- tela de login (e-mail/senha) ---------- */
function TelaLogin({ onEntrar, onCadastrar }) {
  const [modo, setModo] = useState("entrar"); // "entrar" | "cadastrar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const mensagemErro = (code) => {
    switch (code) {
      case "auth/invalid-email": return "E-mail inválido.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential": return "E-mail ou senha incorretos.";
      case "auth/email-already-in-use": return "Já existe uma conta com esse e-mail.";
      case "auth/weak-password": return "A senha precisa ter pelo menos 6 caracteres.";
      default: return "Não foi possível entrar. Tente de novo.";
    }
  };

  const enviar = async () => {
    setErro("");
    if (!email.trim() || !senha) { setErro("Preencha e-mail e senha."); return; }
    setEnviando(true);
    try {
      if (modo === "entrar") await onEntrar(email.trim(), senha);
      else await onCadastrar(email.trim(), senha);
    } catch (e) {
      setErro(mensagemErro(e?.code));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: 420 }}>
      <header className="top"><h1>Mesa M&amp;M3</h1><p>{modo === "entrar" ? "Entre na sua conta" : "Crie sua conta"}</p></header>
      <div className="card">
        <label className="label" htmlFor="login-email">E-mail</label>
        <input id="login-email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 12 }}
          onKeyDown={(e) => e.key === "Enter" && enviar()} />
        <label className="label" htmlFor="login-senha">Senha</label>
        <input id="login-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} style={{ marginBottom: 12 }}
          onKeyDown={(e) => e.key === "Enter" && enviar()} />
        {erro && <div style={{ color: "var(--danger)", fontSize: "0.82rem", marginBottom: 12 }}>{erro}</div>}
        <button className="btn btn-accent btn-block" disabled={enviando} onClick={enviar}>
          {enviando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }}
          onClick={() => { setModo(modo === "entrar" ? "cadastrar" : "entrar"); setErro(""); }}>
          {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}

/* ---------- tela de identidade ---------- */
function TelaIdentidade({ onEscolher }) {
  const [papel, setPapel] = useState(null);
  const [nome, setNome] = useState("");
  return (
    <div className="wrap" style={{ maxWidth: 480 }}>
      <header className="top"><h1>Mesa M&amp;M3</h1><p>Quem é você nesta sessão?</p></header>
      <div className="card">
        <div className="role-choice">
          <div className={"role-card" + (papel === "mestre" ? " sel" : "")} onClick={() => setPapel("mestre")}><div className="rt">Mestre</div></div>
          <div className={"role-card" + (papel === "jogador" ? " sel" : "")} onClick={() => setPapel("jogador")}><div className="rt">Jogador</div></div>
        </div>
        {papel && (
          <>
            <label className="label" htmlFor="nome-id">{papel === "mestre" ? "Seu nome (opcional)" : "Seu nome"}</label>
            <input id="nome-id" type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={{ marginBottom: 12 }} />
            <button className="btn btn-accent btn-block" disabled={papel === "jogador" && !nome.trim()} onClick={() => onEscolher(papel, nome)}>Entrar na mesa</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- efeito (form) ---------- */
function EfeitoForm({ efeito, onMudar, onRemover, onCriarArremesso }) {
  const upd = (campo, valor) => onMudar({ ...efeito, [campo]: valor });
  const mudarCategoria = (cat) => onMudar({ id: efeito.id, ...efeitoPadrao(cat), colateral: efeito.colateral, exigirTeste: efeito.exigirTeste, peculiaridade: efeito.peculiaridade, aquecimento: efeito.aquecimento });
  const addSentido = () => upd("sentidos", [...(efeito.sentidos || []), ""]);
  const updSentido = (i, v) => { const arr = [...efeito.sentidos]; arr[i] = v; upd("sentidos", arr); };
  const rmSentido = (i) => upd("sentidos", efeito.sentidos.filter((_, idx) => idx !== i));

  return (
    <div className="subcard2 ed-efeito">
      <div className="row-inline">
        <SearchableSelect value={efeito.categoria} onChange={(e) => mudarCategoria(e.target.value)}>{EFEITO_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</SearchableSelect>
        <button className="small-btn" onClick={onRemover}>×</button>
      </div>

      {efeito.categoria === "Dano" && (
        <>
          <label className="checkbox-row"><input type="checkbox" checked={!!efeito.baseadoAtivo} onChange={(e) => upd("baseadoAtivo", e.target.checked)} />Dano Baseado Em</label>
          {efeito.baseadoAtivo ? (
            <>
              <label className="label">Atributo</label>
              <SearchableSelect value={efeito.atributoBase || ""} onChange={(e) => upd("atributoBase", e.target.value)} style={{ marginBottom: 8 }}>
                <option value="">Selecione o atributo…</option>
                {ATRIBUTOS.map((a) => <option key={a.k} value={a.k}>{a.l}</option>)}
              </SearchableSelect>
              <label className="label">Dano adicional</label>
              <input type="number" value={efeito.danoAdicional || 0} onChange={(e) => upd("danoAdicional", Number(e.target.value))} />
              <div className="field-note">A graduação do dano é o valor atual do atributo escolhido + o dano adicional (que não varia com o atributo). Ela conta na CD; o dano em si continua limitado pelo nível do atacante.</div>
            </>
          ) : (
            <>
              <label className="label">Graduação de Dano</label>
              <input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} />
            </>
          )}
        </>
      )}
      {efeito.categoria === "Cura" && (
        <>
          <label className="label">Graduação de Cura</label>
          <input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} />
        </>
      )}
      {efeito.categoria === "Aflição" && (
        <>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div><label className="label">Salvamento</label><SearchableSelect value={efeito.salvamento} onChange={(e) => upd("salvamento", e.target.value)}>{(efeito.resistenciaAlternativa ? SALVAMENTOS_ESCOLHA_ALT : SALVAMENTOS_ESCOLHA).map((s) => <option key={s} value={s}>{s}</option>)}</SearchableSelect></div>
            <div><label className="label">Graduação</label><input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} /></div>
          </div>
          <label className="checkbox-row"><input type="checkbox" checked={!!efeito.resistenciaAlternativa} onChange={(e) => { const ativo = e.target.checked; const precisaResetar = !ativo && (efeito.salvamento === "Aparar" || efeito.salvamento === "Esquiva"); onMudar({ ...efeito, resistenciaAlternativa: ativo, ...(precisaResetar ? { salvamento: "Fortitude" } : {}) }); }} />Resistência Alternativa (permite Aparar/Esquiva como salvamento)</label>
          <label className="checkbox-row"><input type="checkbox" checked={!!efeito.recuperacaoInstantanea} onChange={(e) => upd("recuperacaoInstantanea", e.target.checked)} />Recuperação Instantânea</label>
          <div className="field-note" style={{ marginBottom: 10 }}>A condição aplicada por esta aflição é recuperada no começo do turno do alvo. Em Chamas e Sangrando causam o dano antes de acabar.</div>
          <label className="checkbox-row"><input type="checkbox" checked={!!efeito.cumulativo} onChange={(e) => upd("cumulativo", e.target.checked)} />Cumulativo</label>
          <div className="field-note" style={{ marginBottom: 10 }}>Ao impor uma condição de grau 1 em um alvo que já está com uma condição de grau 1 imposta por você (com este efeito), ela se torna uma de grau 2. O mesmo se aplica pro grau 2 (vira grau 3).</div>
          <label className="checkbox-row"><input type="checkbox" checked={!!efeito.condicaoExtra} onChange={(e) => upd("condicaoExtra", e.target.checked)} />Condição extra</label>
          <div className="row-inline" style={{ marginBottom: 6, alignItems: "center" }}>
            <label className="label" style={{ margin: 0 }}>Graus de falha: {grausAflicao(efeito)}</label>
            <button type="button" className="small-btn" title="Adicionar grau" disabled={grausAflicao(efeito) >= 3} onClick={() => upd("graus", grausAflicao(efeito) + 1)}>+</button>
            <button type="button" className="small-btn" title="Remover o último grau" disabled={grausAflicao(efeito) <= 1} onClick={() => upd("graus", grausAflicao(efeito) - 1)}>×</button>
          </div>
          <label className="label">Falha (um grau)</label>
          <div className={efeito.condicaoExtra ? "grid2" : ""} style={{ marginBottom: 8 }}>
            <SearchableSelect value={efeito.grau1} onChange={(e) => upd("grau1", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G1.map((a) => <option key={a} value={a}>{a}</option>)}</SearchableSelect>
            {efeito.condicaoExtra && <SearchableSelect value={efeito.grau1b} onChange={(e) => upd("grau1b", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G1.map((a) => <option key={a} value={a}>{a}</option>)}</SearchableSelect>}
          </div>
          {grausAflicao(efeito) >= 2 && (
            <>
              <label className="label">Falha (dois graus)</label>
              <div className={efeito.condicaoExtra ? "grid2" : ""} style={{ marginBottom: 8 }}>
                <SearchableSelect value={efeito.grau2} onChange={(e) => upd("grau2", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G2.map((a) => <option key={a} value={a}>{a}</option>)}</SearchableSelect>
                {efeito.condicaoExtra && <SearchableSelect value={efeito.grau2b} onChange={(e) => upd("grau2b", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G2.map((a) => <option key={a} value={a}>{a}</option>)}</SearchableSelect>}
              </div>
            </>
          )}
          {grausAflicao(efeito) >= 3 && (
            <>
              <label className="label">Falha (três graus)</label>
              <div className={efeito.condicaoExtra ? "grid2" : ""}>
                <SearchableSelect value={efeito.grau3} onChange={(e) => upd("grau3", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G3.map((a) => <option key={a} value={a}>{a}</option>)}</SearchableSelect>
                {efeito.condicaoExtra && <SearchableSelect value={efeito.grau3b} onChange={(e) => upd("grau3b", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G3.map((a) => <option key={a} value={a}>{a}</option>)}</SearchableSelect>}
              </div>
            </>
          )}
        </>
      )}
      {efeito.categoria === "Enfraquecer" && (
        <>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div><label className="label">Salvamento</label><SearchableSelect value={efeito.salvamento} onChange={(e) => upd("salvamento", e.target.value)}>{SALVAMENTOS_ESCOLHA.map((s) => <option key={s} value={s}>{s}</option>)}</SearchableSelect></div>
            <div><label className="label">Graduação</label><input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} /></div>
          </div>
          <label className="label">Característica afetada</label>
          <input type="text" value={efeito.caracteristica} onChange={(e) => upd("caracteristica", e.target.value)} />
        </>
      )}
      {efeito.categoria === "Camuflagem" && (
        <>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div><label className="label">Salvamento</label><SearchableSelect value={efeito.salvamento} onChange={(e) => upd("salvamento", e.target.value)}>{SALVAMENTOS_ESCOLHA.map((s) => <option key={s} value={s}>{s}</option>)}</SearchableSelect></div>
            <div><label className="label">Graduação</label><input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} /></div>
          </div>
          <label className="label">Sentidos afetados</label>
          {(efeito.sentidos || []).map((s, i) => (
            <div className="row-inline" key={i}><input type="text" value={s} onChange={(e) => updSentido(i, e.target.value)} /><button className="small-btn" onClick={() => rmSentido(i)}>×</button></div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addSentido}>+ Sentido</button>
        </>
      )}
      {efeito.categoria === "Nulificar" && (
        <>
          <label className="label">Teste de resistência do alvo</label>
          <SearchableSelect value={efeito.salvamento || "Vontade"} onChange={(e) => upd("salvamento", e.target.value)}>
            <option value="Vontade">Vontade</option>
            <option value="Fortitude">Fortitude</option>
          </SearchableSelect>
          <div className="field-note">CD: 10 + {efeito.salvamento || "Vontade"} do alvo</div>
          <label className="label">Graduação de Nulificar</label>
          <input type="number" value={efeito.graduacaoNulificar} onChange={(e) => upd("graduacaoNulificar", Number(e.target.value))} />
        </>
      )}
      {efeito.categoria === "Leitura Mental" && (
        <>
          <label className="label">Graduação de Leitura Mental</label>
          <input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} />
        </>
      )}
      {efeito.categoria === "Outros" && (
        <>
          <div className="field-note">Sem rolagem — aplicado automaticamente ao usar a habilidade.</div>
          <label className="label">Descrição do efeito</label>
          <textarea className="outros-textarea" value={efeito.texto || ""} onChange={(e) => upd("texto", e.target.value)} placeholder="Descreva o que esse efeito faz…" rows={3} />
        </>
      )}
      {efeito.categoria === "Mover Objetos" && (
        <>
          <div className="field-note" style={{ marginBottom: 10 }}>
            Toque num objeto pra marcá-lo; com uma ação você move todos os marcados a qualquer distância dentro da sua percepção. A Força efetiva pra erguer/mover é igual à graduação. Usando uma ação de movimento pra se concentrar, some +1 (muda a duração pra Concentração). Não serve pra manipulação fina. Objetos arremessados baseiam o dano na graduação do peso deles.
          </div>
          <MoverObjetosCampos mo={efeito} onMudar={onMudar} onCriarArremesso={onCriarArremesso} />
        </>
      )}
      <div className="divider" />
      <FalhasEfeito item={efeito} onMudar={onMudar} graduacao={efeito.graduacao ?? efeito.graduacaoNulificar} mostrarPeculiaridade={CATEGORIAS_COM_RESISTENCIA.includes(efeito.categoria)} />
    </div>
  );
}

/* ---------- Falhas de um efeito/poder: Exigir Teste, Peculiaridade e Efeito Colateral ---------- */
function ExigirTesteEditor({ valor, onMudar }) {
  const v = valor || {};
  const upd = (c, x) => onMudar({ graduacoes: 1, ...v, [c]: x });
  return (
    <>
      <label className="checkbox-row"><input type="checkbox" checked={!!v.ativo} onChange={(e) => upd("ativo", e.target.checked)} />Exigir Teste</label>
      {v.ativo && (
        <>
          <div className="field-note" style={{ marginBottom: 8 }}>
            Ao usar este efeito (e, se for sustentado, no começo de cada turno), rola um teste da perícia escolhida contra CD 10 + (pontos − 1) + bônus base da perícia (só atributo + pontos da perícia; características e vantagens situacionais não contam). Se falhar, só este efeito é perdido (a ação é gasta). Um 1 natural sempre falha. Ao passar, todas as graduações do efeito ficam disponíveis.
          </div>
          <div className="grid2">
            <div>
              <label className="label">Perícia do teste</label>
              <SearchableSelect value={v.pericia || ""} onChange={(e) => upd("pericia", e.target.value)}>
                <option value="">Selecione…</option>
                {PERICIAS.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
              </SearchableSelect>
            </div>
            <div>
              <label className="label">Pontos de Exigir Teste</label>
              <input type="number" min={1} value={v.graduacoes || 1} onChange={(e) => upd("graduacoes", Math.max(1, Number(e.target.value)))} />
            </div>
          </div>
          {!v.pericia && <div className="field-note" style={{ marginTop: 6 }}>Escolha a perícia do teste{v.atributo ? ` — até lá, usa o atributo antigo (${ATRIBUTOS.find((x) => x.k === v.atributo)?.l || v.atributo})` : ""}.</div>}
        </>
      )}
    </>
  );
}
function AquecimentoEditor({ valor, onMudar }) {
  const v = valor || {};
  return (
    <>
      <label className="checkbox-row"><input type="checkbox" checked={!!v.ativo} onChange={(e) => onMudar({ turnos: 3, ...v, ativo: e.target.checked })} />Aquecimento</label>
      {v.ativo && (
        <SearchableSelect value={String(v.turnos || 3)} onChange={(e) => onMudar({ ...v, turnos: Number(e.target.value) })} style={{ marginBottom: 8 }}>
          <option value="3">Aquecimento 3</option>
          <option value="5">Aquecimento 5</option>
          <option value="10">Aquecimento 10</option>
        </SearchableSelect>
      )}
    </>
  );
}
function PeculiaridadeEditor({ valor, onMudar }) {
  const v = valor || {};
  return (
    <>
      <label className="checkbox-row"><input type="checkbox" checked={!!v.ativo} onChange={(e) => onMudar({ bonus: 2, ...v, ativo: e.target.checked })} />Peculiaridade</label>
      {v.ativo && (
        <>
          <div className="field-note" style={{ marginBottom: 8 }}>
            Se a ficha afetada tiver sofrido dano no turno anterior, ela ganha o bônus abaixo para resistir a este poder. O histórico avisa quando isso acontece.
          </div>
          <SearchableSelect value={String(v.bonus || 2)} onChange={(e) => onMudar({ ...v, bonus: Number(e.target.value) })}>
            <option value="2">+2 para resistir</option>
            <option value="5">+5 para resistir</option>
          </SearchableSelect>
        </>
      )}
    </>
  );
}
const CATEGORIAS_COM_RESISTENCIA = ["Dano", "Aflição", "Enfraquecer", "Camuflagem", "Leitura Mental", "Nulificar"];
function FalhasEfeito({ item, onMudar, graduacao, mostrarPeculiaridade }) {
  return (
    <>
      <div className="section-title" style={{ marginTop: 4 }}>Falhas</div>
      <ExigirTesteEditor valor={item.exigirTeste} onMudar={(x) => onMudar({ ...item, exigirTeste: x })} />
      {mostrarPeculiaridade && <PeculiaridadeEditor valor={item.peculiaridade} onMudar={(x) => onMudar({ ...item, peculiaridade: x })} />}
      <AquecimentoEditor valor={item.aquecimento} onMudar={(x) => onMudar({ ...item, aquecimento: x })} />
      <ColateralEditor colateral={item.colateral} onMudar={(c) => onMudar({ ...item, colateral: c })} graduacao={graduacao} />
    </>
  );
}

/* ---------- Efeito Colateral (usado tanto em efeitos ativos quanto em efeitos passivos) ----------
   Tudo automático: sem teste, a condição é aplicada ao usar/ativar e removida quando a habilidade para.
   Com teste, rola ao usar e de novo no começo de cada turno enquanto sustentada. */
function ColateralEditor({ colateral, onMudar, graduacao }) {
  const col = colateral || {};
  const upd = (campo, valor) => onMudar({ ...col, [campo]: valor });
  return (
    <>
      <label className="checkbox-row"><input type="checkbox" checked={!!col.ativo} onChange={(e) => upd("ativo", e.target.checked)} />Efeito Colateral</label>
      {col.ativo && (
        <>
          <label className="label">Condição</label>
          <SearchableSelect value={col.condicao || ""} onChange={(e) => upd("condicao", e.target.value)}>
            <option value="">Escolha…</option>
            {CONDICOES_LISTA.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
          </SearchableSelect>
          <label className="checkbox-row"><input type="checkbox" checked={!!col.comTeste} onChange={(e) => upd("comTeste", e.target.checked)} />Colateral com Teste</label>
          {col.comTeste && (
            <>
              <label className="label">Teste de resistência</label>
              <SearchableSelect value={col.salvamento || ""} onChange={(e) => upd("salvamento", e.target.value)}>
                <option value="">Escolha…</option>
                <option value="Fortitude">Fortitude</option>
                <option value="Vontade">Vontade</option>
              </SearchableSelect>
            </>
          )}
          <div className="field-note">
            {col.comTeste
              ? `Automático: ao usar e no começo de cada turno enquanto sustentada, testa ${col.salvamento || "—"} CD ${10 + (graduacao || 0)}. Falhou: fica com "${col.condicao || "—"}"; passou: a condição sai.`
              : `Automático: ao usar, o personagem fica com "${col.condicao || "—"}" e a condição sai quando a habilidade parar.`}
          </div>
        </>
      )}
    </>
  );
}

const CORES_PREDEFINIDAS = [
  { nome: "Branco", cor: "#f0eeea" },
  { nome: "Verde", cor: "#9fd8a8" },
  { nome: "Vermelho", cor: "#e29a9a" },
];
/* ---------- editor de texto rico ---------- */
function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const montado = useRef(false);
  useEffect(() => {
    if (!montado.current && ref.current) {
      ref.current.innerHTML = value || "";
      montado.current = true;
    }
  }, [value]);
  const exec = (cmd, val) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  };
  return (
    <div>
      <div className="rich-toolbar">
        <button type="button" onClick={() => exec("bold")}><b>N</b></button>
        <button type="button" onClick={() => exec("italic")}><i>I</i></button>
        <select defaultValue="" onChange={(e) => { if (e.target.value) exec("fontSize", e.target.value); e.target.value = ""; }}>
          <option value="">Tamanho…</option>
          <option value="2">Pequeno</option>
          <option value="3">Normal</option>
          <option value="5">Grande</option>
          <option value="7">Enorme</option>
        </select>
        <input type="color" title="Cor do texto" defaultValue="#f0eeea" onChange={(e) => exec("foreColor", e.target.value)} />
        <button type="button" onClick={() => exec("removeFormat")}>Limpar</button>
      </div>
      <div className="rich-swatches">
        {CORES_PREDEFINIDAS.map((c) => (
          <button key={c.cor} type="button" className="rich-swatch" title={c.nome} style={{ background: c.cor }} onClick={() => exec("foreColor", c.cor)} />
        ))}
      </div>
      <div ref={ref} className="rich-editor" contentEditable suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)} data-placeholder={placeholder || ""} />
    </div>
  );
}

/* ---------- habilidade (form) ----------
   Uma habilidade passiva pode ter vários efeitos passivos ao mesmo tempo (ex:
   "Forma de Combate" pode dar Característica Aumentada + Proteção + Deflexão
   juntos) — igual uma habilidade ativa pode ter vários efeitos. PassivoEditor
   gerencia a LISTA (adicionar/remover), e PassivoInstanceEditor edita UM efeito
   passivo dentro dela. */
function PassivoEditor({ passivos, onMudar }) {
  const lista = passivos || [];
  const updInst = (idx, novo) => { const arr = [...lista]; arr[idx] = novo; onMudar(arr); };
  const addInst = () => onMudar([...lista, { id: uid(), tipoId: "", graduacao: 1, campos: {}, extrasAtivos: {} }]);
  const rmInst = (idx) => onMudar(lista.filter((_, i) => i !== idx));
  return (
    <>
      {lista.map((inst, i) => (
        <PassivoInstanceEditor key={inst.id || i} passivo={inst} onMudar={(novo) => updInst(i, novo)} onRemover={() => rmInst(i)} />
      ))}
      <button className="btn btn-ghost btn-sm" onClick={addInst} style={{ marginBottom: 12 }}>+ Efeito passivo</button>
    </>
  );
}
function RapidezLoja({ passivo, onMudar }) {
  const compras = passivo.campos?.compras || {};
  const escolhas = passivo.campos?.escolhas || {};
  const total = passivo.graduacao || 0;
  const gastos = RAPIDEZ_LOJA.reduce((sum, it) => sum + (compras[it.id] ? it.custo : 0), 0);
  const salvar = (c, es) => onMudar({ ...passivo, campos: { ...(passivo.campos || {}), compras: c, escolhas: es } });
  const comprar = (it, sim) => {
    const c = { ...compras };
    const es = { ...escolhas };
    if (sim) { c[it.id] = true; if (it.escolha?.padrao && !es[it.id]) es[it.id] = it.escolha.padrao; } else delete c[it.id];
    salvar(c, es);
  };
  const escolher = (it, v) => salvar(compras, { ...escolhas, [it.id]: v });
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="label">Loja de Rapidez — {gastos}/{total} pontos usados</div>
      {gastos > total && <div className="field-note" style={{ color: "#e05a5a", marginBottom: 6 }}>Você gastou mais pontos do que tem. Remova uma compra ou aumente os pontos.</div>}
      {RAPIDEZ_LOJA.map((it) => {
        const comprado = !!compras[it.id];
        const semPontos = !comprado && gastos + it.custo > total;
        return (
          <div key={it.id} className="subcard2" style={{ marginBottom: 6, opacity: semPontos ? 0.5 : 1 }}>
            <label className="checkbox-row">
              <input type="checkbox" checked={comprado} disabled={semPontos} onChange={(e) => comprar(it, e.target.checked)} />
              {it.nome} — {it.custo} {it.custo === 1 ? "ponto" : "pontos"}
            </label>
            <div className="field-note">{it.desc}</div>
            {comprado && it.escolha?.tipo === "manobra" && (
              <div style={{ marginTop: 6 }}>
                <label className="label">{it.escolha.label}</label>
                <SearchableSelect value={escolhas[it.id] || it.escolha.padrao} onChange={(e) => escolher(it, e.target.value)}>
                  {Object.entries(MANOBRAS_MAQUINA_PALAVRAS).map(([k, nome]) => <option key={k} value={k}>{nome}</option>)}
                </SearchableSelect>
              </div>
            )}
            {comprado && it.escolha?.tipo === "texto" && (
              <div style={{ marginTop: 6 }}>
                <label className="label">{it.escolha.label}</label>
                <input type="text" value={escolhas[it.id] || ""} placeholder="Nome da habilidade" onChange={(e) => escolher(it, e.target.value)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function PassivoInstanceEditor({ passivo, onMudar, onRemover }) {
  const def = PODERES_PASSIVOS.find((p) => p.id === passivo?.tipoId);
  const upd = (campo, valor) => onMudar({ ...passivo, [campo]: valor });
  const updCampo = (chave, valor) => onMudar({ ...passivo, campos: { ...(passivo.campos || {}), [chave]: valor } });
  const toggleExtra = (chave) => onMudar({ ...passivo, extrasAtivos: { ...(passivo.extrasAtivos || {}), [chave]: !passivo.extrasAtivos?.[chave] } });
  const mudarTipo = (novoId) => onMudar({ id: passivo?.id || uid(), tipoId: novoId, graduacao: 1, campos: {}, extrasAtivos: {}, colateral: passivo?.colateral, exigirTeste: passivo?.exigirTeste, aquecimento: passivo?.aquecimento });
  return (
    <div className="subcard2" style={{ marginBottom: 10 }}>
      <div className="row-inline">
        <SearchableSelect value={passivo?.tipoId || ""} onChange={(e) => mudarTipo(e.target.value)}>
          <option value="">Escolha um efeito…</option>
          {[...PODERES_PASSIVOS].filter((p) => !p.oculto || p.id === passivo?.tipoId).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </SearchableSelect>
        <button className="small-btn" onClick={onRemover}>×</button>
      </div>
      {def && (
        <>
          <div className="field-note" style={{ marginBottom: 8 }}>{def.desc}</div>
          <div style={{ marginBottom: 8 }}><label className="label">{def.id === "rapidez" ? "Pontos de Rapidez" : "Graduação"}</label><input type="number" min={0} value={passivo.graduacao || 0} onChange={(e) => upd("graduacao", Math.max(0, Number(e.target.value)))} /></div>
          {def.id === "rapidez" && <RapidezLoja passivo={passivo} onMudar={onMudar} />}
          {def.campoEscolha && !def.campoEscolha.multi && (
            <div style={{ marginBottom: 8 }}>
              <label className="label">{def.campoEscolha.label}</label>
              <SearchableSelect value={passivo.campos?.[def.campoEscolha.chave] || ""} onChange={(e) => updCampo(def.campoEscolha.chave, e.target.value)}>
                <option value="">Escolha…</option>
                {def.campoEscolha.opcoes.map((o) => <option key={o} value={o}>{def.campoEscolha.rotulos ? def.campoEscolha.rotulos.find((r) => r.k === o)?.l || o : o}</option>)}
              </SearchableSelect>
              {def.campoEscolha.descricoes?.[passivo.campos?.[def.campoEscolha.chave]] && (
                <div className="field-note" style={{ marginTop: 6 }}>{def.campoEscolha.descricoes[passivo.campos[def.campoEscolha.chave]]}</div>
              )}
            </div>
          )}
          {def.campoEscolha && def.campoEscolha.multi && (
            <div style={{ marginBottom: 8 }}>
              <label className="label">{def.campoEscolha.label}</label>
              {def.campoEscolha.opcoes.map((o) => (
                <label className="checkbox-row" key={o}>
                  <input type="checkbox" checked={(passivo.campos?.opcoes || []).includes(o)}
                    onChange={(e) => {
                      const atuais = passivo.campos?.opcoes || [];
                      updCampo("opcoes", e.target.checked ? [...atuais, o] : atuais.filter((x) => x !== o));
                    }} />
                  {o}
                </label>
              ))}
            </div>
          )}
          {(def.extras || []).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="label">Extras</div>
              {def.extras.map((ex) => (
                <label className="checkbox-row" key={ex.chave}>
                  <input type="checkbox" checked={!!passivo.extrasAtivos?.[ex.chave]} onChange={() => toggleExtra(ex.chave)} />
                  {ex.label}
                  {ex.pontos && passivo.extrasAtivos?.[ex.chave] && (
                    <input type="number" min={1} title="Pontos (cada ponto = +2 na CD no crítico)" value={passivo.extrasPontos?.[ex.chave] || 1} style={{ width: 64, marginLeft: 8 }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onMudar({ ...passivo, extrasPontos: { ...(passivo.extrasPontos || {}), [ex.chave]: Math.max(1, Math.round(Number(e.target.value) || 1)) } })} />
                  )}
                </label>
              ))}
            </div>
          )}
          {(def.falhas || []).length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div className="label">Falhas</div>
              {def.falhas.map((fa) => (
                <label className="checkbox-row" key={fa.chave}>
                  <input type="checkbox" checked={!!passivo.extrasAtivos?.[fa.chave]} onChange={() => toggleExtra(fa.chave)} />
                  {fa.label}
                </label>
              ))}
            </div>
          )}
          <div className="divider" />
          <FalhasEfeito item={passivo} onMudar={onMudar} graduacao={passivo.graduacao} mostrarPeculiaridade={false} />
        </>
      )}
    </div>
  );
}

/* Campos de configuração/uso do efeito "Mover Objetos": graduação, Concentração e a lista de
   objetos marcados (com peso e graduação de dano sugerida pro arremesso). Reaproveitado tanto
   no editor da habilidade (ficha) quanto no modal de uso em combate (marcar objetos ao vivo). */
function MoverObjetosCampos({ mo, onMudar, onCriarArremesso }) {
  const updMO = (campo, valor) => onMudar({ ...mo, [campo]: valor });
  const graduacaoEfetiva = (mo.graduacao || 0) + (mo.concentracao ? 1 : 0);
  const capacidadeKg = graduacaoParaMassa(graduacaoEfetiva);
  const objetos = mo.objetos || [];
  const pesoTotal = objetos.reduce((s, o) => s + (Number(o.peso) || 0), 0);
  const sobrecarregado = pesoTotal > capacidadeKg;
  const updObjeto = (idx, campo, valor) => { const arr = [...objetos]; arr[idx] = { ...arr[idx], [campo]: valor }; updMO("objetos", arr); };
  const addObjeto = () => updMO("objetos", [...objetos, { id: uid(), nome: "", peso: 0 }]);
  const rmObjeto = (idx) => updMO("objetos", objetos.filter((_, i) => i !== idx));
  return (
    <>
      <div className="grid2" style={{ marginBottom: 8 }}>
        <div>
          <label className="label">Graduação (Força efetiva)</label>
          <input type="number" min={0} value={mo.graduacao || 0} onChange={(e) => updMO("graduacao", Math.max(0, Number(e.target.value)))} />
        </div>
        <div>
          <label className="label">Capacidade de carga</label>
          <input type="text" disabled value={`${capacidadeKg} kg${mo.concentracao ? " (com Concentração)" : ""}`} />
        </div>
      </div>
      <label className="checkbox-row" style={{ marginBottom: 10 }}>
        <input type="checkbox" checked={!!mo.concentracao} onChange={(e) => updMO("concentracao", e.target.checked)} />
        Concentrando (ação de movimento, +1 na Força efetiva, dura enquanto Concentração)
      </label>

      <label className="label">Objetos marcados</label>
      {objetos.map((o, idx) => {
        const graduacaoDano = massaParaGraduacao(o.peso);
        return (
          <div key={o.id} className="row-inline" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 100 }}>
              <input type="text" placeholder="Nome do objeto" value={o.nome} onChange={(e) => updObjeto(idx, "nome", e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 80 }}>
              <input type="number" min={0} placeholder="Peso (kg)" value={o.peso || 0} onChange={(e) => updObjeto(idx, "peso", Math.max(0, Number(e.target.value)))} />
            </div>
            <button type="button" className="small-btn" onClick={() => rmObjeto(idx)}>×</button>
            <div className="field-note" style={{ width: "100%", margin: "2px 0 6px" }}>
              Dano sugerido se arremessado: graduação {graduacaoDano}
              {onCriarArremesso && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}
                  onClick={() => onCriarArremesso(o.nome, graduacaoDano)}>
                  + Criar ataque de arremesso
                </button>
              )}
            </div>
          </div>
        );
      })}
      <button type="button" className="btn btn-ghost btn-sm" onClick={addObjeto} style={{ marginBottom: 8 }}>+ Marcar objeto</button>
      <div className="field-note" style={{ color: sobrecarregado ? "var(--danger)" : undefined }}>
        Peso total marcado: {pesoTotal} kg / {capacidadeKg} kg{sobrecarregado ? " — SOBRECARREGADO" : ""}
      </div>
    </>
  );
}

/* ---------- Falha: Desgastante ---------- */
function DesgastanteEditor({ desgastante, onMudar }) {
  const d = desgastante || {};
  const upd = (campo, valor) => onMudar({ ...d, [campo]: valor });
  const reds = d.reducoes || [];
  const updRed = (id, patch) => upd("reducoes", reds.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  return (
    <>
      <label className="checkbox-row"><input type="checkbox" checked={!!d.ativo} onChange={(e) => onMudar({ modo: "automatico", salvamento: "Fortitude", reducoes: [], ...d, ativo: e.target.checked })} />Desgastante</label>
      <div className="field-note" style={{ marginBottom: 10 }}>
        Reduz um ou mais atributos de quem usa até o começo do seu próximo turno. Automático: só reduz. Com teste: teste de Fortitude ou Vontade, CD 10 + a maior graduação dos efeitos da habilidade; se passar, não sofre a redução.
      </div>
      {d.ativo && (
        <>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div>
              <label className="label">Versão</label>
              <SearchableSelect value={d.modo || "automatico"} onChange={(e) => upd("modo", e.target.value)}>
                <option value="automatico">Automático</option>
                <option value="teste">Com teste</option>
              </SearchableSelect>
            </div>
            {d.modo === "teste" && (
              <div>
                <label className="label">Teste</label>
                <SearchableSelect value={d.salvamento || "Fortitude"} onChange={(e) => upd("salvamento", e.target.value)}>
                  <option value="Fortitude">Fortitude</option>
                  <option value="Vontade">Vontade</option>
                </SearchableSelect>
              </div>
            )}
          </div>
          <label className="label">Atributos reduzidos</label>
          {reds.map((r) => (
            <div className="row-inline" key={r.id} style={{ marginBottom: 6 }}>
              <SearchableSelect value={r.atributo || ""} onChange={(e) => updRed(r.id, { atributo: e.target.value })}>
                <option value="">Atributo…</option>
                {ATRIBUTOS.map((a) => <option key={a.k} value={a.k}>{a.l}</option>)}
              </SearchableSelect>
              <input type="number" min={1} value={r.valor || 1} style={{ maxWidth: 70 }} title="Quanto reduz" onChange={(e) => updRed(r.id, { valor: Math.max(1, Number(e.target.value) || 1) })} />
              <button type="button" className="small-btn" onClick={() => upd("reducoes", reds.filter((x) => x.id !== r.id))}>×</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => upd("reducoes", [...reds, { id: uid(), atributo: "", valor: 1 }])}>+ Atributo</button>
        </>
      )}
    </>
  );
}

/* ---------- campos de variável (Munição / Carga) usados pela habilidade ---------- */
function VariaveisUsoEditor({ usos, variaveis, onMudarUsos, onCriarVariavel, onMudarVariavel, onExcluirVariavel }) {
  const lista = usos || [];
  const updUso = (id, patch) => onMudarUsos(lista.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  return (
    <div style={{ marginBottom: 10 }}>
      {lista.map((u) => {
        const v = variaveis.find((x) => x.id === u.variavelId);
        const aumenta = (u.delta || 0) > 0;
        return (
          <div className="subcard2" key={u.id} style={{ marginBottom: 8 }}>
            <div className="row-inline">
              <SearchableSelect value={u.variavelId || ""} onChange={(e) => {
                if (e.target.value === "__nova__") {
                  const nv = { id: uid(), nome: "Variável", tipo: "carga", atributo: "forca" };
                  onCriarVariavel(nv);
                  updUso(u.id, { variavelId: nv.id });
                } else updUso(u.id, { variavelId: e.target.value });
              }}>
                <option value="">Escolha a variável…</option>
                {variaveis.map((x) => <option key={x.id} value={x.id}>{x.nome || "Variável"}</option>)}
                <option value="__nova__">+ Nova variável</option>
              </SearchableSelect>
              <button type="button" className="small-btn" title="Tirar este campo da habilidade" onClick={() => onMudarUsos(lista.filter((x) => x.id !== u.id))}>×</button>
            </div>
            {v && (
              <>
                <div className="grid2" style={{ marginTop: 8 }}>
                  <div><label className="label">Nome</label><input type="text" value={v.nome} onChange={(e) => onMudarVariavel(v.id, { nome: e.target.value })} /></div>
                  <div>
                    <label className="label">Tipo</label>
                    <SearchableSelect value={v.tipo || "carga"} onChange={(e) => onMudarVariavel(v.id, { tipo: e.target.value, valor: undefined })}>
                      <option value="municao">Munição (baseada em atributo)</option>
                      <option value="carga">Carga (começa em 0)</option>
                    </SearchableSelect>
                  </div>
                </div>
                {v.tipo === "municao" && (
                  <div style={{ marginTop: 8 }}>
                    <label className="label">Atributo (valor máximo)</label>
                    <SearchableSelect value={v.atributo || "forca"} onChange={(e) => onMudarVariavel(v.id, { atributo: e.target.value })}>
                      {ATRIBUTOS.map((a) => <option key={a.k} value={a.k}>{a.l}</option>)}
                    </SearchableSelect>
                  </div>
                )}
                <div className="grid2" style={{ marginTop: 8 }}>
                  <div>
                    <label className="label">Ao usar a habilidade</label>
                    <SearchableSelect value={aumenta ? "aumenta" : "reduz"} onChange={(e) => updUso(u.id, { delta: (e.target.value === "aumenta" ? 1 : -1) * Math.max(1, Math.abs(u.delta || 1)) })}>
                      <option value="reduz">Reduz</option>
                      <option value="aumenta">Aumenta</option>
                    </SearchableSelect>
                  </div>
                  <div>
                    <label className="label">Quantidade</label>
                    <input type="number" min={1} value={Math.max(1, Math.abs(u.delta || 1))} onChange={(e) => updUso(u.id, { delta: (aumenta ? 1 : -1) * Math.max(1, Number(e.target.value) || 1) })} />
                  </div>
                </div>
                <div className="field-note">Não pode ficar negativa: se a habilidade reduzir além do que há, ela não pode ser usada.{v.tipo === "municao" ? " Munição nunca passa do máximo." : ""}</div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }} onClick={() => onExcluirVariavel(v.id)}>Excluir variável da ficha</button>
              </>
            )}
          </div>
        );
      })}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMudarUsos([...lista, { id: uid(), variavelId: "", delta: -1 }])}>+ Campo (variável)</button>
    </div>
  );
}

function AtaqueForm({ ataque, onMudar, onRemover, onCriarArremesso, onSubir, onDescer, variaveis = [], onCriarVariavel, onMudarVariavel, onExcluirVariavel }) {
  const [extrasAberto, setExtrasAberto] = useState(false);
  const [exigirTesteAberto, setExigirTesteAberto] = useState(false);
  const [ajImgAberto, setAjImgAberto] = useState(false);
  const colapsado = !!ataque.colapsado;
  const setColapsado = (fnOuValor) => {
    const novo = typeof fnOuValor === "function" ? fnOuValor(colapsado) : fnOuValor;
    upd("colapsado", novo);
  };
  const upd = (campo, valor) => onMudar({ ...ataque, [campo]: valor });
  const updEfeito = (idx, novo) => { const arr = [...ataque.efeitos]; arr[idx] = novo; upd("efeitos", arr); };
  const addEfeito = () => upd("efeitos", [...ataque.efeitos, { id: uid(), ...efeitoPadrao("Dano") }]);
  const rmEfeito = (idx) => upd("efeitos", ataque.efeitos.filter((_, i) => i !== idx));
  const ehPassiva = ataque.tipo === "passiva";
  return (
    <div className={"subcard ed-hab" + (ehPassiva ? " passiva" : "")}>
      <div className="row-inline ed-hab-topo">
        <button type="button" className="small-btn" onClick={() => setColapsado((s) => !s)} title={colapsado ? "Expandir" : "Recolher"}>{colapsado ? "▶" : "▼"}</button>
        <div className="reorder-btns">
          <button type="button" className="small-btn" onClick={onSubir} disabled={!onSubir} title="Mover pra cima">▲</button>
          <button type="button" className="small-btn" onClick={onDescer} disabled={!onDescer} title="Mover pra baixo">▼</button>
        </div>
        <input type="text" placeholder="Nome da habilidade" value={ataque.nome} onChange={(e) => upd("nome", e.target.value)} />
        <button className="small-btn" onClick={onRemover}>×</button>
      </div>
      {colapsado && (
        <div className="ed-hab-tags"><span className={"hab-tag" + (ehPassiva ? "" : " ligada")}>{ehPassiva ? "Passiva" : "Ativa"}</span>{!ehPassiva && <span className="hab-tag">{ataque.acao || acaoDaHabilidade(ataque)}</span>}{ataque.equipamento && <span className="hab-tag">Equipamento</span>}{ataque.sustentado && <span className="hab-tag">Sustentado</span>}{(ataque.pp || 0) > 0 && <span className="hab-tag">{ataque.pp} PP</span>}</div>
      )}
      {!colapsado && (
      <>
      {!ehPassiva && (
        <div style={{ marginBottom: 10 }}>
          <label className="label">Tipo de acerto</label>
          <SearchableSelect value={ataque.tipoAcerto} onChange={(e) => upd("tipoAcerto", e.target.value)}>{TIPOS_ACERTO.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</SearchableSelect>
        </div>
      )}
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div>
          <label className="label">{ataque.equipamento ? "Custo (pontos de equipamento)" : "Custo (pontos de poder)"}</label>
          <input type="number" min={0} value={ataque.pp || 0} onChange={(e) => upd("pp", Math.max(0, Number(e.target.value)))} />
        </div>
        <label className="checkbox-row" style={{ alignSelf: "end", marginBottom: 11 }}>
          <input type="checkbox" checked={!!ataque.equipamento} onChange={(e) => upd("equipamento", e.target.checked)} />
          Equipamento
        </label>
      </div>
      {ataque.equipamento && (
        <div className="grid2" style={{ marginBottom: 10 }}>
          <div>
            <label className="label">Pontos de Vida do item</label>
            <input type="number" min={0} value={ataque.pvItemMax || 0} onChange={(e) => {
              const novoMax = Math.max(0, Number(e.target.value));
              const atual = ataque.pvItemAtual ?? ataque.pvItemMax ?? novoMax;
              onMudar({ ...ataque, pvItemMax: novoMax, pvItemAtual: Math.min(atual, novoMax) });
            }} />
          </div>
          <div>
            <label className="label">Resistência do item</label>
            <input type="number" min={0} value={ataque.resistenciaItem || 0} onChange={(e) => upd("resistenciaItem", Math.max(0, Number(e.target.value)))} />
          </div>
        </div>
      )}
      {ataque.equipamento && (ataque.pvItemMax || 0) > 0 && (() => {
        const max = ataque.pvItemMax || 0;
        const atual = Math.max(0, Math.min(max, ataque.pvItemAtual ?? max));
        const pct = max > 0 ? Math.round((atual / max) * 100) : 0;
        const quebrado = itemQuebrado(ataque);
        const cor = quebrado ? "var(--danger)" : pct <= 33 ? "var(--warn)" : "var(--success)";
        const cheio = atual >= max;
        return (
          <div className="item-pv-box" style={{ marginBottom: 10 }}>
            <div className="item-pv-head">
              <span>PV do item {quebrado && <b style={{ color: "var(--danger)" }}>— QUEBRADO</b>}</span>
              <b style={{ color: cor }}>{atual}/{max}</b>
            </div>
            <div className="item-pv-track"><div className="item-pv-fill" style={{ width: `${pct}%`, background: cor }} /></div>
            <button type="button" className="btn btn-ghost btn-sm item-pv-restaurar" disabled={cheio} onClick={() => upd("pvItemAtual", max)}>
              ♻ Restaurar PV
            </button>
          </div>
        );
      })()}
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div>
          <label className="label">Custo de Vida</label>
          <input type="number" min={0} value={ataque.custoVida || 0} onChange={(e) => upd("custoVida", Math.max(0, Number(e.target.value)))} />
        </div>
        <div>
          <label className="label">Custo de Nen</label>
          <input type="number" min={0} value={ataque.custoNen || 0} onChange={(e) => upd("custoNen", Math.max(0, Number(e.target.value)))} />
        </div>
      </div>
      <VariaveisUsoEditor usos={ataque.usoVariaveis} variaveis={variaveis} onMudarUsos={(novos) => upd("usoVariaveis", novos)}
        onCriarVariavel={onCriarVariavel || (() => {})} onMudarVariavel={onMudarVariavel || (() => {})} onExcluirVariavel={onExcluirVariavel || (() => {})} />

      <div className="row-inline" style={{ marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div className="tipo-toggle" role="tablist" aria-label="Tipo de habilidade">
          <button type="button" role="tab" aria-selected={!ehPassiva} className={!ehPassiva ? "sel" : ""} onClick={() => upd("tipo", "ativa")}><span className="dot" />Ativa</button>
          <button type="button" role="tab" aria-selected={ehPassiva} className={ehPassiva ? "sel" : ""} onClick={() => upd("tipo", "passiva")}><span className="dot" />Passiva</button>
        </div>
        <label className="checkbox-row" style={{ marginBottom: 0 }}>
          <input type="checkbox" checked={!!ataque.sustentado} onChange={(e) => upd("sustentado", e.target.checked)} />
          Sustentado
        </label>
      </div>
      <div className="foto-upload-row ed-hab-img">
        {ataque.imagem ? <div className="foto-preview ed-hab-prev"><ImgAj src={ataque.imagem} aj={ataque.imagemAj} /></div> : <div className="foto-preview" />}
        <div>
          <label className="label">Imagem ou GIF da habilidade</label>
          <input type="file" accept="image/*" onChange={async (ev) => {
            const file = ev.target.files[0]; ev.target.value = "";
            if (!file) return;
            try {
              if (file.type === "image/gif") {
                if (file.size > 350 * 1024) { alert("Esse GIF é grande demais (máximo ~350 KB). Reduza o tamanho/duração e tente de novo."); return; }
                onMudar({ ...ataque, imagem: await lerComoDataUrl(file), imagemAj: null });
              } else onMudar({ ...ataque, imagem: await resizeImageFile(file, 560, 0.75), imagemAj: null });
            } catch (err) { alert("Não foi possível ler essa imagem."); }
          }} />
          {ataque.imagem && (
            <div className="ed-foto-botoes">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAjImgAberto((s) => !s)}>{ajImgAberto ? "Fechar ajuste" : "✥ Ajustar enquadramento"}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMudar({ ...ataque, imagem: null, imagemAj: null })}>Remover imagem</button>
            </div>
          )}
          <div className="field-note">Aparece no cartão da habilidade e na rolagem quando ela é usada. GIFs animados até ~350 KB.</div>
        </div>
        {ataque.imagem && ajImgAberto && <div style={{ flexBasis: "100%" }}><AjusteImagem src={ataque.imagem} ajuste={ataque.imagemAj} onMudar={(v) => upd("imagemAj", v)} proporcao="5 / 2" maxLargura={380} /></div>}
      </div>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div>
          <label className="label">Ação para usar</label>
          <SearchableSelect value={ataque.acao || acaoDaHabilidade(ataque)} onChange={(e) => upd("acao", e.target.value)}>
            {ACOES_USO_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
          </SearchableSelect>
        </div>
        {ataque.sustentado && (
          <div>
            <label className="label">Ação para sustentar</label>
            <SearchableSelect value={ataque.acaoSustentar || "Nenhuma"} onChange={(e) => upd("acaoSustentar", e.target.value)}>
              {ACOES_SUSTENTAR_OPCOES.map((o) => <option key={o} value={o}>{o}</option>)}
            </SearchableSelect>
          </div>
        )}
      </div>

      {!ehPassiva && (
        <>
          <div className="acoes-header ed-colapso-head" onClick={() => setExtrasAberto((s) => !s)}>
            <div className="section-title" style={{ marginBottom: 0 }}>Extras</div>
            <span className={"arrow" + (extrasAberto ? " open" : "")}>▶</span>
          </div>
          {extrasAberto && (
            <div className="subcard2 ed-colapso" style={{ marginBottom: 10 }}>
              <label className="checkbox-row">
                <input type="checkbox" checked={!!ataque.extras?.dividido}
                  onChange={(e) => upd("extras", { ...(ataque.extras || {}), dividido: e.target.checked, multiataque: e.target.checked ? false : !!ataque.extras?.multiataque })} />
                Dividido <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>(+1 ponto por graduação)</span>
              </label>
              <div className="field-note" style={{ marginBottom: 10 }}>
                Um efeito resistível que funciona em um alvo pode ser dividido entre dois alvos diferentes. O atacante escolhe quantas graduações se aplicam a cada alvo. Cada graduação adicional deste modificador permite que o poder seja dividido mais uma vez. Não pode ser combinado com Multiataque.
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={!!ataque.extras?.multiataque}
                  onChange={(e) => upd("extras", { ...(ataque.extras || {}), multiataque: e.target.checked, dividido: e.target.checked ? false : !!ataque.extras?.dividido })} />
                Multiataque <span style={{ color: "var(--muted)", fontSize: "0.7rem" }}>(+2 pontos por graduação)</span>
              </label>
              <div className="field-note">
                Permite fazer um único ataque extra por ataque. Ao acertar, pode fazer esse ataque extra contra o mesmo alvo com -10 no teste de ataque, ou contra um alvo diferente engajado no combate com -5. Não pode ser combinado com Dividido.
              </div>
            </div>
          )}

          <div className="section-title ed-sub">Efeitos</div>
          {ataque.efeitos.map((ef, i) => <EfeitoForm key={ef.id} efeito={ef} onMudar={(novo) => updEfeito(i, novo)} onRemover={() => rmEfeito(i)} onCriarArremesso={onCriarArremesso} />)}
          <button className="btn btn-ghost btn-sm" onClick={addEfeito} style={{ marginBottom: 12 }}>+ Efeito</button>
        </>
      )}

      {ehPassiva && (
        <>
          <div className="section-title ed-sub">Efeitos passivos</div>
          <PassivoEditor passivos={passivosDe(ataque)} onMudar={(nova) => upd("passivos", nova)} />
        </>
      )}

      <div className="acoes-header ed-colapso-head" onClick={() => setExigirTesteAberto((s) => !s)}>
        <div className="section-title" style={{ marginBottom: 0 }}>Falhas</div>
        <span className={"arrow" + (exigirTesteAberto ? " open" : "")}>▶</span>
      </div>
      {exigirTesteAberto && (
        <div className="subcard2" style={{ marginBottom: 10 }}>
          <DesgastanteEditor desgastante={ataque.desgastante} onMudar={(d) => upd("desgastante", d)} />

          <div className="divider" />
          <label className="checkbox-row">
            <input type="checkbox" checked={!!ataque.pontoFraco?.ativo} onChange={(e) => upd("pontoFraco", { texto: "", ...(ataque.pontoFraco || {}), ativo: e.target.checked })} />
            Ponto Fraco
          </label>
          <div className="field-note" style={{ marginBottom: 10 }}>
            Ao usar a habilidade, você escolhe entre as criaturas engajadas quem vai tentar notar o ponto fraco. Cada uma faz Investigação contra um único teste de Enganação seu; quem passar vê o texto abaixo na tela.
          </div>
          {ataque.pontoFraco?.ativo && (
            <textarea className="outros-textarea" rows={3} value={ataque.pontoFraco?.texto || ""} onChange={(e) => upd("pontoFraco", { ...ataque.pontoFraco, texto: e.target.value })} placeholder="Texto do ponto fraco (aparece para quem passar no teste)…" />
          )}

        </div>
      )}

      <label className="label">Descrição / texto da habilidade</label>
      <RichTextEditor value={ataque.textoFormatado || ""} onChange={(html) => upd("textoFormatado", html)} placeholder="Descreva a habilidade…" />
      </>
      )}
    </div>
  );
}

/* ---------- imagens com enquadramento (zoom + posição) ---------- */
function estiloAjuste(aj) {
  const z = Math.max(1, Math.min(4, aj?.z || 1));
  return { transform: `translate(${aj?.x || 0}%, ${aj?.y || 0}%) scale(${z})`, transformOrigin: "center center" };
}
function ImgAj({ src, aj, className, alt = "", style }) {
  return <img src={src} alt={alt} className={className} style={{ ...style, ...estiloAjuste(aj) }} draggable={false} />;
}
function AjusteImagem({ src, ajuste, onMudar, proporcao = "1 / 1", maxLargura = 260 }) {
  const caixa = useRef(null);
  const arrasto = useRef(null);
  const aj = { z: 1, x: 0, y: 0, ...(ajuste || {}) };
  const fixa = (n) => {
    const z = Math.max(1, Math.min(4, n.z));
    const l = (z - 1) * 50;
    return { z, x: Math.max(-l, Math.min(l, n.x)), y: Math.max(-l, Math.min(l, n.y)) };
  };
  const aoPressionar = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    arrasto.current = { px: e.clientX, py: e.clientY, x: aj.x, y: aj.y };
  };
  const aoMover = (e) => {
    const a = arrasto.current;
    if (!a || !caixa.current) return;
    const r = caixa.current.getBoundingClientRect();
    onMudar(fixa({ ...aj, x: a.x + ((e.clientX - a.px) / r.width) * 100, y: a.y + ((e.clientY - a.py) / r.height) * 100 }));
  };
  const soltar = () => { arrasto.current = null; };
  return (
    <div className="aj-img">
      <div ref={caixa} className="aj-caixa" style={{ aspectRatio: proporcao, maxWidth: maxLargura }}
        onPointerDown={aoPressionar} onPointerMove={aoMover} onPointerUp={soltar} onPointerCancel={soltar}>
        <ImgAj src={src} aj={aj} />
        <span className="aj-grade" />
      </div>
      <div className="aj-controles">
        <button type="button" className="small-btn" title="Diminuir zoom" onClick={() => onMudar(fixa({ ...aj, z: aj.z - 0.2 }))}>−</button>
        <input type="range" min={1} max={4} step={0.05} value={aj.z} onChange={(e) => onMudar(fixa({ ...aj, z: Number(e.target.value) }))} />
        <button type="button" className="small-btn" title="Aumentar zoom" onClick={() => onMudar(fixa({ ...aj, z: aj.z + 0.2 }))}>+</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMudar(null)}>Centralizar</button>
      </div>
      <div className="field-note">Arraste a imagem para posicionar e use o zoom para aproximar ({Math.round(aj.z * 100)}%).</div>
    </div>
  );
}

/* ---------- Dashboard da ficha (edição) ---------- */
const PAL_DASH = ["#e8c84a", "#5cc3f5", "#4cba7a", "#c084fc", "#e8964a", "#f08fb0", "#3fae9a", "#a3b4ff", "#d9d36b", "#ff8f70"];
function pct(n) { return Math.round(Math.max(0, Math.min(1, n)) * 100); }
function chanceMinD20(necessario) { return Math.max(0, Math.min(1, (21 - necessario) / 20)); } // P(d20 >= necessario)
function fmtNum(n, d = 1) { return Number.isInteger(n) ? String(n) : n.toFixed(d).replace(".", ","); }
function danoPorTurnoCondicao(cond, ficha) {
  if (cond === "Em Chamas") return Math.max(1, ficha?.nivel || 1);
  if (cond === "Sangrando") return Math.max(1, Math.round(pvMaxCalc(ficha) * 0.1));
  return 0;
}
function GraficoLinha({ series, xMax, yMax, rotuloY = "" }) {
  const W = 640, H = 230, ml = 40, mr = 14, mt = 12, mb = 28;
  const x = (t) => ml + (t / Math.max(1, xMax)) * (W - ml - mr);
  const y = (v) => mt + (1 - Math.max(0, v) / Math.max(1, yMax)) * (H - mt - mb);
  const passoX = xMax > 16 ? 5 : xMax > 8 ? 2 : 1;
  const ticksY = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(p * yMax));
  return (
    <svg className="dash-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfico de ${rotuloY} por turno`}>
      {ticksY.map((v, i) => (
        <g key={i}>
          <line x1={ml} x2={W - mr} y1={y(v)} y2={y(v)} className="dash-grade" />
          <text x={ml - 6} y={y(v) + 4} textAnchor="end" className="dash-eixo">{v}</text>
        </g>
      ))}
      {Array.from({ length: Math.floor(xMax / passoX) + 1 }, (_, i) => i * passoX).map((t) => (
        <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="dash-eixo">{t}</text>
      ))}
      <text x={W - mr} y={H - 8} textAnchor="end" className="dash-eixo">turno</text>
      {series.map((s) => {
        const pts = s.pontos.map((v, t) => [x(t), y(v)]);
        const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
        const area = s.area ? `${d} L${pts[pts.length - 1][0].toFixed(1)} ${y(0)} L${pts[0][0].toFixed(1)} ${y(0)} Z` : null;
        return (
          <g key={s.nome}>
            {area && <path d={area} fill={s.cor} opacity="0.14" />}
            <path d={d} fill="none" stroke={s.cor} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.tracejado ? "5 5" : undefined} opacity={s.tracejado ? 0.6 : 1} />
            {!s.tracejado && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={s.cor} />)}
          </g>
        );
      })}
    </svg>
  );
}
function Rosca({ fatias, total, centro, sub }) {
  const R = 54, C = 2 * Math.PI * R;
  let acum = 0;
  return (
    <svg className="dash-rosca" viewBox="0 0 140 140" role="img" aria-label="Distribuição dos pontos de poder">
      <circle cx="70" cy="70" r={R} fill="none" stroke="var(--surface3)" strokeWidth="18" />
      {fatias.filter((s) => s.v > 0).map((s) => {
        const len = (s.v / Math.max(1, total)) * C;
        const el = <circle key={s.nome} cx="70" cy="70" r={R} fill="none" stroke={s.cor} strokeWidth="18" strokeDasharray={`${Math.max(0, len - 1.5)} ${C}`} strokeDashoffset={-acum} transform="rotate(-90 70 70)" />;
        acum += len;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" className="dash-rosca-num">{centro}</text>
      <text x="70" y="86" textAnchor="middle" className="dash-eixo">{sub}</text>
    </svg>
  );
}
function Radar({ itens, max }) {
  const n = itens.length, cx = 120, cy = 118, R = 80;
  const ang = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i, v) => { const r = (Math.max(0, v + 2) / Math.max(1, max + 2)) * R; return [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]; };
  const poly = itens.map((it, i) => pt(i, it.v).map((n2) => n2.toFixed(1)).join(",")).join(" ");
  return (
    <svg className="dash-radar" viewBox="0 0 240 236" role="img" aria-label="Radar de atributos">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} points={itens.map((_, i) => [cx + Math.cos(ang(i)) * R * k, cy + Math.sin(ang(i)) * R * k].map((n2) => n2.toFixed(1)).join(",")).join(" ")} fill="none" stroke="var(--border)" />
      ))}
      {itens.map((_, i) => <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(ang(i)) * R} y2={cy + Math.sin(ang(i)) * R} stroke="var(--border)" />)}
      <polygon points={poly} fill="rgba(232,200,74,0.22)" stroke="var(--accent)" strokeWidth="2" />
      {itens.map((it, i) => {
        const [px, py] = pt(i, it.v);
        const lx = cx + Math.cos(ang(i)) * (R + 17), ly = cy + Math.sin(ang(i)) * (R + 15);
        return (
          <g key={it.l}>
            <circle cx={px} cy={py} r="3" fill="var(--accent)" />
            <text x={lx} y={ly + 3} textAnchor="middle" className="dash-eixo">{it.l.slice(0, 4)} {it.v}</text>
          </g>
        );
      })}
    </svg>
  );
}
function PainelFicha({ f }) {
  const [off, setOff] = useState({});
  const [usos, setUsos] = useState({});
  const [defAlvo, setDefAlvo] = useState(3);
  const [resAlvo, setResAlvo] = useState(3);
  const [mostrarPericias, setMostrarPericias] = useState(false);

  const nenMax = nenMaxCalc(f), pvMax = pvMaxCalc(f), pvTemp = Number(f.pvTemp) || 0;
  const ataques = f.ataques || [];
  const habs = ataques.map((a, i) => {
    const passiva = a.tipo === "passiva";
    const sust = !!a.sustentado;
    const lista = passiva ? passivosDe(a) : (a.efeitos || []);
    const custoNen = Number(a.custoNen) || 0;
    const custoVida = Number(a.custoVida) || 0;
    const nUsos = (!sust && !passiva) ? (usos[a.id] ?? 1) : 1;
    const nenTurno = passiva ? (sust ? custoNen : 0) : (sust ? custoNen : custoNen * nUsos);
    const nenUnico = passiva && !sust ? custoNen : 0;
    const vidaTurno = passiva ? (sust ? custoVida : 0) : (sust ? custoVida : custoVida * nUsos);
    const vidaUnica = passiva && !sust ? custoVida : 0;
    const ativoPorTurno = sust || passiva; // condições do Efeito Colateral ficam enquanto a habilidade segue ligada
    let regen = 0, danoCondTurno = 0;
    const colaterais = [];
    const aquecimentos = [];
    const testes = [];
    const alvoCond = [];
    lista.forEach((it) => {
      if (passiva && it.tipoId === "regeneracao") regen += it.graduacao || 0;
      const c = it?.colateral;
      if (c?.ativo && c.condicao) {
        const dano = danoPorTurnoCondicao(c.condicao, f);
        let pFalha = 1;
        if (c.comTeste && c.salvamento) {
          const cd = 10 + (it.graduacao || it.graduacaoNulificar || 0);
          pFalha = 1 - chanceMinD20(cd - salvBonus(f, c.salvamento));
        }
        colaterais.push({ cond: c.condicao, dano, comTeste: !!c.comTeste, pFalha });
        if (ativoPorTurno) danoCondTurno += dano * pFalha;
      }
      if (it?.aquecimento?.ativo && !it?.exigirTeste?.ativo) {
        const G = Math.floor(it.graduacao ?? it.graduacaoNulificar ?? 0);
        const N = Number(it.aquecimento.turnos) || 3;
        const seq = [];
        for (let c2 = 0; c2 < 60; c2++) { const g = graduacaoAquecida(G, N, c2); seq.push(g); if (g >= G) break; }
        aquecimentos.push({ nome: it.categoria || (PODERES_PASSIVOS.find((p) => p.id === it.tipoId)?.nome) || "Efeito", G, N, seq, turnos: seq.length - 1 });
      }
      if (it?.exigirTeste?.ativo) {
        const et = it.exigirTeste;
        const pontos = Math.max(1, Number(et.graduacoes) || 1);
        const base = et.pericia ? bonusBasePericia(f, et.pericia) : attrBase(f, et.atributo || "luta");
        const bonus = et.pericia ? bonusPericia(f, et.pericia) : attr(f, et.atributo || "luta");
        const cd = 10 + (pontos - 1) + base;
        const need = Math.max(2, cd - bonus);
        testes.push({ nome: it.categoria || (PODERES_PASSIVOS.find((p) => p.id === it.tipoId)?.nome) || "Efeito", cd, bonus, p: chanceMinD20(need), pericia: et.pericia || et.atributo || "" });
      }
      if (it?.categoria === "Aflição") {
        ["grau1", "grau1b", "grau2", "grau2b", "grau3", "grau3b"].forEach((k) => {
          const v = String(it[k] || "");
          if (/em chamas/i.test(v)) alvoCond.push({ cond: "Em Chamas", dano: Math.max(1, f.nivel || 1) });
          if (/sangrando/i.test(v)) alvoCond.push({ cond: "Sangrando", dano: "10% da vida máx. do alvo" });
        });
      }
    });
    const vars = (a.usoVariaveis || []).filter((u) => u.variavelId && u.delta).map((u) => {
      const v = (f.variaveis || []).find((x) => x.id === u.variavelId);
      return v ? { v, delta: u.delta } : null;
    }).filter(Boolean);
    return { a, i, cor: PAL_DASH[i % PAL_DASH.length], passiva, sust, nenTurno, nenUnico, vidaTurno, vidaUnica, regen, danoCondTurno, colaterais, aquecimentos, testes, alvoCond, vars, nUsos, custoNen, custoVida };
  });

  const ligadas = habs.filter((h) => !off[h.a.id]);
  const soma = (lista, k) => lista.reduce((s, h) => s + h[k], 0);
  function simular(lista) {
    const nenTurno = soma(lista, "nenTurno"), nenUnico = soma(lista, "nenUnico");
    const vidaTurno = soma(lista, "vidaTurno") + soma(lista, "danoCondTurno");
    const regen = soma(lista, "regen");
    const vidaLiq = vidaTurno - regen;
    const vidaUnica = soma(lista, "vidaUnica");
    const nenDispo = nenMax - nenUnico;
    const durNen = nenTurno > 0 ? Math.max(0, Math.floor(nenDispo / nenTurno)) : Infinity;
    const pvTotal = pvMax + pvTemp - vidaUnica;
    const durVida = vidaLiq > 0 ? Math.max(0, Math.ceil(pvTotal / vidaLiq) - 1) : Infinity;
    return { nenTurno, nenUnico, vidaTurno, regen, vidaLiq, vidaUnica, durNen, durVida, dur: Math.min(durNen, durVida) };
  }
  const sel = simular(ligadas);
  const todas = simular(habs);
  const horizonte = (() => {
    const bases = [sel.durNen, sel.durVida, todas.durNen, todas.durVida].filter((x) => Number.isFinite(x));
    return Math.max(6, Math.min(30, (bases.length ? Math.max(...bases) : 6) + 2));
  })();
  const curva = (s, max, tipo) => Array.from({ length: horizonte + 1 }, (_, t) => {
    if (tipo === "nen") return Math.max(0, max - s.nenUnico - t * s.nenTurno);
    return Math.max(0, max - s.vidaUnica - t * s.vidaLiq);
  });
  const mostrarVida = sel.vidaLiq !== 0 || todas.vidaLiq !== 0 || sel.vidaUnica > 0;
  const mudouSelecao = ligadas.length !== habs.length;
  const txtDur = (n) => (Number.isFinite(n) ? `${n} turno${n === 1 ? "" : "s"}` : "∞");
  const gastosPP = pontosPoderGastos(f), ppMax = pontosPoderMax(f);

  // pontos de poder
  const ppAtr = Object.values(f.atributos || {}).reduce((s, v) => s + (v || 0), 0) * 2;
  const ppPer = Object.values(f.periciaPontos || {}).reduce((s, v) => s + (v || 0), 0);
  const ppVan = (f.vantagens || []).reduce((s, v) => s + (v.graduacoes || 1), 0);
  const ppHabs = ataques.reduce((s, a) => s + custoAtaque(a), 0);
  const ppLivre = Math.max(0, ppMax - gastosPP);
  const fatias = [
    { nome: "Atributos", v: ppAtr, cor: PAL_DASH[1] }, { nome: "Perícias", v: ppPer, cor: PAL_DASH[2] },
    { nome: "Vantagens", v: ppVan, cor: PAL_DASH[3] }, { nome: "Habilidades", v: ppHabs, cor: PAL_DASH[0] },
    { nome: "Livres", v: ppLivre, cor: "rgba(255,255,255,0.18)" },
  ];
  const totalRosca = Math.max(ppMax, gastosPP);
  const maiorHabPP = Math.max(1, ...ataques.map((a) => custoAtaque(a)));

  // dados
  const bAtqC = attr(f, "luta"), bAtqD = attr(f, "destreza");
  const linhasRolagem = [
    { n: "Ataque corpo a corpo", b: bAtqC }, { n: "Ataque à distância", b: bAtqD },
    ...[["aparar", "Aparar"], ["esquiva", "Esquiva"], ["fortitude", "Fortitude"], ["vontade", "Vontade"], ["resistencia", "Resistência"]].map(([k, l]) => ({ n: l, b: statDefesa(f, k) })),
  ];
  const periciasOrd = PERICIAS.map((p) => ({ n: p.nome, b: bonusPericia(f, p.nome) })).sort((a, b) => b.b - a.b);
  const linhasPericias = mostrarPericias ? periciasOrd : periciasOrd.slice(0, 4);
  const cdDefAlvo = 10 + defAlvo;
  const ataquesAtivos = habs.filter((h) => !h.passiva && ["corpo", "distancia"].includes(h.a.tipoAcerto));
  function distribuicao(cd, bonusAlvo) {
    // chances de o alvo passar e de falhar em 1, 2, 3, 4+ graus
    const out = { passa: 0, g1: 0, g2: 0, g3: 0, g4: 0 };
    for (let d = 1; d <= 20; d++) {
      const diff = d + bonusAlvo - cd;
      if (diff >= 0) { out.passa += 0.05; continue; }
      const g = Math.floor((-diff - 1) / 5) + 1;
      out["g" + Math.min(4, g)] += 0.05;
    }
    return out;
  }
  const efeitosDano = [];
  ataques.forEach((a, i) => {
    if (a.tipo === "passiva") return;
    (a.efeitos || []).forEach((ef) => {
      const g = ef.graduacao ?? ef.graduacaoNulificar ?? 0;
      let cd = null;
      if (ef.categoria === "Dano") cd = 15 + g + (ef.danoAdicional || 0);
      else if (["Aflição", "Enfraquecer", "Leitura Mental"].includes(ef.categoria)) cd = 10 + g;
      else if (ef.categoria === "Camuflagem") cd = 15 + g;
      if (cd != null) efeitosDano.push({ hab: a.nome || "(sem nome)", cor: PAL_DASH[i % PAL_DASH.length], cat: ef.categoria, g, cd, dist: distribuicao(cd, resAlvo) });
    });
  });
  const vantCrit = (f.vantagens || []).filter((v) => v.nome === "Crítico Aprimorado");
  const passivosCalc = modificadoresPassivos(f);
  const varsResumo = {};
  habs.forEach((h) => h.vars.forEach(({ v, delta }) => {
    if (!varsResumo[v.id]) varsResumo[v.id] = { v, porTurno: 0, usos: [] };
    const ligadoNoGrafico = !off[h.a.id];
    if (ligadoNoGrafico) varsResumo[v.id].porTurno += delta * (h.passiva || h.sust ? 1 : h.nUsos);
    varsResumo[v.id].usos.push(h.a.nome || "(sem nome)");
  }));

  const alternar = (id) => setOff((o) => ({ ...o, [id]: !o[id] }));
  const ehSolo = (id) => habs.length > 1 && habs.every((h) => (h.a.id === id ? !off[h.a.id] : !!off[h.a.id]));
  // clicar numa habilidade isola; clicar de novo tira o filtro
  const soEste = (id) => setOff(ehSolo(id) ? {} : Object.fromEntries(habs.filter((h) => h.a.id !== id).map((h) => [h.a.id, true])));
  const radarMax = atributoMax(f.nivel);

  const Tile = ({ rot, val, sub, cor }) => (
    <div className="dash-tile" style={cor ? { "--tile": cor } : undefined}>
      <span className="dash-tile-rot">{rot}</span>
      <span className="dash-tile-val">{val}</span>
      {sub && <span className="dash-tile-sub">{sub}</span>}
    </div>
  );

  return (
    <div className="dash">
      <div className="dash-tiles">
        <Tile rot="Nen por turno" val={fmtNum(sel.nenTurno)} sub={sel.nenUnico > 0 ? `+${fmtNum(sel.nenUnico)} de ativação única` : `de ${nenMax} de Nen`} cor="#5cc3f5" />
        <Tile rot="Duração (Nen)" val={txtDur(sel.durNen)} sub={mudouSelecao ? `com a seleção (${ligadas.length}/${habs.length})` : "com tudo ligado"} cor="#5cc3f5" />
        <Tile rot="Vida por turno" val={sel.vidaLiq === 0 ? "0" : (sel.vidaLiq > 0 ? "−" : "+") + fmtNum(Math.abs(sel.vidaLiq))} sub={sel.regen > 0 ? `regeneração +${sel.regen}` : "custos e condições"} cor="#4cba7a" />
        <Tile rot="Duração (Vida)" val={txtDur(sel.durVida)} sub={`de ${pvMax}${pvTemp ? ` (+${pvTemp})` : ""} PV`} cor="#4cba7a" />
        <Tile rot="Pontos de Poder" val={`${gastosPP}/${ppMax}`} sub={gastosPP > ppMax ? "excedido!" : `${ppLivre} livres`} cor="#e8c84a" />
      </div>
      {Number.isFinite(sel.dur) && <div className="dash-destaque">Com a seleção atual, a ficha aguenta <b>{txtDur(sel.dur)}</b> de combate {sel.dur === sel.durNen && sel.dur !== sel.durVida ? "(o Nen acaba primeiro)" : sel.dur === sel.durVida && sel.dur !== sel.durNen ? "(a Vida acaba primeiro)" : ""}.</div>}
      {!Number.isFinite(sel.dur) && <div className="dash-destaque">Nenhuma habilidade selecionada drena Nen ou Vida por turno — a seleção atual dura indefinidamente.</div>}

      <div className="dash-bloco">
        <div className="dash-titulo">Habilidades no gráfico</div>
        <div className="dash-chips">
          {habs.length === 0 && <span className="field-note">Crie habilidades para vê-las aqui.</span>}
          {habs.map((h) => (
            <button key={h.a.id} type="button" className={"dash-chip" + (off[h.a.id] ? " off" : "")} aria-pressed={!off[h.a.id]} onClick={() => alternar(h.a.id)} title="Ligar/desligar no gráfico">
              <span className="dash-dot" style={{ background: h.cor }} />{h.a.nome || "(sem nome)"}
              <small>{h.nenTurno > 0 ? `${fmtNum(h.nenTurno)} Nen/t` : h.nenUnico > 0 ? `${h.nenUnico} Nen (1×)` : "sem custo"}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="dash-bloco">
        <div className="dash-titulo">Nen restante por turno</div>
        <GraficoLinha xMax={horizonte} yMax={nenMax} rotuloY="Nen"
          series={[
            ...(mudouSelecao ? [{ nome: "Tudo ligado", cor: "#8a8a92", pontos: curva(todas, nenMax, "nen"), tracejado: true }] : []),
            { nome: "Seleção", cor: "#5cc3f5", pontos: curva(sel, nenMax, "nen"), area: true },
            ...(mostrarVida ? [{ nome: "Vida", cor: "#4cba7a", pontos: curva(sel, pvMax + pvTemp, "vida").map((v) => (v / Math.max(1, pvMax + pvTemp)) * nenMax) }] : []),
          ]} />
        <div className="dash-legenda">
          <span><i style={{ background: "#5cc3f5" }} />Nen (seleção)</span>
          {mudouSelecao && <span><i style={{ background: "#8a8a92" }} />Nen com tudo ligado</span>}
          {mostrarVida && <span><i style={{ background: "#4cba7a" }} />Vida (em escala do Nen)</span>}
        </div>
        <div className="field-note">Cada habilidade sustentada paga o custo na ativação e de novo no começo de cada turno. Habilidades ativas não sustentadas pagam a cada uso (ajuste os usos por turno abaixo).</div>
      </div>

      <div className="dash-bloco">
        <div className="dash-titulo">Para onde vai o Nen, por habilidade</div>
        {sel.nenTurno > 0 ? (
          <>
            <div className="dash-barra-pilha">
              {ligadas.filter((h) => h.nenTurno > 0).map((h) => <span key={h.a.id} style={{ width: (h.nenTurno / sel.nenTurno) * 100 + "%", background: h.cor }} title={`${h.a.nome}: ${fmtNum(h.nenTurno)} Nen/turno`} />)}
            </div>
            <div className="dash-legenda">
              {ligadas.filter((h) => h.nenTurno > 0).map((h) => <span key={h.a.id}><i style={{ background: h.cor }} />{h.a.nome || "(sem nome)"} · {fmtNum(h.nenTurno)} ({pct(h.nenTurno / sel.nenTurno)}%)</span>)}
            </div>
          </>
        ) : <div className="field-note">Nenhuma habilidade selecionada gasta Nen por turno.</div>}
      </div>

      <div className="dash-bloco">
        <div className="dash-titulo">Cada poder, isolado</div>
        <div className="field-note" style={{ marginTop: -4 }}>Clique numa habilidade para ver só ela no gráfico; clique de novo para voltar.</div>
        <div className="dash-tabela-wrap">
          <table className="dash-tabela">
            <thead><tr><th>Habilidade</th><th>Ação</th><th>Nen/turno</th><th>Dura (Nen)</th><th>Vida/turno</th><th>PP</th>{habs.some((h) => !h.passiva && !h.sust) && <th>Usos/turno</th>}</tr></thead>
            <tbody>
              {habs.map((h) => {
                const s = simular([h]);
                return (
                  <tr key={h.a.id} className={"dash-linha-clicavel" + (off[h.a.id] ? " off" : "") + (ehSolo(h.a.id) ? " solo" : "")} onClick={() => soEste(h.a.id)} title={ehSolo(h.a.id) ? "Clique para tirar o filtro" : "Clique para ver só esta habilidade"}>
                    <td><span className="dash-dot" style={{ background: h.cor }} />{h.a.nome || "(sem nome)"}<div className="dash-mini">{h.passiva ? "Passiva" : "Ativa"}{h.sust ? " · Sustentada" : ""}{h.a.equipamento ? " · Equipamento" : ""}</div></td>
                    <td>{acaoDaHabilidade(h.a)}</td>
                    <td>{fmtNum(h.nenTurno)}{h.nenUnico > 0 ? ` (+${h.nenUnico})` : ""}</td>
                    <td>{txtDur(s.durNen)}</td>
                    <td>{s.vidaLiq === 0 ? "—" : (s.vidaLiq > 0 ? "−" : "+") + fmtNum(Math.abs(s.vidaLiq))}</td>
                    <td>{h.a.equipamento ? "eq. " : ""}{h.a.pp || 0}</td>
                    {habs.some((x) => !x.passiva && !x.sust) && (
                      <td className="dash-celula-acao" onClick={(ev) => ev.stopPropagation()}>
                        {!h.passiva && !h.sust ? <span className="dash-usos" title="Usos por turno">×<input type="number" min={0} max={9} value={usos[h.a.id] ?? 1} onChange={(e) => setUsos((u) => ({ ...u, [h.a.id]: Math.max(0, Math.min(9, Number(e.target.value) || 0)) }))} /></span> : <span className="dash-mini">—</span>}
                      </td>
                    )}
                  </tr>
                );
              })}
              {habs.length === 0 && <tr><td colSpan={7} className="dash-mini">Sem habilidades.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {(habs.some((h) => h.colaterais.length || h.alvoCond.length || h.vidaTurno > 0 || h.regen > 0 || h.vidaUnica > 0) || Object.keys(varsResumo).length > 0) && (
        <div className="dash-bloco">
          <div className="dash-titulo">Vida, condições e variáveis</div>
          <div className="dash-lista">
            {habs.map((h) => h.colaterais.map((c, k) => (
              <div key={h.a.id + "c" + k} className="dash-linha dano"><span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> deixa você <b>{c.cond}</b>{c.comTeste ? ` (com teste, ${pct(c.pFalha)}% de falhar)` : ""}{c.dano > 0 ? <> — <b>−{c.dano} PV</b> por turno{c.comTeste ? ` (esperado −${fmtNum(c.dano * c.pFalha)})` : ""}</> : " — sem dano direto"}{!(h.sust || h.passiva) && c.dano > 0 ? " (só enquanto durar, não é sustentada)" : ""}.</div>
            )))}
            {habs.map((h) => h.vidaTurno > 0 && <div key={h.a.id + "v"} className="dash-linha dano"><span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> custa <b>{h.custoVida} PV</b> {h.sust ? "por turno (sustentada)" : `por uso (${h.nUsos}×/turno)`}.</div>)}
            {habs.map((h) => h.vidaUnica > 0 && <div key={h.a.id + "vu"} className="dash-linha dano"><span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> custa <b>{h.vidaUnica} PV</b> uma vez, ao ativar.</div>)}
            {habs.map((h) => h.regen > 0 && <div key={h.a.id + "r"} className="dash-linha cura"><span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> regenera <b>+{h.regen} PV</b> por turno.</div>)}
            {habs.map((h) => h.alvoCond.map((c, k) => <div key={h.a.id + "a" + k} className="dash-linha"><span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> pode aplicar <b>{c.cond}</b> no alvo — {typeof c.dano === "number" ? `${c.dano} PV` : c.dano} por turno.</div>))}
            {Object.values(varsResumo).map(({ v, porTurno, usos: nomes }) => {
              const max = v.tipo === "municao" ? maxVariavel(f, v) : null;
              const gasto = v.tipo === "municao" ? -porTurno : porTurno;
              return (
                <div key={v.id} className="dash-linha"><b>{v.nome || "Variável"}</b> ({v.tipo === "municao" ? `munição, máx. ${max}` : "carga, começa em 0"}) — usada por {nomes.join(", ")}. {gasto !== 0 ? (v.tipo === "municao" ? (gasto > 0 ? `Gasta ${gasto} por turno e acaba em ${Math.floor(max / gasto)} turno(s).` : `Recupera ${-gasto} por turno.`) : `${porTurno > 0 ? "Acumula" : "Reduz"} ${Math.abs(porTurno)} por turno.`) : "Sem variação por turno na seleção."}</div>
              );
            })}
          </div>
        </div>
      )}

      {habs.some((h) => h.aquecimentos.length) && (
        <div className="dash-bloco">
          <div className="dash-titulo">Aquecimento</div>
          <div className="dash-lista">
            {habs.map((h) => h.aquecimentos.map((aq, k) => (
              <div key={h.a.id + "q" + k} className="dash-linha">
                <span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> · {aq.nome} (Aquecimento {aq.N}): pronto em <b>{aq.turnos} turno{aq.turnos === 1 ? "" : "s"}</b>
                <div className="dash-aq">{aq.seq.map((g, n) => <span key={n} className={n === aq.seq.length - 1 ? "pronto" : ""}>{g}</span>)}</div>
              </div>
            )))}
          </div>
          <div className="field-note">A sequência mostra a graduação usada em cada turno (ou uso) até chegar à graduação total.</div>
        </div>
      )}

      {habs.some((h) => h.testes.length) && (
        <div className="dash-bloco">
          <div className="dash-titulo">Exigir Teste</div>
          <div className="dash-lista">
            {habs.map((h) => h.testes.map((t, k) => (
              <div key={h.a.id + "t" + k} className="dash-linha">
                <span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> · {t.nome}: CD <b>{t.cd}</b>, seu bônus {fmtBonus(t.bonus)} ({t.pericia || "—"}) → <b>{pct(t.p)}%</b> de passar por teste.
                {(h.sust || h.passiva) && <> Chance de manter por 3 turnos: <b>{pct(Math.pow(t.p, 3))}%</b>, por 5: <b>{pct(Math.pow(t.p, 5))}%</b>{t.p < 1 ? <> · dura em média <b>{fmtNum(t.p / (1 - t.p))}</b> turno(s) a mais.</> : "."}</>}
              </div>
            )))}
          </div>
        </div>
      )}

      <div className="dash-bloco">
        <div className="dash-titulo">Para onde vão os pontos de poder</div>
        <div className="dash-pp">
          <Rosca fatias={fatias} total={totalRosca} centro={`${gastosPP}/${ppMax}`} sub="PP gastos" />
          <div className="dash-legenda vertical">
            {fatias.map((s) => <span key={s.nome}><i style={{ background: s.cor }} />{s.nome} · <b>{s.v}</b> ({pct(s.v / Math.max(1, totalRosca))}%)</span>)}
          </div>
        </div>
        {ataques.length > 0 && (
          <div className="dash-hbars">
            {ataques.map((a, i) => (
              <div key={a.id} className="dash-hbar">
                <span className="dash-hbar-nome">{a.nome || "(sem nome)"}</span>
                <span className="dash-hbar-trilho"><span style={{ width: (custoAtaque(a) / maiorHabPP) * 100 + "%", background: PAL_DASH[i % PAL_DASH.length] }} /></span>
                <b>{a.equipamento ? `eq. ${a.pp || 0}` : custoAtaque(a)}</b>
              </div>
            ))}
          </div>
        )}
        {pontosEquipamentoMax(f) > 0 && <div className="field-note">Equipamento: {pontosEquipamentoGastos(f)} de {pontosEquipamentoMax(f)} pontos (não gasta PP).</div>}
      </div>

      <div className="dash-bloco">
        <div className="dash-titulo">Atributos</div>
        <div className="dash-duplo">
          <Radar itens={ATRIBUTOS.map((a) => ({ l: a.l, v: attrBase(f, a.k) }))} max={radarMax} />
          <div className="dash-lista">
            <div className="dash-linha">PP em atributos: <b>{ppAtr}</b> (2 por ponto). Máximo por atributo no nível {f.nivel || 1}: <b>{radarMax}</b>.</div>
            <div className="dash-linha">Vida máx. <b>{pvMax}</b> = (5 + Vigor) × nível · Nen máx. <b>{nenMax}</b> = (3 + Prontidão) × nível.</div>
            <div className="dash-linha">Deslocamento: <b>{deslocamentoTexto(f)}</b>{passivosCalc.reducaoDano > 0 ? <> · Proteção: <b>−{passivosCalc.reducaoDano}</b> de dano</> : null}</div>
          </div>
        </div>
      </div>

      <div className="dash-bloco">
        <div className="dash-titulo">Médias de dados</div>
        <div className="field-note">Um d20 rende em média 10,5. Veja o total médio de cada teste e a chance de alcançar uma CD.</div>
        <div className="dash-tabela-wrap">
          <table className="dash-tabela">
            <thead><tr><th>Teste</th><th>Bônus</th><th>Média</th><th>Faixa</th><th>CD 10</th><th>CD 15</th><th>CD 20</th></tr></thead>
            <tbody>
              {[...linhasRolagem, ...linhasPericias].map((l) => (
                <tr key={l.n}><td>{l.n}</td><td>{fmtBonus(l.b)}</td><td><b>{fmtNum(10.5 + l.b)}</b></td><td>{1 + l.b}–{20 + l.b}</td><td>{pct(chanceMinD20(10 - l.b))}%</td><td>{pct(chanceMinD20(15 - l.b))}%</td><td>{pct(chanceMinD20(20 - l.b))}%</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMostrarPericias((s) => !s)} style={{ marginTop: 8 }}>{mostrarPericias ? "Mostrar só as 4 melhores perícias" : "Mostrar todas as perícias"}</button>
      </div>

      <div className="dash-bloco">
        <div className="dash-titulo">Simulador contra um alvo</div>
        <div className="grid2" style={{ marginBottom: 10 }}>
          <div><label className="label">Defesa do alvo (Aparar/Esquiva)</label><input type="number" value={defAlvo} onChange={(e) => setDefAlvo(Number(e.target.value) || 0)} /></div>
          <div><label className="label">Resistência/Fort./Vontade do alvo</label><input type="number" value={resAlvo} onChange={(e) => setResAlvo(Number(e.target.value) || 0)} /></div>
        </div>
        {ataquesAtivos.length > 0 && (
          <div className="dash-lista">
            {ataquesAtivos.map((h) => {
              const b = h.a.tipoAcerto === "corpo" ? bAtqC : bAtqD;
              const lim = limiarCritico(f, h.a.id);
              return (
                <div key={h.a.id} className="dash-linha"><span className="dash-dot" style={{ background: h.cor }} /><b>{h.a.nome || "(sem nome)"}</b> ({h.a.tipoAcerto === "corpo" ? "corpo a corpo" : "distância"} {fmtBonus(b)}) contra CD {cdDefAlvo}: acerta em <b>{pct(chanceMinD20(cdDefAlvo - b))}%</b> · crítico em <b>{pct((21 - lim) / 20)}%</b> (ameaça {lim}–20).</div>
              );
            })}
          </div>
        )}
        {efeitosDano.length > 0 ? (
          <div className="dash-hbars" style={{ marginTop: 10 }}>
            {efeitosDano.map((e, i) => (
              <div key={i} className="dash-efeito">
                <div className="dash-efeito-topo"><span className="dash-dot" style={{ background: e.cor }} /><b>{e.hab}</b> · {e.cat} {e.g} · CD {e.cd} <small>(alvo {fmtBonus(resAlvo)}): resiste {pct(e.dist.passa)}%</small></div>
                <div className="dash-barra-pilha grau">
                  <span style={{ width: e.dist.passa * 100 + "%", background: "var(--success)" }} title="Alvo resiste" />
                  <span style={{ width: e.dist.g1 * 100 + "%", background: "#e8c84a" }} title="Falha 1 grau" />
                  <span style={{ width: e.dist.g2 * 100 + "%", background: "#e8964a" }} title="Falha 2 graus" />
                  <span style={{ width: e.dist.g3 * 100 + "%", background: "#e85a5a" }} title="Falha 3 graus" />
                  <span style={{ width: e.dist.g4 * 100 + "%", background: "#c084fc" }} title="Falha 4+ graus" />
                </div>
              </div>
            ))}
            <div className="dash-legenda"><span><i style={{ background: "var(--success)" }} />Resiste</span><span><i style={{ background: "#e8c84a" }} />Falha 1 grau</span><span><i style={{ background: "#e8964a" }} />2 graus</span><span><i style={{ background: "#e85a5a" }} />3 graus</span><span><i style={{ background: "#c084fc" }} />4+ graus</span></div>
          </div>
        ) : <div className="field-note">Adicione efeitos de Dano, Aflição ou Enfraquecer para ver as chances contra o alvo.</div>}
        {vantCrit.length > 0 && <div className="field-note">Crítico Aprimorado já está considerado nos cálculos de crítico acima.</div>}
      </div>
    </div>
  );
}

/* ---------- ficha (form) ---------- */
function fichaPadrao(rotulos) {
  return {
    nome: "", rotulo: rotulos[0], tipoNen: NEN_TIPOS[NEN_TIPOS.length - 1], nivel: 1,
    foto: null,
    pvAtual: 5, pvTemp: 0, nenAtual: 3,
    sustentado: false,
    atributos: { ...ATRIBUTOS_VAZIOS },
    periciaPontos: { ...PERICIA_PONTOS_VAZIO },
    ataques: [],
    variaveis: [],
    vantagens: [],
    complicacoes: { texto: "", pontos: 0 },
  };
}

function FichaForm({ inicial, rotulos, onSalvar, onCancelar, entidades, atualizarCampo, registrar, erroSalvar }) {
  const [f, setF] = useState(() => {
    const base = fichaPadrao(rotulos);
    if (!inicial) return base;
    return {
      ...base, ...inicial,
      atributos: { ...ATRIBUTOS_VAZIOS, ...(inicial.atributos || {}) },
      periciaPontos: { ...PERICIA_PONTOS_VAZIO, ...(inicial.periciaPontos || {}) },
      vantagens: inicial.vantagens || [],
      // migra habilidades do formato antigo de efeito passivo (um objeto único) pro novo
      // (lista, permitindo vários efeitos passivos na mesma habilidade) — silenciosamente,
      // sem exigir nenhuma ação manual; ao salvar a ficha já grava no formato novo.
      ataques: (inicial.ataques || []).map((a) => {
        if (!a || (!a.passivo && !a.passivos)) return migrarFalhasLegado(a);
        const { passivo, ...resto } = a;
        return migrarFalhasLegado({ ...resto, ativo: passivaEstaAtiva(a), passivos: passivosDe(a) });
      }),
    };
  });
  const [erro, setErro] = useState("");
  const [complicOpen, setComplicOpen] = useState(false);
  const [fundamentosOpen, setFundamentosOpen] = useState(false);
  const [ajFotoAberto, setAjFotoAberto] = useState(false);
  const toggleFundamento = (fund) => {
    const jaTem = f.ataques.some((a) => a.fundamento === fund.id);
    upd("ataques", jaTem ? f.ataques.filter((a) => a.fundamento !== fund.id) : [...f.ataques, construirFundamento(fund)]);
  };

  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const maxAtr = atributoMax(f.nivel);
  const updAtributo = (k, v) => setF((s) => ({ ...s, atributos: { ...s.atributos, [k]: Math.max(-2, Math.min(atributoMax(s.nivel), v)) } }));
  const maxPer = periciaPontosMax(f.nivel);
  const updPericia = (nome, v) => setF((s) => ({ ...s, periciaPontos: { ...s.periciaPontos, [nome]: Math.max(0, Math.min(periciaPontosMax(s.nivel), v)) } }));

  const updAtaque = (idx, novo) => { const arr = [...f.ataques]; arr[idx] = novo; upd("ataques", arr); };
  const addAtaque = () => upd("ataques", [...f.ataques, {
    id: uid(), nome: "", tipo: "ativa", acao: "Ação Padrão", tipoAcerto: "corpo", custoVida: 0, custoNen: 0, extras: {}, ativo: false,
    efeitos: [{ id: uid(), ...efeitoPadrao("Dano") }],
    passivos: [{ id: uid(), tipoId: "", graduacao: 1, campos: {}, extrasAtivos: {} }],
  }]);
  const rmAtaque = (idx) => upd("ataques", f.ataques.filter((_, i) => i !== idx));
  const moverAtaque = (idx, direcao) => {
    const alvo = idx + direcao;
    if (alvo < 0 || alvo >= f.ataques.length) return;
    const arr = [...f.ataques];
    [arr[idx], arr[alvo]] = [arr[alvo], arr[idx]];
    upd("ataques", arr);
  };
  /* Cria automaticamente um novo ataque à distância pronto (Mover Objetos → Arremessar) com
     um efeito de Dano já na graduação sugerida pelo peso do objeto arremessado. */
  const addAtaqueArremesso = (nomeObjeto, graduacaoDano) => {
    upd("ataques", [...f.ataques, {
      id: uid(), nome: `Arremesso: ${nomeObjeto || "Objeto"}`, tipo: "ativa", tipoAcerto: "distancia", custoVida: 0, custoNen: 0, extras: {}, ativo: false,
      efeitos: [{ id: uid(), categoria: "Dano", graduacao: Math.max(0, graduacaoDano || 0) }],
      passivos: [],
    }]);
  };

  const updVantagem = (idx, campo, valor) => { const arr = [...f.vantagens]; arr[idx] = { ...arr[idx], [campo]: valor }; upd("vantagens", arr); };
  const mudarVantagemNome = (idx, novoNome) => {
    const info = VANTAGENS.find((v) => v.nome === novoNome);
    const n = info?.mecanica?.escolhePericias || 0;
    const max = info?.graduacaoMax || 5;
    const arr = [...f.vantagens];
    arr[idx] = { ...arr[idx], nome: novoNome, graduacoes: Math.min(arr[idx].graduacoes || 1, max), periciasEscolhidas: Array(n).fill(""), textoExtra: info?.mecanica?.pedeTexto ? "" : null, defesaEscolhida: info?.mecanica?.escolheDefesa ? "" : null };
    upd("vantagens", arr);
  };
  const addVantagem = () => upd("vantagens", [...(f.vantagens || []), { id: uid(), nome: VANTAGENS[0].nome, graduacoes: 1, ativo: false, periciasEscolhidas: [] }]);
  const rmVantagem = (idx) => upd("vantagens", f.vantagens.filter((_, i) => i !== idx));

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await resizeImageFile(file, 480, 0.8);
    setF((s) => ({ ...s, foto: url, fotoAj: null }));
  };

  const pvMax = pvMaxCalc(f), nenMax = nenMaxCalc(f), desloc = deslocamentoTexto(f);
  const ppMax = pontosPoderMax(f), ppGastos = pontosPoderGastos(f);
  const excedido = ppGastos > ppMax;
  const eqMax = pontosEquipamentoMax(f), eqGastos = pontosEquipamentoGastos(f);
  const eqExcedido = eqGastos > eqMax;

  const tentarSalvar = () => {
    if (pontosPoderGastos(f) > pontosPoderMax(f)) {
      setErro(`Pontos de Poder excedidos! Você gastou ${pontosPoderGastos(f)} de ${pontosPoderMax(f)} disponíveis. Reduza atributos, perícias ou vantagens antes de salvar.`);
      return;
    }
    setErro("");
    onSalvar(f);
  };

  return (
    <div className="card ficha-edit">
      {erro && <div className="erro-box">{erro}</div>}

      <div className="ficha-hero ed-hero">
        {f.foto && <div className="hero-bg" style={{ backgroundImage: `url(${f.foto})` }} />}
        <div className="hero-conteudo">
          <div className="hero-linha" style={{ marginBottom: 0 }}>
            <label className="hero-retrato ed-retrato" title="Trocar foto">
              {f.foto ? <ImgAj src={f.foto} aj={f.fotoAj} alt="Foto da ficha" /> : <span>{(f.nome || "?").trim().charAt(0).toUpperCase() || "?"}</span>}
              <em className="ed-retrato-dica">📷 Trocar</em>
              <input type="file" accept="image/*" onChange={handleFoto} style={{ display: "none" }} />
            </label>
            <div className="hero-info ed-hero-info">
              <label className="label">Nome</label>
              <input type="text" className="ed-nome" placeholder="Nome do personagem" value={f.nome} onChange={(e) => upd("nome", e.target.value)} />
              {f.foto && (
                <div className="ed-foto-botoes">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAjFotoAberto((s) => !s)}>{ajFotoAberto ? "Fechar ajuste" : "✥ Ajustar enquadramento"}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { upd("foto", null); upd("fotoAj", null); }}>Remover foto</button>
                </div>
              )}
            </div>
          </div>
          {f.foto && ajFotoAberto && <div style={{ marginTop: 12 }}><AjusteImagem src={f.foto} ajuste={f.fotoAj} onMudar={(v) => upd("fotoAj", v)} proporcao="1 / 1" maxLargura={220} /></div>}
          <div className="grid3" style={{ marginTop: 12 }}>
            <div><label className="label">Tipo</label><SearchableSelect value={f.rotulo} onChange={(e) => upd("rotulo", e.target.value)}>{rotulos.map((r) => <option key={r} value={r}>{r}</option>)}</SearchableSelect></div>
            <div><label className="label">Tipo de Nen</label><SearchableSelect value={f.tipoNen} onChange={(e) => upd("tipoNen", e.target.value)}>{NEN_TIPOS.map((n) => <option key={n} value={n}>{n}</option>)}</SearchableSelect></div>
            <div><label className="label">Nível</label><input type="number" min="1" value={f.nivel} onChange={(e) => upd("nivel", Math.max(1, Number(e.target.value)))} /></div>
          </div>
        </div>
      </div>

      <section className="ed-sec">
      <div className="section-title">Vida &amp; Nen</div>
      <div className="ed-barras">
        <BarraVital tipo="vida" nome="Vida" atual={f.pvAtual} max={pvMax} temp={f.pvTemp || 0} />
        <BarraVital tipo="nen" nome="Nen" atual={f.nenAtual} max={nenMax} />
      </div>
      <div className="grid4" style={{ marginBottom: 6 }}>
        <div><label className="label">Vida Atual</label><input className="in-vida" type="number" value={f.pvAtual} onChange={(e) => upd("pvAtual", Number(e.target.value))} /></div>
        <div><label className="label">Vida Máx.</label><input className="in-vida" type="number" value={pvMax} disabled /></div>
        <div><label className="label">Nen Atual</label><input className="in-nen" type="number" value={f.nenAtual} onChange={(e) => upd("nenAtual", Number(e.target.value))} /></div>
        <div><label className="label">Nen Máx.</label><input className="in-nen" type="number" value={nenMax} disabled /></div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label className="label">Vida Temporária</label><input className="in-vida-temp" type="number" value={f.pvTemp} onChange={(e) => upd("pvTemp", Number(e.target.value))} />
      </div>

      </section>
      <section className="ed-sec">
      <div className="section-title">Atributos (máx. {maxAtr}, mín. -2)</div>
      <div className="ed-attr-grid" style={{ marginBottom: 10 }}>
        {ATRIBUTOS.map((a) => <div key={a.k} className="ed-attr"><label className="label">{a.l}</label><input type="number" min={-2} max={maxAtr} value={f.atributos[a.k]} onChange={(e) => updAtributo(a.k, Number(e.target.value))} /></div>)}
      </div>

      </section>
      <section className="ed-sec">
      <div className="section-title">Bônus de Ataque</div>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div><label className="label">Ataque Corpo-a-corpo</label><input type="number" value={f.atributos.luta} disabled /></div>
        <div><label className="label">Ataque à Distância</label><input type="number" value={f.atributos.destreza} disabled /></div>
      </div>

      </section>
      <section className="ed-sec">
      <div className="section-title">Defesas</div>
      <div className="readonly-grid ed-defesas">
        <div className="ro-row"><span>Aparar</span><b>{f.atributos.luta >= 0 ? "+" : ""}{f.atributos.luta}</b></div>
        <div className="ro-row"><span>Esquiva</span><b>{f.atributos.destreza >= 0 ? "+" : ""}{f.atributos.destreza}</b></div>
        <div className="ro-row"><span>Fortitude</span><b>{f.atributos.vigor >= 0 ? "+" : ""}{f.atributos.vigor}</b></div>
        <div className="ro-row"><span>Vontade</span><b>{f.atributos.prontidao >= 0 ? "+" : ""}{f.atributos.prontidao}</b></div>
        <div className="ro-row"><span>Resistência</span><b>{f.atributos.vigor >= 0 ? "+" : ""}{f.atributos.vigor}</b></div>
        <div className="ro-row"><span>Deslocamento</span><b>{desloc}</b></div>
      </div>

      </section>
      <section className="ed-sec">
      <div className="section-title">Perícias (máx. {maxPer} ponto(s) cada)</div>
      <div className="pericias-grid" style={{ marginBottom: 10 }}>
        {PERICIAS.map((p) => (
          <div className="pe-row" key={p.nome}>
            <span>{p.nome}</span>
            <input type="number" min={0} max={maxPer} value={f.periciaPontos[p.nome]} onChange={(e) => updPericia(p.nome, Number(e.target.value))} />
            <span className="total">{bonusPericia(f, p.nome) >= 0 ? "+" : ""}{bonusPericia(f, p.nome)}</span>
          </div>
        ))}
      </div>

      </section>
      <section className="ed-sec">
      <div className="section-title">Vantagens</div>
      {(f.vantagens || []).map((v, i) => {
        const info = VANTAGENS.find((x) => x.nome === v.nome);
        const max = info?.graduacaoMax || 5;
        const semLimite = max >= 999;
        return (
          <div key={v.id} className="ed-vant">
            <div className="vantagem-row">
              <SearchableSelect value={v.nome} onChange={(e) => mudarVantagemNome(i, e.target.value)}>{VANTAGENS.map((opt) => <option key={opt.nome} value={opt.nome}>{opt.nome}</option>)}</SearchableSelect>
              {max > 1 && <input type="number" min={1} max={semLimite ? undefined : max} value={v.graduacoes} onChange={(e) => updVantagem(i, "graduacoes", Math.max(1, semLimite ? Number(e.target.value) : Math.min(max, Number(e.target.value))))} />}
              <button className="small-btn" onClick={() => rmVantagem(i)}>×</button>
            </div>
            {info && <div className="field-note">{info.desc}{max > 1 ? (semLimite ? " (sem limite de graduações)" : ` (máx. ${max} graduações)`) : ""}</div>}
            {info?.mecanica?.escolhePericias > 0 && (
              <div className="grid2" style={{ marginBottom: 8 }}>
                {Array.from({ length: info.mecanica.escolhePericias }).map((_, pi) => (
                  <SearchableSelect key={pi} value={(v.periciasEscolhidas || [])[pi] || ""} onChange={(e) => {
                    const arr = [...(v.periciasEscolhidas || [])]; arr[pi] = e.target.value; updVantagem(i, "periciasEscolhidas", arr);
                  }}>
                    <option value="">Perícia {pi + 1}…</option>
                    {PERICIAS.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                  </SearchableSelect>
                ))}
              </div>
            )}
            {info?.mecanica?.escolheDefesa && (
              <SearchableSelect value={v.defesaEscolhida || ""} onChange={(e) => updVantagem(i, "defesaEscolhida", e.target.value)} style={{ marginBottom: 8 }}>
                <option value="">Defesa favorita…</option>
                <option value="esquiva">Esquiva</option>
                <option value="aparar">Aparar</option>
              </SearchableSelect>
            )}
            {info?.mecanica?.pedeTexto && (
              <input type="text" placeholder="Inimigo escolhido" value={v.textoExtra || ""} onChange={(e) => updVantagem(i, "textoExtra", e.target.value)} style={{ marginBottom: 8 }} />
            )}
            {info?.pedeHabilidade && (
              <SearchableSelect value={v.alvoId || ""} onChange={(e) => updVantagem(i, "alvoId", e.target.value)} style={{ marginBottom: 8 }}>
                <option value="">{info.nome === "Crítico Aprimorado" ? "Habilidade ou perícia…" : "Habilidade afetada…"}</option>
                {(f.ataques || []).filter((a) => a.nome.trim() && (info.nome !== "Crítico Aprimorado" || (a.tipo !== "passiva" && (a.tipoAcerto === "corpo" || a.tipoAcerto === "distancia")))).map((a) => <option key={a.id} value={a.id}>{info.nome === "Crítico Aprimorado" ? `Habilidade: ${a.nome}` : a.nome}</option>)}
                {info.nome === "Crítico Aprimorado" && PERICIAS.map((p) => <option key={p.nome} value={`pericia:${p.nome}`}>Perícia: {p.nome}</option>)}
              </SearchableSelect>
            )}
          </div>
        );
      })}
      <button className="btn btn-ghost btn-sm" onClick={addVantagem}>+ Vantagem</button>

      </section>
      <section className="ed-sec">
      <div className="section-title">Pontos de Poder</div>
      <div className={"pp-box" + (excedido ? " excedido" : "")}>
        <span>Gastos / Máximo</span><span className="pp-val">{ppGastos} / {ppMax}</span>
        <div className="ed-pp-trilho"><div className="ed-pp-fill" style={{ width: Math.min(100, ppMax > 0 ? (ppGastos / ppMax) * 100 : (ppGastos > 0 ? 100 : 0)) + "%" }} /></div>
      </div>
      {eqMax > 0 && <div className={"pp-box" + (eqExcedido ? " excedido" : "")}><span>Equipamento gasto / máximo</span><span className="pp-val">{eqGastos} / {eqMax}</span></div>}

      </section>
      <section className="ed-sec">
      <div className="section-title colapsavel" onClick={() => setComplicOpen((s) => !s)} style={{ cursor: "pointer" }}>
        Complicações {complicOpen ? "▾" : "▸"}
      </div>
      {complicOpen && (
        <div style={{ marginBottom: 10 }}>
          <label className="label">Descreva as complicações do personagem</label>
          <textarea rows={4} value={f.complicacoes?.texto || ""} onChange={(e) => upd("complicacoes", { ...(f.complicacoes || {}), texto: e.target.value })} style={{ marginBottom: 8 }} />
          <label className="label">Pontos de Poder extras concedidos por complicações (máx. 2)</label>
          <input type="number" min={0} max={2} value={f.complicacoes?.pontos || 0}
            onChange={(e) => upd("complicacoes", { ...(f.complicacoes || {}), pontos: Math.max(0, Math.min(2, Number(e.target.value))) })} />
        </div>
      )}

      </section>
      <section className="ed-sec">
      <div className="section-title">Habilidades</div>
      {f.ataques.map((a, i) => <AtaqueForm key={a.id} ataque={a} onMudar={(novo) => updAtaque(i, novo)} onRemover={() => rmAtaque(i)} onCriarArremesso={addAtaqueArremesso}
        variaveis={f.variaveis || []}
        onCriarVariavel={(v) => upd("variaveis", [...(f.variaveis || []), v])}
        onMudarVariavel={(id, patch) => upd("variaveis", (f.variaveis || []).map((v) => (v.id === id ? { ...v, ...patch } : v)))}
        onExcluirVariavel={(id) => { upd("variaveis", (f.variaveis || []).filter((v) => v.id !== id)); upd("ataques", f.ataques.map((a) => ({ ...a, usoVariaveis: (a.usoVariaveis || []).filter((u) => u.variavelId !== id) }))); }}
        onSubir={i > 0 ? () => moverAtaque(i, -1) : null} onDescer={i < f.ataques.length - 1 ? () => moverAtaque(i, 1) : null} />)}
      {f.ataques.length === 0 && <div className="ed-vazio">Nenhuma habilidade ainda.</div>}
      <button className="btn btn-accent btn-sm" onClick={addAtaque}>+ Habilidade</button>

      </section>
      <section className="ed-sec">
      <div className="section-title colapsavel" onClick={() => setFundamentosOpen((s) => !s)} style={{ cursor: "pointer" }}>
        Fundamentos {fundamentosOpen ? "▾" : "▸"}
      </div>
      {fundamentosOpen && (
        <div className="subcard2" style={{ marginBottom: 10 }}>
          <div className="field-note" style={{ marginBottom: 10 }}>
            Fundamentos são habilidades passivas gratuitas (não gastam Pontos de Poder). Marcar um deles adiciona a habilidade pronta lá embaixo, em Habilidades — dá pra editar, e ligar/desligar como qualquer outra passiva.
          </div>
          {FUNDAMENTOS.map((fund) => {
            const adquirido = f.ataques.some((a) => a.fundamento === fund.id);
            return (
              <label key={fund.id} className="checkbox-row" style={{ alignItems: "flex-start", marginBottom: 10 }}>
                <input type="checkbox" checked={adquirido} onChange={() => toggleFundamento(fund)} style={{ marginTop: 3 }} />
                <span>
                  <b>{fund.nome}</b>
                  <div className="field-note" style={{ marginTop: 2 }}>{fund.desc}</div>
                </span>
              </label>
            );
          })}
        </div>
      )}

      </section>

      <section className="ed-sec ed-dash">
        <div className="section-title">Dashboard da ficha</div>
        <PainelFicha f={f} />
      </section>

      <div style={{ height: 70 }} />
      <div className="ficha-footer-fixa">
        {erroSalvar && <div className="aviso-erro-salvar">{erroSalvar}</div>}
        <div className="grid2">
          <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-accent" disabled={!f.nome.trim()} onClick={tentarSalvar}>Salvar ficha</button>
        </div>
      </div>
    </div>
  );
}

function FichasTab({ entidades, salvar, identidade, usuario, registrar, onAbrirRolagem, onAbrirAcao, atualizarCampo, onRolarIniciativa, pastas = [], onSalvarPastas }) {
  const [editando, setEditando] = useState(null);
  const [pastasAbertas, setPastasAbertas] = useState({});
  const [criandoPasta, setCriandoPasta] = useState(false);
  const [nomeNovaPasta, setNomeNovaPasta] = useState("");
  const [pastaParaExcluir, setPastaParaExcluir] = useState(null);
  const [arrastandoId, setArrastandoId] = useState(null);
  const [alvoDrop, setAlvoDrop] = useState(null);
  const [busca, setBusca] = useState("");
  const [vantagemCtx, setVantagemCtx] = useState(null);
  const ehMestre = identidade.papel === "mestre";
  const rotulosProprio = ehMestre ? ["Criatura", "NPC"] : ["Personagem", "Invocação"];
  const souDono = (e) => e.donoUid ? e.donoUid === usuario?.uid : e.dono === identidade.nome;
  const meusTodos = entidades.filter(souDono);
  const meus = busca.trim() ? meusTodos.filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase())) : meusTodos;
  // Mestre vê (e edita) as fichas de todo mundo. Jogador não vê a ficha de mais ninguém
  // além da própria — nem as de outros jogadores, nem (principalmente) as do mestre.
  const outros = ehMestre ? entidades.filter((e) => !souDono(e)) : [];

  const [erroSalvarFicha, setErroSalvarFicha] = useState(null);
  const salvarFicha = async (f) => {
    const criando = !f.id;
    const nova = criando ? [...entidades, { ...f, id: uid(), dono: identidade.nome, donoUid: usuario?.uid }] : entidades.map((e) => (e.id === f.id ? { ...f } : e));
    const ok = await salvar(nova);
    if (!ok) {
      // NÃO fecha o formulário se a gravação falhou (sem permissão, sem internet, etc.) —
      // antes disso o form fechava do mesmo jeito, dando a falsa impressão de que salvou,
      // e a edição podia se perder de verdade sem ninguém perceber.
      setErroSalvarFicha("Não foi possível salvar essa ficha agora (sem conexão ou sem permissão). Suas edições continuam aqui na tela — tente salvar de novo.");
      return;
    }
    setErroSalvarFicha(null);
    registrar({ desc: `${identidade.nome} ${criando ? "criou" : "editou"} a ficha "${f.nome}"`, detalhe: f.rotulo, total: criando ? "Criada" : "Editada", tipoClasse: criando ? "hs" : "hw" });
    setEditando(null);
  };
  const excluir = async (ent) => {
    const ok = await salvar(entidades.filter((e) => e.id !== ent.id));
    if (ok) registrar({ desc: `${identidade.nome} excluiu a ficha "${ent.nome}"`, detalhe: ent.rotulo, total: "Excluída", tipoClasse: "hd" });
  };
  const toggleVantagem = async (entidadeId, vantagemId, novoAtivo) => {
    const nova = entidades.map((e) => (e.id !== entidadeId ? e : { ...e, vantagens: (e.vantagens || []).map((v) => (v.id === vantagemId ? { ...v, ativo: novoAtivo } : v)) }));
    const ok = await salvar(nova);
    if (ok) setVantagemCtx((ctx) => (ctx ? { ...ctx, vantagem: { ...ctx.vantagem, ativo: novoAtivo } } : ctx));
  };
  const abrirVantagem = (entidade, vantagem, editavel) => setVantagemCtx({ entidade, vantagem, info: VANTAGENS.find((x) => x.nome === vantagem.nome), editavel });

  if (editando) return <FichaForm inicial={editando === "novo" ? null : editando} rotulos={rotulosProprio} onSalvar={salvarFicha} onCancelar={() => setEditando(null)}
    entidades={entidades} atualizarCampo={atualizarCampo} registrar={registrar} erroSalvar={erroSalvarFicha} />;

  const podeMarcarOponente = ehMestre;

  const idsPastas = new Set(pastas.map((p) => p.id));
  const semPasta = meus.filter((e) => !e.pasta || !idsPastas.has(e.pasta));
  const criarPasta = () => {
    const nome = nomeNovaPasta.trim();
    if (!nome || !onSalvarPastas) return;
    onSalvarPastas([...pastas, { id: uid(), nome }]);
    setNomeNovaPasta(""); setCriandoPasta(false);
  };
  const excluirPasta = (p) => {
    onSalvarPastas(pastas.filter((x) => x.id !== p.id));
    meusTodos.filter((e) => e.pasta === p.id).forEach((e) => atualizarCampo(e.id, "pasta", null));
    setPastaParaExcluir(null);
  };
  // Engaja (ou desengaja) todas as fichas da pasta no combate de uma vez.
  const engajarPasta = (p) => {
    const fs = meusTodos.filter((e) => e.pasta === p.id);
    if (!fs.length) return;
    const todasEngajadas = fs.every((e) => e.oponente);
    fs.forEach((e) => atualizarCampo(e.id, "oponente", !todasEngajadas));
    registrar({ tipo: "sistema", desc: `${identidade.nome} ${todasEngajadas ? "tirou do combate" : "engajou no combate"} a pasta "${p.nome}"`, detalhe: `${fs.length} ficha(s)`, total: todasEngajadas ? "Desengajadas" : "Engajadas", tipoClasse: todasEngajadas ? "hw" : "hd" });
  };
  /* arrastar e soltar: ficha -> pasta (entra), ficha -> "Sem pasta" (sai) */
  const iniciarArrasto = (ev, ficha) => { ev.dataTransfer.setData("text/plain", ficha.id); ev.dataTransfer.effectAllowed = "move"; setArrastandoId(ficha.id); };
  const fimArrasto = () => { setArrastandoId(null); setAlvoDrop(null); };
  const soltarEm = (ev, pastaId) => {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/plain") || arrastandoId;
    const ficha = meusTodos.find((x) => x.id === id);
    if (ficha && (ficha.pasta || null) !== (pastaId || null)) atualizarCampo(ficha.id, "pasta", pastaId || null);
    if (pastaId) setPastasAbertas((x) => ({ ...x, [pastaId]: true }));
    fimArrasto();
  };
  const zonaDrop = (chave, pastaId) => ({
    onDragOver: (ev) => { if (arrastandoId) { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; if (alvoDrop !== chave) setAlvoDrop(chave); } },
    onDragLeave: (ev) => { if (!ev.currentTarget.contains(ev.relatedTarget) && alvoDrop === chave) setAlvoDrop(null); },
    onDrop: (ev) => soltarEm(ev, pastaId),
  });
  const renderItem = (e) => <EntidadeItem key={e.id} onArrastarFicha={iniciarArrasto} onArrastarFichaFim={fimArrasto} e={e} onEditar={() => setEditando(e)} onExcluir={() => excluir(e)} editavel onAbrirRolagem={onAbrirRolagem} onAtualizarCampo={atualizarCampo} onAbrirVantagem={abrirVantagem} onAbrirAcao={onAbrirAcao} onRolarIniciativa={onRolarIniciativa} podeMarcarOponente={podeMarcarOponente} entidades={entidades} registrar={registrar}
    pastas={pastas} onMoverPasta={(id) => atualizarCampo(e.id, "pasta", id || null)} />;

  return (
    <div>
      <div className="section-title">Minhas fichas ({ehMestre ? "criaturas e NPCs" : "personagens e invocações"})</div>
      <input type="text" placeholder="Buscar por nome…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: 10 }} />
      {meus.length === 0 && pastas.length === 0 && <div className="card empty">Nenhuma ficha encontrada.</div>}
      {pastas.map((p) => {
        const todos = meusTodos.filter((e) => e.pasta === p.id);
        const visiveis = meus.filter((e) => e.pasta === p.id);
        const aberta = !!pastasAbertas[p.id] || (busca.trim() && visiveis.length > 0);
        const engajadas = todos.length > 0 && todos.every((e) => e.oponente);
        return (
          <div key={p.id} className="subcard2" style={{ marginBottom: 10, ...(alvoDrop === p.id ? { outline: "2px dashed var(--accent)", background: "var(--accent-soft)" } : {}) }} {...zonaDrop(p.id, p.id)}>
            <div className="row-inline" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div className="acoes-header" style={{ flex: 1 }} onClick={() => setPastasAbertas((x) => ({ ...x, [p.id]: !x[p.id] }))}>
                <div className="stat-group-label" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem", letterSpacing: "0.03em", textTransform: "none", color: "var(--text)" }}>📁 {p.nome} ({todos.length}{todos.some((e) => e.oponente) ? ` · ${todos.filter((e) => e.oponente).length} engajada(s)` : ""})</div>
                <span className={"arrow" + (aberta ? " open" : "")}>▶</span>
              </div>
              {ehMestre && <button className={"btn btn-sm " + (engajadas ? "btn-danger" : "btn-ghost")} disabled={!todos.length} onClick={() => engajarPasta(p)}>{engajadas ? "Desengajar pasta" : "Engajar pasta"}</button>}
              <button className="small-btn" title="Excluir pasta (as fichas voltam para 'Sem pasta')" onClick={() => setPastaParaExcluir(p)}>×</button>
            </div>
            {aberta && (visiveis.length === 0
              ? <div className="field-note">Pasta vazia. Arraste uma ficha (com ela fechada) para cá.</div>
              : <div style={{ marginTop: 8 }}>{visiveis.map(renderItem)}</div>)}
          </div>
        );
      })}
      <div {...zonaDrop("__fora", null)} style={{ borderRadius: 8, minHeight: arrastandoId && pastas.length > 0 ? 56 : 0, marginBottom: 6, ...(alvoDrop === "__fora" ? { outline: "2px dashed var(--accent)", background: "var(--accent-soft)" } : {}) }}>
        {pastas.length > 0 && (semPasta.length > 0 || arrastandoId) && <div className="stat-group-label" style={{ marginBottom: 6 }}>Sem pasta{arrastandoId ? " — solte aqui para tirar da pasta" : ""}</div>}
        {semPasta.map(renderItem)}
      </div>
      <div className="grid2" style={{ marginBottom: 20 }}>
        <button className="btn btn-accent btn-block" onClick={() => setEditando("novo")}>+ Nova ficha</button>
        {!criandoPasta && <button className="btn btn-ghost btn-block" onClick={() => setCriandoPasta(true)}>+ Nova pasta</button>}
        {criandoPasta && (
          <div className="row-inline">
            <input type="text" autoFocus placeholder="Nome da pasta" value={nomeNovaPasta} onChange={(ev) => setNomeNovaPasta(ev.target.value)} onKeyDown={(ev) => { if (ev.key === "Enter") criarPasta(); if (ev.key === "Escape") { setCriandoPasta(false); setNomeNovaPasta(""); } }} />
            <button className="small-btn" onClick={criarPasta} title="Criar">✓</button>
            <button className="small-btn" onClick={() => { setCriandoPasta(false); setNomeNovaPasta(""); }} title="Cancelar">×</button>
          </div>
        )}
      </div>

      {ehMestre && (
        <>
          <div className="section-title">Outras fichas na mesa</div>
          {outros.length === 0 && <div className="card empty">Ninguém mais cadastrou fichas ainda.</div>}
          {outros.map((e) => <EntidadeItem key={e.id} e={e} onEditar={() => setEditando(e)} onExcluir={() => excluir(e)} editavel onAbrirRolagem={onAbrirRolagem} onAbrirVantagem={abrirVantagem} podeMarcarOponente={podeMarcarOponente} onAtualizarCampo={atualizarCampo} entidades={entidades} registrar={registrar} onAbrirAcao={onAbrirAcao} onRolarIniciativa={onRolarIniciativa} />)}
        </>
      )}

      {pastaParaExcluir && (
        <ConfirmModal titulo="Excluir pasta" textoConfirmar="Excluir pasta"
          mensagem={`Excluir a pasta "${pastaParaExcluir.nome}"? As fichas dentro dela não são apagadas, só voltam para "Sem pasta".`}
          onConfirmar={() => excluirPasta(pastaParaExcluir)} onCancelar={() => setPastaParaExcluir(null)} />
      )}
      {vantagemCtx && <VantagemModal ctx={vantagemCtx} onFechar={() => setVantagemCtx(null)} onToggle={toggleVantagem} />}
    </div>
  );
}

const CONDICAO_TOM = {
  "Em Chamas": "dano", "Sangrando": "dano", "Envenenado": "dano", "Morrendo": "dano", "Morto": "dano", "Sufocando": "dano",
  "Atordoado": "controle", "Compelido": "controle", "Controlado": "controle", "Imóvel": "controle", "Impedido": "controle", "Agarrado": "controle",
  "Amarrado": "controle", "Caído": "controle", "Incapacitado": "controle", "Paralisado": "controle", "Transe": "controle", "Tonto": "controle",
  "Surdo": "controle", "Cego": "controle", "Zetsu": "controle",
  "Adoecido": "fraqueza", "Debilitado": "fraqueza", "Prejudicado": "fraqueza", "Vulnerável": "fraqueza", "Indefeso": "fraqueza",
  "Exausto": "fraqueza", "Fatigado": "fraqueza", "Machucado": "fraqueza", "Surpreso": "fraqueza",
};
function tomCondicao(nome) { return CONDICAO_TOM[nome] || "neutro"; }
function CartaoStat({ rotulo, valor, onClick, tipo }) {
  return (
    <button type="button" className={"cartao-stat" + (tipo === "def" ? " def" : "") + (valor < 0 ? " neg" : "")} onClick={onClick}>
      <span className="cs-valor">{valor >= 0 ? "+" : ""}{valor}</span>
      <span className="cs-rot">{rotulo}</span>
    </button>
  );
}
function BarraVital({ tipo, nome, atual, max, temp = 0, entrada, extra }) {
  const escala = Math.max(1, max, (atual > 0 ? atual : 0) + temp);
  const pctAtual = Math.max(0, Math.min(100, (Math.max(0, atual) / escala) * 100));
  const pctTemp = Math.max(0, Math.min(100 - pctAtual, (temp / escala) * 100));
  const baixa = tipo === "vida" && max > 0 && atual / max <= 0.25;
  return (
    <div className={"barra-vital bv-" + tipo + (baixa ? " baixa" : "")}>
      <div className="bv-topo">
        <span className="bv-nome">{nome}</span>
        <span className="bv-num">{entrada || <b>{atual}</b>} / <b>{max}</b>{temp ? <span style={{ color: "#86c8e8" }}> (+{temp})</span> : null}{extra}</span>
      </div>
      <div className="bv-trilho">
        <div className="bv-seg principal" style={{ width: pctAtual + "%" }} />
        {temp > 0 && <div className="bv-seg temp" style={{ left: pctAtual + "%", width: pctTemp + "%" }} />}
      </div>
    </div>
  );
}
function StatChip({ label, value, onClick }) {
  return <button className="stat-chip" onClick={onClick}>{label} <b>{value >= 0 ? "+" : ""}{value}</b></button>;
}

function EntidadeItem({ onArrastarFicha, onArrastarFichaFim, e, onEditar, onExcluir, editavel, onAbrirRolagem, onAtualizarCampo, onAbrirVantagem, onAbrirAcao, onRolarIniciativa, podeMarcarOponente, entidades, registrar, pastas, onMoverPasta }) {
  const [aberto, setAberto] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const confirmarExclusao = () => { setConfirmandoExclusao(false); onExcluir(); };
  const [secoes, setSecoes] = useState({ acoes: false, manobras: false, vantagens: false, ataques: true, defesas: false, atributos: false, pericias: false, condicoes: false });
  const toggleSecao = (k) => setSecoes((s) => ({ ...s, [k]: !s[k] }));
  const abrirStat = (tipo, chave, label) => onAbrirRolagem({ origem: e, tipo, chave, label: `${e.nome} · ${label}` });
  const abrirAtaque = (ataque) => {
    if (ataque.sustentado && onAtualizarCampo) onAtualizarCampo(e.id, "sustentado", true);
    onAbrirRolagem({ origem: e, tipo: "ataque", ataque, label: `${e.nome} · ${ataque.nome || "Ataque"}` });
  };
  const aplicarTogglePassiva = (ataque, novoAtivo) => {
    const novos = (e.ataques || []).map((x) => {
      if (x.id !== ataque.id) return x;
      const { passivo, ...resto } = x; // remove o formato antigo (já migrado pra "passivos" abaixo)
      return { ...resto, ativo: novoAtivo, passivos: passivosDe(x) };
    });
    onAtualizarCampo(e.id, "ataques", novos);
    if (ataque.sustentado) onAtualizarCampo(e.id, "sustentado", true);
    if (novoAtivo) { gastarAcao(onAtualizarCampo, e.id, acaoDaHabilidade(ataque)); ativarColaterais(e, ataque, onAtualizarCampo, registrar); } else desativarColaterais(e, ataque, onAtualizarCampo);
  };
  const alternarPassiva = (ataque) => {
    if (!onAtualizarCampo) return;
    const novoAtivo = !passivaEstaAtiva(ataque);
    // Ativar uma passiva com "Exigir Teste": cada efeito testa; quem falha perde só aquele efeito (a ação é gasta).
    if (novoAtivo) {
      const falhos = [];
      const avisos = [];
      for (const it of exigirTestesDe(ataque)) {
        const r = rolarExigirTeste(e, it.cfg);
        if (registrar) {
          registrar({
            tipo: "rolagem",
            desc: `${e.nome} testa Exigir Teste (${ataque.nome || "Passiva"} — ${it.rotulo})`,
            detalhe: `d20(${r.dado}) ${fmtBonus(r.bonus)} = ${r.total} vs CD ${r.cd}${r.pericia ? ` (${r.pericia})` : ""}${fmtMods(notasCondicoesGerais(e))}`,
            total: textoResultadoExigirTeste(r),
            tipoClasse: r.sucesso ? "hs" : "hw",
          });
        }
        if (!r.sucesso) { falhos.push(it.id); avisos.push({ id: uid(), texto: `${it.rotulo} de "${ataque.nome || "Passiva"}" foi perdido: ${e.nome} falhou no Exigir Teste.` }); }
      }
      const itensPassiva = passivosDe(ataque);
      onAtualizarCampo(e.id, "efeitosPerdidos", (p) => {
        const n = { ...(p || {}) };
        itensPassiva.forEach((i) => { delete n[i.id]; }); // ativar de novo = novo teste
        falhos.forEach((id) => { if (id !== "legado") n[id] = true; });
        return n;
      });
      if (avisos.length) onAtualizarCampo(e.id, "avisosPerdidos", (l) => [...(l || []), ...avisos]);
      if (falhos.includes("legado")) { gastarAcao(onAtualizarCampo, e.id, acaoDaHabilidade(ataque)); return; } // falha antiga (da habilidade inteira): não ativa, ação gasta
    }
    if (novoAtivo) {
      // Variáveis (Munição/Carga): se não aguentar o custo, não ativa. Desgastante vale na ativação.
      const uso = aplicarUsoVariaveis(e, ataque);
      if (!uso.ok) {
        if (registrar) registrar({ tipo: "rolagem", desc: `${e.nome} não pode ativar "${ataque.nome || "Passiva"}"`, detalhe: uso.motivo, total: "Bloqueada", tipoClasse: "hw" });
        return;
      }
      if (uso.variaveis) onAtualizarCampo(e.id, "variaveis", uso.variaveis);
      usarDesgastante(e, ataque, onAtualizarCampo, registrar, null);
    }
    aplicarTogglePassiva(ataque, novoAtivo);
  };
  const abrirAcao = (acao) => onAbrirAcao({ origem: e, acao });
  const pvMax = pvMaxCalc(e), nenMax = nenMaxCalc(e);
  const passivos = modificadoresPassivos(e);
  const rap = rapidezDe(e);
  const manterAgarrao = () => {
    if (registrar) registrar({ tipo: "rolagem", desc: `${e.nome} mantém o agarrão`, detalhe: rap.carente ? "Carente: manter o agarrão não exige ação livre" : "Manter o agarrão exige uma ação livre", total: rap.carente ? "Sem custo de ação" : "Ação livre gasta", tipoClasse: "hs" });
    if (!rap.carente) gastarAcao(onAtualizarCampo, e.id, "Ação Livre");
  };

  /* ----- ações de descanso ----- */
  const [descansoAberto, setDescansoAberto] = useState(false);
  const [tratamentoAlvoId, setTratamentoAlvoId] = useState("");
  const [treinoAlvoId, setTreinoAlvoId] = useState("");
  const jogadoresDisponiveis = (entidades || []).filter((j) => j.rotulo === "Personagem" && j.id !== e.id);

  const ativarBonusDescanso = (chave) => onAtualizarCampo(e.id, "descansoAtivos", { ...(e.descansoAtivos || {}), [chave]: true });
  // Alimentar-se e Meditar também devolvem as variáveis (Munição = máximo, Carga = 0) ao valor original.
  const resetarVariaveis = () => {
    if ((e.variaveis || []).length) onAtualizarCampo(e.id, "variaveis", e.variaveis.map((v) => ({ ...v, valor: valorInicialVariavel(e, v) })));
  };
  // Machucado (que vem de ser curado de Morrendo) some numa ação de descanso — exceto se a pessoa estava Morrendo agora.
  const removerMachucadoDescanso = () => { if (condicaoAtiva(e, "Morrendo")) return; onAtualizarCampo(e.id, "condicoes", (c) => { const n = { ...(c || {}) }; delete n["Machucado"]; return n; }); };
  const pararSustentacao = (a) => { onAtualizarCampo(e.id, "ataques", (l) => (l || []).map((x) => (x.id === a.id ? { ...x, sustentando: false } : x))); desativarColaterais(e, a, onAtualizarCampo); };
  const alimentarSe = () => { onAtualizarCampo(e.id, "pvAtual", Math.min(pvMaxCalc(e), (e.pvAtual || 0) + attr(e, "vigor") + (e.nivel || 1))); resetarVariaveis(); removerMachucadoDescanso(); };
  const meditar = () => { onAtualizarCampo(e.id, "nenAtual", Math.min(nenMaxCalc(e), (e.nenAtual || 0) + attr(e, "prontidao") + (e.nivel || 1))); resetarVariaveis(); removerMachucadoDescanso(); };
  const ajustarVariavel = (v, valor) => {
    const max = v.tipo === "municao" ? maxVariavel(e, v) : Infinity;
    const novo = Math.max(0, Math.min(max, Math.round(Number(valor) || 0)));
    onAtualizarCampo(e.id, "variaveis", (e.variaveis || []).map((x) => (x.id === v.id ? { ...x, valor: novo } : x)));
  };
  const removerDuracao = (d) => {
    if (d.tipo === "condicao") {
      const atuais = { ...(e.condicoes || {}) };
      if (atuais[d.nome]) { atuais[d.nome] -= 1; if (atuais[d.nome] <= 0) delete atuais[d.nome]; }
      onAtualizarCampo(e.id, "condicoes", atuais);
    }
    onAtualizarCampo(e.id, "duracoes", (e.duracoes || []).filter((x) => x.id !== d.id));
  };
  const nomeDoTurno = (id) => (entidades || []).find((x) => x.id === id)?.nome || "?";
  const tratarJogador = () => {
    const alvo = jogadoresDisponiveis.find((j) => j.id === tratamentoAlvoId);
    if (!alvo || !onAtualizarCampo) return;
    const cura = attr(e, "inteligencia") + (e.nivel || 1);
    const novoPv = Math.min(pvMaxCalc(alvo), (alvo.pvAtual || 0) + cura);
    onAtualizarCampo(alvo.id, "pvAtual", novoPv);
    if (registrar) registrar({ tipo: "rolagem", desc: `${e.nome || "Personagem"} dá tratamento em ${alvo.nome}`, detalhe: `Cura ${cura} (Inteligência + Nível)`, total: `${novoPv}/${pvMaxCalc(alvo)} PV`, tipoClasse: "hs" });
  };
  const treinarComJogador = () => {
    const alvo = jogadoresDisponiveis.find((j) => j.id === treinoAlvoId);
    if (!alvo || !onAtualizarCampo) return;
    ativarBonusDescanso("treinar");
    onAtualizarCampo(alvo.id, "descansoAtivos", { ...(alvo.descansoAtivos || {}), treinar: true });
    if (registrar) registrar({ tipo: "rolagem", desc: `${e.nome || "Personagem"} treina com ${alvo.nome}`, detalhe: "Ambos ganham +2 no próximo teste de ataque, até o próximo descanso", total: "Treinamento ativado", tipoClasse: "hs" });
  };

  const toggleCondicao = (nome) => {
    const atuais = { ...(e.condicoes || {}) };
    if (atuais[nome]) delete atuais[nome]; else atuais[nome] = 1;
    onAtualizarCampo(e.id, "condicoes", atuais);
    if (!atuais[nome] && (e.duracoes || []).some((d) => d.nome === nome)) onAtualizarCampo(e.id, "duracoes", (e.duracoes || []).filter((d) => d.nome !== nome));
  };
  const ajustarMachucado = (delta) => {
    const atuais = { ...(e.condicoes || {}) };
    const atual = (atuais["Machucado"] || 0) + delta;
    if (atual <= 0) delete atuais["Machucado"]; else atuais["Machucado"] = atual;
    onAtualizarCampo(e.id, "condicoes", atuais);
  };

  if (!aberto) {
    return (
      <div className={"ent-item" + (onArrastarFicha ? " arrastavel" : "")} draggable={!!onArrastarFicha} onDragStart={(ev) => { if (onArrastarFicha) onArrastarFicha(ev, e); }} onDragEnd={() => { if (onArrastarFichaFim) onArrastarFichaFim(); }} title={onArrastarFicha ? "Arraste para uma pasta" : undefined}>
        <div className="ent-collapsed" onClick={() => setAberto(true)}>
          <div className="nome-row">
            {e.foto && <span className="foto-thumb-wrap" style={{ width: 26, height: 26 }}><ImgAj src={e.foto} aj={e.fotoAj} alt="" className="foto-thumb" style={{ width: 26, height: 26 }} /></span>}
            <span className="nome nome-clicavel">{e.nome}</span>
            <span className="meta">{e.rotulo} · Nv.{e.nivel} · {e.dono}</span>
            {e.oponente && <span className="badge-status">Engajado</span>}
            {e.sustentado && <span className="badge-status">Sustentando</span>}
          </div>
          {editavel && (
            <div className="actions" onClick={(ev) => ev.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" onClick={onEditar}>Editar</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmandoExclusao(true)}>Excluir</button>
            </div>
          )}
        </div>
        {confirmandoExclusao && (
          <ConfirmModal titulo="Excluir ficha" textoConfirmar="Excluir"
            mensagem={`Tem certeza que quer excluir "${e.nome}"? Essa ação não pode ser desfeita.`}
            onConfirmar={confirmarExclusao} onCancelar={() => setConfirmandoExclusao(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="ent-item">
      <div className="ficha-hero">
        {e.foto && <div className="hero-bg" style={{ backgroundImage: `url(${e.foto})` }} />}
        <div className="hero-conteudo">
          <div className="hero-linha">
            <div className="hero-retrato" onClick={() => setAberto(false)} title="Recolher ficha">
              {e.foto ? <ImgAj src={e.foto} aj={e.fotoAj} alt={e.nome} /> : <span>{(e.nome || "?").trim().charAt(0).toUpperCase()}</span>}
            </div>
            <div className="hero-info">
              <span className="nome nome-clicavel" onClick={() => setAberto(false)}>{e.nome}</span>
              <div className="rotulo">{e.rotulo} · Nv.{e.nivel} · {e.tipoNen} · {e.dono}</div>
              <div className="hero-tags">
                {e.oponente && <span className="tag-cond status">Engajado</span>}
                {e.defendendo && <span className={"tag-cond status" + (editavel ? " pode" : "")} onClick={() => editavel && onAtualizarCampo(e.id, "defendendo", false)}>Defendendo{editavel ? " ×" : ""}</span>}
                {e.mirando && <span className={"tag-cond status" + (editavel ? " pode" : "")} onClick={() => editavel && onAtualizarCampo(e.id, "mirando", false)}>Mirando{editavel ? " ×" : ""}</span>}
                {(e.ataques || []).filter((a) => a.tipo !== "passiva" && a.sustentando).map((a) => <span key={a.id} className={"tag-cond status" + (editavel ? " pode" : "")} onClick={() => editavel && pararSustentacao(a)}>Sustentando: {a.nome || "habilidade"}{editavel ? " ×" : ""}</span>)}
                {Object.entries(e.condicoes || {}).map(([nome, qtd]) => (
                  <button key={nome} type="button" className={"tag-cond " + tomCondicao(nome) + (editavel ? " pode" : "")} title={CONDICOES_LISTA.find((c) => c.nome === nome)?.desc}
                    onClick={() => { if (!editavel) return; if (CONDICOES_LISTA.find((c) => c.nome === nome)?.stackable) ajustarMachucado(-1); else toggleCondicao(nome); }}>
                    {nome}{qtd > 1 ? ` ×${qtd}` : ""}{nome === "Morrendo" ? ` · ${e.morrendoContador ?? 3} turno(s)` : ""}
                  </button>
                ))}
              </div>
            </div>
            {editavel && <div className="hero-acoes"><button className="btn btn-ghost btn-sm" onClick={onEditar}>Editar</button><button className="btn btn-danger btn-sm" onClick={() => setConfirmandoExclusao(true)}>Excluir</button></div>}
          </div>

          <BarraVital tipo="vida" nome="Vida" atual={e.pvAtual || 0} max={pvMax} temp={e.pvTemp || 0}
            entrada={editavel ? <input className="in-vida" type="number" value={e.pvAtual || 0} onChange={(ev) => onAtualizarCampo(e.id, "pvAtual", Number(ev.target.value))} /> : null} />
          <BarraVital tipo="nen" nome="Nen" atual={e.nenAtual || 0} max={nenMax}
            entrada={editavel ? <input className="in-nen" type="number" value={e.nenAtual || 0} onChange={(ev) => onAtualizarCampo(e.id, "nenAtual", Number(ev.target.value))} /> : null} />

          <div className="info-chips">
            {(e.variaveis || []).map((v) => (
              <span key={v.id} className="info-chip">{v.nome || "Variável"}{" "}
                {editavel ? <input className="in-nen" type="number" min={0} value={valorVariavel(e, v)} onChange={(ev) => ajustarVariavel(v, ev.target.value)} /> : <b>{valorVariavel(e, v)}</b>}
                {v.tipo === "municao" && <>/ <b>{maxVariavel(e, v)}</b></>}
              </span>
            ))}
            <span className="info-chip">Deslocamento <b>{deslocamentoTexto(e)}</b></span>
            <span className="info-chip">PP <b>{pontosPoderGastos(e)}/{pontosPoderMax(e)}</b></span>
            {pontosEquipamentoMax(e) > 0 && <span className="info-chip">Equip <b>{pontosEquipamentoGastos(e)}/{pontosEquipamentoMax(e)}</b></span>}
          </div>

          <div className="acoes-bolinhas" style={{ marginBottom: editavel ? 12 : 0 }}>
            <span className="ab-label">Ações</span>
            {acoesVisiveis(e).map((t) => {
              const gasta = !!(e.acoesGastas || {})[t.k];
              return (
                <button key={t.k} type="button" className={"acao-bolinha" + (gasta ? " gasta" : "") + (editavel ? " pode" : "")} style={{ "--ab-cor": t.cor }}
                  title={`${t.nome} — ${gasta ? "já usada neste turno" : "disponível"}${editavel ? " (clique para alternar)" : ""}`}
                  aria-label={`${t.nome}: ${gasta ? "usada" : "disponível"}`}
                  onClick={() => { if (editavel) onAtualizarCampo(e.id, "acoesGastas", (g) => ({ ...(g || {}), [t.k]: !(g || {})[t.k] })); }} />
              );
            })}
            {RAPIDEZ_GRATIS.filter((g) => rap[g.id]).map((g) => {
              const usada = !!(e.rapidezUsos || {})[g.id];
              const sufixo = g.id === "maquinaPalavras" ? ` (${MANOBRAS_MAQUINA_PALAVRAS[rap.maquinaPalavras] || "Fintar"})` : "";
              return (
                <span key={g.id} className="info-chip" role="button" style={{ marginLeft: 6, cursor: editavel ? "pointer" : "default", opacity: usada ? 0.45 : 1 }}
                  title={`${g.nome}: primeiro uso do turno sem custo de ação — ${usada ? "já usado neste turno" : "disponível"}${editavel ? " (clique para alternar)" : ""}`}
                  onClick={() => { if (editavel) onAtualizarCampo(e.id, "rapidezUsos", (u) => ({ ...(u || {}), [g.id]: !(u || {})[g.id] })); }}>
                  {g.nome}{sufixo} <b>{usada ? "usado" : "grátis"}</b>
                </span>
              );
            })}
          </div>

          {(podeMarcarOponente || editavel) && (
            <div className="status-toggle-row" style={{ marginBottom: editavel ? 10 : 0 }}>
              {podeMarcarOponente && (
                <label className={"status-toggle status-toggle-danger" + (e.oponente ? " ativo" : "")}>
                  <input type="checkbox" checked={!!e.oponente} onChange={(ev) => onAtualizarCampo(e.id, "oponente", ev.target.checked)} />
                  <span className="status-toggle-dot" />
                  Engajado no combate
                </label>
              )}
              {editavel && (
                <label className={"status-toggle status-toggle-crit" + (e.sustentado ? " ativo" : "")}>
                  <input type="checkbox" checked={!!e.sustentado} onChange={(ev) => onAtualizarCampo(e.id, "sustentado", ev.target.checked)} />
                  <span className="status-toggle-dot" />
                  Sustentando
                </label>
              )}
            </div>
          )}
          {editavel && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => onRolarIniciativa(e)}>⚄ Iniciativa</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setDescansoAberto((s) => !s)}>Ações de descanso</button>
            </div>
          )}
        </div>
      </div>

      {editavel && descansoAberto && (
        <div className="subcard2" style={{ marginBottom: 10 }}>
          <div className="section-title">Ações de descanso disponíveis</div>

          <div className="subcard" style={{ marginBottom: 8 }}>
            <div className="row-inline" style={{ justifyContent: "space-between" }}>
              <div><b>Alimentar-se</b><div className="field-note">Cura Vida = Vigor + Nível ({attr(e, "vigor") + (e.nivel || 1)}).</div></div>
              <button className="btn btn-accent btn-sm" onClick={alimentarSe}>Usar</button>
            </div>
          </div>

          <div className="subcard" style={{ marginBottom: 8 }}>
            <div className="row-inline" style={{ justifyContent: "space-between" }}>
              <div><b>Exercitar-se</b><div className="field-note">+2 em Atletismo, Acrobacia ou Furtividade até o próximo descanso (uma vez).</div></div>
              <button className={"btn btn-sm " + (e.descansoAtivos?.exercitar ? "btn-ghost" : "btn-accent")} disabled={!!e.descansoAtivos?.exercitar} onClick={() => ativarBonusDescanso("exercitar")}>
                {e.descansoAtivos?.exercitar ? "Ativo" : "Ativar"}
              </button>
            </div>
          </div>

          <div className="subcard" style={{ marginBottom: 8 }}>
            <div className="row-inline" style={{ justifyContent: "space-between" }}>
              <div><b>Meditar</b><div className="field-note">Cura Nen = Prontidão + Nível ({attr(e, "prontidao") + (e.nivel || 1)}).</div></div>
              <button className="btn btn-accent btn-sm" onClick={meditar}>Usar</button>
            </div>
          </div>

          <div className="subcard" style={{ marginBottom: 8 }}>
            <div className="row-inline" style={{ justifyContent: "space-between" }}>
              <div><b>Pesquisar</b><div className="field-note">+2 em Investigação, Tecnologia ou Tratamento até o próximo descanso (uma vez).</div></div>
              <button className={"btn btn-sm " + (e.descansoAtivos?.pesquisar ? "btn-ghost" : "btn-accent")} disabled={!!e.descansoAtivos?.pesquisar} onClick={() => ativarBonusDescanso("pesquisar")}>
                {e.descansoAtivos?.pesquisar ? "Ativo" : "Ativar"}
              </button>
            </div>
          </div>

          <div className="subcard" style={{ marginBottom: 8 }}>
            <div className="row-inline" style={{ justifyContent: "space-between" }}>
              <div><b>Preparar Discurso</b><div className="field-note">+2 em Enganação, Intimidação ou Persuasão até o próximo descanso (uma vez).</div></div>
              <button className={"btn btn-sm " + (e.descansoAtivos?.discurso ? "btn-ghost" : "btn-accent")} disabled={!!e.descansoAtivos?.discurso} onClick={() => ativarBonusDescanso("discurso")}>
                {e.descansoAtivos?.discurso ? "Ativo" : "Ativar"}
              </button>
            </div>
          </div>

          <div className="subcard" style={{ marginBottom: 8 }}>
            <div style={{ marginBottom: 8 }}><b>Tratamento</b><div className="field-note">Cura Vida de outro personagem = sua Inteligência + Nível ({attr(e, "inteligencia") + (e.nivel || 1)}).</div></div>
            <SearchableSelect listaCheia value={tratamentoAlvoId} onChange={(ev) => setTratamentoAlvoId(ev.target.value)} style={{ marginBottom: 8 }}>
              <option value="">Selecione um jogador…</option>
              {jogadoresDisponiveis.map((j) => <option key={j.id} value={j.id}>{j.nome}</option>)}
            </SearchableSelect>
            <button className="btn btn-accent btn-sm btn-block" disabled={!tratamentoAlvoId} onClick={tratarJogador}>Tratar</button>
          </div>

          <div className="subcard">
            <div style={{ marginBottom: 8 }}><b>Treinamento</b><div className="field-note">Você e o jogador escolhido ganham um checkbox de +2 no próximo teste de ataque, até o próximo descanso.</div></div>
            <SearchableSelect listaCheia value={treinoAlvoId} onChange={(ev) => setTreinoAlvoId(ev.target.value)} style={{ marginBottom: 8 }}>
              <option value="">Selecione um jogador…</option>
              {jogadoresDisponiveis.map((j) => <option key={j.id} value={j.id}>{j.nome}</option>)}
            </SearchableSelect>
            <button className="btn btn-accent btn-sm btn-block" disabled={!treinoAlvoId} onClick={treinarComJogador}>Treinar</button>
          </div>
        </div>
      )}

      {(e.ataques || []).length > 0 && (
        <div className="stat-group">
          <div className="acoes-header secao-titulo" onClick={() => toggleSecao("ataques")} style={{ marginBottom: secoes.ataques ? 8 : 0 }}>
            <div className="stat-group-label" style={{ marginBottom: 0 }}>Habilidades</div>
            <span className={"arrow" + (secoes.ataques ? " open" : "")}>▶</span>
          </div>
          {secoes.ataques && (
            <div className="hab-grid">
              {e.ataques.map((a) => {
                const passiva = a.tipo === "passiva";
                const ativa = passiva && passivaEstaAtiva(a);
                const k = chaveAcaoDeNome(acaoDaHabilidade(a));
                const corAcao = ACOES_TIPOS.find((t) => t.k === k)?.cor || "var(--muted)";
                return (
                  <button key={a.id} type="button" className={"hab-card" + (passiva ? " passiva" : "") + (ativa ? " ativo" : "") + (itemQuebrado(a) ? " item-quebrado" : "")}
                    disabled={passiva && !editavel} onClick={() => (passiva ? (editavel ? alternarPassiva(a) : null) : abrirAtaque(a))}
                    title={passiva ? (editavel ? (ativa ? "Clique para desativar" : "Clique para ativar") : "") : "Clique para usar"}>
                    {a.imagem ? <div className="hab-img-wrap"><ImgAj className="hab-img" src={a.imagem} aj={a.imagemAj} /></div> : <div className="hab-faixa" />}
                    <div className="hab-corpo">
                      <div className="hab-nome">{a.nome || "(sem nome)"}</div>
                      <div className="hab-tags">
                        {passiva ? <span className="hab-tag">{rotuloPassivos(a)}</span> : <span className="hab-tag">{TIPOS_ACERTO.find((t) => t.v === a.tipoAcerto)?.l}</span>}
                        {passiva && <span className={"hab-tag" + (ativa ? " ligada" : "")}>{ativa ? "Ativa" : "Desligada"}</span>}
                        <span className="hab-tag" style={{ "--hab-cor": corAcao }}><span className="hab-dot" />{rotuloAcaoCurto(acaoDaHabilidade(a))}</span>
                        {Number(a.custoNen) > 0 && <span className="hab-tag nen">{a.custoNen} Nen</span>}
                        {Number(a.custoVida) > 0 && <span className="hab-tag vida">{a.custoVida} PV</span>}
                        {a.sustentado && <span className="hab-tag">Sustentada{a.acaoSustentar && a.acaoSustentar !== "Nenhuma" ? ` · ${rotuloAcaoCurto(a.acaoSustentar)}` : ""}</span>}
                        {itemQuebrado(a) && <span className="hab-tag vida">Quebrado</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="stat-group">
        <div className="stat-group-label">Defesas</div>
        <div className="cartoes-stat">
          {DEFESAS_OPCOES.map((d) => <CartaoStat key={d.key} tipo="def" rotulo={d.label} valor={statDefesa(e, d.key)} onClick={() => abrirStat("defesa", d.key, d.label)} />)}
        </div>
      </div>

      <div className="stat-group">
        <div className="stat-group-label">Atributos</div>
        <div className="cartoes-stat">
          {ATRIBUTOS.map((a) => <CartaoStat key={a.k} rotulo={a.l} valor={attr(e, a.k)} onClick={() => abrirStat("atributo", a.k, a.l)} />)}
        </div>
      </div>

      {(e.duracoes || []).length > 0 && (
        <div className="stat-group">
          <div className="stat-group-label">Temporários (acabam sozinhos no turno)</div>
          <div className="chip-row">
            {e.duracoes.map((d) => (
              <button key={d.id} className="stat-chip ajuda-chip" title="Clique para remover agora" onClick={() => editavel && removerDuracao(d)}>
                {d.tipo === "atributo" ? <>{ATRIBUTOS.find((a) => a.k === d.chave)?.l || d.chave} <b>-{d.valor}</b></> : d.nome}
                {" "}<span style={{ opacity: 0.7 }}>· até {d.quando === "inicio" ? "o início" : "o fim"} do turno de {nomeDoTurno(d.turnoDeId)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(e.buffsAjuda || []).length > 0 && (
        <div className="stat-group">
          <div className="stat-group-label">Ajuda recebida</div>
          <div className="chip-row">
            {e.buffsAjuda.map((b) => (
              <button key={b.id} className="stat-chip ajuda-chip" onClick={() => onAtualizarCampo(e.id, "buffsAjuda", e.buffsAjuda.filter((x) => x.id !== b.id))}>
                {b.chave} <b>+{b.bonus}</b> <span style={{ opacity: 0.7 }}>· {b.deNome}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {(e.efeitosManobra || []).length > 0 && (
        <div className="stat-group">
          <div className="stat-group-label">Efeitos de manobra</div>
          <div className="chip-row">
            {e.efeitosManobra.map((m) => (
              <button key={m.id} className="stat-chip ajuda-chip" onClick={() => onAtualizarCampo(e.id, "efeitosManobra", e.efeitosManobra.filter((x) => x.id !== m.id))}>
                {m.tipo === "agora" ? "Agora!" : m.tipo === "cuidado" ? `Cuidado (${m.chave === "esquiva" ? "Esquiva" : "Aparar"})` : "Nosso Alvo"} <b>{fmtBonus(m.valor)}</b> <span style={{ opacity: 0.7 }}>· {m.deNome}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editavel && e.plano && (
        <div className="plano-card">
          <div className="pt">Plano ativo</div>
          <div className="pd">{e.plano.acoes} Ação(ões) de Planejamento restante(s).</div>
          <div className="chip-row">
            {PLANO_EFEITOS.map((p) => (
              <button key={p.subtipo} className="stat-chip acao-chip" title={p.desc} onClick={() => abrirAcao({ id: "plano_" + p.subtipo, nome: p.nome, tag: "Reação (Plano)", resolvedor: "planoEfeito", subtipo: p.subtipo, desc: p.desc })}>
                {p.nome}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onAtualizarCampo(e.id, "plano", null)}>Cancelar plano</button>
        </div>
      )}

      {editavel && (
        <div className="stat-group">
          <div className="acoes-header secao-titulo" onClick={() => toggleSecao("acoes")}>
            <div className="stat-group-label">Ações</div>
            <span className={"arrow" + (secoes.acoes ? " open" : "")}>▶</span>
          </div>
          {secoes.acoes && (
            <div className="hab-grid">
              {ACOES_PADRAO.map((a) => <CartaoAcao key={a.id} a={a} onClick={() => abrirAcao(a)} />)}
              <CartaoAcao a={{ id: "agarrao", nome: "Manter Agarrão", tag: "Ação Livre" }} onClick={manterAgarrao} rotuloExtra={rap.carente ? "Grátis (Carente)" : null} titulo={rap.carente ? "Carente: manter o agarrão não gasta ação livre" : "Gasta uma ação livre"} />
            </div>
          )}
        </div>
      )}

      {editavel && (
        <div className="stat-group">
          <div className="acoes-header secao-titulo" onClick={() => toggleSecao("manobras")}>
            <div className="stat-group-label">Manobras</div>
            <span className={"arrow" + (secoes.manobras ? " open" : "")}>▶</span>
          </div>
          {secoes.manobras && (
            <div className="hab-grid">
              {MANOBRAS.map((m) => <CartaoAcao key={m.id} a={m} onClick={() => abrirAcao(m)} />)}
            </div>
          )}
        </div>
      )}

      <div className="stat-group">
        <div className="acoes-header secao-titulo" onClick={() => toggleSecao("pericias")}>
          <div className="stat-group-label">Perícias</div>
          <span className={"arrow" + (secoes.pericias ? " open" : "")}>▶</span>
        </div>
        {secoes.pericias && (
          <div className="chip-row">
            {PERICIAS.map((p) => <StatChip key={p.nome} label={p.nome} value={bonusPericia(e, p.nome)} onClick={() => abrirStat("pericia", p.nome, p.nome)} />)}
          </div>
        )}
      </div>

      {(e.vantagens || []).length > 0 && (
        <div className="stat-group">
          <div className="acoes-header secao-titulo" onClick={() => toggleSecao("vantagens")}>
            <div className="stat-group-label">Vantagens</div>
            <span className={"arrow" + (secoes.vantagens ? " open" : "")}>▶</span>
          </div>
          {secoes.vantagens && (
            <div className="chip-row">
              {e.vantagens.map((v) => (
                <button key={v.id} className={"stat-chip vantagem-chip" + (v.ativo ? " ativo" : "")} onClick={() => onAbrirVantagem(e, v, editavel)}>
                  {v.nome}{v.graduacoes > 1 ? <b> ×{v.graduacoes}</b> : null}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(passivos.notas.length > 0 || passivos.reducaoDano > 0 || passivos.reducaoDanoLimitado > 0 || (passivos.reducaoDanoItens || []).length > 0 || passivos.regenPorTurno > 0 || passivos.comunicacaoAlcance > 0 || passivos.pontosSorteMax > 0 || passivos.deslocamentos.temVoo || passivos.deslocamentos.temNatacao || passivos.deslocamentos.temEscavacao || passivos.membrosExtras > 0 || passivos.tamanho !== 0 || efeitosColateraisAtivos(e).length > 0) && (
        <div className="stat-group">
          <div className="stat-group-label">Efeitos Passivos Ativos</div>
          <div className="readonly-grid">
            {passivos.tamanho !== 0 && <div className="ro-row"><span>Tamanho</span><b>{passivos.tamanho >= 0 ? "+" : ""}{passivos.tamanho}</b></div>}
            {passivos.reducaoDano > 0 && <div className="ro-row"><span>Redução de Dano</span><b>{passivos.reducaoDano}</b></div>}
            {passivos.reducaoDanoLimitado > 0 && <div className="ro-row"><span>Redução de Dano (Limitado)</span><b>{passivos.reducaoDanoLimitado}</b></div>}
            {(passivos.reducaoDanoItens || []).map((it) => <div className="ro-row" key={it.ataqueId}><span>Redução de Dano ({it.nome})</span><b>{it.valor}</b></div>)}
            {passivos.regenPorTurno > 0 && <div className="ro-row"><span>Regeneração/turno</span><b>{passivos.regenPorTurno} PV</b></div>}
            {passivos.membrosExtras > 0 && <div className="ro-row"><span>Membros Extras</span><b>{passivos.membrosExtras}</b></div>}
            {passivos.comunicacaoAlcance > 0 && <div className="ro-row"><span>Alcance de Comunicação</span><b>{Math.round(passivos.comunicacaoAlcance)}m</b></div>}
            {passivos.deslocamentos.temVoo && <div className="ro-row"><span>Voo</span><b>{deslocamentoTextoDe(passivos.deslocamentos.voo)}</b></div>}
            {passivos.deslocamentos.temNatacao && <div className="ro-row"><span>Natação</span><b>{deslocamentoTextoDe(passivos.deslocamentos.natacao)}</b></div>}
            {passivos.deslocamentos.temEscavacao && <div className="ro-row"><span>Escavação</span><b>{deslocamentoTextoDe(passivos.deslocamentos.escavacao)}</b></div>}
          </div>
          {passivos.pontosSorteMax > 0 && (
            <div className="ro-row" style={{ marginTop: 6 }}>
              <span>Pontos de Sorte</span>
              <span>
                {editavel && <button className="small-btn" onClick={() => onAtualizarCampo(e.id, "pontosSorteAtual", Math.max(0, (e.pontosSorteAtual ?? passivos.pontosSorteMax) - 1))}>-</button>}
                {" "}{e.pontosSorteAtual ?? passivos.pontosSorteMax}/{passivos.pontosSorteMax}{" "}
                {editavel && <button className="small-btn" onClick={() => onAtualizarCampo(e.id, "pontosSorteAtual", Math.min(passivos.pontosSorteMax, (e.pontosSorteAtual ?? passivos.pontosSorteMax) + 1))}>+</button>}
              </span>
            </div>
          )}
          {instanciasPassivasAtivas(e).map(({ ataque: a, inst, idx }) => {
            const def = PODERES_PASSIVOS.find((p) => p.id === inst.tipoId);
            if (!def) return null;
            const cd = def.cdInfo ? def.cdInfo(inst) : null;
            const mostraExplosao = def.temBotaoExplosao && inst.extrasAtivos?.explosao;
            if (!cd && !mostraExplosao) return null;
            return (
              <div key={`${a.id}-${inst.id || idx}`} className="ro-row" style={{ marginTop: 6 }}>
                <span title={cd ? `CD ${cd.cd} — ${cd.teste}` : undefined}>{a.nome || def.nome}{cd ? ` (CD ${cd.cd})` : ""}</span>
                {mostraExplosao && editavel && (
                  <button className={"small-btn" + (inst.explosaoLigada ? " ativo" : "")}
                    onClick={() => {
                      onAtualizarCampo(e.id, "ataques", (e.ataques || []).map((x) => (x.id === a.id ? { ...x, passivos: passivosDe(x).map((p, i) => (i === idx ? { ...p, explosaoLigada: !p.explosaoLigada } : p)) } : x)));
                      if (inst.explosaoLigada) onAtualizarCampo(e.id, "condicoes", (c) => ({ ...(c || {}), Fatigado: (c || {}).Fatigado || 1 }));
                    }}>
                    {inst.explosaoLigada ? "Explosão ligada (−)" : "Ativar Explosão (+3)"}
                  </button>
                )}
              </div>
            );
          })}
          {efeitosColateraisAtivos(e).map(({ ataque: a, item }, i) => (
            <div key={`col-${a.id}-${i}`} className="ro-row" style={{ marginTop: 6 }}>
              <span>{a.nome || "Habilidade"} — Efeito Colateral: {item.colateral.condicao || "—"}</span>
              <span className="field-note" style={{ margin: 0 }}>{item.colateral.comTeste ? `testa ${item.colateral.salvamento || ""} (CD ${10 + (item.graduacao || item.graduacaoNulificar || 0)}) todo turno` : "automático enquanto sustentado"}</span>
            </div>
          ))}
          {passivos.notas.length > 0 && <div className="field-note" style={{ marginTop: 6 }}>{passivos.notas.join(" · ")}</div>}
        </div>
      )}

      {editavel && (
        <div className="stat-group">
          <div className="acoes-header secao-titulo" onClick={() => toggleSecao("condicoes")}>
            <div className="stat-group-label">Condições</div>
            <span className={"arrow" + (secoes.condicoes ? " open" : "")}>▶</span>
          </div>
          {secoes.condicoes && (
            <div className="chip-row">
              {CONDICOES_LISTA.map((c) => {
                const ativa = !!(e.condicoes || {})[c.nome];
                const qtd = (e.condicoes || {})[c.nome] || 0;
                return (
                  <span key={c.nome} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                    <button className={"stat-chip vantagem-chip" + (ativa ? " ativo" : "")} title={c.desc} onClick={() => (c.stackable ? ajustarMachucado(1) : toggleCondicao(c.nome))}>
                      {c.nome}{qtd > 1 ? <b> ×{qtd}</b> : null}
                    </button>
                    {c.stackable && ativa && <button className="small-btn" style={{ width: 22, height: 22, fontSize: "0.8rem" }} onClick={() => ajustarMachucado(-1)}>–</button>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
      {confirmandoExclusao && (
        <ConfirmModal titulo="Excluir ficha" textoConfirmar="Excluir"
          mensagem={`Tem certeza que quer excluir "${e.nome}"? Essa ação não pode ser desfeita.`}
          onConfirmar={confirmarExclusao} onCancelar={() => setConfirmandoExclusao(false)} />
      )}
    </div>
  );
}

/* ---------- histórico ---------- */
function HistoricoTab({ historico, onAtualizar, identidade, registrar }) {
  const [ocultoAberto, setOcultoAberto] = useState(false);
  const [bonusOculto, setBonusOculto] = useState(0);
  const [cdOculto, setCdOculto] = useState(15);
  const ehMestre = identidade?.papel === "mestre";

  const rolarOculta = () => {
    const dado = rolarD20();
    const bonus = Number(bonusOculto) || 0;
    const r = montarTeste(dado, bonus, Number(cdOculto) || 10);
    registrar({
      tipo: "rolagem", oculto: true, donoOculto: identidade.nome,
      desc: `${identidade.nome} faz uma rolagem oculta`,
      detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${r.total} vs CD ${cdOculto}`,
      total: r.grauTexto, tipoClasse: r.tipoClasse,
    });
  };

  const visiveis = historico.filter((h) => h.tipo === "rolagem" && (!h.oculto || ehMestre || h.donoOculto === identidade?.nome));

  return (
    <div>
      <div className="row-inline" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Histórico de rolagens</div>
        <button className="btn btn-ghost btn-sm" onClick={onAtualizar}>↻ Atualizar</button>
      </div>

      {ehMestre && (
        <>
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => setOcultoAberto((s) => !s)} style={{ marginBottom: 10 }}>🎲 Rolagem oculta</button>
          {ocultoAberto && (
            <div className="oculto-box">
              <div className="grid2" style={{ marginBottom: 10 }}>
                <div><label className="label">Bônus</label><input type="number" value={bonusOculto} onChange={(e) => setBonusOculto(e.target.value)} /></div>
                <div><label className="label">CD</label><input type="number" value={cdOculto} onChange={(e) => setCdOculto(e.target.value)} /></div>
              </div>
              <button className="btn btn-accent btn-block" onClick={rolarOculta}>⚄ Rolar (visível só para você)</button>
            </div>
          )}
        </>
      )}

      {visiveis.length === 0 && <div className="card empty">Nenhuma rolagem ainda.</div>}
      {visiveis.map((h) => (
        <div key={h.id} className={"hist-item " + h.tipoClasse + (h.oculto ? " oculto" : "")}>
          <div className="hist-hora">{h.hora}</div>
          <div>
            <div className="hist-desc">{h.desc} {h.oculto && <span className="hist-oculto-tag">· oculto</span>}</div>
            <div className="hist-detalhe">{h.detalhe}</div>
          </div>
          <div className="hist-total">{h.total}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- iniciativa ---------- */
function IniciativaTab({ iniciativa, identidade, onAvancar, onRetroceder, onZerar }) {
  const ordem = iniciativa.ordem || [];
  const ehMestre = identidade?.papel === "mestre";
  return (
    <div>
      <div className="init-header">
        <div className="init-rodada">Rodada {iniciativa.rodada}</div>
        {ehMestre && (
          <div className="init-controls">
            <button className="btn btn-ghost btn-sm" onClick={onRetroceder} disabled={ordem.length === 0}>◀</button>
            <button className="btn btn-accent btn-sm" onClick={onAvancar} disabled={ordem.length === 0}>Próximo ▶</button>
          </div>
        )}
      </div>
      {ordem.length === 0 && <div className="card empty">Ninguém rolou iniciativa ainda. Use o botão "Iniciativa" na ficha.</div>}
      {ordem.map((o, i) => (
        <div key={o.entidadeId} className={"init-item" + (i === iniciativa.turnoAtual ? " atual" : "")}>
          <div className="init-val">{o.valor}</div>
          <div>
            <div className="init-nome">{o.nome}</div>
            {i === iniciativa.turnoAtual && <div className="init-turno-tag">Turno atual</div>}
          </div>
        </div>
      ))}
      {ehMestre && ordem.length > 0 && <button className="btn btn-ghost btn-sm btn-block" onClick={onZerar} style={{ marginTop: 8 }}>Zerar iniciativa</button>}
    </div>
  );
}
