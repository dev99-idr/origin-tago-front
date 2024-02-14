// 공통함수 모음 root page에서 로딩
let g_imgSeverIp = "";
let mqttClient;
let subTopics = [];
let loadPageParam;
let dashBoardTimer;
let currentPage = "";

<% if ( global.config.runningMode == "debug" ){ %>
    console.log("index-front-action.js");
<%}%>
<% if ( global.config.javascriptMode == "debug" ){ %>
    debugger;
<% }%>


const setCookie = (key, value, time) => { //time => days
    let todayDate = new Date();
    todayDate.setDate(todayDate.getDate() + time);
    if (time == -1) {
        document.cookie = key + "=" + escape(value) + "; path=/;"
    }
    else {
        document.cookie = key + "=" + escape(value) + "; path=/; expires=" + todayDate.toGMTString() + ";"
    }
}

const fabricjsInit = () =>{    // 기존 fabric js에 없는 linearrow
    fabric.LineArrow = fabric.util.createClass(fabric.Line, {

        type: 'lineArrow',
    
        initialize: function (element, options) {
            options || (options = {});
            this.callSuper('initialize', element, options);
        },
    
        toObject: function () {
            return fabric.util.object.extend(this.callSuper('toObject'));
        },
    
        _render: function (ctx) {
            this.callSuper('_render', ctx);
    
            // do not render if width/height are zeros or object is not visible
            if (this.width === 0 || this.height === 0 || !this.visible) return;
    
            ctx.save();
    
            var xDiff = this.x2 - this.x1;
            var yDiff = this.y2 - this.y1;
            var angle = Math.atan2(yDiff, xDiff);
            ctx.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2);
            ctx.rotate(angle);
            ctx.beginPath();
            //move 10px in front of line to start the arrow so it does not have the square line end showing in front (0,0)
            ctx.moveTo(5, 0);
            ctx.lineTo(-20, 15);
            ctx.lineTo(-20, -15);
            ctx.closePath();
            ctx.fillStyle = this.stroke;
            ctx.fill();
    
            ctx.restore();
    
        }
        });
    
        fabric.LineArrow.fromObject = function (object, callback) {
        callback && callback(new fabric.LineArrow([object.x1, object.y1, object.x2, object.y2], object));
        };
    
        fabric.LineArrow.async = true;
}

const getCookie = (key) => {
    let result = null;
    let cookie = document.cookie.split(';');
    cookie.some(function (item) {
        item = item.replace(' ', '');
        let dic = item.split('=');
        if (key === dic[0]) {
            result = dic[1];
            return true;    // break;
        }
    });
    return result;
}

const alertPopUp = (state, msg) => {
    if (state === "error") {
        swal(msg, {
            icon: "error",
            buttons: {
                confirm: {
                    className: 'btn btn-danger'
                }
            },
        });
    }
    else if (state === "success") {
        swal(msg, {
            icon: "success",
            buttons: {
                confirm: {
                    className: 'btn btn-success'
                }
            },
        });
    }
    else if (state === "warning") {
        swal(msg, {
            type: 'warning',
            icon: "warning",
            buttons: {
                confirm: {
                    text: 'Delete',
                    className: 'btn btn-danger'
                },
                cancel: {
                    visible: true,
                    className: 'btn btn-success'
                }
            }
        })
    }
    else if (state === "delete") {
        swal(msg, {
            type: 'warning',
            icon: "warning",
            content: {
                element : "input",
                attributes: {
                    placeholder: "Enter your password",
                    type: "password",
                },
            },
            buttons: {
                confirm: {
                    text: 'Delete',
                    className: 'btn btn-danger'
                },
                cancel: {
                    visible: true,
                    className: 'btn btn-success'
                }
            }
        })
    }
}

