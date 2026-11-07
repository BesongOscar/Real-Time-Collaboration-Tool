import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) returns 200 inside the response envelope', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('ok');
        expect(typeof res.body.data.timestamp).toBe('string');
      });
  });

  it('/ (GET) is wrapped in the response envelope', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ success: true, data: 'Hello World!' });
      });
  });

  it('unknown routes are wrapped in the error envelope', () => {
    return request(app.getHttpServer())
      .get('/does-not-exist')
      .expect(404)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('NOT_FOUND');
      });
  });
});
