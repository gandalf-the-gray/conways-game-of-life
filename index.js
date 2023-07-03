const matrixConfig = {
    ROW_COUNT: 50,
    COL_COUNT: 100,
    generationalDelay: 100,
    cellHeight: function() {
        return document.documentElement.clientHeight / this.ROW_COUNT;
    },
    cellWidth: function() {
        return document.documentElement.clientWidth / this.COL_COUNT;
    },
};

const playState = {
    PLAYING: "playing",
    PAUSED: "paused",
}

const NEIGHBOR_POSITION_DELTAS = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

class Cell {
    static getHash(row, col) {
        return `${row}.${col}`;
    }

    constructor(row, col, neighborCount = 0) {
        this.row = row;
        this.col = col;
        this.neighborCount = neighborCount;
        this.hash = Cell.getHash(row, col);
    }
}

function getCell(cellHeight, cellWidth) {
    const div = document.createElement("div");
    div.style.height = `${cellHeight}px`;
    div.style.width = `${cellWidth}px`;
    div.classList.add(...["cursor-pointer", "border"]);
    return div;
}

function getMatrix(rowCount, colCount, cellHeight, cellWidth, game) {
    const body = document.body;
    const matrixConfig = [];
    for(let row = 0; row < rowCount; row++) {
        matrixConfig.push(new Array(20).fill(0));
        // let color = ['red', 'green', 'blue', 'yellow', 'pink', 'slate'].map((col) => `bg-${col}-400`)
        // color = color[Math.floor(Math.random() * color.length)]
        for(let col = 0; col < colCount; col++) {
            const cell = getCell(cellHeight, cellWidth);
            cell.onclick = function() {
                game.toggleCell(row, col);
            };
            // cell.classList.add(color);
            matrixConfig[row][col] = cell;
            body.appendChild(cell);
        }
    }
    return matrixConfig;
}

class Game {
    constructor() {
        this.matrix = getMatrix(matrixConfig.ROW_COUNT, matrixConfig.COL_COUNT, matrixConfig.cellHeight(), matrixConfig.cellWidth(), this);
        // TODO: Make currentGeneartion an array
        this.currentGeneration = {};
        this.state = playState.PAUSED;
    }

    activateCell(row, col) {
        this.matrix[row][col].classList.remove("bg-white");
        this.matrix[row][col].classList.add("bg-blue-300");
    }

    deactivateCell(row, col) {
        this.matrix[row][col].classList.remove("bg-blue-300");
        this.matrix[row][col].classList.add("bg-white");
    }

    addCell(row, col) {
        const cell = new Cell(row, col, 3);
        this.currentGeneration[cell.hash] = cell;
        this.activateCell(row, col);
    }

    removeCell(row, col) {
        delete this.currentGeneration[Cell.getHash(row, col)];
        this.deactivateCell(row, col);
    }

    toggleCell(row, col) {
        if(this.state !== playState.PAUSED) {
            return;
        }
        if(this.currentGeneration[Cell.getHash(row, col)]) {
            this.removeCell(row, col);
        } else {
            this.addCell(row, col);
        }
    }

    start() {
        this.state = playState.PLAYING;
        this.loop();
    }

    pause() {
        this.state = playState.PAUSED;
    }

    reset() {
        setTimeout(() => {
            this.pause();
            const cells = this.currentGeneration;
            this.currentGeneration = {};
            for(const cellHash in cells) {
                this.deactivateCell(cells[cellHash].row, cells[cellHash].col);
            }
        })
    }

    async loop() {
        if(this.state === playState.PAUSED) {
            return;
        }
        const nextGeneration = {};
        for (let cellHash in this.currentGeneration) {
            let cell = this.currentGeneration[cellHash];
            if(!nextGeneration[cellHash]) {
                // Check if the cell has the cellHash, some other cell might have added this one
                // as a neighbor
                
                // Get the row and col for this cell
                cell = this.currentGeneration[cellHash];
                // Set the neighbor-count for this cell to zero, initially
                // TODO: set the initial neighborCount to 1 so you won't have to check if a cell
                // was formerly alive?
                cell.neighborCount = 0;
                nextGeneration[cellHash] = cell;
            }
            // Get the neighbor cells for this cell
            const neighborCells = NEIGHBOR_POSITION_DELTAS.map(([rowDel, colDel]) => [cell.row + rowDel, cell.col + colDel]);
            for(const neighbor of neighborCells) {
                const [row, col] = neighbor;
                // Check if the neighbor falls outside the matrix
                if(!this.matrix[row] || !this.matrix[row][col]) {
                    continue;
                }
                const hash = Cell.getHash(row, col);
                // If the neighbor is not included in the next generation, include it with
                // the initial neighbor-count of 0
                if(!(hash in nextGeneration)) {
                    nextGeneration[hash] = new Cell(row, col);
                }
                // Increment the neighbor-count for the neighbor
                // the cell in the current generation is acknowledging it's neighbor
                nextGeneration[hash].neighborCount++;

                // The neighbor also acknowledges the cell
                // nextGeneration[cellHash].neighborCount++;
            }
        }
        const prevGeneration = this.currentGeneration;
        this.currentGeneration = {};
        for(const cellHash in nextGeneration) {
            const cell = nextGeneration[cellHash];
            // TODO: refactor these conditionals
            if(prevGeneration[cell.hash]) {
                if(cell.neighborCount === 2 || cell.neighborCount === 3) {
                    this.currentGeneration[cell.hash] = cell;
                } else {
                    this.deactivateCell(cell.row, cell.col);
                }
            } else if(cell.neighborCount === 3) {
                this.currentGeneration[cell.hash] = cell;
                this.activateCell(cell.row, cell.col);
            }
        }
        setTimeout(() => {
            this.loop();
        }, matrixConfig.generationalDelay);
    }
}
