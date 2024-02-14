const logDir = "./log";
const logger = require("./logger");
const fs = require('fs');
const axios = require("axios");
const {createCanvas} = require('canvas')
const Canvas = require('canvas');
const JsBarcode = require('jsbarcode');
const fabric = require("fabric").fabric;
const QRCode = require('qrcode');
const moment = require('moment');
const querystring = require('querystring');
const url = require('url');
const sizeOf = require('image-size');
const converter = require('image_to_epaper_converter');
const Jimp = require('jimp');
const async = require("async");

// java관련 모듈 삭제
//const java = require('java');
//const jarFilePath = "ultra.jar";

const path = "resource/finaltagimage";
const mqtt = require('mqtt');


let mqttClient = undefined;

const mqttConnect = () => {
    const mqttoption = {
        host: global.config.mqttIpAddress,
        port: global.config.mqttport,
    };
    mqttClient = mqtt.connect(mqttoption);
    mqttClient.on("connect", () => {
        logInfo("=== mqtt connect success " + global.config.mqttHost + " === ");
    })

    // mqttClient.subscribe("/Ultra/#");

    mqttClient.on('message', (topic, receiveMessage, packet) => {
        if (!receiveMessage.toString().includes("msg_type")) {
            return;
        }
        let bodyJson = JSON.parse(receiveMessage.toString());
        if (bodyJson.msg_type == "registData" || bodyJson.msg_type == "RegistData") {

            // console.log(bodyJson)

        }
    });
}


let resjson = {
    "status": {
        "statusMessage": "success",
        "statusCode": "200"
    },
    "jobGUID": ""
}


//java.classpath.push(jarFilePath);
//global.javaInstance = java.import('ultra.ConvUtil')();

const existsFile = async (filename, res) => {
    async.waterfall([
        await
        function (callback) {

            convert(filename);
            // console.log(result);
            callback(null);
        },
        await
        function (callback) {
            setTimeout(function () {
                logInfo(filename)
                //var result = javaInstance.hex2binSync(path + "/log/" + filename + ".txt", path + "/log/" + filename + ".bin");
				var result = "";
                var buf1 = Buffer.from(result);
                logInfo("length:" + buf1.length);
                // logInfo(buf1);
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-length': buf1.length
                }); //application/octet-stream	//text/plain
                logInfo('*** res buf1 length == >' + buf1.length);
                res.end(buf1);
            }, 2000);
            callback(null);
        },
        await
        function (callback) {
            // setTimeout(function () {
            // 	convert(filename)
            // }, 2000);

            // setTimeout(function(){fs.unlink(path + "/" + filename + ".png", (err) => {
            // 	if(err)
            // 	console.log("Error for delete : " + err);
            // })}, 3500);
        }

    ], (err, result) => {
        if (err) {
            console.log(err);
        }
    });
}

function noexistsFile(fn, res) {

        console.log(fn + 'File does not exist.');
   
    res.end('File does not exist.');
}
// }

async function rotate(path, width, height) {
    // Read the image.
    const image = await Jimp.read(path);
    await image.rotate(270);
    await image.resize(height, width);
    // Save and overwrite the image
    await image.writeAsync(path);
}

async function rotate2(path, width, height) {
    const image = await Jimp.read(path);
    // await image.quality(60);
    // await image.contrast(1);
    await image.rotate(270);
    // await image.resize(height, width);
    await image.writeAsync(path);
}

function convert(filename) { //승호씨 코드
    var tagWidth;
    var tagHeight;
    // var rotateStat = false;
    async.waterfall([

        function (callback) {
            sizeOf(path + "/" + filename + ".png", function (err, dim) {
                logInfo("[dim.width]  ==> " + dim.width + "[dim.height]  ==> " + dim.height);
                if (dim.width == 478 || dim.width == 480) {
                    // console.log("[478 480][dim.width]  ==> "+ dim.width);
                    rotate(path + "/" + filename + ".png", 480, 800);
                    tagWidth = dim.height;
                    tagHeight = dim.width;
                }
                // else if(dim.width == 126 || dim.width == 128){
                else if (dim.width == 126) {
                    // console.log("[126 128][dim.width]  ==> "+ dim.width);
                    rotate(path + "/" + filename + ".png", 128, 296);
                    tagWidth = dim.height;
                    tagHeight = dim.width;
                } else if (dim.width == 298 || dim.width == 300) {
                    // console.log("[298 300][dim.width]  ==> "+ dim.width);
                    rotate(path + "/" + filename + ".png", 300, 400);
                    tagWidth = dim.height;
                    tagHeight = dim.width;
                } else if (dim.width == 296) {
                    // console.log("[296][dim.width]  ==> "+ dim.width);
                    rotate2(path + "/" + filename + ".png", 296, 128);
                    tagWidth = dim.height;
                    tagHeight = dim.width;
                } else {
                    // console.log("[dim.width]  ==> "+ dim.width + "[dim.height]  ==> " + dim.height);
                    tagWidth = dim.width;
                    tagHeight = dim.height;
                }
            });
            callback(null);
        },

        function (callback) {
            // console.log("step2 : " + tagWidth, tagHeight, filename);
            setTimeout(function () {
                converter.convert({
                    source_file: path + "/" + filename + ".png",
                    target_folder: path + "/log",
                    target_text_filename: filename + ".txt",
                    target_cpp_filename: filename,
                    cpp_variable_name: filename.toUpperCase(),
                    tasks: ["hexadecimal"],
                    display: {
                        "width": tagWidth,
                        "height": tagHeight,
                        // "width": tagHeight,
                        // "height": tagWidth,
                        "fitmode": "none",
                        "fillmode": "inverted",
                        "colormode": "inverted"
                    },
                    image: {
                        "crop": {
                            "enabled": false,
                            "top": 0,
                            "left": 0,
                            "width": 0,
                            "height": 0
                        },
                        "resize": {
                            "enabled": false,
                            "width": tagWidth,
                            "height": tagHeight,
                            "fit": "crop",
                            "algorithm": "nearestNeighbor"
                        },
                        "rotate": {
                            "enabled": false,
                            "degrees": 270,
                            "fit": "same",
                            "padColor": {
                                "r": 0,
                                "g": 0,
                                "b": 0,
                                "a": 0
                            }
                        }
                    }
                    // })},2000);
                })
            }, 1800);

            callback(null);
        }

    ], (err, result) => {
        if (err) {
            console.log(err);
        }
    });


}
const getImgList = (req, res) => { //deprciated : 전이사님 image process server로 기능 이관
    logInfo("url : " + req.url)
    let data = req.url;
    let url_data = url.parse(data);

    let query = querystring.parse(url_data.query);
    let fn = query.fn;

    let fnArr;

    if (fn == undefined || fn == '') {
        logInfo('Unknown file name or empty file name. Please check the file name or Thing ID.');
        res.end('Unknown file name or empty file name. Please check the file name or Thing ID.');
    } else {
        logInfo(fn);
        fnArr = fn.split('_');
        if (fnArr.length == 3) {
            if (fnArr[2] == 1 || fnArr[2] == 2 || fnArr[2] == 3) {
                fs.exists(path + '/' + fn + '.png', (exists) => {
                    exists ? existsFile(fn, res) : noexistsFile(fn, res);
                });
            } else if (fnArr[2] == "1b" || fnArr[2] == "2b" || fnArr[2] == "3b") {
                fs.exists(path + '/' + fn + '.png', (exists) => {
                    exists ? existsFile(fn, res) : noexistsFile(fn, res);
                });
            } else {
                console.log('Invalid page');
                res.end('Invalid page');
            }
        } else {
            console.log('Not a valid filename');
            res.end('Not a valid filename');
        }
    }
}

const logInfo = (info) => {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    logger.info(info);

}
const logError = (info) => {
    logger.error("ERROR=>" + info);
}



