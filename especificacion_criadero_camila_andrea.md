# Especificacion Criadero Camila Andrea

Documento vivo de especificacion del proyecto. Se completara paso a paso antes de iniciar la generacion del sistema.

---

# 0. Supuesto general del sistema

Sistema web interno para la gestion operativa del Criadero Camila Andrea, enfocado en el registro, seguimiento y control documental de caballos propios y caballos de terceros dejados al cuidado del criadero.

El sistema sera de uso privado. Solo podran acceder personas designadas como administradores mediante invitacion. Los clientes externos no tendran cuenta ni acceso directo a la plataforma.

## 0.1 Idea base

Crear una plataforma de gestion de caballos que permita registrar:

1. Caballos propios del criadero.
2. Caballos de clientes dejados al cuidado del criadero.
3. Descendencia, genealogia o relaciones familiares entre caballos.
4. Vacunas, herrajes y eventos sanitarios basicos.
5. Clientes, sus datos de contacto, notas internas y caballos asociados.
6. Fechas de llegada, fechas de salida, pagos acordados y compromisos mensuales de alimentacion.
7. Documentos, fotografias, bocetos, comprobantes y respaldos relacionados a caballos, clientes u operaciones.
8. Historial de cambios y acciones realizadas por administradores.

## 0.2 Objetivo principal

Centralizar la informacion critica del criadero en un sistema interno, trazable y facil de consultar, para mejorar el control de animales, clientes, cuidados, pagos, documentos y responsabilidades operativas.

El objetivo no es entregar una plataforma publica al cliente, sino una herramienta privada para que el criadero pueda tomar decisiones, consultar antecedentes y mantener evidencia ordenada de cada caballo y cada cliente.

## 0.3 Usuarios principales

Usuarios con acceso al sistema:

1. Propietaria o administradora principal del criadero.
2. Administradores invitados por la propietaria.
3. Personal interno autorizado para registrar cuidados, documentos, pagos o eventos.

Usuarios sin acceso al sistema:

1. Clientes dueños de caballos externos.
2. Publico general.

El registro de usuarios administradores se realizara mediante link de invitacion generado por un administrador autorizado.

## 0.4 Problemas que debe resolver

1. Evitar perdida o dispersion de informacion sobre caballos propios y externos.
2. Consultar rapidamente datos de un caballo: nombre, color, rasgos distintivos, fotos, documentos, vacunas, herrajes, descendencia y responsable asociado.
3. Consultar rapidamente datos de un cliente: nombre, apellido, direccion, contacto, notas internas, caballos bajo cuidado y acuerdos vigentes.
4. Controlar fechas de llegada y salida de caballos externos.
5. Controlar pensiones o estadias independientes por temporada, cada una con su propio ID, fechas, costo, acuerdos y pagos.
6. Controlar fechas de pago y montos acordados por cuidado o pension.
7. Registrar acuerdos mensuales de fardos, avena u otros insumos que el cliente debe entregar para el cuidado del caballo durante una pension especifica.
8. Registrar vacunas, herrajes y atenciones realizadas tanto a caballos propios como a caballos de clientes.
9. Guardar documentos importantes como pedigree, ADN, papeles del caballo, comprobantes de transferencia, imagenes de llegada/salida, respaldos de vacunas, boletas, recetas u otros archivos utiles.
10. Distinguir correctamente a cada caballo mediante nombre, color, rasgos distintivos, fotografias y/o bocetos de marcas.
11. Mantener historial de acciones: altas, ediciones, cargas de documentos, registros sanitarios, cambios de cliente, pagos y eliminaciones logicas.

## 0.5 Alcance inicial esperado

El MVP debe incluir al menos:

1. Autenticacion de administradores.
2. Invitacion de nuevos administradores mediante link.
3. Gestion de caballos propios.
4. Gestion de caballos de clientes.
5. Gestion de clientes externos sin acceso al sistema.
6. Buscador global de caballos y clientes.
7. Registro de descendencia o relaciones familiares de caballos.
8. Seguimiento de vacunas.
9. Seguimiento de herrajes.
10. Registro de pensiones o estadias independientes para caballos bajo cuidado.
11. Registro de llegada, salida estimada, salida real y estado del acuerdo de cada pension.
12. Registro de pagos de estadia, meses pagados, medio de pago y evidencia opcional.
13. Registro de pagos acordados, fechas de pago y compromisos de alimentacion por pension.
14. Carga y consulta de documentos asociados a caballos, clientes, pensiones u operaciones.
15. Galeria o seccion visual de fotos/bocetos para marcas y rasgos distintivos.
16. Historial/auditoria de modificaciones realizadas por administradores.

