
// thing type config
const thingType = {
    // [수집데이터명, 수집데이터 key, 단위, type, Pereiodic]
    // ex) ["시리얼 번호", "serial_no",  "-", "String", "Pereiodic"]
    // ex) ["시리얼 번호", "serial_no",  "-", "Int", "Apereiodic"]
    // ex) ["시리얼 번호", "serial_no",  "-", "Double", "Apereiodic"]
    "ZGW" :[
        ["<%=__('Connection Status')%>","conn_status","-","String","Periodic"],
        //["<%=__('S/W version')%>","sw_version","-","String","Aperiodic"],
        //["<%=__('Serial number')%>","serial_no","-","String","Aperiodic"],
        ["<%=__('Connect Server Ip')%>","server_address","-","String","Aperiodic"],
        ["<%=__('Connect Server port')%>","server_port","-","String","Aperiodic"],
        ["<%=__('Gateway Ip address')%>","ip_address","-","String","Aperiodic"],
        //["<%=__('Message transmission period')%>","wakeup_prd","-","String","Aperiodic"],
        ["<%=__('Reboot')%>","reboot","-","String","Aperiodic"],
        ["<%=__('Number of tags')%>","tag_cnt","-","String","Aperiodic"],
    ],
    "ZTAG":[
        ["<%=__('Connection Status')%>","conn_state","-","String","Periodic"],
        //["<%=__('S/W version')%>","sw_version","-","String","Aperiodic"],
        //["<%=__('Serial number')%>","serial_no","-","String","Aperiodic"],
        //["<%=__('Access Gateway ID')%>","gateway_id","-","String","Aperiodic"],
        //["<%=__('Tag Type')%>","tag_type","-","String","Aperiodic"],
        ["<%=__('Battery Gauge')%>","batt_gauge","-","String","Periodic"],
        //["<%=__('Message transmission period')%>","wakeup_prd","-","String","Aperiodic"],
        //["NFC UID","nfc_id","-","String","Aperiodic"],
        ["<%=__('E-Paper image Flag')%>","epd_update","-","String","Aperiodic"],
        ["<%=__('LED control')%>","led","-","String","Aperiodic"],
        ["<%=__('Temperature')%>","temperature","-","String","Periodic"],
        ["<%=__('Humidity')%>","humi","-","String","Periodic"],       

    ],
    "WTAG" :[
        ["<%=__('Connection Status')%>","conn_state","-","String","Aperiodic"],
        //["<%=__('S/W version')%>","sw_version","-","String","Aperiodic"],
        //["<%=__('Serial number')%>","serial_no","-","String","Aperiodic"],
        //["<%=__('About Connection WiFi')%>","ssid","-","String","Aperiodic"],
       //["<%=__('Tag Type')%>","tag_type","-","String","Aperiodic"],
        ["<%=__('Battery Gauge')%>","batt_gauge","-","String","Periodic"],
        //["<%=__('Message transmission period')%>","wakeup_prd","-","String","Aperiodic"],
        //["NFC UID","nfc_id","-","String","Aperiodic"],
        ["<%=__('E-Paper image Flag')%>","upd_img","-","String","Aperiodic"],
        ["<%=__('LED control')%>","led","-","String","Aperiodic"],
        ["<%=__('Reboot')%>","reboot","-","String","Aperiodic"],
        ["<%=__('Button event')%>","butt_evt","-","String","Aperiodic"],
        //["<%=__('Humidity')%>","curr_page","-","String","Periodic"],
    ],
    "BGW" :[
        ["<%=__('Connection Status')%>","conn_status","-","String","Periodic"],
        //["<%=__('S/W version')%>","sw_version","-","String","Aperiodic"],
        //["<%=__('Serial number')%>","serial_no","-","String","Aperiodic"],
        ["<%=__('Connect Server Ip')%>","server_address","-","String","Aperiodic"],
        ["<%=__('Connect Server port')%>","server_port","-","String","Aperiodic"],
        ["<%=__('Gateway Ip address')%>","ip_address","-","String","Aperiodic"],
        //["<%=__('Message transmission period')%>","wakeup_prd","-","String","Aperiodic"],
        ["<%=__('Reboot')%>","reboot","-","String","Aperiodic"],
        ["<%=__('Number of scanned BLE tags')%>","tag_cnt","-","String","Periodic"],

    ],
    //"NTAG":[
    //    
    //],
    "BTAG":[
        ["<%=__('Connection Status')%>","conn_state","-","String","Periodic"],
        ["<%=__('Battery Gauge')%>","batt_gauge","-","String","Periodic"],
    ],
}