const DrawLine = (objectParent, canvasArr) => {
    let canvas = canvasArr[0];
    let canvasRed = canvasArr[1];
    let canvasCombined = canvasArr[2];

    let object = objectParent.objdata;

    var moveToWidth;
    var moveToHeight;
    var lineToWidth;
    var lineToHeight;


    switch (object.data.direction) {
        case this.LINEDIRECTION.VERTICAL: {
            moveToWidth = object.data.x + (object.data.linewidth * 0.5);
            moveToHeight = object.data.y;

            lineToWidth = object.data.x + (object.data.linewidth * 0.5);
            lineToHeight = object.data.y + (object.data.height);

        };
        break;
    case this.LINEDIRECTION.HORIZONTAL: {
        moveToWidth = object.data.x;
        moveToHeight = object.data.y + (object.data.linewidth * 0.5);

        lineToWidth = object.data.x + object.data.width;
        lineToHeight = object.data.y + (object.data.linewidth * 0.5);
    };
    break;
    };

    canvas.add(new fabric.Line([moveToWidth, moveToHeight, lineToWidth, lineToHeight], {
        left: object.data.x,
        top: object.data.y,
        stroke: 'black',
        strokeWidth: object.data.linewidth,
        width: object.data.width,
        scaleY: 1,
        scaleX: 1,
        angle: object.radian,
    }));
    canvasRed.add(new fabric.Line([moveToWidth, moveToHeight, lineToWidth, lineToHeight], {
        left: object.data.x,
        top: object.data.y,
        stroke: 'black',
        strokeWidth: object.data.linewidth,
        width: object.data.width,
        scaleY: 1,
        scaleX: 1,
        angle: object.radian,
    }));
    canvasCombined.add(new fabric.Line([moveToWidth, moveToHeight, lineToWidth, lineToHeight], {
        left: object.data.x,
        top: object.data.y,
        stroke: 'black',
        strokeWidth: object.data.linewidth,
        width: object.data.width,
        scaleY: 1,
        scaleX: 1,
        angle: object.radian,
    }));
};
const drawObject = (object, canvasArr) => {
    switch (object.objdata.type) {
        case OBJECT_TYPE().CIRCLE: {
            // log("CIRCLE");
        };
        break;
    case OBJECT_TYPE().RECT: {
        DrawRect(object, canvasArr);
    };
    break;
    case OBJECT_TYPE().LINE: {
        DrawLine(object, canvasArr);
    };
    break;
    case OBJECT_TYPE().DATA_BOX: {
        DrawText(object);
    };
    break;
    };
};
const OBJECT_TYPE = () => {
    return {
        CIRCLE: 0,
        RECT: 1,
        LINE: 2,
        IMAGE: 3,
        DATA_BOX: 4
    };
};

