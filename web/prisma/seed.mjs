import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/criadero_camila_andrea",
  max: 5,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("admin123", 12);
  const roles = await Promise.all([
    prisma.userRole.create({ data: { code: "owner", name: "Propietaria" } }),
    prisma.userRole.create({ data: { code: "admin", name: "Administrador" } }),
  ]);
  const ownerRole = roles[0];

  await prisma.user.create({
    data: {
      firstName: "Camila", lastName: "Andrea",
      email: "owner@criadero.local",
      passwordHash: hash,
      roleId: ownerRole.id,
    },
  });

  await prisma.user.create({
    data: {
      firstName: "Admin", lastName: "Interno",
      email: "admin@criadero.local",
      passwordHash: hash,
      roleId: roles[1].id,
    },
  });

  const clientStatus = await prisma.clientStatus.create({ data: { code: "active", name: "Activo" } });

  const ownType = await prisma.horseOwnershipType.create({ data: { code: "own", name: "Propio" } });
  const boardedType = await prisma.horseOwnershipType.create({ data: { code: "boarded", name: "Pensionado" } });

  const mare = await prisma.horseSex.create({ data: { code: "mare", name: "Hembra" } });
  const stallion = await prisma.horseSex.create({ data: { code: "stallion", name: "Macho" } });

  const colors = await Promise.all([
    prisma.horseColor.create({ data: { code: "alazan", name: "Alazan" } }),
    prisma.horseColor.create({ data: { code: "tordillo", name: "Tordillo" } }),
    prisma.horseColor.create({ data: { code: "negro", name: "Negro" } }),
    prisma.horseColor.create({ data: { code: "colorado", name: "Colorado" } }),
  ]);

  const statuses = await Promise.all([
    prisma.horseStatus.create({ data: { horseType: "own", name: "Activo", sortOrder: 1 } }),
    prisma.horseStatus.create({ data: { horseType: "own", name: "Fuera temporal", sortOrder: 2 } }),
    prisma.horseStatus.create({ data: { horseType: "own", name: "En tratamiento", sortOrder: 3 } }),
    prisma.horseStatus.create({ data: { horseType: "own", name: "Vendido", sortOrder: 4 } }),
    prisma.horseStatus.create({ data: { horseType: "own", name: "Retirado", sortOrder: 5 } }),
    prisma.horseStatus.create({ data: { horseType: "own", name: "Fallecido", sortOrder: 6 } }),
    prisma.horseStatus.create({ data: { horseType: "own", name: "Inactivo", sortOrder: 7 } }),
    prisma.horseStatus.create({ data: { horseType: "boarded", name: "Activo", sortOrder: 1 } }),
    prisma.horseStatus.create({ data: { horseType: "boarded", name: "En pension", sortOrder: 2 } }),
    prisma.horseStatus.create({ data: { horseType: "boarded", name: "Fuera de pension", sortOrder: 3 } }),
    prisma.horseStatus.create({ data: { horseType: "boarded", name: "En tratamiento", sortOrder: 4 } }),
    prisma.horseStatus.create({ data: { horseType: "boarded", name: "Inactivo", sortOrder: 5 } }),
  ]);

  const boardingTypes = await Promise.all([
    prisma.boardingType.create({ data: { code: "client_supplies", name: "Insumos por cliente" } }),
    prisma.boardingType.create({ data: { code: "included_supplies", name: "Insumos incluidos" } }),
    prisma.boardingType.create({ data: { code: "mixed", name: "Mixta" } }),
    prisma.boardingType.create({ data: { code: "other", name: "Otro" } }),
  ]);

  const agreementStatuses = await Promise.all([
    prisma.agreementStatus.create({ data: { code: "active", name: "Activo", sortOrder: 1 } }),
    prisma.agreementStatus.create({ data: { code: "payment_pending", name: "Pago pendiente", sortOrder: 2 } }),
    prisma.agreementStatus.create({ data: { code: "debt", name: "Con deuda", sortOrder: 3 } }),
    prisma.agreementStatus.create({ data: { code: "finished", name: "Finalizado", sortOrder: 4 } }),
    prisma.agreementStatus.create({ data: { code: "cancelled", name: "Cancelado", sortOrder: 5 } }),
  ]);

  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({ data: { code: "cash", name: "Efectivo" } }),
    prisma.paymentMethod.create({ data: { code: "transfer", name: "Transferencia" } }),
  ]);

  await prisma.paymentStatus.create({ data: { code: "valid", name: "Valido" } });
  await prisma.paymentStatus.create({ data: { code: "cancelled", name: "Anulado" } });

  await prisma.vaccinationStatus.create({ data: { code: "valid", name: "Valida" } });
  await prisma.vaccinationStatus.create({ data: { code: "cancelled", name: "Anulada" } });

  await prisma.farrierRecordStatus.create({ data: { code: "valid", name: "Valido" } });
  await prisma.farrierRecordStatus.create({ data: { code: "cancelled", name: "Anulado" } });

  const impHigh = await prisma.importanceLevel.create({ data: { code: "high", name: "Alta" } });
  await prisma.importanceLevel.create({ data: { code: "medium", name: "Media" } });
  await prisma.importanceLevel.create({ data: { code: "low", name: "Baja" } });
  await prisma.importanceLevel.create({ data: { code: "critical", name: "Critica" } });

  const eventTypes = [
    "horse", "client", "boarding_stay", "boarding_payment",
    "vaccination", "farrier_record", "document", "genealogy",
    "security", "system",
  ];
  for (const code of eventTypes) {
    await prisma.eventType.create({ data: { code, name: code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) } });
  }

  const supplies = await Promise.all([
    prisma.supply.create({ data: { name: "Fardos", unit: "unidad" } }),
    prisma.supply.create({ data: { name: "Avena", unit: "kg" } }),
    prisma.supply.create({ data: { name: "Sal mineral", unit: "kg" } }),
    prisma.supply.create({ data: { name: "Bentonita", unit: "kg" } }),
  ]);

  await prisma.fileFormat.create({ data: { extension: "pdf", mimeType: "application/pdf" } });
  await prisma.fileFormat.create({ data: { extension: "jpg", mimeType: "image/jpeg" } });
  await prisma.fileFormat.create({ data: { extension: "png", mimeType: "image/png" } });

  const region = await prisma.region.create({ data: { name: "Bio-Bio" } });
  const city = await prisma.city.create({ data: { name: "Los Angeles", regionId: region.id } });

  console.log("Seed completado. Catalogos cargados.");
}

main().catch((e) => {
  if (e.code === "P2002") { console.log("Seed ya ejecutado (duplicados ignorados)."); }
  else { console.error(e); process.exit(1); }
}).finally(() => prisma.$disconnect());