const ajax = (options, callback, errorcallback) => {
    // showLoading();
    if (options.type === "get") {
        axios({
            method: 'get',
            url: options.url,
            params: options.sendData,
            type: "json",
            withCreadentials: true
        })
        .then(function (response) {

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("options:" + options.toString() + "\r\nresponse=:"+response.toString()+":");
            <% }%>

            
            if(response.status=="OK" ){
                callback(response.data);               
            }else{
                alertPopUp("error", "<%= __('Error Occurred')%> ");             //error occurred. contact admin");  //에러가 발생했습니다. 관리자에게 문의하세요
                console.log('[res]error:'+options+':\r\nrespone.data'+response.data+'\r\nmessage:' +e.message);
            }            
            // hideLoading();
        })
        .catch(function (e) {
            if (errorcallback !== undefined && errorcallback !== null) {
                errorcallback(e);
                alertPopUp('error', "<%= __('Error Occurred')%>");         //'error occurred. contact admin');   //에러가 발생했습니다. 관리자에게 문의하세요
                console.log('error:'+options.url+':\r\nnmessage:' +e.message);
                // hideLoading();
            }
        });
    }
    else if (options.type === "post") {
        axios({
            headers: options.headers,
            method: 'post',
            url: options.url,
            data: JSON.stringify(options.sendData),
            type: "json",
            withCreadentials: true

        })
        .then(response => {
            callback(response.data);
           
            // hideLoading();
        })
        .catch(function (e) {
            if (errorcallback !== undefined && errorcallback !== null) {
                errorcallback(e);
                alertPopUp('error', "<%= __('Error Occurred')%>"); //'error occurred. contact admin');   //에러가 발생했습니다. 관리자에게 문의하세요
                console.log('error:'+options.url+':\r\nmessage:' +e.message);                
               
                // hideLoading();
            }
        });
    };
}
const loadPage = (id, root, parameter) => {
    currentPage = id;
    if(document.getElementById(id) == null ){
        <% if ( global.config.runningMode == "debug" ){ %>
            console.log("page id is null");
        <% }%>

        
    }
    else{
        $('.page-title').text(document.getElementById(id).getElementsByTagName('p')[0].innerText);
    }

    // 페이지 이탈 시 disconnect
    if(mqttClient != null || mqttClient != undefined){
        
        try{            
            console.log("mqttClient.disconnect:");
            mqttClient.disconnect();
        }catch(e){           
            console.error(e.message);
        }
        
    }
    if(parameter !== undefined){
        loadPageParam = parameter;
    }
    else{
        loadPageParam = "";
    }
    fetch(id)
    .then(response => response.text())
    .then(response => {
        //console.log("loadPage ServerStatus:"+response.toString() +":");
        //if (!response.ok) {
        //    const error = (response.data && response.data.message) || response.status;
        //    return Promise.reject(error);
        //}

        $(root).html(response);
    }).catch(error => {
        //console.error("[loadPage]:[error]");
        //alertPopUp("error", "<%=__('Error Occurred')%>");
    })
}

let page_id = document.getElementsByName('page_id');
for (let i = 0; i < page_id.length; i++) {
    page_id[i].addEventListener('click', function (e) {
        $('.page-title').text(page_id[i].getElementsByTagName('p')[0].innerText);
        loadPage(page_id[i].id, "#right-panel")
        currentPage = page_id[i].id;
    },{ passive: true })
}

let menuList = document.getElementsByName('menuList');
for (let i = 0; i < menuList.length; i++) {
    menuList[i].style.cursor = "pointer";
    menuList[i].addEventListener('click', function (e) {
        document.body.style.cursor = "default";
        for (let i = 0; i < menuList.length; i++) {
            menuList[i].classList.remove('active');
        }
        menuList[i].classList.add('active');
        $toggle = $('.sidenav-toggler');
        $('html').removeClass('nav_open');
        $toggle.removeClass('toggled');
        nav_open = 0;
    },{ passive: true })
}

let menuListName = document.getElementsByName("menuList");
const checkAuthority = (id) => {
    if(id == 1){
        for(let i = 0; i < menuListName.length; i++){
            if(menuListName[i].id == "menuByHighAuthority"){
                document.getElementById(menuListName[i].id).style.display = "none";
            }
        }
    }
}
// const checkLicense = (active_yn) => {
//     if(active_yn == "N"){
//         for(let i =0; i < page_id.length; i++){
//             if(page_id[i].id != "license"){
//                 document.getElementById(page_id[i].id).style.display = "none";
//             }
//         }
//     }
//     else{
//         for(let i =0; i < page_id.length; i++){
//             document.getElementById(page_id[i].id).style.display = "";
//         }
//     }
// }

