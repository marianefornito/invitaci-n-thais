/* =========================================================
   CONFIGURACIÓN — lo único que necesitas cambiar
   ========================================================= */
const CONFIG = {
  telefono: "525534613582", // 52 = México + tu número (sin espacios ni +)
  fecha: "¡Hoy! Miércoles 4 de noviembre",              // Ej: "Viernes 7 de noviembre". Vacío = no se muestra
  mensajes: {
    obvio: "¡OBVIO, NO ME LO PIERDO! Nos vemos a las 6pm",
    si:    "¡Sí! Ahí estaré a las 6pm",
    otro:  "Hoy no puedo ¿lo dejamos para otro día?"
  }
};

/* ===== Mostrar la fecha (si la escribiste) ===== */
document.getElementById("fecha").textContent = CONFIG.fecha;

/* =========================================================
   1. BRILLITOS (dibujados en un <canvas>)
   ========================================================= */
const canvas = document.getElementById("brillos");
const ctx = canvas.getContext("2d");
let brillos = [];

function ajustarCanvas() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
addEventListener("resize", ajustarCanvas);
ajustarCanvas();

function crearBrillo(x, y, explosion = false) {
  const angulo = Math.random() * Math.PI * 2;
  const fuerza = explosion ? 2 + Math.random() * 6 : 0;
  return {
    x: x ?? Math.random() * innerWidth,
    y: y ?? Math.random() * innerHeight,
    vx: Math.cos(angulo) * fuerza,
    vy: explosion ? Math.sin(angulo) * fuerza : -0.2 - Math.random() * 0.4,
    tam: 2 + Math.random() * 5,
    vida: 1,
    gira: Math.random() * Math.PI,
    color: ["#fff", "#ffd36e", "#ffd6de"][Math.floor(Math.random() * 3)],
    explosion
  };
}

// Dibuja una estrellita de 4 puntas
function estrella(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.gira);
  ctx.globalAlpha = b.vida;
  ctx.fillStyle = b.color;
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? b.tam : b.tam * 0.3;
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.fill();
  ctx.restore();
}

function animar() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (brillos.length < 70) brillos.push(crearBrillo());

  brillos.forEach(b => {
    b.x += b.vx;
    b.y += b.vy;
    b.gira += 0.03;
    if (b.explosion) { b.vy += 0.08; b.vida -= 0.012; }
    else b.vida = 0.5 + Math.sin(Date.now() / 300 + b.x) * 0.5; // parpadeo
    estrella(b);
  });
  brillos = brillos.filter(b => b.vida > 0 && b.y > -20 && b.y < innerHeight + 20);
  requestAnimationFrame(animar);
}
animar();

function lluviaDeBrillos(x, y, cantidad = 80) {
  for (let i = 0; i < cantidad; i++) brillos.push(crearBrillo(x, y, true));
}

// Un poquito de brillo donde toques
addEventListener("pointerdown", e => lluviaDeBrillos(e.clientX, e.clientY, 12));

/* =========================================================
   2. MÚSICA RELAJANTE (generada con Web Audio, sin archivos)
   ========================================================= */
let audio = null;
let sonando = false;
let intervalo = null;

// Acordes suaves (notas en Hz): Fmaj7 – Em7 – Dm7 – Cmaj7
const acordes = [
  [174.6, 220.0, 261.6, 329.6],
  [164.8, 196.0, 246.9, 293.7],
  [146.8, 174.6, 220.0, 261.6],
  [130.8, 164.8, 196.0, 246.9]
];
let paso = 0;

function nota(freq, inicio, duracion, volumen, tipo = "sine") {
  const osc = audio.createOscillator();
  const gan = audio.createGain();
  osc.type = tipo;
  osc.frequency.value = freq;
  gan.gain.setValueAtTime(0, inicio);
  gan.gain.linearRampToValueAtTime(volumen, inicio + duracion * 0.3);
  gan.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  osc.connect(gan).connect(audio.filtro);
  osc.start(inicio);
  osc.stop(inicio + duracion);
}

function tocarCompas() {
  const t = audio.currentTime;
  const acorde = acordes[paso % acordes.length];
  // Colchón de fondo
  acorde.forEach(f => nota(f, t, 5, 0.05, "triangle"));
  // Cajita musical encima (una octava arriba)
  acorde.forEach((f, i) => nota(f * 4, t + i * 0.5 + 0.2, 1.8, 0.03));
  paso++;
}

function prenderMusica() {
  if (!audio) {
    audio = new AudioContext();
    audio.filtro = audio.createBiquadFilter();
    audio.filtro.type = "lowpass";
    audio.filtro.frequency.value = 1800;
    audio.filtro.connect(audio.destination);
  }
  audio.resume();
  tocarCompas();
  intervalo = setInterval(tocarCompas, 4000);
  sonando = true;
  botonMusica.classList.add("sonando");
}

function apagarMusica() {
  clearInterval(intervalo);
  audio.suspend();
  sonando = false;
  botonMusica.classList.remove("sonando");
}

const botonMusica = document.getElementById("musica");
botonMusica.addEventListener("click", () => (sonando ? apagarMusica() : prenderMusica()));

/* =========================================================
   3. ABRIR EL SOBRE
   ========================================================= */
const sobre = document.getElementById("abrir");
sobre.addEventListener("click", () => {
  sobre.classList.add("abierto");
  if (!sonando) prenderMusica(); // los navegadores solo dejan sonar música tras un clic
  lluviaDeBrillos(innerWidth / 2, innerHeight / 2, 120);
  setTimeout(() => {
    document.getElementById("sobre").classList.remove("activa");
    document.getElementById("invitacion").classList.add("activa");
  }, 700);
});

/* =========================================================
   4. RESPUESTAS → WhatsApp
   ========================================================= */
document.querySelectorAll("[data-respuesta]").forEach(boton => {
  boton.addEventListener("click", e => {
    const tipo = boton.dataset.respuesta;
    if (tipo !== "otro") lluviaDeBrillos(e.clientX, e.clientY, 150);

    const texto = encodeURIComponent("Hola Mariane, " + CONFIG.mensajes[tipo]);
    const url = `https://wa.me/${CONFIG.telefono}?text=${texto}`;

    // Esperamos un poquito para que se vean los brillitos.
    // Usamos location.href (no window.open) porque iPhone bloquea
    // ventanas nuevas abiertas con retraso.
    setTimeout(() => { location.href = url; }, 600);
  });
});
