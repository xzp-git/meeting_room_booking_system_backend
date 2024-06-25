import {
  Controller,
  Get,
  Query,
  Inject,
  Post,
  Body,
  Put,
  Param,
  Delete,
  DefaultValuePipe,
} from '@nestjs/common';
import { MeetingRoomService } from './meeting-room.service';
import { CreateMeetingRoomDto, UpdateMeetingRoomDto } from './dto';
import { generateParseIntPipe } from 'src/utils';
import { RequireLogin } from 'src/decorator';

@Controller('/api/v1/meeting-room')
@RequireLogin()
export class MeetingRoomController {
  @Inject(MeetingRoomService)
  private readonly meetingRoomService: MeetingRoomService;

  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('name') name: string,
    @Query('capacity') capacity: number,
    @Query('equipment') equipment: string,
  ) {
    return this.meetingRoomService.find({
      pageNo,
      pageSize,
      name,
      capacity,
      equipment,
    });
  }

  @Post('create')
  async create(@Body() meetingRoomDto: CreateMeetingRoomDto) {
    return this.meetingRoomService.create(meetingRoomDto);
  }

  @Put('update')
  async update(@Body() meetingRoomDto: UpdateMeetingRoomDto) {
    await this.meetingRoomService.update(meetingRoomDto);
    return null;
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.meetingRoomService.findById(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.meetingRoomService.remove(id);
    return null;
  }
}
