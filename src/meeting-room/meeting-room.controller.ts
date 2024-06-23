import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Query,
  Inject,
} from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';

@Controller('meeting-room')
export class MeetingRoomController {
  @Inject(MeetingRoomService)
  private readonly meetingRoomService: MeetingRoomService;

  @Get('list')
  async list(
    @Query('pageNo') pageNo: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.meetingRoomService.find(pageNo, pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.meetingRoomService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.meetingRoomService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.meetingRoomService.remove(+id);
  }

  @Get('init-data')
  async initData() {
    // await this.meetingRoomService.initData();
    return 'done';
  }
}
