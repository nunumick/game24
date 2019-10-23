"use strict"

class GameSolution {
  constructor(config) {
    config = config || {};
    this.puzzles = [];
    this.validatePuzzles = [];
    this.difficultPuzzles = [];
    this.validatePuzzlesMap = {};
    this.expressionOptimize = config.expressionOptimize === undefined ? true : config.expressionOptimize;
    this.current = null;
    this.goal = config.goal || 24;

    //组合(从n个数中取m个数组合)
    this.n = config.n || 13;
    this.m = config.m || 4;

    //支持加减乘除，也支持任意一种或几种
    this.operators = config.operators || ['+','-','*','/'];
  }
  /*
  * (n)个数任意选择(m)个
  * 数字和数字之间可以重复的组合
  * 24传统玩法是从13个数取4个数组合，总共有1820种
  * (n+m-1)!/m!(n-1)!
  */
  _getPuzzles(n,m) { 
    var puzzle = [];

    var initPuzzle = (index,num) => {
      index = index || 0;
      num = num || 0;

      if(index >= m){
        return;
      }

      var pos = index;

      for(var i = num; i < n; i++){
        puzzle[pos] = i + 1;
        if(index == m-1){
          this.puzzles.push(puzzle.concat());
        }
        initPuzzle(index + 1,i);
      }
    }

    initPuzzle();

    return this.puzzles;
  }

  getPuzzles() {
    if(this.puzzles.length){
      return this.puzzles;
    }else{
      return this._getPuzzles(this.n, this.m);
    }
  }

  /*
   * 总共有1362可解组合
   */
  getValidatePuzzles() {
    var puzzles = this.getPuzzles();
    puzzles.forEach((puzzle) => {
      if(this.solve(puzzle,true)){
        this.validatePuzzles.push(puzzle);
      }
    })
    return this.validatePuzzles;
  }

  getDifficultPuzzles(level = 1, contain, up) {
    var puzzles = this.getPuzzles();
    puzzles.forEach((puzzle)=>{
      const solutions = this.getExpression(puzzle, true);
      if(solutions.length && (up ? solutions.length >= level : contain ? solutions.length <= level : solutions.length === level) ){
        //console.log(solutions);
        this.difficultPuzzles.push(puzzle);
      }
    })
    return this.difficultPuzzles;
  }

  getExpression(exp,all){
    var key = exp.sort(function(a,b){return parseInt(a) > parseInt(b)}).join();
    var result = this.validatePuzzlesMap[key];
    if(!result || result && all && result.length == 1){
      this.solve(exp);
      return this.validatePuzzlesMap[key] || [];
    }else{
      return result;
    }
  }

