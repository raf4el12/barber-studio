import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import {
  PASSWORD_HASHER,
  type IPasswordHasher,
} from '../../domain/contracts/password-hasher.interface';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(id: string, dto: UpdateUserDto) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { password, ...rest } = dto;
    return this.users.update(id, {
      ...rest,
      ...(password ? { passwordHash: await this.hasher.hash(password) } : {}),
    });
  }
}
