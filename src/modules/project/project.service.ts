import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import type { UserEntity } from 'modules/user/entities/user.entity';
import type { FindConditions } from 'typeorm';
import { getManager } from 'typeorm';

import { ProjectMemberRoleType } from '../../common/constants/project-member-role.type';
import { ProjectInvolvedToomanyException } from '../../exceptions/project-involved-toomany.exception';
import { ProjectNotFoundException } from '../../exceptions/project-not-found.exception';
import { SearchService } from '../../modules/search/search.service';
import { ApiConfigService } from '../../shared/services/api-config.service';
import type { Optional } from '../../types';
import type { ProjectDto } from './dto/project.dto';
import type { ProjectRegisterDto } from './dto/project-register.dto';
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
    {
      needPositionStatus,
      needApplicants,
      needMembers,
    }: Partial<{
      needPositionStatus: boolean;
      needApplicants: boolean;
      needMembers: boolean;
    }>,
  ): Promise<ProjectDto> {
    let relations: string[] = [];

    if (needPositionStatus) {
      relations = [...relations, 'positionStatus'];
    }

    if (needApplicants) {
      relations = [...relations, 'applicants'];
    }

    if (needMembers) {
      relations = [
        ...relations,
        'members',
        'members.user',
        'members.positions',
      ];
    }

    const project = await getManager().findOne(ProjectEntity, {
      where: { id },
      relations,
    });

    if (!project) {
      throw new ProjectNotFoundException();
    }

    return project.toDto({
      positionStatus: needPositionStatus
        ? await project.positionStatus
        : undefined,
      applicants: needApplicants ? await project.applicants : undefined,
      members: needMembers ? await project.members : undefined,
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

  // TODO: 나중에 stream으로 처리. RDS에 데이터 업데이트되면 > lambda 호출 후 ES 적재로 처리하기
  async _streamToES(dto: ProjectDto): Promise<void> {
    await this.searchService.putProject(dto);
  }
}
