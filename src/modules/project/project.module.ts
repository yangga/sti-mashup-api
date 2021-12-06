import { Module } from '@nestjs/common';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { ProjectQueryService } from './project-query.service';

@Module({
  imports: [ProjectQueryService],
  controllers: [ProjectController],
  exports: [ProjectService, ProjectQueryService],
  providers: [ProjectService, ProjectQueryService],
})
export class ProjectModule {}
