$(document).ready(function() {

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("tag-location-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    // load location info
    let selectedLocationDepth = 0;
    let selectPerPage = document.getElementById("selectPerPage");
    let tagSearchText = document.getElementById("tagSearchText");
    let tagSearchBtn = document.getElementById("tagSearchBtn");
    let tagSearchCriteria = document.getElementById("tagSearchCriteria");

    const eventListener = () => {
        selectPerPage.addEventListener("change", function(e){
            perPage = Number(selectPerPage.value);
            currentbtnActive = 1;
            currentPage = 1;
            startpage = 1;
            countTag(startpage, perPage);
        })

        tagSearchBtn.addEventListener("click", function(e){
            searchCriteria = tagSearchCriteria.value
            searchText = tagSearchText.value;
            startpage = 1;
            currentPage = 1;
            currentbtnActive = 1;
            countTag(currentPage, perPage);
        })

        tagSearchText.addEventListener("keydown", function (e) {
            if (e.keyCode == 13) {
                tagSearchBtn.click();
            }
        })

        // add location
        let addLocationBtn = document.getElementById("addLocationBtn");
        addLocationBtn.addEventListener("click", function(e){
            let node = $.ui.fancytree.getTree("#tree").getActiveNode();
            if( !node ) {
                alertPopUp("error","<%=__('Please select a location')%>");                //location을 선택해주세요.");
                return;
            }
            node.editCreateNode("child", {
                title : "New",
                folder: true
            });

            for(let i = 0; i < locationData.length; i++){
                if(node.key == locationData[i].idx){
                    selectedLocationDepth = Number(locationData[i].depth) + 1;
                }
            }

            let url = new URL('<%=global.config.apiServerUrl%>/tag-location/insert-location-info');
            let parameter = {
                "parent_rawid" : node.key,
                "location_name" : "New",
                "depth" : selectedLocationDepth
            }
            fetch(url, {
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parameter)
            })
            .then(response => {
                loadPage('tag-location','#right-panel');
            })
        })


        // delete location
        let deleteLocationBtn = document.getElementById("deleteLocationBtn");
        deleteLocationBtn.addEventListener("click", function(e){
            alertPopUp('warning',"<%=__('Are you sure you want to delete it? If you press delete, it will be deleted')%>");        //정말 삭제하시겠습니까?  delete를 누르면 삭제됩니다");
            $('.swal-button--confirm').on('click',function(e){
                let tree = $.ui.fancytree.getTree("#tree"),
                node = tree.getActiveNode();
                node.remove();

                let url = new URL('<%=global.config.apiServerUrl%>/tag-location/delete-location-info');
                let parameter = {
                    "idx" : node.key
                }
                fetch(url, {
                    method: 'post',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parameter)
                })
                .then(response => {
                    alertPopUp("success", "<%=__('Deleted')%>");                      //삭제 되었습니다.")
                    loadPage('tag-location','#right-panel');
                })
            })
        })
    }

    const LocationGroupInfo = () => {
        sourceData = [];
        let url = new URL('<%=global.config.apiServerUrl%>/tag-location/get-location-info');
        let parameter = {
            "id": getCookie("id")
        }
        fetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({parameter})
        })
        .then(response => response.json())
        .then(response => {
            locationData = response.data;

            let fistLocation = document.getElementById("fistLocation");
            let inputLocation = document.getElementById("inputLocation");
            let inputLocationBtn = document.getElementById("inputLocationBtn");

            if(locationData.length == 0){
                inputLocationBtn.addEventListener("click", function(e){
                    let url = new URL('<%=global.config.apiServerUrl%>/tag-location/insert-location-info');
                    let parameter = {
                        "parent_rawid" : -1,
                        "location_name" : inputLocation.value,
                        "depth" : 1
                    }
                    fetch(url, {
                        method: 'post',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(parameter)
                    })
                    .then(response => {
                        loadPage('tag-location', '#right-panel');
                    })
                })
            }
            else{
                fistLocation.style.display = "none";
            }
            clickTag();
        })
    }

    // select location from the location list & function related location
    let thingData = "";
    let totalDataLength = 0;
    let currentPage = 1;
    let startpage = 1;
    let perPage = 5;
    let endPage = 5;
    let currentbtnActive = 1;
    let searchCriteria = "tag_name";
    let searchText = "";

    const clickTag = () => {
        let target = document.getElementById("statusLine");

        let observer = new MutationObserver((mutations) =>{
            thingTypeName.innerText = selectedLocaion.title;
            selectPerPage.value = 5;
            tagSearchCriteria.value = "tag_name";
            tagSearchText.value = "";
            searchText = "";
            perPage = 5;
            currentbtnActive = 1;
            currentPage = 1;

            countTag(1, 5);
        })

        let option ={
            childList : true,
            CharacterData: true,
            attributes : true
        }

        observer.observe(target, option);
    }


    // select stored tag infomation in the DB
    const countTag = (start, end) => {
        let countThingType = document.getElementById("countThingType");

        let parameter = {
            "idx" : selectedLocaion.key,
            "searchCriteria" : searchCriteria,
            "searchText" : searchText
        }
        fetch('<%=global.config.apiServerUrl%>/tag-location/count-location', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parameter)
        })
        .then(response => response.json())
        .then(response => {
            if(response.status == "OK"){
                countThingType.innerText = response.data;
            }
            else{
                countThingType.innerText = 0;
            }
            totalDataLength = response.data;

            loadTag(start, end);
        })
    }

    const loadTag = (start, end) => {
        let url = new URL('<%=global.config.apiServerUrl%>/tag-location/tag-info');
        let parameter = {
            "start" : (start - 1) * end,
            "end" : end,
            "idx" : selectedLocaion.key,
            "searchCriteria" : searchCriteria,
            "searchText" : searchText
        }
        fetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parameter)
        })
        .then(response => response.json())
        .then(response => {
            thingData = response.data;

            let pagination = document.getElementById("pagination");    
            let tagList = document.getElementById("tagList");

            tagList.innerHTML = "";
            bodyHtml = "";
            
            endPage = Math.ceil(currentPage / perPage) * perPage;
            if(totalDataLength / perPage < endPage){
                endPage = Math.ceil(totalDataLength / perPage);
            }

            if(thingData.length == 0){
                bodyHtml += "<tr>";
                bodyHtml += "   <td><%=__('No data exists')%></td>";      //해당하는 데이터가 없습니다.
                bodyHtml += "</tr>";
                tagList.innerHTML = bodyHtml;
                pagination.innerHTML = "";
            }
            else{
                
                if(thingData.length == 0){
                    bodyHtml += '<tr>';
                    bodyHtml += '   <td>-</td>';
                    bodyHtml += '   <td>-</td>';
                    bodyHtml += '   <td>-</td>';
                    bodyHtml += '   <td>-</td>';
                    bodyHtml += '</tr>';
                }

                for(let i = 0 ; i < thingData.length; i++){
                    bodyHtml += '<tr>';
                    bodyHtml += '   <td id ="number_' + thingData[i].idx + '">' + (perPage * (currentPage - 1) + i + 1) + '</td>';
                    bodyHtml += '   <td id ="tag_name_' + thingData[i].idx + '">' + thingData[i].tag_name + '</td>';
                    bodyHtml += '   <td id ="tag_thing_id_' + thingData[i].idx + '">' + thingData[i].tag_thing_id + '</td>';
                    bodyHtml += '   <td id ="tag_location_' + thingData[i].idx + '">' + thingData[i].location_name + '</td>';
                    bodyHtml += '</tr>';
                }
                tagList.innerHTML = bodyHtml;


                // pagination
                pageHtml = "";
                pageHtml += '<ul class="pagination justify-content-center">';
                pageHtml += '     <li class="page-item" name = "btnActive"><a class="page-link" href="#" name="pageBtn">Previous</a></li>';
                for(let i = startpage; i <= endPage; i++){
                    pageHtml += '     <li class="page-item" name = "btnActive"><a class="page-link" href="#" name="pageBtn">' + i + '</a></li>';
                }
                pageHtml += '     <li class="page-item" name = "btnActive"><a class="page-link" href="#" name="pageBtn">Next</a></li>';
                pageHtml += '</ul>';
                pagination.innerHTML = pageHtml;

                let pageBtn = document.getElementsByName("pageBtn");
                let btnActive = document.getElementsByName("btnActive");

                for(let i = 0; i < pageBtn.length; i++){
                    btnActive[currentbtnActive].className += " active";
                    pageBtn[i].addEventListener("click", function(e){
                        if(e.currentTarget.innerText == "Previous"){
                            if(currentPage != 1){
                                currentbtnActive = (currentPage - 1) % 5;
                                if(currentPage > 1){
                                    currentPage -= 1;
                                }
                                if(currentPage % 5 == 0){
                                    startpage -= 5;
                                }
                            }
                        }
                        else if(e.currentTarget.innerText == "Next"){
                            if(currentPage < totalDataLength/perPage){
                                currentPage += 1;
                                currentbtnActive = currentPage % 5;
                            }
                            if(currentPage % 5 == 1){
                                currentbtnActive = 1;
                                startpage = currentPage;
                            }
                        }
                        else{
                            currentPage = Number(e.currentTarget.innerText);
                            currentbtnActive = Number(e.currentTarget.innerText) % 5;
                        }
                        if(currentbtnActive == 0){
                            currentbtnActive = 5;
                        }
                        countTag(currentPage, perPage);
                    })
                }
            }
        })
    }

    loadLocation("#statusLine", "#tree");
    LocationGroupInfo();
    eventListener();

});