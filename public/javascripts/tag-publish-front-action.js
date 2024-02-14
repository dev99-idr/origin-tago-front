$(document).ready(function() {   //thing wave와 분리전 tag publish -> image process server로 전환시 삭제 예정
    
    
    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("tag-publish-front-action.js");
    <%}%>
    <% if ( global.config.javascriptMode == "debug" ){ %>
        debugger;
    <% }%>
    
    let g_searchInfo =
    {
        "searchType"    : "",
        "searchKeyword" : ""
    };
    let g_eventSelect;
    let g_imageRawid;
    let g_imageSize;
    let g_objectStore = [];
    let g_listTotalCount;
    let g_currentPageSize = 10;
    let g_maxPage = 6;
    let g_nextCount = 0;
    let g_currentPagingNumber = 0;


    const setServerIp = () => {
		g_imgSeverIp ="http://"+document.getElementById('IpAddress').value+":"+document.getElementById('PortNumber').value;
	}

    const getimg = () => {
        
        let options = {
			url:g_imgSeverIp+"/ApiMain",
	        type:"get",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "category" : "form",
                "filedirectory": "formImage",
                "imagename": "",
				"rawid" :[],
				"imgextension":"png",
				"execType": "formfilelist"
            }
        };
        let temparr  = [];

        let tagName = document.getElementsByName("tagimgnames");
        if (tagName.length === 0) return 0;

        for (let i = 0; i < tagName.length; i++) {
            temparr.push(tagName[i].id);
		};
        options.sendData.imagename = temparr.toString();
        ajax(options, function(data){
            try{
                this._rootpath = data.path;
                let imgData = data.formfilelist;
    
                let previewImg = document.getElementsByName("previewImg");
                
                for (let i = 0; i < previewImg.length; i++) {
                    let rawid = previewImg[i].id.split("_")[1];
                    let ele = document.getElementById('tagimg_' + rawid);
                    let id = "priview_" + rawid;
                    let imgLi = document.getElementById(id);
                    ele.width = imgLi.clientWidth - 4;
                    ele.height = imgLi.clientHeight - 4;
                    if(ele.width == 0 )
                        ele.width = 100;
    
                    if(ele.height == 0 )
                        ele.height = 70;
                    ele.src = 'data:image/png;base64,' + imgData[i]['base64'];
                };
            }
            catch(e)
            {
                console.log('getimg : '+e);
            }
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
	};

    
    const getList = () => {
        let options = {
			url:g_imgSeverIp+"/ApiMain",
	        type:"get",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "category" : "form",
				"execType": "formlist",
				"searchInfo"     : JSON.stringify(g_searchInfo),
				"pNumber"        : g_currentPagingNumber,	
				"pageSize"       : g_currentPageSize, 
            }
		};

        ajax(options, function(data){
            let listData = data.formlist;
            let listRootEle = document.getElementById("formlistBody");
            if (listData.length === 0) {
                listRootEle.innerHTML = "";
                return 0;
            }
    
            var newcode = '';
            let tagSizeArr = [];
            tagSizeArr[1] = "2_9";
            tagSizeArr[2] = "2_9(vertical)";
            tagSizeArr[3] = "4_2";
            tagSizeArr[4] = "4_2(vertical)";
            tagSizeArr[5] = "7_2";
            tagSizeArr[6] = "7_2(vertical)";
    
            for (let i = 0; i < listData.length; i++) {
                
                newcode += '<tr align="center" id="ul_' + listData[i].rawid + '">';
    
                newcode += '<td scope="row">';
                newcode += '     <div class="custom-control custom-radio" style="margin-left:10px;">';
                newcode += '        <input type="radio" name="checknames" id="fcheckid_' + listData[i].rawid + '" class="custom-control-input"/> ' ;				
                newcode += ' 		<label class="custom-control-label" for="fcheckid_' + listData[i].rawid + '" style="height:17px;width: 0px;cursor:pointer"></label> ';				
                newcode += '     </div>';
                newcode += '</td>';
                newcode += '<td style= "height:128px" name="previewImg"  id="priview_' + listData[i].rawid + '" >';
                newcode += '    <img class="border border-dark" style="width:200px" id="tagimg_'  + listData[i].rawid + '" />';
                newcode += '</td>';
                newcode += '<td id="formname_' + listData[i].rawid + '">' + listData[i].formname + '</td>';
                newcode += '<td id="fgrpname_' + listData[i].rawid + '">' + listData[i].fgrpname + '</td>';
                newcode += '<td id="codename_' + listData[i].rawid + '">' + listData[i].codename + '</td>';
                newcode += '<td id="tagsize_'  + listData[i].rawid + '">' + tagSizeArr[listData[i].tagsizerawid] + '</td>';
                if(this._showUpdateBtn)
                {
                    newcode += '<td><button type="button" name="updateBtnNames" id="updateBtn_' + listData[i].rawid + '" class="btn btn-info" data-dismiss="modal"><i class="fa fa-edit"></i></button></td>';
                }
    
                if(this._showDeleteBtn)
                {
                    //btn btn-secondary
                    let btnColor = "btn btn-danger";
                    if(listData[i].isConnForm != '-1')
                    {
                        //btnColor = "btn btn-secondary";
                    }
                    newcode += '<td><button type="button" name="deleteBtnNames" id="deleteBtn_' + listData[i].rawid + '" class="'+btnColor+'" data-dismiss="modal"><i class="fa fa-trash"></i></button></td>';
                }
                newcode += '<input type="hidden" id="' + listData[i].imagename + '" name="tagimgnames" />';
                newcode += '<input type="hidden" id="' + listData[i].rawid + '" name="formrawidnames" />';
                newcode += '</tr>';
    
            };
            setPaging(data.totalcount.totalcnt);
            listRootEle.innerHTML = newcode;
    
            
            for(let i=0;i<document.getElementsByName('checknames').length;i++){
                document.getElementsByName('checknames')[i].addEventListener('click',function(e){

                    document.getElementById('canvasid').innerHTML = '<div style="vertical-align: middle; border: 0px; "><canvas id="canvas" style="border: 1px solid black;  "></canvas><canvas id="redcanvas" style="border: 1px solid black;  "></canvas></div>';
                    document.getElementById('canvasid').innerHTML = 
                    '<div style="vertical-align: middle; border: 0px; ">'+
                    // '<canvas id="combinedcanvas" style="border: 1px solid black;  "></canvas>'+
                    // '<canvas id="canvas" style="border: 1px solid black;  "></canvas>'+
                    // '<canvas id="redcanvas" style="border: 1px solid black;  "></canvas>'+
                    '</div>';
                    g_objectStore = [];
                    g_eventSelect = e;
                    g_imageRawid = document.getElementsByName('checknames')[i].id.split('_')[1]
                    g_imageSize = document.getElementById("tagsize_"+g_imageRawid).innerText;
                    // let id = document.getElementsByName('checknames')[i].id.split('_')[1];
                    document.getElementById('loadformbtn').value=2;

    
                    // document.getElementById('canvas').getContext('2d').clearRect(0, 0, document.getElementById('canvas').width, document.getElementById('canvas').height);
                    getTagJSONdata(g_imageRawid, document.getElementsByName('tagimgnames')[i].id);

                    let image = document.createElement('img');
                    image.src    = document.getElementById('tagimg_'+g_imageRawid).src;
                    image.style.border = "1px solid black";
                    image.style.maxWidth = "500px";
                    document.getElementById('canvasid').appendChild(image);


                }.bind(this))
            }
            
            getimg();
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });
	}

    const setPaging = (cnt) => {
        g_listTotalCount = Number(cnt);
        let pagingId = document.getElementById("pagingId");
        
		let pagingCount = Math.ceil(g_listTotalCount / g_currentPageSize);
        let dynamicHtml = "" ;
        dynamicHtml += '<li class="page-item"><a name="pagingname" id="Previou" class="page-link" >Previous</a></li>';
        
        let j = 1;           
        for(let i = 1+ g_maxPage * g_nextCount ; i <= pagingCount ; i++)
        {
        	if( j > g_maxPage )
        	{
                break;
            };
            dynamicHtml += '<li class="page-item"><a name="pagingname" id="pagingId_'+i+'" href="javascript:void(0);" class="page-link"  > '+i+' </a></li>';
            j+=1;
        }
        
        dynamicHtml += '<li class="page-item"><a name="pagingname" id="Next" class="page-link" >Next</a></li>';
        pagingId.innerHTML = dynamicHtml;
        
        let pagingEle = document.getElementsByName("pagingname");           
        let colorChangeIndex = g_currentPagingNumber+1-g_maxPage*g_nextCount;
        //console.log(colorChangeIndex)
        if (g_listTotalCount != 0) {
        	pagingEle[colorChangeIndex].style.backgroundColor='#679897';
        	pagingEle[colorChangeIndex].style.color='white';
        }

        for(let i = 0 ; i < pagingEle.length ; i++)
        {
            pagingEle[i].addEventListener('click',function(e){
            	let search = true;
            	let id = e.currentTarget.id;
            	if(id == 'Previou'){
            		if(g_currentPagingNumber > 0)
            		{
            			if(g_currentPagingNumber % g_maxPage == 0)
            			{
            				let nextcount = g_nextCount;
            				g_nextCount = (nextcount-=1);
            			}
            			
            			let currentpagingNumber = g_currentPagingNumber;
            			g_currentPagingNumber = currentpagingNumber-=1;
            		}
            		else
            		{
            			search = false;
            		}
            	}
            	else if(id == 'Next')
            	{
            		let pagingCount = Math.ceil(g_listTotalCount / g_currentPageSize);
            		if(g_currentPagingNumber + 1 < pagingCount)
            		{
            			if((g_currentPagingNumber+1) % g_maxPage == 0)
            			{
            				let nextcount = g_nextCount;
            				g_nextCount = (nextcount+=1);
            			}
            			let currentpagingNumber = g_currentPagingNumber;
            			g_currentPagingNumber = currentpagingNumber+=1;
            			
            		}
            		else
            		{
            			search = false;
            		}
            	}
            	else
            	{
            		let rawid = e.currentTarget.id.split("_")[1];
                    if(rawid == g_currentPagingNumber+1)
                    {
                        search = false;
                    }
                    else
                    {
                    	g_currentPagingNumber = parseInt(rawid,10)-1;
                    }
            	}
            	
            	if(search)
            	{
            		getList();
            	}
            	
            	
            }.bind(this));
        }		
    }
    const getSelectBoxInfo = () => {
        let options = {
			url:g_imgSeverIp+"/ApiMain",
			type:"get",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
               "execType":"selectboxinfo",
               "category":"datagroup"
            }
		};
	

        function funcCallback(data)
        {
            let listData = data['selectboxinfo'];

            if(listData.length === 0 ) return 0;

			let formgroup       = document.getElementById("formgroupName");
			let formName       = document.getElementById("formName");
            formgroup.innerHTML = "";
			formName.innerHTML = "";

            for(let i = 0 ; i < listData.length ;i++)
            {
                var opt = document.createElement('option');
                opt.value = listData[i].rawid;
                opt.innerHTML = listData[i].name;

                if( listData[i].ctype === 'formgroup' )
                {
                    if( formgroup.childNodes.length === 0 )
                    {
                        var opt1 = document.createElement('option');
                        opt1.value = -1;
                        opt1.innerHTML = "<%=__('Do not select')%>";           //선택 안함";
                        formgroup.appendChild(opt1);
                    };
                    formgroup.appendChild(opt);
				}
				else if ( listData[i].ctype === 'formname' )
                {
                    if( formName.childNodes.length === 0 )
                    {
                        var opt1 = document.createElement('option');
                        opt1.value = -1;
                        opt1.innerHTML = "<%=__('Do not select')%>";           //선택 안함";
                        formName.appendChild(opt1);
                    };
                    formName.appendChild(opt);
				}
            };
        };

        
        ajax(options, funcCallback,function(error){
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요

        });
	}
    const formgroupChnage = () => {		
		setServerIp();
		g_searchInfo.searchType   ='b'						//form DAO의 form selelct query중 b : formgroupname;
		g_searchInfo.searchKeyword = document.getElementById('formgroupName').options[document.getElementById('formgroupName').selectedIndex].innerText;
        $('#formName').val(-1).prop('selected',true);
		getList();
	}


    const formNameChnage = () => {	
		setServerIp();
        g_searchInfo.searchType   ='a'						//form DAO의 form selelct query중 a : formname;
        g_searchInfo.searchKeyword = document.getElementById('formName').options[document.getElementById('formName').selectedIndex].innerText;
        // document.getElementById('formName').options[0]
        $('#formgroupName').val(-1).prop('selected',true);
		getList();
    }

    const OBJECT_TYPE = () => {
        return {
            CIRCLE: 0,
            RECT: 1,
            LINE: 2,
            IMAGE: 3,
            DATA_BOX: 4
        };
    };
    const kanbanpublsih = (status) =>{
        let options = {
			url:"/kanbanpublish",
            type:"post",
            headers: {
                'Content-Type': "application/json",
            },
            sendData:  {
                "insertData":{
                    "tagdata":{

                    },
                    "thingid":"",
                    "status":status,
                    "pagenumber":"",
                    "imageName":g_imageRawid
                }
            }
		};
        let jsonvalue = document.getElementsByName('RequestType');
        let datacodeName = document.getElementsByName('datacodeName');
        for(let i = 0 ; i < jsonvalue.length; i++) {
            options.sendData.insertData.tagdata[datacodeName[i].innerText] = jsonvalue[i].value;
        }
        options.sendData.insertData.thingid = document.getElementById('thingId').value;
        options.sendData.insertData.pagenumber = document.getElementById('pageNumber').value;


		ajax(options, function(data){
            let icon = "success";
            let className = "btn btn-success";
            if(data.status.statusMessage == 'error'){
                icon = "error";
                className = "btn btn-danger";
            }
            else{
                icon = "success";
                className = "btn btn-success";
            }

            if(data.contents.message!=undefined){
                alertPopUp(icon,data.contents.message)
                // alert(data.contents.message);
            }
            if(data.contents.base64==undefined){
                return;
            }
            let image = document.createElement('img');
            image.src    = data.contents.base64;
            image.style.border = "1px solid black";

            if(/2_9/.test(g_imageSize)){
                image.style.transform = "rotate(180deg)";
            }

            image.style.border = "1px solid black";
            image.style.maxWidth = "500px";
            
            document.getElementById('canvasid').appendChild(image);
            let downloadLink = document.createElement('a');

            if(g_eventSelect.target.defaultValue=="Save To Local"){
                let filename = document.getElementById('thingId').value+'_'+document.getElementById('pageNumber').value;
                downloadLink.setAttribute('download', filename+'.png');
                let url = image.src.replace(/^data:image\/png/,'data:application/octet-stream');
                downloadLink.setAttribute('href',url);

                downloadLink.click();

            }
        }, function (error) {
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요
        });

    }
    const addObjData = (objJsonData) =>{
        switch(objJsonData.type)
        {
            case OBJECT_TYPE().RECT :{
                if(objJsonData.data.rectFillType == "rectfillimg")
                {
                    let image = document.createElement('img');
                    image.src    = objJsonData.data.eleImgSrc;
                    image.width  = objJsonData.data.eleImgOriWidth;
                    image.height = objJsonData.data.eleImgOriHeight;

                    objJsonData.data.eleImg    = image;
                }
            };break;
        }
        g_objectStore.push(objJsonData);
	};

    const getTagJSONdata = (id,imageName) => {

        let options = {
			url:g_imgSeverIp+"/ApiMain",
	        type:"get",
            headers: {
                'Content-Type': "application/json",
            },
            sendData: {
                "rawid": id,
                "execType":"gettagjsondata",
                "category":"form"
            }
        };

        let culumnName;
        let culumnArr;
        let culumnValue;
        let imageData = "";
        let fullDir = "";

        ajax(options, function(data){
            culumnValue=data.tagJSONdata[0].imagename;
            let options2 = {
                url:g_imgSeverIp+"/ApiMain",
                type:"get",
                headers: {
                    'Content-Type': "application/json",
                },
                sendData: {
                    "getTagData":JSON.stringify(
                        {
                            "imageName":culumnValue
                        }),
                    "execType":"getTagData",
                    "category":"form"
                }
            };
    
            let array;
    
            ajax(options2, function(data){
                // g_DataKeyCountEachTag = data.getTagData[0]['formJSON'].length;
                array = data.getTagData[0]['formJSON'];
    
                if (typeof array === "string") {
                    array = JSON.parse(array);
                }


                for(let i = 0 ; i < array.length ; i++)
                {
                    addObjData(JSON.parse(array[i].objdata));
                    
                }
                document.getElementById('dataKeyBalueField').innerHTML="";
                let dynamicHtml = "";
                for(let i=0;i< array.length;i++){
                    if(JSON.parse(array[i].objdata).data.textType=="rectdatadataset"){
                        dynamicHtml += '<div class="col-4">';
                        dynamicHtml += '<div class="form-group">';
                        dynamicHtml += '<label for="RequestType" name="datacodeName" class="control-label mb-1">'+JSON.parse(array[i].objdata).data.dataSetText+'</label>';
                        dynamicHtml += '<input id="Datavalue_'+JSON.parse(array[i].objdata).data.dataSetText+'" name="RequestType"  class="form-control cc-exp" value="" data-val="true" data-val-required="Please enter the card expiration" data-val-cc-exp="Please enter a valid month and year" autocomplete="cc-exp">';
                        dynamicHtml += '<span class="help-block" data-valmsg-for="RequestType" data-valmsg-replace="true"></span>';
                        dynamicHtml += '</div>';
                        dynamicHtml += '</div>';
                    }
                }

                document.getElementById('dataKeyBalueField').innerHTML=dynamicHtml;
                        
            }.bind(this),function(error){
                alertPopUp('error', "<%=__('Error Occurred')%>");
                console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요

            })
            
            // try {
            // 	this.readTextFile(fullDir, function(text){
            // 		var data = JSON.parse(text);
            // 		imageData = data;
            // 		this.g_DataKeyCountEachTag = imageData.length;
            // 		this._imageData = imageData;
            // 	}.bind(this));

            // 	//imageData = require('fs').readFileSync(fullDir, 'utf8');
                
            // } catch (e) {
            // 	throw new Error("Error " + e);
            // };
            
                       
        }.bind(this),function(error){
            alertPopUp('error', "<%=__('Error Occurred')%>");
            console.log("ERROR:"+error.toString()+":");           //에러가 발생했습니다. 관리자에게 연락하세요

        });
            
    }

    const eventListener = () =>{
        document.getElementById('formName').addEventListener('change',function(e){
            setServerIp();
            formNameChnage();
        }.bind(this));
    
		document.getElementById('formgroupName').addEventListener('change',function(e){
			setServerIp();
			formgroupChnage();
		}.bind(this));


        document.getElementById('loadformbtn').addEventListener('click',function(e){
            setServerIp();
            document.getElementById('loadformbtn').value=1;
            getSelectBoxInfo(); 
            getList();
        }.bind(this));

        document.getElementById('tagPublishBtn').addEventListener('click',function(e){

            document.getElementById('canvasid').innerHTML = 
            '<div style="vertical-align: middle; border: 0px; ">'+
            // '<canvas id="combinedcanvas" style="border: 1px solid black;  "></canvas>'+
            // '<canvas id="canvas" style="border: 1px solid black;  "></canvas>'+
            // '<canvas id="redcanvas" style="border: 1px solid black;  "></canvas>'+
            '</div>';

            document.getElementById('cardBody').scrollIntoView()
            setServerIp();
            g_eventSelect = e;
            if(document.getElementById('loadformbtn').value==2){
                kanbanpublsih('preview');
            }
            else{
                swal('Please Load the Form', {
                    icon : "error",
                    buttons: {
                        confirm: {
                            className : 'btn btn-danger'
                        }
                    },
                });    
                //alert('Please Load the Form')
            }


        }.bind(this));


        document.getElementById('tagSaveBtn').addEventListener('click',function(e){

            document.getElementById('canvasid').innerHTML = 
            '<div style="vertical-align: middle; border: 0px; ">'+
            // '<canvas id="combinedcanvas" style="border: 1px solid black;  "></canvas>'+
            // '<canvas id="canvas" style="border: 1px solid black;  "></canvas>'+
            // '<canvas id="redcanvas" style="border: 1px solid black;  "></canvas>'+
            '</div>';

            document.getElementById('cardBody').scrollIntoView()
            setServerIp();
            g_eventSelect = e;
            if(document.getElementById('loadformbtn').value==2){
                kanbanpublsih('preview');
            }
            else{
                swal('Please Load the Form', {
                    icon : "error",
                    buttons: {
                        confirm: {
                            className : 'btn btn-danger'
                        }
                    },
                });    
            }


        }.bind(this));

        document.getElementById('tagSaveBtn2').addEventListener('click',function(e){

            document.getElementById('canvasid').innerHTML = 
            '<div style="vertical-align: middle; border: 0px; ">'+
            // '<canvas id="combinedcanvas" style="border: 1px solid black;  "></canvas>'+
            // '<canvas id="canvas" style="border: 1px solid black;  "></canvas>'+
            // '<canvas id="redcanvas" style="border: 1px solid black;  "></canvas>'+
            '</div>';

            document.getElementById('cardBody').scrollIntoView()
            setServerIp();
            g_eventSelect = e;
            if(document.getElementById('loadformbtn').value==2){
                kanbanpublsih('normal');
            }
            else{
                swal('Please Load the Form', {
                    icon : "error",
                    buttons: {
                        confirm: {
                            className : 'btn btn-danger'
                        }
                    },
                });    
            }


        }.bind(this));
    }
    eventListener();
})