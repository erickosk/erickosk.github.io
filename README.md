# Resuelve Matemáticas

App web (PWA) para practicar matemáticas con problemas generados al azar, con procedimiento paso a paso, pistas, modo examen, repaso espaciado y rachas. Funciona sin conexión y puede empaquetarse como app de Android con Capacitor.

**Todo el código de la app está en un solo archivo (`index.html`)**, sin dependencias ni paso de compilación.

## Qué incluye

- **42 temas con generadores de problemas** en 17 categorías (aritmética, álgebra, geometría, trigonometría, cálculo, álgebra lineal, probabilidad, problemas de palabras…) más **retos de varios pasos**.
- **Dificultad:** Fácil (números más pequeños), Medio y Difícil (sin pistas, 90 s por problema, retos combinados y más XP).
- **Pistas** graduales, **procedimiento** completo y **ejemplo resuelto** la primera vez que abres un tema.
- **Modo examen** de 10 preguntas con resumen por tema.
- **Repaso espaciado:** los problemas que fallas vuelven *idénticos* a los 1, 3, 7 y 14 días (los problemas se generan con una semilla, así que se pueden reproducir exactamente).
- **Ruta de aprendizaje** de 7 etapas que se desbloquean al dominar la anterior (12 problemas y 70 % de precisión).
- **XP, niveles, racha diaria, meta diaria, logros e historial semanal.**
- **Respaldo:** exportar e importar el progreso en un archivo JSON.
- **Recordatorio diario** (notificación local en la app de Android; en la web solo un aviso al abrirla).
- **Ajustes:** tema claro/oscuro/automático, tamaño de texto, sonido, teclado numérico propio (con √, ^ y π).
- Accesibilidad básica: texto seleccionable, foco visible, `aria-live` en resultados, diálogos con foco y tecla Esc.

## Estructura

```
index.html              # toda la app (HTML + CSS + JS)
sw.js                   # service worker (modo sin conexión)
manifest.webmanifest    # datos de la PWA
logo.svg, icons/        # logo e íconos
tests/run.js            # pruebas automáticas (sin dependencias)
scripts/build-www.js    # copia los archivos a www/ para Capacitor
capacitor.config.json   # configuración de Capacitor
.github/workflows/      # CI (pruebas) y publicación en GitHub Pages
```

## Usarla en local

```bash
npm run serve        # abre http://localhost:8080
npm test             # ejecuta las pruebas
```

(El service worker solo se activa desde `http://localhost` o `https`, no abriendo el archivo con `file://`.)

## Publicar en GitHub Pages

1. Sube el repositorio a GitHub (rama `main`).
2. En **Settings → Pages**, elige **Source: GitHub Actions**.
3. Cada `push` a `main` ejecuta las pruebas y publica el sitio.

## Publicar una versión nueva

Sube el número de versión en **tres** sitios: `VERSION` en `index.html`, `VERSION` en `sw.js` y `version` en `package.json`. `npm test` falla si no coinciden. Así, los usuarios con la app instalada reciben la versión nueva en vez de una copia vieja del caché.

## Android con Capacitor

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/local-notifications
npm run build:www
npx cap add android
npx cap sync
npx cap open android
```

Antes, cambia `appId` en `capacitor.config.json` por uno tuyo (por ejemplo `com.tuusuario.matematicas`). Los recordatorios usan `@capacitor/local-notifications`; si el plugin no está, la app sigue funcionando y solo muestra el aviso al abrirla.

## Añadir un tema nuevo

1. Escribe un generador `function genXX(){ return pick([ ()=>Q_(enunciado, respuesta, [pasos]) , … ])(); }`. Usa solo `ri`, `rz` y `pick` para el azar (no `Math.random` directamente), así el problema se puede reproducir con una semilla.
2. Regístralo: `Object.assign(generadores,{XX:genXX})`, añade su texto en `TEO`, su categoría en `CATS` y su etapa en `RUTA`.
3. Ejecuta `npm test`: comprueba que no haya errores, que se repita con la misma semilla y que esté en la ruta y tenga teoría.

## Datos y privacidad

El progreso vive solo en el dispositivo (`localStorage`, clave `rm_progreso_v1`). No hay cuentas ni servidores. Usa **Ajustes → Respaldo** para guardarlo o moverlo a otro dispositivo.

## Licencia

Aún no se ha elegido una licencia. Añade un archivo `LICENSE` antes de publicar el repositorio (por ejemplo MIT si quieres que otros lo reutilicen).
