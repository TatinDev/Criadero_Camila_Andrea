import { DETERMINISTIC_TS, MODULES, PERMISSIONS, moduleForCollection, today } from "./domain.mjs";

const STORAGE_KEY = "criadero_camila_andrea_state_v1";

export function createSeedState() {
  const state = {
    meta: { facilityId: "CRI-001", currentUserId: "USR-001" },
    users: [
      { id: "USR-001", name: "Camila Andrea", email: "owner@criadero.local", role: "owner", status: "active", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS },
      { id: "USR-002", name: "Admin Interno", email: "admin@criadero.local", role: "admin", status: "active", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    adminInvitations: [
      { id: "INV-001", email: "nuevo.admin@criadero.local", role: "admin", token: "invite-demo-admin", expiresAt: "2026-12-31", status: "pending", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    clients: [
      { id: "CLI-001", firstName: "Valentina", lastName: "Rojas", fullName: "Valentina Rojas", phone: "+56 9 1111 1111", address: "Los Angeles, Chile", internalNotes: "Cliente con pension de invierno.", status: "active", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS },
      { id: "CLI-002", firstName: "Martin", lastName: "Paredes", fullName: "Martin Paredes", phone: "+56 9 2222 2222", address: "Nacimiento, Chile", internalNotes: "Prefiere transferencia mensual.", status: "active", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    horses: [
      { id: "HOR-001", ownershipType: "own", name: "Luna del Valle", sex: "hembra", color: "Alazan", distinctiveMarks: "Lucero blanco y calceta posterior.", status: "active", birthDate: "2021-09-10", breederName: "Criadero Camila Andrea", temporaryLocation: "", fatherExternalName: "Relampago", motherExternalName: "Estrella", notes: "Yegua propia para seguimiento genealogico.", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS },
      { id: "HOR-002", ownershipType: "own", name: "Estrella", sex: "hembra", color: "Tordillo", distinctiveMarks: "Mancha clara en frente.", status: "retired", birthDate: "2015-03-02", breederName: "Criadero Camila Andrea", notes: "Madre registrada.", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS },
      { id: "HOR-003", ownershipType: "boarded", name: "Trueno", sex: "macho", color: "Negro", distinctiveMarks: "Lista fina en cara.", clientId: "CLI-001", status: "in_stay", fatherExternalName: "Tornado", motherExternalName: "Bruma", notes: "Caballo de cliente bajo cuidado.", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    boardingStays: [
      { id: "STA-001", code: "PEN-2026-001", horseId: "HOR-003", clientId: "CLI-001", startDate: "2026-06-01", estimatedExitDate: "2026-09-30", actualExitDate: "", boardingType: "mixed", otherTypeDescription: "", agreementStatus: "active", monthlyCost: 180000, hayBalesPerMonth: 8, oatsPerMonth: 2, otherSupplies: "Sal mineral", careNotes: "Revisar condicion corporal cada semana.", status: "active", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS },
    ],
    boardingPayments: [
      { id: "PAY-001", boardingStayId: "STA-001", horseId: "HOR-003", clientId: "CLI-001", paymentDate: "2026-06-05", paidMonths: ["2026-06"], paymentMethod: "transfer", amount: 180000, receiptReference: "TRX-100", observations: "Pago junio.", status: "valid", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    vaccinations: [
      { id: "VAC-001", horseId: "HOR-001", vaccineName: "Influenza equina", appliedAt: "2026-05-20", appliedBy: "Dra. Silva", observations: "Sin reaccion.", status: "valid", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    farrierRecords: [
      { id: "FAR-001", horseId: "HOR-003", serviceDate: "2026-06-12", serviceType: "shoeing", performedBy: "Maestro Raul", observations: "Herradura completa.", status: "valid", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    documentBatches: [
      { id: "DOCB-001", entityType: "horse", entityId: "HOR-003", title: "Fotos de llegada", description: "Registro visual inicial.", files: [{ id: "DOC-001", name: "trueno-llegada.jpg", mime: "image/jpeg", sizeKb: 420 }], status: "active", createdAt: DETERMINISTIC_TS, updatedAt: DETERMINISTIC_TS }
    ],
    horseStatuses: [
      { id: "HST-001", horseType: "own", code: "active", label: "Activo", status: "active" },
      { id: "HST-002", horseType: "own", code: "temporary_out", label: "Fuera temporal", status: "active" },
      { id: "HST-003", horseType: "boarded", code: "in_stay", label: "En pension", status: "active" },
      { id: "HST-004", horseType: "boarded", code: "out_of_stay", label: "Fuera de pension", status: "active" }
    ],
    auditLogs: [],
    consumption: []
  };
  state.horses[0].motherHorseId = "HOR-002";
  return recalcAll(state);
}

export function createStore(storage = globalThis.localStorage) {
  let state = loadState(storage);
  return {
    getState: () => clone(state),
    reset: () => {
      state = createSeedState();
      persist(storage, state);
      return clone(state);
    },
    transact: (actor, reason, fn) => {
      const before = clone(state);
      const result = fn(state);
      state = recalcAll(state);
      state.consumption.push({
        id: nextId(state, "CON"),
        at: new Date().toISOString(),
        actor_user_id: actor.id,
        actor_name: actor.name,
        reason,
        estimated_input_tokens: estimateTokens(JSON.stringify(before).slice(0, 6000)),
        estimated_output_tokens: estimateTokens(JSON.stringify(result || {}).slice(0, 6000)),
        optimization: "estado local cacheado, transaccion unica, sin red externa, payloads acotados"
      });
      persist(storage, state);
      return clone(result);
    }
  };
}

export class CriaderoApi {
  constructor(store, actor = null) {
    this.store = store;
    this.actor = actor;
  }

  request(method, path, body = {}) {
    try {
      const data = this.#route(method, path, body);
      return { data, meta: { request_id: "REQ-" + String(Date.now()).slice(-8), timestamp: new Date().toISOString() } };
    } catch (error) {
      return { error: { code: error.apiCode || "internal_error", message: error.message, details: error.details || [] } };
    }
  }

  #route(method, path, body) {
    const url = new URL(path, "http://local");
    const normalized = url.pathname.replace(/^\/api\/v1/, "");
    if (normalized === "/auth/login" && method === "POST") return this.#login(body);
    if (normalized === "/auth/me" && method === "GET") return this.#me();
    if (normalized === "/dashboard/summary" && method === "GET") return this.#withPermission("dashboard.read", () => dashboard(this.store.getState()));
    if (normalized === "/search" && method === "GET") return this.#withPermission("search.read", () => search(this.store.getState(), url.searchParams.get("q") || "", url.searchParams.get("type") || "all"));
    if (normalized === "/audit-logs" && method === "GET") return this.#withPermission("audit_logs.read", () => filterAudit(this.store.getState(), url.searchParams));
    if (normalized.startsWith("/users/") && normalized.endsWith("/activate") && method === "POST") return this.#changeStatus("users", idFrom(normalized, 1), "active");
    if (normalized.startsWith("/users/") && normalized.endsWith("/deactivate") && method === "POST") return this.#changeStatus("users", idFrom(normalized, 1), "inactive");
    if (normalized.startsWith("/admin-invitations/") && normalized.endsWith("/revoke") && method === "POST") return this.#changeStatus("adminInvitations", idFrom(normalized, 1), "revoked");
    if (normalized.startsWith("/admin-invitations/") && normalized.endsWith("/accept") && method === "POST") return this.#acceptInvitation(idFrom(normalized, 1), body);
    if (normalized.startsWith("/horses/") && normalized.endsWith("/change-status") && method === "POST") return this.#changeHorseStatus(idFrom(normalized, 1), body.status);
    if (normalized.startsWith("/horses/") && normalized.endsWith("/genealogy-tree") && method === "GET") return genealogyTree(this.store.getState(), idFrom(normalized, 1));
    if (normalized.startsWith("/horses/") && normalized.endsWith("/genealogy") && method === "GET") return genealogy(this.store.getState(), idFrom(normalized, 1));
    if (normalized.startsWith("/horses/") && normalized.endsWith("/genealogy") && method === "PATCH") return this.#updateGenealogy(idFrom(normalized, 1), body);
    if (normalized.startsWith("/boarding-stays/") && normalized.endsWith("/finish") && method === "POST") return this.#finishStay(idFrom(normalized, 1), body);
    if (normalized.startsWith("/boarding-stays/") && normalized.endsWith("/cancel") && method === "POST") return this.#cancelRecord("boardingStays", idFrom(normalized, 1), "cancelled", body.reason);
    if (normalized.startsWith("/boarding-payments/") && normalized.endsWith("/cancel") && method === "POST") return this.#cancelRecord("boardingPayments", idFrom(normalized, 1), "cancelled", body.reason);
    if (normalized.startsWith("/vaccinations/") && normalized.endsWith("/cancel") && method === "POST") return this.#cancelRecord("vaccinations", idFrom(normalized, 1), "cancelled", body.reason);
    if (normalized.startsWith("/farrier-records/") && normalized.endsWith("/cancel") && method === "POST") return this.#cancelRecord("farrierRecords", idFrom(normalized, 1), "cancelled", body.reason);
    if (normalized.startsWith("/document-batches/") && normalized.endsWith("/cancel") && method === "POST") return this.#cancelRecord("documentBatches", idFrom(normalized, 1), "cancelled", body.reason);
    if (normalized.startsWith("/document-batches/") && normalized.endsWith("/download") && method === "GET") return this.#downloadBatch(idFrom(normalized, 1));
    if (normalized.startsWith("/documents/") && normalized.endsWith("/download") && method === "GET") return this.#downloadDocument(idFrom(normalized, 1));

    const module = MODULES.find((item) => normalized === endpointPath(item) || normalized.startsWith(endpointPath(item) + "/"));
    if (!module) throw apiError("not_found", `Endpoint ${method} ${path} no implementado.`);
    this.#authorize(module.permission);
    const id = normalized === endpointPath(module) ? null : normalized.split("/").filter(Boolean).at(-1);
    if (method === "GET" && !id) return this.#list(module.id, url.searchParams);
    if (method === "GET" && id) return findOrFail(this.store.getState()[module.id], id);
    if (method === "POST") return this.#create(module, body);
    if ((method === "PATCH" || method === "PUT") && id) return this.#update(module, id, body);
    if (method === "DELETE" && id) return this.#softDelete(module.id, id);
    throw apiError("not_found", `Ruta ${method} ${path} no soportada.`);
  }

  #login(body) {
    const user = this.store.getState().users.find((item) => item.email === body.email && item.status === "active");
    if (!user) throw apiError("auth_failed", "Usuario o invitacion no valida.");
    this.actor = user;
    return { user, token: "local-session-" + user.id };
  }

  #me() {
    return this.#actor();
  }

  #withPermission(permission, fn) {
    this.#authorize(permission);
    return fn();
  }

  #actor() {
    if (this.actor) return this.actor;
    const state = this.store.getState();
    return state.users.find((item) => item.id === state.meta.currentUserId) || state.users[0];
  }

  #authorize(permission) {
    const actor = this.#actor();
    if (!PERMISSIONS[actor.role]?.includes(permission)) throw apiError("permission_denied", "Permiso insuficiente.");
  }

  #list(collection, params) {
    return this.store.getState()[collection].filter((item) => {
      if (item.status === "deleted") return false;
      for (const [key, value] of params.entries()) {
        if (value && String(item[camel(key)]) !== value) return false;
      }
      return true;
    });
  }

  #create(module, payload) {
    return this.store.transact(this.#actor(), `create:${module.id}`, (state) => {
      validateModule(module, payload, state);
      if (module.keyField && state[module.id].some((item) => item[module.keyField] === payload[module.keyField] && item.status !== "deleted")) {
        throw apiError("duplicate_record", "Ya existe un registro similar.");
      }
      const record = normalizeRecord(module, payload, state);
      state[module.id].push(record);
      audit(state, this.#actor(), module.id, record.id, "create", null, record, importanceFor(module.id), eventTypeFor(module.id));
      return record;
    });
  }

  #update(module, id, payload) {
    return this.store.transact(this.#actor(), `update:${module.id}`, (state) => {
      const item = findOrFail(state[module.id], id);
      const before = clone(item);
      const candidate = { ...item, ...normalizeByFields(module, payload, state) };
      validateModule(module, candidate, state, { updatingId: id });
      Object.assign(item, candidate, { updatedAt: new Date().toISOString() });
      audit(state, this.#actor(), module.id, id, "update", before, item, importanceFor(module.id), eventTypeFor(module.id));
      return item;
    });
  }

  #softDelete(collection, id) {
    return this.store.transact(this.#actor(), `soft_delete:${collection}`, (state) => {
      const item = findOrFail(state[collection], id);
      guardSoftDelete(state, collection, id);
      const before = clone(item);
      item.status = "inactive";
      item.updatedAt = new Date().toISOString();
      audit(state, this.#actor(), collection, id, "soft_delete", before, item, "high", eventTypeFor(collection));
      return item;
    });
  }

  #changeStatus(collection, id, status) {
    const module = moduleForCollection(collection);
    if (module) this.#authorize(module.permission);
    return this.store.transact(this.#actor(), `status:${collection}:${status}`, (state) => {
      const item = findOrFail(state[collection], id);
      const before = clone(item);
      item.status = status;
      item.updatedAt = new Date().toISOString();
      audit(state, this.#actor(), collection, id, `status:${status}`, before, item, "high", eventTypeFor(collection));
      return item;
    });
  }

  #changeHorseStatus(id, status) {
    this.#authorize("horse_statuses.manage");
    return this.store.transact(this.#actor(), "horse.change_status", (state) => {
      const horse = findOrFail(state.horses, id);
      const before = clone(horse);
      horse.status = status;
      horse.updatedAt = new Date().toISOString();
      audit(state, this.#actor(), "horses", id, "change_status", before, horse, "high", "horse_status");
      return horse;
    });
  }

  #finishStay(id, payload) {
    this.#authorize("boarding_stays.manage");
    return this.store.transact(this.#actor(), "boarding.finish", (state) => {
      const stay = findOrFail(state.boardingStays, id);
      requireFields(payload, ["actualExitDate"]);
      const before = clone(stay);
      stay.actualExitDate = payload.actualExitDate;
      stay.agreementStatus = "finished";
      stay.status = "finished";
      stay.updatedAt = new Date().toISOString();
      const horse = state.horses.find((item) => item.id === stay.horseId);
      if (horse) horse.status = "out_of_stay";
      audit(state, this.#actor(), "boardingStays", id, "finish", before, stay, "high", "boarding_stay");
      return stay;
    });
  }

  #cancelRecord(collection, id, status, reason = "") {
    const module = moduleForCollection(collection);
    if (module) this.#authorize(module.permission);
    if (!reason) throw apiError("validation_error", "Debe indicar motivo de anulacion.");
    return this.store.transact(this.#actor(), `cancel:${collection}`, (state) => {
      const item = findOrFail(state[collection], id);
      const before = clone(item);
      item.status = status;
      if ("agreementStatus" in item) item.agreementStatus = status;
      item.cancelReason = reason;
      item.updatedAt = new Date().toISOString();
      audit(state, this.#actor(), collection, id, "cancel", before, item, "high", eventTypeFor(collection));
      return item;
    });
  }

  #acceptInvitation(token, body) {
    return this.store.transact({ id: "SYSTEM", name: "Sistema", role: "owner" }, "invitation.accept", (state) => {
      const invitation = state.adminInvitations.find((item) => item.token === token || item.id === token);
      if (!invitation || invitation.status !== "pending" || invitation.expiresAt < today()) throw apiError("invalid_invitation", "Invitacion no valida o vencida.");
      const user = { id: nextId(state, "USR"), name: body.name, email: invitation.email, role: invitation.role, status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      invitation.status = "accepted";
      invitation.acceptedByUserId = user.id;
      state.users.push(user);
      audit(state, user, "adminInvitations", invitation.id, "accept", null, invitation, "high", "security");
      return { user, invitation };
    });
  }

  #updateGenealogy(id, body) {
    this.#authorize("horses.manage");
    return this.store.transact(this.#actor(), "horse.genealogy", (state) => {
      const horse = findOrFail(state.horses, id);
      const before = clone(horse);
      Object.assign(horse, pick(body, ["fatherHorseId", "fatherExternalName", "motherHorseId", "motherExternalName"]), { updatedAt: new Date().toISOString() });
      audit(state, this.#actor(), "horses", id, "update_genealogy", before, horse, "medium", "genealogy");
      return genealogy(state, id);
    });
  }

  #downloadBatch(id) {
    this.#authorize("documents.manage");
    const batch = findOrFail(this.store.getState().documentBatches, id);
    return { fileName: `${batch.id}.zip`, files: batch.files, mode: "simulated-local-download" };
  }

  #downloadDocument(id) {
    this.#authorize("documents.manage");
    const batch = this.store.getState().documentBatches.find((item) => item.files?.some((file) => file.id === id));
    const file = batch?.files.find((item) => item.id === id);
    if (!file) throw apiError("not_found", "Documento no encontrado.");
    return { fileName: file.name, mode: "simulated-local-download" };
  }
}

