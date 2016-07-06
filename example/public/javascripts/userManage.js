/**
 * Created by GeekMa on 16/6/15.
 */
define(function() {
    /**
     * options是针对表格的一系列操作
     * 实体的操作基于表格
     */
    var options = {
        // table(标准表格)、tableTree(树形表格), default table
        type: 'table',
        // DOM容器ID
        container: 'userManageDOM',
        // 可选, 为空时生成默认ID
        formId: '',
        // 列表请求内容编码类型, 默认application/x-www-form-urlencoded
        contentType: 'application/x-www-form-urlencoded',
        // 默认GET
        method: 'POST',
        // 列表请求地址 返回对象，必须包含rows和rowCount属性，分别表示数据集合和总记录数
        url: '/be/userManage',
        // 表格列属性
        columns: [
            { text: 'ID', field: 'id' },
            { text: '姓名', field: 'name' },
            { text: '年龄', field: 'age' },
            { text: '性别', field: 'sex' },
            { text: '出生日期', handle: function(row) {
                return TUI.Utils.dateFormat(row.date, 'yyyy-MM-dd');
            } }
        ],
        // 搜索栏
        searchbar: [
            {
                text: '姓名',
                field: 'name',
                // 默认input text
                type: 'text'
            },
            {
                text: '年龄',
                field: 'age',
                type: 'select',
                options: [
                    { text: '1-10岁', value: '1-10' },
                    { text: '11-20岁', value: '11-20' },
                    { text: '21-30岁', value: '21-30' }
                ]
            },
            {
                text: '性别',
                field: 'sex',
                type: 'radio',
                options: [
                    { text: '男', value: 'man' },
                    { text: '女', value: 'woman' },
                    { text: '其他', value: 'other' },
                ]
            }
        ],
        // 工具栏
        toolbar: [
            {
                text: '自定义工具栏',
                className: 'ebtn ebtn-success ebtn-rounded',
                // 处理方法
                handle: function() {
                    TUI.danger('点击了自定义工具栏');
                }
            }
        ],
        // 行操作
        rowHandles: {
            // 删除行
            delete: function(row) {
                return {
                    method: 'POST',
                    url: '/be/userManage/delete/' + row.id,
                    // 回调
                    callback: function(res) {
                        if (res === 'Y') {
                            // 返回success刷新表格
                            return 'success';
                        }

                        TUI.danger('删除失败');
                    }
                }
            },
            // 查看行
            find: function(row) {
                return {
                    method: 'GET',
                    url: '/be/userManage/find/' + row.id,
                    // 回调, 可选, 如果你需要对得到的对象进行操作可以使用callback
                    callback: function(entity) {
                        return entity;
                    }
                }
            },
            // 自定义操作
            custom: [
                {
                    text: '自定义操作',
                    // 图标class
                    iconClass: 'fa fa-cog fa-fw',
                    // 处理方法
                    handle: function(row) {
                        TUI.modal({
                            id: 'id', // 模态框ID, 可选
                            // type: 'sm', // 模态框大小, lg(大)、默认(中)、sm(小),
                            title: row.name + '的个人信息',
                            content: '<div id="userManageInfo"></div>',
                            // 确定按钮事件 可选
                            confirm: function() {
                                // 返回success关闭模态框
                                return 'success';
                            }
                        });

                        // 这里通过jquery load方法加载一个页面
                        $('#userManageInfo').load('/be/userManage/findToPage/' + row.id);
                    }
                }
            ]
        }
    };

    var entity = {
        // 实体主键名
        key: 'id',
        // 是否异步提交表单, 默认false, 目前依赖jquery.form.js
        ajaxSubmit: false,
        // 实体字段
        fields: [
            { text: '姓名', field: 'name', validators: { notEmpty: { message: '姓名不能为空' } } },
            { text: '出生日期', field: 'date', type: 'date', validators: { notEmpty: { message: '出生日期不能为空' } } },
            {
                text: '年龄',
                field: 'age',
                type: 'select',
                options: [
                    { text: '1-10岁', value: '1-10' },
                    { text: '11-20岁', value: '11-20' },
                    { text: '21-30岁', value: '21-30' }
                ]
            },
            {
                text: '性别',
                field: 'sex',
                type: 'radio',
                options: [
                    { text: '男', value: 'man' },
                    { text: '女', value: 'woman' },
                    { text: '其他', value: 'other' },
                ]
            }
        ],
        // 创建实体参数
        create: {
            method: 'POST',
            url: '/be/userManage/add',
            // 回调
            callback: function(res) {
                if (res === 'Y') {
                    // 返回success自动刷新表格
                    return 'success';
                }

                TUI.danger('保存失败');
            }
        },
        // 修改实体
        update: {
            method: 'POST',
            url: '/be/userManage/update',
            // 回调
            callback: function(res) {
                if (res === 'Y') {
                    // 返回success自动刷新表格
                    return 'success';
                }

                TUI.danger('保存失败');
            }
        }
    };

    TUI.table(options, entity);
});