$(document).ready(function() { 

    
    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("tag-register-front-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    let initField;
    let jsonForImageDrawingServer = [];
    let selectedConvertedJson = [];

    const addAction = (a,list) => {
        let id = "#tb"+a;
        let data = $(id+" tr:eq(1)").clone(true).appendTo(id);

        data.find("input[name='collectionDataName']").val(list[0]);
        data.find("input[name='collectionDataKey']").val(list[1]);
        data.find("input[name='collectionDataUnit']").val(list[2]);
        data.find("select[name='collectionDataType']").val(list[3]);
        data.find("select[name='collectionDataPeriodType']").val(list[4]);
    }
    
    const smartTagTypeChange = (flag) =>{
        if(flag!=="first"){
            $("#tbCollection tr:gt(1)").remove();   //gt(1) : 1 이상
        }
        // $('.remove').click();
        let tagType = document.getElementById('smartTagType');
        let selectedTagType = tagType.options[tagType.selectedIndex].value;
        for(let i = 0 ; i < Object.keys(thingType[selectedTagType]).length; i++){
            addAction("Collection",Object.values(thingType[selectedTagType])[i])
        }
        tagThingIdChange();

        // for(let i = 0 ; i < Object.keys(thingType[selectedTagType]).length; i++){
        //     let key = Object.keys(thingType[selectedTagType])[i];
        //     let val = Object.values(thingType[selectedTagType])[i];
        //     addAction("Collection",key,val);
        // }
        if($('.collectionData').length == 1){
            let data = $("#tbCollection tr:eq(1)").clone(true).appendTo("#tbCollection");
            data.find("input[name='collectionDataName']").val("");
            data.find("input[name='collectionDataKey']").val((""));
            data.find("input[name='collectionDataUnit']").val((""));
        }
        $('.collectionData:eq(0)').remove();

    }

    const tagThingIdChange = () => {
        let tagProduct = document.getElementById('smartTagProduct');
        let selectedTagProduct = tagProduct.options[tagProduct.selectedIndex].value;
        let tagType = document.getElementById('smartTagType');
        let selectedTagType = tagType.options[tagType.selectedIndex].value;
        let tagBattType = document.getElementById('smartTagBattType');
        let selectedtagBattType = tagBattType.options[tagBattType.selectedIndex].value;

        if(selectedTagProduct == "Cronus"){
            tagThingId.value = "C" + selectedTagType + "_" + tagSerialNumber.value;    
        }
        else {
            tagThingId.value = selectedTagType +  "_" + tagSerialNumber.value;

        }

    }

    const locationInfo = () => {
        $('#tagRegisterModal').modal('show');
        loadLocation("", "#tagLocationBody");

        document.getElementById("selectLocationBtn").addEventListener("click", function(e){
            let tagLocation = document.getElementById("tagLocation");
            if(selectedLocaion.title == undefined || selectedLocaion.key == undefined){
                alertPopUp("error","<%=__('Please select a location')%>");            //location을 선택하세요.");
                return;
            }
            tagLocation.value = selectedLocaion.title;
            //console.log("tagLocation.value : " + tagLocation.value);
            tagLocation.placeholder = selectedLocaion.key;
            //console.log("ttagLocation.placeholder : " + tagLocation.placeholder);
        },{ passive: true })
    }

/*
    const getSerialNo = async (strSerialNo) => {

       
        let url = new URL( '<%=global.config.apiServerUrl%>/tag-register/check-serialno');
        let parameter = {
            "serialNumber" : strSerialNo
        }

        const response = await fetch(url, {
            method: 'post',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify(parameter)
        }).then(function (response) {            
                return true;
        }).catch(error => {
          
                return false;
        });
    }
        

*/





/*
        const response = await fetch('<%=global.config.apiServerUrl%>/tag-register/check-serialno')
        if (response.status === 200) {
          const data = await response.json()
          const country = data.find((country) => country.alpha2Code === countryCode)
          return country.currencies[0].code
        } else {
          throw new Error('Unable to get the currency code')
        }*/
      //}

      /*
    const chkSerialNumber = () => {

        let serialNo = document.getElementById('tagSerialNumber').value;

        let options = {
            url:"<%=global.config.apiServerUrl%>/tag-register/check-serialno",
            headers: {
            'Content-Type': "application/json",
            },
            type:"post",
            async : false, 
            sendData: {
            "serialNumber" : serialNo
            }
        };
            
        ajax(options, function(data){
            
                                
            }, function(error){
                //console.error("<%=global.config.apiServerUrl%>/tag-register/check-serialno:[error]" +error);
                alertPopUp("error", "<%=__('Serial number already exists')%>");
                document.getElementById('tagSerialNumber').focus();
                return;
            
        })

    }
    */


    const getTagLayoutList = () => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-editor/layout-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                // fontUrl:url
            }
        };

        ajax(options, function (data) {

            let tagLayoutList = data.data.tagLayoutList;
            let bodyHtml = "";

            if(tagLayoutList.length == 0 ){
                let selectLayout = document.getElementsByName("selectLayout");
                for (let i = 0; i < selectLayout.length; i++) {
                    const element = selectLayout[i];
                    element.addEventListener('click',() => {
                        alertPopUp("error","<%=__('No Tag Layout created')%>");           //생성된 Tag Layout이 없습니다.");
                    },{ passive: true })
                }
            }
            tagLayoutList.map(function (params) {
                let canvas = new fabric.Canvas();
                switch(params.tag_size){
                    case "2_9":
                        canvas.setWidth(296);
                        canvas.setHeight(128);
                        break;
        
                    case "4_2":
                        canvas.setWidth(400);
                        canvas.setHeight(300);
                        break;
                    case "7_5":
                        canvas.setWidth(800);
                        canvas.setHeight(400);
                        break;
                    case "10_2":
                        canvas.setWidth(960);
                        canvas.setHeight(640);
                        break;    
                }
                canvas.renderAll();
                let tag_preview = document.getElementsByName('tag_preview');
                canvas.loadFromJSON(params.tag_info_json, function () {
                    bodyHtml = "";
                    bodyHtml += '<tr >';
                    bodyHtml += '   <td class="flex" style="height:128px;">'
                    // bodyHtml += '       <div class="custom-control custom-checkbox" style="cursor:pointer">'
                    // bodyHtml += '       <input type="checkbox" class="custom-control-input" id="tagListCheck' + params.idx + '" >'
                    // bodyHtml += '       <label class="custom-control-label" for="tagListCheck' + params.idx + '" style="cursor:pointer"></label>'
                    // bodyHtml += '         </div>'
                    bodyHtml += '       <a href="javascript:void(0);" style="font-size:18px;" name="addTagLayout" id="addTagLayout_'+params.idx+'">'
                    bodyHtml += '       <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#679897" class="bi bi-file-plus" viewBox="0 0 16 16">';
                    bodyHtml += '       <path d="M8.5 6a.5.5 0 0 0-1 0v1.5H6a.5.5 0 0 0 0 1h1.5V10a.5.5 0 0 0 1 0V8.5H10a.5.5 0 0 0 0-1H8.5V6z"/>';
                    bodyHtml += '       <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>';
                    bodyHtml += '       </svg></a>';
                    bodyHtml += '   </td>'
                    bodyHtml += '   <td ><img class="border border-dark" name="tag_preview" style="width:296px; height:128px;" id ="tag_preview_' + params.idx + '" src ="'+canvas.toDataURL()+'"></img></td>';
                    bodyHtml += "   <td id ='tag_layout_name_" + params.idx + "'>" + params.tag_layout_name + "</td>";
                    bodyHtml += '   <td id ="tag_size_' + params.idx + '">' + params.tag_size + "</td>";
                    bodyHtml += '   <td class="d-none" id ="image_name_' + params.idx + '">' + params.tag_image_file_name + "</td>";
                    bodyHtml += '   <td class="d-none" id ="image_type_' + params.idx + '">' + params.image_type + "</td>";
                    bodyHtml += '</tr>';

                    tagLayoutLsistBody.innerHTML += bodyHtml;

                    let canvasObjects = canvas.toJSON().objects;
                    let convertedJson = {
                        //mysql medium text로 저장
                        "drawing": [
                         
                        ]
                    }
                    let componentJson =  {
                        "object_id": "",
                        "drawing_type": "typing",
                        "color": "#000000",
                        "thickness": 1,   //text일때 1로 고정
                        "fill": false, 
                        "points": [    //영점은 left top 2포인트, 이외에는 4포인트
                         
                        ],
                        "font_family": "gulim",
                        "font_size": 16,
                        "text": "",
                        "text_align": "top",
                        "vertical_align": "left"
                    }
                    let qrcodeJson =  {
                        "object_id": "",
                        "drawing_type": "qrcode",
                        "color": "#000000",
                        "thickness": 1,   //text일때 1로 고정
                        "fill": false, 
                        "points": [    //영점은 left top 2포인트, 이외에는 4포인트
                         
                        ],
                        "font_family": "gulim",
                        "font_size": 16,
                        "text": "",
                        "text_align": "center",
                        "vertical_align": "middle"
                    }
                    let barcodeJson =  {
                        "object_id": "",
                        "drawing_type": "barcode",
                        "color": "#000000",
                        "thickness": 1,   //text일때 1로 고정
                        "fill": false, 
                        "points": [    //영점은 left top 2포인트, 이외에는 4포인트
                         
                        ],
                        "font_family": "gulim",
                        "font_size": 16,
                        "text": "",
                        "text_align": "center",
                        "vertical_align": "middle"
                    }
                    let imageComponentJson =
                    {
                        "object_id": "",
                        "drawing_type": "image",
                        "color": "#000000",
                        "thickness": 8,
                        "fill": false,
                        "points": [
                        ],
                        'data':""
                    }
        
                    let rgbJSON = {
                        "RED" : "#FF0000",
                        "red" : "#FF0000",
                        "rgb(255,0,0)" : "#FF0000",
                        "RGB(255,0,0)" : "#FF0000",
                        "white" : "#FFFFFF",
                        "WHITE" : "#FFFFFF",
                        "rgb(255,255,255)" : "#FFFFFF",
                        "RGB(255,255,255)" : "#FFFFFF",
                        "BLACK" : "#000000",
                        "black" : "#000000",
                        "rgb(0,0,0)" : "#000000",
                        "RGB(0,0,0)" : "#000000",
                    }
        
                    for(let i =0 ; i < canvasObjects.length; i++){

                        if(canvasObjects[i].type != "group" || canvasObjects[i].objects[1]==undefined){continue;}
                        if(canvasObjects[i].type == "group" && canvasObjects[i].objects[1].text.charAt(0) == '$'){
                            const strA = 'QRcode';
                            const straB = "barcode";
                            const regex = new RegExp(strA, "gi");
                            const regex2 = new RegExp(straB,"gi");

                            const strC = "image";               //Add Image Regular expression check ->by jylee 230221                    
                            const regex3 = new RegExp(strC, "gi");    

                            let object_id = canvasObjects[i].objects[1].text.substring(1,canvasObjects[i].objects[1].text.length);
                            let object_id_split = object_id.split('_');
                            let checkTypeId = object_id_split[object_id_split.length-1];
                               
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
                    jsonForImageDrawingServer.push(convertedJson);
                    

                    let selectLayout = document.getElementsByName("selectLayout");
                    for (let i = 0; i < selectLayout.length; i++) {
                        const element = selectLayout[i];

                        element.addEventListener('click',() => {
                            $('#taglayoutListModal').modal('show');
                            $('#pageLayoutNumber').text(i+1);
                        },{ passive: true })
                    }


                    let addTagLayout = document.getElementsByName("addTagLayout");
                    for (let i = 0; i < addTagLayout.length; i++) {
                        const element = addTagLayout[i];
                        element.addEventListener('click',() => {
                            selectedConvertedJson[$('#pageLayoutNumber').text()-1] = jsonForImageDrawingServer[i];
                            $('#taglayoutListModal').modal('hide');
                            let src = document.getElementById('tag_preview_'+element.id.split("_")[1]).src;
                            let tag_image_file_name = document.getElementById('image_name_'+element.id.split("_")[1]).innerText;
                            let imageType = document.getElementById('image_type_'+element.id.split("_")[1]).innerText;

                            let pageNumber = $('#pageLayoutNumber').text();
                            $('#selectedLayout_'+pageNumber+' > img').remove();
                            $('#selectedLayout_'+pageNumber+' > input').remove();
                            $('#selectedLayout_'+pageNumber).append('<img class="border border-dark" style="width:296px; height:128px;" src="'+src+'"></img><input type="hidden" id="imageType_'+pageNumber+'" name="imageType" value = '+imageType+'><input type="hidden" id="imageName_'+pageNumber+'" name="imageName" value = '+tag_image_file_name+'>');

                        },{ passive: true })
                    }


                    // Add remove(tagRemoveBtn) template on tag page ->by jylee 230331 
                    let selectLayout_Remove = document.getElementsByName("selectLayout_Remove");
                    //console.log("selectLayout_Remove length : " + selectLayout_Remove.length)
                    for (let i = 0; i < selectLayout_Remove.length; i++) {
                       
                        selectLayout_Remove[i].addEventListener('click', function (e) {  // idx == smart_tag_info
                           
                            let pageNumber =  (i+1);
                            console.log("### pageNumber :" +pageNumber);
                            $('#selectedLayout_' + pageNumber + ' > img').remove();
                            $('#selectedLayout_' + pageNumber + ' > input').remove();
                            //data.data.tagLayoutList[pageNumber].tag_info_json = "";
                            selectedConvertedJson[i] = "";
                            //data.data.tagLayoutList[i].tag_image_file_name = "";
                        })
                       
                    }
                })
            })
        } , function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

    }

   
    let massRegistInfoToKanaban = (tagThingId,tagType,tagSize,tagBatteryType,tagLocation ) => {

        //Add save image location ->by jylee 230214   
        let image_name_0_loc ="";
        let image_0 = "";   

        if(tagSize == "2.9") {               
            image_name_0_loc = "/resource/tagBackground/BLANK_2.9.png";
            image_0 = "BLANK_2.9.png";
        }
        else if (tagSize == "4.2") {   
            image_name_0_loc = "/resource/tagBackground/BLANK_4.2.png";
            image_0 = "BLANK_4.2.png";
        }
        else {
            if(tagSize == "10.2"){                
                image_name_0_loc = "/resource/tagBackground/BLANK_10.2.png";
                image_0 = "BLANK_10.2.png";
            }
        }

        let bodyJson = {
            "tid" : Math.random().toString(36).substr(2, 11),                        
            "eventTime" : moment(new Date().getTime()).format('YYYY-MM-DD hh:mm:ss'),
            "thingid" : tagThingId,
            "tagKind" : tagType,
            "tagSize" : tagSize,                   
            "batteryType" : tagBatteryType,  
            "buttonSu" : "2",  
            "pageSu" : "5",             // default fixed : the number of page su is 5
            "locationCd" : tagLocation,
            "currentPage" : "0",        // When tag is registered at first, current page is 0
            "templateList" : [
                {"templateName0":image_0, "templateLoc0": image_name_0_loc, "pageNb":"0"},
                {"templateName1":"", "templateLoc1": "", "pageNb":"1"},
                {"templateName2":"", "templateLoc2": "", "pageNb":"2"},
                {"templateName3":"", "templateLoc3": "", "pageNb":"3"},
                {"templateName4":"", "templateLoc4": "", "pageNb":"4"},
                {"templateName5":"", "templateLoc5": "", "pageNb":"5"}
                ],                                            
            "status" : "create"   
        }
        //console.log("### Send : thingid " + tagThingId.value);                    
        mqttClient.publish("/thingid", JSON.stringify(bodyJson)); // test

    }    

    let tagInitToImgServer = (tagThingId) => {

        let options = "";
        imageServerUrl = "<%=global.config.sendImageServerUrl%>/init_image/" + tagThingId;
        options = {
            url: imageServerUrl,    //전이사님 image process server 전송
            headers: {
                'Content-Type': "application/x-www-form-urlencoded",
                //'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                //'Upgrade-Insecure-Requests': "1",
                'Access-Control-Allow-Origin' : "*"
            },
            type: "post",
            sendData: {}
        };
                
        //console.log("####>>>send init tag : " + imageServerUrl);  // by jylee
        
        ajax(options, function (data) {                        
        } , function (error) {
            //alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

    }    

     const uploadExcel = () => {
      
        var tagoForm = new FormData();
        var inputFile = document.getElementById("file");    //upload file 객체

        var upFiles = inputFile.files[0];                  
       
        tagoForm.append("file", upFiles);                    //upload file객체 담기
            
        let options = {
            url:"<%=global.config.apiServerUrl%>/tag-register/mass-register",
                type: "post",
                data: tagoForm,
                enctype: 'multipart/form-data',
                cache: false,
                processData: false,
                contentType: false,
            }

            $.ajax({
                url:"<%=global.config.apiServerUrl%>/tag-register/mass-register",
                type: "post",
                data: tagoForm,
                enctype: 'multipart/form-data',
                cache: false,
                processData: false,
                contentType: false,  
            }).done(function (response) {

                inputFile.value = "";
                
                let noticeMsg =  "<%=__('Bulk registration has been saved')%>";

                if ( response.data.length > 0 ){
                    let serialNo ="";
                    for ( let i = 0; i < response.data.length ; i++){
                        serialNo += response.data[i] +",";
                    }
                    noticeMsg += "\n<%=__('The serial number below has been excluded as a duplicate')%>\n"+serialNo;
                }

                alertPopUp('success', noticeMsg);
 
            }).fail(function (jqXHR, exception) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });
            
            // Add function : send regist message and init to (Kanban) server in mass registration ->by jylee 230428
            const myForm = document.getElementById("myForm");
            const csvFile = document.getElementById("csvFile");

            function csvToArray(str, delimiter = ",") {

                // slice from start of text to the first \n index
                // use split to create an array from string by delimiter
                const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

                // slice from \n index + 1 to the end of the text
                // use split to create an array of each csv value row
                const rows = str.slice(str.indexOf("\n") + 1).split("\n");

                // Map the rows
                // split values from each row into an array
                // use headers.reduce to create an object
                // object properties derived from headers:values
                // the object passed as an element of the array
                const arr = rows.map(function (row) {
                    const values = row.split(delimiter);
                    const el = headers.reduce(function (object, header, index) {
                    object[header] = values[index];
                    return object;
                    }, {});
                    return el;
                });

                // return the array
                return arr;
            }
            
            const reader = new FileReader();

            reader.onload = function (e) {
                const text = e.target.result;
                const data = csvToArray(text);
                //document.write(JSON.stringify(data));
                //console.log(JSON.stringify(data));
                //console.log("## data.length : " + data.length);

                for (var i = 0, l = (data.length-1); i < l; i++) {
                    let keys = Object.keys(data[i]);
                    let tagType = "";
                    let tagSerialNumber = "";
                    let tagMfr = "";
                    let tagSize = "";
                    let tagThirdParty = "";
                    let tagBatteryType = "";
                    let tagLocation = "";
                    let tagThingId = "";

                    //console.log("## keys.length : " + keys.length);
                    for (var j = 0, k = keys.length; j < k; j++) {
                      //console.log("Key:" + keys[j] + "  Value:" + data[i][keys[j]]); //for debug by jylee

                      /* Send e-Paper Creation Message to Kanban */
                        if(keys[j] == "THIRD_PARTY_TYPE") {                           
                            tagThirdParty = data[i][keys[j]];
                        }                           
                        if(keys[j] == "TAG_MFR") {                           
                            tagMfr = data[i][keys[j]];
                        }
                        if(keys[j] == "TAG_TYPE") {                           
                            tagType = data[i][keys[j]];
                        }
                        if(keys[j] == "TAG_SIZE") {                            
                            tagSize = data[i][keys[j]];
                        }
                        if(keys[j] == "TAG_SERIAL_NUMBER") {                          
                            tagSerialNumber = data[i][keys[j]];
                        }
                        if(keys[j] == "TAG_BATT_TYPE") {                            
                            tagBatteryType = data[i][keys[j]];
                        }
                        if(keys[j] == "TAG_LOCATION") {                           
                            tagLocation = data[i][keys[j]];
                        }

                        if(tagMfr == "Cronus"){
                            tagThingId = "C" + tagType + "_" + tagSerialNumber;    
                            //console.log("massRegist tagThingId: %s",tagThingId);
                        }
                        else {
                            tagThingId = tagType + "_" + tagSerialNumber;    
                            //console.log("massRegist tagThingId: %s",tagThingId);                
                        }
                        
                    }
                    massRegistInfoToKanaban(tagThingId,tagType,tagSize,tagBatteryType,tagLocation);
                    // after some delay
                    /* Send e-Paper init image Message to Server */
                    tagInitToImgServer(tagThingId);
                }
            };
            
            reader.readAsText(upFiles);

    }

    const eventListener = () =>{
        // initField =  $("#tbCollection tr:eq(1)").clone(true);
        for(let j = 0 ; j < Object.keys(thingType).length ; j++){
            let val = Object.keys(thingType)[j];
            let opt = undefined;

            opt = document.createElement('option');
            opt.value = val;
            opt.innerHTML = val;
            
            if( opt != undefined ) {
                document.getElementById('smartTagType').appendChild(opt);                            
            }
        }

        let tagProduct = document.getElementById('smartTagProduct');
        let selectedTagProduct = tagProduct.options[tagProduct.selectedIndex].value;
        let tagSize = document.getElementById('smartTagSize');
        let selectedTagSize = tagSize.options[tagSize.selectedIndex].value;
        // Add tag battery type : Rechargable, coincell type ->by jylee 230327
        let tagBattType= document.getElementById('smartTagBattType');
        let selectedtagBattType = tagBattType.options[tagBattType.selectedIndex].value;
       
        tagProduct.addEventListener('change', function(e){
            tagThingIdChange();
        },{ passive: true })

        tagSize.addEventListener('change', function(e){
            selectedTagSize = tagSize.options[tagSize.selectedIndex].value;
        },{ passive: true })
        
         // Add tag battery type : Rechargable, coincell type ->by jylee 230327
         tagBattType.addEventListener('change', function(e){
            selectedtagBattType = tagBattType.options[tagBattType.selectedIndex].value;
            //tagThingIdChange();
        },{ passive: true })
        
        smartTagTypeChange("first");
        smartTagType.addEventListener('change',function(e){           
            smartTagTypeChange(selectedTagProduct);
        },{ passive: true })
    
        tagSerialNumber.addEventListener('keyup',function(e){            
            tagThingIdChange();
        },{ passive: true })

        tagWakeupPrd.addEventListener('keyup',function(e){
            let regexp = /^[0-9]*$/;

            if(!regexp.test(tagWakeupPrd.value)){
                alertPopUp('error',"<%=__('You can only enter numbers')%>");          //숫자만 입력 가능합니다.")
                tagWakeupPrd.value = tagWakeupPrd.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            }
        },{ passive: true })

        $(document).on('click', '.remove', function() {
            let trIndex = $(this).closest("tr").index();
            if(trIndex>0) {
                $(this).closest("tr").remove();
            }
        });
        $('#addMoreCollection').on('click', function() {
            let trIndex = $('#tbCollection tr').length;
            if(trIndex==1){
                initField.appendTo("#tbCollection")

            }
            else{
                addAction("Collection","");
            }
        });
        $('#addMoreCommand').on('click', function() {
            addAction("Command","");
        });

        let current_fs, next_fs, previous_fs;
        let left, opacity, scale;
        let animating;

        //getTagLayoutList();


        $(".next").click(function () {

            let thisObject = $(this);
            let serialNo = document.getElementById('tagSerialNumber').value;

            let options = {
                url:"<%=global.config.apiServerUrl%>/tag-register/check-serialno",
                headers: {
                'Content-Type': "application/json",
                },
                type:"post",
                async : false, 
                sendData: {
                "serialNumber" : serialNo
                }
            };
                
            ajax(options, function(data){
                
                let jsonResult = data.data;
                
                if ( jsonResult > 0 ){  //중복이 존재할 경우
                    alertPopUp("error", "<%=__('Serial number already exists')%>");
                    document.getElementById('tagSerialNumber').focus();
                    animating = false;
                    return;
                   
                }else{
                       // 정상적으로 응답 받았을 경우 파라미터는 응답 바디, 응답 코드 그리고 XHR 헤더
                    
                        let flag = -1;
                        let allDataClass = document.querySelectorAll('.allData');
                        for(let i = 0; i<progressbar.children.length; i++){
                            if(progressbar.children[i].classList.contains("active")){
                                flag = i;
                            };
                        }

                        if(document.getElementById('tagName').value == ""){
                            alertPopUp("error","<%=__('Smart Tag Name: Required input information')%>");          //스마트태그 이름 : 필수 입력 정보입니다.");
                            document.getElementById('tagName').focus();
                            return;
                        }
                        if(document.getElementById('tagSerialNumber').value == ""){
                            alertPopUp("error","<%=__('Serial number: Required input')%>");               //시리얼 넘버 : 필수 입력 정보입니다.");
                            document.getElementById('tagSerialNumber').focus();
                            return;
                        }
                        if(document.getElementById('tagLocation').value == "" || document.getElementById('tagLocation').value == undefined){
                            alertPopUp("error","<%=__('Location Information: Required input information')%>");        //위치 정보 : 필수 입력 정보입니다.");
                            //document.getElementById('tagName').focus();
                            return;
                        }

                        let collectionClass = document.querySelectorAll('.collectionData');
                        let commandClass = document.querySelectorAll('.commandData');
                        
                        for(let i =0; i<collectionClass.length; i++){
                            let data1 = collectionClass[i];                            
                            let data2;
                            for(let j =0; j<data1.children.length; j++){
                                data2 = data1.children[j].children[0];
                                data2.style.borderColor = '#ccc';

                            }
                            // Modify length (data1.children.length) > (data1.children.length -1) ->by jylee 230429 
                            for(let j =0; j<(data1.children.length -1); j++){
                                data2 = data1.children[j].children[0];       
                               
                                if(flag===1){name
                                    if(data2.nodeType === 1){
                                        let value = data2.value;                                       
                                        if(value===""){
                                            alertPopUp('error',data2.placeholder + " : <%=__('Required field')%>");           //필수 입력 필드입니다.")

                                            data2.style.borderColor = '#ff646d';
                                            data2.focus();
                                            return;
                                        }
                                    }
                                    else if (data2.nodeType === 3){
                                        let value = data2[data2.selectedIndex].value;
                                       
                                        if(value===""){
                                            alertPopUp('error',data2.placeholder + " : <%=__('Required field')%>");           //필수 입력 필드입니다.")

                                            data2.style.borderColor = '#ff646d';
                                            data2.focus();
                                            return;
                                        }
                                    }
                                }
                            }
                        }


                        // for(let i =0; i<commandClass.length; i++){
                        //     let data1 = commandClass[i];
                        //     let data2;
                        //     for(let j =0; j<data1.children.length; j++){
                        //         data2 = data1.children[j].children[0];
                        //         data2.style.borderColor = '#ccc';

                        //     }
                        //     for(let j =0; j<data1.children.length; j++){
                        //         data2 = data1.children[j].children[0];
                        //         if(flag===2){
                        //             if(data2.nodeType === 1){
                        //                 let value = data2.value;
                        //                 if(value===""){
                        //                     alertPopUp('error',data2.placeholder + " : 필수 입력 필드입니다.")

                        //                     data2.style.borderColor = '#ff646d';
                        //                     data2.focus();
                        //                     return;
                        //                 }
                        //             }
                        //             else if (data2.nodeType === 3){
                        //                 let value = data2[data2.selectedIndex].value;
                        //                 if(value===""){
                        //                     alertPopUp('error',data2.placeholder + " : 필수 입력 필드입니다.")

                        //                     data2.style.borderColor = '#ff646d';
                        //                     data2.focus();
                        //                     return;
                        //                 }
                        //             }
                        //         }
                        //     }
                        // }

                        if (animating) return false;
                        animating = true;

                        current_fs = thisObject.parent();
                        next_fs = thisObject.parent().next();
                        $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

                        next_fs.show();
                        current_fs.animate({ opacity: 0 }, {
                            step: function (now, mx) {
                                scale = 1 - (1 - now) * 0.2;
                                left = (now * 50) + "%";
                                opacity = 1 - now;
                                current_fs.css({
                                    'transform': 'scale(' + scale + ')',
                                    'position': 'absolute'
                                });
                                next_fs.css({ 'left': left, 'opacity': opacity });
                                window.scrollTo(0, 0);
                            },
                            duration: 400,
                            complete: function () {
                                current_fs.hide();
                                animating = false;
                            },
                            easing: 'easeInOutBack'
                        });
                        
                        //속도 때문에 next 를 누를 경우 호출하도록 수정
                        setTimeout(()=>{getTagLayoutList()},1);
                            

                }

                //alertPopUp('success',"Tag registration completed");
            } , function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
                return;
            });
        });

        $(".cancel").click(function () {
            loadPage("tag-register","#right-panel");
        })

        $(".previous").click(function () {
            if (animating) return false;
            animating = true;

            current_fs = $(this).parent();
            previous_fs = $(this).parent().prev();

            $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

            previous_fs.show();
            current_fs.animate({ opacity: 0 }, {
                step: function (now, mx) {
                    scale = 0.8 + (1 - now) * 0.2;
                    left = ((1 - now) * 50) + "%";
                    opacity = 1 - now;
                    current_fs.css({ 'left': left });
                    previous_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity, 'position': 'absolute' });
                    window.scrollTo(0, 0);
                },
                duration: 400,
                complete: function () {
                    current_fs.hide();
                    animating = false;
                },
                easing: 'easeInOutBack'
            });
            (() => {
                current_fs.animate({ opacity: 0 }, {
                    step: function (now, mx) {
                        previous_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity, 'position': 'relative' });
                    },
                });
            })();
        });

        $(".submit").click(function () {
         
            let insertData = {
                "commonData":{},
                "collectionData":{},
                // "commandData":{}
            }

            let commonData = {};
            let collectionData = {};
            let commandData = {};

            commonData.tagName = tagName.value;
            commonData.tagThingId = tagThingId.value;
            commonData.tagType = smartTagType.value;
            commonData.tagSerialNumber = tagSerialNumber.value;
            commonData.tagLocation = tagLocation.placeholder;
            commonData.tagMfr = tagProduct.value;
            commonData.tagSize = tagSize.value;
            commonData.tagWakeupPrd = tagWakeupPrd.value;
            // Add tag battery type : Rechargable, coincell type ->by jylee 230327
            if(tagBattType.value === "Rechargable")
                commonData.tagBattType = "R";
            else    // CoinCell type
                commonData.tagBattType = "C";    

            let image_0 = "";    
            let image_1 = "";
            let image_2 = "";
            let image_3 = "";    
            // Add Templage Page 3 to 5 ->by jylee 230327 
            let image_4 = "";
            let image_5 = "";        
            // Add template location path ->by jylee 230220
            let image_name_0_loc = "";
            let image_name_1_loc = "";
            let image_name_2_loc = "";
            let image_name_3_loc = "";
            let image_name_4_loc = "";
            let image_name_5_loc = "";

            let image_type_1 = "black";
            let image_type_2 = "black";
            let image_type_3 = "black";
            let image_type_4 = "black";
            let image_type_5 = "black";

            let imageName_1 = document.getElementById('imageName_1');
            let imageName_2 = document.getElementById('imageName_2');
            let imageName_3 = document.getElementById('imageName_3');
            let imageName_4 = document.getElementById('imageName_4');
            let imageName_5 = document.getElementById('imageName_5');

            if(imageName_1 != undefined){
                image_1 = imageName_1.value;
            }
            if(imageName_2 != undefined){
                image_2 = imageName_2.value;
            }
            if(imageName_3 != undefined){
                image_3 = imageName_3.value;
            }
            if(imageName_4 != undefined){
                image_4 = imageName_4.value;
            }
            if(imageName_5 != undefined){
                image_5 = imageName_5.value;
            }

            if (document.getElementById('imageType_1') != undefined) {
                image_type_1 = document.getElementById('imageType_1').value;
            }
            if (document.getElementById('imageType_2') != undefined) {
                image_type_2 = document.getElementById('imageType_2').value;
            }
            if (document.getElementById('imageType_3') != undefined) {
                image_type_3 = document.getElementById('imageType_3').value;
            }
            if (document.getElementById('imageType_4') != undefined) {
                image_type_4 = document.getElementById('imageType_4').value;
            }
            if (document.getElementById('imageType_5') != undefined) {
                image_type_5 = document.getElementById('imageType_5').value;
            }

            // commonData.image_path_1 = backgroundImagePath+'/resource/tagBackGround/'+image_1;
            // commonData.image_path_2 = backgroundImagePath+'/resource/tagBackGround/'+image_2;
            // commonData.image_path_3 = backgroundImagePath+'/resource/tagBackGround/'+image_3;

            commonData.image_path = '<%=global.config.backgroundImagePath%>';

            commonData.image_name_1 = image_1;
            commonData.image_name_2 = image_2;
            commonData.image_name_3 = image_3;
            commonData.image_name_4 = image_4;
            commonData.image_name_5 = image_5;
            commonData.thirdPartyType = thirdParty.options[thirdParty.selectedIndex].value;
            //console.log("template image file name1 : " + image_1);
            //console.log("template image file name2 : " + image_2);
            //console.log("template image file name4 : " + image_4);
            //console.log("template image file name5 : " + image_5);
            
            //Add save image location ->by jylee 230214        
            if(tagSize.value == "2.9") {               
                image_name_0_loc = "/resource/tagBackground/BLANK_2.9.png";
                image_0 = "BLANK_2.9.png";
            }
            else if (tagSize.value == "4.2") {   
                image_name_0_loc = "/resource/tagBackground/BLANK_4.2.png";
                image_0 = "BLANK_4.2.png";
            }
            else {
                if(tagSize.value == "10.2"){                
                    image_name_0_loc = "/resource/tagBackground/BLANK_10.2.png";
                    image_0 = "BLANK_10.2.png";
                }
            }

            if(commonData.image_name_1 == "")
                image_name_1_loc = "";
            else 
                image_name_1_loc = "/resource/tagBackground/"+commonData.image_name_1;
            if(commonData.image_name_2 == "")
                image_name_2_loc = "";   
            else
                image_name_2_loc = "/resource/tagBackground/"+commonData.image_name_2;   
            if(commonData.image_name_3 == "")
                image_name_3_loc = "";  
            else
                image_name_3_loc = "/resource/tagBackground/"+commonData.image_name_3;        
            if(commonData.image_name_4 == "")
                image_name_4_loc = "";  
            else
                image_name_4_loc = "/resource/tagBackground/"+commonData.image_name_4;  
            if(commonData.image_name_5 == "")
                image_name_5_loc = "";  
            else
                image_name_5_loc = "/resource/tagBackground/"+commonData.image_name_5;  

            

            let tagInfoJson1 = "";
            let tagInfoJson2 = "";
            let tagInfoJson3 = "";
            let tagInfoJson4 = "";
            let tagInfoJson5 = "";

            if(selectedConvertedJson[0]!=undefined){
                tagInfoJson1 = JSON.stringify(selectedConvertedJson[0]);
            }
            if(selectedConvertedJson[1]!=undefined){
                tagInfoJson2 = JSON.stringify(selectedConvertedJson[1]);
            }
            if(selectedConvertedJson[2]!=undefined){
                tagInfoJson3 = JSON.stringify(selectedConvertedJson[2]);
            }

            if(selectedConvertedJson[3]!=undefined){
                tagInfoJson4 = JSON.stringify(selectedConvertedJson[3]);
            }
            if(selectedConvertedJson[4]!=undefined){
                tagInfoJson5 = JSON.stringify(selectedConvertedJson[4]);
            }

            commonData.tag_info_json_1 = tagInfoJson1;
            commonData.tag_info_json_2 = tagInfoJson2;
            commonData.tag_info_json_3 = tagInfoJson3;
            commonData.tag_info_json_4 = tagInfoJson4;
            commonData.tag_info_json_5 = tagInfoJson5;

            commonData.image_type_1 = image_type_1;
            commonData.image_type_2 = image_type_2;
            commonData.image_type_3 = image_type_3;
            commonData.image_type_4 = image_type_4;
            commonData.image_type_5 = image_type_5;

            if(tagInfoJson1 == "")
                commonData.image_name_1 = "";
            if(tagInfoJson2 == "")
                commonData.image_name_2 = "";
            if(tagInfoJson3 == "")
                commonData.image_name_3 = "";
            if(tagInfoJson4 == "")
                commonData.image_name_4 = "";
            if(tagInfoJson5 == "")
                commonData.image_name_5 = "";

            let collectionClass = document.querySelectorAll('.collectionData');
            let collectionArr = [];

            for(let i =0; i<collectionClass.length; i++){
                let tempJarr = {};
                let data1 = collectionClass[i];
                for(let j = 0; j < data1.children.length; j++){
                    let data2 = data1.children[j].children[0];
                    if(data2.nodeType === 1){
                        let key = data2.name;
                        let value = data2.value;
                        if(value!==undefined){
                            tempJarr[key]=value
                        }
                    }
                    else if (data2.nodeType === 3){
                        let key = data2.name;
                        let value = data2[data2.selectedIndex].value;
                        if(value!==undefined){
                            tempJarr[key]=value
                        }
                    }
                }
                collectionArr.push(tempJarr)
            }
            

            let commandClass = document.querySelectorAll('.commandData');
            let commandArr = [];

            // for(let i =0; i<commandClass.length; i++){
            //     let tempJarr = {};
            //     let data1 = commandClass[i];
            //     for(let j =0; j<data1.children.length; j++){
            //         let data2 = data1.children[j].children[0];
            //         if(data2.nodeType === 1){
            //             let key = data2.name;
            //             let value = data2.value;
            //             if(value!==undefined){
            //                 tempJarr[key]=value
            //             }
            //         }
            //         else if (data2.nodeType === 3){
            //             let key = data2.name;
            //             let value = data2[data2.selectedIndex].value;
            //             if(value===""){
            //                 alertPopUp('error',data2.placeholder + " : 필수 입력 필드입니다.")

            //                 return;
            //             }
            //             if(value!==undefined){
            //                 tempJarr[key]=value
            //             }
            //         }
            //     }
            //     commandArr.push(tempJarr)
            // }

            insertData.commonData = commonData;
            insertData.collectionData = collectionArr;
            // insertData.commandData = commandArr;

            let options = {
                url: "<%=global.config.apiServerUrl%>/tag-register/register",
                headers: {
                    'Content-Type': "application/json",
                },
                type:"post",
                sendData: {
                    insertData
                }
            };
            
            ajax(options,function(data){
                alertPopUp('success',"<%=__('Tag registration completed')%>");
                let selectedTagType = thirdParty.options[thirdParty.selectedIndex].value
                if(selectedTagType == "kanban"){  //e-Papey or Kanban system 
                    // Send a tag register message to Server ->by jylee 230207 
                    let bodyJson = {
                        "tid" : Math.random().toString(36).substr(2, 11),                        
                        "eventTime" : moment(new Date().getTime()).format('YYYY-MM-DD hh:mm:ss'),
                        "thingid" : tagThingId.value,
                        "tagKind" : smartTagType.value,
                        "tagSize" : tagSize.value,                   
                        "batteryType" : tagBattType.value,  
                        "buttonSu" : "2",  
                        "pageSu" : "5",             // default fixed : the number of page su is 5
                        "locationCd" : tagLocation.value,
                        "currentPage" : "0",        // When tag is registered at first, current page is 0
                        "templateList" : [
                            {"templateName0":image_0, "templateLoc0": image_name_0_loc, "pageNb":"0"},
                            {"templateName1":commonData.image_name_1, "templateLoc1": image_name_1_loc, "pageNb":"1"},
                            {"templateName2":commonData.image_name_2, "templateLoc2": image_name_2_loc, "pageNb":"2"},
                            {"templateName3":commonData.image_name_3, "templateLoc3": image_name_3_loc, "pageNb":"3"},
                            {"templateName4":commonData.image_name_4, "templateLoc4": image_name_4_loc, "pageNb":"4"},
                            {"templateName5":commonData.image_name_5, "templateLoc5": image_name_5_loc, "pageNb":"5"}
                          ],                                            
                        "status" : "create"   
                    }
                    //console.log("### Send : thingid " + tagThingId.value);                    
                    mqttClient.publish("/thingid", JSON.stringify(bodyJson));

                }
                
             //page_id[0].click();
                // loadPage('tag-monitoring','#right-panel');
                document.getElementById("tag-monitoring").click();
            } , function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });

            if(tagProduct.value == "Cronus") {
                imageServerUrl = "<%=global.config.sendImageServerUrl%>/init_image/" + tagThingId.value;               
                //console.log("###" +imageServerUrl);
            }
            else {   
                imageServerUrl = "<%=global.config.makeImageServerUrl%>/init_image/" + tagThingId.value;
                //console.log(imageServerUrl);
            }

            options = "";
            //imageServerUrl = "<%=global.config.sendImageServerUrl%>/init_image/" + tagThingId.value;
            options = {
                url: imageServerUrl,    //전이사님 image process server 전송
                headers: {
                    'Content-Type': "application/x-www-form-urlencoded",
                    //'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                    //'Upgrade-Insecure-Requests': "1",
                    'Access-Control-Allow-Origin' : "*"
                    
                },

                
                type: "post",
                sendData: {}
            };
                   
            //console.log("####>>>send init tag : " + imageServerUrl);  // by jylee
            
            ajax(options, function (data) {                        
            } , function (error) {
                //alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });

        })
        
        document.getElementById("tagLocation").addEventListener("click", function(e){
            locationInfo();
        },{ passive: true })

        
        document.getElementById("upload").addEventListener("click", function(e){
          
            let files = document.forms['fileUploadForm']['file'].files[0];

            if ( files == "" || files === undefined ){      //파일이 선택되었는지 체크
                alertPopUp('error', "<%=__('No files are selected')%>");
                return;
            }

            uploadExcel();
        },{ passive: true })
        

        
    }

    eventListener();
})