import { Injectable, Logger } from '@nestjs/common';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import type { UserQuitDto } from 'modules/auth/dto/user-quit.dto';
import sharp from 'sharp';
import type { FindConditions } from 'typeorm';

import type { PageDto } from '../../common/dto/page.dto';
import { EmailAlreadyUsedException } from '../../exceptions/email-already-used.exception';
import { FileNotImageException } from '../../exceptions/file-not-image.exception';
import type { IFile } from '../../interfaces';
import { UtilsProvider } from '../../providers/utils.provider';
import {
  AwsS3Service,
  S3FileCategory,
} from '../../shared/services/aws-s3.service';
import { ValidatorService } from '../../shared/services/validator.service';
import type { Optional } from '../../types';
import type { UserRegisterDto } from '../auth/dto/user-register.dto';
import { UserNotFoundException } from './../../exceptions/user-not-found.exception';
import type { UserDto, UserDtoOptions } from './dto/user-dto';
import { UserPicDto } from './dto/UserPicDto';
import type { UsersPageOptionsDto } from './dto/users-page-options.dto';
import type { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectSentry() private readonly sentry: SentryService,
    public readonly userRepository: UserRepository,
    public readonly validatorService: ValidatorService,
    public readonly awsS3Service: AwsS3Service,
  ) {}

  /**
   * Find single user
   */
  findOne(findData: FindConditions<UserEntity>): Promise<Optional<UserEntity>> {
    return this.userRepository.findOne(findData);
  }

  async findByUsernameOrEmail(
    options: Partial<{ username: string; email: string }>,
  ): Promise<Optional<UserEntity>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (options.email) {
      queryBuilder.orWhere('user.email = :email', {
        email: options.email,
      });
    }

    if (options.username) {
      queryBuilder.orWhere('user.username = :username', {
        username: options.username,
      });
    }

    return queryBuilder.getOne();
  }

  async createUser(
    userRegisterDto: UserRegisterDto,
    { email }: { email: string },
  ): Promise<UserEntity> {
    const oldUser = await this.findByUsernameOrEmail({
      username: userRegisterDto.username,
      email,
    });

    if (oldUser) {
      throw new EmailAlreadyUsedException();
    }

    const user = this.userRepository.create(userRegisterDto);
    user.email = email;

    return this.userRepository.save(user);
  }

  async withdrawUser(userId: number, userLoginDto: UserQuitDto): Promise<void> {
    const user = await this.findOne({
      id: userId,
    });

    const isPasswordValid = await UtilsProvider.validateHash(
      userLoginDto.password,
      user?.password,
    );

    if (!user || !isPasswordValid) {
      throw new UserNotFoundException();
    }

    user.deleted = true;
    await this.userRepository.save(user);
  }

  async getUsers(
    pageOptionsDto: UsersPageOptionsDto,
    dtoOptions?: UserDtoOptions,
  ): Promise<PageDto<UserDto>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    const [items, pageMetaDto] = await queryBuilder.paginate(pageOptionsDto);

    return items.toPageDto(pageMetaDto, dtoOptions);
  }

  async getUser(id: number, dtoOptions?: UserDtoOptions): Promise<UserDto> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    queryBuilder.where('user.id = :id', { id });

    const userEntity = await queryBuilder.getOne();

    if (!userEntity) {
      throw new UserNotFoundException();
    }

    return userEntity.toDto(dtoOptions);
  }

  async uploadUserPic(id: number, file: IFile): Promise<UserPicDto> {
    if (file && !this.validatorService.isImage(file.mimetype)) {
      throw new FileNotImageException();
    }

    file.buffer = await sharp(file.buffer)
      .resize(128, 128, {
        fit: 'inside',
      })
      .toBuffer();

    const user = await this.findOne({
      id,
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const oldAvatar = user.avatar;

    if (file) {
      user.avatar = await this.awsS3Service.upload(
        S3FileCategory.USER_PIC,
        file,
      );
    }

    const executeWrapper = async <T>(promise: Promise<T> | undefined) => {
      try {
        return promise === undefined ? undefined : await promise;
      } catch (error) {
        this.logger.error(error);
        this.sentry.instance().captureException(error);

        throw error;
      }
    };

    const res = await Promise.allSettled([
      executeWrapper(this.userRepository.save(user)),
      executeWrapper(
        oldAvatar ? this.awsS3Service.delete(oldAvatar) : undefined,
      ),
    ]);

    if (res[0].status === 'rejected') {
      throw res[0].reason;
    }

    return new UserPicDto(id, user.avatar);
  }
}
