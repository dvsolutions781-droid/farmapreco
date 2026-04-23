import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function gerarIcone(tamanho, arquivo) {
  const canvas = createCanvas(tamanho, tamanho);
  const ctx = canvas.getContext('2d');

  // Fundo azul
  ctx.fillStyle = '#2563EB';
  ctx.roundRect(0, 0, tamanho, tamanho, tamanho * 0.2);
  ctx.fill();

  // Ícone de código de barras simplificado
  const barras = [0.2, 0.27, 0.33, 0.42, 0.48, 0.57, 0.63, 0.72];
  const larguras = [0.05, 0.03, 0.07, 0.03, 0.05, 0.03, 0.07, 0.05];
  ctx.fillStyle = 'white';
  barras.forEach((x, i) => {
    ctx.fillRect(
      tamanho * x,
      tamanho * 0.25,
      tamanho * larguras[i],
      tamanho * 0.5
    );
  });

  writeFileSync(`public/${arquivo}`, canvas.toBuffer('image/png'));
  console.log(`Gerado: public/${arquivo}`);
}

gerarIcone(192, 'icon-192.png');
gerarIcone(512, 'icon-512.png');
