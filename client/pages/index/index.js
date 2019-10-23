//index.js
var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var util = require('../../utils/util.js')
var constants = require('../../utils/constants')
var Sounds = require('../../utils/sound.js');
const { tapSound } = Sounds;

/**
 * 每个等级的关卡数和等级名称配置
 */
const levels = [
    1362,
    100,
    100,
    100,
    28,
    20
]
const courses = constants.TF_COURSES.map((course, index)=>{
    return [course, levels[index]];
})
const myapp = getApp();

Page({
    data: {
        userInfo: {},       //用户信息
        courses             //游戏等级配置
    },

    onLoad() {
        this.loadSession();
    },

    /**
     * 更新成绩
     */
    onShow() {
        this.getAllScores();
    },

    // 用户登录
    bindGetUserInfo: function () {
        // 首次登录
        qcloud.login({
            success: res => {
                const { openId } = res;
                myapp.getCourse(1);
                this.getAllScores(openId);
                const { id, game, top, from } = this.options;
                //有入参，登录跳转
                if (id) {
                    wx.navigateTo({
                        url: `/pages/main/main?id=${id}&game=${game}&top=${top}&from=${from}`
                    })
                }
                //util.showSuccess('登录成功')
                this.setData({ userInfo: res, logged: true })
            },
            fail: err => {
                util.showModel('登录错误', err.message)
            }
        })
    },

    loadSession() {
        const { logged, levels } = this.data; 
        if (logged && levels) return;

        const session = qcloud.Session.get();

        if (session) {

            const { userinfo } = session;

            if( userinfo ) {
              myapp.getCourse(1);
              //this.getAllScores(userinfo.openId);
              this.setData({ userInfo: userinfo, logged: true });
              return;
            }

            // 第二次登录
            // 或者本地已经有登录态
            // 可使用本函数更新登录态
            qcloud.loginWithCode({
                success: res => {
                  myapp.getCourse(1);
                  //this.getAllScores(res.openId);
                  this.setData({ userInfo: res, logged: true });
                },
                fail: err => {
                    util.showModel('登录错误', err.message)
                }
            })
        }
    },
    /**
    * 用户点击右上角分享
    * 将首页分享出去
    */
    onShareAppMessage: function () {
        const path = `/pages/index/index`;
        const title = '推荐一款超好玩的游戏，我已经玩到停不下来啦！';
        return {
            title,
            path,
        }
    },

    /**
     * 获取所有等级关卡成绩
     */
    getAllScores(userid) {
        const that = this;
        const session = qcloud.Session.get()
        if(!session && !userid) return;

        const { userinfo: { openId } } = session;
        userid = userid || openId;

        if(!userid) return;

        qcloud.request({
                url: config.service.allScoreUrl,
                login: false,
                method: 'GET',
                data: {
                    userid,
                },
                success(result) {
                    const { data: { scores = [] } } = result.data;
                    const _scores = scores.map((levels, index) => {
                        const result = levels.length ? levels.map((data) => {
                            const { score, level } = data || {
                                level: 0,
                                score: 0
                            };
                            return index === 0 ? level : score;
                        }).reduce((x, y) => {
                            return x + y;
                        }, 0) : 0;
                        return result;
                    });

                    const _allScores = _scores.reduce((x,y)=>{
                        return x + y;
                    });

                    that.setData({
                        levels: scores,
                        scores: _scores,
                        totalScore: _allScores,
                    });
                },
                fail(error) {
                    //console.log('request fail', error);
                }

        })
    },
    tap: function(){
      tapSound.stop();
      tapSound.play();
    }
})
