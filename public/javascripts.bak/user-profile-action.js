$(document).ready(function() {

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("user-profile-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    let userProfileImg = document.getElementById("userProfileImg");
    
    let userName = document.getElementById("userName");
    let userEmail = document.getElementById("userEmail");
    let userId = document.getElementById("userId");
    let userPassword = document.getElementById("userPassword");
    let userAuthority = document.getElementById("userAuthority");

    const eventListener = () => {
        let saveBtn = document.getElementById("saveBtn");
        saveBtn.addEventListener("click", function(e){

            if(userPassword.value != ""){
                let url = new URL('<%=global.config.apiServerUrl%>/user/set-user-info');
                let parameter = {
                    "id" : getCookie("id"),
                    "newName" : userName.value,
                    "newEmail" : userEmail.value,
                    "newPw" : userPassword.value
                }

                
                fetch(url, {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parameter)
                })
                .then(response => { 

                    topUserInfo();
                    
                    /*
                    switch (response.status) {
                        case 201:
                            topUserInfo();
                            break
                        case 400:
                            console.error(url + ":[error]this is a client (probably invalid JSON) error, but also might be a server error (bad JSON parsing/validation");
                            alertPopUp("error", "<%=__('Error Occurred')%>");
                             break
                        case 500:
                            console.error(url+":[error]");
                            alertPopUp("error", "<%=__('Error Occurred')%>");
                          break
                        default:
                            console.error(url+":[error]");
                            alertPopUp("error", "<%=__('Error Occurred')%>");
                          break
                    }*/

                    swal("<%=__('The information has been modified')%>",{         //정보가 수정되었습니다.", {
                        icon: "success",
                        buttons: {
                            confirm: {
                                className: 'btn btn-success'
                            }
                        },
                    })
                    .then(response => {
                        getUserInfo();
                    });

                }).catch(error => {
                    console.error(url+":[error]"+error);
                    alertPopUp("error", "<%=__('Error Occurred')%>");
                })
                
            }else{
                alertPopUp("error", "<%=__('Please enter your password')%>");         //비밀번호를 입력해주십시오.")
            }
            
            
            fetch('<%=global.config.frontserverUrl%>/setImage', {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "id" : getCookie("id"),
                    "newImg" : userProfileImg.src
                })
            })
            .then(response => response.json())
            .then(response => {
            })
            
    
            // fetch(serverUrl+'/file/set-profile-img', {
            // method: 'post',
            // headers: { 'Content-Type': 'application/json' },
            // body: JSON.stringify({
            //     "id" : getCookie("id"),
            //     "newImg" : userProfileImg.src
            //     })
            // })
    
        })

        let resetBtn = document.getElementById("resetBtn");
        resetBtn.addEventListener("click", function(e){
            getUserInfo();
            alertPopUp("success", "<%=__('The modified content has been canceled')%>");       //수정된 내용을 취소하였습니다.");
        })
    
        let deleteAccountBtn = document.getElementById("deleteAccountBtn");
        deleteAccountBtn.addEventListener("click", function(e){
            alertPopUp('delete', "<%=__('Are you sure you want to delete it? Please enter your password')%>");        //정말 삭제하시겠습니까? 비밀번호를 입력해주세요.");

            $('.swal-button--confirm').on('click',function(e){
                if( $('.swal-content__input').val() == userData[0]){

                    alertPopUp("success", "<%=__('Processed')%>");                            //처리되었습니다.");

                    let url = new URL("<%=global.config.apiServerUrl%>/user/delete-user-info");
                    let parameter = {
                        "id" : getCookie("id")
                    }

                   
                    fetch(url, {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parameter)
                    })
                   
                    setCookie("id", getCookie("id"), 0);
                    loadPage('user-login','.wrapper');
                }
                else{
                    alertPopUp("error", "<%=__('Password does not match')%>");                //비밀번호가 일치하지 않습니다.");
                }
            })
    
        })

        document.getElementById("selectSortByTime").addEventListener("change", function(e){
            sortByTime = selectSortByTime.options[selectSortByTime.selectedIndex].value;
            getloginLog(sortByTime);
        })
    }

    const getUserInfo = () => {
        document.getElementById("leftUserName").innerText = userData[4];
        userPassword.value = userData[0];
        userName.value = userData[4];
        userId.value = userData[3];
        userEmail.value = userData[1];

        if(userData[2] == 2){
            userAuthority.innerText = "<%=__('administrator')%>";          //최고관리자";
        }
        else{
            userAuthority.innerText = "<%=__('user')%>";                   //일반관리자";
        }
        
        
        fetch('<%=global.config.frontserverUrl%>/getImage', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "id" : getCookie("id")
            })
        })
        .then(response => response.json())
        .then(response => {
            userProfileImg.src = response.data;
        })
        

        // fetch(serverUrl+'/file/get-profile-img', {
        //     method: 'post',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         "id" : getCookie("id")
        //     })
        // })
        // .then(response => response.json())
        // .then(response =>{
        //     userProfileImg.src = "data:image/png;base64,"+response.data;
        // })
    }

    let logTotalData = 5;
    let logStartPage = 1;
    let logEndPage = 5;
    let logPerPage = 5;
    let logCurrentPage = 1;
    let logLoadData = 5;
    let logCurrentbtnActive = 1;
    let sortByTime = "DESC";
    let logData = "";

    const getloginLog = (sortByTime) => {
        let url = "<%=global.config.apiServerUrl%>/login/get-login-log";
        let parameter = {
            "id" : getCookie("id"),
            "authority" : getCookie("authority"),
            "sortByTime" : sortByTime
        }

        
        fetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parameter)
        })
        .then(response => response.json())
        .then(response => {
            logData = response.data;
            logTotalData = logData.length;

            document.getElementById("countLog").innerText = logData.length;
            
            selectLogPerPage = document.getElementById("selectLogPerPage");
            selectLogPerPage.addEventListener("change", function(e){
                logPerPage = Number(selectLogPerPage.options[selectLogPerPage.selectedIndex].value);
                endPage = logPerPage;
                logCurrentPage = 1;
                logStartPage = 1;
                logCurrentbtnActive = 1;

                getLogInfo(logCurrentPage);
            })

            getLogInfo(logCurrentPage);
            
        })
        
    }

    const getLogInfo = (logCurrentPage) => {
        logLoadData = (logCurrentPage-1) * logPerPage + logPerPage;

        let logInfoHTML = '';
        if(logLoadData > logTotalData){
            logLoadData = logTotalData;
        }
        for(let i = (logCurrentPage - 1) * logPerPage; i < logLoadData; i++){
            logInfoHTML += '<tr style="text-align: center;">';
            logInfoHTML += '    <td>' + logData[i].user_id + '</td>';
            logInfoHTML += '    <td>' + logData[i].user_name + '</td>';
            if(logData[i].user_authority == 2){
                logInfoHTML += "    <td><%=__('administrator')%>administrator</td>";            //최고 관리자
            }
            else if(logData[i].user_authority == 1){
                logInfoHTML += "    <td><%=__('user')%></td>";                     //일반 관리자
            }
            else{
                logInfoHTML += '    <td></td>';
            }
            logInfoHTML += '    <td>' + unixTimestamp(logData[i].login_time) + '</td>';
            if(logData[i].login_yn == "Y"){
                logInfoHTML += "    <td><%=__('Login Successful')%></td>";         //로그인 성공
            }
            else{
                logInfoHTML += "    <td><%=__('Login failed')%></td>";             //로그인 실패
            }
            logInfoHTML += '</tr>';
        }
        document.getElementById("logInfo").innerHTML = logInfoHTML;
        
        logEndPage = Math.ceil(logCurrentPage / 5) * 5;
        if(logTotalData / logPerPage < logEndPage){
            logEndPage = Math.ceil(logTotalData / logPerPage);
        }

        let logPaginationHTML = "";
        logPaginationHTML += '<ul class="pagination justify-content-center">';
        logPaginationHTML += '     <li class="page-item" name = "logBtnActive"><a class="page-link" href="#" name="logPageBtn" onclick="return false;">Previous</a></li>';
        for(let i = logStartPage; i <= logEndPage; i++){
            logPaginationHTML += '     <li class="page-item" name = "logBtnActive"><a class="page-link" href="#" name="logPageBtn" onclick="return false;">' + i + '</a></li>';
        }
        logPaginationHTML += '     <li class="page-item" name = "logBtnActive"><a class="page-link" href="#" name="logPageBtn" onclick="return false;">Next</a></li>';
        logPaginationHTML += '</ul>';
        document.getElementById("logPageBtn").innerHTML = logPaginationHTML;

        let logPageBtn = document.getElementsByName("logPageBtn");
        let logBtnActive = document.getElementsByName("logBtnActive");
        for(let i = 0; i < logPageBtn.length; i++){
            logBtnActive[logCurrentbtnActive].className += " active";
            logBtnActive[i].addEventListener("click", function(e){
                if(e.currentTarget.innerText == "Previous"){
                    if(logCurrentPage != 1){
                        logCurrentbtnActive = logCurrentbtnActive - 1;
                        if(logCurrentPage > 1){
                            logCurrentPage -= 1;
                        }
                        if(logCurrentPage % 5 == 0){
                            logStartPage -= 5;
                        }
                    }
                }
                else if(e.currentTarget.innerText == "Next"){
                    if(logCurrentPage < logTotalData / logPerPage){
                        logCurrentbtnActive = logCurrentbtnActive + 1;
                        logCurrentPage += 1;
                    }
                    if(logCurrentPage % 5 == 1){
                        logCurrentbtnActive = 1;
                        logStartPage = logCurrentPage;
                    }
                }
                else{
                    logCurrentPage = Number(e.currentTarget.innerText);
                    logCurrentbtnActive = Number(e.currentTarget.innerText) % 5;
                }
                if(logCurrentbtnActive == 0){
                    logCurrentbtnActive = 5;
                }

                getLogInfo(logCurrentPage);
            })  
        }
    }


    const getImage = () => {
        let uploadProfileImg = document.getElementById("uploadProfileImg");
        uploadProfileImg.addEventListener("change", function(e){
            const [file] = uploadProfileImg.files;

            if (file) {
                const reader = new FileReader();
                reader.readAsDataURL(file);

                reader.onload = function () {
                    userProfileImg.src = reader.result;
                };

                reader.onerror = function (error) {
                    console.log('Error: ', error);
                };

                userProfileImg.src = URL.createObjectURL(file);
            }
        })
    }

    getUserInfo();
    getloginLog(sortByTime);
    getImage();
    eventListener();

})