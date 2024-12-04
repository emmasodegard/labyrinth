import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";

const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.BLUE,
    "$": ANSI.COLOR.YELLOW,
    "X": ANSI.COLOR.RED,
    "B": ANSI.COLOR.CYAN,
    "T": ANSI.COLOR.MAGENTA,
    "►": ANSI.COLOR.GREEN,
    "◀︎": ANSI.COLOR.GREEN,
    "▲": ANSI.COLOR.GREEN,
    "▼": ANSI.COLOR.GREEN,
    "-": ANSI.COLOR.WHITE,
    "P": ANSI.COLOR.GREEN,
    "!": ANSI.COLOR.RED
};

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const NPC = "X";
const BOSS = "B";
const TELEPORT = "T";
const PROJECTILE = "-";
const HEALTH_POTION = 'P';
const POISON = '!';
const DOORS = ["►", "◀︎", "▲", "▼"];
const THINGS = [LOOT, EMPTY, TELEPORT, HEALTH_POTION, POISON, ...DOORS];

let eventQueue = [];
const HP_MAX = 10;

let playerStats = {
    hp: 8,
    cash: 0,
    strength: 3,
    defense: 1,
    damageFlag: false
};

class Labyrinth {
    constructor() {
        this.levels = levels;
        this.currentLevelID = startingLevel;
        this.playerPos = {
            row: null,
            col: null,
        };
        this.isDirty = true;
        this.NPCs = [];
        this.bosses = [];
        this.projectiles = [];
        this.previousLevelID = null;
        this.loadLevel(this.currentLevelID);
    }

    loadLevel(levelID, enteringDoor = null) {
        if (!this.levels[levelID]) {
            console.error(`Level "${levelID}" not found.`);
            return;
        }
        this.level = readMapFile(this.levels[levelID]);
        this.previousLevelID = this.currentLevelID;
        this.currentLevelID = levelID;
        this.playerPos.row = null;
        this.playerPos.col = null;
        this.isDirty = true;
        this.NPCs = [];
        this.projectiles = [];
        this.bosses = [];

        for (let row = 0; row < this.level.length; row++) {
            for (let col = 0; col < this.level[row].length; col++) {
                let symbol = this.level[row][col];
                if (symbol == HERO) {
                    this.playerPos.row = row;
                    this.playerPos.col = col;
                    this.level[row][col] = EMPTY;
                } else if (symbol === NPC) {
                    this.NPCs.push({
                        row: row,
                        col: col,
                        startRow: row,
                        startCol: col,
                        hDirection: 1,
                        vDirection: 1,
                        hp: 5,
                        strength: 2,
                        damageFlag: false
                    });
                } else if (symbol == BOSS) {
                    this.bosses.push({
                        row: row,
                        col: col,
                        hp: 10,
                        direction: this.currentLevelID === "start" ? -1 : 1
                    });
                }
            }
        }

        if (this.playerPos.row === null || this.playerPos.col === null) {
            let placedHero = false;
            if (enteringDoor) {
                for (let row = 0; row < this.level.length; row++) {
                    for (let col = 0; col < this.level[row].length; col++) {
                        if (this.level[row][col] == enteringDoor) {
                            this.playerPos.row = row;
                            this.playerPos.col = col;
                            placedHero = true;
                            break;
                        }
                    }
                    if (placedHero) break;
                }
            }
            if (!placedHero) {
                for (let row = 0; row < this.level.length; row++) {
                    for (let col = 0; col < this.level[row].length; col++) {
                        if (this.level[row][col] == EMPTY) {
                            this.playerPos.row = row;
                            this.playerPos.col = col;
                            placedHero = true;
                            break;
                        }
                    }
                    if (placedHero) break;
                }
            }
            if (!placedHero) {
                console.error("Failed to place the hero in the level.");
            }
        }
    }