let userData = "";
const topUserInfo = () => {

      
    let topInfo = document.getElementById("topInfo");
    let url = new URL( '<%=global.config.apiServerUrl%>/user/get-user-info');
    let parameter = {
        "id" : getCookie("id")
    }

    fetch(url, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameter)
      }).then(response =>  {

       
            return response.json();
      }).then(function (response) {
        
            userData = Object.values(response.data);
            topInfo.innerText = "<%= __('welcome')%> " + userData[4];    //님, 반갑습니다.
            document.getElementById("topUserName").innerText = userData[4];
            document.getElementById("topUserEmail").innerText = userData[1];
       
      }).catch(error => {
        console.error(url+":[error]" +error);
        alertPopUp("error", "<%=__('Error Occurred')%>");
      })
    };

const ImageFileUploadToBase64 = (id,callback) => {
    let imgResult;
    for (let i = 0; i < id.files.length; i++) {
        const file = id.files[i];
        if (!file.type.startsWith('image/')) {
            continue
        };

        const img = new Image();
        const reader = new FileReader();
        reader.onload = (function (img) {
            return function (e) {
                img.src = e.target.result;
                img.onload = function () {
                    imgResult = img;
                    callback(imgResult.src);
                };
            };
        })(img);
        reader.readAsDataURL(file);
    }
}

const unixTimestamp = (time) => {
    let date = new Date(time * 1000);
    let year = date.getFullYear();
    let month = "0" + (date.getMonth()+1);
    let day = "0" + date.getDate();
    let hour = "0" + date.getHours();
    let minute = "0" + date.getMinutes();
    let second = "0" + date.getSeconds();
    return year + "-" + month.substr(-2) + "-" + day.substr(-2) + " " + hour.substr(-2) + ":" + minute.substr(-2) + ":" + second.substr(-2)
}
let locationData = [];
let sourceData = [];
let selectedLocaion = "";


const loadLocation = (showselectedLocation, treeLocation) => {
    sourceData = [];
    let url = new URL( '<%=global.config.apiServerUrl%>/tag-location/get-location-info');
    let parameter = {
    }
    fetch(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameter)
    })
    .then(response => response.json())
    .then(response => {

        locationData = response.data;

        /*
        if (response.status != "OK") {
            // get error message from body or default to response status
            const error = (response.data && response.data.message) || response.status;
            return Promise.reject(error);
        }
        */
       
        let visitedLocationArray = new Array(locationData.length);
        for(let i = 0; i< locationData.length; i++){
            if(locationData[i].depth == 1){
                sourceData.push({key: locationData[i].idx, title: locationData[i].location_name, folder: true, lazy: true, children: []});
                visitedLocationArray[i] = false;
            }
        }
    
        const getLocationList = (sourceData) => {
            for(let i = 0; i<visitedLocationArray.length; i++){
                let parentIdx = -1;
                if(visitedLocationArray[i] == false){
                    continue;
                }
                for(let j =0; j<sourceData.length; j++){
                    if(sourceData[j].key === locationData[i].parent_rawid){
                        parentIdx = sourceData[j].key.indexOf(Number(locationData[i].parent_rawid));
                    }
                    
                    if(parentIdx > -1){
                        sourceData[j].children.push({key: locationData[i].idx, title: locationData[i].location_name, folder: true, lazy: true, children: []})
                        visitedLocationArray[i] = false;
                        getLocationList(sourceData[j].children)
                    }
                }
            }
        }
    
        getLocationList(sourceData);

        // start fanytree setting
        $(treeLocation).fancytree({
            extensions: ["edit"],
            source: sourceData,
            activate: function(event, data) {
                selectedLocaion = data.node;
                if(currentPage === "tag-register"){
                    $(showselectedLocation).val(selectedLocaion.title);
                }
                else{
                    $(showselectedLocation).text(selectedLocaion.title);
                }
            },
            icon: function(event, data) {
                if(data.node.isFolder()) {
                    return "la la-industry";
                }
            },
            edit: {
                triggerStart: ["f2", "dblclick", "shift+click", "mac+enter"],
                close: function(event, data){
                    let orgKey = data.node.key;
                    let newName = data.node.title;

                    if(orgKey > 0){
                        // insert location //
                        let url = new URL( '<%=global.config.apiServerUrl%>/tag-location/set-location-info');
                        let parameter = {
                            "key" : orgKey,
                            "newName" : newName
                        }
                        fetch(url, {
                            method: 'post',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(parameter)
                        }).then(response => {
                           
                           /*
                            if (!response.ok) {
                                // get error message from body or default to response status
                                const error = (response.data && response.data.message) || response.status;
                                return Promise.reject(error);
                            }
                            */

                        }).catch(error => {
                            console.error(url+":[error]" +error);
                            alertPopUp("error", "<%=__('Error Occurred')%>");
                        })
                       
                    }
                    else{
                        // edit new location //
                        fetch( '<%=global.config.apiServerUrl%>/tag-location/get-location-info', {
                            method: 'post',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                "id" : getCookie("id")
                            })
                        })
                        .then(response => response.json())
                        .then(response => {

                            /*
                            if (!response.ok) {
                                // get error message from body or default to response status
                                const error = (response.data && response.data.message) || response.status;
                                return Promise.reject(error);
                            }*/

                            orgKey = response.data[response.data.length - 1].idx;

                            let url = new URL( '<%=global.config.apiServerUrl%>/tag-location/set-location-info');
                            let parameter = {
                                "key" : orgKey,
                                "newName" : newName
                            }
                            fetch(url, {
                                method: 'post',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(parameter)
                            })
                        }).catch(error => {
                            console.error("<%=global.config.apiServerUrl%>/tag-location/get-location-info:[error]" +error);
                            alertPopUp("error", "<%=__('Error Occurred')%>");
                        })
                    }
                }
            }
        });
        
        /*
        .catch(error => {
            console.error(url+":[error]" +error);
            alertPopUp("error", "<%=__('Error Occurred')%>");
        });
        */
        
        $.ui.fancytree.getTree(treeLocation).visit(function(node){
            node.toggleExpanded();
        });

        $(treeLocation + " .fancytree-container").css(
            "font-size", 11.5 + "pt"
        );
    }).catch(error =>{
        console.error(url+":[error]" +error);
        alertPopUp("error", "<%=__('Error Occurred')%>");
    });
    

}

