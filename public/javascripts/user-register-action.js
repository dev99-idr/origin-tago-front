$(document).ready(function() { 
    

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("user-register-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    const eventListener = () => {
        let registerBtn = document.getElementById('registerBtn');
        registerBtn.addEventListener("click", function(e){
            let inputId = document.getElementById("inputId").value;
            let inputPw = document.getElementById("inputPassword").value;
            let inputRepeatPw = document.getElementById("repeatPassword").value;
    
            if(inputId=="" || inputPw == "" || inputRepeatPw ==""){
                alertPopUp("error", "<%=__('Please enter all information')%>");           // 정보를 입력해주십시오.");
            }
            else{
                let url = new URL("<%=global.config.apiServerUrl%>/login/getUser");
                let parameter = {
                    "id" : inputId
                }
                fetch(url, {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parameter)
                })
                .then(response => response.json())
                .then(response => {
                    if(response.status=='OK'){
                        alertPopUp("error", "<%=__('Duplicate ID exists')%>");            //중복된 아이디가 존재합니다.");
                    }
                    else{
                        if(inputPw === inputRepeatPw){
                            let url = new URL("<%=global.config.apiServerUrl%>/login/signup");
                            let parameter = {
                                "id" : inputId,
                                "pw" : inputPw,
                                "authority" : 1
                            }
                            fetch(url, {
                                method: 'post',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(parameter)
                            })
                            .then(response => response.json())
                            .then(response => {
                                alertPopUp("success", "<%=__('User added successfully')%>");          //사용자가 추가되었습니다.");
                                loadPage('accounts','#right-panel');
                            })
                        }
                        else{
                            alertPopUp("error", "<%=__('Please check the password again')%>");        //비밀번호를 다시 확인해주세요.")
                        }
                    }
                })
            }
        })
    
        let registerDiv = document.getElementById("registerDiv");
        registerDiv.addEventListener("keydown", function(e){
            if(e.keyCode == 13){
                registerBtn.click();
            }
        })
    }


    eventListener();

})