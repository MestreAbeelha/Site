/* =====================================================================
   poderes.js — catálogo de poderes + motor de custo (Zona Liminal)
   Módulo puro (sem React/Firebase). Testado em test-poderes.mjs.
   ===================================================================== */

/* ---------- tipos de Nen ---------- */
export const TIPOS_NEN = ["fortificador", "modelador", "manipulador", "emissor", "transmutador", "conjurador", "especialista"];
// relações de cada tipo: oposto / vizinhos / paralelos (especialista não tem)
const REL = {
  fortificador: { oposto: "emissor", vizinhos: ["conjurador", "modelador"], paralelos: ["transmutador", "manipulador"] },
  modelador: { oposto: "transmutador", vizinhos: ["fortificador", "manipulador"], paralelos: ["conjurador", "emissor"] },
  manipulador: { oposto: "conjurador", vizinhos: ["emissor", "modelador"], paralelos: ["fortificador", "transmutador"] },
  emissor: { oposto: "fortificador", vizinhos: ["transmutador", "manipulador"], paralelos: ["conjurador", "modelador"] },
  transmutador: { oposto: "modelador", vizinhos: ["emissor", "conjurador"], paralelos: ["fortificador", "manipulador"] },
  conjurador: { oposto: "manipulador", vizinhos: ["fortificador", "transmutador"], paralelos: ["modelador", "emissor"] },
};
export function relacaoNen(meu, outro) {
  if (!meu || !outro || meu === "especialista" || outro === "coringa" || outro === "especialista") return null;
  if (meu === outro) return "propria";
  const r = REL[meu];
  if (!r) return null;
  if (r.oposto === outro) return "oposta";
  if (r.vizinhos.includes(outro)) return "vizinha";
  if (r.paralelos.includes(outro)) return "paralela";
  return null;
}

/* ---------- catálogo de efeitos ----------
   base: custo por graduação (número) ou {min,max} quando depende de escolha.
   tipo: tipo de Nen do efeito ("coringa" = sem tipo).                       */
const E = (id, nome, base, acao, alcance, duracao, tipo, extra = {}) => ({ id, nome, base, acao, alcance, duracao, tipo, ...extra });
export const EFEITOS = [
  E("aflicao", "Aflição", 3, "padrao", "perto", "instantaneo", "coringa", { implementado: true }),
  E("alongamento", "Alongamento", 1, "livre", "pessoal", "sustentado", "modelador"),
  E("camuflagem", "Camuflagem", 2, "livre", "pessoal", "sustentado", "coringa", { implementado: true }),
  E("caracteristica_aumentada", "Característica Aumentada", 2, "livre", "pessoal", "sustentado", "fortificador"),
  E("compreender", "Compreender", 5, "nenhuma", "pessoal", "permanente", "especialista"),
  E("comunicacao", "Comunicação", 2, "livre", "graduacao", "sustentado", "emissor"),
  E("controle_sorte", "Controle de Sorte", 6, "reacao", "percepcao", "instantaneo", "manipulador"),
  E("crescimento", "Crescimento", 6, "livre", "pessoal", "sustentado", "modelador"),
  E("criar", "Criar", 3, "padrao", "distancia", "sustentado", "conjurador"),
  E("cura", "Cura", 3, "padrao", "perto", "instantaneo", "fortificador", { implementado: true }),
  E("dano", "Dano", 1, "padrao", "perto", "instantaneo", "coringa", { implementado: true }),
  E("deflexao", "Deflexão", 6, "padrao", "pessoal", "instantaneo", "fortificador"),
  E("encolhimento", "Encolhimento", 2, "livre", "pessoal", "sustentado", "modelador"),
  E("enfraquecer", "Enfraquecer", 3, "padrao", "perto", "sustentado", "manipulador", { implementado: true }),
  E("escavacao", "Escavação", 1, "livre", "pessoal", "sustentado", "modelador"),
  E("ilusao", "Ilusão", { min: 1, max: 5 }, "livre", "percepcao", "sustentado", "transmutador"),
  E("imortalidade", "Imortalidade", 10, "nenhuma", "pessoal", "permanente", "especialista"),
  E("imunidade", "Imunidade", 3, "livre", "pessoal", "sustentado", "transmutador"),
  E("invocar", "Invocar", 3, "padrao", "perto", "sustentado", "conjurador"),
  E("leitura_mental", "Leitura Mental", 2, "padrao", "percepcao", "sustentado", "manipulador", { implementado: true }),
  E("membros_extras", "Membros Extras", 4, "nenhuma", "pessoal", "sustentado", "modelador"),
  E("mover_objetos", "Mover Objetos", 3, "padrao", "perto", "sustentado", "manipulador", { implementado: true }),
  E("movimento", "Movimento", 3, "livre", "pessoal", "sustentado", "coringa"),
  E("nulificar", "Nulificar", 6, "padrao", "perto", "sustentado", "manipulador", { implementado: true }),
  E("protecao", "Proteção", 4, "livre", "pessoal", "sustentado", "fortificador"),
  E("rapidez", "Rapidez", 4, "livre", "pessoal", "sustentado", "coringa"),
  E("regeneracao", "Regeneração", 3, "livre", "pessoal", "sustentado", "modelador"),
  E("salto", "Salto", 2, "livre", "pessoal", "instantaneo", "coringa"),
  E("sentidos", "Sentidos", 3, "livre", "pessoal", "sustentado", "coringa"),
  E("sentido_remoto", "Sentido Remoto", { min: 4, max: 6 }, "livre", "percepcao", "sustentado", "emissor"),
  E("teleporte", "Teleporte", 4, "movimento", "graduacao", "instantaneo", "emissor"),
  E("transformacao", "Transformação", { min: 3, max: 7 }, "padrao", "perto", "sustentado", "transmutador"),
  E("variavel", "Variável", 10, "padrao", "pessoal", "sustentado", "especialista"),
  E("velocidade", "Velocidade", 3, "livre", "pessoal", "sustentado", "fortificador"),
  E("voo", "Voo", 5, "livre", "pessoal", "sustentado", "coringa"),
  // efeitos que já existiam no app como "passivos" mas não estão nos PDFs
  E("natacao", "Natação", 1, "livre", "pessoal", "sustentado", "coringa", { legado: true }),
  E("bonus_pericia", "Característica Aumentada (Bônus de Perícia)", 1, "livre", "pessoal", "sustentado", "coringa", { legado: true }),
  E("caracteristica", "Característica", 1, "nenhuma", "nenhum", "permanente", "coringa", { legado: true }),
];
export const EFEITO_POR_ID = Object.fromEntries(EFEITOS.map((e) => [e.id, e]));

