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
// 用户管理
router.get('/userManage', routers.index.userManage);
router.post('/userManage', routers.index.userManageList);
router.post('/userManage/add', routers.index.addUserManage);
router.post('/userManage/update', routers.index.updateUserManage);
router.get('/userManage/find/:id', routers.index.findUserManage);
router.get('/userManage/findToPage/:id', routers.index.findUserManageToPage);

module.exports = router;