    update() {
        if (this.playerPos.row === null || this.playerPos.col === null) {
            return;
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
        }

        let tRow = this.playerPos.row + drow;
        let tCol = this.playerPos.col + dcol;

        let currentItem = this.level[tRow]?.[tCol];

        if (currentItem === undefined || currentItem == '█') {
            return;
        }

        if (this.isPositionOccupiedByNPC(tRow, tCol)) {
            let npc = this.getNPCAtPosition(tRow, tCol);

            let damageToPlayer = Math.max(0, npc.strength - playerStats.defense);
            playerStats.hp -= damageToPlayer;
            playerStats.damageFlag = true;
            eventQueue.push(`Enemy hits you for ${damageToPlayer} damage!`);

            let damageToNPC = Math.max(0, playerStats.strength - 1);
            npc.hp -= damageToNPC;
            npc.damageFlag = true;
            eventQueue.push(`You hit enemy for ${damageToNPC} damage!`);

            if (npc.hp <= 0) {
                eventQueue.push(`Enemy defeated!`);
                this.NPCs.splice(this.NPCs.indexOf(npc), 1);
            }

            if (playerStats.hp <= 0) {
                eventQueue.push(`You have been defeated! Game Over.`);
                console.log(eventQueue.join('\n'));
                process.exit();
            }

            this.isDirty = true;
            return;
        } else if (currentItem == HEALTH_POTION) {
            let healAmount = 5;
            playerStats.hp = Math.min(playerStats.hp + healAmount, HP_MAX);
            eventQueue.push(`You found a potion! +${healAmount} HP`);
            this.level[tRow][tCol] = EMPTY;
            this.playerPos.row = tRow;
            this.playerPos.col = tCol;
            this.isDirty = true;
        } else if (currentItem == POISON) {
            let damageAmount = 3;
            playerStats.hp -= damageAmount;
            playerStats.damageFlag = true;
            eventQueue.push(`You stepped on poison! -${damageAmount} HP`);
            this.level[tRow][tCol] = EMPTY;
            if (playerStats.hp <= 0) {
                eventQueue.push(`You have been poisoned! Game Over.`);
                console.log(eventQueue.join('\n'));
                process.exit();
            }
            this.playerPos.row = tRow;
            this.playerPos.col = tCol;
            this.isDirty = true;
        } else if (THINGS.includes(currentItem)) {
            if (currentItem == LOOT) {
                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.cash += loot;
                eventQueue.push(`Player gained ${loot}$`);
                this.level[tRow][tCol] = EMPTY;
            } else if (currentItem == TELEPORT) {
                this.handleTeleport(tRow, tCol);
                return;
            } else if (DOORS.includes(currentItem)) {
                if (this.currentLevelID === 'thirdLevel') {
                    console.log("You Won! Game Over");
                    process.exit();
                } else {
                    let nextLevelID = doorMappings[this.currentLevelID][currentItem];
                    if (nextLevelID) {
                        this.loadLevel(nextLevelID, enteringDoorOpposites[currentItem]);
                        return;
                    }
                }
            }
            this.playerPos.row = tRow;
            this.playerPos.col = tCol;
            this.isDirty = true;
        } else if (currentItem == EMPTY) {
            this.playerPos.row = tRow;
            this.playerPos.col = tCol;
            this.isDirty = true;
        }

        this.updateNPCs();

        this.updateBosses();

        this.updateProjectiles();
    }

    isPositionOccupiedByNPC(row, col) {
        return this.NPCs.some(npc => npc.row === row && npc.col === col);
    }

    getNPCAtPosition(row, col) {
        return this.NPCs.find(npc => npc.row === row && npc.col === col);
    }

    handleTeleport(tRow, tCol) {
        let teleportPositions = [];
        for (let row = 0; row < this.level.length; row++) {
            for (let col = 0; col < this.level[row].length; col++) {
                if (this.level[row][col] == TELEPORT) {
                    teleportPositions.push({ row, col });
                }
            }
        }
        teleportPositions = teleportPositions.filter(pos => !(pos.row == tRow && pos.col == tCol));
        if (teleportPositions.length > 0) {
            let otherTeleport = teleportPositions[0];
            this.playerPos.row = otherTeleport.row;
            this.playerPos.col = otherTeleport.col;
            this.isDirty = true;
            eventQueue.push("Teleported!");
        } else {
            eventQueue.push("No other teleport found!");
        }
    }

    updateNPCs() {
        for (let npc of this.NPCs) {
            if (Math.random() < 0.5) {
                let moveHorizontally = Math.random() < 0.5;

                let nextRow = npc.row;
                let nextCol = npc.col;

                if (moveHorizontally) {
                    nextCol += npc.hDirection;
                } else {
                    nextRow += npc.vDirection;
                }

                let nextCell = this.level[nextRow]?.[nextCol];
                if (nextCell === '█' || nextCell === undefined) {
                    if (moveHorizontally) {
                        npc.hDirection *= -1;
                    } else {
                        npc.vDirection *= -1;
                    }
                    continue;
                }

                if (nextRow === this.playerPos.row && nextCol === this.playerPos.col) {
                    continue;
                }

                npc.row = nextRow;
                npc.col = nextCol;
                this.isDirty = true;
            }
        }
    }

