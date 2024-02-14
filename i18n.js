const i18n = require('i18n');

//옵션 설정
i18n.configure({
    //사용언어 설정 
    locales: ['en','ko'],

    //언어를 설정한 json 파일 생성위치 - 기본은 ./locales
    directory: __dirname + '/locales',

    //기본 사용언어 설정
    defaultLocale: 'en',

    register: global,

    //사용언어를 저장할 cookie 이름
    cookie: 'lang'
});

module.exports = (req, res, next) => {

    let {lang} = req.query;
    i18n.init(req, res);
    //lang = lang ? lang : 'ko';

    if ( lang != undefined ){        
        i18n.setLocale(req, lang) //
        res.cookie('lang', lang, { maxAge: global.cookieMaxAge , httpOnly: false }) //httpOnly는 false로 변경, html에서 cookie를 사용하기 위해
    }       
    
    return next();
};

