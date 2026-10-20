# Uber Driver AI

Tu bitácora personal y copiloto privado para conductores de Uber. Primera versión local en React + TypeScript + Vite, ejecutable en Windows y empaquetada para Umbrel OS.

## 1. Lo que ya está preparado en tu Windows

Se comprobó que este equipo tiene Node.js 22+, npm y Git. No necesitas una base de datos externa ni un editor adicional para comenzar. Nada de esto necesita tu contraseña de Uber.

Node ejecuta las herramientas del proyecto. React construye la pantalla; TypeScript ayuda a detectar errores; Vite abre la aplicación en tu navegador. Git permite guardar versiones del código.

En otro equipo: instala la versión **LTS** de [Node.js desde su sitio oficial](https://nodejs.org/en/download), con las opciones predeterminadas. Este proyecto requiere Node 22.18 o posterior.

## 2. Abrir la aplicación en Windows

1. Abre esta carpeta en el Explorador de archivos de Windows.
2. Haz doble clic en **INICIAR.cmd** (Windows puede mostrarlo como «INICIAR»).
3. Se abrirá una ventana de comandos y luego el navegador. La primera vez se descargarán las dependencias.
4. Usa siempre **http://127.0.0.1:5173**, en el mismo navegador y perfil. No sustituyas `127.0.0.1` por `localhost`: cada dirección tiene un almacenamiento separado.
5. Mantén abierta la ventana de comandos mientras utilizas la aplicación. Para detenerla, pulsa Ctrl+C.

Alternativa desde PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

## 3. Umbrel OS (Servidor personal)

Esta aplicación incluye empaquetado nativo para Umbrel OS:
- Carpeta de manifiestos: `uber-driver-ai/`
- Tienda comunitaria: `umbrel-app-store.yml`
- Imagen de contenedor multi-arquitectura: `ghcr.io/mandebitcoin/uber-driver-ai` (puerto `5174` en Umbrel).

## 4. Tu primer recorrido, paso a paso

1. Entra en **Resumen**. La app inicia en tus registros reales (vacíos por defecto: $0 / 0 viajes / 0 cargas).
2. Haz clic en **Configurar vehículo** en la barra lateral o ve a **Mis datos → Tu Vehículo y Preferencias** para ingresar el modelo de tu auto, placa opcional y tu ciudad. Se guardan solo en tu navegador.
3. Abre **Jornadas** para registrar una jornada manualmente tras terminar de conducir (horas, km, viajes, ingresos netos en USD, otros gastos).
4. O usa **Importar de Uber (CSV)** para cargar tu extracto oficial de `drivers.uber.com`, con vista previa interactiva y detección de duplicados.
5. Abre **Combustible** para registrar tus cargas de gasolina con fecha, galones, costo y odómetro.
6. En **Mis datos**, pulsa **Descargar respaldo** y guarda una copia JSON regularmente.

## 5. Privacidad y almacenamiento local

- Los registros personales viven en `localStorage` bajo la clave `uber-driver-ai:real:v1` (con migración automática desde versiones previas).
- La configuración del vehículo vive en `uber-driver-ai:settings:v1`.
- Ningún dato personal (tu carro, tu ciudad, tus placas, tus ingresos ni tus reportes CSV) se incluye en el código ni se transmite a servidores remotos.
- El repositorio público se mantiene limpio y sin información privada.

## 6. Comprobar el proyecto

```powershell
npm.cmd test
npm.cmd run build
```

Las pruebas cubren cálculos de jornadas, combustible, filtros de fecha, importador CSV de Uber y respaldos JSON.
