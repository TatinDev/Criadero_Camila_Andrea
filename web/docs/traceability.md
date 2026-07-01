# Trazabilidad Criadero Camila Andrea

| requisito | implementacion | prueba |
|---|---|---|
| REQ-AUTH | `CriaderoApi` soporta login local, `auth/me`, roles owner/admin e invitaciones | `tests/run-tests.mjs` invitacion, permisos admin |
| REQ-CAB | CRUD `/api/v1/horses`, caballos propios y pensionados con estados separados | validacion de caballo propio/pensionado |
| REQ-CLI | CRUD `/api/v1/clients`, inactivacion logica y duplicados por contacto | creacion cliente y auditoria |
| REQ-PEN | `/api/v1/boarding-stays`, pension independiente con ID, costo, fechas y acuerdos | pension activa unica, finalizacion y nueva temporada |
| REQ-PAG | `/api/v1/boarding-payments`, meses pagados y bloqueo de duplicados | pago duplicado y pago multimes |
| REQ-VAC | `/api/v1/vaccinations`, registro y anulacion | vacuna y cancelacion |
| REQ-HER | `/api/v1/farrier-records`, registro y anulacion | herraje para caballo propio |
| REQ-DOC | `/api/v1/document-batches`, lote documental y descarga simulada | lote con dos archivos y descarga |
| REQ-GEN | endpoints de genealogia y arbol navegable | `genealogyTree` con madre registrada y padre externo |
| REQ-HIS | `auditLogs` con usuario, rol, accion, entidad, before/after, importancia y tipo | auditoria tras creacion |
| REQ-BUS | `GET /api/v1/search` y vista Buscador | busqueda por caballo |
| REQ-PERM | `PERMISSIONS` owner/admin | admin sin invitaciones |
| REQ-RNF | app local responsive, sin red externa, sin clientes externos, consumo registrado | `consumption` por transaccion |
