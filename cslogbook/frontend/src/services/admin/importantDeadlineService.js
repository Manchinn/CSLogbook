import apiClient from "../apiClient";

// ดึงกำหนดการสำคัญทั้งหมด (option: filter)
export const getDeadlines = (params) =>
  apiClient.get("/admin/important-deadlines", { params });

// เพิ่มกำหนดการใหม่
export const createDeadline = (data) =>
  apiClient.post("/admin/important-deadlines", data);

// แก้ไขกำหนดการ
export const updateDeadline = (id, data) =>
  apiClient.put(`/admin/important-deadlines/${id}`, data);

// ลบกำหนดการ
export const deleteDeadline = (id) =>
  apiClient.delete(`/admin/important-deadlines/${id}`);
