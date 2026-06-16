import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { EXTENDED_PRISMA, type ExtendedPrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Nunca devolver el hash de la contraseña.
const SAFE_OMIT = { passwordHash: true } as const;

@Injectable()
export class UsersService {
  constructor(
    @Inject(EXTENDED_PRISMA) private readonly prisma: ExtendedPrismaService,
  ) {}

  async create(dto: CreateUserDto) {
    const { password, ...rest } = dto;
    return this.prisma.user.create({
      data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
      omit: SAFE_OMIT,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { name: 'asc' },
      omit: SAFE_OMIT,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      omit: SAFE_OMIT,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { password, ...rest } = dto;
    return this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
      omit: SAFE_OMIT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      omit: SAFE_OMIT,
    });
  }
}
