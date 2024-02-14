$(document).ready(function () {

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("map-dashboard.js");
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
    let canvas = new fabric.Canvas('canvas', {
        width:960,
        height:800,
        selection: false
    });

    let chart = undefined;
    let chartSeries = [];
    let chartDataCount = 0;
    let UnassignedCount = 0;
    let normalCount = 0;
    let notCollectedCount = 0;
    // canvas.setWidth(960);
    // canvas.setHeight(800);

    // canvas.setDimensions({
    //     width: "100%",
    //     height: "100%"
    // })


    const mqttMessage = (data) => {
        let value = data.payloadString;
        let jsonValue = JSON.parse(value).tag_data;
        let thingid = data.destinationName.split("/")[2];
        
        let index = [];
        for (let x in jsonValue) {
            index.push(x);
        }
        index.sort(function (a, b) {
            return a == b ? 0 : (a > b ? 1 : -1);
        });

        for (let i = 0; i < Object.keys(jsonValue).length; i++) {
            if( tagThingIdD.value !== thingid ) {
                return;
            }
            
            if (jsonValue[index[i]] == "") {
                jsonValue[index[i]] = "-";
            }

            $('#collectionDataValueD_' + index[i]).val(jsonValue[index[i]]);
            $('#collectionDataValueD_' + index[i]).parent().addClass("has-error");
            $('#collectionDataTimeD_' + index[i]).val(moment(new Date().getTime()).format('YY/MM/DD hh:mm:ss'));
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
                        y: Object.values(jsonValue)[i] ,
                    },
                    true,
                    shift
                    )
                }    
            }
        }
    }

    const mqttConnect = () => {
        mqttClient.onMessageArrived = function (message) {
            mqttMessage(message);
        }.bind(this);
    }

    const initChart = (container) => {
        chart = undefined;
        chartSeries = [];
        chartDataCount = 0;
        
        let batterychartOption = {
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

    const getWakeUpPrd = (thingid,tagList) => {
        let options = {
            url:  "<%=global.config.apiServerUrl%>/tag-monitoring/wakeup-period-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "thingid": thingid,
            }
        }
        UnassignedCount = 0;
        normalCount = 0;
        notCollectedCount = 0;

        ajax(options, function (data) {
            let wakeup_prd = -1;

            for(let i = 0 ; i < data.data.tagCollectionList.length; i++) {
                let node_name = data.data.tagCollectionList[i].node_name;
                let variable_name = data.data.tagCollectionList[i].variable_name;

                if(variable_name == "wakeup_prd"){
                    wakeup_prd = data.data.tagCollectionList[i].variable_value;

                    if(parseInt(wakeup_prd) == 0){
                        wakeup_prd = 30;
                    }
                    if(wakeup_prd == ""){
                        continue;
                    }
                    wakeup_prd = parseInt(wakeup_prd);
                    break;
                }

                if(wakeup_prd == ""){
                    continue;
                }

                if(parseInt(wakeup_prd) == 0){
                    wakeup_prd = 30;
                }
            }

            if(wakeup_prd == -1){
                UnassignedCount++;
            }
            else if(wakeup_prd === ""){
                UnassignedCount++;
            }
            else{

                for(let i = 0 ; i < data.data.tagCollectionList.length; i++) {
                    let currentTime = new Date().getTime();
                    if(parseInt((currentTime - parseInt(data.data.tagCollectionList[i].upd_time))) < wakeup_prd * 1000 * 3 ){
                        normalCount++;
                        break;
                    }
                    else{
                        notCollectedCount++;
                        break;
                    }
                  
                }
            }

            setTimeout(() => {
                let statusChartOption = {
                    chart: {
                        type: 'pie',
                        options3d: {
                            enabled: true,
                            alpha: 45,
                            beta: 0
                        },
                        height:300
                    },
                    plotOptions: {
                        pie: {
                            colors: ["green","#418BCA","#A9A9A9"],
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b> : <br>{point.percentage:.1f} %<br>Count : {point.y}',
                            }
                        }
                    },
                    title: {
                        text: null
                    },
                    accessibility: {
                        point: {
                            valueSuffix: '%'
                        }
                    },

                    series: [{
                        type: 'pie',
                        name: 'Device',
                        data: [
                            {
                                name : 'Green',
                                y : normalCount
                            },{
                                name : 'Blue',
                                y : notCollectedCount
                            },{
                                name : 'Unassigned',
                                y : UnassignedCount
                            }
                        ]
                    }]
                }
                if(currentPage != "map-dashboard"){
                    clearTimeout(dashBoardTimer);
                    return;
                }
                Highcharts.chart("device-chart-container", statusChartOption);
                document.getElementById("deviceUpdatedTime").innerText = "<%=__('Search time')%> : "+moment(parseInt(new Date().getTime())).format("YY/MM/DD hh:mm:ss");   //조회시간
            }, 500);
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    const getTagInfo = () => {
        let options = {
            url:  "<%=global.config.apiServerUrl%>/tag-monitoring/tag-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "searchInfo": JSON.stringify(g_searchInfo),
                "pNumber": g_currentPagingNumber,
                "pageSize": g_currentPageSize,
            }
        };
        ajax(options, function (data) {
            let rootData = data.data;
            let tagList = rootData.tagList;

            let tagListCount = rootData.tagListCount[0].taglistcount
            let bodyHtml = "";


            let highBatteryCount = 0;
            let mediumBatteryCount = 0;
            let lowBatteryCount = 0;
            let noBatteryCount = 0;

            for (let i = 0; i < tagList.length; i++) {
                getWakeUpPrd(tagList[i].tag_thing_id,tagList);
                let options2 = {
                    url:  "<%=global.config.apiServerUrl%>/tag-monitoring/wakeup-period-list",
                    type: "post",
                    headers: {
                        'Content-Type': "application/json",
                    },
                    sendData: {
                        "thingid": tagList[i].tag_thing_id,
                    }
                };
                ajax(options2, function (data) {
                    let wakeup_prd = -1;
                    let haveBattGauge = 0;



                    let existBattery = false;

                    for(let i = 0 ; i < data.data.tagCollectionList.length; i++) {

                        // 배터리 
                        let node_name = data.data.tagCollectionList[i].node_name;
                        let variable_name = data.data.tagCollectionList[i].variable_name;

                        if(variable_name == "batt_gauge"){
                            existBattery = true;
                            value = parseFloat(data.data.tagCollectionList[i].variable_value);
                            haveBattGauge++;

                            if(Number.isNaN(value)){
                                noBatteryCount++;
                            }
                            else if(value >= 70){
                                highBatteryCount++;
                            }
                            else if(value < 70 && value >= 30){
                                mediumBatteryCount++;
                            }
                            else{
                                lowBatteryCount++;
                            }


                            // if(value == "" || value == undefined ||value == null){
                            //     notCollectedCount++;
                            // }
                            // else{
                            //     normalCount++;
                            // }
                        }

                    }
                    if(existBattery == false){
                        noBatteryCount++;
                    }
                    
                }, function (error) {
                    alertPopUp('error', "<%=__('Error Occurred')%>");
                    console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
                });
            }

            setTimeout(() => {
                let batterychartOption = {
                    chart: {
                        type: 'pie',
                        options3d: {
                            enabled: true,
                            alpha: 45,
                            beta: 0
                        },
                        height:300
                    },
                    plotOptions: {
                        pie: {
                            colors: ["green","#418BCA","#ED9C28","#E35249"],
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b> : <br>{point.percentage:.1f} %<br>Count : {point.y}',
                            }
                        }
                    },
                    title: {
                        text: null
                    },
                    accessibility: {
                        point: {
                            valueSuffix: '%'
                        }
                    },
                    series: [{
                        type: 'pie',
                        name: 'Battery',
                        data: [
                            {
                                name : 'High Battery',
                                y : highBatteryCount
                            },{
                                name : 'Medium Battery',
                                y : mediumBatteryCount
                            },{
                                name : 'Low Battery',
                                y : lowBatteryCount
                            },{
                                name : 'No Battery Data',
                                y : noBatteryCount
                            }
                            // ['High Battery', highBatteryCount / tagList.length * 100],
                            // ['Medium Battery', mediumBatteryCount / tagList.length * 100],
                            // ['Low Battery', lowBatteryCount / tagList.length * 100],
                            // ['No Battery Data', noBatteryCount / tagList.length * 100]
                        ]
                    }]
                }
                if(currentPage != "map-dashboard"){
                    clearTimeout(dashBoardTimer);
                    return;
                }
                document.getElementById("batteryUpdatedTime").innerText = "<%=__('Search time')%> : "+moment(parseInt(new Date().getTime())).format("YY/MM/DD hh:mm:ss");  //조회 시간
                Highcharts.chart("battery-chart-container", batterychartOption);
            }, 500);
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

        clearTimeout(dashBoardTimer);

        // dashBoardTimer = setTimeout(() => {
        //     getTagInfo();
        // }, 5000);

    }

    const detailSmartTag = (idx) => {
        let options = {
            url:  "<%=global.config.apiServerUrl%>/tag-monitoring/tag-collection-list",
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
                let data = $(id + " tr:eq(1)").clone(true).appendTo(id);

                let list = Object.values(collectionList)[i];
                let name = list["collection_data_name"];
                let key = list["collection_data_key"];
                let value = list["collection_data_value"];
                let unit = list["collection_data_unit"];
                let dataType = list["collection_data_type"];
                let dataCategory = list["collection_data_category"];

                let periodType = list["collection_dataperiod_type"];


           // data.find("button[name='collectionDataChartDrawButtonD']").val(name);
                data.find("input[name='collectionDataChartDrawButtonD']").prop("checked", false);
                data.find("input[name='collectionDataChartDrawButtonD']").attr("id", "collectionDataChartDrawButtonD_"+key);data.find("input[name='collectionDataNameD']").val(name);

                data.find("input[name='collectionDataNameD']").attr("id", list["idx"]);
                data.find("input[name='collectionDataKeyD']").val(key);
                data.find("input[name='collectionDataValueD']").val(value);
                data.find("input[name='collectionDataValueD']").attr("id","collectionDataValueD_" + key);
                data.find("input[name='collectionDataUnitD']").val(unit);
                data.find("input[name='collectionDataTimeD']").val("");
                data.find("input[name='collectionDataTimeD']").attr("id","collectionDataTimeD_" + key)
                data.find("select[name='collectionDataTypeD']").val(dataType);
                data.find("select[name='collectionDataPeriodTypeD']").val(periodType);

                data.find("select[name='collectionDataCategoryD']").val(dataCategory);

                for (let i = 0; i < subTopics.length; i++) {
                    mqttClient.unsubscribe(subTopics[i]);
                }
                subTopics.push("/Ultra/" + tag_thing_id + "/#")
                mqttClient.subscribe("/Ultra/" + tag_thing_id + "/#");

                <% if ( global.config.runningMode == "debug" ){ %>
                    console.log("sub success : " + "/Ultra/" + tag_thing_id + "/#");
                <% }%>

                
            }
            $('.collectionDataD:eq(0)').remove();

            for (let i = 0; i < tagLatestData.length; i++) { //가장 최근 수집시간
                let dataValue = document.getElementById('collectionDataValueD_' +
                    tagLatestData[i].variable_name);
                let dataTime = document.getElementById("collectionDataTimeD_" +
                    tagLatestData[i].variable_name)
                if (dataValue != undefined) {
                    if (tagLatestData[i].variable_value == "" || tagLatestData[i]
                        .variable_value == undefined || tagLatestData[i].variable_value ==
                        null) {
                        continue;
                    }
                    dataValue.value = tagLatestData[i].variable_value;
                    dataTime.value = moment(parseInt(tagLatestData[i].upd_time)).format(
                        "YY/MM/DD hh:mm:ss");
                }
            }

            for(let i = 0 ; i < document.getElementsByName("collectionDataValueD").length; i++){
                // console.log(document.getElementsByName("collectionDataValueD")[i].parentNode)
                document.getElementsByName("collectionDataValueD")[i].parentNode.classList.remove("has-error");
                document.getElementsByName("collectionDataTimeD")[i].parentNode.classList.remove("has-error");
            }
            
            let collectionDataChartDraw = document.getElementsByName("collectionDataChartDrawButtonD");
            let collectionDataCommand = document.getElementsByName("collectionDataCommand");
            let collectionDataKeyD = document.getElementsByName("collectionDataKeyD");

            for (let i = 0; i < collectionDataChartDraw.length; i++) {
                collectionDataChartDraw[i].addEventListener('click', () => {
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

                <% if ( global.config.runningMode == "debug" ){ %>
                    console.log(collectionDataCategoryD[i].value);
                <% }%>

                

                if(collectionDataCategoryD[i].value == "collection"){
                    collectionDataCommand[i].disabled = true;
                }
                else{
                    collectionDataCommand[i].disabled = false;

                }

                collectionDataCommand[i].addEventListener('click', () => {
                    let result = prompt("<%=__('Please enter a command value')%>");      //"Please enter a command value.");   //명령 값을 입력하세요.

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
                    mqttClient.publish("/" + thingid + "/Ultra", JSON.stringify(
                        commonDataFormat));


                    let options = {
                        url:  "<%=global.config.apiServerUrl%>/tag-monitoring/tag-control-data",
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

                    }, function (error) {
                        alertPopUp('error', "<%=__('Error Occurred')%>");
                        console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
                    });
                })
            }
            // $('.collectionDataD:eq(0)').css("display","none");
        }, function (error) {
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }
    
    const loadMap = () => {
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/map-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
            }
        };

        ajax(options, function (data) {
            let updateFlag = false; //map이 그려진 상태로 thing 리스트에서 thing을 삭제할경우 map에 있는 thing도 삭제하기 위함
            if(data.data.getTagMapMap.length == 0 ){
                fabric.Image.fromURL("/resource/images/plant.jpeg", (img) => {
                    let group = new fabric.Group([], {
                        selectable: false,
                        borderColor: "red",
                        id:"backgroundImage",
                        hoverCursor : "default"
                    });
            
                    img.set({
                        originX: 'center',
                        originY: 'center',
                        left: 0 + canvas.width / 2,
                        top: 0 + canvas.height / 2,
                        fill: 'transparent',
                        scaleX : canvas.width / img.width,
                        scaleY : canvas.height / img.height,
                        selectable : false,
                        // width: 50,
                        // height: 50,
                    });
                    group.addWithUpdate(img);
                    canvas.add(group);
                    canvas.renderAll();
                })
                canvas.requestRenderAll();
            }
            else{
                canvas.loadFromJSON(data.data.getTagMapMap[0].canvasjson, function () {
                    canvas.renderAll();    
    
                    for(let i = 0 ; i < canvas._objects.length; i++){
    
                        let group = canvas._objects[i];
                        // console.log(document.getElementById("tag_thing_id_"+group.id));

                        if(group.id == "backgroundImage"){
                            group.selectable = false;
                            group.hoverCursor = "default";
                            continue;
                        }
                        else if(document.getElementById("tag_thing_id_"+group.id) == undefined || document.getElementById("tag_thing_id_"+group.id) == null ){
                            canvas.remove(group);
                            canvas.requestRenderAll();
                            updateFlag = true;
                            continue;
                        }
    
                        group.on('mousedblclick', () => {
                            let idx = group.id;
                            detailSmartTag(idx);
    
                        });
    
                        group.on('mouseover', (e) => {
                            let canvasPosition = document.getElementById('canvas').getBoundingClientRect();
                            $("#tooltip").removeClass("d-none");
                            $("#tooltip").css("top", canvasPosition.top + e.target.top - 20);
                            $("#tooltip").css("left", canvasPosition.left +  e.target.left);
                            $('#tooltipThingId').text(document.getElementById("tag_thing_id_"+group.id).innerText);
                        });
                        group.on('mouseout', () => {
                            $("#tooltip").addClass("d-none");
                        });
    
                    }
                })
            }
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
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
        };
        ajax(options, function (data) {
            let rootData = data.data;
            let tagList = rootData.tagList;
            let tagListCount = rootData.tagListCount[0].taglistcount
            let bodyHtml = "";

            let thingidTopic = [];
            tagListBody.innerHTML = "";
            for (let i = 0; i < tagList.length; i++) {
                bodyHtml += " <tr>";
                bodyHtml += "   <td><button class ='btn btn-success' name = 'addrect' id='addThing_" +tagList[i].idx + "'>Thing 추가</button></td>"
                bodyHtml += "   <td id ='tag_name_" + tagList[i].idx + "'>" + tagList[i].tag_name + "</td>";
                bodyHtml += "   <td name='thingid' id ='tag_thing_id_" + tagList[i].idx + "'>" + tagList[i].tag_thing_id + "</td>";
                bodyHtml += "</tr>";

            }

            tagListBody.innerHTML = bodyHtml;


            try{

                //데이터 테이블 초기화
                $('#smartTagList').dataTable({
                    "bDestroy": true
                }).fnDestroy();        
                
            }catch(e){
                console.log("dataTable.log:"+e.toString()+":");
            }

            dataTable = $('#smartTagList').DataTable({
                "pageLength": 10,
                "searching": false,
                "lengthChange": true,
                "bLengthChange": false,
                "ordering": true,
                "autoWidth": true,
            });

            let thingid = document.getElementsByName("thingid");
            let addrect = document.getElementsByName("addrect");
            
            for (let i = 0; i < addrect.length; i++) {
                addrect[i].addEventListener('click', () => {
                    let group = new fabric.Group([], {
                        left : canvas.width / 2,
                        top : canvas.height / 2,
                        width : 50,
                        height : 50,
                        selectable : true,
                        borderColor : "red",
                        id : addrect[i].id.split("addThing_")[1]
                    });

                    let text = new fabric.Textbox("tag", {
                        fill : "black",
                        fontSize : 20,
                        fill : "white",
                        fontFamily : "MapoPeacefull",
                        editable : true,
                        scaleX : 1,
                        scaleY : 1,
                        originX : 'left', 
                        originY : 'top',
                        left : 0 - group.width / 2 + 5,
                        top : 0 - group.height / 2 + 5,
                        verticalAlign : "middle"
                    });

                    fabric.Image.fromURL("/resource/images/monitor.png", (img) => {
                        let bounds = group.getBoundingRect();
                        const scaleFactor = Math.max(bounds.width / img
                            .width, bounds.height / img
                            .height);
                            img.set({
                                originX : 'center',
                                originY : 'center',
                                left : 0 + canvas.width / 2,
                                top : 0 + canvas.height / 2,
                                fill : 'transparent',
                                // width: 50,
                                // height: 50,
                            });
                        group.addWithUpdate(img);
                        // group.add(text)
                        canvas.renderAll();
                    })

                    canvas.add(group);
                    canvas.requestRenderAll();
                    canvas.setActiveObject(group);

                    group.on('mousedblclick', () => {
                        let idx = group.id;
                        detailSmartTag(idx);
                    });

                    group.on('mouseover', (e) => {
                        let canvasPosition = document.getElementById('canvas').getBoundingClientRect();
                        
                        $("#tooltip").removeClass("d-none");
                        $("#tooltip").css("top", canvasPosition.top + e.target.top - 20);
                        $("#tooltip").css("left", canvasPosition.left +  e.target.left);
                        $('#tooltipThingId').text(thingid[i].innerText);
                    });
                    group.on('mouseout', () => {
                        $("#tooltip").addClass("d-none");
                    });

                })
            }
            loadMap();


        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    document.getElementById("ImageBtn").addEventListener('click',() => {
        document.getElementById("imageInputId").click();
    })


    $("#imageInputId").on("change", function (e) {
        ImageFileUploadToBase64(document.getElementById('imageInputId'), function (result) {
            imageInputBase64 = result;

            let imageElement = document.createElement('img');
            imageElement.src = imageInputBase64;
            let fImage = new fabric.Image(imageElement);
            fImage.selectable = false;
            // fImage.width = 960;
            // fImage.height = 540;
            fImage.scaleX = canvas.width / fImage.width;
            fImage.scaleY = canvas.height / fImage.height;
            fImage.id = "backgroundImage";

            for(let i = 0 ; i < canvas._objects.length; i++){
                if(canvas._objects[i].id == "backgroundImage"){
                    canvas.remove(canvas._objects[i]);
                    break;
                }
            }
            canvas.add(fImage);
            canvas.moveTo(fImage,0);
        });
    })

    $("#removeThing").on("click",() => {
        canvas.remove(canvas.getActiveObject());
    })


    $("#saveMapBtn").on("click", () => {
        let canvasJson = JSON.stringify(canvas.toDatalessJSON(["id"]));

        let options = {
            url:  "<%=global.config.apiServerUrl%>/tag-monitoring/tag-map",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                canvasJson: canvasJson,
            }
        }

        ajax(options, function (data) {
            alertPopUp("success","<%=__('Map Save Completed')%>");        //맵 저장 완료

        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    })

    getList();
    mqttConnect();
    getTagInfo();

})