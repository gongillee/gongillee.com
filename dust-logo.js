document.addEventListener('DOMContentLoaded', function() {
    // 로고 텍스트 요소 가져오기
    const logoElements = document.querySelectorAll('.logo');
    
    logoElements.forEach(logoElement => {
        const originalText = logoElement.textContent;
        
        // 로고 크기 및 위치 계산
        const rect = logoElement.getBoundingClientRect();
        const logoWidth = rect.width;
        const logoHeight = rect.height;
        
        // 컨테이너 생성
        logoElement.innerHTML = '';
        
        // 기존 텍스트를 담을 요소 생성
        const textElement = document.createElement('span');
        textElement.classList.add('original-text');
        textElement.textContent = originalText;
        textElement.style.position = 'absolute';
        textElement.style.top = '0';
        textElement.style.left = '0';
        textElement.style.width = '100%';
        textElement.style.opacity = '0'; // 초기에는 숨김
        textElement.style.transition = 'opacity 0.3s ease'; // 더 빠른 전환 시간
        
        // 먼지 파티클을 담을 캔버스 생성
        const canvas = document.createElement('canvas');
        canvas.width = logoWidth * 1.5;
        canvas.height = logoHeight * 1.5;
        canvas.style.position = 'absolute';
        canvas.style.top = `-${logoHeight * 0.25}px`;
        canvas.style.left = `-${logoWidth * 0.25}px`;
        
        logoElement.style.position = 'relative';
        logoElement.style.height = `${logoHeight}px`;
        logoElement.style.width = `${logoWidth}px`;
        logoElement.style.overflow = 'hidden';
        logoElement.appendChild(textElement);
        logoElement.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        // 텍스트 측정하여 정확한 위치 계산
        ctx.font = window.getComputedStyle(textElement).font;
        const computedStyle = window.getComputedStyle(textElement);
        
        // 텍스트 메트릭스 계산
        const metrics = ctx.measureText(originalText);
        const textHeight = parseInt(computedStyle.fontSize);
        
        // 캔버스 중앙에 텍스트 그리기
        const offsetX = (canvas.width - logoWidth) / 2;
        const offsetY = (canvas.height - logoHeight) / 2;

        // 텍스트를 캔버스에 그려서 픽셀 데이터 추출 (위치 조정됨)
        ctx.fillStyle = window.getComputedStyle(textElement).color;
        ctx.textBaseline = 'top';

        // 화면 크기에 따른 반응형 오프셋 조정
        let xOffset = 1.1;
        let yOffset = 5.6;

        // 모바일 화면에서는 다른 오프셋 적용
        if (window.innerWidth <= 768) {
            xOffset = 0.4;
            yOffset = 4.7; // 모바일에서 약간 위로 조정
        }

        // 더 작은 화면에서 추가 조정
        if (window.innerWidth <= 480) {
            xOffset = 0.4;
            yOffset = 5.0;
        }

        ctx.fillText(originalText, offsetX + xOffset, offsetY + yOffset);
        
        // 캔버스에서 픽셀 데이터 추출
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const particles = [];
        const particleCount = 2500;
        const dustSize = 0.01;
        
        // 텍스트 내에 있는 픽셀 위치 수집
        const textPixels = [];
        for (let y = 0; y < canvas.height; y += 1) {
            for (let x = 0; x < canvas.width; x += 1) {
                const i = (y * canvas.width + x) * 4;
                if (pixels[i + 3] > 30) {
                    textPixels.push({ x, y });
                }
            }
        }
        
        // 캔버스 밖에서 시작하는 먼지 파티클 생성
        function createParticlesOutsideCanvas() {
            particles.length = 0;
            
            for (let i = 0; i < particleCount; i++) {
                let x, y;
                const edge = Math.floor(Math.random() * 4);
                
                if (edge === 0) {
                    x = Math.random() * canvas.width;
                    y = -20 - Math.random() * 50;
                } else if (edge === 1) {
                    x = canvas.width + 20 + Math.random() * 50;
                    y = Math.random() * canvas.height;
                } else if (edge === 2) {
                    x = Math.random() * canvas.width;
                    y = canvas.height + 20 + Math.random() * 50;
                } else {
                    x = -20 - Math.random() * 50;
                    y = Math.random() * canvas.height;
                }
                
                particles.push({
                    x: x,
                    y: y,
                    targetX: 0,
                    targetY: 0,
                    size: Math.random() * dustSize + 0.3,
                    color: `rgba(0, 0, 0, ${Math.random() * 0.4 + 0.6})`,
                    speedFactor: Math.random() * 0.5 + 0.3,
                    active: true,
                    opacity: 1 // 투명도 초기값 추가
                });
            }
        }
        
        createParticlesOutsideCanvas();
        
        // 애니메이션 상태 - 'gather', 'transition', 'display', 'scatter', 'reset'
        let animationState = 'gather'; // 처음에 모이는 상태로 시작
        let stateChangeTime = Date.now() + 3500;
        let transitionStartTime = 0; // 트랜지션 시작 시간
        let scatterStartTime = 0; // 발산 시작 시간 추가
        let cycleCount = 0;
        
        function assignTextTargets() {
            if (textPixels.length === 0) return;
            
            particles.forEach((particle) => {
                const randomPixel = textPixels[Math.floor(Math.random() * textPixels.length)];
                particle.targetX = randomPixel.x;
                particle.targetY = randomPixel.y;
            });
        }
        
        assignTextTargets();
        
        function animate() {
            const now = Date.now();
            
            if (now > stateChangeTime) {
                if (animationState === 'gather') {
                    console.log("상태 전환: gather → transition");
                    animationState = 'transition';
                    transitionStartTime = now; // 트랜지션 시작 시간 기록
                    stateChangeTime = now + 1200; // 1.2초 트랜지션
                }
                else if (animationState === 'transition') {
                    console.log("상태 전환: transition → display");
                    animationState = 'display';
                    textElement.style.opacity = '1'; // 이미 트랜지션 중에 opacity가 조절되었음
                    stateChangeTime = now + 3000; // 3초간 표시
                }
                else if (animationState === 'display') {
                    console.log("상태 전환: display → scatter");
                    animationState = 'scatter';
                    scatterStartTime = now; // 발산 시작 시간 기록
                    
                    // 원본 텍스트가 즉시 희미해지기 시작하도록 설정
                    textElement.style.opacity = '0';
                    
                    particles.forEach(p => {
                        p.scatterStartX = p.x;
                        p.scatterStartY = p.y;
                        p.opacity = 1; // 흩어질 때는 다시 완전 불투명하게 시작
                    });
                    
                    stateChangeTime = now + 2500;
                }
                else if (animationState === 'scatter') {
                    console.log("상태 전환: scatter → reset");
                    animationState = 'reset';
                    stateChangeTime = now + 1000;
                    cycleCount++;
                }
                else {
                    console.log("상태 전환: reset → gather");
                    animationState = 'gather';
                    
                    createParticlesOutsideCanvas();
                    assignTextTargets();
                    
                    stateChangeTime = now + 3500;
                }
            }
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                
                if (!p.active) continue;
                
                if (animationState === 'gather') {
                    const dx = p.targetX - p.x;
                    const dy = p.targetY - p.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    let speed = Math.min(0.1, 10 / distance) * p.speedFactor;
                    if (distance < 5) speed = 0.05;
                    
                    p.x += dx * speed;
                    p.y += dy * speed;
                }
                else if (animationState === 'transition') {
                    // 트랜지션 단계에서는 파티클의 투명도를 점점 낮추고 원본 텍스트의 투명도를 점점 높임
                    const progress = (now - transitionStartTime) / 1200; // 0~1 사이 값
                    p.opacity = Math.max(0, 1 - progress * 1.5); // 파티클 투명도 감소
                    
                    // 원본 텍스트 투명도 증가
                    const textProgress = Math.min(1, progress * 1.2);
                    textElement.style.opacity = textProgress.toString();
                }
                else if (animationState === 'display') {
                    // 표시 상태에서는 파티클 그리지 않음
                }
                else if (animationState === 'scatter') {
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    
                    let dx = p.x - centerX;
                    let dy = p.y - centerY;
                    
                    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
                        dx = Math.random() - 0.5;
                        dy = Math.random() - 0.5;
                    }
                    
                    const length = Math.sqrt(dx * dx + dy * dy);
                    dx = dx / length;
                    dy = dy / length;
                    
                    // 발산 시간 경과 계산
                    const timeSinceStart = now - scatterStartTime;
                    
                    // 속도 조정: 약간 느리게 시작해서 점점 빨라짐
                    const speedMultiplier = 1.0 + timeSinceStart / 400; // 속도 곡선 조정
                    p.x += dx * speedMultiplier;
                    p.y += dy * speedMultiplier;
                    
                    // 투명도 조정: 더 천천히 투명해지도록
                    p.opacity = Math.max(0, 1 - timeSinceStart / 1800); // 투명도 감소 속도 감소
                    
                    if (p.x < -50 || p.x > canvas.width + 50 || 
                        p.y < -50 || p.y > canvas.height + 50) {
                        p.active = false;
                    }
                }
                
                // 파티클 그리기 (display나 reset 상태가 아닐 때만)
                if (animationState !== 'display' && animationState !== 'reset') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    
                    // transition 또는 scatter 상태에서는 투명도 조절
                    if ((animationState === 'scatter' || animationState === 'transition') && 
                         p.hasOwnProperty('opacity')) {
                        const colorParts = p.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([^)]+))?\)/);
                        if (colorParts) {
                            ctx.fillStyle = `rgba(${colorParts[1]}, ${colorParts[2]}, ${colorParts[3]}, ${p.opacity * parseFloat(colorParts[4] || 1)})`;
                        } else {
                            ctx.fillStyle = p.color;
                        }
                    } else {
                        ctx.fillStyle = p.color;
                    }
                    
                    ctx.fill();
                }
            }
            
            requestAnimationFrame(animate);
        }
        
        animate();
    });
});