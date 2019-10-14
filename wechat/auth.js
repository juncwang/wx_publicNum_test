/**
 * 验证服务器有效性的模块
 */

/**
 * 1. 微信服务器知道开发者服务器是哪个
 *      - 测试号管理页面上填写 url 开发者服务器地址
 *          - 使用 nrgrok 内网穿透 将本地端口号开启的服务映射到外网跨域访问的一个网址
 *          - ngrok http 3000
 * 2. 开发者服务器 - 验证消息是否来自于微信服务器
 *      - 目的: 计算得出 signature 微信加密签名, 和微信传递过来的 signature 进行对比, 如果一样,
 *              说明消息来自于微信服务器, 如果不一样, 说明不是微信服务器发送的消息
 *              1. 将参与微信加密签名的三个参数(timestamp, nonce, token), 组合在一起, 按照字典序排序
 *              2. 将数组里所有参数拼接成一个字符串, 进行 sha1 加密
 *              3. 加密完成就生成一个 signature, 和微信发送过来的进行对比
 *                  - 如果一样, 说明消息来自于微信服务器, 返回 echostr 给微信服务器
 *                  - 如果不一样, 说明不是微信服务器发送的消息, 返回 error
 */

// 引入 sha1 模块
const sha1 = require("sha1");
// 引入 config 模块
const config = require("../config");
// 引入 tool 模块
const { getUserDataAsync, parseXMLAsync, formatMessage } = require("../utils/tool");

module.exports = () => {
    return async (req, res, next) => {
        /**
         * req.query
         * {
         *      signature: 'af7559266ceccc9f72c094cf956ac3f30ff10b3f', // 微信的加密签名
         *      echostr: '7968985672938160023',     // 微信的随机字符串
         *      timestamp: '1571012359',            // 微信的发送请求时间戳
         *      nonce: '226149479'                  // 微信的随机数字
         * }
         */


        const { signature, echostr, timestamp, nonce } = req.query;
        const { token } = config;

        // 完整版微信登录验证程序
        // //  1. 将参与微信加密签名的三个参数(timestamp, nonce, token), 组合在一起, 按照字典序排序
        // const arr = [timestamp, nonce, token];
        // const arrSort = arr.sort();
        // console.log(arrSort);
        // // 2. 将数组里所有参数拼接成一个字符串, 进行 sha1 加密
        // const str = arr.join("");
        // console.log(str);
        // const sha1Str = sha1(str);
        // console.log(sha1Str);
        // // 3. 加密完成就生成一个 signature, 和微信发送过来的进行对比
        // if (sha1Str === signature) {
        //     // 如果一样, 说明消息来自于微信服务器, 返回 echostr 给微信服务器
        //     res.send(echostr);
        // } else {
        //     // 如果不一样, 说明不是微信服务器发送的消息, 返回 error
        //     res.end("error");
        // }

        // 简单版微信登录验证程序
        const sha1Str = sha1([timestamp, nonce, token].sort().join(''))
        // if (sha1Str === signature){
        //     res.send(echostr)
        // }else {
        //     res.end('error')
        // }

        /**
         * 微信服务器会发送两种类型的消息给开发者服务器
         *      1. GET 请求
         *          - 验证服务器的有效性
         *      2. POST 请求
         *          - 微信服务器会将用户发送的数据以 POST 请求的方式转发到开发者服务器上
         */

        if (req.method === 'GET') {
            if (sha1Str === signature) {
                // 如果一样, 说明消息来自于微信服务器, 返回 echostr 给微信服务器
                res.send(echostr)
            } else {
                // 如果不一样, 说明不是微信服务器发送的消息, 返回 error
                res.end('error')
            }
        } else if (req.method === 'POST') {
            // 微信服务器会将用户发送的数据以 POST 请求的方式转发到开发者服务器上
            // 验证消息来自于微信服务器
            if (sha1Str !== signature) {
                // 如果不一样, 说明不是微信服务器发送的消息, 返回 error
                res.end('error')
            }

            // console.log(req.query)

            // 接受请求体重的数据, 流式数据
            const xmlData = await getUserDataAsync(req)
            // console.log(xmlData)
            // xmlData
            // <xml>
            //     <ToUserName><![CDATA[gh_6705c9bf3656]]></ToUserName>     // 开发者的 id
            //     <FromUserName><![CDATA[obceVv_Pl3djsLNPz-u8gS5tjksA]]></FromUserName>    // 用户 openid
            //     <CreateTime>1571034996</CreateTime>  // 发送的时间戳
            //     <MsgType><![CDATA[text]]></MsgType>  // 发送消息类型
            //     <Content><![CDATA[good luck]]></Content>     // 发送的内容
            //     <MsgId>22491814705232104</MsgId>     // 消息 id 微信服务器会默认保存 3 天用户发送的数据
            // </xml>

            // 将 xml 数据解析为 js 对象
            const jsData = await parseXMLAsync(xmlData)
            // console.log(jsData)
            const message = formatMessage(jsData)
            console.log(message)


            // 如果开发者服务器没有返回响应给微信服务器, 微信服务器会发送三次请求过来
            res.end('')
        } else {
            res.end('error')
        }
    };
};
