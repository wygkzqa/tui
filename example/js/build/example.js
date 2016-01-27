!(function () {
	var tableOptions = {
		url: '../table.json',
		container: 'exampleDOM',
		formId: 'exampleForm', // 可选
		columns: [{ text: '姓名', field: 'name' }, { text: '年龄', field: 'age' }],
		rowHandles: {
			delete: function (row) {
				return {
					url: '',
					callback: function (result) {
						return 'success';
					}
				};
			},
			find: function (row) {
				return {
					url: '',
					callback: function (result) {
						return 'success';
					}
				};
			},
			custom: [{
				text: '自定义操作',
				handle: function (row) {
					TUI.success('这是自定义操作，可以获得当前记录');
				}
			}, {
				text: '自定义操作啊啊',
				handle: function (row) {
					TUI.success('这是自定义操作，可以获得当前记录');
				}
			}]
		},
		searchbar: [{
			text: '姓名',
			field: 'name'
		}, {
			text: '年龄',
			field: 'age',
			type: 'select',
			options: [{ text: '0-10岁', value: '0-10' }, { text: '11-20岁', value: '11-20' }, { text: '20岁以上', value: '20+' }]
		}]
	};

	var entity = {
		key: 'id',
		fields: [{
			text: '姓名',
			field: 'name',
			validators: {
				notEmpty: { message: '姓名不能为空' }
			}
		}, {
			text: '年龄',
			field: 'age',
			type: 'select',
			options: [{ text: '0-10岁', value: '0-10' }, { text: '11-20岁', value: '11-20' }, { text: '20岁以上', value: '20+' }]
		}]
	};

	var TreeComp = React.createClass({
		displayName: 'TreeComp',

		getInitialState: function () {
			return {
				value: '暂无操作'
			};
		},
		setCheckedVals: function (value) {
			this.setState({ value: value });
		},
		render: function () {
			var treeOptions = {
				url: 'http://192.168.1.191:8081/tree.json',
				container: 'treeDOM',
				// 是否复选框
				checkbox: true,
				// 复选框值字段
				checkboxValueField: 'id',
				// 父级组件提供一个接口“setCheckedVals”，可以获取已选中的值
				setCheckedVals: this.setCheckedVals
			};

			return React.createElement(
				'div',
				{ className: 'row' },
				React.createElement(
					'div',
					{ className: 'col-md-3 well' },
					React.createElement(TUI.Tree, treeOptions)
				),
				React.createElement(
					'div',
					{ className: 'col-md-8 col-md-offset-1 well' },
					'当前选中：',
					this.state.value
				)
			);
		}
	});

	ReactDOM.render(React.createElement(TreeComp, null), document.getElementById('treeDOM'));

	// 初始化
	TUI.table(tableOptions, entity);
})();