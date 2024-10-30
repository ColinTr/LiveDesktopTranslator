const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
const screenOrWindowButton = document.getElementById('screenOrWindowButton')
const screenPickerModal = document.getElementById("screenPickerModal");
const screenPickerModalCloseButton = document.getElementById("screenPickerModalCloseButton");
const thumbnailsContainer = document.getElementById("thumbnailsContainer");
const selectWindowButton = document.getElementById("selectWindowButton");
const cancelSelectWindowButton = document.getElementById("cancelSelectWindowButton");
const fpsValueField = document.getElementById("max_fps");
const inputLangField = document.getElementById("input_language");
const outputLangField = document.getElementById("output_language");
const advancedParametersButton = document.getElementById("advancedParametersButton");
const advancedParametersModalCloseButton = document.getElementById("advancedParametersModalCloseButton");
const advancedParametersModal = document.getElementById("advancedParametersModal");
const flickerScreenShotSwitch = document.getElementById("flickerScreenShotSwitch");
const flickerDelayValueField = document.getElementById("flicker_delay");
const confidenceThresholdValueField = document.getElementById("confidence_threshold");
const screenSelectionRadioWindowed = document.getElementById("screenSelectionRadioWindowed");
const screenSelectionRadioFullscreen = document.getElementById("screenSelectionRadioFullscreen");

let activeScreenPickerButton = null;

window.electronAPI.onInitializeState((parameters_config) => {
    // Initialize the state of the interface according the values in main's object "parameters_config"
    inputLangField.value = parameters_config.inputLang
    outputLangField.value = parameters_config.outputLang
    if (parameters_config.windowed_or_fullscreen === "windowed") {
        screenSelectionRadioWindowed.checked = true
    } else if (parameters_config.windowed_or_fullscreen === "fullscreen") {
        screenSelectionRadioFullscreen.checked = true
    }
    // parameters_config.selectedMonitor  // This one will be initialized later
    fpsValueField.value = parameters_config.maximumFPS
    flickerScreenShotSwitch.checked = parameters_config.flickerBeforeScreenshot
    flickerDelayValueField.value = parameters_config.flickerDelay
    confidenceThresholdValueField.value = parameters_config.confidenceThreshold
});

screenSelectionRadioWindowed.addEventListener('change', async (event) => {
    window.electronAPI.windowedOrFullscreen("windowed")
});

screenSelectionRadioFullscreen.addEventListener('change', async (event) => {
    window.electronAPI.windowedOrFullscreen("fullscreen")
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

flickerScreenShotSwitch.addEventListener('change', async (event) => {
    window.electronAPI.onFlickerScreenshotSwitchUpdate(event.target.checked)
});

flickerDelayValueField.addEventListener('change', async (event) => {
    window.electronAPI.flickerDelayUpdate(event.target.value)
});

confidenceThresholdValueField.addEventListener('change', async (event) => {
    window.electronAPI.confidenceThresholdUpdate(event.target.value)
});

advancedParametersModalCloseButton.addEventListener('click', async () => {
    // Open the modal
    advancedParametersModal.style.display = "none";
});

advancedParametersButton.addEventListener('click', async () => {
    // Open the modal
    advancedParametersModal.style.display = "block";
});

screenOrWindowButton.addEventListener('click', async () => {
    // Open the modal
    screenPickerModal.style.display = "block";

    // Clear the content of the thumbnailsContainer in case it already had thumbnails
    thumbnailsContainer.innerHTML = "";

    // Use the exposed API from preload.js to get the sources from the main process
    window.electronAPI.getSources().then(screenSourcesObjects => {
        let monitor_number = 1;
        screenSourcesObjects.forEach(source => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 d-flex justify-content-center align-items-center'; // Two buttons per row on medium and larger screens
            col.style.marginBottom = "10px";

            // Create a button for the source
            const button = document.createElement('button');
            button.className = 'btn btn-light'; // Use Bootstrap button styling
            button.id = 'screen-picker-button';
            button.selected_screen_id = source.id;
            button.monitor_number = monitor_number
            monitor_number = monitor_number + 1

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
    window.electronAPI.selectSource(activeScreenPickerButton.monitor_number)  // Send the selected screen id to the main process
    screenPickerModal.style.display = "none";  // Close the screen selection modal
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

    window.electronAPI.startButtonPress()
})

stopButton.addEventListener('click', () => {
    // video.pause()

    window.electronAPI.stopButtonPress()
})