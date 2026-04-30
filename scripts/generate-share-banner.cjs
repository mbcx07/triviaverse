// Genera banner 1200x630 para compartir en redes sociales
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Fondo espacial
const gradient = ctx.createLinearGradient(0, 0, 0, H);
gradient.addColorStop(0, '#0f0c29');
gradient.addColorStop(0.5, '#302b63');
gradient.addColorStop(1, '#24243e');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, W, H);

// Estrellas aleatorias
ctx.fillStyle = '#ffffff';
for (let i = 0; i < 200; i++) {
  const x = Math.random() * W;
  const y = Math.random() * H;
  const r = Math.random() * 2 + 0.5;
  const alpha = Math.random() * 0.8 + 0.2;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
ctx.globalAlpha = 1;

// Algunas estrellas grandes (sparkle)
const sparklePositions = [
  { x: 100, y: 80 }, { x: 1050, y: 120 }, { x: 600, y: 50 },
  { x: 200, y: 500 }, { x: 950, y: 480 }, { x: 80, y: 300 }
];
sparklePositions.forEach(({ x, y }) => {
  ctx.fillStyle = '#FFD700';
  ctx.globalAlpha = 0.6;
  const s = 15;
  ctx.fillRect(x - s / 2, y - 2, s, 4);
  ctx.fillRect(x - 2, y - s / 2, 4, s);
});
ctx.globalAlpha = 1;

// Borde decorativo superior e inferior
const borderGrad = ctx.createLinearGradient(0, 0, W, 0);
borderGrad.addColorStop(0, '#7C4DFF');
borderGrad.addColorStop(0.5, '#1CB0F6');
borderGrad.addColorStop(1, '#FFD700');
ctx.fillStyle = borderGrad;
ctx.fillRect(0, 0, W, 4);
ctx.fillRect(0, H - 4, W, 4);

// Título TRIVIVERSO
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Sombra del título
ctx.shadowColor = 'rgba(28, 176, 246, 0.8)';
ctx.shadowBlur = 40;
ctx.font = 'bold 100px Arial';
ctx.fillStyle = '#FFFFFF';
ctx.fillText('TRIVIVERSO', W / 2, H / 2 - 30);

ctx.shadowBlur = 20;
ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
ctx.fillStyle = '#FFD700';
ctx.font = 'bold 90px Arial';
ctx.fillText('TRIVIVERSO', W / 2, H / 2 - 35);

ctx.shadowBlur = 0;
ctx.shadowColor = 'transparent';

// Subtítulo
ctx.font = 'bold 32px Arial';
ctx.fillStyle = '#FFFFFF';
ctx.fillText('5° y 6° Primaria', W / 2, H / 2 + 55);

// Línea decorativa debajo del subtítulo
const lineGrad = ctx.createLinearGradient(W / 2 - 150, 0, W / 2 + 150, 0);
lineGrad.addColorStop(0, 'transparent');
lineGrad.addColorStop(0.5, '#1CB0F6');
lineGrad.addColorStop(1, 'transparent');
ctx.strokeStyle = lineGrad;
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(W / 2 - 150, H / 2 + 85);
ctx.lineTo(W / 2 + 150, H / 2 + 85);
ctx.stroke();

// Texto inferior
ctx.font = '22px Arial';
ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
ctx.fillText('¡Crea tu equipo, invita a tus amigos y compite!', W / 2, H / 2 + 130);

// Emoji decorativos
ctx.font = '40px Arial';
ctx.fillText('🎮', W / 2 - 300, H / 2 + 65);
ctx.fillText('🏆', W / 2 + 300, H / 2 + 65);

// URL
ctx.font = '16px Arial';
ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
ctx.fillText('mbcx07.github.io/triviaverse', W / 2, H - 40);

const buffer = canvas.toBuffer('image/png');
const outPath = path.join(process.cwd(), 'web', 'public', 'share-banner.png');
fs.writeFileSync(outPath, buffer);
console.log('✅ Banner generado:', outPath);