Queda fuera del MVP, salvo decision posterior:

1. Acceso de clientes mediante cuenta propia.
2. Portal publico del criadero.
3. Pagos online reales.
4. Firma digital de contratos.
5. Gestion interna de veterinarios o contactos profesionales.
6. Aplicacion movil nativa.

---

# A. Casos de uso con flujos

## 1. Gestion de caballos propios

### UC-CAB-PRO-01 Registrar caballo propio

Actor: Administrador.

Flujo:

1. Administrador abre el modulo Caballos propios.
2. Selecciona Registrar caballo.
3. Ingresa datos obligatorios: nombre, sexo, color y distintivos.
4. Opcionalmente despliega el panel de informacion adicional.
5. Ingresa datos opcionales: nombre del criadero, fecha de nacimiento, nombre del criador, lugar donde se encuentra temporalmente, padre y madre.
6. Sistema valida campos obligatorios.
7. Sistema guarda el caballo como caballo propio.
8. Sistema registra la accion en historial.

Alternos:

- Si falta nombre, sexo, color o distintivos, el sistema bloquea el guardado.
- Si padre o madre corresponden a caballos existentes, el administrador puede seleccionarlos desde caballos ya registrados.
- Si padre o madre no estan registrados, el administrador puede ingresar solo sus nombres como referencia genealogica externa.
- Si se adjuntan documentos durante el registro, quedan asociados al caballo.

### UC-CAB-PRO-02 Consultar caballos propios

Flujo:

1. Administrador abre listado de caballos propios.
2. Sistema muestra caballos registrados con filtros y buscador.
3. Administrador puede buscar por nombre, sexo, color, estado, lugar donde se encuentra o distintivos.
4. Administrador abre la ficha de un caballo.
5. Sistema muestra informacion general, notas, documentos, vacunas, herrajes, genealogia e historial.

Alternos:

- Si no existen resultados, muestra listado vacio.
- Si el caballo no tiene documentos, vacunas, herrajes o genealogia, muestra esas secciones vacias.

### UC-CAB-PRO-03 Editar caballo propio

Flujo:

1. Administrador abre la ficha de un caballo propio.
2. Selecciona Editar.
3. Modifica datos permitidos.
4. Sistema valida campos obligatorios.
5. Sistema guarda cambios.
6. Sistema registra antes/despues en historial.

Alternos:

- Si se modifica padre o madre, el arbol genealogico debe actualizarse.
- Si se cambia el estado del caballo, el cambio debe quedar registrado en historial.

### UC-CAB-PRO-04 Eliminar o inactivar caballo propio

Flujo:

1. Administrador abre ficha del caballo.
2. Selecciona eliminar, inactivar o cambiar estado segun politica definida.
3. Sistema solicita confirmacion.
4. Sistema aplica eliminacion logica o cambio de estado.
5. Sistema registra historial.

Alternos:

- No se recomienda eliminacion fisica si el caballo tiene vacunas, herrajes, documentos, descendencia o historial.
- Si el caballo aparece como padre o madre de otro caballo, el sistema debe impedir eliminacion fisica y sugerir inactivacion.

## 2. Gestion de clientes

### UC-CLI-01 Registrar cliente

Actor: Administrador.

Flujo:

1. Administrador abre modulo Clientes.
2. Selecciona Registrar cliente.
3. Ingresa nombres, apellidos, direccion y numero de contacto.
4. Opcionalmente agrega notas internas sobre la persona.
5. Sistema valida datos obligatorios.
6. Sistema guarda el cliente.
7. Sistema registra accion en historial.

Alternos:

- Si falta nombre, apellido o contacto principal, el sistema bloquea guardado.
- Si existe un cliente similar, el sistema advierte posible duplicado.

### UC-CLI-02 Consultar clientes

Flujo:

1. Administrador abre listado de clientes.
2. Sistema muestra clientes registrados.
3. Administrador busca por nombre, apellido, telefono, direccion o notas.
4. Administrador abre ficha de cliente.
5. Sistema muestra datos personales, notas, caballos pensionados asociados, documentos, acuerdos y historial.

