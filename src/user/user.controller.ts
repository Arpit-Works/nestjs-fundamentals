import { Controller, Get, Post, Put, Query, Param, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser-dto';
import { UpdateUserDto } from './dto/updateUser-dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor (private readonly UserService: UserService) {}

    @Get()
    getUserByName(@Query('name') name: string):unknown{

        return this.UserService.finduser(name)
    }

    @Get(':id')
    getUserById(@Param('id') id:number):unknown{
        return this.UserService.findUserbyId(id)
    }

    @Post()
    createUser(@Body() createUser: CreateUserDto) {
        return this.UserService.createUser(createUser)
    }

    @Put(':id')
    updateUser(@Param('id') id:string, @Body() updateUser: UpdateUserDto){
        return {
            message : "User Updated ",
            data:{id, ...updateUser}
        }
    }

}
