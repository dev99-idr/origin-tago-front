$(document).ready(function() {
    
    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("user-login-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>
    
    const eventListener = () => {

        

        /*
        document.getElementById("userLocale").addEventListener("change", function(e){
            let selLocales = userLocale.options[userLocale.selectedIndex].value;

            setCookie("lang", selLocales, -1);

            console.log("selLocales=:"+selLocales+":");
        })
        */

       
        let userpage_id = document.getElementsByName('login-menus');
        for(let i = 0; i < userpage_id.length; i++){
            userpage_id[i].addEventListener("click", function(e){
                loadPage(userpage_id[i].id, '.wrapper');
            })
        }

        let loginBtn = document.getElementById("loginbtn");
        loginBtn.addEventListener("click", function(e){
            let url = new URL('<%=global.config.apiServerUrl%>/login/signin');
            let parameter = {
                "id" : document.getElementById("inputId").value,
                "pw" : document.getElementById("inputPassword").value
            }

         

            fetch(url, {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parameter)
            })
            .then(response => response.json())
            .then(response =>{
                //console.log(response.data);

                let responseData = response.data;
                if(response.status=="OK"){
                    let responseId = responseData.user_id;
                    let authority = responseData.user_authority;
                    
                    url = new URL('<%=global.config.frontserverUrl%>/getLicense');
                    fetch(url, {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({"":""})
                    })
                    .then(response => response.json())
                    .then(response =>{

                       if(response.status == "OK"){
                            url = new URL('<%=global.config.apiServerUrl%>/license/license-list');
                            fetch(url, {
                                method: 'post',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({"":""})
                            })
                            .then(response => response.json())
                            .then(response => {
                                
                                if(response.status == "OK"){
                                
                                    setCookie("id", responseId, -1);
                                    setCookie("authority", authority, -1);
                                    setCookie("active_yn", response.data.active_yn, -1);
                                    setCookie("mac_address", response.data.mac_address, -1);
                                    location.href = "/main.do";
                                }else{
                                    const error = (response.data && response.data.message) || response.status;
                                    return Promise.reject(error);
                                }
                            }).catch(error => {
                                console.error(url+":[error]" +response.json());
                                alertPopUp("error", "<%=__('Error Occurred')%>");
                            })
                        }else{
                            console.error(url +":[error]");
                            alertPopUp("error", "<%=__('Error Occurred')%>");
                        }
                    }).catch(error => {
                        console.error(url +":[error]" +error);
                        alertPopUp("error", "<%=__('Error Occurred')%>");
                    })

                    insertLoginLog(responseData.user_id, responseData.user_name, responseData.user_email, responseData.user_authority, Math.floor(new Date().getTime() / 1000), "Y")

                }
                else{
                    alertPopUp("error", "<%=__('Please check your ID or password')%>"); //"Please check your ID or password.");    //아이디 또는 비밀번호를 확인해주십시오.");

                    url = new URL('<%=global.config.apiServerUrl%>/login/get-user');

                    fetch( url, {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            "id" : document.getElementById("inputId").value,
                            "pw" : document.getElementById("inputPassword").value
                        })
                    }).then(response => response.json())
                    .then(response => {

                        responseData = response.data;

                        if(response.status == "OK"){
                            insertLoginLog(responseData.user_id, responseData.user_name, responseData.user_email, responseData.user_authority, Math.floor(new Date().getTime() / 1000), "N")
                        }
                        else{
                            insertLoginLog(document.getElementById("inputId").value, "", "", "", Math.floor(new Date().getTime() / 1000), "N")
                        }

                    }).catch(error => {
                        console.error(url+":[error]" +error);
                        alertPopUp("error", "<%=__('Error Occurred')%>");
                    })
                }
            }).catch(error => {
                console.error(url+":[error]" +error);
                alertPopUp("error", "<%=__('Error Occurred')%>");
            })
        })
    
        let loginDiv = document.getElementById("loginDiv");
        loginDiv.addEventListener("keydown", function(e){
            if ( e.key == 'Enter'){
                loginBtn.click();
            }
        })
    }

    const insertLoginLog = (id, name, email, authority, time, login_yn) => {
        let url = new URL('<%=global.config.apiServerUrl%>/login/set-login-log');
        let parameter = {
            "id" : id,
            "name" : name,
            "email" : email,
            "authority" : authority,
            "time" : time,
            "login_yn" : login_yn
        }

        
            fetch(url, {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parameter)
            }).then(response => {
                if (!response.ok) {
                    const error = response.status;
                    return Promise.reject(error);
                }

            }).catch(error => {
                console.error(url +":[error][can't inser log]" +error);
            })
        
    }
    
    eventListener();
})