const DrawRect = (objectParent, canvasArr) => {
    let canvas = canvasArr[0];
    let canvasRed = canvasArr[1];
    let canvasCombined = canvasArr[2];

    let tagSize = objectParent.tagsize
    let object = objectParent.objdata;


    if (canvas == undefined) {
        canvas = new fabric.Canvas(null, {
            width: object.data.width,
            height: object.data.height
        });
    }
    if (canvasRed == undefined) {
        canvasRed = new fabric.Canvas(null, {
            width: object.data.width,
            height: object.data.height
        });
    }
    if (canvasCombined == undefined) {
        canvasCombined = new fabric.Canvas(null, {
            width: object.data.width,
            height: object.data.height
        });
    }
    // _ctxBuffer.lineWidth = object.data.lineWidth;
    // _ctxBuffer.save();

    // let cacheAlpha = _ctxBuffer.globalAlpha;

    // if(g_sizeData==1){
    //     _ctxBuffer.translate(_ctxBuffer.canvas.width, _ctxBuffer.canvas.height);
    //     _ctxBuffer.rotate(180 * Math.PI / 180);
    // }
    // _ctxBuffer.strokeStyle = object.data.strokeColor;
    let rectfilltype = object.data.rectFillType;
    let Rect = new fabric.Rect({
        subTargetCheck: true,
        width: object.data.width,
        height: object.data.height,
        fill: 'white',
        strokeWidth: object.data.lineWidth,
        stroke: 'white',
        opacity: object.data.rectAlpha,
        evented: false,
        selectable: false
    });
    let Rect2 = new fabric.Rect({
        subTargetCheck: true,
        width: object.data.width,
        height: object.data.height,
        fill: "transparent",
        strokeWidth: object.data.lineWidth,
        stroke: "transparent",
        opacity: object.data.rectAlpha,
        evented: false,
        selectable: false
    });

    let text = new fabric.Text(" ", {
        fontSize: object.data.rectfontsize,
        fontFamily: object.data.rectfontface,
        // fontFamily: "NotoSans",
        evented: false,
        selectable: false
    });

    let text2 = new fabric.Text(" ", {
        fontSize: object.data.rectfontsize,
        fontFamily: object.data.rectfontface,
        // fontFamily: "NotoSans",
        evented: false,
        selectable: false
    });

    let imageElement = new Canvas.Image;
    if (object.data.eleImgSrc != undefined) {
        imageElement = new Canvas.Image;
        imageElement.top = -object.data.height / 2;
        imageElement.left = -object.data.width / 2;
        imageElement.width = object.data.width;
        imageElement.height = object.data.height;
        imageElement.scaleX = object.data.width / object.data.eleImgOriWidth;
        imageElement.scaleY = object.data.height / object.data.eleImgOriHeight;
        imageElement.src = object.data.eleImgSrc;
    }
    let fImage = new fabric.Image(imageElement);

    let group = new fabric.Group([Rect, text, fImage], { //black, white
        angle: object.radian,
        width: object.data.width,
        height: object.data.height,
        top: object.data.y,
        left: object.data.x,
        evented: false,
        selectable: false
    });

    let group2 = new fabric.Group([Rect2, text2], { //red color 분리용
        angle: object.radian,
        width: object.data.width,
        height: object.data.height,
        top: object.data.y,
        left: object.data.x,
        evented: false,
        selectable: false
    });

    if (rectfilltype != 'rectfillnone') {
        if (rectfilltype == 'rectfillcolor') {
            if (object.data.rectColor == 'red' || object.data.rectColor == 'RED') {
                group2.item(0).set({
                    top: 0 - object.data.height * 0.5,
                    left: 0 - object.data.width * 0.5,
                    stroke: object.data.strokeColor,
                    fill: object.data.rectColor,
                    width: object.data.width,
                    height: object.data.height,
                    opacity: object.data.rectAlpha,
                });
            } else {
                group.item(0).set({
                    top: 0 - object.data.height * 0.5,
                    left: 0 - object.data.width * 0.5,
                    stroke: object.data.strokeColor,
                    fill: object.data.rectColor,
                    width: object.data.width,
                    height: object.data.height,
                    opacity: object.data.rectAlpha,
                });
            }

        } else if (rectfilltype == 'rectfillimg') {
            // _ctxBuffer.globalAlpha = object.data.eleImgAlpha;
            let image = new Canvas.Image;
            image.src = object.data.eleImgSrc

            if (image != undefined) {
                // _ctxBuffer.lineWidth = object.data.linewidth;
                if (object.data.eleImgFillType == "fit") {
                    image.width = object.data.width;
                    image.height = object.data.height;
                    group.item(2).set({
                        top: -object.data.height / 2,
                        left: -object.data.width / 2,
                        scaleX: object.data.width / object.data.eleImgOriWidth,
                        scaleY: object.data.height / object.data.eleImgOriHeight,
                    });
                    //group.item(2).setSrc(object.data.eleImgSrc)
                    canvas.requestRenderAll();
                } else if (object.data.eleImgFillType == "repeat") {
                    // let splitWidth = object.data.width / 3;
                    // let splitHeight = object.data.height / 3;
                    // image.width = object.data.width;
                    // image.height = object.data.height;

                    // for (let i = 0; i < 3; i++) {
                    //     for (let j = 0; j < 3; j++) {
                    //         _ctxBuffer.drawImage(image,
                    //             object.data.x + (splitWidth * j),
                    //             object.data.y + (splitHeight * i),
                    //             splitWidth, splitHeight);
                    //     }
                    // }
                } else if (object.data.eleImgFillType == "centor") {
                    let width = object.data.eleImgOriWidth;
                    let height = object.data.eleImgOriHeight;
                    if (object.data.width < object.data.eleImgOriWidth) {
                        width = object.data.width;
                    }

                    if (object.data.height < object.data.eleImgOriHeight) {
                        height = object.data.height;
                    }

                    let horizontalcenter = object.data.x + (object.data.width * 0.5) - (width * 0.5);
                    let verticalcenter = object.data.y + (object.data.height * 0.5) - (height * 0.5);
                    // _ctxBuffer.drawImage(image,
                    //     horizontalcenter,
                    //     verticalcenter,
                    //     width,
                    //     height
                    // );
                };

                // _ctxBuffer.strokeRect(
                //     object.data.x,
                //     object.data.y,
                //     object.data.width,
                //     object.data.height
                // );
            } else {
                // _ctxBuffer.strokeRect(
                //     object.data.x,
                //     object.data.y,
                //     object.data.width,
                //     object.data.height
                // );
            };
        };
    } else {
        if (object.data.strokeColor == 'red' || object.data.strokeColor == 'RED') {
            group2.item(0).set({
                top: 0 - object.data.height * 0.5,
                left: 0 - object.data.width * 0.5,
                stroke: object.data.strokeColor,
                fill: 'transparent',
                width: object.data.width,
                height: object.data.height,
                opacity: 1,
            });
        } else {
            group.item(0).set({
                top: 0 - object.data.height * 0.5,
                left: 0 - object.data.width * 0.5,
                stroke: object.data.strokeColor,
                fill: 'transparent',
                width: object.data.width,
                height: object.data.height,
                opacity: 1,
            });
        }
    }
    let textType = object.data.textType;

    if (textType == 'none') {

    } else if (textType == 'rectdatadirect' || textType == 'rectdatadataset') {
        if (object.data.dataSetText.split('$')[1] == "QRcode" || object.data.dataSetText.split('$')[1] == "Barcode" || object.data.dataSetText.split('$')[1] == "image") {
            let canvasForQRBarcode
            let ctxBufferForQRBarcode
            if (object.data.width == 148 || tagSize == 1) {
                canvasForQRBarcode = createCanvas(296, 128);
                ctxBufferForQRBarcode = canvasForQRBarcode.getContext('2d');

            } else if (object.data.width == 128 || tagSize == 2) {
                canvasForQRBarcode = createCanvas(128, 296);
                ctxBufferForQRBarcode = canvasForQRBarcode.getContext('2d');

            } else if (object.data.width == 200 || tagSize == 3) {
                canvasForQRBarcode = createCanvas(400, 300);
                ctxBufferForQRBarcode = canvasForQRBarcode.getContext('2d');

            } else if (object.data.width == 300 || tagSize == 4) {
                canvasForQRBarcode = createCanvas(300, 400);
                ctxBufferForQRBarcode = canvasForQRBarcode.getContext('2d');

            } else if (object.data.width == 400 || tagSize == 5) {
                canvasForQRBarcode = createCanvas(800, 480);
                ctxBufferForQRBarcode = canvasForQRBarcode.getContext('2d');

            } else if (object.data.width == 480 || tagSize == 6) {
                canvasForQRBarcode = createCanvas(478, 798);
                ctxBufferForQRBarcode = canvasForQRBarcode.getContext('2d');
            } else {
                canvasForQRBarcode = createCanvas(object.data.width, object.data.height);
                ctxBufferForQRBarcode = canvasForQRBarcode.getContext('2d');
            }

            //if(document.getElementById(object.data.dataSetText.split('_')[1]+'canvas')!= null ||document.getElementById(object.data.dataSetText.split('_')[1]+'Target')!= null ){
            const img = new Canvas.Image();

            if (object.data.dataSetText.split('$')[1] == "Barcode") {
                let value = object.data.dataSetText.split('$')[0];
                JsBarcode(canvasForQRBarcode, value, {
                    format: "CODE128",
                    displayValue: false,
                    valid: function () {}
                });
                img.src = canvasForQRBarcode.toDataURL("image/png");

                //img.src = document.getElementById(object.data.dataSetText.split('_')[1]+'img').src
                //img.src=document.getElementById('')

            } else if (object.data.dataSetText.split('$')[1] == "QRcode") {
                //f_generateQRcode('QRcode',object.data.dataSetText);
                let value = object.data.dataSetText.split('$')[0];
                if (value == "" || value == undefined || value == null) {
                    value = "";
                } else {
                    QRCode.toCanvas(canvasForQRBarcode, value, function (error) {
                        if (error) console.error(error)
                    })
                    // log(value)

                    img.src = canvasForQRBarcode.toDataURL("image/png");
                }

            } else { //image base64 in json value
                let value = object.data.dataSetText.split('$')[0];
                // log("@")


                if (value == "" || value == undefined || value == null) {
                    value = "";
                } else {
                    img.src = value;
                }
            }

            let angle = 0;
            if (tagSize == 1) {
                angle = 180;
            }
            object.data.eleImgOriWidth = img.width;
            object.data.eleImgOriHeight = img.height;
            object.data.eleImg = img;
            object.data.eleImgSrc = img.src;

            // _ctxBuffer.globalAlpha = object.data.eleImgAlpha;
            let image = object.data.eleImg;

            if (image != undefined) {
                //log('image : '+ image.src);
                // _ctxBuffer.lineWidth = object.data.linewidth;

                if (object.data.eleImgFillType == "fit") {
                    let widthheight;
                    if (object.data.dataSetText.split('$')[1] == "QRcode") {
                        if (object.data.width >= object.data.height) {
                            widthheight = object.data.height;
                        } else if (object.data.width < object.data.height) {
                            widthheight = object.data.width;
                        }
                        let iimage;
                        if (tagSize == 1) {
                            fabric.Image.fromURL(object.data.eleImgSrc, function (img) {
                                let canvasCenter = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2) // center of canvas
                                let radians = fabric.util.degreesToRadians(180)
                                let objectOrigin = new fabric.Point(object.data.x, object.data.y)
                                let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter, radians)

                                iimage = img.set({
                                    width: object.data.eleImgOriWidth,
                                    height: object.data.eleImgOriWidth,
                                    selectable: false,
                                    left: new_loc.x - 3,
                                    top: new_loc.y - 3,
                                    scaleX: widthheight / img.width * 0.95,
                                    scaleY: widthheight / img.width * 0.95,
                                    angle: object.radian + angle,
                                })


                                canvas.add(iimage);
                                canvas.renderAll();
                                canvasCombined.add(iimage);
                                canvasCombined.renderAll();
                            }.bind(this));
                        } else {
                            fabric.Image.fromURL(object.data.eleImgSrc, function (img) {
                                iimage = img.set({
                                    selectable: false,
                                    left: object.data.x + 5,
                                    top: object.data.y + 5,
                                    angle: object.radian,
                                    width: object.data.eleImgOriWidth - 3,
                                    height: object.data.eleImgOriHeight - 3,
                                    scaleX: object.data.width / img.width * 0.95,
                                    scaleY: object.data.height / img.height * 0.95
                                })

                                canvas.add(iimage);
                                canvas.renderAll();
                                canvasCombined.add(iimage);
                                canvasCombined.renderAll();
                            }.bind(this));
                        }


                    } else if (object.data.dataSetText.split('$')[1] == "image") {
                        let iimage;

                        if (tagSize == 1) {
                            fabric.Image.fromURL(object.data.eleImgSrc, function (img) {
                                let canvasCenter = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2) // center of canvas
                                let radians = fabric.util.degreesToRadians(180)
                                let objectOrigin = new fabric.Point(object.data.x, object.data.y)
                                let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter, radians)

                                iimage = img.set({
                                    selectable: false,
                                    left: new_loc.x - 3,
                                    top: new_loc.y - 3,
                                    angle: object.radian + angle,
                                    // width : object.data.eleImgOriWidth,
                                    // height : object.data.eleImgOriWidth,
                                    // scaleX: widthheight / img.width *0.9,
                                    // scaleY: widthheight / img.width *0.9,
                                    width: object.data.eleImgOriWidth,
                                    height: object.data.eleImgOriHeight,
                                    scaleX: object.data.width / img.width * 0.7,
                                    scaleY: object.data.height / img.height * 0.7
                                })
                                canvas.add(iimage);
                                canvas.renderAll();
                                canvas.requestRenderAll();

                                canvasCombined.add(iimage);
                                canvasCombined.renderAll();
                            }.bind(this));
                        } else {
                            fabric.Image.fromURL(object.data.eleImgSrc, function (img) {
                                iimage = img.set({
                                    selectable: false,
                                    left: object.data.x + 1,
                                    top: object.data.y + 1,
                                    //    width : object.data.eleImgOriWidth,
                                    //    height : object.data.eleImgOriWidth,
                                    //    scaleX: object.data.width / img.width,
                                    //    scaleY: object.data.height / img.height,

                                    width: object.data.eleImgOriWidth - 3,
                                    height: object.data.eleImgOriHeight - 3,
                                    scaleX: object.data.width / img.width * 0.95,
                                    scaleY: object.data.height / img.height * 0.95
                                })
                                canvas.add(iimage);
                                canvas.renderAll();
                                canvas.requestRenderAll();
                                canvasCombined.add(iimage);
                                canvasCombined.renderAll();
                            }.bind(this));
                        }

                    } else { //barcode
                        let x;
                        let y;
                        let width;
                        let height
                        if (object.data.width > image.width) {
                            width = image.width;
                            x = object.data.x + ((object.data.width / 2) - (image.width) / 2);
                        } else if (object.data.width <= image.width) {
                            width = object.data.width
                            x = object.data.x;
                        }
                        if (object.data.height > image.height) {
                            height = image.height;
                        } else if (object.data.height <= image.height) {
                            height = object.data.height
                        }

                        // _ctxBuffer.drawImage(
                        //     image,
                        //     x,
                        //     object.data.y+10,
                        //     width,
                        //     height*0.8
                        // );


                        let iimage;

                        if (tagSize == 1) {
                            fabric.Image.fromURL(object.data.eleImgSrc, function (img) {

                                let canvasCenter = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2) // center of canvas
                                let radians = fabric.util.degreesToRadians(180)
                                let objectOrigin = new fabric.Point(object.data.x, object.data.y)
                                let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter, radians)

                                iimage = img.set({
                                    selectable: false,
                                    left: new_loc.x - 3,
                                    top: new_loc.y - 3,
                                    scaleX: object.data.width / img.width * 0.95,
                                    scaleY: object.data.height / img.height * 0.95,
                                    angle: object.radian + angle,
                                })


                                canvas.add(iimage);
                                canvas.renderAll();


                            }.bind(this));
                        } else {
                            fabric.Image.fromURL(object.data.eleImgSrc, function (img) {
                                iimage = img.set({
                                    selectable: false,
                                    left: object.data.x + 3,
                                    top: object.data.y + 3,
                                    scaleX: object.data.width / img.width * 0.95,
                                    scaleY: object.data.height / img.height * 0.95,
                                    angle: object.radian,
                                })

                                canvas.add(iimage);
                                canvas.renderAll();

                            }.bind(this));
                        }
                        fabric.Image.fromURL(object.data.eleImgSrc, function (img) {

                            let canvasCenter = new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2) // center of canvas
                            let radians = fabric.util.degreesToRadians(180)
                            let objectOrigin = new fabric.Point(object.data.x, object.data.y)
                            let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter, radians)

                            iimage = img.set({
                                selectable: false,
                                left: new_loc.x - 3,
                                top: new_loc.y - 3,
                                scaleX: object.data.width / img.width * 0.95,
                                scaleY: object.data.height / img.height * 0.95,
                                angle: object.radian + angle,
                            })

                            canvasCombined.add(iimage);
                            canvasCombined.renderAll();
                        })





                    }

                }
            }
        }

        // else if(object.data.dataSetText.split('$')[1]=="Barcode" || object.data.dataSetText.split('$')[1]=="QRcode" || object.data.dataSetText.split('$')[1]=="image"){
        else {
            let drawText = "";
            if (textType == 'rectdatadataset') {
                if (/undefined/.test(object.data.dataSetText)) {
                    drawText = "";
                } else {

                    drawText = object.data.dataSetText.split('$')[0];
                }
                //log(object.data.dataSetText)
            } else {
                drawText = object.data.text;
            }

            let underline = false;
            if (object.data.rectfontdecoration == "underline") {
                underline = true;
            }
            if (object.data.rectfontfillstyle == 'red' || object.data.rectfontfillstyle == 'RED') {
                group2.item(1).set({
                    text: drawText,
                    fill: object.data.rectfontfillstyle,
                    fontFamily: object.data.rectfontface,
                    // fontFamily: "NotoSans",

                    fontSize: object.data.rectfontsize,
                    underline: underline,
                    fontStyle: object.data.rectfontstyle,
                    fontWeight: object.data.rectfontweight,
                    opacity: object.data.rectAlpha,
                    originX: 'center',
                    originY: 'center',
                    left: 0,
                    top: 0,
                });
            } else if (object.data.rectfontfillstyle == 'white' || object.data.rectfontfillstyle == 'WHITE') { //글씨 흰색
                if (object.data.rectColor == 'red' || object.data.rectColor == 'RED') {
                    group2.item(1).set({
                        text: drawText,
                        fill: object.data.rectfontfillstyle,
                        fontFamily: object.data.rectfontface,
                        fontSize: object.data.rectfontsize,
                        underline: underline,
                        fontStyle: object.data.rectfontstyle,
                        fontWeight: object.data.rectfontweight,
                        opacity: object.data.rectAlpha,
                        originX: 'center',
                        originY: 'center',
                        left: 0,
                        top: 0,
                    });
                } else {
                    group.item(1).set({
                        text: drawText,
                        fill: object.data.rectfontfillstyle,
                        fontFamily: object.data.rectfontface,
                        fontSize: object.data.rectfontsize,
                        underline: underline,
                        fontStyle: object.data.rectfontstyle,
                        fontWeight: object.data.rectfontweight,
                        opacity: object.data.rectAlpha,
                        originX: 'center',
                        originY: 'center',
                        left: 0,
                        top: 0,
                    });
                }

            } else { //글씨 검정


                group.item(1).set({
                    text: drawText,
                    fill: object.data.rectfontfillstyle,
                    fontFamily: object.data.rectfontface,
                    fontSize: object.data.rectfontsize,
                    underline: underline,
                    fontStyle: object.data.rectfontstyle,
                    fontWeight: object.data.rectfontweight,
                    opacity: object.data.rectAlpha,
                    originX: 'center',
                    originY: 'center',
                    left: 0,
                    top: 0,
                });
            }
            // log(drawText)


            if (object.data.recttextbaseline == "top") {
                group.item(1).set({
                    top: -group.item(0).height * group.item(0).scaleY * 0.5 + group.item(1).height * group.item(1).scaleY * 0.5,
                });
                group2.item(1).set({
                    top: -group2.item(0).height * group2.item(0).scaleY * 0.5 + group2.item(1).height * group2.item(1).scaleY * 0.5,
                });

            } else if (object.data.recttextbaseline == "bottom") {
                group.item(1).set({
                    top: group.item(0).height * group.item(0).scaleY * 0.5 - group.item(1).height * group.item(1).scaleY * 0.5,
                });
                group2.item(1).set({
                    top: group2.item(0).height * group2.item(0).scaleY * 0.5 - group2.item(1).height * group2.item(1).scaleY * 0.5,
                });

            }
            if (object.data.recttextAlign == "left") {
                group.item(1).set({
                    left: -group.item(0).width * 0.5 + group.item(1).width * 0.5,
                });
                group2.item(1).set({
                    left: -group2.item(0).width * 0.5 + group2.item(1).width * 0.5,
                });

            } else if (object.data.recttextAlign == "right") {
                group.item(1).set({
                    left: group.item(0).width * 0.5 - group.item(1).width * 0.5,
                });
                group2.item(1).set({
                    left: group2.item(0).width * 0.5 - group2.item(1).width * 0.5,
                });
            }


            //}
            else {
                // _ctxBuffer.strokeRect(
                //     object.data.x,
                //     object.data.y,
                //     object.data.width,
                //     object.data.height
                // );
            };


        }
        // else{
        //     //log("fill text")
        //     //log(object)

        //     _ctxBuffer.fillText(drawText,
        //         horizontalAlignValue,
        //         verticalAlignValue);
        // }
    }

    // setTimeout(() => {
    canvas.add(group);
    canvas.renderAll();
    canvasRed.add(group2);
    canvasRed.renderAll();
    canvasCombined.add(group);
    canvasCombined.add(group2);
    canvasCombined.renderAll();
    // },500)

    // _ctxBuffer.globalAlpha = cacheAlpha;
    // _ctxBuffer.restore();

};
const ajax = (options, callback, errorcallback) => {
    if (options.type === "get") {
        axios({
                method: 'get',
                url: options.url,
                params: options.sendData
            })
            .then(function (response) {
                callback(response.data);
            })
        // .catch(function (response){
        //     if(errorcallback==null || errorcallback==undefined){
        //         log("error")
        //     }
        //     else{
        //         errorcallback(response);
        //         log("error : " + response);
        //     }
        // });


        // fetch(options.url )
        // .then(response => response.json())
        // .then(response  => {
        //     callback(response);
        // });
    } else if (options.type === "post") {
        axios({
                headers: options.headers,
                method: 'post',
                url: options.url,
                data: JSON.stringify(options.sendData)
            })
            .then(response => {
                callback(response);
            });;


        // fetch(url,{
        //     headers: {
        //         'Content-Type': "application/json;ty="+options.ty,
        //         'Accept':"application/json",
        //         'X-M2M-RI' : options.X2M2MRI,
        //         'X-M2M-Origin' : options.X2MORIGIN
        //     },
        //     method:"post",
        //     body : JSON.stringify(options.sendData),
        // })
        // .then(response  => {
        //     callback(response);
        // });
    };
}

