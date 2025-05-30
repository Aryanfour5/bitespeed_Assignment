import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar' })
  phoneNumber: string;

  @Column({ nullable: true, type: 'varchar' })
  email: string;

  @Column({ nullable: true, type: 'int' })
  linkedId: number;

  @Column({
    type: 'enum',
    enum: ['primary', 'secondary'],
    default: 'primary'
  })
  linkPrecedence: 'primary' | 'secondary';

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date;
}
