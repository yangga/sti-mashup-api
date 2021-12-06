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
  @ResponseData()
  @Auth([RoleType.USER])
  async deleteProjectPic(
    @AuthUser() user: UserEntity,
    @Query('id') id: number,
  ): Promise<void> {
    await this.projectService.delProjectPic(id, user);
  }

  //   @Put(':projectId/state')
  //   @ApiOperation({
  //     summary: '',
  //     description: '프로젝트 상태 변경',
  //   })
  //   @Auth([RoleType.USER])
  //   @ResponseData(ProjectDto)
  //   async userRegister(
  //     @Query('projectId') projectId: number,
  //     @Body() body: UserRegisterDto,
  //   ): Promise<ProjectDto> {}
}