/* ---------- extras / falhas ----------
   k: "g" = por graduação (muda o custo/grad. do efeito) · "f" = pontos fixos da habilidade
   v: valor padrão (por unidade) · opcoes: valores possíveis (quando varia)
   mult: pode ser pego várias vezes (campo `vezes`) · so: exclusivo desse efeito
   tipo: conta como poder desse tipo de Nen · muda: altera "acao"/"alcance"/"duracao" */
const M = (id, nome, k, v, extra = {}) => ({ id, nome, k, v, ...extra });
export const EXTRAS = [
  M("afeta_objetos", "Afeta Objetos", "g", 1, { opcoes: [0, 1] }),
  M("afeta_outros", "Afeta Outros", "g", 1, { opcoes: [0, 1] }),
  M("alcance_estendido", "Alcance Estendido", "f", 1, { mult: true, tipo: "emissor", muda: "alcance" }),
  M("area", "Área", "g", 1, { tipo: "emissor", opcoes_area: ["Cone", "Cilindro", "Explosão", "Linha", "Nuvem"] }),
  M("ataque", "Ataque", "g", 0),
  M("automatizado", "Automatizado", "g", 7, { opcoes: [7, 10], muda: "acao" }),
  M("ciclo", "Ciclo", "g", 2),
  M("contagioso", "Contagioso", "g", 2),
  M("distancia_aumentada", "Distância Aumentada", "g", 1, { opcoes: [1, 2], tipo: "emissor", muda: "alcance" }),
  M("dividido", "Dividido", "g", 1, { mult: true }),
  M("duracao_aumentada", "Duração Aumentada", "g", 3, { muda: "duracao" }),
  M("efeito_alternativo", "Efeito Alternativo", "f", 1, { nivel: "habilidade" }),
  M("efeito_secundario", "Efeito Secundário", "g", 5),
  M("indireto", "Indireto", "g", 3, { tipo: "emissor" }),
  M("multiataque", "Multiataque", "g", 2),
  M("penetrante", "Penetrante", "g", 1, { mult: true }),
  M("permear", "Permear", "g", 1, { tipo: "emissor" }),
  M("preciso", "Preciso", "f", 1),
  M("reacao", "Reação (reduz a ação)", "g", 1, { opcoes: [1, 2, 3], muda: "acao" }),
  M("resistencia_alternativa", "Resistência Alternativa", "g", 1),
  M("ricochete", "Ricochete", "f", 1),
  M("seletivo", "Seletivo", "g", 1, { tipo: "emissor" }),
  M("sobrecarregado", "Sobrecarregado", "g", 1, { mult: true, tipo: "fortificador" }),
  M("sutil", "Sutil", "g", 1, { opcoes: [1, 2, 3, 4, 5], tipo: "transmutador" }),
  M("teleguiado", "Teleguiado", "g", 1, { tipo: "emissor" }),
  M("variavel_carga", "Variável (Carga)", "f", 1),
  M("variavel_municao", "Variável (Munição)", "f", -2),
  M("variavel_nen_vida", "Variável (Nen/Vida)", "f", -1),
];
export const FALHAS = [
  M("acao_aumentada", "Ação Aumentada", "g", -1, { mult: true, muda: "acao" }),
  M("alcance_diminuido", "Alcance Diminuído", "f", -1, { mult: true, muda: "alcance" }),
  M("alcance_reduzido", "Alcance Reduzido", "g", -1, { mult: true, muda: "alcance" }),
  M("aquecimento", "Aquecimento", "g", -3, { opcoes: [-3, -5, -10] }),
  M("ativacao", "Ativação", "g", -1),
  M("baseado_agarrar", "Baseado em Agarrar", "g", -2),
  M("cansativo", "Cansativo", "g", -5, { opcoes: [-5, -10] }),
  M("carregamento", "Carregamento", "g", -3, { opcoes: [-3, -6] }),
  M("concentracao", "Concentração", "g", -2, { muda: "duracao" }),
  M("depender_sentido", "Depender de Sentido", "g", -2),
  M("desgastante", "Desgastante", "f", -1, { mult: true }),           // vezes = pontos de atributo reduzidos
  M("efeito_colateral", "Efeito Colateral", "g", -2, { opcoes: [-2, -3, -4, -4, -6, -8] }), // grau 1/2/3 e dobrado se automático
  M("exigir_teste", "Exigir Teste", "g", -1, { mult: true }),         // -1 base; cada +1 de CD soma -1
  M("limitado", "Limitado", "g", -1, { opcoes: [-1, -2, -3, -4, -5], mult: true }),
  M("incontrolavel", "Incontrolável", "g", -3, { opcoes: [-3, -6] }),
  M("perceptivel", "Perceptível", "f", -1),
  M("ponto_fraco", "Ponto Fraco", "g", -4),
  M("retroalimentacao", "Retroalimentação", "g", -3),
  M("peculiaridade", "Peculiaridade", "g", -1),
];
/* exclusivos de um efeito (id do efeito -> lista) */
export const EXCLUSIVOS = {
  aflicao: [M("concentracao_afl", "Concentração (Aflição)", "g", 1), M("condicao_extra", "Condição Extra", "g", 1), M("cumulativo_afl", "Cumulativo", "g", 2), M("resistencia_alt_afl", "Resistência Alternativa", "g", 1),
    M("grau_limitado_afl", "Grau Limitado", "g", -1, { opcoes: [-1, -2] }), M("recuperacao_instantanea", "Recuperação Instantânea", "g", -1), M("sustentado_afl", "Sustentado", "g", -1, { muda: "duracao" })],
  camuflagem: [M("afeta_outros_cam", "Afeta Outros", "g", 1), M("ataque_cam", "Ataque", "g", 0), M("preciso_cam", "Preciso", "f", 1), M("sentido_extra", "Sentido Extra", "g", 1, { mult: true }),
    M("mesclar", "Mesclar", "g", -1), M("parcial", "Parcial", "g", -1), M("passiva", "Passiva", "g", -1)],
  caracteristica_aumentada: [M("explosao", "Explosão", "g", 1), M("brutal", "Brutal", "g", 1, { mult: true })],
  comunicacao: [M("rapida", "Rápida", "g", 1), M("seletiva_com", "Seletiva", "g", 1), M("sutil_com", "Sutil", "g", 1), M("unilateral", "Unilateral", "g", -1)],
  controle_sorte: [M("azar", "Azar", "g", 1), M("sortudo", "Sortudo", "g", 1), M("ataque_sorte", "Ataque", "g", -1), M("azarado", "Azarado", "g", -1), M("resistir_sorte", "Resistir", "g", -1)],
  crescimento: [M("musculos_densos", "Músculos Densos", "g", 1), M("so_tamanho", "Só Tamanho", "f", 1), M("pesado_demais", "Pesado Demais", "g", -2)],
  criar: [M("continuo_criar", "Contínuo", "g", 2, { muda: "duracao" }), M("dimensional", "Dimensional", "g", 5), M("estacionario", "Estacionário", "g", 1), M("impenetravel", "Impenetrável", "g", 1, { mult: true }),
    M("sutil_criar", "Sutil", "g", 1), M("proporcional", "Proporcional", "g", -1)],
  cura: [M("energizante", "Energizante", "g", 2), M("empatico", "Empático", "f", -1), M("temporario", "Temporário", "g", -2)],
  deflexao: [M("que_vai_volta", "O Que Vai Volta", "g", 1), M("multitarefas", "Multitarefas", "g", 1, { mult: true })],
  encolhimento: [M("forca_normal", "Força Normal", "g", 2), M("encolhedor", "Encolhedor", "g", 1, { tipo: "transmutador" })],
  enfraquecer: [M("amplo", "Amplo", "g", 1), M("persistente", "Persistente", "g", 2), M("simultaneo", "Simultâneo", "g", 2, { mult: true })],
  ilusao: [M("quase_material", "Quase Material", "g", 1, { opcoes: [1, 2] })],
  imunidade: [M("metade_efeito", "Metade do Efeito", "g", -2)],
  invocar: [M("alcance_invocar", "Alcance", "f", 1, { mult: true }), M("ativo", "Ativo", "g", 1), M("horda", "Horda", "g", 2), M("invocar_objeto", "Invocar Objeto", "g", 1), M("invocar_veiculo", "Invocar Veículo", "g", 1),
    M("persistente_inv", "Persistente", "g", 2, { opcoes: [2, 4] }), M("atitude", "Atitude", "g", -2, { opcoes: [-2, -5], exige: "ativo" })],
  leitura_mental: [M("cumulativo_lm", "Cumulativo", "g", 2), M("ligacao_sensorial", "Ligação Sensorial", "g", 1)],
  mover_objetos: [M("camuflagem_mo", "Camuflagem", "g", 1), M("dano_mo", "Dano", "g", 2), M("dividido_mo", "Dividido", "g", 1), M("impulso", "Impulso", "g", 2), M("preciso_mo", "Preciso", "f", 2),
    M("veloz", "Veloz", "g", 2), M("concentrado", "Concentrado", "g", -1), M("direcao_limitada", "Direção Limitada", "g", -1)],
  nulificar: [M("concentracao_nul", "Concentração", "g", 1), M("cumulativo_nul", "Cumulativo", "g", 2), M("grau_limitado_nul", "Grau Limitado", "g", -1, { opcoes: [-1, -2] })],
  rapidez: [M("continuo_rap", "Contínuo", "g", 1, { muda: "duracao" }), M("permanente_rap", "Permanente", "g", 0, { muda: "duracao" })],
  salto: [M("quicar", "Quicar", "g", 1), M("poder_total", "Poder Total", "g", -1)],
  sentido_remoto: [M("camuflagem_sr", "Camuflagem", "g", 1), M("forma_astral", "Forma Astral", "g", 3), M("simultanea", "Simultânea", "g", 2)],
  teleporte: [M("mudar_velocidade", "Mudar a Velocidade", "f", 1), M("portal", "Portal", "g", 3)],
  voo: [M("aquatico", "Aquático", "g", 1), M("asas", "Asas", "g", -1), M("levitacao", "Levitação", "g", -1), M("planar", "Planar", "g", -2), M("plataforma", "Plataforma", "g", -1)],
};
export const MOD_POR_ID = {};
[...EXTRAS, ...FALHAS].forEach((m) => (MOD_POR_ID[m.id] = m));
Object.values(EXCLUSIVOS).flat().forEach((m) => (MOD_POR_ID[m.id] = m));

