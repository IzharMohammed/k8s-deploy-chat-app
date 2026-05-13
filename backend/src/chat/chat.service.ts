import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  private readonly aiBackendUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiBackendUrl = this.configService.get<string>('AI_BACKEND_URL', 'http://ai-backend-service:8000');
  }

  async getChatReply(message: string, history: any[]) {
    const payload = {
      message,
      conversation_history: history,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiBackendUrl}/chat`, payload),
      );
      return response.data;
    } catch (error) {
      console.error('Error calling AI backend:', error.message);
      throw error;
    }
  }
}
