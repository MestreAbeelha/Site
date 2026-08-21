import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  auth, ouvirAuth, cadastrar, entrar, sair, getPersonal, setPersonal,
  getShared, setShared, ouvirShared,
  ouvirEntidades, salvarEntidade, removerEntidadeDoc,
  ouvirHistorico, adicionarHistorico,
  migrarDadosAntigos,
} from "./firebase.js";

/* ---------- estilo global ---------- */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');

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
    .mm3 .ent-collapsed { display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer; }
    .mm3 .ent-collapsed .nome-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0; }
    .mm3 .ent-collapsed .nome { font-family:'Bebas Neue',sans-serif; font-size:1.05rem; letter-spacing:0.03em; }
    .mm3 .ent-collapsed .meta { font-size:0.72rem; color:var(--muted); }
    .mm3 .nome-clicavel { cursor:pointer; }
    .mm3 .vantagem-row { display:grid; grid-template-columns:1fr 70px auto; gap:8px; align-items:center; margin-bottom:6px; }
    .mm3 .vantagem-row select { font-size:0.85rem; }
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

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; } }
        else { if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; } }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
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
const NEN_TIPOS = ["Intensificação", "Emissão", "Transformação", "Manipulação", "Materialização", "Especialização", "Modelador", "Nenhum"];

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

