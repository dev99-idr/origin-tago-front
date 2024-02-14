let mqttclient = undefined;
let parentClass = undefined;
let reconnectFlag = true;

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
  console.log("unsub : "+topic);
}
const disconnect = () => {
  mqttclient.disconnect();
}
const setParent = (parent) => {
    parentClass = parent;
}
const connect = (callback) => {
    console.log("mqtt connecting start!! - " + new Date());

    // if(this.isConnectStarted)return;
    mqttclient = new Paho.MQTT.Client('1.214.18.246', 9001, "1"+Math.random(10))
    let connectOptions = {

        onSuccess: function () {
            console.log("================= MQTT Connection Success =================");
            
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
            console.log("================= MQTT Connection Fail =================");
        },

    };
    mqttclient.connect(connectOptions);

    mqttclient.onMessageArrived = mqttMessage;

    mqttclient.onConnectionLost = function (responseObject) {
        console.log("=================MQTT closed=================");
        console.log(responseObject)
        console.log("errocode : " + responseObject.errorCode)
        console.log("errorMessage : " + responseObject.errorMessage);
        console.log("connectOptions : " + connectOptions);
        console.log(new Date());
        console.log("=================MQTT closed=================");
        console.log(reconnectFlag)
        if(reconnectFlag==true){
            parentClass.mqttConnect();
        }
    }.bind(this)

    
};

const subscribeTopic = (topic) => {
    mqttclient.subscribe(topic);
    console.log("sub success : "+topic);
}

// const messageDraw = (topic,value) => {
//     console.log("topic : " + topic);
//     console.log("value : " + value);
// }

export {mqttclient, connect, subscribeTopic,setParent,unsubTopic, disconnect,setReconnectFlag};
