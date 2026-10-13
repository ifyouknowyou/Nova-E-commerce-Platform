import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AddressesModule } from './addresses/addresses.module';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CsrfGuard } from './auth/guards/csrf.guard';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './rbac/guards/permissions.guard';
import { RolesGuard } from './rbac/guards/roles.guard';
import { ExcludeRolesGuard } from './rbac/guards/exclude-roles.guard';
import { BrandsModule } from './brands/brands.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { CouponsModule } from './coupons/coupons.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrganizationModule } from './organization/organization.module';
import { UploadsModule } from './uploads/uploads.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { ReturnsModule } from './returns/returns.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ProductsModule } from './products/products.module';
import { SearchModule } from './search/search.module';
import { SettingsModule } from './settings/settings.module';
import { RbacModule } from './rbac/rbac.module';
import { RedisModule } from './redis/redis.module';
import { SellerModule } from './seller/seller.module';
import { StoreModule } from './store/store.module';
import { UsersModule } from './users/users.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RedisModule,
    MailModule,
    RbacModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    CouponsModule,
    OrdersModule,
    PaymentsModule,
    StoreModule,
    SellerModule,
    OrganizationModule,
    AdminModule,
    ReportsModule,
    ReviewsModule,
    NotificationsModule,
    ReturnsModule,
    SearchModule,
    SettingsModule,
    UploadsModule,
    WishlistModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards run in declaration order: rate-limit first, then
    // authentication, then role/permission checks (which depend on request.user).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ExcludeRolesGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
