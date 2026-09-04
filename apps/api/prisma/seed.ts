// DATABASE_URL lo inyecta el CLI de Prisma desde prisma.config.ts (dotenv/config)
// al lanzar este proceso hijo; no importamos dotenv aquí.
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Setting global (branchId = null). El @@unique([branchId, key]) no garantiza
// unicidad con NULL en Postgres, así que upserteamos manualmente para idempotencia.
async function upsertGlobalSetting(key: string, value: string) {
  const existing = await prisma.setting.findFirst({
    where: { branchId: null, key },
  });
  if (existing) {
    await prisma.setting.update({ where: { id: existing.id }, data: { value } });
  } else {
    await prisma.setting.create({ data: { key, value } });
  }
}

async function main() {
  const branch = await prisma.branch.upsert({
    where: { id: 'seed-branch-main' },
    update: {},
    create: { id: 'seed-branch-main', name: 'Sucursal Principal' },
  });

  await prisma.user.upsert({
    where: { email: 'owner@barber.studio' },
    update: {},
    create: {
      name: 'Dueña',
      email: 'owner@barber.studio',
      passwordHash: await bcrypt.hash('password123', 10),
      role: Role.OWNER,
      branchId: branch.id,
    },
  });

  for (const [i, [code, name]] of [
    ['CASH', 'Efectivo'],
    ['YAPE', 'Yape'],
    ['PLIN', 'Plin'],
  ].entries()) {
    await prisma.paymentMethod.upsert({
      where: { code },
      update: {},
      create: { code, name, sortOrder: i },
    });
  }

  await upsertGlobalSetting('commission_base_percentage', '40');
  await upsertGlobalSetting('tax_rate', '18');
  // Base de la comisión: importe del ítem antes de descuento e impuesto.
  await upsertGlobalSetting('commission_base', 'pre_tax');

  console.log('Seed completado: sucursal, dueña, métodos de pago, settings.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
