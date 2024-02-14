$(document).ready(function () {
    let fromDateUnix;
    let toDateUnix;
    let fromTableName;
    let toTableName;
    let dataTable;
    let dataCategory;

    

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("tag-history-front-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>

    const getList = () => {
        showLoading();
        let options = {
            url: "<%=global.config.apiServerUrl%>/tag-monitoring/tag-history-data-list",
            type: "post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "fromDateUnix": fromDateUnix,
                "toDateUnix": toDateUnix,
                "fromTableName":fromTableName,
                "toTableName":toTableName,
                "thingID":thingIdInput.value,
                "dataCategory" : dataCategory
            }
        };

        if(toDateUnix < fromDateUnix){
            alertPopUp('error',"<%=__('Check the search time')%>");            //조회시간을 확인하세요");
            hideLoading();
            return;
        }
        
        ajax(options, function (data) {
            tagListBody.innerHTML = "";
            let tagHistoryDataList = data.data.tagHistoryDataList;

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("tagHistoryDataList.length:"+tagHistoryDataList.length);
            <% }%>

            
            let bodyHtml = "";

            
            start = new Date().getTime();

            try{

                //데이터 테이블 초기화
                $('#smartTagList').dataTable({
                    "bDestroy": true
                }).fnDestroy();        
                
            }catch(e){
                console.log("dataTable destory error:"+e.toString()+":");
            }
           
            dataTable = $('#smartTagList').DataTable({
                "pageLength": 10,
                "searching": true,
                "lengthChange": true,
                "ordering": true,
                "autoWidth":true,
                // "destroy": true, 
                "data":tagHistoryDataList,
                columns:[
                    {data:"node_name"},
                    {data:"variable_name"},
                    {data:"variable_value"},
                    {data:"variable_time", "render": function(data){
                        let date2 = new Date(parseInt(data));
                        return moment(date2).format('YYYY-MM-DD HH:mm:ss');
                    }}
                ],
                order: [ 3, "desc" ],
                columnDefs : [{"targets":3, "type":"date"}],
            });
         

            let count = dataTable.data().count().toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

            $("#smartTagList_length").prepend("<span class='font-weight-bold' style='font-size:18px;'><%=__('Total')%> " + count + " </span>&nbsp;&nbsp;");
            $("#smartTagList_info").css("font-weight","bold");
            $("#smartTagList_info").css("font-size","18px");

            end = new Date().getTime(); 

            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("tag-history-front-action.js[smartTagList] create time :"+(end-start));
            <% }%>

            hideLoading();
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
    }

    const eventListener = () => {
        $('#fromDate').datetimepicker({
            format: 'YYYY/MM/DD/ HH:mm',
            defaultDate: new Date().getTime() - 3600000
        });

        $('#toDate').datetimepicker({
            format: 'YYYY/MM/DD/ HH:mm',
            defaultDate: moment()
        });

        searchBtn.addEventListener('click', function (e) {
            fromDateUnix = moment(document.getElementById("fromDate").value).unix();
            toDateUnix = moment(document.getElementById("toDate").value).unix();
            fromTableName = moment(document.getElementById("fromDate").value).format("YYMMDDHH");
            toTableName = moment(document.getElementById("toDate").value).format("YYMMDDHH");

            let collectionData = document.getElementById('collectionData');
            let controlData = document.getElementById('controlData');
            
            if(collectionData.checked == true){
                dataCategory = "collection";
            }
            else{
                dataCategory = "control";
            }
            getList();

        })
    }

    eventListener();
})