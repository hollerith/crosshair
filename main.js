const clues = [];

const retrieve = (db) => {
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
                if (clues) {
                    const bagOfWords = clues.map((clue) => {
                        return new Word(clue.id, clue.text);
                    }).sort((a, b) => b.word.length - a.word.length);
                    const crossword = new Crossword(bagOfWords);
                    crossword.debug = false;
                } else {
                    console.log('There are no clues');
                }
            }
        };
    } else {
        // The object store does not exist
        console.log('Object store "clues" does not exist');
    }
}

// Create button
const createButton = document.querySelector('#create-button');

createButton.addEventListener('click', () => {
    // Open an IndexedDB database
    const request = window.indexedDB.open('clues_database', 1);

    request.onsuccess = (event) => {
        const db = event.target.result;
        retrieve(db)
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Check if the object store exists
        if (!db.objectStoreNames.contains('clues')) {
            // The object store does not exist, so you need to create it
            const objectStore = db.createObjectStore('clues', { keyPath: 'id' });
            clues.forEach((word) => {
                objectStore.add({ id: word.id, text: word.text });
            });
        }
    };

    request.onerror = (event) => {
        console.error('An error occurred while upgrading the database:', event.target.error);
    };
});

// Delete database button
const deleteButton = document.querySelector('#delete-button');

deleteButton.addEventListener('click', () => {
    // Open an IndexedDB database
    const request = window.indexedDB.open('clues_database', 1);

    request.onsuccess = (event) => {
        const db = event.target.result;
        db.close();
        // Delete the database
        window.indexedDB.deleteDatabase('clues_database');

        document.querySelector("#crossword").innerHTML = '';
        document.querySelector("#clues").innerHTML = '';
        console.log('Cleared database');
    };
});

// Import database button
const importButton = document.querySelector('#import-button');

importButton.addEventListener('click', async () => {
    // Import clues 
    await fetch('https://cryptics.georgeho.org/data/clues.csv?_size=max')
        .then(response => response.text())
        .then(text => {
            // Split the text by newline characters to get an array of rows
            const rows = text.split('\n').slice(1);

            // Iterate over the rows and split them by comma to get an array of cells
            rows.forEach(row => {
                const regex = /^[^,]*,\s*(?:"([^"]*)"|([^",]*))\s*,\s*([^,]*)/;
                const match = regex.exec(row);
                if (match) {
                    // Remove the quoted parts and number of letters from the clue
                    const clue = match[1] || match[2];

                    // Add the clue and answer 
                    clues.push({
                        id: match[3].replace(/[^A-Za-z]/g, ''),
                        text: clue.replace(/\(\d+\)/, '')
                    });
                }
            });
            return clues;
        }).then(clues => {
            // Filter out clues with an id longer than 16 letters
            const filteredClues = clues.filter(word => word.id.length < 16);

            // Use a Map to store the clues to remove duplicates
            const cluesMap = new Map();
            filteredClues.forEach(word => {
                cluesMap.set(word.id, word.text);
            });

            // Convert the Map to an array
            const uniqueClues = [...cluesMap];

            const request = window.indexedDB.open('clues_database', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Check if the object store exists
                if (!db.objectStoreNames.contains('clues')) {
                    // The object store does not exist, so you need to create it
                    db.createObjectStore('clues', { keyPath: 'id' }); 
                }
            };            

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['clues'], 'readwrite');
                const objectStore = transaction.objectStore('clues');
                objectStore.clear();
                uniqueClues.forEach(([id, text]) => {
                    objectStore.add({ id: id, text: text });
                });
                // Use the getAll() method to get all the clues from the object store
                const getAllRequest = objectStore.getAll();
                getAllRequest.onsuccess = (event) => {
                    console.log(event.target.result);
                };
            };
        });
});

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
        lines.forEach((line) => {
            // Split each line into an array of values
            const values = line.split(',');
            // Extract the clue and answer from the array of values
            const clue = values[0];
            const answer = values.slice(1).join(',');
            // Check if the clue is already in the clues array
            if (!clues.find(c => c.id === clue)) {
                clues.push({
                    id: clue,
                    text: answer,
                });
            }
        });

        // Open an IndexedDB database
        const request = window.indexedDB.open('clues_database', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Check if the object store exists
            if (!db.objectStoreNames.contains('clues')) {
                // The object store does not exist, so you need to create it
                const objectStore = db.createObjectStore('clues', { keyPath: 'id' });
                
                clues.forEach((word) => {
                    objectStore.add({ id: word.id, text: word.text });
                });
            }
        };

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
