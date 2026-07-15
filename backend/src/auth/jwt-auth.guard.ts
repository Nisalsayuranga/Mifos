import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }
    
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'RUPASINGHE_TEMP_SECRET_KEY' // Hardcoded strictly for development ease based on request
      });
      // Attach full decoded user payload to request
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        branchId: payload.branchId
      };
    } catch {
      throw new UnauthorizedException('Token invalid or expired');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