    updateBosses() {
        for (let boss of this.bosses) {
            if (Math.random() < 0.1) {
                let projCol = boss.col + boss.direction;
                if (this.level[boss.row][projCol] == EMPTY || (boss.row == this.playerPos.row && projCol == this.playerPos.col)) {
                    this.projectiles.push({
                        row: boss.row,
                        col: projCol,
                        direction: boss.direction,
                        symbol: PROJECTILE
                    });
                    this.isDirty = true;
                }
            }
        }
    }

    updateProjectiles() {
        let newProjectiles = [];
        for (let proj of this.projectiles) {
            let nextCol = proj.col + proj.direction;
            let nextCell = this.level[proj.row]?.[nextCol];

            if (nextCell == '█' || nextCell === undefined) {
                this.isDirty = true;
                continue;
            }

            if (proj.row == this.playerPos.row && nextCol == this.playerPos.col) {
                let damageAmount = 2;
                playerStats.hp -= damageAmount;
                playerStats.damageFlag = true;
                eventQueue.push(`Hit by a projectile! -${damageAmount} HP`);
                if (playerStats.hp <= 0) {
                    eventQueue.push(`You have been defeated! Game Over.`);
                    console.log(eventQueue.join('\n'));
                    process.exit();
                }
                this.isDirty = true;
                continue;
            }

            proj.col = nextCol;
            newProjectiles.push(proj);
            this.isDirty = true;
        }
        this.projectiles = newProjectiles;
    }

    draw() {
        if (!this.isDirty) {
            return;
        }
        this.isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendering = "";

        rendering += this.renderHud();

        for (let row = 0; row < this.level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < this.level[row].length; col++) {
                if (row == this.playerPos.row && col == this.playerPos.col) {
                    let symbol = HERO;
                    let color = pallet[HERO];
                    if (playerStats.damageFlag) {
                        color += ANSI.BACKGROUND_COLOR.RED;
                        playerStats.damageFlag = false;
                    }
                    rowRendering += color + symbol + ANSI.COLOR_RESET;
                } else if (this.isPositionOccupiedByNPC(row, col)) {
                    let npc = this.getNPCAtPosition(row, col);
                    let symbol = NPC;
                    let color = pallet[NPC];
                    if (npc.damageFlag) {
                        color += ANSI.BACKGROUND_COLOR.RED;
                        npc.damageFlag = false;
                    }
                    rowRendering += color + symbol + ANSI.COLOR_RESET;
                } else if (this.isPositionOccupiedByProjectile(row, col)) {
                    rowRendering += pallet[PROJECTILE] + PROJECTILE + ANSI.COLOR_RESET;
                } else if (this.isPositionOccupiedByBoss(row, col)) {
                    rowRendering += pallet[BOSS] + BOSS + ANSI.COLOR_RESET;
                } else {
                    let symbol = this.level[row][col];
                    if (pallet[symbol] != undefined) {
                        rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                    } else {
                        rowRendering += symbol;
                    }
                }
            }
            rowRendering += "\n";
            rendering += rowRendering;
        }

        console.log(rendering);
        if (eventQueue.length > 0) {
            console.log(eventQueue.join('\n'));
            if (eventQueue.length > 3) {
                eventQueue.shift();
            }
        }
    }

    isPositionOccupiedByProjectile(row, col) {
        return this.projectiles.some(proj => proj.row === row && proj.col === col);
    }

    isPositionOccupiedByBoss(row, col) {
        return this.bosses.some(boss => boss.row === row && boss.col === col);
    }

    renderHud() {
        let hpBar = `Life:[${ANSI.COLOR.RED}${this.pad(playerStats.hp, '♥')}${ANSI.COLOR_RESET}` +
            `${ANSI.COLOR.LIGHT_GRAY}${this.pad(HP_MAX - playerStats.hp, '♥')}${ANSI.COLOR_RESET}]`;
        let cash = `$:${playerStats.cash}`;
        let strength = `Str:${playerStats.strength}`;
        return `${hpBar} ${cash} ${strength}\n`;
    }

    pad(len, text) {
        let output = "";
        for (let i = 0; i < len; i++) {
            output += text;
        }
        return output;
    }
}

const doorMappings = {
    "start": {
        "►": "aSharpPlace"
    },
    "aSharpPlace": {
        "◀︎": "start",
        "▲": "thirdLevel"
    },
    "thirdLevel": {
        "▼": null
    }
};

const enteringDoorOpposites = {
    "►": "◀︎",
    "◀︎": "►",
    "▲": "▼",
    "▼": "▲"
};

export default Labyrinth;
