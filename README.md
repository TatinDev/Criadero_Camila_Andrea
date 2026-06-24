# Criadero Camila Andrea

Sistema web interno para la gestion operativa del Criadero Camila Andrea.

El objetivo del proyecto es centralizar la informacion critica del criadero, incluyendo caballos propios, caballos de clientes, clientes externos, pensiones o estadias, pagos, vacunas, herrajes, documentos, fotografias, genealogia e historial de acciones administrativas.

## Estado actual

Fecha de corte: 24 de junio de 2026.

El proyecto se encuentra actualmente en etapa de especificacion avanzada. Ya se completo una base funcional amplia para describir el sistema, sus modulos principales, pantallas esperadas, modelo de datos, reglas de negocio, endpoints API, permisos, arquitectura objetivo, estrategia de pruebas y trazabilidad.

El archivo principal de trabajo es:

- `especificacion_criadero_camila_andrea.md`

## Historial de avances

### Avance inicial - 16 de junio de 2026

Se documento la idea base del sistema y se definio que sera una plataforma privada, sin acceso para clientes externos ni publico general. El acceso estara reservado a la propietaria, administradores invitados y personal interno autorizado.

Tambien se definio el objetivo principal del MVP: mantener informacion ordenada, trazable y facil de consultar sobre animales, clientes, cuidados, pagos, documentos y responsabilidades operativas.

Dentro de la especificacion ya se avanzaron las siguientes areas:

- Supuesto general del sistema.
- Idea base del proyecto.
- Objetivo principal.
- Usuarios principales y usuarios sin acceso.
- Problemas que debe resolver el sistema.
- Alcance inicial esperado para el MVP.
- Casos de uso para gestion de caballos propios.
- Casos de uso para gestion de clientes.
- Casos de uso para gestion de caballos pensionados.
- Casos de uso para pensiones o estadias.
- Casos de uso para pagos de estadia.
- Casos de uso para vacunas.
- Casos de uso para herrajes.
- Casos de uso para gestion documental.
- Casos de uso para genealogia.
- Casos de uso para estados de caballos.

### Avance de especificacion - 24 de junio de 2026

Se amplio la especificacion del proyecto tomando como base el avance inicial del 16 de junio de 2026. En esta etapa se paso desde una definicion general de alcance y casos de uso hacia una especificacion funcional mas completa, preparada para revision antes de iniciar la implementacion.

Respecto al avance anterior, se concreto lo siguiente:

- Se completo la especificacion de pantallas principales del sistema.
- Se agrego el modelo de datos base para los modulos principales.
- Se definieron validaciones y reglas de negocio generales.
- Se agrego la propuesta de endpoints API bajo `/api/v1`.
- Se definieron estados iniciales por modulo.
- Se agrego el modelo de permisos para usuarios internos.
- Se documento una arquitectura objetivo para orientar la futura implementacion.
- Se agregaron requisitos no funcionales.
- Se definio una estrategia de pruebas.
- Se agregaron criterios de aceptacion por modulo.
- Se incorporo una matriz de trazabilidad.
- Se definio un gate de cierre para determinar cuando la especificacion estara lista para pasar a desarrollo.
