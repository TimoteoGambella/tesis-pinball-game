import basket from './assets/images/basket/basket.png';
import basketDamage from './assets/images/basket/basket-damage.png';
import basketGood from './assets/images/basket/basket-good.png';
import backgroundImage from './assets/images/word-catcher/background.png'

const wordsColors = [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#4FF33E",
    "#2EF5CE",
    "#FA6E45",
    "#00FFEC",
    "#08FF00",
    "#70FF00",
    "#FF7400",
    "#FF4D00",
    "#FFB900",
    "#F3FF00",
    "#00D1FF",
    "#15ADFF",
    "#078BC0"
];


class WordCatcherClass {
    ctx;
    config;

    ///
    marginX = 5;

    //Mouse
    isLastClicked = false;

    mouse = {
        x: 0,
        y: 0,
        click: false,
        enter: false
    };
    positionBasket = {
        x: 500,
        y: 800,
        desplace: {
            x: 0,
            y: 0
        }
    }
    sizeBasket = {
        width: 150,
        height: 50
    }

    frameCount = 0;

    gameEnd = false;

    //Images
    imgBasket = null;
    imgBasketDamage = null;
    imgBasketGood = null;
    imageBackground = null;

    opacityBasketDamage = 0;
    opacityBasketGood = 0;
    basketImgCharge = false;

    gameEndFunction = null;
    huterWordFuction = null;

    elements = {
        damageElements: [],
        elementsToCatch: []
    }

    elementsToFalling = [];

    intervalGenerateWords;

    userErrors = 0;

    correctHuntedWords = [];
    incorrectHuntedWords = [];

    constructor(ctx, config = { width: 500, height: 500, size: 10 }, elements = { elementsToCatch: [], damageElements: [] }, gameEndFunction, huterWordFuction) {
        this.ctx = ctx;
        this.config = config;
        this.elements = elements;
        this.gameEndFunction = gameEndFunction;
        this.huterWordFuction = huterWordFuction;

        // Set image background
        this.imageBackground = new Image()
        this.imageBackground.src = backgroundImage
        this.imageBackground.onload = () => {

            this.imgBasket = new Image();
            this.imgBasket.src = basket;
            this.imgBasket.onload = () => {

                this.imgBasketDamage = new Image();
                this.imgBasketDamage.src = basketDamage;
                this.imgBasketDamage.onload = () => {

                    this.imgBasketGood = new Image();
                    this.imgBasketGood.src = basketGood;
                    this.imgBasketGood.onload = () => {
                        this.basketImgCharge = true;
                    }
                }
            }
        }

        this.huterWordFuction(this.elements.elementsToCatch, this.correctHuntedWords, this.incorrectHuntedWords)
        this.intervalGenerateWords = setInterval(this.generateWords, 1000);
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
        this.ctx.fillStyle = '#000000'
        this.ctx.beginPath()
        this.ctx.fill()
    }

    updateStatus(mouse, scaleRatio) {
        if (this.gameEnd === true) return;

        this.config.width *= scaleRatio.xRatio;
        this.config.height *= scaleRatio.yRatio;

        this.mouse = mouse;

        this.mouse.x *= scaleRatio.xRatio;
        this.mouse.y *= scaleRatio.yRatio;

        //Save last Variables
        this.isLastClicked = this.mouse.click;

        if (this.opacityBasketGood > 0 || (this.opacityBasketGood - 0.09) > 0) {
            this.opacityBasketGood -= 0.09;
        } else {
            this.opacityBasketGood = 0;
        }

        if (this.opacityBasketDamage > 0 || (this.opacityBasketDamage - 0.09) > 0) {
            this.opacityBasketDamage -= 0.09;
            let desplace = 10;
            this.positionBasket.desplace = {
                x: Math.floor(Math.random() * (desplace - -desplace + 1) + -desplace),
                y: Math.floor(Math.random() * (desplace - -desplace + 1) + -desplace)
            }
        } else {
            this.opacityBasketDamage = 0;
            this.positionBasket.desplace = {
                x: 0,
                y: 0
            }
        }

        this.updatePositionBasket();
        this.moveWords()
    }

    updatePositionBasket() {
        this.positionBasket.x = this.mouse.x
    }

