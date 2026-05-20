import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Chat } from './chat.entity';

@Injectable()
export class ChatService {
  private readonly aiBackendUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
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
      const data = response.data;

      // Save userMessage + aiReply to the database
      const chat = this.chatRepository.create({
        userMessage: message,
        aiReply: data.reply,
      });
      await this.chatRepository.save(chat);

      return data;
    } catch (error) {
      console.error('Error calling AI backend:', error.message);
      throw error;
    }
  }

  async getAllChats(): Promise<Chat[]> {
    return this.chatRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
