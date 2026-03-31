// ================= TEXTO ANIMADO =================
document.addEventListener("DOMContentLoaded", function () {

  const textos = [
    "Kelvin Peres",
    "Desenvolvedor Web",
    "Front-End Developer"
  ];

  let i = 0;
  let j = 0;
  let atual = "";
  let apagando = false;

  function animarTexto() {
    const elemento = document.getElementById("digitando");
    if (!elemento) return;

    if (!apagando) {
      atual = textos[i].substring(0, j++);
    } else {
      atual = textos[i].substring(0, j--);
    }

    elemento.innerHTML = atual;

    if (!apagando && j === textos[i].length + 1) {
      apagando = true;
      setTimeout(animarTexto, 1500);
      return;
    }

    if (apagando && j === 0) {
      apagando = false;
      i = (i + 1) % textos.length;
    }

    setTimeout(animarTexto, apagando ? 50 : 100);
  }

  animarTexto();
});

// ================= MAQUININHA =================

let state = "IDLE"; // IDLE, VALOR, METODO, PROCESSANDO, APROVADO, PIX
let valor = "";

// ================= CONFIGURAÇÃO DO SEU PIX =================
// Coloque aqui sua chave exata!
// Se for telefone celular, precisa do +55 (Ex: "+5511974257887")
// Se for e-mail, coloque o e-mail: "kelvinperes99@hotmail.com"
// Se for CPF, coloque só os números: "12345678909"
// Se usar chave aleatória, cole ela inteira.
const MINHA_CHAVE_PIX = "+5511974257887"; 
const MEU_NOME_PIX = "Kelvin Peres";
const MINHA_CIDADE_PIX = "Sao Paulo";
// ==========================================================

// Para simular o som da maquininha quando aperta a tecla
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch(e) {}
}

// Atualiza tela
function atualizarDisplay() {
  let displayEl = document.getElementById("display");
  if (!displayEl) return;

  let numero = valor || "0";
  let formatado = (parseInt(numero) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  if (state === "IDLE") {
    displayEl.innerHTML = `<div style="font-size: 28px;">BEM-VINDO!</div><div style="font-size: 20px; margin-top:10px;">Insira um valor</div>`;
  } else if (state === "VALOR") {
    displayEl.innerHTML = `<div style="font-size: 20px;">VALOR:</div><div style="font-size: 32px;">${formatado}</div>`;
  } else if (state === "METODO") {
    displayEl.innerHTML = `<div style="font-size: 22px; text-align: left; line-height: 1.2;">1-CRÉDITO<br>2-DÉBITO<br>3-PIX</div>`;
  } else if (state === "PROCESSANDO") {
    displayEl.innerHTML = `<div class="blink">PROCESSANDO...</div>`;
  } else if (state === "APROVADO") {
    displayEl.innerHTML = `<div>TRANSAÇÃO</div><div>APROVADA</div>`;
  } else if (state === "PIX") {
    displayEl.innerHTML = `<div style="font-size: 20px;">QR CODE</div><div>GERADO</div>`;
  }
}

// Digitar número
function digitar(num) {
  beep();
  let status = document.getElementById("status");
  if (status) status.innerText = "";

  if (state === "IDLE") {
    state = "VALOR";
    valor += num;
  } else if (state === "VALOR") {
    if (valor.length < 10) {
      if (valor === "" && num === 0) return; // evita zeros à esquerda solitários
      valor += num;
    }
  } else if (state === "METODO") {
    if (num === 1) { // CRÉDITO
      iniciarProcessamento();
    } else if (num === 2) { // DÉBITO
      iniciarProcessamento();
    } else if (num === 3) { // PIX
      gerarPix();
    }
  }
  atualizarDisplay();
}

// Limpar (Botão vermelho C)
function limpar() {
  beep();
  valor = "";
  state = "IDLE";
  
  let qrCodeImg = document.getElementById("qrcode-pix");
  if (qrCodeImg) qrCodeImg.remove();
  
  let teclado = document.querySelector(".teclado");
  if (teclado) teclado.style.display = "grid";
  
  let status = document.getElementById("status");
  if (status) status.innerText = "";

  atualizarDisplay();
}

// Pagar (Botão verde OK)
function pagar() {
  beep();
  let status = document.getElementById("status");
  if (!status) return;

  if (state === "VALOR") {
    let valorNumerico = parseInt(valor || "0");
    if (valorNumerico <= 0) {
      status.innerText = "Digite um valor válido";
      status.style.color = "red";
      setTimeout(() => { if(status) status.innerText = ""; }, 2000);
      return;
    }
    state = "METODO";
    atualizarDisplay();
  }
}

function iniciarProcessamento() {
  state = "PROCESSANDO";
  atualizarDisplay();
  
  setTimeout(() => {
    state = "APROVADO";
    atualizarDisplay();
    // Apito longo de aprovado
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch(e) {}
    
    // Reseta automaticamente a maquininha depois de pronta
    setTimeout(() => {
        limpar();
    }, 3000);
  }, 2500);
}

// ======================== FUNÇÕES GERADORAS DO PIX EMV ========================

// Calcula o digito verificador de integridade CRC16 para o banco aceitar
function calcularCRC16(payload) {
  let polinomio = 0x1021;
  let resultado = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    resultado ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((resultado & 0x8000) !== 0) {
        resultado = (resultado << 1) ^ polinomio;
      } else {
        resultado = (resultado << 1);
      }
      resultado &= 0xFFFF; 
    }
  }
  return resultado.toString(16).toUpperCase().padStart(4, '0');
}

