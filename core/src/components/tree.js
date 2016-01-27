(function() {
	var TreeComp = React.createClass({
		getInitialState: function() {
			return {
				// 树集合
				trees: [],
				// 已选中的值集合
				checkedVals: [],
				// 子菜单选中状态集合
				childCheckedStatus: []
			};
		},
		componentDidMount: function() {
			TUI.loading({text: '正在加载菜单...'});
			
			$.ajax({
				async: false,
				url: this.props.url,
				dataType: 'JSON',
				success: function(result) {
					TUI.loading({ className: 'hide' });

					if (this.isMounted() && result instanceof Array) {
						this.setState({trees: result});
					} else {
						TUI.danger('TUI Tree 返回数据结构不正确，请返回Array');
					}
				}.bind(this),
				error: function(xhr, error, obj) {
					TUI.loading({ className: 'hide' });
					TUI.danger(url + '远程调用异常［' + error + ', ' + obj + '］');
					throw new Error(url + '远程调用异常［' + error + ', ' + obj + '］');
				}
			});
		},
		// 展开子级
		showChild: function(e) {
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

				this.setState({trees: trees});
			}
		},
		changeCheckbox: function(e) {
			var isChecked = e.target.checked,
				isParent = e.target.dataset.parent;
				checkedVals = this.state.checkedVals,
				childCheckedStatus = this.state.childCheckedStatus,
				index = '';

			// 复选框为父级
			if (isParent === 'true') {
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
				index = e.target.dataset.index;

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
		pushCheckedVals: function(checkedVals, targetValue) {
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
		removeChecked: function(checkedVals, targetValue) {
			for (var i = 0; i < checkedVals.length; i++) {
				if (checkedVals[i] === targetValue) {
					checkedVals.splice(i, 1);
					break;
				}
			}
		},
		render: function() {
			return (
				<ul className="tui-tree">
					{
						this.state.trees.map(function(parent, key) {
							var parentCheckboxDOM = '';

							if (this.props.checkbox == true) {
								parentCheckboxDOM = <input type="checkbox" defaultValue={parent[this.props.checkboxValueField]} onChange={this.changeCheckbox} data-parent="true" style={{'marginRight': '3'}} />
							}

							return (
								<li key={key}>
									<a href="javascript:;" onClick={this.showChild} data-index={key} data-status={this.state.trees[key]._status || 'close'}>
										<i className={'tui-mr5 ' + (this.state.trees[key]._arrows || 'fa fa-angle-right')}></i>
										<i className="fa fa-folder-open-o tui-mr5"></i>
										{parentCheckboxDOM}
										{parent.name}
									</a>
									<ul className={'tui-tree-child ' + this.state.trees[key]._className}>
										{
											parent.children.map(function(child, childKey) {
												var checkboxDOM = '';

												if (this.props.checkbox == true) {
													checkboxDOM = <input type="checkbox" defaultValue={child[this.props.checkboxValueField]} checked={this.state.childCheckedStatus[key + '-' + childKey] || false} onChange={this.changeCheckbox} data-parent="false" data-index={key + '-' + childKey} style={{'marginRight': '3'}} />
												}

												return (
													<li key={childKey}>
														<a href="javascript:;"><i className="fa fa-file-o tui-mr5"></i>{checkboxDOM}{child.name}</a>
													</li>
												);
											}.bind(this))
										}
									</ul>
								</li>
							)
						}.bind(this))
					}
				</ul>
			);
		}
	});

	TUI.Tree = TreeComp;
})();