export function validateModule(module, payload, state, options = {}) {
  requireFields(payload, module.fields.filter((field) => field.required).map((field) => field.name));
  for (const field of module.fields) {
    const value = payload[field.name];
    if (field.type === "email" && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) throw apiError("validation_error", "Correo invalido.", [{ field: field.name }]);
    if ((field.type === "number" || field.type === "money") && value !== undefined && Number(value) < (field.min ?? Number.NEGATIVE_INFINITY)) throw apiError("validation_error", "Valor numerico invalido.", [{ field: field.name }]);
    if (field.type === "relation" && value && !state[field.collection].some((item) => item.id === value && item.status !== "deleted")) throw apiError("validation_error", "Relacion no encontrada.", [{ field: field.name }]);
  }
  if (module.id === "horses") validateHorse(payload);
  if (module.id === "boardingStays") validateStay(payload, state, options.updatingId);
  if (module.id === "boardingPayments") validatePayment(payload, state, options.updatingId);
  if (module.id === "documentBatches") validateDocumentBatch(payload);
}

export function dashboard(state) {
  const activeStays = state.boardingStays.filter((item) => item.agreementStatus === "active");
  const paymentsTotal = state.boardingPayments.filter((item) => item.status === "valid").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const dueStays = state.boardingStays.filter((item) => ["payment_pending", "debt"].includes(item.agreementStatus));
  return {
    kpis: {
      ownHorses: state.horses.filter((item) => item.ownershipType === "own" && item.status !== "inactive").length,
      boardedHorses: state.horses.filter((item) => item.ownershipType === "boarded" && item.status !== "inactive").length,
      clients: state.clients.filter((item) => item.status === "active").length,
      activeStays: activeStays.length,
      dueStays: dueStays.length,
      paymentsTotal
    },
    activeStays,
    dueStays,
    recentAudit: state.auditLogs.slice(-8).reverse(),
    upcomingCare: [
      ...state.vaccinations.slice(-3).map((item) => ({ type: "Vacuna", horseId: item.horseId, date: item.appliedAt, text: item.vaccineName })),
      ...state.farrierRecords.slice(-3).map((item) => ({ type: "Herraje", horseId: item.horseId, date: item.serviceDate, text: item.serviceType }))
    ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6)
  };
}