    generateWords = () => {
        if (this.gameEnd === true) return;
        let number = Math.floor(Math.random() * 150);
        if (number < 150) {
            let isGoodWord = Math.floor(Math.random() * 100);

            let newWordString = "";

            if (isGoodWord < 40) {
                let wordAttempts = 0;
                do {
                    wordAttempts += 1;

                    newWordString = this.elements.elementsToCatch[Math.floor(Math.random() * this.elements.elementsToCatch.length)].name;

                    let wordAlreadyFalling = this.elementsToFalling.filter(word => word.word === newWordString);

                    if (wordAlreadyFalling.length > 0 || this.correctHuntedWords.includes(newWordString)) {
                        newWordString = "";
                    }
                    if (wordAttempts > 100) return;

                } while (newWordString === "");
            } else {
                newWordString = this.elements.damageElements[Math.floor(Math.random() * this.elements.damageElements.length)].name;
            }

            let wordWidth = this.ctx.measureText(newWordString).width;
            let velocity = Math.random() * (1.5) + 0.5;

            let position = {
                init: -1,
                center: -1,
                end: -1
            };
            let positionAttempts = 0;

            do {
                positionAttempts += 1;

                let positionInit = Math.floor(Math.random() * ((this.config.width - wordWidth) - (this.marginX * 2))) + this.marginX;
                position = {
                    init: positionInit,
                    center: positionInit + (wordWidth / 2),
                    end: positionInit + wordWidth
                }

                let positionsAlreadyTaken = this.elementsToFalling.filter(word => {

                    if (
                        (word.x.init <= position.init && word.x.end >= position.init) ||
                        (word.x.init <= position.end && word.x.end >= position.end) ||
                        (position.init <= word.x.init && position.end >= word.x.end) ||
                        (position.init >= word.x.init && position.end <= word.x.end)
                    ) {

                        let counter = 0;
                        while (true) {
                            if ((counter * velocity) < this.config.height && ((counter * word.speed) + word.y) < this.config.height) {
                                if ((counter * velocity) + 400 >= ((counter * word.speed) + word.y)) {
                                    return true;
                                }
                            } else {
                                return false;
                            }
                            counter++;
                        }
                    }

                    return false;
                });

                if (positionsAlreadyTaken.length > 0) {
                    position.init = -1;
                }

                if (positionAttempts > 200) return;
            } while (position.init === -1);


            this.elementsToFalling.push({
                name: newWordString,
                speed: velocity,
                y: 0,
                x: position,
                color: 'red',
                width: wordWidth
            })
        }
    }

    moveWords() {
        for (let i = 0; i < this.elementsToFalling.length; i++) {
            this.elementsToFalling[i].y += this.elementsToFalling[i].speed;
            let elementFalling = this.elementsToFalling[i];

            if (elementFalling.y >= this.positionBasket.y && elementFalling.y <= this.positionBasket.y + this.sizeBasket.height) {
                let posBasket = {
                    init: this.positionBasket.x - (this.sizeBasket.width / 2),
                    end: this.positionBasket.x + (this.sizeBasket.width / 2)
                }

                if (
                    (elementFalling.x.init > posBasket.init && elementFalling.x.init < posBasket.end) ||
                    (elementFalling.x.center > posBasket.init && elementFalling.x.center < posBasket.end) ||
                    (elementFalling.x.end > posBasket.init && elementFalling.x.end < posBasket.end)
                ) {
                    let index = this.elements.damageElements.findIndex(element => element.name === elementFalling.name)
                    if (index !== -1) {
                        this.basketOnDamage()
                        let alreadyHunted = this.incorrectHuntedWords.includes(elementFalling.name);
                        if(!alreadyHunted){
                            this.incorrectHuntedWords.push(elementFalling.name)
                            this.huterWordFuction(this.elements.elementsToCatch, this.correctHuntedWords, this.incorrectHuntedWords)
                        }
                    } else {                        
                        this.correctHuntedWords.push(elementFalling.name);
                        this.huterWordFuction(this.elements.elementsToCatch, this.correctHuntedWords, this.incorrectHuntedWords)
                        this.opacityBasketGood = 0.8;
                    }
                    this.elementsToFalling.splice(i, 1);
                }
            }

            if (elementFalling.y > (this.config.height + 40)) {
                this.elementsToFalling.splice(i, 1);
            }
        }
    }

    draw() {
        this.clearCanvas();

        this.ctx.globalAlpha = 0.5;
        this.ctx.drawImage(this.imageBackground, 0, 0, this.config.width, this.config.height)
        this.ctx.globalAlpha = 1;

        if (!this.basketImgCharge) return;
        this.drawelementsToFalling()
        let distanceCenter = this.sizeBasket.width / 2;
        this.ctx.strokeStyle = "#ff0000";

        this.ctx.drawImage(this.imgBasket, this.positionBasket.x - distanceCenter, this.positionBasket.y, this.sizeBasket.width, 50);

        //Bascket Damage Draw
        this.ctx.globalAlpha = this.opacityBasketDamage;
        this.ctx.drawImage(
            this.imgBasketDamage,
            (this.positionBasket.x - distanceCenter) - this.positionBasket.desplace.x,
            this.positionBasket.y - this.positionBasket.desplace.y,
            this.sizeBasket.width, 50
        );

        //Bascket Good Draw
        this.ctx.globalAlpha = this.opacityBasketGood;
        this.ctx.drawImage(
            this.imgBasketGood,
            this.positionBasket.x - distanceCenter,
            this.positionBasket.y,
            this.sizeBasket.width, 50
        );

        this.ctx.globalAlpha = 1;
    }

    drawelementsToFalling() {
        this.ctx.font = "bold 50px Comic-Sans";
        this.ctx.textBaseline = 'middle';
        //this.ctx.textAlign = "center";
        for (let i = 0; i < this.elementsToFalling.length; i++) {
            let elementFalling = this.elementsToFalling[i];
            this.ctx.fillStyle = elementFalling.color;
            this.ctx.fillText(elementFalling.name, elementFalling.x.init, elementFalling.y)
        }
    }

    basketOnDamage() {
        this.opacityBasketDamage = 0.8;
        this.userErrors++;
    }

    onEndGame() {
        this.gameEnd = true;
        this.gameEndFunction();
    }
}

export default WordCatcherClass;
