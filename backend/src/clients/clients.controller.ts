import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

// Basic DTOs can be defined in a separate file, defining inline for speed
export class CreateClientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;
}

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Req() req: any, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create({ 
      ...createClientDto,
      branchId: req.user.branchId,
      createdByUserId: req.user.id
    });
  }

  @Get()
  findAll(@Req() req: any) {
    // If admin (null branchId in some configurations or role='ADMIN') fetch all, else strict filter
    if (req.user.role === 'ADMIN') {
      return this.clientsService.findAll(null);
    }
    return this.clientsService.findAll(req.user.branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateClientDto>) {
    return this.clientsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}

