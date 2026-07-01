import assert from "node:assert/strict";
import {
  CriaderoApi,
  createSeedState,
  createStore,
  dashboard,
  genealogyTree,
  search,
  validateHorse
} from "../src/criadero-core.mjs";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  };
}

function context(actorRole = "owner") {
  const store = createStore(memoryStorage());
  store.reset();
  const actor = store.getState().users.find((user) => user.role === actorRole);
  return { store, api: new CriaderoApi(store, actor) };
}

function ok(response) {
  assert.equal(response.error, undefined, response.error?.message);
  return response.data;
}

function fails(response, code) {
  assert.equal(response.error?.code, code);
}

{
  const state = createSeedState();
  assert.equal(dashboard(state).kpis.ownHorses, 2);
  assert.equal(dashboard(state).kpis.boardedHorses, 1);
  assert.ok(search(state, "Trueno").some((item) => item.type === "horses"));
}

{
  assert.throws(() => validateHorse({ ownershipType: "boarded", name: "X", sex: "macho", color: "zaino", distinctiveMarks: "marca" }), /requiere cliente/);
  assert.throws(() => validateHorse({ ownershipType: "own", clientId: "CLI-001", name: "X", sex: "hembra", color: "zaino", distinctiveMarks: "marca" }), /propio no debe/);
}

{
  const { api } = context();
  const client = ok(api.request("POST", "/api/v1/clients", {
    firstName: "Ana",
    lastName: "Munoz",
    phone: "+56 9 3333 3333",
    address: "Santa Barbara",
    internalNotes: "Nueva temporada"
  }));
  const horse = ok(api.request("POST", "/api/v1/horses", {
    ownershipType: "boarded",
    name: "Rayo",
    sex: "macho",
    color: "Colorado",
    distinctiveMarks: "Mancha lateral",
    clientId: client.id
  }));
  assert.equal(horse.clientId, client.id);
  assert.equal(horse.status, "active");
}

{
  const { api } = context();
  fails(api.request("POST", "/api/v1/horses", {
    ownershipType: "boarded",
    name: "Sin Dueno",
    sex: "macho",
    color: "negro",
    distinctiveMarks: "ninguno"
  }), "validation_error");
}

{
  const { store, api } = context();
  const state = store.getState();
  fails(api.request("POST", "/api/v1/boarding-stays", {
    horseId: state.horses.find((horse) => horse.ownershipType === "own").id,
    startDate: "2026-07-01",
    boardingType: "mixed",
    agreementStatus: "active",
    monthlyCost: 100000
  }), "validation_error");
  fails(api.request("POST", "/api/v1/boarding-stays", {
    horseId: "HOR-003",
    startDate: "2026-07-01",
    boardingType: "mixed",
    agreementStatus: "active",
    monthlyCost: 100000
  }), "active_stay_exists");
}

{
  const { api } = context();
  fails(api.request("POST", "/api/v1/boarding-payments", {
    boardingStayId: "STA-001",
    paymentDate: "2026-07-05",
    paidMonths: "2026-06",
    paymentMethod: "transfer",
    amount: 180000
  }), "duplicate_paid_month");
  const payment = ok(api.request("POST", "/api/v1/boarding-payments", {
    boardingStayId: "STA-001",
    paymentDate: "2026-07-05",
    paidMonths: "2026-07, 2026-08",
    paymentMethod: "cash",
    amount: 360000
  }));
  assert.deepEqual(payment.paidMonths, ["2026-07", "2026-08"]);
}

{
  const { store, api } = context();
  const stay = ok(api.request("POST", "/api/v1/boarding-stays/STA-001/finish", { actualExitDate: "2026-09-30" }));
  assert.equal(stay.agreementStatus, "finished");
  assert.equal(store.getState().horses.find((horse) => horse.id === "HOR-003").status, "out_of_stay");
  const newStay = ok(api.request("POST", "/api/v1/boarding-stays", {
    horseId: "HOR-003",
    startDate: "2027-06-01",
    boardingType: "client_supplies",
    agreementStatus: "active",
    monthlyCost: 200000
  }));
  assert.equal(newStay.code, "PEN-002");
}

{
  const { api } = context();
  const vaccine = ok(api.request("POST", "/api/v1/vaccinations", {
    horseId: "HOR-003",
    vaccineName: "Antitetanica",
    appliedAt: "2026-07-11",
    appliedBy: "Dra. Silva"
  }));
  ok(api.request("POST", `/api/v1/vaccinations/${vaccine.id}/cancel`, { reason: "Registro duplicado" }));
}

{
  const { api } = context();
  const farrier = ok(api.request("POST", "/api/v1/farrier-records", {
    horseId: "HOR-001",
    serviceDate: "2026-07-12",
    serviceType: "trim",
    performedBy: "Maestro Raul"
  }));
  assert.equal(farrier.status, "valid");
}

{
  const { api } = context();
  const batch = ok(api.request("POST", "/api/v1/document-batches", {
    entityType: "horse",
    entityId: "HOR-001",
    title: "Pedigree y fotos",
    description: "Respaldo inicial",
    filesText: "pedigree.pdf\nluna.jpg"
  }));
  assert.equal(batch.files.length, 2);
  assert.equal(ok(api.request("GET", `/api/v1/document-batches/${batch.id}/download`)).mode, "simulated-local-download");
}

{
  const { api } = context("admin");
  fails(api.request("POST", "/api/v1/admin-invitations", {
    email: "x@test.local",
    role: "admin",
    expiresAt: "2026-12-31"
  }), "permission_denied");
}

{
  const { store, api } = context();
  const invitation = ok(api.request("POST", "/api/v1/admin-invitations", {
    email: "invitado@criadero.local",
    role: "admin",
    expiresAt: "2026-12-31"
  }));
  const accepted = ok(api.request("POST", `/api/v1/admin-invitations/${invitation.token}/accept`, { name: "Invitado" }));
  assert.equal(accepted.user.email, "invitado@criadero.local");
  assert.ok(store.getState().auditLogs.some((item) => item.event_type === "security"));
}

{
  const { store, api } = context();
  ok(api.request("PATCH", "/api/v1/horses/HOR-001/genealogy", { motherHorseId: "HOR-002", fatherExternalName: "Campeon" }));
  const tree = genealogyTree(store.getState(), "HOR-001");
  assert.equal(tree.parents.length, 2);
  assert.ok(tree.parents.some((item) => item.name === "Campeon"));
}

{
  const { store, api } = context();
  ok(api.request("POST", "/api/v1/clients", {
    firstName: "Pedro",
    lastName: "Lagos",
    phone: "+56 9 4444 4444",
    address: "Mulchen"
  }));
  assert.ok(store.getState().auditLogs.at(-1).actor_name);
  assert.ok(store.getState().consumption.at(-1).estimated_input_tokens >= 1);
}

console.log("criadero_camila_andrea_tests=pass");
