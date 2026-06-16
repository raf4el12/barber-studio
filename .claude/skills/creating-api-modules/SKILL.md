---
name: creating-api-modules
description: Use when adding or restructuring a backend feature/module in apps/api (NestJS) — a new resource, endpoint group, or domain concern like tickets, queue, commissions, inventory. Covers the domain/application/infrastructure/interfaces layering, repository ports with DI tokens, and one-use-case-per-operation.
---

# Creating API Modules (Clean Architecture + DDD)

## Overview

Every module in `apps/api/src/modules/<name>` is a vertical slice split into four layers. The **dependency rule** is the whole point: dependencies point **inward only**. `domain` knows nothing about NestJS, Prisma, or HTTP. `application` orchestrates the domain. `infrastructure` and `interfaces` are replaceable adapters on the outside.

```
domain  ←  application  ←  infrastructure
                       ←  interfaces
```

A use-case depends on a repository **interface** it owns (the port), never on the Prisma class. The module wires the concrete adapter to the port with a string injection token. This is what makes business logic testable without a database and swappable without touching rules.

Reference implementation: `.scratch/MediClick/server/src/modules` (e.g. `categories` = simple CRUD, `appointments` = rich domain). This skill ports that structure onto barber-studio's Prisma 7 conventions.

## When to Use

- Adding a new resource (tickets, queue entries, commission rules, inventory, cash register).
- A feature has real business rules (validation, state transitions, money, atomic checks) — not a 3-line pass-through.
- You catch yourself putting Prisma calls and `if (!x) throw` logic directly in a controller or a flat service.

**When NOT to use:** trivial config endpoints with zero rules can stay a flat service. Don't over-layer a health check. The existing flat `branches`/`users` services are fine as-is; apply this to new Phase 1+ modules.

## Directory Layout

```
modules/<name>/
  domain/
    entities/<name>.entity.ts              # plain class, no decorators, mirrors persisted shape
    repositories/<name>.repository.ts       # interface I<Name>Repository  — the PORT
    interfaces/<name>-data.interface.ts     # Create<Name>Data / Update<Name>Data shapes
    constants/                              # policies, magic numbers (optional)
  application/
    use-cases/<verb>-<name>.use-case.ts     # one class per operation, single execute()
    use-cases/<verb>-<name>.use-case.spec.ts# unit test, mocks the repo INTERFACE
    dto/                                    # class-validator + @ApiProperty input/response DTOs
    services/                               # cross-use-case domain services (optional)
    <name>.module.ts                        # wires providers, binds token → adapter
  infrastructure/
    persistence/prisma-<name>.repository.ts # implements I<Name>Repository, injects EXTENDED_PRISMA
  interfaces/
    controllers/<name>.controller.ts        # thin: HTTP + auth decorators → calls use-cases
```

## The Core Pattern: Repository Port + DI Token

The use-case never imports the Prisma class. It depends on an interface and an injection token.

**1. Port (domain) — `domain/repositories/service.repository.ts`:**
```ts
import type { ServiceEntity } from '../entities/service.entity';
import type { CreateServiceData, UpdateServiceData } from '../interfaces/service-data.interface';

export const SERVICE_REPOSITORY = 'IServiceRepository';

export interface IServiceRepository {
  create(data: CreateServiceData): Promise<ServiceEntity>;
  findById(id: string): Promise<ServiceEntity | null>;
  findAll(branchId: string): Promise<ServiceEntity[]>;
  existsByName(name: string, branchId: string): Promise<boolean>;
  update(id: string, data: UpdateServiceData): Promise<ServiceEntity>;
  softDelete(id: string): Promise<void>;
}
```

**2. Use-case (application) — depends on the port only:**
```ts
import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { SERVICE_REPOSITORY, type IServiceRepository } from '../../domain/repositories/service.repository';
import { CreateServiceDto } from '../dto/create-service.dto';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly services: IServiceRepository,
  ) {}

  async execute(dto: CreateServiceDto, branchId: string) {
    if (await this.services.existsByName(dto.name, branchId)) {
      throw new ConflictException('Ya existe un servicio con ese nombre');
    }
    return this.services.create({ ...dto, branchId });
  }
}
```

**3. Adapter (infrastructure) — implements the port with barber-studio's Prisma 7 setup:**
```ts
import { Inject, Injectable } from '@nestjs/common';
import { EXTENDED_PRISMA, type ExtendedPrismaService } from '../../../prisma/prisma.service';
import type { IServiceRepository } from '../../domain/repositories/service.repository';
import type { CreateServiceData, UpdateServiceData } from '../../domain/interfaces/service-data.interface';

@Injectable()
export class PrismaServiceRepository implements IServiceRepository {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  create(data: CreateServiceData) {
    return this.prisma.service.create({ data });
  }
  findById(id: string) {
    return this.prisma.service.findFirst({ where: { id } }); // extension adds deletedAt: null
  }
  findAll(branchId: string) {
    return this.prisma.service.findMany({ where: { branchId }, orderBy: { name: 'asc' } });
  }
  async existsByName(name: string, branchId: string) {
    return (await this.prisma.service.count({ where: { name, branchId } })) > 0;
  }
  update(id: string, data: UpdateServiceData) {
    return this.prisma.service.update({ where: { id }, data });
  }
  async softDelete(id: string) {
    await this.prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
```

