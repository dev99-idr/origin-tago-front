$(document).ready(function () {

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("tag-layout-list-front-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

let g_currentPagingNumber = 0;
let g_currentPageSize = 100;
let dataTable;


    // 해당 리스트가 지연이 되어 External application interworking 가 늦어짐.
    const getTagLayoutList = () => {

        showLoading();
        
       
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-editor/layout-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                //"tagSize" : tag_size
                /*"searchInfo": "",
                "pNumber": g_currentPagingNumber,
                "pageSize": g_currentPageSize,*/
            }
        };

        ajax(options, function (data) {

           

            let startDate = new Date();

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log('tag-layoutlist-time start:'+startDate.toString()+':');
            <% }%>

            

            if(data.status == "OK"){
               
                let tagLayoutList = data.data.tagLayoutList;

                let bodyHtml = "";
              /*  tagLayoutList.map(function (params) {
                    bodyHtml += " <tr>";
                    // bodyHtml += '   <td class="flex" scope="col">';
                    // bodyHtml += '       <div class="custom-control custom-checkbox" >';
                    // bodyHtml += '           <input type="checkbox" id="tagListCheck' + params.idx + '" class="custom-control-input">';
                    // bodyHtml += '           <label class="custom-control-label" for="tagListCheck' + params.idx + '"  ></label>';
                    // bodyHtml += '       </div>';
                    // bodyHtml += '   </td>';
                    // bodyHtml += '   <td>'
                    // bodyHtml += '       <div class="form-check">'
                    // bodyHtml += '         <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">'
                    // bodyHtml += '       </div>'
                    // bodyHtml += '   </td>'
                    // bodyHtml += '   <td>'
                    // bodyHtml += '       <div class="custom-control custom-checkbox">'
                    // bodyHtml += '       <input type="checkbox" class="custom-control-input" id="tagListCheck' + params.idx + '" >'
                    // bodyHtml += '       <label class="custom-control-label" for="tagListCheck' + params.idx + '"></label>'
                    // bodyHtml += '         </div>'
                    // bodyHtml += '   </td>'
                    bodyHtml += "   <td ><img class='border border-dark' name='tag_preview' id ='tag_preview_" + params.idx + "' src =''></img></td>";
                    bodyHtml += "   <td id ='tag_layout_name" + params.idx + "'>" + params.tag_layout_name + "</td>";
                    bodyHtml += "   <td id ='tag_size_" + params.idx + "'>" + params.tag_size + "</td>";
                    // bodyHtml += "   <td id ='tag_location_"+tagList[i].idx+"'>"+tagList[i].location_name+"</td>";
                    // bodyHtml += "   <td id ='tag_wakeup_prd_"+tagList[i].idx+"'>"+tagList[i].tag_wakeup_prd+"</td>";
                    // // bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-success" data-original-title="Edit Task" name = "tagDetail" id="tagDetail_'+tagList[i].idx+'"><i class="la la-2x la-dashboard"></i></button></td>';
                    bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "tagEdit" id="tagEdit_' + params.idx + '"><i class="la la-2x la-edit"></i></button></td>';
                    bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-danger" data-original-title="Remove" name = "tagRemove" id="tagRemove_' + params.idx + '"><i class="la la-2x la-times"></i></button></td>';
                    bodyHtml += "</tr>";


                }) */


                for (let i = 0; i < tagLayoutList.length; i++) {
                    bodyHtml += " <tr>";
                    // bodyHtml += '   <td class="flex" scope="col">';
                    // bodyHtml += '       <div class="custom-control custom-checkbox" >';
                    // bodyHtml += '           <input type="checkbox" id="tagListCheck' + params.idx + '" class="custom-control-input">';
                    // bodyHtml += '           <label class="custom-control-label" for="tagListCheck' + params.idx + '"  ></label>';
                    // bodyHtml += '       </div>';
                    // bodyHtml += '   </td>';
                    // bodyHtml += '   <td>'
                    // bodyHtml += '       <div class="form-check">'
                    // bodyHtml += '         <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">'
                    // bodyHtml += '       </div>'
                    // bodyHtml += '   </td>'
                    // bodyHtml += '   <td>'
                    // bodyHtml += '       <div class="custom-control custom-checkbox">'
                    // bodyHtml += '       <input type="checkbox" class="custom-control-input" id="tagListCheck' + params.idx + '" >'
                    // bodyHtml += '       <label class="custom-control-label" for="tagListCheck' + params.idx + '"></label>'
                    // bodyHtml += '         </div>'
                    // bodyHtml += '   </td>'
                    //bodyHtml += "   <td ></td>";
                    bodyHtml += "   <td ><img class='border border-dark' name='tag_preview' id ='tag_preview_" + tagLayoutList[i].idx + "' src =''></img></td>";
                    bodyHtml += "   <td id ='tag_layout_name" + tagLayoutList[i].idx + "'>" + tagLayoutList[i].tag_layout_name + "</td>";
                    bodyHtml += "   <td id ='tag_size_" + tagLayoutList[i].idx + "'>" + tagLayoutList[i].tag_size + "</td>";
                    // bodyHtml += "   <td id ='tag_location_"+tagList[i].idx+"'>"+tagList[i].location_name+"</td>";
                    // bodyHtml += "   <td id ='tag_wakeup_prd_"+tagList[i].idx+"'>"+tagList[i].tag_wakeup_prd+"</td>";
                    // // bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-success" data-original-title="Edit Task" name = "tagDetail" id="tagDetail_'+tagList[i].idx+'"><i class="la la-2x la-dashboard"></i></button></td>';
                    bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-primary" data-original-title="Edit Task" name = "tagEdit" id="tagEdit_' + tagLayoutList[i].idx + '"><i class="la la-2x la-edit"></i></button></td>';
                    bodyHtml += '   <td><button type="button" data-toggle="tooltip" title="" class="btn btn-link btn-simple-danger" data-original-title="Remove" name = "tagRemove" id="tagRemove_' + tagLayoutList[i].idx + '"><i class="la la-2x la-times"></i></button></td>';
                    bodyHtml += "</tr>";

                }   


                //tagListBody.innerHTML = bodyHtml;
                tagListBody.innerHTML = bodyHtml;


                let tagEdit = document.getElementsByName('tagEdit');
                for (let i = 0; i < tagEdit.length; i++) {
                    let canvas = new fabric.Canvas();

                    switch(tagLayoutList[i].tag_size){
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
                            canvas.setHeight(480);
                            break;
                        case "10_2":        // Add 10.2 inch tag type -> by jylee
                            canvas.setWidth(960);
                            canvas.setHeight(640);
                            break;    
                    }

                    canvas.renderAll();
                    let tag_preview = document.getElementById('tag_preview_' + tagLayoutList[i].idx);

                    canvas.loadFromJSON(tagLayoutList[i].tag_info_json, function () {
                        tag_preview.src = canvas.toDataURL();
                        tag_preview.style.width = "296px";
                        tag_preview.style.height = "128px";
                        //tag_preview[i].style.objectFit = 'contain';   // Add jylee
                    });


                    tagEdit[i].addEventListener('click', function (e) {
                        editTagLayout(tagLayoutList[i]);
                    });
                }

                let tagRemove = document.getElementsByName('tagRemove');
                for (let i = 0; i < tagRemove.length; i++) {
                    tagRemove[i].addEventListener('click', function (e) {
                        deleteTagLayout(tagLayoutList[i]);
                    });
                }             
                
                

                try{


                    $('#smartTagList').dataTable({
                        "bDestroy": true
                    }).fnDestroy();    
                     
                    
                    $('#smartTagList').DataTable({
                        dom: '<"top"fl>rt<"bottom"ip><"clear">',
                        columnDefs: [
                            //{ type: 'natural', targets: '_all' }
                            {
                                    targets: 2,
                               render: function (data, type, row) {
                                   if (type == 'sort' || type == 'type') {
                                     var result = data.replace(/[^0-9.]/g, "");
                                   
                                   // Without a digit.  Might need more detailed checking
                                   if ( !result ) {
                                       result = 0;
                                   }
                                     return result;
                                 }
                                 return data;
                               }
                            }
                          ]
                    });

                }catch(e){
                    console.log("dataTable errror:"+e.message+":");
                }
               
 
            }else{
                hideLoading();
                alertPopUp("error","error occurred. contact admin");
                console.log('error:'+options+':\r\nrespone.data'+response.data);
            }

            let endDate = new Date();  

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log('tag-layoutlist-time start:'+endDate.toString()+':elipse time:'+ (endDate.getTime() - startDate.getTime()) +':');
            <% }%>

            hideLoading();
    

        }, function (error) {
            hideLoading();
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
       

    }


    const editTagLayout = (tagLayoutInfo) => {
        loadPage("tag-editor", "#right-panel",tagLayoutInfo);
       
    }
    const deleteTagLayout = (tagLayoutInfo) => {
        let idx = tagLayoutInfo.idx;
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-editor/delete-tag-layout",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                idx:idx
            }
        };

        ajax(options, function (data) {

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log('[delete-tag-layout]data.status:'+data.status+"\r\nurl:"+options.url);
            <% }%>

            

            if(data.status == "OK"){
                alertPopUp("success","<%=__('Tag Layout Deleted')%>");         //Tag Layout 삭제 완료");
                loadPage("tag-layout-list","#right-panel")
            }
            else{
                alertPopUp("success","<%=__('Tag Layout deletion failed')%>");     //Tag Layout 삭제 실패");
                loadPage("tag-layout-list","#right-panel")
            }
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
        
    }

    //태그리스트 조회가 오래 걸리므로 앞뒤로 로딩중 페이지 설정

    getTagLayoutList();

})