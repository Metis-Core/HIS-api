import { Test, TestingModule } from '@nestjs/testing';
import { ConsultationController } from './consultation.controller';

describe('ConsultationController', () => {
  let controller: ConsultationController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultationController],
    })
      .useMocker(() => ({}))
      .compile();
    controller = module.get(ConsultationController);
  });

  it('should be defined', () => {
    // Arrange / Act / Assert
    expect(controller).toBeDefined();
  });
});
