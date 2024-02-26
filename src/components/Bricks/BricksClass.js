import apple from '../../assets/apple-logo.svg'

class BricksClass {
    canvas;
    canvasContext;

    //Game configuration variables 
    gameConfig;
    ball;
    brickInfo = {};
    bricks = [];
    brickRowCount = 6;
    brickColumnCount = 10;
    lives = 3
    score = 0
    elementsToFall = []
    interactions = {}
    particleInfo = {}
    particlesToDraw = []

    // Bonifications colors bricks
    standardColor = '#0095dd';  // Color estándar para bloques
    nullBonusColor = '#CCCCCC';  // Color para bonificación nula
    mediatorBonusColor = '#FFA500';  // Color para bonificación mediadora
    powerupBonusColor = '#00FF00';  // Color para bonificación de poder
    paddleColor = '#0011F30'
    
    // Functions 
    setGameEndResult = null
    setLives = null
    setScore = null
    setElementCatched = null
    setInteractions = null
    showBonification = null
    gameEndModal = null
    saveGameResults = null
    getTimePlayed = null

    constructor(canvas, canvasContext, gameConfig, setLives, setElementCatched, setScore, setInteractions, setGameEndResult, showBonification, gameEndModal, saveGameResults, getTimePlayed) {
        this.canvas = canvas;
        this.canvasContext = canvasContext;
        this.gameConfig = gameConfig;
        this.setGameEndResult = setGameEndResult;
        this.setLives = setLives;
        this.setScore = setScore;
        this.setElementCatched = setElementCatched;
        this.setInteractions = setInteractions
        this.interactions = {
            [gameConfig.elementsNames[0]]: 0,
            [gameConfig.elementsNames[1]]: 0,
            [gameConfig.elementsNames[2]]: 0
        }
        this.showBonification = showBonification
        this.gameEndModal = gameEndModal
        this.saveGameResults = saveGameResults
        this.getTimePlayed = getTimePlayed

        this.paddle = {
            x: this.canvas.width / 2 - 65,
            y: this.canvas.height - 20,
            w: 130,
            h: 20,
            borderRadius: 10, // Radio de las esquinas para hacerlo redondeado
            speed: 4,
            dx: 0,
            visible: true  
        }
        this.ball = {
            x: this.canvas.width / 2,
            y: this.paddle.y - 10, // Coloca la pelota justo encima del paddle
            size: 10,
            speed: 1.7,
            dx: 0, // Inicialmente no hay movimiento en x
            dy: 0, // Inicialmente no hay movimiento en y
            visible: true     
        };
        

        this.brickInfo = {
            w: 75.5,
            h: 20,
            padding: 6,
            offsetX: 40,
            offsetY: 80,
            visible: true
        }

        this.particleInfo = {
            w: 1,
            h: 1,    
            timeToLive: 1,
            radius: 2,
            alpha: 1,
            velocity: {
                x: 1, // Velocidad en el eje x
                y: 1  // Velocidad en el eje y
            }
        }

        this.inGame = false
        this.isBallReadyToLaunch = true; // Indica si la pelota está lista para ser lanzada
        this.arrowAngle = Math.PI / 4; // Angulo inicial de la flecha (45 grados)
        
        this.createBricks()
        // Keyboard event handlers
        this.keyDown = this.keyDown.bind(this);
        this.keyUp = this.keyUp.bind(this); 
        document.addEventListener('keydown', this.keyDown);
        document.addEventListener('keyup', this.keyUp);
        
        setInterval(() => {
            if(this.inGame){
                this.addNewBrickLine();
            }
        }, 5000); // 5000 milisegundos = 5 segundos    
    }

