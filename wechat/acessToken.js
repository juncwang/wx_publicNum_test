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

// 引入 fs 模块
const { writeFile, readFile } = require("fs");

// 引入 request-promise-native 模块
const rp = require("request-promise-native");

// 引入 config 模块
const { appID, appsecret } = require("../config");

// 定义类, 获取 access_token
class Wechat {
    constructor() { }

    /**
     * 用来获取 access_token
     *
     */
    getAccessToken() {
        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appID}&secret=${appsecret}`;
        // 发送请求
        /**
         * request
         * request-promise-native 返回值是一个 promise 对象
         */
        return new Promise((resolve, reject) => {
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
        // 将对象转换成 json 字符串
        accessToken = JSON.stringify(accessToken);
        // 将 access_token 保存一个文件
        return new Promise((resolve, reject) => {
            writeFile("./accessToken.txt", accessToken, err => {
                if (!err) {
                    console.log("文件保存成功");
                    resolve();
                } else {
                    reject("saveAccessToken is error : " + err);
                }
            });
        });
    }

    /**
     * 用来读取 access_token
     */
    readAccessToken() {
        return new Promise((resolve, reject) => {
            readFile("./accessToken.txt", (err, data) => {
                if (!err) {
                    console.log("文件读取成功");
                    data = JSON.parse(data);
                    resolve(data);
                } else {
                    reject("readAccessToken is error : " + err);
                }
            });
        });
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
}

// 模拟测试
// const w = new Wechat();

// 模拟获取 access_token
// w.getAccessToken();

// 读取本地文件 (readAccessToken)
// new Promise((resolve, reject) => {
//   w.readAccessToken()
//     .then(res => {
//       // 本地有文件
//       // 判断它是否过期
//       if (w.isValidAccessToken(res)) {
//         // 有效的
//         resolve(res);
//       } else {
//         // 过期了
//         // 发送请求获取 access_token(getAccessToken)
//         w.getAccessToken()
//           .then(res => {
//             // 保存下来(本地文件) (saveAccessToken)
//             w.saveAccessToken(res)
//               .then(() => {
//                 resolve(res);
//               })
//               .catch(err => {
//                 reject(err);
//               });
//           })
//           .catch(err => {
//             reject(err);
//           });
//       }
//     })
//     .catch(err => {
//       // 本地没有文件
//       // 发送请求获取 access_token (getAccessToken)
//       w.getAccessToken()
//         .then(res => {
//           // 保存下来(本地文件) (saveAccessToken)
//           w.saveAccessToken(res)
//             .then(() => {
//               resolve(res);
//             })
//             .catch(err => {
//               reject(err);
//             });
//         })
//         .catch(err => {
//           reject(err);
//         });
//     });
// })
//   .then(res => {
//     // console.log(res)
//     resolve(res);
//   })
//   .catch(err => {
//     // console.error(err)
//     reject(err);
//   });
