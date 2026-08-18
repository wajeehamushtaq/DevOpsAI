import { Controller, Body, Get, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto.email, dto.name, dto.password);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
