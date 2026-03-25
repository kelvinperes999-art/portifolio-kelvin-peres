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
      setTimeout(animarTexto, 1500); // Pausa ao terminar de escrever
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