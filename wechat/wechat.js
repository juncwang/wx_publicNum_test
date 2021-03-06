/**
 * 获取 access_token
 *      微信调用接口全局唯一凭据
 *
 *      特点:
 *          1. 唯一的
 *          2. 有效期为 2 小时, 提前 5 分钟请求
 *          3. 接口权限 每天 2000 次
 *
 *      请求地址:
 *          https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
 *      请求方式:
 *          GET
 *
 *      设计思路:
 *          1. 首次本地没有, 发送请求获取 access_token, 保持下来(本地文件)
 *          2. 第二次或以后:
 *              - 先去本地读取文件, 判断它是否过期
 *                  - 过期了
 *                      - 重新请求获取 access_token, 保存下来覆盖之前的文件(保证文件是唯一的)
 *                  - 没有过期
 *                      - 直接使用
 *
 *      整理思路:
 *          读取本地文件 (readAccessToken)
 *              - 本地有文件
 *                  - 判断它是否过期 (isValidAccessToken)
 *                      - 过期了
 *                          - 重新请求获取 access_token (getAccessToken), 保存下来覆盖之前的文件(保证文件是唯一的) (saveAccessToken)
 *                      - 没有过期
 *                          - 直接使用
 *              - 本地没有文件
 *                  - 发送请求获取 access_token (getAccessToken), 保存下来(本地文件) (saveAccessToken), 直接使用
 */

// 引入 request-promise-native 模块
const rp = require("request-promise-native");
// 引入 config 模块
const { appID, appsecret } = require("../config");
// 引入 api 模块
const api = require('../utils/api')
// 引入 tool 模块
const { writeFileAsync, readFileAsync } = require('../utils/tool')
// 引入 menu 模块
const menu = require('./menu')

// 定义类, 获取 access_token
class Wechat {
    constructor() { }

    /**
     * 用来获取 access_token
     *
     */
    getAccessToken() {
        // 定义请求地址
        const url = `${api.accessToken}appid=${appID}&secret=${appsecret}`;

        return new Promise((resolve, reject) => {
            // 发送请求
            /**
             * request
             * request-promise-native 返回值是一个 promise 对象
             */
            rp({
                method: "GET",
                url: url,
                json: true
            })
                .then(res => {
                    // console.log(res);
                    /**
                     * {
                     *      access_token: '26_LARnH0vnAc40M_MwJinICTsCiXw2V92TI4m8RLtagvOxouhS6N3GyZ-ZvxwBJ8jA8AkTfuNqnhStNzQQpWG6STolVibIOJbq93Q7oxj8aN2Ckn6uGtH4sBy1wDMOlzA6Gs9ne_xmkTm6GndySXAjADAXCF',
                     *      expires_in: 7200
                     * }
                     */
                    // 设置 access_token 的过期时间
                    res.expires_in = Date.now() + (res.expires_in - 300) * 1000;
                    resolve(res);
                })
                .catch(err => {
                    //   console.log(err);
                    reject("getAccessToken is error : " + err);
                });
        });
    }

    /**
     * 用来保存 access_token
     * @param accessToken 要保存的凭据
     */
    saveAccessToken(accessToken) {
        return writeFileAsync(accessToken, 'accessToken.txt')
    }

    /**
     * 用来读取 access_token
     */
    readAccessToken() {
        return readFileAsync('accessToken.txt')
    }

    /**
     * 用来检测 access_token 是否有效
     * @param accessToken
     */
    isValidAccessToken(data) {
        // 检测传入的参数是否是有效的
        if (!data && !data.access_token && !data.expires_in) {
            // 代表 access_token 无效
            return false;
        }

        // 检测 access_token 是否在有效期内
        // if (data.expires_in < Date.now()) {
        //   // 过期了
        //   return false;
        // } else {
        //   // 没有过期
        //   return true;
        // }
        return data.expires_in > Date.now();
    }

