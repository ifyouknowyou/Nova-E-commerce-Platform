import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SecurityModule } from '../security/security.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.getOrThrow<string>('jwtExpiresIn');
        return {
          secret: config.getOrThrow<string>('jwtSecret'),
          signOptions: { expiresIn: expiresIn as unknown as number },
        };
      },
    }),
    SecurityModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService],
  exports: [AuthService, TokensService],
})
export class AuthModule {}
