import { getPrisma } from "./db.mjs";
import {
  hashPassword, comparePassword, generateToken, generateRefreshToken,
  generateInviteCode, hasPermission,
} from "./auth.mjs";
import crypto from "node:crypto";

function cuid() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `${t}${r}`;
}

function nowISO() {
  return new Date().toISOString();
}

function fromISO(s) {
  return s ? new Date(s) : null;
}

function trim(s) {
  return typeof s === "string" ? s.trim() : s;
}

async function findId(db, table, code) {
  const record = await db[table].findUnique({ where: { code } });
  return record;
}

function auditPayload(user, action, entityType, entityId, importance = "medium", eventType = null, before = null, after = null) {
  return {
    actorUserId: user.userId,
    actorName: user.name,
    actorRole: user.role,
    action,
    entityType,
    entityId,
    before: before ? JSON.parse(JSON.stringify(before)) : undefined,
    after: after ? JSON.parse(JSON.stringify(after)) : undefined,
    importance: { connect: { code: importance } },
    eventType: { connect: { code: eventType || entityType } },
  };
}

export class PrismaApi {
  constructor(db) {
    this.db = db || getPrisma();
  }

  async describeTables() {
    const rows = await this.db.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    return rows.map((r) => r.table_name);
  }

  auth() {
    return {
      login: async ({ email, password }) => {
        const db = this.db;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { role: true },
        });
        if (!user || user.status !== "active") {
          return { error: { code: "invalid_credentials", message: "Credenciales invalidas." } };
        }
        const valid = await comparePassword(password, user.passwordHash);
        if (!valid) {
          return { error: { code: "invalid_credentials", message: "Credenciales invalidas." } };
        }
        const token = generateToken({ userId: user.id, email: user.email, role: user.role.code, name: `${user.firstName} ${user.lastName}` });
        const refreshToken = generateRefreshToken();
        await db.userSession.create({
          data: {
            userId: user.id,
            token,
            refreshToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        await db.auditLog.create({ data: auditPayload(
          { userId: user.id, name: `${user.firstName} ${user.lastName}`, role: user.role.code },
          "login", "security", user.id, "low", "security"
        ) });
        return { token, refreshToken, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role.code } };
      },

      logout: async (userId) => {
        await this.db.userSession.deleteMany({ where: { userId } });
        return { ok: true };
      },

      refreshToken: async (refreshToken) => {
        const session = await this.db.userSession.findFirst({ where: { refreshToken } });
        if (!session || session.expiresAt < new Date()) {
          return { error: { code: "invalid_token", message: "Token invalido o expirado." } };
        }
        const user = await this.db.user.findUnique({ where: { id: session.userId }, include: { role: true } });
        const token = generateToken({ userId: user.id, email: user.email, role: user.role.code, name: `${user.firstName} ${user.lastName}` });
        const newRefresh = generateRefreshToken();
        await this.db.userSession.update({
          where: { id: session.id },
          data: { token, refreshToken: newRefresh, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        });
        return { token, refreshToken: newRefresh };
      },

      me: async (userId) => {
        const user = await this.db.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user) return { error: { code: "not_found", message: "Usuario no encontrado." } };
        return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role.code, status: user.status };
      },

      passwordRecovery: async ({ email }) => {
        const user = await this.db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (!user) return { ok: true };
        const token = crypto.randomUUID();
        await this.db.passwordResetToken.create({
          data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
        });
        return { ok: true, token };
      },

    passwordReset: async ({ token, password }) => {
      const record = await this.db.passwordResetToken.findUnique({ where: { token } });
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        return { error: { code: "invalid_token", message: "Token invalido o expirado." } };
      }
      const hash = await hashPassword(password);
      await this.db.user.update({ where: { id: record.userId }, data: { passwordHash: hash } });
      await this.db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
      return { ok: true };
    },

