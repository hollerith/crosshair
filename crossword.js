class Word {
    constructor(word, clue) {
        this.word = word;
        this.clue = clue;
        this.length = word.length;
    }
}

class Crossword {
    constructor(availableWords) {
        this.grid = [];
        this.gridSize = 16;
        this.empty = "-";
        this.availableWords = availableWords;
        this.debug = false;

        // Call createCrossword method when creating a new Crossword instance
        if (this.availableWords.length) {
            this.createCrossword();
        }
    }

    createGraph() {
        // Create a map to store the graph
        const graph = new Map();

        // Iterate through the available words
        for (const word of this.availableWords) {
            // Add the word to the graph
            graph.set(word, new Set());

            // Find common letters with other words
            for (const otherWord of this.availableWords) {
                if (word === otherWord) continue;

                const commonLetters = this.findCommonLetters(word.word, otherWord.word);

                // If there are common letters, add an edge to the graph
                if (commonLetters.length > 0) {
                    graph.get(word).add([otherWord, commonLetters]);
                }
            }
        }

        return graph;
    }

    findCommonLetters(word1, word2) {
        const commonLetters = [];

        // Iterate through each letter in the first word
        for (let i = 0; i < word1.length; i++) {
            // Check if the letter appears in the second word
            const index = word2.indexOf(word1[i]);
            if (index !== -1) {
                // If the letter appears, add the letter and its position in the second word to the list of common letters
                commonLetters.push([i, index]);
            }
        }

        return commonLetters;
    }

