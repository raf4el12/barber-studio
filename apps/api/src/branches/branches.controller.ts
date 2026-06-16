import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(Role.OWNER)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branches: BranchesService) {}

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branches.create(dto);
  }

  @Get()
  findAll() {
    return this.branches.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branches.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branches.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branches.remove(id);
  }
}