function formatarCampoPix(id, campo) {
  let tamanho = campo.length.toString().padStart(2, '0');
  return id + tamanho + campo;
}

function montarPayloadPix(chave, nome, cidade, valorStr) {
  let payloadFormat = formatarCampoPix("00", "01");
  let merchantAccountInfo = formatarCampoPix("00", "BR.GOV.BCB.PIX") + formatarCampoPix("01", chave);
  let merchantAccount = formatarCampoPix("26", merchantAccountInfo);
  let merchantCategory = formatarCampoPix("52", "0000");
  let transactionCurrency = formatarCampoPix("53", "986");
  let transactionAmount = formatarCampoPix("54", valorStr);
  let countryCode = formatarCampoPix("58", "BR");
  
  // Nomes sem acentos de preferência, máx 25 e 15 chars.
  let merchantName = formatarCampoPix("59", nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25));
  let merchantCity = formatarCampoPix("60", cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15));
  
  let txid = formatarCampoPix("05", "***"); 
  let additionalData = formatarCampoPix("62", txid);
  
  let stringParcial = payloadFormat + merchantAccount + merchantCategory + transactionCurrency + transactionAmount + countryCode + merchantName + merchantCity + additionalData + "6304";
  let crc = calcularCRC16(stringParcial);
  
  return stringParcial + crc;
}

// ==============================================================================

function gerarPix() {
  state = "PIX";
  atualizarDisplay();
  
  let valorNumerico = parseInt(valor || "0");
  let status = document.getElementById("status");
  if (status) {
    status.innerText = "Pague usando o app do seu banco.";
    status.style.color = "green";
  }

  // Pegamos o valor monetário real, dividido por 100 com 2 casas
  let formatadoStr = (valorNumerico / 100).toFixed(2);
  
  // Chama o gerador passando as configurações definidas lá em cima
  let pixDataReal = montarPayloadPix(MINHA_CHAVE_PIX, MEU_NOME_PIX, MINHA_CIDADE_PIX, formatadoStr);
  
  // Essa API converte diretamente a string emétrica de dados para uma imagem QR
  let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pixDataReal)}`;
  
  let tela = document.querySelector(".tela");
  let teclado = document.querySelector(".teclado");
  
  if (teclado) teclado.style.display = "none";
  
  let qrCodeImg = document.getElementById("qrcode-pix");
  if (!qrCodeImg) {
    qrCodeImg = document.createElement("img");
    qrCodeImg.id = "qrcode-pix";
    qrCodeImg.style.width = "150px";
    qrCodeImg.style.height = "150px";
    qrCodeImg.style.margin = "10px auto";
    qrCodeImg.style.display = "block";
    qrCodeImg.style.borderRadius = "5px";
    tela.insertBefore(qrCodeImg, status);
  }
  // Exibicao final!
  qrCodeImg.src = qrUrl;
}

// Inicializa
document.addEventListener("DOMContentLoaded", atualizarDisplay);