    createGrid() {
        // Create an empty grid
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid.push(new Array(this.gridSize).fill(null));
        }
    }

    createCrossword() {
        // Create a graph of the words
        this.graph = this.createGraph(this.availableWords);

        this.createGrid();

        // Place the first word in the grid
        const firstWord = this.availableWords[0];
        this.placeFirstWord(firstWord);
        this.addWordsToGrid(firstWord);

        this.render();
    }

    placeFirstWord(word) {
        // Set the initial word on the grid in a random orientation
        const orientation = Math.random() > 0.5 ? "horizontal" : "vertical";
        word.x = 0;
        word.y = 0;
        word.orientation = orientation;

        if (orientation === "horizontal") {
            for (let i = 0; i < word.length; i++) {
                this.grid[0][i] = {
                    index: i,
                    letter: word.word[i],
                    visible: true,
                    word: word
                }
            }
        } else {
            for (let i = 0; i < word.length; i++) {
                this.grid[i][0] = {
                    index: i,
                    letter: word.word[i],
                    visible: true,
                    word: word
                };
            }
        }
        this.placedWords = [this.availableWords.shift()];
    }

    addWordsToGrid(parent) {
        // Get the edges of the parent node
        const edges = [...this.graph.get(parent)].filter(word => this.availableWords.includes(word[0]));

        // Process the edges
        for (const edge of edges) {
            // Place the word in the grid
            if (this.placeNextWord(edge, parent)) {
                // If the word was successfully placed in the grid, remove it from the list of available words
                this.availableWords = this.availableWords.filter(availableWord => availableWord !== edge[0]);
                this.placedWords.push(edge[0]);

                // Recurse with the placed edge as the new parent
                this.addWordsToGrid(edge[0]);
            }
        }
    }

    placeNextWord(edge, parent) {
        // Find a common letter that satisfies the placement criteria
        const word = edge[0];
        const orientation = parent.orientation === "horizontal" ? "vertical" : "horizontal";
        let commonLetter = null;

        // Check if the word has already been placed on the grid
        if (this.placedWords.includes(word)) {
            return false;
        }

        for (const [parentIndex, childIndex] of edge[1]) {
            if (
                (orientation === "vertical" && childIndex <= parent.x && parent.x + word.length - childIndex <= this.gridSize) ||
                (orientation === "horizontal" && childIndex <= parent.y && parent.y + word.length - childIndex <= this.gridSize)
            ) {
                commonLetter = [parentIndex, childIndex];
                // If a valid common letter was found, place the edge word on the grid
                if (commonLetter) {
                    word.orientation = orientation;

                    if (orientation === "vertical") {
                        word.x = parent.x - childIndex;
                        word.y = parent.y + parentIndex;

                        // If there is a gap, place the word on the grid
                        if (this.hasGap(word, word.x, word.y, orientation)) {
                            for (let i = 0; i < word.length; i++) {
                                this.grid[word.x + i][word.y] = {
                                    index: i,
                                    letter: word.word[i],
                                    visible: true,
                                    word: word
                                };
                            }
                            return true;
                        }
                    } else {
                        word.x = parent.x + parentIndex;
                        word.y = parent.y - childIndex;

                        // If there is a gap, place the word on the grid
                        if (this.hasGap(word, word.x, word.y, orientation)) {
                            for (let i = 0; i < word.length; i++) {
                                this.grid[word.x][word.y + i] = {
                                    index: i,
                                    letter: word.word[i],
                                    visible: true,
                                    word: word
                                };
                            }
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    hasGap(word, x, y, orientation) {
        let count = 1, score = 1;
        if (this.debug == word.word) {
            debugger
        }

        for (const letter of word.word) {
            const activeCell = this.grid[x][y] ? this.grid[x][y].letter : null;
            if (activeCell !== null && activeCell !== letter) {
                return 0;
            }
            if (activeCell === letter) {
                score++;
            }
            if (orientation === "vertical") {
                if (activeCell !== letter) {
                    if (y > 0 && this.grid[x][y - 1] !== null) {
                        return 0;
                    }
                    if (y + 1 < this.gridSize && this.grid[x][y + 1] !== null) {
                        return 0;
                    }
                }
                if (count === 1) {
                    if (x > 0 && this.grid[x - 1][y] !== null) {
                        return 0;
                    }
                }
                if (count === word.length) {
                    if (x + 1 < this.gridSize && this.grid[x + 1][y] !== null) {
                        return 0;
                    }
                }
                x++;
            } else {
                if (activeCell !== letter) {
                    if (x > 0 && this.grid[x - 1][y] !== null) {
                        return 0;
                    }
                    if (x + 1 < this.gridSize && this.grid[x + 1][y] !== null) {
                        return 0;
                    }
                }
                if (count === 1) {
                    if (y > 0 && this.grid[x][y - 1] !== null) {
                        return 0;
                    }
                }
                if (count === word.length) {
                    if (y + 1 < this.gridSize && this.grid[x][y + 1] !== null) {
                        return 0;
                    }
                }
                y++;
            }
            count++;
        }
        return score;
    }

    renderGrid() {
        // Get the container element
        const container = document.getElementById("crossword");

        // Clear the container element
        container.innerHTML = "";

        // Iterate through each row of the grid
        for (const row of this.grid) {
            // Create a row element
            const rowElement = document.createElement("div");
            rowElement.classList.add("crossword-row");

            // Iterate through each cell in the row
            for (const cell of row) {
                // Create a cell element
                const cellElement = document.createElement("span");
                cellElement.classList.add("crossword-cell");

                // Set the cell content and style based on whether it is an empty cell or not
                if (cell) {
                    if (cell.word && cell.index === 0) {
                        // Create a superscript element for the number
                        const numberElement = document.createElement("sup");
                        numberElement.textContent = cell.word.number;
                        numberElement.style.position = "absolute";
                        numberElement.style.top = "0";
                        numberElement.style.left = "0";
                        
                        // Add the number element to the cell element
                        cellElement.appendChild(numberElement);
                    }
                    const letterNode = document.createTextNode(cell.letter);
                    cellElement.appendChild(letterNode);
                } else {
                    cellElement.style.backgroundColor = "black";
                }

                // Add the cell element to the row element
                rowElement.appendChild(cellElement);
            }

            // Add the row element to the container element
            container.appendChild(rowElement);
        }
    }

    setClues() {
        // Create an empty list of clues
        this.clues = [];

        // Iterate through the placed words
        for (const word of this.placedWords) {
            // Add the clue to the list of clues
            word.number = this.clues.length + 1
            this.clues.push({
                number: word.number,
                clue: word.clue,
                orientation: word.orientation === 'horizontal' ? 'across' : 'down',
                answer: word.word
            });
        }

        // Sort the clues by orientation and number
        this.clues.sort((a, b) => {
            if (a.orientation === b.orientation) {
                return a.number - b.number;
            } else if (a.orientation === "across") {
                return -1;
            } else {
                return 1;
            }
        });
    }

    renderClues() {
        let clues = this.clues;

        // Create an HTML element to hold the clues
        const cluesElement = document.getElementById("clues");

        // Clear the container element
        cluesElement.innerHTML = "";

        // Create a heading for the across clues
        const acrossHeading = document.createElement("h2");
        acrossHeading.innerText = "Across";
        cluesElement.appendChild(acrossHeading);

        // Create a list of across clues
        const acrossCluesList = document.createElement("ol");
        acrossCluesList.classList.add("across-clues");
        for (const clue of clues) {
            if (clue.orientation === "across") {
                const clueElement = document.createElement("li");
                clueElement.innerHTML = `${clue.clue} <span class="answer">${clue.answer}</span> (${clue.answer.length})`;
                acrossCluesList.appendChild(clueElement);
            }
        }
        cluesElement.appendChild(acrossCluesList);

        // Create a heading for the down clues
        const downHeading = document.createElement("h2");
        downHeading.innerText = "Down";
        cluesElement.appendChild(downHeading);

        // Create a list of down clues
        const downCluesList = document.createElement("ol");
        downCluesList.classList.add("down-clues");
        for (const clue of clues) {
            if (clue.orientation === "down") {
                const clueElement = document.createElement("li");
                clueElement.innerHTML = `${clue.clue} <span class="answer">${clue.answer}</span> (${clue.answer.length})`;
                downCluesList.appendChild(clueElement);
            }
        }
        cluesElement.appendChild(downCluesList);
    }

    render() {

        this.setClues();
        this.renderClues();
        this.renderGrid(); 
        
    }
}
