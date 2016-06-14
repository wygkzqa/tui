/**
 * Created by GeekMa on 16/6/14.
 */
var express = require('express'),
    bodyParser = require('body-parser'),
    xtpl = require('xtpl');

var app = express();

app.use(express.static('public'));
app.set(express.static('views'));
app.set('view engine', 'xtpl');
app.use(bodyParser.urlencoded({extended: true}));
app.use('/backend', require('./routes/backend/index'));

// 错误处理页
app.use(function(err, req, res, next) {
    res.status(500).send('系统异常['+ err.stack +']');
});

app.use(function(req, res, next) {
    res.status(404).send('很抱歉，找不到该页面！无效的路径: '+ req.path +'<br><br><a href="/backend" style="font-size: 14px; color: #848484;">返回</a>');
});

app.listen(3003);