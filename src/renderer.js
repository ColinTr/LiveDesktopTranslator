const video = document.querySelector('video')
const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
const videoSelectButton = document.getElementById('videoSelectButton')

let selectedSourceId = null; // Track the selected source ID

startButton.addEventListener('click', () => {
    // Prevent starting if no source is selected
    if (!selectedSourceId) {
        console.log("No source selected!");
        alert("Please select a source first!");
        return;
    }

    navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
            width: 800,
            height: 450,
            frameRate: 30
        }
    }).then(stream => {
        video.srcObject = stream
        video.onloadedmetadata = (e) => video.play()
    }).catch(e => console.log(e))
})

stopButton.addEventListener('click', () => {
    video.pause()
})

videoSelectButton.addEventListener('click', async () => {
    // Use the exposed API from preload.js to get the sources from the main process
    const inputSources = await window.electron.getSources({ types: ['window', 'screen'] });

    // Create a menu with only serializable properties: source `name` and `id`
    const menuTemplate = inputSources.map(source => ({
        label: source.name,
        id: source.id
    }));

    // Show the popup menu
    window.electron.showPopupMenu(menuTemplate);
});

window.electron.onSourceSelected((sourceId) => {
    selectedSourceId = sourceId;
});
