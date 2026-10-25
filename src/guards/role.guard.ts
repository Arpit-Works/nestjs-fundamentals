import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext,): boolean  {
    const request: Request = context.switchToHttp().getRequest();
    const role = request.headers['role'];

    if(role !== 'admin'){
      throw new UnauthorizedException('You are not allowed to perform this action ')
    }

    return true
  }
}
