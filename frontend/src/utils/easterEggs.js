// Easter Egg Detection and Animation System
class EasterEggSystem {
  constructor() {
    this.apiBaseUrl = 'http://localhost:8888/egg/api/lol';
    this.apiKey = 'einkaufsliste-easter-2025';
    this.userUuid = this.getUserUuid();
    this.animations = new Map();
  }

  getUserUuid() {
    // Get or create user UUID
    let uuid = localStorage.getItem('easter_user_uuid');
    if (!uuid) {
      uuid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('easter_user_uuid', uuid);
    }
    return uuid;
  }

  async checkEasterEgg(egg_name, data = {}) {
    try {
      const userName = localStorage.getItem('username') || 'Anonymous';
      
      const response = await fetch(`${this.apiBaseUrl}/find/${egg_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-User-UUID': this.userUuid,
          'X-User-Name': userName
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.celebration) {
          this.showCelebration(result.celebration);
        }
        return result;
      }
    } catch (error) {
      console.log('Easter Egg API not available:', error);
    }
    return null;
  }

  async triggerStarsAndSweets(icon, category) {
    try {
      const userName = localStorage.getItem('username') || 'Anonymous';
      
      const response = await fetch(`${this.apiBaseUrl}/trigger/stars-and-sweets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-User-UUID': this.userUuid,
          'X-User-Name': userName
        },
        body: JSON.stringify({ icon, category })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.animation) {
          this.startFallingAnimation(result.animation);
        }
        return result;
      }
    } catch (error) {
      console.log('Easter Egg API not available:', error);
    }
    return null;
  }

  showCelebration(celebration) {
    const overlay = document.createElement('div');
    overlay.className = 'easter-celebration-overlay';
    overlay.innerHTML = `
      <div class="easter-celebration-content">
        <div class="easter-title">${celebration.title}</div>
        <div class="easter-message">${celebration.message}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Add celebration effects
    switch (celebration.effect) {
      case 'MEGA_FIREWORKS':
        this.createFireworks(overlay);
        break;
      case 'CONFETTI':
        this.createConfetti(overlay);
        break;
      case 'SPARKLE':
        this.createSparkle(overlay);
        break;
    }

    // Auto remove after 4 seconds
    setTimeout(() => {
      overlay.remove();
    }, 4000);
  }

  startFallingAnimation(animation) {
    const container = document.createElement('div');
    container.className = 'easter-falling-container';
    document.body.appendChild(container);

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'easter-falling-particle';
      particle.textContent = animation.particles[Math.floor(Math.random() * animation.particles.length)];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particle.style.fontSize = (Math.random() * 20 + 20) + 'px';
      
      container.appendChild(particle);

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.remove();
        }
      }, 5000);
    };

    // Create particles continuously
    const interval = setInterval(createParticle, 200);

    // Stop after duration
    setTimeout(() => {
      clearInterval(interval);
      setTimeout(() => {
        container.remove();
      }, 3000);
    }, animation.duration);
  }

  createFireworks(container) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const firework = document.createElement('div');
        firework.className = 'easter-firework';
        firework.style.left = Math.random() * 100 + '%';
        firework.style.top = Math.random() * 50 + 25 + '%';
        firework.innerHTML = '🎆';
        container.appendChild(firework);

        setTimeout(() => {
          firework.remove();
        }, 2000);
      }, i * 500);
    }
  }

  createConfetti(container) {
    const confettiColors = ['🎉', '🎊', '✨', '🌟', '⭐'];
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'easter-confetti';
        confetti.innerHTML = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(confetti);

        setTimeout(() => {
          confetti.remove();
        }, 3000);
      }, i * 50);
    }
  }

  createSparkle(container) {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'easter-sparkle';
        sparkle.innerHTML = '✨';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        container.appendChild(sparkle);

        setTimeout(() => {
          sparkle.remove();
        }, 1500);
      }, i * 100);
    }
  }

  // Check for stars and sweets combination
  checkStarsAndSweets(icon, category) {
    if (icon === '⭐' && category === '🍭 Süßwaren') {
      console.log('🎉 Easter Egg Trigger: Stars and Sweets detected!');
      this.triggerStarsAndSweets(icon, category);
      return true;
    }
    return false;
  }
}

// Global Easter Egg System
window.easterEggSystem = new EasterEggSystem();

export default window.easterEggSystem;
