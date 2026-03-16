# Impostor de Futbolistas

Juego social multijugador en tiempo real. Estilo Among Us con futbolistas: los inocentes conocen el jugador secreto, los impostores deben deducirlo por las pistas.

## Requisitos

- Node.js 18+
- npm

## Instalación y ejecución

```bash
npm install
npm start
```

Luego abrir en el navegador:

```
http://localhost:3000
```

## Cómo jugar

1. **Crear sala**: Ingresá tu nombre y hacé clic en "Crear sala". Te dará un código de 6 caracteres.
2. **Unirse**: Los demás jugadores ingresan el código y su nombre para unirse.
3. **Configuración** (solo el host): Dificultad, impostores, tiempos y rondas máximas.
4. **Iniciar**: El host inicia cuando hay al menos 5 jugadores (máximo 12).

### Fases de cada ronda

- **Pistas**: Cada jugador da una pista de máx. 30 caracteres (sin nombrar al futbolista).
- **Debate**: Tiempo para discutir quién podría ser el impostor.
- **Votación**: Votación secuencial. El más votado es eliminado.
- **Reveal**: Se muestra si el eliminado era impostor o inocente.

### Victoria

- **Inocentes**: Eliminan a todos los impostores.
- **Impostores**: Igualan o superan en número a los inocentes.

## Probar multijugador

Abrí varias pestañas o ventanas del navegador, usá nombres distintos, creá la sala en una y unite con el código en las demás.

## Estructura del proyecto

```
impostor-futbolistas/
├── package.json
├── server.js          # Servidor Node.js + Express + Socket.IO
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Tecnologías

- Node.js + Express
- Socket.IO (tiempo real)
- HTML, CSS, JavaScript vanilla
