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

Campos obligatorios:

1. Nombre.
2. Sexo.
3. Color.
4. Distintivos.

Campos opcionales:

1. Notas.
2. Documentos.
3. Fotos o bocetos.
4. Nombre del criadero.
5. Fecha de nacimiento.
6. Nombre del criador.
7. Lugar donde se encuentra temporalmente.
8. Padre.
9. Madre.
10. Estado propio.

Decision funcional:

- No se agregaran campos fijos adicionales como raza, numero de chip o numero de registro.
- Si esos antecedentes existen, podran registrarse como notas o documentos asociados al caballo.

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

Campos obligatorios:

1. Nombre.
2. Sexo.
3. Color.
4. Distintivos.
5. Dueño o cliente.

Campos opcionales:

1. Notas.
2. Documentos.
3. Fotos o bocetos.
4. Nombre del criadero.
5. Fecha de nacimiento.
6. Nombre del criador.
7. Padre.
8. Madre.
9. Estado pensionado.

Decision funcional:

- No se agregaran campos fijos adicionales como raza, numero de chip o numero de registro.
- Si esos antecedentes existen, podran registrarse como notas o documentos asociados al caballo.

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

Decision funcional:

- No se registrara responsable de entrega ni responsable de retiro del caballo.
- La entrega, recepcion, salida y retiro seran gestionados internamente por la administradora principal del criadero.

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
- Si se registra un mes ya pagado para la misma pension, el sistema debe advertir el duplicado y bloquear el guardado.
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

### UC-DOC-01 Subir documentos a un caballo, cliente, pension u operacion

Actor: Administrador.

Flujo:

1. Administrador abre ficha de caballo, cliente, pension u operacion relacionada.
2. Entra a la seccion Documentos.
3. Selecciona Subir documentos.
4. Selecciona uno o varios archivos.
5. Ingresa nombre y descripcion del conjunto documental.
6. Opcionalmente asigna nombre y descripcion individual a cada documento.
7. Sistema guarda los documentos agrupados en un lote.
8. Sistema registra historial.

Decision funcional:

- No existira un catalogo preconfigurado de tipos de documento.
- El administrador asignara manualmente el nombre que corresponda al conjunto documental.
- La descripcion sera libre y permitira explicar el contenido o contexto de los documentos.

Alternos:

- Si se sube un solo documento, igualmente puede quedar dentro de un lote documental.
- Si el archivo no tiene formato permitido, el sistema bloquea la carga.
- Si falta nombre del conjunto, el sistema bloquea el guardado o solicita ingresar un nombre.

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

Decision funcional:

- Los caballos propios y los caballos pensionados deben tener estados gestionados por separado.
- El catalogo inicial de estados queda definido en la seccion F.
- El sistema debe permitir que administradores gestionen o configuren estos estados segun corresponda.

---

# B. Especificacion de pantallas

## P-01 Login

Campos:

1. Correo.
2. Contraseña.

Acciones:

1. Iniciar sesion.
2. Recuperar contraseña.

Validaciones:

1. Correo debe tener formato valido.
2. Contraseña es obligatoria.
3. Usuario debe estar activo en el sistema.

## P-02 Aceptar invitacion / crear cuenta de administrador

Campos:

1. Nombre.
2. Apellido.
3. Correo.
4. Contraseña.
5. Confirmacion de contraseña.
6. Token de invitacion.

Acciones:

1. Aceptar invitacion.
2. Crear cuenta.
3. Cancelar.

Validaciones:

1. Token valido, vigente y no utilizado.
2. Correo asociado a la invitacion.
3. Contraseñas coincidentes.

## P-03 Dashboard interno

Muestra:

1. Total de caballos propios.
2. Total de caballos pensionados.
3. Pensiones activas.
4. Pensiones pendientes de pago o con deuda.
5. Ultimos pagos registrados.
6. Ultimas vacunas registradas.
7. Ultimos herrajes registrados.
8. Ultimos documentos subidos.
9. Ultimos cambios en historial.

Acciones:

1. Abrir P-04 Buscador global.
2. Abrir ficha de caballo.
3. Abrir ficha de cliente.
4. Abrir pension.
5. Abrir P-06 Modal crear caballo propio.
6. Abrir P-09 Modal crear cliente.
7. Abrir P-15 Modal crear pension.

## P-04 Buscador global

Campos:

1. Texto de busqueda.
2. Filtro por tipo: todos, caballos propios, caballos pensionados, clientes, pensiones, documentos.

Muestra:

1. Resultados agrupados por tipo.
2. Nombre principal.
3. Datos secundarios relevantes.
4. Acceso directo a ficha.

Acciones:

1. Buscar.
2. Limpiar busqueda.
3. Abrir resultado.

## P-05 Listado de caballos propios

Filtros:

1. Nombre.
2. Sexo.
3. Color.
4. Estado propio.
5. Lugar donde se encuentra temporalmente.

Muestra:

1. Nombre.
2. Sexo.
3. Color.
4. Distintivos resumidos.
5. Estado.
6. Lugar donde se encuentra temporalmente.

Acciones:

1. Abrir P-06 Modal crear caballo propio.
2. Abrir P-07 Ficha.
3. Abrir P-26 Modal editar.
4. Abrir P-30 Modal cambiar estado.

## P-06 Modal crear caballo propio

Modal que se abre desde P-05 Listado de caballos propios o P-03 Dashboard.

Campos obligatorios:

1. Nombre.
2. Sexo.
3. Color.
4. Distintivos.

Campos opcionales:

1. Notas.
2. Nombre del criadero.
3. Fecha de nacimiento.
4. Nombre del criador.
5. Lugar donde se encuentra temporalmente.
6. Padre.
7. Madre.
8. Estado propio.
9. Documentos.
10. Fotos o bocetos.

Acciones:

1. Guardar.
2. Cancelar.
3. Subir documentos.
4. Subir fotos o bocetos.

Validaciones:

1. Nombre, sexo, color y distintivos son obligatorios.
2. Padre y madre pueden ser caballos registrados o nombres externos.

## P-07 Ficha de caballo propio

Muestra:

1. Datos generales.
2. Notas.
3. Fotos y bocetos.
4. Documentos.
5. Vacunas.
6. Herrajes.
7. Arbol genealogico.
8. Historial.

Acciones:

1. Abrir P-26 Modal editar caballo propio.
2. Abrir P-30 Modal cambiar estado.
3. Abrir P-18 Modal registrar vacuna.
4. Abrir P-23 Modal registrar herraje.
5. Abrir P-25 Modal subir documentos.
6. Navegar a P-19 Arbol genealogico.
7. Navegar a P-20 Historial.

## P-08 Listado de clientes

Filtros:

1. Nombre.
2. Apellido.
3. Numero de contacto.
4. Direccion.

Muestra:

1. Nombre.
2. Apellido.
3. Direccion.
4. Numero de contacto.
5. Cantidad de caballos asociados.
6. Pensiones activas.

Acciones:

1. Abrir P-09 Modal crear cliente.
2. Abrir P-10 Ficha.
3. Abrir P-27 Modal editar.
4. Inactivar.

## P-09 Modal crear cliente

Modal que se abre desde P-08 Listado de clientes o P-03 Dashboard.

Campos:

1. Nombre.
2. Apellido.
3. Direccion.
4. Numero de contacto.
5. Notas.
6. Documentos.

Acciones:

1. Guardar.
2. Cancelar.
3. Subir documentos.

Validaciones:

1. Nombre es obligatorio.
2. Apellido es obligatorio.
3. Numero de contacto es obligatorio.

## P-10 Ficha de cliente

Muestra:

1. Datos personales.
2. Notas.
3. Caballos pensionados asociados.
4. Pensiones o estadias.
5. Pagos relacionados.
6. Documentos.
7. Historial.

Acciones:

1. Abrir P-27 Modal editar cliente.
2. Inactivar cliente.
3. Abrir P-12 Modal crear caballo pensionado.
4. Abrir P-15 Modal crear pension para caballo asociado.
5. Abrir P-25 Modal subir documentos.

## P-11 Listado de caballos pensionados

Filtros:

1. Nombre del caballo.
2. Dueño o cliente.
3. Sexo.
4. Color.
5. Estado pensionado.

Muestra:

1. Nombre.
2. Dueño.
3. Sexo.
4. Color.
5. Distintivos resumidos.
6. Estado pensionado.
7. Pension activa si existe.

Acciones:

1. Abrir P-12 Modal crear caballo pensionado.
2. Abrir P-13 Ficha.
3. Abrir P-28 Modal editar.
4. Abrir P-30 Modal cambiar estado.

## P-12 Modal crear caballo pensionado

Modal que se abre desde P-11 Listado de caballos pensionados.

Campos obligatorios:

1. Nombre.
2. Sexo.
3. Color.
4. Distintivos.
5. Dueño o cliente.

Campos opcionales:

1. Notas.
2. Nombre del criadero.
3. Fecha de nacimiento.
4. Nombre del criador.
5. Padre.
6. Madre.
7. Estado pensionado.
8. Documentos.
9. Fotos o bocetos.

Acciones:

1. Guardar.
2. Cancelar.
3. Subir documentos.
4. Subir fotos o bocetos.

Validaciones:

1. Debe existir un cliente seleccionado como dueño.
2. Nombre, sexo, color, distintivos y dueño son obligatorios.

## P-13 Ficha de caballo pensionado

Muestra:

1. Datos generales.
2. Dueño.
3. Notas.
4. Fotos y bocetos.
5. Documentos.
6. Pensiones o estadias.
7. Vacunas.
8. Herrajes.
9. Historial.

Acciones:

1. Abrir P-28 Modal editar caballo pensionado.
2. Abrir P-30 Modal cambiar estado.
3. Abrir P-15 Modal crear pension o estadia.
4. Abrir pension existente (navega a P-14).
5. Abrir P-18 Modal registrar vacuna.
6. Abrir P-23 Modal registrar herraje.
7. Abrir P-25 Modal subir documentos.
8. Consultar historial.

## P-14 Ficha de pension/estadia

Campos:

1. ID de pension.
2. Caballo.
3. Cliente dueño.
4. Fecha de inicio.
5. Fecha de salida estimada.
6. Fecha de salida real.
7. Tipo de pension.
8. Estado del acuerdo.
9. Costo Pension.
10. Fardos acordados por mes.
11. Avena acordada por mes.
12. Otros insumos.
13. Notas de cuidado.
14. Documentos o fotos de llegada/salida.

Acciones:

1. Abrir P-16 Modal editar pension.
2. Abrir P-31 Modal finalizar pension.
3. Anular pension.
4. Abrir P-17 Modal registrar pago.
5. Abrir P-25 Modal subir documentos.
6. Ver pagos.
7. Ver historial.

Validaciones:

1. Fecha de inicio es obligatoria.
2. Tipo de pension es obligatorio.
3. Estado del acuerdo es obligatorio.
4. Costo Pension es obligatorio.

## P-15 Modal crear pension/estadia

Modal que se abre desde P-13 Ficha de caballo pensionado o P-14 Ficha de pension/estadia.

