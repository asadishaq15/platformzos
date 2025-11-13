import React, { useEffect, useRef, useState } from "react";
import "./inner-platform.css";

const InnerPlatform = () => {
  const innerBubblesCount = 4;
  const innerOrbitRef = useRef(null);
  const innerCircleRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false, returning: false });
  const animationFrameRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Initialize particles
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setContainerDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
      
      // Clear existing particles and recreate them
      particlesRef.current = [];
      initializeParticles();
    };
    
    // Initialize particles with multiple chunks
    const initializeParticles = () => {
      const particleCount = 800;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const spreadRadius = Math.min(width, height) * 0.3;
      
      // Create multiple chunks of stars across the screen
      // Top left chunk
      createChunk(width * 0.25, height * 0.25, particleCount * 0.25, spreadRadius);
      
      // Top right chunk
      createChunk(width * 0.75, height * 0.25, particleCount * 0.25, spreadRadius);
      
      // Bottom left chunk
      createChunk(width * 0.25, height * 0.75, particleCount * 0.25, spreadRadius);
      
      // Bottom right chunk
      createChunk(width * 0.75, height * 0.75, particleCount * 0.25, spreadRadius);
      
      // Create a more uniform distribution across the entire screen
      for (let i = 0; i < particleCount * 0.25; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        
        particlesRef.current.push({
          x,
          y,
          size: 0.5 + Math.random() * 1.5,
          baseX: x,
          baseY: y,
          density: Math.random() * 30 + 1,
          color: `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.3})`,
          velocityX: 0,
          velocityY: 0,
          friction: 0.95,
        });
      }
    };
    
    const createChunk = (centerX, centerY, count, spread) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * spread;
        // Ensure stars stay within viewport
        const x = Math.min(Math.max(centerX + Math.cos(angle) * radius, 0), width);
        const y = Math.min(Math.max(centerY + Math.sin(angle) * radius, 0), height);
        
        particlesRef.current.push({
          x,
          y,
          size: 0.5 + Math.random() * 1.5,
          baseX: x,
          baseY: y,
          density: Math.random() * 30 + 1,
          color: `rgba(59, 130, 246, ${Math.random() * 0.5 + 0.3})`,
          velocityX: 0,
          velocityY: 0,
          friction: 0.95,
        });
      }
    };
    
    // Initialize particles
    initializeParticles();
    
    // Event listeners for mouse movement with reduced repulsion area
    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
        returning: false, // cancel returning if user moves mouse back in
      };
    };
    
    const handleMouseLeave = () => {
      // stop active repulsion and start "return-to-base" mode
      mouseRef.current.active = false;
      mouseRef.current.returning = true;
    
      // zero out velocities to avoid any residual momentum / bounce
      particlesRef.current.forEach(p => {
        p.velocityX = 0;
        p.velocityY = 0;
      });
    };
    
    window.addEventListener('resize', updateDimensions);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Modified animation loop with reduced repulsion distance
