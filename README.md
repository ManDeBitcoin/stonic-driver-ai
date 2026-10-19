# Stonic Driver AI

Tu bitácora personal para el Kia Stonic en Guayaquil. Primera versión local en React + TypeScript + Vite, creada el 19 de octubre de 2026.

## 1. Lo que ya está preparado en tu Windows

Se comprobó que este equipo tiene Node.js 26.2.0, npm 11.12.0 y Git 2.53.0. Ya estás usando Codex. No necesitas instalar WSL, Docker, una base de datos o un editor adicional para comenzar. No se cambió tu instalación global de Node ni la configuración de permisos de Codex.

Node ejecuta las herramientas del proyecto. React construye la pantalla; TypeScript ayuda a detectar errores; Vite abre la aplicación en tu navegador. Git permite guardar versiones del código. Nada de esto necesita tu contraseña de Uber.

En otro equipo: instala la versión **LTS** de [Node.js desde su sitio oficial](https://nodejs.org/en/download), con las opciones predeterminadas. Este proyecto requiere Node 22.18 o posterior. Después abre de nuevo Codex para que reconozca la instalación. Vite documenta las bases de instalación y ejecución en su [guía oficial](https://vite.dev/guide/).

## 2. Abrir la aplicación

1. Abre esta carpeta en el Explorador de archivos de Windows.
2. Haz doble clic en **INICIAR.cmd** (Windows puede mostrarlo como «INICIAR»).
3. Se abrirá una ventana de comandos y luego el navegador. La primera vez en otra copia, se descargarán las dependencias.
4. Usa siempre **http://127.0.0.1:5173**, en el mismo navegador y perfil. No sustituyas `127.0.0.1` por `localhost`: cada dirección tiene un almacenamiento separado.
5. Mantén abierta la ventana de comandos mientras utilizas la aplicación. Para detenerla, pulsa Ctrl+C; confirma si Windows lo solicita.

Si Codex ya la dejó ejecutándose, abre esa dirección directamente. Si aparece «port 5173 is already in use», revisa esa dirección: quizá ya está abierta otra instancia. No se cambia automáticamente de puerto para evitar que tus registros parezcan desaparecer.

Alternativa desde una terminal de PowerShell abierta en esta carpeta:

```powershell
npm.cmd ci
npm.cmd run dev
```

Se usa `npm.cmd` para evitar el bloqueo de `npm.ps1` por la política de ejecución de PowerShell. No necesitas relajar esa política. `npm.cmd ci` instala exactamente las versiones del archivo de dependencias; no hace falta repetirlo cada día.

## 3. Tu primer recorrido, paso a paso

1. Entra en **Resumen**. La franja amarilla indica que estás viendo datos ficticios.
2. Abre **Jornadas**. Practica guardando una fecha, 6.5 horas, 120 km, 15 viajes, USD 80 de ingresos y USD 2 de otros gastos.
3. Abre **Combustible**. Practica con 5 galones, USD 17 y el odómetro. Es un ejemplo, no una cotización de gasolina.
4. Vuelve a **Resumen** y comprueba que las cifras se actualizan. Puedes filtrar por fecha.
5. Pulsa **Usar mis registros**. Aparecerá tu espacio real, inicialmente vacío. Los ejemplos no se copian allí.
6. Registra una jornada real al terminar de conducir y cada compra de gasolina por separado.
7. En **Mis datos**, pulsa **Descargar respaldo** y guarda el archivo JSON en una carpeta privada. Hazlo con regularidad.

El modo demostración se reinicia al recargar; tus registros reales persisten en este navegador. Puedes editar y eliminar entradas desde los historiales. Eliminar pide confirmación. El filtro solo afecta lo que ves, no los registros que guardas. Los respaldos incluyen todos los registros del modo seleccionado, independientemente del filtro.

## 4. Cómo leer los números

- **Ingresos del conductor:** copia el importe después de la comisión de la plataforma. Incluye propinas y bonos una sola vez. No agregues nuevamente el efectivo si ya forma parte de tus ingresos del día.
- **Otros gastos:** peajes, parqueos u otros gastos que decidas registrar. No repitas aquí el combustible.
- **Saldo registrado:** ingresos menos compras de combustible menos otros gastos anotados. No representa utilidad neta ni una declaración tributaria.
- **Ingresos por hora:** ingresos divididos por horas trabajadas, antes de combustible y otros gastos. Incluye las esperas en tus horas.
- **Combustible:** galones estadounidenses y total pagado según el recibo. El precio por galón resulta de dividir ambos datos; no se consulta una tarifa externa.

Una compra puede abastecer varias jornadas. Por eso esta versión no presenta el saldo como rentabilidad real ni calcula consumo a partir de compras y kilómetros de períodos distintos. No recomienda un tipo de gasolina ni supone especificaciones de tu motor. Todavía no hay chat de IA: los resúmenes son cálculos transparentes en tu equipo.

## 5. Privacidad y respaldos

El proyecto es local y no está publicado en GitHub ni en internet. `private: true` evita publicar accidentalmente el paquete en npm; no equivale a autenticación o cifrado. El servidor escucha solo en `127.0.0.1`. La aplicación no tiene analítica, fuentes remotas, llamadas a OpenAI ni conexiones con Uber.

Los registros viven en `localStorage`, con la clave `stonic-driver-ai:real:v1`, bajo la dirección local que usas. No se guardan en el código ni en Git. Borrar datos del navegador, cambiar de perfil, usar modo incógnito o cambiar de dirección puede hacerlos desaparecer de la vista. Los respaldos JSON tampoco están cifrados. Protege tu sesión de Windows y conserva tus copias en un lugar privado.

Para recuperar una copia: cambia a **Usar mis registros**, ve a **Mis datos → Restaurar respaldo real**, selecciona el JSON, revisa la cantidad de registros y confirma. Esto reemplaza los registros actuales, no los combina. Descarga antes una copia actual. La aplicación valida formato, cantidades, fechas y duplicados. Rechaza respaldos de demostración para evitar mezclarlos con datos reales.

Si los datos guardados están dañados, la aplicación no los sobrescribe al iniciar. Ofrece descargar el archivo de recuperación y restaurar un respaldo válido. Si otra pestaña guardó cambios, pide recargar antes de escribir. Trabaja en una sola pestaña.

Esta app no transmite tus registros a OpenAI. Si tú adjuntas un respaldo o CSV a una conversación de Codex, ese archivo sí se comparte con ese servicio como parte de tu solicitud.

## 6. Continuar con Codex

La documentación oficial consultada el **19 de octubre de 2026** confirma que Codex funciona de forma nativa en Windows con PowerShell y su sandbox: [Codex en Windows](https://learn.chatgpt.com/docs/windows/windows-sandbox). No es obligatorio instalar Linux.

La [guía oficial de inicio](https://learn.chatgpt.com/docs/quickstart) explica cómo iniciar sesión, abrir una carpeta y seleccionar Codex para desarrollar software. Como ya lo tienes abierto, añade o abre la carpeta **stonic-driver-ai** como proyecto local en Codex; selecciona esa carpeta completa, no solamente un archivo. Conserva los permisos predeterminados de trabajo local. Los nombres de los botones pueden variar según la versión de la aplicación.

Pide cambios concretos en lenguaje normal, por ejemplo:

> Revisa README.md y el proyecto. Explícame qué voy a cambiar y añade un resumen mensual a Stonic Driver AI. Conserva mis registros y verifica los cálculos. Mantén la app local y sin conexiones con Uber.

No necesitas una clave de la API de OpenAI para ejecutar esta primera versión. El uso de Codex depende de tu cuenta y sus límites; una futura función de IA dentro de la aplicación sería una etapa independiente.

## 7. Siguiente etapa: CSV de Uber

La importación de CSV está **pendiente**, no implementada. No asumimos un formato de columnas ni que un mismo reporte esté disponible en todas las cuentas. El proceso será:

1. Tú descargas un reporte disponible en tu cuenta por los canales oficiales.
2. Proporcionas una muestra sin nombres, teléfonos, direcciones, identificadores personales ni otros datos sensibles; conservamos encabezados y cifras ficticias representativas.
3. Revisamos fechas y zona horaria, separadores, comas decimales, moneda, comisiones, propinas, bonos, devoluciones y el significado de cada fila.
4. Creamos un importador local con vista previa, selección de columnas, validación y detección de duplicados. No inventaremos horas o kilómetros si el CSV no los contiene.
5. Se guarda solo después de revisar la vista previa y confirmar, con respaldo previo y pruebas para no contar viajes o ingresos dos veces.

No hay scraping, lectura de pantalla, automatización de aceptación de viajes ni uso de APIs no autorizadas de Uber. No se solicita tu contraseña.

## 8. Sobre tu iPhone

El diseño se adapta a pantallas pequeñas, pero por ahora funciona únicamente en tu PC. `127.0.0.1` en el iPhone apunta al propio teléfono, no a Windows. No existe sincronización entre dispositivos. Más adelante podemos preparar acceso privado autenticado y respaldo central antes de usarla desde el iPhone; eso requiere decidir dónde alojarla. Usa los formularios con el vehículo estacionado.

## 9. Comprobar el proyecto

```powershell
npm.cmd test
npm.cmd run build
```

Las pruebas cubren cálculos, fechas, validación y respaldos. La compilación verifica TypeScript y genera la versión para producción en `dist`. No publica nada. `npm.cmd run preview` sirve esa compilación en la misma dirección, si el servidor de desarrollo está detenido.

Si algo falla, pega en Codex el mensaje de error y qué estabas intentando hacer. No borres los datos del navegador como primer paso.
