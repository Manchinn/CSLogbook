import React, { useEffect, useRef, useCallback } from 'react';
import { getParticleColors } from '../../utils/roleColors';

// Particle configuration
const PARTICLE_CONFIG = {
  count: 25,
  maxSize: 8,
  minSize: 3,
  maxSpeed: 0.3,
  minSpeed: 0.1,
  opacity: 0.3,
  
  connections: {
    enabled: true,
    maxDistance: 100,
    lineWidth: 0.5,
    opacity: 0.1,
    showForPercentage: 0.4
  },
  
  getColors: () => {
    const role = localStorage.getItem('role');
    const teacherType = localStorage.getItem('teacherType');
    return getParticleColors(role, teacherType);
  }
};

const BackgroundParticles = () => {
  // ใช้ useRef สำหรับ canvas element โดยตรง
  const canvasRef = useRef(null);
  
  // ใช้ useRef สำหรับเก็บข้อมูลที่ไม่ต้อง re-render
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const isTabActiveRef = useRef(true);

  // ใช้ useCallback เพื่อป้องกันการสร้างฟังก์ชันใหม่ทุกครั้ง
  const debounce = useCallback((func, delay) => {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }, []);

  // ฟังก์ชันสำหรับสร้าง particles เริ่มต้น
  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particlesRef.current = [];
    
    for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
      const colors = PARTICLE_CONFIG.getColors();
      const sizeVariation = Math.pow(Math.random(), 2);
      const size = PARTICLE_CONFIG.minSize + sizeVariation * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize);
      const speedFactor = Math.random() > 0.8 ? 1.5 : 1;
      const baseSpeed = PARTICLE_CONFIG.minSpeed + Math.random() * (PARTICLE_CONFIG.maxSpeed - PARTICLE_CONFIG.minSpeed);
      
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: size,
        speedX: (Math.random() - 0.5) * 2 * baseSpeed * speedFactor,
        speedY: (Math.random() - 0.5) * 2 * baseSpeed * speedFactor,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: PARTICLE_CONFIG.opacity * (0.7 + Math.random() * 0.5),
        initialSize: size,
        pulseDirection: Math.random() > 0.5 ? 1 : -1,
        pulseSpeed: 0.01 + Math.random() * 0.02,
      });
    }
  }, []);

  // ฟังก์ชันสำหรับวาดเส้นเชื่อมระหว่าง particles
  const drawConnections = useCallback((ctx, allParticles) => {
    if (!PARTICLE_CONFIG.connections?.enabled) return;
    
    const connectionThreshold = PARTICLE_CONFIG.connections.showForPercentage || 0.4;
    
    for (let i = 0; i < allParticles.length; i++) {
      if (Math.random() > connectionThreshold) continue;
      
      const p1 = allParticles[i];
      
      for (let j = i + 1; j < allParticles.length; j++) {
        const p2 = allParticles[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < PARTICLE_CONFIG.connections.maxDistance) {
          const opacity = 
            PARTICLE_CONFIG.connections.opacity * 
            (1 - distance / PARTICLE_CONFIG.connections.maxDistance);
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = p1.color;
          ctx.lineWidth = PARTICLE_CONFIG.connections.lineWidth;
          ctx.globalAlpha = opacity;
          ctx.stroke();
        }
      }
    }
  }, []);

  // ฟังก์ชัน animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    
    // ตรวจสอบว่า canvas มีอยู่และ tab เป็น active
    if (!canvas || !isTabActiveRef.current) {
      if (isTabActiveRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
      return;
    }
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // วาดเส้นเชื่อมก่อน (เพื่อให้อยู่ด้านหลัง particles)
    if (PARTICLE_CONFIG.connections?.enabled) {
      drawConnections(ctx, particlesRef.current);
    }
    
    // วาดและอัพเดต particles
    particlesRef.current.forEach(particle => {
      const pulseFactor = Math.sin(Date.now() * 0.001 * particle.pulseSpeed) * 0.2;
      const currentSize = particle.initialSize * (1 + pulseFactor * particle.pulseDirection);
      
      ctx.globalAlpha = particle.opacity;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // อัพเดตตำแหน่ง
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // ห่อรอบขอบจอ
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
    });
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawConnections]);

  // ฟังก์ชันจัดการ window resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (isTabActiveRef.current) {
      initParticles();
    }
  }, [initParticles]);

  // ฟังก์ชันจัดการ Page Visibility
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      isTabActiveRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      isTabActiveRef.current = true;
      initParticles();
      animate();
    }
  }, [initParticles, animate]);

  useEffect(() => {
    // สร้าง debounced version ของ handleResize
    const debouncedHandleResize = debounce(handleResize, 250);
    
    // เริ่มต้น particles และ animation
    initParticles();
    animate();
    
    // เพิ่ม event listeners
    window.addEventListener('resize', debouncedHandleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [debounce, handleResize, handleVisibilityChange, initParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

export default BackgroundParticles;