useEffect(() => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    const centerX = containerDimensions.width / 2;
    const centerY = containerDimensions.height / 2;

    // new local settings for repulsion
    const REPULSION_RADIUS = 50;   // <-- reduced radius (was 70)
    const REPULSION_STRENGTH = 4;  // <-- reduced force (was 6)

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // draw
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      // If we're in "returning" mode (mouse has left) - lerp positions directly
      if (!mouse.active && mouse.returning) {
        // smooth interpolation back to base position (no velocities used)
        const lerpFactor = 0.08; // smaller = slower, larger = faster
        const dxBase = p.baseX - p.x;
        const dyBase = p.baseY - p.y;

        p.x += dxBase * lerpFactor;
        p.y += dyBase * lerpFactor;

        // keep velocities zero while returning (prevents overshoot/bounce)
        p.velocityX = 0;
        p.velocityY = 0;

        // If particle is very close to base, snap it to avoid tiny floating differences
        if (Math.abs(dxBase) < 0.4 && Math.abs(dyBase) < 0.4) {
          p.x = p.baseX;
          p.y = p.baseY;
        }

        // skip the rest of the force updates for this particle
        continue;
      }

      // Gentle pull back toward base (allows small motion during interaction)
      p.velocityX += (p.baseX - p.x) * 0.005;
      p.velocityY += (p.baseY - p.y) * 0.005;

      // Mouse repulsion (only when mouse active)
      if (mouse.active) {
        const mx = mouse.x - p.x;
        const my = mouse.y - p.y;
        const mouseDistance = Math.sqrt(mx * mx + my * my);

        if (mouseDistance > 0 && mouseDistance < REPULSION_RADIUS) {
          const force = (REPULSION_RADIUS - mouseDistance) / REPULSION_RADIUS;
          const repulsionForce = force * REPULSION_STRENGTH;

          // normalized direction away from mouse
          p.velocityX -= (mx / mouseDistance) * repulsionForce;
          p.velocityY -= (my / mouseDistance) * repulsionForce;
        }
      }

      // Apply velocity and friction
      p.x += p.velocityX;
      p.y += p.velocityY;

      p.velocityX *= p.friction;
      p.velocityY *= p.friction;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };
}, [containerDimensions]);
useEffect(() => {
  const innerOrbit = innerOrbitRef.current;
  const innerCircle = innerCircleRef.current;

  if (innerOrbit) {
    // use the CSS variable for one single source of truth
    innerOrbit.style.animation = "rotate var(--orbit-duration) linear infinite";
  }
  if (innerCircle) {
    // slightly faster glow to keep the whole composition feeling snappier
    innerCircle.style.animation = "glow 8s ease-in-out infinite";
  }
}, []);


  const createInnerBubbles = () => {
    const bubbles = [];
    const orbitRadius = 250; // Distance from center to bubble centers
    const coreRadius = 110; // Core slim ring radius (220px / 2)
  
    const innerBubblesData = [
      { name: "ORDER MANAGEMENT", position: "top" },
      { 
        name: (
          <>
            MARKETPLACES & RETAIL CHANNELS
            <br />
            (1P & 3P)
          </>
        ),
        position: "right"
      },
      { name: "PORTALS", position: "bottom" },
      { name: "FULFILLMENT & LOGISTICS", position: "left" },
    ];
    
  
    for (let i = 0; i < innerBubblesCount; i++) {
      const angle = (i / innerBubblesCount) * 2 * Math.PI - Math.PI / 4; // Start from top
      const x = Math.round(orbitRadius * Math.cos(angle));
      const y = Math.round(orbitRadius * Math.sin(angle));
  
      // Calculate line length - distance from core ring to bubble position
      const lineLength = orbitRadius - coreRadius;
      
      // Determine if this bubble has outer text
      const hasOuterText = innerBubblesData[i].outerText;

      // Calculate outer text position - move it farther from the center
      const outerTextPositioning = () => {
        // Handle the PORTALS (bottom) and MARKETPLACES (right) differently
        if (innerBubblesData[i].position === "bottom") {
          return {
            position: 'absolute',
            width: '150px',
            textAlign: 'center',
            top: '70px',
            right: '90%',
            transform: 'translateX(-50%)',
            animation: 'counter-rotate 140s linear infinite'
          };
        } else if (innerBubblesData[i].position === "right") {
          return {
            position: 'absolute',
            width: '120px',
            textAlign: 'left',
            right: '-125px',
            top: '20%',
            transform: 'translateY(-50%)',
            animation: 'counter-rotate 140s linear infinite'
          };
        }
      };
  
      bubbles.push(
        <div
          className="platform-bubble-container"
          key={`inner-${i}`}
          style={{
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          {/* Connection line */}
          <div
            className="connection-line"
            style={{
              width: `${lineLength}px`,
              transform: `rotate(${(angle * 180) / Math.PI + 180}deg)`, // +180 to point toward core
              transformOrigin: "0 0",
              position: "absolute",
              left: "0",
              top: "0",
            }}
          >
            <div className="energy-pulse"></div>
          </div>

          <div className="platform-bubble inner-bubble">
  {/* keep label wrapper but add counter-rotate wrapper inside */}
  <div className="bubble-label">
    <div className="counter-rotate-text">
      {innerBubblesData[i].name}
    </div>
  </div>
</div>
        </div>
      );
    }
  
    return bubbles;
  };

  return (
    <div className="full-page-container" ref={containerRef}>
      {/* Particle effect canvas */}
      <canvas 
        ref={canvasRef}
        className="particle-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2
        }}
      />
      
      <div className="orbital-platform-container inner-only">
        <div className="platform-core">
          <div className="core-slim-ring" />
          <div className="core-content">
            <div className="core-title">AI-AUTOMATED</div>
            <div className="core-title">OMNICHANNEL</div>
            <div className="core-title">PLATFORM</div>
          </div>
        </div>
        
        <div className="inner-solid-ring" />
        <div ref={innerOrbitRef} className="inner-orbit-circle">
          {createInnerBubbles()}
        </div>
      </div>
    </div>
  );
};

export default InnerPlatform;