let userSelectedColors = [];


function rgbToHex(rgb) {
    // Convert "rgb(r, g, b)" to "#rrggbb"
    const [r, g, b] = rgb.match(/\d+/g);
    return "#" + ((1 << 24) + (+r << 16) + (+g << 8) + +b).toString(16).slice(1);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // You could add a visual feedback here, like changing the button text temporarily
        showNotification();
        console.log('Copied to clipboard');
    }, (err) => {
        console.error('Could not copy text: ', err);
    });
}


function showNotification() {
    const notification = document.getElementById('copy-notification');
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({ action: "getWebsiteColors" }, function (response) {
        if (response && response.colors) {
            const colorsDiv = document.getElementById('colors');
            const colors = [];

            response.colors.forEach(({ color, frequency, percentage }) => {
                const hexColor = rgbToHex(color);

                const colorItem = document.createElement('div');
                colorItem.className = 'color-item';
                colorItem.dataset.color = color;

                const colorBox = document.createElement('div');
                colorBox.className = 'color-box';
                colorBox.style.backgroundColor = color;

                const colorInfo = document.createElement('div');
                colorInfo.className = 'color-info';

                const colorValues = document.createElement('div');
                colorValues.className = 'color-values';
                colorValues.textContent = `${hexColor} / ${color}`;

                const colorFrequency = document.createElement('div');
                colorFrequency.className = 'color-frequency';
                colorFrequency.textContent = `${percentage.toFixed(2)}% (${frequency})`;

                const copyHexBtn = document.createElement('button');
                copyHexBtn.className = 'copy-btn';
                copyHexBtn.textContent = 'Copy HEX';
                copyHexBtn.onclick = (e) => {
                    e.stopPropagation();
                    copyToClipboard(hexColor);
                };

                const copyRgbBtn = document.createElement('button');
                copyRgbBtn.className = 'copy-btn';
                copyRgbBtn.textContent = 'Copy RGB';
                copyRgbBtn.onclick = (e) => {
                    e.stopPropagation();
                    copyToClipboard(color);
                };

                colorInfo.appendChild(colorValues);
                colorInfo.appendChild(colorFrequency);
                colorItem.appendChild(colorBox);
                colorItem.appendChild(colorInfo);
                colorItem.appendChild(copyHexBtn);
                colorItem.appendChild(copyRgbBtn);
                colorsDiv.appendChild(colorItem);

                colors.push({
                    rgba: color,
                    hex: hexColor
                })

                colorItem.addEventListener('click', function () {
                    const selectedItems = document.querySelectorAll('.selected');
                    selectedItems.forEach(item => item.classList.remove('selected'));
                    this.classList.add('selected');

                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.runtime.sendMessage({
                            action: "highlightColor",
                            color: color,
                            tabId: tabs[0].id
                        });
                    });
                });
            });

            // Add download button
            const downloadBtn = document.createElement('button');
            downloadBtn.textContent = 'Download JSON';
            downloadBtn.className = 'download-btn';
            downloadBtn.addEventListener('click', () => downloadColorJSON(colors));
            document.getElementById('download-colors').appendChild(downloadBtn);
        }
    });

    // const pickerBtn = document.createElement('button');
    // pickerBtn.textContent = 'Activate Color Picker';
    // pickerBtn.addEventListener('click', activateColorPicker);
    // document.body.appendChild(pickerBtn);

    // displayUserSelectedColors();
});

function downloadColorJSON(colors) {
    const jsonString = generateColorJSON(colors);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'color_analysis.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}



function generateColorJSON(colors) {
    return JSON.stringify(colors, null, 2);
}


