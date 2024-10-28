const video = document.querySelector('video')
const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
const freeSelectButton = document.getElementById('freeSelectButton')
const screenOrWindowButton = document.getElementById('screenOrWindowButton')
const screenPickerModal = document.getElementById("screenPickerModal");
const screenPickerModalCloseButton = document.getElementById("screenPickerModalCloseButton");
const thumbnailsContainer = document.getElementById("thumbnailsContainer");
const selectWindowButton = document.getElementById("selectWindowButton");
const cancelSelectWindowButton = document.getElementById("cancelSelectWindowButton");
const fpsValueField = document.getElementById("max_fps");
const inputLangField = document.getElementById("input_language");
const outputLangField = document.getElementById("output_language");

let selectedSourceId = null;
let activeScreenPickerButton = null;

freeSelectButton.addEventListener('click', async () => {
    console.log("Not implemented yet.")
});

fpsValueField.addEventListener('change', async (event) => {
    window.electronAPI.fpsUpdate(event.target.value)
});

inputLangField.addEventListener('change', async (event) => {
    window.electronAPI.inputLangUpdate(event.target.value)
});

outputLangField.addEventListener('change', async (event) => {
    window.electronAPI.outputLangUpdate(event.target.value)
});

screenOrWindowButton.addEventListener('click', async () => {
    // Open the modal
    screenPickerModal.style.display = "block";

    // Clear the content of the thumbnailsContainer in case it already had thumbnails
    thumbnailsContainer.innerHTML = "";

    // Use the exposed API from preload.js to get the sources from the main process
    window.electronAPI.getSources().then(screenSourcesObjects => {
        screenSourcesObjects.forEach(source => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 d-flex justify-content-center align-items-center'; // Two buttons per row on medium and larger screens
            col.style.marginBottom = "10px";

            // Create a button for the source
            const button = document.createElement('button');
            button.className = 'btn btn-light'; // Use Bootstrap button styling
            button.id = 'screen-picker-button';
            button.selected_screen_id = source.id;

            // Create the image element
            const img = document.createElement('img');
            img.src = source.thumbnail; // Convert the thumbnail to a data URL
            img.alt = source.name; // Optional: Add an alt attribute for better accessibility
            img.style.width = '100%'; // Set width as needed
            img.style.height = 'auto'; // Maintain aspect ratio
            img.style.marginBottom = "5px";

            // Create a text element for the source name
            const sourceName = document.createElement('span');
            sourceName.innerText = source.name.length > 27 ? source.name.substring(0, 24) + '...' : source.name; // Crop name if longer than 27 characters

            // Append the image and source name to the button
            button.appendChild(img);
            button.appendChild(sourceName);
            button.addEventListener('click', () => {
                // Remove 'active' class from the previously active button, if any
                if (activeScreenPickerButton) {
                    activeScreenPickerButton.classList.remove('active');
                }
                // Add 'active' class to the clicked button
                button.classList.add('active');
                activeScreenPickerButton = button; // Update the active button reference
            });

            col.appendChild(button);

            thumbnailsContainer.appendChild(col);
        })
    });
});

selectWindowButton.addEventListener('click', async () => {
    window.electronAPI.selectSource(activeScreenPickerButton.selected_screen_id)  // Send the selected screen id to the main process
    screenPickerModal.style.display = "none";
});

cancelSelectWindowButton.addEventListener('click', async () => {
    screenPickerModal.style.display = "none";
});

screenPickerModalCloseButton.addEventListener('click', async () => {
    screenPickerModal.style.display = "none";
});

startButton.addEventListener('click', () => {
    // ToDo
    // Prevent starting if no source is selected
    // if (!selectedSourceId) {
    //     console.log("No source selected!");
    //     alert("Please select a source first!");
    //     return;
    // }

    // ToDo
    // navigator.mediaDevices.getDisplayMedia({
    //     audio: false,
    //     video: {
    //         width: 800,
    //         height: 450,
    //         frameRate: 30
    //     }
    // }).then(stream => {
    //     video.srcObject = stream
    //     video.onloadedmetadata = (e) => video.play()
    // }).catch(e => console.log(e))

    window.electronAPI.startButtonPress()
})

stopButton.addEventListener('click', () => {
    // video.pause()

    window.electronAPI.stopButtonPress()
})