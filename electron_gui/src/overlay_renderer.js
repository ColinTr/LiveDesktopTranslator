const textContainer = document.getElementById('text-container');

window.electronAPI.clearTranslation(() => {
    textContainer.innerHTML = '';
})

const randomId = function(length) {
    return Math.random().toString(36).substring(2, length + 2);
};

window.electronAPI.plotBoundingBoxes((bounding_boxes_to_plot) => {
    bounding_boxes_to_plot = JSON.parse(bounding_boxes_to_plot)
    const fragment = document.createDocumentFragment();

    bounding_boxes_to_plot.forEach(bounding_box => {
        const divElement = document.createElement('div');
        divElement.className = "text-fit-div d-flex align-items-center justify-content-center"
        divElement.style.position = 'absolute';
        divElement.style.left = `${bounding_box.box.x1}px`;
        divElement.style.top = `${bounding_box.box.y1}px`;
        divElement.style.width = `${bounding_box.box.x2 - bounding_box.box.x1}px`;
        divElement.style.height = `${bounding_box.box.y2 - bounding_box.box.y1}px`;
        divElement.style.border = "1px solid red"


        const labelDiv = document.createElement('span');
        labelDiv.className = "bounding_box_label"
        labelDiv.textContent = bounding_box.label;
        divElement.appendChild(labelDiv)

        fragment.appendChild(divElement);
    });

    textContainer.innerHTML = '';
    textContainer.appendChild(fragment);
});

window.electronAPI.plotTranslation((translation_to_plot) => {
    // ToDo : to optimize updates, we could try to only update the translation_to_plot objects that changed

    // Create a document fragment for batching DOM updates
    const fragment = document.createDocumentFragment();

    let divIds = [];

    translation_to_plot.forEach((text_object, i) => {
        const divElement = document.createElement('div');
        divElement.className = "text-fit-div d-flex align-items-center"
        divElement.style.position = 'absolute';
        divElement.style.left = `${text_object.box.x1}px`;
        divElement.style.top = `${text_object.box.y1}px`;
        divElement.style.width = `${text_object.box.x2 - text_object.box.x1}px`;
        divElement.style.height = `${text_object.box.y2 - text_object.box.y1}px`;

        const bg_red = text_object.mean_rgb[0]
        const bg_green = text_object.mean_rgb[1]
        const bg_blue = text_object.mean_rgb[2]
        divElement.style.background = `rgba(${bg_red}, ${bg_green}, ${bg_blue}, 0.9)`;

        // Automatically choose white or black for the text color according to the background color for the best readability
        if ((bg_red*0.299 + bg_green*0.587 + bg_blue*0.114) > 186) {
            divElement.style.color = "#000000"
        }  else {
            divElement.style.color = "#ffffff"
        }

        const divId = randomId(10);
        divElement.id = divId;
        divIds.push(divId)

        const spanElement = document.createElement('span');
        // spanElement.className = 'd-flex align-items-center justify-content-center';
        spanElement.textContent = text_object.text;

        // textElement.style.fontSize = `${text_object.position.height}px`;

        divElement.appendChild(spanElement);
        fragment.appendChild(divElement);
    })

    // Clear container and add all elements back to avoid leftover nodes
    textContainer.innerHTML = '';
    textContainer.appendChild(fragment);

    // Apply textfill to the new elements
    // We don't apply it to the whole "text-fit-div" class, because it will re-apply to existing divElements, causing poor performance
    Array.from(divIds).forEach((divId) => {
        $(`#${divId}`).textfill({ maxFontPixels: 100, changeLineHeight: true });
    })
})

// =================== Top bar buttons ===================
const collapsible_top_bar_elements_list = Array.from(document.getElementsByClassName('collapsible_top_bar'));
const startStopButton = document.getElementById('startStopButton');
const fullscreenOrWindowedButton = document.getElementById('fullscreenOrWindowedButton');
const optionsButton = document.getElementById('optionsButton');
const parametersModal = document.getElementById("parametersModal");
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

    // ToDo (optional) : make window borderless and non-draggable in fullscreen

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

parametersModal.addEventListener('click', e => {
    // Close modal on outside click
    const dialogDimensions = parametersModal.getBoundingClientRect()
    if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
    ) {
        parametersModal.close()
    }
})

optionsButton.addEventListener('click', async () => {
    parametersModal.showModal()
});

parametersModalCloseButton.addEventListener('click', async () => {
    parametersModal.close()
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
const offline_translation_radio = document.getElementById("offline_translation_radio");
const online_translation_radio = document.getElementById("online_translation_radio");
const inputLangField = document.getElementById("input_language");
const addInputLangButton = document.getElementById("addInputLangButton");
const outputLangField = document.getElementById("output_language");
const addOutputLangButton = document.getElementById("addOutputLangButton");
const fpsValueField = document.getElementById("max_fps");
const flickerScreenShotSwitch = document.getElementById("flickerScreenShotSwitch");
const flickerDelayValueRow = document.getElementById("flicker_delay_row");
const flickerDelayValueField = document.getElementById("flicker_delay");
const confidenceThresholdValueField = document.getElementById("confidence_threshold");

window.electronAPI.onInitializeState((parameters_config) => {
    // Initialize the state of the interface according the values in main's object "parameters_config"
    if (parameters_config.offline_or_online_translation === "offline") {
        offline_translation_radio.checked = true
        online_translation_radio.checked = false
    } else {
        offline_translation_radio.checked = false
        online_translation_radio.checked = true
    }
    inputLangField.value = parameters_config.input_lang
    outputLangField.value = parameters_config.output_lang
    fpsValueField.value = parameters_config.maximumFPS
    flickerScreenShotSwitch.checked = parameters_config.flickerBeforeScreenshot
    flickerDelayValueField.value = parameters_config.flickerDelay
    confidenceThresholdValueField.value = parameters_config.confidenceThreshold

    flickerDelayValueRow.hidden = !flickerScreenShotSwitch.checked
});

offline_translation_radio.addEventListener('change', async (event) => {
    if (event.target.checked === true) {
        window.electronAPI.offlineOrOnlineTranslationUpdate("offline")
    }
});

online_translation_radio.addEventListener('change', async (event) => {
    if (event.target.checked === true) {
        window.electronAPI.offlineOrOnlineTranslationUpdate("online")
    }
});

inputLangField.addEventListener('change', async (event) => {
    window.electronAPI.inputLangUpdate(event.target.value)
});

addInputLangButton.addEventListener('click', async (event) => {
    // ToDo
    console.log("Not implemented yet")
});

outputLangField.addEventListener('change', async (event) => {
    window.electronAPI.outputLangUpdate(event.target.value)
});

addOutputLangButton.addEventListener('click', async (event) => {
    // ToDo
    console.log("Not implemented yet")
});

fpsValueField.addEventListener('change', async (event) => {
    window.electronAPI.fpsUpdate(event.target.value)
});

flickerScreenShotSwitch.addEventListener('change', async (event) => {
    window.electronAPI.onFlickerScreenshotSwitchUpdate(event.target.checked)
    flickerDelayValueRow.hidden = !event.target.checked
});

flickerDelayValueField.addEventListener('change', async (event) => {
    window.electronAPI.flickerDelayUpdate(event.target.value)
});

confidenceThresholdValueField.addEventListener('change', async (event) => {
    window.electronAPI.confidenceThresholdUpdate(event.target.value)
});