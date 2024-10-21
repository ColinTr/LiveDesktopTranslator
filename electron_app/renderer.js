const startButton = document.getElementById('startButton')
const stopButton = document.getElementById('stopButton')
const videoSelectButton = document.getElementById('videoSelectButton')

const video = document.querySelector('video')

startButton.addEventListener('click', () => {
    console.log("startButton")
    navigator.mediaDevices.getDisplayMedia({
        audio: true,
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
    console.log("stopButton")
    video.pause()
})

// Get the available video sources
const { desktopCapturer } = require('electron')
videoSelectButton.addEventListener('click', () => {
    console.log("videoSelectButton")

    const inputSources = desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    console.log(inputSources)

})
