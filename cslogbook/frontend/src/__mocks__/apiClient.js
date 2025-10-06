// Mock apiClient สำหรับใช้ในชุดเทส frontend
const createMockPromise = (data = {}) => Promise.resolve({ data });

const apiClient = {
  get: jest.fn(() => createMockPromise()),
  post: jest.fn(() => createMockPromise()),
  put: jest.fn(() => createMockPromise()),
  patch: jest.fn(() => createMockPromise()),
  delete: jest.fn(() => createMockPromise()),
  interceptors: {
    request: {
      use: jest.fn(() => Symbol('mock-request-interceptor')),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(() => Symbol('mock-response-interceptor')),
      eject: jest.fn(),
    },
  },
  defaults: { headers: { common: {} } },
};
module.exports = apiClient;
module.exports.default = apiClient;
module.exports.__esModule = true;
