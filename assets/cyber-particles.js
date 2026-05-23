// =============================================================================
// Cyber Particle Network - Acruxlare Security Blog
// Creates an animated particle mesh with neon green and cyan particles
// that connect when near each other, forming a network topology effect.
// =============================================================================

(function () {
  const canvas = document.getElementById('cyber-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let animationId;

  // Configuration
  const config = {
    particleCount: 80,
    particleMinSize: 1,
    particleMaxSize: 3,
    connectionDistance: 160,
    speed: 0.4,
    colors: [
      { r: 0, g: 255, b: 65 },    // Neon green
      { r: 0, g: 212, b: 255 },   // Cyber cyan
      { r: 0, g: 180, b: 220 },   // Blue-cyan
      { r: 0, g: 255, b: 130 },   // Green-cyan
      { r: 100, g: 220, b: 255 }, // Light blue
    ]
  };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * (config.particleMaxSize - config.particleMinSize) + config.particleMinSize;
      this.speedX = (Math.random() - 0.5) * config.speed;
      this.speedY = (Math.random() - 0.5) * config.speed;
      this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
      this.opacity = Math.random() * 0.5 + 0.3;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Pulse effect
      this.pulsePhase += this.pulseSpeed;
      const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
      this.currentOpacity = this.opacity * pulse;
      this.currentSize = this.size * (0.8 + pulse * 0.4);


      // Wrap around edges
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      if (this.y > height + 10) this.y = -10;
    }

    draw() {
      const { r, g, b } = this.color;

      // Glow effect
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${this.currentOpacity * 0.6})`;

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.currentOpacity})`;
      ctx.fill();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.currentSize * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.min(r + 100, 255)}, ${Math.min(g + 100, 255)}, ${Math.min(b + 100, 255)}, ${this.currentOpacity * 1.2})`;
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  function init() {
    particles = [];
    const count = window.innerWidth < 768 ? Math.floor(config.particleCount * 0.5) : config.particleCount;
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.connectionDistance) {
          const opacity = (1 - dist / config.connectionDistance) * 0.15;
          const ci = particles[i].color;
          const cj = particles[j].color;

          // Blend colors of connected particles
          const r = Math.floor((ci.r + cj.r) / 2);
          const g = Math.floor((ci.g + cj.g) / 2);
          const b = Math.floor((ci.b + cj.b) / 2);

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Subtle radial gradient background overlay
    const gradient = ctx.createRadialGradient(
      width * 0.3, height * 0.3, 0,
      width * 0.3, height * 0.3, width * 0.8
    );
    gradient.addColorStop(0, 'rgba(0, 255, 65, 0.008)');
    gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.004)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawConnections();

    for (const particle of particles) {
      particle.update();
      particle.draw();
    }

    animationId = requestAnimationFrame(animate);
  }

  // Event listeners
  window.addEventListener('resize', function () {
    resize();
    init();
  });



  // Reduce animation when tab is not visible
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });

  // Start
  resize();
  init();
  animate();
})();
