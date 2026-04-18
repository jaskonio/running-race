# README — Funcionalidades principales del proyecto

## 1. Visión del producto

La aplicación permitirá seguir un reto anual de running entre 3 participantes cuyo objetivo es alcanzar **3000 km durante 2026**.

Los entrenamientos se registran en Strava y la plataforma deberá recuperar solo las actividades de carrera, convertirlas en kilómetros por día y mostrarlas en una web con gráficas comparativas y rankings.

---

## 2. Objetivo funcional

Permitir que cualquier usuario que visite la web pueda ver:
- cuánto ha corrido cada participante
- cómo evoluciona su progreso a lo largo del año
- quién lidera por semanas
- quién está siendo más constante
- cómo se comparan entre sí en distintos rangos temporales

---

## 3. Funcionalidades principales

## 3.1. Conexión de participantes con Strava
Cada participante debe poder conectar su cuenta de Strava a la aplicación.

### Necesidades
- autenticación vía OAuth con Strava
- autorización individual por participante
- almacenamiento seguro de tokens
- identificación de cada corredor en el sistema

### Resultado esperado
La aplicación puede consultar las actividades de cada uno sin intervención manual diaria.

---

## 3.2. Sincronización diaria automática
La aplicación debe ejecutar cada día una sincronización para recuperar las nuevas actividades.

### Qué debe hacer
- recorrer los participantes activos
- renovar el token si ha caducado
- pedir actividades recientes a Strava
- filtrar únicamente las actividades de running
- guardar los kilómetros hechos por cada participante en cada día
- evitar duplicados

### Resultado esperado
Cada mañana la aplicación refleja automáticamente los entrenamientos del día anterior o los nuevos ya registrados.

---

## 3.3. Registro de kilómetros diarios
La unidad principal de la app debe ser el total de kilómetros por participante y por fecha.

### Qué debe almacenar
- participante
- fecha
- kilómetros totales de ese día

### Motivo
Esta estructura simplifica:
- gráficas diarias
- agregados semanales
- agregados mensuales
- rankings
- filtros por rango de fechas

---

## 3.4. Landing page con visión general del reto
La página principal debe mostrar el estado actual del reto de forma clara.

### Elementos recomendados
- kilómetros acumulados por participante
- porcentaje de progreso hacia los 3000 km
- ranking actual
- total de kilómetros del grupo
- fecha de última sincronización

---

## 3.5. Gráfica de evolución diaria
Debe existir una gráfica desde el **1 de enero de 2026** hasta la fecha actual.

### Comportamiento esperado
- una línea por participante
- visualización diaria
- preferiblemente mostrando el **acumulado del año**, aunque se puede ofrecer vista de km diarios

### Valor
Es la gráfica principal del reto porque muestra quién va por delante y cómo evoluciona cada uno con el paso del tiempo.

---

## 3.6. Gráfica semanal
Debe existir una gráfica agregada por semanas.

### Qué debe permitir
- comparar kilómetros de cada participante por semana
- identificar semanas fuertes o flojas
- ver la constancia semanal

### Posibles vistas
- barras por participante
- barras agrupadas por semana
- comparación directa del total semanal

---

## 3.7. Gráfica mensual
Debe existir una gráfica agregada por meses.

### Qué debe permitir
- ver tendencias más amplias
- detectar meses de mayor volumen
- comparar regularidad entre participantes

---

## 3.8. Gráfica por rango de fechas
La landing o una sección específica debe permitir consultar un rango personalizado.

### Qué debe permitir
- seleccionar fecha inicio
- seleccionar fecha fin
- recalcular y mostrar la evolución dentro del periodo seleccionado

### Casos de uso
- comparar vacaciones
- comparar preparación de carreras
- revisar un bloque de entrenamiento concreto

---

## 3.9. Ranking semanal
Debe existir una sección o página específica para saber quién ha ganado cada semana en número de kilómetros.

### Qué debe mostrar
- semana
- ganador de la semana
- kilómetros realizados por el ganador
- clasificación completa de los 3 participantes en esa semana

### Valor
Añade competitividad y hace el reto más entretenido.

---

## 3.10. Historial de ganadores por semana
Además del ranking puntual, se debe poder consultar el histórico completo.

### Ejemplo de datos mostrados
- semana 1 → ganador A
- semana 2 → ganador B
- semana 3 → ganador A

### Métricas derivadas opcionales
- número de semanas ganadas por participante
- racha actual de victorias
- mejor semana del año

---

## 4. Funcionalidades derivadas importantes

## 4.1. Resumen individual por participante
Cada participante debería tener una vista o bloque con:
- km acumulados en 2026
- mejor semana
- mejor mes
- media semanal
- número de días con actividad

---

## 4.2. Comparativa grupal
La app debe permitir comparar a los 3 participantes de forma clara.

### Qué interesa comparar
- kilómetros acumulados
- kilómetros por semana
- kilómetros por mes
- semanas ganadas
- constancia

---

## 4.3. Control del objetivo de 3000 km
El reto gira alrededor de una meta clara.

### La app debería mostrar
- porcentaje completado de cada participante
- kilómetros restantes para llegar a 3000
- ritmo proyectado para saber si llegará o no

Esta parte puede ser básica en V1 y más avanzada en futuras versiones.

---

## 4.4. Última sincronización y estado del sistema
Debe haber visibilidad sobre el estado de la información mostrada.

### Qué mostrar
- fecha y hora de última sincronización
- si hubo error en la última carga
- número de actividades nuevas procesadas

---

## 5. Reglas de negocio

## Solo actividades de running
La app no debe contar:
- ciclismo
- caminatas
- gimnasio
- natación
- otras actividades distintas a correr

## El reto solo aplica a 2026
Solo deben mostrarse y computarse actividades entre:
- `2026-01-01`
- `2026-12-31`

## La suma diaria puede incluir varias actividades
Si un participante hace dos entrenamientos el mismo día, ambos deben sumarse en el total diario.

## No debe haber duplicados
Una actividad ya procesada no debe volver a contarse.

---

## 6. MVP funcional recomendado

Para la primera versión, lo imprescindible sería:

### Participantes
- conectar 3 cuentas de Strava

### Sincronización
- job diario automático
- almacenamiento de km por día

### Dashboard
- resumen general
- gráfica diaria acumulada
- gráfica semanal
- gráfica mensual
- filtro por rango de fechas

### Rankings
- página de ganadores por semana
- histórico de semanas ganadas

---

## 7. Funcionalidades para una V2

Cuando la V1 esté estable, se podrían añadir:
- actualización casi en tiempo real con webhooks de Strava
- perfil individual más completo
- proyección de llegada a meta
- medallas o logros
- ranking mensual
- comparativa de ritmos
- comparativa de número de entrenamientos
- vista móvil optimizada
- panel de administración para reconectar tokens o relanzar sincronizaciones

---

## 8. Historias de usuario sugeridas

### Como visitante
Quiero ver rápidamente quién va liderando el reto para entender el estado actual.

### Como participante
Quiero ver mis kilómetros acumulados y compararme con mis amigos para motivarme.

### Como participante
Quiero saber quién ha ganado cada semana para hacer el reto más competitivo.

### Como usuario
Quiero filtrar por un rango de fechas para analizar un periodo concreto.

### Como administrador del sistema
Quiero que la sincronización diaria sea automática para no depender de tareas manuales.

---

## 9. Resultado esperado del producto

La aplicación debe convertirse en un panel simple, visual y automático para seguir el reto anual de 3000 km entre 3 amigos, usando Strava como fuente de verdad y mostrando comparativas claras, evolución temporal y rankings semanales.

