import apiClient from "../apiClient";

// ดึงกำหนดการสำคัญทั้งหมด (option: filter)
export const getDeadlines = (params = {}) => {
  const query = { ...params };
  // ลบพารามิเตอร์ที่เป็น null/undefined เพื่อไม่ให้ query string สับสน
  Object.keys(query).forEach((key) => {
    if (query[key] === null || query[key] === undefined || query[key] === "") {
      delete query[key];
    }
  });
  return apiClient.get("/admin/important-deadlines", { params: query });
};

// เพิ่มกำหนดการใหม่
export const createDeadline = (data) =>
  apiClient.post("/admin/important-deadlines", data);

// แก้ไขกำหนดการ
export const updateDeadline = (id, data) =>
  apiClient.put(`/admin/important-deadlines/${id}`, data);

// ลบกำหนดการ
export const deleteDeadline = (id) =>
  apiClient.delete(`/admin/important-deadlines/${id}`);
