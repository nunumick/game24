var qcloud = require('../../vendor/wafer2-client-sdk/index')
var config = require('../../config')
var PuzzleGame = require('../../utils/puzzles');
var Sounds = require('../../utils/sound.js');
const {
  Game,
  Puzzles
} = PuzzleGame;
const {
  tapSound,
  gameStart,
  gameSuccess,
  gameError
} = Sounds;

/**
 * todo: 引入 Game 和 Puzzles 类管理数据流
 * 
console.log(Game);
console.log(Puzzles);

const g = new Game({
  puzzle:[1,2,3,4]
})

console.log(g);
g.start();

const myPuzzles = new Puzzles({
  puzzles: [
    [1, 2, 3, 4],
    [1, 5, 3, 1],
    [3, 3, 7, 8],
    [3, 3, 5, 5],
    [3, 3, 8, 8],
    [3, 3, 8, 9],
    [3, 4, 5, 6],
    [1, 9, 4, 5],
    [13, 13, 10, 5]
  ],
  position: 1
})
*/

/**
 * Puzzles 实例
 */
const puzzles = {
  list: [],
  position: 0,
  current: [],
  pre: null,
  next: null,
}

/**
 * Operators 实例
 */
const operators = {
  list: ['plus', 'minus', 'multiply', 'divide'],
  selected: [],
}

/**
 * Game 实例
 */
const game = {
  puzzle: [],
  display: [],
  history: [],
  step: 0,
  time: 0.0,
  calculate: {
    x: [],
    y: [],
    selected: []
  },
  status: 'pending'
}

