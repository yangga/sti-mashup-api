import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
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

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly teamIntroHtml?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly profitShare?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  readonly skills?: string[];

  @ApiProperty({ type: [String] })
  @IsNotEmpty()
  readonly tags: string[];

  @ApiPropertyOptional({ type: Date })
  @IsDateString()
  @IsOptional()
  readonly beginAt?: Date;

  @ApiPropertyOptional()
  @Min(1)
  @IsNumber()
  @IsOptional()
  readonly period?: number;

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
    this.teamIntroHtml = entity.teamIntroHtml;
    this.profitShare = entity.profitShare;
    this.skills = entity.skills;
    this.tags = entity.tags;
    this.beginAt = entity.beginAt;
    this.period = entity.period;

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
