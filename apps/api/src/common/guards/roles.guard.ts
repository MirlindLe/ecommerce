import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Role hierarchy: ADMIN > USER
const roleHierarchy: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.ADMIN]: 2,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get the minimum required role level
    const minRequiredLevel = Math.min(
      ...requiredRoles.map((role) => roleHierarchy[role] || 0),
    );

    // Get the user's role level
    const userRoleLevel = roleHierarchy[user.role as Role] || 0;

    // User has access if their role level is >= minimum required level
    const hasAccess = userRoleLevel >= minRequiredLevel;

    if (!hasAccess) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
