import { Module } from '@nestjs/common';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  controllers: [ProjectController],
  exports: [ProjectService],
  providers: [ProjectService],
})
export class ProjectModule {}
