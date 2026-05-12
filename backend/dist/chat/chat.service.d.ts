import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class ChatService {
    private readonly httpService;
    private readonly configService;
    private readonly aiBackendUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    getChatReply(message: string, history: any[]): Promise<any>;
}
