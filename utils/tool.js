/**
 * 工具函数包
 */

// 引入 fs 模块
const { writeFile, readFile } = require("fs");
// 引入 path 模块
const { resolve } = require('path')
// 引入 xml2js, 将 xml 数据转化成 js 对象
const { parseString } = require('xml2js')

module.exports = {
    // 获取 req 的 POST 请求数据
    getUserDataAsync(req) {
        return new Promise((resolve, reject) => {
            let xmlData = ''
            req
                .on('data', data => {
                    // 当流失数据传递过来时, 会触发当前事件, 会将数据注入到回调函数中
                    // console.log(data)
                    // 读取的数据是 buffer, 需要将其转化成字符串
                    xmlData += data.toString()
                })
                .on('end', () => {
                    // 当数据接受完毕时触发
                    resolve(xmlData)
                })
        })
    },
    // 将 xml 字符串转成 js 对象
    parseXMLAsync(xmlData) {
        return new Promise((resolve, reject) => {
            parseString(xmlData, { trim: true }, (err, data) => {
                if (!err) {
                    resolve(data)
                } else {
                    reject('parseXMLAsync is error : ' + err)
                }
            })
        })
    },
    // 提取 js 对象
    formatMessage(jsData) {
        let message = {}
        // 获取 xml 对象
        jsData = jsData.xml
        // console.log(jsData)
        // 判断数据是否是一个对象
        if (typeof jsData === 'object') {
            // 遍历对象
            for (let key in jsData) {
                // 获取属性值
                let value = jsData[key]
                // console.log(value)
                // 过滤掉空的数据
                if (Array.isArray(value) && value.length > 0) {
                    // 将合法的数据复制到 message 对象上
                    message[key] = value[0]
                    // console.log(message[key])
                }
            }
        }
        return message
    },
    // 同步保存文件
    writeFileAsync(data, fileName) {
        const filePath = resolve(__dirname, fileName)
        data = JSON.stringify(data);
        return new Promise((resolve, reject) => {
            writeFile(filePath, data, err => {
                if (!err) {
                    console.log(fileName + "文件保存成功");
                    resolve();
                } else {
                    reject("writeFileAsync is error : " + err);
                }
            });
        });
    },
    // 同步读取文件
    readFileAsync(fileName) {
        const filePath = resolve(__dirname, fileName)
        return new Promise((resolve, reject) => {
            readFile(filePath, (err, data) => {
                if (!err) {
                    console.log(fileName + "文件读取成功");
                    data = JSON.parse(data);
                    resolve(data);
                } else {
                    reject("readJsapiTicket is error : " + err);
                }
            });
        });
    }
}