    drawArrow() {
        if (!this.isBallReadyToLaunch) return;
    
        const arrowLength = 50; // Longitud de la flecha
        const endX = this.ball.x + arrowLength * Math.cos(this.arrowAngle);
        const endY = this.ball.y - arrowLength * Math.sin(this.arrowAngle);
    
        const arrowHeadLength = 20; // Longitud de los lados de la punta de la flecha
        const arrowHeadAngle = Math.PI / 8; // Ángulo en radianes para los lados de la punta
        
        // Calcular los puntos de la punta de la flecha
        const leftX = endX - arrowHeadLength * Math.cos(this.arrowAngle - arrowHeadAngle);
        const leftY = endY + arrowHeadLength * Math.sin(this.arrowAngle - arrowHeadAngle);
        const rightX = endX - arrowHeadLength * Math.cos(this.arrowAngle + arrowHeadAngle);
        const rightY = endY + arrowHeadLength * Math.sin(this.arrowAngle + arrowHeadAngle);
        
        // Dibujar la punta de la flecha
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(endX, endY);
        this.canvasContext.lineTo(leftX, leftY);
        this.canvasContext.lineTo(rightX, rightY);
        this.canvasContext.closePath();
        this.canvasContext.fillStyle = 'black';
        this.canvasContext.fill();
        

        this.canvasContext.beginPath();
        this.canvasContext.moveTo(this.ball.x, this.ball.y);
        this.canvasContext.lineTo(endX, endY);
        this.canvasContext.strokeStyle = 'black';
        this.canvasContext.lineWidth = 2;
        this.canvasContext.stroke();
    
    
        this.canvasContext.strokeStyle = 'black';
        this.canvasContext.lineWidth = 1;
    }

    // Create bricks
    createBricks() {
        if (this.brickInfo.visible !== undefined) {
            let newArray = [];

            for (let i = 0; i < this.brickRowCount; i++) {
                newArray[i] = [];
                for (let j = 0; j < this.brickColumnCount; j++) {
                    const x = j * (this.brickInfo.w + this.brickInfo.padding) + this.brickInfo.offsetX;
                    const y = i * (this.brickInfo.h + this.brickInfo.padding) + this.brickInfo.offsetY;
    
                    // % random
                    let element = null;
                    const randomElement = Math.random() * 100;
                    if (randomElement < 20) element = { visible: true }
                    else if (randomElement < 40) element = this.gameConfig.tables[0];
                    else if (randomElement < 60) element = this.gameConfig.tables[1];
                    else element = this.gameConfig.tables[2];
    
                    // Selección del color según la bonificación del ladrillo
                    let brickColor;
                    switch (element?.bonification) {
                        case 'nula':
                            brickColor = this.nullBonusColor;
                            break;
                        case 'mediadora':
                            brickColor = this.mediatorBonusColor;
                            break;
                        case 'premio':
                            brickColor = this.powerupBonusColor;
                            break;
                        default:
                            brickColor = this.standardColor;
                            break;
                    }
                    newArray[i][j] = { x, y, element, brickColor, ...this.brickInfo };
                }
            }
            this.bricks = newArray;
        }
    }
    

    addNewBrickLine() {
        // Crear una nueva fila de ladrillos
        let newRow = [];

        for (let j = 0; j < this.brickColumnCount; j++) {
            const x = j * (this.brickInfo.w + this.brickInfo.padding) + this.brickInfo.offsetX;
            const y = this.brickInfo.offsetY; // La nueva fila siempre comienza en la misma posición 'y' inicial

            // Generar elemento de ladrillo aleatorio
            let element = null;
            const randomElement = Math.random() * 100;
            if (randomElement < 20) element = { visible: true };
            else if (randomElement < 40) element = this.gameConfig.tables[0];
            else if (randomElement < 60) element = this.gameConfig.tables[1];
            else element = this.gameConfig.tables[2];

            // Selección del color según la bonificación del ladrillo
            let brickColor;
            switch (element?.bonification) {
                case 'nula':
                    brickColor = this.nullBonusColor;
                    break;
                case 'mediadora':
                    brickColor = this.mediatorBonusColor;
                    break;
                case 'premio':
                    brickColor = this.powerupBonusColor;
                    break;
                default:
                    brickColor = this.standardColor;
                    break;
            }

            newRow.push({ x, y, element, brickColor, ...this.brickInfo, visible: true });
        }

        this.bricks.forEach(row => {
            row.forEach(brick => {
                brick.y += this.brickInfo.h + this.brickInfo.padding;
            });
        });

        if(this.bricks.length < 21){
            this.bricks.unshift(newRow);
        }else{
            this.bricks.unshift(newRow);
            this.bricks.pop();
        }
    }
    


