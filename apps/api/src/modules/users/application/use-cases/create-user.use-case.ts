import { Inject, Injectable, ConflictException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';
import {
  PASSWORD_HASHER,
  type IPasswordHasher,
} from '../../domain/contracts/password-hasher.interface';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: IPasswordHasher,
  ) {}

  async execute(dto: CreateUserDto) {
    if (await this.users.existsByEmail(dto.email)) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
    const { password, ...rest } = dto;
    return this.users.create({
      ...rest,
      passwordHash: await this.hasher.hash(password),
    });
  }
}