const getRecentData = (parm, res) => {   //deprciated : 전이사님 image process server로 기능 이관
    logInfo("recent data request");
    logInfo(parm);

    let _thingID = parm.insertData.thingid;
    let _pagenumber = parm.insertData.pagenumber;
    let _jobGUID = parm.insertData.jobGUID;
    let options = {
        url: global.config.ipAddress +':8090/ApiMain',
        type: "get",
        headers: {
            'Content-Type': "application/json",
        },
        sendData: {
            "execType": "thingaddlist",
            "category": "thingmanage",
            "thingtyperawid": -1,
            "thingrawid": -1,
            "pNumber": 0,
            "pageSize": 10,
            "locname": "",
            "cntPageNumber": 0,
            "cntPageSize": 10,
            "prefix": "WTAG",
            "httptype": "put",
            "aeName": _thingID

        }
    };
    const successFunc = (data) => {
        logInfo("success : recent data ")
        if (Object.keys(data.sensordata[0]).length == 0) {
            res.status(404);
            res.send();
            return;
        }

        let reccentimagersult = {
            "status": {
                "statusMessage": "success",
                "statusCode": "200"
            },
            "thingid": _thingID,
            "pagenumber": _pagenumber,
            "jobGUID": _jobGUID,
            "contents": {
                "recentData": data.sensordata
            }
        }
        res.json(reccentimagersult);
    }
    const errorFunc = (data) => {
        res.send(data);
    }
    ajax(options, successFunc, errorFunc)

}

