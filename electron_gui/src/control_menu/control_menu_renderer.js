const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
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
const screenOrWindowButton = document.getElementById('screenOrWindowButton')
const screenSelectionRow = document.getElementById("screenSelectionRow");
const selectedScreenTextSpan = document.getElementById("selectedScreenTextSpan");

let activeScreenPickerButton = null;
let selectedMonitor = null;

function setSelectedScreenName() {
    window.electronAPI.getSources().then(screenSourcesObjects => {
        selectedScreenTextSpan.textContent = `Selected screen: ${screenSourcesObjects[selectedMonitor - 1].name}.`
    })
}
window.electronAPI.onInitializeState((parameters_config) => {
    // Initialize the state of the interface according the values in main's object "parameters_config"
    inputLangField.value = parameters_config.inputLang
    outputLangField.value = parameters_config.outputLang
    if (parameters_config.windowed_or_fullscreen === "windowed") {
        screenSelectionRadioWindowed.checked = true
        screenSelectionRow.hidden = true
    } else if (parameters_config.windowed_or_fullscreen === "fullscreen") {
        screenSelectionRadioFullscreen.checked = true
        screenSelectionRow.hidden = false
    }
    selectedMonitor = parameters_config.selectedMonitor
    setSelectedScreenName()
    fpsValueField.value = parameters_config.maximumFPS
    flickerScreenShotSwitch.checked = parameters_config.flickerBeforeScreenshot
    flickerDelayValueField.value = parameters_config.flickerDelay
    confidenceThresholdValueField.value = parameters_config.confidenceThreshold
});

screenSelectionRadioWindowed.addEventListener('change', async () => {
    window.electronAPI.windowedOrFullscreen("windowed")
    screenSelectionRow.hidden = true
});

screenSelectionRadioFullscreen.addEventListener('change', async () => {
    window.electronAPI.windowedOrFullscreen("fullscreen")
    screenSelectionRow.hidden = false
    setSelectedScreenName()
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

            const button = document.createElement('button');
            button.className = 'btn btn-light';
            button.id = 'screen-picker-button';
            button.selected_screen_id = source.id;
            button.monitor_number = monitor_number
            monitor_number = monitor_number + 1

            const img = document.createElement('img');
            img.src = source.thumbnail;
            img.alt = source.name;
            img.style.width = '100%';
            img.style.height = 'auto'; // Maintain aspect ratio
            img.style.marginBottom = "5px";

            const sourceName = document.createElement('span');
            sourceName.innerText = source.name.length > 27 ? source.name.substring(0, 24) + '...' : source.name; // Crop name if longer than 27 characters

            button.appendChild(img);
            button.appendChild(sourceName);
            button.addEventListener('click', () => {
                // Remove 'active' class from the previously active button, if any
                if (activeScreenPickerButton) {
                    activeScreenPickerButton.classList.remove('active');
                }
                button.classList.add('active');
                activeScreenPickerButton = button;
            });

            col.appendChild(button);

            thumbnailsContainer.appendChild(col);
        })
    });
});

selectWindowButton.addEventListener('click', async () => {
    window.electronAPI.selectSource(activeScreenPickerButton.monitor_number)  // Send the selected screen id to the main process
    screenPickerModal.style.display = "none";  // Close the screen selection modal
    selectedMonitor = activeScreenPickerButton.monitor_number
    setSelectedScreenName()
});

cancelSelectWindowButton.addEventListener('click', async () => {
    screenPickerModal.style.display = "none";
});

screenPickerModalCloseButton.addEventListener('click', async () => {
    screenPickerModal.style.display = "none";
});

startButton.addEventListener('click', () => {
    window.electronAPI.startButtonPress()
})

stopButton.addEventListener('click', () => {
    window.electronAPI.stopButtonPress()
})