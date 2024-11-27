import ANSI from "./utils/ANSI.mjs";

const outputGraphics = `
 ██▓    ▄▄▄       ▄▄▄▄ ▓██   ██▓ ██▀███   ██▓ ███▄    █ ▄▄▄█████▓ ██░ ██
▓██▒   ▒████▄    ▓█████▄▒██  ██▒▓██ ▒ ██▒▓██▒ ██ ▀█   █ ▓  ██▒ ▓▒▓██░ ██▒
▒██░   ▒██  ▀█▄  ▒██▒ ▄██▒██ ██░▓██ ░▄█ ▒▒██▒▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▀▀██░
▒██░   ░██▄▄▄▄██ ▒██░█▀  ░ ▐██▓░▒██▀▀█▄  ░██░▓██▒  ▐▌██▒░ ▓██▓ ░ ░▓█ ░██
░██████▒▓█   ▓██▒░▓█  ▀█▓░ ██▒▓░░██▓ ▒██▒░██░▒██░   ▓██░  ▒██▒ ░ ░▓█▒░██▓
░ ▒░▓  ░▒▒   ▓▒█░░▒▓███▀▒ ██▒▒▒ ░ ▒▓ ░▒▓░░▓  ░ ▒░   ▒ ▒   ▒ ░░    ▒ ░░▒░▒
░ ░ ▒  ░ ▒   ▒▒ ░▒░▒   ░▓██ ░▒░   ░▒ ░ ▒░ ▒ ░░ ░░   ░ ▒░    ░     ▒ ░▒░ ░
  ░ ░    ░   ▒    ░    ░▒ ▒ ░░    ░░   ░  ▒ ░   ░   ░ ░   ░       ░  ░░ ░
    ░  ░     ░  ░ ░     ░ ░        ░      ░           ░           ░  ░  ░
                         ░░ ░
`;

class SplashScreen {
    constructor() {
        this.frames = 0;
        this.isDone = false;
        this.dirty = true;
        this.lines = outputGraphics.trim().split("\n");
        this.totalLines = this.lines.length;

        this.colors = [
            ANSI.COLOR.WHITE,
            ANSI.COLOR.CYAN,
            ANSI.COLOR.BLUE
        ];
    }

    update() {
        this.frames++;
        if (this.frames >= this.lines.length + 10) {
            this.isDone = true;
        }
        this.dirty = true;
    }

    draw() {
        if (this.dirty) {
            this.dirty = false;
            console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

            const colorTransitionPoints = [
                Math.floor(this.totalLines / 3),
                Math.floor((this.totalLines * 2) / 3)
            ];

            for (let i = 0; i < this.frames && i < this.lines.length; i++) {
                let color;
                if (i < colorTransitionPoints[0]) {
                    color = this.colors[0];
                } else if (i < colorTransitionPoints[1]) {
                    color = this.colors[1];
                } else {
                    color = this.colors[2];
                }
                console.log(color + this.lines[i] + ANSI.COLOR_RESET);
            }
        }
    }
}

export default SplashScreen;