/** extras/falhas oferecidos para um efeito: gerais (exceto os "de habilidade") + exclusivos dele */
export function modsDisponiveis(efeitoId) {
  return {
    extras: [...EXTRAS.filter((m) => m.nivel !== "habilidade"), ...(EXCLUSIVOS[efeitoId] || []).filter((m) => m.v >= 0)],
    falhas: [...FALHAS, ...(EXCLUSIVOS[efeitoId] || []).filter((m) => m.v < 0)],
  };
}

/* ---------- Efeito Colateral: custo por grau da condição (dobra se automático) ---------- */
const COLATERAL_GRAU = {
  1: ["adoecido", "caído", "caido", "impedido", "machucado", "tonto", "vulnerável", "vulneravel"],
  2: ["atordoado", "compelido", "em chamas", "envenenado", "imóvel", "imovel", "indefeso", "sangrando", "em transe", "transe"],
  3: ["paralisado", "nulificado"],
};
export function grauCondicao(nome) {
  const n = String(nome || "").toLowerCase().trim();
  for (const g of [1, 2, 3]) if (COLATERAL_GRAU[g].includes(n)) return g;
  return null;
}
/** valor (negativo, por graduação) do Efeito Colateral. Condição fora da tabela -> grau 1 (aviso na tela). */
export function custoColateral(condicao, comTeste) {
  const g = grauCondicao(condicao) || 1;
  return -(g + 1) * (comTeste ? 1 : 2);
}

