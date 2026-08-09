import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CONFIG, type AppConfig } from '../config/configuration';
import { StoreModule } from '../store/store.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    PassportModule,
    StoreModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({ signOptions: {} }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokensService,
    JwtAccessStrategy,
    JwtAuthGuard,
    {
      provide: GoogleStrategy,
      useFactory: (config: AppConfig) =>
        config.googleClientId && config.googleClientSecret
          ? new GoogleStrategy(config)
          : null,
      inject: [CONFIG],
    },
  ],
  exports: [AuthService, TokensService, JwtAccessStrategy, JwtAuthGuard],
})
export class AuthModule {}