Campos:

1. Fecha de inicio.
2. Fecha de salida estimada.
3. Tipo de pension.
4. Estado inicial del acuerdo.
5. Costo Pension.
6. Fardos acordados por mes.
7. Avena acordada por mes.
8. Otros insumos.
9. Notas de cuidado.
10. Documentos o fotos de llegada.

Acciones:

1. Guardar.
2. Cancelar.
3. Subir documentos.

Validaciones:

1. Fecha de inicio es obligatoria.
2. Tipo de pension es obligatorio.
3. Estado del acuerdo es obligatorio.
4. Costo Pension es obligatorio.
5. Si tipo de pension es Otro, debe ingresarse descripcion.

## P-16 Modal editar pension/estadia

Modal que se abre desde P-14 Ficha de pension/estadia al seleccionar Editar.

Campos:

1. Fecha de inicio.
2. Fecha de salida estimada.
3. Tipo de pension.
4. Estado del acuerdo.
5. Costo Pension.
6. Fardos acordados por mes.
7. Avena acordada por mes.
8. Otros insumos.
9. Notas de cuidado.
10. Documentos o fotos.

Acciones:

1. Guardar cambios.
2. Cancelar.
3. Subir documentos.

Validaciones:

1. Fecha de inicio es obligatoria.
2. Tipo de pension es obligatorio.
3. Estado del acuerdo es obligatorio.
4. Costo Pension es obligatorio.
5. Si cambia el costo, no altera pagos ya registrados.

## P-17 Modal registrar pago de estadia

Modal que se abre desde P-14 Ficha de pension/estadia.

Campos:

1. Fecha de pago.
2. Meses pagados.
3. Medio de pago: efectivo o transferencia.
4. Monto pagado.
5. Comprobante opcional.
6. Observaciones.

Acciones:

1. Guardar.
2. Cancelar.
3. Subir comprobante.

Validaciones:

1. Fecha de pago es obligatoria.
2. Al menos un mes pagado es obligatorio.
3. Medio de pago es obligatorio.
4. Monto pagado es obligatorio.
5. Advertir si el mes ya fue pagado en la misma pension.

## P-18 Modal registrar vacuna

Modal que se abre desde P-07 Ficha de caballo propio o P-13 Ficha de caballo pensionado.

Campos:

1. Nombre de vacuna.
2. Fecha de aplicacion.
3. Quien lo aplico.
4. Observaciones.
5. Documentos opcionales.

Acciones:

1. Guardar.
2. Cancelar.
3. Subir documentos.

Validaciones:

1. Nombre de vacuna es obligatorio.
2. Fecha de aplicacion es obligatoria.
3. Quien lo aplico es obligatorio.

## P-19 Arbol genealogico

Muestra:

1. Caballo principal.
2. Padre.
3. Madre.
4. Ascendencia disponible.
5. Descendencia disponible.
6. Nodos externos solo como texto.

Acciones:

1. Seleccionar padre.
2. Seleccionar madre.
3. Ingresar padre externo.
4. Ingresar madre externa.
5. Abrir ficha de caballo registrado desde el arbol.

Validaciones:

1. Padre y madre pueden quedar incompletos.
2. Nodos externos no tienen ficha navegable.

## P-20 Historial / auditoria

Filtros:

1. Fecha.
2. Usuario administrador.
3. Tipo de entidad.
4. Accion.

Muestra:

1. Fecha y hora.
2. Usuario.
3. Entidad afectada.
4. Accion realizada.
5. Valores anteriores y nuevos cuando corresponda.
6. Motivo cuando exista.

Acciones:

1. Consultar historial.
2. Abrir entidad relacionada.

## P-21 Administradores e invitaciones

Muestra:

1. Administradores activos.
2. Invitaciones pendientes.
3. Invitaciones usadas.
4. Invitaciones vencidas.

Acciones:

1. Crear invitacion.
2. Copiar link de invitacion.
3. Revocar invitacion.
4. Activar o inactivar administrador.

Validaciones:

1. Solo administradores autorizados pueden invitar.
2. Invitacion debe tener expiracion.
3. Link de invitacion solo puede usarse una vez.

## P-22 Modal editar pago de estadia

Modal que se abre desde la seccion de pagos en P-14 Ficha de pension/estadia.

Campos:

1. Fecha de pago.
2. Meses pagados.
3. Medio de pago: efectivo o transferencia.
4. Monto pagado.
5. Comprobante opcional.
6. Observaciones.

Acciones:

1. Guardar cambios.
2. Cancelar.
3. Subir comprobante.

Validaciones:

1. Fecha de pago es obligatoria.
2. Al menos un mes pagado es obligatorio.
3. Medio de pago es obligatorio.
4. Monto pagado es obligatorio.
5. Advertir si el mes ya fue pagado en la misma pension.

## P-23 Modal registrar herraje

Modal que se abre desde P-07 Ficha de caballo propio o P-13 Ficha de caballo pensionado.

Campos:

1. Informacion del herraje.
2. Fecha.
3. Observaciones.
4. Documentos opcionales.

Acciones:

1. Guardar.
2. Cancelar.
3. Subir documentos.

Validaciones:

1. Fecha es obligatoria.
2. Informacion del herraje es obligatoria.

## P-24 Modal editar herraje

Modal que se abre desde el detalle de herraje en P-07 o P-13.

Campos:

1. Informacion del herraje.
2. Fecha.
3. Observaciones.
4. Documentos opcionales.

Acciones:

1. Guardar cambios.
2. Cancelar.
3. Subir documentos.

Validaciones:

1. Fecha es obligatoria.
2. Informacion del herraje es obligatoria.

## P-25 Modal subir documentos

Modal que se abre desde P-07 Ficha de caballo propio, P-10 Ficha de cliente, P-13 Ficha de caballo pensionado o P-14 Ficha de pension/estadia, segun la entidad de origen.

Campos:

1. Archivos.
2. Nombre del conjunto documental.
3. Descripcion del conjunto.
4. Nombre individual opcional por archivo.
5. Descripcion individual opcional por archivo.

Acciones:

1. Subir.
2. Cancelar.

Validaciones:

1. Nombre del conjunto documental es obligatorio.
2. Al menos un archivo es obligatorio.
3. Formato de archivo permitido.
4. Tamaño de archivo no excede el maximo.

## P-26 Modal editar caballo propio

Modal que se abre desde P-07 Ficha de caballo propio al seleccionar Editar.

Campos obligatorios:

1. Nombre.
2. Sexo.
3. Color.
4. Distintivos.

Campos opcionales:

1. Notas.
2. Nombre del criadero.
3. Fecha de nacimiento.
4. Nombre del criador.
5. Lugar donde se encuentra temporalmente.
6. Padre.
7. Madre.
8. Estado propio.

Acciones:

1. Guardar cambios.
2. Cancelar.

Validaciones:

1. Nombre, sexo, color y distintivos son obligatorios.
2. Padre y madre pueden ser caballos registrados o nombres externos.

## P-27 Modal editar cliente

Modal que se abre desde P-10 Ficha de cliente al seleccionar Editar.

Campos:

1. Nombre.
2. Apellido.
3. Direccion.
4. Numero de contacto.
5. Notas.

Acciones:

1. Guardar cambios.
2. Cancelar.

Validaciones:

1. Nombre es obligatorio.
2. Apellido es obligatorio.
3. Numero de contacto es obligatorio.

## P-28 Modal editar caballo pensionado

Modal que se abre desde P-13 Ficha de caballo pensionado al seleccionar Editar.

Campos obligatorios:

1. Nombre.
2. Sexo.
3. Color.
4. Distintivos.
5. Dueño o cliente.

Campos opcionales:

1. Notas.
2. Nombre del criadero.
3. Fecha de nacimiento.
4. Nombre del criador.
5. Padre.
6. Madre.
7. Estado pensionado.

Acciones:

1. Guardar cambios.
2. Cancelar.

Validaciones:

1. Debe existir un cliente seleccionado como dueño.
2. Nombre, sexo, color, distintivos y dueño son obligatorios.

## P-29 Modal editar vacuna

Modal que se abre desde el detalle de vacuna en P-07 o P-13.

Campos:

1. Nombre de vacuna.
2. Fecha de aplicacion.
3. Quien lo aplico.
4. Observaciones.
5. Documentos opcionales.

Acciones:

1. Guardar cambios.
2. Cancelar.
3. Subir documentos.

Validaciones:

1. Nombre de vacuna es obligatorio.
2. Fecha de aplicacion es obligatoria.
3. Quien lo aplico es obligatorio.

## P-30 Modal cambiar estado de caballo

Modal que se abre desde P-07 Ficha de caballo propio o P-13 Ficha de caballo pensionado.

Campos:

1. Nuevo estado segun catalogo por tipo de caballo.
2. Motivo o nota opcional.

Acciones:

1. Confirmar cambio.
2. Cancelar.

Validaciones:

1. El estado debe ser valido para el tipo de caballo.
2. Cambios de estado deben quedar en historial.

## P-31 Modal finalizar pension

Modal que se abre desde P-14 Ficha de pension/estadia al seleccionar Finalizar.

Campos:

1. Fecha de salida real.
2. Fotos o documentos de salida opcionales.

Acciones:

1. Confirmar finalizacion.
2. Cancelar.

Validaciones:

1. Fecha de salida real obligatoria.
2. Fecha de salida no puede ser anterior a la fecha de inicio.
3. Advertir si existen pagos pendientes o deuda.

## P-32 Modal editar documento

Modal que se abre desde la seccion Documentos de cualquier ficha.

Campos:

1. Nombre del conjunto documental.
2. Descripcion del conjunto.
3. Nombre individual por archivo.
4. Descripcion individual por archivo.

Acciones:

1. Guardar cambios.
2. Cancelar.

Validaciones:

1. Nombre del conjunto documental es obligatorio.

## P-33 Modal recuperar contraseña

Modal que se abre desde P-01 Login.

Campos:

1. Correo electronico registrado.

Acciones:

1. Enviar enlace de recuperacion.
2. Cancelar.

Validaciones:

1. Correo debe tener formato valido.
2. Correo debe estar registrado en el sistema.

## P-34 Modal restablecer contraseña

Modal que se abre desde el enlace de recuperacion enviado por correo.

Campos:

1. Nueva contraseña.
2. Confirmacion de nueva contraseña.

Acciones:

1. Restablecer contraseña.
2. Cancelar.

Validaciones:

1. Token de recuperacion valido y vigente.
2. Contraseñas coincidentes.
3. Longitud minima de contraseña.

## P-35 Perfil de usuario administrador

Pantalla accesible desde el menu de navegacion para el usuario autenticado.

Muestra:

1. Nombre.
2. Apellido.
3. Correo.
4. Rol.
5. Estado de cuenta.

Acciones:

1. Editar nombre y apellido.
2. Cambiar contraseña.
3. Cerrar sesion.

Validaciones:

1. Solo puede ver y editar su propio perfil.
2. No puede cambiar su propio rol.

## P-36 Configuracion del sistema

Pantalla accesible solo para owner desde el menu de navegacion.

