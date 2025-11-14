// InnerPlatform.jsx - Updated code
"use client";

import React, { useEffect, useRef, useState } from "react";
import "./inner-platform.css";

const InnerPlatform = () => {
  const innerBubblesCount = 5; // now 5 bubbles
  const innerOrbitRef = useRef(null);
  const innerCircleRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false, returning: false });
  const rotatingRingRef = useRef(null); // Reference for the new rotating ring

  const baseDelay = 0.85;
  const stagger = 0.25;
  const ringExtraDelay = 0.2;
  const ringDelay = baseDelay + ringExtraDelay;

  const animationFrameRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setContainerDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;

      particlesRef.current = [];
      initializeParticles();
    };

    const initializeParticles = () => {
      const particleCount = 800;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const spreadRadius = Math.min(width, height) * 0.3;

      createChunk(width * 0.25, height * 0.25, particleCount * 0.25, spreadRadius);
      createChunk(width * 0.75, height * 0.25, particleCount * 0.25, spreadRadius);
      createChunk(width * 0.25, height * 0.75, particleCount * 0.25, spreadRadius);
      createChunk(width * 0.75, height * 0.75, particleCount * 0.25, spreadRadius);

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

    initializeParticles();

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
        returning: false,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.returning = true;

      particlesRef.current.forEach((p) => {
        p.velocityX = 0;
        p.velocityY = 0;
      });
    };

    window.addEventListener("resize", updateDimensions);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const centerX = containerDimensions.width / 2;
      const centerY = containerDimensions.height / 2;

      const REPULSION_RADIUS = 50;
      const REPULSION_STRENGTH = 4;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        if (!mouse.active && mouse.returning) {
          const lerpFactor = 0.08;
          const dxBase = p.baseX - p.x;
          const dyBase = p.baseY - p.y;

          p.x += dxBase * lerpFactor;
          p.y += dyBase * lerpFactor;

          p.velocityX = 0;
          p.velocityY = 0;

          if (Math.abs(dxBase) < 0.4 && Math.abs(dyBase) < 0.4) {
            p.x = p.baseX;
            p.y = p.baseY;
          }

          continue;
        }

        p.velocityX += (p.baseX - p.x) * 0.005;
        p.velocityY += (p.baseY - p.y) * 0.005;

        if (mouse.active) {
          const mx = mouse.x - p.x;
          const my = mouse.y - p.y;
          const mouseDistance = Math.sqrt(mx * mx + my * my);

          if (mouseDistance > 0 && mouseDistance < REPULSION_RADIUS) {
            const force = (REPULSION_RADIUS - mouseDistance) / REPULSION_RADIUS;
            const repulsionForce = force * REPULSION_STRENGTH;

            p.velocityX -= (mx / mouseDistance) * repulsionForce;
            p.velocityY -= (my / mouseDistance) * repulsionForce;
          }
        }

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
    const rotatingRing = rotatingRingRef.current;

    if (innerOrbit) {
      innerOrbit.style.animation = "rotate var(--orbit-duration) linear infinite";
    }
    if (innerCircle) {
      innerCircle.style.animation = "glow 8s ease-in-out infinite";
    }
    if (rotatingRing) {
      rotatingRing.style.animation = "counter-rotate 45s linear infinite";
    }
  }, []);

  const innerBubblesData = [
    {
      title: "MARKETPLACES & RETAIL CHANNELS (1P / 3P / Hybrid)",
      subtitle: "Amazon, Chewy, Walmart, Target",
      position: "top",
    },
    {
      title: "ORDER MANAGEMENT",
      subtitle: "ERP, QuickBooks, Stripe, Plaid, and internal OMS APIs",
      position: "right",
    },
    {
      title: "PORTALS",
      subtitle: "Customer, Dealer, Referral, and Partner Portals",
      position: "bottom",
    },
    {
      title: "FULFILLMENT & LOGISTICS",
      subtitle: "ShipBob, ShipMonk, Amazon FBA, 3PL, WMS",
      position: "left",
    },
    {
      title: "EDI/API AGGREGATORS",
      subtitle: "Rithum, SPS Commerce, TrueCommerce, Linnworks etc",
      position: "bottom-left",
    },
  ];

  const createInnerBubbles = () => {
    const bubbles = [];
    const orbitRadius = 250;
    const coreRadius = 110;
    const bubbleRadius = 65; // Half the width of your inner bubble
  
    for (let i = 0; i < innerBubblesCount; i++) {
      const angle = (i / innerBubblesCount) * 2 * Math.PI - Math.PI / 4;
      const x = Math.round(orbitRadius * Math.cos(angle));
      const y = Math.round(orbitRadius * Math.sin(angle));
  
      // Calculate precise line length for alignment
      const lineLength = orbitRadius - coreRadius;
      
      bubbles.push(
        <div
          className="platform-bubble-container"
          key={`inner-${i}`}
          style={{
            transform: `translate(${x}px, ${y}px)`,
          }}
        >
          <div
            className="connection-line"
            style={{
              width: `${lineLength}px`,
              transform: `rotate(${(angle * 180) / Math.PI + 180}deg)`,
              transformOrigin: "0 50%", // Center the line vertically
              position: "absolute",
              left: "0",
              top: "50%", // Position at the center of the container
              marginTop: "-1.5px", // Half of the connection-line height
            }}
          >
            <div className="energy-pulse" />
          </div>
  
          <div
            className="platform-bubble inner-bubble"
            style={{
              animationDelay: `${baseDelay + i * stagger}s`,
              WebkitAnimationDelay: `${baseDelay + i * stagger}s`,
              position: "absolute",
              left: "50%", // Position at center of container
              top: "50%", // Position at center of container
              transform: "translate(-50%, -50%)", // Center the bubble perfectly
            }}
          >
            <div className="bubble-label">
              <div className="counter-rotate-text">
                <div className="bubble-title">{innerBubblesData[i].title}</div>
                <div className="bubble-subtext" style={{ fontSize: '11px', color: 'rgba(102, 224, 255, 1)', textShadow: '0 0 10px rgba(102,224,255,0.9)', fontWeight: 600, marginTop: '6px' }}>{innerBubblesData[i].subtitle}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  
    return bubbles;
  };
  
  // Updated function for creating curved text on the ring
  const createCurvedText = (text, position, radius, startAngle, arcAngle) => {
    const chars = text.split('');
    const angleStep = arcAngle / chars.length;
    
    return (
      <div className={`curved-text ${position}`}>
        {chars.map((char, i) => {
          const angle = startAngle + angleStep * i;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          
          return (
            <span 
              key={`${position}-char-${i}`}
              className="curved-char"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${angle + Math.PI/2}rad)`,
                transformOrigin: 'center'
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  // Create dots for the rotating ring with exclusion zones for text
  const createRotatingRingDots = () => {
    const dots = [];
    const dotCount = 48; // Keeping the same dot count
    const radius = 340; // Same radius
    
    // Define exclusion zones for text with wider ranges (in radians)
    const exclusionZones = [
      { start: -Math.PI/2 - 0.8, end: -Math.PI/2 + 0.8 },    // Top text zone (wider)
      { start: Math.PI/2 - 0.8, end: Math.PI/2 + 0.8 }       // Bottom text zone (wider)
    ];
    
    const isInExclusionZone = (angle) => {
      // Normalize angle to [0, 2π]
      let normalizedAngle = angle % (2 * Math.PI);
      if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
      
      return exclusionZones.some(zone => {
        // Normalize zone bounds
        let zoneStart = zone.start % (2 * Math.PI);
        if (zoneStart < 0) zoneStart += 2 * Math.PI;
        
        let zoneEnd = zone.end % (2 * Math.PI);
        if (zoneEnd < 0) zoneEnd += 2 * Math.PI;
        
        // Check if angle is in zone (handle wrap-around case)
        if (zoneStart <= zoneEnd) {
          return normalizedAngle >= zoneStart && normalizedAngle <= zoneEnd;
        } else {
          return normalizedAngle >= zoneStart || normalizedAngle <= zoneEnd;
        }
      });
    };
    
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * 2 * Math.PI;
      
      // Skip dots that would overlap with text
      if (isInExclusionZone(angle)) continue;
      
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      dots.push(
        <div
          key={`dot-${i}`}
          className="ring-dot"
          style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${i * 0.08}s`
          }}
        />
      );
    }
    
    return dots;
  };

  return (
    <div className="full-page-container" ref={containerRef}>
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
          zIndex: 2,
        }}
      />

      <div className="orbital-platform-container inner-only">
        {/* Updated rotating ring with curved text */}
        <div 
          ref={rotatingRingRef}
          className="rotating-ring"
        >
          {/* Curved text implementation */}
          {createCurvedText("GLOBAL MARKETPLACE NETWORK", "top", 340, -Math.PI/2 - 0.6, 1.3)}
          {createCurvedText("PREBUILT CONNECTORS FOR THOUSANDS OF RETAIL ENDPOINTS", "bottom", 340, Math.PI/2 - 0.8, 1.6)}
          
          {/* Dots with exclusion zones */}
          {createRotatingRingDots()}
        </div>

        <div className="platform-core">
          <div className="core-slim-ring" />
          <div className="core-content">
            <div className="core-title">AI-AUTOMATED</div>
            <div className="core-title">OMNICHANNEL</div>
            <div className="core-title">PLATFORM</div>
            <div className="core-subtext" style={{ fontSize: '12px', color: 'rgba(102, 224, 255, 1)', textShadow: '0 0 10px rgba(102,224,255,0.9)', fontWeight: 600, marginTop: '6px', maxWidth: '200px', textAlign: 'center' }}>Syncing Orders • Inventory • Catalog</div>
          </div>
        </div>

        <div
          className="inner-solid-ring"
          style={{
            animationDelay: `${ringDelay}s`,
            WebkitAnimationDelay: `${ringDelay}s`,
          }}
        />
        <div ref={innerOrbitRef} className="inner-orbit-circle">
          {createInnerBubbles()}
        </div>
      </div>
    </div>
  );
};

export default InnerPlatform;