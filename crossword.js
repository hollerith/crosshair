class Crossword {
    constructor(cols, rows, available_words = []) {
        this.cols = cols;
        this.rows = rows;
        this.empty = "-";
        this.available_words = available_words;
        this.randomizeWordList();
        this.currentWordList = [];
        this.debug = 0;
        this.clearGrid();
    }

    clearGrid() {
        this.grid = [];
        for (let i = 0; i < this.rows; i++) {
            const eaRow = [];
            for (let j = 0; j < this.cols; j++) {
                eaRow.push(this.empty);
            }
            this.grid.push(eaRow);
        }
    }

    randomizeWordList() {
        const tempList = [];
        for (const word of this.available_words) {
            if (word instanceof Word) {
                tempList.push(new Word(word.word, word.clue));
            } else {
                tempList.push(new Word(word[0], word[1]));
            }
        }
        tempList.sort(() => Math.random() - 0.5);
        this.available_words = tempList;
    }

    computeCrossword(timeout = 5000) {
        this.clearGrid();
        this.current_word_list = [];
        this.randomizeWordList();
        const startTime = Date.now();
        const result = this.dfs(0, startTime, timeout);
        if (!result) {
            console.log("Search timed out");
        }
    }

    dfs(wordIndex, startTime, timeout) {
        if (wordIndex === this.available_words.length) {
            // All words have been placed, stop the search
            return true;
        }
        if (Date.now() - startTime > timeout) {
            // Time-out reached, stop the search
            return false;
        }

        const word = this.available_words[wordIndex];
        const coords = this.suggestCoord(word);
        for (const coord of coords) {
            if (this.checkFit(coord, word)) {
                this.addWord(coord, word);
                if (this.dfs(wordIndex + 1, startTime, timeout)) {
                    // Solution found, stop the search
                    return true;
                }
                this.removeWord(coord, word);
            }
        }
        // No solution found, continue the search
        return false;
    }

    suggestCoord(word) {
        const coordList = [];
        let givenLetterIndex = -1;
        for (const givenLetter of word.word) {
            givenLetterIndex += 1;
            let rowIndex = 0;
            for (const row of this.grid) {
                rowIndex += 1;
                let colIndex = 0;
                for (const cell of row) {
                    colIndex += 1;
                    if (givenLetter === cell) {
                        if (rowIndex - givenLetterIndex > 0) {
                            if ((rowIndex - givenLetterIndex) + word.length <= this.rows) {
                                coordList.push([
                                    colIndex,
                                    rowIndex - givenLetterIndex,
                                    1,
                                    colIndex + (rowIndex - givenLetterIndex),
                                    0
                                ]);
                            }
                        }
                        if (colIndex - givenLetterIndex > 0) {
                            if ((colIndex - givenLetterIndex) + word.length <= this.cols) {
                                coordList.push([
                                    colIndex - givenLetterIndex,
                                    rowIndex,
                                    0,
                                    rowIndex + (colIndex - givenLetterIndex),
                                    0
                                ]);
                            }
                        }
                    }
                }
            }
        }
        const newCoordList = this.sortCoordList(coordList, word);
        return newCoordList;
    }

    sortCoordList(coordList, word) {
        const newCoordList = [];
        for (const coord of coordList) {
            let fits = 0;
            let startx = coord[0];
            let starty = coord[1];
            const addx = coord[2];
            const addy = coord[3];
            let curx = startx;
            let cury = starty;
            for (const letter of word.word) {
                if (this.grid[cury][curx] === letter || this.grid[cury][curx] === this.empty) {
                    fits += 1;
                }
                curx += addx;
                cury += addy;
            }
            newCoordList.push([coord[0], coord[1], fits]);
        }
        newCoordList.sort((a, b) => b[2] - a[2]);
        return newCoordList;
    }

    fitAndAdd(word) {
        const coordList = this.suggestCoord(word);
        for (const coord of coordList) {
            let fits = 0;
            let startx = coord[0];
            let starty = coord[1];
            const addx = coord[2];
            const addy = coord[3];
            let curx = startx;
            let cury = starty;
            for (const letter of word.word) {
                if (this.grid[cury][curx] === letter || this.grid[cury][curx] === this.empty) {
                    fits += 1;
                }
                curx += addx;
                cury += addy;
            }
            if (fits === word.length) {
                curx = startx;
                cury = starty;
                for (const letter of word.word) {
                    this.grid[cury][curx] = letter;
                    curx += addx;
                    cury += addy;
                }
                this.currentWordList.push(word);
                break;
            }
        }
    }

    printClues() {
        const container = document.createElement("ul");
        document.body.appendChild(container);
        let counter = 1;
        for (const word of this.current_word_list) {
            const item = document.createElement("li");
            item.textContent = `${counter}. ${word.direction === 0 ? "Across: " : "Down: "}${word.clue}`;
            container.appendChild(item);
            counter++;
        }
    }

}

class Word {
    constructor(word, clue) {
        this.word = word;
        this.clue = clue;
        this.length = word.length;
    }
}
