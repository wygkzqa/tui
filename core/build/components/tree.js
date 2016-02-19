(function () {
	var TreeComp = React.createClass({
		displayName: 'TreeComp',

		getInitialState: function () {
			return {
				// 树集合
				trees: [],
				// 已选中的值集合
				checkedVals: [],
				// 子菜单选中状态集合
				childCheckedStatus: []
			};
		},
		componentDidMount: function () {
			TUI.loading({ text: '正在加载菜单...' });
			var url = this.props.url;

			$.ajax({
				async: false,
				url: url,
				dataType: 'JSON',
				success: (function (result) {
					TUI.loading({ className: 'hide' });

					if (this.isMounted() && result instanceof Array) {
						this.setState({ trees: result });
					} else {
						TUI.danger('TUI Tree 返回数据结构不正确，请返回Array');
					}
				}).bind(this),
				error: function (xhr, error, obj) {
					TUI.loading({ className: 'hide' });
					TUI.danger(url + '远程调用异常［' + error + ', ' + obj + '］');
					throw new Error(url + '远程调用异常［' + error + ', ' + obj + '］');
				}
			});
		},
		// 展开子级
		showChild: function (e) {
			if (e.target.nodeName !== 'INPUT') {
				var trees = this.state.trees,
				    index = e.currentTarget.dataset.index;
				status = e.currentTarget.dataset.status;

				if (status === 'close') {
					trees[index]._status = 'open';
					trees[index]._arrows = 'fa fa-angle-down';
					trees[index]._className = 'show';
				} else {
					trees[index]._status = 'close';
					trees[index]._arrows = 'fa fa-angle-right';
					trees[index]._className = 'hide';
				}

				this.setState({ trees: trees });
			}
		},
		changeCheckbox: function (e) {
			var isChecked = e.target.checked,
			    isParent = e.target.dataset.parent;
			checkedVals = this.state.checkedVals, childCheckedStatus = this.state.childCheckedStatus, index = e.target.dataset.index;

			// 复选框为父级
			if (isParent === 'true') {
				if (isChecked) {
					childCheckedStatus[index] = true;
					this.pushCheckedVals(checkedVals, e.target.value);
				} else {
					childCheckedStatus[index] = false;
					this.removeChecked(checkedVals, e.target.value);
				}

				var childNodes = e.target.parentNode.nextSibling.childNodes;
				for (var i = 0; i < childNodes.length; i++) {
					var childCheckbox = childNodes[i].getElementsByTagName('INPUT')[0],
					    index = childCheckbox.dataset.index;

					if (isChecked) {
						childCheckedStatus[index] = true;
						this.pushCheckedVals(checkedVals, childCheckbox.value);
					} else {
						childCheckedStatus[index] = false;
						this.removeChecked(checkedVals, childCheckbox.value);
					}
				}
			}
			// 子级
			else {

					if (isChecked) {
						childCheckedStatus[index] = true;
						this.pushCheckedVals(checkedVals, e.target.value);
					} else {
						childCheckedStatus[index] = false;
						this.removeChecked(checkedVals, e.target.value);
					}
				}

			this.setState({ checkedVals: checkedVals, childCheckedStatus: childCheckedStatus });
			this.props.setCheckedVals(checkedVals.join(','));
		},
		pushCheckedVals: function (checkedVals, targetValue) {
			var exist = false;

			for (var i = 0; i < checkedVals.length; i++) {
				if (checkedVals[i] === targetValue) {
					exist = true;
					break;
				}
			}

			if (!exist) {
				checkedVals.push(targetValue);
			}
		},
		// 移除未选中的复选框值
		removeChecked: function (checkedVals, targetValue) {
			for (var i = 0; i < checkedVals.length; i++) {
				if (checkedVals[i] === targetValue) {
					checkedVals.splice(i, 1);
					break;
				}
			}
		},
		render: function () {
			return React.createElement(
				'ul',
				{ className: 'tui-tree' },
				this.state.trees.map((function (parent, key) {
					var parentCheckboxDOM = '';

					if (this.props.checkbox == true) {
						parentCheckboxDOM = React.createElement('input', { type: 'checkbox', defaultValue: parent[this.props.checkboxValueField], onChange: this.changeCheckbox, 'data-parent': 'true', 'data-index': key, style: { 'marginRight': '3' } });
					}

					return React.createElement(
						'li',
						{ key: key },
						React.createElement(
							'a',
							{ href: 'javascript:;', onClick: this.showChild, 'data-index': key, 'data-status': this.state.trees[key]._status || 'close' },
							React.createElement('i', { className: 'tui-mr5 ' + (this.state.trees[key]._arrows || 'fa fa-angle-right') }),
							React.createElement('i', { className: 'fa fa-folder-open-o tui-mr5' }),
							parentCheckboxDOM,
							parent.name
						),
						React.createElement(
							'ul',
							{ className: 'tui-tree-child ' + this.state.trees[key]._className },
							parent.children.map((function (child, childKey) {
								var checkboxDOM = '';

								if (this.props.checkbox == true) {
									checkboxDOM = React.createElement('input', { type: 'checkbox', defaultValue: child[this.props.checkboxValueField], checked: this.state.childCheckedStatus[key + '-' + childKey] || false, onChange: this.changeCheckbox, 'data-parent': 'false', 'data-index': key + '-' + childKey, style: { 'marginRight': '3' } });
								}

								return React.createElement(
									'li',
									{ key: childKey },
									React.createElement(
										'a',
										{ href: 'javascript:;' },
										React.createElement('i', { className: 'fa fa-file-o tui-mr5' }),
										checkboxDOM,
										child.name
									)
								);
							}).bind(this))
						)
					);
				}).bind(this))
			);
		}
	});

	TUI.Tree = TreeComp;
})();