/* ---------- ação e duração finais de um efeito (catálogo + extras/falhas que mudam) ---------- */
/* escala de ações: reação < livre < movimento < padrão.
   Ação Aumentada sobe n degraus; o extra Reação baixa v degraus (+1 por degrau: padrão→reação = +3). */
const ESCALA_ACAO = ["reacao", "livre", "movimento", "padrao"];
export function acaoDoEfeito(acaoBase, mods) {
  if (mods.some((m) => m.id === "automatizado")) return "nenhuma";
  const i = ESCALA_ACAO.indexOf(acaoBase);
  if (i < 0) return acaoBase;
  const sobe = mods.filter((m) => m.id === "acao_aumentada").reduce((s, m) => s + (m.vezes || 1), 0);
  const desce = mods.filter((m) => m.id === "reacao").reduce((s, m) => s + Math.min(3, Math.abs(m.valor ?? 1)), 0);
  return ESCALA_ACAO[Math.max(0, Math.min(3, i + sobe - desce))];
}
export function duracaoDoEfeito(durBase, mods) {
  if (durBase === "instantaneo" && mods.some((m) => ["duracao_aumentada", "sustentado_afl"].includes(m.id))) return "sustentado";
  if (mods.some((m) => ["permanente_rap", "continuo_criar"].includes(m.id))) return "permanente";
  return durBase;
}

