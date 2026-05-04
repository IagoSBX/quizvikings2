/* ==========================================
   CALCULEI QUIZ — APP LOGIC
   ========================================== */

// ─── STATE ────────────────────────────────
const S = {
  banco: null,
  perguntas: [],
  atual: 0,
  respostas: [],
  nome: '',
  materia: '',
  dificuldade: '',
  paid: false,
};

const LETRAS = ['A','B','C','D'];
const MAT_LABELS = {
  biologia:   '🧬 Biologia',
  matematica: '📐 Matemática',
  fisica:     '⚛️ Física',
  historia:   '📜 História',
  portugues:  '📚 Português',
  geografia:  '🌎 Geografia',
};
const DIFF_LABELS = { facil:'Fácil', medio:'Médio', dificil:'Difícil' };

// ─── INIT ─────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadBanco();
  renderRanking();
  checkPaid();
  document.getElementById('loading-screen').style.display = 'none';
  showScreen('home');
});

async function loadBanco() {
  try {
    const r = await fetch('data/perguntas.json');
    S.banco = await r.json();
  } catch(e) {
    S.banco = {};
    toast('⚠️ Banco offline. Verificando conexão...');
  }
}

function checkPaid() {
  S.paid = localStorage.getItem('quiz_vikings_paid') === '1';
  const b = document.getElementById('btn-premium');
  if (b) b.textContent = S.paid ? '✅ App Ativado' : '⭐ Obter App R$20';
}

// ─── SCREENS ──────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sc = document.getElementById('screen-' + id);
  if (sc) sc.classList.add('active');
  const nb = document.querySelector(`[data-nav="${id}"]`);
  if (nb) nb.classList.add('active');
  window.scrollTo(0, 0);
}

// ─── HOME / START ──────────────────────────
function iniciar() {
  const nome = document.getElementById('nome').value.trim();
  if (!nome) { toast('Digite seu nome!'); return; }

  const mat  = document.getElementById('sel-materia').value;
  const diff = document.getElementById('sel-dific').value;

  if (!S.banco[mat] || !S.banco[mat][diff]) {
    toast('Matéria não disponível!'); return;
  }

  S.nome       = nome;
  S.materia    = mat;
  S.dificuldade = diff;

  // shuffle + take 10
  const pool = [...S.banco[mat][diff]];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  S.perguntas = pool.slice(0, Math.min(10, pool.length));
  S.atual = 0;
  S.respostas = new Array(S.perguntas.length).fill(null);

  renderQuestao();
  showScreen('quiz');
}

// ─── QUIZ ─────────────────────────────────
function renderQuestao() {
  const q   = S.perguntas[S.atual];
  const tot = S.perguntas.length;

  // progress
  const pct = (S.atual / tot) * 100;
  document.getElementById('q-progress').style.width = pct + '%';
  document.getElementById('q-counter').textContent = `Pergunta ${S.atual + 1} de ${tot}`;

  const acertos = S.respostas.slice(0, S.atual).filter((r, i) => r === S.perguntas[i].c).length;
  document.getElementById('q-score').textContent = `${acertos} ✓`;

  // chip
  document.getElementById('q-chip').textContent = MAT_LABELS[S.materia];

  // question
  document.getElementById('q-text').textContent = q.p;

  // options
  const list = document.getElementById('q-options');
  list.innerHTML = '';
  q.o.forEach((op, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    if (S.respostas[S.atual] === i) btn.classList.add('selected');
    btn.innerHTML = `<span class="opt-letter">${LETRAS[i]}</span><span>${op}</span>`;
    btn.onclick = () => selecionarOpcao(i);
    list.appendChild(btn);
  });

  // nav
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  prev.disabled = S.atual === 0;
  next.textContent = S.atual === tot - 1 ? 'Finalizar ✓' : 'Próximo →';
}

function selecionarOpcao(i) {
  S.respostas[S.atual] = i;
  renderQuestao();
}

function proximaQuestao() {
  if (S.respostas[S.atual] === null) { toast('Selecione uma alternativa!'); return; }
  if (S.atual < S.perguntas.length - 1) {
    S.atual++;
    renderQuestao();
  } else {
    finalizarQuiz();
  }
}

function questaoAnterior() {
  if (S.atual > 0) { S.atual--; renderQuestao(); }
}

