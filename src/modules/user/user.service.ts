import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import _ from 'lodash';
import type { UserQuitDto } from 'modules/auth/dto/user-quit.dto';
import sharp from 'sharp';
import type { FindConditions } from 'typeorm';

import type { PageDto } from '../../common/dto/page.dto';
import { EmailAlreadyUsedException } from '../../exceptions/email-already-used.exception';
import { FileNotImageException } from '../../exceptions/file-not-image.exception';
import { UsernameAlreadyUsedException } from '../../exceptions/username-already-used.exception';
import type { IFile } from '../../interfaces';
import { UtilsProvider } from '../../providers/utils.provider';
import {
  AwsS3Service,
  S3FileCategory,
} from '../../shared/services/aws-s3.service';
import { ValidatorService } from '../../shared/services/validator.service';
import type { Optional } from '../../types';
import type { UserRegisterDto } from '../auth/dto/user-register.dto';
import { SearchService } from '../search/services/search.service';
import { UserNotFoundException } from './../../exceptions/user-not-found.exception';
import type { UserDto, UserDtoOptions } from './dto/user-dto';
import { UserPicDto } from './dto/user-pic.dto';
import type { UsersPageOptionsDto } from './dto/users-page-options.dto';
import type { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectSentry() private readonly sentry: SentryService,
    private readonly userRepository: UserRepository,
    private readonly validatorService: ValidatorService,
    private readonly awsS3Service: AwsS3Service,
    private readonly searchService: SearchService,
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
    const oldUserByUsername = await this.findByUsernameOrEmail({
      username: userRegisterDto.username,
    });

    if (oldUserByUsername && oldUserByUsername.email !== email) {
      throw new UsernameAlreadyUsedException();
    }

    const oldUserByEmail = await this.findByUsernameOrEmail({
      email,
    });

    if (oldUserByEmail && !oldUserByEmail.deleted) {
      throw new EmailAlreadyUsedException();
    }

    const user = oldUserByEmail
      ? oldUserByEmail
      : this.userRepository.create(userRegisterDto);

    user.username = userRegisterDto.username;
    user.password = userRegisterDto.password;
    user.email = email;
    user.deleted = false;

    const createdUser = await this.userRepository.save(user);

    await this._streamToES(createdUser);

    return createdUser;
  }

  async changePassword(email: string, password: string): Promise<UserEntity> {
    const user = await this.findOne({
      email,
    });

    if (!user || user.deleted) {
      throw new UserNotFoundException();
    }

    user.password = password;

    await this._streamToES(user);

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

    await this._streamToES(user);
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

    await this._streamToES(user);

    return new UserPicDto(id, user.avatar);
  }

  async delUserPic(id: number): Promise<void> {
    const user = await this.findOne({
      id,
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    if (!user.avatar) {
      throw new NotFoundException();
    }

    const key = user.avatar;

    // eslint-disable-next-line unicorn/no-null
    user.avatar = null;
    await this.userRepository.save(user);

    await this.awsS3Service.delete(key);

    await this._streamToES(user);
  }

  // TODO: 나중에 stream으로 처리. RDS에 데이터 업데이트되면 > lambda 호출 후 ES 적재로 처리하기
  async _streamToES(doc: UserEntity): Promise<void> {
    await this.searchService.updateUser(doc);
  }
}