    createParticlesBrokenEffect(brick, count) {
        const centerX = brick.x + brick.w / 2;
        const centerY = brick.y + brick.h / 2;

        for (let i = 0; i < count; i++) {
            this.particlesToDraw.push({
                ...this.particleInfo,
                x: centerX,
                y: centerY,
                color: brick.brickColor,
            });
        }
    }

    // Create element to fall
     createElementToFall(positionX, positionY, brickElement, brickWidth, brickHeight, brickColor) {
       this.elementsToFall.push({
            x: positionX,
            y: positionY,
            vy: 2,
            element: brickElement,
            w: brickWidth, 
            h: brickHeight,
            brickColor 
        })
    }

    // Keydown event
    keyDown(e) {
        if (e.key === 'Right' || e.key === 'ArrowRight') {
            if (this.isBallReadyToLaunch) {
                if(parseFloat(this.arrowAngle) >= 0.6){
                    this.arrowAngle -= 0.1; // Ajusta el ángulo de la flecha
                }
            } else {
                this.paddle.dx = this.paddle.speed;
            }
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            if (this.isBallReadyToLaunch) {
                if(parseFloat(this.arrowAngle) <= 2.6){
                    this.arrowAngle += 0.1; // Ajusta el ángulo de la flecha
                }
            } else {
                this.paddle.dx = -this.paddle.speed;
            }
        } else if (e.key === 'Space' || e.key === ' ') {
            // Lógica para disparar la pelota
            if (this.isBallReadyToLaunch) {
                this.ball.dx = 2 * Math.cos(this.arrowAngle); // Velocidad en x basada en el ángulo
                this.ball.dy = -2 * Math.sin(this.arrowAngle); // Velocidad en y basada en el ángulo
                this.isBallReadyToLaunch = false;
                this.inGame = true
            }
        }
    }

    // Keyup event
    keyUp (e) {
        if (
        e.key === 'Right' ||
        e.key === 'ArrowRight' ||
        e.key === 'Left' ||
        e.key === 'ArrowLeft'
        ) {
            this.paddle.dx = 0;
        }
    }

    // Clear canvas 
    clearCanvas () {
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.canvasContext.fillStyle = '#000000'
        this.canvasContext.beginPath()
        this.canvasContext.fill()
        this.canvasContext.closePath();
    }

   // Draw ball on canvas
    drawBall() {
        const gradient = this.canvasContext.createRadialGradient(this.ball.x, this.ball.y, 0, this.ball.x, this.ball.y, this.ball.size);
        gradient.addColorStop(0, '#3498db'); // Color principal
        gradient.addColorStop(1, '#2980b9'); // Color para sombra

        // Dibujar bola con gradiente
        this.canvasContext.beginPath();
        this.canvasContext.arc(this.ball.x, this.ball.y, this.ball.size, 0, Math.PI * 2);
        this.canvasContext.fillStyle = gradient;

        // Aplicar sombra y brillo
        this.canvasContext.shadowColor = 'rgba(52, 152, 219, 0.7)';
        this.canvasContext.shadowBlur = 10;
        this.canvasContext.shadowOffsetX = 2;
        this.canvasContext.shadowOffsetY = 2;

        // Agregar borde negro
        this.canvasContext.strokeStyle = '#000';
        this.canvasContext.lineWidth = 2;
        this.canvasContext.stroke();

        this.canvasContext.fill();
        this.canvasContext.closePath();

        // Restaurar valores de sombra y borde
        this.canvasContext.shadowBlur = 0;
        this.canvasContext.shadowOffsetX = 0;
        this.canvasContext.shadowOffsetY = 0;
        this.canvasContext.lineWidth = 0; // Restaurar el ancho de línea después de dibujar el borde
    }