export function search(state, query, type = "all") {
  const q = normalize(query);
  if (!q) return [];
  const sources = [
    ["horses", state.horses, ["name", "color", "distinctiveMarks", "notes"]],
    ["clients", state.clients, ["fullName", "phone", "address", "internalNotes"]],
    ["boarding_stays", state.boardingStays, ["code", "careNotes", "otherSupplies"]],
    ["documents", state.documentBatches, ["title", "description", "filesText"]]
  ].filter(([source]) => type === "all" || source === type);
  return sources.flatMap(([source, rows, fields]) => rows.filter((row) => fields.some((field) => normalize(row[field] || JSON.stringify(row.files || "")).includes(q))).map((row) => ({
    type: source,
    id: row.id,
    title: row.name || row.fullName || row.code || row.title,
    status: row.status || row.agreementStatus,
    preview: fields.map((field) => row[field]).filter(Boolean).join(" | ").slice(0, 120)
  })));
}

export function genealogy(state, id) {
  const horse = findOrFail(state.horses, id);
  return {
    horse,
    father: horse.fatherHorseId ? state.horses.find((item) => item.id === horse.fatherHorseId) : null,
    fatherExternalName: horse.fatherExternalName || "",
    mother: horse.motherHorseId ? state.horses.find((item) => item.id === horse.motherHorseId) : null,
    motherExternalName: horse.motherExternalName || "",
    children: state.horses.filter((item) => item.fatherHorseId === id || item.motherHorseId === id)
  };
}

