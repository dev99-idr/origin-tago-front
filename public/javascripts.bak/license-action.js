$(document).ready(function() {

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("license-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    const checkLicenseActive = () => {
        let systemId = "";
        for(let i = 0; i < getCookie("mac_address").length; i+=3){
            systemId += parseInt(getCookie("mac_address").substring(i, i+2), 16);
        }
        document.getElementById("inputSystemId").value = systemId;

        if(getCookie("active_yn") == "N"){ // if you registed license
            $('#licenseModal').modal('show');

            let registerlicenseBtn = document.getElementById("registerlicenseBtn");
            registerlicenseBtn.addEventListener("click", function(e){
                let url = new URL( '<%=global.config.apiServerUrl%>/license/set-license');
                let parameter = {
                    "mac_address" : getCookie("mac_address"),
                    "license_key" : document.getElementById("inputLicenseKey").value,
                    "active_time" : Math.floor(new Date().getTime()),
                }
                fetch(url, {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parameter)
                })
                .then(response => response.json())
                .then(response =>{
                    if(response.data == 1){
                        setCookie("active_yn", "Y");
                        $('#licenseModal').modal('hide');
                        
                        alertPopUp("success", "<%=__('Registered license')%>");      //"License가 정상 등록되었습니다.
                        checkLicenseActive();
                    }
                    else{
                        alertPopUp("error", "<%=__('Invalid license')%>");       //"License가 유효하지 않습니다.")
                    }
                })
            })
        }
        else{ // if you don't regist license
            let url = new URL('<%=global.config.apiServerUrl%>/license/get-license');
            let parameter = {
                "mac_address" : getCookie("mac_address")
            }
            fetch(url, {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parameter)
            })
            .then(response => response.json())
            .then(response =>{
                licenseHTML = '';
                licenseHTML += '<tr>';
                licenseHTML += '    <td>' + systemId + '</td>';
                licenseHTML += '    <td>Active</td>';
                licenseHTML += '    <td>' + unixTimestamp(response.data.active_time / 1000) + '</td>';
                licenseHTML += '</tr>';
                document.getElementById("licenseList").innerHTML = licenseHTML;
            })
        }
    }

    checkLicenseActive();

    
})