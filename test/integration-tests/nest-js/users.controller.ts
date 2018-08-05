import {Controller, Get, Post} from '@nestjs/common';

@Controller('users/:user_id')
export class UsersController {

    @Post()
    async createApp() {
        return {
            result: 'success'
        }
    }

    @Get('app-id/:app_id')
    async getUser() {
        return {
            app_id: 'some_app_id'
        }
    }
}