    // DRAW PADDLE
    drawPaddle() {
        // Establecer colores del gradiente
        const gradient = this.canvasContext.createLinearGradient(this.paddle.x, this.paddle.y, this.paddle.x, this.paddle.y + this.paddle.h);
        gradient.addColorStop(0, '#3498db'); // Color principal
        gradient.addColorStop(1, '#2980b9'); // Color para resaltar o dar brillo

        // Dibujar paddle con bordes redondeados y borde negro
        this.canvasContext.beginPath();
        this.canvasContext.moveTo(this.paddle.x + this.paddle.borderRadius, this.paddle.y);
        this.canvasContext.lineTo(this.paddle.x + this.paddle.w - this.paddle.borderRadius, this.paddle.y);
        this.canvasContext.quadraticCurveTo(this.paddle.x + this.paddle.w, this.paddle.y, this.paddle.x + this.paddle.w, this.paddle.y + this.paddle.borderRadius);
        this.canvasContext.lineTo(this.paddle.x + this.paddle.w, this.paddle.y + this.paddle.h - this.paddle.borderRadius);
        this.canvasContext.quadraticCurveTo(this.paddle.x + this.paddle.w, this.paddle.y + this.paddle.h, this.paddle.x + this.paddle.w - this.paddle.borderRadius, this.paddle.y + this.paddle.h);
        this.canvasContext.lineTo(this.paddle.x + this.paddle.borderRadius, this.paddle.y + this.paddle.h);
        this.canvasContext.quadraticCurveTo(this.paddle.x, this.paddle.y + this.paddle.h, this.paddle.x, this.paddle.y + this.paddle.h - this.paddle.borderRadius);
        this.canvasContext.lineTo(this.paddle.x, this.paddle.y + this.paddle.borderRadius);
        this.canvasContext.quadraticCurveTo(this.paddle.x, this.paddle.y, this.paddle.x + this.paddle.borderRadius, this.paddle.y);

        // Aplicar gradiente al paddle
        this.canvasContext.fillStyle = gradient;

        // Agregar sombras
        this.canvasContext.shadowColor = 'rgba(52, 152, 219, 0.7)';
        this.canvasContext.shadowBlur = 10;
        this.canvasContext.shadowOffsetX = 2;
        this.canvasContext.shadowOffsetY = 2;

        // Agregar borde negro
        this.canvasContext.strokeStyle = '#000';
        this.canvasContext.lineWidth = 2;
        this.canvasContext.stroke();

        this.canvasContext.fill();
        this.canvasContext.closePath();

        // Restaurar valores de sombra y borde
        this.canvasContext.shadowBlur = 0;
        this.canvasContext.shadowOffsetX = 0;
        this.canvasContext.shadowOffsetY = 0;
        this.canvasContext.lineWidth = 0; // Restaurar el ancho de línea después de dibujar el borde
    }