Muestra:

1. Parametros generales del sistema.
2. Formatos de archivo permitidos.
3. Tamaño maximo de archivos.
4. Tiempo de expiracion de invitaciones por defecto.
5. Estados de caballos configurables.

Acciones:

1. Guardar configuracion.

Validaciones:

1. Solo owner puede acceder y modificar.
2. Cambios deben quedar en historial con tipo system.

---

# C. Modelo de datos

Decision de modelado:

- Se usara una sola entidad `horses` para caballos propios y caballos pensionados.
- La diferencia se manejara con el campo `ownership_type`.
- Valores iniciales de `ownership_type`: `own`, `boarded`.
- Las pantallas podran separar caballos propios y caballos pensionados mediante filtros, rutas o vistas especificas.
- Esta decision evita duplicar documentos, vacunas, herrajes, fotos, genealogia e historial.

## Entidades principales

| entidad | proposito | campos clave |
|---|---|---|
| `users` | administradores con acceso al sistema | `id`, `first_name`, `last_name`, `email`, `password_hash`, `role_id`, `status`, `created_at`, `updated_at` |
| `user_roles` | catalogo de roles del sistema | `id`, `code`, `name`, `description`, `is_active` |
| `user_sessions` | sesiones activas de administradores | `id`, `user_id`, `token`, `refresh_token`, `expires_at`, `ip_address`, `created_at` |
| `password_reset_tokens` | tokens de recuperacion de contraseña | `id`, `user_id`, `token`, `expires_at`, `used_at`, `created_at` |
| `user_preferences` | preferencias por usuario | `id`, `user_id`, `preference_key`, `preference_value` |
| `admin_invitations` | links de invitacion para nuevos administradores | `id`, `email`, `token`, `status`, `expires_at`, `used_at`, `created_by`, `created_at` |
| `clients` | clientes externos dueños de caballos pensionados | `id`, `first_name`, `last_name`, `primary_address_id`, `notes`, `status_id`, `created_at`, `updated_at` |
| `client_statuses` | catalogo de estados de cliente | `id`, `code`, `name`, `description`, `is_active` |
| `client_contacts` | contactos normalizados por cliente | `id`, `client_id`, `contact_type`, `value`, `notes`, `is_primary` |
| `addresses` | direcciones normalizadas | `id`, `client_id`, `street`, `city_id`, `postal_code`, `type`, `is_primary` |
| `regions` | regiones o provincias | `id`, `name` |
| `cities` | ciudades asociadas a regiones | `id`, `region_id`, `name` |
| `horses` | caballos propios y pensionados | `id`, `ownership_type_id`, `client_id`, `name`, `sex_id`, `color_id`, `breed_id`, `distinctive_marks`, `notes`, `breeding_farm_name`, `birth_date`, `breeder_name`, `temporary_location`, `status_id`, `created_at`, `updated_at` |
| `horse_ownership_types` | catalogo de tipo de propiedad | `id`, `code`, `name`, `description` |
| `horse_sexes` | catalogo de sexos de caballo | `id`, `code`, `name` |
| `horse_colors` | catalogo de colores o pelajes | `id`, `code`, `name`, `description` |
| `horse_breeds` | catalogo de razas de caballo | `id`, `code`, `name`, `description` |
| `horse_statuses` | estados configurables de caballos | `id`, `horse_type`, `name`, `description`, `is_active`, `sort_order` |
| `horse_gallery` | fotos y bocetos de caballos | `id`, `horse_id`, `file_name`, `title`, `description`, `type`, `storage_path`, `uploaded_by`, `created_at` |
| `horse_genealogy` | relaciones genealogicas de caballos | `id`, `horse_id`, `father_horse_id`, `mother_horse_id`, `father_external_name`, `mother_external_name`, `created_at`, `updated_at` |
| `boarding_stays` | pensiones o estadias independientes de caballos pensionados | `id`, `horse_id`, `client_id`, `start_date`, `estimated_end_date`, `actual_end_date`, `boarding_type_id`, `custom_boarding_type`, `agreement_status_id`, `boarding_cost`, `care_notes`, `created_at`, `updated_at` |
| `boarding_types` | catalogo de tipos de pension | `id`, `code`, `name`, `description`, `is_active` |
| `agreement_statuses` | catalogo de estados del acuerdo | `id`, `code`, `name`, `description`, `sort_order` |
| `boarding_stay_supplies` | insumos acordados por pension | `id`, `boarding_stay_id`, `supply_id`, `quantity_per_month`, `unit`, `notes` |
| `boarding_payments` | pagos asociados a una pension especifica | `id`, `boarding_stay_id`, `horse_id`, `client_id`, `payment_date`, `paid_months`, `payment_method_id`, `amount_paid`, `notes`, `status_id`, `created_at`, `updated_at` |
| `payment_methods` | catalogo de medios de pago | `id`, `code`, `name`, `description` |
| `payment_statuses` | catalogo de estados de pago | `id`, `code`, `name`, `description` |
| `vaccinations` | vacunas registradas a cualquier caballo | `id`, `horse_id`, `vaccine_name`, `application_date`, `applied_by`, `notes`, `status_id`, `created_at`, `updated_at` |
| `vaccination_statuses` | catalogo de estados de vacuna | `id`, `code`, `name`, `description` |
| `farrier_records` | herrajes registrados a cualquier caballo | `id`, `horse_id`, `service_date`, `description`, `notes`, `status_id`, `created_at`, `updated_at` |
| `farrier_record_statuses` | catalogo de estados de herraje | `id`, `code`, `name`, `description` |
| `health_treatments` | eventos sanitarios generales (unifica vacunas/herrajes + otros) | `id`, `horse_id`, `treatment_type`, `date`, `description`, `performed_by`, `notes`, `status_id`, `created_at`, `updated_at` |
| `supplies` | catalogo de insumos | `id`, `name`, `unit`, `description`, `is_active` |
| `feed_inventory` | control de existencias de insumos | `id`, `supply_id`, `quantity`, `unit`, `entry_date`, `expiry_date`, `notes` |
| `document_batches` | conjunto de documentos subidos juntos | `id`, `entity_type`, `entity_id`, `name`, `description`, `uploaded_by`, `status`, `created_at`, `updated_at` |
| `documents` | archivos individuales dentro de un conjunto documental | `id`, `batch_id`, `file_name`, `display_name`, `description`, `mime_type`, `file_size`, `storage_path`, `status`, `created_at` |
| `file_formats` | formatos de archivo permitidos | `id`, `extension`, `mime_type`, `max_size`, `is_active` |
| `audit_logs` | historial de acciones y modificaciones | `id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `importance_id`, `event_type_id`, `before`, `after`, `reason`, `created_at` |
| `audit_log_field_changes` | cambios individuales por campo en auditoria | `id`, `audit_log_id`, `field_name`, `old_value`, `new_value` |
| `importance_levels` | catalogo de niveles de importancia | `id`, `code`, `name`, `description`, `sort_order` |
| `event_types` | catalogo de tipos de evento de auditoria | `id`, `code`, `name`, `description` |
| `system_config` | parametros globales del sistema | `id`, `key`, `value`, `description`, `updated_by`, `updated_at` |
| `notification_log` | historial de notificaciones internas | `id`, `user_id`, `notification_type`, `message`, `read_at`, `created_at` |

## Reglas del modelo

1. Si `horses.ownership_type_id = own`, entonces `client_id` debe quedar vacio.
2. Si `horses.ownership_type_id = boarded`, entonces `client_id` es obligatorio.
3. `temporary_location` aplica solo a caballos propios.
4. Los caballos pensionados se asumen ubicados en las pecebreras del criadero.
5. Un caballo pensionado puede tener muchas `boarding_stays`.
6. Cada `boarding_stay` representa una temporada, periodo o acuerdo independiente.
7. Los pagos se asocian a `boarding_stays`, no directamente al caballo como acuerdo general.
8. Vacunas, herrajes y tratamientos se asocian siempre a `horses`.
9. Documentos se asocian de forma polimorfica mediante `entity_type` y `entity_id`.
10. `horse_statuses.horse_type` debe permitir estados separados para caballos propios y pensionados.
11. Todo campo FK que apunte a una tabla de catalogo (ej: `sex_id`, `color_id`, `boarding_type_id`) debe referenciar un registro existente en la tabla correspondiente.
12. Las tablas de catalogo deben poblarse con valores semilla durante la inicializacion del sistema.
13. La tabla `boarding_stay_supplies` reemplaza los campos `monthly_hay_bales`, `monthly_oats` y `other_supplies` de la entidad `boarding_stays`. Cada insumo se registra como una fila separada.
14. `horse_gallery.type` distingue entre `photo` y `boceto`. Las imagenes de galeria tienen su propio almacenamiento separado de los documentos generales.
15. `client_contacts` permite multiples contactos (telefono, email, otros) por cliente. Al menos un contacto debe marcarse como `is_primary`.
16. `addresses` permite multiples direcciones por cliente. `primary_address_id` en `clients` es la direccion principal vigente.
17. `audit_log_field_changes` desnormaliza los `before`/`after` de `audit_logs` para permitir filtrado granular por campo modificado.
18. `system_config` almacena parametros globales (tamaño maximo de archivos, expiracion de invitaciones, etc.). Solo owner puede modificar sus valores.
19. `health_treatments` unifica eventos sanitarios. `treatment_type` define si es vacuna, herraje, desparasitacion, curacion u otro cuidado.
20. `user_sessions` permite control de sesiones activas y refresh tokens. Una sesion expirada se considera cerrada.
21. `password_reset_tokens` son de un solo uso. Al usarse, `used_at` se actualiza y el token no puede reutilizarse.
22. `feed_inventory` registra entradas de insumos. La salida o consumo se gestiona fuera del alcance actual, pero la tabla permite trazabilidad de existencias.
23. `notification_log` no implica notificaciones en tiempo real. Es un registro historico de notificaciones generadas por el sistema.

## Valores semilla para tablas de catalogo

Las siguientes tablas de catalogo deben poblarse durante la inicializacion del sistema. Los valores pueden ser modificados posteriormente por administradores autorizados.

### `user_roles`

| code | name |
|---|---|
| `owner` | Propietaria |
| `admin` | Administrador |

### `horse_ownership_types`

| code | name |
|---|---|
| `own` | Propio |
| `boarded` | Pensionado |

### `horse_sexes`

| code | name |
|---|---|
| `male` | Macho |
| `female` | Hembra |
| `gelding` | Capon |

### `boarding_types`

| code | name | description |
|---|---|---|
| `client_supplies` | Insumos aportados por cliente | El cliente provee los insumos |
| `farm_supplies` | Insumos incluidos por criadero | El criadero incluye los insumos |
| `mixed` | Mixta | Combinacion de ambos |
| `other` | Otro | Describir en campo libre |

### `agreement_statuses`

| code | name | sort_order |
|---|---|---|
| `active` | Activo | 1 |
| `payment_pending` | Pendiente de pago | 2 |
| `debt` | Con deuda | 3 |
| `finished` | Finalizado | 4 |
| `cancelled` | Cancelado | 5 |

### `payment_methods`

| code | name |
|---|---|
| `cash` | Efectivo |
| `bank_transfer` | Transferencia |

### `payment_statuses`

| code | name |
|---|---|
| `valid` | Valido |
| `cancelled` | Anulado |

### `client_statuses`

| code | name |
|---|---|
| `active` | Activo |
| `inactive` | Inactivo |

### `vaccination_statuses`

| code | name |
|---|---|
| `valid` | Valida |
| `cancelled` | Anulada |

### `farrier_record_statuses`

| code | name |
|---|---|
| `valid` | Valido |
| `cancelled` | Anulado |

### `importance_levels`

| code | name | sort_order |
|---|---|---|
| `low` | Baja | 1 |
| `medium` | Media | 2 |
| `high` | Alta | 3 |
| `critical` | Critica | 4 |

### `event_types`

| code | name |
|---|---|
| `horse` | Caballo |
| `client` | Cliente |
| `boarding_stay` | Pension |
| `boarding_payment` | Pago |
| `vaccination` | Vacuna |
| `farrier_record` | Herraje |
| `health_treatment` | Tratamiento |
| `document` | Documento |
| `genealogy` | Genealogia |
| `security` | Seguridad |
| `system` | Sistema |

### `document entity_type`

(Se mantiene como referencia polimorfica, no requiere tabla separada.)

1. `horse`.
2. `client`.
3. `boarding_stay`.
4. `boarding_payment`.
5. `vaccination`.
6. `farrier_record`.
7. `health_treatment`.

---

# D. Validaciones y reglas de negocio

## D.1 Reglas generales

1. Todo caballo debe tener nombre, sexo, color y distintivos.
2. Todo caballo pensionado debe tener cliente dueño.
3. Un caballo propio no debe tener cliente dueño.
4. Un caballo pensionado puede tener varias pensiones, pero solo una pension activa a la vez.
5. Cada pension debe tener fecha de inicio, tipo de pension, estado del acuerdo y Costo Pension.
6. No se debe registrar pago sin pension asociada.
7. No se debe registrar pago sin fecha, meses pagados, medio de pago y monto pagado.
8. Si un mes ya fue pagado en la misma pension, el sistema debe advertir el duplicado y bloquear el guardado.
9. Vacunas requieren nombre, fecha de aplicacion y quien la aplico.
10. Herrajes requieren fecha e informacion del herraje.
11. Todo documento debe pertenecer a un lote documental con nombre.
12. No se elimina fisicamente informacion con historial; se inactiva, anula, cancela o finaliza segun corresponda.
13. Todo campo FK a tabla de catalogo debe contener un ID valido existente en la tabla referenciada.
14. `sex_id`, `color_id`, `breed_id`, `ownership_type_id` en `horses` son FK obligatorios a sus catalogos respectivos.
15. `boarding_type_id` y `agreement_status_id` en `boarding_stays` son FK obligatorios.
16. `payment_method_id` en `boarding_payments` es FK obligatorio a `payment_methods`.
17. `role_id` en `users` es FK obligatorio a `user_roles`.
18. `client_status_id` en `clients` es FK obligatorio a `client_statuses`.
19. Cada registro en `boarding_stay_supplies` debe tener un `boarding_stay_id` valido y un `supply_id` valido.
20. `supply_id` en `feed_inventory` debe referenciar un insumo existente en `supplies`.
21. `importance_id` en `audit_logs` debe referenciar un nivel valido en `importance_levels`.
22. `event_type_id` en `audit_logs` debe referenciar un tipo valido en `event_types`.
23. La galeria `horse_gallery` solo acepta `type` = `photo` o `boceto`.
24. `file_format.extension` debe almacenarse sin punto (ej: `pdf`, `jpg`, `png`).
25. `system_config.key` debe ser unico. No puede haber dos configuraciones con la misma clave.
26. Un cliente debe tener al menos un contacto primario en `client_contacts`.
27. `password_reset_tokens.token` debe ser unico. Al usarse, `used_at` no debe ser nulo.
28. `user_sessions.token` debe ser unico por sesion activa.

## D.2 Historial y auditoria

El sistema debe registrar en historial todas las acciones que creen, modifiquen, cambien estado, anulen, finalicen, suban documentos o afecten informacion del sistema. La vista de historial debe permitir filtrar, ordenar y distinguir la importancia de cada evento para evitar saturacion visual.

### Acciones que deben quedar en historial

1. Creacion de registros.
2. Edicion de datos principales.
3. Cambios de estado.
4. Anulaciones, inactivaciones, cancelaciones y finalizaciones.
5. Subida, edicion o anulacion de documentos.
6. Registro, edicion o anulacion de pagos.
7. Registro, edicion o anulacion de vacunas.
8. Registro, edicion o anulacion de herrajes.
9. Cambios de dueño en caballos pensionados.
10. Cambios de genealogia.
11. Invitaciones de administradores creadas, usadas, vencidas o revocadas.
12. Cualquier otra accion administrativa que modifique datos o relaciones del sistema.

### Importancia del historial

Cada evento de historial debe tener un nivel de importancia:

1. `low`: cambios menores o informativos.
2. `medium`: cambios administrativos normales.
3. `high`: cambios importantes que afectan pagos, estados, dueños, pensiones o documentos clave.
4. `critical`: anulaciones, eliminaciones logicas, cambios sensibles o acciones de seguridad.

### Tipos de evento

Cada evento debe clasificarse por tipo:

1. `horse`: cambios de caballos.
2. `client`: cambios de clientes.
3. `boarding_stay`: cambios de pensiones o estadias.
4. `boarding_payment`: cambios de pagos.
5. `vaccination`: cambios de vacunas.
6. `farrier_record`: cambios de herrajes.
7. `document`: cambios documentales.
8. `genealogy`: cambios genealogicos.
9. `security`: cambios de usuarios, accesos o invitaciones.
10. `system`: eventos internos del sistema.

### Vista de historial

La pestaña Historial debe permitir:

1. Filtrar por tipo de evento.
2. Filtrar por importancia.
3. Filtrar por usuario administrador.
4. Filtrar por fecha o rango de fechas.
5. Filtrar por entidad relacionada.
6. Ordenar por fecha ascendente o descendente.
7. Ordenar por importancia.
8. Ver detalle de valores anteriores y nuevos cuando corresponda.
9. Abrir la entidad relacionada desde el evento.

Regla recomendada:

- La vista por defecto debe mostrar primero eventos recientes de importancia `medium`, `high` y `critical`.
- Los eventos `low` deben quedar disponibles mediante filtro, pero no saturar la vista principal.

---

# E. Endpoints API /api/v1

Regla general:

1. Todos los endpoints deben usar prefijo `/api/v1`.
2. `GET` consulta informacion.
3. `POST` crea registros o ejecuta acciones de negocio.
4. `PATCH` actualiza parcialmente registros.
5. `DELETE` representa eliminacion logica, nunca borrado fisico.
6. Acciones como `finish`, `cancel`, `activate`, `deactivate`, `revoke` o `change-status` deben quedar registradas en historial.

## Autenticacion

```http
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/password-recovery
POST /api/v1/auth/password-reset
GET  /api/v1/auth/me
```

## Administradores e invitaciones

```http
GET   /api/v1/users
PATCH /api/v1/users/{id}
POST  /api/v1/users/{id}/activate
POST  /api/v1/users/{id}/deactivate

