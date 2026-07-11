export const DETERMINISTIC_TS = "2026-06-30T00:00:00.000Z";

export const STATUS_LABELS = {
  active: "Activo", inactive: "Inactivo", temporary_out: "Fuera temporal",
  in_treatment: "En tratamiento", sold: "Vendido", retired: "Retirado",
  deceased: "Fallecido", in_stay: "En pension", out_of_stay: "Fuera de pension",
  payment_pending: "Pago pendiente", debt: "Con deuda", finished: "Finalizado",
  cancelled: "Anulado", valid: "Valido", pending: "Pendiente",
  accepted: "Aceptada", revoked: "Revocada", expired: "Expirada",
  owner: "Owner", admin: "Admin"
};

export const PERMISSIONS = {
  owner: ["horses.manage","clients.manage","boarding_stays.manage","boarding_payments.manage","vaccinations.manage","farrier_records.manage","documents.manage","horse_statuses.manage","audit_logs.read","audit_logs.security.read","users.manage","admin_invitations.manage","dashboard.read","search.read"],
  admin: ["horses.manage","clients.manage","boarding_stays.manage","boarding_payments.manage","vaccinations.manage","farrier_records.manage","documents.manage","horse_statuses.manage","audit_logs.read","dashboard.read","search.read"]
};

