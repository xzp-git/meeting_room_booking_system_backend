import { Controller, Get, Inject, SetMetadata } from '@nestjs/common';
import { AppService } from './app.service';
import { REQUIRE_LOGIN, REQUIRE_PERMISSION } from 'src/utils';

@Controller()
export class AppController {
  @Inject()
  private readonly appService: AppService;

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('aaa')
  @SetMetadata(REQUIRE_LOGIN, true)
  @SetMetadata(REQUIRE_PERMISSION, ['ddd'])
  aaaa() {
    return 'aaa';
  }

  @Get('bbb')
  bbb() {
    return 'bbb';
  }
}
