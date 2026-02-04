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

  describe('checkDatabaseConnection', () => {
    it('should return healthy status when database connection is successful', async () => {
      mockHealthCheckService.checkDatabaseConnection.mockResolvedValue(true);

      const result = await controller.checkDatabaseConnection();

      expect(result).toEqual({
        serving: true,
        message: 'Database connection is healthy',
      });
      expect(mockHealthCheckService.checkDatabaseConnection).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when database connection fails', async () => {
      mockHealthCheckService.checkDatabaseConnection.mockResolvedValue(false);

      const result = await controller.checkDatabaseConnection();

      expect(result).toEqual({
        serving: false,
        message: 'Database connection failed',
      });
      expect(mockHealthCheckService.checkDatabaseConnection).toHaveBeenCalledTimes(1);
    });
  });
});