const VANTAGENS = [
  { nome: "Agarrar Aprimorado", desc: "Você pode agarrar com apenas um braço, não ficando vulnerável enquanto agarra.", graduacaoMax: 1 },
  { nome: "Agarrar Rápido", desc: "Quando acerta um ataque desarmado, você pode fazer um teste de agarrar imediatamente contra o alvo como uma ação livre. Seu ataque desarmado causa dano normal e conta como o teste de ataque inicial exigido para agarrar seu oponente.", graduacaoMax: 1 },
  { nome: "Agarrar Preciso", desc: "Você pode usar Acrobacia no lugar de Atletismo para agarrar.", graduacaoMax: 1 },
  { nome: "Ambiente Favorito", desc: "Você é especialmente adaptado para lutar em determinado ambiente. Quando estiver no seu ambiente favorito, você ganha um bônus de circunstância de +2 em testes de ataque, esquiva ou aparar (escolha) e duas perícias a sua escolha.", mecanica: { modo: "toggle", bonus: 2, alvos: ["ataque"], escolheDefesa: true, escolhePericias: 2 } },
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
  { nome: "Crítico Aprimorado", desc: "Escolha uma habilidade específica sua (ao editar esta vantagem). Cada graduação aumenta a ameaça de crítico dessa habilidade em 1, até um máximo de ameaça 16-20 com 4 graduações. A rolagem de ataque dessa habilidade passa a considerar crítico automaticamente.", graduacaoMax: 4, pedeHabilidade: true },
  { nome: "De Pé", desc: "Você passa de caído para de pé sem custo de ação sem a necessidade de um teste da perícia Acrobacia.", graduacaoMax: 1 },
  { nome: "Defesa Aprimorada", desc: "Quando usa a ação defender-se e rolar um teste de resistência e tirar um resultado abaixo de 10 no d20, o resultado se torna a 10.", graduacaoMax: 1 },
  { nome: "Derrubar Aprimorado", desc: "Quando acerta um ataque desarmado, você pode fazer um teste de derrubar imediatamente contra o alvo como uma ação livre. Seu ataque desarmado causa dano normal e conta como o teste de ataque inicial exigido para derrubar seu oponente.", graduacaoMax: 1 },
  { nome: "Desarmar Aprimorado", desc: "Você não sofre penalidades em seu teste de ataque para desarmar um oponente e ao segurar a arma, pode dar um ataque com ela como uma ação livre no oponente desarmado.", graduacaoMax: 1 },
  { nome: "Destemido", desc: "Você é imune a todos os efeitos de medo. Na prática, isto é o efeito Imunidade a Medo.", graduacaoMax: 1 },
  { nome: "Empatia com Animais", desc: "Você recebe um bônus de +5 em perícias de interação para falar com animais, bestas ou criaturas não verbais. Você pode usar Prontidão no lugar de Presença em perícias de interação contra elas.", graduacaoMax: 1 },
  { nome: "Equipamento", desc: "Você tem 5 pontos por graduação nesta vantagem para gastar em equipamento. Isso inclui veículos e quartel-general." },
  { nome: "Esconder-se à Plena Vista", desc: "Você pode se esconder sem necessidade de um teste de Enganação ou de Intimidação e sem qualquer tipo de distração, e sem penalidade no seu teste de Furtividade. Você ainda precisa ter algum tipo de cobertura ou camuflagem ao alcance de sua velocidade normal para se esconder.", graduacaoMax: 1 },
  { nome: "Esquiva Fabulosa", desc: "Você não fica vulnerável quando surpreso ou de outra maneira pego desatento. Você ainda fica vulnerável devido a efeitos que limitam sua mobilidade.", graduacaoMax: 1 },
  { nome: "Estrangular", desc: "Se você for bem-sucedido em agarrar e imobilizar um oponente, você pode estrangulá-lo, fazendo seu oponente começar a sufocar enquanto você o imobiliza.", graduacaoMax: 1 },
  { nome: "Evasão", desc: "Você tem um bônus de circunstância de +2 em testes de salvamento de Esquiva para evitar efeitos de área. Se tiver 2 graduações nesta vantagem, seu bônus de circunstância aumenta para +5.", graduacaoMax: 2 },
  { nome: "Fascinar", desc: "Uma de suas perícias de interação é tão eficaz que você pode capturar e prender a atenção de outras pessoas com ela. Escolha Enganação, Intimidação ou Persuasão ao adquirir esta vantagem. Use uma ação livre e faça um teste de perícia de interação contra um teste oposto de seu alvo (Intuição ou a defesa Vontade). Caso seja bem-sucedido, o alvo fica em transe. Você pode manter o efeito com uma ação livre por rodada, concedendo ao alvo um novo teste de salvamento. O efeito termina quando você para de atuar, quando o alvo resistir com sucesso, ou caso qualquer outro perigo imediato se apresente. Você pode comprar esta vantagem mais de uma vez; a cada nova compra, ela se aplica a uma perícia diferente.", graduacaoMax: 3 },
  { nome: "Ferramentas Improvisadas", desc: "Você pode inventar dispositivos temporários. Com uma ação de descanso, você pode criar um dispositivo, os pontos de poder que esse dispositivo pode ter, é igual a quantidade de pontos que você gastou nessa vantagem. Ao montar o seu dispositivo faça um teste de Tecnologia CD 10 + Custo do dispositivo, ao ser bem sucedido você pode usar esse dispositivo como se fosse um efeito de poder seu, mas ao utilizá-lo, ele descarrega, se desfaz ou é destruído." },
  { nome: "Finta Ágil", desc: "Você pode usar seu bônus de Acrobacia ou suas graduações de movimento no lugar de Enganação para fintar e realizar truques em combate como se o seu bônus de Acrobacia ou suas graduações de velocidade fossem o seu bônus de Enganação. Seu adversário se opõe a essa tentativa com Acrobacia ou Intuição (o que for melhor).", graduacaoMax: 1 },
  { nome: "Imobilizar Aprimorado", desc: "Quando você agarra, é difícil escapar. Oponentes agarrados sofrem uma penalidade de −2 em testes para escapar. Com duas graduações nessa vantagem, ela se torna -5.", graduacaoMax: 2 },
  { nome: "Inimigo Favorito", desc: "Você tem um tipo especial de oponente que estudou ou contra o qual é especialmente eficaz. Pode ser um tipo de criatura, uma profissão ou qualquer outra categoria que o mestre aprove. Categorias especialmente amplas como humanos ou vilões não são permitidas. Você ganha um bônus de circunstância de +2 em testes de ataque, Enganação, Intimidação, Intuição e Percepção ao lidar com seu Inimigo Favorito. Você só pode ter 1 inimigo favorito, mas sempre que aumentar o seu nível, você pode mudá-lo.", graduacaoMax: 1, mecanica: { modo: "condicional", bonus: 2, alvos: ["ataque", "Enganação", "Intimidação", "Intuição", "Percepção"], pedeTexto: true } },
  { nome: "Interpor-se", desc: "Uma vez por rodada, quando um aliado dentro do alcance de sua velocidade normal for acertado por um ataque, você pode escolher se colocar entre o atacante e seu aliado como uma reação, tornando-se o alvo do ataque no lugar dele. O ataque acerta você em vez de seu aliado, e você sofre os efeitos normalmente. Você não pode usar esta vantagem contra efeitos de área ou contra ataques de percepção à distância, apenas contra aqueles que exigem um teste de ataque.", graduacaoMax: 1 },
  { nome: "Luta no Chão", desc: "Você não sofre penalidade de circunstância em testes de ataque por estar caído, e oponentes adjacentes não ganham o bônus de circunstância de costume para ataques corpo-a-corpo contra você.", graduacaoMax: 1 },
  { nome: "Mira Aprimorada", desc: "Com uma ação livre, você pode ganhar +5 na sua próxima jogada de ataque.", graduacaoMax: 1 },
  { nome: "Parceiro", desc: "Você tem outro personagem que atua como seu parceiro e ajudante. Crie o parceiro como um personagem independente com (graduações na vantagem x 5) pontos de poder, limitado pelo nível de poder da série. O total de pontos de poder de um parceiro deve ser menor que o seu. Seu parceiro é um personagem do mestre, mas é automaticamente prestativo e leal a você. Caso seu parceiro morra, você recupera os pontos de poder investidos na vantagem no próximo nível." },
  { nome: "Prender Arma", desc: "Quando usa a ação defender-se e você se defende com sucesso de um ataque corpo-a-corpo com arma, você pode tentar desarmar seu oponente de imediato, como uma reação. A tentativa de desarme é feita normalmente, incluindo a oportunidade que o atacante ganha para desarmar você.", graduacaoMax: 1 },
  { nome: "Quebrar Aprimorado", desc: "Você não sofre penalidades em testes de ataque para acertar um objeto segurado por outro personagem.", graduacaoMax: 1 },
  { nome: "Quebrar Arma", desc: "Quando usa a ação defender-se e você se defende com sucesso de um ataque corpo-a-corpo com arma, você pode fazer um ataque contra a arma do atacante de imediato como uma reação. Isso exige um teste de ataque e causa dano normal à arma, caso acerte.", graduacaoMax: 1 },
  { nome: "Reativo", desc: "Você pode gastar uma ação livre no seu turno, para ter uma reação adicional até o começo do seu próximo turno.", graduacaoMax: 1 },
  { nome: "Redirecionar", desc: "Se você for bem-sucedido em ludibriar um oponente, pode redirecionar um ataque contra você que tenha falhado para outro alvo como uma reação. O novo alvo deve estar adjacente a você e dentro do alcance do ataque. O atacante faz um novo teste de ataque com os mesmos modificadores contra o novo alvo.", graduacaoMax: 1 },
  { nome: "Tolerância Maior", desc: "Você tem um bônus de +5 em testes para evitar ficar fatigado e em testes para prender a respiração, para evitar dano devido à fome ou à sede, para evitar dano de ambientes quentes ou frios e para resistir à sufocação e ao afogamento.", graduacaoMax: 1 },
  { nome: "Tontear", desc: "Você pode fazer um teste de Enganação ou de Intimidação (escolha qual perícia ao comprar esta vantagem) para fazer com que seu oponente hesite em combate. Faça um teste de perícia como uma ação livre contra o teste de salvamento do alvo (a mesma perícia, Intuição ou a defesa Vontade, o que tiver bônus mais alto). Se você vencer, seu alvo fica Tonto (capaz de realizar apenas uma ação padrão) até o fim da sua próxima rodada. A habilidade para deixar alguém Tonto com Enganação e com Intimidação são vantagens diferentes; compre duas graduações desta vantagem para ser capaz de fazer as duas coisas.", graduacaoMax: 2 },
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
  { nome: "Indefeso", desc: "Defesas ativas (Aparar/Esquiva) reduzidas a 0.", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Machucado", desc: "-1 em Fortitude, Resistência e Vontade. Acumula com novas aplicações.", efeito: { fortitude: -1, resistencia: -1, vontade: -1 }, stackable: true },
  { nome: "Molhado", desc: "+5 em Resistência/Fortitude contra fogo, -5 contra elétrico." },
  { nome: "Prejudicado", desc: "-2 de circunstância em todos os testes.", efeito: { testesGerais: -2 } },
  { nome: "Prendendo a Respiração", desc: "Imune a poderes de olfato; pode prender a respiração por 1 + Vigor rodadas." },
  { nome: "Surdo", desc: "Perde o sentido Audição." },
  { nome: "Sangrando", desc: "Perde 10% da vida máxima por turno até tratamento CD 10 ou cura." },
  { nome: "Sufocando", desc: "Teste de Fortitude CD 10 no início do turno ou fica Exausto." },
  { nome: "Tonto", desc: "Perde a ação livre." },
  { nome: "Vulnerável", desc: "Defesas ativas (Aparar/Esquiva) reduzidas pela metade.", efeito: { aparar: "metade", esquiva: "metade" } },
  { nome: "Zetsu", desc: "Não pode usar habilidades de nenhum tipo de Nen." },
  { nome: "Amarrado", desc: "Imóvel, indefeso e não pode usar braços ou pernas.", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Agarrado", desc: "Imóvel e vulnerável.", efeito: { aparar: "metade", esquiva: "metade" } },
  { nome: "Caído", desc: "-5 em ataques corpo-a-corpo próprios; oponentes corpo-a-corpo +5, à distância -5 contra você. Impedido.", efeito: { aparar: -5, esquiva: 5 }, penalidadeAtaqueCorpoProprio: -5 },
  { nome: "Cego", desc: "Perde a Visão; vulnerável a corpo-a-corpo, indefeso vs. à distância e prejudicado.", efeito: { testesGerais: -2, aparar: "metade", esquiva: "zero" } },
  { nome: "Exausto", desc: "Impedido e debilitado.", efeito: { testesGerais: -5 } },
  { nome: "Fatigado", desc: "Impedido e prejudicado.", efeito: { testesGerais: -2 } },
  { nome: "Incapacitado", desc: "Perde todas as ações, caído e efeitos de poder desabilitados.", efeito: { aparar: "zero", esquiva: "zero" } },
  { nome: "Morrendo", desc: "Incapacitado e próximo da morte; 3 turnos para receber tratamento." },
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
function limiarCritico(ent, ataqueId) {
  if (!ataqueId) return 20;
  const v = (ent?.vantagens || []).find((x) => x.nome === "Crítico Aprimorado" && x.alvoId === ataqueId);
  if (!v) return 20;
  return Math.max(16, 20 - (v.graduacoes || 1));
}

/* ---------- helpers de valores derivados ---------- */
function attrBase(ent, key) { return (ent && ent.atributos && ent.atributos[key]) || 0; }
function attr(ent, key) { return attrBase(ent, key) + bonusAtributoPassivo(ent, key); }

/* ---------- efeitos passivos (habilidades que não fazem rolagem: viram bônus fixos na ficha) ----------
   Cada tipo define custoBase (pontos por graduação), extras/falhas (checkboxes que ajustam o custo,
   e quando é numericamente claro, também entram no cálculo), e aplicar1()/aplicar2() que somam os
   efeitos num acumulador. aplicar1 roda antes de saber os atributos finais (pode alterar atributos e
   tamanho); aplicar2 roda depois (pode usar attr() já com os bônus de aplicar1, útil para deslocamento). */
const SENTIDOS_BASE = ["Visão", "Audição", "Olfato", "Paladar"];
const SENTIDOS_ESPECIAIS = ["Infravisão", "Percepção às Cegas", "Rastrear", "Sentido de Perigo", "Sentido Sísmico", "Ver Nen", "Visão no Escuro"];

const PODERES_PASSIVOS = [
  { id: "camuflagem", nome: "Camuflagem (pessoal)", categoria: "Coringa", custoBase: 2,
    desc: "Escolha um sentido: você fica camuflado contra ele (CD 15 + graduação para ser detectado por outro sentido ou por Percepção). O sentido Tato não pode ser camuflado.",
    campoEscolha: { chave: "sentido", label: "Sentido camuflado", opcoes: SENTIDOS_BASE },
    extras: [], falhas: [],
    cdInfo: (inst) => ({ cd: 15 + (inst.graduacao || 0), teste: `Percepção (ou teste do sentido) para detectar apesar da camuflagem contra ${inst.campos?.sentido || "o sentido escolhido"}` }),
    aplicar1() {}, aplicar2(ent, inst, acc) { if (inst.campos?.sentido) acc.notas.push(`Camuflado contra ${inst.campos.sentido}`); } },

  { id: "caracteristica", nome: "Característica Aumentada", categoria: "Fortificador", custoBase: 2,
    desc: "Aumenta um atributo em graduações iguais à graduação deste efeito, até o máximo de nível+4.",
    campoEscolha: { chave: "atributo", label: "Atributo aumentado", opcoes: ATRIBUTOS.map((a) => a.k), rotulos: ATRIBUTOS },
    extras: [
      { chave: "explosao", label: "Explosão (+3 no atributo até o início do próximo turno; ao acabar, fica Fadigado — ligue no botão que aparece na ficha)", custoPorGrad: 1 },
      { chave: "brutal", label: "Brutal (+2 na CD ao acertar um crítico com este atributo)", custoPorGrad: 1 },
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

  { id: "comunicacao", nome: "Comunicação", categoria: "Emissão", custoBase: 2,
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
    desc: "Reduz qualquer dano em uma quantidade igual à graduação. Se a graduação for maior que o nível, o excedente reduz a CD do teste de Resistência em vez de reduzir dano.",
    extras: [], falhas: [],
    aplicar1(ent, inst, acc) {
      const g = inst.graduacao || 0; const nivel = ent?.nivel || 1;
      acc.reducaoDano += Math.min(g, nivel);
      const excedente = Math.max(0, g - nivel);
      if (excedente > 0) acc.notas.push(`Proteção: ${excedente} graduação(ões) excedente(s) reduzem a CD do teste de Resistência em vez de reduzir dano (aplique manualmente)`);
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

  { id: "sentidoRemoto", nome: "Sentido Remoto", categoria: "Emissão", custoBase: 4,
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
];

function custoPassivo(inst, def) {
  if (!def) return 0;
  const g = Math.max(0, inst?.graduacao || 0);
  let base = def.custoBasePorAbrangencia ? (def.custoBasePorAbrangencia[inst?.campos?.abrangencia] || def.custoBase) : def.custoBase;
  let total = base * g;
  (def.extras || []).forEach((ex) => {
    if (!inst?.extrasAtivos?.[ex.chave]) return;
    if (ex.custoFixo) total += ex.custoFixo;
    else if (ex.custoPorGrad) total += ex.custoPorGrad * g;
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
    reducaoDano: 0, regenPorTurno: 0, pontosSorteMax: 0, membrosExtras: 0,
    comunicacaoAlcance: 0, deslocamentos: { base: 0, voo: 0, natacao: 0, escavacao: 0, temVoo: false, temNatacao: false, temEscavacao: false },
    notas: [],
  };
}
function habilidadesPassivasAtivas(ent) {
  return (ent?.ataques || []).filter((a) => a.tipo === "passiva" && a.passivo?.ativo && a.passivo?.tipoId);
}
function modificadoresPassivos(ent) {
  const acc = acumuladorPassivoVazio();
  const ativos = habilidadesPassivasAtivas(ent);
  ativos.forEach((a) => {
    const def = PODERES_PASSIVOS.find((p) => p.id === a.passivo.tipoId);
    if (def) def.aplicar1(ent, a.passivo, acc);
  });
  ativos.forEach((a) => {
    const def = PODERES_PASSIVOS.find((p) => p.id === a.passivo.tipoId);
    if (def) def.aplicar2(ent, a.passivo, acc);
  });
  return acc;
}
function bonusAtributoPassivo(ent, key) {
  if (!ent) return 0;
  let total = 0;
  habilidadesPassivasAtivas(ent).forEach((a) => {
    const def = PODERES_PASSIVOS.find((p) => p.id === a.passivo.tipoId);
    if (!def) return;
    const acc = acumuladorPassivoVazio();
    def.aplicar1(ent, a.passivo, acc);
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
  const p = PERICIAS.find((x) => x.nome === nomePericia);
  if (!p) return 0;
  const passivo = nomePericia === "Furtividade" ? modificadoresPassivos(ent).furtividade : 0;
  return attr(ent, p.atributo) + ((ent.periciaPontos && ent.periciaPontos[nomePericia]) || 0) + bonusVantagemToggle(ent, nomePericia) + calcModCondicoes(ent).testesGerais + passivo;
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
function statDefesa(ent, key) {
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
  if (key === "aparar") total = aplicarAjusteDefesa(total + somaEfeitoManobra(ent, "cuidado", "aparar"), mods.apararAj);
  if (key === "esquiva") total = aplicarAjusteDefesa(total + somaEfeitoManobra(ent, "cuidado", "esquiva"), mods.esquivaAj);
  return total;
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
  return statDefesa(ent, "resistencia");
}
function valorAlvoComoCD(ent, key) {
  if (!ent) return 10;
  if (key === "aparar" || key === "esquiva") return 10 + statDefesa(ent, key);
  if (key === "fortitude" || key === "vontade" || key === "resistencia") return 10 + statDefesa(ent, key);
  return 10 + bonusPericia(ent, key);
}

const EFEITO_CATEGORIAS = ["Dano", "Cura", "Aflição", "Enfraquecer", "Camuflagem", "Nulificar", "Outros"];
const SALVAMENTOS_ESCOLHA = ["Fortitude", "Vontade"];
const AFLICOES_G1 = ["Adoecido", "Caído", "Impedido", "Machucado", "Tonto", "Vulnerável"];
const AFLICOES_G2 = ["Atordoado", "Compelido", "Em chamas", "Envenenado", "Imóvel", "Indefeso", "Sangrando", "Em transe"];
const AFLICOES_G3 = ["Controlado", "Incapacitado", "Paralisado"];

function efeitoPadrao(categoria) {
  if (categoria === "Dano") return { categoria, graduacao: 0 };
  if (categoria === "Cura") return { categoria, graduacao: 5 };
  if (categoria === "Aflição") return { categoria, salvamento: "Fortitude", graduacao: 5, condicaoExtra: false, grau1: "", grau1b: "", grau2: "", grau2b: "", grau3: "", grau3b: "" };
  if (categoria === "Enfraquecer") return { categoria, salvamento: "Fortitude", graduacao: 5, caracteristica: "" };
  if (categoria === "Camuflagem") return { categoria, salvamento: "Fortitude", graduacao: 5, sentidos: [] };
  if (categoria === "Nulificar") return { categoria, graduacaoNulificar: 5 };
  if (categoria === "Outros") return { categoria, texto: "" };
  return { categoria };
}
function dadosEfeito(efeito, oponente) {
  if (efeito.categoria === "Dano") return { bonus: statDefesa(oponente, "resistencia"), cd: 15 + (efeito.graduacao || 0), salvLabel: "Resistência" };
  if (efeito.categoria === "Cura") return { bonus: efeito.graduacao || 0, cd: 10, salvLabel: "Cura (CD 10)", quemRolaAtacante: true };
  if (efeito.categoria === "Aflição") return { bonus: salvBonus(oponente, efeito.salvamento), cd: 10 + (efeito.graduacao || 0), salvLabel: efeito.salvamento };
  if (efeito.categoria === "Enfraquecer") return { bonus: salvBonus(oponente, efeito.salvamento), cd: 10 + (efeito.graduacao || 0), salvLabel: efeito.salvamento };
  if (efeito.categoria === "Camuflagem") return { bonus: salvBonus(oponente, efeito.salvamento), cd: 15 + (efeito.graduacao || 0), salvLabel: efeito.salvamento };
  if (efeito.categoria === "Nulificar") return { bonus: efeito.graduacaoNulificar || 0, cd: 10 + statDefesa(oponente, "vontade"), salvLabel: "Vontade do alvo", quemRolaAtacante: true };
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
function textoAflicao(efeito, graus) {
  const nivel = Math.min(Math.abs(graus), 3);
  if (nivel === 0) return "Sem efeito";
  const par = (g, gb) => (efeito.condicaoExtra && gb ? `${g || "—"} ou ${gb || "—"}` : (g || "—"));
  if (nivel === 1) return `1 grau — ${par(efeito.grau1, efeito.grau1b)}`;
  if (nivel === 2) return `2 graus — ${par(efeito.grau2, efeito.grau2b)}`;
  return `3 graus — ${par(efeito.grau3, efeito.grau3b)}`;
}
function textoNulificar(graus) {
  if (graus <= 0) return "Sem efeito — não superou a Vontade do alvo";
  if (graus === 1) return "1 grau: reduz a graduação de uma habilidade pela metade";
  if (graus === 2) return "2 graus: nulifica uma habilidade do alvo";
  if (graus === 3) return "3 graus: nulifica todas as habilidades de um tipo de Nen escolhido";
  return "4+ graus: nulifica tudo e deixa o alvo Indefeso";
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
function VantagemModal({ ctx, onFechar, onToggle }) {
  const { entidade, vantagem, info, editavel } = ctx;
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
      <div className="modal-box">
        <div className="modal-head"><span className="mt">{vantagem.nome}</span><button className="modal-close" onClick={onFechar}>×</button></div>
        <div className="modal-desc">{info?.desc}</div>
        {vantagem.graduacoes > 1 && <div className="field-note">Graduações: {vantagem.graduacoes}</div>}
        {(vantagem.periciasEscolhidas || []).some(Boolean) && <div className="field-note">Perícias escolhidas: {vantagem.periciasEscolhidas.filter(Boolean).join(", ")}</div>}
        {vantagem.textoExtra !== undefined && <div className="field-note">Alvo: {vantagem.textoExtra || "não definido"}</div>}
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

/* ---------- modal de rolagem ---------- */
function RollModal({ contexto, entidades, onFechar, registrar, animar, aplicarDano, atualizarCampo }) {
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

  const origemAtual = entidades.find((e) => e.id === contexto.origem.id) || contexto.origem;
  const oponente = entidades.find((e) => e.id === oponenteId);
  const ehAtaque = contexto.tipo === "ataque";
  const isArea = ehAtaque && contexto.ataque?.tipoAcerto === "area";
  const alvosArea = entidades.filter((e) => e.id !== origemAtual.id && oponentesArea[e.id]);
  const fechar = () => onFechar();

  const chaveCondicional = ehAtaque ? "ataque" : contexto.chave;
  const condicionaisDisponiveis = vantagensCondicionaisPara(origemAtual, chaveCondicional);
  const bonusCondicionalTotal = condicionaisDisponiveis.reduce((s, { v, info }) => s + (condMarcadas[v.id] ? bonusDeGraduacao(info, v.graduacoes) : 0), 0);
  const ajudaAtiva = atualizarCampo ? ajudaDisponivelPara(origemAtual, chaveCondicional) : null;
  const consumirAjudaSeHouver = () => { if (ajudaAtiva && atualizarCampo) atualizarCampo(origemAtual.id, "buffsAjuda", (origemAtual.buffsAjuda || []).filter((b) => b.id !== ajudaAtiva.id)); };

  const rolarSimples = (bonus, cd, alvoRolagem) => {
    const bonusFinal = bonus + (ajudaAtiva ? ajudaAtiva.bonus : 0);
    const dado = rolarD20();
    const r = montarTeste(dado, bonusFinal, cd);
    setResultado(r);
    setUltimoRoll({ tipo: "simples", bonus: bonusFinal, cd, alvoRolagem });
    consumirAjudaSeHouver();
    registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} testa ${contexto.label}`,
      detalhe: `d20(${dado}) ${fmtBonus(bonusFinal)}${ajudaAtiva ? ` (com ajuda de ${ajudaAtiva.deNome})` : ""} = ${r.total} vs CD ${cd}`,
      total: r.grauTexto, tipoClasse: r.tipoClasse,
    });
    if (animar) {
      if (alvoRolagem) {
        animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: alvoRolagem.nome, fotoAlvo: alvoRolagem.foto, dado, bonus: bonusFinal, total: r.total, cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.grauTexto });
      } else {
        animar({ modo: "simples", nome: `${origemAtual.nome} — ${contexto.label}`, foto: origemAtual.foto, dado, bonus: bonusFinal, total: r.total, cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.grauTexto });
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
    const defVal = (10 + statDefesa(oponente, info.defKey));
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
      detalhe: `d20(${dado}) ${fmtBonus(bonusFinal)}${ajudaAtiva ? ` (com ajuda de ${ajudaAtiva.deNome})` : ""}${bonusTreinoValor ? " (com bônus de Treinamento)" : ""} = ${r.total} vs ${info.defLabel} ${defVal}`,
      total: r.sucesso ? "Acertou" : "Errou", tipoClasse: r.tipoClasse,
    });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus: bonusFinal, total: r.total, cd: defVal, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Acertou!" : "Errou" });
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
  const rolarEfeitoGenerico = (efeito, alvo) => {
    const dados = dadosEfeito(efeito, alvo);
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
        if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: alvo.nome, fotoAlvo: alvo.foto, dado, bonus: dados.bonus, total: r.total, cd: dados.cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: cura > 0 ? `Curou ${cura} PV` : "Sem efeito" });
        return { r, cura, texto: cura > 0 ? `Curou ${cura} PV` : "Sem efeito" };
      }
      registrar({
        tipo: "rolagem",
        desc: `${origemAtual.nome} tenta Nulificar em ${alvo.nome}`,
        detalhe: `d20(${dado}) ${dados.bonus >= 0 ? "+" : ""}${dados.bonus} = ${r.total} vs CD ${dados.cd}`,
        total: r.sucesso ? r.grauTexto : "Sem efeito", tipoClasse: r.tipoClasse,
      });
      if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: alvo.nome, fotoAlvo: alvo.foto, dado, bonus: dados.bonus, total: r.total, cd: dados.cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? r.grauTexto : "Sem efeito" });
      return { r, texto: textoNulificar(r.graus) };
    }
    const dado = rolarD20();
    const r = montarTeste(dado, dados.bonus, dados.cd);
    let extra = {};
    if (efeito.categoria === "Dano") {
      const nivelAtacante = Math.max(1, origemAtual.nivel || 1);
      const graduacaoDano = Math.min(efeito.graduacao || 0, nivelAtacante);
      extra.dano = r.sucesso ? 0 : graduacaoDano * Math.abs(r.graus);
      extra.dano = Math.max(0, extra.dano - (modificadoresPassivos(alvo).reducaoDano || 0));
      if (!r.sucesso && Math.abs(r.graus) >= 2) {
        const graduacaoArremesso = Math.floor((efeito.graduacao || 0) / 2);
        let distancia = graduacaoParaDistancia(graduacaoArremesso);
        if (Math.abs(r.graus) >= 3) distancia *= 2;
        extra.arremesso = distancia;
      }
    }
    if (efeito.categoria === "Aflição") extra.texto = r.sucesso ? "Resistiu" : textoAflicao(efeito, r.graus);
    if (efeito.categoria === "Enfraquecer") extra.perda = r.sucesso ? 0 : Math.min(Math.abs(r.diff), efeito.graduacao || 0);
    if (efeito.categoria === "Camuflagem") extra.sentidos = r.sucesso ? [] : (efeito.sentidos || []);
    registrar({
      tipo: "rolagem",
      desc: `${alvo.nome} resiste a ${efeito.categoria} (${dados.salvLabel})`,
      detalhe: `d20(${dado}) ${dados.bonus >= 0 ? "+" : ""}${dados.bonus} = ${r.total} vs CD ${dados.cd}`,
      total: r.sucesso ? "Resistiu" : "Sofreu efeito", tipoClasse: r.tipoClasse,
    });
    if (animar) animar({ modo: "cd", nome: alvo.nome, foto: alvo.foto, nomeAlvo: origemAtual.nome, fotoAlvo: origemAtual.foto, dado, bonus: dados.bonus, total: r.total, cd: dados.cd, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Resistiu" : "Sofreu efeito" });
    if (efeito.categoria === "Dano" && extra.dano > 0) aplicarDano(alvo.id, extra.dano);
    if (efeito.categoria === "Aflição" && !r.sucesso && atualizarCampo) {
      const nivel = Math.min(Math.abs(r.graus), 3);
      const condNome = nivel === 1 ? efeito.grau1 : nivel === 2 ? efeito.grau2 : nivel === 3 ? efeito.grau3 : null;
      if (condNome) {
        const nome = normalizarCondicao(condNome);
        const atuais = { ...(alvo.condicoes || {}) };
        atuais[nome] = (atuais[nome] || 0) + 1;
        atualizarCampo(alvo.id, "condicoes", atuais);
      }
    }
    return { r, ...extra };
  };

  const rolarEfeito = (efeito, alvoParam, keyOverride) => {
    const alvo = alvoParam || oponente;
    const key = keyOverride || (isArea ? `${alvo.id}:${efeito.id}` : efeito.id);
    const res = rolarEfeitoGenerico(efeito, alvo);
    setEfeitosR((s) => ({ ...s, [key]: res }));
  };

  /* ----- Multiataque: ataque extra com penalidade fixa no teste de ataque —
     -10 se for repetido no mesmo alvo do ataque principal, -5 se for em outro alvo engajado ----- */
  const temMultiataque = ehAtaque && !isArea && !!contexto.ataque?.extras?.multiataque && !contexto.ataque?.extras?.dividido;
  const [multiAtaques, setMultiAtaques] = useState([]);
  const [multiAlvoEscolha, setMultiAlvoEscolha] = useState("");
  const alvosEngajados = entidades.filter((e2) => e2.id !== origemAtual.id && e2.oponente);
  const efeitosDoAtaque = (contexto.ataque?.efeitos || []).filter((ef) => ef.categoria !== "Outros");

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
    const defVal = (10 + statDefesa(alvoMA, info.defKey));
    const r = montarTeste(dado, bonusFinal, defVal, limiarCritico(origemAtual, contexto.ataque?.id));
    setMultiAtaques((s) => [...s, { id: idMA, alvo: alvoMA, penalidade, r, efeitosR: {} }]);
    registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} usa Multiataque (${penalidade}${mesmoAlvo ? ", mesmo alvo" : ", outro alvo"}) com "${contexto.ataque.nome}" em ${alvoMA.nome}`,
      detalhe: `d20(${dado}) ${fmtBonus(bonusFinal)} = ${r.total} vs ${info.defLabel} ${defVal}`,
      total: r.sucesso ? "Acertou" : "Errou", tipoClasse: r.tipoClasse,
    });
    if (animar) animar({ modo: "cd", nome: `${origemAtual.nome} (Multiataque)`, foto: origemAtual.foto, nomeAlvo: alvoMA.nome, fotoAlvo: alvoMA.foto, dado, bonus: bonusFinal, total: r.total, cd: defVal, sucesso: r.sucesso, ehCrit: r.ehCrit, grauTexto: r.sucesso ? "Acertou!" : "Errou" });
    setMultiAlvoEscolha("");
  };

  const rolarEfeitoMulti = (maId, efeito) => {
    const ma = multiAtaques.find((m) => m.id === maId);
    if (!ma) return;
    const res = rolarEfeitoGenerico(efeito, ma.alvo);
    setMultiAtaques((s) => s.map((m) => (m.id === maId ? { ...m, efeitosR: { ...m.efeitosR, [efeito.id]: res } } : m)));
  };

  /* ----- Dividido: reparte a graduação de um efeito resistível entre dois alvos ----- */
  const temDividido = ehAtaque && !isArea && !!contexto.ataque?.extras?.dividido;
  const [usarDividido, setUsarDividido] = useState(false);
  const [dividAlvo2Id, setDividAlvo2Id] = useState("");
  const [dividGrad, setDividGrad] = useState({});
  const efeitosResistiveisDividido = efeitosDoAtaque.filter((ef) => ef.categoria !== "Nulificar" && ef.categoria !== "Cura");
  const alvo2Dividido = entidades.find((e2) => e2.id === dividAlvo2Id);

  const montarEfeitoCard = (efeito, res) => {
    if (!res) return null;
    if (efeito.categoria === "Dano") return { classe: res.dano === 0 ? "ok" : "dano", titulo: res.dano === 0 ? "Sem dano" : "Dano sofrido (já descontado da Vida)", valor: res.dano, formula: res.arremesso ? `Arremessado ${res.arremesso}m em direção oposta ao atacante` : undefined };
    if (efeito.categoria === "Cura") return { classe: res.cura > 0 ? "ok" : "dano", titulo: res.cura > 0 ? "Vida curada (já somada à Vida)" : "Sem efeito", valor: res.cura };
    if (efeito.categoria === "Nulificar") return { classe: res.r.sucesso ? "dano" : "ok", titulo: res.texto };
    if (efeito.categoria === "Aflição") return { classe: res.r.sucesso ? "ok" : "dano", titulo: res.texto };
    if (efeito.categoria === "Enfraquecer") return { classe: res.perda > 0 ? "dano" : "ok", titulo: res.perda > 0 ? `-${res.perda} em ${efeito.caracteristica || "característica"}` : "Sem efeito" };
    if (efeito.categoria === "Camuflagem") return { classe: res.sentidos.length ? "dano" : "ok", titulo: res.sentidos.length ? `Perde: ${res.sentidos.filter(Boolean).join(", ")}` : "Sem efeito" };
    return null;
  };

  /* ----- agarrar rápido (checkbox em ataques corpo-a-corpo) ----- */
  const podeAgarrarRapido = ehAtaque && !isArea && contexto.ataque?.tipoAcerto === "corpo" && temVantagem(origemAtual, "Agarrar Rápido");
  const efeitosPendentesAgarrar = (contexto.ataque?.efeitos || []).filter((ef) => ef.categoria !== "Outros");
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
  const custoAplicadoRef = useRef(false);
  useEffect(() => {
    if (!ehAtaque || custoAplicadoRef.current || !atualizarCampo) return;
    if (custoVida <= 0 && custoNen <= 0) return;
    custoAplicadoRef.current = true;
    if (custoVida > 0) atualizarCampo(origemAtual.id, "pvAtual", (origemAtual.pvAtual || 0) - custoVida);
    if (custoNen > 0) atualizarCampo(origemAtual.id, "nenAtual", (origemAtual.nenAtual || 0) - custoNen);
    registrar({
      tipo: "rolagem",
      desc: `${origemAtual.nome} paga o custo de "${contexto.ataque.nome}"`,
      detalhe: `${custoVida > 0 ? `-${custoVida} Vida` : ""}${custoVida > 0 && custoNen > 0 ? " · " : ""}${custoNen > 0 ? `-${custoNen} Nen` : ""}`,
      total: "Custo pago", tipoClasse: "hw",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
      <div className="modal-box">
        <div className="modal-head"><span className="mt">{contexto.label}</span><button className="modal-close" onClick={fechar}>×</button></div>
        {ehAtaque && contexto.ataque?.textoFormatado && (
          <div className="rich-display" style={{ marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: contexto.ataque.textoFormatado }} />
        )}

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
                {(contexto.ataque.efeitos || []).map((efeito) => {
                  const key = `${alvo.id}:${efeito.id}`;
                  const res = efeitosR[key];
                  return (
                    <div key={efeito.id} style={{ marginBottom: 10 }}>
                      <div className="acao-tipo" style={{ marginBottom: 4 }}>{efeito.categoria}</div>
                      {efeito.categoria === "Outros" ? (
                        <div className="efeito-card ok"><div className="efeito-f">{efeito.texto || "(sem descrição)"}</div></div>
                      ) : (
                        <>
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
            <select value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setAtaqueAcertoR(null); setEfeitosR({}); setMultiAtaques([]); setMultiAlvoEscolha(""); setUsarDividido(false); setDividAlvo2Id(""); setDividGrad({}); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {entidades.filter((e) => e.id !== origemAtual.id && e.oponente).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>

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

                {(!temDividido || !usarDividido) && (ataqueAcertoR === "auto" || (ataqueAcertoR && ataqueAcertoR.sucesso)) && (contexto.ataque.efeitos || []).map((efeito) => {
                  const res = efeitosR[efeito.id];
                  return (
                    <div className="subcard" key={efeito.id}>
                      <div className="section-title">{efeito.categoria}</div>
                      {efeito.categoria === "Outros" ? (
                        <div className="efeito-card ok"><div className="efeito-f">{efeito.texto || "(sem descrição)"}</div></div>
                      ) : (
                        <>
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
                    <select value={dividAlvo2Id} onChange={(e) => { setDividAlvo2Id(e.target.value); setDividGrad({}); }} style={{ marginBottom: 10 }}>
                      <option value="">Selecione…</option>
                      {alvosEngajados.filter((e2) => e2.id !== oponente.id).map((e2) => <option key={e2.id} value={e2.id}>{e2.nome}</option>)}
                    </select>

                    {!dividAlvo2Id && <div className="field-note">Escolha um segundo alvo, diferente de {oponente.nome}, entre os oponentes engajados no combate. Não é permitido dividir o efeito duas vezes no mesmo alvo.</div>}

                    {alvo2Dividido && efeitosResistiveisDividido.map((efeito) => {
                      const total = efeito.graduacao || 0;
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
                            <button className="btn btn-ghost btn-block" style={{ marginBottom: 6 }}
                              onClick={() => rolarEfeito({ ...efeito, graduacao: g1 }, oponente, `div1:${efeito.id}`)}>
                              ⚄ Rolar para {oponente.nome} (graduação {g1})
                            </button>
                          ) : <div style={{ marginBottom: 6 }}><ResultadoCard r={res1.r} efeito={montarEfeitoCard(efeito, res1)} /></div>}
                          {!res2 ? (
                            <button className="btn btn-ghost btn-block"
                              onClick={() => rolarEfeito({ ...efeito, graduacao: g2 }, alvo2Dividido, `div2:${efeito.id}`)}>
                              ⚄ Rolar para {alvo2Dividido.nome} (graduação {g2})
                            </button>
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
                        <select value={multiAlvoEscolha} onChange={(e) => setMultiAlvoEscolha(e.target.value)} style={{ marginBottom: 10 }}>
                          <option value="">Selecione…</option>
                          {alvosEngajados.map((e2) => <option key={e2.id} value={e2.id}>{e2.nome}{e2.id === oponente.id ? " (mesmo alvo)" : ""}</option>)}
                        </select>
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
            <select value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setStatOponente(""); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {entidades.filter((e) => e.id !== origemAtual.id && e.oponente).map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
            {oponente && (
              <>
                <label className="label">Perícia ou defesa do oponente</label>
                <select value={statOponente} onChange={(e) => setStatOponente(e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="">Selecione…</option>
                  <optgroup label="Defesas">{DEFESAS_OPCOES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}</optgroup>
                  <optgroup label="Perícias">{PERICIAS.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}</optgroup>
                </select>
                <button className="btn btn-accent btn-block" disabled={!statOponente}
                  onClick={() => { rolarSimples(computeBonusBase(origemAtual, contexto.tipo, contexto.chave) + bonusCondicionalTotal + bonusDescansoValor, valorAlvoComoCD(oponente, statOponente), oponente); consumirBonusDescanso(); }}>⚄ Rolar d20</button>
              </>
            )}
          </>
        )}

        {!ehAtaque && resultado && <div style={{ marginTop: 10 }}><ResultadoCard r={resultado} /><BotaoSorte /></div>}
      </div>
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
function AcaoModal({ ctx, entidades, onFechar, registrar, animar, atualizarCampo }) {
  const { origem, acao } = ctx;
  const origemAtual = entidades.find((e) => e.id === origem.id) || origem;
  const outros = entidades.filter((e) => e.id !== origemAtual.id);
  const oponentesDisponiveis = outros.filter((e) => e.oponente);

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
  const aliado = entidades.find((e) => e.id === aliadoId);
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

  /* ----- oposto: agarrar / derrubar ----- */
  const rolarAtaqueOposto = () => {
    if (!oponente) return;
    const ajudaBonus = consumirAjuda(origemAtual, "ataque");
    const bonus = bonusAtaque(origemAtual, acao.penalidade || 0, ajudaBonus);
    const dado = rolarD20();
    const cdDef = (10 + statDefesa(oponente, "aparar"));
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta ${acao.nome} em ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Aparar ${cdDef}`, total: res.sucesso ? "Acertou" : "Errou", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdDef, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Acertou!" : "Errou" });
  };
  const rolarOpostoContestado = () => {
    if (!oponente) return;
    const bAt = melhorDe(origemAtual, acao.periciaOposta) + bonusDescansoAcaoValor, bDef = melhorDe(oponente, acao.periciaOposta);
    const dAt = rolarD20(), dDef = rolarD20();
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
    registrar({ tipo: "rolagem", desc: `Teste oposto (${acao.periciaOposta.join("/")}): ${origemAtual.nome} vs ${oponente.nome}`, detalhe: `${totalAt} (d20 ${dAt}${fmtBonus(bAt)}) vs ${totalDef} (d20 ${dDef}${fmtBonus(bDef)})`, total: resultadoTxt, tipoClasse: vitoria ? "hs" : "hw" });
    if (animar) animar({ modo: "oposta", nomeA: origemAtual.nome, fotoA: origemAtual.foto, dadoA: dAt, bonusA: bAt, totalA: totalAt, nomeB: oponente.nome, fotoB: oponente.foto, dadoB: dDef, bonusB: bDef, totalB: totalDef, vencedor: vitoria ? "A" : (totalAt === totalDef ? "empate" : "B") });
    consumirBonusDescansoAcao();
  };

  /* ----- desarmar ----- */
  const rolarAtaqueDesarmar = () => {
    if (!oponente) return;
    const ajudaBonus = consumirAjuda(origemAtual, "ataque");
    const bonus = bonusAtaque(origemAtual, acao.penalidade || 0, ajudaBonus);
    const dado = rolarD20();
    const cdDef = (10 + statDefesa(oponente, "aparar"));
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Desarmar ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Aparar ${cdDef}`, total: res.sucesso ? "Acertou" : "Errou", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdDef, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Acertou!" : "Errou" });
  };
  const rolarSalvamentoForca = () => {
    const dado = rolarD20(), bonus = attr(oponente, "forca") + calcModCondicoes(oponente).testesGerais;
    const res = montarTeste(dado, bonus, Number(cd) || 15);
    setR2(res);
    registrar({ tipo: "rolagem", desc: `${oponente.nome} resiste ao Desarmar`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD ${cd}`, total: res.sucesso ? "Manteve o item" : "Soltou o item", tipoClasse: res.tipoClasse });
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
    const cdDef = (10 + statDefesa(oponente, "aparar"));
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Quebrar "${itemAlvo.nome}" de ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Defesa ${cdDef}`, total: res.sucesso ? "Acertou o item" : "Errou", tipoClasse: res.tipoClasse });
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
      const max = itemAlvo.pvItemMax || 0;
      const atualPv = itemAlvo.pvItemAtual ?? max;
      const novoPv = Math.max(0, atualPv - dano);
      const novosAtaques = (oponente.ataques || []).map((a) => a.id === itemAlvo.id ? { ...a, pvItemAtual: novoPv } : a);
      atualizarCampo(oponente.id, "ataques", novosAtaques);
      registrar({ tipo: "rolagem", desc: `Dano em "${itemAlvo.nome}" (${oponente.nome})`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Resistência ${cdItem}`, total: novoPv <= 0 ? `-${dano} PV — QUEBRADO` : `-${dano} PV (${novoPv}/${max})`, tipoClasse: novoPv <= 0 ? "hs" : "hw" });
      if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: `${itemAlvo.nome} (${oponente.nome})`, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdItem, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: novoPv <= 0 ? "Item quebrado!" : `-${dano} PV do item` });
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
    const bonus = bonusBase + ajudaBonus + bonusDescansoAcaoValor;
    const dado = rolarD20();
    const res = montarTeste(dado, bonus, Number(cd) || 10);
    setR1(res);
    if (acao.id === "escapar" && res.sucesso) {
      const atuais = { ...(origemAtual.condicoes || {}) };
      let mudou = false;
      if (atuais["Agarrado"]) { delete atuais["Agarrado"]; mudou = true; }
      if (atuais["Amarrado"]) { delete atuais["Amarrado"]; mudou = true; }
      if (mudou) atualizarCampo(origemAtual.id, "condicoes", atuais);
    }
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} testa ${acao.nome} (${periciaUsada === "inteligencia" ? "Inteligência" : periciaUsada})`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD ${cd}`, total: acao.id === "escapar" ? (res.sucesso ? "Escapou! Condição removida" : "Continua preso") : res.grauTexto, tipoClasse: res.tipoClasse });
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
    const bonus = bonusBase + ajudaBonus + bonusDescansoAcaoValor;
    const dado = rolarD20();
    const res = montarTeste(dado, bonus, cdLevantamento);
    setR1(res);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Levantamento (até ${pesoAlvoLevantamento}kg)`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD ${cdLevantamento}`, total: res.grauTexto, tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} testa Levantamento`, foto: origemAtual.foto, dado, bonus, total: res.total, cd: cdLevantamento, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.grauTexto });
    consumirBonusDescansoAcao();
  };

  /* ----- fugir de vista ----- */
  const rolarFuga = () => {
    const bonusBase = bonusPericia(origemAtual, "Furtividade");
    const ajudaBonus = consumirAjuda(origemAtual, "Furtividade");
    const bonus = bonusBase + ajudaBonus + bonusDescansoAcaoValor;
    const dado = rolarD20();
    const total = dado + bonus;
    const selecionados = outros.filter((o) => oponentesMulti[o.id]);
    const resultados = selecionados.map((o) => { const cdP = valorAlvoComoCD(o, "Percepção"); return { id: o.id, nome: o.nome, cd: cdP, sucesso: total >= cdP }; });
    setMultiResultados({ dado, bonus, total, resultados });
    const passouTudo = resultados.length > 0 && resultados.every((r) => r.sucesso);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Fugir de Vista de ${resultados.length || "nenhum"} oponente(s)`, detalhe: `Furtividade d20(${dado}) ${fmtBonus(bonus)} = ${total}`, total: resultados.length === 0 ? "Sem alvos selecionados" : passouTudo ? "Ficou furtivo" : "Foi percebido", tipoClasse: resultados.length && passouTudo ? "hs" : "hw" });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} tenta Fugir de Vista`, foto: origemAtual.foto, dado, bonus, total, rotulo: resultados.length === 0 ? "Sem alvos selecionados" : passouTudo ? "Ficou furtivo!" : "Foi percebido" });
    consumirBonusDescansoAcao();
  };

  /* ----- ajudar ----- */
  const rolarAjuda = () => {
    if (!aliado || !chaveAjuda) return;
    const infoChave = AJUDA_CHAVES.find((c) => c.v === chaveAjuda);
    const bonus = (infoChave.tipo === "ataque" ? Math.max(attr(origemAtual, "luta"), attr(origemAtual, "destreza")) : computeBonusBase(origemAtual, infoChave.tipo, chaveAjuda)) + bonusDescansoAcaoValor;
    const dado = rolarD20();
    const res = montarTeste(dado, bonus, 10);
    setR1(res);
    if (res.sucesso) {
      const grau = Math.max(1, res.graus);
      const buff = { id: uid(), chave: chaveAjuda, bonus: grau * 2, deNome: origemAtual.nome };
      atualizarCampo(aliado.id, "buffsAjuda", [...(aliado.buffsAjuda || []), buff]);
    }
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} ajuda ${aliado.nome} em ${infoChave.l}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD 10`, total: res.sucesso ? `+${Math.max(1, res.graus) * 2} para ${aliado.nome}` : "Não ajudou", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "simples", nome: `${origemAtual.nome} ajuda ${aliado.nome}`, foto: origemAtual.foto, dado, bonus, total: res.total, cd: 10, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? `+${Math.max(1, res.graus) * 2} para ${aliado.nome}` : "Não ajudou" });
    consumirBonusDescansoAcao();
  };

  /* ----- defender-se / mirar (toggles) ----- */
  const toggleDefender = () => atualizarCampo(origemAtual.id, "defendendo", !origemAtual.defendendo);
  const toggleMirar = () => atualizarCampo(origemAtual.id, "mirando", !origemAtual.mirando);

  /* ----- manobras: desmoralizar / fintar ----- */
  const rolarOposicaoCondicao = () => {
    if (!oponente) return;
    const bAt = (fintaAgilAtiva ? melhorDe(origemAtual, [acao.pericia, "Acrobacia"]) : bonusPericia(origemAtual, acao.pericia)) + bonusDescansoAcaoValor;
    const bDef = Math.max(bonusPericia(oponente, acao.pericia), statDefesa(oponente, "vontade"));
    const dAt = rolarD20(), dDef = rolarD20();
    const totalAt = dAt + bAt, totalDef = dDef + bDef;
    const vitoria = totalAt > totalDef;
    setR2({ dAt, bAt, totalAt, dDef, bDef, totalDef, vitoria });
    if (vitoria) {
      const atuais = { ...(oponente.condicoes || {}) };
      atuais[acao.condicao] = (atuais[acao.condicao] || 0) + 1;
      atualizarCampo(oponente.id, "condicoes", atuais);
    }
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} usa ${acao.nome} em ${oponente.nome}${fintaAgilAtiva ? " (Finta Ágil: Acrobacia/Enganação)" : ""}`, detalhe: `${totalAt} (d20 ${dAt}${fmtBonus(bAt)}) vs ${totalDef} (d20 ${dDef}${fmtBonus(bDef)})`, total: vitoria ? `${oponente.nome} fica ${acao.condicao}` : "Sem efeito", tipoClasse: vitoria ? "hs" : "hw" });
    if (animar) animar({ modo: "oposta", nomeA: origemAtual.nome, fotoA: origemAtual.foto, dadoA: dAt, bonusA: bAt, totalA: totalAt, nomeB: oponente.nome, fotoB: oponente.foto, dadoB: dDef, bonusB: bDef, totalB: totalDef, vencedor: vitoria ? "A" : (totalAt === totalDef ? "empate" : "B") });
    consumirBonusDescansoAcao();
  };

  /* ----- manobra: encontrão ----- */
  const rolarEncontrao = () => {
    if (!oponente) return;
    const ajudaBonus = consumirAjuda(origemAtual, "ataque");
    const bonus = bonusAtaque(origemAtual, 0, ajudaBonus) + (Number(graduacoesMovidas) || 0);
    const dado = rolarD20();
    const cdDef = (10 + statDefesa(oponente, "aparar"));
    const res = montarTeste(dado, bonus, cdDef);
    setR1(res);
    limparMira(origemAtual);
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} tenta Encontrão em ${oponente.nome}`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs Aparar ${cdDef}`, total: res.sucesso ? "Acertou" : "Errou (alvo pode reagir com Agarrar, Derrubar ou Desarmar)", tipoClasse: res.tipoClasse });
    if (animar) animar({ modo: "cd", nome: origemAtual.nome, foto: origemAtual.foto, nomeAlvo: oponente.nome, fotoAlvo: oponente.foto, dado, bonus, total: res.total, cd: cdDef, sucesso: res.sucesso, ehCrit: res.ehCrit, grauTexto: res.sucesso ? "Acertou!" : "Errou" });
  };

  /* ----- manobra: lubridiar (toggle) ----- */
  const toggleLubridiar = () => atualizarCampo(origemAtual.id, "lubridiando", !origemAtual.lubridiando);

  /* ----- manobra: planejar (criação do plano) ----- */
  const rolarPlano = () => {
    const bonus = bonusPericia(origemAtual, "Investigação") + bonusDescansoAcaoValor;
    const dado = rolarD20();
    const res = montarTeste(dado, bonus, 10);
    setR1(res);
    if (res.sucesso) atualizarCampo(origemAtual.id, "plano", { acoes: Math.max(1, res.graus) });
    registrar({ tipo: "rolagem", desc: `${origemAtual.nome} testa Planejar`, detalhe: `d20(${dado}) ${fmtBonus(bonus)} = ${res.total} vs CD 10`, total: res.sucesso ? `${Math.max(1, res.graus)} Ação(ões) de Planejamento` : "Sem plano", tipoClasse: res.tipoClasse });
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
      entrada = { id: uid(), tipo: "cuidado", chave: defesaCuidado, valor: 2, deNome: origemAtual.nome, consumo: "turno" };
      desc = `${origemAtual.nome} usa Cuidado em ${alvo.nome} (+2 ${defesaCuidado === "esquiva" ? "Esquiva" : "Aparar"})`;
    } else if (acao.subtipo === "nossoAlvo") {
      alvo = oponente;
      if (!alvo) return;
      entrada = { id: uid(), tipo: "nossoAlvo", valor: 2, deNome: origemAtual.nome, consumo: "ataque" };
      desc = `${origemAtual.nome} designa ${alvo.nome} como Nosso Alvo (+2 pro próximo aliado que atacá-lo)`;
    } else if (acao.subtipo === "reposicionar") {
      alvo = aliado;
      if (!alvo) return;
      desc = `${origemAtual.nome} usa Reposicionar: ${alvo.nome} pode usar uma ação de movimento fora do turno`;
    }
    if (entrada && alvo) atualizarCampo(alvo.id, "efeitosManobra", [...(alvo.efeitosManobra || []), entrada]);
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
            <select value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setR1(null); setR2(null); setR3(null); setItemAlvoId(""); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>

            {acao.resolvedor === "ataqueObjeto" && oponente && (
              <>
                <label className="label">Equipamento do alvo</label>
                <select value={itemAlvoId} onChange={(e) => { setItemAlvoId(e.target.value); setR1(null); setR3(null); }} style={{ marginBottom: 12 }}>
                  <option value="">Selecione…</option>
                  {equipamentosAlvo.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome || "(sem nome)"}{(a.pvItemMax || 0) > 0 ? ` — PV ${a.pvItemAtual ?? a.pvItemMax}/${a.pvItemMax}${itemQuebrado(a) ? " (quebrado)" : ""}` : ""}
                    </option>
                  ))}
                </select>
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
              <select value={periciaEscolhida} onChange={(e) => setPericiaEscolhida(e.target.value)} style={{ marginBottom: 12 }}>
                {acao.periciaEscolha.map((p) => <option key={p} value={p}>{p}</option>)}
              </select></>
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
            <select value={aliadoId} onChange={(e) => setAliadoId(e.target.value)} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {outros.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
            {aliado && (
              <>
                <label className="label">Teste que deseja ajudar</label>
                <select value={chaveAjuda} onChange={(e) => setChaveAjuda(e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="">Selecione…</option>
                  {AJUDA_CHAVES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                </select>
                {chaveAjuda && !r1 && <button className="btn btn-accent btn-block" onClick={rolarAjuda}>⚄ Rolar (CD 10)</button>}
                {r1 && <div className="subcard"><ResultadoCard r={r1} efeito={r1.sucesso ? { classe: "ok", titulo: `+${Math.max(1, r1.graus) * 2} concedido a ${aliado.nome}` } : { classe: "dano", titulo: "Não conseguiu ajudar" }} /></div>}
              </>
            )}
          </>
        )}

        {acao.resolvedor === "oposicaoCondicao" && (
          <>
            <label className="label">Alvo</label>
            <select value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setR2(null); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
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
            <select value={oponenteId} onChange={(e) => { setOponenteId(e.target.value); setR1(null); }} style={{ marginBottom: 12 }}>
              <option value="">Selecione…</option>
              {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
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
                    <select value={oponenteId} onChange={(e) => setOponenteId(e.target.value)} style={{ marginBottom: 12 }}>
                      <option value="">Selecione…</option>
                      {oponentesDisponiveis.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                  </>
                )}
                {(acao.subtipo === "cuidado" || acao.subtipo === "reposicionar") && (
                  <>
                    <label className="label">Aliado</label>
                    <select value={aliadoId} onChange={(e) => setAliadoId(e.target.value)} style={{ marginBottom: 12 }}>
                      <option value="">Selecione…</option>
                      {outros.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                  </>
                )}
                {acao.subtipo === "cuidado" && (
                  <>
                    <label className="label">Defesa</label>
                    <select value={defesaCuidado} onChange={(e) => setDefesaCuidado(e.target.value)} style={{ marginBottom: 12 }}>
                      <option value="esquiva">Esquiva</option>
                      <option value="aparar">Aparar</option>
                    </select>
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
  const [historico, setHistorico] = useState([]);
  const [iniciativa, setIniciativa] = useState(INICIATIVA_VAZIA);
  const [modalCtx, setModalCtx] = useState(null);
  const [acaoCtx, setAcaoCtx] = useState(null);
  const [abaDireita, setAbaDireita] = useState("iniciativa");
  const [eventosAnim, setEventosAnim] = useState([]);
  const animSeenRef = useRef(new Set());

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
      setCarregando(false);
    })();
  }, [usuario, authCarregando]);

  /* listeners em tempo real: qualquer mudança feita por outro jogador chega
     na hora, sem precisar dar refresh nem esperar um polling */
  useEffect(() => {
    if (!identidade) return;
    migrarDadosAntigos();
    const unsubEnt = ouvirEntidades((lista) => setEntidades(Array.isArray(lista) ? lista : []));
    const unsubHist = ouvirHistorico((lista) => setHistorico(Array.isArray(lista) ? lista : []));
    const unsubIni = ouvirShared("iniciativa", (v) => setIniciativa(v && !Array.isArray(v) && v.ordem ? v : INICIATIVA_VAZIA));
    const unsubAnim = ouvirShared("animQueue", (fila) => {
      if (!Array.isArray(fila)) return;
      const agora = Date.now();
      const novos = fila.filter((ev) => ev && !animSeenRef.current.has(ev.id) && agora - (ev.ts || 0) < 15000);
      if (novos.length) {
        novos.forEach((ev) => animSeenRef.current.add(ev.id));
        setEventosAnim((atual) => [...atual, ...novos]);
      }
    });
    return () => { unsubEnt(); unsubHist(); unsubIni(); unsubAnim(); };
  }, [identidade]);

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
    const antigas = entidades;
    setEntidades(novaLista);
    const idsAntigos = new Set(antigas.map((e) => e.id));
    const idsNovos = new Set(novaLista.map((e) => e.id));
    const tarefas = [];
    for (const ent of novaLista) {
      const anterior = antigas.find((e) => e.id === ent.id);
      if (!anterior || JSON.stringify(anterior) !== JSON.stringify(ent)) tarefas.push(salvarEntidade(ent));
    }
    for (const id of idsAntigos) if (!idsNovos.has(id)) tarefas.push(removerEntidadeDoc(id));
    await Promise.all(tarefas);
  };
  const registrar = async (entry) => {
    await adicionarHistorico({ tipo: "sistema", ...entry, hora: horaAgora() });
  };
  const aplicarDano = async (entidadeId, dano) => {
    setEntidades((atual) => {
      const nova = atual.map((e) => (e.id === entidadeId ? { ...e, pvAtual: (e.pvAtual || 0) - dano } : e));
      const alvo = nova.find((e) => e.id === entidadeId);
      if (alvo) salvarEntidade(alvo);
      return nova;
    });
  };
  const atualizarCampo = async (id, campo, valor) => {
    setEntidades((atual) => {
      const nova = atual.map((e) => (e.id === id ? { ...e, [campo]: valor } : e));
      const alvo = nova.find((e) => e.id === id);
      if (alvo) salvarEntidade(alvo);
      return nova;
    });
  };
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
  const limparTurnoFlags = (entidadeId) => {
    atualizarCampo(entidadeId, "defendendo", false);
    setEntidades((atual) => {
      const nova = atual.map((e) => (e.id === entidadeId ? { ...e, efeitosManobra: (e.efeitosManobra || []).filter((m) => m.consumo !== "turno") } : e));
      const alvo = nova.find((e) => e.id === entidadeId);
      if (alvo) salvarEntidade(alvo);
      return nova;
    });
  };
  const avancarTurno = async () => {
    const ordem = iniciativa.ordem || [];
    if (ordem.length === 0) return;
    let prox = iniciativa.turnoAtual + 1, rodada = iniciativa.rodada;
    if (prox >= ordem.length) { prox = 0; rodada += 1; }
    await salvarIniciativa({ ...iniciativa, turnoAtual: prox, rodada });
    const alvo = ordem[prox];
    if (alvo) limparTurnoFlags(alvo.entidadeId);
  };
  const retrocederTurno = async () => {
    const ordem = iniciativa.ordem || [];
    if (ordem.length === 0) return;
    let prox = iniciativa.turnoAtual - 1, rodada = iniciativa.rodada;
    if (prox < 0) { prox = ordem.length - 1; rodada = Math.max(1, rodada - 1); }
    await salvarIniciativa({ ...iniciativa, turnoAtual: prox, rodada });
  };
  const zerarIniciativa = async () => salvarIniciativa(INICIATIVA_VAZIA);

  if (authCarregando || carregando) return <div className="mm3"><GlobalStyle /><div className="wrap"><div className="empty">Carregando mesa…</div></div></div>;
  if (!usuario) return <div className="mm3"><GlobalStyle /><TelaLogin onCadastrar={cadastrar} onEntrar={entrar} /></div>;
  if (!identidade) return <div className="mm3"><GlobalStyle /><TelaIdentidade onEscolher={escolherIdentidade} /></div>;

  return (
    <div className="mm3">
      <GlobalStyle />
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
            <FichasTab entidades={entidades} salvar={salvarEntidades} identidade={identidade} registrar={registrar}
              onAbrirRolagem={setModalCtx} onAbrirAcao={setAcaoCtx} atualizarCampo={atualizarCampo} onRolarIniciativa={rolarIniciativa} />
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
      {modalCtx && <RollModal contexto={modalCtx} entidades={entidades} onFechar={() => setModalCtx(null)} registrar={registrar} animar={dispararAnimacao} aplicarDano={aplicarDano} atualizarCampo={atualizarCampo} />}
      {acaoCtx && <AcaoModal ctx={acaoCtx} entidades={entidades} onFechar={() => setAcaoCtx(null)} registrar={registrar} animar={dispararAnimacao} atualizarCampo={atualizarCampo} />}
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
function EfeitoForm({ efeito, onMudar, onRemover }) {
  const upd = (campo, valor) => onMudar({ ...efeito, [campo]: valor });
  const mudarCategoria = (cat) => onMudar({ id: efeito.id, ...efeitoPadrao(cat) });
  const addSentido = () => upd("sentidos", [...(efeito.sentidos || []), ""]);
  const updSentido = (i, v) => { const arr = [...efeito.sentidos]; arr[i] = v; upd("sentidos", arr); };
  const rmSentido = (i) => upd("sentidos", efeito.sentidos.filter((_, idx) => idx !== i));

  return (
    <div className="subcard2">
      <div className="row-inline">
        <select value={efeito.categoria} onChange={(e) => mudarCategoria(e.target.value)}>{EFEITO_CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <button className="small-btn" onClick={onRemover}>×</button>
      </div>

      {efeito.categoria === "Dano" && (
        <>
          <label className="label">Graduação de Dano</label>
          <input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} />
          <div className="field-note">CD: 15 + graduação. Se a graduação for maior que o nível do personagem, o dano por grau de falha fica limitado ao nível — mas o CD continua contando a graduação cheia (o excedente vira CD, não dano).</div>
        </>
      )}
      {efeito.categoria === "Cura" && (
        <>
          <label className="label">Graduação de Cura</label>
          <input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} />
          <div className="field-note">Ao usar, faz um teste de Cura (d20 + graduação) vs CD 10 fixo. Sucesso cura a graduação em PV no alvo (dobro por 2 graus de sucesso, triplo por 3, e assim vai) — já soma direto na Vida do alvo.</div>
        </>
      )}
      {efeito.categoria === "Aflição" && (
        <>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div><label className="label">Salvamento</label><select value={efeito.salvamento} onChange={(e) => upd("salvamento", e.target.value)}>{SALVAMENTOS_ESCOLHA.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="label">Graduação</label><input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} /></div>
          </div>
          <label className="checkbox-row"><input type="checkbox" checked={!!efeito.condicaoExtra} onChange={(e) => upd("condicaoExtra", e.target.checked)} />Condição extra</label>
          <label className="label">Falha (um grau)</label>
          <div className={efeito.condicaoExtra ? "grid2" : ""} style={{ marginBottom: 8 }}>
            <select value={efeito.grau1} onChange={(e) => upd("grau1", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G1.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            {efeito.condicaoExtra && <select value={efeito.grau1b} onChange={(e) => upd("grau1b", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G1.map((a) => <option key={a} value={a}>{a}</option>)}</select>}
          </div>
          <label className="label">Falha (dois graus)</label>
          <div className={efeito.condicaoExtra ? "grid2" : ""} style={{ marginBottom: 8 }}>
            <select value={efeito.grau2} onChange={(e) => upd("grau2", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G2.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            {efeito.condicaoExtra && <select value={efeito.grau2b} onChange={(e) => upd("grau2b", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G2.map((a) => <option key={a} value={a}>{a}</option>)}</select>}
          </div>
          <label className="label">Falha (três graus)</label>
          <div className={efeito.condicaoExtra ? "grid2" : ""}>
            <select value={efeito.grau3} onChange={(e) => upd("grau3", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G3.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            {efeito.condicaoExtra && <select value={efeito.grau3b} onChange={(e) => upd("grau3b", e.target.value)}><option value="">Selecione…</option>{AFLICOES_G3.map((a) => <option key={a} value={a}>{a}</option>)}</select>}
          </div>
        </>
      )}
      {efeito.categoria === "Enfraquecer" && (
        <>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div><label className="label">Salvamento</label><select value={efeito.salvamento} onChange={(e) => upd("salvamento", e.target.value)}>{SALVAMENTOS_ESCOLHA.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="label">Graduação</label><input type="number" value={efeito.graduacao} onChange={(e) => upd("graduacao", Number(e.target.value))} /></div>
          </div>
          <label className="label">Característica afetada</label>
          <input type="text" value={efeito.caracteristica} onChange={(e) => upd("caracteristica", e.target.value)} />
        </>
      )}
      {efeito.categoria === "Camuflagem" && (
        <>
          <div className="grid2" style={{ marginBottom: 8 }}>
            <div><label className="label">Salvamento</label><select value={efeito.salvamento} onChange={(e) => upd("salvamento", e.target.value)}>{SALVAMENTOS_ESCOLHA.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
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
          <div className="field-note">CD: 10 + Vontade do alvo</div>
          <label className="label">Graduação de Nulificar</label>
          <input type="number" value={efeito.graduacaoNulificar} onChange={(e) => upd("graduacaoNulificar", Number(e.target.value))} />
        </>
      )}
      {efeito.categoria === "Outros" && (
        <>
          <div className="field-note">Sem rolagem — aplicado automaticamente ao usar a habilidade.</div>
          <label className="label">Descrição do efeito</label>
          <textarea className="outros-textarea" value={efeito.texto || ""} onChange={(e) => upd("texto", e.target.value)} placeholder="Descreva o que esse efeito faz…" rows={3} />
        </>
      )}
    </div>
  );
}

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
      <div ref={ref} className="rich-editor" contentEditable suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)} data-placeholder={placeholder || ""} />
    </div>
  );
}

/* ---------- habilidade (form) ---------- */
function PassivoEditor({ passivo, onMudar }) {
  const def = PODERES_PASSIVOS.find((p) => p.id === passivo?.tipoId);
  const upd = (campo, valor) => onMudar({ ...passivo, [campo]: valor });
  const updCampo = (chave, valor) => onMudar({ ...passivo, campos: { ...(passivo.campos || {}), [chave]: valor } });
  const toggleExtra = (chave) => onMudar({ ...passivo, extrasAtivos: { ...(passivo.extrasAtivos || {}), [chave]: !passivo.extrasAtivos?.[chave] } });
  const mudarTipo = (novoId) => onMudar({ tipoId: novoId, graduacao: 1, campos: {}, extrasAtivos: {}, ativo: passivo?.ativo || false });
  return (
    <div className="subcard2" style={{ marginBottom: 10 }}>
      <label className="label">Tipo de efeito passivo</label>
      <select value={passivo?.tipoId || ""} onChange={(e) => mudarTipo(e.target.value)} style={{ marginBottom: 8 }}>
        <option value="">Escolha um efeito…</option>
        {PODERES_PASSIVOS.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      {def && (
        <>
          <div className="field-note" style={{ marginBottom: 8 }}>{def.desc}</div>
          <div style={{ marginBottom: 8 }}><label className="label">Graduação</label><input type="number" min={0} value={passivo.graduacao || 0} onChange={(e) => upd("graduacao", Math.max(0, Number(e.target.value)))} /></div>
          {def.campoEscolha && !def.campoEscolha.multi && (
            <div style={{ marginBottom: 8 }}>
              <label className="label">{def.campoEscolha.label}</label>
              <select value={passivo.campos?.[def.campoEscolha.chave] || ""} onChange={(e) => updCampo(def.campoEscolha.chave, e.target.value)}>
                <option value="">Escolha…</option>
                {def.campoEscolha.opcoes.map((o) => <option key={o} value={o}>{def.campoEscolha.rotulos ? def.campoEscolha.rotulos.find((r) => r.k === o)?.l || o : o}</option>)}
              </select>
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
        </>
      )}
    </div>
  );
}

function AtaqueForm({ ataque, onMudar, onRemover }) {
  const [extrasAberto, setExtrasAberto] = useState(false);
  const upd = (campo, valor) => onMudar({ ...ataque, [campo]: valor });
  const updEfeito = (idx, novo) => { const arr = [...ataque.efeitos]; arr[idx] = novo; upd("efeitos", arr); };
  const addEfeito = () => upd("efeitos", [...ataque.efeitos, { id: uid(), ...efeitoPadrao("Dano") }]);
  const rmEfeito = (idx) => upd("efeitos", ataque.efeitos.filter((_, i) => i !== idx));
  const ehPassiva = ataque.tipo === "passiva";
  const alternarTipo = () => upd("tipo", ehPassiva ? "ativa" : "passiva");
  return (
    <div className="subcard">
      <div className="row-inline"><input type="text" placeholder="Nome da habilidade" value={ataque.nome} onChange={(e) => upd("nome", e.target.value)} /><button className="small-btn" onClick={onRemover}>×</button></div>
      {!ehPassiva && (
        <div style={{ marginBottom: 10 }}>
          <label className="label">Tipo de acerto</label>
          <select value={ataque.tipoAcerto} onChange={(e) => upd("tipoAcerto", e.target.value)}>{TIPOS_ACERTO.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>
        </div>
      )}
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div>
          <label className="label">{ataque.equipamento ? "Custo (pontos de equipamento)" : "Custo (pontos de poder)"}</label>
          <input type="number" min={0} value={ataque.pp || 0} onChange={(e) => upd("pp", Math.max(0, Number(e.target.value)))} />
        </div>
        <label className="checkbox-row" style={{ alignSelf: "end", marginBottom: 11 }}>
          <input type="checkbox" checked={!!ataque.equipamento} onChange={(e) => upd("equipamento", e.target.checked)} disabled={ehPassiva} />
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
      {ataque.equipamento && (ataque.pvItemMax || 0) > 0 && (
        <div className="field-note" style={{ marginBottom: 10 }}>
          PV atual do item: {ataque.pvItemAtual ?? ataque.pvItemMax}/{ataque.pvItemMax}
          {itemQuebrado(ataque) && <b style={{ color: "var(--danger, #e05a5a)" }}> — QUEBRADO</b>}
          {" "}<button className="small-btn" style={{ marginLeft: 6 }} onClick={() => upd("pvItemAtual", ataque.pvItemMax)}>Restaurar PV</button>
        </div>
      )}
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

      <div className="row-inline" style={{ marginBottom: 10, alignItems: "center" }}>
        <button className="small-btn" onClick={alternarTipo}>{ehPassiva ? "Passiva ↺" : "Ativa ↺"}</button>
        <label className="checkbox-row" style={{ marginBottom: 0 }}>
          <input type="checkbox" checked={!!ataque.sustentado} onChange={(e) => upd("sustentado", e.target.checked)} />
          Sustentado
        </label>
      </div>

      {!ehPassiva && (
        <>
          <div className="acoes-header" onClick={() => setExtrasAberto((s) => !s)}>
            <div className="section-title" style={{ marginBottom: 0 }}>Extras</div>
            <span className={"arrow" + (extrasAberto ? " open" : "")}>▶</span>
          </div>
          {extrasAberto && (
            <div className="subcard2" style={{ marginBottom: 10 }}>
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

          <div className="section-title">Efeitos</div>
          {ataque.efeitos.map((ef, i) => <EfeitoForm key={ef.id} efeito={ef} onMudar={(novo) => updEfeito(i, novo)} onRemover={() => rmEfeito(i)} />)}
          <button className="btn btn-ghost btn-sm" onClick={addEfeito} style={{ marginBottom: 12 }}>+ Efeito</button>
        </>
      )}

      {ehPassiva && (
        <>
          <div className="section-title">Efeito passivo</div>
          <PassivoEditor passivo={ataque.passivo || { tipoId: "", graduacao: 1, campos: {}, extrasAtivos: {}, ativo: false }} onMudar={(novo) => upd("passivo", novo)} />
        </>
      )}

      <label className="label">Descrição / texto da habilidade</label>
      <RichTextEditor value={ataque.textoFormatado || ""} onChange={(html) => upd("textoFormatado", html)} placeholder="Descreva a habilidade…" />
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
    vantagens: [],
    complicacoes: { texto: "", pontos: 0 },
  };
}

function FichaForm({ inicial, rotulos, onSalvar, onCancelar, entidades, atualizarCampo, registrar }) {
  const [f, setF] = useState(() => {
    const base = fichaPadrao(rotulos);
    if (!inicial) return base;
    return { ...base, ...inicial, atributos: { ...ATRIBUTOS_VAZIOS, ...(inicial.atributos || {}) }, periciaPontos: { ...PERICIA_PONTOS_VAZIO, ...(inicial.periciaPontos || {}) }, vantagens: inicial.vantagens || [] };
  });
  const [erro, setErro] = useState("");
  const [complicOpen, setComplicOpen] = useState(false);

  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const maxAtr = atributoMax(f.nivel);
  const updAtributo = (k, v) => setF((s) => ({ ...s, atributos: { ...s.atributos, [k]: Math.max(-2, Math.min(atributoMax(s.nivel), v)) } }));
  const maxPer = periciaPontosMax(f.nivel);
  const updPericia = (nome, v) => setF((s) => ({ ...s, periciaPontos: { ...s.periciaPontos, [nome]: Math.max(0, Math.min(periciaPontosMax(s.nivel), v)) } }));

  const updAtaque = (idx, novo) => { const arr = [...f.ataques]; arr[idx] = novo; upd("ataques", arr); };
  const addAtaque = () => upd("ataques", [...f.ataques, { id: uid(), nome: "", tipo: "ativa", tipoAcerto: "corpo", custoVida: 0, custoNen: 0, extras: {}, efeitos: [{ id: uid(), ...efeitoPadrao("Dano") }], passivo: { tipoId: "", graduacao: 1, campos: {}, extrasAtivos: {}, ativo: false } }]);
  const rmAtaque = (idx) => upd("ataques", f.ataques.filter((_, i) => i !== idx));

  const updVantagem = (idx, campo, valor) => { const arr = [...f.vantagens]; arr[idx] = { ...arr[idx], [campo]: valor }; upd("vantagens", arr); };
  const mudarVantagemNome = (idx, novoNome) => {
    const info = VANTAGENS.find((v) => v.nome === novoNome);
    const n = info?.mecanica?.escolhePericias || 0;
    const max = info?.graduacaoMax || 5;
    const arr = [...f.vantagens];
    arr[idx] = { ...arr[idx], nome: novoNome, graduacoes: Math.min(arr[idx].graduacoes || 1, max), periciasEscolhidas: Array(n).fill(""), textoExtra: info?.mecanica?.pedeTexto ? "" : undefined, defesaEscolhida: info?.mecanica?.escolheDefesa ? "" : undefined };
    upd("vantagens", arr);
  };
  const addVantagem = () => upd("vantagens", [...(f.vantagens || []), { id: uid(), nome: VANTAGENS[0].nome, graduacoes: 1, ativo: false, periciasEscolhidas: [] }]);
  const rmVantagem = (idx) => upd("vantagens", f.vantagens.filter((_, i) => i !== idx));

  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await resizeImageFile(file);
    upd("foto", url);
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
    <div className="card">
      {erro && <div className="erro-box">{erro}</div>}

      <div className="foto-upload-row">
        {f.foto ? <img src={f.foto} alt="Foto da ficha" className="foto-preview" /> : <div className="foto-preview" />}
        <div>
          <input type="file" accept="image/*" onChange={handleFoto} style={{ marginBottom: 6 }} />
          {f.foto && <button className="btn btn-ghost btn-sm" onClick={() => upd("foto", null)}>Remover foto</button>}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}><label className="label">Nome</label><input type="text" value={f.nome} onChange={(e) => upd("nome", e.target.value)} /></div>
      <div className="grid3" style={{ marginBottom: 10 }}>
        <div><label className="label">Tipo</label><select value={f.rotulo} onChange={(e) => upd("rotulo", e.target.value)}>{rotulos.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
        <div><label className="label">Tipo de Nen</label><select value={f.tipoNen} onChange={(e) => upd("tipoNen", e.target.value)}>{NEN_TIPOS.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
        <div><label className="label">Nível</label><input type="number" min="1" value={f.nivel} onChange={(e) => upd("nivel", Math.max(1, Number(e.target.value)))} /></div>
      </div>

      <div className="divider" />
      <div className="section-title">Vida &amp; Nen</div>
      <div className="grid4" style={{ marginBottom: 6 }}>
        <div><label className="label">Vida Atual</label><input className="in-vida" type="number" value={f.pvAtual} onChange={(e) => upd("pvAtual", Number(e.target.value))} /></div>
        <div><label className="label">Vida Máx.</label><input className="in-vida" type="number" value={pvMax} disabled /></div>
        <div><label className="label">Nen Atual</label><input className="in-nen" type="number" value={f.nenAtual} onChange={(e) => upd("nenAtual", Number(e.target.value))} /></div>
        <div><label className="label">Nen Máx.</label><input className="in-nen" type="number" value={nenMax} disabled /></div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label className="label">Vida Temporária</label><input className="in-vida-temp" type="number" value={f.pvTemp} onChange={(e) => upd("pvTemp", Number(e.target.value))} />
      </div>

      <div className="divider" />
      <div className="section-title">Atributos (máx. {maxAtr}, mín. -2)</div>
      <div className="grid4" style={{ marginBottom: 10 }}>
        {ATRIBUTOS.map((a) => <div key={a.k}><label className="label">{a.l}</label><input type="number" min={-2} max={maxAtr} value={f.atributos[a.k]} onChange={(e) => updAtributo(a.k, Number(e.target.value))} /></div>)}
      </div>

      <div className="divider" />
      <div className="section-title">Bônus de Ataque</div>
      <div className="grid2" style={{ marginBottom: 10 }}>
        <div><label className="label">Ataque Corpo-a-corpo</label><input type="number" value={f.atributos.luta} disabled /></div>
        <div><label className="label">Ataque à Distância</label><input type="number" value={f.atributos.destreza} disabled /></div>
      </div>

      <div className="divider" />
      <div className="section-title">Defesas</div>
      <div className="readonly-grid">
        <div className="ro-row"><span>Aparar</span><b>{f.atributos.luta >= 0 ? "+" : ""}{f.atributos.luta}</b></div>
        <div className="ro-row"><span>Esquiva</span><b>{f.atributos.destreza >= 0 ? "+" : ""}{f.atributos.destreza}</b></div>
        <div className="ro-row"><span>Fortitude</span><b>{f.atributos.vigor >= 0 ? "+" : ""}{f.atributos.vigor}</b></div>
        <div className="ro-row"><span>Vontade</span><b>{f.atributos.prontidao >= 0 ? "+" : ""}{f.atributos.prontidao}</b></div>
        <div className="ro-row"><span>Resistência</span><b>{f.atributos.vigor >= 0 ? "+" : ""}{f.atributos.vigor}</b></div>
        <div className="ro-row"><span>Deslocamento</span><b>{desloc}</b></div>
      </div>

      <div className="divider" />
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

      <div className="divider" />
      <div className="section-title">Vantagens</div>
      {(f.vantagens || []).map((v, i) => {
        const info = VANTAGENS.find((x) => x.nome === v.nome);
        const max = info?.graduacaoMax || 5;
        return (
          <div key={v.id}>
            <div className="vantagem-row">
              <select value={v.nome} onChange={(e) => mudarVantagemNome(i, e.target.value)}>{VANTAGENS.map((opt) => <option key={opt.nome} value={opt.nome}>{opt.nome}</option>)}</select>
              {max > 1 && <input type="number" min={1} max={max} value={v.graduacoes} onChange={(e) => updVantagem(i, "graduacoes", Math.max(1, Math.min(max, Number(e.target.value))))} />}
              <button className="small-btn" onClick={() => rmVantagem(i)}>×</button>
            </div>
            {info && <div className="field-note">{info.desc}{max > 1 ? ` (máx. ${max} graduações)` : ""}</div>}
            {info?.mecanica?.escolhePericias > 0 && (
              <div className="grid2" style={{ marginBottom: 8 }}>
                {Array.from({ length: info.mecanica.escolhePericias }).map((_, pi) => (
                  <select key={pi} value={(v.periciasEscolhidas || [])[pi] || ""} onChange={(e) => {
                    const arr = [...(v.periciasEscolhidas || [])]; arr[pi] = e.target.value; updVantagem(i, "periciasEscolhidas", arr);
                  }}>
                    <option value="">Perícia {pi + 1}…</option>
                    {PERICIAS.map((p) => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                  </select>
                ))}
              </div>
            )}
            {info?.mecanica?.escolheDefesa && (
              <select value={v.defesaEscolhida || ""} onChange={(e) => updVantagem(i, "defesaEscolhida", e.target.value)} style={{ marginBottom: 8 }}>
                <option value="">Defesa favorita…</option>
                <option value="esquiva">Esquiva</option>
                <option value="aparar">Aparar</option>
              </select>
            )}
            {info?.mecanica?.pedeTexto && (
              <input type="text" placeholder="Inimigo escolhido" value={v.textoExtra || ""} onChange={(e) => updVantagem(i, "textoExtra", e.target.value)} style={{ marginBottom: 8 }} />
            )}
            {info?.pedeHabilidade && (
              <select value={v.alvoId || ""} onChange={(e) => updVantagem(i, "alvoId", e.target.value)} style={{ marginBottom: 8 }}>
                <option value="">Habilidade afetada…</option>
                {(f.ataques || []).filter((a) => a.nome.trim()).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            )}
          </div>
        );
      })}
      <button className="btn btn-ghost btn-sm" onClick={addVantagem}>+ Vantagem</button>

      <div className="divider" />
      <div className="section-title">Pontos de Poder</div>
      <div className={"pp-box" + (excedido ? " excedido" : "")}><span>Gastos / Máximo</span><span className="pp-val">{ppGastos} / {ppMax}</span></div>
      {eqMax > 0 && <div className={"pp-box" + (eqExcedido ? " excedido" : "")}><span>Equipamento gasto / máximo</span><span className="pp-val">{eqGastos} / {eqMax}</span></div>}

      <div className="divider" />
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

      <div className="divider" />
      <div className="section-title">Habilidades</div>
      {f.ataques.map((a, i) => <AtaqueForm key={a.id} ataque={a} onMudar={(novo) => updAtaque(i, novo)} onRemover={() => rmAtaque(i)} />)}
      <button className="btn btn-ghost btn-sm" onClick={addAtaque}>+ Habilidade</button>

      <div style={{ height: 70 }} />
      <div className="ficha-footer-fixa">
        <div className="grid2">
          <button className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-accent" disabled={!f.nome.trim()} onClick={tentarSalvar}>Salvar ficha</button>
        </div>
      </div>
    </div>
  );
}

function FichasTab({ entidades, salvar, identidade, registrar, onAbrirRolagem, onAbrirAcao, atualizarCampo, onRolarIniciativa }) {
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");
  const [vantagemCtx, setVantagemCtx] = useState(null);
  const rotulosProprio = identidade.papel === "mestre" ? ["Criatura", "NPC"] : ["Personagem", "Invocação"];
  const meusTodos = entidades.filter((e) => e.dono === identidade.nome);
  const meus = busca.trim() ? meusTodos.filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase())) : meusTodos;
  const outros = entidades.filter((e) => e.dono !== identidade.nome);

  const salvarFicha = async (f) => {
    const criando = !f.id;
    const nova = criando ? [...entidades, { ...f, id: uid(), dono: identidade.nome }] : entidades.map((e) => (e.id === f.id ? { ...f } : e));
    await salvar(nova);
    registrar({ desc: `${identidade.nome} ${criando ? "criou" : "editou"} a ficha "${f.nome}"`, detalhe: f.rotulo, total: criando ? "Criada" : "Editada", tipoClasse: criando ? "hs" : "hw" });
    setEditando(null);
  };
  const excluir = async (ent) => {
    await salvar(entidades.filter((e) => e.id !== ent.id));
    registrar({ desc: `${identidade.nome} excluiu a ficha "${ent.nome}"`, detalhe: ent.rotulo, total: "Excluída", tipoClasse: "hd" });
  };
  const toggleVantagem = async (entidadeId, vantagemId, novoAtivo) => {
    const nova = entidades.map((e) => (e.id !== entidadeId ? e : { ...e, vantagens: (e.vantagens || []).map((v) => (v.id === vantagemId ? { ...v, ativo: novoAtivo } : v)) }));
    await salvar(nova);
    setVantagemCtx((ctx) => (ctx ? { ...ctx, vantagem: { ...ctx.vantagem, ativo: novoAtivo } } : ctx));
  };
  const abrirVantagem = (entidade, vantagem, editavel) => setVantagemCtx({ entidade, vantagem, info: VANTAGENS.find((x) => x.nome === vantagem.nome), editavel });

  if (editando) return <FichaForm inicial={editando === "novo" ? null : editando} rotulos={rotulosProprio} onSalvar={salvarFicha} onCancelar={() => setEditando(null)}
    entidades={entidades} atualizarCampo={atualizarCampo} registrar={registrar} />;

  const podeMarcarOponente = identidade.papel === "mestre";

  return (
    <div>
      <div className="section-title">Minhas fichas ({identidade.papel === "mestre" ? "criaturas e NPCs" : "personagens e invocações"})</div>
      <input type="text" placeholder="Buscar por nome…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: 10 }} />
      {meus.length === 0 && <div className="card empty">Nenhuma ficha encontrada.</div>}
      {meus.map((e) => <EntidadeItem key={e.id} e={e} onEditar={() => setEditando(e)} onExcluir={() => excluir(e)} editavel onAbrirRolagem={onAbrirRolagem} onAtualizarCampo={atualizarCampo} onAbrirVantagem={abrirVantagem} onAbrirAcao={onAbrirAcao} onRolarIniciativa={onRolarIniciativa} podeMarcarOponente={podeMarcarOponente} entidades={entidades} registrar={registrar} />)}
      <button className="btn btn-accent btn-block" onClick={() => setEditando("novo")} style={{ marginBottom: 20 }}>+ Nova ficha</button>

      <div className="section-title">Outras fichas na mesa</div>
      {outros.length === 0 && <div className="card empty">Ninguém mais cadastrou fichas ainda.</div>}
      {outros.map((e) => <EntidadeItem key={e.id} e={e} onAbrirRolagem={onAbrirRolagem} onAbrirVantagem={abrirVantagem} podeMarcarOponente={podeMarcarOponente} onAtualizarCampo={atualizarCampo} />)}

      {vantagemCtx && <VantagemModal ctx={vantagemCtx} onFechar={() => setVantagemCtx(null)} onToggle={toggleVantagem} />}
    </div>
  );
}

function StatChip({ label, value, onClick }) {
  return <button className="stat-chip" onClick={onClick}>{label} <b>{value >= 0 ? "+" : ""}{value}</b></button>;
}

function EntidadeItem({ e, onEditar, onExcluir, editavel, onAbrirRolagem, onAtualizarCampo, onAbrirVantagem, onAbrirAcao, onRolarIniciativa, podeMarcarOponente, entidades, registrar }) {
  const [aberto, setAberto] = useState(false);
  const [secoes, setSecoes] = useState({ acoes: false, manobras: false, ataques: false, defesas: false, atributos: false, pericias: false, condicoes: false });
  const toggleSecao = (k) => setSecoes((s) => ({ ...s, [k]: !s[k] }));
  const abrirStat = (tipo, chave, label) => onAbrirRolagem({ origem: e, tipo, chave, label: `${e.nome} · ${label}` });
  const abrirAtaque = (ataque) => {
    if (ataque.sustentado && onAtualizarCampo) onAtualizarCampo(e.id, "sustentado", true);
    onAbrirRolagem({ origem: e, tipo: "ataque", ataque, label: `${e.nome} · ${ataque.nome || "Ataque"}` });
  };
  const alternarPassiva = (ataque) => {
    if (!onAtualizarCampo) return;
    const novos = (e.ataques || []).map((x) => (x.id === ataque.id ? { ...x, passivo: { ...x.passivo, ativo: !x.passivo?.ativo } } : x));
    onAtualizarCampo(e.id, "ataques", novos);
    if (ataque.sustentado) onAtualizarCampo(e.id, "sustentado", true);
  };
  const abrirAcao = (acao) => onAbrirAcao({ origem: e, acao });
  const pvMax = pvMaxCalc(e), nenMax = nenMaxCalc(e);
  const passivos = modificadoresPassivos(e);

  /* ----- ações de descanso ----- */
  const [descansoAberto, setDescansoAberto] = useState(false);
  const [tratamentoAlvoId, setTratamentoAlvoId] = useState("");
  const [treinoAlvoId, setTreinoAlvoId] = useState("");
  const jogadoresDisponiveis = (entidades || []).filter((j) => j.rotulo === "Personagem" && j.id !== e.id);

  const ativarBonusDescanso = (chave) => onAtualizarCampo(e.id, "descansoAtivos", { ...(e.descansoAtivos || {}), [chave]: true });
  const alimentarSe = () => onAtualizarCampo(e.id, "pvAtual", Math.min(pvMaxCalc(e), (e.pvAtual || 0) + attr(e, "vigor") + (e.nivel || 1)));
  const meditar = () => onAtualizarCampo(e.id, "nenAtual", Math.min(nenMaxCalc(e), (e.nenAtual || 0) + attr(e, "prontidao") + (e.nivel || 1)));
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
  };
  const ajustarMachucado = (delta) => {
    const atuais = { ...(e.condicoes || {}) };
    const atual = (atuais["Machucado"] || 0) + delta;
    if (atual <= 0) delete atuais["Machucado"]; else atuais["Machucado"] = atual;
    onAtualizarCampo(e.id, "condicoes", atuais);
  };

  if (!aberto) {
    return (
      <div className="ent-item">
        <div className="ent-collapsed" onClick={() => setAberto(true)}>
          <div className="nome-row">
            {e.foto && <img src={e.foto} alt="" className="foto-thumb" style={{ width: 26, height: 26 }} />}
            <span className="nome nome-clicavel">{e.nome}</span>
            <span className="meta">{e.rotulo} · Nv.{e.nivel} · {e.dono}</span>
            {e.oponente && <span className="badge-status">Engajado</span>}
            {e.sustentado && <span className="badge-status">Sustentando</span>}
          </div>
          {editavel && (
            <div className="actions" onClick={(ev) => ev.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" onClick={onEditar}>Editar</button>
              <button className="btn btn-danger btn-sm" onClick={onExcluir}>Excluir</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ent-item">
      <div className="head">
        <div className="head-left">
          {e.foto && <img src={e.foto} alt="" className="foto-thumb" style={{ width: 52, height: 52 }} />}
          <div>
            <span className="nome nome-clicavel" onClick={() => setAberto(false)}>{e.nome}</span>
            <div className="rotulo">{e.rotulo} · Nv.{e.nivel} · {e.tipoNen} · {e.dono}</div>
          </div>
        </div>
        {editavel && <div className="actions"><button className="btn btn-ghost btn-sm" onClick={onEditar}>Editar</button><button className="btn btn-danger btn-sm" onClick={onExcluir}>Excluir</button></div>}
      </div>

      <div className="status-toggle-row">
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

      <div className="vitals">
        <span>Vida{" "}
          {editavel ? <input className="in-vida" type="number" value={e.pvAtual || 0} onChange={(ev) => onAtualizarCampo(e.id, "pvAtual", Number(ev.target.value))} /> : <b>{e.pvAtual || 0}</b>}
          {" "}/ <b>{pvMax}</b>{e.pvTemp ? ` (+${e.pvTemp})` : ""}
        </span>
        <span>Nen{" "}
          {editavel ? <input className="in-nen" type="number" value={e.nenAtual || 0} onChange={(ev) => onAtualizarCampo(e.id, "nenAtual", Number(ev.target.value))} /> : <b>{e.nenAtual || 0}</b>}
          {" "}/ <b>{nenMax}</b>
        </span>
        <span>Deslocamento <b>{deslocamentoTexto(e)}</b></span>
        <span>PP <b>{pontosPoderGastos(e)}/{pontosPoderMax(e)}</b></span>
        {pontosEquipamentoMax(e) > 0 && <span>Equip <b>{pontosEquipamentoGastos(e)}/{pontosEquipamentoMax(e)}</b></span>}
      </div>

      {editavel && (
        <div style={{ marginBottom: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onRolarIniciativa(e)}>⚄ Iniciativa</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setDescansoAberto((s) => !s)}>Ações de descanso</button>
          {e.defendendo && <span className="badge-status" onClick={() => onAtualizarCampo(e.id, "defendendo", false)}>Defendendo ×</span>}
          {e.mirando && <span className="badge-status" onClick={() => onAtualizarCampo(e.id, "mirando", false)}>Mirando ×</span>}
        </div>
      )}

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
            <select value={tratamentoAlvoId} onChange={(ev) => setTratamentoAlvoId(ev.target.value)} style={{ marginBottom: 8 }}>
              <option value="">Selecione um jogador…</option>
              {jogadoresDisponiveis.map((j) => <option key={j.id} value={j.id}>{j.nome}</option>)}
            </select>
            <button className="btn btn-accent btn-sm btn-block" disabled={!tratamentoAlvoId} onClick={tratarJogador}>Tratar</button>
          </div>

          <div className="subcard">
            <div style={{ marginBottom: 8 }}><b>Treinamento</b><div className="field-note">Você e o jogador escolhido ganham um checkbox de +2 no próximo teste de ataque, até o próximo descanso.</div></div>
            <select value={treinoAlvoId} onChange={(ev) => setTreinoAlvoId(ev.target.value)} style={{ marginBottom: 8 }}>
              <option value="">Selecione um jogador…</option>
              {jogadoresDisponiveis.map((j) => <option key={j.id} value={j.id}>{j.nome}</option>)}
            </select>
            <button className="btn btn-accent btn-sm btn-block" disabled={!treinoAlvoId} onClick={treinarComJogador}>Treinar</button>
          </div>
        </div>
      )}

      {Object.keys(e.condicoes || {}).length > 0 && (
        <div className="stat-group">
          <div className="stat-group-label">Condições ativas</div>
          <div className="chip-row">
            {Object.entries(e.condicoes || {}).map(([nome, qtd]) => (
              <button key={nome} className="stat-chip vantagem-chip ativo" onClick={() => toggleCondicao(nome)}>
                {nome}{qtd > 1 ? <b> ×{qtd}</b> : null}
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
          <div className="acoes-header" onClick={() => toggleSecao("acoes")}>
            <div className="stat-group-label">Ações</div>
            <span className={"arrow" + (secoes.acoes ? " open" : "")}>▶</span>
          </div>
          {secoes.acoes && (
            <div className="chip-row">
              {ACOES_PADRAO.map((a) => (
                <button key={a.id} className="stat-chip acao-chip" onClick={() => abrirAcao(a)}>
                  {a.nome}<span className="acao-tipo">{a.tag === "Ação Padrão" ? "padrão" : "movimento"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {editavel && (
        <div className="stat-group">
          <div className="acoes-header" onClick={() => toggleSecao("manobras")}>
            <div className="stat-group-label">Manobras</div>
            <span className={"arrow" + (secoes.manobras ? " open" : "")}>▶</span>
          </div>
          {secoes.manobras && (
            <div className="chip-row">
              {MANOBRAS.map((m) => (
                <button key={m.id} className="stat-chip acao-chip" onClick={() => abrirAcao(m)}>
                  {m.nome}<span className="acao-tipo">{m.tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(e.ataques || []).length > 0 && (
        <div className="stat-group">
          <div className="acoes-header" onClick={() => toggleSecao("ataques")}>
            <div className="stat-group-label">Habilidades</div>
            <span className={"arrow" + (secoes.ataques ? " open" : "")}>▶</span>
          </div>
          {secoes.ataques && (
            <div className="chip-row">
              {e.ataques.map((a) => (
                a.tipo === "passiva" ? (
                  <button key={a.id} className={"stat-chip vantagem-chip" + (a.passivo?.ativo ? " ativo" : "")} onClick={() => (editavel ? alternarPassiva(a) : null)} disabled={!editavel}>
                    {a.nome || "(sem nome)"} <b>{PODERES_PASSIVOS.find((p) => p.id === a.passivo?.tipoId)?.nome || "passiva"}</b>
                  </button>
                ) : (
                  <button key={a.id} className={"stat-chip ataque-chip" + (itemQuebrado(a) ? " item-quebrado" : "")} onClick={() => abrirAtaque(a)}>
                    {a.nome || "(sem nome)"} <b>{TIPOS_ACERTO.find((t) => t.v === a.tipoAcerto)?.l}</b>
                    {itemQuebrado(a) && <b style={{ color: "var(--danger, #e05a5a)" }}> · Quebrado</b>}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      )}

      <div className="stat-group">
        <div className="acoes-header" onClick={() => toggleSecao("defesas")}>
          <div className="stat-group-label">Defesas</div>
          <span className={"arrow" + (secoes.defesas ? " open" : "")}>▶</span>
        </div>
        {secoes.defesas && (
          <div className="chip-row">
            {DEFESAS_OPCOES.map((d) => <StatChip key={d.key} label={d.label} value={statDefesa(e, d.key)} onClick={() => abrirStat("defesa", d.key, d.label)} />)}
          </div>
        )}
      </div>

      <div className="stat-group">
        <div className="acoes-header" onClick={() => toggleSecao("atributos")}>
          <div className="stat-group-label">Atributos</div>
          <span className={"arrow" + (secoes.atributos ? " open" : "")}>▶</span>
        </div>
        {secoes.atributos && (
          <div className="chip-row">
            {ATRIBUTOS.map((a) => <StatChip key={a.k} label={a.l} value={attr(e, a.k)} onClick={() => abrirStat("atributo", a.k, a.l)} />)}
          </div>
        )}
      </div>

      <div className="stat-group">
        <div className="acoes-header" onClick={() => toggleSecao("pericias")}>
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
          <div className="stat-group-label">Vantagens</div>
          <div className="chip-row">
            {e.vantagens.map((v) => (
              <button key={v.id} className={"stat-chip vantagem-chip" + (v.ativo ? " ativo" : "")} onClick={() => onAbrirVantagem(e, v, editavel)}>
                {v.nome}{v.graduacoes > 1 ? <b> ×{v.graduacoes}</b> : null}
              </button>
            ))}
          </div>
        </div>
      )}

      {(passivos.notas.length > 0 || passivos.reducaoDano > 0 || passivos.regenPorTurno > 0 || passivos.comunicacaoAlcance > 0 || passivos.pontosSorteMax > 0 || passivos.deslocamentos.temVoo || passivos.deslocamentos.temNatacao || passivos.deslocamentos.temEscavacao || passivos.membrosExtras > 0 || passivos.tamanho !== 0) && (
        <div className="stat-group">
          <div className="stat-group-label">Efeitos Passivos Ativos</div>
          <div className="readonly-grid">
            {passivos.tamanho !== 0 && <div className="ro-row"><span>Tamanho</span><b>{passivos.tamanho >= 0 ? "+" : ""}{passivos.tamanho}</b></div>}
            {passivos.reducaoDano > 0 && <div className="ro-row"><span>Redução de Dano</span><b>{passivos.reducaoDano}</b></div>}
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
          {habilidadesPassivasAtivas(e).map((a) => {
            const def = PODERES_PASSIVOS.find((p) => p.id === a.passivo.tipoId);
            if (!def) return null;
            const cd = def.cdInfo ? def.cdInfo(a.passivo) : null;
            const mostraExplosao = def.temBotaoExplosao && a.passivo.extrasAtivos?.explosao;
            if (!cd && !mostraExplosao) return null;
            return (
              <div key={a.id} className="ro-row" style={{ marginTop: 6 }}>
                <span title={cd ? `CD ${cd.cd} — ${cd.teste}` : undefined}>{a.nome || def.nome}{cd ? ` (CD ${cd.cd})` : ""}</span>
                {mostraExplosao && editavel && (
                  <button className={"small-btn" + (a.passivo.explosaoLigada ? " ativo" : "")}
                    onClick={() => onAtualizarCampo(e.id, "ataques", (e.ataques || []).map((x) => (x.id === a.id ? { ...x, passivo: { ...x.passivo, explosaoLigada: !x.passivo.explosaoLigada } } : x)))}>
                    {a.passivo.explosaoLigada ? "Explosão ligada (−)" : "Ativar Explosão (+3)"}
                  </button>
                )}
              </div>
            );
          })}
          {passivos.notas.length > 0 && <div className="field-note" style={{ marginTop: 6 }}>{passivos.notas.join(" · ")}</div>}
        </div>
      )}

      {editavel && (
        <div className="stat-group">
          <div className="acoes-header" onClick={() => toggleSecao("condicoes")}>
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
