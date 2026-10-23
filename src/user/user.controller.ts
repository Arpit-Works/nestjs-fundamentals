import { Controller, Get, Post, Put, Query, Param, Body } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser-dto';
import { UpdateUserDto } from './dto/updateUser-dto';

@Controller('user')
export class UserController {


    @Get()
    getUserbyId(@Query('name') name: string){
        const users =[{id: 1, name: "Arpit", },{id: 2,name: "Jhon",}]
        if(name){
            return users.filter(
                (users) => users.name.toLowerCase().includes(name.toLowerCase()))
        }

        return users
    }

    @Get(':id')
    getUserById(@Param('id') id:string){
        return {
            id, name:"Trisha"
        }
    }

    @Post()
    createUser(@Body() createUser: CreateUserDto) {
        return {
            message: "User created successfully",
            data: createUser
        }
    }

    @Put(':id')
    updateUser(@Param('id') id:string, @Body() updateUser: UpdateUserDto){
        return {
            message : "User Updated ",
            data:{id, ...updateUser}
        }
    }

}
