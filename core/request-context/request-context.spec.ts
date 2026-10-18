import { resolveCorrelationId } from './request-context.middleware';
import { RequestContext } from './request-context';

describe('RequestContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes the caller only inside the request scope', () => {
    // Arrange
    const store = { correlationId: 'req-1' };
    // Act
    const inside = RequestContext.run(store, () => {
      RequestContext.setCurrentUserId('user-1');
      return {
        userId: RequestContext.getCurrentUserId(),
        correlationId: RequestContext.getCorrelationId(),
      };
    });
    // Assert
    expect(inside).toEqual({ userId: 'user-1', correlationId: 'req-1' });
    expect(RequestContext.getCurrentUserId()).toBeUndefined();
  });

  it('keeps a well-formed inbound request id', () => {
    // Arrange
    const inbound = 'abc-123_x.y';
    // Act
    const id = resolveCorrelationId(inbound);
    // Assert
    expect(id).toBe(inbound);
  });

  it('replaces a malformed or missing request id with a UUID', () => {
    // Arrange
    const malformed = 'bad id\nwith newline';
    // Act
    const replaced = resolveCorrelationId(malformed);
    const generated = resolveCorrelationId(undefined);
    // Assert
    expect(replaced).toMatch(/^[0-9a-f-]{36}$/);
    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });
});
