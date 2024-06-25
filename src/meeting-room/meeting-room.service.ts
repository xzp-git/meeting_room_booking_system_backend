import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { Like, Repository } from 'typeorm';
import { CreateMeetingRoomDto, UpdateMeetingRoomDto } from './dto';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private readonly meetingRoomRepository: Repository<MeetingRoom>;

  async find({
    pageNo,
    pageSize,
    name,
    capacity,
    equipment,
  }: {
    pageNo: number;
    pageSize: number;
    name?: string;
    capacity?: number;
    equipment?: string;
  }) {
    const condition: Record<string, any> = {};

    if (name) {
      condition.name = Like(`%${name}%`);
    }
    if (equipment) {
      condition.equipment = Like(`%${equipment}%`);
    }
    if (capacity) {
      condition.capacity = capacity;
    }
    if (pageNo < 1) {
      throw new BadRequestException('页码不能小于1');
    }

    const skipCount = (pageNo - 1) * pageSize;

    const [meetingRooms, total] = await this.meetingRoomRepository.findAndCount(
      {
        skip: skipCount,
        take: pageSize,
        where: condition,
      },
    );

    return {
      meetingRooms,
      total,
    };
  }

  async create(meetingRoomDto: CreateMeetingRoomDto) {
    const room = await this.meetingRoomRepository.findOneBy({
      name: meetingRoomDto.name,
    });

    if (room) {
      throw new BadRequestException('会议室名字已存在');
    }

    return this.meetingRoomRepository.insert(meetingRoomDto);
  }

  async update(meetingRoomeDto: UpdateMeetingRoomDto) {
    const meetingRoom = await this.meetingRoomRepository.findOneBy({
      id: meetingRoomeDto.id,
    });

    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    meetingRoom.capacity = meetingRoomeDto.capacity;
    meetingRoom.location = meetingRoomeDto.location;
    meetingRoom.name = meetingRoomeDto.name;
    if (meetingRoomeDto.description) {
      meetingRoom.description = meetingRoomeDto.description;
    }
    if (meetingRoomeDto.equipment) {
      meetingRoom.equipment = meetingRoomeDto.equipment;
    }

    this.meetingRoomRepository.update({ id: meetingRoomeDto.id }, meetingRoom);
  }

  async findById(id: number) {
    return this.meetingRoomRepository.findOneBy({ id });
  }
  async remove(id: number) {
    this.meetingRoomRepository.delete({ id });
  }

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = 30;
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    this.meetingRoomRepository.insert([room1, room2, room3]);
  }
}
