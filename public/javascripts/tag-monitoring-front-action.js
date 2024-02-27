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
    let curDelTagIdx = 0;
    let select_zigbee_tag = null;
    let select_ble_tag = null;

    const mqttMessage = (data) => {
        if(currentPage != "tag-monitoring"){
            return;
        }


        <% if ( global.config.runningMode == "debug" ){ %>
            console.log("mqtt onMessage receive:" +(new Date()).toString()+":" + data.payloadString);
        <% }%>

        
        let rcvTopic = data.topic;
        let value = data.payloadString;
        let jsonValue = JSON.parse(value).tag_data;
        let thingid = data.destinationName.split("/")[2];
        let inputTagThingId = tagThingIdD.value;
        let tag_wakeup_prd_thingid = document.getElementById("tag_wakeup_prd_"+thingid);
        let wakeup_prd;

        //console.log("Receive Topic : " + data.topic);     //for debug by jylee             
        
        // Change delete smart tag flow ->by jylee 230504
        if(rcvTopic == "/epaper/delete") {
            deleteSmartTagConfirm(value);
            return;
        }

        if ( tag_wakeup_prd_thingid != null){
            wakeup_prd = parseInt(tag_wakeup_prd_thingid.innerText);            
        }else{           
            return;     //화면에 보이지 않을 경우 속도를 위해 return
        }

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

            for(let i = 0 ; i < data.data.tagCollectionList.length; i++) {
                let node_name = data.data.tagCollectionList[i].node_name;
                let variable_name = data.data.tagCollectionList[i].variable_name;

                if(variable_name == "batt_gauge"){
                    let value = data.data.tagCollectionList[i].variable_value;                    
                    let tag_battery_node = document.getElementById("tag_battery_"+node_name);
                  
                    if (tag_battery_node != undefined ){
                        tag_battery_node.innerHTML = value;                        
                    }                    
                                                            
                }
            }
               
            let ckeck_conn_prd = 10 * 60 * 1000;    // change checktime to 10 minutes ->by jylee 
            for(let i = 0 ; i < data.data.tagCollectionList.length; i++) {  //any data
                let currentTime = new Date().getTime();
                if(parseInt((currentTime - parseInt(data.data.tagCollectionList[i].upd_time))) < ckeck_conn_prd * 3 ){
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
                    //let circle =  ' <svg height="40" width="40"> ';         //기존 파란색은 green으로 변경(2023.01.26)
                    //circle += '	<circle name="collectionCircle" id="collectionCircle_'+thingid  +'" cx="20" cy="20" r="20"  fill="green" /> ';
                    //circle += ' </svg> '; 
                    // If connection message received after 10 minutes, connection is fail ->by jylee 230315
                    let circle =  ' <svg height="40" width="40"> ';
                    circle += '	<circle name="collectionCircle" id="collectionCircle_'+thingid  +'" cx="20" cy="20" r="20"  fill="red" /> ';
                    circle += ' </svg> '; 

                    let tagConnection_tmp = document.getElementById("tagConnection_"+thingid);
                    if ( tagConnection_tmp != undefined ){
                        tagConnection_tmp.innerHTML = circle;
                    }
                    //if((thingid == "CWTAG_29")||(thingid == "CWTAG_42")||(thingid == "CWTAG_102") ||(thingid == "WTAG_idr42")) {
                    //    let tagConnection_tmp = document.getElementById("tagConnection_"+thingid);
                    //    let circle =  ' <svg height="40" width="40"> ';
                    //    circle += '	<circle name="collectionCircle" id="collectionCircle_'+thingid +'" cx="20" cy="20" r="20"  fill="green" /> ';
                    //    circle += ' </svg> '; 
                    //    if ( tagConnection_tmp != undefined ){
                    //        tagConnection_tmp.innerHTML = circle
                    //    }
                    //}   
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
                "pageSize":g_currentPageSize,
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
            let batt_val;
                
            tagListBody.innerHTML = "";

            let ckeck_conn_prd = 10 * 60 * 1000;
            let currentTime = new Date().getTime();
            debugger; 
            for (let i = 0; i < tagList.length; i++) {
                //elvis
                if (tagList[i].tag_thing_id == 'CWTAG_29' ||
                tagList[i].tag_thing_id == 'CWTAG_42' ||
                tagList[i].tag_thing_id == 'CWTAG_102' ||
                tagList[i].tag_thing_id == 'WTAG_idr42')
                {
                    continue;
                }

                bodyHtml += " <tr>";
                bodyHtml += '   <td class="d-none" scope="col">';
                bodyHtml += '       <div class="custom-control custom-checkbox" >';
                bodyHtml += '           <input type="checkbox" id="tagListCheck' + tagList[i].idx + '" class="custom-control-input">';
                bodyHtml += '           <label class="custom-control-label" for="tagListCheck' + tagList[i].idx + '"  ></label>';
                bodyHtml += '       </div>';
                bodyHtml += '   </td>';
                bodyHtml += "   <td id ='tag_name_" + tagList[i].idx + "'>" + tagList[i].tag_name + "</td>";                
                bodyHtml += "   <td id ='tag_thing_id_" + tagList[i].idx + "'>" + tagList[i].tag_thing_id + "</td>";
                 // Add tag tag_type and tag_size ->by jylee 230214 
                 debugger;
                bodyHtml += "   <td id ='tag_type_id_" + tagList[i].idx + "'>" + tagList[i].node_type + "</td>";
                bodyHtml += "   <td id ='tag_size_id_" + tagList[i].idx + "'>" + tagList[i].tag_size + "</td>";                
                bodyHtml += "   <td placeholder='" + tagList[i].tag_location + "' id ='tag_location_" + tagList[i].idx + "'>" + tagList[i].location_name + "</td>";
                //bodyHtml += "   <td class='d-none' id ='tag_location_value_"+tagList[i].idx+"'>"+tagList[i].tag_location+"</td>";
                bodyHtml += "   <td class='d-none' id ='thirdParty_" + tagList[i].idx + "'>" + tagList[i].third_party_type + "</td>";
               
                if(tagList[i].tag_batt_type === "R")
                    tagList[i].tag_batt_type = "Rechargable";
                else tagList[i].tag_batt_type = "CoinCell";
                bodyHtml += "   <td id ='tag_batt_id_" + tagList[i].idx + "'>" + tagList[i].tag_batt_type + "</td>";
                bodyHtml += "   <td class='d-none' id ='tag_wakeup_prd_" + tagList[i].tag_thing_id + "'></td>";               
                bodyHtml += "   <td class='d-none' id ='tag_mfr_id_" + tagList[i].idx + "'>" + tagList[i].tag_mfr + "</td>";

                //elvis
                let circle = '';
                //if(parseInt((currentTime - parseInt(tagList[i].upd_time))) < ckeck_conn_prd * 3 ){
                if(parseInt((currentTime - parseInt(tagList[i].update_dt))) < ckeck_conn_prd * 3 ){
                    
                    circle =  ' <svg height="40" width="40"> ';
                    circle += '	<circle name="collectionCircle" id="collectionCircle_'+tagList[i].tag_thing_id  +'" cx="20" cy="20" r="20"  fill="green" /> ';
                    circle += ' </svg> '; 
                }
                else{
                    circle =  ' <svg height="40" width="40"> ';
                    circle += '	<circle name="collectionCircle" id=collectionCircle_'+tagList[i].tag_thing_id  +' cx="20" cy="20" r="20"  fill="red" /> ';
                    circle += ' </svg> '; 
                }

                bodyHtml += "   <td id ='tagConnection_" + tagList[i].tag_thing_id  + "'>"+circle+"</td>";
                bodyHtml += "   <td id ='tag_battery_" + tagList[i].tag_thing_id + "'>" + tagList[i].variable_value + "</td>";
                bodyHtml += "   <td id ='tag_current_page_" + tagList[i].idx + "'>" + tagList[i].current_page + "</td>";  
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-success" data-original-title="Edit Task" name = "tagDetail" id="tagDetail_' + tagList[i].idx + '"><i class="la la-2x la-pie-chart"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-success" data-original-title="Edit Task" name = "tagPub" id="tagPub_' + tagList[i].idx + '"><i class="la la-2x la-print"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-success" data-original-title="Edit Task" name = "lastImage" id="lastImage_' + tagList[i].idx + '"><i class="la la-2x la-image"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "tagEdit" id="tagEdit_' + tagList[i].idx + '"><i class="la la-2x la-edit"></i></button></td>';
                //bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-danger" data-original-title="Remove" name = "tagRemove" id="tagRemove_' + tagList[i].idx + '"><i class="la la-2x la-times"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-danger" data-original-title="Remove" name = "tagRemove" id="tagRemove_' + tagList[i].idx + '"><i class="la la-2x la-trash"></i></button></td>';
                bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "tagFind" id="tagFind_' + tagList[i].idx + '"><i class="la la-2x la-map-marker"></i></button></td>';
                
                if(tagList[i].tag_thing_id.split("_")[0].includes("ZTAG")){
                    bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "bleMapping" id="bleMapping_' + tagList[i].idx + '"><i class="la la-2x la-link"></i></button></td>';
                }else{
                    bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "bleMapping" id="bleMapping_' + tagList[i].idx + '"><i class="la la-2x la-minus"></i></button></td>';
                }
                
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
                    //Modify find tagList ID for resolving sorting issue ->by jylee 230329 
                    //let idx = tagRemoveBtn[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    let idx = tagList[i].idx
                    //console.log("tagRemoveBtn Idx = " + tagList[i].idx);  
                    deleteSmartTag(idx);                   
                    
                },{ passive: true })
            }

            let tagEdit = document.getElementsByName('tagEdit');
            for (let i = 0; i < tagEdit.length; i++) {
                tagEdit[i].addEventListener('click', function (e) {
                    //Modify find tagList ID for resolving sorting issue ->by jylee 230329
                    //let idx = tagEdit[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    let idx = tagList[i].idx   
                    editSmartTag(idx);
                },{ passive: true })
            }

            let tagDetail = document.getElementsByName('tagDetail');
            for (let i = 0; i < tagDetail.length; i++) {
                tagDetail[i].addEventListener('click', function (e) {
                    //Modify find tagList ID for resolving sorting issue ->by jylee 230329
                    //let idx = tagDetail[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    let idx = tagList[i].idx  
                    detailSmartTag(idx);
                },{ passive: true })
            }
            
            let tagPub = document.getElementsByName('tagPub');
            for (let i = 0; i < tagPub.length; i++) {

                tagPub[i].addEventListener('click', function (e) {
                    //Modify find tagList ID for resolving sorting issue ->by jylee 230329
                    //let idx = tagPub[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    let idx = tagList[i].idx  
                    pubSmartTag(idx);
                },{ passive: true })
            }
            
            let lastImage = document.getElementsByName('lastImage');
            for (let i = 0; i < lastImage.length; i++) {

                lastImage[i].addEventListener('click', function (e) {
                    //Modify find tagList ID for resolving sorting issue ->by jylee 230329
                    //let idx = lastImage[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                    let idx = tagList[i].idx   
                    showlastImage(idx);
                },{ passive: true })
            }

            // Add Function Tag Find Me Search
            let tagFindBtn = document.getElementsByName('tagFind');
            
            for (let i = 0; i < tagFindBtn.length; i++) {
                tagFindBtn[i].addEventListener('click', function (e) {  // idx == smart_tag_info
                    let idx = tagList[i].idx
                    findSmartTag(idx);                   
                    
                },{ passive: true })
            }

            // Add Function Zigbee and BLE tag Mapping Search 
            let bleMapping = document.getElementsByName('bleMapping');
            
            for (let i = 0; i < bleMapping.length; i++) {
                bleMapping[i].addEventListener('click', function (e) {  // idx == smart_tag_info
                    let idx = tagList[i].idx

                    if(tagList[i].tag_thing_id.split("_")[0].includes("ZTAG")){
                        bleMappgingTag(tagList[i]); 
                    }else{
                        alertPopUp('error', "ZIGBEE TAG만 매핑이 가능합니다.");
                    }
                                      
                    
                },{ passive: true })
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
                    "ordering": true,           // regarding data sorting
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
                    },
                    // Add drawCallback function for pagination ->by jylee 230318
                    drawCallback: function(){
                        $('.paginate_button:not(.disabled)', this.api().table().container())          
                           .on('click', function(){
                                let lastImage = document.getElementsByName('lastImage');
                                let start_page = (dataTable.page.info().page * dataTable.page.info().length);
                                let end_page = start_page + lastImage.length;                                
                                for (let i =  start_page; i < end_page; i++) {
                                    let idx = lastImage[i - dataTable.page.info().page * dataTable.page.info().length].id.split('_')[1];
                                    let tag_thing_id = $('#tag_thing_id_' + idx).text();
                                    //console.log("tag_thing_id = " + tag_thing_id);  // by jylee    
                                    getWakeUpPrd(tag_thing_id);    
                                }
                                
                           });       
                     },
                        
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

    }
    /*
    {"thingId":"CWTAG_D43D391CED30","useYn":"N"}
    */
    const deleteSmartTagConfirm = (value) => {
        
        //console.log("###jsonObj : " + JSON.stringify(value));     //for debug by jylee 
        let thingIdValue = JSON.parse(value).thingId;
        let useValue = JSON.parse(value).useYn;
        
        //console.log("curDelIndex : " +curDelTagIdx);
        //console.log("thingIdValue : " + thingIdValue);
        //console.log("useValue :" + useValue);

        if(useValue == "N"){
            
            let options = {
                url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-delete",
                type: "post",
                headers: {
                    'Content-Type': "application/json",
                },
                sendData: {
                    "idx": curDelTagIdx,
                }
            };

            ajax(options, function (data) {
                alertPopUp('success', "<%=__('Smart Tag Deleted')%>");             //Smart Tag 삭제 완료");

                loadPage('tag-monitoring', '#right-panel')
            } , function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });
            
        }
        else {
            alertPopUp('success', "<%=__('Smart Tag Used')%>");             //Smart Tag 삭제 완료");
        }

    }


    const deleteSmartTag = (idx) => {
        /*
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
               
                mqttClient.publish("/thingid", JSON.stringify(bodyJson));
                
                loadPage('tag-monitoring', '#right-panel')
            } , function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            });
        })
        */
        // Change delete smart tag flow ->by jylee 230504
        alertPopUp('warning', "<%=__('Are you sure you want to delete it?')%>");          //정말 삭제하시겠습니까?");
        $('.swal-button--confirm').on('click', function (e) {

            // Send a tag delete message to Server ->by jylee 230207 
            mqttClient.unsubscribe("/epaper/delete");
            mqttClient.subscribe("/epaper/delete");    
            curDelTagIdx = idx;
           
            let bodyJson = {
                "tid" : Math.random().toString(36).substr(2, 11),                        
                "eventTime" : moment(new Date().getTime()).format('YYYY-MM-DD hh:mm:ss'),
                "thingid" : document.getElementById('tag_thing_id_' + idx).innerText,             
                "status" : "delete"   
            }
            mqttClient.publish("/thingid", JSON.stringify(bodyJson));           

        })
        
    }
    
    /* Add fucntion of find tag by led On -> by jylee 230423 */
    const findSmartTag = (idx) => {       
        let tag_thing_id = $('#tag_thing_id_' + idx).text();
        let tag_mfr_id = $('#tag_mfr_id_' + idx).text();
        //console.log("#### tag_thing_id : " + tag_thing_id);
        if(tag_mfr_id == "Cronus") {
            if ( tag_thing_id.indexOf("CWTAG") != (-1)) {
                imageServerUrl = "<%=global.config.sendImageServerUrl%>/turn_on_led/" + tag_thing_id;  
            }
            else {             
                //console.log("###" +imageServerUrl);
                alert("Don't support BLE Tag for finding Led");          
                return;
            } 
        }
        else {   
            alert("Don't support Other Tag for finding Led");   // TBD
            //console.log(imageServerUrl);
            return;
        }

        let options = "";
        //imageServerUrl = "<%=global.config.sendImageServerUrl%>/init_image/" + tagThingId.value;
        options = {
            url: imageServerUrl,    //전이사님 image process server 전송
            headers: {
                'Content-Type': "application/x-www-form-urlencoded",
                //'Content-Type': "application/json",
                'Access-Control-Allow-Origin' : "*"
            },
            type: "post",
            sendData: {
                "postData" : {
                    "cmd" : "led",          // cmd 는 led - 일정 시간 동안 켜졌다 꺼짐, blink - 깜박임
                    "args": {
                        "r": "255",         // red
                        "g": "0",           // green
                        "b": "255",         // blue
                        "timeout": "3000"   // LED 켜지는 시간, ms
                    }
                }
            }
        };    
                
        ajax(options, function (data) { 
            alertPopUp('success', "<%=__('Smart Tag Led On')%>");             //Smart Tag 삭제 완료");                       
        } , function (error) {
            //alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    
    /* Add fucntion of zigbee and ble tag by led On -> by parksangmoon 240214 */
    const bleMappgingTag = (tagList) => {       
        let idx = tagList.idx;
        let thingid = tagList.tag_thing_id;

        getTagZigbeeBleResult(idx,thingid);
        getNotMappingBleResult(thingid);

    }

    const getTagZigbeeBleResult = (idx,thingid) => {   

        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-zigbee-ble",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                idx: idx,
                thingid: thingid
            }
        };

        ajax(options, function (data) { 
            
            if(data.status == "OK"){
                let result = data.data.getTagZigbeeBleResult;
                $('#tagZigBeeBleMappingModal').modal("show");

                let bodyHtml = "";
                tagZigBeeBleMappingModalListBody.innerHTML = "";

                if(result.length > 0){
                    
                    for (let i = 0; i < result.length; i++) {
                        bodyHtml += " <tr>";
                        bodyHtml += '   <td>'+result[i].zigbee_thing_id+'</td>';
                        bodyHtml += '   <td>'+result[i].ble_thing_id+'</td>';
                        bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-danger" data-original-title="Remove" name = "tagZigBeeBleMappingModalRemove" id="tagZigBeeBleMappingModalRemove_' + result[i].idx + '"><i class="la la-2x la-trash"></i></button></td>';
                        bodyHtml += "</tr>";
                    }
                    
                }else{
                    bodyHtml += " <tr>";
                    bodyHtml += '   <td>'+thingid+'</td>';
                    bodyHtml += '   <td>-</td>';
                    bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary disabled" data-original-title="Remove" name = "tagZigBeeBleMappingModalRemove" id="tagZigBeeBleMappingModalRemove_' + idx + '"><i class="la la-2x la-trash"></i></button></td>';
                    bodyHtml += "</tr>";
                }

                tagZigBeeBleMappingModalListBody.innerHTML = bodyHtml;

                if(result.length > 0){
                    let tagZigBeeBleMappingModalRemoveBtn = document.getElementsByName('tagZigBeeBleMappingModalRemove');
            
                    for (let i = 0; i < tagZigBeeBleMappingModalRemoveBtn.length; i++) {
                        tagZigBeeBleMappingModalRemoveBtn[i].addEventListener('click', function (e) {  // idx == smart_tag_info
                            select_ble_tag = result[i].ble_thing_id;
                            removeZigbeeBleTag();                   
                        },{ passive: true })
                    }
                }

            }
                                
        } , function (error) {
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
            $('#tagZigBeeBleMappingModal').modal("hide");
        });
    }

    const getNotMappingBleResult = (zigbee_thing_id) => { 
        select_zigbee_tag = zigbee_thing_id;
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/not-mapping-ble",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                
            }
        };

        ajax(options, function (data) { 
            if(data.status == "OK"){
                let result = data.data.getNotMappingBleResult;

                let bodyHtml = "";
                tagNotBleMappingModalListBody.innerHTML = "";

                if(result.length > 0){
                    
                    for (let i = 0; i < result.length; i++) {
                        bodyHtml += " <tr style='display: table; width:100%;'>";
                        bodyHtml += '   <td style="width:63%;">'+result[i].tag_thing_id+'</td>';
                        bodyHtml += '   <td style="width:37%;"><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "tagNotBleMappingModalEdit" id="tagNotBleMappingModalEdit_' + result[i].idx + '"><i class="la la-2x la-edit"></i></button></td>';
                        bodyHtml += "</tr>";
                    }
                }else{
                    bodyHtml += " <tr style='display: table; width:100%;'>";
                    bodyHtml += '   <td style="width:63%;">-</td>';
                    bodyHtml += '   <td style="width:37%;">-</td>';
                    bodyHtml += "</tr>";
                }

                tagNotBleMappingModalListBody.innerHTML = bodyHtml;

                if(result.length > 0){
                    let tagNotBleMappingModalEditBtn = document.getElementsByName('tagNotBleMappingModalEdit');
            
                    for (let i = 0; i < tagNotBleMappingModalEditBtn.length; i++) {
                        tagNotBleMappingModalEditBtn[i].addEventListener('click', function (e) {  // idx == smart_tag_info
                            let ble_thing_id = result[i].tag_thing_id
                            saveZigbeeBleTag(ble_thing_id);                   
                        },{ passive: true })
                    }
                }

               
            }
                                
        } , function (error) {
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

        
    }

    const saveZigbeeBleTag = (ble_thing_id) => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/save-zigbee-ble",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                zigbeeThingId : select_zigbee_tag,
                bleThingId : ble_thing_id
            }
        };

        ajax(options, function (data) { 
            if(data.status == "OK"){
                // M/W에 전달
                ultraZigbeeBle(select_zigbee_tag,ble_thing_id,"1");
                alertPopUp("success","<%=__('Processed')%> / ");
                $('#tagZigBeeBleMappingModal').modal("hide");
            }
        } , function (error) {
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    const removeZigbeeBleTag = () => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/remove-zigbee-ble",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                zigbeeThingId : select_zigbee_tag
            }
        }

        ajax(options, function (data) { 
            if(data.status == "OK"){
                // M/W에 전달
                ultraZigbeeBle(select_zigbee_tag,select_ble_tag,"0");
                alertPopUp("success","<%=__('Deleted')%> / ");
                $('#tagZigBeeBleMappingModal').modal("hide");
            }
        } , function (error) {
            alertPopUp("success","<%=__('Deleted')%> / ");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    const ultraZigbeeBle = (zigbeeThingId,bleThingId,opCode) => {
        let sendData= {
            thingid: zigbeeThingId,
            tid: Math.random().toString(36).substr(2, 11),
            msg_type: "ReportData",
            thing_type: zigbeeThingId.split("_")[0],
            tag_data: {
                ble_thingid: bleThingId, // ble thing id
                op_code: opCode // 1 - 생성/수정, 0 - 삭제
            }
        };

        mqttClient.publish("/Ultra/"+zigbeeThingId+"/zigbee_ble", JSON.stringify(sendData));
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
                    //let imageComponentJson = {
                    //    "object_id": "",
                    //    "drawing_type": "image",
                    //    "color": "#000000",
                    //    "thickness": 8,
                    //    "fill": false,
                    //    "points": [],
                    //    'data': ""
                    //}

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
                        element.addEventListener('click', () => {
                            $('#taglayoutListModal').modal('show');
                            $('#pageLayoutNumber').text(i + 1);
                           
                        },{ passive: true })
                        
                    }
                    // Add remove(tagRemoveBtn) template on tag page ->by jylee 230331 
                    let selectLayout_Remove = document.getElementsByName("selectLayout_Remove");
                    //console.log("selectLayout_Remove length : " + selectLayout_Remove.length)
                    for (let i = 0; i < selectLayout_Remove.length; i++) {
                       
                        selectLayout_Remove[i].addEventListener('click', function (e) {  // idx == smart_tag_info
                           
                            let pageNumber =  (i+1);
                            //console.log("### pageNumber :" +pageNumber);
                            $('#selectedLayout_' + pageNumber + ' > img').remove();
                            $('#selectedLayout_' + pageNumber + ' > input').remove();
                            //data.data.tagLayoutList[pageNumber].tag_info_json = "";
                            selectedConvertedJson[i] = "";
                            //data.data.tagLayoutList[i].tag_image_file_name = "";
                        },{ passive: true })
                       
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
                            //console.log("Add PageNumber : " + pageNumber);
                            $('#selectedLayout_' + pageNumber + ' > img').remove();
                            $('#selectedLayout_' + pageNumber + ' > input').remove();
                            $('#selectedLayout_' + pageNumber).append('<img class="border border-dark" style="width:296px; height:128px;" src="' + src + '"></img><input type="hidden" id="imageType_' + pageNumber + '" name="imageType" value = "' + imageType + '"><input type="hidden" id="imageName_' + pageNumber + '" name="imageName" value = "' + tag_image_file_name + '">');
                            
                        },{ passive: true })
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
                },{ passive: true })
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
                },{ passive: true })
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
            $('#lastImage_1 > img').attr("src", "<%=global.config.sendImageServerUrl%>/last_image/"+tag_thing_id);          
            /*
            $('#lastImage_2 > img').attr("src", "<%=global.config.sendImageServerUrl%>/images/"+tag_thing_id+"_2.png");
            $('#lastImage_3 > img').attr("src", "<%=global.config.sendImageServerUrl%>/images/"+tag_thing_id+"_3.png");
            */
            
        }
        else{            
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
            $('#tagPubList_4 > img').remove();
            $('#tagPubList_5 > img').remove();

            document.getElementById("tagSelectBtn_1").classList.add("d-none");
            document.getElementById("tagSelectBtn_2").classList.add("d-none");
            document.getElementById("tagSelectBtn_3").classList.add("d-none");
            document.getElementById("tagSelectBtn_4").classList.add("d-none");
            document.getElementById("tagSelectBtn_5").classList.add("d-none");

            if (tagLayoutList != undefined) {
                selectedConvertedJson[0] = tagLayoutList.tag_info_json_1;
                selectedConvertedJson[1] = tagLayoutList.tag_info_json_2;
                selectedConvertedJson[2] = tagLayoutList.tag_info_json_3;
                selectedConvertedJson[3] = tagLayoutList.tag_info_json_4;
                selectedConvertedJson[4] = tagLayoutList.tag_info_json_5;

                let canvas_1 = new fabric.Canvas();
                let canvas_2 = new fabric.Canvas();
                let canvas_3 = new fabric.Canvas();
                let canvas_4 = new fabric.Canvas();
                let canvas_5 = new fabric.Canvas();

                let image_name_1;
                let image_name_2;
                let image_name_3;
                let image_name_4;
                let image_name_5;

                //console.log("tagLayoutList.length : " + data.data.tagLayoutList.length);

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
                    } else if (index == 3) {
                        canvas_4.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_4.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_4.setWidth(296);
                                canvas_4.setHeight(128);
                            } else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_4.setWidth(400);
                                canvas_4.setHeight(300);
                            } else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_4.setWidth(800);
                                canvas_4.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_4.setWidth(960);
                                canvas_4.setHeight(640);
                            }    
                            image_name_4 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_4 !== "" && image_name_4 !== undefined) {
                                $('#tagPubList_4 > img').remove();
                                $('#tagPubList_4 > input').remove();
                                $('#tagPubList_4').append('<img class="border border-dark" style="width:400px; height:300px;" src="' + canvas_4.toDataURL() + '"></img><input type="hidden" id="imageType_4" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_4" name="imageName" value = "' + image_name_4 + '">');
                                document.getElementById("tagSelectBtn_4").classList.remove("d-none");

                            }
                        });
                    }
                    else if (index == 4) {
                        canvas_5.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_5.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_5.setWidth(296);
                                canvas_5.setHeight(128);
                            } else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_5.setWidth(400);
                                canvas_5.setHeight(300);
                            } else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_5.setWidth(800);
                                canvas_5.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_5.setWidth(960);
                                canvas_5.setHeight(640);
                            }    
                            image_name_5 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_5 !== "" && image_name_5 !== undefined) {
                                $('#tagPubList_5 > img').remove();
                                $('#tagPubList_5 > input').remove();
                                $('#tagPubList_5').append('<img class="border border-dark" style="width:400px; height:300px;" src="' + canvas_5.toDataURL() + '"></img><input type="hidden" id="imageType_5" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_5" name="imageName" value = "' + image_name_5 + '">');
                                document.getElementById("tagSelectBtn_5").classList.remove("d-none");

                            }
                        });
                    }
                }
            }

            selectedPageNumber = -1;
            let tagSelectBtn = document.getElementsByName("tagSelectBtn");
            document.getElementById("dataField").classList.add("d-none");
            //console.log("tagSelectBtn.length : " + tagSelectBtn.length);  //by jylee 
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
                },{ passive: true })
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
            $('#selectedLayout_4 > img').remove();
            $('#selectedLayout_5 > img').remove();

            if (tagLayoutList != undefined) {
                selectedConvertedJson[0] = tagLayoutList.tag_info_json_1;
                selectedConvertedJson[1] = tagLayoutList.tag_info_json_2;
                selectedConvertedJson[2] = tagLayoutList.tag_info_json_3;
                selectedConvertedJson[3] = tagLayoutList.tag_info_json_4;
                selectedConvertedJson[4] = tagLayoutList.tag_info_json_5;

                let canvas_1 = new fabric.Canvas();
                let canvas_2 = new fabric.Canvas();
                let canvas_3 = new fabric.Canvas();
                let canvas_4 = new fabric.Canvas();
                let canvas_5 = new fabric.Canvas();
                let image_name_1;
                let image_name_2;
                let image_name_3;
                let image_name_4;
                let image_name_5;

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
                    } else if (index == 3) {
                        canvas_4.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_4.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_4.setWidth(296);
                                canvas_4.setHeight(128);
                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_4.setWidth(400);
                                canvas_4.setHeight(300);

                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_4.setWidth(800);
                                canvas_4.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_4.setWidth(960);
                                canvas_4.setHeight(640);
                            }    

                            image_name_4 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_4 !== "" && image_name_4 !== undefined) {
                                $('#selectedLayout_4 > img').remove();
                                $('#selectedLayout_4 > input').remove();
                                $('#selectedLayout_4').append('<img class="border border-dark" style="width:296px; height:128px;" src="' + canvas_4.toDataURL() + '"></img><input type="hidden" id="imageType_4" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_4" name="imageName" value = "' + image_name_4 + '">');
                            }
                        });
                    } else if (index == 4) {
                        canvas_5.loadFromJSON(data.data.tagLayoutList[i].tag_info_json, function () {
                            canvas_5.renderAll();
                            let image_type = list.image_type;
                            if (data.data.tagLayoutList[i].tag_size == "2_9") {
                                canvas_5.setWidth(296);
                                canvas_5.setHeight(128);
                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "4_2") {
                                canvas_5.setWidth(400);
                                canvas_5.setHeight(300);

                            } 
                            else if (data.data.tagLayoutList[i].tag_size == "7_5") {
                                canvas_5.setWidth(800);
                                canvas_5.setHeight(480);
                            }
                            else if (data.data.tagLayoutList[i].tag_size == "10_2") {
                                canvas_5.setWidth(960);
                                canvas_5.setHeight(640);
                            }    

                            image_name_5 = data.data.tagLayoutList[i].tag_image_file_name;
                            if (image_name_5 !== "" && image_name_5 !== undefined) {
                                $('#selectedLayout_5 > img').remove();
                                $('#selectedLayout_5 > input').remove();
                                $('#selectedLayout_5').append('<img class="border border-dark" style="width:296px; height:128px;" src="' + canvas_5.toDataURL() + '"></img><input type="hidden" id="imageType_5" name="imageType" value = "' + image_type + '"><input type="hidden" id="imageName_5" name="imageName" value = "' + image_name_5 + '">');
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
         //    let trIndex = $(this).closest("tr").index();
         //    if(trIndex>0) {
         //        $(this).closest("tr").remove();
         //    }
        // });
        // $('#addMoreCollection').on('click', function() {
         //    addAction("Collection","");
        // });

        let data = $("#tbCollection tr:eq(1)").clone(true);

        let tag_name = $('#tag_name_' + idx).text();
        let tag_thing_id = $('#tag_thing_id_' + idx).text();
        let tag_location = $('#tag_location_' + idx).text();
        let tag_wakeup_prd = $('#tag_wakeup_prd_' + idx).text();
        let third_party_type = $('#thirdParty_' + idx).text();        
        let tag_current_pageno = $('#tag_current_page_' + idx).text();   //Add current Page Number ->by jylee 230214           
        let tag_size = $('#tag_size_id_' + idx).text();                  //Add tag size info ->by jylee 230316  
        
        tagName.value = tag_name;
        tagThingId.value = tag_thing_id;
        tagLocation.value = tag_location;
        tagLocation.placeholder = $('#tag_location_' + idx).attr("placeholder");
        tagWakeupPrd.value = tag_wakeup_prd;        
        
        thirdParty.value = third_party_type;
        //console.log("thirdPary.value : "+ third_party_type);       
        $("#tagEditModalLabel").text("Thing Edit | " + tag_name);
       
        let current_fs, next_fs, previous_fs;
        let left, opacity, scale;
        let animating;
       
        getTagLayoutList();
       

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
            if(document.getElementById('thirdParty').value == "" || document.getElementById('thirdParty').value == undefined){
                alertPopUp("error","<%=__('Third party Information: Required input information')%>");        //위치 정보 : 필수 입력 정보입니다.");
                document.getElementById('thirdParty').focus();
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
debugger;
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

            let image_0 = "";    
            let image_1 = "";
            let image_2 = "";
            let image_3 = "";
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

            if (imageName_1 != undefined) {
                image_1 = imageName_1.value;
            }
            if (imageName_2 != undefined) {
                image_2 = imageName_2.value;
            }
            if (imageName_3 != undefined) {
                image_3 = imageName_3.value;
            }
            if (imageName_4 != undefined) {
                image_4 = imageName_4.value;
            }
            if (imageName_5 != undefined) {
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
            //Add save image location ->by jylee 230214
            if(tag_size == "2.9") {               
                image_name_0_loc = "/resource/tagBackground/BLANK_2.9.png";
                image_0 = "BLANK_2.9.png";
            }
            else if (tag_size == "4.2") {   
                image_name_0_loc = "/resource/tagBackground/BLANK_4.2.png";
                image_0 = "BLANK_4.2.png";
            }
            else {
                if(tag_size == "10.2") {               
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

            commonData.image_type_1 = image_type_1;
            commonData.image_type_2 = image_type_2;
            commonData.image_type_3 = image_type_3;
            commonData.image_type_4 = image_type_4;
            commonData.image_type_5 = image_type_5;
            commonData.thirdPartyType = thirdParty.options[thirdParty.selectedIndex].value;


            let tagInfoJson1 = "";
            let tagInfoJson2 = "";
            let tagInfoJson3 = "";
            let tagInfoJson4 = "";
            let tagInfoJson5 = "";

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

            if (selectedConvertedJson[3] != undefined) {
                if (typeof selectedConvertedJson[3] == "string") {
                    tagInfoJson4 = selectedConvertedJson[3];
                } else {
                    tagInfoJson4 = JSON.stringify(selectedConvertedJson[3]);
                }
            }

            if (selectedConvertedJson[4] != undefined) {
                if (typeof selectedConvertedJson[4] == "string") {
                    tagInfoJson5 = selectedConvertedJson[4];
                } else {
                    tagInfoJson5 = JSON.stringify(selectedConvertedJson[4]);
                }
            }

            commonData.tag_info_json_1 = tagInfoJson1;
            commonData.tag_info_json_2 = tagInfoJson2;
            commonData.tag_info_json_3 = tagInfoJson3;
            commonData.tag_info_json_4 = tagInfoJson4;
            commonData.tag_info_json_5 = tagInfoJson5;

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

            for (let i = 0; i < collectionClass.length; i++) {
                let tempJarr = {};
                let data1 = collectionClass[i];
                let idx = "";
                for (let j = 0; j < data1.children.length; j++) {
                    let data2 = data1.children[j].children[0];
                    if (data2.id !== "") {
                        idx = data2.id;
                    }
                    //console.log("data2.name : " + data2.name);  //debug by jylee 
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
                        "tagName" : tagName.value,
                        "locationCd" : tagLocation.value,                   
                        "currentPage" : tag_current_pageno,  
                        "templateList" : [
                            {"templateName0":image_0, "templateLoc0": image_name_0_loc, "pageNb":"0"},
                            {"templateName1":commonData.image_name_1, "templateLoc1": image_name_1_loc, "pageNb":"1"},
                            {"templateName2":commonData.image_name_2, "templateLoc2": image_name_2_loc, "pageNb":"2"},
                            {"templateName3":commonData.image_name_3, "templateLoc3": image_name_3_loc, "pageNb":"3"},
                            {"templateName4":commonData.image_name_4, "templateLoc4": image_name_4_loc, "pageNb":"4"},
                            {"templateName5":commonData.image_name_5, "templateLoc5": image_name_5_loc, "pageNb":"5"}
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
        },{ passive: true })

        $(document).on('hidden.bs.modal', function (event) {
            if ($('.modal:visible').length) {
                $('body').addClass('modal-open');
            }
        });
    }

    
    /* Move to this bottom of this file for DOM ->by jylee 230308 */
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
            //let item = {};
            //item[data_key[i].innerText] = document.getElementById('value_' + data_key[i].innerText).value;            
            //console.log("data_key[i].innerText : " + ('value_' + data_key[i].innerText));  //by jylee 
            tagPubJson.insertData.tagdata[data_key[i].innerText] = document.getElementById('value_' + data_key[i].innerText).value;
            
        }
        
        tagPubJson.insertData.thingid = $('.tagThingId').val();
        tagPubJson.insertData.pagenumber = selectedPageNumber.toString();
        let imageServerUrl;

        imageServerUrl = "<%=global.config.sendImageServerUrl_CZTAG%>/send_image/" + $('.tagThingId').val();

        let options = {
            url: imageServerUrl,    //전이사님 image process server 전송
            type: "post",
            sendData: tagPubJson
        };

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

    const eventListener = () => {
        getList();
        //getListNew();
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
        },{ passive: true })
    }

    eventListener();
})