  solve(exp,once) {
    var len = exp.length;
    var len1 = len;
    var len2 = len;
    var operators = this.operators;
    var self = this;

    if(len == this.m){
      this.current = exp;
      let key = exp.sort(function(a,b){return parseInt(a) > parseInt(b)}).join();
      if(once && this.validatePuzzlesMap[key]){
        return true;
      }
    }

    //数列不小于一位，取两个数a,b进行运算
    //全部数字都会被遍历
    if(len > 1){

      /*//当数列只有两位的时候，固定a,b顺序
      if(len == 2){
        len1 = 1;
      }*/

      for(let i=0;i<len1;i++){
        for(let j=0;j<len2;j++){
          let a = exp[i];
          let b = exp[j];
          //临时拷贝
          //因为循环还要继续，所以不能直接变更源数列
          let c = exp.concat();

          //操作数a和b不能是同一个数
          if(j == i){
            continue;
          }
          if(!a || !b){
            continue;
          }

          //剔除a,b，留下其他数
          delete c[i];
          delete c[j];

          //对a，b进行加减乘除运算
          //运算结果和其他剩余的数字组成新的数列
          //继续遍历运算
          //这是个递归过程
          for(let k=0;k<operators.length;k++){
            let operator = operators[k];
            let newExp = []; //新的数列
            let newResult; //运算结果
            //{
            // a : a,
            // b : b,
            // o : o,
            // v : v
            //}
            // 每次运算的操作数和操作符以及结果
            // 用一个对象描述，可以看作操作数对象
            // 操作数对象会继续加入到新的数列
            // 进行下一轮运算
            // 操作数是一个链式对象
            let record = {};
            let v1,v2;//操作数的具体值

            //把数列中剩余的操作数加入新的数列
            c.map((v) => {
              newExp.push(v);
            });

            //如果是操作数对象，则取其v值
            //否则就是纯数值
            //第一轮运算都是纯数字
            //只要有经过运算一定是操作数对象
            if(!isFinite(a) && a.hasOwnProperty('v')){
              v1 = a.v;
            }else{
              v1 = a;
            }

            if(!isFinite(b) && b.hasOwnProperty('v')){
              v2 = b.v;
            }else{
              v2 = b;
            }

            //滤除0作为除数的情况
            if(operator == '/' && Math.abs(v2) < 0.000001){
              continue;
            }

            //操作符运算
            switch (operator) {
              case '+':
                newResult = v1 + v2;
                break;
              case '-':
                newResult = v1 - v2;
                break;
              case '*':
                newResult = v1 * v2;
                break;
              case '/':
                newResult = v1 / v2;
                break;
              default:
                break;
            }

            //构造操作数对象
            //出现负数时
            //只可能是减运算
            //a，b值进行调换
            if(newResult < 0) {
              newResult = v2 - v1;
              record = {
                a : b,
                b : a,
                o : operator,
                v : newResult
              }
            }else{
              record = {
                a : a,
                b : b,
                o : operator,
                v : newResult
              }
            }

            //加入新数列
            newExp.push(record);

            //继续运算剩余数列
            //直到数列仅剩1位
            if(once && this.solve(newExp,once)){
              return true;
            }else{
              this.solve(newExp);
            }
          }
        }
      }
      //数列仅剩一位，看最终的运算结果是否是24
    }else{
      let final = exp[0];
      //除法运算会得出小数，可能最终结果非常逼近24
      //如果最终的值非常逼近24，也算正确
      if(Math.abs(final.v - this.goal) < 0.000001){
        final.result = true;

        //输出最终的操作数
        //console.log(final);
        //解开操作数链
        //输出运算表达式
        this.addValidateExpression(this.current,this.printExpression(final,this.expressionOptimize));
      }else{
        final.result = false;
      }

      if(once){
        return final.result;
      }
    }
  }

  /**
   * 输出运算表达式
   * @params exp 操作数
   * @params expland 是否按照运算符优先级展开表达式，会去掉没有用的括号
   */
  printExpression(exp,expland){
    //用数组来存储表达式
    //表达式是一个分段的结构
    //最终通过join方式合并表达式
    //表达式 ＝ 表达式A + 操作符 + 表达式B
    var expression = [];
    //表达式A，操作数a，b本身也可以是一个表达式
    //所以是一个分段展开的结构
    //默认每一个表达式从里到外解开都带括号
    var expressionA = [];
    var expressionB = []; //表达式B
    var a = exp.a;
    var b = exp.b;
    var o = exp.o;

    //表达式A的操作符优先级
    //因为表达式A在前段
    //相同优先级的表达式操作可以不用括号，比如(a+b)+c，可以表达为 a+b+c
    //低优先级的表达式操作需要用括号，比如(a-b)/c，括号需要保留
    //高优先级的表达式操作不需要用括号，比如(a*b)+c，等价 a*b+c
    var priorityA = {
      '+' : 1,
      '-' : 1,
      '*' : 2,
      '/' : 2
    };

    //表达式B操作符优先级
    //因为表达式B在后段
    //遇-操作符不能轻易取消后面的括号，比如a-(b+c)，其等价应为 a-b-c
    //遇/操作符不能轻易取消后面的括号，比如a/(b*c)，其等价应为 a/b/c
    //所以简单处理，遇-和/操作，后段表达式B括号保留
    //+操作符和*操作符遵循和表达式A相同的逻辑，比如 
    // a+(b*c)，可以表达为 a+b*c
    // a+(b-c) = a+b-c
    // a+(b/c) = a+b/c
    // a+(b+c) = a+b+c
    // a*(b/c) = a*b/c
    // a*(b*c) = a*b*c
    // a*(b-c) 不能取消括号
    // a*(b+c) 不能取消括号
    // a-(b+c) 不能取消括号
    // a-(b/c) = a-b/c
    // a-(b*c) = a-b*c
    // a-(b-c) 不能取消括号
    // a/(b+c) 不能取消括号
    // a/(b-c) 不能取消括号
    // a/(b*c) 不能取消括号
    // a/(b/c) 不能取消括号
    // 得出结论：
    // + < all
    // * < /, * > -, * > +
    // / > all，最好是不做处理
    // - > +, - > -, - < *, - < \
    var priorityB = {
      '+' : -3,
      '-' : -2,
      '*' : -1,
      '/' : 0
    };

    //-号优先级要大于本身，属于比较特殊的结合
    var prioritySpecial = ['-'];

    //数学运算符字面量映射
    var map = {
      '+' : '+',
      '-' : '-',
      '*' : '×',
      '/' : '÷'
    };

    //修正加法和乘法顺序，5+3同3+5，3*5同5*3，统一规则为从小到大排列
    //加法和减法互换操作数可认为是同一表达式
    //这样可以减少同一解题表达式
    if(expland && (o === '+' || o === '*')) {
      var sortByValue = [a,b];
      sortByValue.sort((a1,b1)=>{
        var v1 = a1.v === undefined ? a1 : a1.v;
        var v2 = b1.v === undefined ? b1 : b1.v;
        return v1 >= v2;
      })

      a = sortByValue[0];
      b = sortByValue[1];
    }

    //如果操作数a也是操作数对象
    //表达式A也是表达式
    if(a.hasOwnProperty('v')){
      //先解开内部操作数的表达式，二级表达式
      //默认都为表达式加上头尾括号
      expressionA = [].concat(['('], [this.printExpression(a,expland)], [')']);

      //如果符合展开的运算优先级，则去掉头尾括号
      //二级表达式括号保留
      if(expland && priorityA[o] && priorityA[o] <= priorityA[a.o]){
        expressionA.shift();
        expressionA.pop();
      }
    }else{
      //表达式A是纯数字
      expressionA = [a];
    }

    //同A
    //不同的是运算符优先级
    if(b.hasOwnProperty('v')){
      expressionB = [].concat(['('], [this.printExpression(b,expland)], [')']);
      if(expland && priorityB[o] && priorityB[o] <= priorityB[b.o] && !(o === b.o && prioritySpecial.indexOf(o) === 0)){
        expressionB.shift();
        expressionB.pop();
      }
    }else{
      expressionB = [b];
    }

    //合并表达式
    expression = expressionA.concat([expland ? map[o] : o],expressionB);
    expression = expland ? this._fixOrder(expression.join('')) : expression.join('');

    return expression;
  }

