const textContainer = document.getElementById('text-container');

window.electronAPI.plotTranslation((translation_to_plot) => {
    // ToDo : to optimize updates, we could try to only update the translation_to_plot objects that changed

    // Create a document fragment for batching DOM updates
    const fragment = document.createDocumentFragment();

    let textElement;
    translation_to_plot.forEach((text_object, i) => {
        textElement = document.createElement('span');
        textElement.className = 'text-element';
        textElement.textContent = text_object.text;
        textElement.style.left = `${text_object.position.x}px`;
        textElement.style.top = `${text_object.position.y}px`;

        fragment.appendChild(textElement);
    })

    // Clear container and add all elements back to avoid leftover nodes
    textContainer.innerHTML = '';
    textContainer.appendChild(fragment);
})
