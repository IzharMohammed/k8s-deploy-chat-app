import { Controller, Post, Get, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  async chat(@Body() body: { message: string; history: any[] }) {
    const { message, history } = body;
    return this.chatService.getChatReply(message, history);
  }

  @Get('chats')
  async getAllChats() {
    return this.chatService.getAllChats();
  }
}
