chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getWebsiteColors") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: analyzeWebsiteColors
            }, (results) => {
                if (results && results[0]) {
                    sendResponse({ colors: results[0].result });
                }
            });
        });
        return true; // Keeps the message channel open for async response
    } else if (request.action === "highlightColor") {
        chrome.scripting.executeScript({
            target: { tabId: request.tabId },
            function: highlightElements,
            args: [request.color]
        });
    }
});

function analyzeWebsiteColors() {
    function getRGBColor(color) {
        if (!color) return null;
        if (color.startsWith('rgb')) return color;

        const tempElement = document.createElement('div');
        tempElement.style.color = color;
        document.body.appendChild(tempElement);
        const rgbColor = window.getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);
        return rgbColor;
    }

    function getColorFrequency() {
        const colorMap = new Map();
        const elements = document.getElementsByTagName('*');
        let totalColors = 0;

        for (let element of elements) {
            const style = window.getComputedStyle(element);
            const backgroundColor = getRGBColor(style.backgroundColor);
            const color = getRGBColor(style.color);
            const borderColor = getRGBColor(style.borderColor);

            [backgroundColor, color, borderColor].forEach(c => {
                if (c && c !== 'rgba(0, 0, 0, 0)') {
                    colorMap.set(c, (colorMap.get(c) || 0) + 1);
                    totalColors++;
                }
            });
        }

        return { colorMap, totalColors };
    }

    const { colorMap, totalColors } = getColorFrequency();
    const sortedColors = [...colorMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([color, frequency]) => ({
            color,
            frequency,
            percentage: (frequency / totalColors) * 100
        }));

    return sortedColors.slice(0, 20); // Return top 20 colors
}

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
    let style = document.getElementById('highlight-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'highlight-style';
        document.head.appendChild(style);
    }
    style.textContent = `
    .color-highlight {
      outline: 2px solid red !important;
      outline-offset: -2px !important;
    }
  `;
}


