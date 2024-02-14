//const { data } = require("jquery");

$(document).ready(function () {

       
    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("tag-editor-front-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    let fabricCanvas;
    let undoRedoConfig = {
        canvasState: [],
        currentStateIndex: -1,
        undoStatus: false,
        redoStatus: false,
        undoFinishedStatus: 1,
        redoFinishedStatus: 1,
        undoButton: document.getElementById('undo'),
        redoButton: document.getElementById('redo'),
    };
    let imageInputBase64;
    let startX, startY;
    let selectedDrawObject;
    let latestObject;
    let selectedShape;
    let selectedLocaion;
    let tree;
    let compListnameRedo = "";
    let compListnameUndo = "";
    let jsonForImageDrawingServer = [];

    /*
    var canvas = document.querySelector('canvas');

    if(document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas) {
          console.log('The pointer lock status is now locked');
      } else {
          console.log('The pointer lock status is now unlocked');
      }
      
      canvas.onclick = function() {
        canvas.requestPointerLock();
      }
      */


    const loadFont = () => {
        let options = {
            url:  "<%=global.config.apiServerUrl%>/tag-editor/font-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                // fontUrl:url
            }
        };
        ajax(options, function (data) {

            let fontList = data.data.fontList;

            for (let i = 0; i < fontList.length; i++) {
                let select = document.getElementById("fontName");

                let option = document.createElement('option');
                option.innerHTML = data.data.fontList[i].font_name;
                option.value = data.data.fontList[i].font_url;
                select.appendChild(option);
            }
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    const fontCallback = (fontFamilyName, url) => {
        let select = document.getElementById("fontName");

        let option = document.createElement('option');
        option.innerHTML = fontFamilyName;
        option.value = fontFamilyName;
        select.appendChild(option);

        let options = {
            url:  "<%=global.config.apiServerUrl%>/tag-editor/register-font",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                fontUrl: url,
                fontName: fontFamilyName
            }
        };
        ajax(options, function (data) {

            alertPopUp("success", "< " + fontFamilyName + " > <%=__('Font registration complete')%>");         //폰트 등록 완료");


        } , function (error) {
            alertPopUp("error", "<%=__('Font registration failed')%>");                    //폰트 등록 실패");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
        
        

    }

    const registerFont = (url) => {
        let fontFamilyName = url.split("family=")[1].split("&")[0];
        var head = document.getElementsByTagName('head')[0];
        var cssnode = document.createElement('link');

        cssnode.type = 'text/css';
        cssnode.rel = 'stylesheet';
        cssnode.href = url;

        // cssnode.onreadystatechange = fontCallback(fontFamilyName,url);
        cssnode.onload = fontCallback(fontFamilyName, url);
        head.appendChild(cssnode);
    }

    const changeFreeDrawingToBlack = () => {
        for (let i = 0; i < fabricCanvas.freeDrawingBrush.canvas._objects.length; i++) {
            fabricCanvas.freeDrawingBrush.canvas._objects[i].set({
                stroke: "black"
            })
        }
        fabricCanvas.renderAll();
    }
    const updateTextSize = (textbox) => {
        let lastHeight;
        const controlPoint = textbox.__corner;
        if (controlPoint && controlPoint != "mr" && controlPoint != "ml") {
            lastHeight = textbox.height * textbox.scaleY;
        }

        textbox.set({
            height: lastHeight || textbox.height,
            scaleY: 1
        });

        fabricCanvas.renderAll();
    }
    const drawFabricDataBox = (startX, startY) => {
        let rect = new fabric.Rect({
            stroke: 'transparent',
            strokeWidth: 1,
            fill: 'transparent',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            selectable: true,
        });

        let data = new fabric.Textbox("$key", {
            fill: "black",
            fontSize: 20,
            fontFamily: "MapoPeacefull",
            editable: true,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
            verticalAlign: "middle",
            isDataBox: true,
            splitByGrapheme: false
        });

        let group = new fabric.Group([rect, data], {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            selectable: true,
            borderColor: "red",
        });


        fabricCanvas.add(group)
        fabricCanvas.requestRenderAll();
        fabricCanvas.on('text:changed', function (e) {
            if (fabricCanvas.getActiveObject()._ojects[1].text.charAt(0) != "$") {
                if (fabricCanvas.getActiveObject()._ojects[1].text == "") {
                    fabricCanvas.getActiveObject()._ojects[1].set({
                        text: fabricCanvas.getActiveObject()._ojects[1].text
                    })
                } else {
                    fabricCanvas.getActiveObject()._ojects[1].set({
                        text: "$" + fabricCanvas.getActiveObject()._ojects[1].text
                    })
                }
            }
            fabricCanvas.renderAll();
        });




    }
    const drawFabricTextBox = (startX, startY) => {
        let rect = new fabric.Rect({
            stroke: 'transparent',
            strokeWidth: 1,
            fill: 'transparent',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            selectable: true,


        });
        let text = new fabric.Textbox("text", {
            fill: "black",
            fontSize: 20,
            fontFamily: "MapoPeacefull",
            editable: true,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
            verticalAlign: "middle",
        });



        let group = new fabric.Group([rect, text], {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            selectable: true,
            borderColor: "red"
        });

        fabricCanvas.add(group)
        fabricCanvas.requestRenderAll();
    }


    const drawFabricTriangle = (startX, startY) => {
        let triangle = new fabric.Triangle({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'black',
            stroke: 'black',
            strokeWidth: 1,
            borderColor: 'red',
            angle: 0,
        });

        // Render the triangle in canvas
        fabricCanvas.add(triangle);
        fabricCanvas.renderAll();
    }
    const drawFabricLine = (startX, startY, tox, toy) => {

        let line = new fabric.Line([startX, startY, tox, toy], {
            stroke: 'black',
            strokeWidth: 3,
            borderColor: "red"
        });

        // Render the rectangle in canvas
        fabricCanvas.add(line);

    }
    const drawFabricArrow = (startX, startY, tox, toy) => {
        let _this = this;

        // Extended fabric line class
        
        let pointss = [startX, startY, tox, toy];
        let line = new fabric.LineArrow(pointss, {
            fill: 'white',
            stroke: 'black',
            opacity: 1,
            strokeWidth: 2,
            originX: 'left',
            originY: 'top',
            selectable: true,
            borderColor: 'red',
        });

        fabricCanvas.add(line).setActiveObject(line);

        var Arrow = (function () {
            function Arrow(canvas) {
                this.canvas = canvas;
                this.className = 'Arrow';
                this.isDrawing = false;
            }

            return Arrow;
        }());
        var arrow = new Arrow(fabricCanvas);

    }
    const drawFabricImage = (base64) => {
        let imageElement = document.createElement('img');
        //elvis
        imageElement.width = document.getElementById("canvasWidth").value;
        imageElement.height = document.getElementById("canvasHeight").value;
        imageElement.src = base64;
        let fImage = new fabric.Image(imageElement);

        //elvis
        //alert(document.getElementById("canvasWidth").value + "*" + document.getElementById("canvasHeight").value);

        /*let group = new fabric.Group([], {
            left: fabricCanvas.width / 2,
            top: fabricCanvas.height / 2,
            width: 296,
            height: 128,
            selectable: true,
            borderColor: "red"
        });
        fabric.Image.fromURL(base64, (img) => {
            let bounds = group.getBoundingRect();
            const scaleFactor = Math.max(bounds.width / img.width, bounds.height / img.height);
            img.set({
                originX: 'center',
                originY: 'center',
                scaleX: scaleFactor,
                scaleY: scaleFactor,
                left: 0 + fabricCanvas.width / 2,
                top: 0 + fabricCanvas.height / 2,
            });
            group.addWithUpdate(img);
            fabricCanvas.renderAll();
        })*/
        let group = new fabric.Group([], {
            left: fabricCanvas.width / 2,
            top: fabricCanvas.height / 2,
            width: imageElement.width,
            height: imageElement.height,
            selectable: true,
            borderColor: "red"
        });
        fabric.Image.fromURL(base64, (img) => {
            let bounds = group.getBoundingRect();
            group.addWithUpdate(img);
            fabricCanvas.renderAll();
        })
        fabricCanvas.add(group)
        fabricCanvas.requestRenderAll();

    }
    const drawFabricCircle = () => {
        let circle = new fabric.Circle({
            left: startX,
            top: startY,
            radius: 0,
            fill: '',
            stroke: 'black',
            strokeWidth: 1,
            borderColor: 'red',

        });
        fabricCanvas.add(circle);
    }

    const preventTextResize = (text) => {
        if (fabricCanvas.getActiveObject() == undefined) {
            return;
        } else {
            try {
                text.set({
                    scaleY: "1",
                    fontSize: text.fontSize
                })
                fabricCanvas.renderAll();
            } catch (error) {
                console.log(error)
            }

        }
    }

    const drawFabricRect = () => {
        let rect = new fabric.Rect({
            stroke: 'transparent',
            strokeWidth: 1,
            fill: 'transparent',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            selectable: true,
        });

        let text = new fabric.Textbox("text", {
            fill: "black",
            fontSize: 20,
            fontFamily: "MapoPeacefull",
            editable: true,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
            verticalAlign: "middle"
        });

        let group = new fabric.Group([rect, text], {
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            selectable: true,
            borderColor: "red"
        });

        fabricCanvas.add(group)
        fabricCanvas.requestRenderAll();

        group.set('selectable', true);
        // group.on('mousedblclick', () => {
        //     // textForEditing is temporary obj, 
        //     // and will be removed after editing
        //     console.log(text.left)
        //     let textForEditing = new fabric.Textbox(text.text, {
        //         originX: text.originX,
        //         originY: text.originY,
        //         textAlign: text.textAlign,
        //         fontSize: text.fontSize,
        //         left: group.left + group.width / 2 - text.width / 2,
        //         top: group.top + group.height / 2 - text.height / 2
        //     })

        //     // hide group inside text
        //     text.visible = false;
        //     // note important, text cannot be hidden without this
        //     group.addWithUpdate();

        //     textForEditing.visible = true;
        //     // do not give controls, do not allow move/resize/rotation on this 
        //     textForEditing.hasConstrols = false;


        //     // now add this temporary obj to canvas
        //     fabricCanvas.add(textForEditing);
        //     fabricCanvas.setActiveObject(textForEditing);
        //     // make the cursor showing
        //     textForEditing.enterEditing();
        //     textForEditing.selectAll();
        //     // let count = 0;
        //     // let overTextInit;
        //     // textForEditing.on('changed', () => {
        //     //     if(textForEditing.width >= group.width){
        //     //         count++;
        //     //         if(count===1){
        //     //             overTextInit = textForEditing.text.slice(0,-1);

        //     //         }
        //     //         textForEditing.text = overTextInit;
        //     //         textForEditing.set({
        //     //             width:group.width
        //     //         })
        //     //         console.log("1")

        //     //         console.log(textForEditing.text.slice(0, -1))


        //     //     }
        //     //     else{
        //     //         textForEditing.set({
        //     //             width:textForEditing.fontSize
        //     //         })
        //     //     }

        //     // })
        //     // editing:exited means you click outside of the textForEditing
        //     textForEditing.on('editing:exited', () => {
        //         console.log("edit")
        //         let newVal = textForEditing.text;
        //         let oldVal = text.text;

        //         // then we check if text is changed
        //         text.set({
        //             text: newVal,
        //             visible: true,
        //             textAlign: text.textAlign,
        //             fontSize: text.fontSize,
        //             left: text.left,
        //             top: text.top,
        //         })

        //         // comment before, you must call this
        //         group.addWithUpdate();

        //         // we do not need textForEditing anymore
        //         textForEditing.visible = false;
        //         fabricCanvas.remove(textForEditing);

        //         // optional, buf for better user experience
        //         fabricCanvas.setActiveObject(group);

        //     })

        // })



    }
    const updateCanvasState = () => { // save state for undo or redo
        if ((undoRedoConfig.undoStatus == false && undoRedoConfig.redoStatus == false)) {
            let jsonData = fabricCanvas.toJSON();
            let canvasAsJson = JSON.stringify(jsonData);
            if (undoRedoConfig.currentStateIndex < undoRedoConfig.canvasState.length - 1) {
                let indexToBeInserted = undoRedoConfig.currentStateIndex + 1;
                undoRedoConfig.canvasState[indexToBeInserted] = canvasAsJson;
                let numberOfElementsToRetain = indexToBeInserted + 1;
                undoRedoConfig.canvasState = undoRedoConfig.canvasState.splice(0, numberOfElementsToRetain);
            } else {
                undoRedoConfig.canvasState.push(canvasAsJson);
            }
            undoRedoConfig.currentStateIndex = undoRedoConfig.canvasState.length - 1;
            if ((undoRedoConfig.currentStateIndex == undoRedoConfig.canvasState.length - 1) && undoRedoConfig.currentStateIndex != -1) {
                undoRedoConfig.redoButton.disabled = "disabled";
            }
        }
    }
    const addComponent = (shape) => { // add componentlist to left sidebar
        // compListnameUndo = $('#componentList').html();
        shape = shape.replace(" ", "");
        let dynamicHtml = "";
        dynamicHtml += "<li contentEditable='true' class='nav-link' name='compListname' id='" + shape + "' style='cursor:pointer;border:2px solid black;border-radius:0px;border-left:0px;border-right:0px;border-top:0px;'align='left'>";
        dynamicHtml += " <span name='descname' style='font-size:15px'><b>" + shape + "</b></span>";
        dynamicHtml += "</li>";
        componentList.innerHTML += dynamicHtml;

        let compListname = document.getElementsByName('compListname');
        //console.log(">>>addComponent " + shape);  // for debug by jylee 
       
        for (let i = 0; i < compListname.length; i++) {
            compListname[i].addEventListener('click', (e) => {
                fabricCanvas.setActiveObject(fabricCanvas.item(i));
                fabricCanvas.renderAll();
                document.getElementById("rectsetupBody").classList.remove("d-none");
               
                rightEditorUpdate();

                for (let i = 0; i < compListname.length; i++) {
                    compListname[i].style.backgroundColor = "white";
                    compListname[i].style.color = "black";

                }
                e.currentTarget.style.backgroundColor = "#679897";
                e.currentTarget.style.color = "white";

                if (fabricCanvas.getActiveObject() != null) {
                    // if(fabricCanvas.getActiveObject().type == "textbox"){
                    //     document.getElementById('backGroundStyleUl').classList.add("d-none");

                    //     if(fabricCanvas.getActiveObject().text.charAt(0) == "$"){
                    //         document.getElementById('data-box-option').classList.remove("d-none");
                    //         getSelectedDataGroup();
                    //     }
                    //     else{
                    //         document.getElementById('data-box-option').classList.add("d-none");
                    //     }
                    //     document.getElementById('line-group').classList.add("d-none");
                    //     document.getElementById('textStyleUl').classList.remove("d-none");


                    // }
                    // else{
                    if (fabricCanvas.getActiveObject().type == "lineArrow" || fabricCanvas.getActiveObject().type == "line") {
                        document.getElementById('line-group').classList.remove("d-none");
                        document.getElementById('backGroundStyleUl').classList.add("d-none");
                        document.getElementById('textStyleUl').classList.add("d-none");
                        document.getElementById('data-box-option').classList.add("d-none");
                        document.getElementById('componentListclass').classList.remove("d-none");;

                    } else if (fabricCanvas.getActiveObject().type == "group") {
                        document.getElementById('line-group').classList.add("d-none");
                        document.getElementById('backGroundStyleUl').classList.remove("d-none");
                        document.getElementById('textStyleUl').classList.remove("d-none");
                        if (fabricCanvas.getActiveObject()._objects[1] == undefined) {
                            return;
                        } else if (fabricCanvas.getActiveObject()._objects[1].isDataBox == true) {
                            document.getElementById('data-box-option').classList.remove("d-none");
                            document.getElementById('componentListclass').classList.add("d-none");;
                            getSelectedDataGroup();

                        } else {
                            document.getElementById('data-box-option').classList.add("d-none");
                            document.getElementById('componentListclass').classList.remove("d-none");;


                        }

                    } else {
                        document.getElementById('line-group').classList.add("d-none");
                        document.getElementById('backGroundStyleUl').classList.remove("d-none");
                        document.getElementById('textStyleUl').classList.add("d-none");
                        document.getElementById('data-box-option').classList.add("d-none");
                        document.getElementById('componentListclass').classList.remove("d-none");;


                    }
                    // }
                }

                document.getElementById('rectOutLineN').disabled = true;
            })
        }
        // compListnameRedo = $('#componentList').html();
    }

    const dragDraw = (shape) => { // draw shapes using drag
        let _this = this;
        selectedShape = shape;
        const checkbox = document.querySelector('#checkbox')
        checkbox.checked = true;
        let initialPos, bounds, rect;
        let freeDrawing = checkbox.checked
        let dragging;

        const options = {
            drawRect: drawRect.checked,
            onlyOne: onlyOne.checked,
            rectProps: {
                stroke: 'red',
                strokeWidth: 1,
                fill: ''
            }
        }

        function onMouseDown(e) {
            fabricCanvas.defaultCursor = 'crosshair';
            fabricCanvas.setCursor("crosshair");
            document.body.style.cursor = "crosshair";

            

            let pointer = fabricCanvas.getPointer(event.e);
            dragging = true;
            if (!freeDrawing) {
                return
            }
            initialPos = {
                ...e.pointer
            }
            bounds = {}
            if (options.drawRect) {

                if (shape !== selectedDrawObject.replace("Input", "")) {
                    return;
                }
                startX = pointer.x;
                startY = pointer.y;
                switch (shape) {
                    case "rect":
                        drawFabricRect();
                        break;
                    case "arrow":
                        drawFabricArrow(startX, startY, startX, startY);
                        break;
                    case "image":
                        drawFabricImage(imageInputBase64);
                        break;
                    case "circle":
                        drawFabricCircle();
                        break;
                    case "line":
                        drawFabricLine(startX, startY, startX, startY);
                        break;
                    case "triangle":
                        drawFabricTriangle(startX, startY);
                        break;
                    case "textBox":
                        drawFabricTextBox(startX, startY);
                        break;
                    case "dataBox":
                        drawFabricDataBox(startX, startY);
                        break;
                }
                //console.log("Mouse Down -> addComponent");  //by jylee 
                addComponent(shape);

            }
            latestObject = fabricCanvas._objects[fabricCanvas._objects.length - 1]

        }

        function update(e) {
            fabricCanvas.defaultCursor = 'crosshair';

            let pointer = e.pointer;

            if (initialPos.x > pointer.x) {
                bounds.x = Math.max(0, pointer.x)
                bounds.width = initialPos.x - bounds.x
            } else {
                bounds.x = initialPos.x
                bounds.width = pointer.x - initialPos.x
            }
            if (initialPos.y > pointer.y) {
                bounds.y = Math.max(0, pointer.y)
                bounds.height = initialPos.y - bounds.y
            } else {
                bounds.height = pointer.y - initialPos.y
                bounds.y = initialPos.y
            }
            if (options.drawRect) {
                if (selectedShape != shape) {
                    return;
                }
                switch (shape) {
                    case "rect":
                        latestObject.set({
                            left: bounds.x,
                            top: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true
                        })
                        latestObject._objects[0].set({
                            top: 0 - bounds.height * 0.5,
                            left: 0 - bounds.width * 0.5,
                            stroke: "black",
                            fill: 'transparent',
                            width: bounds.width,
                            height: bounds.height,
                            opacity: 1,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true,
                        });
                        latestObject._objects[1].set({
                            width: bounds.width,
                            height: bounds.height,
                            textAlign: "center"
                        });
                        break;

                    case "textBox":
                        latestObject.set({
                            left: bounds.x,
                            top: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true
                        })
                        latestObject._objects[0].set({
                            top: 0 - bounds.height * 0.5,
                            left: 0 - bounds.width * 0.5,
                            stroke: "transparent",
                            fill: 'transparent',
                            width: bounds.width,
                            height: bounds.height,
                            opacity: 1,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true,
                        });
                        latestObject._objects[1].set({
                            width: bounds.width,
                            height: bounds.height,
                            textAlign: "center"
                        });
                        break;
                    case "arrow":
                        var activeObj = fabricCanvas.getActiveObject();
                        activeObj.set({
                            x2: pointer.x,
                            y2: pointer.y
                        });
                        activeObj.setCoords();
                        fabricCanvas.renderAll();


                        // tox = pointer.x;
                        // toy = pointer.y;
                        // let angle = Math.atan2(toy - startY, tox - startX);
                        // let headlen = 15;  // arrow head size
                        // // bring the line end back some to account for arrow head.
                        // tox = tox - (headlen) * Math.cos(angle);
                        // toy = toy - (headlen) * Math.sin(angle);
                        // // calculate the points.
                        // let points = [
                        //     {
                        //         x: startX,  // start point
                        //         y: startY
                        //     }, {
                        //         x: startX - (headlen / 4) * Math.cos(angle - Math.PI / 2),
                        //         y: startY - (headlen / 4) * Math.sin(angle - Math.PI / 2)
                        //     }, {
                        //         x: tox - (headlen / 4) * Math.cos(angle - Math.PI / 2),
                        //         y: toy - (headlen / 4) * Math.sin(angle - Math.PI / 2)
                        //     }, {
                        //         x: tox - (headlen) * Math.cos(angle - Math.PI / 2),
                        //         y: toy - (headlen) * Math.sin(angle - Math.PI / 2)
                        //     }, {
                        //         x: tox + (headlen) * Math.cos(angle),  // tip
                        //         y: toy + (headlen) * Math.sin(angle)
                        //     }, {
                        //         x: tox - (headlen) * Math.cos(angle + Math.PI / 2),
                        //         y: toy - (headlen) * Math.sin(angle + Math.PI / 2)
                        //     }, {
                        //         x: tox - (headlen / 4) * Math.cos(angle + Math.PI / 2),
                        //         y: toy - (headlen / 4) * Math.sin(angle + Math.PI / 2)
                        //     }, {
                        //         x: startX - (headlen / 4) * Math.cos(angle + Math.PI / 2),
                        //         y: startY - (headlen / 4) * Math.sin(angle + Math.PI / 2)
                        //     }, {
                        //         x: startX,
                        //         y: startY
                        //     }
                        // ];

                        // latestObject = fabricCanvas._objects[fabricCanvas._objects.length - 1]
                        // fabricCanvas.setActiveObject(latestObject);
                        // fabricCanvas.remove(fabricCanvas.getActiveObject());

                        // let pline = new fabric.Polyline(points, {
                        //     fill: 'white',
                        //     stroke: 'black',
                        //     opacity: 1,
                        //     strokeWidth: 2,
                        //     originX: 'left',
                        //     originY: 'top',
                        //     selectable: true,
                        //     borderColor: 'red',

                        // });
                        // fabricCanvas.setActiveObject(pline)
                        // fabricCanvas.add(pline);
                        break;

                    case "image":
                        latestObject.set({
                            left: bounds.x,
                            top: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true
                        })
                        latestObject._objects[0].set({
                            top: 0 - bounds.height * 0.5,
                            left: 0 - bounds.width * 0.5,
                            stroke: "black",
                            fill: 'transparent',
                            width: bounds.width,
                            height: bounds.height,
                            opacity: 1,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true
                        });

                        break;

                    case "circle":
                        let circle = latestObject;

                        let radius = Math.max(Math.abs(startY - pointer.y), Math.abs(startX - pointer.x)) / 2;
                        if (radius > circle.strokeWidth) {
                            radius -= circle.strokeWidth / 2;
                        }
                        circle.set({
                            radius: radius
                        });

                        if (startX > pointer.x) {
                            circle.set({
                                originX: 'right'
                            });
                        } else {
                            circle.set({
                                originX: 'left'
                            });
                        }
                        if (startY > pointer.y) {
                            circle.set({
                                originY: 'bottom'
                            });
                        } else {
                            circle.set({
                                originY: 'top'
                            });
                        }
                        break;

                    case "line":
                        let line = latestObject;
                        line.set({
                            x2: pointer.x,
                            y2: pointer.y
                        })
                        break;
                    case "triangle":

                        latestObject.set({
                            width: bounds.width,
                            height: bounds.height,

                        })
                        break;
                    case "dataBox":
                        latestObject.set({
                            left: bounds.x,
                            top: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true
                        })
                        latestObject._objects[0].set({
                            top: 0 - bounds.height * 0.5,
                            left: 0 - bounds.width * 0.5,
                            stroke: "black",
                            fill: 'transparent',
                            width: bounds.width,
                            height: bounds.height,
                            opacity: 1,
                            scaleX: 1,
                            scaleY: 1,
                            selectable: true,
                        });
                        latestObject._objects[1].set({
                            width: bounds.width,
                            height: bounds.height,
                            textAlign: "center"
                        });
                        break;

                }
                fabricCanvas.renderAll();
                fabricCanvas.setActiveObject(latestObject);
                // fabricCanvas.requestRenderAllBound();
            }
        }

        function onMouseMove(e) {
            if (!dragging || !freeDrawing) {
                return
            }
            // update(e)

            fabricCanvas.defaultCursor = 'crosshair';
            fabricCanvas.setCursor("crosshair");
            document.body.style.cursor = "crosshair";

            requestAnimationFrame(() => update(e))
        }

        function onMouseUp(e) {
            updateCanvasState();
            dragging = false;
            if (!freeDrawing) {
                return
            }
            if (options.drawRect && rect && (rect.width == 0 || rect.height === 0)) {
                // fabricCanvas.remove(group)
            }
            if (!options.drawRect || !rect) {
                // fabricCanvas.add(group)
            }
            mouseEventSave = "none";
            //console.log("onMuseUp ###");   // by jylee
            options.onlyOne && uninstall()
        }


        
        function install() {
            fabricCanvas.defaultCursor = 'crosshair';
            fabricCanvas.setCursor("crosshair");
            document.body.style.cursor = "crosshair";

            freeDrawing = true;
            dragging = false;
            rect = null;
            text = null;
            checkbox.checked = true;
            fabricCanvas.on('mouse:down', onMouseDown);
            fabricCanvas.on('mouse:move', onMouseMove);
            fabricCanvas.on('mouse:up', onMouseUp);          
            //fabricCanvas.on('keydown', onMouseDown);   
        }

        function uninstall() {
            fabricCanvas.defaultCursor = 'default';
            fabricCanvas.setCursor("default");
            freeDrawing = false;
            dragging = false;
            rect = null;
            text = null;
            checkbox.checked = false;
            document.body.style.cursor = "default";
            fabricCanvas.off('mouse:down', onMouseDown);
            fabricCanvas.off('mouse:move', onMouseMove);
            fabricCanvas.off('mouse:up', onMouseUp);
            selectedShape = "";
        }

        // the following is OOT - it's just for the controls above
        checkbox.addEventListener('change', e =>
            e.currentTarget.checked ? install() : uninstall()
        )
        document.querySelector('#drawRect').addEventListener('change', e => {
            options.drawRect = e.currentTarget.checked
        })
        document.querySelector('#onlyOne').addEventListener('change', e => {
            options.onlyOne = e.currentTarget.checked
        })
        freeDrawing && install()
    }

    const hidebtn1 = () => {
        if ($("#right_chevron1").hasClass("la la-chevron-right")) {
            $("#right_chevron1").removeClass("la la-chevron-right");
            $("#right_chevron1").addClass("la la-chevron-down");
            $("#shapes_list1").removeClass('d-none');
        } else {
            $("#right_chevron1").removeClass("la la-chevron-down");
            $("#right_chevron1").addClass("la la-chevron-right");
            $("#shapes_list1").addClass('d-none');
        }
    }
    const rightEditorUpdated = () => {
        if (fabricCanvas.getActiveObject() == undefined) {
            return;
        }

        let currentObj = fabricCanvas.getActiveObject();

        let x = parseInt(rectx.value, 10)
        let y = parseInt(recty.value, 10)
        let width = parseInt(rectwidth.value, 10)
        let height = parseInt(rectheight.value, 10)

        if (currentObj._objects != undefined) { //rect,textbox,
            if (currentObj.type == "group") {
                let bounds = currentObj.getBoundingRect();
                if (currentObj._objects[0].type == "image") {
                    currentObj.set({
                        left: x,
                        top: y,
                        width: width,
                        height: height,
                        scaleX: 1,
                        scaleY: 1,
                    })
                    currentObj._objects[0].set({
                        scaleX: bounds.width / currentObj._objects[0].width,
                        scaleY: bounds.height / currentObj._objects[0].height,
                        left: 0,
                        top: 0,
                        originX: 'center',
                        originY: 'center',
                    })
                    fabricCanvas.renderAll();
                } else {
                    currentObj.set({
                        left: x,
                        top: y,
                        width: width,
                        height: height,
                        scaleX: 1,
                        scaleY: 1,
                    })
                    currentObj._objects[0].set({
                        top: 0 - height * 0.5,
                        left: 0 - width * 0.5,
                        width: width,
                        height: height,
                        scaleX: 1,
                        scaleY: 1,
                    })
                    currentObj._objects[1].set({
                        // top: 0,
                        // left: 0,
                        width: width,
                        height: height,

                    })
                    fabricCanvas.renderAll();
                }
            } else {}
        } else {
            if (currentObj.get("type") == "circle") {
                let radius;
                if (width > height) {
                    radius = width
                } else {
                    radius = height;
                }
                currentObj.set({
                    radius: radius / 2
                });
                currentObj.set({
                    scaleX: 1
                });
                currentObj.set({
                    scaleY: 1
                });

            } else {
                currentObj.set({
                    left: x,
                    top: y,
                    width: width,
                    height: height,
                    scaleX: 1,
                    scaleY: 1,
                })
            }

            fabricCanvas.renderAll();

        }
    }
    const rightEditorUpdate = () => {

        let obj = fabricCanvas.getActiveObject();
        if (obj == undefined) {
            return;
        }

        let x = obj.left;
        let y = obj.top
        let width = obj.width;
        let height = obj.height;
        let scaleX = obj.scaleX;
        let scaleY = obj.scaleY;

        if (obj._objects != undefined) { //rect,textbox,
            if (obj.type == "group") {
                if (obj._objects[0].type == "image") {} else {
                    document.getElementById('rectFontColor').style.backgroundColor = obj._objects[1].fill;
                    document.getElementById('rectBackgroundColor').style.backgroundColor = obj._objects[0].fill;
                    rectfontsize.value = obj._objects[1].fontSize;
                }
            }
        } else {
            document.getElementById('rectFontColor').style.backgroundColor = obj.stroke;
            document.getElementById('rectBackgroundColor').style.backgroundColor = obj.fill;
        }

        rectx.value = parseInt(x, 10);
        recty.value = parseInt(y, 10);
        rectwidth.value = parseInt(width * scaleX, 10);
        rectheight.value = parseInt(height * scaleY, 10);

        if (obj.type == "group") {
            if (obj._objects[0].type == "image") {

            } else {
                rectText.value = obj._objects[1].text;
                fontName.value = obj._objects[1].fontFamily;
                if (obj._objects[1].textAlign == "left") {
                    $('#left').addClass("active");
                    $('#center').removeClass("active");
                    $('#right').removeClass("active");
                } else if (obj._objects[1].textAlign == "center") {
                    $('#left').removeClass("active");
                    $('#center').addClass("active");
                    $('#right').removeClass("active");
                } else if (obj._objects[1].textAlign == "right") {
                    $('#left').removeClass("active");
                    $('#center').removeClass("active");
                    $('#right').addClass("active");
                }

                if (obj._objects[1].verticalAlign == "top") {
                    $('#top').addClass("active");
                    $('#middle').removeClass("active");
                    $('#bottom').removeClass("active");
                } else if (obj._objects[1].verticalAlign == "middle") {
                    $('#top').removeClass("active");
                    $('#middle').addClass("active");
                    $('#bottom').removeClass("active");
                } else if (obj._objects[1].verticalAlign == "bottom") {
                    $('#top').removeClass("active");
                    $('#middle').removeClass("active");
                    $('#bottom').addClass("active");
                }
            }

        }

    }

    const loadAndUse = (font) => {
        let myfont = new FontFaceObserver(font)
        myfont.load()
            .then(function () {
                // when font is loaded, use it.
                if (fabricCanvas.getActiveObject()._objects != undefined) {
                    fabricCanvas.getActiveObject()._objects[1].set("fontFamily", font);
                  
                    fabricCanvas.requestRenderAll();
                } else {
                    fabricCanvas.getActiveObject().set("fontFamily", font);
                    
                    fabricCanvas.requestRenderAll();
                }

            }).catch(function (e) {
                console.log(e)
                alert('font loading failed ' + font);
            });
    }
    const tagSizeSlectFunc = () => { // if you choose tag size, change width of canvas and height of canvas
        if ( tagSizeSelect.selectedIndex != -1 ){
            switch (tagSizeSelect[tagSizeSelect.selectedIndex].value) {
                case "2_9":
                
                    if (tagDirectionSelect.value == "landscape") {  // Add tagDirection ->by jylee 
                        canvasWidth.value = 296;
                        canvasHeight.value = 128;
                        fabricCanvas.setWidth(296);
                        fabricCanvas.setHeight(128);
                    }
                    else {
                        canvasWidth.value = 128;
                        canvasHeight.value = 296;
                        fabricCanvas.setWidth(128);
                        fabricCanvas.setHeight(296);
                    }
                    
                    canvasWidth.disabled = true; //true;
                    canvasHeight.disabled = true; //true;								  
                    break;

                case "4_2":
                    if (tagDirectionSelect.value == "landscape") {  // Add tagDirection ->by jylee
                        canvasWidth.value = 400;
                        canvasHeight.value = 300;
                        fabricCanvas.setWidth(400);
                        fabricCanvas.setHeight(300);
                    }
                    else {
                        canvasWidth.value = 300;
                        canvasHeight.value = 400;
                        fabricCanvas.setWidth(300);
                        fabricCanvas.setHeight(400);    

                    }    
                
                    canvasWidth.disabled = true;
                    canvasHeight.disabled = true;
                    break;
                case "7_5":
                    
                    if (tagDirectionSelect.value == "landscape") {  // Add tagDirection ->by jylee
                        canvasWidth.value = 800;
                        canvasHeight.value = 480;
                        fabricCanvas.setWidth(800);
                        fabricCanvas.setHeight(480);   

                    }
                    else {
                        canvasWidth.value = 480;
                        canvasHeight.value = 800;
                        fabricCanvas.setWidth(480);
                        fabricCanvas.setHeight(800)

                    }
                    
                    canvasWidth.disabled = true;
                    canvasHeight.disabled = true;
                    canvas.getBoundingClientRect();							   
                    break;
                case "10_2":
                    if (tagDirectionSelect.value == "landscape") {  // Add tagDirection ->by jylee
                        canvasWidth.value = 960;
                        canvasHeight.value = 640;
                        fabricCanvas.setWidth(960);
                        fabricCanvas.setHeight(640);         
                    }
                    else {
                        canvasWidth.value = 640;
                        canvasHeight.value = 960;
                        fabricCanvas.setWidth(640);
                        fabricCanvas.setHeight(960);    

                    }
                
                                
                    canvasWidth.disabled = true;											
                    canvasHeight.disabled = true;
                    break;
                case "customSize":
                    canvasWidth.value = 600;
                    canvasHeight.value = 400;
                    fabricCanvas.setWidth(600);
                    fabricCanvas.setHeight(400);
                    canvasWidth.disabled = true;
                    canvasHeight.disabled = true;
                    break;
            }
        }
        fabricCanvas.renderAll();
    }

    const tagDirectionSelectFunc = () => { // if you choose tag size, change width of canvas and height of canvas

        if ( tagDirectionSelect.selectedIndex != -1){
            switch (tagDirectionSelect[tagDirectionSelect.selectedIndex].value) {
                case "landscape":

                    if ( tagSizeSelect.value == "2_9" ) {                  
                            canvasWidth.value = 296;
                            canvasHeight.value = 128;
                            fabricCanvas.setWidth(296);
                            fabricCanvas.setHeight(128);
                    }else if (tagSizeSelect.value == "4_2" ) {                      
                            canvasWidth.value = 400;
                            canvasHeight.value = 300;
                            fabricCanvas.setWidth(400);
                            fabricCanvas.setHeight(300);
                    }else if (tagSizeSelect.value == "7_5" ) {
                            canvasWidth.value = 800;
                            canvasHeight.value = 480;
                            fabricCanvas.setWidth(800);
                            fabricCanvas.setHeight(480);
                    }else if (tagSizeSelect.value == "10_2" ) {                   
                            canvasWidth.value = 960;
                            canvasHeight.value = 640;
                            fabricCanvas.setWidth(960);
                            fabricCanvas.setHeight(640);                       
                    }
                    canvasWidth.disabled = false; //true;
                    canvasHeight.disabled = false; //true;								  
                    break;

                case "portrait":
                    if ( tagSizeSelect.value == "2_9" ) {                  
                        canvasWidth.value = 128;
                        canvasHeight.value = 296;
                        fabricCanvas.setWidth(128);
                        fabricCanvas.setHeight(296);
                    }else if (tagSizeSelect.value == "4_2" ) {                    
                        canvasWidth.value = 300;
                        canvasHeight.value = 400;
                        fabricCanvas.setWidth(300);
                        fabricCanvas.setHeight(400);  
                    }else if (tagSizeSelect.value == "7_5" ) {
                        canvasWidth.value = 480;
                        canvasHeight.value = 800;
                        fabricCanvas.setWidth(480);
                        fabricCanvas.setHeight(800)
                    }else if (tagSizeSelect.value == "10_2" ) {                   
                        canvasWidth.value = 640;
                        canvasHeight.value = 960;
                        fabricCanvas.setWidth(640);
                        fabricCanvas.setHeight(960);                        
                    }

                    canvasWidth.disabled = true; //true;
                    canvasHeight.disabled = true; //true;								  
                    break;

                case "customSize":
                    canvasWidth.value = 600;
                    canvasHeight.value = 400;
                    fabricCanvas.setWidth(600);
                    fabricCanvas.setHeight(400);
                    canvasWidth.disabled = false;
                    canvasHeight.disabled = false;
                    break;
            }
        }
        fabricCanvas.renderAll();
    }


    const colorpickInit = () => {
        let color = "black";
        let bgColor = "transparent";

        $("#rectOutLineColor").colorPick({
            'initialColor': color,
            'palette': ["red", "black"],
            'onColorSelected': function () {
                this.element.css({
                    'backgroundColor': this.color,
                    'color': this.color
                });
                $('.colorPickButton').css('border', '1px solid black');

                if (fabricCanvas.getActiveObject() !== undefined) {
                    popupNotSelectObject();
                    if (fabricCanvas.getActiveObject().item != undefined) {
                        fabricCanvas.getActiveObject().item(0).set({
                            stroke: this.color
                        })
                    } else {
                        fabricCanvas.getActiveObject().set({
                            stroke: this.color
                        })
                    }
                    fabricCanvas.renderAll();
                }
            }
        })
        $("#rectBackgroundColor").colorPick({
            'initialColor': bgColor,
            'palette': ["black", "white", "red"],
            'onColorSelected': function () {

                this.element.css({
                    'backgroundColor': this.color,
                    'color': this.color
                });
                $('.colorPickButton').css('border', '1px solid black');
                if (fabricCanvas.getActiveObject() !== undefined) {
                    if (fabricCanvas.getActiveObject().type == "textbox" || fabricCanvas.getActiveObject().type == "line" || fabricCanvas.getActiveObject().type == "lineArrow") {
                        return
                    };
                    popupNotSelectObject();
                    if (fabricCanvas.getActiveObject().item != undefined) {
                        if (this.color == "red" || this.color == "RED") {
                            fabricCanvas.getActiveObject().item(0).set({
                                fill: this.color,
                                stroke: this.color,
                            })
                        } else {
                            fabricCanvas.getActiveObject().item(0).set({
                                fill: this.color,
                                stroke: "black",
                            })
                        }
                    } else {
                        if (this.color == "red" || this.color == "RED") {
                            fabricCanvas.getActiveObject().set({
                                fill: this.color,
                                stroke: this.color,
                            })
                        } else {
                            fabricCanvas.getActiveObject().set({
                                fill: this.color,
                                stroke: "black",

                            })
                        }
                    }
                    fabricCanvas.renderAll();
                }
            }
        });
        $("#rectFontColor").colorPick({
            'initialColor': bgColor,
            'palette': ["black", "white", "red"],
            'onColorSelected': function () {

                this.element.css({
                    'backgroundColor': this.color,
                    'color': this.color
                });
                $('.colorPickButton').css('border', '1px solid black');
                if (fabricCanvas.getActiveObject() !== undefined) {
                    popupNotSelectObject();
                    if (fabricCanvas.getActiveObject().item != undefined) {
                        fabricCanvas.getActiveObject().item(1).set({
                            fill: this.color,
                            // stroke:this.color
                        })
                    } else {
                        fabricCanvas.getActiveObject().set({
                            fill: this.color,
                            stroke: this.color
                        })
                    }
                    fabricCanvas.renderAll();
                }
            }
        });

        $("#lineFillColor").colorPick({
            'initialColor': bgColor,
            'palette': ["black", "white", "red"],
            'onColorSelected': function () {

                this.element.css({
                    'backgroundColor': this.color,
                    'color': this.color
                });
                $('.colorPickButton').css('border', '1px solid black');
                if (fabricCanvas.getActiveObject() !== undefined) {
                    popupNotSelectObject();
                    if (fabricCanvas.getActiveObject().item != undefined) {
                        fabricCanvas.getActiveObject().item(0).set({
                            stroke : this.color
                        })
                    } else {
                        fabricCanvas.getActiveObject().item(0).set({
                            // fill: this.color,
                            stroke: this.color
                        })
                    }
                    fabricCanvas.renderAll();
                }
            }
        });


        // if(fabricCanvas.getActiveObject() == undefined){return;}
        // if(fabricCanvas.getActiveObject()._objects==undefined){     //rect 제외 모두
        //     let color = "black";   
        //     let bgColor = "transparent";

        //     if(fabricCanvas.getActiveObject().stroke == "" || fabricCanvas.getActiveObject().stroke == null || fabricCanvas.getActiveObject().stroke == undefined){
        //     }
        //     else{
        //         color = fabricCanvas.getActiveObject().stroke;
        //     }
        //     if(fabricCanvas.getActiveObject().fill == "" || fabricCanvas.getActiveObject().fill == null || fabricCanvas.getActiveObject().fill == undefined){
        //     }
        //     else{
        //         bgColor = fabricCanvas.getActiveObject().fill;
        //     }
        //     if(bgColor == "transparent" || bgColor == "TRANSPARENT"){
        //         $('#rectfillnone').click();
        //     }
        //     else{
        //         $('#rectfillcolor').click();
        //     }
        //     $("#rectOutLineColor").colorPick({   
        //         'initialColor' : color,
        //         'palette': ["red", "black"],
        //         'onColorSelected': function () {
        //             this.element.css({ 'backgroundColor': this.color, 'color': this.color });
        //             $('.colorPickButton').css('border', '1px solid black');

        //             if(fabricCanvas.getActiveObject()!==undefined){
        //                 if(fabricCanvas.getActiveObject()==undefined){
        //                     alertPopUp('error',"컴포넌트를 클릭/선택하고 진행해주세요.");
        //                     return;
        //                 }
        //                 if(fabricCanvas.getActiveObject().item != undefined){
        //                     fabricCanvas.getActiveObject().item(0).set({
        //                         stroke:this.color
        //                     })
        //                 }
        //                 else{
        //                     fabricCanvas.getActiveObject().set({
        //                         stroke:this.color
        //                     })
        //                 }
        //                 fabricCanvas.renderAll();
        //             }



        //         }
        //     })
        //     $("#rectBackgroundColor").colorPick({
        //         'initialColor': bgColor,
        //         'palette': ["black", "white", "red"],
        //         'onColorSelected': function () {

        //             this.element.css({ 'backgroundColor': this.color, 'color': this.color });
        //             $('.colorPickButton').css('border', '1px solid black');
        //             if(fabricCanvas.getActiveObject()!==undefined){
        //                 if(fabricCanvas.getActiveObject().type=="textbox"  || fabricCanvas.getActiveObject().type=="line" || fabricCanvas.getActiveObject().type=="lineArrow"){return};
        //                     if(fabricCanvas.getActiveObject()==undefined){
        //                     alertPopUp('error',"컴포넌트를 클릭/선택하고 진행해주세요.");
        //                     return;
        //                 }
        //                 if(fabricCanvas.getActiveObject().item != undefined){
        //                     if(this.color == "red" || this.color == "RED"){
        //                         fabricCanvas.getActiveObject().item(0).set({
        //                             fill:this.color,
        //                             stroke:this.color,
        //                         })
        //                     }
        //                     else{
        //                         fabricCanvas.getActiveObject().item(0).set({
        //                             fill:this.color,
        //                             stroke:"black",

        //                         })
        //                     }

        //                 }
        //                 else{
        //                     if(this.color == "red" || this.color == "RED"){
        //                         fabricCanvas.getActiveObject().set({
        //                             fill:this.color,
        //                             stroke:this.color,
        //                         })
        //                     }
        //                     else{
        //                         fabricCanvas.getActiveObject().set({
        //                             fill:this.color,
        //                             stroke:"black",

        //                         })
        //                     }

        //                 }
        //                 fabricCanvas.renderAll();
        //             }
        //         }
        //     });
        //     $("#rectFontColor").colorPick({
        //         'initialColor': bgColor,
        //         'palette': ["black", "white", "red"],
        //         'onColorSelected': function () {

        //             this.element.css({ 'backgroundColor': this.color, 'color': this.color });
        //             $('.colorPickButton').css('border', '1px solid black');
        //             if(fabricCanvas.getActiveObject()!==undefined){
        //                 if(fabricCanvas.getActiveObject().type!="textbox"){return};
        //                 if(fabricCanvas.getActiveObject()==undefined){
        //                     alertPopUp('error',"컴포넌트를 클릭/선택하고 진행해주세요.");
        //                     return;
        //                 }
        //                 if(fabricCanvas.getActiveObject().item != undefined){
        //                     fabricCanvas.getActiveObject().item(0).set({
        //                         fill:this.color,
        //                         stroke:this.color
        //                     })
        //                 }
        //                 else{
        //                     fabricCanvas.getActiveObject().set({
        //                         fill:this.color,
        //                         stroke:this.color
        //                     })
        //                 }
        //                 fabricCanvas.renderAll();
        //             }
        //         }
        //     });
        // }
        // else{
        //     let descname = document.getElementsByName('descname');
        //     let num = fabricCanvas.getObjects().indexOf(fabricCanvas.getActiveObject());

        //     let color = "black";
        //     let bgColor = "transparent";
        //     if(fabricCanvas.getActiveObject()._objects[0].stroke == "" || fabricCanvas.getActiveObject()._objects[0].stroke == null || fabricCanvas.getActiveObject()._objects[0].stroke == undefined){
        //     }
        //     else{
        //         color = fabricCanvas.getActiveObject()._objects[0].stroke;
        //     }
        //     if(fabricCanvas.getActiveObject()._objects[0].fill == "" || fabricCanvas.getActiveObject()._objects[0].fill == null || fabricCanvas.getActiveObject()._objects[0].fill == undefined){
        //     }
        //     else{
        //         bgColor = fabricCanvas.getActiveObject()._objects[0].fill;
        //     }
        //     if(bgColor == "transparent" || bgColor == "TRANSPARENT"){
        //         $('#rectfillnone').click();
        //     }
        //     else{
        //         $('#rectfillcolor').click();
        //     }

        //     $("#rectOutLineColor").colorPick({   
        //         'initialColor' : color,
        //         'palette': ["red", "black"],
        //         'onColorSelected': function (e) {

        //             this.element.css({ 'backgroundColor': this.color, 'color': this.color });
        //             $('.colorPickButton').css('border', '1px solid black');
        //             if(fabricCanvas.getActiveObject()!==undefined){
        //                 if(fabricCanvas.getActiveObject()==undefined){
        //                     alertPopUp('error',"컴포넌트를 클릭/선택하고 진행해주세요.");
        //                     return;
        //                 }
        //                 if(fabricCanvas.getActiveObject().item != undefined){
        //                     fabricCanvas.getActiveObject().item(0).set({
        //                         stroke:this.color
        //                     })
        //                 }
        //                 else{
        //                     fabricCanvas.getActiveObject().set({
        //                         stroke:this.color
        //                     })
        //                 }
        //                 fabricCanvas.renderAll();
        //             }
        //         }
        //     })
        //     $("#rectBackgroundColor").colorPick({
        //         'initialColor': bgColor,
        //         'palette': ["black", "white", "red","transparent"],
        //         'onColorSelected': function () {

        //             this.element.css({ 'backgroundColor': this.color, 'color': this.color });
        //             $('.colorPickButton').css('border', '1px solid black');
        //             if(fabricCanvas.getActiveObject()!==undefined){
        //                 if(fabricCanvas.getActiveObject().type=="textbox" || fabricCanvas.getActiveObject().type=="line" || fabricCanvas.getActiveObject().type=="lineArrow"){return};
        //                 if(fabricCanvas.getActiveObject()==undefined){
        //                     alertPopUp('error',"컴포넌트를 클릭/선택하고 진행해주세요.");
        //                     return;
        //                 }
        //                 if(fabricCanvas.getActiveObject().item != undefined){
        //                     if(this.color == "red" || this.color == "RED"){
        //                         fabricCanvas.getActiveObject().item(0).set({
        //                             fill:this.color,
        //                             stroke:this.color,
        //                         })
        //                         fabricCanvas.getActiveObject().set({
        //                             fill:this.color,
        //                             stroke:this.color,
        //                         })
        //                     }
        //                     else{
        //                         fabricCanvas.getActiveObject().item(0).set({
        //                             fill:this.color,
        //                             stroke:"black",
        //                         })
        //                         fabricCanvas.getActiveObject().set({
        //                             fill:this.color,
        //                             stroke:"black",
        //                         })
        //                     }

        //                 }
        //                 else{
        //                     if(this.color == "red" || this.color == "RED"){
        //                         fabricCanvas.getActiveObject().set({
        //                             fill:this.color,
        //                             stroke:this.color,
        //                         })
        //                     }
        //                     else{
        //                         fabricCanvas.getActiveObject().set({
        //                             fill:this.color,
        //                             stroke:"black",

        //                         })
        //                     }

        //                 }
        //                 fabricCanvas.renderAll();
        //             }
        //         }
        //     });
        //     $("#rectFontColor").colorPick({
        //         'initialColor': color,
        //         'palette': ["black", "white", "red"],
        //         'onColorSelected': function (e) {
        //             this.element.css({ 'backgroundColor': this.color, 'color': this.color });
        //             $('.colorPickButton').css('border', '1px solid black');
        //             if(fabricCanvas.getActiveObject()!==undefined){
        //                 if(fabricCanvas.getActiveObject()==undefined){
        //                     if(fabricCanvas.getActiveObject().type!=="textbox"){return};

        //                     alertPopUp('error',"컴포넌트를 클릭/선택하고 진행해주세요.");
        //                     return;
        //                 }
        //                 if(fabricCanvas.getActiveObject().item != undefined){
        //                     fabricCanvas.getActiveObject().item(1).set({
        //                         fill:this.color
        //                     })
        //                 }
        //                 else{
        //                     fabricCanvas.getActiveObject().set({
        //                         fill:this.color
        //                     })
        //                 }
        //                 fabricCanvas.renderAll();
        //             }
        //         }
        //     });

        // }

    }
    const loadTagLayoutInfo = () => {
        if (loadPageParam == undefined || loadPageParam == "") {
            return;
        }
        
        let tagLayoutInfo = loadPageParam;
        layoutName.value = tagLayoutInfo.tag_layout_name;
        tagSizeSelect.value = tagLayoutInfo.tag_size;
        tagDirectionSelect.value = JSON.parse(tagLayoutInfo.tag_info_json).orientation;

        
        if (tagLayoutInfo.tag_mfr == "IDR"){ // if tag direct type is 'IDR'
            $("#tagProductSelect").val('IDR').prop("selected", true);
        }
        else{ // if tag direct type is 'Cronus'
            $("#tagProductSelect").val('Cronus').prop("selected", true);
        }

        let json = JSON.parse(tagLayoutInfo.tag_info_json)

        for (let i = 0; i < json['objects'].length; i++) {
            if (json['objects'][i].idText == undefined) {
                if (json['objects'][i].type == "group") { //rect , image
                    if (json['objects'][i].objects[0].type == "rect") {
                        
                        addComponent("rect");
                    } else {
                        
                        addComponent("image");
                    }
                } else {
                    
                    addComponent(json['objects'][i].type);
                }
            } else {
                
                addComponent(json['objects'][i].idText);
            }
        }

        fabricCanvas.loadFromJSON(tagLayoutInfo.tag_info_json, function () {
            fabricCanvas.renderAll();
        })

    }

    const locationInfo = () => {
        $('#tagRegisterModal').modal('show');

        let treeLocation = "#tree";
        selectedLocaion = "";

        sourceData = [];
        let url = new URL( '<%=global.config.apiServerUrl%>/tag-editor/get-data-group-info');
        let parameter = {
            "id": getCookie("id")
        }
        fetch(url, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(parameter)
            })
            .then(response => response.json())
            .then(response => {

                if (response.status != "OK") {
                    const error = (response.data && response.data.message) || response.status;
                    return Promise.reject(error);
                }

                locationData = response.data;
                let visitedLocationArray = new Array(locationData.length);
                for (let i = 0; i < locationData.length; i++) {
                    if (locationData[i].depth == 1) {
                        sourceData.push({
                            key: locationData[i].idx,
                            title: locationData[i].name,
                            folder: true,
                            lazy: true,
                            children: []
                        });
                        visitedLocationArray[i] = false;
                    }
                }

                const getLocationList = (sourceData) => {
                    for (let i = 0; i < visitedLocationArray.length; i++) {
                        let parentIdx = -1;
                        if (visitedLocationArray[i] == false) {
                            continue;
                        }
                        for (let j = 0; j < sourceData.length; j++) {
                            if (sourceData[j].key === locationData[i].parent_rawid) {
                                parentIdx = sourceData[j].key.indexOf(Number(locationData[i].parent_rawid));
                            }
                            // console.log(locationData[i].name+","+locationData[i].parent_rawid+":"+parentIdx)

                            if (parentIdx > -1) {
                                sourceData[j].children.push({
                                    key: locationData[i].idx,
                                    title: locationData[i].name,
                                    folder: true,
                                    lazy: true,
                                    children: []
                                })
                                visitedLocationArray[i] = false;
                                getLocationList(sourceData[j].children)
                            }
                        }
                    }
                }

                getLocationList(sourceData);

                let newSourceOption = {
                    extensions: ["edit"],
                    source: sourceData,
                    activate: function (event, data) {
                        selectedLocaion = data.node;

                    },
                    icon: function (event, data) {
                        if (data.node.isFolder()) {
                            return "la la-industry";
                        }
                    },
                    edit: {
                        triggerStart: ["f2", "dblclick", "shift+click", "mac+enter"],
                        close: function (event, data) {
                            let orgKey = data.node.key;
                            let newName = data.node.title;
                            if (orgKey > 0) {
                                // insert location //
                                let url = new URL( '<%=global.config.apiServerUrl%>/tag-editor/set-data-group-info');
                                let parameter = {
                                    "key": orgKey,
                                    "newName": newName
                                }
                                fetch(url, {
                                    method: 'post',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify(parameter)
                                }).then(response => {
                                    if (!response.ok) {
                                        const error = (response.data && response.data.message) || response.status;
                                        return Promise.reject(error);
                                    }
                                }).catch(error => {
                                    console.error(url+":[error]" +error);
                                    alertPopUp("error", "<%=__('Error Occurred')%>");
                                })

                                // .then(response => {
                                //     if(currentPage === "tag-location"){
                                //         loadPage('tag-location','#right-panel');
                                //     }
                                // })
                            } else {
                                // edit new location //
                                url = new URL( '<%=global.config.apiServerUrl%>/tag-editor/get-data-group-info');
                                fetch( url, {
                                        method: 'post',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            "id": getCookie("id")
                                        })
                                    })
                                    .then(response => response.json())
                                    .then(response => {

                                        if (!response.ok) {
                                            const error = (response.data && response.data.message) || response.status;
                                            return Promise.reject(error);
                                        }

                                        orgKey = response.data[response.data.length - 1].idx;

                                        url = new URL( '<%=global.config.apiServerUrl%>/tag-location/set-data-group-info');
                                        let parameter = {
                                            "key": orgKey,
                                            "newName": newName
                                        }
                                        fetch(url, {
                                            method: 'post',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify(parameter)
                                        }).then(response => {
                                            if (!response.ok) {
                                                const error = (response.data && response.data.message) || response.status;
                                                return Promise.reject(error);
                                            }
                                        }).catch(error => {
                                            console.error(url+":[error]" +error);
                                            alertPopUp("error", "<%=__('Error Occurred')%>");
                                        })

                                    }).catch(error => {
                                        console.error(url+":[error]" +error);
                                        alertPopUp("error", "<%=__('Error Occurred')%>");
                                    })
                            }
                        },
                        start: function (event, data) {
                            <% if ( global.config.runningMode == "debug" ){ %>
                                console.log(data)
                            <% }%>
                           
                        }
                    }
                }


                // start fanytree setting
                if ($(treeLocation).html().length !== 0) {
                    $(treeLocation).fancytree("destroy");
                }
                tree = $(treeLocation).fancytree(newSourceOption);

                // $.ui.fancytree.getTree("#tree").reload(sourceData);
                // $("#tree").fancytree("option", "source",sourceData)


                $.ui.fancytree.getTree(treeLocation).visit(function (node) {
                    // node.toggleExpanded();
                });

                $(treeLocation + " .fancytree-container").css(
                    "font-size", 11.5 + "pt"
                );
            }).catch(error => {
                console.error(url+":[error]" +error);
                alertPopUp("error", "<%=__('Error Occurred')%>");
            })

    }

    const popupNotSelectObject = () => {
        if (fabricCanvas.getActiveObject() == undefined) {          
            alertPopUp('error', "<%=__('Click/select Data Box components and proceed')%>");           //Data Box 컴포넌트를 클릭/선택하고 진행해주세요.");
            return;
        }
    }

    const getSelectedDataGroup = () => {
        let options = {
            url:  "<%=global.config.apiServerUrl%>/tag-editor/data-group",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                selectedData: fabricCanvas.getActiveObject()._objects[1].text.split("$")[1],
            }
        };

        ajax(options, function (data) {
            let selectedValue = options.sendData.selectedData;
            let dataGroupList = data.data.dataGroupList;
            if (dataGroupList.length == 0) {
                return;
            }


            document.getElementById('data-group-selector').value = dataGroupList[0].parnet_group_name;

            let html = "";
            for (let i = 0; i < dataGroupList.length; i++) {
                html += '<option  value="' + dataGroupList[i].data_group_name + '">' + dataGroupList[i].data_group_name + '</option>';
            }

            document.getElementById("data-value-selector").innerHTML = html;
            document.getElementById('data-value-selector').value = selectedValue;

        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    
    }

    // Layout Editor Envent Listener 
    const compObjectCopy = () => { 

        fabricCanvas.getActiveObject().clone(function (cloned) {
            _clipboard = cloned;
        });

        _clipboard.clone(function (clonedObj) {
            fabricCanvas.discardActiveObject();
            clonedObj.set({
                left: clonedObj.left + 20,
                top: clonedObj.top + 20,
                evented: true,
                borderColor: "red"
            });
            if (clonedObj.type === 'activeSelection') {
                // active selection needs a reference to the fabricCanvas.
                clonedObj.fabricCanvas = fabricCanvas;
                clonedObj.forEachObject(function (obj) {
                    fabricCanvas.add(obj);
                });
                // this should solve the unselectability
                clonedObj.setCoords();
            } else {
                fabricCanvas.add(clonedObj);
            }
            _clipboard.top += 10;
            _clipboard.left += 10;
            fabricCanvas.setActiveObject(clonedObj);
            if (clonedObj.type == "group") { //rect , image
                if (clonedObj._objects[0].type == "rect") {                    
                    addComponent("rect");
                } else {                   
                    addComponent("image");
                }
            } else {                
                addComponent(clonedObj.type);
            }
            updateCanvasState();
            fabricCanvas.requestRenderAll();
        });
    }
    
    const compObjectDelete = () => { 
        if (fabricCanvas.getActiveObject() == undefined) {
            alertPopUp('error', "<%=__('Click/select Data Box components and proceed')%>");           //Data Box 컴포넌트를 클릭/선택하고 진행해주세요.");
            return;
        }
        let removeIndex = fabricCanvas.getObjects().indexOf(fabricCanvas.getActiveObject());
        updateCanvasState();
        $('li[name="compListname"]').eq(removeIndex).remove();
        fabricCanvas.remove(fabricCanvas.getActiveObject());

        let compListname = document.getElementsByName('compListname');
        for (let i = 0; i < compListname.length; i++) {
            compListname[i].addEventListener('click', (e) => {
                fabricCanvas.setActiveObject(fabricCanvas.item(i));
                fabricCanvas.renderAll();
                document.getElementById("rectsetupBody").classList.remove("d-none");

                rightEditorUpdate();
                for (let i = 0; i < compListname.length; i++) {
                    compListname[i].style.backgroundColor = "white";
                    compListname[i].style.color = "black";

                }
                e.currentTarget.style.backgroundColor = "#679897";
                e.currentTarget.style.color = "white";


                if (fabricCanvas.getActiveObject() != null) {
                    // if(fabricCanvas.getActiveObject().type == "textbox"){
                    //     document.getElementById('backGroundStyleUl').classList.add("d-none");

                    //     if(fabricCanvas.getActiveObject().text.charAt(0) == "$"){
                    //         document.getElementById('data-box-option').classList.remove("d-none");
                    //         getSelectedDataGroup();
                    //     }
                    //     else{
                    //         document.getElementById('data-box-option').classList.add("d-none");
                    //     }
                    //     document.getElementById('line-group').classList.add("d-none");
                    //     document.getElementById('textStyleUl').classList.remove("d-none");


                    // }
                    // else{
                    if (fabricCanvas.getActiveObject().type == "lineArrow" || fabricCanvas.getActiveObject().type == "line") {
                        document.getElementById('line-group').classList.remove("d-none");
                        document.getElementById('backGroundStyleUl').classList.add("d-none");
                        document.getElementById('textStyleUl').classList.add("d-none");
                        document.getElementById('data-box-option').classList.add("d-none");
                        document.getElementById('componentListclass').classList.remove("d-none");;

                    } else if (fabricCanvas.getActiveObject().type == "group") {
                        document.getElementById('line-group').classList.add("d-none");
                        document.getElementById('backGroundStyleUl').classList.remove("d-none");
                        document.getElementById('textStyleUl').classList.remove("d-none");
                        if (fabricCanvas.getActiveObject()._objects[1] == undefined) {
                            return;
                        } else if (fabricCanvas.getActiveObject()._objects[1].isDataBox == true) {
                            document.getElementById('data-box-option').classList.remove("d-none");
                            document.getElementById('componentListclass').classList.add("d-none");;
                            getSelectedDataGroup();

                        } else {
                            document.getElementById('data-box-option').classList.add("d-none");
                            document.getElementById('componentListclass').classList.remove("d-none");;


                        }

                    } else {
                        document.getElementById('line-group').classList.add("d-none");
                        document.getElementById('backGroundStyleUl').classList.remove("d-none");
                        document.getElementById('textStyleUl').classList.add("d-none");
                        document.getElementById('data-box-option').classList.add("d-none");
                        document.getElementById('componentListclass').classList.remove("d-none");;


                    }
                    // }
                }

                document.getElementById('rectOutLineN').disabled = true;
            })
        }
    }

    const eventListener = () => {
        fabricCanvas = new fabric.Canvas('canvas', {
            selection: false
        });
        fabricCanvas.backgroundColor = "white";

        tagSizeSelect.addEventListener('change', function (e) {
            tagSizeSlectFunc();
        })

        tagDirectionSelect.addEventListener('change', function (e) {
            tagDirectionSelectFunc();
        })

        document.querySelector('.allcanvas').addEventListener('mouseleave', () => {
            fabricCanvas.discardActiveObject();
            fabricCanvas.requestRenderAll();
            //console.log("### mouseleave###");  // by jylee 
            document.getElementById("rectsetupBody").classList.add("d-none");

        })

        loadTagLayoutInfo();

        $("#tagSizeSelect").trigger("change");
        tagSizeSlectFunc();

        $("#tagDirectionSelect").trigger("change");
        tagDirectionSelectFunc();


        colorpickInit()
        
        let fonts = [
            "MapoPeacefull",
            "MapoAgape",
            "MapoBackpacking",
            "MapoDacapo",
            "MapoDPP",
            "MapoFlowerIsland",
            "MapoGoldenPier",
            "MapoHongdaeFreedom",
            "MapoMaponaru",
            "NanumBrush",
            "NanumPen",
            "gulim",
            "NanumSquareNeo-bRg", 
            "NanumSquareNeo-aLt",
            "NanumSquareNeo-cBd",
            "NanumSquareNeo-eHv",
            "NanumSquareNeo-dEb",
            "NanumGothic-Bold"
        ];

        // Populate the fontFamily select
        let select = document.getElementById("fontName");
        fonts.forEach(function (font) {
            let option = document.createElement('option');
            option.innerHTML = font;
            option.value = font;
            select.appendChild(option);
        });

        let dataGroupAddBtn = document.getElementById("dataGroupAddBtn");
        dataGroupAddBtn.addEventListener("click", function (e) {
            document.getElementById('data-group-selector').value = selectedLocaion.title;

            var activeNode = $.ui.fancytree.getTree("#tree").getActiveNode(),
                nodes = [];

            activeNode.visit(function (node) {
                nodes.push(node); // or node.key, ...
            });
            let html = "";
            for (let i = 0; i < nodes.length; i++) {
                html += '<option  value="' + nodes[i].key + '">' + nodes[i].title + '</option>';
            }

            document.getElementById("data-value-selector").innerHTML = html;
            // tagLocation.value = selectedLocaion.title;
            // tagLocation.placeholder = selectedLocaion.key;
        })

        let addLocationBtn = document.getElementById("addLocationBtn");
        addLocationBtn.addEventListener("click", function (e) {
            let node = $.ui.fancytree.getTree("#tree").getActiveNode();
            if (!node) {
                alertPopUp("error", "<%= __('Please select a location')%>");       //location을 선택해주세요.");
                return;
            }
            node.editCreateNode("child", {
                title: "New",
                folder: true
            });

            for (let i = 0; i < locationData.length; i++) {
                if (node.key == locationData[i].idx) {
                    selectedLocationDepth = Number(locationData[i].depth) + 1;
                }
            }

            let url = new URL( '<%=global.config.apiServerUrl%>/tag-editor/insert-data-group-info');
            let parameter = {
                "parent_rawid": node.key,
                "location_name": "New",
                "depth": selectedLocationDepth
            }
            fetch(url, {
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(parameter)
                }).then(response => {
                    if (!response.ok) {
                        const error = (response.data && response.data.message) || response.status;
                        return Promise.reject(error);
                    }
                    // loadPage('tag-location','#right-panel');
                }).catch(error => {
                    console.error(url+":[error]" +error);
                    alertPopUp("error", "<%=__('Error Occurred')%>");
                })
        })

        let deleteLocationBtn = document.getElementById("deleteLocationBtn");
        deleteLocationBtn.addEventListener("click", function (e) {
            alertPopUp('warning', "<%= __('Are you sure you want to delete it? If you press delete, it will be deleted')%>");       //정말 삭제하시겠습니까?  delete를 누르면 삭제됩니다");
            $('.swal-button--confirm').on('click', function (e) {
                tree = $.ui.fancytree.getTree("#tree"),
                    node = tree.getActiveNode();
                node.remove();

                let url = new URL( '<%=global.config.apiServerUrl%>/tag-editor/delete-data-group-info');
                let parameter = {
                    "idx": node.key
                }
                fetch(url, {
                        method: 'post',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(parameter)
                    }).then(response => {
                        if (!response.ok) {
                            const error = (response.data && response.data.message) || response.status;
                            return Promise.reject(error);
                        }
                        alertPopUp("success", "<%=__('Deleted')%>");      //삭제 되었습니다.")
                        // loadPage('tag-location','#right-panel');
                    }).catch(error => {
                        console.error(url+":[error]" +error);
                        alertPopUp("error", "<%=__('Error Occurred')%>");
                    })
            })
        })

        document.getElementById("ImageBtn").addEventListener("click", () => {
            document.getElementById("imageInputId").click();
        })

          
        document.getElementById('rectText').addEventListener('keyup', () => {
            
            let idx = fabricCanvas.getObjects().indexOf(fabricCanvas.getActiveObject());
            let compListname = document.getElementsByName('compListname');

            if (compListname[idx].id == "dataBox") {

                if (rectText.value.charAt(0) == "$") {
                    fabricCanvas.getActiveObject()._objects[1].set({
                        text: document.getElementById('rectText').value,
                    })
                    rightEditorUpdated();
                    fabricCanvas.renderAll();
                } else {
                    fabricCanvas.getActiveObject()._objects[1].set({
                        text: "$" + document.getElementById('rectText').value,
                    })
                    rectText.value = "$" + rectText.value;

                    rightEditorUpdated();
                    fabricCanvas.renderAll();
                }
            } else {
                fabricCanvas.getActiveObject()._objects[1].set({
                    text: document.getElementById('rectText').value,
                })
                rightEditorUpdated();
                fabricCanvas.renderAll();
            }
        })


        document.getElementById("addDatagroup").addEventListener('click', function (e) {
            $('#dataGroupModal').modal("show");
            locationInfo();
        })

        $("fileUploadForm").submit(function (e) {
            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("has submitted");
            <% }%>
            
        })

        document.getElementById("registerFont").addEventListener('click', function (e) {
            registerFont(fontURL.value);
        })


        document.getElementById('fontName').onchange = function () {
            popupNotSelectObject();

            if (this.value !== 'Times New Roman') {
                loadAndUse(this.value);
                
            } else {
                fabricCanvas.getActiveObject().set("fontFamily", this.value);
                fabricCanvas.requestRenderAll();
            }
        };

        fabricCanvas.on('mouse:down', function () {
            if (fabricCanvas.getActiveObject() == undefined) {                
                document.getElementById("rectsetupBody").classList.add("d-none");
                document.getElementById('data-box-option').classList.add("d-none");
                // Remove componentList right box when mouse down ->by jylee 
                //document.getElementById('componentListclass').classList.remove("d-none");
            } else {
                //console.log("### mouse:down object active ###");  // by jylee 
                document.getElementById("rectsetupBody").classList.remove("d-none");
            }

            // colorpickInit();
        })

       
        fabricCanvas.on("mouse:up", function (e) {
            if (fabricCanvas.getActiveObject() == undefined) {                
                document.getElementById("rectsetupBody").classList.add("d-none")
            } else {               
                document.getElementById("rectsetupBody").classList.remove("d-none");
            }
            // updateCanvasState()

            if (fabricCanvas.isDrawingMode) {              
                addComponent("freeDrawing");
                fabricCanvas.setActiveObject(fabricCanvas._objects[fabricCanvas._objects.length - 1]);
            }
            if (fabricCanvas.getActiveObject() != undefined) {
                let index = fabricCanvas.getObjects().indexOf(fabricCanvas.getActiveObject());
                document.getElementsByName("compListname")[index].click();

            }

            rightEditorUpdate();
            rightEditorUpdated();
            // colorpickInit();
            fabricCanvas.forEachObject(function (object) {
                object.selectable = true;
            });


            if (fabricCanvas.getActiveObject() != null) {
                if (fabricCanvas.getActiveObject().type == "lineArrow" || fabricCanvas.getActiveObject().type == "line") {
                    document.getElementById('line-group').classList.remove("d-none");
                    document.getElementById('backGroundStyleUl').classList.add("d-none");
                    document.getElementById('textStyleUl').classList.add("d-none");
                    document.getElementById('data-box-option').classList.add("d-none");
                    document.getElementById('componentListclass').classList.remove("d-none");;



                } else if (fabricCanvas.getActiveObject().type == "group") {
                    if (fabricCanvas.getActiveObject()._objects[0].type == "image") {
                        return;
                    }
                    document.getElementById('line-group').classList.add("d-none");
                    document.getElementById('backGroundStyleUl').classList.remove("d-none");
                    document.getElementById('textStyleUl').classList.remove("d-none");
                    if (fabricCanvas.getActiveObject()._objects[1].isDataBox == true) {
                        document.getElementById('data-box-option').classList.remove("d-none");
                        document.getElementById('componentListclass').classList.add("d-none");;

                        getSelectedDataGroup();
                    } else {
                        document.getElementById('data-box-option').classList.add("d-none");
                        document.getElementById('componentListclass').classList.remove("d-none");;

                    }
                } else {
                    document.getElementById('line-group').classList.add("d-none");
                    document.getElementById('backGroundStyleUl').classList.remove("d-none");
                    document.getElementById('textStyleUl').classList.add("d-none");
                    document.getElementById('data-box-option').classList.add("d-none");
                    document.getElementById('componentListclass').classList.remove("d-none");;

                }
                // }
            }

            document.getElementById('rectOutLineN').disabled = true;
        })

        fabricCanvas.on('mouse:move', function () {
            rightEditorUpdate();
        })

        let rectkeydown = document.getElementsByName('rectkeydown');
        for (let i = 0; i < rectkeydown.length; i++) {
            rectkeydown[i].addEventListener('keyup', function (e) {
                rightEditorUpdated();
            })
            rectkeydown[i].addEventListener('change', function (e) {
                rightEditorUpdated();
            })
        }

        fabricCanvas.on('path:created', function (opt) {
            if (opt.path.path == undefined) {
                return;
            }
            opt.path.path.map(chunk => {
                return chunk.join(' ');
            }).join(' ')
        });

        document.getElementById('clear').addEventListener('click', function (e) {
            $('li[name="compListname"]').remove();
            updateCanvasState();
            fabricCanvas.clear();
        })

        /////////////////////////////////////////////////////////////////////
        /* Add ctrl(17)-c(67), ctrl(17)-v(86) ctrl-x(88) ctrl-z(90) ctrl-y(89) for object copy and delete ->by jylee 230305 */
        let map = {17: false, 88: false, 67: false, 86: false, 89: false, 90: false};
        $(document).keydown(function(e) {
        //$(document).on("keydown", function(e) {    
            if (e.keyCode in map) {
                /* e.ctrlKey && e.keyCode == 86 (CTRL-V) */
                if(e.ctrlKey && e.keyCode == 86) {
                    if(!map[86]){    
                        e.preventDefault(); 
                        map[86] = true;   
                        
                        if (fabricCanvas.getActiveObject() == undefined) {                                       
                            document.getElementById("rectsetupBody").classList.add("d-none");
                            document.getElementById('data-box-option').classList.add("d-none");
                            
                        } else {
                            document.getElementById("rectsetupBody").classList.remove("d-none");
                            compObjectCopy();
                        }    
                                                
                        
                    }
                }
                if(e.ctrlKey && e.keyCode == 88) {
                    if(!map[88]){  
                        e.preventDefault();
                        map[88] = true;                            
                        if (fabricCanvas.getActiveObject() == undefined) {                                    
                            document.getElementById("rectsetupBody").classList.add("d-none");
                            document.getElementById('data-box-option').classList.add("d-none");
                            
                        } else {
                            document.getElementById("rectsetupBody").classList.remove("d-none");
                            compObjectDelete();
                        }    
                    }
                }
                if(e.ctrlKey && e.keyCode == 89) {
                    // ctrl-y(89)
                    if(!map[89]){  
                        e.preventDefault();
                        map[89] = true; 
                        canvasDemo.redo();  // TBD: ctrl-Z mapping ->by jyle                           
                        //if (fabricCanvas.getActiveObject() == undefined) {                                    
                        //    document.getElementById("rectsetupBody").classList.add("d-none");
                        //    document.getElementById('data-box-option').classList.add("d-none");
                        //    
                        //} else {
                        //    console.log("### ctrl-y active ###");  // by jylee 
                        //    document.getElementById("rectsetupBody").classList.remove("d-none");
                        //    canvasDemo.redo();  // TBD: ctrl-Z mapping ->by jyle
                        //}    
                    }
                }
                if(e.ctrlKey && e.keyCode == 90) {
                    // ctrl-z(90)
                    if(!map[90]){  
                        e.preventDefault();
                        map[90] = true;     
                        canvasDemo.undo();  // TBD: ctrl-Z mapping ->by jylee                       
                        //if (fabricCanvas.getActiveObject() == undefined) {                                    
                        //    document.getElementById("rectsetupBody").classList.add("d-none");
                        //    document.getElementById('data-box-option').classList.add("d-none");
                        //    
                        //} else {
                        //    console.log("### ctrl-z active ###");  // by jylee 
                        //    document.getElementById("rectsetupBody").classList.remove("d-none");
                        //    canvasDemo.undo();  // TBD: ctrl-Z mapping ->by jylee 
                        //}    
                    }
                }
            }
        }).keyup(function(e) {
            if (e.keyCode in map) {
                //console.log("keyup " + e.keyCode);  // for debug by jylee
                map[e.keyCode] = false;
            }
        });
        //////////////////////////////////////////////////////////////////////// 
    

        document.getElementById('compcopy').addEventListener('click', function (e) {
            compObjectCopy();   /* Modify Object delte function ->by jylee 230305 */

            /*
            fabricCanvas.getActiveObject().clone(function (cloned) {
                _clipboard = cloned;
            });

            _clipboard.clone(function (clonedObj) {
                fabricCanvas.discardActiveObject();
                clonedObj.set({
                    left: clonedObj.left + 20,
                    top: clonedObj.top + 20,
                    evented: true,
                    borderColor: "red"
                });
                if (clonedObj.type === 'activeSelection') {
                    // active selection needs a reference to the fabricCanvas.
                    clonedObj.fabricCanvas = fabricCanvas;
                    clonedObj.forEachObject(function (obj) {
                        fabricCanvas.add(obj);
                    });
                    // this should solve the unselectability
                    clonedObj.setCoords();
                } else {
                    fabricCanvas.add(clonedObj);
                }
                _clipboard.top += 10;
                _clipboard.left += 10;
                fabricCanvas.setActiveObject(clonedObj);
                if (clonedObj.type == "group") { //rect , image
                    if (clonedObj._objects[0].type == "rect") {
                        console.log("### addComponent : rect ###");  // by jylee
                        addComponent("rect");
                    } else {
                        console.log("### addComponent : image ###");  // by jylee
                        addComponent("image");
                    }
                } else {
                    console.log("### addComponent : >>>>> ###");  // by jylee
                    addComponent(clonedObj.type);
                }
                updateCanvasState();
                fabricCanvas.requestRenderAll();
            });
            */

        })
        document.getElementById('compdelete').addEventListener('click', function (e) {
            compObjectDelete();   /* Modify Object delte function ->by jylee 230305 */
            /*
            if (fabricCanvas.getActiveObject() == undefined) {
                alertPopUp('error', "<%=__('Click/select Data Box components and proceed')%>");           //Data Box 컴포넌트를 클릭/선택하고 진행해주세요.");
                return;
            }
            let removeIndex = fabricCanvas.getObjects().indexOf(fabricCanvas.getActiveObject());
            updateCanvasState();
            $('li[name="compListname"]').eq(removeIndex).remove();
            fabricCanvas.remove(fabricCanvas.getActiveObject());

            let compListname = document.getElementsByName('compListname');
            for (let i = 0; i < compListname.length; i++) {
                compListname[i].addEventListener('click', (e) => {
                    fabricCanvas.setActiveObject(fabricCanvas.item(i));
                    fabricCanvas.renderAll();
                    document.getElementById("rectsetupBody").classList.remove("d-none");

                    rightEditorUpdate();
                    for (let i = 0; i < compListname.length; i++) {
                        compListname[i].style.backgroundColor = "white";
                        compListname[i].style.color = "black";

                    }
                    e.currentTarget.style.backgroundColor = "#679897";
                    e.currentTarget.style.color = "white";


                    if (fabricCanvas.getActiveObject() != null) {
                        // if(fabricCanvas.getActiveObject().type == "textbox"){
                        //     document.getElementById('backGroundStyleUl').classList.add("d-none");

                        //     if(fabricCanvas.getActiveObject().text.charAt(0) == "$"){
                        //         document.getElementById('data-box-option').classList.remove("d-none");
                        //         getSelectedDataGroup();
                        //     }
                        //     else{
                        //         document.getElementById('data-box-option').classList.add("d-none");
                        //     }
                        //     document.getElementById('line-group').classList.add("d-none");
                        //     document.getElementById('textStyleUl').classList.remove("d-none");


                        // }
                        // else{
                        if (fabricCanvas.getActiveObject().type == "lineArrow" || fabricCanvas.getActiveObject().type == "line") {
                            document.getElementById('line-group').classList.remove("d-none");
                            document.getElementById('backGroundStyleUl').classList.add("d-none");
                            document.getElementById('textStyleUl').classList.add("d-none");
                            document.getElementById('data-box-option').classList.add("d-none");
                            document.getElementById('componentListclass').classList.remove("d-none");;

                        } else if (fabricCanvas.getActiveObject().type == "group") {
                            document.getElementById('line-group').classList.add("d-none");
                            document.getElementById('backGroundStyleUl').classList.remove("d-none");
                            document.getElementById('textStyleUl').classList.remove("d-none");
                            if (fabricCanvas.getActiveObject()._objects[1] == undefined) {
                                return;
                            } else if (fabricCanvas.getActiveObject()._objects[1].isDataBox == true) {
                                document.getElementById('data-box-option').classList.remove("d-none");
                                document.getElementById('componentListclass').classList.add("d-none");;
                                getSelectedDataGroup();

                            } else {
                                document.getElementById('data-box-option').classList.add("d-none");
                                document.getElementById('componentListclass').classList.remove("d-none");;


                            }

                        } else {
                            document.getElementById('line-group').classList.add("d-none");
                            document.getElementById('backGroundStyleUl').classList.remove("d-none");
                            document.getElementById('textStyleUl').classList.add("d-none");
                            document.getElementById('data-box-option').classList.add("d-none");
                            document.getElementById('componentListclass').classList.remove("d-none");;


                        }
                        // }
                    }

                    document.getElementById('rectOutLineN').disabled = true;
                })
            }
            */
        })

        
        document.getElementById('rectInput').addEventListener('click', event => dragDraw("rect"), false);
        document.getElementById('arrowInput').addEventListener('click', event => dragDraw("arrow"), false);
        document.getElementById('circleInput').addEventListener('click', event => dragDraw("circle"), false);
        document.getElementById('lineInput').addEventListener('click', event => dragDraw("line"), false);
        document.getElementById('triangleInput').addEventListener('click', event => dragDraw("triangle"), false);
        document.getElementById('textBoxInput').addEventListener('click', event => dragDraw("textBox"), false);
        document.getElementById('dataBoxInput').addEventListener('click', event => dragDraw("dataBox"), false);

        fabric.Object.prototype.transparentCorners = false;
        fabricCanvas.isDrawingMode = false;
        let drawingOptionsEl = $('#drawing-mode-options');
        let drawingColorEl = $('#drawing-color');
        let drawingBrushEl = $('#drawing-brush-selector');
        let drawingLineWidthEl = $('#drawing-line-width');
        let drawingLineWidthInputEl = $('#drawing-line-width-input');
        let freedrawingBtnEl = $('#freedrawingBtn');
        let clearEl = $('#clear-canvas');

        clearEl.on("click", function (e) {
            fabricCanvas.clear()
        })

        freedrawingBtnEl.on("click", function (e) {
            let brush = fabricCanvas.freeDrawingBrush;
            brush.width = 15;
            brush.color = "black";
            freedrawingBtn.classList.toggle('active');

            fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;
            if (fabricCanvas.isDrawingMode) {
                drawingOptionsEl.removeClass("d-none");
            } else {
                drawingOptionsEl.addClass("d-none");
            }
        });

        for (let i = 0; i < objImg.length; i++) {
            objImg[i].addEventListener('click', function (e) {
                selectedDrawObject = objImg[i].id;

                fabricCanvas.forEachObject(function (object) {
                    object.selectable = false;
                });

                if (selectedDrawObject !== "freeDrawingInput") {
                    freedrawingBtn.classList.remove("active");
                    document.getElementById('drawing-mode-options').classList.add("d-none")
                    fabricCanvas.isDrawingMode = false;
                }
                if (selectedDrawObject !== "dataBoxInput") {
                    if (selectedDrawObject == "textBoxInput") {

                        document.getElementById('line-group').classList.add("d-none")
                        document.getElementById('textStyleUl').classList.remove("d-none")
                    } else {
                        document.getElementById('line-group').classList.add("d-none")
                        document.getElementById('textStyleUl').classList.add("d-none")
                    }
                    if (selectedDrawObject == "arrowInput" || selectedDrawObject == "lineInput") {
                        document.getElementById('line-group').classList.remove("d-none")
                        document.getElementById('backGroundStyleUl').classList.add("d-none");
                        document.getElementById('rectOutLineN').disabled = true;
                    } else {
                        document.getElementById('backGroundStyleUl').classList.remove("d-none")
                        document.getElementById('rectOutLineN').disabled = false;
                    }
                    document.getElementById('data-box-option').classList.add("d-none")
                    document.getElementById('componentListclass').classList.remove("d-none");;


                } else {
                    document.getElementById('line-group').classList.add("d-none")
                    document.getElementById('data-box-option').classList.remove("d-none")
                    document.getElementById('componentListclass').classList.add("d-none");;

                    document.getElementById('textStyleUl').classList.remove("d-none")
                }

            })
        }

        let dataValueSelector = document.getElementById("data-value-selector");
        dataValueSelector.addEventListener('change', () => {
            let selectedValue = dataValueSelector[dataValueSelector.selectedIndex].innerHTML;
            popupNotSelectObject();
            fabricCanvas.getActiveObject()._objects[1].set({
                text: "$" + selectedValue
            })
            fabricCanvas.getActiveObject()._objects[1].dataGroupValue = dataValueSelector[dataValueSelector.selectedIndex].value;
            fabricCanvas.renderAll();
            rightEditorUpdate();
        })

        let dataInputType = document.getElementsByName('data-input-type');
        for (let i = 0; i < dataInputType.length; i++) {
            dataInputType[i].addEventListener('click', () => {
                popupNotSelectObject();
                if (dataInputType[i].id == "data-value-select-input") {
                    document.getElementById("data-group-selector").disabled = false;
                    document.getElementById("data-value-selector").disabled = false;
                    let selectedValue = dataValueSelector[dataValueSelector.selectedIndex].innerText;

                    fabricCanvas.getActiveObject().set({
                        text: "$" + selectedValue,
                        editable: false,
                    })
                } else {
                    document.getElementById("data-group-selector").disabled = true;
                    document.getElementById("data-value-selector").disabled = true;
                    fabricCanvas.getActiveObject()._objects[1].set({
                        text: "$",
                        editable: true,
                    })
                    rectText.value = "$";

                }
                fabricCanvas.renderAll();

            })
        }
        $('#rectfontsize').on('change keydown keyup', () => {
            fabricCanvas.getActiveObject()._objects[1].set({
                fontSize: rectfontsize.value
            })
            fabricCanvas.renderAll();
        })

        drawingBrushEl.on("change", function (e) {
            fabricCanvas.freeDrawingBrush = new fabric[this.value + 'Brush'](fabricCanvas);

            if (fabricCanvas.freeDrawingBrush) {
                let brush = fabricCanvas.freeDrawingBrush;
                brush.color = drawingColorEl.value;
                if (brush.getPatternSrc) {
                    brush.source = brush.getPatternSrc.call(brush);
                }
                brush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
            }
        });

        drawingLineWidthInputEl.on("change", function (e) {
            fabricCanvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
            this.nextSibling.value = this.value;
        });
        drawingLineWidthInputEl.on("keyup", function (e) {
            fabricCanvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
            this.nextSibling.value = this.value;
        });

        drawingColorEl.on("change", function (e) {
            let brush = fabricCanvas.freeDrawingBrush;
            brush.color = this.value;
            if (brush.getPatternSrc) {
                brush.source = brush.getPatternSrc.call(brush);
            }
        });

        drawingLineWidthEl.on("change", function (e) {
            fabricCanvas.freeDrawingBrush.width = parseInt(this.value, 10) || 1;
            this.previousSibling.value = this.value;
        });

        if (fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.color = drawingColorEl.value;
            // fabricCanvas.freeDrawingBrush.source = fabricCanvas.freeDrawingBrush.getPatternSrc.call(this);
            fabricCanvas.freeDrawingBrush.width = parseInt(drawingLineWidthEl.value, 10) || 1;
        }
        $("#fontFileInput").on("change", function (e) {
            let id = document.getElementById('fontFileInput');
            for (let i = 0; i < id.files.length; i++) {
                const file = id.files[i];

                if (file.type.startsWith('font/ttf') === false) {
                    alertPopUp("error", "<%=__('Only ttf files can be registered')%>");       //ttf 파일만 등록가능합니다.");
                    break;
                };
            }
        })

        $("#imageInputId").on("change", function (e) {
            ImageFileUploadToBase64(document.getElementById('imageInputId'), function (result) {
                imageInputBase64 = result;
                drawFabricImage(imageInputBase64);
                addComponent('image');
                // dragDraw("image")
            });
        })
        let canvasDemo = (function () {
            let undo = function () {

                if (undoRedoConfig.undoFinishedStatus) {
                    if (undoRedoConfig.currentStateIndex == -1) {
                        undoRedoConfig.undoStatus = false;
                    } else {
                        if (undoRedoConfig.canvasState.length >= 1) {
                            undoRedoConfig.undoFinishedStatus = 0;
                            if (undoRedoConfig.currentStateIndex != 0) {
                                undoRedoConfig.undoStatus = true;
                                fabricCanvas.loadFromJSON(undoRedoConfig.canvasState[undoRedoConfig.currentStateIndex - 1], function () {
                                    let jsonData = JSON.parse(undoRedoConfig.canvasState[undoRedoConfig.currentStateIndex - 1]);
                                    fabricCanvas.renderAll();
                                    undoRedoConfig.undoStatus = false;
                                    undoRedoConfig.currentStateIndex -= 1;
                                    undoRedoConfig.undoButton.removeAttribute("disabled");
                                    if (undoRedoConfig.currentStateIndex !== undoRedoConfig.canvasState.length - 1) {
                                        undoRedoConfig.redoButton.removeAttribute('disabled');
                                    }
                                    undoRedoConfig.undoFinishedStatus = 1;

                                    $('#componentList').html("");
                                    for (let i = 0; i < fabricCanvas._objects.length; i++) {
                                        if (fabricCanvas._objects[i].type == "group") { //rect , image
                                            if (fabricCanvas._objects[i]._objects[0].type == "rect") {
                                                addComponent("rect");
                                            } else {
                                                addComponent("image");
                                            }
                                        } else {
                                            addComponent(fabricCanvas._objects[i].type);
                                        }
                                    }
                                });
                            } else if (undoRedoConfig.currentStateIndex == 0) {
                                fabricCanvas.clear();
                                undoRedoConfig.undoFinishedStatus = 1;
                                undoRedoConfig.undoButton.disabled = "disabled";
                                undoRedoConfig.redoButton.removeAttribute('disabled');
                                undoRedoConfig.currentStateIndex -= 1;

                                $('#componentList').html("");
                                for (let i = 0; i < fabricCanvas._objects.length; i++) {
                                    if (fabricCanvas._objects[i].type == "group") { //rect , image
                                        if (fabricCanvas._objects[i]._objects[0].type == "rect") {
                                            addComponent("rect");
                                        } else {
                                            addComponent("image");
                                        }
                                    } else {
                                        addComponent(fabricCanvas._objects[i].type);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            let redo = function () {
                // compListnameUndo =  $('#componentList').html();
                // $('#componentList').html(compListnameRedo);
                if (undoRedoConfig.redoFinishedStatus) {
                    if ((undoRedoConfig.currentStateIndex == undoRedoConfig.canvasState.length - 1) && undoRedoConfig.currentStateIndex != -1) {
                        undoRedoConfig.redoButton.disabled = "disabled";

                    } else {
                        if (undoRedoConfig.canvasState.length > undoRedoConfig.currentStateIndex && undoRedoConfig.canvasState.length != 0) {
                            undoRedoConfig.redoFinishedStatus = 0;
                            undoRedoConfig.redoStatus = true;
                            fabricCanvas.loadFromJSON(undoRedoConfig.canvasState[undoRedoConfig.currentStateIndex + 1], function () {
                                let jsonData = JSON.parse(undoRedoConfig.canvasState[undoRedoConfig.currentStateIndex + 1]);

                                fabricCanvas.renderAll();
                                undoRedoConfig.redoStatus = false;
                                undoRedoConfig.currentStateIndex += 1;
                                if (undoRedoConfig.currentStateIndex != -1) {
                                    undoRedoConfig.undoButton.removeAttribute('disabled');
                                }
                                undoRedoConfig.redoFinishedStatus = 1;
                                if ((undoRedoConfig.currentStateIndex == undoRedoConfig.canvasState.length - 1) && undoRedoConfig.currentStateIndex != -1) {
                                    undoRedoConfig.redoButton.disabled = "disabled";
                                }

                                $('#componentList').html("");
                                for (let i = 0; i < fabricCanvas._objects.length; i++) {
                                    if (fabricCanvas._objects[i].type == "group") { //rect , image
                                        if (fabricCanvas._objects[i]._objects[0].type == "rect") {
                                            addComponent("rect");
                                        } else {
                                            addComponent("image");
                                        }
                                    } else {
                                        addComponent(fabricCanvas._objects[i].type);
                                    }
                                }
                            });
                        }
                    }
                }
            }
            return {
                undoButton: undoRedoConfig.undoButton,
                redoButton: undoRedoConfig.redoButton,
                undo: undo,
                redo: redo,
            }
        })();

        fabricCanvas.on("object:modified", function (e) {
            updateCanvasState();
        })
        fabricCanvas.on("object:added", function (e) {
            try {
                if (fabricCanvas.getActiveObject() == undefined) {
                    return;
                }
                if (fabricCanvas.getActiveObject().points == undefined) {
                    return;
                }
                if (fabricCanvas.getActiveObject().points.length == 9) {
                    return;
                }
            } catch (error) {
                console.error(error)
            }
            // updateCanvasState();
        })
        fabricCanvas.on("object:removed", function (e) {
            updateCanvasState();
        })

        canvasDemo.undoButton.addEventListener('click', function () {
            canvasDemo.undo();  // TBD: ctrl-Z mapping ->by jylee 
        });

        canvasDemo.redoButton.addEventListener('click', function () {
            canvasDemo.redo();  // TBD: ctrl-Y mapping ->by jylee 
        });


        right_hidebtn1.addEventListener('click', function (e) {
            hidebtn1();
        })
        hideBtnId.addEventListener('click', function (e) {
            // rightCanvas.classList.remove("col-md-3");
            // rightCanvas.style.maxWidth = "0px";
            // middleCanvas.classList.add("col-md-10");
            // middleCanvas.style.maxWidth = "83.333333%";
        }       )

        let rectOutLineAll = document.getElementsByName('rectOutLine');
        for (let i = 0; i < rectOutLineAll.length; i++) {
            rectOutLineAll[i].addEventListener('change', function (e) {
                if (e.currentTarget.value == 'rectOutLineN') {
                    // object.data.strokeColor = 'transparent';
                    rectOutLineDiv.classList.add('d-none');
                    popupNotSelectObject();
                    if (fabricCanvas.getActiveObject().item != undefined) {
                        fabricCanvas.getActiveObject().item(0).set({
                            stroke: "transparent"
                        })
                    } else {
                        fabricCanvas.getActiveObject().set({
                            stroke: "transparent"
                        })
                    }

                    fabricCanvas.renderAll();
                } else if (e.currentTarget.value == 'rectOutLineY') {
                    // object.data.strokeColor = document.getElementById('rectOutLineColor').style.color;
                    rectOutLineDiv.classList.remove('d-none');
                    colorpickInit();
                    rightEditorUpdate();
                }

                // this.fabricRectUpdate(this._dbselectObj);

            });
        }

        


        saveBtn.addEventListener('click', function (e) {
            let fileName;
            let idx;
            let compListname = document.getElementsByName("compListname");
            if (loadPageParam == undefined || loadPageParam == "") {
                url = "/tag-editor/save-tag-layout";
                // Modify tag template name ->by jylee 230213
                //fileName = Math.random().toString(36).substr(2, 11) + ".png";
                fileName = layoutName.value + ".png";
                //console.log("[create] fileName : " + fileName);  // for debug by jylee
                
                idx = -1;
            } else {
                url = "/tag-editor/edit-tag-layout";
                fileName = loadPageParam.tag_image_file_name;
                //console.log("[load] fileName : " + fileName);      // for debug by jylee              
                idx = loadPageParam.idx;
            }


            for (let i = 0; i < fabricCanvas._objects.length; i++) {
                fabricCanvas._objects[i].idText = compListname[i].innerText;
                if (fabricCanvas._objects[i].type == "group") {
                    for (let j = 0; j < fabricCanvas._objects[i]._objects.length; j++) {
                        if (fabricCanvas._objects[i]._objects[j].type == "textbox") {}
                    }
                }
            }

            let copy = JSON.parse(JSON.stringify(fabricCanvas.toJSON()));
            for (let i = 0; i < copy.objects.length; i++) {
                copy.objects[i].idText = compListname[i].innerText;
            }
            copy["orientation"] = tagDirectionSelect[tagDirectionSelect.selectedIndex].value;

            let canvasJson = JSON.stringify(copy);
            let name = layoutName.value;
            //console.log("[layout] ### Name : " + name);      // for debug by jylee 
            // Modify fileName is the same layoutName ->by jylee 03038
            let layout_filename = name + ".png";
            if(fileName != layout_filename) {
                url = "/tag-editor/save-tag-layout";
                //fileName = name;
                //fileName = name + ".png";
                fileName = layout_filename
                //console.log("[layout] change fileName : " + fileName);      // for debug by jylee 
            }
             
            let tagSize = tagSizeSelect[tagSizeSelect.selectedIndex].value;

            let options = {
                url: "<%=global.config.apiServerUrl%>" + url,
                headers: {
                    'Content-Type': "application/json",
                },
                type: "post",
                sendData: {
                    canvasJson: canvasJson,
                    name: name,
                   
                    fileName: fileName,
                    tagSize: tagSize,
                    idx: idx,
                    imageType: "black",
                    convertedJson: "",
                    tagType : "IDR"
                }
            };

            if (name == "") {
                alertPopUp("error", "<%=__('Please enter a Tag name')%>");            //Tag 명을 입력하세요.");
                $('#layoutName').focus();
                return;
            }
            
            let canvasObjects = fabricCanvas.toJSON().objects;
            
            let blackWhiteObjects = [];
            let redObjects = [];
            let commonObjects = [];

            let spliceArr = [];
            for (let i = 0; i < canvasObjects.length; i++) {
                if (canvasObjects[i].type == "group" && canvasObjects[i].objects[0].type != "image") {
                    if (canvasObjects[i].objects > 1 && canvasObjects[i].objects[1].text.charAt(0) == '$') {
                        spliceArr.push(i);
                    }
                }

            }
            for (let i = spliceArr.length - 1; i >= 0; i--) {
                // canvasObjects.splice(spliceArr[i],1);
            }
            
            let tagProductSelect = document.getElementById('tagProductSelect');
            let tagProduct = tagProductSelect.options[tagProductSelect.selectedIndex].value;

            tagProductSelect.addEventListener("change", function(e){
               tagProduct = tagProductSelect.options[tagProductSelect.selectedIndex].value;
            })

            if(tagProduct == "IDR"){ // If the tag type is 'IDR'
                let blackWhiteCanvas = new fabric.Canvas(null);
                let redCanvas = new fabric.Canvas(null);

                blackWhiteCanvas.setWidth(fabricCanvas.width);
                blackWhiteCanvas.setHeight(fabricCanvas.height);

                redCanvas.setWidth(fabricCanvas.width);
                redCanvas.setHeight(fabricCanvas.height);

                for (let i = 0; i < canvasObjects.length; i++) {
                    let blackWhiteArr = ["rgb(0,0,0)", "RGB(0,0,0)", "black", "BLACK", "Black", "TRANSPARENT", "transparent", "WHITE", "white", "White", "rgb(255,255,255)", "RGB(255,255,255)", "#FFFFFF", "#ffffff"]
                    let redArr = ["red", "RED", "rgb(255,0,0)", "RGB(255,0,0)", "#ff0000"]
                    if (canvasObjects[i].type == "group") { //rect , image

                        if (canvasObjects[i].objects[0].type == "rect") {
                            let clone = canvasObjects[i];
                            let rect = clone.objects[0];
                            let text = clone.objects[1]

                            if (blackWhiteArr.indexOf(rect.fill) != -1 && text != undefined && blackWhiteArr.indexOf(text.fill) != -1) { // 배경 검흰, 글자 검흰
                                let cloneString = JSON.stringify(canvasObjects[i]);
                                let clone = JSON.parse(cloneString);

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = canvasObjects[i].objects[0].fill;
                                    clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                }

                                blackWhiteObjects.push(clone);

                            } else if (blackWhiteArr.indexOf(rect.fill) != -1 && text != undefined && blackWhiteArr.indexOf(text.fill) == -1) { // 배경 검흰 , 글자 red
                               
                                let cloneString = JSON.stringify(canvasObjects[i]);
                                let clone = JSON.parse(cloneString);

                                clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                clone.objects[1].fill = canvasObjects[i].objects[0].fill;

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = canvasObjects[i].objects[0].fill;
                                    clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                }

                                blackWhiteObjects.push(clone);

                                clone = JSON.parse(JSON.stringify(clone));
                                clone.objects[0].stroke = "transparent";
                                clone.objects[0].fill = "transparent";
                                clone.objects[1].stroke = "red";
                                clone.objects[1].fill = "red";

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = "transparent";
                                    clone.objects[1].stroke = "transparent";
                                }
                                  
                                redObjects.push(clone);  
                                

                            } else if (blackWhiteArr.indexOf(rect.fill) == -1 && text != undefined && blackWhiteArr.indexOf(text.fill) != -1) { //배경 레드 , 글자 검흰

                                let cloneString = JSON.stringify(canvasObjects[i]);
                                let clone = JSON.parse(cloneString);

                                clone.objects[0].stroke = "red";
                                clone.objects[0].fill = "red";
                                clone.objects[1].stroke = "red";
                                clone.objects[1].fill = "red";
                                if (clone.objects[1].text.charAt(0) == '$') {
                                    // clone.objects[1].fill = canvasObjects[i].objects[0].fill;
                                    // clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                    clone.objects[1].fill = canvasObjects[i].objects[0].fill;
                                    clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                }
                               
                                redObjects.push(clone);
                                 
                                clone = JSON.parse(JSON.stringify(clone));
                                clone.objects[0].stroke = "transparent";
                                clone.objects[0].fill = "transparent";

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = "transparent";
                                    clone.objects[1].stroke = "transparent";
                                }
                                blackWhiteObjects.push(clone);

                            }
                        } else if (canvasObjects[i].objects[0].type == "image") {
                            blackWhiteObjects.push(canvasObjects[i])
                        }

                    } else if (canvasObjects[i].type == "circle" || canvasObjects[i].type == "triangle" || canvasObjects[i].type == "textbox") {
                        if (blackWhiteArr.indexOf(canvasObjects[i].fill) != -1) {
                            blackWhiteObjects.push(canvasObjects[i])
                        } else {
                            redObjects.push(canvasObjects[i])
                        }
                        
                       
                    } else if (canvasObjects[i].type == "line" || canvasObjects[i].type == "lineArrow" || canvasObjects[i].type == "path") {
                        if (blackWhiteArr.indexOf(canvasObjects[i].stroke) != -1) {
                            blackWhiteObjects.push(canvasObjects[i])
                        } else {
                            redObjects.push(canvasObjects[i])
                        }
                        
                        
                    }
                }

                let blackWhiteJson = {
                    background: "white",
                    objects: blackWhiteObjects,
                    version: "4.3.1"
                }
                let redJson = {
                    background: "white",
                    objects: redObjects,
                    version: "4.3.1"
                }

                blackWhiteCanvas.loadFromJSON(blackWhiteJson, function () {
                    blackWhiteCanvas.renderAll();

                    let options2 = {
                        url: "/kanbanpublish/saveBase64File",
                        type: "post",
                        headers: {
                            'Content-Type': "application/json",
                        },
                        sendData: {
                            base64: blackWhiteCanvas.toDataURL(),
                            imageName: fileName
                        }
                    };
    
                    ajax(options2, function (data) {
    
                    }, function (error) {
                        alertPopUp('error', "<%=__('Error Occurred')%>");
                        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
                    });
                })
               
                redCanvas.loadFromJSON(redJson, function () {
                    redCanvas.renderAll();

                    let options2 = {
                        url: "/kanbanpublish/saveBase64File",
                        type: "post",
                        headers: {
                            'Content-Type': "application/json",
                        },
                        sendData: {
                            base64: redCanvas.toDataURL(),
                            imageName: fileName.split('.')[0] + "_b" + ".png"
                        }
                    };
    
                    ajax(options2, function (data) {
    
                    }, function (error) {
                        alertPopUp('error', "<%=__('Error Occurred')%>");
                        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
                    });
                })
                
            }
            else{ // If the tag type is 'Cronus'
                options.sendData.tagType = "Cronus";
                
                let commonCanvas = new fabric.Canvas(null);

                commonCanvas.setWidth(fabricCanvas.width);
                commonCanvas.setHeight(fabricCanvas.height);

                for (let i = 0; i < canvasObjects.length; i++) {
                    let blackWhiteArr = ["rgb(0,0,0)", "RGB(0,0,0)", "black", "BLACK", "Black", "TRANSPARENT", "transparent", "WHITE", "white", "White", "rgb(255,255,255)", "RGB(255,255,255)", "#FFFFFF", "#ffffff"]
                    let redArr = ["red", "RED", "rgb(255,0,0)", "RGB(255,0,0)", "#ff0000"]
                    if (canvasObjects[i].type == "group") { //rect , image

                        if (canvasObjects[i].objects[0].type == "rect") {
                            let clone = canvasObjects[i];
                            let rect = clone.objects[0];
                            let text = clone.objects[1]

                            if (blackWhiteArr.indexOf(rect.fill) != -1 && blackWhiteArr.indexOf(text.fill) != -1) { // background black&white, text black&white
                                let cloneString = JSON.stringify(canvasObjects[i]);
                                let clone = JSON.parse(cloneString);

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = canvasObjects[i].objects[0].fill;
                                    clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                }

                                commonObjects.push(clone);

                            } else if (blackWhiteArr.indexOf(rect.fill) != -1 && blackWhiteArr.indexOf(text.fill) == -1) { // background black&white , text red


                                let cloneString = JSON.stringify(canvasObjects[i]);
                                let clone = JSON.parse(cloneString);

                                clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                clone.objects[1].fill = canvasObjects[i].objects[0].fill;

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = canvasObjects[i].objects[0].fill;
                                    clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                }

                                commonObjects.push(clone);

                                clone = JSON.parse(JSON.stringify(clone));
                                clone.objects[0].stroke = "transparent";
                                clone.objects[0].fill = "transparent";
                                clone.objects[1].stroke = "red";
                                clone.objects[1].fill = "red";

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = "transparent";
                                    clone.objects[1].stroke = "transparent";
                                }

                                commonObjects.push(clone);

                            } else if (blackWhiteArr.indexOf(rect.fill) == -1 && blackWhiteArr.indexOf(text.fill) != -1) { // background red , text black&white

                                let cloneString = JSON.stringify(canvasObjects[i]);
                                let clone = JSON.parse(cloneString);

                                clone.objects[0].stroke = "red";
                                clone.objects[0].fill = "red";
                                clone.objects[1].stroke = "red";
                                clone.objects[1].fill = "red";
                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = canvasObjects[i].objects[0].fill;
                                    clone.objects[1].stroke = canvasObjects[i].objects[0].fill;
                                }
                                commonObjects.push(clone);

                                clone = JSON.parse(JSON.stringify(clone));
                                clone.objects[0].stroke = "transparent";
                                clone.objects[0].fill = "transparent";

                                if (clone.objects[1].text.charAt(0) == '$') {
                                    clone.objects[1].fill = "transparent";
                                    clone.objects[1].stroke = "transparent";
                                }
                                commonObjects.push(clone);

                            }

                        } else if (canvasObjects[i].objects[0].type == "image") {
                            commonObjects.push(canvasObjects[i])
                        }

                    } else if (canvasObjects[i].type == "circle" || canvasObjects[i].type == "triangle" || canvasObjects[i].type == "textbox") {
                        commonObjects.push(canvasObjects[i])
                    } else if (canvasObjects[i].type == "line" || canvasObjects[i].type == "lineArrow" || canvasObjects[i].type == "path") {
                        commonObjects.push(canvasObjects[i])
                    }
                }

                let commonJson = {
                    background : "white",
                    objects : commonObjects,
                    version: "4.3.1"
                }

                commonCanvas.loadFromJSON(commonJson, function () {
                    commonCanvas.renderAll();

                    let options2 = {
                        url: "/kanbanpublish/saveBase64File",
                        type: "post",
                        headers: {
                            'Content-Type': "application/json",
                        },
                        sendData: {
                            base64: commonCanvas.toDataURL(),
                            imageName: fileName.split('.')[0] + ".png"
                        }
                    };
                    ajax(options2, function (data) {
                    }, function (error) {
                        alertPopUp('error', "<%=__('Error Occurred')%>");
                        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
                    });
                })

            }


            let convertedJson = {
                "drawing": [

                ]
            }
            let componentJson = {
                "object_id": "",
                "drawing_type": "typing",
                "color": "#000000",
                "thickness": 1, // if this is text, Fixed at 1
                "fill": false,
                "points": [ // Zero is left top 2 points, other than 4 points

                ],
                "font_family": "gulim",
                "font_size": 16,
                "text": "",
                "text_align": "top",
                "vertical_align": "left"
            }
            let qrcodeJson = {
                "object_id": "",
                "drawing_type": "qrcode",
                "color": "#000000",
                "thickness": 1, // if this is text, Fixed at 1
                "fill": false,
                "points": [ // Zero is left top 2 points, other than 4 points

                ],
                "font_family": "gulim",
                "font_size": 16,
                "text": "",
                "text_align": "center",
                "vertical_align": "middle"
            }
            let barcodeJson = {
                "object_id": "",
                "drawing_type": "barcode",
                "color": "#000000",
                "thickness": 1, // if this is text, Fixed at 1
                "fill": false,
                "points": [ // Zero is left top 2 points, other than 4 points

                ],
                "font_family": "gulim",
                "font_size": 16,
                "text": "",
                "text_align": "center",
                "vertical_align": "middle"
            }
            let imageComponentJson = {
                "object_id": "",
                "drawing_type": "image",
                "color": "#000000",
                "thickness": 8,
                "fill": false,
                "points": [],
                'data': ""
            }

            let rgbJSON = {
                "RED": "#FF0000",
                "red": "#FF0000",
                "rgb(255,0,0)": "#FF0000",
                "RGB(255,0,0)": "#FF0000",
                "white": "#FFFFFF",
                "WHITE": "#FFFFFF",
                "rgb(255,255,255)": "#FFFFFF",
                "RGB(255,255,255)": "#FFFFFF",
                "BLACK": "#000000",
                "black": "#000000",
                "rgb(0,0,0)": "#000000",
                "RGB(0,0,0)": "#000000",
            }

            if(tagProduct == "IDR"){
                for (let i = 0; i < canvasObjects.length; i++) {
                    if (canvasObjects[i].type != "group" || canvasObjects[i].objects[1] == undefined) {
                        continue;
                    }
                    
                    if (canvasObjects[i].type == "group" && canvasObjects[i].objects[1].text.charAt(0) == '$') {
                        const strA = 'QRcode';
                        const straB = "barcode";
                        const regex = new RegExp(strA, "gi");
                        const regex2 = new RegExp(straB, "gi");

                        const strC = "image";               //Add Image Regular expression check ->by jylee 230221                    
                        const regex3 = new RegExp(strC, "gi");

                        let object_id = canvasObjects[i].objects[1].text.substring(1, canvasObjects[i].objects[1].text.length);
                        let object_id_split = object_id.split('_');
                        let checkTypeId = object_id_split[object_id_split.length - 1];
                       
                        //(if (checkTypeId == "image") { )Add Image Regular expression check ->by jylee 230221 
                        if (regex3.test(checkTypeId) == true) {  
                            // Modify wrong position of image ->by jylee 230222
                            let imageComponentJson = {
                                "object_id": "",
                                "drawing_type": "image",
                                "color": "#000000",
                                "thickness": 8,
                                "fill": false,
                                "points": [],
                                'data': ""
                            }      
                            imageComponentJson.object_id = object_id;                            
                            imageComponentJson.points.push(parseInt(canvasObjects[i].left));                            
                            imageComponentJson.points.push(parseInt(canvasObjects[i].top));                       
                            // Add Image width, height position ->by jylee 230228 
                            imageComponentJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));                           
                            imageComponentJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));
                            
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(imageComponentJson)));
    
                        } else if (regex.test(checkTypeId) == true) {
                            qrcodeJson.object_id = object_id;
                            qrcodeJson.drawing_type = "qrcode";
                            qrcodeJson.points = [];
                            qrcodeJson.points.push(parseInt(canvasObjects[i].left));
                            qrcodeJson.points.push(parseInt(canvasObjects[i].top));
                            qrcodeJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));
                            qrcodeJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));
    
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(qrcodeJson)));
                        } else if (regex2.test(checkTypeId) == true) {
                            barcodeJson.object_id = object_id;
                            barcodeJson.drawing_type = "barcode";
                            barcodeJson.points = [];
                            barcodeJson.points.push(parseInt(canvasObjects[i].left));
                            barcodeJson.points.push(parseInt(canvasObjects[i].top));
                            barcodeJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));
                            barcodeJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));
    
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(barcodeJson)));
    
                        } else {
                            componentJson.object_id = object_id;
                            componentJson.color = rgbJSON[canvasObjects[i].objects[1].fill];
                            componentJson.font_size = parseInt(canvasObjects[i].objects[1].fontSize);
                            if (canvasObjects[i].objects[1].fontFamily == "굴림체") {
                                componentJson.font_family == "gulim";
                            } else {
                                componentJson.font_family = canvasObjects[i].objects[1].fontFamily;
                            }
                            componentJson.points = [];
                            componentJson.points.push(parseInt(canvasObjects[i].left));
                            componentJson.points.push(parseInt(canvasObjects[i].top));
                            componentJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));
                            componentJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));
                            componentJson.text_align = canvasObjects[i].objects[1].textAlign;
                            componentJson.vertical_align = canvasObjects[i].objects[1].verticalAlign;
    
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(componentJson)));
                        }
                    }
                }
            }
            else{ //cronus
                for (let i = 0; i < canvasObjects.length; i++) {
                    if(canvasObjects[i].type == "group" && canvasObjects[i].objects[0].type == 'image'){
                        let object_id = canvasObjects[i].objects[0].type;
    
                        imageComponentJson.object_id = object_id;
                        imageComponentJson.points.push(parseInt(canvasObjects[i].left));
                        imageComponentJson.points.push(parseInt(canvasObjects[i].top));
    
                        convertedJson.drawing.push(JSON.parse(JSON.stringify(imageComponentJson)));
    
                    }
                    
                    if (canvasObjects[i].type != "group" || canvasObjects[i].objects[1] == undefined) {
                        continue;
                    }
                    if (canvasObjects[i].type == "group" && canvasObjects[i].objects[1].text.charAt(0) == '$') {
                        const strA = 'QRcode';
                        const straB = "barcode";                        
                        const regex = new RegExp(strA, "gi");
                        const regex2 = new RegExp(straB, "gi");
    
                        const strC = "image";               //Add Image Regular expression check ->by jylee 230221                    
                        const regex3 = new RegExp(strC, "gi");
                       

                        let object_id = canvasObjects[i].objects[1].text.substring(1, canvasObjects[i].objects[1].text.length);
                        let object_id_split = object_id.split('_');
                        let checkTypeId = object_id_split[object_id_split.length - 1];
                      
                        //(if (checkTypeId == "image") { )Add Image Regular expression check ->by jylee 230221 
                        if (regex3.test(checkTypeId) == true) {  
                            // Modify wrong position of image ->by jylee 230222
                            let imageComponentJson = {
                                "object_id": "",
                                "drawing_type": "image",
                                "color": "#000000",
                                "thickness": 8,
                                "fill": false,
                                "points": [],
                                'data': ""
                            }                              
                            imageComponentJson.object_id = object_id;                            
                            imageComponentJson.points.push(parseInt(canvasObjects[i].left));                           
                            imageComponentJson.points.push(parseInt(canvasObjects[i].top));   
                            // Add Image width, height position ->by jylee 230228 
                            imageComponentJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));                           
                            imageComponentJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));                       
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(imageComponentJson)));
                        } 
                        else if (regex.test(checkTypeId) == true) {                            
                            qrcodeJson.object_id = object_id;
                            qrcodeJson.drawing_type = "qrcode";
                            qrcodeJson.points = [];
                            qrcodeJson.points.push(parseInt(canvasObjects[i].left));
                            qrcodeJson.points.push(parseInt(canvasObjects[i].top));
                            qrcodeJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));
                            qrcodeJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));
    
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(qrcodeJson)));
                        } 
                        else if (regex2.test(checkTypeId) == true) {
                            barcodeJson.object_id = object_id;
                            barcodeJson.drawing_type = "barcode";
                            barcodeJson.points = [];
                            barcodeJson.points.push(parseInt(canvasObjects[i].left));
                            barcodeJson.points.push(parseInt(canvasObjects[i].top));
                            barcodeJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));
                            barcodeJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));
    
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(barcodeJson)));
                        } 
                        else {
                            componentJson.object_id = object_id;
                            componentJson.color = rgbJSON[canvasObjects[i].objects[1].fill];
                            componentJson.font_size = parseInt(canvasObjects[i].objects[1].fontSize);
                            if (canvasObjects[i].objects[1].fontFamily == "굴림체") {
                                componentJson.font_family == "gulim";
                            } else {
                                componentJson.font_family = canvasObjects[i].objects[1].fontFamily;
                            }
                            componentJson.points = [];
                            componentJson.points.push(parseInt(canvasObjects[i].left));
                            componentJson.points.push(parseInt(canvasObjects[i].top));
                            componentJson.points.push(parseInt(canvasObjects[i].left) + parseInt(canvasObjects[i].width));
                            componentJson.points.push(parseInt(canvasObjects[i].top) + parseInt(canvasObjects[i].height));
                            componentJson.text_align = canvasObjects[i].objects[1].textAlign;
                            componentJson.vertical_align = canvasObjects[i].objects[1].verticalAlign;
    
                            convertedJson.drawing.push(JSON.parse(JSON.stringify(componentJson)));
                        }
                    }
                }
            }

            if (redObjects.length > 0) {
                options.sendData.imageType = "red";
            } else {
                options.sendData.imageType = "black";
            }

            options.sendData.convertedJson = JSON.stringify(convertedJson);
            ajax(options, function (data) {

                alertPopUp('success', "<%=__('Tag layout saved successfully')%>");      //태그 레이아웃 저장 성공
                loadPage('tag-layout-list', '#right-panel');
            }, function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });

            jsonForImageDrawingServer.push(convertedJson);
        })

        

    } /* End of eventListener */


    // right side bar setting
    let rectFilltype = document.getElementsByName('rectFilltype');
    for (let i = 0; i < rectFilltype.length; i++) {
        rectFilltype[i].addEventListener('change', function (e) {
            if (e.currentTarget.value == 'rectfillcolor') {
                rectBackgroundDiv.classList.remove('d-none');
                popupNotSelectObject();
                if (fabricCanvas.getActiveObject().item != undefined) {
                    fabricCanvas.getActiveObject().item(0).set({
                        fill: "white"
                    })
                } else {
                    fabricCanvas.getActiveObject().set({
                        fill: "white"
                    })
                }
                fabricCanvas.renderAll();
            } else {
                rectBackgroundDiv.classList.add('d-none');
                popupNotSelectObject();
                if (fabricCanvas.getActiveObject().item != undefined) {
                    fabricCanvas.getActiveObject().item(0).set({
                        fill: "transparent",
                        stroke: "black"
                    })
                } else {
                    fabricCanvas.getActiveObject().set({
                        fill: "transparent",
                        stroke: "black"
                    })
                }
                fabricCanvas.renderAll();

            }

            // this._objectStore[this._dbselectObj].data.rectFillType = e.currentTarget.value;
            // this.fabricRectUpdate(this._dbselectObj);
        });
    };


    


    let objImg = document.querySelectorAll("img[name=drawobject]");
    let drawClickFlag = false;

    //Add text style(Bold, Italic, Underline) ->by jylee 23022 
    let fontstyle = document.getElementsByName('fontstyle');
    for (let i = 0; i < fontstyle.length; i++) {
        fontstyle[i].addEventListener('click', function (e) {
            fontstyle[i].classList.toggle('active');
            if (fontstyle[i].id == "font_bold") {
                if (fontstyle[i].classList.contains("active")) {
                    fabricCanvas.getActiveObject().item(1).set({
                        fontWeight: "bold",
                    })
                    fabricCanvas.renderAll();
                } else {
                    fabricCanvas.getActiveObject().item(1).set({
                        fontWeight: "100",
                    })
                    fabricCanvas.renderAll();
                }
            }
            if (fontstyle[i].id == "font_italic") {
                if (fontstyle[i].classList.contains("active")) {
                    fabricCanvas.getActiveObject().item(1).set({
                        fontStyle: "italic",
                    })
                    fabricCanvas.renderAll();
                } else {
                    fabricCanvas.getActiveObject().item(1).set({
                        fontStyle: "normal",
                    })
                    fabricCanvas.renderAll();
                }
            }
            if (fontstyle[i].id == "font_underline") {
                if (fontstyle[i].classList.contains("active")) {
                    fabricCanvas.getActiveObject().item(1).set({
                        underline: true,
                    })
                    fabricCanvas.renderAll();
                } else {
                    fabricCanvas.getActiveObject().item(1).set({
                        underline: false,
                    })
                    fabricCanvas.renderAll();
                }
            }
        })
    }
    let textAlignBtn = document.getElementsByName('textAlignBtn');
    for (let i = 0; i < textAlignBtn.length; i++) {
        textAlignBtn[i].addEventListener('click', function (e) {
            popupNotSelectObject();
            let num = fabricCanvas.getObjects().indexOf(fabricCanvas.getActiveObject())
            let group = fabricCanvas._objects[num];

            for (let i = 0; i < textAlignBtn.length; i++) {
                textAlignBtn[i].classList.remove('active');
            }

            if (e.currentTarget.id == "left") {
                group.item(1).set({
                    // left : - group.item(0).width * 0.5 + group.item(1).width *0.5,
                    textAlign: "left"
                });
            } else if (e.currentTarget.id == "center") {

                group.item(1).set({
                    // left : 0,
                    textAlign: "center"
                });
            } else if (e.currentTarget.id == "right") {
                group.item(1).set({
                    // left : group.item(0).width * 0.5 - group.item(1).width *0.5 - 2,
                    textAlign: "right"
                });
            }
            textAlignBtn[i].classList.toggle('active');

            fabricCanvas.renderAll();



        })
    }
    let textverticalAlignBtn = document.getElementsByName('textverticalAlignBtn');
    for (let i = 0; i < textverticalAlignBtn.length; i++) {
        textverticalAlignBtn[i].addEventListener('click', function (e) {
            popupNotSelectObject();
            let num = fabricCanvas.getObjects().indexOf(fabricCanvas.getActiveObject())
            let group = fabricCanvas._objects[num];

            for (let i = 0; i < textverticalAlignBtn.length; i++) {
                textverticalAlignBtn[i].classList.remove('active');
            }

            if (e.currentTarget.id == "top") {
                group.item(1).set({
                    top: -group.item(0).height * group.item(0).scaleY * 0.5 + group.item(1).height * group.item(1).scaleY * 0.5,
                });
                group.item(1).verticalAlign = "top";
            } else if (e.currentTarget.id == "middle") {
                group.item(1).set({
                    top: 0,
                });
                group.item(1).verticalAlign = "middle";

            } else if (e.currentTarget.id == "bottom") {
                group.item(1).set({
                    top: group.item(0).height * group.item(0).scaleY * 0.5 - group.item(1).height * group.item(1).scaleY * 0.5,
                });
                group.item(1).verticalAlign = "bottom";

            }
            textverticalAlignBtn[i].classList.toggle('active');
            fabricCanvas.renderAll();

        })
    }

    eventListener();

    
})
