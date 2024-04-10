let potrace = require('potrace');
import { FastAverageColor } from 'fast-average-color';
const fac = new FastAverageColor();
import { prominent } from 'color.js'

document.addEventListener("click", (e) => {
    console.log()
    try {
        let img = e.target.parentElement.children[0];
        if (img.tagName.toLowerCase() !== "img") {
            // console.log("DIFERENTE: " + img.tagName)
            return;
        }

        let imgClasses = [];
        for (let i = 0; i < img.classList.length; i++) {
            imgClasses.push(img.classList[i]);
        }
        img.className = '';
        img.style.position = 'absolute';

        let averageColor = fac.getColor(img).hex;

        let displays = [img];

        let steps10 = [];
        let steps50 = [];
        for (let i = 0; i < 255; i++) {
            if (i % 20 == 0) {
                steps10.push(i);
            }
            if (i % 50 == 0) {
                steps50.push(i);
            }
        }

        steps50.forEach(v => {
            potrace.trace(imgToBuffer(img), { threshold: v }, function (err, svg) {
                if (err) throw err;
                displays.push(svg);
            });
        });

        prominent(img, { amount: 8, format: 'hex' }).then(colors => {
            if (typeof colors == "string"){
                colors = [colors];
            }
            colors.forEach(c => {
                potrace.trace(imgToBuffer(img), { color: c }, function (err, svg) {
                    if (err) throw err;
                    displays.push(svg);
                });
                steps10.forEach(v => {
                    potrace.trace(imgToBuffer(img), { threshold: v, color: c }, function (err, svg) {
                        if (err) throw err;
                        displays.push(svg);
                    });
                });
            });
        });

        potrace.posterize(imgToBuffer(img), { steps: [40, 85, 135, 180] }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(imgToBuffer(img), { steps: steps10 }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(imgToBuffer(img), { steps: steps50 }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(imgToBuffer(img), { steps: steps10, color: averageColor }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(imgToBuffer(img), { steps: steps50, color: averageColor }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(imgToBuffer(img), { color: averageColor }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        let t1 = -1;
        let t2 = 0;
        let t3 = 0;
        function checkComplete() {
            if (t1 == t2 && t2 == t3 && t3 == displays.length){ //donee
                createModal(displays);
                imgClasses.forEach(e => {
                    img.classList.add(e);
                });
                img.style.position = '';
            } else {
                if (t1 == t2 && t2 == displays.length){
                    t3 = displays.length;
                } else if (t1 == displays.length){
                    t2 = displays.length;
                } else {
                    t1 = displays.length;
                }
                // console.log(displays.length);
                setTimeout(checkComplete, 50);
                return;
            }
        }
        checkComplete();


    } catch (error) {
        console.error(error);
    }
})

function createModal(list) {
    let div = document.createElement("div");
    div.id = "myModal";
    div.className = "modal";

    let innerDiv = document.createElement("div");
    innerDiv.className = "modal-content";
    innerDiv.innerHTML = "<span class='close'>&times;</span>";

    let ul = document.createElement("ul");
    ul.className = "ul-class";

    for (let i = 0; i < list.length; i++) {
        const e = list[i];
        let li = document.createElement("il"); //its a fucking annoying ::marker fix
        li.className = "li-class";

        if (i == 0) {
            let img = document.createElement("img");
            img.src = e.src;
            li.appendChild(img);
        } else {
            li.innerHTML += e;
        }

        ul.appendChild(li);
        li.children[0].setAttribute('class', 'img-class');

        if (i != 0){ // only on svg's
            let svg = li.children[0];
            if (svg.children.length == 1 && svg.children[0].getAttribute('d').length == 0){
                // console.log('REMOVER');
                // remove image if its a lonely, empty path element under svg
                ul.removeChild(li);
            }
        }

    }

    let li = document.createElement("il");
    li.className = "li-class";
    ul.appendChild(li);


    innerDiv.appendChild(ul);
    div.appendChild(innerDiv);
    document.body.appendChild(div);

    window.onclick = function (event) {
        if (event.target == div) {
            document.body.removeChild(div);
        }
    }

    innerDiv.children[0].onclick = function () {
        document.body.removeChild(div);
    }
}

function imgToBuffer(e) {
    let cnv = document.createElement("canvas"), w = cnv.width = e.width, h = cnv.height = e.height, ctx = cnv.getContext("2d");
    ctx.drawImage(e, 0, 0);
    return ctx.getImageData(0, 0, w, h)
}