Alternos:

- Si el cliente no tiene caballos asociados, se muestra la ficha sin animales bajo cuidado.

### UC-CLI-03 Editar cliente

Flujo:

1. Administrador abre ficha del cliente.
2. Selecciona Editar.
3. Modifica datos permitidos.
4. Sistema valida informacion.
5. Sistema guarda cambios.
6. Sistema registra historial.

Alternos:

- Si se cambia informacion sensible de contacto, el historial debe conservar valor anterior y nuevo.

### UC-CLI-04 Eliminar o inactivar cliente

Flujo:

1. Administrador abre ficha del cliente.
2. Selecciona eliminar o inactivar.
3. Sistema valida si tiene caballos pensionados activos.
4. Sistema aplica eliminacion logica o cambio de estado.
5. Sistema registra historial.

Alternos:

- No se permite eliminar fisicamente un cliente con caballos pensionados activos.
- Si el cliente tiene historial, documentos o caballos asociados, se recomienda inactivarlo en vez de borrarlo.

## 3. Gestion de caballos pensionados

### UC-CAB-PEN-01 Registrar caballo pensionado

Actor: Administrador.

Flujo:

1. Administrador abre modulo Caballos pensionados.
2. Selecciona Registrar caballo pensionado.
3. Ingresa datos obligatorios: nombre, sexo, color y distintivos.
4. Selecciona dueño desde clientes previamente registrados.
5. Opcionalmente despliega panel de informacion adicional.
6. Ingresa datos opcionales: nombre del criadero, fecha de nacimiento, nombre del criador, padre y madre.
7. Sistema guarda el caballo como pensionado.
8. Sistema registra accion en historial.

Alternos:

- Si no existe cliente dueño, el sistema debe permitir cancelar y crear cliente antes de continuar.
- Si falta dueño, nombre, sexo, color o distintivos, el sistema bloquea guardado.
- Si se adjuntan documentos durante el registro, quedan asociados al caballo.

### UC-CAB-PEN-02 Consultar caballos pensionados

Flujo:

1. Administrador abre listado de caballos pensionados.
2. Sistema muestra caballos registrados y su dueño.
3. Administrador busca por caballo, cliente, color, sexo, estado o distintivos.
4. Administrador abre ficha del caballo.
5. Sistema muestra informacion general, dueño, notas, documentos, vacunas, herrajes e historial.

Alternos:

- Si el dueño esta inactivo, la ficha debe seguir mostrando su informacion historica.

### UC-CAB-PEN-03 Editar caballo pensionado

Flujo:

1. Administrador abre ficha del caballo pensionado.
2. Selecciona Editar.
3. Modifica datos permitidos, incluyendo dueño si corresponde.
4. Sistema valida informacion obligatoria.
5. Sistema guarda cambios.
6. Sistema registra historial.

Alternos:

- Si cambia el dueño, el historial debe registrar dueño anterior y nuevo.

### UC-CAB-PEN-04 Eliminar o inactivar caballo pensionado

Flujo:

1. Administrador abre ficha del caballo pensionado.
2. Selecciona eliminar, inactivar o cambiar estado.
3. Sistema solicita confirmacion.
4. Sistema aplica eliminacion logica o cambio de estado.
5. Sistema registra historial.

Alternos:

- No se recomienda eliminacion fisica si existen vacunas, herrajes, documentos, pagos, estadias o historial.

## 4. Gestion de pensiones o estadias

### UC-PEN-01 Crear pension o estadia

Actor: Administrador.

Aplica a: Caballos pensionados.

Descripcion:

Una pension o estadia representa un periodo independiente en que un caballo de un cliente queda al cuidado del criadero. Un mismo caballo puede tener varias pensiones a lo largo del tiempo, por ejemplo una temporada de invierno de un año y otra temporada distinta al año siguiente.

Cada pension debe tener su propio ID, fechas, acuerdos, costo, documentos, pagos e historial, para evitar mezclar condiciones de temporadas diferentes.

Flujo:

