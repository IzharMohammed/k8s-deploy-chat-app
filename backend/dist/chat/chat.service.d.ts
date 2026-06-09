import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
export declare class ChatService {
    private readonly httpService;
    private readonly configService;
    private readonly chatRepository;
    private readonly aiBackendUrl;
    constructor(httpService: HttpService, configService: ConfigService, chatRepository: Repository<Chat>);
    getChatReply(message: string, history: any[]): Promise<any>;
    getAllChats(): Promise<Chat[]>;
}
