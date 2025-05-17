import React, { useEffect, useRef } from 'react';

// Role-specific particle colors
const ROLE_COLORS = {
  student: ['#e6f7ff', '#bae7ff', '#91d5ff'],
  teacher: ['#fff7e6', '#ffe7ba', '#ffd591'],
  admin: ['#fff1f0', '#ffccc7', '#ffa39e'],
  default: ['#e6f7ff', '#bae7ff', '#91d5ff'],
};

// Particle configuration
const PARTICLE_CONFIG = {
  count: 45, // เพิ่มจำนวน particles
  maxSize: 8, // เพิ่มขนาดสูงสุด
  minSize: 3, // เพิ่มขนาดต่ำสุด
  maxSpeed: 0.3, // เพิ่มความเร็วสูงสุด
  minSpeed: 0.1, // เพิ่มความเร็วต่ำสุด
  opacity: 0.3, // เพิ่มความทึบเล็กน้อย
  
  // Configuration for connections between particles
  connections: {
    enabled: true,               // เปิดใช้งานการเชื่อมต่อระหว่าง particles
    maxDistance: 150,            // ระยะห่างสูงสุดที่จะวาดเส้นเชื่อม
    lineWidth: 0.5,              // ความหนาของเส้น
    opacity: 0.1,                // ความทึบของเส้น
    showForPercentage: 0.4       // แสดงเส้นเชื่อมเฉพาะ % ของ particles (ลดการคำนวณ)
  },
  
  // Get colors based on user role
  getColors: () => {
    const role = localStorage.getItem('role') || 'default';
    return ROLE_COLORS[role] || ROLE_COLORS.default;
  }
};

const BackgroundParticles = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const animationFrameId = useRef(null);

  // Initialize particles
  const initParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    particles.current = [];
      for (let i = 0; i < PARTICLE_CONFIG.count; i++) {      const colors = PARTICLE_CONFIG.getColors();
      // สร้างขนาดแบบไม่เป็นเส้นตรง (non-linear) เพื่อให้มีความหลากหลายมากขึ้น
      const sizeVariation = Math.pow(Math.random(), 2); // Non-linear distribution
      const size = PARTICLE_CONFIG.minSize + sizeVariation * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize);
      
      // กำหนดความเร็วที่แตกต่างกัน และบางอันอาจเคลื่อนที่เร็วกว่า
      const speedFactor = Math.random() > 0.8 ? 1.5 : 1; // 20% ของ particles จะเร็วกว่า
      const baseSpeed = PARTICLE_CONFIG.minSpeed + Math.random() * (PARTICLE_CONFIG.maxSpeed - PARTICLE_CONFIG.minSpeed);
      
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: size,
        speedX: (Math.random() - 0.5) * 2 * baseSpeed * speedFactor,
        speedY: (Math.random() - 0.5) * 2 * baseSpeed * speedFactor,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: PARTICLE_CONFIG.opacity * (0.7 + Math.random() * 0.5), // ความทึบที่แตกต่างกัน
        initialSize: size, // เก็บขนาดเริ่มต้นไว้สำหรับการ pulse
        pulseDirection: Math.random() > 0.5 ? 1 : -1, // ทิศทางของการ pulse
        pulseSpeed: 0.01 + Math.random() * 0.02, // ความเร็วในการ pulse
      });
    }
  };

  // Animation loop  // Draw connections between particles
  const drawConnections = (ctx, allParticles) => {
    if (!PARTICLE_CONFIG.connections || !PARTICLE_CONFIG.connections.enabled) return;
    
    // Limit connections to reduce CPU usage
    const connectionThreshold = PARTICLE_CONFIG.connections.showForPercentage || 0.4;
    
    // วนลูปเพื่อหาเส้นเชื่อมระหว่าง particles
    for (let i = 0; i < allParticles.length; i++) {
      // สุ่มว่าจะแสดงเส้นเชื่อมสำหรับ particle นี้หรือไม่
      if (Math.random() > connectionThreshold) continue;
      
      const p1 = allParticles[i];
      
      for (let j = i + 1; j < allParticles.length; j++) {
        const p2 = allParticles[j];
        
        // คำนวณระยะห่าง
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // วาดเส้นถ้าอยู่ในระยะที่กำหนด
        if (distance < (PARTICLE_CONFIG.connections.maxDistance || 150)) {
          // ความทึบจะลดลงตามระยะทาง
          const opacity = 
            (PARTICLE_CONFIG.connections.opacity || 0.1) * 
            (1 - distance / (PARTICLE_CONFIG.connections.maxDistance || 150));
          
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = p1.color; // ใช้สีของ particle
          ctx.lineWidth = PARTICLE_CONFIG.connections.lineWidth || 0.5;
          ctx.globalAlpha = opacity;
          ctx.stroke();
        }
      }
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections first (so they appear behind particles)
    if (PARTICLE_CONFIG.connections && PARTICLE_CONFIG.connections.enabled) {
      drawConnections(ctx, particles.current);
    }
    
    particles.current.forEach(particle => {
      // ทำการ pulse size (เปลี่ยนขนาดเป็นจังหวะ)
      const pulseFactor = Math.sin(Date.now() * 0.001 * particle.pulseSpeed) * 0.2;
      const currentSize = particle.initialSize * (1 + pulseFactor * particle.pulseDirection);
      
      // ใช้ค่าความทึบแบบแต่ละ particle
      ctx.globalAlpha = particle.opacity;
      
      // วาด particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
      
      // อัพเดตตำแหน่ง
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around edges (ห่อรอบขอบจอ)
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
    });
    
    animationFrameId.current = requestAnimationFrame(animate);
  };

  // Handle window resize
  const handleResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
  };
  useEffect(() => {
    initParticles();
    animate();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