    drawBricks() {
        this.bricks?.forEach(column => {
            column.forEach(brick => {
                if (!brick.visible) {
                    return; // Si el ladrillo no es visible, no hacemos nada
                }

                const x = brick.x;
                const y = brick.y;
                const w = brick.w;
                const h = brick.h;

                // Gradiente radial para simular sombreado
                const gradient = this.canvasContext.createRadialGradient(
                    x + w / 2, y + h / 2, 1,
                    x + w / 2, y + h / 2, w / 2
                );

                gradient.addColorStop(0, brick.brickColor); // Color interior del ladrillo
                gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.3)'); // Color de sombreado
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparente hacia el exterior

                // Borde con resplandor (efecto de neón)
                this.drawStrokeWithGlow(x - 2, y - 2, w + 3, h + 3, 5, brick.visible ? 'rgba(255, 255, 255, 0.8)' : 'transparent');

                // Borde del ladrillo
                this.canvasContext.beginPath();
                this.canvasContext.rect(x, y, w, h);
                this.canvasContext.fillStyle = gradient;

                // Agregar borde negro
                this.canvasContext.strokeStyle = brick.visible ? '#000' : 'transparent';
                this.canvasContext.lineWidth = 2;
                this.canvasContext.fill();
                this.canvasContext.stroke();
                this.canvasContext.closePath();

                // Sombra del ladrillo
                this.drawShadowedRect(x, y, w, h, brick.brickColor, 8); // Aumentar la intensidad de la sombra
            });
        });
    }

    // DRAW BRICK NEON BORDER
    drawStrokeWithGlow(x, y, w, h, lineWidth, strokeStyle) {
        this.canvasContext.save();
        this.canvasContext.beginPath();
        this.canvasContext.lineWidth = lineWidth;
        this.canvasContext.strokeStyle = strokeStyle;
        this.canvasContext.rect(x, y, w, h);
        this.canvasContext.stroke();
        this.canvasContext.restore();
    }

    // DRAW BRICK SHADOW
    drawShadowedRect(x, y, w, h, fillStyle, shadowBlur) {
        this.canvasContext.save();
        this.canvasContext.beginPath();
        this.canvasContext.rect(x, y, w, h);
        this.canvasContext.fillStyle = fillStyle;
        this.canvasContext.shadowColor = '#888';
        this.canvasContext.shadowBlur = shadowBlur;
        this.canvasContext.fill();
        this.canvasContext.restore();
    }

    // Draw falling elements
    drawElementsToFall () {
        this.elementsToFall.forEach((elementToFall) => {
        if(elementToFall.element.src){
            let elementImage = new Image();
            elementImage.src = elementToFall.element.src;

            // Guardar el estado actual del contexto
            this.canvasContext.save();

            // Configurar las sombras para simular el efecto de burbuja
            this.canvasContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.canvasContext.shadowBlur = 15;
            this.canvasContext.shadowOffsetX = 8;
            this.canvasContext.shadowOffsetY = 8;

            // Dibujar burbuja alrededor de la imagen
            this.canvasContext.beginPath();
            this.canvasContext.arc(
                elementToFall.x + 35, // Centro x de la burbuja
                elementToFall.y + 35, // Centro y de la burbuja
                40, // Radio de la burbuja
                0,
                Math.PI * 2
            );

            // Aplicar estilos a la burbuja
            let bubbleGradient = this.canvasContext.createRadialGradient(elementToFall.x + 35, elementToFall.y + 35, 20, elementToFall.x + 35, elementToFall.y + 35, 40);
            bubbleGradient.addColorStop(0, elementToFall.brickColor);
            bubbleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            this.canvasContext.fillStyle = bubbleGradient;
            this.canvasContext.fill();
            this.canvasContext.closePath();

            // Reducir el tamaño de la imagen
            let imageSize = 50; // Tamaño deseado de la imagen dentro de la burbuja

            // Dibujar la imagen en el centro de la burbuja
            this.canvasContext.drawImage(elementImage, elementToFall.x + 35 - imageSize / 2, elementToFall.y + 35 - imageSize / 2, imageSize, imageSize);

            // Restaurar el estado del contexto
            this.canvasContext.restore();
        }
    });
    }

    // Draw particles effect
    drawBrokenBrickParticles() {
        this.particlesToDraw.forEach((particle) => {
            this.canvasContext.beginPath();
            const gradient = this.canvasContext.createRadialGradient(
                particle.x,
                particle.y,
                0,
                particle.x,
                particle.y,
                particle.timeToLive
            );

            gradient.addColorStop(0, `${particle.color}`);
            gradient.addColorStop(1, `${particle.color}`);

            this.canvasContext.fillStyle = gradient;
            this.canvasContext.arc(particle.x, particle.y, particle.timeToLive, 0, Math.PI * 2);
            this.canvasContext.fill();
            this.canvasContext.closePath();
        });
    }

    // DRAW CANVAS 
    draw() {
        this.clearCanvas();
        this.drawElementsToFall();
        this.drawBall();
        this.drawPaddle();
        this.drawBricks();
        this.drawBrokenBrickParticles();
        this.drawArrow(); // Dibujar la flecha
    }

    // ADD BRICKS 10 seconds
    updateBricks(){
        let timePlayed = this.getTimePlayed() + 1

        if(timePlayed % 2 === 0){
            let newArray=[]
            newArray[0] = [];
            for (let j = 0; j < this.brickColumnCount; j++) {
                const x = j * (this.brickInfo.w + this.brickInfo.padding) + this.brickInfo.offsetX;
                const y = 0 * (this.brickInfo.h + this.brickInfo.padding) + this.brickInfo.offsetY;

                // % random
                let element = null;
                const randomElement = Math.random() * 100;
                if (randomElement < 33) element = this.gameConfig.tables[0];
                else if (randomElement < 66) element =  this.gameConfig.tables[1];
                else element = this.gameConfig.tables[2];
                newArray[0][j] = { x, y, element, ...this.brickInfo };
            }
            this.bricks.unshift(newArray)
            console.log("this.bricks")
        }
    }

    // UPDATE PARTICLES EFFECTS
    updateBrokenBrickEffect() {
        this.particlesToDraw.forEach((particle, index) => {
            const range = 2; // Rango deseado
            const randomSignX = Math.random() < 0.5 ? 2.9 : -2.9;
            const randomSignY = Math.random() < 0.5 ? 1 : -1;
            const randomX = Math.random() * (2 * range) - range; 
            const randomY = Math.random() * (2 * range) - range;

            particle.x += particle.velocity.x * randomSignX * randomX;
            particle.y += particle.velocity.y * randomSignY * randomY;
            // particle.alpha -= 0.2; // Disminuir opacidad con el tiempo
            particle.timeToLive -= 0.009; // Decrementar el tiempo de vida

            // Eliminar partículas que hayan alcanzado el final de su vida
            if (particle.timeToLive <= 0) {
                this.particlesToDraw.splice(index, 1);
            }
        });
    }

    // UPDATE FALLING ELEMENT FUNCION 
    fallingElement() {
        this.elementsToFall = this.elementsToFall.filter(elementFalling => {
            elementFalling.y += elementFalling.vy;

            if (
                elementFalling.x < this.paddle.x + this.paddle.w &&
                elementFalling.x + elementFalling.w > this.paddle.x &&
                elementFalling.y < this.paddle.y + this.paddle.h &&
                elementFalling.y + elementFalling.h > this.paddle.y
            ) {
                // Verificar si la bonificación ya se aplicó
                if (!elementFalling.appliedBonification) {
                    // save interaction with element
                    this.interactions[elementFalling.element.name] = this.interactions[elementFalling.element.name] + 1
                    this.setInteractions(this.interactions)

                    if (elementFalling.element.bonification === "premio") {
                        this.score = this.score + 2
                        this.setScore(this.score)
                        // Marca la bonificación como aplicada
                    } else if (elementFalling.element.bonification === "mediadora") {
                        const originalWidth = this.paddle.w;
                        const targetWidth = this.paddle.w + 30;
                        const animationDuration = 100;
                        const startTime = performance.now();

                        const animatePaddle = (currentTime) => {
                            const elapsedTime = currentTime - startTime;
                            const progress = Math.min(elapsedTime / animationDuration, 1);
                            this.paddle.w = originalWidth + progress * (targetWidth - originalWidth);

                            if (progress < 1) {
                                requestAnimationFrame(animatePaddle);
                            } else {
                                // La animación ha terminado, puedes realizar acciones adicionales aquí
                                this.showBonification('AGRANDAS PADDLE !', 4000)
                                setTimeout(() => {
                                    // Inicia la animación para achicar la barra después de un tiempo de espera
                                    this.shrinkPaddle();
                                }, 4000); // Espera 1 segundo antes de achicar la barra
                            }
                        };

                        animatePaddle(startTime);
                        // Marca la bonificación como aplicada
                    } else if (elementFalling.element.bonification === "nula") {
                        // Falta resolver
                    }
                    elementFalling.appliedBonification = true;
                }
                return false;
            }

            if (elementFalling.y > this.canvas.height) {
                return false;
            }

            return true;
        });
    }

    // SHRINK PADDLE
    shrinkPaddle() {
        const originalWidth = this.paddle.w;
        const targetWidth = this.paddle.w - 30;
        const animationDuration = 100; // Puedes ajustar la duración según sea necesario
        const startTime = performance.now();

        const animatePaddleShrink = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / animationDuration, 1);
            this.paddle.w = originalWidth + progress * (targetWidth - originalWidth);

            if (progress < 1) {
                requestAnimationFrame(animatePaddleShrink);
            }
        };

        animatePaddleShrink(startTime);
    }

    // UPDATE PADDLE MOVEMENT
    movePaddle() {
        this.paddle.x += this.paddle.dx;
    
        // Wall detection
        if (this.paddle.x + this.paddle.w > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.w;
        }
    
        if (this.paddle.x < 0) {
            this.paddle.x = 0;
        }    
    }

    // UPDATE BALL MOVEMENT
    moveBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        
        // this.checkBottomCollision()
        this.checkBorderCanvasCollision()
        this.checkPaddleCollision()
        this.checkBrickCollision()
    }

     updateStatus(scaleRatio, deltaTime) {
        this.gameConfig.width *= scaleRatio.xRatio;
        this.gameConfig.height *= scaleRatio.yRatio;
        this.movePaddle();  
        this.moveBall()
        this.fallingElement()
        this.updateBrokenBrickEffect()
    }

    // CHECK BRICK COLLISION
    checkBrickCollision () {
        // Brick collision
        this.bricks?.forEach((column, columnIndex) => {
            column.forEach((brick, brickIndex) => {
                if (brick.visible) {
                    if (
                    this.ball.x - this.ball.size > brick.x && 
                    this.ball.x + this.ball.size < brick.x + brick.w &&
                    this.ball.y + this.ball.size > brick.y &&
                    this.ball.y - this.ball.size < brick.y + brick.h
                    ) {
                        this.ball.dy *= -1;
                        if (brick.element && brick.visible) {
                            this.createElementToFall(brick.x, brick.y, brick.element, brick.w, brick.h, brick.brickColor)
                            brick.visible = false;
                        }
                        this.ball.speed += 0.02;
                        setTimeout(() => {
                            this.createParticlesBrokenEffect(brick, 100)
                        }, 50);
                        this.score = this.score + 1;
                        this.setScore(this.score)
                    }
                }
            });
        });
    }

    // CHECK PADDLE COLLISION
    checkPaddleCollision () {
      // Paddle collision
      if (
        this.ball.x - this.ball.size > this.paddle.x &&
        this.ball.x + this.ball.size < this.paddle.x + this.paddle.w &&
        this.ball.y + this.ball.size > this.paddle.y
      ) {
        this.ball.dy = - this.ball.speed;
      }
    }

    // CHECK CANVAS BORDER COLLISION
    checkBorderCanvasCollision () {
        // Wall collision (right/left)
         if (this.ball.x + this.ball.size > this.canvas.width || this.ball.x - this.ball.size < 0) {
            this.ball.dx *= -1; // ball.dx = ball.dx * -1
        }
  
        // Wall collision (top/bottom)
        if (this.ball.y + this.ball.size > this.canvas.height || this.ball.y - this.ball.size < 0) {
            this.ball.dy *= -1;
        }
    }

    // CHECK BOTTOM COLLISION
    checkBottomCollision () {
        if (this.ball.y + this.ball.size > this.canvas.height) {
            if(this.lives > 0){
                this.lives = this.lives - 1
                this.setLives(this.lives)
                this.resetBallAndPaddle();
                this.showAllBricks();
            }else{
                this.setGameEndResult()
                this.gameOver();
            }
        }
    }

    // RESET GAME
    resetBallAndPaddle () {
        // Restablece la posición del paddle y la pelota al centro o a una posición inicial
        this.paddle.x = this.canvas.width / 2 - this.paddle.w / 2; 
        this.paddle.y = this.canvas.height - 20; 
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = 2; 
        this.ball.dy = -2;
    }

    // Make all bricks appear
    showAllBricks () {
        this.bricks?.forEach(column => {
            column.forEach(brick => (brick.visible = true));
        });
    } 

    // GAME OVER
    gameOver () { 
        this.gameEndModal('FIN DEL JUEGO', `Obtuviste una puntuacion de ${this.score}`, () => this.saveGameResults())
    }

}

export default BricksClass;