**4. Module — binds the token to the adapter and exports the token:**
```ts
@Module({
  controllers: [ServiceController],
  providers: [
    { provide: SERVICE_REPOSITORY, useClass: PrismaServiceRepository },
    CreateServiceUseCase,
    // ...one provider per use-case
  ],
  exports: [SERVICE_REPOSITORY], // export the token so other modules depend on the port, not Prisma
})
export class ServicesModule {}
```

**5. Controller (interfaces) — thin, only HTTP + auth, delegates to use-cases:**
```ts
@Controller('services')
export class ServiceController {
  constructor(private readonly createService: CreateServiceUseCase /*, ...*/) {}

  @Post()
  @Roles(Role.OWNER)
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: AuthUser) {
    return this.createService.execute(dto, user.branchId);
  }
}
```

## barber-studio Conventions (how this repo differs from MediClick)

| Concern | MediClick (reference) | barber-studio (use this) |
|---|---|---|
| Primary keys | `number` (int) | `string` (cuid) |
| Soft delete | `deleted: boolean` | `deletedAt: DateTime?` — set `new Date()` to delete |
| Soft-delete read filter | manual `deleted: false` in every query | the `softDeleteExtension` injects `deletedAt: null` — inject `EXTENDED_PRISMA`, not raw `PrismaService` |
| Prisma access | `PrismaService` directly | `@Inject(EXTENDED_PRISMA) prisma: ExtendedPrismaService` |
| DI token | `@Inject('IXRepository')` (raw string) | export a `const X_REPOSITORY = 'IXRepository'` and inject that |
| Authz | `@RequirePermissions('CREATE','X')` | `@Roles(Role.OWNER)` + global `JwtAuthGuard`/`RolesGuard` |
| Current user/branch | `@CurrentUser`/`@CurrentClinic` | `@CurrentUser() user: AuthUser` → `user.branchId` |
| Import extensions | `.js` suffix (NodeNext ESM) | no suffix (CommonJS) |
| Tenancy scope | `clinicId` | `branchId` (every scoped query filters by it) |

## Use-Case Test Pattern

Unit-test the use-case by mocking the **interface** — no DB, no Nest container.

```ts
import { CreateServiceUseCase } from './create-service.use-case';
import type { IServiceRepository } from '../../domain/repositories/service.repository';

describe('CreateServiceUseCase', () => {
  let repo: jest.Mocked<Pick<IServiceRepository, 'existsByName' | 'create'>>;
  let useCase: CreateServiceUseCase;

  beforeEach(() => {
    repo = { existsByName: jest.fn().mockResolvedValue(false), create: jest.fn() };
    useCase = new CreateServiceUseCase(repo as unknown as IServiceRepository);
  });

  it('rejects a duplicate name', async () => {
    repo.existsByName.mockResolvedValue(true);
    await expect(useCase.execute({ name: 'Corte' } as any, 'b1')).rejects.toThrow('Ya existe');
  });

  it('creates with the caller branchId', async () => {
    await useCase.execute({ name: 'Corte' } as any, 'b1');
    expect(repo.create).toHaveBeenCalledWith({ name: 'Corte', branchId: 'b1' });
  });
});
```

## New Module Checklist

1. `domain/entities/<name>.entity.ts` — plain class mirroring the Prisma model (no decorators).
2. `domain/interfaces/<name>-data.interface.ts` — `Create<Name>Data` / `Update<Name>Data`.
3. `domain/repositories/<name>.repository.ts` — `const <NAME>_REPOSITORY` token + `I<Name>Repository` interface.
4. `application/dto/` — input DTOs (`class-validator` + `@ApiProperty`) and a response DTO.
5. `application/use-cases/<verb>-<name>.use-case.ts` — **one class per operation**, business rules + Nest exceptions.
6. `application/use-cases/*.spec.ts` — mock the interface, cover each rule branch.
7. `infrastructure/persistence/prisma-<name>.repository.ts` — `implements I<Name>Repository`, inject `EXTENDED_PRISMA`.
8. `interfaces/controllers/<name>.controller.ts` — thin, `@Roles`, `@CurrentUser`, delegate.
9. `application/<name>.module.ts` — `{ provide: <NAME>_REPOSITORY, useClass: Prisma... }`, list use-cases, `exports: [<NAME>_REPOSITORY]`.
10. Register the module in `app.module.ts`.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Use-case imports `PrismaService` or the concrete repo | Depend on `I<Name>Repository` via its token. The use-case must not know Prisma exists. |
| Business logic (`if/throw`, money math, state checks) in the controller | Controllers are wiring only. Move rules into a use-case. |
| One giant `XService` with 12 methods | One use-case class per operation, each with a single `execute()`. |
| Injecting raw `PrismaService` in a repository | Inject `EXTENDED_PRISMA` so soft-deleted rows are filtered automatically. |
| Adding manual `deletedAt: null` everywhere | The extension already does it on `findMany/findFirst/count`. Only set `deletedAt` on delete. |
| Entity with `@Column`/decorators or importing Prisma types | Domain stays framework-free. Plain class. |
| Exporting `PrismaXRepository` from the module | Export the **token**, so consumers bind to the port, not the implementation. |
| Forgetting `branchId` scope | Every scoped query and create must carry `branchId` from `@CurrentUser()`. |
```