1. Administrador abre la ficha de un caballo pensionado.
2. Selecciona Crear pension o estadia.
3. Sistema genera un ID unico para la pension.
4. Administrador ingresa fecha de inicio.
5. Opcionalmente ingresa fecha de salida estimada.
6. Selecciona tipo de pension.
7. Selecciona estado inicial del acuerdo.
8. Ingresa Costo Pension.
9. Ingresa acuerdos de alimentacion: fardos acordados por mes, avena acordada por mes y otros insumos si corresponde.
10. Opcionalmente agrega notas de cuidado.
11. Opcionalmente adjunta documentos o fotos de llegada.
12. Sistema guarda la pension asociada al caballo y al cliente dueño.
13. Sistema registra historial.

Tipos de pension iniciales:

1. Insumos aportados por cliente.
2. Insumos incluidos por criadero.
3. Mixta.
4. Otro.

Estados iniciales del acuerdo:

1. Activo.
2. Pendiente de pago.
3. Con deuda.
4. Finalizado.
5. Cancelado.

Alternos:

- Si el caballo ya tiene una pension activa, el sistema debe advertir antes de crear otra.
- Si falta fecha de inicio, tipo de pension, estado del acuerdo o Costo Pension, el sistema bloquea guardado.
- Si se selecciona Otro como tipo de pension, el sistema debe permitir escribir una descripcion.

### UC-PEN-02 Consultar pensiones o estadias

Flujo:

1. Administrador abre la ficha de un caballo pensionado o de un cliente.
2. Entra a Pensiones o estadias.
3. Sistema muestra todas las pensiones asociadas, ordenadas por fecha de inicio.
4. Administrador abre una pension.
5. Sistema muestra fechas, tipo, estado, Costo Pension, acuerdos de alimentacion, pagos, documentos, notas e historial.

Alternos:

- Si el caballo no tiene pensiones registradas, muestra la seccion vacia.
- Si la pension esta finalizada, se muestra como solo lectura salvo acciones administrativas permitidas.

### UC-PEN-03 Editar pension o estadia

Flujo:

1. Administrador abre una pension.
2. Selecciona Editar.
3. Modifica fechas, tipo, estado, Costo Pension, acuerdos de alimentacion o notas.
4. Sistema valida datos obligatorios.
5. Sistema guarda cambios.
6. Sistema registra antes/despues en historial.

Alternos:

- Si cambia el Costo Pension, el cambio no debe alterar pagos ya registrados; solo queda como nuevo valor del acuerdo.
- Si cambia el estado a Finalizado, el sistema debe permitir registrar fecha de salida real.

### UC-PEN-04 Finalizar pension o estadia

Flujo:

1. Administrador abre una pension activa.
2. Selecciona Finalizar pension.
3. Ingresa fecha de salida real.
4. Opcionalmente adjunta fotos o documentos de salida.
5. Sistema cambia estado del acuerdo a Finalizado.
6. Sistema registra historial.

Alternos:

- Si existen pagos pendientes o deuda, el sistema debe advertir antes de finalizar, pero no necesariamente bloquear.

### UC-PEN-05 Anular pension o estadia

Flujo:

1. Administrador abre una pension.
2. Selecciona Anular.
3. Ingresa motivo.
4. Sistema cambia estado del acuerdo a Cancelado.
5. Sistema conserva documentos, pagos e historial.

Alternos:

- No se recomienda eliminar fisicamente una pension porque funciona como respaldo administrativo.

## 5. Gestion de pagos de estadia

### UC-PAG-EST-01 Registrar pago de estadia

Actor: Administrador.

Aplica a: Pensiones o estadias de caballos pensionados.

Flujo:

1. Administrador abre una pension o estadia.
2. Entra a la seccion Pagos de estadia de esa pension.
3. Selecciona Registrar pago.
4. Ingresa fecha en que se realizo el pago.
5. Selecciona uno o mas meses que quedaron pagados.
6. Selecciona medio de pago: efectivo o transferencia.
7. Sistema sugiere el Costo Pension de la pension seleccionada.
8. Administrador confirma o ajusta el monto pagado.
9. Opcionalmente adjunta foto o documento como comprobante.
10. Opcionalmente agrega observaciones.
11. Sistema guarda el pago asociado a la pension, al caballo pensionado y a su dueño.
12. Sistema registra historial.

Alternos:

- Si no se selecciona al menos un mes pagado, el sistema bloquea el guardado.
- Si el medio de pago es transferencia y no se adjunta comprobante, el sistema permite continuar porque el comprobante es opcional.
- Si se registra un mes ya pagado para la misma pension, el sistema debe advertir posible duplicado.
- Si se registra un pago sobre una pension finalizada o cancelada, el sistema debe advertir y pedir confirmacion administrativa.

