import { ForbiddenException, Injectable } from '@nestjs/common';
import _ from 'lodash';
import type { UserEntity } from 'modules/user/entities/user.entity';
import type { FindConditions } from 'typeorm';
import { getManager } from 'typeorm';

import { ProjectMemberRoleType } from '../../common/constants/project-member-role.type';
import { ProjectStateType } from '../../common/constants/project-state.type';
import { ProjectHasPositionException } from '../../exceptions/project-has-position.exception';
import { ProjectInvolvedToomanyException } from '../../exceptions/project-involved-toomany.exception';
import { SearchService } from '../../modules/search/search.service';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { Optional } from '../../types';
import type { ProjectDto } from './dto/project.dto';
import type { ProjectPositionDto } from './dto/project-position.dto';
import type { ProjectRegisterDto } from './dto/project-register.dto';
import type { ProjectUpdateDto } from './dto/project-update.dto';
import { ProjectEntity } from './entities/project.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { ProjectMemberPositionEntity } from './entities/project-member-position.entity';
import { ProjectPositionStatusEntity } from './entities/project-position-status.entity';
import { ProjectQueryService } from './project-query.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly configService: ApiConfigService,
    private readonly projectQueryService: ProjectQueryService,
    private readonly searchService: SearchService,
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

    const positions = body.positions.map((pos) =>
      ProjectPositionStatusEntity.create({
        project,
        position: pos.name,
        openCnt: pos.count,
        closeCnt:
          pos.name
            .toLowerCase()
            .localeCompare(body.myPosition.toLowerCase()) === 0
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

    const memberPosition = ProjectMemberPositionEntity.create({
      member,
      position: body.myPosition,
    });
    member.positions = [memberPosition];

    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(memberPosition);
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