GET  /api/v1/admin-invitations
POST /api/v1/admin-invitations
POST /api/v1/admin-invitations/{id}/revoke
POST /api/v1/admin-invitations/{token}/accept
```

## Clientes

```http
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/{id}
PATCH  /api/v1/clients/{id}
DELETE /api/v1/clients/{id}
POST   /api/v1/clients/{id}/deactivate
```

## Caballos

Se usa una sola entidad `horses`. La separacion entre caballos propios y pensionados se realiza con `ownership_type`.

```http
GET    /api/v1/horses
GET    /api/v1/horses?ownership_type=own
GET    /api/v1/horses?ownership_type=boarded
POST   /api/v1/horses
GET    /api/v1/horses/{id}
PATCH  /api/v1/horses/{id}
DELETE /api/v1/horses/{id}
POST   /api/v1/horses/{id}/change-status
```

## Galeria de caballos

```http
GET   /api/v1/horses/{id}/gallery
POST  /api/v1/horses/{id}/gallery
GET   /api/v1/horses/{id}/gallery/{itemId}
DELETE /api/v1/horses/{id}/gallery/{itemId}
```

## Pensiones o estadias

```http
GET    /api/v1/boarding-stays
GET    /api/v1/boarding-stays?horse_id={id}
GET    /api/v1/boarding-stays?client_id={id}
GET    /api/v1/boarding-stays?agreement_status=active
POST   /api/v1/boarding-stays
GET    /api/v1/boarding-stays/{id}
PATCH  /api/v1/boarding-stays/{id}
DELETE /api/v1/boarding-stays/{id}
POST   /api/v1/boarding-stays/{id}/finish
POST   /api/v1/boarding-stays/{id}/cancel
```

## Insumos de pension

```http
GET   /api/v1/boarding-stays/{id}/supplies
POST  /api/v1/boarding-stays/{id}/supplies
PATCH /api/v1/boarding-stays/{id}/supplies/{supplyId}
DELETE /api/v1/boarding-stays/{id}/supplies/{supplyId}
```

## Pagos de estadia

```http
GET   /api/v1/boarding-payments
GET   /api/v1/boarding-payments?boarding_stay_id={id}
GET   /api/v1/boarding-payments?client_id={id}
GET   /api/v1/boarding-payments?horse_id={id}
POST  /api/v1/boarding-payments
GET   /api/v1/boarding-payments/{id}
PATCH /api/v1/boarding-payments/{id}
POST  /api/v1/boarding-payments/{id}/cancel
```

## Vacunas

```http
GET   /api/v1/vaccinations
GET   /api/v1/vaccinations?horse_id={id}
POST  /api/v1/vaccinations
GET   /api/v1/vaccinations/{id}
PATCH /api/v1/vaccinations/{id}
POST  /api/v1/vaccinations/{id}/cancel
```

## Herrajes

```http
GET   /api/v1/farrier-records
GET   /api/v1/farrier-records?horse_id={id}
POST  /api/v1/farrier-records
GET   /api/v1/farrier-records/{id}
PATCH /api/v1/farrier-records/{id}
POST  /api/v1/farrier-records/{id}/cancel
```

## Tratamientos de salud

```http
GET   /api/v1/health-treatments
GET   /api/v1/health-treatments?horse_id={id}
POST  /api/v1/health-treatments
GET   /api/v1/health-treatments/{id}
PATCH /api/v1/health-treatments/{id}
POST  /api/v1/health-treatments/{id}/cancel
```

## Documentos

```http
GET   /api/v1/document-batches
GET   /api/v1/document-batches?entity_type=horse&entity_id={id}
GET   /api/v1/document-batches?entity_type=boarding_stay&entity_id={id}
POST  /api/v1/document-batches
GET   /api/v1/document-batches/{id}
PATCH /api/v1/document-batches/{id}
POST  /api/v1/document-batches/{id}/cancel

