import { Injectable } from '@nestjs/common';

import { ProjectMemberEntity } from './entities/project-member.entity';

@Injectable()
export class ProjectQueryService {
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
