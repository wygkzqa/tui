!(function() {
	var tableOptions = {
		url: '../example.json',
		container: 'exampleDOM',
		formId: 'exampleForm', // 可选
		columns: [
			{ text: '姓名', field: 'name' },
			{ text: '年龄', field: 'age' }
		]
	};

	// 初始化
	TUI.table(tableOptions);
})();