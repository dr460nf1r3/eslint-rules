import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { StandardSchemaValidationPipe } from 'nestjs-standard-schema';

@Module({ providers: [{ provide: APP_PIPE, useValue: new StandardSchemaValidationPipe() }] })
export class CoreModule {}