export const MODULES = [
  { id: "clients", label: "Clientes", singular: "cliente", endpoint: "/api/v1/clients", permission: "clients.manage", keyField: "phone",
    fields: [{ name: "firstName", label: "Nombres", type: "text", required: true },{ name: "lastName", label: "Apellidos", type: "text", required: true },{ name: "phone", label: "Contacto", type: "text", required: true },{ name: "address", label: "Direccion", type: "text", required: true },{ name: "internalNotes", label: "Notas internas", type: "textarea" }],
    defaults: { status: "active" } },
  { id: "horses", label: "Caballos", singular: "caballo", endpoint: "/api/v1/horses", permission: "horses.manage",
    fields: [{ name: "ownershipType", label: "Tipo", type: "select", options: ["own","boarded"], required: true },{ name: "name", label: "Nombre", type: "text", required: true },{ name: "sex", label: "Sexo", type: "select", options: ["hembra","macho","castrado"], required: true },{ name: "color", label: "Color", type: "text", required: true },{ name: "distinctiveMarks", label: "Distintivos", type: "textarea", required: true },{ name: "clientId", label: "Cliente", type: "relation", collection: "clients", display: "fullName" },{ name: "birthDate", label: "Fecha nacimiento", type: "date" },{ name: "breederName", label: "Criador", type: "text" },{ name: "breederFarm", label: "Criadero", type: "text" },{ name: "temporaryLocation", label: "Ubicacion temporal", type: "text" },{ name: "fatherHorseId", label: "Padre registrado", type: "relation", collection: "horses", display: "name" },{ name: "fatherExternalName", label: "Padre externo", type: "text" },{ name: "motherHorseId", label: "Madre registrada", type: "relation", collection: "horses", display: "name" },{ name: "motherExternalName", label: "Madre externa", type: "text" },{ name: "notes", label: "Notas", type: "textarea" }],
    defaults: { ownershipType: "own", status: "active" } },
  { id: "boardingStays", label: "Pensiones", singular: "pension", endpoint: "/api/v1/boarding-stays", permission: "boarding_stays.manage",
    fields: [{ name: "horseId", label: "Caballo", type: "relation", collection: "horses", display: "name", filter: { ownershipType: "boarded" }, required: true },{ name: "clientId", label: "Cliente", type: "relation", collection: "clients", display: "fullName", required: true },{ name: "startDate", label: "Fecha inicio", type: "date", required: true },{ name: "estimatedExitDate", label: "Salida estimada", type: "date" },{ name: "actualExitDate", label: "Salida real", type: "date" },{ name: "boardingType", label: "Tipo", type: "select", options: ["client_supplies","included_supplies","mixed","other"], required: true },{ name: "otherTypeDescription", label: "Descripcion otro", type: "text" },{ name: "agreementStatus", label: "Estado", type: "select", options: ["active","payment_pending","debt","finished","cancelled"], required: true },{ name: "monthlyCost", label: "Costo", type: "money", min: 0, required: true },{ name: "hayBalesPerMonth", label: "Fardos/mes", type: "number", min: 0 },{ name: "oatsPerMonth", label: "Avena/mes", type: "number", min: 0 },{ name: "otherSupplies", label: "Otros insumos", type: "textarea" },{ name: "careNotes", label: "Notas cuidado", type: "textarea" }],
    defaults: { agreementStatus: "active", boardingType: "mixed", monthlyCost: 0, hayBalesPerMonth: 0, oatsPerMonth: 0 } },
  { id: "boardingPayments", label: "Pagos", singular: "pago", endpoint: "/api/v1/boarding-payments", permission: "boarding_payments.manage",
    fields: [{ name: "boardingStayId", label: "Pension", type: "relation", collection: "boardingStays", display: "code", required: true },{ name: "paymentDate", label: "Fecha pago", type: "date", required: true },{ name: "paidMonths", label: "Meses pagados", type: "text", required: true },{ name: "paymentMethod", label: "Medio", type: "select", options: ["cash","transfer"], required: true },{ name: "amount", label: "Monto", type: "money", min: 1, required: true },{ name: "receiptReference", label: "Comprobante", type: "text" },{ name: "observations", label: "Observaciones", type: "textarea" }],
    defaults: { status: "valid", paymentMethod: "transfer" } },
  { id: "vaccinations", label: "Vacunas", singular: "vacuna", endpoint: "/api/v1/vaccinations", permission: "vaccinations.manage",
    fields: [{ name: "horseId", label: "Caballo", type: "relation", collection: "horses", display: "name", required: true },{ name: "vaccineName", label: "Vacuna", type: "text", required: true },{ name: "appliedAt", label: "Fecha", type: "date", required: true },{ name: "appliedBy", label: "Quien aplico", type: "text", required: true },{ name: "observations", label: "Observaciones", type: "textarea" }],
    defaults: { status: "valid" } },
  { id: "farrierRecords", label: "Herrajes", singular: "herraje", endpoint: "/api/v1/farrier-records", permission: "farrier_records.manage",
    fields: [{ name: "horseId", label: "Caballo", type: "relation", collection: "horses", display: "name", required: true },{ name: "serviceDate", label: "Fecha", type: "date", required: true },{ name: "serviceType", label: "Tipo", type: "select", options: ["trim","shoeing","correction","other"], required: true },{ name: "performedBy", label: "Realizado por", type: "text", required: true },{ name: "observations", label: "Observaciones", type: "textarea" }],
    defaults: { status: "valid", serviceType: "shoeing" } },
  { id: "documentBatches", label: "Documentos", singular: "lote", endpoint: "/api/v1/document-batches", permission: "documents.manage",
    fields: [{ name: "entityType", label: "Entidad", type: "select", options: ["horse","client","boarding_stay","boarding_payment","vaccination","farrier_record"], required: true },{ name: "entityId", label: "ID entidad", type: "text", required: true },{ name: "title", label: "Nombre", type: "text", required: true },{ name: "description", label: "Descripcion", type: "textarea" },{ name: "filesText", label: "Archivos", type: "textarea", required: true, placeholder: "uno por linea" },{ name: "fileUpload", label: "Subir archivos", type: "file", multiple: true }],
    defaults: { status: "active" } },
  { id: "users", label: "Administradores", singular: "usuario", endpoint: "/api/v1/users", permission: "users.manage", keyField: "email",
    fields: [{ name: "name", label: "Nombre", type: "text", required: true },{ name: "email", label: "Correo", type: "email", required: true },{ name: "role", label: "Rol", type: "select", options: ["owner","admin"], required: true }],
    defaults: { status: "active", role: "admin" } },
  { id: "adminInvitations", label: "Invitaciones", singular: "invitacion", endpoint: "/api/v1/admin-invitations", permission: "admin_invitations.manage",
    fields: [{ name: "email", label: "Correo", type: "email", required: true },{ name: "role", label: "Rol", type: "select", options: ["admin"], required: true },{ name: "expiresAt", label: "Expira", type: "date", required: true }],
    defaults: { status: "pending", role: "admin" } }
];

export function money(value) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function moduleForCollection(collection) {
  return MODULES.find((item) => item.id === collection);
}
