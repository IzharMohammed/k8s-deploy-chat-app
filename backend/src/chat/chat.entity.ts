import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  userMessage: string;

  @Column({ type: 'text' })
  aiReply: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
