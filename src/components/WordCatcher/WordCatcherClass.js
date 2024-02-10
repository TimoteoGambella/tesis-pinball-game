import basket from './assets/images/basket/basket.png';
import basketDamage from './assets/images/basket/basket-damage.png';
import basketGood from './assets/images/basket/basket-good.png';
import backgroundSandyBeach from './assets/images/word-catcher/sunset-in-sandy-beach-standard-theme.png';
import backgroundRelaxedSunnyBeach from'./assets/images/word-catcher/relaxed-sunny-beach-standard-theme.png';
import backgroundClearBlueWater from'./assets/images/word-catcher/clear-blue-water-standard-theme.png';
import backgroundBeachHouseDecor from'./assets/images/word-catcher/beach-house-decor-standard-theme.png';
import { MEDIA_PREVIEW } from '../../../CONSTANT';

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

const backgroundImages = [
    backgroundSandyBeach,
    backgroundRelaxedSunnyBeach,
    backgroundClearBlueWater,
    backgroundBeachHouseDecor
]

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

    words = {
        kindWords: [],
        badWords: []
    }

    wordsToFalling = [];

    intervalGenerateWords;

    userErrors = 0;

    correctHuntedWords = [];
    incorrectHuntedWords = [];

    constructor(ctx, config = { width: 500, height: 500, size: 15 }, words = { kindWords: [], badWords: [] }, gameEndFunction, huterWordFuction) {
        this.ctx = ctx;
        this.config = config;
        this.words = words;

        this.gameEndFunction = gameEndFunction;
        this.huterWordFuction = huterWordFuction;

        let numberImage = undefined
        this.imageBackground = new Image()

        if(config.background_image?.startsWith('@@@') && !config?.is_external){
            this.imageBackground.src = MEDIA_PREVIEW + config.background_image;
        }else if(config.background_image?.startsWith('http') && config?.is_external) {
            // external image
            this.imageBackground.src = config.background_image
        } else if (typeof config.background_image === 'number') {
            // xEval v1 activityInfo or xEval v2 with no image saved
            if (config.background_image == 0 || !config.background_image ) {
                numberImage = Math.floor(Math.random() * (backgroundImages.length)) + 0
            } else {
                numberImage = config.background_image - 1
            }
            this.imageBackground.src = backgroundImages[numberImage ?? 0]
        } else if (config.background_image?.endsWith('-standard-theme.png') && !config?.is_external) {
            // predefined theme background image
            const imageTheme = config.background_image.split(/[/.]+/)[4]
            const imageThemeIndex = backgroundImages?.findIndex(img => img.includes(imageTheme))
           
            this.imageBackground.src =  backgroundImages[imageThemeIndex ?? 0]
        } else {
            // faulty or no data... pick image at random from predefined theme background images
            numberImage = Math.floor(Math.random() * (backgroundImages.length)) + 0         
            this.imageBackground.src = backgroundImages[numberImage]
        }

        this.imageBackground.onerror = () => {
            // faulty or no data... pick image at random from predefined theme background images
            numberImage = Math.floor(Math.random() * (backgroundImages.length)) + 0         
            this.imageBackground.src = backgroundImages[numberImage]
        }

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

        this.huterWordFuction(this.words.kindWords, this.correctHuntedWords, this.incorrectHuntedWords)
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

                    newWordString = this.words.kindWords[Math.floor(Math.random() * this.words.kindWords.length)];

                    let wordAlreadyFalling = this.wordsToFalling.filter(word => word.word === newWordString);

                    if (wordAlreadyFalling.length > 0 || this.correctHuntedWords.includes(newWordString)) {
                        newWordString = "";
                    }
                    if (wordAttempts > 100) return;

                } while (newWordString === "");
            } else {
                newWordString = this.words.badWords[Math.floor(Math.random() * this.words.badWords.length)];
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

                let positionsAlreadyTaken = this.wordsToFalling.filter(word => {

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

            let colorRandom = this.config?.word_color || wordsColors[Math.floor(Math.random() * wordsColors.length)]

            this.wordsToFalling.push({
                word: newWordString,
                speed: velocity,
                y: 0,
                x: position,
                color: colorRandom,
                width: wordWidth
            })
        }
    }

    moveWords() {
        for (let i = 0; i < this.wordsToFalling.length; i++) {
            this.wordsToFalling[i].y += this.wordsToFalling[i].speed;
            let word = this.wordsToFalling[i];

            if (word.y >= this.positionBasket.y && word.y <= this.positionBasket.y + this.sizeBasket.height) {
                let posBasket = {
                    init: this.positionBasket.x - (this.sizeBasket.width / 2),
                    end: this.positionBasket.x + (this.sizeBasket.width / 2)
                }

                if (
                    (word.x.init > posBasket.init && word.x.init < posBasket.end) ||
                    (word.x.center > posBasket.init && word.x.center < posBasket.end) ||
                    (word.x.end > posBasket.init && word.x.end < posBasket.end)
                ) {

                    if (this.words.badWords.includes(word.word)) {
                        this.basketOnDamage()
                        let alreadyHunted = this.incorrectHuntedWords.includes(word.word);
                        if(!alreadyHunted){
                            this.incorrectHuntedWords.push(word.word)
                            this.huterWordFuction(this.words.kindWords, this.correctHuntedWords, this.incorrectHuntedWords)
                        }
                    } else {

                        let isGoodWord = this.words.kindWords.includes(word.word);
                        let alreadyHunted = this.correctHuntedWords.includes(word.word);

                        if (isGoodWord === true && alreadyHunted === false) {
                            this.correctHuntedWords.push(word.word);

                            this.huterWordFuction(this.words.kindWords, this.correctHuntedWords, this.incorrectHuntedWords)

                            let allHunted = this.words.kindWords.filter(goodWord => !this.correctHuntedWords.includes(goodWord));
                            this.opacityBasketGood = 0.8;

                            if (allHunted.length === 0) this.onEndGame();
                        }
                    }
                    this.wordsToFalling.splice(i, 1);
                }
            }

            if (word.y > (this.config.height + 40)) {
                this.wordsToFalling.splice(i, 1);
            }
        }
    }

    draw() {
        this.clearCanvas();

        this.ctx.globalAlpha = 0.5;
        this.ctx.drawImage(this.imageBackground, 0, 0, this.config.width, this.config.height)
        this.ctx.globalAlpha = 1;

        if (!this.basketImgCharge) return;
        this.drawWordsToFalling()
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

    drawWordsToFalling() {
        this.ctx.font = "bold 50px Comic-Sans";
        this.ctx.textBaseline = 'middle';
        //this.ctx.textAlign = "center";
        for (let i = 0; i < this.wordsToFalling.length; i++) {
            let word = this.wordsToFalling[i];
            this.ctx.fillStyle = word.color;
            this.ctx.fillText(word.word, word.x.init, word.y)
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