  /**
   * 修正连加连乘的顺序
   * 1+2+4+3, 4+3+2+1 => 1+2+3+4
   * 1×2×4×3, 4×3×2×1 => 1×2×3×4
   * @param {string} expression 
   */
  _fixOrder(expression) {
    //准备待修正的操作符
    const os = ['+','×'];
    /*
    const bracketsReg = /\(.*\)/g;
    const flag = '666666';
    const exps = expression.match(bracketsReg);
    expression = expression.replace(bracketsReg, flag);
    */

    //过滤出连续操作的操作符（不包含其他操作符和括号等干扰信息）
    os.filter((o,i)=>{
      //滤除后有其他非数字字符会得出0的结果
      //过滤'+'，如有'2×3' >> 0 = 0;
      if(expression.replace(new RegExp(`\\${o}`,'g'),'')>>0 === 0){
        return false;
      }else{
        return true;
      }
    }).map((o,i)=>{
      //排序后重组
      var nums = expression.split(o);
      nums.sort((a,b)=>{
        return a>b;
      })
      expression = nums.join(o);
    })

    /*
    exps && exps.map((v)=>{
      expression = expression.replace(flag, v);
    })
    */

    /**
     * 一些补充
     * a×b?(c?d) = b×a?(c?d)
     * 2×3÷(4÷1) = 3×2÷(4÷1)
     * 2×3×(4÷1) = 3×2×(4÷1)
     */
    expression = expression.replace(/^(\d+)×(\d+)/, (s0,s1,s2) => {
      if(s2 < s1) {
        return s2+'×'+s1;
      } else {
        return s0;
      }
    })

    return expression;
  }

  addValidateExpression(exp,expression){
    var key = exp.sort(function(a,b){return parseInt(a) > parseInt(b)}).join();
    if(!this.validatePuzzlesMap[key]){
      this.validatePuzzlesMap[key] = [expression];
    }else{
      if(this.validatePuzzlesMap[key].indexOf(expression) < 0){
        this.validatePuzzlesMap[key].push(expression);
      }
    }
  }
}


module.exports = GameSolution;