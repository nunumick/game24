class Game {
    constructor(cfg) {
        const { puzzle, status, operators } = cfg || {}
        this.puzzle = puzzle;
        this.status = status || 'pending';
        this._operators = {
            list: ['plus', 'minus', 'multiply', 'divide'],
            selected: [],
        }
    }

    start() {
        this.operator();
        this.x();
        this.y();
        this.history();
        this.redo();
        this.undo();
    }

    set x(v) {
        const [x,i] = v;
        this._x = typeof x !== 'undefined' ?  [x,i] : [];
    }
    get x() {
        return this._x;
    }

    set y(v) {
        const [y,i] = v;
        this._y = typeof y !== 'undefined' ? [y,i] : [];
    }
    get y() {
        return this._y;
    }

    set operator(operator) {
        this.operators.selected = [operator];
    }

    set redo(s) {
        const { history, step } = this;
        const _step = step + 1;
        const len = history.length;
        const cur = history[_step];
        if(len > 1 && cur){
            this.step = _step;
            return cur;
        }else{
            return null;
        }
    }

    set undo(s) {
        const { history, step } = this;
        const _step = step - 1;
        const len = history.length;
        const cur = history[_step];
        if(len > 1 && cur){
            this.step = _step;
            return cur;
        }else{
            return null;
        }
    }

    set history(his) {
        let { _history = [], step } = this;
        if(Array.isArray(his)){
            _history = his;
        }else{
            _history.push(his);
        }
        this._history = _history;
    }
    get history() {
        return this._history;
    }

    set step(step) {
        this._step = step || 0;
    }
    get step() {
        return this._step;
    }

    calculate() {
        const { x, y } = this;
        const { operators, operators:{ selected } } = this;
        const [pl,mi,mu,di] = operators;
        let result = '';

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

        //操作符运算
        switch (selected[0]) {
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
            break;
        default:
            break;
        }

        if(Math.abs(result-24) < 0.000001){
            result = 24;
        }
        
        const operator = symbol[selected[0]];
        this.history({
            x,
            y,
            operator,
            result,
            expression: `${v1}${operator}${v2}`
        })

    }

    solve() {

    }

    getTip() {

    }

    destroy() {

    }

    reset() {
        
    }


}

class Puzzles {
    
    constructor(cfg) {
        const { position = 0, puzzles = [] } = cfg || {};
        this.init(puzzles, position);
    }

    init(puzzles, position) {
        this.puzzles(puzzles);
        this.position(position);
    }

    get pre() {
        const { _position, _pre } = this;
        this.position(position - 1);
        return _pre;
    }

    set pre(pre) {
        this._pre = pre || null;
    }

    get next() {
        const { _position, _next } = this;
        this.position(_position + 1);
        return _next;
    }

    set next(next) {
        this._next = next || null;
    }

    get position() {
        return this._position;
    }

    set position(pos) {

        if(!pos || pos < 0)
            pos = 0;

        const { puzzles } = this;
        const pre = puzzles[pos - 1] || null;
        //const preP = puzzles[pos - 2] || null;
        const next = puzzles[pos + 1] || null;
        const cur = puzzles[pos] || null;
        //const nextN = puzzles[pos + 2] || null;
        this.current(cur);
        this.pre(pre);
        this.next(next);
        this._position = pos || 0;
    }

    get puzzles() {
        return this._puzzles;
    }

    set puzzles(puz) {
        this._puzzles = puz || [];
    }

    get current() {
        return this._current;
    }

    set current(cur) {
        this._current = cur;
    }

    getPuzzles() {
        return this.list;
    }

    setPuzzles(list) {
        this.list = list || [];
    }

}

/**
const puzzles = {
  list: [
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
  position: 0,
  current: [],
  pre: null,
  next: null,
}

const puz = new Puzzles({
    puzzles:[
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

puz.next();
*/

exports.Puzzles = Puzzles;
exports.Game = Game;