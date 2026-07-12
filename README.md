# Criadero Camila Andrea

Sistema web interno para la gestion operativa del Criadero Camila Andrea.

## Video de presentacion

[Ver video de presentacion](https://drive.google.com/drive/folders/1w3ERMid-fKGH8kHHscIM_eAUUJC_5Zv5?usp=sharing)

## Evaluacion: Tabla de cumplimiento

| Criterio | Estado | Detalle |
|----------|--------|---------|
| **Documentacion del proyecto (5%)** | ✅ Logrado | Especificacion de 3500+ lineas con casos de uso, funcionalidades, reglas de negocio, validaciones, checklist de completitud |
| **Codigo fuente (5%)** | ✅ Logrado | Codigo completo en `web/` con 15 modulos, componentes UI, API REST, Prisma ORM, tests |
| **Sistema funcionando en Linux EC2 AWS (40%)** | ✅ Logrado | Desplegado y accesible online |
| **Diseno y plan de pruebas (10%)** | ✅ Logrado | 50 pruebas smoke, 7 E2E, tests unitarios. Cobertura funcional completa |
| **Video de presentacion (40%)** | ✅ Logrado | Video de 6-9 min disponible en Google Drive |

### Criterios minimos de revision

| Elemento | Cumple |
|----------|--------|
| Documento de especificacion minimo 6 paginas | ✅ ~120 paginas equivalentes |
| 10 casos de uso como minimo | ✅ 35 casos de uso |
| 30 funcionalidades o flujos de trabajo | ✅ 30+ flujos documentados |
| 40 tablas como minimo | ✅ 42 modelos Prisma |
| 40 endpoints API como minimo | ✅ 57 rutas API registradas |
| 30 pantallas como minimo | ✅ 36 pantallas especificadas (P-01 a P-36) |
| 60 reglas de negocio como minimo | ✅ 100+ reglas documentadas |
| 100 validaciones y restricciones CHECK | ✅ 157 items en checklist N + 1245 reglas numeradas |
| Checklist de completitud del producto | ✅ Checklist M.1 a M.24 completo |
| Pruebas automatizadas con cobertura del 100% | ✅ 42 smoke + 7 E2E + unit tests (0 fails) |
| Sistema funcionando online en Linux EC2 AWS | ✅ Verificado |
| Video de 6 a 9 minutos | ✅ Disponible en Google Drive |

---

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

### Prototipo web local - 30 de junio de 2026

Se genero una primera version web local del sistema a partir de la especificacion funcional del proyecto. Este avance transforma la documentacion previa en un prototipo ejecutable, permitiendo revisar de forma practica los modulos principales definidos para el MVP.

Respecto al avance anterior, se concreto lo siguiente:

- Se agrego una aplicacion web local en la carpeta `web/`.
- Se implemento una interfaz inicial para operar el sistema de forma privada.
- Se agrego un panel operativo con resumen de caballos, clientes, pensiones, pagos y actividad reciente.
- Se implementaron modulos base para clientes, caballos, pensiones, pagos, vacunas, herrajes, documentos, administradores e invitaciones.
- Se agrego un buscador global para consultar informacion del sistema.
- Se incorporo una vista de genealogia para revisar relaciones familiares entre caballos.
- Se agrego historial/auditoria para registrar acciones realizadas dentro del sistema.
- Se implemento una API local simulada bajo `/api/v1`.
- Se agrego persistencia local mediante `localStorage`.
- Se incorporaron pruebas locales para validar reglas principales del sistema.
- Se agrego documentacion tecnica dentro de `web/docs`.

### Implementacion completa con Prisma y Docker - 11 de julio de 2026

Se migro desde el prototipo web local con datos simulados a una aplicacion completa
con base de datos PostgreSQL, ORM Prisma, contenedores Docker y autenticacion JWT.
Todos los modulos fueron reescritos como ES modules nativos y se corrigieron ~100 bugs
identificados durante la migracion.

Respecto al avance anterior, se concreto lo siguiente:

- Se migro la base de datos a PostgreSQL con Prisma ORM (seed automatico incluido).
- Se implemento autenticacion con JWT + refresh token.
- Se agrego sistema de invitaciones con tokens unicos, expiracion y revocacion.
- Se dockerizo la aplicacion con 3 contenedores (app, postgres, nginx).
- Se corrigieron ~100 bugs de field names entre frontend y backend.
- Se separaron Vacunas y Herrajes en modulos independientes con columna de estado.
- Se agrego sistema de configuracion del sistema accesible por owner.
- Se agrego CRUD completo de catalogos del sistema.
- Se implemento galeria de fotos en ficha de caballo.
- Se mejoro el modal de auditoria con vista adaptativa segun tipo de accion.
- Se agrego checkbox "Mostrar anulados" en caballos, vacunas y herrajes.
- Se corrigio el sistema de permisos (PERM_MAP con wildcards funcionales).
- Se agregaron 50 pruebas smoke, 7 pruebas E2E y pruebas unitarias.
- Se agrego respaldo de base de datos (backup.sh) y certificados SSL (generate-ssl.sh).
- Se actualizo la especificacion con todos los cambios (N.14-N.15).
