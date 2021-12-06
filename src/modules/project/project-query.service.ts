import { Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';

import { ProjectNotFoundException } from '../../exceptions/project-not-found.exception';
import { ProjectEntity } from './entities/project.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';

@Injectable()
export class ProjectQueryService {
  async getProjectEntity(
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
  ): Promise<ProjectEntity> {
    let relations: string[] = [];

    if (needPositionStatus) {
      relations = [...relations, 'positionStatus'];
    }

    if (needApplicants) {
      relations = [...relations, 'applicants', 'applicants.user'];
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

    return project;
  }

  async getUserInvolvedProjectCount(userId: number): Promise<number> {
    return ProjectMemberEntity.createQueryBuilder('member')
      .innerJoinAndSelect(
        'member.project',
        'project',
        "project.state in ('OPEN', 'STARTED', 'HOLD')",
      )
      .where('member.user.id = :userId', { userId })
      .getCount();
  }
}
