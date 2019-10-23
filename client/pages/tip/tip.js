// client/pages/tip/tip.js
var TF = require('../../utils/tf.js');
const tf = new TF();

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { puzzle = "" } = options;
    const _puzzle = puzzle.split(',').map(x=>x>>0);
    const expressions = tf.getExpression(_puzzle);

    /**
     * 按难度排序
     * 有除法难度增加
     * 同等难度下，有括号难度增加
     */
    expressions.sort((x, y) => {
      const x1 = x.match(/÷/g);
      const x2 = x.match(/\(/g);
      const y1 = y.match(/÷/g);
      const y2 = y.match(/\(/g);

      /**
       * x有除法，y没有除法，则 x > y
       * x有除法没有括号，y有除法，则 x < y
       * x有除法有括号，则不管y有什么，x > y
       * x有括号，y有除法，则 x < y
       * x没有除法有括号，y没有括号也没有除法，则 x > y
       */
      if((x1 && !y1) || (x2 && x1) || (x2 && !y2 && !y1)){
        return 1;
      }else if((x1 && y1) || (x2 && y1)){
        return -1;
      }else{
        return -1;
      }

    })

    /**
     * 按难度排序
     * 取第一步，做提示
    const firsts = expressions.map((expression)=>{
      const first = expression.match(/\(.*\)|\d+(\+|-|×|÷)\d+/);
      return first;
    })

    console.log(firsts);
    */

    wx.setNavigationBarTitle({
      title: `${puzzle}的答案`,
    })
    wx.showToast({
      icon: 'loading'
    })
    this.setData({
      expressions,
    })
    wx.hideToast();
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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
})