export function genealogyTree(state, id) {
  const node = genealogy(state, id);
  return {
    id: node.horse.id,
    name: node.horse.name,
    parents: [
      node.father ? { id: node.father.id, name: node.father.name, registered: true } : node.fatherExternalName ? { name: node.fatherExternalName, registered: false } : null,
      node.mother ? { id: node.mother.id, name: node.mother.name, registered: true } : node.motherExternalName ? { name: node.motherExternalName, registered: false } : null
    ].filter(Boolean),
    children: node.children.map((child) => ({ id: child.id, name: child.name }))
  };
}

export function recalcAll(state) {
  for (const client of state.clients) client.fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim();
  for (const stay of state.boardingStays) {
    stay.code ||= "PEN-" + stay.id.split("-").at(-1);
    const horse = state.horses.find((item) => item.id === stay.horseId);
    stay.clientId = horse?.clientId || stay.clientId;
  }
  for (const payment of state.boardingPayments) {
    const stay = state.boardingStays.find((item) => item.id === payment.boardingStayId);
    payment.horseId = stay?.horseId || payment.horseId;
    payment.clientId = stay?.clientId || payment.clientId;
  }
  return state;
}

export function normalizeRecord(module, payload, state) {
  const record = {
    id: nextId(state, prefixFor(module.id)),
    ...module.defaults,
    ...normalizeByFields(module, payload, state),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (module.id === "adminInvitations") record.token = "invite-" + record.id.toLowerCase();
  if (module.id === "boardingStays") record.code = "PEN-" + record.id.split("-").at(-1);
  return record;
}

export function normalizeByFields(module, payload, state = null) {
  const result = {};
  for (const field of module.fields) {
    if (!(field.name in payload)) continue;
    if (field.type === "number" || field.type === "money") result[field.name] = Number(payload[field.name] || 0);
    else result[field.name] = payload[field.name];
  }
  if (module.id === "boardingPayments" && "paidMonths" in result) result.paidMonths = parseMonths(result.paidMonths);
  if (module.id === "documentBatches" && "filesText" in result) result.files = parseFiles(result.filesText, state);
  return result;
}

export function audit(state, actor, entityType, entityId, action, before, after, importance = "medium", eventType = "data_change") {
  state.auditLogs.push({
    id: nextId(state, "AUD"),
    actor_user_id: actor.id,
    actor_name: actor.name,
    actor_role: actor.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    before: before ? clone(before) : null,
    after: after ? clone(after) : null,
    importance,
    event_type: eventType,
    created_at: new Date().toISOString()
  });
}

export function validateHorse(payload) {
  if (payload.ownershipType === "boarded" && !payload.clientId) throw apiError("validation_error", "Caballo pensionado requiere cliente dueno.", [{ field: "clientId" }]);
  if (payload.ownershipType === "own" && payload.clientId) throw apiError("validation_error", "Caballo propio no debe tener cliente dueno.", [{ field: "clientId" }]);
  if (payload.ownershipType === "boarded" && payload.temporaryLocation) throw apiError("validation_error", "Ubicacion temporal aplica solo a caballos propios.", [{ field: "temporaryLocation" }]);
}

export function validateStay(payload, state, updatingId = null) {
  const horse = state.horses.find((item) => item.id === payload.horseId);
  if (!horse || horse.ownershipType !== "boarded") throw apiError("validation_error", "La pension requiere un caballo pensionado.", [{ field: "horseId" }]);
  const active = state.boardingStays.find((item) => item.id !== updatingId && item.horseId === payload.horseId && item.agreementStatus === "active");
  if (active && payload.agreementStatus === "active") throw apiError("active_stay_exists", "El caballo ya tiene una pension activa.");
  if (payload.boardingType === "other" && !payload.otherTypeDescription) throw apiError("validation_error", "Debe describir el tipo de pension otro.", [{ field: "otherTypeDescription" }]);
}

export function validatePayment(payload, state, updatingId = null) {
  const stay = state.boardingStays.find((item) => item.id === payload.boardingStayId);
  if (!stay) throw apiError("validation_error", "Pago requiere pension asociada.", [{ field: "boardingStayId" }]);
  const months = parseMonths(payload.paidMonths);
  if (!months.length) throw apiError("validation_error", "Debe indicar al menos un mes pagado.", [{ field: "paidMonths" }]);
  const duplicates = state.boardingPayments
    .filter((item) => item.id !== updatingId && item.boardingStayId === payload.boardingStayId && item.status === "valid")
    .flatMap((item) => item.paidMonths || [])
    .filter((month) => months.includes(month));
  if (duplicates.length) throw apiError("duplicate_paid_month", "No se puede duplicar un mes pagado dentro de la misma pension.", duplicates);
}

export function validateDocumentBatch(payload) {
  if (!parseFiles(payload.filesText).length) throw apiError("validation_error", "Debe registrar al menos un documento.", [{ field: "filesText" }]);
}

export function guardSoftDelete(state, collection, id) {
  if (collection === "clients" && state.boardingStays.some((item) => item.clientId === id && item.agreementStatus === "active")) throw apiError("state_conflict", "No se puede inactivar cliente con pension activa.");
  if (collection === "horses" && state.boardingStays.some((item) => item.horseId === id && item.agreementStatus === "active")) throw apiError("state_conflict", "No se puede inactivar caballo con pension activa.");
}

export function filterAudit(state, params) {
  return state.auditLogs.filter((item) => {
    for (const [key, value] of params.entries()) if (value && String(item[camel(key)]) !== value && String(item[key]) !== value) return false;
    return true;
  });
}

export function parseMonths(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "").split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

export function parseFiles(value, state = null) {
  if (Array.isArray(value)) return value;
  return String(value || "").split(/\n/).map((name) => name.trim()).filter(Boolean).map((name) => ({
    id: state ? nextId(state, "DOC") : "DOC-TMP",
    name,
    mime: mimeFor(name),
    sizeKb: Math.max(1, Math.ceil(name.length * 3.5))
  }));
}

export function requireFields(payload, fields) {
  const missing = fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === "");
  if (missing.length) throw apiError("validation_error", "Faltan campos obligatorios.", missing.map((field) => ({ field, issue: "required" })));
}

