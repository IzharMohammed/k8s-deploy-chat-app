import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: { message: string; history: any[] }) {
    const { message, history } = body;
    return this.chatService.getChatReply(message, history);
  }
}
