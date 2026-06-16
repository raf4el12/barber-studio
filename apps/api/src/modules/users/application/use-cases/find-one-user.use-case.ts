import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../domain/repositories/user.repository';

@Injectable()
export class FindOneUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(id: string) {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
