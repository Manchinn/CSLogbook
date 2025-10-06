// Lazy load ส่วน chart จาก @ant-design/plots เพื่อลด initial bundle
// ใช้ React.lazy แยก Pie / Bar / Line แต่ละตัว
import React from 'react';

const loadModule = () => import('@ant-design/plots');

export const LazyPie = React.lazy(() => loadModule().then(m => ({ default: m.Pie })));
export const LazyBar = React.lazy(() => loadModule().then(m => ({ default: m.Bar })));
export const LazyLine = React.lazy(() => loadModule().then(m => ({ default: m.Line })));

// ถ้าต้องเพิ่ม chart ประเภทอื่น ทำ pattern เดียวกัน เช่น Area, Column ฯลฯ
