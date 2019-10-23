const { mysql } = require('../qcloud')

async function get(ctx, next) {
    const { type, userid, course } = ctx.query;
    const isTop = type === 'top';

    if (userid) {
        const datas = await mysql('scoreByLevels').select(['level', 'score', 'time']).where({
            userid,
            course,
        }).orderBy('level', isTop ? 'desc' : 'asc');

        if (isTop) {
            const [top] = datas;
            ctx.state.data = {
                top: top ? top.level >> 0 : 0,
            };
        } else {
            ctx.state.data = {
                levels: datas
            };
        }
    } else {
        ctx.state.data = -1;
    }
}

async function all(ctx, next) {
    const { userid } = ctx.query;
    //取当前有多少关卡数量
    //取出course唯一的level最大值
    //SELECT * FROM `levelsInfo` A WHERE A.level = (SELECT MAX(B.level) FROM `levelsInfo` B WHERE B.course = A.course) ORDER BY A.course
    if (userid) {
        const [ courses, ...def ] = await mysql.raw("SELECT * FROM `levelsInfo` A WHERE A.level = (SELECT MAX(B.level) FROM `levelsInfo` B WHERE B.course = A.course) ORDER BY A.course");
        //let levels = [];
        const scores = await Promise.all(courses.map(async (level, index)=>{
            const { course } = level;
            //levels.push(level);
            const score = await mysql('scoreByLevels').select(['level', 'score', 'time']).where({
                userid,
                course,
            }).orderBy('level');
            
            return index ===0 ? [score.pop()] : score;
        }));
        ctx.state.data = {
            //levels,
            //courses,
            scores,
        };
    } else {
        ctx.state.data = -1;
    }
}

async function post(ctx, next) {
    const { userid, level, score, time, course } = ctx.request.body;
    const preLevel = level > 0 ? level - 1 : 0;
    let msg = '';

    if(userid){
        const datas = await mysql('scoreByLevels').select().where({
            userid,
            course,
        }).andWhere(function(){
            this.where('level', level).orWhere('level', preLevel);
        }).orderBy('level', 'asc');

        let [ pre, record ] = datas;

        if(datas.length === 1) {
            if(level === 1) {
                record = pre;
            }else if(pre.level === level){
                record = pre;
                pre = null;
            }
        }

        const method = record ? 'update' : 'insert';
        const row = {
            userid,
            level,
            course,
            score,
            time,
        }

        if(pre || level === 1){
            if(record){
                if( Math.max(record.time, time) == time ){
                    msg =  `更新失败，记录中的分数更高`;
                }else{
                    await mysql('scoreByLevels').update({
                        score,
                        time,
                    }).where({
                        userid,
                        level,
                        course,
                    })
                }
            }else{
                await mysql('scoreByLevels').insert(row);
            }

            ctx.state.data = {
                pre,
                record,
                msg: msg || `${method} success`
            }
        }else {
            ctx.state.data = -1;
        }
    }else{
        ctx.state.data = -1;
    }
}

module.exports = {
    get,
    all,
    post
}