//app.js
var qcloud = require('./vendor/wafer2-client-sdk/index')
var config = require('./config')
var util = require('./utils/util');

App({
    onLaunch: function() {
        qcloud.setLoginUrl(config.service.loginUrl);
        this.globalData = {};
        const that = this;
        wx.setInnerAudioOption({
            mixWithOther: true,
            obeyMuteSwitch: true
        })
        wx.onNetworkStatusChange((res)=>{
            if(!res.isConnected){
                wx.hideToast();
                wx.showToast({
                    title: '当前网络不稳，请检查你的网络设置',
                    icon: 'none'
                })
            }else{
                that.getCourse(1);
            }
        });
    },
    getCourse: function (id = 1) {
        id = id >> 0;
        const that = this;
        const courseId = `course${id}`;

        if (typeof this.globalData[courseId] === 'undefined') {
            wx.hideToast();
            wx.showToast({
                icon: 'loading'
            })
            qcloud.request({
                url: config.service.courseUrl,
                login: false,
                method: 'GET',
                data: {
                    course: id,
                },
                success(result) {
                    wx.hideToast();
                    const { data: { course = [] } } = result.data;
                    that.globalData[courseId] = course.map((c) => {
                        return c.puzzle.split(',').map((n) => {
                            return parseInt(n);
                        });
                    })
                },
                fail(error) {
                    wx.hideToast();
                    wx.showToast({
                        title: '加载关卡失败，请稍后再试吧！',
                        icon: 'none'
                    })
                    //console.log('request fail', error);
                }
            })
        }
    }
})