const getRecentImage = (parm, res) => { //deprciated : 전이사님 image process server로 기능 이관
    let _dirname = "resource/finaltagimage";
    let _thingID = parm.insertData.thingid;
    let _jobGUID = parm.insertData.jobGUID;
    let _pagenumber = parm.insertData.pagenumber;
    logInfo("recentimage request");
    logInfo(parm);

    const out = fs.readFile(_dirname + '/' + _thingID + '_' + _pagenumber + '.png', {
        encoding: 'base64'
    }, (err, data) => {
        if (err) {
            logError("recent image read fail")
            // resjson =
            // {
            //     "status":{
            //         "statusMessage":"error",
            //         "statusCode":"400"
            //     },
            //     "jobGUID":_jobGUID,
            //     "contents":{
            //         "message":err.stack
            //     }
            // }
            res.status(404);
            res.send();
        } else {
            logInfo("success : recent image ")
            let reccentimagersult = {
                "status": {
                    "statusMessage": "success",
                    "statusCode": "200"
                },
                "thingid": _thingID,
                "pagenumber": _pagenumber,
                "jobGUID": _jobGUID,
                "contents": {
                    "base64": data
                }
            }
            res.json(reccentimagersult);
        }
    });
}
const getTagKey = (parm, res) => { //deprciated : 전이사님 image process server로 기능 이관
    let _thingid = parm.insertData.thingid;
    let _pagenumber = parm.insertData.pagenumber
    let _jobGUID = parm.insertData.jobGUID

    let options = {
        url: global.thingwaveServerIP,
        type: "get",
        headers: {
            'Content-Type': "application/json",
        },
        sendData: {
            "tagdata": {
                "insertData": {},
                "thingid": _thingid,
                "pagenumber": _pagenumber,
            },
            "execType": "tagpublish",
            "category": "form"
        }
    };
    ajax(options, function (data) {
        if (data == undefined || data.tagpublish == undefined) {
            logError("There are no forms that match the information you entered.");     //입력하신 정보와 일치하는 폼이 없습니다.
            resjson = {
                "status": {
                    "statusMessage": "error",
                    "statusCode": "400"
                },
                "jobGUID": _jobGUID,
                "contents": "There are no forms that match the information you entered."    //입력하신 정보와 일치하는 폼이 없습니다.

            }
            res.json(resjson)

            return;
        } else if (data.tagpublish.length == 0) {
            //alert("입력하신 요청 정보와 일치하는 폼이 없습니다.")
            logError("There are no forms that match the information you entered.");     //입력하신 정보와 일치하는 폼이 없습니다.
            resjson = {
                "status": {
                    "statusMessage": "error",
                    "statusCode": "400"
                },
                "jobGUID": _jobGUID,
                "contents": {
                    "message": "There are no forms that match the information you entered." //입력하신 정보와 일치하는 폼이 없습니다."
                }
            }
            res.json(resjson)
            return;
        }
        _culumnName = data.tagpublish[0]['culumnname'];
        _culumnArr = data.tagpublish[0]['culumnvalue'].split('_');
        _imageName = _culumnArr[1] + '_' + _culumnArr[2];
        if (parm.insertData.imageName != undefined && _culumnArr[0] != parm.insertData.imageName) {
            logError("The selected Form and Thing ID you entered do not match.");           //선택한 Form과 입력한 Thing ID가 일치하지 않습니다.")
            resjson = {
                "status": {
                    "statusMessage": "error",
                    "statusCode": "400"
                },
                "contents": {
                    "message": "The selected Form and Thing ID you entered do not match."    //선택한 Form과 입력한 Thing ID가 일치하지 않습니다."
                }
            }
            res.json(resjson)
            return;
        }


        let options2 = {
            url: global.thingwaveServerIP,
            type: "get",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "getTagData": JSON.stringify({
                    "imageName": _imageName
                }),
                "execType": "getTagData",
                "category": "form"
            }
        };
        let _imageData = "";

        ajax(options2, function (data) {

            if (data.getTagData[0] == undefined || data == undefined || data.getTagData == undefined) {
                logError("There are no forms that match the request information you entered.");             //입력하신 요청 정보와 일치하는 폼이 없습니다.")
                resjson = {
                    "status": {
                        "statusMessage": "error",
                        "statusCode": "400"
                    },
                    "contents": {
                        "message": "There are no forms that match the request information you entered."     //입력하신 요청 정보와 일치하는 폼이 없습니다."
                    }
                }
                res.json(resjson)
                return;
            } else if (data.getTagData[0]['formJSON'].length == 0) {
                logError("There are no forms that match the request information you entered.");             //입력하신 요청 정보와 일치하는 폼이 없습니다.")
                resjson = {
                    "status": {
                        "statusMessage": "error",
                        "statusCode": "400"
                    },
                    "contents": {
                        "message": "There are no forms that match the request information you entered."     //입력하신 요청 정보와 일치하는 폼이 없습니다."
                    }

                }
                res.json(resjson)
                return;
            }


            _imageData = data.getTagData[0]['formJSON'];


            if (typeof _imageData === "string") {
                _imageData = JSON.parse(_imageData);
            }
            let _objData = _imageData[0].objdata;
            let _tagSize = _imageData[0].tagsize;
            let arr = []
            if (typeof data === 'object') {} else {
                //log(array);
            }

            if (typeof _imageData[0].objdata === "string") {
                _objData = JSON.parse(_objData);
                _tagSize = JSON.parse(_imageData[0].tagsize);
            } else {
                _objData = _objData;
                _tagSize = _imageData[0].tagsize;
            };
            for (let i = 0; i < _imageData.length; i++) {
                if (JSON.parse(_imageData[i].objdata).data.dataSetText != 'data_set_text') {
                    arr.push(JSON.parse(_imageData[i].objdata).data.dataSetText);

                }
            }

            resjson = {
                "status": {
                    "statusMessage": "success",
                    "statusCode": "200"
                },
                "jobGUID": _jobGUID,
                "thingid": _thingid,
                "pagenumber": _pagenumber,
                "contents": {
                    "dataKey": arr,
                }
            }
            res.json(resjson);

        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

    }, function (error) {
        alertPopUp('error', "<%=__('Error Occurred')%>");
        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
    });

}
const kanbanPublish = (parm, res) => { //deprciated : 전이사님 image process server로 기능 이관
    let _thingID;
    let _pagenumber;
    let _jobGUID;
    let _kanbanstatus;
    let _canvas;
    let _canvasRed;
    let _canvasCombined;
    let _canvasArr = [];
    let _textArr;
    let _culumnName;
    let _culumnArr;
    let _imageName;

    let options = {
        url: global.thingwaveServerIP,
        type: "get",
        headers: {
            'Content-Type': "application/json",
        },
        sendData: {
            "tagdata": {},
            "execType": "tagpublish",
            "category": "form"
        }
    };
    let convertData = {
        "insertData": {},
        "thingid": _thingID,
        "pagenumber": _pagenumber,
        "jobGUID": _jobGUID,
        "kanbanstatus": _kanbanstatus
    };



    logInfo("----- input data start -----");
    logInfo(parm);
    logInfo("----- input data end -----");




    if (parm.insertData == undefined) { //ECS용 하드코딩
        _thingID = parm.DATA.THINGID;
        _pagenumber = parm.DATA.PAGENO;


        convertData.insertData = parm.DATA;
        convertData.thingid = _thingID;
        convertData.pagenumber = _pagenumber;
        convertData.jobGUID = _jobGUID;
        convertData.kanbanstatus = _kanbanstatus;

        _textArr = convertData.insertData.TAGDATA;

    } else {
        _thingID = parm.insertData.thingid
        _pagenumber = parm.insertData.pagenumber

        _kanbanstatus = "";
        if (parm.insertData.status == 'inputrequest') {
            _kanbanstatus = "inputrequest";

        } else if (parm.insertData.status == 'input') {
            _kanbanstatus = "input";

        } else if (parm.insertData.status == 'outputrequest') {
            _kanbanstatus = "outputrequest";
        } else if (parm.insertData.status == 'output') {
            _kanbanstatus = "output";
        } else if (parm.insertData.status == 'unknown') {
            _kanbanstatus = "unknown";
        } else if (parm.insertData.status == 'preview') {
            _kanbanstatus = "preview";
        } else {
            _kanbanstatus = "normal"
        }
        _jobGUID = "";
        if (parm.insertData.jobGUID !== null || parm.insertData.jobGUID !== "") {
            _jobGUID = parm.insertData.jobGUID;
        }

        convertData.insertData = parm.insertData;
        convertData.thingid = _thingID;
        convertData.pagenumber = _pagenumber;
        convertData.jobGUID = _jobGUID;
        convertData.kanbanstatus = _kanbanstatus;
        _textArr = convertData.insertData.tagdata;

    }
    options.sendData.tagdata = convertData;
    resjson = {
        "status": {
            "statusMessage": "success",
            "statusCode": "200"
        },
        "jobGUID": _jobGUID
    }
    ajax(options, function (data) {
        if (data == undefined || data.tagpublish == undefined) {
            logError("There are no forms that match the request information you entered.");         //입력하신 정보와 일치하는 폼이 없습니다.");
            resjson = {
                "status": {
                    "statusMessage": "error",
                    "statusCode": "400"
                },
                "jobGUID": _jobGUID,
                "contents": "There are no forms that match the request information you entered."       //입력하신 정보와 일치하는 폼이 없습니다."

            }
            res.json(resjson)

            return;
        } else if (data.tagpublish.length == 0) {
            //alert("입력하신 요청 정보와 일치하는 폼이 없습니다.")
            logError("There are no forms that match the request information you entered.");         //입력하신 정보와 일치하는 폼이 없습니다.")
            resjson = {
                "status": {
                    "statusMessage": "error",
                    "statusCode": "400"
                },
                "jobGUID": _jobGUID,
                "contents": {
                    "message": "There are no forms that match the request information you entered."     //입력하신 정보와 일치하는 폼이 없습니다."
                }
            }
            res.json(resjson)
            return;
        }
        _culumnName = data.tagpublish[0]['culumnname'];
        _culumnArr = data.tagpublish[0]['culumnvalue'].split('_');
        _imageName = _culumnArr[1] + '_' + _culumnArr[2];
        if (parm.insertData.imageName != undefined && _culumnArr[0] != parm.insertData.imageName) {
            logError("The selected Form and Thing ID you entered do not match.");                       //선택한 Form과 입력한 Thing ID가 일치하지 않습니다.
            resjson = {
                "status": {
                    "statusMessage": "error",
                    "statusCode": "400"
                },
                "jobGUID": _jobGUID,
                "contents": {
                    "message": "The selected Form and Thing ID you entered do not match."              //선택한 Form과 입력한 Thing ID가 일치하지 않습니다."
                }
            }
            res.json(resjson)
            return;
        }


        let options2 = {
            url: global.thingwaveServerIP,
            type: "get",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "getTagData": JSON.stringify({
                    "imageName": _imageName
                }),
                "execType": "getTagData",
                "category": "form"
            }
        };
        let _imageData = "";

        ajax(options2, function (data) {
            if (data.getTagData[0] == undefined || data == undefined || data.getTagData == undefined) {
                logError("There are no forms that match the request information you entered.");             //입력하신 요청 정보와 일치하는 폼이 없습니다.")
                resjson = {
                    "status": {
                        "statusMessage": "error",
                        "statusCode": "400"
                    },
                    "jobGUID": _jobGUID,
                    "contents": {
                        "message": "There are no forms that match the request information you entered."     //입력하신 요청 정보와 일치하는 폼이 없습니다."
                    }
                }
                res.json(resjson)
                return;
            } else if (data.getTagData[0]['formJSON'].length == 0) {
                logError("There are no forms that match the request information you entered.");             //입력하신 요청 정보와 일치하는 폼이 없습니다.")
                resjson = {
                    "status": {
                        "statusMessage": "error",
                        "statusCode": "400"
                    },
                    "jobGUID": _jobGUID,
                    "contents": {
                        "message": "There are no forms that match the request information you entered."        //입력하신 요청 정보와 일치하는 폼이 없습니다."
                    }

                }
                res.json(resjson)
                return;
            }

            _imageData = data.getTagData[0]['formJSON'];


            if (typeof _imageData === "string") {
                _imageData = JSON.parse(_imageData);
            }
            let _objData = _imageData[0].objdata;
            let _tagSize = _imageData[0].tagsize;

            if (typeof data === 'object') {} else {
                //log(array);
            }

            if (typeof _imageData[0].objdata === "string") {
                _objData = JSON.parse(_objData);
                _tagSize = JSON.parse(_imageData[0].tagsize);
            } else {
                _objData = _objData;
                _tagSize = _imageData[0].tagsize;
            };

            if (_objData.data.width == 148 || _tagSize == 1) {
                _canvas = new fabric.Canvas(null, {
                    width: 296,
                    height: 128
                });
                _canvasRed = new fabric.Canvas(null, {
                    width: 296,
                    height: 128
                });
                _canvasCombined = new fabric.Canvas(null, {
                    width: 296,
                    height: 128
                });
                // redcanvas = createCanvas( 296, 128 );
                // canvas = createCanvas( 296, 128 );
                // _ctxBuffer = canvas.getContext('2d');
            } else if (_objData.data.width == 128 || _tagSize == 2) {
                _canvas = new fabric.Canvas(null, {
                    width: 128,
                    height: 296
                });
                canvasRed = new fabric.Canvas(null, {
                    width: 128,
                    height: 296
                });
                _canvasCombined = new fabric.Canvas(null, {
                    width: 296,
                    height: 128
                });

                // _ctxBuffer = canvas.getContext('2d');
            } else if (_objData.data.width == 400 || _tagSize == 3) {
                _canvas = new fabric.Canvas(null, {
                    width: 400,
                    height: 300
                });
                _canvasRed = new fabric.Canvas(null, {
                    width: 400,
                    height: 300
                });
                _canvasCombined = new fabric.Canvas(null, {
                    width: 400,
                    height: 300
                });
                // _ctxBuffer = canvas.getContext('2d');
            } else if (_objData.data.width == 300 || _tagSize == 4) {
                _canvas = new fabric.Canvas(null, {
                    width: 300,
                    height: 400
                });
                _canvasRed = new fabric.Canvas(null, {
                    width: 300,
                    height: 400
                });
                _canvasCombined = new fabric.Canvas(null, {
                    width: 300,
                    height: 400
                });

                // _ctxBuffer = canvas.getContext('2d');
            } else if (_objData.data.width == 800 || _tagSize == 5) {
                _canvas = new fabric.Canvas(null, {
                    width: 800,
                    height: 480
                });
                _canvasRed = new fabric.Canvas(null, {
                    width: 800,
                    height: 480
                });
                _canvasCombined = new fabric.Canvas(null, {
                    width: 800,
                    height: 480
                });

                // _ctxBuffer = canvas.getContext('2d');
            } else if (_objData.data.width == 480 || _tagSize == 6) {
                _canvas = new fabric.Canvas(null, {
                    width: 480,
                    height: 800
                });
                _canvasRed = new fabric.Canvas(null, {
                    width: 480,
                    height: 800
                });
                _canvasCombined = new fabric.Canvas(null, {
                    width: 480,
                    height: 800
                });

                // _ctxBuffer = canvas.getContext('2d');
            } else {
                _canvas = new fabric.Canvas(null, {
                    width: _objData.data.width,
                    height: _objData.data.height
                });
                _canvasRed = new fabric.Canvas(null, {
                    width: _objData.data.width,
                    height: _objData.data.height
                });
                _canvasCombined = new fabric.Canvas(null, {
                    width: _objData.data.width,
                    height: _objData.data.height
                });

                // _ctxBuffer = canvas.getContext('2d');
            }
            // _ctxBuffer.fillStyle = "rgba(255,255,255,1.0)";
            // _ctxBuffer.fillRect(0, 0, canvas.width, canvas.height);

            _canvas.backgroundColor = "white";
            _canvasRed.backgroundColor = "white";
            _canvasCombined.backgroundColor = "white";

            for (let i = 0; i < _imageData.length; i++) {
                let jsonDataRaw;
                if (typeof _imageData[i].objdata === "string") {

                    _imageData[i].objdata = JSON.parse(_imageData[i].objdata);

                } else {
                    // _imageData[i].objdata = _imageData[i].objdata;
                };
                // log(jsonDataRaw.data.dataSetText);

                if (_imageData[i].objdata.type === 4) {
                    let changeValue = textArr[_imageData[i].objdata.data.text];
                    _imageData[i].objdata.data.text = changeValue;
                } else if (_imageData[i].objdata.type === 1) {
                    if (_imageData[i].objdata.data.textType == 'rectdatadirect') {

                    } else if (_imageData[i].objdata.data.textType == 'rectdatadataset') {
                        if (/Barcode/.test(_imageData[i].objdata.data.dataSetText)) {
                            _imageData[i].objdata.data.dataSetText = _textArr[_imageData[i].objdata.data.dataSetText] + "$Barcode";
                        } else if (/QRcode/.test(_imageData[i].objdata.data.dataSetText)) {
                            _imageData[i].objdata.data.dataSetText = _textArr[_imageData[i].objdata.data.dataSetText] + "$QRcode";
                        } else if (/image/.test(_imageData[i].objdata.data.dataSetText)) {
                            _imageData[i].objdata.data.dataSetText = _textArr[_imageData[i].objdata.data.dataSetText] + "$image";
                        } else {
                            _imageData[i].objdata.data.dataSetText = _textArr[_imageData[i].objdata.data.dataSetText] + "$dataset";
                        }
                    }
                };
                _canvasArr.push(_canvas)
                _canvasArr.push(_canvasRed)
                _canvasArr.push(_canvasCombined)
                drawObject(_imageData[i], _canvasArr);
            }
            if (_tagSize == 1) {
                let canvasCenter = new fabric.Point(_canvas.getWidth() / 2, _canvas.getHeight() / 2) // center of canvas
                let radians = fabric.util.degreesToRadians(180)
                _canvas.getObjects().forEach((obj) => {
                    let objectOrigin = new fabric.Point(obj.left, obj.top)
                    let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter, radians)
                    obj.top = new_loc.y
                    obj.left = new_loc.x
                    obj.angle += 180 //rotate each object by the same angle
                    obj.setCoords()
                    // canvas.renderAll();
                });

                let canvasCenter2 = new fabric.Point(_canvasRed.getWidth() / 2, _canvasRed.getHeight() / 2) // center of canvas
                let radians2 = fabric.util.degreesToRadians(180)
                _canvasRed.getObjects().forEach((obj) => {
                    let objectOrigin = new fabric.Point(obj.left, obj.top)
                    let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter2, radians2)
                    obj.top = new_loc.y
                    obj.left = new_loc.x
                    obj.angle += 180 //rotate each object by the same angle
                    obj.setCoords();
                    // canvasRed.renderAll();
                });
                // let canvasCenter3 = new fabric.Point(canvasCombined.getWidth() / 2, canvasCombined.getHeight() / 2) // center of canvas
                // let radians3 = fabric.util.degreesToRadians(180)
                // canvasCombined.getObjects().forEach((obj) => {
                //     let objectOrigin = new fabric.Point(obj.left, obj.top)
                //     let new_loc = fabric.util.rotatePoint(objectOrigin, canvasCenter3, radians3)
                //     obj.top = new_loc.y
                //     obj.left = new_loc.x
                //     obj.angle += 180 //rotate each object by the same angle
                //     obj.setCoords();
                //     // canvasCombined.renderAll();
                // });





            }
            // res.json(resjson)

            _canvasCombined.renderAll();

            setTimeout(() => {
                let base64Image = _canvasCombined.toDataURL();

                if (_kanbanstatus == "preview") {
                    resjson = {
                        "status": {
                            "statusMessage": "success",
                            "statusCode": "200"
                        },
                        "jobGUID": _jobGUID,
                        "contents": {
                            "base64": base64Image,
                        }
                    }
                    res.json(resjson);
                    return;
                } else {
                    DownloadCanvasAsImage("white", res, convertData, _canvas, _canvasCombined); //thingwave 서버에 저장  -- thingwave에서 tago분리 완료되면 불필요
                    setTimeout(() => {
                        DownloadCanvasAsImage("red", res, convertData, _canvasRed, _canvasCombined);
                        let _dirname = "resource/finaltagimage";
                        logInfo(_dirname + '/' + convertData.thingid + '_' + convertData.pagenumber + '.png');
                        const out = fs.createWriteStream(_dirname + '/' + convertData.thingid + '_' + convertData.pagenumber + '.png');
                        const out2 = fs.createWriteStream(_dirname + '/' + convertData.thingid + '_' + convertData.pagenumber + 'b.png');

                        const stream = _canvas.createPNGStream(); //tag server에 저장 (recent tag image 조회)
                        const stream2 = _canvasRed.createPNGStream();
                        stream.pipe(out);
                        stream2.pipe(out2);
                        out.on('finish', () => {
                            logInfo("success : Tag have been saved on server.")
                        })
                        out.on('error', function (err) {
                            logError("Tag NOT saved on server.")

                        });

                    }, 100);
                    // DownloadCanvasAsImage("white",res,function(){
                    //     DownloadCanvasAsImage("red",res);
                    // });

                }
            }, 500);

        }.bind(this), function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        })


        let info = parm
        // log(info);

    }, function (error) {
        alertPopUp('error', "<%=__('Error Occurred')%>");
        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
    });
}
const DownloadCanvasAsImage = (color, res, convertData, canvas, canvasCombined) => {
    let tagtype = "";
    if (color == 'white') {

    } else if (color == "red") {
        tagtype = 'b';
    }
    let targetCanvas = canvas;
    targetCanvas.renderAll();

    let dataUrlForServerSave = targetCanvas.toDataURL({
        format: 'png',
        pixelRatio: 2
    }).replace(/^data:([A-Za-z-+/]+);base64,/, '');



    let extension = 'png'
    let options = {
        url: global.thingwaveServerIP,
        type: "post",
        headers: {
            'Content-Type': "application/json",
        },
        sendData: {
            "insertData": {
                "formname": "",
                "imagebase64": "",
                "imagename": "",
                "canvasdata": [],
                "imgextension": extension,
            },
            "formdataforLog": {},
            "execType": "finaltaginsert",
            "category": "form",
        }
    };
    let sedingObject;
    sedingObject = options.sendData.insertData;

    sedingObject.formname = convertData.thingid + "_" + convertData.pagenumber + tagtype;
    sedingObject.imagebase64 = dataUrlForServerSave

    let temp = {};
    let temparray = [];
    temparray.push(convertData.insertData.tagdata)

    for (let i in temparray) {
        let key = i;
        temp[key] = temparray[i];
    }

    options.sendData.formdataforLog = temp;
    // options.sendData = JSON.stringify(options.sendData);
    // console.log(dataUrlForServerSave)



    ajax(options, function () {
        let options = {
            url: global.ultraServerIP + convertData.thingid + "/epd_update",
            type: 'post',
            headers: {
                'Content-Type': "application/json;ty=4",
                'Accept': "application/json",
                'X-M2M-RI': 'Thing_Wave1',
                'X-M2M-RSC': '',
                'X-M2M-Origin': 'S' + convertData.thingid,
                'X2MORIGIN': 'S' + convertData.thingid,
            },
            sendData: {
                "m2m:cin": {
                    "rn": Math.random() * 10000,
                    "dt": 1,
                    "con": {
                        "page_number": convertData.pagenumber,
                        "status": convertData.kanbanstatus
                    },
                }
            }
        }

        let topic = "/" + convertData.thingid + "/Ultra/epd_update"
        let body = {
            "m2m:cin": {
                "rn": Math.random() * 10000,
                "dt": 1,
                "con": {
                    "page_number": convertData.pagenumber,
                    "status": convertData.kanbanstatus
                },
            }
        }
        const mqttoption = {
            host: global.config.mqttIpAddress,
            port: 1883,
        };
        mqttClient = mqtt.connect(mqttoption);
        if (color == 'white' && extension == 'png') {
            ajax(options, function (data) {
                let base64Image = canvasCombined.toDataURL();
                mqttClient.publish(topic, JSON.stringify(body), {
                    retain: false,
                    qos: 0
                });
                logInfo("MQTT Pub Topic : " + topic);
                logInfo("MQTT Pub body : " + JSON.stringify(body));
                mqttClient.end();

                resjson = {
                    "status": {
                        "statusMessage": "success",
                        "statusCode": "200"
                    },
                    "jobGUID": convertData.jobGUID,
                    "contents": {
                        "base64": base64Image,
                        "message": "MQTT Published successfully"
                    }
                }
                res.json(resjson)
            }, function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });
        }
    }, function (error) {
        alertPopUp('error', "<%=__('Error Occurred')%>");
        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
    });
}
const saveBase64File = (parm, res) => {
    let imageName = parm.imageName;
    let base64 = parm.base64.replace("data:image/png;base64,", "");

    let _dirname = "resource/tagBackground";

    fs.writeFile(_dirname + '/' + imageName, base64, 'base64', function (err) {
        console.error(err);
    });


    // const out = fs.createWriteStream(_dirname + '/' + imageName + '.png');

    // const stream = _canvas.createPNGStream();                    //tag server에 저장 (recent tag image 조회)
    // stream.pipe(out);
    // out.on('finish', () => {
    //     logInfo("success : Tag have been saved on server.")
    // })
    // out.on('error', function(err) {
    //     logError("Tag NOT saved on server.")
    // })
    res.send();

}
const readBase64File = () => {
    let imageName = parm.imageName;
    let _dirname = "resource/tagBackground";
    fs.readFile(_dirname + '/' + imageName + '.png', {
        encoding: 'base64'
    }, function (err, data) {

    })

}