/* ---------- motor de custo ---------- */

/** Custo em PP de um efeito: c = custo por graduação líquido; grad = graduações.
    c >= 1 -> grad*c ; c <= 0 -> 1 PP a cada (1-c) graduações (arredonda p/ cima). Mínimo 1. */
export function custoEfeito(c, grad) {
  if (grad <= 0) return 0;
  if (c >= 1) return grad * c;
  return Math.max(1, Math.ceil(grad / (1 - c)));
}
/** razão legível: "1:3" ou "3/g" */
export const razaoTxt = (c) => (c >= 1 ? `${c}/g` : `1:${1 - c}`);

function resolverMod(it) {
  // item: {id, vezes?, valor?} (catálogo) ou {nome, g|f, tipo?, vezes?} (custom)
  const cat = it.id ? MOD_POR_ID[it.id] : null;
  const vezes = it.vezes ?? 1;
  const nome = it.nome || cat?.nome || it.id;
  let k, v;
  if (cat) { k = cat.k; v = it.valor ?? cat.v; }
  else if (it.g !== undefined) { k = "g"; v = it.g; }
  else { k = "f"; v = it.f ?? it.valor ?? 0; }
  return { id: it.id, nome, k, valor: v * vezes, vezes, tipo: it.tipo || cat?.tipo || null, muda: cat?.muda, derivado: !!it.derivado };
}

/**
 * ctx: { nivel, tipoNen }
 * hab: { efeitos:[{id, grad, base?, tipo?, mods:[...]}], fixos:[{nome, valor}] (itens da habilidade: Efeito Alternativo, tipos manuais, etc.) }
 * Retorna { total, bruto, efeitos:[...], ajustesNen:[...], fixos:[...], avisos:[], erros:[] }
 */
