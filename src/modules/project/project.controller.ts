import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RoleType } from '../../common/constants/role.type';
import { AuthUser } from '../../decorators/auth-user.decorator';
import { CommonHeader } from '../../decorators/common-header.decorator';
import { Auth } from '../../decorators/http.decorators';
import { ResponseData } from '../../decorators/response-data.decorators';
import { ApiFile } from '../../decorators/swagger.schema';
import { IFile } from '../../interfaces';
import { UserEntity } from '../user/entities/user.entity';
import { ProjectDto } from './dto/project.dto';
import type { ProjectMemberDto } from './dto/project-member.dto';
import { ProjectMemberApplyDto } from './dto/project-member-apply.dto';
import { ProjectMemberApproveDto } from './dto/project-member-approve.dto';
import { ProjectMemberRoleDto } from './dto/project-member-role.dto';
import { ProjectPicDto } from './dto/project-pic.dto';
import { ProjectRegisterDto } from './dto/project-register.dto';
import { ProjectUpdateDto } from './dto/project-update.dto';
import { ProjectService } from './project.service';

@CommonHeader()
@Controller({ path: 'projects', version: '1' })
@ApiTags('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post('/')
  @ApiOperation({
    summary: '',
    description: '프로젝트 생성',
  })
  @Auth([RoleType.USER])
  @ResponseData(ProjectDto)
  async projectRegister(
    @AuthUser() user: UserEntity,
    @Body() body: ProjectRegisterDto,
  ): Promise<ProjectDto> {
    return this.projectService.createProject(user, body);
  }

  @Get(':id')
  @ApiOperation({
    summary: '',
    description: 'Get a project',
  })
  @Auth([RoleType.USER])
  @ResponseData(ProjectDto)
  async getProject(@Query('id') id: number): Promise<ProjectDto> {
    return this.projectService.getProject(id, {
      needApplicants: true,
      needMembers: true,
      needPositionStatus: true,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: '',
    description: 'Update a project',
  })
  @Auth([RoleType.USER])
  @ResponseData(ProjectDto)
  async updateProject(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
    @Body() body: ProjectUpdateDto,
  ): Promise<ProjectDto> {
    return this.projectService.updateProject(id, body, user);
  }

  @Put(':id/pic')
  @ApiOperation({
    summary: '',
    description: '프로젝트 사진 등록',
  })
  @ResponseData(ProjectPicDto)
  @Auth([RoleType.USER])
  @ApiFile({ name: 'avatar' }, { isRequired: true })
  async uploadProjectPic(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
    @UploadedFile() file: IFile,
  ): Promise<ProjectPicDto> {
    return this.projectService.uploadProjectPic(id, file, user);
  }

  @Delete(':id/pic')
  @ApiOperation({
    summary: '',
    description: '프로젝트 삭제',
  })
  @ResponseData()
  @Auth([RoleType.USER])
  async deleteProjectPic(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
  ): Promise<void> {
    await this.projectService.delProjectPic(id, user);
  }

  @Get(':id/members')
  @ApiOperation({
    summary: '',
    description: 'Get members of the project',
  })
  @Auth([RoleType.USER])
  @ResponseData(ProjectDto)
  async getProjectMembers(
    @Query('id') id: number,
  ): Promise<ProjectMemberDto[]> {
    return this.projectService.getProjectMembers(id);
  }

  @Put(':id/members/role')
  @ApiOperation({
    summary: '',
    description: '멤버 Role 변경',
  })
  @ResponseData()
  @Auth([RoleType.USER])
  async grantMemberRole(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
    @Body() body: ProjectMemberRoleDto,
  ): Promise<void> {
    await this.projectService.grantMemberRole(id, body, user);
  }

  @Post(':id/members/apply')
  @ApiOperation({
    summary: '',
    description: '프로젝트 조인 신청',
  })
  @ResponseData()
  @Auth([RoleType.USER])
  async applyMember(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
    @Body() body: ProjectMemberApplyDto,
  ): Promise<void> {
    await this.projectService.applyMember(id, body, user);
  }

  @Delete(':id/members/apply')
  @ApiOperation({
    summary: '',
    description: '프로젝트 조인 취소',
  })
  @ResponseData()
  @Auth([RoleType.USER])
  async cancelApplyMember(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
    @Body() body: ProjectMemberApplyDto,
  ): Promise<void> {
    await this.projectService.cancelApplyMember(id, body, user);
  }

  @Post(':id/members/approve')
  @ApiOperation({
    summary: '',
    description: '프로젝트 멤버 승인',
  })
  @ResponseData()
  @Auth([RoleType.USER])
  async approveMember(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
    @Body() body: ProjectMemberApproveDto,
  ): Promise<void> {
    await this.projectService.approveMember(id, body, user);
  }

  @Delete(':id/members/approve')
  @ApiOperation({
    summary: '',
    description: '프로젝트 멤버 승인 취소',
  })
  @ResponseData()
  @Auth([RoleType.USER])
  async disapproveMember(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
    @Body() body: ProjectMemberApproveDto,
  ): Promise<void> {
    await this.projectService.disapproveMember(id, body, user);
  }
}
