import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { DatabaseService } from './service/database.service';
import { JwtModule } from '@nestjs/jwt';
import { AccountDetailController } from './controller/account-detail.controller';
import { AccountDetailService } from './service/account-detail.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { EmailService } from './service/email.service';
import { OtpService } from './service/otp.service';
import { CopyTradeDetailsGateway } from './service/copy-trade-details.gateway';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AppController, AuthController, AccountDetailController],
  providers: [AppService, AuthService, DatabaseService, AccountDetailService, JwtStrategy, EmailService, OtpService, CopyTradeDetailsGateway],
})
export class AppModule {}
