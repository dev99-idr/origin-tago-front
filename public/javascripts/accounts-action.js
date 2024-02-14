$(document).ready(function() {


    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("account-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    const eventListener = () => {
        let selectPerPage = document.getElementById("selectPerPage");
        selectPerPage.addEventListener("change", function(e){
            perPage = selectPerPage.options[selectPerPage.selectedIndex].value;
            endPage = perPage;
            currentPage = 1;
            startPage = 1;
            currentbtnActive = 1;

            getUserInfo(startPage, endPage);
        })

        let userAddBtn = document.getElementById("userAddBtn");
        userAddBtn.addEventListener("click", function(e){
            loadPage('user-register', '#right-panel');
        })
    }

    
    let selectedArr = [];

    const getUserInfo = (start, end) => {
        let url = "<%=global.config.apiServerUrl%>/user/get-all-user-info";
        let parameter = {
            "start" : (start - 1) * end,
            "end" : end
        }
        fetch(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parameter)
        })
        .then(response => response.json())
        .then(response => {
            let userInfoArr = response.data;

            let userInfoHTML = '';
            for(let i = 0; i < userInfoArr.length; i++){
                userInfoHTML += '<tr style="text-align: center;">';
                userInfoHTML += '    <td style="display: none;">';
                userInfoHTML += '       <input type="checkbox" name="checkbox" id="checkbox_' + userInfoArr[i].idx + '">';
                userInfoHTML += '    </td>';
                userInfoHTML += '    <td>' + userInfoArr[i].user_id + '</td>';
                userInfoHTML += '    <td>' + userInfoArr[i].user_name + '</td>';
                userInfoHTML += '    <td>' + userInfoArr[i].user_authority + '</td>';
                userInfoHTML += '</tr>';
            }
            document.getElementById("accountsInfo").innerHTML = userInfoHTML;

            pagination();
            setAuthority(userInfoArr);
        })
    }

    let countSelectedUser = document.getElementById("countSelectedUser");
    const setAuthority = (userInfoArr) => {
        let countSelectedCheckbox = 0;
        let selectedCheckbox = document.getElementsByName("checkbox");

        for(let i = 0; i < userInfoArr.length; i++){

            selectedCheckbox[i].addEventListener("change", function(e){
                if(selectedCheckbox[i].checked == true){
                    countSelectedCheckbox++;
                }
                else{
                    countSelectedCheckbox--;
                }
                countSelectedUser.innerText = countSelectedCheckbox;
                
                selectedArr.push(selectedCheckbox[i].id.replace("checkbox_", ""));
            })
            
        }
    }


    // start pagination
    let totalUserData = 5;
    let startPage = 1;
    let endPage = 5;
    let perPage = 5;
    let currentPage = 1;
    let currentbtnActive = 1;
    let countUser = document.getElementById("countUser");
    
    const pagination = () => {
        fetch("<%=global.config.apiServerUrl%>/user/count-user", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify()
        })
        .then(response => response.json())
        .then(response => {
            totalUserData = response.data;
            countUser.innerText = totalUserData;
            
            endPage = Math.ceil(currentPage / 5) * 5;
            if(totalUserData / perPage < endPage){
                endPage = Math.ceil(totalUserData / perPage);
            }

            let paginationHTML = "";
            paginationHTML += '<ul class="pagination justify-content-center">';
            paginationHTML += '     <li class="page-item" name = "btnActive"><a class="page-link" href="#" name="pageBtn">Previous</a></li>';
            for(let i = startPage; i <= endPage; i++){
                paginationHTML += '     <li class="page-item" name = "btnActive"><a class="page-link" href="#" name="pageBtn">' + i + '</a></li>';
            }
            paginationHTML += '     <li class="page-item" name = "btnActive"><a class="page-link" href="#" name="pageBtn">Next</a></li>';
            paginationHTML += '</ul>';
            document.getElementById("accountPageBtn").innerHTML = paginationHTML;

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
                                startPage -= 5;
                            }
                        }
                    }
                    else if(e.currentTarget.innerText == "Next"){
                        if(currentPage < totalUserData / perPage){
                            currentPage += 1;
                            currentbtnActive = currentPage % 5;
                        }

                        if(currentPage % 5 == 1){
                            currentbtnActive = 1;
                            startPage = currentPage;
                        }
                    }
                    else{
                        currentPage = Number(e.currentTarget.innerText);
                        currentbtnActive = Number(e.currentTarget.innerText) % 5;
                    }

                    if(currentbtnActive == 0){
                        currentbtnActive = 5;
                    }

                    getUserInfo(currentPage, perPage);
                })
            }

        })
    }
    // end pagination

    getUserInfo(1, 5);
    eventListener();
})