export function findOrFail(list, id) {
  const item = list.find((record) => record.id === id && record.status !== "deleted");
  if (!item) throw apiError("not_found", "Registro no encontrado.");
  return item;
}

export function apiError(code, message, details = []) {
  const error = new Error(message);
  error.apiCode = code;
  error.details = details;
  return error;
}

export function nextId(state, prefix) {
  const max = Object.values(state).filter(Array.isArray).flat()
    .map((item) => String(item.id || ""))
    .filter((id) => id.startsWith(prefix + "-"))
    .map((id) => Number(id.split("-").at(-1)))
    .filter(Number.isFinite)
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

function loadState(storage) {
  if (!storage) return createSeedState();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = createSeedState();
    persist(storage, seed);
    return seed;
  }
  try {
    return recalcAll(JSON.parse(raw));
  } catch {
    const seed = createSeedState();
    persist(storage, seed);
    return seed;
  }
}

function persist(storage, state) {
  if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function endpointPath(module) {
  return module.endpoint.replace("/api/v1", "");
}

function idFrom(path, index) {
  return path.split("/").filter(Boolean)[index];
}

function prefixFor(collection) {
  return {
    clients: "CLI",
    horses: "HOR",
    boardingStays: "STA",
    boardingPayments: "PAY",
    vaccinations: "VAC",
    farrierRecords: "FAR",
    documentBatches: "DOCB",
    users: "USR",
    adminInvitations: "INV",
    horseStatuses: "HST"
  }[collection] || "REC";
}

function importanceFor(collection) {
  return ["boardingPayments", "boardingStays", "users", "adminInvitations"].includes(collection) ? "high" : "medium";
}

function eventTypeFor(collection) {
  return {
    clients: "client",
    horses: "horse",
    boardingStays: "boarding_stay",
    boardingPayments: "boarding_payment",
    vaccinations: "vaccination",
    farrierRecords: "farrier_record",
    documentBatches: "document",
    users: "security",
    adminInvitations: "security",
    horseStatuses: "horse_status"
  }[collection] || "data_change";
}

function mimeFor(name) {
  if (/\.(png|jpg|jpeg)$/i.test(name)) return "image/jpeg";
  if (/\.pdf$/i.test(name)) return "application/pdf";
  return "application/octet-stream";
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function camel(value) {
  return String(value).replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function pick(value, keys) {
  return Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]]));
}
