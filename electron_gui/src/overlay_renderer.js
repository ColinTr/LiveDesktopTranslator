const textContainer = document.getElementById('text-container');

window.electronAPI.clearTranslation(() => {
    console.log("Clearing translation...")
    textContainer.innerHTML = '';
})

window.electronAPI.plotTranslation((translation_to_plot) => {
    // ToDo : to optimize updates, we could try to only update the translation_to_plot objects that changed

    // Create a document fragment for batching DOM updates
    const fragment = document.createDocumentFragment();

    translation_to_plot.forEach((text_object, i) => {
        const divElement = document.createElement('div');
        divElement.className = "text-fit-div d-flex align-items-center justify-content-center"
        divElement.style.position = 'absolute';
        divElement.style.left = `${text_object.position.top_left_x}px`;
        divElement.style.top = `${text_object.position.top_left_y}px`;
        divElement.style.width = `${text_object.position.width}px`;
        divElement.style.height = `${text_object.position.height}px`;

        const spanElement = document.createElement('span');
        // spanElement.className = 'd-flex align-items-center justify-content-center';
        spanElement.textContent = text_object.text;

        // textElement.style.fontSize = `${text_object.position.height}px`;

        divElement.appendChild(spanElement);
        fragment.appendChild(divElement);
    })

    // Clear container and add all elements back to avoid leftover nodes
    textContainer.appendChild(fragment);

    // Apply textfill to new elements
    $('.text-fit-div').textfill({ maxFontPixels: 100, changeLineHeight: true });
})

// =================== Top bar buttons ===================
const collapsible_top_bar_elements_list = Array.from(document.getElementsByClassName('collapsible_top_bar'));
const startStopButton = document.getElementById('startStopButton');
//const pauseButton = document.getElementById('pauseButton');
const fullscreenOrWindowedButton = document.getElementById('fullscreenOrWindowedButton');
const optionsButton = document.getElementById('optionsButton');
const parametersModal = document.getElementById('parametersModal');
const parametersModalCloseButton = document.getElementById('parametersModalCloseButton');
const hideBarButton = document.getElementById('hideBarButton');
const closeButton = document.getElementById('closeButton');
const showBarButton = document.getElementById('showBarButton');

startStopButton.addEventListener('click', async () => {
    const startStopButtonImg = document.getElementById('startStopButtonImg')
    const startStopButtonText = document.getElementById('startStopButtonText')

    if (startStopButtonText.innerText === "Start") {
        startStopButtonText.innerText = "Stop"
        startStopButtonImg.src = "../assets/stop-solid.svg"
        window.electronAPI.startButtonPress()
    } else {
        startStopButtonText.innerText = "Start"
        startStopButtonImg.src = "../assets/play-solid.svg"
        window.electronAPI.stopButtonPress()

        // Stopping also clears the currently displayed text
        textContainer.innerHTML = '';
    }
});

closeButton.addEventListener('click', async () => {
    window.close();
});

fullscreenOrWindowedButton.addEventListener('click', async () => {
    const fullscreenOrWindowedButtonImg = document.getElementById('fullscreenOrWindowedButtonImg');
    const fullscreenOrWindowedButtonText = document.getElementById('fullscreenOrWindowedButtonText');

    if (fullscreenOrWindowedButtonText.innerText === "Fullscreen") {
        fullscreenOrWindowedButtonText.innerText = "Windowed"
        fullscreenOrWindowedButtonImg.src = "../assets/compress-solid.svg"
        window.electronAPI.setFullscreen(true)
    } else {
        fullscreenOrWindowedButtonText.innerText = "Fullscreen"
        fullscreenOrWindowedButtonImg.src = "../assets/expand-solid.svg"
        window.electronAPI.setFullscreen(false)
    }
});

optionsButton.addEventListener('click', async () => {
    parametersModal.style.display = "flex"
});

parametersModalCloseButton.addEventListener('click', async () => {
    parametersModal.style.display = "none";
});

hideBarButton.addEventListener('click', async () => {
    collapsible_top_bar_elements_list.forEach((element) => {
        element.classList.toggle("expand")
    })
});

showBarButton.addEventListener('click', async () => {
    collapsible_top_bar_elements_list.forEach((element) => {
        element.classList.toggle("expand")
    })
});

// =================== Parameters fields ===================
const inputLangField = document.getElementById("input_language");
const outputLangField = document.getElementById("output_language");
const fpsValueField = document.getElementById("max_fps");
const flickerScreenShotSwitch = document.getElementById("flickerScreenShotSwitch");
const flickerDelayValueField = document.getElementById("flicker_delay");
const confidenceThresholdValueField = document.getElementById("confidence_threshold");

window.electronAPI.onInitializeState((parameters_config) => {
    // Initialize the state of the interface according the values in main's object "parameters_config"
    inputLangField.value = parameters_config.inputLang
    outputLangField.value = parameters_config.outputLang
    fpsValueField.value = parameters_config.maximumFPS
    flickerScreenShotSwitch.checked = parameters_config.flickerBeforeScreenshot
    flickerDelayValueField.value = parameters_config.flickerDelay
    confidenceThresholdValueField.value = parameters_config.confidenceThreshold
});

inputLangField.addEventListener('change', async (event) => {
    window.electronAPI.inputLangUpdate(event.target.value)
});

outputLangField.addEventListener('change', async (event) => {
    window.electronAPI.outputLangUpdate(event.target.value)
});

fpsValueField.addEventListener('change', async (event) => {
    window.electronAPI.fpsUpdate(event.target.value)
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