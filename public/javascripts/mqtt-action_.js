let mqttclient = undefined;
let parentClass = undefined;
let reconnectFlag = true;

<% if ( global.config.runningMode == "debug" ){ %>
    console.log("mqtt-action.js");
<%}%>
<% if ( global.config.javascriptMode == "debug" ){ %>
    debugger;
<% }%>


const setReconnectFlag = (flag) => {
    reconnectFlag = flag;
}
let mqttMessage = (message) => {
    if (message.retained == true) {
        return;
    }
    parentClass.mqttMessage(message.destinationName, message.payloadString)

}
const unsubTopic = (topic) => {
  mqttclient.unsubscribe(topic);
    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("unsub : "+topic);
    <% }%>
  
}
const disconnect = () => {
  mqttclient.disconnect();
}
const setParent = (parent) => {
    parentClass = parent;
}
const connect = (callback) => {

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("mqtt connecting start!! - " + new Date());
    <% }%>

    

    // if(this.isConnectStarted)return;
    let ranMath = Math.random(10);
    mqttclient = new Paho.MQTT.Client('<%=global.config.mqttIpAddress%>', 9001, "1"+ranMath)
    let connectOptions = {

        onSuccess: function () {
            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("================= MQTT Connection Success =================");
            <% }%>

            
            
            if(callback!=undefined){
                callback();

            }
        },
        useSSL: false,
        cleanSession: true,
        timeout: 0,
        mqttVersion: 4,
        // reconnect:true,
        keepAliveInterval: 600,
        onFailure: function (msg) {
            <% if ( global.config.runningMode == "debug" ){ %>
                console.log("================= MQTT Connection Fail =================");
            <% }%>

            
        },

    };
    mqttclient.connect(connectOptions);

    mqttclient.onMessageArrived = mqttMessage;

    mqttclient.onConnectionLost = function (responseObject) {

        <% if ( global.config.runningMode == "debug" ){ %>
            console.log("=================MQTT closed=================");
            console.log(responseObject)
            console.log("errocode : " + responseObject.errorCode)
            console.log("errorMessage : " + responseObject.errorMessage);
            console.log("connectOptions : " + connectOptions);
            console.log(new Date());
            console.log("=================MQTT closed=================");
            console.log(reconnectFlag)
        <% }%>
       
        if(reconnectFlag==true){
            parentClass.mqttConnect();
        }
    }.bind(this)

    
};

const subscribeTopic = (topic) => {
    mqttclient.subscribe(topic);

    <% if ( global.config.runningMode == "debug" ){ %>
        console.log("sub success : "+topic);
    <% }%>

    
}

// const messageDraw = (topic,value) => {
//     console.log("topic : " + topic);
//     console.log("value : " + value);
// }

export {mqttclient, connect, subscribeTopic,setParent,unsubTopic, disconnect,setReconnectFlag};
