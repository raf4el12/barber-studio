import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CreateBranchDto } from '../../application/dto/create-branch.dto';
import { UpdateBranchDto } from '../../application/dto/update-branch.dto';
import { CreateBranchUseCase } from '../../application/use-cases/create-branch.use-case';
import { FindAllBranchesUseCase } from '../../application/use-cases/find-all-branches.use-case';
import { FindOneBranchUseCase } from '../../application/use-cases/find-one-branch.use-case';
import { UpdateBranchUseCase } from '../../application/use-cases/update-branch.use-case';
import { DeleteBranchUseCase } from '../../application/use-cases/delete-branch.use-case';

@Roles(Role.OWNER)
@Controller('branches')
export class BranchesController {
  constructor(
    private readonly createBranch: CreateBranchUseCase,
    private readonly findAllBranches: FindAllBranchesUseCase,
    private readonly findOneBranch: FindOneBranchUseCase,
    private readonly updateBranch: UpdateBranchUseCase,
    private readonly deleteBranch: DeleteBranchUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.createBranch.execute(dto);
  }

  @Get()
  findAll() {
    return this.findAllBranches.execute();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.findOneBranch.execute(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.updateBranch.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteBranch.execute(id);
  }
}
