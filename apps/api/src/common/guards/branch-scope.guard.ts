import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '../decorators/current-user.decorator';

interface ScopedRequest {
  user?: AuthUser;
  query?: { branchId?: unknown };
  body?: { branchId?: unknown };
}

/**
 * Aislamiento por sucursal para roles operativos. OWNER pasa siempre.
 * Un no-OWNER necesita branchId propio y, si la petición trae un
 * branchId explícito (query o body), debe coincidir: si no → 403.
 */
@Injectable()
export class BranchScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const raw: unknown = context.switchToHttp().getRequest();
    if (typeof raw !== 'object' || raw === null) return true;
    const { user, query, body } = raw as ScopedRequest;
    if (!user || user.role === Role.OWNER) return true;
    if (!user.branchId) {
      throw new ForbiddenException('Usuario sin sucursal asignada');
    }
    const explicit = query?.branchId ?? body?.branchId;
    if (
      explicit !== undefined &&
      explicit !== null &&
      explicit !== '' &&
      explicit !== user.branchId
    ) {
      throw new ForbiddenException('Acceso denegado a otra sucursal');
    }
    return true;
  }
}