### UC-PAG-EST-02 Consultar pagos de estadia

Flujo:

1. Administrador abre la pension o estadia.
2. Entra a Pagos de estadia.
3. Sistema muestra pagos ordenados por fecha.
4. Administrador puede filtrar por mes pagado, medio de pago o estado del pago.
5. Administrador abre un pago para ver detalle, observaciones y documentos asociados.

Alternos:

- Si la pension no tiene pagos registrados, muestra la seccion vacia.

### UC-PAG-EST-03 Editar pago de estadia

Flujo:

1. Administrador abre un registro de pago.
2. Selecciona Editar.
3. Modifica fecha de pago, meses pagados, medio, monto pagado, observaciones o comprobante.
4. Sistema guarda cambios.
5. Sistema registra antes/despues en historial.

Alternos:

- Si se modifica un mes pagado, el historial debe conservar el valor anterior y nuevo.

### UC-PAG-EST-04 Anular pago de estadia

Flujo:

1. Administrador abre un registro de pago.
2. Selecciona Anular pago.
3. Ingresa motivo.
4. Sistema marca el pago como anulado sin borrarlo fisicamente.
5. Sistema registra historial.

Alternos:

- No se recomienda eliminar fisicamente pagos porque sirven como respaldo administrativo.

## 6. Gestion de vacunas

### UC-VAC-01 Registrar vacuna

Actor: Administrador.

Aplica a: Caballos propios y caballos pensionados.

Flujo:

1. Administrador abre la ficha de un caballo.
2. Entra a la seccion Vacunas.
3. Selecciona Registrar vacuna.
4. Ingresa nombre de la vacuna, fecha de aplicacion y persona que la aplico.
5. Opcionalmente agrega observaciones.
6. Opcionalmente adjunta documentos o imagenes relacionadas.
7. Sistema guarda el registro asociado al caballo.
8. Sistema registra historial.

Campos:

1. Nombre de vacuna.
2. Fecha de aplicacion.
3. Quien la aplico.
4. Observaciones opcionales.
5. Documentos opcionales.

Alternos:

- Si se necesita registrar una proxima fecha, recordatorio o detalle adicional, debe anotarse en observaciones.
- Si se suben documentos juntos, quedan agrupados como lote documental.

### UC-VAC-02 Consultar vacunas

Flujo:

1. Administrador abre ficha del caballo.
2. Entra a Vacunas.
3. Sistema muestra historial de vacunas ordenado por fecha.
4. Administrador puede abrir detalle, ver documentos y descargar respaldos.

### UC-VAC-03 Editar vacuna

Flujo:

1. Administrador abre registro de vacuna.
2. Selecciona Editar.
3. Modifica informacion permitida.
4. Sistema guarda cambios.
5. Sistema registra historial.

### UC-VAC-04 Eliminar o anular vacuna

Flujo:

1. Administrador abre registro de vacuna.
2. Selecciona eliminar o anular.
3. Sistema solicita motivo.
4. Sistema aplica eliminacion logica o anulacion.
5. Sistema registra historial.

## 7. Gestion de herrajes

### UC-HER-01 Registrar herraje

Actor: Administrador.

Aplica a: Caballos propios y caballos pensionados.

Flujo:

1. Administrador abre la ficha de un caballo.
2. Entra a la seccion Herrajes.
3. Selecciona Registrar herraje.
4. Ingresa informacion del herraje.
5. Opcionalmente adjunta documentos o imagenes relacionadas.
6. Sistema guarda el registro asociado al caballo.
7. Sistema registra historial.

Alternos:

- Si se necesita registrar una proxima fecha, recordatorio o detalle adicional, debe anotarse en observaciones.
- Si se suben documentos juntos, quedan agrupados como lote documental.

### UC-HER-02 Consultar herrajes

Flujo:

1. Administrador abre ficha del caballo.
2. Entra a Herrajes.
3. Sistema muestra historial de herrajes ordenado por fecha.
4. Administrador puede abrir detalle, ver documentos y descargar respaldos.

### UC-HER-03 Editar herraje

Flujo:

1. Administrador abre registro de herraje.
2. Selecciona Editar.
3. Modifica informacion permitida.
4. Sistema guarda cambios.
5. Sistema registra historial.

### UC-HER-04 Eliminar o anular herraje

