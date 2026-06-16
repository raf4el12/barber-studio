import type { UserEntity } from '../entities/user.entity';
import type {
  CreateUserData,
  UpdateUserData,
} from '../interfaces/user-data.interface';

export const USER_REPOSITORY = 'IUserRepository';

export interface IUserRepository {
  create(data: CreateUserData): Promise<UserEntity>;
  findAll(): Promise<UserEntity[]>;
  findById(id: string): Promise<UserEntity | null>;
  existsByEmail(email: string): Promise<boolean>;
  update(id: string, data: UpdateUserData): Promise<UserEntity>;
  softDelete(id: string): Promise<void>;
}