GET /api/v1/documents/{id}
GET /api/v1/documents/{id}/download
GET /api/v1/document-batches/{id}/download
```

## Genealogia

```http
GET   /api/v1/horses/{id}/genealogy
PATCH /api/v1/horses/{id}/genealogy
GET   /api/v1/horses/{id}/genealogy-tree
```

## Estados de caballos

```http
GET   /api/v1/horse-statuses
GET   /api/v1/horse-statuses?horse_type=own
GET   /api/v1/horse-statuses?horse_type=boarded
POST  /api/v1/horse-statuses
PATCH /api/v1/horse-statuses/{id}
POST  /api/v1/horse-statuses/{id}/activate
POST  /api/v1/horse-statuses/{id}/deactivate
```
## Catalogos

Endpoints genericos para administracion de tablas de catalogo. Solo accesibles para owner.

```http
GET   /api/v1/catalogs/user-roles
POST  /api/v1/catalogs/user-roles
PATCH /api/v1/catalogs/user-roles/{id}

GET   /api/v1/catalogs/horse-ownership-types
POST  /api/v1/catalogs/horse-ownership-types
PATCH /api/v1/catalogs/horse-ownership-types/{id}

GET   /api/v1/catalogs/horse-sexes
POST  /api/v1/catalogs/horse-sexes
PATCH /api/v1/catalogs/horse-sexes/{id}

GET   /api/v1/catalogs/horse-colors
POST  /api/v1/catalogs/horse-colors
PATCH /api/v1/catalogs/horse-colors/{id}

GET   /api/v1/catalogs/horse-breeds
POST  /api/v1/catalogs/horse-breeds
PATCH /api/v1/catalogs/horse-breeds/{id}

GET   /api/v1/catalogs/boarding-types
POST  /api/v1/catalogs/boarding-types
PATCH /api/v1/catalogs/boarding-types/{id}

GET   /api/v1/catalogs/agreement-statuses
POST  /api/v1/catalogs/agreement-statuses
PATCH /api/v1/catalogs/agreement-statuses/{id}

GET   /api/v1/catalogs/payment-methods
POST  /api/v1/catalogs/payment-methods
PATCH /api/v1/catalogs/payment-methods/{id}

GET   /api/v1/catalogs/payment-statuses
POST  /api/v1/catalogs/payment-statuses
PATCH /api/v1/catalogs/payment-statuses/{id}

GET   /api/v1/catalogs/client-statuses
POST  /api/v1/catalogs/client-statuses
PATCH /api/v1/catalogs/client-statuses/{id}

GET   /api/v1/catalogs/vaccination-statuses
POST  /api/v1/catalogs/vaccination-statuses
PATCH /api/v1/catalogs/vaccination-statuses/{id}

GET   /api/v1/catalogs/farrier-record-statuses
POST  /api/v1/catalogs/farrier-record-statuses
PATCH /api/v1/catalogs/farrier-record-statuses/{id}

GET   /api/v1/catalogs/importance-levels
POST  /api/v1/catalogs/importance-levels
PATCH /api/v1/catalogs/importance-levels/{id}

GET   /api/v1/catalogs/event-types
POST  /api/v1/catalogs/event-types
PATCH /api/v1/catalogs/event-types/{id}

GET   /api/v1/catalogs/supplies
POST  /api/v1/catalogs/supplies
PATCH /api/v1/catalogs/supplies/{id}

