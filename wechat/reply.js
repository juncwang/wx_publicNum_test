/**
 * 处理用户发送的消息类型和内容, 确定返回不同的内容给用户
 */

module.exports = message => {

    let options = {
        toUserName: message.FromUserName,
        fromUserName: message.ToUserName,
        createTime: Date.now(),
        msgType: 'text'
    }

    console.log(message)

    let content = '您在说撒子, 老子听不懂'
    // 判断用户的消息是否是文本消息
    if (message.MsgType === 'text') {
        // 判断用户发送的消息内容具体是什么
        if (message.Content === '1') {
            content = '大吉大利, 今晚吃鸡'
        } else if (message.Content === '2') {
            content = '落地成盒'
        } else if (message.Content.match('爱')) {
            content = '我爱你~'
        }
    } else if (message.MsgType === 'image') {
        // 用户发送图片信息
        options.msgType = 'image'
        options.mediaId = message.MediaId
        console.log(message.PicUrl)
    } else if (message.MsgType === 'voice') {
        options.msgType = 'voice'
        options.mediaId = message.MediaId
        console.log(message.Recognition)
    } else if (message.MsgType === 'location') {
        content = `纬度: ${message.Location_X}\t经度: ${message.Location_Y}\t缩放大小: ${message.Scale}\t位置信息: ${message.Label}`
    } else if (message.MsgType === 'event') {
        if (message.Event === 'subscribe'){
            // 用户订阅事件
            content = '欢迎您的关注'
            if (message.EventKey) {
                content = '用户扫描带参数的二维码关注事件'
            }
        } else if (message.Event === 'unsubscribe') {
            // 用户取消订阅事件
            console.log('无情取关')
        } else if (message.Event === 'SCAN') {
            content = '用户已经关注过, 再扫描带参数的二维码关注事件'
        } else if (message.Event === 'LOCATION') {
            content = `纬度: ${message.Latitude}\t经度: ${message.Longitude}\t精度: ${message.Precision}`
        } else if (message.Event === 'CLICK') {
            content = `您点击了按钮: ${message.EventKey}`
        }
    }

    options.content = content
    console.log(options)

    return options
}