//计时器
let timer = null;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    operators: operators.list, //操作运算符
    puzzles: puzzles.list,     //等级全量的关卡，影响关卡的切换
    history: [],               //操作的历史，影响redo，undo
    position: 0,               //当前关卡的位置，第一个index: 0
    step: 0,                   //操作历史的指针
    pre: null,                 //上一个关卡
    next: null,                //下一关关卡
    screen: [],                //界面显示的操作数
    current: [],               //当前操作数
    length: [],                //运算结果长度，影响显示字体大小
    x: [],                     //操作数x，[value, index]，参与计算
    y: [],                     //操作数y，[value, index]，参与计算
    numberSelected: [],        //选中的操作数，影响界面显示选中状态
    operatorSelected: [],      //运算符选择，影响运算符选中状态
    time: 0.0,                 //游戏时间
    solved: false,             //当前关卡是否已解，影响过渡效果
    fold: false,               //界面动画
    top: 0,                    //当前游戏中，已解锁的最大关卡id
    score: 0,                  //得分，得几星
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //console.log(options);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 初始化游戏关卡的puzzle
   * /pages/main/main?id={id}&game={game}&top={top}&from={from}
   * 1. 定位到某个游戏等级的某一关卡，当前用户正常游戏，有锁的关卡不能进入，只能进入已解锁的关卡，解题后下一关自动解锁
   * 2. 自动进入到已解锁的最高关卡（只传id），读取用户已解锁的最大关卡id
   * 3. 分享出去以及分享回来，任何人都可以打开分享的关卡，但关卡被锁定，不能往前往后切换关卡，只能游戏，不能保存成绩
   */
  onReady: function() {
    const that = this;
    const {
      id,            //游戏等级id，index: 1
      game = '',     //游戏关卡id，index: 0
      top = 0,       //可进入的最高关卡等级（解锁的游戏关卡），默认为0，代表一道题都没有
      from = ''      //进入来源，share: 分享，用于区分是否分享带来的，通过游戏进入，默认为空
    } = this.options;
    const myapp = getApp();
    let puzzles = myapp.globalData[`course${id}`];

    this.setData({
      share: from === 'share' ? true : false
    });

    /**
     * test
     *
    console.log(id, game, top, from)
    console.log('main');
    wx.showToast({
      //title : level.toString(),
      title : `${id}-${game}-${top}-${from}`,
    })
    */


    /**
     * 新用户分享直达页面
     * 判断是否能拿到session，没有就是新用户
     * 新用户需要到首页授权后才能继续游戏
     */
    const session = qcloud.Session.get();

    if (!session) {
      wx.redirectTo({
        url: `/pages/index/index?id=${id}&game=${game}&top=${top}&from=${from}`
      })
      return;
    }

    const {
      userinfo: {
        openId
      }
    } = session;


    /**
     * 传入关卡和难度
     * 能够直达某一个关卡
     * 这样可以支持分享打开
     */
    if (game && id) {

      /**
       * 分享直达的用户是没有puzzles数据的
       * 通过等级id和关卡id去server获取关卡信息
       * 通过设置position: 0和top: 0，锁定关卡
       */
      if (!puzzles || from === 'share') {
        qcloud.request({
          url: config.service.courseUrl,
          login: false,
          method: 'GET',
          data: {
            course: id >> 0,
            level: parseInt(game) + 1
          },
          success(result) {
            const {
              data: {
                course
              }
            } = result.data;
            const level = course.map((c) => {
              return c.puzzle.split(',').map((n) => {
                return parseInt(n);
              });
            })
            that.setData({
              puzzles: level,
              position: 0,
              top: 0
            })
            that.toolReset();
            that.startTimer();
          },
          fail(error) {
            //console.log(error);
          }
        })

      } else {
        that.setData({
          puzzles,
          position: game >> 0,
          top: top || game >> 0
        })
        that.toolReset();
        that.startTimer();
      }
    } else {
      /**
       * 只传入等级id时，自动进入最大已解锁关卡
       * 获取用户当前最高分作为top值
       */
      qcloud.request({
        url: config.service.scoreUrl,
        login: false,
        method: 'GET',
        data: {
          userid: openId,
          course: id,
          type: 'top',
          t: new Date().getTime()
        },
        success(result) {
          const {
            data: {
              top
            }
          } = result.data;
          that.setData({
            puzzles,
            position: Math.min(top, puzzles.length-1) || 0,
            top,
          })
          that.toolReset();
          that.startTimer();
        },
        fail(error) {
          that.setData({
            puzzles: [
              [1, 1, 1, 1]
            ],
            position: 0,
          })
          that.toolReset();
          that.startTimer();
          wx.hideToast();
          wx.showToast({
            title: '关卡载入异常彩蛋：(1+1+1+1)!=24',
            icon: 'none'
          })
          //console.log('request fail', error);
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    const { time } = this.data;
    if(time > 0){
      this.startTimer();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    this.stopTimer();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    this.stopTimer();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   * 将当前关卡分享出去
   * 如果是分享别人分享的关卡，直接转发
   * 如果是正常游戏分享，分享当前position
   */
  onShareAppMessage: function() {
    const {
      solved,
      position,
      puzzles
    } = this.data;
    const {
      id,
      game,
      from
    } = this.options;
    const _game = from === 'share' ? game : position;
    const path = `/pages/main/main?id=${id}&game=${_game}&top=0&from=share`;
    const puzzle = puzzles[position].join(',');

    let title = '';
    if (solved) {
      title = '这道题真有意思，我猜你也会';
    } else {
      title = `${puzzle}算24，你会吗？一起来玩吧！`;
    }
    return {
      title,
      path,
    }
  },

  /**
   * 数字选择
   * 用户交互选择，确定操作： x 运算 y
   * 1. 先准备x
   * 2. 再准备运算符
   * 3. 最后准备y
   * 4. 进行运算，运算结果是下一次运算的x，清空y和运算符（运算符也可以保留）
   * 5. 重新选择x，则重复步骤1；重新选择运算符，则重复步骤2；下一次运算，重复步骤3
   * 
   * 准备x
   *    1. 没有已选择的操作数，当前选择的数进入x
   *    2. 已选择操作数，同一点击对象，清空x
   *    3. 已选择操作数，非点击同一对象，且没有运算符已选择，更新x
   * 准备y
   *    1. 有x且非本身且有运算符选择，当前数进入y
   *    2. 直接运算
   */
  numberSelect: function(event) {
    const value = event.currentTarget.dataset.numberValue;
    const index = event.currentTarget.dataset.numberIndex;
    const {
      x,
      y,
      operatorSelected,
      numberSelected
    } = this.data;
    const cur = numberSelected[0];

    /*
     * 数字点击效果，声音&动画
     */
    tapSound.stop();
    tapSound.play();

    this.setData({
      numberTaped: index
    })

    setTimeout(() => {
      this.setData({
        numberTaped: false
      })
    }, 200)

    /*
     * 点击同一对象，切换
     */
    if (index === cur) {
      this.setData({
        numberSelected: []
      })
      this.removeOperator(value);
    } else {
      this.setData({
        numberSelected: [index, value]
      })
      if (x[0] === undefined) {
        this.setData({
          x: [value, index],
          numberSelected: [index, value]
        })
      } else {
        /*
         * 有运算符已选择，设置y，x，y，运算符准备完毕，运算结果
         */
        if (operatorSelected[0]) {
          this.setData({
            y: [value, index]
          })
          this.calculate();
        /*
         * 没有运算符已选择，更新x
         */
        } else {
          this.setData({
            x: [value, index],
            numberSelected: [index, value]
          })
        }
      }
    }
  },

  /*
   * 移除操作数
   * x,y是操作数栈，y后进先出
   */
  removeOperator: function(v) {
    const {
      x,
      y
    } = this.data;
    if (y[0] !== undefined) {
      this.setData({
        y: []
      })
    } else {
      this.setData({
        x: []
      })
    }
  },
  
  /*
   * 准备操作数，同numberSelect
   * 暂时没有用到
   */
  addOperator: function(v) {
    const {
      x,
      y,
      operatorSelected
    } = this.data;
    if (x[0] === undefined) {
      this.setData({
        x: [v]
      })
    } else {
      if (operatorSelected[0]) {
        this.setData({
          y: [v]
        })
        this.calculate();
      } else {
        this.setData({
          x: [v]
        })
      }
    }
  },

  /**
   * 计算 x 运算 y 的结果，更新运算结果、界面显示和操作历史
   * 把运算结果和显示结果分别保存，显示结果要考虑运算得到无理数的显示处理（如分数）
   * 运算结果只参与程序计算，不参与界面显示
   * 1. 准备x和y
   * 2. x和y是否有一个为非整数，标记非整数显示方式
   * 3. 准备运算符，运算结果，整数除整数是否为非整数，如果是，做同样的显示标记
   * 4. 结果的精度处理，保证最终结果是24
   * 5. 处理界面显示，如果有非整数标记，显示的结果是运算表达式
   * 6. 更新显示和计算结果，结果成为下一次计算的x，清空y
   * 7. 更新操作历史
   * 8. 检查是否已解题
   */
  calculate: function() {
    const {
      x,
      y,
      operatorSelected,
      operators,
      current,
      screen,
      numberSelected,
      length
    } = this.data;
    let {
      history,
      step
    } = this.data;
    const [pl, mi, mu, di] = operators;
    let result = '';
    let display = '';
    let decimal = false;

    let v1 = x[0];
    let v2 = y[0];
    let i = x[1];
    let j = y[1];

    const symbol = {
      plus: '+',
      minus: '-',
      multiply: '×',
      divide: '/'
    }

    if (v1.toString().indexOf('.') === 1 || v2.toString().indexOf('.') === 1) {
      decimal = true;
    }

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
        result = v1 / v2;
        if (result.toString().indexOf('.') >= 1) {
          decimal = true;
        }
        break;
      default:
        break;
    }

    if (Math.abs(result - 24) < 0.000001) {
      result = 24;
    }

    if (decimal && result.toString().indexOf('.') >= 1) {
      v1 = screen[i];
      v2 = screen[j];
      display = `${v1}${symbol[operatorSelected[0]]}${v2}`;
    } else {
      display = `${result}`;
    }

    current[numberSelected[0]] = result;
    screen[numberSelected[0]] = display;
    delete current[i];
    delete screen[i];

    history = history.splice(0, step + 1);

    history.push({
      current,
      screen,
      numberSelected,
      operatorSelected,
      result,
      index: j,
    })

    this.setData({
      history,
      step: step + 1,
      current,
      screen,
      x: [result, j],
      y: [],
      operatorSelected: [],
    })
    this.setLength();
    this.checkSolve();
  },

  /**
   * 运算符选择
   */
  operatorSelect: function(event) {
    const operator = event.currentTarget.dataset.opr;
    const cur = this.data.operatorSelected[0];

    tapSound.stop();
    tapSound.play();

    if (cur == operator) {
      this.setData({
        operatorSelected: []
      })
    } else {
      this.setData({
        operatorSelected: [operator]
      })
    }
  },

  /**
   * 计算显示的结果长度，控制字体显示大小
   */
  setLength: function(puzzle) {
    const {
      screen,
      length
    } = this.data;
    puzzle = puzzle || screen;

    puzzle.map((v, i) => {
      length[i] = v.toString().length;
    })

    this.setData({
      length,
    })
  },

  /**
   * 计算24游戏操作的最后结果
   * 操作数只剩一个并且结果是24，则解题，结果不是24，则解错
   * 还有其余操作数，则未解题
   * 分享进入的题，不保存
   */
  checkSolve: function() {
    const {
      screen,
      current,
      history,
      time
    } = this.data;
    const {
      from
    } = this.options;
    let len = 0;
    let index = 0;
    let self = this;
    current.map((v, i) => {
      if (typeof v == 'number') {
        len++;
        index = i;
      }
    })

    if (len === 1) {
      if (current[index] === 24) {
        gameSuccess.play();
        const score = time <= 30 ? 3 : time >= 100 ? 1 : 2;
        this.stopTimer();
        this.setData({
          solved: true,
          fold: true,
          score,
          history: history.pop(),
          step: 0
        })
        from != 'share' && this.saveScore();
        setTimeout(() => {
          const {
            next,
            puzzles,
            position
          } = self.data;
          const _next = next || position + 1 < puzzles.length ? true : false;
          wx.showModal({
            title: score === 3 ? '真厉害' : score === 2 ? '还不错' : score === 1 ? '要努力哦' : '',
            content: `用时${time}秒，获得${score}颗星`,
            confirmText: (from == 'share' || !_next) ? '更多挑战' : '下一题',
            cancelText: '再玩一次',
            success: function(res) {
              if (res.confirm) {
                if (from === 'share' || !_next) {
                  wx.redirectTo({
                    url: '/pages/index/index'
                  })
                } else {
                  self.toolNext();
                }
              } else if (res.cancel) {
                self.toolReset();
                self.stopTimer();
                self.setData({
                  time: 0.0
                })
                self.startTimer();
              }
            }
          })
        }, 500)
      } else {
        gameError.play();
        this.setData({
          wrong: true,
          solved: false,
          fold: false
        })
      }
    } else {
      this.setData({
        solved: false,
        wrong: false,
        fold: false
      })
    }
  },

  /**
   * 向前
   */
  toolPre: function() {
    const {
      puzzles,
      position,
      pre,
      current
    } = this.data;
    const cur = position;
    const puzzle = puzzles[cur - 2] || null;
    if (pre) {
      tapSound.stop();
      tapSound.play();
      this.setData({
        fold: true
      })
      setTimeout(() => {
        this.setData({
          screen: pre,
          current: pre,
          next: puzzles[cur],
          pre: puzzle,
          x: [],
          y: [],
          numberSelected: [],
          operatorSelected: ['plus'],
          time: 0.0,
          position: cur - 1,
          history: [{
            current: pre,
            screen: pre,
            numberSelected: [],
            operatorSelected: ['plus'],
          }],
          step: 0,
          solved: false,
          wrong: false,
          fold: false
        })
        this.setLength();
        this.stopTimer();
        this.startTimer();
        wx.setNavigationBarTitle({
          title: pre.toString()
        })
        gameStart.stop();
        gameStart.play();
      }, 500)
    }
  },

  /**
   * 向后
   */
  toolNext: function() {
    const {
      puzzles,
      position,
      next,
      current,
      top
    } = this.data;
    const cur = position;
    const index = cur + 2;
    const puzzle = index <= top ? (puzzles[cur + 2] || null) : null;
    const that = this;
    if (next) {
      tapSound.stop();
      tapSound.play();
      this.setData({
        fold: true
      })
      setTimeout(() => {
        that.setData({
          screen: next,
          current: next,
          next: puzzle, //puzzle, 只有前面完成才能进入下一关
          pre: puzzles[cur],
          x: [],
          y: [],
          numberSelected: [],
          operatorSelected: ['plus'],
          time: 0.0,
          position: cur + 1,
          history: [{
            current: next,
            screen: next,
            numberSelected: [],
            operatorSelected: ['plus'],
          }],
          step: 0,
          solved: false,
          wrong: false,
          fold: false
        })
        that.setLength();
        that.stopTimer();
        that.startTimer();
        wx.setNavigationBarTitle({
          title: next.toString()
        })
        gameStart.play();
      }, 500)
    }
  },

  /**
   * undo
   */
  toolUndo: function() {
    const {
      history,
      step
    } = this.data;
    const len = history.length;
    const cur = history[step - 1];
    if (len > 1 && cur) {
      tapSound.stop();
      tapSound.play();
      const {
        current,
        screen,
        operatorSelected,
        numberSelected,
        result,
        index
      } = cur;
      this.setData({
        current,
        screen,
        x: [result, index],
        y: [],
        numberSelected,
        operatorSelected: [],
        step: step - 1,
        wrong: false,
      })
      this.setLength();
    }
  },

  /**
   * redo
   */
  toolRedo: function() {
    const {
      history,
      step
    } = this.data;
    const len = history.length;
    const cur = history[step + 1];
    if (len > 1 && cur) {
      tapSound.stop();
      tapSound.play();
      const {
        current,
        screen,
        operatorSelected,
        numberSelected,
        result,
        index
      } = cur;
      this.setData({
        current,
        screen,
        x: [result, index],
        y: [],
        numberSelected,
        operatorSelected: [],
        step: step + 1,
      })
      this.setLength();
    }
  },

  /**
   * 重置
   */
  toolReset: function(e) {
    const {
      currentTarget
    } = e || {};
    if (currentTarget) {
      tapSound.stop();
      tapSound.play();
    }
    const {
      puzzles,
      position,
      history,
      top
    } = this.data;
    const cur = position;
    const index = cur + 1;
    //console.log(index);
    const next = index <= top ? (puzzles[cur + 1] || null) : null;
    //const next = null;
    const pre = puzzles[cur - 1] || null;
    const puzzle = puzzles[cur];
    if(puzzle){
      this.setLength(puzzle);
      this.setData({
        screen: puzzle,
        current: puzzle,
        next: next,
        pre: pre,
        step: 0,
        position: cur,
        history: [{
          current: puzzle,
          screen: puzzle,
          numberSelected: [],
          operatorSelected: ['plus'],
        }],
        x: [],
        y: [],
        numberSelected: [],
        operatorSelected: ['plus'], //初始选中加号运算符
        solved: false,
        wrong: false,
        fold: true
      })
      wx.setNavigationBarTitle({
        title: puzzle.toString()
      })
      const that = this;
      setTimeout(() => {
        gameStart.play();
        that.setData({
          fold: false
        })
      }, 500)
    }
  },

  stopTimer: function() {
    /*
    timeSound.stop();
    */
    clearInterval(timer);
  },

  startTimer: function() {
    let {
      time
    } = this.data;
    time = time * 10;
    timer = setInterval(() => {
      time++;
      this.setData({
        time: (time / 10).toFixed(1)
      });
    }, 100);
  },
  
  /**
   * 保存成绩
   * 保存成功自动解锁下一关
   */
  saveScore: function(t) {
    const session = qcloud.Session.get();
    const {
      userinfo: {
        openId
      }
    } = session;
    const {
      position,
      time,
      score
    } = this.data;
    const {
      id
    } = this.options;
    const that = this;
    qcloud.request({
      url: config.service.scoreUrl,
      login: false,
      method: 'POST',
      data: {
        userid: openId,
        level: position + 1,
        course: id >> 0,
        score,
        time,
      },
      success(result) {
        const {
          puzzles,
          position,
          history,
          top
        } = that.data;
        const cur = position;
        const next = (puzzles[cur + 1] || null) || null;
        const _top = cur + 1;
        that.setData({
          next,
          top: next ? Math.max(top, _top) : top,
        })
      },
      fail(error) {
        //console.log('request fail', error);
      }
    })

  },

  /**
   * 求助
   */
  getHelp() {
    tapSound.stop();
    tapSound.play();
  },

  /**
   * 进入答案页
   * 带入题目到答案页
   */
  getExpression() {
    const {
      position,
      puzzles
    } = this.data;
    const puzzle = puzzles[position].join(',');
    tapSound.stop();
    tapSound.play();
    wx.navigateTo({
      url: `/pages/tip/tip?puzzle=${puzzle}`,
    })
  },
  gotoHome() {
    wx.redirectTo({
      url: `/pages/index/index`,
    })
  }

})