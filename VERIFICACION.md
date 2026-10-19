# Comprobación de la primera versión

Fecha: 19 de octubre de 2026. Equipo Windows; Node 26.2.0.

- 8 pruebas automatizadas aprobadas: totales en centavos, saldo negativo, división por cero, filtro inclusivo, fechas imposibles, valores inválidos, respaldo/restauración, separación de demostración y duplicados.
- TypeScript y compilación de producción aprobados.
- Revisión en el navegador: carga del resumen, guardado de una jornada de práctica, guardado y edición de combustible, separación de datos reales, guardado real temporal y conservación al recargar, eliminación del registro temporal.
- Revisión visual en escritorio y con ancho de 390 píxeles. Esto verifica la adaptación del diseño; no es una prueba en Safari ni sincronización con un iPhone.
- El espacio real se entregó sin registros de prueba. La demostración mantiene los siete días ficticios.
- El respaldo y su validación tienen pruebas automatizadas. La selección de archivos y la restauración completa mediante la interfaz no se probaron de extremo a extremo.
- Instalación de dependencias con versiones fijas y package-lock.json. La auditoría de npm durante la instalación informó cero vulnerabilidades conocidas; no sustituye una auditoría de seguridad.
- Repositorio Git local, sin remoto ni publicación.

Pendiente para próximas etapas: CSV real de Uber, consumo mediante tanque lleno, sincronización autenticada con iPhone, modelo de IA y cualquier alojamiento remoto.
