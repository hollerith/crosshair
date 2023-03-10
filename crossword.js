class Word {
    constructor(word, clue) {
        this.word = word;
        this.clue = clue;
        this.length = word.length;
        this.selected = false;
    }
}

class Crossword {
    constructor(availableWords) {
        this.grid = [];
        this.gridSize = 16;
        this.reveal = false;
        this.availableWords = availableWords;
        this.debug = false;

        // Call createCrossword method when creating a new Crossword instance
        if (this.availableWords.length) {
            this.createCrossword();
        }

        //  T R I G G E R S 

        // Get the crossword element
        this.crosswordElement = document.querySelector("#crossword");

        // Add an event listener to the crossword element
        this.crosswordElement.addEventListener("input", (event) => {
            const textNode = event.target.firstChild;
            textNode.textContent = event.data || '';

            // Limit the length of the text node to 1 character
            if (textNode.textContent.length > 1) {
                textNode.textContent = textNode.textContent.slice(0, 1);
            }

            this.nextField(event);
        });

        // Add an event listener to the crossword element
        this.crosswordElement.addEventListener("click", (event) => {
            // Check if the event target is a cell element
            if (event.target.classList.contains("crossword-cell")) {
                this.getFocus(event.target);
            }
        });

        // Get the clues element
        this.cluesElement = document.querySelector("#clues");

        // Add an event listener to the clue element
        this.cluesElement.addEventListener("click", (event) => {
            // Check if the event target is a clue element
            if (event.target.classList.contains("clue")) {
                this.getFocus(event.target);
            }
        });

        document.getElementById('guess').addEventListener('blur', function () {
            // Get the word from the input field
            const guess = document.getElementById('guess').value;
            console.log(guess);
            document.getElementById('modal').style.display = 'none';
        });

    }

    //  M E T H O D S
    nextField(event) {
        const cellData = document.querySelector(`li.selected`).getAttribute('data-clue');
        const cell = JSON.parse(cellData);
        const currentClue = this.clues.findIndex(clue => clue.word.number === cell.word.number);

        const selected = Array.from(document.querySelectorAll(`:not(li).selected span`));
        const index = selected.indexOf(event.target);
 
        if (event.target === selected[selected.length - 1]) {
            const nextClue = this.clues[(currentClue + 1) % this.clues.length];
            this.getFocus(document.querySelector(`.${this.keyOf(nextClue.word)}`));
        } else {
            selected[index + 1].focus();
        }
    }

    getFocus(target) {

        // Get the data-clue attribute of the cell element
        const cellData = target.getAttribute("data-clue");
        // Parse the cell data
        const cell = JSON.parse(cellData);

        const deselected = document.querySelectorAll(".selected");
        if (deselected) {
            deselected.forEach((node) => {
                node.classList.remove('selected');
            })
        }
        const selected = document.querySelectorAll(`.${this.keyOf(cell.word)}`);
        selected.forEach((node) => {
            node.classList.add('selected');
        });

        document.querySelector(`.${this.keyOf(cell.word)} span`).focus();
    }

    keyOf(word) {
        return `clue-${word.number}${word.orientation[0]}`
    }

    showModal(event, cell) {
        // Display the modal
        const width = (1.5 * cell.word.length) + 1
        const guess = document.getElementById('guess');

        guess.value = '';
        guess.placeholder = '_'.repeat(cell.word.length);
        guess.style.width = `${width}em`;

        const modal = document.getElementById('modal');
        modal.style.display = 'block';
        modal.style.position = 'absolute';

        if (event.clientX + modal.offsetWidth > (window.innerWidth * .666) || event.clientY + modal.offsetHeight > (window.innerHeight * .666)) {
            modal.style.top = event.clientY - 100 + 'px';
            modal.style.left = event.clientX - 100 + 'px';
        } else {
            modal.style.top = event.clientY + 50 + 'px';
            modal.style.left = event.clientX + 50 + 'px';
        }
        guess.focus();
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

        // Filter the availableWords array to get all the words with the maximum length
        const longestWords = this.availableWords.filter(word => word.length === Math.max(...this.availableWords.map(word => word.length)));

        // Generate a random index between 0 and the length of the longestWords array
        const randomIndex = Math.floor(Math.random() * longestWords.length);

        // Select a random word from the longestWords array
        const firstWord = longestWords[randomIndex];

        this.placeFirstWord(firstWord);
        this.addWordsToGrid(firstWord);

        this.render();
    }

