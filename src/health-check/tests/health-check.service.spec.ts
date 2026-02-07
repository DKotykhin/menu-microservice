import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '../health-check.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAppConnections', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return serving true when all dependencies are healthy', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const resultPromise = service.checkAppConnections();

      jest.advanceTimersByTime(3000);

      const result = await resultPromise;

      expect(result.serving).toBe(true);
      expect(result.message).toBe('All dependencies are healthy');
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: 'postgres', healthy: true })]),
      );
    });

    it('should return serving false when postgres is unhealthy', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

      const resultPromise = service.checkAppConnections();

      jest.advanceTimersByTime(3000);

      const result = await resultPromise;

      expect(result.serving).toBe(false);
      expect(result.message).toBe('One or more dependencies are unhealthy');
      expect(result.dependencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'postgres', healthy: false, message: 'connection refused' }),
        ]),
      );
    });

    it('should include latencyMs for each dependency', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const resultPromise = service.checkAppConnections();

      jest.advanceTimersByTime(3000);

      const result = await resultPromise;

      for (const dep of result.dependencies) {
        expect(typeof dep.latencyMs).toBe('number');
        expect(dep.latencyMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle non-Error rejection values', async () => {
      prisma.$queryRaw.mockRejectedValue('string error');

      const resultPromise = service.checkAppConnections();

      jest.advanceTimersByTime(3000);

      const result = await resultPromise;

      expect(result.serving).toBe(false);
      expect(result.dependencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'postgres', healthy: false, message: 'string error' }),
        ]),
      );
    });

    it('should return unhealthy when a dependency times out', async () => {
      prisma.$queryRaw.mockReturnValue(new Promise(() => {}) as never);

      const resultPromise = service.checkAppConnections();

      jest.advanceTimersByTime(3000);

      const result = await resultPromise;

      expect(result.serving).toBe(false);
      expect(result.dependencies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'postgres',
            healthy: false,
            message: 'postgres health check timed out',
          }),
        ]),
      );
    });
  });
});
