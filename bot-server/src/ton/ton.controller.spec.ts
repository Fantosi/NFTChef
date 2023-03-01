import { Test, TestingModule } from '@nestjs/testing';
import { TonController } from './ton.controller';

describe('TonController', () => {
  let controller: TonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TonController],
    }).compile();

    controller = module.get<TonController>(TonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
