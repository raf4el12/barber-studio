import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EXTENDED_PRISMA, type ExtendedPrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  create(dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: dto });
  }

  findAll() {
    return this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.findOne(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
