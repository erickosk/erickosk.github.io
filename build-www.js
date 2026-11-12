// Copia los archivos estáticos a www/ (carpeta que usa Capacitor y que se ignora en git).
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..'), destino = path.join(raiz, 'www');
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
for (const f of ['index.html', 'logo.svg', 'manifest.webmanifest', 'sw.js']) fs.copyFileSync(path.join(raiz, f), path.join(destino, f));
fs.cpSync(path.join(raiz, 'icons'), path.join(destino, 'icons'), { recursive: true });
console.log('www/ listo');
