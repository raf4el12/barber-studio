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
import { CreateCommissionRuleDto } from '../../application/dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from '../../application/dto/update-commission-rule.dto';
import { PreviewCommissionDto } from '../../application/dto/preview-commission.dto';
import { CreateCommissionRuleUseCase } from '../../application/use-cases/create-commission-rule.use-case';
import { FindAllCommissionRulesUseCase } from '../../application/use-cases/find-all-commission-rules.use-case';
import { FindOneCommissionRuleUseCase } from '../../application/use-cases/find-one-commission-rule.use-case';
import { UpdateCommissionRuleUseCase } from '../../application/use-cases/update-commission-rule.use-case';
import { DeleteCommissionRuleUseCase } from '../../application/use-cases/delete-commission-rule.use-case';
import { PreviewCommissionUseCase } from '../../application/use-cases/preview-commission.use-case';

@Controller('commission-rules')
@Roles(Role.OWNER)
export class CommissionRulesController {
  constructor(
    private readonly createRule: CreateCommissionRuleUseCase,
    private readonly findAllRules: FindAllCommissionRulesUseCase,
    private readonly findOneRule: FindOneCommissionRuleUseCase,
    private readonly updateRule: UpdateCommissionRuleUseCase,
    private readonly deleteRule: DeleteCommissionRuleUseCase,
    private readonly preview: PreviewCommissionUseCase,
  ) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  previewResolution(@Body() dto: PreviewCommissionDto) {
    return this.preview.execute(dto);
  }

  @Post()
  create(@Body() dto: CreateCommissionRuleDto) {
    return this.createRule.execute(dto);
  }

  @Get()
  findAll() {
    return this.findAllRules.execute();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.findOneRule.execute(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    return this.updateRule.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deleteRule.execute(id);
  }
}