    /**
     * 用来获取没有过期的 access_token
     * @return {Promise<any>}
     */
    fetchAccessToken() {
        // 优化
        if (this.access_token && this.expires_in && this.isValidAccessToken(this)) {
            // 说明之前保存过 access_token, 并且它是有效的, 直接使用
            return Promise.resolve({
                access_token: this.access_token,
                expires_in: this.expires_in
            });
        }

        return this.readAccessToken()
            .then(async res => {
                // 本地有文件
                // 判断它是否过期
                if (this.isValidAccessToken(res)) {
                    // 有效的
                    // resolve(res);
                    return Promise.resolve(res);
                } else {
                    // 过期了
                    // 发送请求获取 access_token(getAccessToken)
                    const res = await this.getAccessToken();
                    // 保存下来(本地文件) (saveAccessToken)
                    await this.saveAccessToken(res);
                    // 将请求回来的 access_token 返回出去
                    // resolve(res);
                    return Promise.resolve(res);
                }
            })
            .catch(async err => {
                // 本地没有文件
                // 发送请求获取 access_token (getAccessToken)
                const res = await this.getAccessToken();
                // 保存下来(本地文件) (saveAccessToken)
                await this.saveAccessToken(res);
                // 将请求回来的 access_token 返回出去
                // resolve(res);
                return Promise.resolve(res);
            })
            .then(res => {
                // 将 access_token 挂载到 this 上
                this.access_token = res.access_token;
                this.expires_in = res.expires_in;
                // 返回 res 包装了一层 promise 对象 (此对象为成功的状态)
                // 是 this.readAccessToken() 最终的返回值
                return Promise.resolve(res);
            });
    }

        /**
     * 用来获取 jsapi_ticket
     *
     */
    getJsapiTicket() {
        return new Promise(async (resolve, reject) => {
            const data = await this.fetchAccessToken()
            const url = `${api.jsapiTicket}access_token=${data.access_token}`
            rp({
                method: "GET",
                url: url,
                json: true
            })
                .then(res => {
                    resolve({
                        jsapi_ticket: res.ticket,
                        expires_in: Date.now() + (res.expires_in - 300) * 1000
                    });
                })
                .catch(err => {
                    reject("getJsapiTicket is error : " + err)
                })
        })
    }

    /**
     * 用来保存 jsapi_ticket
     * @param jsapiTicket 要保存的凭据
     */
    saveJsapiTicket(jsapiTicket) {
        return writeFileAsync(jsapiTicket, 'jsapiTicket.txt')
    }

    /**
     * 用来读取 jsapi_ticket
     */
    readJsapiTicket() {
        return readFileAsync('jsapiTicket.txt')
    }

    /**
     * 用来检测 jsapi_ticket 是否有效
     * @param jsapiTicket
     */
    isValidJsapiTicket(data) {
        if (!data && !data.jsapi_ticket && !data.ticket_expires_in) {
            return false;
        }
        return data.expires_in > Date.now();
    }

    /**
     * 用来获取没有过期的 jsapi_ticket
     * @return {Promise<any>}
     */
    fetchJsapiTicket() {
        if (this.jsapi_ticket && this.ticket_expires_in && this.isValidJsapiTicket(this)) {
            return Promise.resolve({
                jsapi_ticket: this.jsapi_ticket,
                expires_in: this.ticket_expires_in
            });
        }

        return this.readJsapiTicket()
            .then(async res => {
                if (this.isValidJsapiTicket(res)) {
                    return Promise.resolve(res);
                } else {
                    const res = await this.getJsapiTicket();
                    await this.saveJsapiTicket(res);
                    return Promise.resolve(res);
                }
            })
            .catch(async err => {
                const res = await this.getJsapiTicket();
                await this.saveJsapiTicket(res);
                return Promise.resolve(res);
            })
            .then(res => {
                this.jsapi_ticket = res.jsapi_ticket;
                this.ticket_expires_in = res.expires_in;
                return Promise.resolve(res);
            });
    }

    /**
     * 用来创建自定义菜单
     * @param menu 菜单配置对象
     * @return {Promise<any>}
     */
    createMenu(menu) {
        return new Promise(async (resolve, reject) => {
            try {
                // 获取 access_token
                const data = await this.fetchAccessToken()
                // 定义请求地址
                const url = `${api.menu.create}access_token=${data.access_token}`
                // 发送请求
                const result = await rp({
                    method: 'POST',
                    url: url,
                    json: true,
                    body: menu
                })
                resolve(result)
            } catch (e) {
                reject('createMenu is error : ' + e)
            }
        })
    }

    /**
     * 用来删除自定义菜单
     * @return {Promise<any>}
     */
    delectMenu() {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await this.fetchAccessToken()
                const url = `${api.menu.delete}access_token=${data.access_token}`
                const result = await rp({
                    method: 'GET',
                    url: url,
                    json: true
                })
                resolve(result)
            } catch (e) {
                reject('delectMenu is error : ' + e)
            }
        })
    }
}


// (async () => {
//     // 模拟测试
//     const w = new Wechat()

//     // // 删除之前定义的自定义菜单
//     // let result = await w.delectMenu()
//     // console.log(result)
//     // // 创建新的自定义菜单
//     // result = await w.createMenu(menu)
//     // console.log(result)

//     const data = await w.fetchJsapiTicket()
//     console.log(data)
// })()

module.exports = Wechat