const getLocationGroup = (locationData) => {
    let visitedLocationArray = new Array(locationData.length);
    for(let i = 0; i < locationData.length; i++){
        if(locationData[i].depth == 1){
            sourceData.push({key: locationData[i].idx, title: locationData[i].location_name, folder: true, lazy: true, children: []});
            visitedLocationArray[i] = false;
        }
    }

    const getLocationList = (sourceData) => {
        for(let i = 0; i < visitedLocationArray.length; i++){
            let parentIdx = -1;
            if(visitedLocationArray[i] == false){
                continue;
            }
            for(let j =0; j < sourceData.length; j++){
                if(sourceData[j].key === locationData[i].parent_rawid){
                    parentIdx = sourceData[j].key.indexOf(Number(locationData[i].parent_rawid));
                }
                // console.log(locationData[i].locationData+","+locationData[i].parent_rawid+":"+parentIdx)
                
                if(parentIdx > -1){
                    sourceData[j].children.push({key: locationData[i].idx, title: locationData[i].location_name, folder: true, lazy: true, children: []})
                    visitedLocationArray[i] = false;
                    getLocationList(sourceData[j].children)
                }
            }
        }
    }

    getLocationList(sourceData);
}



const mqttConnect = () => {
    let brokerNm = Math.random().toString(36).substr(2,11);

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("brokerNm=:"+brokerNm+":");
    <% }%>

    
    mqttClient = new Paho.MQTT.Client('<%=global.config.mqttIpAddress%>' , <%=global.config.mqttport%> , brokerNm);

    let connectOptions = {
        onSuccess : function()
        {
            
            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("================= MQTT Connection Success =================");
            <% }%>
        },
        useSSL: false, // true인 경우 SSL Websocket 사용
        cleanSession : false, //true인 경우 연결 성공 시 클라이언트 및 서버 상태 영구 삭제
        timeout: 60, // 이 시간 안에 연결 성공하지 못하면 실패로 간주
        mqttVersion: 4, // version - 3: 3.1 4: 3.1.1
        reconnect : true,         // Enable automatic reconnect
        keepAliveInterval: 60, // 이 시간동안 활동이 없으면 클라이언트 연결 끊음
        onFailure: function(msg) 
        {

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("================= MQTT Connection Fail =================");
            <% }%>

            
        },

    };
    mqttClient.connect(connectOptions);

    mqttClient.onConnectionLost = function (responseObject) {

        <% if ( global.config.runningMode == "debug" ){ %>
            console.log("================= MQTT Connection lost =================");
            console.log(responseObject);
        <% }%>

       
        mqttClient.connect(connectOptions);
    }.bind(this)

}



const showLoading = () => {
    loader.setStyle("big color-1");
    loader.on();
}
const hideLoading = () => {
    loader.off();
}
