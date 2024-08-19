const bootstrap = require('bootstrap');

let btn = document.getElementById('butao');
btn.click();

let btnClose = document.getElementById('btnClose');
btnClose.addEventListener('click', () => {
    window.close();
});

const fileInput = document.getElementById('formFileLg');
let btnDown = document.getElementById('btnDown');
btnDown.addEventListener('click', () => {
    if (fileInput.files.lenght === 0) {
        alert('Select a file first');
    } else {
        processImage();
    }
});


function processImage() {
    let reader = new FileReader();
    reader.onload = function () {
        let fullImg = document.createElement('img');
        fullImg.src = this.result;
        fullImg.id = 'aaa';
        fullImg.addEventListener('load', () => {
            cutImages(fullImg);
        });
    }
    reader.readAsDataURL(fileInput.files[0]);
}

function cutImages(img) {
    if (img.width % img.height !== 0) {
        alert('Width should be a multiple of the height');
        return;
    }
    let canvas = document.createElement('canvas');
    canvas.width = img.height;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    for (let i = 0; i < img.width / img.height; i++) {
        ctx.drawImage(img, i*img.height, 0, img.height, img.height, 0, 0, img.height, img.height);
        downloadCanvas(canvas, i+1);
    }

}
function downloadCanvas(canvas, name) {
    let link = document.createElement('a');
    link.download = name+'.png';
    link.href = canvas.toDataURL();
    link.click();
}