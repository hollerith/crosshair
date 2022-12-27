const availableWords = [
    new Word("desk", "A piece of furniture with a flat or sloping top, typically equipped with drawers, at which one can write or read while seated"),
    new Word("chair", "A piece of furniture with a back and four legs, designed to seat one person"),
    new Word("table", "A piece of furniture with a flat top and one or more legs, used for supporting objects"),
    new Word("book", "A written or printed work consisting of pages bound together, containing written or printed matter"),
    new Word("pen", "A writing instrument with a metal point and ink reservoir, used for writing or drawing on paper"),
    new Word("paper", "Thin, flat material made from crushed wood or cloth, used for writing, printing, or drawing on"),
    new Word("keyboard", "A panel of keys that operate a computer or typewriter"),
    new Word("mouse", "A small device, typically held with the hand, that is moved on a flat surface to control the movement of a cursor on a computer screen"),
    new Word("monitor", "A device that displays information, especially text and graphics, from a computer"),
    new Word("printer", "A machine that prints text or illustrations onto paper"),
    new Word("laptop", "A small, portable computer that can be used while being carried"),
    new Word("phone", "A device used for communication, typically equipped with a transmitter and a receiver, that converts sound waves into electrical signals"),
    new Word("television", "A device for reproducing and displaying moving images and sound"),
    new Word("camera", "A device for taking photographs, using film or digital memory"),
    new Word("speaker", "An electrical device that converts electrical signals into sound waves"),
    new Word("microwave", "An electronic device that cooks or heats food by producing microwaves that penetrate the food and cause its molecules to vibrate"),
    new Word("refrigerator", "An appliance or container for keeping food or drink cool, typically one having a coolant system and one or more compartments for storing food on shelves"),
    new Word("oven", "A device, typically a box-shaped metal receptacle with a door, used for cooking food by means of dry heat or heat and moisture"),
    new Word("toaster", "An electric device that toasts bread by heating the bread on both sides"),
    new Word("blender", "A device for blending or grinding food, typically consisting of a container with a rotating metal blade at the base"),
    new Word("kettle", "A container, typically made of metal, with a spout and handle, used for boiling water"),
    new Word("dishwasher", "A device that washes dishes automatically, using water, detergent, and sometimes heat"),
    new Word("house", "A building for human habitation"),
    new Word("car", "A road vehicle, typically with four wheels, powered by an internal combustion engine or an electric motor, and designed for the transportation of people or goods"),
    new Word("tree", "A large woody plant with a single trunk, typically growing to a considerable height and having a crown of branches"),
    new Word("dog", "A domesticated carnivorous mammal"),
    new Word("computer", "An electronic device for storing and processing data, typically in binary form, according to instructions given to it in a variable program")
];

const fileInput = document.querySelector('#file-input');

// Add an event listener for when the file input changes
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const fileContents = event.target.result;

        // Split the file contents into lines
        const lines = fileContents.replace(/"/g, '').split('\n').filter(line => line.trim() !== '');

        // Split the lines into an array of clues
        const clues = lines.map((line) => {
            // Split each line into an array of values
            const values = line.split(',');
            // Extract the clue and answer from the array of values
            const clue = values[0];
            const answer = values.slice(1).join(',');
            return {
                clue: clue,
                answer: answer,
            };
        });

        // Open an IndexedDB database
        const request = window.indexedDB.open('clues_database', 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['clues'], 'readwrite');
            const objectStore = transaction.objectStore('clues');

            clues.forEach((clue) => {
                objectStore.add(clue);
            });
        };
    };

    reader.readAsText(file);
});

// Open an IndexedDB database
const request = window.indexedDB.open('clues_database', 1);

request.onsuccess = (event) => {
    const db = event.target.result;

    // Check if the object store exists
    if (db.objectStoreNames.contains('clues')) {
        // The object store exists, so you can perform transactions on it
        const transaction = db.transaction(['clues'], 'readonly');
        const objectStore = transaction.objectStore('clues');

        // Get all clues from the object store
        const clues = [];
        objectStore.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                clues.push(cursor.value);
                cursor.continue();
            } else {
                // Use the clues from the object store
                console.log(clues);
                const bagOfWords = clues.map((clue) => {
                    return new Word(clue.id, clue.text);
                }).sort((a, b) => b.word.length - a.word.length);
                const crossword = new Crossword(bagOfWords);
                crossword.debug = false;
            }
        };
    } else {
        // The object store does not exist
        console.log('Object store "clues" does not exist');
    }
};

request.onupgradeneeded = (event) => {
    const db = event.target.result;
    // Check if the object store exists
    if (!db.objectStoreNames.contains('clues')) {
        // The object store does not exist, so you need to create it
        const objectStore = db.createObjectStore('clues', { keyPath: 'id' });

        fetch('https://cryptics.georgeho.org/data/clues.csv?_size=max')
            .then(response => response.text())
            .then(text => {
                const clues = [];

                // Split the text by newline characters to get an array of rows
                const rows = text.split('\n');

                // Iterate over the rows and split them by comma to get an array of cells
                rows.forEach(row => {
                    const cells = row.split(',');

                    // Remove the number of letters from the clue
                    const clue = cells[1].replace(/\(\d+\)/, '');

                    // Add the clue and answer to the cluesAndAnswers array
                    clues.push({
                        clue: clue,
                        answer: cells[2]
                    });
                });
                clues.forEach((word) => {
                    objectStore.add({ id: clue, text: answer });
                });        
                console.log(clues);
            });
    }
};

request.onerror = (event) => {
    console.error('An error occurred while upgrading the database:', event.target.error);
};

const deleteButton = document.querySelector('#delete');
deleteButton.addEventListener('click', () => {
    // Open an IndexedDB database
    const request = window.indexedDB.open('clues_database', 1);

    request.onsuccess = (event) => {
        const db = event.target.result;
        db.close();
        // Delete the database
        window.indexedDB.deleteDatabase('clues_database');
    };
});
