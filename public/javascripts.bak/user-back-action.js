const fs = require('fs');
const fetch = require("node-fetch");
const licenseKey = require('license-key-gen');

/*
if ( global.config.runningMode == "debug" ){
    console.log("user-back-action.js");
}
*/

const getProfileImg = (param, res) => {
    fs.readFile('public/img/' + param['id'] + '_profile.png', {encoding : 'base64'}, function(err, data){
        if(err === null){
            let getData = {'data' : 'data:image/png;base64,' + data};
            res.send(getData);
        }
        else{
            console.log(err);
        }
    });
}


const setProfileImg = (param, res) => {
    let data = param['newImg'].replace('data:image/png;base64,', '');
    let file = 'public/img/' + param['id'] + '_profile.png';
    fs.writeFile(file, data, {encoding: 'base64'}, function(err){
        if(err === null){
            res.send(param);
        }
        else{
            console.log(err);
        }
    });
}

// license register
const licenseRegister = (param, res) => {
    let userInfo = {mac: global.config.macAddress}
    let licenseData = {info:userInfo, prodCode:"tago", appVersion:"1.0", osType:'Windows'}
    let license = "";

    try{
        license = licenseKey.createLicense(licenseData)
       
        console.log('license:'+ license +':');
        
    }catch(err){
        console.log(err);
    }


    
    fetch(global.config.apiServerUrl +"/license/get-license", {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "mac_address" : global.config.macAddress
        })
    })
    .then(response => response.json())
    .then(response => {
        if(response.status != "OK"){
            fetch("" + global.config.apiServerUrl + "/license/insert-license", {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "license_key" : license.license,
                "mac_address" : global.config.macAddress,
                "active_yn" : "N",
                })
            })
            .then(response => response.json())
            .then(response => {
                res.send(response);
            })
        }
        else{
            res.send(response);
        }
    })
    
}

const backend = {
    setProfileImg : (param, res) => {
        setProfileImg(param, res);
    },
    getProfileImg : (param, res) => {
        getProfileImg(param, res);
    },
    licenseRegister : (param, res) => {
        licenseRegister(param, res);
    }
}

module.exports = backend;
