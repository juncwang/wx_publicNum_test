// 引入 express 模块
const express = require("express");
// 引入 auth 模块
const auth = require("./wechat/auth");
// 创建 app 应用对象
const app = express();

// 配置模板资源目录
app.set('views', './views')
// 配置模板引擎
app.set('view engine', 'ejs')

// 页面路由
app.get('/search', (req, res) => {
    // 渲染页面, 将渲染好的页面返回给用户
    res.render('search')
})

// 接受处理所有消息
app.use(auth());

// 监听端口号
app.listen(3000, () => {
    console.log("Server Runing On Port 3000");
});
