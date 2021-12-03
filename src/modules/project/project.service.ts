import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import type { UserEntity } from 'modules/user/entities/user.entity';
import type { FindConditions } from 'typeorm';
import { getManager } from 'typeorm';

import { ProjectMemberRoleType } from '../../common/constants/project-member-role.type';
import type { Optional } from '../../types';
import type { ProjectDto } from './dto/project.dto';
import type { ProjectRegisterDto } from './dto/project-register.dto';
import { ProjectEntity } from './entities/project.entity';
import { ProjectMemberEntity } from './entities/project-member.entity';
import { ProjectPositionStatusEntity } from './entities/project-position-status.entity';

@Injectable()
export class ProjectService {
  findOne(
    findData: FindConditions<ProjectEntity>,
  ): Promise<Optional<ProjectEntity>> {
    return ProjectEntity.findOne(findData);
  }

  async createProject(
    user: UserEntity,
    body: ProjectRegisterDto,
  ): Promise<ProjectDto> {
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
      position: body.myPosition,
      role: ProjectMemberRoleType.OWNER,
    });
    project.members = Promise.resolve([member]);

    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(positions);
      await transactionalEntityManager.save(member);
      await transactionalEntityManager.save(project);
    });

    return project.toDto({
      members: [member],
    });
  }
}
