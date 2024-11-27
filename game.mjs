import Labyrinth from "./labyrint.mjs";
import SplashScreen from "./splashScreen.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import ANSI from "./utils/ANSI.mjs";

const REFRESH_RATE = 250;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let intervalID = null;
let isBlocked = false;
let state = null;

function init() {
    state = new SplashScreen();
    intervalID = setInterval(update, REFRESH_RATE);
}

function update() {
    if (isBlocked) { return; }
    isBlocked = true;

    state.update();
    state.draw();

    if (state.isDone) {
        state = new Labyrinth();
    }

    isBlocked = false;
}

init();