GET   /api/v1/catalogs/file-formats
POST  /api/v1/catalogs/file-formats
PATCH /api/v1/catalogs/file-formats/{id}
```

## Buscador global

```http
GET /api/v1/search?q={texto}
GET /api/v1/search?q={texto}&type=horses
GET /api/v1/search?q={texto}&type=clients
GET /api/v1/search?q={texto}&type=documents
GET /api/v1/search?q={texto}&type=boarding_stays
```

## Dashboard

```http
GET /api/v1/dashboard/summary
```

## Preferencias de usuario

```http
GET   /api/v1/users/{id}/preferences
PATCH /api/v1/users/{id}/preferences
```

## Configuracion del sistema

```http
GET   /api/v1/system-config
PATCH /api/v1/system-config
```

## Inventario de insumos

```http
GET   /api/v1/feed-inventory
POST  /api/v1/feed-inventory
GET   /api/v1/feed-inventory/{id}
```

## Historial / auditoria

```http
GET /api/v1/audit-logs
GET /api/v1/audit-logs?entity_type=horse&entity_id={id}
GET /api/v1/audit-logs?importance=high
GET /api/v1/audit-logs?event_type=boarding_payment
GET /api/v1/audit-logs?actor_user_id={id}
```

---

# F. Estados por modulo

## Clientes

```text
active
inactive
```

Reglas:

1. Un cliente puede pasar de `active` a `inactive`.
2. Un cliente `inactive` puede volver a `active` si vuelve a dejar caballos al cuidado del criadero.
3. No se debe registrar nuevamente al mismo cliente si ya existe; se debe reactivar.
4. La reactivacion debe quedar registrada en historial.

## Caballos propios

```text
active
temporary_out
in_treatment
sold
retired
deceased
inactive
```

Reglas:

1. Los estados de caballos propios se gestionan separados de los estados de caballos pensionados.
2. `temporary_out` representa caballos propios dejados temporalmente en otro lugar o al cuidado de otra persona.
3. Cambios de estado deben quedar en historial.

## Caballos pensionados

```text
active
in_stay
out_of_stay
in_treatment
inactive
```

Reglas:

1. Un caballo pensionado puede pasar de `in_stay` a `out_of_stay` cuando termina una estadia.
2. Un caballo pensionado puede pasar a `inactive` si no se espera gestionarlo temporalmente.
3. Un caballo `inactive` o `out_of_stay` puede volver a `active` o `in_stay` si regresa al criadero.
4. No se debe registrar nuevamente al mismo caballo si ya existe; se debe reactivar.
5. La reactivacion debe quedar registrada en historial.
6. Al reactivar un caballo pensionado, el sistema debe sugerir crear una nueva pension o estadia.

## Pensiones o estadias

```text
active
payment_pending
debt
finished
cancelled
```

Reglas:

1. Cada nueva temporada, periodo o acuerdo debe crear una nueva `boarding_stay`.
2. Una pension finalizada no debe reabrirse para representar una nueva temporada.
3. Si el mismo caballo vuelve al año siguiente, se reactiva el caballo si corresponde y se crea una nueva pension.
4. Finalizar pension debe permitir registrar fecha de salida real.
5. Cancelar pension debe conservar pagos, documentos e historial.

## Pagos de estadia

```text
valid
cancelled
```

Reglas:

1. Un pago no debe eliminarse fisicamente.
2. Si hubo error, debe anularse con motivo.
3. No se permite duplicar meses pagados dentro de la misma pension.

## Vacunas

```text
valid
cancelled
```

Reglas:

1. Una vacuna registrada por error debe anularse.
2. La anulacion debe conservar historial.

## Herrajes

```text
valid
cancelled
```

Reglas:

1. Un herraje registrado por error debe anularse.
2. La anulacion debe conservar historial.

## Documentos

```text
active
cancelled
```

Reglas:

1. Un documento no debe eliminarse fisicamente si ya fue usado como respaldo.
2. Puede anularse o marcarse como cancelado.
3. La descarga puede bloquearse para documentos cancelados si se define asi en implementacion.

## Invitaciones

```text
pending
accepted
revoked
expired
```

Reglas:

1. Una invitacion pendiente puede aceptarse una sola vez.
2. Una invitacion puede revocarse antes de ser aceptada.
3. Una invitacion vencida no puede usarse.

---

# G. Modelo de permisos

El sistema tendra acceso solo para usuarios internos autorizados. No existiran cuentas para clientes externos.

## Roles

### `owner`

Administradora principal del criadero.

Permisos:

1. Acceso total al sistema.
2. Crear, editar, inactivar y reactivar administradores.
3. Crear, revocar y consultar invitaciones.
4. Gestionar caballos propios.
5. Gestionar caballos pensionados.
6. Gestionar clientes.
7. Gestionar pensiones o estadias.
8. Gestionar pagos.
9. Gestionar vacunas.
10. Gestionar herrajes.
11. Gestionar documentos.
12. Gestionar estados de caballos.
13. Consultar historial completo.
14. Ver eventos de seguridad.

### `admin`

Administrador interno invitado por la administradora principal.

Permisos:

1. Gestionar caballos propios.
2. Gestionar caballos pensionados.
3. Gestionar clientes.
4. Gestionar pensiones o estadias.
5. Gestionar pagos.
6. Gestionar vacunas.
7. Gestionar herrajes.
8. Gestionar documentos.
9. Consultar historial operativo.
10. Usar buscador global.
11. Ver dashboard interno.

Restricciones:

1. No puede crear invitaciones salvo que se habilite en una version futura.
2. No puede revocar invitaciones.
3. No puede activar, inactivar ni modificar otros administradores.
4. No puede cambiar su propio rol.

## Permisos canonicos

```text
horses.manage
clients.manage
boarding_stays.manage
boarding_payments.manage
vaccinations.manage
farrier_records.manage
documents.manage
horse_statuses.manage
audit_logs.read
audit_logs.security.read
users.manage
admin_invitations.manage
dashboard.read
search.read
```

## Matriz resumida

| permiso | owner | admin |
|---|---:|---:|
| `horses.manage` | si | si |
| `clients.manage` | si | si |
| `boarding_stays.manage` | si | si |
| `boarding_payments.manage` | si | si |
| `vaccinations.manage` | si | si |
| `farrier_records.manage` | si | si |
| `documents.manage` | si | si |
| `horse_statuses.manage` | si | si |
| `audit_logs.read` | si | si |
| `audit_logs.security.read` | si | no |
| `users.manage` | si | no |
| `admin_invitations.manage` | si | no |
| `dashboard.read` | si | si |
| `search.read` | si | si |

## Historial y autor de acciones

Cada evento de historial debe indicar claramente que usuario realizo la accion.

Campos minimos requeridos en historial:

1. `actor_user_id`: ID del usuario que realizo la accion.
2. `actor_name`: nombre visible del usuario.
3. `actor_role`: rol del usuario al momento de la accion.
4. `action`: accion realizada.
5. `entity_type`: tipo de entidad afectada.
6. `entity_id`: ID de la entidad afectada.
7. `before`: valores anteriores cuando corresponda.
8. `after`: valores nuevos cuando corresponda.
9. `importance`: importancia del evento.
10. `event_type`: clasificacion del evento.
11. `created_at`: fecha y hora exacta.

Regla:

- La vista de historial debe mostrar de forma visible quien realizo la accion, no solo el ID tecnico.

---

# H. Arquitectura objetivo

El sistema debe pensarse como una aplicacion web normal, privada y lista para evolucionar a produccion, no como un MVP local sin backend.

## H.1 Capas principales

1. Frontend web privado.
2. API REST bajo `/api/v1`.
3. Capa de dominio del criadero.
4. Base de datos relacional.
5. Almacenamiento de documentos.
6. Autenticacion, sesiones e invitaciones.
7. Historial/auditoria.
8. Buscador interno.

## H.2 Frontend web

Responsabilidades:

1. Mostrar pantallas privadas para owner y administradores.
2. Gestionar formularios, listados, fichas y buscador.
3. Permitir carga, vista y descarga de documentos.
4. Mostrar historial filtrable y ordenable.
5. Mostrar arbol genealogico navegable.
6. Respetar permisos segun rol.

Recomendacion:

- Aplicacion web responsive.
- Acceso solo mediante login.
- Sin portal publico para clientes.
- Sin cuentas para clientes externos.

## H.3 Backend / API

Responsabilidades:

1. Exponer API REST `/api/v1`.
2. Validar datos de entrada.
3. Aplicar permisos por rol.
4. Ejecutar reglas de negocio.
5. Registrar historial/auditoria.
6. Manejar carga y descarga de documentos.
7. Proteger endpoints privados.

Regla:

- La logica critica no debe depender solo del frontend.
- Validaciones de negocio deben existir en backend.

## H.4 Dominio del criadero

Modulos principales:

1. Caballos.
2. Clientes.
3. Pensiones o estadias.
4. Pagos de estadia.
5. Vacunas.
6. Herrajes.
7. Documentos.
8. Genealogia.
9. Estados.
10. Usuarios e invitaciones.
11. Historial/auditoria.

## H.5 Persistencia

Recomendacion:

- Base de datos relacional.
- PostgreSQL o equivalente.

Responsabilidades:

1. Guardar caballos, clientes, pensiones, pagos, vacunas, herrajes y usuarios.
2. Mantener relaciones entre entidades.
3. Permitir trazabilidad historica.
4. Evitar borrado fisico de informacion relevante.
5. Soportar consultas por filtros y buscador.

## H.6 Almacenamiento de documentos

Responsabilidades:

1. Guardar archivos subidos por administradores.
2. Asociar archivos a lotes documentales.
3. Permitir visualizacion cuando el formato sea compatible.
4. Permitir descarga individual o del conjunto documental.
5. Mantener metadatos del archivo en base de datos.

Recomendacion:

- Guardar metadatos en base de datos.
- Guardar archivos en almacenamiento de objetos o sistema de archivos controlado.

## H.7 Autenticacion e invitaciones

Responsabilidades:

1. Login privado para owner y administradores.
2. Invitaciones mediante link.
3. Tokens de invitacion de un solo uso.
4. Expiracion de invitaciones.
5. Activacion e inactivacion de administradores.

## H.8 Historial / auditoria

Responsabilidades:

1. Registrar todas las acciones que creen, modifiquen o afecten informacion.
2. Guardar usuario que realizo la accion.
3. Guardar fecha y hora.
4. Guardar entidad afectada.
5. Guardar valores anteriores y nuevos cuando corresponda.
6. Clasificar por tipo e importancia.
7. Permitir filtros y ordenamiento.

## H.9 Buscador interno

Responsabilidades:

1. Buscar caballos propios.
2. Buscar caballos pensionados.
3. Buscar clientes.
4. Buscar pensiones.
5. Buscar documentos por nombre o descripcion.

## H.10 Stack recomendado sin imponer dependencia cerrada

| capa | recomendacion |
|---|---|
| frontend | React/Next.js o equivalente |
| backend | Node.js/NestJS, Python/FastAPI o equivalente |
| base de datos | PostgreSQL |
| documentos | storage compatible S3 o almacenamiento controlado |
| autenticacion | sesiones/JWT con invitaciones privadas |
| documentacion API | OpenAPI 3.1 |

---

# I. Requisitos no funcionales

| id | requisito | criterio |
|---|---|---|
| RNF-01 | Seguridad | acceso solo mediante login para usuarios internos autorizados |
| RNF-02 | Invitaciones privadas | nuevos administradores solo pueden registrarse mediante link de invitacion valido, vigente y de un solo uso |
| RNF-03 | Privacidad | clientes externos no tienen cuenta ni acceso al sistema |
| RNF-04 | Historial/auditoria | toda accion que cree, modifique, anule, finalice, suba documentos o afecte informacion debe quedar registrada |
| RNF-05 | Identificacion del autor | cada evento de historial debe mostrar claramente usuario, rol, fecha y accion realizada |
| RNF-06 | Integridad de datos | informacion con historial no debe borrarse fisicamente; debe inactivarse, anularse, cancelarse o finalizarse |
| RNF-07 | Documentos | el sistema debe permitir subir, agrupar, visualizar y descargar documentos individuales o conjuntos |
| RNF-08 | Trazabilidad documental | cada documento debe quedar asociado a la entidad correspondiente y al usuario que lo subio |
| RNF-09 | Rendimiento | listados y buscador deben responder de forma fluida en uso normal del criadero |
| RNF-10 | Usabilidad | pantallas deben ser claras, simples y orientadas a uso diario interno |
| RNF-11 | Accesibilidad | interfaz legible, con buen contraste, foco visible y navegacion clara |
| RNF-12 | Respaldo | datos y documentos deben poder respaldarse de forma segura |
| RNF-13 | Mantenibilidad | API documentada, modulos separados y reglas de negocio centralizadas en backend |
| RNF-14 | Consistencia | caballos, clientes, pensiones, pagos y documentos deben mantener relaciones validas |
| RNF-15 | Busqueda | buscador global debe permitir encontrar caballos, clientes, pensiones y documentos por texto |
| RNF-16 | Auditoria filtrable | historial debe poder filtrarse por tipo, importancia, usuario, entidad y rango de fechas |
| RNF-17 | Ordenamiento | historial debe poder ordenarse por fecha e importancia |

---

# J. Estrategia de pruebas

## J.1 Stack de pruebas

| capa | framework | comando |
|---|---|---|
| Backend unit + integracion | **Jest** + **Supertest** | `npm run test` |
| Backend cobertura | **Jest --coverage** | `npm run test:cov` |
| Frontend unit + componentes | **Vitest** + **React Testing Library** | `npm run test` (en frontend) |
| Frontend cobertura | **Vitest --coverage** | `npm run test:cov` (en frontend) |
| E2E | **Playwright** | `npm run test:e2e` |
| API documentation | **OpenAPI 3.1** (generado por NestJS Swagger) | `npm run build:docs` |

### Configuracion de cobertura

Las herramientas deben configurarse para:

- **Jest** (`jest.config.ts`): `collectCoverageFrom` incluyendo `src/**/*.service.ts`, `src/**/*.controller.ts`, `src/**/*.guard.ts`
- **Vitest** (`vitest.config.ts`): `include` apuntando a `src/**/*.tsx`, `src/**/*.ts` (excluyendo paginas y layouts)
- **Playwright**: configuracion en `playwright.config.ts` con proyectos para Chrome y Firefox

## J.2 Cobertura minima

### Backend (Jest + Supertest)

| metrica | minimo |
|---|---|
| Lines | ≥ 90% |
| Branches | ≥ 85% |
| Functions | ≥ 90% |
| Statements | ≥ 90% |

Archivos con cobertura obligatoria (el pipeline falla si estan por debajo del minimo):

- Todos los `*.service.ts` (reglas de negocio)
- Todos los `*.guard.ts` (permisos)
- Todos los `*.controller.ts` (validacion de entrada y respuesta)
- Todos los `*.pipe.ts` (validacion de parametros)
- Todos los `*.interceptor.ts` (auditoria)

### Frontend (Vitest + React Testing Library)

| metrica | minimo |
|---|---|
| Lines | ≥ 80% |
| Branches | ≥ 75% |
| Functions | ≥ 80% |

Componentes con cobertura obligatoria:

- Formularios (crear y editar)
- Fichas de detalle
- Modales de confirmacion
- Componentes de listado con filtros
- Buscador global
- Arbol genealogico

### E2E (Playwright)

- 100% de los casos definidos en J.3 deben estar implementados y pasar
- Cada caso debe incluir assertion de estado final esperado
- Los casos deben ejecutarse contra una base de datos de prueba (SQLite o PostgreSQL test)

## J.3 Pipeline CI/CD

Plataforma: **GitHub Actions**

Archivo: `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint

  test-backend:
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: criadero_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: [5432:5432]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:cov
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/criadero_test
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-backend
          path: coverage/

  test-frontend:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:cov
        working-directory: ./frontend

  test-e2e:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/criadero_test
```

Reglas del pipeline:

1. `lint` debe pasar siempre.
2. `test-backend` debe cumplir cobertura minima. Si falla, el pipeline se detiene.
3. `test-frontend` debe cumplir cobertura minima. Si falla, el pipeline se detiene.
4. `test-e2e` debe pasar todos los casos. Si falla, el pipeline se detiene.
5. Los artefactos de cobertura se almacenan por 30 dias.

## J.4 Estructura de carpetas para pruebas

```
backend/
  src/
    __tests__/
      unit/
        horses.service.spec.ts
        clients.service.spec.ts
        boarding-stays.service.spec.ts
        boarding-payments.service.spec.ts
        vaccinations.service.spec.ts
        farrier-records.service.spec.ts
        documents.service.spec.ts
        genealogy.service.spec.ts
        users.service.spec.ts
        audit-logs.service.spec.ts
        horse-statuses.service.spec.ts
      integration/
        client-horse-boarding.integration.spec.ts
        payment-duplicate.integration.spec.ts
        finish-boarding.integration.spec.ts
        reactivate-client-horse.integration.spec.ts
        document-upload.integration.spec.ts
        permissions-owner-admin.integration.spec.ts
      guards/
        roles.guard.spec.ts
        permissions.guard.spec.ts
      pipes/
        validation.pipe.spec.ts

frontend/
  src/
    __tests__/
      components/
        HorseForm.spec.tsx
        ClientForm.spec.tsx
        BoardingStayForm.spec.tsx
        PaymentForm.spec.tsx
        VaccinationForm.spec.tsx
        FarrierRecordForm.spec.tsx
        DocumentUpload.spec.tsx
        GenealogyTree.spec.tsx
        AuditLogList.spec.tsx
        GlobalSearch.spec.tsx
      pages/
        Dashboard.spec.tsx
        HorseDetail.spec.tsx
        ClientDetail.spec.tsx
        BoardingStayDetail.spec.tsx

e2e/
  tests/
    auth.spec.ts
    invitations.spec.ts
    own-horses.spec.ts
    clients.spec.ts
    boarded-horses.spec.ts
    boarding-stays.spec.ts
    payments.spec.ts
    duplicate-payment.spec.ts
    vaccinations.spec.ts
    farrier-records.spec.ts
    documents.spec.ts
    genealogy.spec.ts
    global-search.spec.ts
    history.spec.ts
    permissions.spec.ts
