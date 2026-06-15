import { Prisma } from '@prisma/client';

// Modelos con columna `deletedAt`. Sus lecturas excluyen filas borradas.
const SOFT_DELETE_MODELS = new Set<string>([
  'Branch',
  'User',
  'Customer',
  'ServiceCategory',
  'Service',
  'Product',
]);

const excludeDeleted = (args: { where?: Record<string, unknown> }) => {
  args.where = { deletedAt: null, ...args.where };
};

// Filtra `deletedAt: null` en lecturas de los modelos soft-delete.
// Las "bajas" se hacen en la capa de servicio con update({ deletedAt: new Date() });
// findUnique no se intercepta (su where solo admite campos únicos) — usar findFirst
// cuando se requiera respetar el soft-delete por id.
export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) excludeDeleted(args);
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) excludeDeleted(args);
        return query(args);
      },
      async count({ model, args, query }) {
        if (SOFT_DELETE_MODELS.has(model)) excludeDeleted(args);
        return query(args);
      },
    },
  },
});
