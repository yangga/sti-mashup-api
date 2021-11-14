import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { CommonHeader } from '../../decorators/common-header.decorator';

@CommonHeader()
@Controller({
  path: 'posts',
  version: '1',
})
export class PostController {
  constructor(
    @Optional() @Inject('NATS_SERVICE') private client: ClientProxy,
  ) {}

  @Get('search')
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  call() {
    return this.client.send('search', { text: 'test' });
  }
}