```

## J.5 Mapa de cobertura obligatoria

| archivo / modulo | tipo prueba | reglas validadas |
|---|---|---|
| `horses.service.ts` | unit + integracion | Reglas D.1 items 1-4, 13-14 |
| `clients.service.ts` | unit + integracion | Reglas D.1 items 2-3, 18, 26 |
| `boarding-stays.service.ts` | unit + integracion | Reglas D.1 items 4-5, 15 |
| `boarding-payments.service.ts` | unit + integracion | Reglas D.1 items 6-8, 16 |
| `vaccinations.service.ts` | unit | Reglas D.1 item 9 |
| `farrier-records.service.ts` | unit | Reglas D.1 item 10 |
| `documents.service.ts` | unit + integracion | Reglas D.1 items 11, 24 |
| `genealogy.service.ts` | unit | Reglas modelo 4-5 |
| `users.service.ts` | unit + integracion | Permisos owner/admin |
| `horse-statuses.service.ts` | unit | Estados separados por tipo |
| `audit-logs.service.ts` | integracion | Registro de acciones en historial |
| `roles.guard.ts` | unit | Matriz de permisos G.2 |
| `permissions.guard.ts` | unit | Permisos por endpoint |
| `system-config.service.ts` | unit | Regla D.1 item 25 |
| `health-treatments.service.ts` | unit | Regla modelo 19 |
| `boarding-stay-supplies.service.ts` | unit | Regla modelo 13, D.1 item 19 |
| `horse-gallery.service.ts` | unit | Regla modelo 14, D.1 item 23 |
| `addresses.service.ts` | unit | Regla modelo 16 |
| `client-contacts.service.ts` | unit | Regla modelo 15 |

## J.6 Matriz de pruebas por modulo

| modulo | unit | integracion | E2E |
|---|---|---|---|
| Autenticacion | ✅ | ✅ | ✅ |
| Usuarios / invitaciones | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ |
| Caballos propios | ✅ | ✅ | ✅ |
| Caballos pensionados | ✅ | ✅ | ✅ |
| Pensiones o estadias | ✅ | ✅ | ✅ |
| Pagos de estadia | ✅ | ✅ | ✅ |
| Vacunas | ✅ | ✅ | — |
| Herrajes | ✅ | ✅ | — |
| Tratamientos de salud | ✅ | — | — |
| Documentos | ✅ | ✅ | ✅ |
| Genealogia | ✅ | — | ✅ |
| Estados | ✅ | ✅ | — |
| Buscador global | — | ✅ | ✅ |
| Dashboard | — | ✅ | ✅ |
| Historial / auditoria | — | ✅ | ✅ |
| Permisos | ✅ | ✅ | ✅ |
| Catalogos | ✅ | — | — |
| Configuracion del sistema | — | ✅ | — |
| Galeria de caballos | ✅ | — | — |
| Insumos de pension | ✅ | ✅ | — |
| Perfil de usuario | — | ✅ | ✅ |

## J.7 Pruebas unitarias

Objetivo: validar reglas pequenas y aisladas.

Casos minimos:

1. Validar caballo con nombre, sexo, color y distintivos obligatorios.
2. Validar que caballo pensionado requiera cliente dueño.
3. Validar que caballo propio no tenga cliente dueño.
4. Validar que `temporary_location` aplique solo a caballos propios.
5. Validar creacion de pension con fecha inicio, tipo, estado y Costo Pension.
6. Validar que no exista mas de una pension activa para el mismo caballo.
7. Validar que no se permita pago sin pension asociada.
8. Validar que no se permita pago sin fecha, meses, medio y monto.
9. Validar bloqueo de pago duplicado para el mismo mes dentro de la misma pension.
10. Validar vacuna con nombre, fecha y quien lo aplico.
11. Validar herraje con fecha e informacion obligatoria.
12. Validar documento con lote documental y nombre obligatorio.
13. Validar niveles de importancia del historial.
14. Validar permisos `owner` y `admin`.
15. Validar genealogia con padre/madre registrados o nombres externos.
16. Validar FK a catalogo existente en `sex_id`, `color_id`, `boarding_type_id`.
17. Validar que `boarding_stay_supplies` requiera `boarding_stay_id` y `supply_id` validos.
18. Validar unicidad de `system_config.key`.

## J.8 Pruebas de integracion

Objetivo: validar flujos entre modulos relacionados.

Casos minimos:

1. Registrar cliente, registrar caballo pensionado y asociarlo correctamente.
2. Crear pension para caballo pensionado.
3. Registrar pago asociado a pension.
4. Intentar registrar pago duplicado y verificar bloqueo.
5. Finalizar pension con fecha de salida real.
6. Reactivar cliente y caballo para una nueva temporada.
7. Crear nueva pension para el mismo caballo en una temporada posterior.
8. Registrar vacuna para caballo propio.
9. Registrar vacuna para caballo pensionado.
10. Registrar herraje para caballo propio.
11. Registrar herraje para caballo pensionado.
12. Subir lote documental asociado a caballo.
13. Subir lote documental asociado a pension.
14. Subir comprobante asociado a pago.
15. Consultar historial y verificar usuario, accion, fecha, entidad e importancia.
16. Verificar que admin no pueda crear invitacion (permiso denegado).
17. Verificar que owner pueda crear y revocar invitacion.
18. Verificar que insumos de pension se asocien correctamente mediante catalogo `supplies`.

## J.9 Pruebas E2E

Objetivo: validar flujos completos desde la interfaz.

Casos minimos:

1. Login de owner.
2. Crear invitacion de administrador.
3. Aceptar invitacion y crear cuenta admin.
4. Crear caballo propio.
5. Crear cliente.
6. Crear caballo pensionado asociado a cliente.
7. Crear pension o estadia.
8. Registrar pago de estadia.
9. Intentar pago duplicado y comprobar bloqueo visual.
10. Registrar vacuna.
11. Registrar herraje.
12. Subir documentos como lote documental.
13. Descargar documento individual.
14. Descargar conjunto documental.
15. Buscar caballo desde buscador global.
16. Buscar cliente desde buscador global.
17. Ver arbol genealogico de caballo propio.
18. Revisar historial filtrado por tipo e importancia.
19. Finalizar pension.
20. Reactivar caballo y crear nueva pension.

## J.10 Evidencia esperada

Cada ejecucion de pruebas debe producir evidencia:

1. Resultado de pruebas unitarias con cobertura.
2. Resultado de pruebas de integracion con cobertura.
3. Resultado de pruebas E2E con reporte HTML.
4. Capturas o video de flujos criticos si aplica (Playwright trace).
5. Registro de errores encontrados con stack trace.
6. Confirmacion de trazabilidad entre requisito y prueba.
7. Reporte de cobertura subido como artefacto del pipeline.

## J.11 Criterios de aceptacion por modulo

| modulo | aceptacion minima |
|---|---|
| Autenticacion | owner y admin pueden iniciar sesion; usuarios no autenticados no acceden al sistema |
| Invitaciones | owner puede crear, copiar, revocar y consultar invitaciones; invitacion usada o vencida no puede reutilizarse |
| Administradores | owner puede activar/inactivar administradores; admin no puede gestionar usuarios ni invitaciones |
| Clientes | crear, editar, consultar, inactivar y reactivar clientes con historial visible |
| Caballos propios | crear, editar, consultar, cambiar estado, subir documentos/fotos, registrar vacunas/herrajes y ver historial |
| Caballos pensionados | crear, editar, consultar, asociar cliente dueño, cambiar estado, reactivar y ver historial |
| Pensiones/estadias | crear estadia independiente con ID propio, fechas, tipo, estado, Costo Pension, acuerdos de alimento, documentos y finalizacion |
| Pagos de estadia | registrar pagos por pension, meses pagados, medio, monto, comprobante opcional; bloquear meses duplicados dentro de la misma pension |
| Vacunas | registrar, editar, consultar y anular vacunas para cualquier caballo, con documentos opcionales e historial |
| Herrajes | registrar, editar, consultar y anular herrajes para cualquier caballo, con documentos opcionales e historial |
| Documentos | subir uno o varios archivos como lote documental, nombrar manualmente, describir, visualizar y descargar individual o por conjunto |
| Genealogia | registrar padre/madre como caballo existente o nombre externo; visualizar arbol y navegar a fichas existentes |
| Estados | mantener estados separados para caballos propios y pensionados; cambios deben quedar auditados |
| Buscador global | encontrar caballos, clientes, pensiones y documentos desde una busqueda unificada |
| Dashboard | mostrar resumen operativo con caballos, pensiones, pagos, vacunas, herrajes, documentos e historial reciente |
| Historial/auditoria | registrar todas las acciones que afecten datos, mostrando usuario, rol, fecha, entidad, accion, importancia y valores antes/despues cuando aplique |
| Permisos | owner tiene acceso total; admin no puede gestionar usuarios, roles ni invitaciones |
| Reactivacion | clientes y caballos existentes pueden reactivarse sin duplicar registros; nueva temporada crea nueva pension |
| Integridad documental | documentos cancelados o anulados conservan trazabilidad y no desaparecen sin historial |
| No acceso de clientes | clientes externos no pueden registrarse, iniciar sesion ni acceder a la plataforma |
| Catalogos | owner puede gestionar catalogos; admin no puede modificarlos; cambios se reflejan en formularios |
| Configuracion del sistema | owner puede modificar parametros globales; cambios quedan en historial |
| Perfil de usuario | usuario puede ver y editar su perfil; no puede cambiar su rol |
| Galeria de caballos | subir, visualizar y eliminar fotos/bocetos separados de documentos generales |
| Insumos de pension | registrar, editar y eliminar insumos por pension mediante catalogo normalizado |

---

# K. Trazabilidad

| requisito | fuente | prueba requerida | evidencia esperada |
|---|---|---|---|
| REQ-AUTH | Login, invitaciones, roles `owner` y `admin` | unit + integracion + E2E | login, invitacion, aceptacion, activacion/inactivacion de administrador |
| REQ-CAB | Caballos propios y pensionados | unit + integracion + E2E | creacion, edicion, consulta, cambio de estado, reactivacion |
| REQ-CLI | Clientes externos | unit + integracion + E2E | creacion, edicion, consulta, inactivacion, reactivacion |
| REQ-PEN | Pensiones o estadias independientes | unit + integracion + E2E | pension con ID propio, fechas, tipo, estado, costo, acuerdos y finalizacion |
| REQ-PAG | Pagos de estadia | unit + integracion + E2E | pago asociado a pension, meses pagados, medio, monto, comprobante opcional, bloqueo de duplicados |
| REQ-VAC | Vacunas | unit + integracion + E2E | vacuna asociada a caballo propio o pensionado, documentos opcionales e historial |
| REQ-HER | Herrajes | unit + integracion + E2E | herraje asociado a caballo propio o pensionado, documentos opcionales e historial |
| REQ-DOC | Documentos y lotes documentales | unit + integracion + E2E | subida multiple, nombre manual, descripcion, visualizacion, descarga individual y descarga de conjunto |
| REQ-GEN | Genealogia | unit + integracion + E2E | padre/madre registrados, padre/madre externos, arbol navegable hasta nivel disponible |
| REQ-HIS | Historial/auditoria | unit + integracion + E2E | eventos con usuario visible, rol, fecha, accion, entidad, importancia, filtros y ordenamiento |
| REQ-BUS | Buscador global | integracion + E2E | busqueda de caballos, clientes, pensiones y documentos |
| REQ-PERM | Permisos | unit + integracion + E2E | owner con acceso total, admin sin gestion de usuarios/invitaciones |
| REQ-EST | Estados por modulo | unit + integracion | estados separados para caballos propios y pensionados, cambios auditados |
| REQ-RNF | Requisitos no funcionales | revision + E2E | seguridad, privacidad, integridad, usabilidad, documentos, respaldo y mantenibilidad |

---

# L. Gate de cierre de especificacion

La especificacion se considera lista para iniciar generacion del proyecto cuando se cumplan todos los puntos siguientes:

1. Casos de uso principales definidos.
2. Pantallas principales definidas.
3. Modelo de datos definido.
4. Validaciones y reglas de negocio definidas.
5. Endpoints API `/api/v1` definidos.
6. Estados por modulo definidos.
7. Modelo de permisos definido.
8. Arquitectura objetivo definida.
9. Requisitos no funcionales definidos.
10. Estrategia de pruebas definida.
11. Trazabilidad definida.
12. No quedan decisiones criticas pendientes para el MVP.
13. Queda claro que clientes externos no tienen acceso al sistema.
14. Queda claro que el sistema es privado para owner y administradores.
15. Queda claro que no se borra fisicamente informacion relevante.
16. Queda claro que el historial debe registrar todas las acciones que afecten datos.
17. Queda claro que cada evento de historial debe mostrar quien realizo la accion.
18. Queda claro que cada nueva temporada de un caballo pensionado genera una nueva pension o estadia.

---

# M. Checklist de validacion de completitud

Checklist para verificar que cada modulo del producto implementado cumple con los criterios minimos de aceptacion. Cada item debe marcarse como ✅ Cumple o ❌ No cumple. Todos los items deben estar en ✅ para considerar el modulo completo.

## M.1 Autenticacion

1. Login con credenciales validas redirige al dashboard.
2. Login con credenciales invalidas muestra error y bloquea el acceso.
3. Cerrar sesion invalida la sesion actual y redirige al login.
4. Usuario inactivo no puede iniciar sesion.
5. Recuperacion de contraseña genera token valido y vigente.
6. Token de recuperacion es de un solo uso.

## M.2 Invitaciones

1. Owner puede crear invitacion con fecha de expiracion.
2. Link de invitacion funciona solo una vez.
3. Invitacion vencida muestra mensaje de error y bloquea el registro.
4. Owner puede revocar invitacion pendiente.
5. Owner puede consultar historial de invitaciones (pendientes, aceptadas, vencidas, revocadas).

## M.3 Administradores

1. Owner puede listar administradores activos e inactivos.
2. Owner puede activar e inactivar administradores.
3. Admin no puede acceder a la seccion de administradores.
4. Admin no puede crear ni revocar invitaciones.
5. Cada cambio en estado de administrador queda registrado en historial.

## M.4 Clientes

1. Crear cliente con nombre, apellido y contacto obligatorios.
2. Editar datos de cliente con registro de antes/despues en historial.
3. Consultar cliente con caballos pensionados asociados.
4. Inactivar cliente no elimina sus datos historicos.
5. Reactivar cliente mantiene caballos y pensiones previas.
6. Sistema advierte si se intenta duplicar un cliente existente.
7. Cada reactivacion queda registrada en historial.

## M.5 Caballos propios

1. Crear caballo propio con nombre, sexo, color y distintivos obligatorios.
2. Editar caballo propio con registro de cambios en historial.
3. Cambiar estado con seleccion desde catalogo por tipo de caballo.
4. Asociar padre y madre como caballos registrados o nombres externos.
5. Visualizar arbol genealogico con nodos navegables.
6. Subir fotos y bocetos a galeria separada de documentos.
7. Registrar vacunas y herrajes desde la ficha del caballo.
8. Ver historial completo de eventos del caballo.
9. Caballo fallecido (deceased) no permite cambios a otros estados.
10. `temporary_location` se muestra y edita solo para caballos propios.

## M.6 Caballos pensionados

1. Crear caballo pensionado con cliente dueño obligatorio.
2. Editar caballo pensionado con registro de cambios en historial.
3. Cambiar estado segun catalogo de caballos pensionados.
4. Reactivar caballo sin duplicar registro.
5. Al reactivar, el sistema sugiere crear nueva pension.
6. Ver pensiones activas e historicas desde la ficha.
7. Ver historial completo del caballo.

## M.7 Pensiones o estadias

1. Crear pension con ID unico, fechas, tipo, costo y estado del acuerdo.
2. Editar pension con registro de antes/despues en historial.
3. Finalizar pension con fecha de salida real obligatoria.
4. Cancelar pension conservando pagos, documentos e historial.
5. Sistema advierte si el caballo ya tiene una pension activa.
6. Cada nueva temporada genera una nueva pension independiente.
7. Pension finalizada no puede reabrirse para misma temporada.
8. Advertir pagos pendientes al finalizar pension (no bloquea).

## M.8 Pagos de estadia

1. Registrar pago asociado a pension con fecha, meses, medio y monto.
2. Editar pago con registro de antes/despues en historial.
3. Anular pago con motivo sin borrado fisico.
4. Sistema bloquea pago duplicado del mismo mes en la misma pension.
5. Adjuntar y descargar comprobante de pago.
6. Pago sobre pension finalizada o cancelada advierte y pide confirmacion.
7. Medio de pago se selecciona desde catalogo (efectivo, transferencia).

## M.9 Vacunas

1. Registrar vacuna con nombre, fecha de aplicacion y quien la aplico.
2. Editar vacuna con registro de cambios en historial.
3. Anular vacuna con motivo conservando registro.
4. Adjuntar documentos opcionales a la vacuna.
5. Vacunas se listan ordenadas por fecha en la ficha del caballo.

## M.10 Herrajes

1. Registrar herraje con fecha e informacion del servicio.
2. Editar herraje con registro de cambios en historial.
3. Anular herraje con motivo conservando registro.
4. Adjuntar documentos opcionales al herraje.
5. Herrajes se listan ordenados por fecha en la ficha del caballo.

## M.11 Tratamientos de salud

1. Registrar tratamiento con tipo, fecha, descripcion y quien lo realizo.
2. Editar tratamiento con registro de cambios en historial.
3. Anular tratamiento con motivo conservando registro.
4. Tratamiento se asocia al caballo independiente de vacunas y herrajes.

## M.12 Documentos

1. Subir lote documental con nombre obligatorio y al menos un archivo.
2. Visualizar documento en la plataforma si el formato lo permite.
3. Descargar documento individual.
4. Descargar conjunto documental completo.
5. Editar nombre y descripcion del lote o documento individual.
6. Anular documento conservando trazabilidad e historial.
7. Documento cancelado no desaparece y mantiene registro de quien lo anulo.

## M.13 Genealogia

1. Registrar padre y madre como caballo existente o nombre externo.
2. Visualizar arbol genealogico con nodos navegables para caballos registrados.
3. Nodos externos se muestran como texto sin ficha navegable.
4. Arbol se muestra completo hasta el nivel disponible; si faltan datos, se muestra incompleto sin bloquear.

## M.14 Buscador global

1. Buscar caballos por nombre, color, distintivos o estado.
2. Buscar clientes por nombre, apellido o contacto.
3. Buscar pensiones por caballo o cliente.
4. Buscar documentos por nombre o descripcion.
5. Resultados se agrupan por tipo con acceso directo a la ficha.

## M.15 Dashboard

1. Muestra total de caballos propios, pensionados y pensiones activas.
2. Muestra ultimos pagos, vacunas, herrajes y documentos registrados.
3. Muestra ultimos cambios en historial.
4. Accesos directos para crear caballo, cliente o pension.
5. Acceso directo al buscador global.

## M.16 Historial / auditoria

1. Registra creacion, edicion, cambio de estado, anulacion y finalizacion de entidades.
2. Cada evento muestra usuario con nombre visible, rol, fecha y accion realizada.
3. Permite filtrar por tipo de evento.
4. Permite filtrar por importancia (low, medium, high, critical).
5. Permite filtrar por usuario administrador.
6. Permite filtrar por fecha o rango de fechas.
7. Permite filtrar por entidad relacionada.
8. Permite ordenar por fecha ascendente y descendente.
9. Permite ordenar por importancia.
10. Vista por defecto muestra eventos medium, high y critical; low queda disponible por filtro.

## M.17 Permisos

1. Owner tiene acceso total a todas las secciones del sistema.
2. Admin no puede gestionar usuarios, roles ni invitaciones.
3. Admin no puede ver eventos de seguridad.
4. Admin no puede acceder a configuracion del sistema.
5. Clientes externos no tienen cuenta, login ni acceso a la plataforma.
6. Cada endpoint valida permisos en backend, no solo en frontend.

## M.18 Catalogos

1. Owner puede gestionar (crear, editar, activar/desactivar) catalogos del sistema.
2. Admin no puede modificar catalogos.
3. Catalogos se reflejan correctamente en formularios y listados.
4. Seed data de catalogos se carga durante la inicializacion del sistema.

## M.19 Configuracion del sistema

1. Owner puede modificar parametros globales (formatos, tamaño archivos, expiracion invitaciones, etc.).
2. Cambios en configuracion quedan registrados en historial con tipo system.
3. Admin no puede acceder a la pantalla de configuracion.

## M.20 Perfil de usuario

1. Usuario puede ver y editar su propio perfil (nombre, apellido).
2. Usuario puede cambiar su propia contraseña.
3. Usuario no puede cambiar su propio rol.

## M.21 Galeria de caballos

1. Subir foto o boceto a galeria de un caballo.
2. Visualizar imagenes en galeria.
3. Eliminar imagen de galeria con registro en historial.
4. Galeria esta separada de la seccion de documentos generales.

## M.22 Insumos de pension

1. Registrar insumos acordados (fardos, avena, otros) por pension mediante catalogo.
2. Editar insumos de pension.
3. Eliminar insumo de pension.
4. Insumos se muestran en la ficha de pension.

## M.23 Checklist de infraestructura

1. Aplicacion accesible mediante HTTPS en produccion.
2. Base de datos con respaldo automatizado programado.
3. Almacenamiento de documentos con respaldo.
4. Logs de servidor y aplicacion disponibles para diagnostico.
5. Variables de entorno usadas para configuracion sensible (DB, storage, JWT secret).
6. Tiempo de respuesta de API no supera 2 segundos en operaciones normales.

## M.24 Checklist de seguridad

1. Todos los endpoints protegidos requieren autenticacion, excepto login, recuperacion y aceptacion de invitacion.
2. Validacion de permisos implementada en backend por cada endpoint y accion.
3. Proteccion contra inyeccion SQL mediante parametrizacion de consultas.
4. Tokens JWT con expiracion configurable.
5. CORS configurado para permitir solo el origen del frontend.
6. Contraseñas almacenadas con hash (bcrypt o equivalente).
7. Archivos subidos validados por tipo y tamaño antes de almacenar.
