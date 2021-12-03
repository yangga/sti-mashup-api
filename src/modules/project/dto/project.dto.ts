import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import _ from 'lodash';

import { ProjectStateType } from '../../../common/constants/project-state.type';
import { AbstractDto } from '../../../common/dto/abstract.dto';
import type { ProjectEntity } from '../entities/project.entity';
import type { ProjectApplicantEntity } from '../entities/project-applicant.entity';
import type { ProjectMemberEntity } from '../entities/project-member.entity';
import type { ProjectPositionStatusEntity } from '../entities/project-position-status.entity';
import { ProjectApplicantDto } from './project-applicant.dto';
import { ProjectMemberDto } from './project-member.dto';

export type ProjectDtoOptions = Partial<{
  positionStatus?: ProjectPositionStatusEntity[];
  applicants?: ProjectApplicantEntity[];
  members?: ProjectMemberEntity[];
}>;

export class ProjectDto extends AbstractDto {
  @ApiProperty({ enum: ProjectStateType })
  readonly state: ProjectStateType;

  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  readonly languages: string[];

  @ApiProperty()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly descriptionHtml: string;

  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  readonly tags: string[];

  @ApiPropertyOptional({ type: () => Object })
  @IsOptional()
  readonly positionStatus?: Record<string, Record<'open' | 'close', number>>;

  @ApiPropertyOptional({ type: () => [ProjectApplicantDto] })
  @IsOptional()
  readonly applicants?: ProjectApplicantDto[];

  @ApiPropertyOptional({ type: () => [ProjectMemberDto] })
  @IsOptional()
  readonly members?: ProjectMemberDto[];

  constructor(entity: ProjectEntity, options?: ProjectDtoOptions) {
    super(entity);
    this.state = entity.state;
    this.languages = entity.languages;
    this.title = entity.title;
    this.descriptionHtml = entity.descriptionHtml;
    this.tags = entity.tags;

    if (options?.positionStatus) {
      this.positionStatus = _.reduce(
        options.positionStatus,
        (prev, cur) => {
          const { position, openCnt, closeCnt } = cur;

          prev[position] = {
            openCnt,
            closeCnt,
          };

          return prev;
        },
        {},
      );
    }

    if (options?.applicants) {
      this.applicants = options.applicants.map((o) => o.toDto());
    }

    if (options?.members) {
      this.members = options.members.map((o) => o.toDto());
    }
  }
}
