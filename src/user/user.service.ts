import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser-dto';
import { UpdateUserDto } from './dto/updateUser-dto';

interface User{
    id: number
    name: string
}


@Injectable()
export class UserService {
    users: User[] = [{id: 1, name: "Arpit", },{id: 2,name: "Jhon",},{id: 3,name: "Jane",},{id: 4,name: "Jim",},{id: 5,name: "Jill",}]

    findAllUser(){
        return this.users
    }

    finduser(name:string){
        if(name){
            return this.users.filter(
                (users) => users.name.toLowerCase().includes(name.toLowerCase()))
        }
    }

    findUserbyId(id: number){
        const user = this.users.find((user) => user.id == id )

        if(!user){
            throw new NotFoundException('User Not Found')
        }

        return user
    }

    createUser(createUser:CreateUserDto){
        return {
            message: "User created successfully",
            data: createUser
        }
    }

    updateUser(updateUserDto: UpdateUserDto, id:string){
        return {
            message : "User Updated ",
            data:{id, ...updateUserDto}
        }
    }

    deleteUser(id:number){
        const user = this.users.find((user)=> user.id == id)

        return {
            message: "User Deleted",
            data:user
        }
    }

}