const sendkw = (parm,res) => {
    let options = {
        url: "https://api.kakaowork.com/v1/messages.send",
        type: "post",
        headers: {
            'Content-Type': "application/json",
            "Authorization": "Bearer 75e89e9e.4aebde96c2bd42b989b1f0446851dd3c"
        },
        sendData: {
            "conversation_id": "2940060",
            "text": "CV Alarms",                //CV 알람"
            "blocks": [
                {
                    "type": "header",
                    "text": "CV Alarms",        //CV 알람
                    "style": "blue"
                },
                {
                    "type": "text",
                    "text": "text sampadfle",
                    "inlines": [
                      {
                        "type": "styled",
                        "text": "equipment name :"+parm["equipment name"],  //장비명 : "+parm["장비명"],
                        "bold": true
                      }
                    ]
                },
                {
                    "type": "text",
                    "text": "text sampadfle",
                    "inlines": [
                      {
                        "type": "styled",
                        "text": "CV value generated: " + parm["CV"], // 발생한 CV 값 : "+parm["CV"],
                        "bold": true
                      }
                    ]
                }
            ]
        }
    };

    ajax(options, function (data) {
        // console.log(data);
        res.end();

    }, function (error) {
        alertPopUp('error', "<%=__('Error Occurred')%>");
        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
    });
}
var kanban = {
    kanbanpublish: (parm, res) => {
        kanbanPublish(parm, res);
    },
    kanbanrecentimage: (parm, res) => {
        getRecentImage(parm, res);
    },
    kanbanrecentdata: (parm, res) => {
        getRecentData(parm, res);
    },
    kabanimglist: (parm, res) => {
        getImgList(parm, res);
    },
    gettagkey: (parm, res) => {
        getTagKey(parm, res)
    },
    saveBase64File: (parm, res) => {
        saveBase64File(parm, res)
    },
    mqttConnect: () => {
        mqttConnect();
    },
    sendkw: (parm,res) => {
        sendkw(parm,res);
    }

};

module.exports = kanban;
