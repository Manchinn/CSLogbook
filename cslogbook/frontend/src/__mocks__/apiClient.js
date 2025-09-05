// Mock apiClient สำหรับใช้ในชุดเทส frontend
const apiClient = {
  post: jest.fn(),
  get: jest.fn(),
  defaults: { headers: { common: {} } }
};

export default apiClient;
