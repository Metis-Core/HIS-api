import { BadRequestException } from '@nestjs/common';
import { resolveWindow } from './resolve-window';

const NOW = new Date('2026-10-18T09:00:00Z');

describe('resolveWindow', () => {
  it('defaults to the last seven days ending today', () => {
    expect(resolveWindow({}, NOW)).toEqual({
      from: '2026-10-12',
      to: '2026-10-18',
    });
  });

  it('keeps an explicit range', () => {
    expect(
      resolveWindow({ from: '2026-09-01', to: '2026-09-30' }, NOW),
    ).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
    });
  });

  it('rejects a range that ends before it starts or is longer than a year', () => {
    expect(() =>
      resolveWindow({ from: '2026-10-10', to: '2026-10-01' }, NOW),
    ).toThrow(BadRequestException);
    expect(() =>
      resolveWindow({ from: '2024-01-01', to: '2026-01-01' }, NOW),
    ).toThrow(BadRequestException);
  });
});
