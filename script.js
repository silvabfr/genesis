/* ===== Projeto Gênesis — scripts ===== */
// Número do WhatsApp que receberá a matrícula (formato internacional, sem + ou espaços)
const WHATSAPP = "5521998415003";

/* --- Menu mobile (hambúrguer) --- */
const btnMenu = document.querySelector(".hamburguer");
const menu = document.querySelector(".menu");
if (btnMenu) {
  btnMenu.addEventListener("click", () => {
    const aberto = menu.classList.toggle("aberto");
    btnMenu.classList.toggle("aberto", aberto);
    btnMenu.setAttribute("aria-expanded", aberto);
  });
  menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    menu.classList.remove("aberto"); btnMenu.classList.remove("aberto");
  }));
}

/* --- Animação de entrada ao rolar a página --- */
const alvos = document.querySelectorAll(".revela");
if ("IntersectionObserver" in window) {
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("visivel"); obs.unobserve(e.target); }
  }), { threshold: .12 });
  alvos.forEach(el => obs.observe(el));
} else alvos.forEach(el => el.classList.add("visivel"));

/* --- Formulário de matrícula (3 etapas) --- */
const form = document.getElementById("form-matricula");
if (form) {
  const etapas = [...form.querySelectorAll(".etapa")];
  const barra = document.getElementById("barra");
  const rotulo = document.getElementById("rotulo-etapa");
  let atual = 0;

  // Máscara simples de telefone: (21) 99999-9999
  form.querySelectorAll("input[type=tel]").forEach(i => i.addEventListener("input", () => {
    let v = i.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2, v.length > 10 ? 7 : 6)}-${v.slice(v.length > 10 ? 7 : 6)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    i.value = v;
  }));

  // Caixas de marcar de escolha única: ao marcar uma, as outras do mesmo grupo são desmarcadas
  const textoAviso = document.getElementById("aviso-turma");
  const textoOpcao = document.getElementById("opcao-turma");
  form.querySelectorAll("input.unico").forEach(cb => cb.addEventListener("change", () => {
    if (cb.checked) form.querySelectorAll(`input.unico[name="${cb.name}"]`).forEach(o => { if (o !== cb) o.checked = false; });
    if (cb.name === "turma") { // atualiza os textos que citam a turma escolhida
      const t = form.querySelector('input[name="turma"]:checked');
      textoAviso.textContent = t ? t.value : "a turma que você escolher";
      textoOpcao.textContent = t ? t.value : "—";
    }
  }));

  // Marca/desmarca erro em um bloco
  const marca = (el, ok) => { el.closest(".bloco").classList.toggle("invalido", !ok); return ok; };

  // Valida os campos de uma etapa
  function validaEtapa(n) {
    let ok = true, primeiro = null;
    etapas[n].querySelectorAll("[data-req]").forEach(c => {
      let valido = true;
      if (c.type === "checkbox" || c.type === "radio") valido = !!form.querySelector(`input[name="${c.name}"]:checked`);
      else {
        const v = c.value.trim();
        valido = v !== "";
        if (valido && c.type === "email") valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (valido && c.type === "tel") valido = /^\d{10,11}$/.test(v.replace(/\D/g, ""));
      }
      if (!marca(c, valido)) { ok = false; primeiro = primeiro || c; }
    });
    if (primeiro) primeiro.focus();
    return ok;
  }

  function mostra(n) {
    atual = n;
    etapas.forEach((e, i) => e.classList.toggle("ativa", i === n));
    barra.style.width = ((n + 1) / etapas.length * 100) + "%";
    rotulo.textContent = `Página ${n + 1} de ${etapas.length}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  form.querySelectorAll("[data-avancar]").forEach(b => b.addEventListener("click", () => { if (validaEtapa(atual)) mostra(atual + 1); }));
  form.querySelectorAll("[data-voltar]").forEach(b => b.addEventListener("click", () => mostra(atual - 1)));
  form.querySelectorAll("[data-limpar]").forEach(b => b.addEventListener("click", () => { form.reset(); mostra(0); }));

  /* ===== Envio pelo WhatsApp =====
     A mensagem é gerada internamente (não existe campo editável para ela).
     Os marcadores {{...}} do modelo são trocados pelos valores digitados nos campos. */
  const MODELO_MENSAGEM = [
    "*MATRÍCULA 2027 — PROJETO GÊNESIS*", "",
    "*Nome completo:* {{nome}}",
    "*Data de nascimento:* {{nascimento}}",
    "*E-mail:* {{email}}",
    "*Bairro:* {{bairro}}",
    "*WhatsApp do estudante:* {{tel_aluno}}",
    "*WhatsApp do responsável:* {{tel_resp}}",
    "*Tamanho da camiseta:* {{camisa}}",
    "*Escolaridade:* {{escolaridade}}",
    "*Onde iniciou/concluiu o Ensino Médio:* {{tipo_escola}}",
    "*Curso de interesse:* {{curso}}",
    "*Como conheceu o Projeto Gênesis:* {{origem}}"
  ].join("\n");

  // Troca cada marcador {{campo}} pelo valor preenchido no formulário
  function montarMensagem() {
    const d = new FormData(form);
    const valores = Object.fromEntries(d.entries());
    if (valores.nascimento) valores.nascimento = valores.nascimento.split("-").reverse().join("/"); // AAAA-MM-DD -> DD/MM/AAAA
    valores.curso = [valores.curso, valores.curso_outro].map(x => (x || "").trim()).filter(Boolean).join(" — ") || "Não informado";
    return MODELO_MENSAGEM.replace(/\{\{(\w+)\}\}/g, (_, campo) => String(valores[campo] ?? "").trim());
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    // Valida TODAS as páginas antes de abrir o WhatsApp; se houver erro, volta para a página com o problema
    for (let i = 0; i < etapas.length; i++) {
      if (!validaEtapa(i)) { if (i !== atual) mostra(i); validaEtapa(i); return; }
    }
    const mensagem = montarMensagem();
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
    document.getElementById("link-wa").href = url; // botão de reserva na tela final

    form.style.display = "none";
    document.querySelector(".progresso").style.display = "none";
    document.getElementById("sucesso").classList.add("mostra");
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.open(url, "_blank"); // abre o WhatsApp já com a mensagem preenchida
  });
}