    placeFirstWord(word) {
        // Set the initial word on the grid in a random orientation
        const orientation = Math.random() > 0.5 ? "across" : "down";
        word.x = 0;
        word.y = 0;
        word.orientation = orientation;

        if (orientation === "across") {
            for (let i = 0; i < word.length; i++) {
                this.grid[0][i] = {
                    index: i,
                    letter: word.word[i],
                    visible: this.reveal,
                    word: word,
                    twin: null
                }
            }
        } else {
            for (let i = 0; i < word.length; i++) {
                this.grid[i][0] = {
                    index: i,
                    letter: word.word[i],
                    visible: this.reveal,
                    word: word,
                    twin: null
                };
            }
        }
        this.placedWords = [word];
        this.availableWords = this.availableWords.filter(availableWord => availableWord !== word);
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
        const orientation = parent.orientation === "across" ? "down" : "across";
        let commonLetter = null;

        // Check if the word has already been placed on the grid
        if (this.placedWords.includes(word)) {
            return false;
        }

        for (const [parentIndex, childIndex] of edge[1]) {
            if (
                (orientation === "down" && childIndex <= parent.x && parent.x + word.length - childIndex <= this.gridSize) ||
                (orientation === "across" && childIndex <= parent.y && parent.y + word.length - childIndex <= this.gridSize)
            ) {
                commonLetter = [parentIndex, childIndex];
                // If a valid common letter was found, place the edge word on the grid
                if (commonLetter) {
                    word.orientation = orientation;

                    if (orientation === "down") {
                        word.x = parent.x - childIndex;
                        word.y = parent.y + parentIndex;

                        // If there is a gap, place the word on the grid
                        if (this.hasGap(word, word.x, word.y, orientation)) {
                            for (let i = 0; i < word.length; i++) {
                                this.grid[word.x + i][word.y] = {
                                    index: i,
                                    letter: word.word[i],
                                    visible: this.reveal,
                                    word: word,
                                    twin: this.grid[word.x + i][word.y]
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
                                    visible: this.reveal,
                                    word: word,
                                    twin: this.grid[word.x][word.y + i]
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

        for (const letter of word.word) {
            const activeCell = this.grid[x][y] ? this.grid[x][y].letter : null;
            if (activeCell !== null && activeCell !== letter) {
                return 0;
            }
            if (activeCell === letter) {
                score++;
            }
            if (orientation === "down") {
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
                cellElement.setAttribute("data-clue", JSON.stringify(cell));

                // Set the cell content and style based on whether it is an empty cell or not
                if (cell) {
                    if (cell.word && (cell.index === 0 || cell.twin?.index == 0)) {
                        // Create a superscript element for the number
                        const numberElement = document.createElement("sup");
                        numberElement.textContent = cell.index == 0 ? cell.word.number : cell.twin.word.number;
                        numberElement.contentEditable = false;

                        // Add the number element to the cell element
                        cellElement.appendChild(numberElement);
                    }
                    if (cell.visible) {
                        const letterNode = document.createTextNode(cell.letter);
                        cellElement.appendChild(letterNode);
                    } else {
                        const editNode = document.createElement('span');
                        editNode.contentEditable = true;
                        cellElement.appendChild(editNode);
                    }
                    if (cell.word.selected) {
                        cellElement.classList.add("selected");
                    }
                    cellElement.classList.add(`${this.keyOf(cell.word)}`)
                    if (cell.twin) {
                        cellElement.classList.add(`${this.keyOf(cell.twin.word)}`)
                    }
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

        // Sort the placed words by their coordinates
        this.placedWords.sort((a, b) => {
            if (a.x === b.x) {
                return a.y - b.y;
            } else {
                return a.x - b.x;
            }
        });

        // Iterate through the placed words
        let number = 1;
        for (const word of this.placedWords) {
            // Check if the previous word has the same x,y coordinates
            const prevWord = this.clues[this.clues.length - 1];
            if (prevWord && prevWord.word.x === word.x && prevWord.word.y === word.y) {
                // If the previous word has the same coordinates, use the same number for this word
                word.number = prevWord.number;
            } else {
                // Otherwise, use the next number in the sequence
                word.number = number;
                number++;
            }

            // Add the clue to the list of clues
            this.clues.push({
                number: word.number,
                clue: word.clue,
                orientation: word.orientation,
                word: word
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
        const acrossCluesList = document.createElement("ul");
        acrossCluesList.classList.add("across-clues");
        for (const clue of clues) {
            if (clue.orientation === "across") {
                const clueElement = document.createElement("li");
                clueElement.innerHTML = `${clue.number}. ${clue.clue} (${clue.word.length})`;
                clueElement.classList.add("clue");
                clueElement.classList.add(`${this.keyOf(clue.word)}`);
                clueElement.setAttribute("data-clue", JSON.stringify(clue));
                acrossCluesList.appendChild(clueElement);
            }
        }
        cluesElement.appendChild(acrossCluesList);

        // Create a heading for the down clues
        const downHeading = document.createElement("h2");
        downHeading.innerText = "Down";
        cluesElement.appendChild(downHeading);

        // Create a list of down clues
        const downCluesList = document.createElement("ul");
        downCluesList.classList.add("down-clues");
        for (const clue of clues) {
            if (clue.orientation === "down") {
                const clueElement = document.createElement("li");
                clueElement.innerHTML = `${clue.number}. ${clue.clue} (${clue.word.length})`;
                clueElement.classList.add("clue")
                clueElement.classList.add(`${this.keyOf(clue.word)}`);
                clueElement.setAttribute("data-clue", JSON.stringify(clue));
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
