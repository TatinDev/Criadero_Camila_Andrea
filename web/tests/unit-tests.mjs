import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CriaderoApi,
  createSeedState,
  createStore,
  dashboard,
  genealogyTree,
  search,
  validateHorse,
} from "../src/criadero-core.mjs";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

function context(actorRole = "owner") {
  const store = createStore(memoryStorage());
  store.reset();
  const actor = store.getState().users.find((u) => u.role === actorRole);
  return { store, api: new CriaderoApi(store, actor) };
}

function ok(response) {
  assert.equal(response.error, undefined, response.error?.message);
  return response.data;
}

function fails(response, code) {
  assert.equal(response.error?.code, code);
}

function cuid() {
  return `TEST-${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

test("dashboard muestra KPIs correctos con seed data", () => {
  const state = createSeedState();
  const d = dashboard(state);
  assert.equal(d.kpis.ownHorses, 8);
  assert.equal(d.kpis.boardedHorses, 3);
  assert.ok(d.kpis.activeStays > 0);
});

test("search encuentra caballos por nombre", () => {
  const state = createSeedState();
  const results = search(state, "Trueno");
  assert.ok(results.some((r) => r.type === "horses" && r.title?.includes("Trueno")));
});

test("search encuentra clientes por nombre", () => {
  const state = createSeedState();
  const results = search(state, "Valentina");
  assert.ok(results.some((r) => r.type === "clients"));
});

test("validateHorse rechaza caballo pensionado sin cliente", () => {
  assert.throws(
    () => validateHorse({ ownershipType: "boarded", name: "X", sex: "macho", color: "zaino", distinctiveMarks: "marca" }),
    /requiere cliente/,
  );
});

test("validateHorse rechaza caballo propio con cliente", () => {
  assert.throws(
    () => validateHorse({ ownershipType: "own", clientId: "CLI-001", name: "X", sex: "hembra", color: "zaino", distinctiveMarks: "marca" }),
    /propio no debe/,
  );
});

test("crear caballo pensionado asocia cliente correctamente", () => {
  const { api } = context();
  const client = ok(api.request("POST", "/api/v1/clients", {
    firstName: "Ana", lastName: "Munoz", phone: "+56 9 3333 3333", address: "Santa Barbara", internalNotes: "Nueva temporada",
  }));
  const horse = ok(api.request("POST", "/api/v1/horses", {
    ownershipType: "boarded", name: "Rayo", sex: "macho", color: "Colorado", distinctiveMarks: "Mancha lateral", clientId: client.id,
  }));
  assert.equal(horse.clientId, client.id);
  assert.equal(horse.status, "active");
});

test("rechaza caballo pensionado sin cliente", () => {
  const { api } = context();
  fails(api.request("POST", "/api/v1/horses", {
    ownershipType: "boarded", name: "Sin Dueno", sex: "macho", color: "negro", distinctiveMarks: "ninguno",
  }), "validation_error");
});

test("rechaza pension para caballo propio", () => {
  const { store, api } = context();
  const state = store.getState();
  const ownHorse = state.horses.find((h) => h.ownershipType === "own");
  fails(api.request("POST", "/api/v1/boarding-stays", {
    horseId: ownHorse.id, startDate: "2026-07-01", boardingType: "mixed", agreementStatus: "active", monthlyCost: 100000, clientId: "CLI-001",
  }), "validation_error");
});

test("rechaza segunda pension activa para el mismo caballo", () => {
  const { api } = context();
  fails(api.request("POST", "/api/v1/boarding-stays", {
    horseId: "HOR-003", startDate: "2026-07-01", boardingType: "mixed", agreementStatus: "active", monthlyCost: 100000, clientId: "CLI-001",
  }), "active_stay_exists");
});

test("bloquea pago duplicado del mismo mes en la misma pension", () => {
  const { api } = context();
  fails(api.request("POST", "/api/v1/boarding-payments", {
    boardingStayId: "STA-001", paymentDate: "2026-07-05", paidMonths: "2026-06", paymentMethod: "transfer", amount: 180000,
  }), "duplicate_paid_month");
});

test("registra pago valido con multiples meses", () => {
  const { api } = context();
  const payment = ok(api.request("POST", "/api/v1/boarding-payments", {
    boardingStayId: "STA-001", paymentDate: "2026-08-05", paidMonths: "2026-08, 2026-09", paymentMethod: "cash", amount: 360000,
  }));
  assert.deepEqual(payment.paidMonths, ["2026-08", "2026-09"]);
  assert.equal(payment.status, "valid");
});

test("finalizar pension cambia estado del caballo a out_of_stay", () => {
  const { store, api } = context();
  const stay = ok(api.request("POST", "/api/v1/boarding-stays/STA-001/finish", { actualExitDate: "2026-09-30" }));
  assert.equal(stay.agreementStatus, "finished");
  assert.equal(store.getState().horses.find((h) => h.id === "HOR-003").status, "out_of_stay");
});

test("permite nueva pension para caballo con pension finalizada", () => {
  const { api } = context();
  ok(api.request("POST", "/api/v1/boarding-stays/STA-001/finish", { actualExitDate: "2026-09-30" }));
  const newStay = ok(api.request("POST", "/api/v1/boarding-stays", {
    horseId: "HOR-003", startDate: "2027-06-01", boardingType: "client_supplies", agreementStatus: "active", monthlyCost: 200000, clientId: "CLI-001",
  }));
  assert.ok(newStay.code);
  assert.equal(newStay.agreementStatus, "active");
});

test("crear y cancelar vacuna", () => {
  const { api } = context();
  const vaccine = ok(api.request("POST", "/api/v1/vaccinations", {
    horseId: "HOR-003", vaccineName: "Antitetanica", appliedAt: "2026-07-11", appliedBy: "Dra. Silva",
  }));
  assert.equal(vaccine.status, "valid");
  ok(api.request("POST", `/api/v1/vaccinations/${vaccine.id}/cancel`, { reason: "Registro duplicado" }));
});

test("crear registro de herraje", () => {
  const { api } = context();
  const farrier = ok(api.request("POST", "/api/v1/farrier-records", {
    horseId: "HOR-001", serviceDate: "2026-07-12", serviceType: "trim", performedBy: "Maestro Raul",
  }));
  assert.equal(farrier.status, "valid");
});

test("crear lote documental", () => {
  const { api } = context();
  const batch = ok(api.request("POST", "/api/v1/document-batches", {
    entityType: "horse", entityId: "HOR-001", title: "Pedigree y fotos", description: "Respaldo inicial", filesText: "pedigree.pdf\nluna.jpg",
  }));
  assert.equal(batch.files.length, 2);
});

test("descarga de lote documental simulada", () => {
  const { api } = context();
  const batch = ok(api.request("POST", "/api/v1/document-batches", {
    entityType: "horse", entityId: "HOR-001", title: "Test Docs", description: "", filesText: "test.pdf",
  }));
  const dl = ok(api.request("GET", `/api/v1/document-batches/${batch.id}/download`));
  assert.equal(dl.mode, "simulated-local-download");
});

test("admin no puede crear invitaciones", () => {
  const { api } = context("admin");
  fails(api.request("POST", "/api/v1/admin-invitations", {
    email: "x@test.local", role: "admin", expiresAt: "2026-12-31",
  }), "permission_denied");
});

test("owner crea invitacion y se acepta", () => {
  const { store, api } = context();
  const invitation = ok(api.request("POST", "/api/v1/admin-invitations", {
    email: "invitado@criadero.local", role: "admin", expiresAt: "2026-12-31",
  }));
  const accepted = ok(api.request("POST", `/api/v1/admin-invitations/${invitation.code}/accept`, { name: "Invitado Test" }));
  assert.equal(accepted.user.email, "invitado@criadero.local");
  assert.ok(store.getState().auditLogs.some((l) => l.event_type === "security"));
});

test("genealogia con padre externo y madre registrada", () => {
  const { store, api } = context();
  ok(api.request("PATCH", "/api/v1/horses/HOR-001/genealogy", { motherHorseId: "HOR-002", fatherExternalName: "Campeon" }));
  const tree = genealogyTree(store.getState(), "HOR-001");
  assert.equal(tree.parents.length, 2);
  assert.ok(tree.parents.some((p) => p.name === "Campeon"));
});

test("audit log registra actor, accion y entidad", () => {
  const { store, api } = context();
  const beforeLen = store.getState().auditLogs.length;
  ok(api.request("POST", "/api/v1/clients", {
    firstName: "Pedro", lastName: "Lagos", phone: "+56 9 4444 4444", address: "Mulchen",
  }));
  const logs = store.getState().auditLogs;
  assert.ok(logs.length > beforeLen);
  assert.ok(logs[logs.length - 1].actor_name);
  assert.ok(logs[logs.length - 1].entity_type);
});

test("dashboard lista metricas completas", () => {
  const state = createSeedState();
  const d = dashboard(state);
  assert.ok(d.kpis.ownHorses >= 0);
  assert.ok(d.kpis.boardedHorses >= 0);
  assert.ok(Array.isArray(d.activeStays));
  assert.ok(Array.isArray(d.recentAudit));
  assert.ok(Array.isArray(d.upcomingCare));
});

test("editar cliente conserva historial", () => {
  const { store, api } = context();
  const client = ok(api.request("POST", "/api/v1/clients", {
    firstName: "Edit", lastName: "Test", phone: "+56 9 5555 5555", address: "Test",
  }));
  const beforeLen = store.getState().auditLogs.length;
  ok(api.request("PATCH", `/api/v1/clients/${client.id}`, { lastName: "Updated" }));
  assert.ok(store.getState().auditLogs.length > beforeLen);
});

test("cambiar estado de caballo", () => {
  const { store, api } = context();
  const horse = store.getState().horses.find((h) => h.ownershipType === "own" && h.status === "active");
  ok(api.request("POST", `/api/v1/horses/${horse.id}/change-status`, { status: "in_treatment" }));
  assert.equal(store.getState().horses.find((h) => h.id === horse.id).status, "in_treatment");
});

console.log("criadero_unit_tests=pass");
