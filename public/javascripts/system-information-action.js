$(document).ready(function() {
    
    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("system-information-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>
    

    // if you click one of the tabs, this tab is change
    const eventListener = () => {
        let releaseData = document.getElementById("releaseData");
        let packageVersion = document.getElementById("packageVersion");
        let releaseDataTab = document.getElementById("releaseDataTab");
        let packageVersionTab = document.getElementById("packageVersionTab");

        packageVersionTab.addEventListener("click", function(e){
            releaseData.style.display = "none";
            releaseDataTab.className = "nav-link";
            packageVersion.style.display = "";
            packageVersionTab.className = "nav-link active";
        })

        releaseDataTab.addEventListener("click", function(e){
            releaseData.style.display = "";
            releaseDataTab.className = "nav-link active";
            packageVersion.style.display = "none";
            packageVersionTab.className = "nav-link";
        })
    }

    // get version information & load version info
    const versionInfo = () => {
        let url = new URL( '<%=global.config.apiServerUrl%>/tag-release/get-tag-version');
        fetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(response => {
            versionHTML = '';
            versionHTML += '<tr>';
            versionHTML += '    <td>v.' + response.data[0].version + '</td>';
            versionHTML += '    <td>' + unixTimestamp(response.data[0].release_time/1000).substring(0, 10) + '</td>';
            versionHTML += '</tr>';
            document.getElementById("packageList").innerHTML = versionHTML;
        })
    }

    // get release information & load release info
    const releaseList = () => {
        let url = new URL('<%=global.config.apiServerUrl%>/tag-release/get-tag-release');
        fetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(response => {
            releaseHTML = '';

            for(let i = 0; i < response.data.length; i++){
                let distributeTime = unixTimestamp(response.data[i].release_time / 1000).substring(0, 10);
                if(i == 0 || distributeTime != unixTimestamp(response.data[i-1].release_time / 1000).substring(0, 10)){
                    releaseHTML += '<div class="faq-content">';
                    releaseHTML += '    <div name="releaseHeader" id="releaseHeader-' + (i + 1) + '" style="font-weight: bold; font-size: large;">';
                    releaseHTML += '        <span id="que-' + (i + 1) + '-toggle" style="cursor:pointer;"> + </span><span style="cursor:pointer;">' + distributeTime +'</span>';
                    releaseHTML += '    </div>';
                    releaseHTML += '    <div name="releaseBody" id="releaseBody-'+ (i + 1) + '" style="display: none; padding: 10px 0 0 15px; font-size: medium;"><div style="font-weight: bold;"> v.' + response.data[i].version + '</div>';
                    releaseHTML += '    <div> <%= __('Deployment time')%> : ' + unixTimestamp(response.data[i].release_time/1000).substring(11, 19) + '</div>';
                    releaseHTML += '    </div>';
                }
                if(i > 0 && distributeTime == unixTimestamp(response.data[i-1].release_time / 1000).substring(0, 10)){
                    releaseHTML += '    <div name="releaseBody" id="releaseBody-' + (i + 1) + '" style="display: none; padding: 10px 0 0 15px; font-size: medium;"><div style="font-weight: bold;"> v.' + response.data[i].version + '</div>';
                    releaseHTML += '    <div> <%= __('Deployment time')%> : ' + unixTimestamp(distributeTime).substring(11, 19) + '</div>';
                    releaseHTML += '    </div>';
                }
                if(i == response.data.length - 1 || distributeTime != unixTimestamp(response.data[i + 1].release_time / 1000).substring(0, 10)){
                    releaseHTML += '    <div class="dropdown-divider"></div>';
                    releaseHTML += '</div><br>';
                }
            }
            document.getElementById("releaseList").innerHTML = releaseHTML;

            // release Data open and close
            let releaseBodyId ="";
            let releaseHeader = document.getElementsByName("releaseHeader");
            for(let i = 0; i < releaseHeader.length; i++){
                releaseHeader[i].addEventListener("click", function(e){
                    releaseBodyId = releaseHeader[i].id.replace('releaseHeader', 'releaseBody');

                    let start = releaseBodyId.replace('releaseBody-','');
                    let end = response.data.length + 1;
                    if(i < releaseHeader.length - 1){
                        end = releaseHeader[i + 1].id.replace('releaseHeader-','');
                    }

                    // change icon(+, -)
                    for(let j = 1; j < end - start + 1; j++){
                        if(document.getElementById(releaseBodyId).style.display === 'block') {
                            document.getElementById(releaseBodyId.replace(start, end - j)).style.display = 'none';
                            document.getElementById('que-' + start + '-toggle').textContent = '+ ';
                        }
                        else {
                            document.getElementById(releaseBodyId.replace(start, end - j)).style.display = 'block';
                            document.getElementById('que-' + start + '-toggle').textContent = '- ';
                        }
                    }
                    
                })
            }
        })
    }

    eventListener();
    versionInfo();
    releaseList();    

})
