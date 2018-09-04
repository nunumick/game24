const lists = [
    [1,2,3,4],
    [1,5,3,1],
    [1,7,10,3],
    [3,3,8,8]
];
let timer = null;

// client/pages/main/main.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    operators: ['plus','minus','multiply','divide'],
    pre: [],
    current: [1,7,10,3],
    next: [],
    history:[],
    x: [],
    y: [],
    numberSelected: [],
    operatorSelected: [],
    a: '',
    b: '',
    c: '',
    d: '',
    time: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
    var time = 10;
    timer = setInterval(()=>{
      time = time + 1;
      this.setData({
        time: (time/10).toFixed(1)
      });
    },100);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearInterval(timer);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    clearInterval(timer);
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  /**
   * 数字选择
   */
  numberSelect: function(event) {
    const value = event.currentTarget.dataset.numberValue;
    const index = event.currentTarget.dataset.numberIndex;
    const {x, y, operatorSelected,numberSelected} = this.data;
    const cur = numberSelected[0];

    if(index === cur){
      this.setData({
        numberSelected: []
      })
      this.removeOperator(value);
    }else{
      this.setData({
        numberSelected: [index, value]
      })
      if(x[0] === undefined){
        this.setData({
          x:[value],
          numberSelected: [index, value]
        })
      }else{
        if(operatorSelected[0]){
          this.setData({
            y:[value]
          })
          this.calculate();
        }else{
          this.setData({
            x:[value],
            numberSelected: [index, value]
          })
        }
      }
    }
  },

  removeOperator: function(v){
    const {x, y} = this.data;
    if(y[0] !== undefined){
      this.setData({
        y:[]
      })
    }else{
      this.setData({
        x:[]
      })
    }
  },

  addOperator: function(v) {
    const {x, y, operatorSelected} = this.data;
    if(x[0] === undefined){
      this.setData({
        x:[v]
      })
    }else{
      if(operatorSelected[0]){
        this.setData({
          y:[v]
        })
        this.calculate();
      }else{
        this.setData({
          x:[v]
        })
      }
    }
  },

  calculate: function() {
    const {x,y,operatorSelected,operators, current, numberSelected} = this.data;
    const [pl,mi,mu,di] = operators;
    let result = '';

    let v1 = x[0];
    let v2 = y[0];

    console.log(v1,v2,operatorSelected)

    //操作符运算
    switch (operatorSelected[0]) {
      case pl:
        result = v1 + v2;
        break;
      case mi:
        result = v1 - v2;
        break;
      case mu:
        result = v1 * v2;
        break;
      case di:
        result = `${v1}/${v2}`;
        break;
      default:
        break;
    }

    console.log(result);

    current[numberSelected[0]] = result;

    this.setData({
      current: current
    })

  },

   /**
    * 运算符选择
    */
  operatorSelect: function(event) {
    const operator = event.currentTarget.dataset.opr;
    const cur = this.data.operatorSelected[0];
    if(cur == operator){
      this.setData({
        operatorSelected: []
      })
    }else{
      this.setData({
        operatorSelected: [operator]
      })
    }
  },

  /**
   * 向前
   */
  toolPre: function() {
    console.log('pre');
  },

  /**
   * 向后
   */
  toolNext: function() {
    console.log('next');
    this.setData({
      current:[3,3,3,8]
    })
  },

  /**
   * undo
   */
  toolUndo: function() {
    console.log('undo');
  },

  /**
   * redo
   */
  toolRedo: function() {
    console.log('redo');
  },

  /**
   * 重置
   */
  toolReset: function() {
    console.log('reset');
  }
})
