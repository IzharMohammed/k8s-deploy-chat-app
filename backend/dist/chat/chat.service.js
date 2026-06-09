"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rxjs_1 = require("rxjs");
const chat_entity_1 = require("./chat.entity");
let ChatService = class ChatService {
    httpService;
    configService;
    chatRepository;
    aiBackendUrl;
    constructor(httpService, configService, chatRepository) {
        this.httpService = httpService;
        this.configService = configService;
        this.chatRepository = chatRepository;
        this.aiBackendUrl = this.configService.get('AI_BACKEND_URL', 'http://ai-backend-service:8000');
    }
    async getChatReply(message, history) {
        const payload = {
            message,
            conversation_history: history,
        };
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.aiBackendUrl}/chat`, payload));
            const data = response.data;
            const chat = this.chatRepository.create({
                userMessage: message,
                aiReply: data.reply,
            });
            await this.chatRepository.save(chat);
            return data;
        }
        catch (error) {
            console.error('Error calling AI backend:', error.message);
            throw error;
        }
    }
    async getAllChats() {
        return this.chatRepository.find({
            order: {
                createdAt: 'DESC',
            },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map