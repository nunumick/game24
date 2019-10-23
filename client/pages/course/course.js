// client/pages/course/course.js
const qcloud = require('../../vendor/wafer2-client-sdk/index')
const config = require('../../config')
const constants = require('../../utils/constants')
const Sounds = require('../../utils/sound.js');
const { tapSound } = Sounds;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    course: 100,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    const { id, length = 100 } = this.options;
    const myapp = getApp();

    wx.setNavigationBarTitle({
      title: constants.TF_COURSES[id-1]
    })

    this.setData({
      courseLens: length >> 0,
      courseId: id >> 0
    })

    myapp.getCourse(id);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次显示页面都会更新最新的成绩
   */
  onShow: function () {
    this.getScore();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  getScore: function() {
    const session = qcloud.Session.get();

    if (!session) {
      wx.redirectTo({
        url: `/pages/index/index`
      })
      return;
    }

    const { userinfo:{ openId }} = session;
    const { id, length = 100 } = this.options;
    //console.log(id,length);
    const that = this;

    qcloud.request({
      url: config.service.scoreUrl,
      login: false,
      method: 'GET',
      data: {
        userid: openId,
        course: id,
        t: new Date().getTime()
      },
      success(result) {
        const { data: { levels } } = result.data;
        const totalScore = levels.length ? levels.map((level) => {
          return level.score;
        }).reduce((x, y) => {
          return x + y;
        }, 0) : 0;
        that.setData({
          score: levels
        })
        wx.setNavigationBarTitle({
          title: `${constants.TF_COURSES[id-1]}（${totalScore}/${length*3}）`
        })
      },
      fail(error) {
        //console.log('request fail', error);
      }
    })

  },

  /**
   * 进入题
   * @param {event} e event
   */
  goto(e) {
    const { currentTarget: { id: gameId } } = e;
    const { id } = this.options;
    const { score } = this.data;
    wx.navigateTo({
      url: `../main/main?id=${id}&game=${gameId}&top=${score.length}`
    })
  },
  tap() {
    tapSound.stop();
    tapSound.play();
  }
})