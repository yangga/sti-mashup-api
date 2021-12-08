import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import _ from 'lodash';
import sharp from 'sharp';
import type { FindConditions } from 'typeorm';
import { getManager } from 'typeorm';

import { ProjectMemberRoleType } from '../../common/constants/project-member-role.type';
import { ProjectStateType } from '../../common/constants/project-state.type';
import { DuplicatedRequestException } from '../../exceptions/duplicated-request.exception';
import { FileNotImageException } from '../../exceptions/file-not-image.exception';
import { ProjectHasPositionException } from '../../exceptions/project-has-position.exception';
import { ProjectInvolvedToomanyException } from '../../exceptions/project-involved-toomany.exception';
import { ProjectNotFoundException } from '../../exceptions/project-not-found.exception';
import type { IFile } from '../../interfaces';
import { SearchService } from '../../modules/search/search.service';
import { UserEntity } from '../../modules/user/entities/user.entity';
import { ApiConfigService } from '../../shared/services/api-config.service';
import {
  AwsS3Service,
  S3FileCategory,
} from '../../shared/services/aws-s3.service';
import { ValidatorService } from '../../shared/services/validator.service';
import type { Optional } from '../../types';
import { UserNotFoundException } from './../../exceptions/user-not-found.exception';
import type { ProjectDto } from './dto/project.dto';
import type { ProjectMemberDto } from './dto/project-member.dto';
import type { ProjectMemberApplyDto } from './dto/project-member-apply.dto';
import type { ProjectMemberApproveDto } from './dto/project-member-approve.dto';
import type { ProjectMemberRoleDto } from './dto/project-member-role.dto';
import { ProjectPicDto } from './dto/project-pic.dto';
import type { ProjectPositionDto } from './dto/project-position.dto';
import type { ProjectRegisterDto } from './dto/project-register.dto';
import type { ProjectUpdateDto } from './dto/project-update.dto';
import { ProjectEntity } from './entities/project.entity';
import { ProjectApplicantEntity } from './entities/project-applicant.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { ProjectMemberPositionEntity } from './entities/project-member-position.entity';
import { ProjectPositionStatusEntity } from './entities/project-position-status.entity';
import { ProjectQueryService } from './project-query.service';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectSentry() private readonly sentry: SentryService,
    private readonly awsS3Service: AwsS3Service,
    private readonly configService: ApiConfigService,
    private readonly projectQueryService: ProjectQueryService,
    private readonly searchService: SearchService,
    private readonly validatorService: ValidatorService,
  ) {}

  findOne(
    findData: FindConditions<ProjectEntity>,
  ): Promise<Optional<ProjectEntity>> {
    return ProjectEntity.findOne(findData);
  }

  async getProject(
    id: number,
    param: Partial<{
      needPositionStatus: boolean;
      needApplicants: boolean;
      needMembers: boolean;
    }>,
  ): Promise<ProjectDto> {
    const project = await this.projectQueryService.getProjectEntity(id, param);

    return project.toDto({
      positionStatus: param.needPositionStatus
        ? await project.positionStatus
        : undefined,
      applicants: param.needApplicants ? await project.applicants : undefined,
      members: param.needMembers ? await project.members : undefined,
    });
  }

  async createProject(
    user: UserEntity,
    body: ProjectRegisterDto,
  ): Promise<ProjectDto> {
    const involvedPrjCnt =
      await this.projectQueryService.getUserInvolvedProjectCount(user.id);

    if (involvedPrjCnt >= this.configService.maxInvolveProjectCount) {
      throw new ProjectInvolvedToomanyException();
    }

    const project = ProjectEntity.create(body);

    if (!project) {
      throw new ProjectNotFoundException();
    }

    const positions = body.positions.map((pos) =>
      ProjectPositionStatusEntity.create({
        project,
        position: pos.name,
        openCnt: pos.count,
        closeCnt:
          pos.name
            .toLowerCase()
            .localeCompare((body.myPosition || '').toLowerCase()) === 0
            ? 1
            : 0,
      }),
    );
    project.positionStatus = Promise.resolve(positions);

    const member = ProjectMemberEntity.create({
      project,
      user,
      role: ProjectMemberRoleType.OWNER,
    });
    project.members = Promise.resolve([member]);

    const memberPosition = body.myPosition
      ? ProjectMemberPositionEntity.create({
          member,
          position: body.myPosition,
        })
      : undefined;

    if (memberPosition) {
      member.positions = [memberPosition];
    }

    await getManager().transaction(async (transactionalEntityManager) => {
      if (memberPosition) {
        await transactionalEntityManager.save(memberPosition);
      }

      await transactionalEntityManager.save(positions);
      await transactionalEntityManager.save(member);
      await transactionalEntityManager.save(project);
    });

    const res = project.toDto({
      members: [member],
      positionStatus: positions,
    });

    await this._streamToES(res);

    return res;
  }

  async updateProject(
    id: number,
    body: ProjectUpdateDto,
    user: UserEntity,
  ): Promise<ProjectDto> {
    const project = await this.projectQueryService.getProjectEntity(id, {
      needMembers: true,
      needPositionStatus: true,
    });

    const members = await project.members;
    const my = members.find((m) => m.user.id === user.id);

    if (
      !my ||
      (my.role !== ProjectMemberRoleType.OWNER &&
        my.role !== ProjectMemberRoleType.ADMIN)
    ) {
      throw new ForbiddenException();
    }

    if (project.state !== ProjectStateType.OPEN) {
      throw new ForbiddenException();
    }

    const noValidateProperties = [
      'languages',
      'title',
      'descriptionHtml',
      'teamIntroHtml',
      'profitShare',
      'skills',
      'tags',
      'beginAt',
      'period',
    ];

    for (const propertyName of noValidateProperties) {
      if (!_.isUndefined(body[propertyName])) {
        project[propertyName] = body[propertyName];
      }
    }

    if (!_.isUndefined(body.positions)) {
      await this.updateProjectPositions(project, body.positions);
    }

    await project.save();

    const res = project.toDto({
      members,
      positionStatus: await project.positionStatus,
    });

    await this._streamToES(res);

    return res;
  }

  private async updateProjectPositions(
    project: ProjectEntity,
    positions: ProjectPositionDto[],
    sync = true,
  ): Promise<void> {
    const members: ProjectMemberEntity[] = await project.members;
    const positionStatus: ProjectPositionStatusEntity[] =
      await project.positionStatus;

    const newPositionMap = _.mapValues(_.keyBy(positions, 'name'), 'count');

    const nowPositionMap = _.countBy(
      _.flattenDeep(members.map((m) => m.positions.map((p) => p.position))),
    );

    // 포지션 축소 시 유효성 체크
    for (const pos of _.keys(nowPositionMap)) {
      if (!newPositionMap[pos] || newPositionMap[pos] < nowPositionMap[pos]) {
        throw new ProjectHasPositionException();
      }
    }

    for (const p of positionStatus) {
      p.openCnt = 0;
      p.closeCnt = 0;
    }

    for (const position of positions) {
      const entity = positionStatus.find(
        (pos) => !pos.position.localeCompare(position.name),
      );

      if (entity) {
        entity.openCnt = newPositionMap[position.name];
        entity.closeCnt = nowPositionMap[position.name] || 0;
      } else {
        positionStatus.push(
          ProjectPositionStatusEntity.create({
            position: position.name,
            openCnt: newPositionMap[position.name],
            closeCnt: 0,
          }),
        );
      }
    }

    project.positionStatus = Promise.resolve(positionStatus);

    if (sync) {
      await getManager().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(positionStatus);
        await transactionalEntityManager.save(project);
      });
    }
  }

  async uploadProjectPic(
    id: number,
    file: IFile,
    user: UserEntity,
  ): Promise<ProjectPicDto> {
    if (file && !this.validatorService.isImage(file.mimetype)) {
      throw new FileNotImageException();
    }

    const [canChangeMeta, project] =
      await this.projectQueryService.canUserChangeMeta(user.id, id);

    if (!canChangeMeta) {
      throw new ForbiddenException();
    }

    file.buffer = await sharp(file.buffer)
      .resize(128, 128, {
        fit: 'inside',
      })
      .toBuffer();

    const oldAvatar = project.avatar;

    if (file) {
      project.avatar = await this.awsS3Service.upload(
        S3FileCategory.PROJECT_PIC,
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
      executeWrapper(ProjectEntity.save(project)),
      executeWrapper(
        oldAvatar ? this.awsS3Service.delete(oldAvatar) : undefined,
      ),
    ]);

    if (res[0].status === 'rejected') {
      throw res[0].reason;
    }

    await this._streamToES(project.toDto());

    return new ProjectPicDto(id, project.avatar);
  }

  async delProjectPic(id: number, user: UserEntity): Promise<void> {
    const [canChangeMeta, project] =
      await this.projectQueryService.canUserChangeMeta(user.id, id);

    if (!canChangeMeta) {
      throw new ForbiddenException();
    }

    if (!project.avatar) {
      throw new NotFoundException();
    }

    const key = project.avatar;

    // eslint-disable-next-line unicorn/no-null
    project.avatar = null;
    await ProjectEntity.save(project);

    await this.awsS3Service.delete(key);

    await this._streamToES(project.toDto());
  }

  async getProjectMembers(id: number): Promise<ProjectMemberDto[]> {
    const project = await this.projectQueryService.getProjectEntity(id, {
      needMembers: true,
    });

    const members = await project.members;

    return members.filter((m) => !m.deleted).map((m) => m.toDto());
  }

  async grantMemberRole(
    projectId: number,
    body: ProjectMemberRoleDto,
    user: UserEntity,
  ): Promise<void> {
    if (body.role === ProjectMemberRoleType.OWNER || body.userId === user.id) {
      throw new BadRequestException();
    }

    const project = await this.projectQueryService.getProjectEntity(projectId, {
      needMembers: true,
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    const members = await project.members;

    if (!members) {
      throw new UserNotFoundException();
    }

    const memberGranter = members.find((m) => m.user.id === user.id);
    const memberTarget = members.find((m) => m.user.id === body.userId);

    if (!memberGranter || !memberTarget) {
      throw new UserNotFoundException();
    }

    if (
      memberGranter.role !== ProjectMemberRoleType.OWNER &&
      memberGranter.role !== ProjectMemberRoleType.ADMIN
    ) {
      throw new ForbiddenException();
    }

    if (memberGranter.role === memberTarget.role) {
      throw new ForbiddenException();
    }

    memberTarget.role = body.role;
    await memberTarget.save();
  }

  async applyMember(
    projectId: number,
    body: ProjectMemberApplyDto,
    user: UserEntity,
  ): Promise<void> {
    const project = await this.projectQueryService.getProjectEntity(projectId, {
      needApplicants: true,
      needMembers: true,
    });

    if (project.state !== ProjectStateType.OPEN) {
      throw new ForbiddenException();
    }

    const positionStatus = await project.positionStatus;

    if (
      positionStatus.findIndex(
        (p) => p.position === body.position && p.openCnt > p.closeCnt,
      ) < 0
    ) {
      throw new BadRequestException();
    }

    const members = await project.members;

    if (
      members.findIndex(
        (m) =>
          m.user.id === user.id &&
          m.positions.findIndex(
            (mp) => !mp.deleted && mp.position === body.position,
          ) >= 0,
      ) >= 0
    ) {
      throw new DuplicatedRequestException();
    }

    const applicants = await project.applicants;

    let applicant = applicants.find(
      (a) => a.user.id === user.id && a.position === body.position,
    );

    if (applicant && !applicant.deleted) {
      throw new DuplicatedRequestException();
    }

    if (applicant) {
      applicant.deleted = false;
    } else {
      applicant = ProjectApplicantEntity.create({
        project,
        position: body.position,
        user,
      });
      applicants.push(applicant);
    }

    project.applicants = Promise.resolve(applicants);

    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(applicant);
      await transactionalEntityManager.save(project);
    });

    await this._streamToES(
      project.toDto({
        members,
        applicants,
      }),
    );
  }

  async cancelApplyMember(
    projectId: number,
    body: ProjectMemberApplyDto,
    user: UserEntity,
  ): Promise<void> {
    const project = await this.projectQueryService.getProjectEntity(projectId, {
      needApplicants: true,
      needMembers: true,
    });

    if (project.state !== ProjectStateType.OPEN) {
      throw new ForbiddenException();
    }

    const applicants = await project.applicants;

    const applicant = applicants.find(
      (a) => a.user.id === user.id && a.position === body.position,
    );

    if (!applicant) {
      throw new ForbiddenException();
    }

    applicant.deleted = true;

    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(applicant);
      await transactionalEntityManager.save(project);
    });

    await this._streamToES(
      project.toDto({
        applicants,
      }),
    );
  }

  async approveMember(
    projectId: number,
    body: ProjectMemberApproveDto,
    user: UserEntity,
  ): Promise<void> {
    const [canChange, project] =
      await this.projectQueryService.canUserChangeMeta(user.id, projectId, {
        needPositionStatus: true,
        needApplicants: true,
      });

    if (!canChange) {
      throw new ForbiddenException();
    }

    const positionStatus = await project.positionStatus;

    if (
      positionStatus.findIndex(
        (p) => p.position === body.position && p.openCnt > p.closeCnt,
      ) < 0
    ) {
      throw new BadRequestException();
    }

    const applicants = await project.applicants;

    if (
      applicants.findIndex(
        (a) =>
          !a.deleted &&
          a.user.id === body.userId &&
          a.position === body.position,
      ) < 0
    ) {
      throw new BadRequestException();
    }

    const members = await project.members;
    let member = members.find((m) => m.user.id === body.userId);
    let position = member?.positions.find(
      (mp) => mp.position === body.position,
    );

    if (position && !position.deleted) {
      throw new DuplicatedRequestException();
    }

    if (member) {
      member.deleted = false;
    } else {
      const targetUser = await UserEntity.findOne({ id: body.userId });

      if (!targetUser) {
        throw new UserNotFoundException();
      }

      targetUser.checkActivation();

      member = ProjectMemberEntity.create({
        project,
        user: targetUser,
        role: ProjectMemberRoleType.MEMBER,
      });
      members.push(member);
    }

    project.members = Promise.resolve(members);

    const positions = member.positions || [];

    if (position) {
      position.deleted = false;
    } else {
      position = ProjectMemberPositionEntity.create({
        member,
        position: body.position,
      });
      positions.push(position);
    }

    member.positions = positions;

    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(position);
      await transactionalEntityManager.save(member);
      await transactionalEntityManager.save(project);
    });

    await this.updateProjectPositionStatus(project);

    await this._streamToES(
      project.toDto({
        members,
        applicants,
      }),
    );
  }

  async disapproveMember(
    projectId: number,
    body: ProjectMemberApproveDto,
    user: UserEntity,
  ): Promise<void> {
    const [canChange, project] =
      await this.projectQueryService.canUserChangeMeta(user.id, projectId, {
        needApplicants: true,
      });

    if (!canChange) {
      throw new ForbiddenException();
    }

    const members = await project.members;
    const member = members.find((m) => m.user.id === body.userId);

    if (!member) {
      throw new UserNotFoundException();
    }

    const position = member.positions.find((p) => p.position === body.position);

    if (!position) {
      throw new NotFoundException();
    }

    position.deleted = true;

    member.deleted = member.positions.findIndex((p) => !p.deleted) < 0;

    // eslint-disable-next-line sonarjs/no-identical-functions
    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(position);
      await transactionalEntityManager.save(member);
    });

    await this.updateProjectPositionStatus(project);

    await this._streamToES(
      project.toDto({
        members,
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
  private async updateProjectPositionStatus(project: ProjectEntity) {
    const members: ProjectMemberEntity[] = await project.members;
    const positionStatus: ProjectPositionStatusEntity[] =
      await project.positionStatus;

    const oldPositionMap = _.countBy(
      _.flattenDeep(members.map((m) => m.positions.map((p) => p.position))),
    );

    for (const pos of positionStatus) {
      pos.closeCnt = oldPositionMap[pos.position] || 0;
    }

    await ProjectPositionStatusEntity.save(positionStatus);
  }

  // TODO: 나중에 stream으로 처리. RDS에 데이터 업데이트되면 > lambda 호출 후 ES 적재로 처리하기
  async _streamToES(dto: ProjectDto): Promise<void> {
    await this.searchService.putProject(dto);
  }
}
