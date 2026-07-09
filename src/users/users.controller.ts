import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { InviteDto } from './dto/invite.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post('invite')
  invite(@Body() dto: InviteDto) {
    return this.usersService.invite(dto.phoneNumber);
  }
}