// ─── RESULT ───────────────────────────────
function finalizarQuiz() {
  let acertos = 0;
  S.perguntas.forEach((q, i) => { if (S.respostas[i] === q.c) acertos++; });

  const tot = S.perguntas.length;
  const pct = acertos / tot;

  // ring
  const ring = document.getElementById('r-ring');
  ring.className = 'score-ring ' + (pct >= .7 ? 'hi' : pct >= .4 ? 'mid' : 'low');
  document.getElementById('r-num').textContent = acertos;
  document.getElementById('r-of').textContent  = `de ${tot}`;

  // name + msg
  document.getElementById('r-name').textContent = S.nome;
  const msgs = pct >= .7
    ? ['🔥 Incrível! Você manda muito!', '🎯 Excelente resultado!', '🏆 Quase perfeito!']
    : pct >= .4
    ? ['👍 Bom esforço! Continue!', '📖 Pode melhorar, vai lá!']
    : ['💪 Não desista! Tente novamente.', '📚 Revise o conteúdo e volte!'];
  document.getElementById('r-msg').textContent =
    msgs[Math.floor(Math.random() * msgs.length)] +
    ` — ${acertos}/${tot} em ${MAT_LABELS[S.materia]}`;

  // summary
  const sum = document.getElementById('r-summary');
  sum.innerHTML = '';
  S.perguntas.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'summary-item';
    let html = `<div class="summary-q">${i+1}. ${q.p}</div>`;
    q.o.forEach((op, j) => {
      let cls = 's-norm';
      let icon = '';
      if (j === q.c) { cls = 's-ok'; icon = '✓ '; }
      else if (j === S.respostas[i]) { cls = 's-err'; icon = '✗ '; }
      html += `<div class="sum-opt ${cls}">${icon}${LETRAS[j]}. ${op}</div>`;
    });
    div.innerHTML = html;
    sum.appendChild(div);
  });

  // save ranking
  salvarRanking(acertos, tot);
  showScreen('result');
}

// ─── RANKING ──────────────────────────────
function salvarRanking(pts, tot) {
  const r = getRanking();
  r.push({
    nome: S.nome,
    pts, tot,
    mat:  MAT_LABELS[S.materia],
    diff: DIFF_LABELS[S.dificuldade],
    data: new Date().toLocaleDateString('pt-BR'),
  });
  r.sort((a, b) => (b.pts/b.tot) - (a.pts/a.tot));
  localStorage.setItem('quiz_vikings_ranking', JSON.stringify(r.slice(0, 30)));
  renderRanking();
  renderRankingScreen();
}

function getRanking() {
  return JSON.parse(localStorage.getItem('quiz_vikings_ranking') || '[]');
}

function renderRanking() {
  const r   = getRanking();
  const el  = document.getElementById('home-ranking');
  if (!el) return;
  if (!r.length) { el.innerHTML = '<div class="rank-empty">Nenhum resultado ainda. Seja o primeiro! 🚀</div>'; return; }
  el.innerHTML = r.slice(0, 6).map((item, i) => `
    <div class="ranking-item">
      <span class="rank-num ${['r1','r2','r3'][i] || 'rn'}">${i+1}</span>
      <span class="rank-name">${item.nome}</span>
      <span class="rank-meta">${item.mat} • ${item.diff}</span>
      <span class="rank-score">${item.pts}/${item.tot}</span>
    </div>
  `).join('');
}

function renderRankingScreen() {
  const r  = getRanking();
  const el = document.getElementById('full-ranking');
  if (!el) return;
  if (!r.length) { el.innerHTML = '<div class="rank-empty">Nenhum resultado ainda.</div>'; return; }
  el.innerHTML = r.map((item, i) => `
    <div class="ranking-item">
      <span class="rank-num ${['r1','r2','r3'][i] || 'rn'}">${i+1}</span>
      <span class="rank-name">${item.nome}</span>
      <span class="rank-meta">${item.mat} • ${item.diff} • ${item.data}</span>
      <span class="rank-score">${item.pts}/${item.tot}</span>
    </div>
  `).join('');
}

function abrirRanking() {
  renderRankingScreen();
  showScreen('ranking');
}

// ─── PAYMENT ──────────────────────────────
let selectedMethod = '';

function abrirPagamento() {
  selectedMethod = '';
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  document.getElementById('pix-area').classList.remove('show');
  document.getElementById('card-area').classList.remove('show');
  showScreen('payment');
}

function selecionarMetodo(method) {
  selectedMethod = method;
  document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  document.querySelector(`[data-method="${method}"]`).classList.add('selected');

  document.getElementById('pix-area').classList.remove('show');
  document.getElementById('card-area').classList.remove('show');

  if (method === 'pix')  document.getElementById('pix-area').classList.add('show');
  if (method === 'card') document.getElementById('card-area').classList.add('show');
}

function copiarChave() {
  const chave = 'quizvikings@pagamentos.com.br';
  navigator.clipboard?.writeText(chave).catch(() => {});
  toast('✅ Chave PIX copiada!');
}

function confirmarPagamento() {
  if (!selectedMethod) { toast('Selecione uma forma de pagamento!'); return; }
  // Simulate payment confirmation
  document.getElementById('modal-confirm').classList.add('show');
}

function fecharModal() {
  document.getElementById('modal-confirm').classList.remove('show');
}

function finalizarPagamento() {
  fecharModal();
  localStorage.setItem('quiz_vikings_paid', '1');
  S.paid = true;
  checkPaid();
  showScreen('success');
}

// ─── TOAST ────────────────────────────────
function toast(msg, duration = 2800) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

// ─── REINICIAR ─────────────────────────────
function reiniciar() {
  S.perguntas = []; S.atual = 0; S.respostas = [];
  showScreen('home');
}
