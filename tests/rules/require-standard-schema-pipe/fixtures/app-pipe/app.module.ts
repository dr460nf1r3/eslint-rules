import { Module } from '@nestjs/common';
import { CoreModule } from './core/index.js';

@Module({ imports: [CoreModule] })
export class AppModule {}
