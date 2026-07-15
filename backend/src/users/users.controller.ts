import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Req() req: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Strictly Head Office Command. Access denied.');
    }
    return this.usersService.findAll();
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Strictly Head Office Command. Access denied.');
    }
    return this.usersService.create(body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Strictly Head Office Command. Access denied.');
    }
    return this.usersService.remove(id);
  }
}
