/**
 * Created by GeekMa on 16/6/14.
 */
var express = require('express'),
    router = express.Router();

// 加载后台路由模块
var routers = {
    index: require('./views/index')
};

router.get('/', routers.index.home);

module.exports = router;