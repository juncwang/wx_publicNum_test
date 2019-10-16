// 引入 express 模块
const express = require("express");
// 引入 auth 模块
const auth = require("./wechat/auth");
// 创建 app 应用对象
const app = express();

// 引入 sha1 模块
const sha1 = require('sha1')
// 引入 config 模块
const { url } = require('./config')

// 引入 wechat 模块
const Wechat = require('./wechat/wechat')
// 创建实例对象
const wechatApi = new Wechat()

// 配置模板资源目录
app.set('views', './views')
// 配置模板引擎
app.set('view engine', 'ejs')

// 页面路由
app.get('/search', async (req, res) => {
    /**
     * 生成 js-sdk 使用的签名
     * 1. 组合参与签名的四个参数: jsapi_ticket(临时票据) noncestr(随机字符串) timestamp(时间戳) url(当前服务器地址)
     * 2. 将其进行字典序排序, 以 '&' 拼接在一起
     * 3. 进行 sha1 加密, 最后生成 signature
     */

    // 获取随机字符串
    const noncestr = Math.random().split('.')[1]
    // 获取时间戳
    const timestamp = Date.now()
    // 获取票据
    const { jsapi_ticket } = await wechatApi.fetchJsapiTicket()
    // 1. 组合参与签名的四个参数: jsapi_ticket(临时票据) noncestr(随机字符串) timestamp(时间戳) url(当前服务器地址)
    const arr = [
        `jsapi_ticket=${jsapi_ticket}`, 
        `noncestr=${noncestr}`, 
        `timestamp=${timestamp}`, 
        `url=${url}/search`
    ]
    // 2. 将其进行字典序排序, 以 '&' 拼接在一起
    const str = arr.sort().join('&')
    console.log(str)
    // 3. 进行 sha1 加密, 最后生成 signature
    const signature = sha1(str)

    // 渲染页面, 将渲染好的页面返回给用户
    res.render('search', {
        signature,
        noncestr,
        timestamp
    })

})

// 接受处理所有消息
app.use(auth());

// 监听端口号
app.listen(3000, () => {
    console.log("Server Runing On Port 3000");
});