Flujo:

1. Administrador abre registro de herraje.
2. Selecciona eliminar o anular.
3. Sistema solicita motivo.
4. Sistema aplica eliminacion logica o anulacion.
5. Sistema registra historial.

## 8. Gestion documental

### UC-DOC-01 Subir documentos a un caballo, cliente u operacion

Actor: Administrador.

Flujo:

1. Administrador abre ficha de caballo, cliente u operacion relacionada.
2. Entra a la seccion Documentos.
3. Selecciona Subir documentos.
4. Selecciona uno o varios archivos.
5. Ingresa nombre y descripcion del conjunto documental.
6. Opcionalmente asigna nombre y descripcion individual a cada documento.
7. Sistema guarda los documentos agrupados en un lote.
8. Sistema registra historial.

Alternos:

- Si se sube un solo documento, igualmente puede quedar dentro de un lote documental.
- Si el archivo no tiene formato permitido, el sistema bloquea la carga.
- Si falta nombre del conjunto, el sistema debe sugerir uno basado en fecha y tipo.

### UC-DOC-02 Visualizar documentos

Flujo:

1. Administrador abre la seccion Documentos.
2. Sistema muestra lotes documentales y documentos individuales.
3. Administrador abre un documento.
4. Sistema permite visualizarlo dentro de la plataforma si el formato es compatible.

Alternos:

- Si el formato no permite previsualizacion, el sistema ofrece descarga.

### UC-DOC-03 Descargar documentos

Flujo:

1. Administrador abre lote documental o documento individual.
2. Selecciona Descargar documento o Descargar conjunto.
3. Sistema descarga el archivo individual o el conjunto completo.

## 9. Gestion genealogica

### UC-GEN-01 Registrar genealogia de caballo propio

Actor: Administrador.

Flujo:

1. Administrador abre ficha de caballo propio.
2. Entra a seccion Genealogia.
3. Selecciona padre y madre desde caballos registrados o ingresa nombres externos.
4. Sistema guarda las relaciones genealogicas.
5. Sistema actualiza arbol genealogico.
6. Sistema registra historial.

Alternos:

- Si padre o madre no existen como caballos registrados, quedan como referencias textuales sin ficha navegable.
- Si padre o madre existen como caballos registrados, el arbol permite navegar a sus fichas.

### UC-GEN-02 Visualizar arbol genealogico

Flujo:

1. Administrador abre ficha de caballo propio.
2. Entra a pestana Arbol genealogico.
3. Sistema muestra padre, madre, ascendencia y descendencia hasta el nivel disponible.
4. Administrador selecciona un caballo visible en el arbol.
5. Sistema abre su ficha como cualquier otro caballo.

Alternos:

- Si el nodo genealogico es solo texto externo, no permite navegacion a ficha.
- Si faltan datos, el arbol se muestra incompleto sin bloquear la visualizacion.

## 10. Gestion de estados de caballos

### UC-EST-CAB-01 Cambiar estado de caballo

Actor: Administrador.

Flujo:

1. Administrador abre ficha del caballo.
2. Selecciona cambiar estado.
3. Escoge nuevo estado desde catalogo permitido.
4. Opcionalmente ingresa motivo o nota.
5. Sistema guarda cambio.
6. Sistema registra historial.

Alternos:

- Si el estado tiene restricciones, el sistema debe validarlas antes de guardar.
- Si el cambio afecta disponibilidad, pension o seguimiento, las secciones relacionadas deben actualizarse.

Decision pendiente:

- Los caballos propios y los caballos pensionados deben tener estados gestionados por separado.
- El catalogo exacto de estados queda pendiente de definicion.
- El sistema debe permitir que administradores gestionen o configuren estos estados segun corresponda.

---

# B. Especificacion de pantallas

Pendiente.

---

# C. Modelo de datos

Pendiente.

---

# D. Validaciones y reglas de negocio

Pendiente.

---

# E. Endpoints API /api/v1

Pendiente.

---

# F. Estados por modulo

Pendiente.

---

# G. Modelo de permisos

Pendiente.

---

# H. Arquitectura objetivo

Pendiente.

---

# I. Requisitos no funcionales

Pendiente.

---

# J. Estrategia de pruebas

Pendiente.

---

# K. Trazabilidad

Pendiente.

---

# L. Gate de cierre de especificacion

Pendiente.
