type ServerApi = {
  listen: jest.Mock<void, []>;
  resetHandlers: jest.Mock<void, []>;
  close: jest.Mock<void, []>;
};

export function setupServer(..._handlers: unknown[]): ServerApi {
  return {
    listen: jest.fn(),
    resetHandlers: jest.fn(),
    close: jest.fn(),
  };
}
