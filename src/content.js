let potrace = require('potrace');
import { FastAverageColor } from 'fast-average-color';
const fac = new FastAverageColor();
import { prominent } from 'color.js'
// import jscolor from './jscolor';

document.addEventListener("click", (e) => {
    try {

        if (!e.ctrlKey) {
            return;
        }

        let img = e.target.parentElement.children[0];
        if (img.tagName.toLowerCase() !== "img") {
            return;
        }

        let imgClasses = [];
        for (let i = 0; i < img.classList.length; i++) {
            imgClasses.push(img.classList[i]);
        }
        img.className = '';
        img.style.position = 'absolute';



        let bufferImg = imgToBuffer(img);
        let averageColor = fac.getColor(img).hex;
        let displays = createModal();

        displays.push(img);

        let steps10 = []; // lol its actually 20 lets ignore it
        let steps50 = [];
        for (let i = 0; i < 255; i++) {
            if (i % 20 === 0) {
                steps10.push(i);
            }
            if (i % 50 === 0) {
                steps50.push(i);
            }
        }

        steps50.forEach(v => {
            potrace.trace(bufferImg, { threshold: v }, function (err, svg) {
                if (err) throw err;
                displays.push(svg);
            });
        });

        prominent(img, { amount: 8, format: 'hex' }).then(colors => {
            if (typeof colors == "string") {
                colors = [colors];
            }
            colors.forEach(c => {
                potrace.trace(bufferImg, { color: c }, function (err, svg) {
                    if (err) throw err;
                    displays.push(svg);
                });
                steps10.forEach(v => {
                    potrace.trace(bufferImg, { threshold: v, color: c }, function (err, svg) {
                        if (err) throw err;
                        displays.push(svg);
                    });
                });
            });
        });

        potrace.posterize(bufferImg, { steps: [40, 85, 135, 180] }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(bufferImg, { steps: steps10 }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(bufferImg, { steps: steps50 }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(bufferImg, { steps: steps10, color: averageColor }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(bufferImg, { steps: steps50, color: averageColor }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });

        potrace.posterize(bufferImg, { color: averageColor }, function (err, svg) {
            if (err) throw err;
            displays.push(svg);
        });


        // this is a dirty fix to not knowning how many images will be created, since B/W ones have less colors, thus, less images.
        // since the concurrent modal implementation, its only used to reset the images's size after all images are created
        // without it the original image would be crippled forever OR the vectors created would be 80x80 pixels
        // TODO: look for a fix, maybe? i feel like this is fine as is
        let t1 = -1;
        let t2 = 0;
        let t3 = 0;
        function checkComplete() {
            if (t1 == t2 && t2 == t3 && t3 == displays.length) { // done
                // fixing the image style so it looks untouched
                imgClasses.forEach(e => {
                    img.classList.add(e);
                });
                img.style.position = '';
            } else {
                if (t1 == t2 && t2 == displays.length) {
                    t3 = displays.length;
                } else if (t1 == displays.length) {
                    t2 = displays.length;
                } else {
                    t1 = displays.length;
                }
                // console.log(displays.length);
                setTimeout(checkComplete, 50);
            }
        }
        checkComplete();


    } catch (error) {
        console.error(error);
    }
})

function createModal() {
    let div = document.createElement("div");
    div.id = "myModal";
    div.className = "modal";

    let innerDiv = document.createElement("div");
    innerDiv.className = "modal-content";
    innerDiv.innerHTML = "<span class='close'>&times;</span>";

    let ul = document.createElement("ul");
    ul.className = "ul-class";

    innerDiv.appendChild(ul);
    div.appendChild(innerDiv);

    /*
    let headerDiv = document.createElement('div');
    headerDiv.className = 'modal-header';
    div.appendChild(headerDiv);
    */

    document.body.appendChild(div);

    window.onclick = function (event) {
        if (event.target === div) {
            document.body.removeChild(div);
        }
    }

    innerDiv.children[0].onclick = function () {
        document.body.removeChild(div);
    }

    return new Proxy([], {
        set: function (target, property, value, receiver) {
            target[property] = value;
            if (property !== "length") {
                let e = value;
                let li = document.createElement("il"); //its a fucking annoying ::marker fix
                li.className = "li-class";

                if (property === "0") {
                    let img = document.createElement("img");
                    img.src = e.src;
                    li.appendChild(img);
                } else {
                    li.innerHTML += e;
                }

                ul.appendChild(li);
                li.children[0].setAttribute('class', 'img-class');

                if (property !== "0") { // only on svg's
                    let svg = li.children[0];
                    if (svg.children.length === 1 &&
                        (svg.children[0].getAttribute('d').length === 0 ||
                            svg.children[0].getBoundingClientRect().height < 10 ||
                            svg.children[0].getBoundingClientRect().width < 10)) {
                        // console.log('REMOVER');
                        // remove image if its a lonely, empty path element under svg
                        // or if its a too small lonely path
                        ul.removeChild(li);
                    }
                    svg.addEventListener('click', () => {
                        //create a file and put the content, name and type
                        var file = new File(["\ufeff" + li.innerHTML], makeid(10) + '.svg', { type: "text/plain:charset=UTF-8" });

                        //create a ObjectURL in order to download the created file
                        let url = window.URL.createObjectURL(file);

                        //create a hidden link and set the href and click it
                        var a = document.createElement("a");
                        a.style = "display: none";
                        a.href = url;
                        a.download = file.name;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(div);
                    });
                    fixOpacity(svg);
                } else {
                    let img = li.children[0];
                    img.addEventListener('click', () => {
                        var a = document.createElement("a");
                        a.style = "display: none";
                        a.href = img.src;
                        a.download = makeid(10);
                        a.target = '_blank';
                        a.click();
                        document.body.removeChild(div);
                    });
                }
            }
            return true;
        }
    });

}

function imgToBuffer(e) {
    let cnv = document.createElement("canvas"), w = cnv.width = e.width, h = cnv.height = e.height, ctx = cnv.getContext("2d");
    ctx.drawImage(e, 0, 0);
    return ctx.getImageData(0, 0, w, h)
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

function fixOpacity(svg) {
    if (svg.children.length === 1) {
        return;
    }
    let list = [];
    for (let i = 0; i < svg.children.length; i++) {
        const path = svg.children[i];
        let item = path.getAttribute("fill-opacity");
        if (item == null) {
            return;
        }
        list.push(Number(path.getAttribute("fill-opacity")));
    }
    let max = Math.max(...list);
    let correctionFactor = (max * 2 > 1 ? 0.8 : max * 2) / max;
    for (let i = 0; i < svg.children.length; i++) {
        const path = svg.children[i];
        path.setAttribute("fill-opacity", (list[i] * correctionFactor).toFixed(4));
    }
}