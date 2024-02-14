$(document).ready(function () {

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("tag-monitoring-front-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    let g_searchInfo = {
        "searchType": "",
        "searchKeyword": ""
    };

    let g_currentPageSize = 10;
    let g_currentPagingNumber = 0;
    let dataTable;
    let jsonForImageDrawingServer = [];
    let selectedConvertedJson = [];
    let selectedPageNumber = -1;
    let timers = [];
    let chart = undefined;
    let chartSeries = [];
    let chartDataCount = 0;

    const mqttMessage = (data) => {
        if(currentPage != "tag-monitoring"){
            return;
        }


        <% if ( global.config.runningMode == "debug" ){ %>
            console.log("mqtt onMessage receive:" +(new Date()).toString()+":" + data.payloadString);
        <% }%>


        let value = data.payloadString;
        let jsonValue = JSON.parse(value).tag_data;
        let thingid = data.destinationName.split("/")[2];
        let inputTagThingId = tagThingIdD.value;
        let tag_wakeup_prd_thingid = document.getElementById("tag_wakeup_prd_"+thingid);
        let wakeup_prd;

        if ( tag_wakeup_prd_thingid != null){
            wakeup_prd = parseInt(tag_wakeup_prd_thingid.innerText);
        }else{
            return;     //화면에 보이지 않을 경우 속도를 위해 return
        }
        //else{
        //    return;     //화면에 보이지 않을 경우 속도를 위해 return
        //}

        let index = [];
        for (let x in jsonValue) {
            index.push(x);
        }
        index.sort(function (a, b) {
            return a == b ? 0 : (a > b ? 1 : -1);
        });
        
    
        let circle =  ' <svg height="40" width="40"> ';
        circle += '	<circle name="collectionCircle" id="collectionCircle_' + thingid + '" cx="20" cy="20" r="20"  fill="green" /> ';    //mqtt메시지를 받았을 때 기본 색상은 green으로 설정
        circle += ' </svg> '; 

        let tagConnection_tmp = document.getElementById("tagConnection_"+thingid);

        if ( tagConnection_tmp != undefined){
            tagConnection_tmp.innerHTML = circle;
        }
       

        if( wakeup_prd == 0){
            wakeup_prd = 30;
        }            

        let tagConnection_thingid =  document.getElementById("tagConnection_"+thingid);
        let indexTrOfTable;

        if (tagConnection_thingid != null && !tagConnection_thingid.parentNode?.value){
            indexTrOfTable = tagConnection_thingid.parentNode.rowIndex - 1; 
        }else{
            return;
        }

        // if(timers.length !== 0){
        //     timers[indexTrOfTable].reset();
        // }

        for (let i = 0; i < Object.keys(jsonValue).length; i++) {   // tag list 배터리상태
            if(Object.keys(jsonValue)[i] == "batt_gauge"){
                let tag_battery_tmp = document.getElementById("tag_battery_"+thingid);

                if ( tag_battery_tmp != undefined ){
                    tag_battery_tmp.innerHTML =  Object.values(jsonValue)[i];                }
               
            }
        }

        for (let i = 0; i < Object.keys(jsonValue).length; i++) {   // tag detail 수집데이터

            if(inputTagThingId !== thingid ) {
                return;
            }

            if (jsonValue[index[i]] == "") {
                jsonValue[index[i]] = "-";
            }

            $('#collectionDataValueD_' + index[i]).val(jsonValue[index[i]]);
            $('#collectionDataValueD_' + index[i]).parent().addClass("has-error");
            $('#collectionDataTimeD_' + index[i]).val(moment(new Date().getTime()).format('YY/MM/DD HH:mm:ss'));
            $('#collectionDataTimeD_' + index[i]).parent().addClass("has-error");

            for(let j = 0 ; j < chartSeries.length; j++){
                if(chartSeries[j] == Object.keys(jsonValue)[i]){
                    if(Number.isNaN(parseFloat(Object.values(jsonValue)[i]))){
                        continue;
                    }
                    chartDataCount++;
                    let shift = false;

                    if(chartDataCount > 50){
                        shift = true;
                    }
                    
                    chart.series[j].addPoint(
                    {					
                        x: new Date().getTime() ,
                        y: parseFloat(Object.values(jsonValue)[i]) ,
                    },
                    true,
                    shift
                    )
                }    
            }
            // setTimeout(() => {
            //     $('#collectionDataTimeD_' + index[i]).parent().removeClass("has-error");
            //     $('#collectionDataValueD_' + index[i]).parent().removeClass("has-error");
            // }, wakeup_prd * 1000);
        }
    }
    
    const mqttConnect = () => {
        mqttClient.onMessageArrived = function (receiveMessage) {
            mqttMessage(receiveMessage);
        }.bind(this);
    }

    const getWakeUpPrd = (thingid) => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/wakeup-period-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "thingid": thingid,
            }
        }
        if(currentPage != "tag-monitoring"){
            for(let i = 0 ; i < timers.length; i++){
                timers[i].stop();
            }
            return;
        }
        ajax(options, function (data) {
            let wakeup_prd = -1;

            for(let i = 0 ; i < data.data.tagCollectionList.length; i++) {
                let node_name = data.data.tagCollectionList[i].node_name;
                let variable_name = data.data.tagCollectionList[i].variable_name;

                if(variable_name == "wakeup_prd"){

                    let wake_up_node_name = document.getElementById('tag_wakeup_prd_'+node_name);
                    if (wake_up_node_name != undefined ){
                        wake_up_node_name.innerText = data.data.tagCollectionList[i].variable_value;
                    }
                    
                    wakeup_prd = data.data.tagCollectionList[i].variable_value;

                    if(wakeup_prd == ""){
                        continue;
                    }
                    wakeup_prd = parseInt(wakeup_prd);
                    if(parseInt(wakeup_prd) == 0){
                        wakeup_prd = 30;
                    }

                    let tagConnectionNodeName = document.getElementById("tagConnection_"+node_name);
                    let indexTrOfTable;

                    typeof whatever 

                    if ( tagConnectionNodeName !==  null){                    
                        indexTrOfTable = tagConnectionNodeName.parentNode.rowIndex - 1;
                    }

                    let timer = new easytimer.Timer({ countdown: true });
                    timer.start({ startValues: { seconds: 3 * wakeup_prd }, target: { seconds: 0 } });    // 수집주기의 3배수 시간이 지나면 연결상태 색깔 파란색으로 바꿈 >> green으로 변경(2023.01.26)

                    timer.addEventListener('targetAchieved', function (e) {   // 수집주기의 3배수 시간이 지나면 연결상태 색깔 파란색으로 바꿈 >> green으로 변경(2023.01.26)
                        let circle =  ' <svg height="40" width="40"> ';
                        circle += '	<circle name="collectionCircle" id="collectionCircle_'+node_name +'" cx="20" cy="20" r="20"  fill="green" /> ';
                        circle += ' </svg> '; 
                        let  tagConnection_node = document.getElementById("tagConnection_"+node_name);

                        if (tagConnection_node != undefined ){
                            tagConnection_node.innerHTML = circle;
                        }

                    });
                    timers[indexTrOfTable] = timer;


                    break;
                }
                else if(variable_name == "batt_gauge"){
                    let value = data.data.tagCollectionList[i].variable_value;

                    let tag_battery_node = document.getElementById("tag_battery_"+node_name);

                    if (tag_battery_node != undefined ){
                        tag_battery_node.innerHTML = value; 
                    }
                                        
                }

                if(wakeup_prd == ""){
                    continue;
                }

                wakeup_prd = parseInt(wakeup_prd);
                if(parseInt(wakeup_prd) == 0){
                    wakeup_prd = 30;
                }
            }
            if(wakeup_prd == -1){
                let circle =  ' <svg height="40" width="40"> ';
                circle += '	<circle name="collectionCircle" id="collectionCircle_'+thingid  +'" cx="20" cy="20" r="20"  fill="red" /> ';
                circle += ' </svg> '; 

                let tagConnection_tmp_thing = document.getElementById("tagConnection_"+thingid);

                if ( tagConnection_tmp_thing != undefined){
                    tagConnection_tmp_thing.innerHTML = circle;
                }
                
            }
            else if(wakeup_prd == ""){
                
            }
            else{
                for(let i = 0 ; i < data.data.tagCollectionList.length; i++) {  //any data => wakeup_prd * 3 이내에 들어오면 green
                    let currentTime = new Date().getTime();


                    if(parseInt((currentTime - parseInt(data.data.tagCollectionList[i].upd_time))) < wakeup_prd * 1000 * 3 ){
                        let circle =  ' <svg height="40" width="40"> ';
                        circle += '	<circle name="collectionCircle" id="collectionCircle_'+thingid  +'" cx="20" cy="20" r="20"  fill="green" /> ';
                        circle += ' </svg> '; 

                        let tagConnection_tmp = document.getElementById("tagConnection_"+thingid);
                        if ( tagConnection_tmp != undefined ){
                            tagConnection_tmp.innerHTML = circle;
                        }
                        break;
                    }
                    else{
                        let circle =  ' <svg height="40" width="40"> ';         //기존 파란색은 green으로 변경(2023.01.26)
                        circle += '	<circle name="collectionCircle" id="collectionCircle_'+thingid  +'" cx="20" cy="20" r="20"  fill="green" /> ';
                        circle += ' </svg> '; 

                        let tagConnection_tmp = document.getElementById("tagConnection_"+thingid);
                        if ( tagConnection_tmp != undefined ){
                            tagConnection_tmp.innerHTML = circle;
                        }

                    }
                }
            }
        } , function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>\n"+error.toString());           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    const getList = () => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "searchInfo": JSON.stringify(g_searchInfo),
                "pNumber": g_currentPagingNumber,
                "pageSize": g_currentPageSize,
            }
        }

        ajax(options, function (data) {

            let startDate = new Date();

            <% if ( global.config.runningMode == "debug" ){ %>
            console.log('tag-monitoring-front-action time getList start:'+startDate.toString()+':');
            <% }%>

            let rootData = data.data;
            let tagList = rootData.tagList;
            let tagListCount = rootData.tagListCount[0].taglistcount
            let bodyHtml = "";

         	
			
            let thingidTopic = [];
            tagListBody.innerHTML = "";
            for (let i = 0; i < tagList.length; i++) {
                bodyHtml += " <tr>";
                bodyHtml += '   <td class="d-none" scope="col">';
                bodyHtml += '       <div class="custom-control custom-checkbox" >';
                bodyHtml += '           <input type="checkbox" id="tagListCheck' + tagList[i].idx + '" class="custom-control-input">';
                bodyHtml += '           <label class="custom-control-label" for="tagListCheck' + tagList[i].idx + '"  ></label>';
                bodyHtml += '       </div>';
                bodyHtml += '   </td>';
                bodyHtml += "   <td id ='tag_name_" + tagList[i].idx + "'>" + tagList[i].tag_name + "</td>";                
                bodyHtml += "   <td id ='tag_thing_id_" + tagList[i].idx + "'>" + tagList[i].tag_thing_id + "</td>";
                bodyHtml += "   <td class='d-none' id ='thirdParty_" + tagList[i].idx + "'>" + tagList[i].third_party_type + "</td>";
                bodyHtml += "   <td placeholder='" + tagList[i].tag_location + "' id ='tag_location_" + tagList[i].idx + "'>" + tagList[i].location_name + "</td>";
                //bodyHtml += "   <td class='d-none' id ='tag_location_value_"+tagList[i].idx+"'>"+tagList[i].tag_location+"</td>";
                bodyHtml += "   <td class='d-none' id ='tag_wakeup_prd_" + tagList[i].tag_thing_id + "'></td>";                
                let circle =  ' <svg height="40" width="40"> ';
                circle += '	<circle name="collectionCircle" id=collectionCircle_'+tagList[i].tag_thing_id  +' cx="20" cy="20" r="20"  fill="red" /> ';
                circle += ' </svg> '; 
                bodyHtml += "   <td id ='tagConnection_" + tagList[i].tag_thing_id  + "'>"+circle+"</td>";
                bodyHtml += "   <td id ='tag_battery_" + tagList[i].tag_thing_id + "'></td>";
               
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-success" data-original-title="Edit Task" name = "tagDetail" id="tagDetail_' + tagList[i].idx + '"><i class="la la-2x la-dashboard"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-success" data-original-title="Edit Task" name = "tagPub" id="tagPub_' + tagList[i].idx + '"><i class="la la-2x la-paint-brush"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-success" data-original-title="Edit Task" name = "lastImage" id="lastImage_' + tagList[i].idx + '"><i class="la la-2x la-image"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "tagEdit" id="tagEdit_' + tagList[i].idx + '"><i class="la la-2x la-edit"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-danger" data-original-title="Remove" name = "tagRemove" id="tagRemove_' + tagList[i].idx + '"><i class="la la-2x la-times"></i></button></td>';
               
                bodyHtml += "</tr>";
                if(tagList[i].tag_thing_id.charAt(0)=='C'){
                    //thingidTopic.push("/UltraCronus/"+tagList[i].tag_thing_id+"/#")
                    thingidTopic.push("/Ultra/"+tagList[i].tag_thing_id+"/#")
                    getWakeUpPrd(tagList[i].tag_thing_id);
                }else{
                    thingidTopic.push("/Ultra/"+tagList[i].tag_thing_id+"/#")
                    getWakeUpPrd(tagList[i].tag_thing_id);
                }
                
            }

            tagListBody.innerHTML = bodyHtml;

            let tagRemoveBtn = document.getElementsByName('tagRemove');
            for (let i = 0; i < tagRemoveBtn.length; i++) {
                tagRemoveBtn[i].addEventListener('click', function (e) {  // idx == smart_tag_info
                    let idx = tagRemoveBtn[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    deleteSmartTag(idx);
                    
                })
            }

            let tagEdit = document.getElementsByName('tagEdit');
            for (let i = 0; i < tagEdit.length; i++) {
                tagEdit[i].addEventListener('click', function (e) {
                    let idx = tagEdit[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    editSmartTag(idx);
                })
            }

            let tagDetail = document.getElementsByName('tagDetail');
            for (let i = 0; i < tagDetail.length; i++) {

                tagDetail[i].addEventListener('click', function (e) {
                    let idx = tagDetail[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    detailSmartTag(idx);
                })
            }
            
            let tagPub = document.getElementsByName('tagPub');
            for (let i = 0; i < tagPub.length; i++) {

                tagPub[i].addEventListener('click', function (e) {
                    let idx = tagPub[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    pubSmartTag(idx);
                })
            }
            
            let lastImage = document.getElementsByName('lastImage');
            for (let i = 0; i < lastImage.length; i++) {

                lastImage[i].addEventListener('click', function (e) {
                    let idx = lastImage[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    showlastImage(idx);
                })
            }


            try{
                    
                try{

                    //데이터 테이블 초기화
                    $('#smartTagList').dataTable({
                        "bDestroy": true
                    }).fnDestroy();        
                    
                }catch(e){
                    console.log("dataTable destory:"+e.toString()+":");
                }
                
                dataTable = $('#smartTagList').DataTable({
                    "pageLength": 10,
                    "searching": true,
                    "lengthChange": true,
                    "ordering": true,
                    "autoWidth": true,
                    initComplete: function () {
                        this.api().columns().every(function () {
                            let column = this;
                            let select = $('')
                                .appendTo($(column.footer()).empty())
                                .on('change', function () {
                                    let val = $.fn.dataTable.util.escapeRegex(
                                        $(this).val()
                                    );
                                    column
                                        .search(val ? '^' + val + '$' : '', true, false)
                                        .draw();
                                });

                            column.data().unique().sort().each(function (d, j) {
                                select.append('' + d + '')
                            });
                        });
                    }
                });

                setTimeout(() => {
                    for(let i = 0 ; i < thingidTopic.length; i++){
                        mqttClient.subscribe(thingidTopic[i]);

                        /*if (thingidTopic[i] == '/Ultra/CWTAG_D43D391C8268/#' || thingidTopic[i] == '/Ultra/CWTAG_D43D391C8668/#')
                        {
                            alert('CWTAG');
                        }*/
                    }

                    //mqttClient.subscribe('/Ultra/CWTAG_D43D391C8268/#');
                    //mqttClient.subscribe('/Ultra/CWTAG_D43D391C8668/#');
                }, 2000);
            }catch(e){
                alertPopUp('error', "<%=__('Error Occurred')%>");           //에러가 발생했습니다. 관리자에게 연락하세요
                console.log('error:'+options+':\r\nrespone.data:'+data.data+'\rmessage:' +e.message);
            }

            let endDate = new Date();              
            <% if ( global.config.runningMode == "debug" ){ %>
                console.log('tag-monitoring-front-action time start:'+endDate.toString()+': time:'+ (endDate.getTime() - startDate.getTime()) +':');
            <% }%>

        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

        
 
        let tagPubJson = {
            "insertData": {
                "tagdata": {

                },
                "status": "normal",
                "thingid": "",
                "pagenumber": "",
                "jobGUID": ""
            }
        }
        
      
        let data_key = document.getElementsByName('data_key');
        let tagPubBtn = document.getElementById("tagPubBtn");
        tagPubBtn.addEventListener('click', () => {
            
           for (let i = 0; i < data_key.length; i++) {
                let item = {};
                item[data_key[i].innerText] = document.getElementById('value_' + data_key[i].innerText).value;

                tagPubJson.insertData.tagdata[data_key[i].innerText] = document.getElementById('value_' + data_key[i].innerText).value;
                
            }
           
            tagPubJson.insertData.thingid = $('.tagThingId').val();
            tagPubJson.insertData.pagenumber = selectedPageNumber.toString();
            let imageServerUrl;

             
            //if($('.tagThingId').val().charAt(0) == 'C'){
            //    imageServerUrl = sendImageServerUrl + "/send_image";
            //}
            //else{
            //    imageServerUrl = makeImageServerUrl + "/make_image";
            //}
            /*if($('.tagThingId').val().substring(0,2) == 'CZ'){
                imageServerUrl = sendImageServerUrl_CZTAG + "/send_image";
            } else if ($('.tagThingId').val().substring(0,2) == 'CW'){
                imageServerUrl = sendImageServerUrl_CWTAG + "/send_image";
            } else {
                imageServerUrl = makeImageServerUrl + "/make_image";
            }*/

            imageServerUrl = "<%=global.config.sendImageServerUrl_CZTAG%>/send_image/" + $('.tagThingId').val();

            let options = {
                url: imageServerUrl,    //전이사님 image process server 전송
                type: "post",
                sendData: tagPubJson
            };

            //console.log(">>>tagPubJson : " + JSON.stringify(tagPubJson));  // for debug ->by jylee
 
            
            ajax(options, function (data) {
                if (data == undefined ){
                    alertPopUp('error', "<%=__('Error Occurred')%>");
                    return;
                }
            }, function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });



       

            options = {
                url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-control-data",
                type: "post",
                headers: {
                    'Content-Type': "application/json",
                },
                sendData: {
                    variable_time: new Date().getTime(),
                    node_name: $('.tagThingId').val(),
                    variable_name: "epd_update",
                    variable_value: "epd_update"
    
                }
            };
            ajax(options, function (data) {
                if (data == undefined ){
                    alertPopUp('error', "<%=__('Error Occurred')%>");
                    return;
                }else{
                    alertPopUp("success", "Tag Publish Success!");
                }
            }, function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });
    
            
        })
    }

    const deleteSmartTag = (idx) => {
        alertPopUp('warning', "<%=__('Are you sure you want to delete it?')%>");          //정말 삭제하시겠습니까?");
        $('.swal-button--confirm').on('click', function (e) {
            let options = {
                url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-delete",
                type: "post",
                headers: {
                    'Content-Type': "application/json",
                },
                sendData: {
                    "idx": idx,
                }
            };

            ajax(options, function (data) {
                alertPopUp('success', "<%=__('Smart Tag Deleted')%>");             //Smart Tag 삭제 완료");

                // Send a tag delete message to Server ->by jylee 230207 
                let bodyJson = {
                        "tid" : Math.random().toString(36).substr(2, 11),                        
                        "eventTime" : moment(new Date().getTime()).format('YYYY-MM-DD hh:mm:ss'),
                        "thingid" : document.getElementById('tag_thing_id_' + idx).innerText,             
                        "status" : "delete"   
                }
               
                //console.log("### delete tag id : " + document.getElementById('tag_thing_id_' + idx).innerText);                
                
                mqttClient.publish("/thingid", JSON.stringify(bodyJson));
                
                loadPage('tag-monitoring', '#right-panel')
            } , function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });
        })
    }

    const addAction = (a, list) => {
        let id = "#tb" + a;
        let data = $(id + " tr:eq(1)").clone(true).appendTo(id);

        let name = list["collection_data_name"];
        let key = list["collection_data_key"];
        let value = list["collection_data_value"];
        let unit = list["collection_data_unit"];
        let dataType = list["collection_data_type"];
        let periodType = list["collection_dataperiod_type"];
        let dataCategory = list["collection_data_category"];

        data.find("input[name='collectionDataName']").val(name);
        data.find("input[name='collectionDataName']").attr("id", list["idx"]);
        data.find("input[name='collectionDataKey']").val(key);
        data.find("input[name='collectionDataValue']").val(value);
        data.find("input[name='collectionDataValue']").attr("id", list["idx"]);

        data.find("input[name='collectionDataUnit']").val(unit);
        data.find("select[name='collectionDataType']").val(dataType);

        data.find("select[name='collectionDataCategory']").val(dataCategory);

        
        data.find("select[name='collectionDataPeriodType']").val(periodType);
    }
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
        tagLayoutLsistBody.innerHTML = "";

        ajax(options, function (data) {
            let tagLayoutList = data.data.tagLayoutList;
            let bodyHtml = "";
            tagLayoutList.map(function (params) {
                let canvas = new fabric.Canvas();
                switch (params.tag_size) {
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
                    case "10_2":    // Add 10.2 inch ->by jylee
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
                    bodyHtml += '       <a href="javascript:void(0);" style="font-size:18px;" name="addTagLayout" id="addTagLayout_' + params.idx + '">'
                    bodyHtml += '       <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#679897" class="bi bi-file-plus" viewBox="0 0 16 16">';
                    bodyHtml += '       <path d="M8.5 6a.5.5 0 0 0-1 0v1.5H6a.5.5 0 0 0 0 1h1.5V10a.5.5 0 0 0 1 0V8.5H10a.5.5 0 0 0 0-1H8.5V6z"/>';
                    bodyHtml += '       <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>';
                    bodyHtml += '       </svg></a>';
                    bodyHtml += '   </td>'
                    bodyHtml += '   <td ><img class="border border-dark" name="tag_preview" style="width:296px; height:128px;" id ="tag_preview_' + params.idx + '" src ="' + canvas.toDataURL() + '"></img></td>';
                    bodyHtml += "   <td id ='tag_layout_name_" + params.idx + "'>" + params.tag_layout_name + "</td>";
                    bodyHtml += '   <td id ="tag_size_' + params.idx + '">' + params.tag_size + "</td>";
                    bodyHtml += '   <td class="d-none" id ="image_name_' + params.idx + '">' + params.tag_image_file_name + "</td>";
                    bodyHtml += '   <td class="d-none" id ="image_type_' + params.idx + '">' + params.image_type + "</td>";
                    bodyHtml += '</tr>';

                    tagLayoutLsistBody.innerHTML += bodyHtml;
                    let canvasObjects = canvas.toJSON().objects;

                    let convertedJson = {
                        "drawing": []
                    }
                    let componentJson = {
                        "object_id": "",
                        "drawing_type": "typing",
                        "color": "#000000",
                        "thickness": 1, //text일때 1로 고정
                        "fill": false,
                        "points": [ //영점은 left top 2포인트, 이외에는 4포인트

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
                        "thickness": 1, //text일때 1로 고정
                        "fill": false,
                        "points": [ //영점은 left top 2포인트, 이외에는 4포인트

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
                        "thickness": 1, //text일때 1로 고정
                        "fill": false,
                        "points": [ //영점은 left top 2포인트, 이외에는 4포인트

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
                                 
                                imageComponentJson.object_id = object_id;
                                imageComponentJson.points.push(parseInt(canvasObjects[i].left));                                
                                imageComponentJson.points.push(parseInt(canvasObjects[i].top));                               
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
                        element.addEventListener('click', () => {
                            $('#taglayoutListModal').modal('show');
                            $('#pageLayoutNumber').text(i + 1);
                        })
                    }

                    let addTagLayout = document.getElementsByName("addTagLayout");
                    for (let i = 0; i < addTagLayout.length; i++) {
                        const element = addTagLayout[i];
                        element.addEventListener('click', () => {
                            selectedConvertedJson[$('#pageLayoutNumber').text() - 1] = jsonForImageDrawingServer[i];
                            $('#taglayoutListModal').modal('hide');
                            let src = document.getElementById('tag_preview_' + element.id.split("_")[1]).src;
                            let tag_image_file_name = document.getElementById('image_name_' + element.id.split("_")[1]).innerText;
                            let imageType = document.getElementById('image_type_' + element.id.split("_")[1]).innerText;

                            let pageNumber = $('#pageLayoutNumber').text();
                            $('#selectedLayout_' + pageNumber + ' > img').remove();
                            $('#selectedLayout_' + pageNumber + ' > input').remove();
                            $('#selectedLayout_' + pageNumber).append('<img class="border border-dark" style="width:296px; height:128px;" src="' + src + '"></img><input type="hidden" id="imageType_' + pageNumber + '" name="imageType" value = "' + imageType + '"><input type="hidden" id="imageName_' + pageNumber + '" name="imageName" value = "' + tag_image_file_name + '">');
                        })
                    }
                })
            })
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

        hideLoading();

    }

    const initChart = (container) => {
        chart = undefined;
        chartSeries = [];
        chartDataCount = 0;
        
        let batterychartOption = {
            chart: {
                borderColor: '#679897',
                borderWidth: 1,
            },
            title: {
                text: null
            },
        
            subtitle: {
                text: null
            },
        	xAxis:{
				type:'datetime',
			},
            yAxis: {
                title: {
                    text: null
                }
            },
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    }
                }
            },
            time: {
                useUTC: false
            },
            series: [],
        }

        chart = Highcharts.chart(container, batterychartOption);

    }

    const drawChart = (dataKey,thingid) => {
        if(chartSeries.indexOf(dataKey) != -1){
            return;
        }

        for(let i = 0 ; i < chart.series.length; i++ ){
            chart.series[i].setData([]);
        }
        
        chart.addSeries({
            name: dataKey,
        });

        chartSeries.push(dataKey);
        chart.redraw();
    }

    
    const detailSmartTag = (idx) => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-collection-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                idx: idx,
                thingid: document.getElementById('tag_thing_id_' + idx).innerText
            }
        };
        ajax(options, function (data) {
            $('#progressbarD').addClass('d-none');
            initChart("detailSmartTagChartContainer");
            let tag_name = $('#tag_name_' + idx).text();
            let tag_thing_id = $('#tag_thing_id_' + idx).text();
            let tag_location = $('#tag_location_' + idx).text();
            let tag_wakeup_prd = $('#tag_wakeup_prd_' + idx).text();

            $('#tagDetailModal').modal('show');

            let tagLatestData = data.data.tagLatestData;

            tagNameD.value = tag_name;
            tagThingIdD.value = tag_thing_id;
            tagLocationD.value = tag_location;
            tagWakeupPrdD.value = tag_wakeup_prd;
            $(".tagEditModalLabel").text("Thing Details | " + tag_name);

            let collectionList = data.data.tagCollectionList;
            
            $("#tbCollectionD tr:gt(1)").remove();

            for (let i = 0; i < Object.keys(collectionList).length; i++) {
                let id = "#tbCollectionD";
                let listData = $(id + " tr:eq(1)").clone(true).appendTo(id);

                let list = Object.values(collectionList)[i];
                let name = list["collection_data_name"];
                let key = list["collection_data_key"];
                let value = list["collection_data_value"];
                let unit = list["collection_data_unit"];
                let dataType = list["collection_data_type"];
                let dataCategory = list["collection_data_category"];
                let periodType = list["collection_dataperiod_type"];



                // data.find("button[name='collectionDataChartDrawButtonD']").val(name);
                listData.find("input[name='collectionDataChartDrawButtonD']").prop("checked", false);
                listData.find("input[name='collectionDataChartDrawButtonD']").attr("id", "collectionDataChartDrawButtonD_"+key);
                listData.find("input[name='collectionDataNameD']").val(name);
                listData.find("input[name='collectionDataNameD']").attr("id", list["idx"]);
                listData.find("input[name='collectionDataKeyD']").val(key);
                listData.find("input[name='collectionDataValueD']").val(value);
                listData.find("input[name='collectionDataValueD']").attr("id", "collectionDataValueD_" + key);
                listData.find("input[name='collectionDataUnitD']").val(unit);
                listData.find("input[name='collectionDataTimeD']").val("");
                listData.find("input[name='collectionDataTimeD']").attr("id", "collectionDataTimeD_" + key)

                listData.find("select[name='collectionDataTypeD']").val(dataType);
                listData.find("select[name='collectionDataPeriodTypeD']").val(periodType);

                listData.find("select[name='collectionDataCategoryD']").val(dataCategory);


                
                

                for (let i = 0; i < subTopics.length; i++) {
                    mqttClient.unsubscribe(subTopics[i]);
                }
                
                if(tag_thing_id.charAt(0) == 'C'){
                    /*subTopics.push("/UltraCronus/" + tag_thing_id + "/#")
                    mqttClient.subscribe("/UltraCronus/" + tag_thing_id + "/#");
                    console.log("sub success : " + "/UltraCronus/" + tag_thing_id + "/#")*/
                    subTopics.push("/Ultra/" + tag_thing_id + "/#")
                    mqttClient.subscribe("/Ultra/" + tag_thing_id + "/#");

                    <% if ( global.config.runningMode == "debug" ){ %>
                        console.log("sub success : " + "/Ultra/" + tag_thing_id + "/#");
                    <% }%>

                    
                }
                else{
                    subTopics.push("/Ultra/" + tag_thing_id + "/#")
                    mqttClient.subscribe("/Ultra/" + tag_thing_id + "/#");

                    <% if ( global.config.runningMode == "debug" ){ %>
                        console.log("sub success : " + "/Ultra/" + tag_thing_id + "/#");
                    <% }%>

                    
                }
            }
            $('.collectionDataD:eq(0)').remove();

            for(let i = 0 ; i < document.getElementsByName("collectionDataValueD").length; i++){
                
                let collectionDataValueD = document.getElementsByName("collectionDataValueD")[i];
                let collectionDataTimeD = document.getElementsByName("collectionDataTimeD")[i];

                //collectionDataValueD.parentNode.remove("has-error");
                //collectionDataTimeD.parentNode.remove("has-error");

                /*
                if ( !collectionDataValueD.parentNode?.value){
                    collectionDataValueD.parentNode.remove("has-error");
                }

                if ( !collectionDataTimeD.parentNode?.value){
                    collectionDataTimeD.parentNode.remove("has-error");
                }
                */

            }

            for (let i = 0; i < tagLatestData.length; i++) { //가장 최근 수집시간
                let dataValue = document.getElementById('collectionDataValueD_' + tagLatestData[i].variable_name);
                let dataTime = document.getElementById("collectionDataTimeD_" + tagLatestData[i].variable_name)
                if (dataValue != undefined) {
                    if (tagLatestData[i].variable_value == "" || tagLatestData[i].variable_value == undefined || tagLatestData[i].variable_value == null) {
                        continue;
                    }
                    dataValue.value = tagLatestData[i].variable_value;
                    dataTime.value = moment(parseInt(tagLatestData[i].upd_time)).format("YY/MM/DD HH:mm:ss");
                }
            }

            
            let collectionDataChartDraw = document.getElementsByName("collectionDataChartDrawButtonD");
            let collectionDataCommand = document.getElementsByName("collectionDataCommand");
            let collectionDataKeyD = document.getElementsByName("collectionDataKeyD");


            for (let i = 0; i < collectionDataChartDraw.length; i++) {
                collectionDataChartDraw[i].addEventListener('change', () => {
                    let dataKey = collectionDataKeyD[i].value;
                    let thingid = document.getElementById('tagThingIdD').value;

                    document.getElementById('detailSmartTagChartContainer').classList.remove("d-none");
                    chartDataCount = 0;

                    if(collectionDataChartDraw[i].checked == true){
                        drawChart(dataKey,thingid);
                    }
                    else{
                        let index = chartSeries.indexOf(dataKey);
                        chart.series[index].remove();
                        if (index !== -1) {
                            chartSeries.splice(index, 1);
                        }
                    }
                })
            }


            let collectionDataCategoryD = document.getElementsByName("collectionDataCategoryD");
            
            for (let i = 0; i < collectionDataCommand.length; i++) {

                if(collectionDataCategoryD[i].value == "collection"){
                    collectionDataCommand[i].disabled = true;
                }
                else{
                    collectionDataCommand[i].disabled = false;

                }

                collectionDataCommand[i].addEventListener('click', () => {
                    let result = prompt("<%=__('Please enter a command value')%>");           //명령 값을 입력하세요.");

                    if(result == null){
                        alertPopUp("error","<%=__('Cancel command')%>");                   //명령 취소");
                        return;
                    }

                    let dataKey = collectionDataKeyD[i].value;
                    let thingid = document.getElementById('tagThingIdD').value;
                    let temp = {};
                    temp[dataKey] = result;
                    let commonDataFormat = {
                        "thingid": thingid,
                        "tid": Math.random().toString(36).substr(2, 11),
                        "msg_type": "ControlData",
                        "thing_type": thingid.split("_")[0],
                        "tag_data": temp
                    }
                    if(thingid.charAt(0) == 'C'){
                        mqttClient.publish("/" + thingid + "/Ultra", JSON.stringify(commonDataFormat));
                    }
                    else{
                        mqttClient.publish("/" + thingid + "/Ultra", JSON.stringify(commonDataFormat));
                    }

                    let options = {
                        url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-control-data",
                        type: "post",
                        headers: {
                            'Content-Type': "application/json",
                        },
                        sendData: {
                            variable_time: new Date().getTime(),
                            node_name: thingid,
                            variable_name: dataKey,
                            variable_value: result
                        }
                    };
                    ajax(options, function (data) {
                        alertPopUp("success","<%=__('Transfer complete')%> / "+dataKey +" : "+result);     //전송 완료
                        detailSmartTag(idx)
                    }, function (error) {
                        alertPopUp('error', "<%=__('Error Occurred')%>");
                        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
                    });
                })
            }
            
            // $('.collectionDataD:eq(0)').css("display","none");
        } , function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    const showlastImage = (idx) => {

        $('#lastImageModal').modal("show");

        let tag_name = $('#tag_name_' + idx).text();
        let tag_thing_id = $('#tag_thing_id_' + idx).text();
        let tag_current_pageno = $('#tag_current_page_' + idx).text();              
        
        $('.tagName').val(tag_name);
        $('.tagThingId').val(tag_thing_id);
        $('.tagCurPage').val(tag_current_pageno);        //Add current Page Number ->by jylee 230214       
        // To be modified from last image to current page image ->by jylee 230208 
        if(tag_thing_id.charAt(0)=='C'){
            //$('#lastImage_1 > img').attr("src", "<%=global.config.sendImageServerUrl%>/images/"+tag_thing_id+ "_"+tag_current_pageno+".png");
            $('#lastImage_1 > img').attr("src", "<%=global.config.sendImageServerUrl%>/last_image/"+tag_thing_id);          
            /*
            $('#lastImage_2 > img').attr("src", "<%=global.config.sendImageServerUrl%>/images/"+tag_thing_id+"_2.png");
            $('#lastImage_3 > img').attr("src", "<%=global.config.sendImageServerUrl%>/images/"+tag_thing_id+"_3.png");
            */
            
        }
        else{
            //$('#lastImage_1 > img').attr("src", "<%=global.config.makeImageServerUrl%>/images/"+tag_thing_id+ "_"+tag_current_pageno+".png");
            $('#lastImage_1 > img').attr("src", "<%=global.config.makeImageServerUrl%>/last_image/"+tag_thing_id);
            /* 
            $('#lastImage_2 > img').attr("src", "<%=global.config.makeImageServerUrl%>/images/"+tag_thing_id+"_2.png");
            $('#lastImage_3 > img').attr("src", "<%=global.config.makeImageServerUrl%>/images/"+tag_thing_id+"_3.png");
            */
        }

    }


    const pubSmartTag = (idx) => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-collection-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                idx: idx,
                thingid: document.getElementById('tag_thing_id_' + idx).innerText
            }
        };
        ajax(options, function (data) {
            $('#tagPubModal').modal("show");

            let tagLayoutList = data.data.tagLayoutList[0];
            let tag_name = $('#tag_name_' + idx).text();
            let tag_thing_id = $('#tag_thing_id_' + idx).text();

            $('.tagName').val(tag_name);
            $('.tagThingId').val(tag_thing_id);

            $('#tagPubList_1 > img').remove();
            $('#tagPubList_2 > img').remove();
            $('#tagPubList_3 > img').remove();

            document.getElementById("tagSelectBtn_1").classList.add("d-none");
            document.getElementById("tagSelectBtn_2").classList.add("d-none");
            document.getElementById("tagSelectBtn_3").classList.add("d-none");

            if (tagLayoutList != undefined) {
                selectedConvertedJson[0] = tagLayoutList.tag_info_json_1;
                selectedConvertedJson[1] = tagLayoutList.tag_info_json_2;
                selectedConvertedJson[2] = tagLayoutList.tag_info_json_3;

                let canvas_1 = new fabric.Canvas();
                let canvas_2 = new fabric.Canvas();
                let canvas_3 = new fabric.Canvas();

                let image_name_1;
                let image_name_2;
                let image_name_3;

                for (let i = 0; i < data.data.tagLayoutList.length; i++) {
                    let list = data.data.tagLayoutList[i];
                    let index = -1;

                    
                    // if (list.image_name_1 == list.tag_image_file_name) {
                    //     index = 0
                    // } else if (list.image_name_2 == list.tag_image_file_name) {
                    //     index = 1;
                    // } else {
                    //     index = 2;
                    // }
                    index = list.num;
                    
                    if (index == 0) {
                        canvas_1.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_1.renderAll();
                            let image_type = list.image_type;
                            image_name_1 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_1.setWidth(296);
                                canvas_1.setHeight(128);
                            } else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_1.setWidth(400);
                                canvas_1.setHeight(300);
                            } else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_1.setWidth(800);
                                canvas_1.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_1.setWidth(960);
                                canvas_1.setHeight(640);
                            }
                            if (image_name_1 !== "" && image_name_1 !== undefined) {
                                $('#tagPubList_1 > img').remove();
                                $('#tagPubList_1 > input').remove();
                                $('#tagPubList_1').append('<img class="border border-dark" style="width:400px; height:300px;" name src="' + canvas_1.toDataURL() + '"></img><input type="hidden" id="imageType_1" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_1" name="imageName" value = "' + image_name_1 + '">');
                                document.getElementById("tagSelectBtn_1").classList.remove("d-none");
                            }
                        });

                    } else if (index == 1) {
                        canvas_2.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_2.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_2.setWidth(296);
                                canvas_2.setHeight(128);
                            } else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_2.setWidth(400);
                                canvas_2.setHeight(300);
                            } else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_2.setWidth(800);
                                canvas_2.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_2.setWidth(960);
                                canvas_2.setHeight(640);
                            }
                            image_name_2 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_2 !== "" && image_name_2 !== undefined) {
                                $('#tagPubList_2 > img').remove();
                                $('#tagPubList_2 > input').remove();
                                $('#tagPubList_2').append('<img class="border border-dark" style="width:400px; height:300px;" src="' + canvas_2.toDataURL() + '"></img><input type="hidden" id="imageType_2" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_2" name="imageName" value = "' + image_name_2 + '">');
                                document.getElementById("tagSelectBtn_2").classList.remove("d-none");

                            }
                        });

                    } else if (index == 2) {
                        canvas_3.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_3.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_3.setWidth(296);
                                canvas_3.setHeight(128);
                            } else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_3.setWidth(400);
                                canvas_3.setHeight(300);
                            } else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_3.setWidth(800);
                                canvas_3.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_3.setWidth(960);
                                canvas_3.setHeight(640);
                            }    
                            image_name_3 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_3 !== "" && image_name_3 !== undefined) {
                                $('#tagPubList_3 > img').remove();
                                $('#tagPubList_3 > input').remove();
                                $('#tagPubList_3').append('<img class="border border-dark" style="width:400px; height:300px;" src="' + canvas_3.toDataURL() + '"></img><input type="hidden" id="imageType_3" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_3" name="imageName" value = "' + image_name_3 + '">');
                                document.getElementById("tagSelectBtn_3").classList.remove("d-none");

                            }
                        });
                    }
                }
            }

            selectedPageNumber = -1;
            let tagSelectBtn = document.getElementsByName("tagSelectBtn");
            document.getElementById("dataField").classList.add("d-none");
            for (let i = 0; i < tagSelectBtn.length; i++) {
                tagSelectBtn[i].addEventListener('click', (e) => {
                    dataFieldBody.innerHTML = "";
                    let indexid = "tag_info_json_" + (i + 1);
                    if(tagLayoutList == undefined){
                        document.getElementById("dataField").classList.add("d-none");
                        return;
                    }

                    if(tagLayoutList[indexid] == ""){
                        return;
                    }


                    let dataJson = JSON.parse(tagLayoutList[indexid]).drawing;
                    let html = "";
                    selectedPageNumber = i + 1;
                    document.getElementById("dataField").classList.remove("d-none");

                    for (let i = 0; i < dataJson.length; i++) {
                        html += '<tr class="col-md-6">';
                        html += '   <th class="col-md-6" name = "data_key">' + dataJson[i].object_id + "</td>";
                        html += '   <td class="col-md-6"><input type="text" class="form-control input-pill" style="width:300px;background-color: #fff !important" id="value_' + dataJson[i].object_id + '"></td>';
                        html += '</tr>';
                    }
                    dataFieldBody.innerHTML = html;
                })
            }
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }
    const editSmartTag = (idx) => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-collection-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                idx: idx,
                thingid: document.getElementById('tag_thing_id_' + idx).innerText

            }
        };
        ajax(options, function (data) {

            let startDate = new Date();  

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log('tag-mornitoring-front-action.js [editSmartTag] start:'+startDate.toString()+':');
            <% }%>

            
            $('fieldset').eq(0).removeAttr("style");
            $('fieldset').eq(2).removeAttr("style");
            $('fieldset').eq(1).removeAttr("style");

            $('fieldset').eq(0).css("display", "block");
            $('fieldset').eq(1).css("display", "none");
            $('fieldset').eq(2).css("display", "none");

            $("#progressbar li").eq(0).addClass("active");
            $("#progressbar li").eq(1).removeClass("active");
            $("#progressbar li").eq(2).removeClass("active");

            let tagLayoutList = data.data.tagLayoutList[0];

            $('#selectedLayout_1 > img').remove();
            $('#selectedLayout_2 > img').remove();
            $('#selectedLayout_3 > img').remove();

            if (tagLayoutList != undefined) {
                selectedConvertedJson[0] = tagLayoutList.tag_info_json_1;
                selectedConvertedJson[1] = tagLayoutList.tag_info_json_2;
                selectedConvertedJson[2] = tagLayoutList.tag_info_json_3;

                let canvas_1 = new fabric.Canvas();
                let canvas_2 = new fabric.Canvas();
                let canvas_3 = new fabric.Canvas();
                let image_name_1;
                let image_name_2;
                let image_name_3;


                for (let i = 0; i < data.data.tagLayoutList.length; i++) {
                    let list = data.data.tagLayoutList[i];
                    let index = -1;
                    
                    // if (list.image_name_1 == list.tag_image_file_name) {
                    //     index = 0
                    // } else if (list.image_name_2 == list.tag_image_file_name) {
                    //     index = 1;
                    // } else {
                    //     index = 2;
                    // }
                    index = list.num;

                    if (index == 0) {
                        canvas_1.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_1.renderAll();
                            let image_type = list.image_type;
                            image_name_1 = data.data.tagLayoutList[i].tag_image_file_name;

                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_1.setWidth(296);
                                canvas_1.setHeight(128);
                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_1.setWidth(400);
                                canvas_1.setHeight(300);

                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_1.setWidth(800);
                                canvas_1.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_1.setWidth(960);
                                canvas_1.setHeight(640);
                            }    
                            if (image_name_1 !== "" && image_name_1 !== undefined) {
                                $('#selectedLayout_1 > img').remove();
                                $('#selectedLayout_1 > input').remove();
                                $('#selectedLayout_1').append('<img class="border border-dark" style="width:296px; height:128px;" src="' + canvas_1.toDataURL() + '"></img><input type="hidden" id="imageType_1" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_1" name="imageName" value = "' + image_name_1 + '">');
                            }
                        });

                    } else if (index == 1) {
                        canvas_2.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_2.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_2.setWidth(296);
                                canvas_2.setHeight(128);
                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_2.setWidth(400);
                                canvas_2.setHeight(300);
                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_2.setWidth(800);
                                canvas_2.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_2.setWidth(960);
                                canvas_2.setHeight(640);
                            }
                            image_name_2 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_2 !== "" && image_name_2 !== undefined) {
                                $('#selectedLayout_2 > img').remove();
                                $('#selectedLayout_2 > input').remove();
                                $('#selectedLayout_2').append('<img class="border border-dark" style="width:296px; height:128px;" src="' + canvas_2.toDataURL() + '"></img><input type="hidden" id="imageType_2" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_2" name="imageName" value = "' + image_name_2 + '">');
                            }

                        });

                    } else if (index == 2) {
                        canvas_3.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_3.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_3.setWidth(296);
                                canvas_3.setHeight(128);
                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_3.setWidth(400);
                                canvas_3.setHeight(300);

                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_3.setWidth(800);
                                canvas_3.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_3.setWidth(960);
                                canvas_3.setHeight(640);
                            }    

                            image_name_3 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_3 !== "" && image_name_3 !== undefined) {
                                $('#selectedLayout_3 > img').remove();
                                $('#selectedLayout_3 > input').remove();
                                $('#selectedLayout_3').append('<img class="border border-dark" style="width:296px; height:128px;" src="' + canvas_3.toDataURL() + '"></img><input type="hidden" id="imageType_3" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_3" name="imageName" value = "' + image_name_3 + '">');
                            }
                        });
                    }
                }
            }

            let collectionList = data.data.tagCollectionList;
            $("#tbCollection tr:gt(1)").remove();

            for (let i = 0; i < Object.keys(collectionList).length; i++) {
                addAction("Collection", Object.values(collectionList)[i]);
                $("input[name='collectionDataValue']").eq(i).attr("disabled", true);
                $("input[name='collectionDataKey']").eq(i).attr("disabled", true);
            }
            $('.collectionData:eq(0)').remove();

            let tagLatestData = data.data.tagLatestData;

            for (let i = 0; i < tagLatestData.length; i++) { //가장 최근 수집시간
                let dataValue = document.getElementById('collectionDataValue_' + tagLatestData[i].variable_name);
                let dataTime = document.getElementById("collectionDataTime_" + tagLatestData[i].variable_name)
                if (dataValue != undefined) {
                    if (tagLatestData[i].variable_value == "" || tagLatestData[i].variable_value == undefined || tagLatestData[i].variable_value == null) {
                        continue;
                    }
                    dataValue.value = tagLatestData[i].variable_value;
                    // dataTime.value = moment(parseInt(tagLatestData[i].upd_time)).format("YY/MM/DD hh:mm:ss");;
                }
            }

            let endDate = new Date();

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log('tag-mornitoring-front-action.js [editSmartTag] end:'+endDate.toString()+': time:'+ (endDate.getTime() - startDate.getTime()) +':');
            <% }%>

            

        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });


        $('#tagEditModal').modal('show');

        // $(document).on('click', '.remove', function() {
        //     let trIndex = $(this).closest("tr").index();
        //     if(trIndex>0) {
        //         $(this).closest("tr").remove();
        //     }
        // });
        // $('#addMoreCollection').on('click', function() {
        //     addAction("Collection","");
        // });

        let data = $("#tbCollection tr:eq(1)").clone(true);

        let tag_name = $('#tag_name_' + idx).text();
        let tag_thing_id = $('#tag_thing_id_' + idx).text();
        let tag_location = $('#tag_location_' + idx).text();
        let tag_wakeup_prd = $('#tag_wakeup_prd_' + idx).text();
        let third_party_type = $('#thirdParty_' + idx).text();        
        let tag_current_pageno = $('#tag_current_page_' + idx).text();   //Add current Page Number ->by jylee 230214           
       
        
        tagName.value = tag_name;
        tagThingId.value = tag_thing_id;
        tagLocation.value = tag_location;
        tagLocation.placeholder = $('#tag_location_' + idx).attr("placeholder");
        tagWakeupPrd.value = tag_wakeup_prd;        
        
        thirdParty.value = third_party_type;
        $("#tagEditModalLabel").text("Thing Edit | " + tag_name);

        let current_fs, next_fs, previous_fs;
        let left, opacity, scale;
        let animating;

       // getTagLayoutList();

        $(".next").click(function () {

            let flag = -1;
            let allDataClass = document.querySelectorAll('.allData');
            for (let i = 0; i < progressbar.children.length; i++) {
                if (progressbar.children[i].classList.contains("active")) {
                    flag = i;
                };
            }
            // for(let i =0; i<allDataClass.length; i++){
            //     let data1 = allDataClass[i];
            //     if(flag===0){
            //         let data2;

            //         for(let j =0; j<data1.children.length; j++){
            //             data2 = data1.children[j];
            //             data2.style.borderColor = '#ccc';
            //         }
            //         for(let j =0; j<data1.children.length; j++){
            //             data2 = data1.children[j];

            //             let value = data2.value;
            //             if(data2.nodeType === 1 && value==="" && data2.nodeName==="INPUT"){
            //                 alertPopUp('error',data2.placeholder + " : 필수 입력 필드입니다.")

            //                 //alert(data2.placeholder + " : 필수 입력 필드입니다.")

            //                 data2.style.borderColor = '#ff646d';
            //                 data2.focus();
            //                 return;
            //             }
            //         }
            //     }
            // }
            if(document.getElementById('tagName').value == ""){
                alertPopUp("error","<%=__('Smart Tag Name: Required input information')%>");          //스마트태그 이름 : 필수 입력 정보입니다.");
                document.getElementById('tagName').focus();
                return;
            }
            if(document.getElementById('tagLocation').value == "" || document.getElementById('tagLocation').value == undefined){
                alertPopUp("error","<%=__('Location Information: Required input information')%>");        //위치 정보 : 필수 입력 정보입니다.");
                document.getElementById('tagName').focus();
                return;
            }

            let collectionClass = document.querySelectorAll('.collectionData');
            let commandClass = document.querySelectorAll('.commandData');

            for (let i = 0; i < collectionClass.length; i++) {
                let data1 = collectionClass[i];
                let data2;
                for (let j = 0; j < data1.children.length; j++) {
                    data2 = data1.children[j].children[0];
                    data2.style.borderColor = '#ccc';

                }
                for (let j = 0; j < data1.children.length; j++) {
                    data2 = data1.children[j].children[0];
                    if (flag === 1) {
                        if (data2.nodeType === 1) {
                            let value = data2.value;
                            if (value === "") {
                                alertPopUp('error', data2.placeholder + " : <%=__('Required field')%>");      //필수 입력 필드입니다.")

                                data2.style.borderColor = '#ff646d';
                                data2.focus();
                                return;
                            }
                        } 
                        else if (data2.nodeType === 3) {
                            let value = data2[data2.selectedIndex].value;
                            if (value === "") {
                                alertPopUp('error', data2.placeholder + " : <%=__('Required field')%>");      //필수 입력 필드입니다.")

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
            current_fs = $(this).parent();
            next_fs = $(this).parent().next();
            $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

            next_fs.show();
            current_fs.animate({
                opacity: 0
            }, {
                step: function (now, mx) {
                    scale = 1 - (1 - now) * 0.2;
                    left = (now * 50) + "%";
                    opacity = 1 - now;
                    current_fs.css({
                        'transform': 'scale(' + scale + ')',
                        'position': 'absolute'
                    });
                    next_fs.css({
                        'left': left,
                        'opacity': opacity
                    });
                    window.scrollTo(0, 0);
                },
                duration: 100,
                complete: function () {
                    current_fs.hide();
                    animating = false;
                },
                easing: 'easeInOutBack'
            });
        });


        $(".previous").click(function () {
            if (animating) return false;
            animating = true;

            current_fs = $(this).parent();
            previous_fs = $(this).parent().prev();

            $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

            previous_fs.show();
            current_fs.animate({
                opacity: 0
            }, {
                step: function (now, mx) {
                    scale = 0.8 + (1 - now) * 0.2;
                    left = ((1 - now) * 50) + "%";
                    opacity = 1 - now;
                    current_fs.css({
                        'left': left
                    });
                    previous_fs.css({
                        'transform': 'scale(' + scale + ')',
                        'opacity': opacity,
                        'position': 'absolute'
                    });
                    window.scrollTo(0, 0);
                },
                duration: 100,
                complete: function () {
                    current_fs.hide();
                    animating = false;
                },
                easing: 'easeInOutBack'
            });
            (() => {
                current_fs.animate({
                    opacity: 0
                }, {
                    step: function (now, mx) {
                        previous_fs.css({
                            'transform': 'scale(' + scale + ')',
                            'opacity': opacity,
                            'position': 'relative'
                        });
                    },
                });
            })();
        });

        $(".submit").click(function () {

            let insertData = {
                "commonData": {},
                "collectionData": {},
                // "commandData":{}

            }

            let commonData = {};
            let collectionData = {};
            let commandData = {};

            commonData.tagName = tagName.value;
            commonData.tagThingId = tagThingId.value;
            commonData.tagLocation = tagLocation.placeholder;
            commonData.tagWakeupPrd = tagWakeupPrd.value;
            commonData.idx = idx;

            let image_1 = "";
            let image_2 = "";
            let image_3 = "";
            // Add template location path ->by jylee 230220
            let image_name_1_loc = "";
            let image_name_2_loc = "";
            let image_name_3_loc = "";

            let image_type_1 = "black";
            let image_type_2 = "black";
            let image_type_3 = "black";

            let imageName_1 = document.getElementById('imageName_1');
            let imageName_2 = document.getElementById('imageName_2');
            let imageName_3 = document.getElementById('imageName_3');

            if (imageName_1 != undefined) {
                image_1 = imageName_1.value;
            }
            if (imageName_2 != undefined) {
                image_2 = imageName_2.value;
            }
            if (imageName_3 != undefined) {
                image_3 = imageName_3.value;
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
            // commonData.image_path_1 = backgroundImagePath+'/resource/tagBackGround/'+image_1;
            // commonData.image_path_2 = backgroundImagePath+'/resource/tagBackGround/'+image_2;
            // commonData.image_path_3 = backgroundImagePath+'/resource/tagBackGround/'+image_3;

            commonData.image_path = '<%=global.config.backgroundImagePath%>' ;

            commonData.image_name_1 = image_1;
            commonData.image_name_2 = image_2;
            commonData.image_name_3 = image_3;
             //Add save image location ->by jylee 230214
             if(commonData.image_name_1 == "")
                image_name_1_loc = "";
            else 
                image_name_1_loc = "/resource/tagBackgroud/"+commonData.image_name_1;
            if(commonData.image_name_2 == "")
                image_name_2_loc = "";   
            else
                image_name_2_loc = "/resource/tagBackgroud/"+commonData.image_name_2;   
            if(commonData.image_name_3 == "") 
                image_name_3_loc = "";             
            else 
                image_name_3_loc = "/resource/tagBackgroud/"+commonData.image_name_3; 

            commonData.image_type_1 = image_type_1;
            commonData.image_type_2 = image_type_2;
            commonData.image_type_3 = image_type_3;
            commonData.thirdPartyType = thirdParty.options[thirdParty.selectedIndex].value;

            // if (image_1 == image_2) {
            //     if (image_1 == "" && image_2 == "") {

            //     } else {
            //         alertPopUp('error', "Page 1 & Page 2 중복입니다.");
            //         return;
            //     }
            // } else if (image_1 == image_3) {
            //     if (image_1 == "" && image_3 == "") {

            //     } else {
            //         alertPopUp('error', "Page 1 & Page 3 중복입니다.");
            //         return;
            //     }
            // } else if (image_2 == image_3) {
            //     if (image_2 == "" && image_3 == "") {

            //     } else {
            //         alertPopUp('error', "Page 2 & Page 3 중복입니다.");
            //         return;
            //     }
            // }

            let tagInfoJson1 = "";
            let tagInfoJson2 = "";
            let tagInfoJson3 = "";

            if (selectedConvertedJson[0] != undefined) {
                if (typeof selectedConvertedJson[0] == "string") {
                    tagInfoJson1 = selectedConvertedJson[0];
                } else {
                    tagInfoJson1 = JSON.stringify(selectedConvertedJson[0]);
                }
            }

            if (selectedConvertedJson[1] != undefined) {
                if (typeof selectedConvertedJson[1] == "string") {
                    tagInfoJson2 = selectedConvertedJson[1];
                } else {
                    tagInfoJson2 = JSON.stringify(selectedConvertedJson[1]);
                }
            }

            if (selectedConvertedJson[2] != undefined) {
                if (typeof selectedConvertedJson[2] == "string") {
                    tagInfoJson3 = selectedConvertedJson[2];
                } else {
                    tagInfoJson3 = JSON.stringify(selectedConvertedJson[2]);
                }
            }

            commonData.tag_info_json_1 = tagInfoJson1;
            commonData.tag_info_json_2 = tagInfoJson2;
            commonData.tag_info_json_3 = tagInfoJson3;

            let collectionClass = document.querySelectorAll('.collectionData');
            let collectionArr = [];

            for (let i = 0; i < collectionClass.length; i++) {
                let tempJarr = {};
                let data1 = collectionClass[i];
                let idx = "";
                for (let j = 0; j < data1.children.length; j++) {
                    let data2 = data1.children[j].children[0];
                    if (data2.id !== "") {
                        idx = data2.id;
                    }
                    if (data2.nodeType === 1) {
                        let key = data2.name;
                        let value = data2.value;
                        if (value !== undefined) {
                            tempJarr[key] = value
                        }
                    } else if (data2.nodeType === 3) {
                        let key = data2.name;
                        let value = data2[data2.selectedIndex].value;
                        if (value !== undefined) {
                            tempJarr[key] = value
                        }
                    }
                }
                tempJarr["idx"] = idx;
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
                url: "<%=global.config.apiServerUrl%>/tag-register/edit",
                headers: {
                    'Content-Type': "application/json",
                },
                type: "post",
                sendData: {
                    insertData
                }
            };



            ajax(options, function (data) {
                alertPopUp('success', "Smart Tag Edit Success");

                let selectedTagType = thirdParty.options[thirdParty.selectedIndex].value
                if(selectedTagType == "kanban"){  //유연적시

                    let collectionDataKey = document.getElementsByName("collectionDataKey");
                    let collectionDataValue = document.getElementsByName("collectionDataValue");
        
                    let nfcValue = "";
                    for(let i = 0 ; i < collectionDataKey.length; i++){
                        if(collectionDataKey[i].value == "nfc_id"){
                            nfcValue = collectionDataValue[i].value;
                        }
                    }
                    
                    // Send a tag edit message to Server ->by jylee 230207 
                    let bodyJson = {
                        "tid" : Math.random().toString(36).substr(2, 11),                        
                        "eventTime" : moment(new Date().getTime()).format('YYYY-MM-DD hh:mm:ss'),
                        "thingid" : tagThingId.value,                      
                        "currentPage" : tag_current_pageno,  
                        "templateList" : [
                            {"templateName1":commonData.image_name_1, "templateLoc1": image_name_1_loc, "pageNb":"1"},
                            {"templateName2":commonData.image_name_2, "templateLoc2": image_name_2_loc, "pageNb":"2"},
                            {"templateName3":commonData.image_name_3, "templateLoc3": image_name_3_loc, "pageNb":"3"}
                          ],                                                                                                              
                        "status" : "update"                          
                        
                    }
                    
                    //console.log("### Send : thingid " + JSON.stringify(bodyJson)); 
                    //console.log("### Send : currentPage " + tag_current_pageno.value); 
                    
                    
                    mqttClient.publish("/thingid", JSON.stringify(bodyJson));
                }
                else{ //선택안함

                }


                $('#tagEditModal').modal('hide');

                setTimeout(() => {
                    location.href = '/main.do'
                }, 1000);
            } , function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });
        })

        document.getElementById("tagLocation").addEventListener("click", function (e) {
            let x = e.clientX;
            let y = e.clientY;
            locationInfo(x, y);
        })

        $(document).on('hidden.bs.modal', function (event) {
            if ($('.modal:visible').length) {
                $('body').addClass('modal-open');
            }
        });
    }

    const eventListener = () => {
        getList();
        mqttConnect();
    }

    const locationInfo = (x, y) => {
        $('#tagLocationModal').modal('show');
        loadLocation("", "#tagLocationBody");

        $('#tagLocationModal').css({
            "top": y,
            "left": x
        })

        $('#tagEditModal').on('hidden.bs.modal', function (e) {
            getList();
        })


        $('#tagLocationModalDialog').css({
            "margin": 0
        })

        document.getElementById("selectLocationBtn").addEventListener("click", function (e) {
            let tagLocation = document.getElementById("tagLocation");
            if(selectedLocaion.title == undefined || selectedLocaion.key == undefined){
                alertPopUp("error","<%=__('Please select a location')%>");            //location을 선택하세요.");
                return;
            }
            tagLocation.value = selectedLocaion.title;
            tagLocation.placeholder = selectedLocaion.key;
        })
    }

    eventListener();
})