export function calcularHabilidade(ctx, hab) {
  const { nivel = 1, tipoNen = null } = ctx;
  const erros = [], avisos = [];
  const tiposHab = new Set();
  const efeitos = (hab.efeitos || []).map((ef) => {
    const cat = EFEITO_POR_ID[ef.id];
    const base = ef.base ?? (typeof cat?.base === "number" ? cat.base : cat?.base?.min ?? 1);
    const tipoEf = ef.tipo || cat?.tipo || "coringa";
    const mods = (ef.mods || []).map(resolverMod);
    const tiposEf = new Set([tipoEf, ...mods.map((m) => m.tipo).filter(Boolean)]);
    tiposEf.forEach((t) => tiposHab.add(t));
    // ajustes por graduação de Nen (uma vez por efeito)
    const ajG = [];
    if (tipoNen === "especialista") ajG.push({ nome: "Especialista", g: -1 });
    else tiposEf.forEach((t) => {
      const r = relacaoNen(tipoNen, t);
      if (r === "propria") ajG.push({ nome: cap(t), g: -1 });
      if (r === "oposta") ajG.push({ nome: cap(t), g: +1 });
    });
    const somaG = mods.filter((m) => m.k === "g").reduce((s, m) => s + m.valor, 0) + ajG.reduce((s, a) => s + a.g, 0);
    const fixosEf = mods.filter((m) => m.k === "f");
    const c = base + somaG;
    const custo = custoEfeito(c, ef.grad);
    const sobre = mods.filter((m) => m.id === "sobrecarregado").reduce((s, m) => s + m.vezes, 0);
    const limite = nivel + sobre;
    if (ef.grad > limite) erros.push(`${cat?.nome || ef.id}: graduação ${ef.grad} acima do limite ${limite} (nível ${nivel}${sobre ? ` + ${sobre} Sobrecarregado` : ""}).`);
    let dica = null;
    if (c <= 0) {
      const maxMesmoCusto = custo * (1 - c);
      const alvo = Math.min(maxMesmoCusto, limite);
      if (alvo > ef.grad) dica = alvo;
    }
    if (dica) avisos.push(`${cat?.nome || ef.id}: pode ir para o nível ${dica} pelo mesmo custo (${custo} PP).`);
    return { id: ef.id, nome: cat?.nome || ef.id, grad: ef.grad, base, tipo: tipoEf, mods, ajG, c, razao: razaoTxt(c), custo, limite, dicaNivel: dica,
      acao: ef.acao ?? acaoDoEfeito(cat?.acao, mods), duracao: ef.duracao ?? duracaoDoEfeito(cat?.duracao, mods), fixos: fixosEf };
  });

  // ajustes fixos de Nen (uma vez por habilidade)
  const ajustesNen = [];
  if (tipoNen && tipoNen !== "especialista") {
    const meio = Math.max(1, Math.floor(nivel / 2));
    tiposHab.forEach((t) => {
      const r = relacaoNen(tipoNen, t);
      if (r === "vizinha") ajustesNen.push({ nome: `${cap(t)} (vizinho)`, f: -meio });
      if (r === "paralela") ajustesNen.push({ nome: `${cap(t)} (paralelo)`, f: +meio });
    });
  }
  const fixos = [
    ...efeitos.flatMap((e) => e.fixos.map((m) => ({ nome: `${m.nome}${m.vezes > 1 ? " ×" + m.vezes : ""} (${e.nome})`, valor: m.valor }))),
    ...(hab.fixos || []).map((f) => ({ nome: f.nome, valor: f.valor })),
    ...ajustesNen.map((a) => ({ nome: a.nome, valor: a.f })),
  ];

  // validações de coerência: mesma ação e todos sustentados
  const ativos = efeitos.filter((e) => e.acao !== "nenhuma");
  if (new Set(ativos.map((e) => e.acao)).size > 1)
    erros.push("Todos os efeitos da habilidade precisam ter a mesma ação (ajuste com Ação Aumentada, Reação etc.).");
  const durs = new Set(efeitos.filter((e) => e.duracao !== "permanente").map((e) => e.duracao));
  if (durs.has("sustentado") && durs.size > 1) erros.push("Se a habilidade é sustentada, todos os efeitos precisam ser sustentados.");

  const somaEfeitos = efeitos.reduce((s, e) => s + e.custo, 0);
  const somaFixos = fixos.reduce((s, f) => s + f.valor, 0);
  const bruto = somaEfeitos + somaFixos;
  return { total: efeitos.length ? Math.max(1, bruto) : 0, bruto, somaEfeitos, somaFixos, efeitos, ajustesNen, fixos, avisos, erros };
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- texto das regras de cada extra/falha (mostrado na ficha e no uso da habilidade) ---------- */
const dist = (g) => g; // placeholder p/ legibilidade
export const REGRAS = {
  // extras gerais
  area: (n, v, g, c) => {
    const base = { cone: 1, cilindro: 0, explosao: 0, linha: 2, nuvem: 0 };
    const nota = String(c?.nota || "explosão").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const forma = Object.keys(base).find((k) => nota.includes(k)) || "explosao";
    const passos = (c?.mods || []).filter((m) => m.id === "alcance_estendido").reduce((t, m) => t + (m.vezes || 1), 0);
    const m = c?.dist ? c.dist(base[forma] + passos) : "?";
    return `Área (${forma}): ${m} m${passos ? ` (com ${passos} passo(s) de Alcance Estendido)` : ""}. Afeta todos na área; cada alvo pode fazer Esquiva (CD 10 + graduação) para reduzir pela metade a CD de resistência.`;
  },
  afeta_objetos: () => "Afeta Objetos: o efeito também funciona contra objetos.",
  afeta_outros: () => "Afeta Outros: o efeito pode ser aplicado em outra criatura (toque).",
  alcance_estendido: (n) => `Alcance Estendido ${n}: o alcance (ou o tamanho da área) sobe ${n} graduação(ões) na Tabela de Medidas.`,
  distancia_aumentada: (n) => `Distância Aumentada ${n}: alcance de ataque à distância aumentado.`,
  ataque: () => "Ataque: o efeito de alcance pessoal passa a exigir jogada de ataque contra o alvo.",
  automatizado: () => "Automatizado: sem ação; ativa sempre que o alvo perde PV ou é selecionado como alvo, antes de qualquer rolagem.",
  contagioso: () => "Contagioso: o efeito pode passar para quem tocar/for tocado pelo alvo.",
  indireto: () => "Indireto: o efeito pode partir de um ponto diferente de você.",
  multiataque: () => "Multiataque: ataca vários alvos (−10 no mesmo alvo / −5 em outro alvo).",
  penetrante: (n) => `Penetrante ${n}: ignora ${n} ponto(s) de Proteção/redução de dano do alvo (aplicado automaticamente).`,
  permear: () => "Permear: atravessa barreiras e cobertura.",
  preciso: () => "Preciso: ignora cobertura/camuflagem parciais.",
  reacao: (n, v) => `Reação: a ação do efeito é reduzida em ${Math.abs(v ?? 1)} degrau(s) (padrão → movimento → livre → reação).`,
  resistencia_alternativa: () => "Resistência Alternativa: o alvo pode resistir com outro salvamento (ver opções no uso).",
  ricochete: () => "Ricochete: o ataque pode quicar em superfícies para atingir alvos atrás de cobertura.",
  seletivo: () => "Seletivo: escolha quem é afetado numa área.",
  sobrecarregado: (n, v, g) => `Sobrecarregado ${n}: graduação pode passar do seu nível em até ${n}.`,
  sutil: (n, v) => `Sutil ${v || n}: ${v || n} sentido(s) não percebem o efeito acontecendo.`,
  teleguiado: () => "Teleguiado: o projétil segue o alvo; erro dá nova tentativa no turno seguinte.",
  // falhas gerais
  acao_aumentada: (n) => `Ação Aumentada ${n}: a ação para usar sobe ${n} degrau(s).`,
  alcance_diminuido: () => "Alcance Diminuído: alcance reduzido um degrau.",
  alcance_reduzido: () => "Alcance Reduzido: só alcança até um degrau abaixo.",
  aquecimento: () => "Aquecimento: precisa de turnos de preparo antes de ter efeito total.",
  ativacao: () => "Ativação: o 1º clique ativa (ação de movimento); o 2º usa (automático).",
  baseado_agarrar: () => "Baseado em Agarrar: só funciona contra alvo que você esteja agarrando.",
  cansativo: (n, v) => `Cansativo: ao usar, você fica ${(v ?? -5) <= -10 ? "Exausto" : "Fatigado (Exausto se já estava Fatigado)"} (automático).`,
  carregamento: (n, v) => `Carregamento: o 1º clique carrega (${(v ?? -3) <= -6 ? "ação padrão + movimento" : "ação padrão"}); o 2º usa (automático).`,
  concentracao: () => "Concentração: dura só enquanto você se concentra (ação de movimento por turno).",
  depender_sentido: (n, v, g, c) => `Depender de Sentido${c?.nota ? " (" + c.nota + ")" : ""}: não afeta alvo Cego/Surdo conforme o sentido (automático; escreva “visão” ou “audição” na nota).`,
  desgastante: (n) => `Desgastante: ao usar, reduz atributo em ${n}.`,
  efeito_colateral: () => "Efeito Colateral: ao usar, você recebe a condição indicada.",
  exigir_teste: () => "Exigir Teste: precisa passar num teste para usar; falhar anula o uso.",
  limitado: () => "Limitado: condição restritiva (ver nota).",
  incontrolavel: (n, v) => (v ?? -3) <= -6 ? "Incontrolável (sem teste): sempre foge do controle; o mestre decide (log automático)." : "Incontrolável: ao usar, teste de Vontade CD 10 + graduação; falhar = o mestre decide o efeito (automático).",
  perceptivel: () => "Perceptível: o efeito é muito visível/audível.",
  ponto_fraco: () => "Ponto Fraco: o efeito tem uma fraqueza que anula o poder quando atingida.",
  retroalimentacao: () => "Retroalimentação: você também sofre o efeito (lembrete automático no registro).",
  peculiaridade: () => "Peculiaridade: o efeito tem uma limitação peculiar combinada com o mestre.",
};
export function regraDoMod(id, vezes, valor, grad, ctx) {
  const f = REGRAS[id];
  return f ? f(vezes || 1, valor, grad, ctx) : null;
}
Object.assign(REGRAS, {
  concentracao_afl: () => "Concentração (Aflição): o alvo fica afetado enquanto você se concentra.",
  condicao_extra: () => "Condição Extra: o 1º grau aplica duas condições.",
  cumulativo_afl: () => "Cumulativo: falhas repetidas somam graus.", cumulativo_nul: () => "Cumulativo: nulificações repetidas somam.", cumulativo_lm: () => "Cumulativo: leituras repetidas somam.",
  resistencia_alt_afl: () => "Resistência Alternativa: o alvo pode resistir com outro salvamento.",
  grau_limitado_afl: (n) => `Grau Limitado: a aflição só chega até o grau ${3 - (n || 1)}.`, grau_limitado_nul: () => "Grau Limitado: o efeito só chega a graus limitados.",
  recuperacao_instantanea: () => "Recuperação Instantânea: o alvo se recupera sem ação após um turno.",
  sustentado_afl: () => "Sustentado: a aflição dura enquanto você sustentar.",
  afeta_outros_cam: () => "Afeta Outros: camufla outra pessoa.", ataque_cam: () => "Ataque: exige acerto para camuflar um alvo.", sentido_extra: (n) => `Sentido Extra: +${n} sentido(s) camuflado(s).`,
  mesclar: () => "Mesclar: só camufla em certos ambientes.", parcial: () => "Parcial: camuflagem parcial.", passiva: () => "Passiva: sempre ativa, sem controle.",
  explosao: () => "Explosão: +3 no atributo até o início do próximo turno; depois fica Fatigado.", brutal: () => "Brutal: +2 na CD por ponto ao acertar crítico.",
  energizante: () => "Energizante: a cura também remove Fatigado/Exausto.", empatico: () => "Empático: você sofre o dano que cura.", temporario: () => "Temporário: a cura some depois de um tempo.",
  amplo: () => "Amplo: enfraquece um grupo de características.", persistente: () => "Persistente: o enfraquecimento não se recupera sozinho.", simultaneo: (n) => `Simultâneo: afeta ${n} característica(s) a mais.`,
  concentracao_nul: () => "Concentração: o nulificar dura enquanto você se concentra.",
  quicar: (n) => `Quicar ${n}: divide o salto em ${n + 1} saltos.`, poder_total: () => "Poder Total: o salto gasta todo o seu turno.",
  continuo_criar: () => "Contínuo: os objetos permanecem sem sustentar.", dimensional: () => "Dimensional: cria uma dimensão de bolso.", estacionario: () => "Estacionário: o objeto não pode ser movido.", impenetravel: (n) => `Impenetrável ${n}: +${n} de resistência.`, proporcional: () => "Proporcional: resistência baseada no volume.",
  mudar_velocidade: () => "Mudar a Velocidade: chega parado.", portal: () => "Portal: abre um portal sustentado.",
  horda: (n) => `Horda ${n}: ${2 ** (n || 1)} criaturas com a fração dos pontos.`, ativo: () => "Ativo: a criatura age com ação completa.", atitude: () => "Atitude: a criatura pode desobedecer.",
  alcance_invocar: (n) => `Alcance ${n}: invoca mais longe.`, persistente_inv: () => "Persistente: a criatura permanece sem sustentar.",
  quase_material: () => "Quase Material: a ilusão causa/sofre efeitos físicos limitados.",
  metade_efeito: () => "Metade do Efeito: imunidade apenas a metade do efeito.",
  rapida: () => "Rápida: comunicação sem ação.", seletiva_com: () => "Seletiva: escolhe quem escuta.", sutil_com: () => "Sutil: difícil de perceber.", unilateral: () => "Unilateral: só você fala.",
  azar: () => "Azar: força re-rolagens do alvo.", sortudo: () => "Sortudo: bônus de sorte.",
  musculos_densos: () => "Músculos Densos: tamanho com mais força.", so_tamanho: () => "Só Tamanho: sem bônus de Força.", pesado_demais: () => "Pesado Demais: peso aumenta junto.",
  que_vai_volta: () => "O Que Vai Volta: a deflexão devolve o projétil.", multitarefas: (n) => `Multitarefas ${n}: ${n} deflexões por turno.`,
  forca_normal: () => "Força Normal: encolhido mantém a Força.", encolhedor: () => "Encolhedor: pode encolher outros.",
  camuflagem_mo: () => "Camuflagem: os objetos movidos ficam camuflados.", dano_mo: () => "Dano: objetos movidos causam dano.", dividido_mo: () => "Dividido: move com mais precisão em vários alvos.",
  impulso: () => "Impulso: arremessa com mais força.", preciso_mo: () => "Preciso: manipulação fina.", veloz: () => "Veloz: objetos se movem mais rápido.", concentrado: () => "Concentrado: precisa se concentrar.", direcao_limitada: () => "Direção Limitada: move só em uma direção.",
  aquatico: () => "Aquático: voo também na água.", asas: () => "Asas: o voo depende de asas.", levitacao: () => "Levitação: só vertical.", planar: () => "Planar: só plana.", plataforma: () => "Plataforma: voo sobre uma plataforma.",
  continuo_rap: () => "Contínuo: a rapidez dura sem sustentar.", permanente_rap: () => "Permanente: rapidez sempre ativa.",
  camuflagem_sr: () => "Camuflagem: o sentido remoto fica camuflado.", forma_astral: () => "Forma Astral: o sentido atravessa objetos.", simultanea: () => "Simultânea: sentidos remoto e normal juntos.",
  ligacao_sensorial: () => "Ligação Sensorial: sente o que o alvo sente.",
  azarado: () => "Azarado: você sofre o azar.", ataque_sorte: () => "Ataque: exige acerto.", resistir_sorte: () => "Resistir: o alvo pode resistir.",
});
