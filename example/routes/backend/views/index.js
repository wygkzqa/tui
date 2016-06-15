/**
 * Created by GeekMa on 16/6/14.
 */
// 声明测试数据
var testData = {
    rows: [],
    rowCount: 0
};

exports.home = function(req, res) {
    res.render('backend/home');
};

exports.userManage = function(req, res) {
    res.render('backend/userManage');
};

exports.userManageList = function(req, res) {
    console.log('搜索框参数:');
    console.log(req.body);

    res.json(testData);
};

// 添加
exports.addUserManage = function(req, res) {
    console.log('添加参数:');
    console.log(req.body);

    req.body.id = testData.rows.length + 1;
    testData.rows[testData.rows.length] = req.body;
    testData.rowCount++;

    res.json('Y');
};

// 修改
exports.updateUserManage = function(req, res) {
    console.log('修改参数:');
    console.log(req.body);

    testData.rows[req.body.id - 1] = req.body;

    res.json('Y');
};

// 查看
exports.findUserManage = function(req, res) {
    res.json(testData.rows[req.params.id - 1]);
};

exports.findUserManageToPage = function(req, res) {
    res.render('backend/userManageInfo', testData.rows[req.params.id - 1]);
};