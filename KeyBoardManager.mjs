import * as readline from "node:readline";

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

const KEY_ID = {
    down: "down",
    up: "up",
    left: "left",
    right: "right",
    return: "return",
    escape: "escape",
    r: "r",
    w: "w",
    a: "a",
    s: "s",
    d: "d",
    W: "W",
    A: "A",
    S: "S",
    D: "D"
};

const KEY_STATES = Object.keys(KEY_ID).reduce((prev, cur) => {
    prev[cur] = false;
    return prev;
}, {});

process.stdin.on("keypress", (str, key) => {
    if (key.name == KEY_ID.escape) {
        process.exit();
    }

    if (KEY_STATES.hasOwnProperty(key.name)) {
        KEY_STATES[key.name] = true;
    }
});

function readKeyState(key) {
    let value = KEY_STATES[key];
    KEY_STATES[key] = false;
    return value;
}

const KeyBoardManager = {

    isEnterPressed: () => {
        return readKeyState(KEY_ID.return);
    },

    isDownPressed: () => {
        return readKeyState(KEY_ID.down) || readKeyState(KEY_ID.s) || readKeyState(KEY_ID.S);
    },
    isUpPressed: () => {
        return readKeyState(KEY_ID.up) || readKeyState(KEY_ID.w) || readKeyState(KEY_ID.W);
    },
    isLeftPressed: () => {
        return readKeyState(KEY_ID.left) || readKeyState(KEY_ID.a) || readKeyState(KEY_ID.A);
    },
    isRightPressed: () => {
        return readKeyState(KEY_ID.right) || readKeyState(KEY_ID.d) || readKeyState(KEY_ID.D);
    },
    isRotatePressed: () => {
        return readKeyState(KEY_ID.r);
    }

};

export default KeyBoardManager;
