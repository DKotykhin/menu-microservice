import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from '../health-check.controller';
import { HealthCheckService } from '../health-check.service';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;

  const mockHealthCheckService = {
    checkDatabaseConnection: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
      ],
    }).compile();

    controller = module.get<HealthCheckController>(HealthCheckController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return healthy status', () => {
      const result = controller.checkHealth();

      expect(result).toEqual({
        serving: true,
        message: 'Menu microservice is healthy',
      });
    });
  });
});
