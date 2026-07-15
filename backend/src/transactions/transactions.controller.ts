import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  clientId: string;

  @IsString()
  type: string;

  @IsNumber()
  amount: number;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  targetBranchId?: string;
}

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.txService.findAll(req.user);
  }

  @Post()
  create(@Req() req: any, @Body() body: CreateTransactionDto) {
    return this.txService.create(req.user, body as any);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.txService.update(req.user, id, body);
  }
}

