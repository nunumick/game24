const { mysql } = require('../qcloud');

module.exports = {
    get: async function(ctx, next) {
        const { course, level } = ctx.query;
        const datas = await mysql('levelsInfo').select().where({
            course,
        }).andWhere('level', level ? '=' : '>=', level || 1);

        ctx.state.data = {
            course: datas
        }
    },
    post: async function(ctx, next) {
        const { levels: puzzles, course = 0 } = ctx.request.body;
        const courses = puzzles.map((puzzle,i)=>{
            puzzle.sort(()=>{
                return Math.random() > .5;
            })
            return {
                level: i+1,
                course,
                puzzle: puzzle.join(','),
            }
        })

        await mysql('levelsInfo').insert(courses);

        ctx.state.data = {
            msg: 'success'
        }

    }
}