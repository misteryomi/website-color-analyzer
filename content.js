chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "highlightColor") {
        highlightElements(request.color);
    }
});

function highlightElements(color) {
    // Remove previous highlights
    const previousHighlights = document.querySelectorAll('.color-highlight');
    previousHighlights.forEach(el => el.classList.remove('color-highlight'));

    const elements = document.getElementsByTagName('*');
    for (let element of elements) {
        const style = window.getComputedStyle(element);
        if (style.backgroundColor === color || style.color === color || style.borderColor === color) {
            element.classList.add('color-highlight');
        }
    }

    // Add highlight style
    const style = document.createElement('style');
    style.textContent = `
    .color-highlight {
      outline: 2px solid red !important;
      outline-offset: -2px !important;
    }
  `;
    document.head.appendChild(style);
}


function analyzeWebsiteColors() {
    const colorMap = new Map();
    const elements = document.getElementsByTagName('*');

    function getVisibilityScore(element) {
        const rect = element.getBoundingClientRect();
        const viewportArea = window.innerWidth * window.innerHeight;
        const elementArea = rect.width * rect.height;
        return Math.min(elementArea / viewportArea, 1);
    }

    function getElementImportance(element) {
        const tagImportance = {
            'button': 2,
            'a': 1.5,
            'h1': 2,
            'h2': 1.8,
            'h3': 1.6,
            'nav': 1.5,
            'header': 1.5,
            'footer': 1.2
        };
        return tagImportance[element.tagName.toLowerCase()] || 1;
    }

    for (let element of elements) {
        const style = window.getComputedStyle(element);
        const backgroundColor = style.backgroundColor;
        const color = style.color;
        const visibilityScore = getVisibilityScore(element);
        const importance = getElementImportance(element);

        function updateColorScore(colorValue) {
            if (colorValue && colorValue !== 'rgba(0, 0, 0, 0)') {
                const score = visibilityScore * importance;
                colorMap.set(colorValue, (colorMap.get(colorValue) || 0) + score);
            }
        }

        updateColorScore(backgroundColor);
        updateColorScore(color);
    }

    return Array.from(colorMap, ([color, score]) => ({ color, score }));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getWebsiteColors") {
        sendResponse(analyzeWebsiteColors());
    }
});