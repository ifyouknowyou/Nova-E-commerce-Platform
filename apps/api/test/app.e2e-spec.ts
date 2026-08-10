import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * End-to-end smoke tests. Requires PostgreSQL + Redis running (docker compose up).
 */
describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api returns app info (public)', async () => {
    const res = await request(app.getHttpServer()).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.name).toContain('NOVA');
  });

  it('GET /api/health reports db up', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.db).toBe('up');
  });

  it('GET /api/users/me requires authentication', async () => {
    const res = await request(app.getHttpServer()).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('seeded admin can sign in and view platform overview', async () => {
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'admin@nova.test',
      password: 'AdminPassw0rd!',
    });
    expect(login.status).toBe(200);
    const token = login.body.accessToken as string;
    expect(token).toBeTruthy();

    const me = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.roles).toContain('ADMIN');

    const overview = await request(app.getHttpServer())
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${token}`);
    expect(overview.status).toBe(200);
    expect(overview.body).toHaveProperty('revenue');
  });
});