    changePassword: async (userId, { currentPassword, newPassword }) => {
      const user = await this.db.user.findUnique({ where: { id: userId }, include: { role: true } });
      if (!user) return { error: { code: "not_found", message: "Usuario no encontrado." } };
      const valid = await comparePassword(currentPassword, user.passwordHash);
      if (!valid) return { error: { code: "invalid_password", message: "Contrasena actual incorrecta." } };
      if (!newPassword || newPassword.length < 6) return { error: { code: "validation_error", message: "Nueva contrasena debe tener al menos 6 caracteres." } };
      const hash = await hashPassword(newPassword);
      await this.db.user.update({ where: { id: userId }, data: { passwordHash: hash } });
      await this.db.auditLog.create({ data: auditPayload(
        { userId, name: `${user.firstName} ${user.lastName}`, role: user.role.code },
        "change_password", "security", userId, "high", "security"
      ) });
      return { ok: true };
    },
    };
  }

  async getCatalog(name) {
    const db = this.db;
    const map = {
      "user-roles": () => db.userRole.findMany({ orderBy: { code: "asc" } }),
      "horse-ownership-types": () => db.horseOwnershipType.findMany({ orderBy: { code: "asc" } }),
      "horse-sexes": () => db.horseSex.findMany({ orderBy: { code: "asc" } }),
      "horse-colors": () => db.horseColor.findMany({ orderBy: { code: "asc" } }),
      "horse-breeds": () => db.horseBreed.findMany({ orderBy: { code: "asc" } }),
      "boarding-types": () => db.boardingType.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
      "agreement-statuses": () => db.agreementStatus.findMany({ orderBy: { sortOrder: "asc" } }),
      "payment-methods": () => db.paymentMethod.findMany({ orderBy: { code: "asc" } }),
      "payment-statuses": () => db.paymentStatus.findMany({ orderBy: { code: "asc" } }),
      "client-statuses": () => db.clientStatus.findMany({ orderBy: { code: "asc" } }),
      "vaccination-statuses": () => db.vaccinationStatus.findMany({ orderBy: { code: "asc" } }),
      "farrier-record-statuses": () => db.farrierRecordStatus.findMany({ orderBy: { code: "asc" } }),
      "importance-levels": () => db.importanceLevel.findMany({ orderBy: { sortOrder: "asc" } }),
      "event-types": () => db.eventType.findMany({ orderBy: { code: "asc" } }),
      "supplies": () => db.supply.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      "file-formats": () => db.fileFormat.findMany({ orderBy: { extension: "asc" } }),
    };
    const fn = map[name];
    return fn ? fn() : [];
  }

  async createCatalogEntry(name, data, user) {
    const db = this.db;
    const modelMap = {
      "horse-colors": (d) => db.horseColor.create({ data: { code: d.code, name: d.name, description: d.description || "" } }),
      "horse-sexes": (d) => db.horseSex.create({ data: { code: d.code, name: d.name } }),
      "horse-breeds": (d) => db.horseBreed.create({ data: { code: d.code, name: d.name, description: d.description || "" } }),
      "boarding-types": (d) => db.boardingType.create({ data: { code: d.code, name: d.name, description: d.description || "", isActive: true } }),
      "agreement-statuses": (d) => db.agreementStatus.create({ data: { code: d.code, name: d.name, description: d.description || "", sortOrder: Number(d.sortOrder) || 99 } }),
      "payment-methods": (d) => db.paymentMethod.create({ data: { code: d.code, name: d.name } }),
      "client-statuses": (d) => db.clientStatus.create({ data: { code: d.code, name: d.name } }),
      "vaccination-statuses": (d) => db.vaccinationStatus.create({ data: { code: d.code, name: d.name } }),
      "farrier-record-statuses": (d) => db.farrierRecordStatus.create({ data: { code: d.code, name: d.name } }),
      "importance-levels": (d) => db.importanceLevel.create({ data: { code: d.code, name: d.name, sortOrder: Number(d.sortOrder) || 99 } }),
      "event-types": (d) => db.eventType.create({ data: { code: d.code, name: d.name } }),
      "supplies": (d) => db.supply.create({ data: { code: d.code, name: d.name, unit: d.unit || "", description: d.description || "", isActive: true } }),
    };
    const fn = modelMap[name];
    if (!fn) return { error: { code: "validation_error", message: "Catalogo no soportado." } };
    const r = await fn(data);
    await db.auditLog.create({ data: auditPayload(user, "create", name, r.id, "medium", "system") });
    return r;
  }

  async updateCatalogEntry(name, id, data, user) {
    const db = this.db;
    const modelMap = {
      "horse-colors": (i, d) => db.horseColor.update({ where: { id: i }, data: { code: d.code, name: d.name, description: d.description, isActive: d.isActive === undefined ? undefined : d.isActive === "true" || d.isActive === true } }),
      "horse-sexes": (i, d) => db.horseSex.update({ where: { id: i }, data: { code: d.code, name: d.name } }),
      "boarding-types": (i, d) => db.boardingType.update({ where: { id: i }, data: { code: d.code, name: d.name, description: d.description, isActive: d.isActive === undefined ? undefined : d.isActive === "true" || d.isActive === true } }),
      "agreement-statuses": (i, d) => db.agreementStatus.update({ where: { id: i }, data: { code: d.code, name: d.name, sortOrder: d.sortOrder ? Number(d.sortOrder) : undefined } }),
      "payment-methods": (i, d) => db.paymentMethod.update({ where: { id: i }, data: { code: d.code, name: d.name } }),
      "supplies": (i, d) => db.supply.update({ where: { id: i }, data: { code: d.code, name: d.name, unit: d.unit, description: d.description, isActive: d.isActive === undefined ? undefined : d.isActive === "true" || d.isActive === true } }),
    };
    const fn = modelMap[name];
    if (!fn) return { error: { code: "validation_error", message: "Catalogo no soportado para edicion." } };
    const r = await fn(id, data);
    await db.auditLog.create({ data: auditPayload(user, "update", name, id, "medium", "system") });
    return r;
  }

  async deleteCatalogEntry(name, id, user) {
    const db = this.db;
    const modelMap = {
      "horse-colors": (i) => db.horseColor.delete({ where: { id: i } }),
      "horse-sexes": (i) => db.horseSex.delete({ where: { id: i } }),
      "horse-breeds": (i) => db.horseBreed.delete({ where: { id: i } }),
      "boarding-types": (i) => db.boardingType.delete({ where: { id: i } }),
      "agreement-statuses": (i) => db.agreementStatus.delete({ where: { id: i } }),
      "payment-methods": (i) => db.paymentMethod.delete({ where: { id: i } }),
      "client-statuses": (i) => db.clientStatus.delete({ where: { id: i } }),
      "vaccination-statuses": (i) => db.vaccinationStatus.delete({ where: { id: i } }),
      "farrier-record-statuses": (i) => db.farrierRecordStatus.delete({ where: { id: i } }),
      "importance-levels": (i) => db.importanceLevel.delete({ where: { id: i } }),
      "event-types": (i) => db.eventType.delete({ where: { id: i } }),
      "supplies": (i) => db.supply.delete({ where: { id: i } }),
    };
    const fn = modelMap[name];
    if (!fn) return { error: { code: "validation_error", message: "Catalogo no soportado para eliminar." } };
    const r = await fn(id);
    await db.auditLog.create({ data: auditPayload(user, "delete", name, id, "medium", "system") });
    return r;
  }

  async listUsers() {
    const users = await this.db.user.findMany({ include: { role: true }, orderBy: { firstName: "asc" } });
    return users.map((u) => ({ ...u, role: u.role?.code || u.role }));
  }

  async updateUser(id, data) {
    const user = await this.db.user.update({ where: { id }, data, include: { role: true } });
    return { ...user, role: user.role?.code || user.role };
  }

  async toggleUser(id, status, user) {
    const updated = await this.db.user.update({ where: { id }, data: { status }, include: { role: true } });
    const action = status === "active" ? "activate" : "deactivate";
    await this.db.auditLog.create({ data: auditPayload(user || { userId: "system", name: "System", role: "system" }, action, "user", id, "high", "security") });
    return updated;
  }

  async createInvitation({ email, role, expiresAt }, createdBy) {
    const token = generateInviteCode();
    const inv = await this.db.adminInvitation.create({
      data: { email: email.toLowerCase().trim(), token, status: "pending", expiresAt: new Date(expiresAt), createdById: createdBy.userId },
    });
    await this.db.auditLog.create({ data: auditPayload(createdBy, "create_invitation", "security", inv.id, "high", "security") });
    return inv;
  }

  async listInvitations() {
    return this.db.adminInvitation.findMany({ orderBy: { createdAt: "desc" } });
  }

  async revokeInvitation(id, user) {
    const inv = await this.db.adminInvitation.update({ where: { id }, data: { status: "revoked" } });
    await this.db.auditLog.create({ data: auditPayload(user, "revoke_invitation", "security", id, "high", "security") });
    return inv;
  }

  async acceptInvitation(token, { name, password }) {
    const inv = await this.db.adminInvitation.findUnique({ where: { token } });
    if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) {
      return { error: { code: "invalid_token", message: "Invitacion invalida, expirada o ya usada." } };
    }
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    const role = await findId(this.db, "userRole", inv.role === "owner" ? "owner" : "admin");
    const hash = await hashPassword(password);
    const user = await this.db.user.create({
      data: { firstName, lastName, email: inv.email, passwordHash: hash, roleId: role.id },
      include: { role: true },
    });
    await this.db.adminInvitation.update({ where: { id: inv.id }, data: { status: "accepted", usedAt: new Date() } });
    await this.db.auditLog.create({ data: auditPayload(
      { userId: user.id, name: `${firstName} ${lastName}`, role: role.code },
      "accept_invitation", "security", user.id, "high", "security"
    ) });
    return { ...user, role: user.role?.code || user.role };
  }

  async listClients(params = {}) {
    const db = this.db;
    const where = {};
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
      ];
    }
    if (params.status) {
      where.status = { code: params.status };
    } else if (!params.show_inactive) {
      where.status = { code: { not: "inactive" } };
    }
    const clients = await db.client.findMany({
      where,
      include: { status: true, contacts: true, addresses: { include: { city: true } }, horses: { select: { id: true } } },
      orderBy: { firstName: "asc" },
    });
    return clients.map(formatClient);
  }

  async getClient(id) {
    const client = await this.db.client.findUnique({
      where: { id },
      include: {
        status: true, contacts: true, addresses: { include: { city: { include: { region: true } } } },
        horses: { select: { id: true, name: true, status: { select: { name: true } } } },
        boardingStays: { select: { id: true } },
      },
    });
    return client ? formatClient(client) : null;
  }

  async createClient(data, user) {
    const existing = await this.db.client.findFirst({
      where: { firstName: data.firstName, lastName: data.lastName, statusId: (await findId(this.db, "clientStatus", "active")).id },
    });
    if (existing) {
      return { error: { code: "duplicate", message: `Ya existe ${data.firstName} ${data.lastName} como cliente activo. Se sugiere editar en vez de duplicar.` } };
    }
    const status = await findId(this.db, "clientStatus", "active");
    const client = await this.db.client.create({
      data: {
        firstName: data.firstName, lastName: data.lastName,
        notes: data.internalNotes || data.notes || "",
        statusId: status.id,
        contacts: {
          create: data.phone ? [{ contactType: "phone", value: data.phone, isPrimary: true }] : [],
        },
      },
      include: { status: true, contacts: true },
    });
    if (data.address) {
      const defaultCity = await this.db.city.findFirst();
      if (defaultCity) {
        await this.db.address.create({
          data: { clientId: client.id, street: data.address, cityId: defaultCity.id, isPrimary: true },
        });
      }
    }
    await this.db.auditLog.create({ data: auditPayload(user, "create", "client", client.id, "medium", "client", null, formatClient(client)) });
    return formatClient(client);
  }

  async updateClient(id, data, user) {
    const before = await this.getClient(id);
    const update = {};
    if (data.firstName !== undefined) update.firstName = data.firstName;
    if (data.lastName !== undefined) update.lastName = data.lastName;
    if (data.internalNotes !== undefined || data.notes !== undefined) update.notes = data.internalNotes || data.notes;
    if (data.phone !== undefined) {
      await this.db.clientContact.deleteMany({ where: { clientId: id } });
      if (data.phone) {
        await this.db.clientContact.create({ data: { clientId: id, contactType: "phone", value: data.phone, isPrimary: true } });
      }
    }
    if (data.address !== undefined) {
      const existing = await this.db.address.findFirst({ where: { clientId: id, isPrimary: true } });
      if (existing) {
        await this.db.address.update({ where: { id: existing.id }, data: { street: data.address } });
      } else if (data.address) {
        const defaultCity = await this.db.city.findFirst();
        if (defaultCity) {
          await this.db.address.create({ data: { clientId: id, street: data.address, cityId: defaultCity.id, isPrimary: true } });
        }
      }
    }
    if (Object.keys(update).length > 0) {
      await this.db.client.update({ where: { id }, data: update });
    }
    const after = await this.getClient(id);
    const wasInactive = before?.status === "inactive" || before?.status?.code === "inactive";
    const becomesActive = data.status === "active";
    const action = wasInactive && becomesActive ? "reactivate" : "update";
    await this.db.auditLog.create({ data: auditPayload(user, action, "client", id, "medium", "client", before, after) });
    return after;
  }

  async deactivateClient(id, user) {
    const activeStays = await this.db.boardingStay.findMany({
      where: { clientId: id, agreementStatus: { code: { in: ["active", "payment_pending"] } } },
      include: { agreementStatus: true },
    });
    if (activeStays.length > 0) {
      return { error: { code: "active_stays", message: `No se puede inactivar: el cliente tiene ${activeStays.length} pension(es) activa(s).` } };
    }
    const inactive = await findId(this.db, "clientStatus", "inactive");
    const before = await this.getClient(id);
    await this.db.client.update({ where: { id }, data: { statusId: inactive.id } });
    const after = await this.getClient(id);
    await this.db.auditLog.create({ data: auditPayload(user, "deactivate", "client", id, "high", "client", before, after) });
    return after;
  }

  async listHorses(params = {}) {
    const db = this.db;
    const where = {};
    if (params.ownership_type) {
      const ot = await findId(db, "horseOwnershipType", params.ownership_type);
      if (ot) where.ownershipTypeId = ot.id;
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { distinctiveMarks: { contains: params.search } },
        { notes: { contains: params.search } },
      ];
    }
    if (params.client_id) where.clientId = params.client_id;
    if (params.status) {
      const s = await db.horseStatus.findFirst({ where: { name: params.status } });
      if (s) where.statusId = s.id;
    }
    const and = [];
    if (!params.show_inactive && !params.show_all && !params.status) {
      const inactiveList = await db.horseStatus.findMany({ where: { name: "Inactivo" } });
      const inactiveIds = inactiveList.map((s) => s.id);
      if (inactiveIds.length) and.push({ statusId: { notIn: inactiveIds } });
    }
    const query = { where };
    if (and.length) query.where = { AND: [where, ...and] };
    const horses = await db.horse.findMany({
      ...query,
      include: {
        ownershipType: true, sex: true, color: true, breed: true, status: true,
        client: { select: { id: true, firstName: true, lastName: true } },
        genealogy: true,
      },
      orderBy: { name: "asc" },
    });
    return horses.map((h) => {
      const sexMap = { mare: "hembra", stallion: "macho", gelding: "capado" };
      const statusMap = { "Activo": "active", "Fuera temporal": "temporary_out", "En tratamiento": "in_treatment", "Vendido": "sold", "Retirado": "retired", "Fallecido": "deceased", "Inactivo": "inactive", "En pension": "in_stay", "Fuera de pension": "out_of_stay" };
      return {
        ...h,
        ownershipType: h.ownershipType?.code || h.ownershipType,
        sex: sexMap[h.sex?.code] || h.sex?.code || h.sex,
        color: h.color?.name || h.color?.code || h.color,
        status: statusMap[h.status?.name] || h.status?.code || h.status?.name || h.status,
        breed: h.breed?.name || h.breed?.code || h.breed,
        clientName: h.client ? `${h.client.firstName} ${h.client.lastName}` : null,
        breederFarm: h.breedingFarmName,
        fatherHorseId: h.genealogy?.fatherHorseId || null,
        motherHorseId: h.genealogy?.motherHorseId || null,
        fatherExternalName: h.genealogy?.fatherExternalName || "",
        motherExternalName: h.genealogy?.motherExternalName || "",
      };
    });
  }

  async getHorse(id) {
    return this.db.horse.findUnique({
      where: { id },
      include: {
        ownershipType: true, sex: true, color: true, breed: true, status: true,
        client: { select: { id: true, firstName: true, lastName: true, contacts: true } },
        genealogy: true,
        gallery: { orderBy: { createdAt: "desc" } },
        vaccinations: { include: { status: true }, orderBy: { applicationDate: "desc" } },
        farrierRecords: { include: { status: true }, orderBy: { serviceDate: "desc" } },
        boardingStays: { include: { boardingType: true, agreementStatus: true, payments: true }, orderBy: { startDate: "desc" } },
      },
    });
  }

  async createHorse(data, user) {
    const db = this.db;
    const ot = await findId(db, "horseOwnershipType", data.ownershipType);
    if (!ot) return { error: { code: "validation_error", message: "Tipo de propiedad invalido." } };

    if (ot.code === "own" && data.clientId) {
      return { error: { code: "validation_error", message: "Caballo propio no debe tener cliente." } };
    }
    if (ot.code === "boarded" && !data.clientId) {
      return { error: { code: "validation_error", message: "Caballo pensionado requiere cliente." } };
    }

    const sexCode = data.sex === "hembra" ? "mare" : data.sex === "macho" ? "stallion" : (data.sex || "mare");
    const sex = await db.horseSex.findFirst({ where: { code: sexCode } });
    const colorMap = { "Alazan": "alazan", "Tordillo": "tordillo", "Negro azabache": "negro", "Negro": "negro",
      "Colorado": "colorado", "Gris plateado": "tordillo", "Alazan tostado": "alazan",
      "Isabelo": "alazan", "Tordillo oscuro": "tordillo", "Bayo": "alazan", "Castano oscuro": "negro" };
    const colorCode = colorMap[data.color] || data.color?.toLowerCase().replace(/\s+/g, "_") || "alazan";
    const color = await findId(db, "horseColor", colorCode) || (await db.horseColor.create({ data: { code: colorCode, name: data.color } }));

    const defaultStatus = ot.code === "own"
      ? await db.horseStatus.findFirst({ where: { horseType: "own", name: "Activo" } })
      : await db.horseStatus.findFirst({ where: { horseType: "boarded", name: "En pension" } });
    const status = data.statusId ? await db.horseStatus.findUnique({ where: { id: data.statusId } }) : defaultStatus;

    const horse = await db.horse.create({
      data: {
        ownershipTypeId: ot.id, clientId: data.clientId || null,
        name: data.name, sexId: sex?.id || "", colorId: color?.id || "",
        breedId: data.breedId || null,
        distinctiveMarks: data.distinctiveMarks || "", notes: data.notes || "",
        breedingFarmName: data.breedingFarmName || data.breederFarm || "",
        birthDate: fromISO(data.birthDate),
        breederName: data.breederName || "",
        temporaryLocation: ot.code === "own" ? (data.temporaryLocation || "") : null,
        statusId: status?.id || "",
      },
      include: { ownershipType: true, sex: true, color: true, status: true },
    });

    if (data.fatherHorseId || data.fatherExternalName || data.motherHorseId || data.motherExternalName) {
      await db.horseGenealogy.create({
        data: {
          horseId: horse.id,
          fatherHorseId: data.fatherHorseId || null,
          motherHorseId: data.motherHorseId || null,
          fatherExternalName: data.fatherExternalName || null,
          motherExternalName: data.motherExternalName || null,
        },
      });
    }
    await db.auditLog.create({ data: auditPayload(user, "create", "horse", horse.id, "medium", "horse", null, horse) });
    return horse;
  }

  async updateHorse(id, data, user) {
    const db = this.db;
    const before = await this.getHorse(id);
    if (!before) return { error: { code: "not_found", message: "Caballo no encontrado." } };
    const update = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.distinctiveMarks !== undefined) update.distinctiveMarks = data.distinctiveMarks;
    if (data.notes !== undefined) update.notes = data.notes;
    if (data.breedingFarmName !== undefined || data.breederFarm !== undefined) update.breedingFarmName = data.breedingFarmName || data.breederFarm;
    if (data.birthDate !== undefined) update.birthDate = fromISO(data.birthDate);
    if (data.breederName !== undefined) update.breederName = data.breederName;
    if (data.temporaryLocation !== undefined) update.temporaryLocation = data.temporaryLocation;
    if (data.clientId !== undefined) update.clientId = data.clientId || null;

    if (data.color) {
      const colorMap = { "Alazan": "alazan", "Tordillo": "tordillo", "Negro": "negro", "Colorado": "colorado" };
      const code = colorMap[data.color] || data.color.toLowerCase().replace(/\s+/g, "_");
      const color = await findId(db, "horseColor", code) || (await db.horseColor.create({ data: { code, name: data.color } }));
      update.colorId = color.id;
    }
    if (data.sex) {
      const sex = await findId(db, "horseSex", data.sex === "hembra" ? "mare" : data.sex === "macho" ? "stallion" : data.sex);
      if (sex) update.sexId = sex.id;
    }
    if (data.status) {
      const s = await db.horseStatus.findFirst({ where: { name: data.status } });
      if (s) update.statusId = s.id;
    }
    if (data.ownershipType) {
      const ot = await findId(db, "horseOwnershipType", data.ownershipType);
      if (ot) update.ownershipTypeId = ot.id;
    }

    await db.horse.update({ where: { id }, data: update });

    const genealogyPayload = {};
    if (data.fatherHorseId !== undefined) genealogyPayload.fatherHorseId = data.fatherHorseId || null;
    if (data.motherHorseId !== undefined) genealogyPayload.motherHorseId = data.motherHorseId || null;
    if (data.fatherExternalName !== undefined) genealogyPayload.fatherExternalName = data.fatherExternalName || null;
    if (data.motherExternalName !== undefined) genealogyPayload.motherExternalName = data.motherExternalName || null;
    if (Object.keys(genealogyPayload).length) {
      const existing = await db.horseGenealogy.findUnique({ where: { horseId: id } });
      if (existing) await db.horseGenealogy.update({ where: { horseId: id }, data: genealogyPayload });
      else await db.horseGenealogy.create({ data: { horseId: id, ...genealogyPayload } });
    }
    const after = await this.getHorse(id);
    const wasInactive = before?.status === "Inactivo" || before?.status === "inactive" || before?.status?.name === "Inactivo" || before?.status?.code === "inactive";
    const becomesActive = data.status === "active";
    const action = wasInactive && becomesActive ? "reactivate" : "update";
    await db.auditLog.create({ data: auditPayload(user, action, "horse", id, "medium", "horse", before, after) });
    return after;
  }

  async changeHorseStatus(id, { status, reason }, user) {
    const db = this.db;
    const before = await this.getHorse(id);
    if (!before) return { error: { code: "not_found", message: "Caballo no encontrado." } };
    const currentStatusName = before.status?.name || before.status || "";
    if (currentStatusName === "Fallecido" || before.status?.code === "deceased") {
      return { error: { code: "validation_error", message: "Caballo fallecido no puede cambiar de estado." } };
    }
    const statusMap = {
      "active": "Activo", "temporary_out": "Fuera temporal", "in_treatment": "En tratamiento",
      "sold": "Vendido", "retired": "Retirado", "deceased": "Fallecido", "inactive": "Inactivo",
      "in_stay": "En pension", "out_of_stay": "Fuera de pension",
    };
    const name = statusMap[status] || status;
    const s = await db.horseStatus.findFirst({ where: { name } });
    if (!s) return { error: { code: "validation_error", message: "Estado invalido." } };
    await db.horse.update({ where: { id }, data: { statusId: s.id } });
    const after = await this.getHorse(id);
    await db.auditLog.create({ data: auditPayload(user, "change_status", "horse", id, "high", "horse", before, after) });
    return after;
  }

  async deleteHorse(id, { reason }, user) {
    const db = this.db;
    const horse = await db.horse.findUnique({
      where: { id },
      include: {
        ownershipType: true,
        childrenAsFather: { select: { horseId: true } },
        childrenAsMother: { select: { horseId: true } },
        boardingStays: { where: { agreementStatus: { code: "active" } }, select: { id: true } },
      },
    });
    if (!horse) return { error: { code: "not_found", message: "Caballo no encontrado." } };
    if (horse.childrenAsFather?.length || horse.childrenAsMother?.length) {
      return { error: { code: "parent_of_other", message: "No se puede eliminar: este caballo es padre/madre de otro. Sugerencia: cambie su estado a Inactivo." } };
    }
    if (horse.boardingStays?.length) {
      return { error: { code: "active_stays", message: "No se puede eliminar: el caballo tiene pensiones activas." } };
    }
    const horseType = horse.ownershipType.code === "own" ? "own" : "boarded";
    const inactiveStatus = await db.horseStatus.findFirst({ where: { horseType, name: "Inactivo" } });
    if (inactiveStatus) {
      await db.horse.update({ where: { id }, data: { statusId: inactiveStatus.id } });
    }
    await db.auditLog.create({ data: auditPayload(user, "delete", "horse", id, "critical", "horse", null, { reason }) });
    return { ok: true, message: "Caballo marcado como inactivo." };
  }

  async createBoardingStay(data, user) {
    const db = this.db;
    const horse = await db.horse.findUnique({ where: { id: data.horseId }, include: { ownershipType: true } });
    if (!horse || horse.ownershipType.code !== "boarded") {
      return { error: { code: "validation_error", message: "Solo caballos pensionados pueden tener estadias." } };
    }
    const activeStatus = await findId(db, "agreementStatus", "active");
    const activeStays = await db.boardingStay.findMany({
      where: { horseId: data.horseId, agreementStatus: { code: "active" } },
    });
    if (activeStays.length > 0) {
      return { error: { code: "active_stay_exists", message: "El caballo ya tiene una pension activa." } };
    }
    const bt = await findId(db, "boardingType", data.boardingType) || (await db.boardingType.create({ data: { code: data.boardingType, name: data.boardingType } }));
    const as = await findId(db, "agreementStatus", data.agreementStatus) || activeStatus;
    const count = await db.boardingStay.count();
    const code = `PEN-${String(count + 1).padStart(3, "0")}`;

    const stay = await db.boardingStay.create({
      data: {
        horseId: data.horseId, clientId: data.clientId || horse.clientId,
        startDate: new Date(data.startDate),
        estimatedEndDate: data.estimatedExitDate ? new Date(data.estimatedExitDate) : null,
        boardingTypeId: bt.id, agreementStatusId: as.id,
        boardingCost: data.monthlyCost || data.boardingCost || 0,
        careNotes: data.careNotes || "",
      },
      include: { boardingType: true, agreementStatus: true },
    });
    await db.auditLog.create({ data: auditPayload(user, "create", "boarding_stay", stay.id, "high", "boarding_stay", null, { ...stay, code }) });
    return { ...stay, code };
  }

  async listBoardingStays(params = {}) {
    const db = this.db;
    const where = {};
    if (params.horse_id) where.horseId = params.horse_id;
    if (params.client_id) where.clientId = params.client_id;
    if (params.agreement_status) where.agreementStatus = { code: params.agreement_status };
    const stays = await db.boardingStay.findMany({
      where,
      include: {
        boardingType: true, agreementStatus: true,
        horse: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        payments: true, supplies: true,
      },
      orderBy: { startDate: "desc" },
    });
    return stays.map((s) => ({
      ...s,
      boardingType: s.boardingType?.code || s.boardingType,
      agreementStatus: s.agreementStatus?.code || s.agreementStatus,
      horseName: s.horse?.name || "",
      clientName: s.client ? `${s.client.firstName} ${s.client.lastName}` : "",
      estimatedExitDate: s.estimatedEndDate,
      startDate: s.startDate?.toISOString?.() || s.startDate,
      estimatedEndDate: s.estimatedEndDate?.toISOString?.() || s.estimatedEndDate,
      monthlyCost: s.boardingCost,
      code: `PEN-${s.id?.slice(-4).toUpperCase() || ""}`,
    }));
  }

  async getBoardingStay(id) {
    const count = await this.db.boardingStay.count();
    return this.db.boardingStay.findUnique({
      where: { id },
      include: {
        boardingType: true, agreementStatus: true,
        horse: { select: { id: true, name: true, client: { select: { id: true, firstName: true, lastName: true } } } },
        client: { select: { id: true, firstName: true, lastName: true } },
        payments: { include: { paymentMethod: true, status: true }, orderBy: { paymentDate: "desc" } },
        supplies: { include: { supply: true } },
      },
    });
  }

  async updateBoardingStay(id, data, user) {
    const before = await this.getBoardingStay(id);
    const currentAgreement = before?.agreementStatus?.code || "";
    if (data.agreementStatus && (currentAgreement === "finished" || currentAgreement === "cancelled")) {
      const target = data.agreementStatus;
      if (target === "active" || target === "payment_pending") {
        return { error: { code: "validation_error", message: "No se puede reactivar una pension finalizada o cancelada." } };
      }
    }
    const update = {};
    if (data.startDate !== undefined) update.startDate = new Date(data.startDate);
    if (data.estimatedExitDate !== undefined) update.estimatedEndDate = data.estimatedExitDate ? new Date(data.estimatedExitDate) : null;
    if (data.boardingType) {
      const bt = await findId(this.db, "boardingType", data.boardingType);
      if (bt) update.boardingTypeId = bt.id;
    }
    if (data.agreementStatus) {
      const as = await findId(this.db, "agreementStatus", data.agreementStatus);
      if (as) update.agreementStatusId = as.id;
    }
    if (data.monthlyCost !== undefined || data.boardingCost !== undefined) update.boardingCost = data.monthlyCost || data.boardingCost;
    if (data.careNotes !== undefined) update.careNotes = data.careNotes;
    await this.db.boardingStay.update({ where: { id }, data: update });
    const after = await this.getBoardingStay(id);
    await this.db.auditLog.create({ data: auditPayload(user, "update", "boarding_stay", id, "medium", "boarding_stay", before, after) });
    return after;
  }

  async finishBoardingStay(id, { actualExitDate }, user) {
    const db = this.db;
    const finished = await findId(db, "agreementStatus", "finished");
    await db.boardingStay.update({
      where: { id }, data: { agreementStatusId: finished.id, actualEndDate: new Date(actualExitDate) },
    });
    const stay = await this.getBoardingStay(id);
    const outStatus = await db.horseStatus.findFirst({ where: { horseType: "boarded", name: "Fuera de pension" } });
    if (outStatus) await db.horse.update({ where: { id: stay.horse.id }, data: { statusId: outStatus.id } });
    await db.auditLog.create({ data: auditPayload(user, "finish", "boarding_stay", id, "high", "boarding_stay") });
    return stay;
  }

  async cancelBoardingStay(id, { reason }, user) {
    const cancelled = await findId(this.db, "agreementStatus", "cancelled");
    await this.db.boardingStay.update({ where: { id }, data: { agreementStatusId: cancelled.id } });
    await this.db.auditLog.create({ data: auditPayload(user, "cancel", "boarding_stay", id, "high", "boarding_stay", null, { reason }) });
    return this.getBoardingStay(id);
  }

  async createPayment(data, user) {
    const db = this.db;
    const stay = await db.boardingStay.findUnique({ where: { id: data.boardingStayId }, include: { agreementStatus: true } });
    if (!stay) return { error: { code: "not_found", message: "Pension no encontrada." } };

    let warning = null;
    const stayStatus = stay.agreementStatus?.code || "";
    if (stayStatus === "finished" || stayStatus === "cancelled") {
      warning = "La pension esta finalizada o cancelada. Confirme que desea continuar.";
    }

    const paidMonths = Array.isArray(data.paidMonths) ? data.paidMonths
      : String(data.paidMonths).split(",").map((s) => s.trim()).filter(Boolean);
    const existingPayments = await db.boardingPayment.findMany({
      where: { boardingStayId: data.boardingStayId, status: { code: "valid" } },
    });
    const allPaidMonths = new Set();
    existingPayments.forEach((p) => { if (Array.isArray(p.paidMonths)) p.paidMonths.forEach((m) => allPaidMonths.add(m)); });
    const duplicates = paidMonths.filter((m) => allPaidMonths.has(m));
    if (duplicates.length > 0) {
      return { error: { code: "duplicate_paid_month", message: `Mes(es) ya pagados: ${duplicates.join(", ")}` } };
    }

    const method = await db.paymentMethod.findFirst({ where: { code: data.paymentMethod || "transfer" } });
    const status = await findId(db, "paymentStatus", "valid");
    const payment = await db.boardingPayment.create({
      data: {
        boardingStayId: data.boardingStayId,
        horseId: stay.horseId, clientId: stay.clientId,
        paymentDate: new Date(data.paymentDate),
        paidMonths,
        paymentMethodId: method.id,
        amountPaid: data.amount || data.amountPaid || 0,
        notes: data.observations || data.notes || "",
        statusId: status.id,
        receiptReference: data.receiptReference || "",
      },
    });
    await db.auditLog.create({ data: auditPayload(user, "create", "boarding_payment", payment.id, "high", "boarding_payment", null, { ...payment, paidMonths }) });
    const result = { ...payment };
    if (warning) result.warning = warning;
    return result;
  }

  async listPayments(params = {}) {
    const where = {};
    if (params.boarding_stay_id) where.boardingStayId = params.boarding_stay_id;
    if (params.client_id) where.clientId = params.client_id;
    if (params.horse_id) where.horseId = params.horse_id;
    const payments = await this.db.boardingPayment.findMany({
      where,
      include: { paymentMethod: true, status: true, horse: { select: { id: true, name: true } } },
      orderBy: { paymentDate: "desc" },
    });
    return payments.map((p) => ({
      ...p,
      paymentMethod: p.paymentMethod?.code || p.paymentMethod,
      status: p.status?.code || p.status,
      horseName: p.horse?.name || "",
      amount: p.amountPaid,
    }));
  }

  async getPayment(id) {
    return this.db.boardingPayment.findUnique({
      where: { id },
      include: { paymentMethod: true, status: true, horse: { select: { id: true, name: true } } },
    });
  }

  async updatePayment(id, data, user) {
    const before = await this.getPayment(id);
    const update = {};
    if (data.paymentDate !== undefined) update.paymentDate = new Date(data.paymentDate);
    if (data.paidMonths !== undefined) {
      update.paidMonths = Array.isArray(data.paidMonths) ? data.paidMonths
        : String(data.paidMonths).split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (data.paymentMethod) {
      const m = await this.db.paymentMethod.findFirst({ where: { code: data.paymentMethod } });
      if (m) update.paymentMethodId = m.id;
    }
    if (data.amount !== undefined || data.amountPaid !== undefined) update.amountPaid = data.amount || data.amountPaid;
    if (data.observations !== undefined || data.notes !== undefined) update.notes = data.observations || data.notes;
    if (data.receiptReference !== undefined) update.receiptReference = data.receiptReference;
    await this.db.boardingPayment.update({ where: { id }, data: update });
    const after = await this.getPayment(id);
    await this.db.auditLog.create({ data: auditPayload(user, "update", "boarding_payment", id, "medium", "boarding_payment", before, after) });
    return after;
  }

  async cancelPayment(id, { reason }, user) {
    const cancelled = await findId(this.db, "paymentStatus", "cancelled");
    await this.db.boardingPayment.update({ where: { id }, data: { statusId: cancelled.id } });
    await this.db.auditLog.create({ data: auditPayload(user, "cancel", "boarding_payment", id, "high", "boarding_payment", null, { reason }) });
    return this.getPayment(id);
  }

  async createVaccination(data, user) {
    const db = this.db;
    const st = await findId(db, "vaccinationStatus", "valid");
    const v = await db.vaccination.create({
      data: {
        horseId: data.horseId, vaccineName: data.vaccineName,
        applicationDate: new Date(data.appliedAt || data.applicationDate),
        appliedBy: data.appliedBy, notes: data.observations || data.notes || "",
        statusId: st.id,
      },
    });
    await db.auditLog.create({ data: auditPayload(user, "create", "vaccination", v.id, "medium", "vaccination", null, v) });
    return v;
  }

  async listVaccinations(params = {}) {
    const where = {};
    if (params.horse_id) where.horseId = params.horse_id;
    const list = await this.db.vaccination.findMany({
      where,
      include: { status: true, horse: { select: { id: true, name: true } } },
      orderBy: { applicationDate: "desc" },
    });
    return list.map((v) => ({ ...v, status: v.status?.code || v.status, applicationDate: v.applicationDate?.toISOString?.() || v.applicationDate, appliedAt: v.applicationDate }));
  }

  async cancelVaccination(id, { reason }, user) {
    const cancelled = await findId(this.db, "vaccinationStatus", "cancelled");
    await this.db.vaccination.update({ where: { id }, data: { statusId: cancelled.id } });
    await this.db.auditLog.create({ data: auditPayload(user, "cancel", "vaccination", id, "medium", "vaccination", null, { reason }) });
    return this.db.vaccination.findUnique({ where: { id } });
  }

  async createFarrierRecord(data, user) {
    const db = this.db;
    const st = await findId(db, "farrierRecordStatus", "valid");
    let notes = data.observations || data.notes || "";
    if (data.performedBy) notes = (notes ? notes + "\n" : "") + `[Realizado por: ${data.performedBy}]`;
    const r = await db.farrierRecord.create({
      data: {
        horseId: data.horseId, serviceDate: new Date(data.serviceDate),
        description: data.serviceType || data.description,
        notes,
        statusId: st.id,
      },
    });
    await db.auditLog.create({ data: auditPayload(user, "create", "farrier_record", r.id, "medium", "farrier_record", null, r) });
    return r;
  }

  async listFarrierRecords(params = {}) {
    const where = {};
    if (params.horse_id) where.horseId = params.horse_id;
    const list = await this.db.farrierRecord.findMany({
      where,
      include: { status: true, horse: { select: { id: true, name: true } } },
      orderBy: { serviceDate: "desc" },
    });
    return list.map((f) => ({ ...f, status: f.status?.code || f.status, serviceType: f.description, serviceDate: f.serviceDate?.toISOString?.() || f.serviceDate }));
  }

  async cancelFarrierRecord(id, { reason }, user) {
    const cancelled = await findId(this.db, "farrierRecordStatus", "cancelled");
    await this.db.farrierRecord.update({ where: { id }, data: { statusId: cancelled.id } });
    await this.db.auditLog.create({ data: auditPayload(user, "cancel", "farrier_record", id, "medium", "farrier_record", null, { reason }) });
    return this.db.farrierRecord.findUnique({ where: { id } });
  }

  async createHealthTreatment(data, user) {
    const db = this.db;
    const t = await db.healthTreatment.create({
      data: {
        horseId: data.horseId, treatmentType: data.treatmentType,
        date: new Date(data.date || data.applicationDate),
        description: data.description,
        performedBy: data.performedBy || data.appliedBy || "", notes: data.notes || "",
        statusId: "active", status: "active",
      },
    });
    await db.auditLog.create({ data: auditPayload(user, "create", "health_treatment", t.id, "medium", "health_treatment", null, t) });
    return t;
  }

  async listHealthTreatments(params = {}) {
    const where = {};
    if (params.horse_id) where.horseId = params.horse_id;
    return this.db.healthTreatment.findMany({
      where,
      include: { horse: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });
  }

  async getHealthTreatment(id) {
    return this.db.healthTreatment.findUnique({ where: { id }, include: { horse: { select: { id: true, name: true } } } });
  }

  async updateHealthTreatment(id, data, user) {
    const before = await this.getHealthTreatment(id);
    if (!before) return { error: { code: "not_found", message: "Tratamiento no encontrado" } };
    const update = {};
    if (data.treatmentType !== undefined) update.treatmentType = data.treatmentType;
    if (data.date !== undefined) update.date = new Date(data.date);
    if (data.description !== undefined) update.description = data.description;
    if (data.performedBy !== undefined || data.appliedBy !== undefined) update.performedBy = data.performedBy || data.appliedBy;
    if (data.notes !== undefined) update.notes = data.notes;
    if (Object.keys(update).length > 0) {
      await this.db.healthTreatment.update({ where: { id }, data: update });
      const after = await this.getHealthTreatment(id);
      await this.db.auditLog.create({ data: auditPayload(user, "update", "health_treatment", id, "medium", "health_treatment", before, after) });
    }
    return this.getHealthTreatment(id);
  }

  async cancelHealthTreatment(id, { reason }, user) {
    await this.db.healthTreatment.update({ where: { id }, data: { statusId: "cancelled", status: "cancelled" } });
    await this.db.auditLog.create({ data: auditPayload(user, "cancel", "health_treatment", id, "medium", "health_treatment", null, { reason }) });
    return this.getHealthTreatment(id);
  }

  async createDocumentBatch(data, user) {
    const db = this.db;
    const files = data.filesText ? data.filesText.split("\n").filter(Boolean).map((entry) => {
      const parts = entry.split("::");
      const storagePath = parts[0]?.trim() || "";
      const originalName = parts[1]?.trim() || storagePath;
      const mimeType = parts[2]?.trim() || (originalName.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      return { fileName: storagePath || originalName, displayName: originalName, mimeType, fileSize: 100, storagePath };
    }) : (data.files || []);
    const batch = await db.documentBatch.create({
      data: {
        entityType: data.entityType, entityId: data.entityId,
        name: data.title || data.name, description: data.description || "",
        uploadedBy: user.userId,
        documents: { create: files },
      },
      include: { documents: true },
    });
    await db.auditLog.create({ data: auditPayload(user, "create", "document", batch.id, "medium", "document") });
    return { ...batch, title: batch.name, status: batch.status, files: batch.documents };
  }

  async getVaccination(id) {
    return this.db.vaccination.findUnique({ where: { id }, include: { status: true, horse: { select: { id: true, name: true } } } });
  }

  async updateVaccination(id, data, user) {
    const before = await this.getVaccination(id);
    const update = {};
    if (data.vaccineName !== undefined) update.vaccineName = data.vaccineName;
    if (data.appliedAt !== undefined || data.applicationDate !== undefined) update.applicationDate = new Date(data.appliedAt || data.applicationDate);
    if (data.appliedBy !== undefined) update.appliedBy = data.appliedBy;
    if (data.observations !== undefined || data.notes !== undefined) update.notes = data.observations || data.notes;
    if (Object.keys(update).length > 0) {
      await this.db.vaccination.update({ where: { id }, data: update });
      const after = await this.getVaccination(id);
      await this.db.auditLog.create({ data: auditPayload(user, "update", "vaccination", id, "medium", "vaccination", before, after) });
    }
    return this.getVaccination(id);
  }

  async getFarrierRecord(id) {
    return this.db.farrierRecord.findUnique({ where: { id }, include: { status: true, horse: { select: { id: true, name: true } } } });
  }

  async updateFarrierRecord(id, data, user) {
    const before = await this.getFarrierRecord(id);
    const update = {};
    if (data.serviceDate !== undefined) update.serviceDate = new Date(data.serviceDate);
    if (data.serviceType !== undefined || data.description !== undefined) update.description = data.serviceType || data.description;
    if (data.performedBy !== undefined) update.notes = (update.notes || "") + ` [Realizado por: ${data.performedBy}]`;
    if (data.observations !== undefined || data.notes !== undefined) update.notes = data.observations || data.notes;
    if (Object.keys(update).length > 0) {
      await this.db.farrierRecord.update({ where: { id }, data: update });
      const after = await this.getFarrierRecord(id);
      await this.db.auditLog.create({ data: auditPayload(user, "update", "farrier_record", id, "medium", "farrier_record", before, after) });
    }
    return this.getFarrierRecord(id);
  }

  async listDocumentBatches(params = {}) {
    const where = {};
    if (params.entity_type) where.entityType = params.entity_type;
    if (params.entity_id) where.entityId = params.entity_id;
    const batches = await this.db.documentBatch.findMany({
      where,
      include: { documents: true },
      orderBy: { createdAt: "desc" },
    });
    return batches.map((b) => ({ ...b, title: b.name, files: b.documents }));
  }

  async getDocumentBatch(id) {
    return this.db.documentBatch.findUnique({ where: { id }, include: { documents: true } });
  }

  async updateDocumentBatch(id, data, user) {
    const batch = await this.getDocumentBatch(id);
    if (!batch) return { error: { code: "not_found", message: "Lote no encontrado" } };
    const update = {};
    if (data.title !== undefined || data.name !== undefined) update.name = data.title || data.name;
    if (data.description !== undefined) update.description = data.description;
    if (Object.keys(update).length > 0) {
      await this.db.documentBatch.update({ where: { id }, data: update });
      await this.db.auditLog.create({ data: auditPayload(user, "update", "document", id, "medium", "document") });
    }
    const updated = await this.getDocumentBatch(id);
    return { ...updated, title: updated.name, files: updated.documents };
  }

  async cancelDocumentBatch(id, { reason }, user) {
    await this.db.documentBatch.update({ where: { id }, data: { status: "cancelled" } });
    await this.db.auditLog.create({ data: auditPayload(user, "cancel", "document_batch", id, "medium", "document", null, { reason }) });
    return this.getDocumentBatch(id);
  }

  async updateGenealogy(horseId, data, user) {
    const db = this.db;
    const genealogy = await db.horseGenealogy.findUnique({ where: { horseId } });
    const payload = {
      fatherHorseId: data.fatherHorseId || null,
      motherHorseId: data.motherHorseId || null,
      fatherExternalName: data.fatherExternalName || null,
      motherExternalName: data.motherExternalName || null,
    };
    if (genealogy) {
      await db.horseGenealogy.update({ where: { horseId }, data: payload });
    } else {
      await db.horseGenealogy.create({ data: { horseId, ...payload } });
    }
    await db.auditLog.create({ data: auditPayload(user, "update", "genealogy", horseId, "medium", "genealogy") });
    return db.horseGenealogy.findUnique({ where: { horseId } });
  }

  async getGenealogyTree(horseId) {
    const db = this.db;
    const horse = await db.horse.findUnique({
      where: { id: horseId },
      include: {
        genealogy: {
          include: {
            fatherHorse: { select: { id: true, name: true } },
            motherHorse: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!horse) return null;
    const g = horse.genealogy;
    const parents = [];
    if (g?.fatherHorse) parents.push({ id: g.fatherHorse.id, name: g.fatherHorse.name, type: "padre", external: false });
    else if (g?.fatherExternalName) parents.push({ name: g.fatherExternalName, type: "padre", external: true });
    if (g?.motherHorse) parents.push({ id: g.motherHorse.id, name: g.motherHorse.name, type: "madre", external: false });
    else if (g?.motherExternalName) parents.push({ name: g.motherExternalName, type: "madre", external: true });
    const childrenGenealogies = await db.horseGenealogy.findMany({
      where: { OR: [{ fatherHorseId: horseId }, { motherHorseId: horseId }] },
      include: { horse: { select: { id: true, name: true } } },
    });
    const children = childrenGenealogies.map((cg) => ({ id: cg.horse.id, name: cg.horse.name }));
    return { horse: { id: horse.id, name: horse.name }, parents, children };
  }

  async dashboard() {
    const db = this.db;
    const [
      ownHorses, boardedHorses, activeStays, pendingStays,
      latestPayments, latestVaccinations, latestFarrier, latestDocs, latestAudit,
    ] = await Promise.all([
      db.horse.count({ where: { ownershipType: { code: "own" } } }),
      db.horse.count({ where: { ownershipType: { code: "boarded" } } }),
      db.boardingStay.count({ where: { agreementStatus: { code: "active" } } }),
      db.boardingStay.count({ where: { agreementStatus: { code: { in: ["payment_pending", "debt"] } } } }),
      db.boardingPayment.findMany({ take: 5, orderBy: { paymentDate: "desc" }, include: { horse: { select: { name: true } } } }),
      db.vaccination.findMany({ take: 5, orderBy: { applicationDate: "desc" }, include: { horse: { select: { name: true } } } }),
      db.farrierRecord.findMany({ take: 5, orderBy: { serviceDate: "desc" }, include: { horse: { select: { name: true } } } }),
      db.documentBatch.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      db.auditLog.findMany({ take: 10, orderBy: { createdAt: "desc" }, include: { importance: true, eventType: true } }),
    ]);
    const clientsCount = await db.client.count({ where: { status: { code: "active" } } });
    const paymentsTotal = await db.boardingPayment.aggregate({ _sum: { amountPaid: true }, where: { status: { code: "valid" } } });
    const latestStays = await db.boardingStay.findMany({
      where: { agreementStatus: { code: "active" } },
      take: 5,
      orderBy: { startDate: "desc" },
      include: { boardingType: true, agreementStatus: true, horse: { select: { id: true, name: true } }, client: { select: { firstName: true, lastName: true } } },
    });
    const flattenedStays = latestStays.map((s) => ({
      ...s,
      boardingType: s.boardingType?.code || s.boardingType,
      agreementStatus: s.agreementStatus?.code || s.agreementStatus,
      monthlyCost: s.boardingCost,
      horseName: s.horse?.name || "",
      clientName: s.client ? `${s.client.firstName} ${s.client.lastName}` : "",
      code: `PEN-${s.id?.slice(-4).toUpperCase() || ""}`,
    }));
    return {
      kpis: { ownHorses, boardedHorses, clients: clientsCount, activeStays, pendingStays, dueStays: pendingStays, paymentsTotal: paymentsTotal._sum.amountPaid || 0 },
      latestPayments, latestVaccinations, latestFarrier, latestDocs, latestAudit, latestStays: flattenedStays,
    };
  }

  async search(query, type) {
    const db = this.db;
    if (!query || !query.trim()) return [];
    const q = { contains: query, mode: "insensitive" };
    const results = [];
    const statusNameToCode = { "Activo": "active", "Inactivo": "inactive", "En tratamiento": "in_treatment", "Vendido": "sold", "Retirado": "retired", "Fallecido": "deceased", "Fuera temporal": "temporary_out", "En pension": "in_stay", "Fuera de pension": "out_of_stay" };
    const typeLabel = { "own": "Propio", "boarded": "Pensionado", "horse": "Caballo", "client": "Cliente", "boarding_stay": "Pension", "boarding_payment": "Pago", "vaccination": "Vacuna", "farrier_record": "Herraje", "health_treatment": "Tratamiento" };
    if (!type || type === "horses" || type === "all") {
      const horses = await db.horse.findMany({
        where: { OR: [
          { name: q }, { distinctiveMarks: q }, { notes: q },
          { breedingFarmName: q }, { temporaryLocation: q }, { breederName: q },
          { color: { name: q } },
        ] },
        include: { ownershipType: true, status: true },
        take: 20,
      });
      horses.forEach((h) => results.push({ type: "horses", id: h.id, label: h.name, subtitle: typeLabel[h.ownershipType?.code] || h.ownershipType?.code || "", status: statusNameToCode[h.status?.name] || h.status?.name || "" }));
    }
    if (!type || type === "clients" || type === "all") {
      const clients = await db.client.findMany({
        where: { OR: [{ firstName: q }, { lastName: q }, { notes: q },
          { contacts: { some: { value: q } } },
        ] },
        include: { contacts: { where: { contactType: "phone" }, take: 1 } },
        take: 20,
      });
      clients.forEach((c) => results.push({ type: "clients", id: c.id, label: `${c.firstName} ${c.lastName}`, subtitle: c.contacts?.[0]?.value || "", status: c.status?.code }));
    }
    if (!type || type === "boarding_stays" || type === "all") {
      const stays = await db.boardingStay.findMany({
        where: { OR: [
          { horse: { name: q } },
          { client: { firstName: q } },
          { client: { lastName: q } },
        ] },
        include: { horse: { select: { name: true } }, client: { select: { firstName: true, lastName: true } }, agreementStatus: true },
        take: 20,
      });
      stays.forEach((s) => results.push({ type: "boarding_stays", id: s.id, label: s.horse.name, subtitle: `${s.client?.firstName || ""} ${s.client?.lastName || ""}`, status: s.agreementStatus?.code || "" }));
    }
    if (!type || type === "documents" || type === "all") {
      const docs = await db.documentBatch.findMany({
        where: { OR: [{ name: q }, { description: q }] },
        take: 20,
      });
      docs.forEach((d) => results.push({ type: "documents", id: d.id, label: d.title || d.name, subtitle: typeLabel[d.entityType] || d.entityType, status: d.status }));
    }
    return results;
  }

  async listAuditLogs(params = {}) {
    const where = {};
    if (params.entity_type) where.entityType = params.entity_type;
    if (params.entity_id) where.entityId = params.entity_id;
    if (params.actor_user_id) where.actorUserId = params.actor_user_id;
    if (params.importance) where.importance = { code: params.importance };
    if (params.event_type) where.eventType = { code: params.event_type };
    return this.db.auditLog.findMany({
      where,
      include: { importance: true, eventType: true },
      orderBy: { createdAt: "desc" },
      take: params.limit ? Number(params.limit) : 100,
    }).then((logs) => logs.map((l) => ({
      ...l,
      importance: l.importance?.code || l.importance,
      eventType: l.eventType?.code || l.eventType,
    })));
  }

  async createHorseStatus(data, user) {
    const s = await this.db.horseStatus.create({ data });
    await this.db.auditLog.create({ data: auditPayload(user, "create", "horse_status", s.id, "medium", "system") });
    return s;
  }

  async listHorseStatuses(params = {}) {
    const where = {};
    if (params.horse_type) where.horseType = params.horse_type;
    return this.db.horseStatus.findMany({ where, orderBy: { sortOrder: "asc" } });
  }

  async addHorseGallery(horseId, data, user) {
    const item = await this.db.horseGallery.create({
      data: {
        horseId,
        fileName: data.fileName,
        title: data.title || "",
        description: data.description || "",
        type: data.type || "photo",
        storagePath: data.storagePath || "",
        uploadedBy: user.userId,
      },
    });
    await this.db.auditLog.create({ data: auditPayload(user, "create", "horse_gallery", item.id, "low", "horse") });
    return item;
  }

  async removeHorseGallery(horseId, itemId, user) {
    const item = await this.db.horseGallery.findUnique({ where: { id: itemId } });
    if (!item || item.horseId !== horseId) return { error: { code: "not_found", message: "Imagen no encontrada." } };
    await this.db.horseGallery.delete({ where: { id: itemId } });
    await this.db.auditLog.create({ data: auditPayload(user, "delete", "horse_gallery", itemId, "medium", "horse") });
    return { id: itemId, status: "deleted" };
  }

  async addBoardingSupply(stayId, data, user) {
    const supply = await this.db.boardingStaySupply.create({
      data: {
        boardingStayId: stayId,
        supplyId: data.supplyId,
        quantityPerMonth: data.quantityPerMonth || 0,
        unit: data.unit || "",
        notes: data.notes || "",
      },
    });
    await this.db.auditLog.create({ data: auditPayload(user, "create", "boarding_stay_supply", supply.id, "low", "boarding_stay") });
    return supply;
  }

  async updateBoardingSupply(id, data, user) {
    const existing = await this.db.boardingStaySupply.findUnique({ where: { id } });
    if (!existing) return { error: { code: "not_found", message: "Insumo no encontrado." } };
    const update = {};
    if (data.supplyId !== undefined) update.supplyId = data.supplyId;
    if (data.quantityPerMonth !== undefined) update.quantityPerMonth = Number(data.quantityPerMonth);
    if (data.unit !== undefined) update.unit = data.unit;
    if (data.notes !== undefined) update.notes = data.notes;
    await this.db.boardingStaySupply.update({ where: { id }, data: update });
    await this.db.auditLog.create({ data: auditPayload(user, "update", "boarding_stay_supply", id, "low", "boarding_stay") });
    return this.db.boardingStaySupply.findUnique({ where: { id } });
  }

  async removeBoardingSupply(id, user) {
    const existing = await this.db.boardingStaySupply.findUnique({ where: { id } });
    if (!existing) return { error: { code: "not_found", message: "Insumo no encontrado." } };
    await this.db.boardingStaySupply.delete({ where: { id } });
    await this.db.auditLog.create({ data: auditPayload(user, "delete", "boarding_stay_supply", id, "low", "boarding_stay") });
    return { id, status: "deleted" };
  }

  async addFeedEntry(data, user) {
    const entry = await this.db.feedInventory.create({
      data: {
        supplyId: data.supplyId,
        quantity: data.quantity,
        unit: data.unit,
        entryDate: data.entryDate ? new Date(data.entryDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        notes: data.notes || "",
      },
    });
    return entry;
  }

  async listFeedInventory() {
    return this.db.feedInventory.findMany({
      include: { supply: true },
      orderBy: { entryDate: "desc" },
    });
  }

  async listNotifications(params = {}) {
    const where = {};
    if (params.user_id) where.userId = params.user_id;
    return this.db.notificationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getSystemConfig() {
    const configs = await this.db.systemConfig.findMany();
    return configs.reduce((acc, c) => { acc[c.key] = c.value; return acc; }, {});
  }

  async updateSystemConfig(key, value, user) {
    const existing = await this.db.systemConfig.findUnique({ where: { key } });
    if (existing) {
      await this.db.systemConfig.update({ where: { key }, data: { value } });
    } else {
      await this.db.systemConfig.create({ data: { key, value } });
    }
    await this.db.auditLog.create({ data: auditPayload(user, "update", "system", key, "high", "system") });
    return { key, value };
  }
}

function formatClient(c) {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    fullName: `${c.firstName} ${c.lastName}`,
    phone: c.contacts?.find((ct) => ct.isPrimary)?.value || c.contacts?.[0]?.value || "",
    address: c.addresses?.find((a) => a.isPrimary)?.street || "",
    internalNotes: c.notes || "",
    status: c.status?.code || "active",
    horseCount: c.horses?.length || 0,
    contacts: c.contacts || [],
    addresses: c.addresses || [],
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
