;(function(){
	if (typeof jQuery === 'undefined' || typeof React === 'undefined') {
		throw new Error('TUI requires jQuery and React.');
	}

	var TUI = window.TUI || {};

	var Menu = React.createClass({
		getInitialState: function() {
			return {
				init: true,
				menusComp: '加载中...',
				menusContentComp: '加载中...',
				menuListProps: {
					createMenu: this.createMenu,
					getMenuInfo: this.getMenuInfo
				},
				menuContentProps: {
					deleteMenu: this.deleteMenu,
					updateMenu: this.updateMenu
				}
			};
		},
		// 菜单初始化
		componentDidMount: function() {
			this.menuList();
		},
		// 加载菜单列表
		menuList: function() {
			$.get('/menu/list', function(result) {
				if (!result.error && this.isMounted()) {
					var results = result.results;

					for (var i = 0; i < results.length; i++) {
						if (!results[i].subMenus) {
							results[i].subMenus = [];
						}
					}
					var menuContent = results.length > 0? results[0]: {},
						stateData = {
							menusComp: <MenuList {...this.state.menuListProps} menuList={results}/>
						};

					// 初始化加载第一个菜单内容
					if (this.state.init) {
						stateData.init = false;
						stateData.menusContentComp = <MenuContent {...this.state.menuContentProps} content={menuContent}/>;
					}

					this.setState(stateData);
				} else {
					TUI.danger('菜单列表加载失败');
				}
			}.bind(this));
		},
		// 获取单个菜单信息
		getMenuInfo: function(objectId) {
			$.get('/menu/get/' + objectId, function(result) {
				if (!result.error) {
					this.setState({menusContentComp: <MenuContent {...this.state.menuContentProps} content={result}/>});
				}
			}.bind(this));
		},
		// 创建菜单
		createMenu: function(data) {
			$.post('/menu/create', data, function(result) {
				if (!result.error) {
					TUI.success('菜单“'+ data.name +'”创建成功');
					this.menuList();
				} else {
					TUI.danger('菜单“'+ data.name +'”创建失败');
				}
			}.bind(this));
		},
		// 更新菜单
		updateMenu: function(data) {
			$.post('/menu/update/' + data.objectId, data, function(result) {
				if (!result.error) {
					TUI.success('菜单“'+ data.name +'”保存成功');
					this.menuList();
				} else {
					TUI.danger('菜单“'+ data.name +'”保存失败');
				}
			}.bind(this));
		},
		// 删除菜单
		deleteMenu: function(objectId, name) {
			var that = this;
			var modalProps = {
				id: 'delMenuModal',
				title: '删除确认',
				content: '<div class="alert alert-warning">确定要删除菜单“'+ name +'”吗？</div>',
				confirm: function() {
					$.get('/menu/delete/' + objectId, function(result) {
						if (!result.error) {
							TUI.success('删除成功');
							that.menuList();
						} else {
							TUI.danger('删除失败');
						}
					});
					$('#' + modalProps.id).modal('hide');
				}
			};

			ReactDOM.render(
				<TUI.Modal {...modalProps} />,
				document.getElementById('container-modal')
			);

			$('#' + modalProps.id).modal('show');
		},
		render: function() {
			return (
				<div className="row tui-menu">
					<div className="col-md-3 col-sm-12 col-xs-12">
						{this.state.menusComp}
					</div>
					<div className="col-md-9 col-sm-12 col-xs-12">
						{this.state.menusContentComp}
					</div>
				</div>
			);
		}
	});
	
	// 菜单列表组件
	var MenuList = React.createClass({
		getInitialState: function() {
			return {
				isActive: false
			};
		},
		getMenuInfo: function(objectId) {
			this.props.getMenuInfo(objectId);
		},
		// 创建菜单
		createMenu: function(e) {
			e.preventDefault();

			var target = e.currentTarget.dataset,
				type = target.type || 'parent',
				data = { name: '菜单名称', type: 'view', url: '' };

			if (type === 'child') {
				data.name = '子菜单名称';
				data.parent = { '__type': 'object', objectId: target.parentid };
			}
			this.props.createMenu(data);
		},
		render: function() {
			return (
				<div className="list-group">
					{
						this.props.menuList.map(function(m, key) {
							return (<MenuItem 
										key={key} 
										getMenuInfo={this.getMenuInfo} 
										createMenu={this.createMenu} 
										m={m} />
									);
						}.bind(this))
					}
				  	<a href="javascript:;" className="list-group-item text-center" onClick={this.createMenu} data-type="parent"><span className="glyphicon glyphicon-plus" aria-hidden="true"></span>&nbsp;添加父菜单</a>
				</div>
			);
		}
	});

	var MenuItem = React.createClass({
		getInitialState: function() {
			return {
				isShow: false,
				subMenus: this.props.m.subMenus instanceof Array? this.props.m.subMenus: []
			};
		},
		getMenuInfo: function(e) {
			e.preventDefault();

			if (e.currentTarget.dataset.type === 'parent') {
				this.setState({ isShow: !this.state.isShow });
			}
			this.props.getMenuInfo(e.currentTarget.dataset.objectid);
		},
		render: function() {
			return (
				<div>
					<a id="tui-sidebar-a"href="javascript:;" className="list-group-item" onClick={this.getMenuInfo} data-objectid={this.props.m.objectId} data-type="parent">
						<span><i className={this.props.m.iconClass + ' fa-fw'}></i>&nbsp;{this.props.m.name}</span>
					</a>
					<ul className={this.state.isShow == false? 'tui-menu-child-ui hide': 'tui-menu-child-ui show'}>
						{
							this.props.m.subMenus.map(function(sub, key) {
								return (
									<li key={key} onClick={this.getMenuInfo} data-objectid={sub.objectId} data-type="child"><i className={sub.iconClass}></i>&nbsp;{sub.name}</li>
								);
							}.bind(this))
						}
						<li className="text-center" onClick={this.props.createMenu} data-parentid={this.props.m.objectId} data-type="child"><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></li>
					</ul>
				</div>
			);
		}
	});

	// 菜单内容组件
	var MenuContent = React.createClass({
		getInitialState: function() {
			var content = {
				name: this.props.content.name,
				iconClass: this.props.content.iconClass,
				url: this.props.content.url
			};

			return {
				content: content
			};
		},
		componentWillReceiveProps: function(nextProps) {
			var content = {
				name: nextProps.content.name,
				iconClass: nextProps.content.iconClass,
				url: nextProps.content.url
			};

			this.setState({ content: content });
		},
		// onChange
		handleChange: function(e) {
			var content = this.state.content;
			content[e.target.name] = e.target.value;

			this.setState({ content: content });
		},
		// 更新菜单
		updateMenu: function() {
			var data = {
				objectId: this.props.content.objectId,
				name: this.refs.name.value,
				iconClass: this.refs.iconClass.value,
				url: this.refs.url.value
			};

			this.props.updateMenu(data);
		},
		// 删除菜单
		deleteMenu: function(e) {
			e.preventDefault();

			this.props.deleteMenu(this.props.content.objectId, this.props.content.name);
		},
		render: function() {
			return (
				<div className="well" style={{'marginTop': '0'}}>
					<div className="page-header tui-page-header">
						<a href="#tui-modal" className="pull-right" onClick={this.deleteMenu}><i className="fa fa-trash-o"></i>&nbsp;删除菜单</a>
						<h4><i className={this.props.content.iconClass}></i>&nbsp;{this.props.content.name}</h4>
					</div>
					<form className="form-horizontal" style={{'marginTop': '30px'}}>
						<div className="form-group">
							<label className="col-sm-2 control-label">菜单名称</label>
						    <div className="col-sm-4">
						      	<input type="text" className="form-control" name="name" ref="name" placeholder="菜单名称" value={this.state.content.name} onChange={this.handleChange}/>
						    </div>
						</div>
						<div className="form-group">
							<label className="col-sm-2 control-label">URL</label>
						    <div className="col-sm-4">
						      	<input type="text" className="form-control" name="url" ref="url" placeholder="url，父级菜单无须填写" value={this.state.content.url} onChange={this.handleChange}/>
						    </div>
						</div>
						<div className="form-group">
							<label className="col-sm-2 control-label">图标 Class</label>
						    <div className="col-sm-4">
						      	<input type="text" className="form-control" name="iconClass" ref="iconClass" placeholder="图标class" value={this.state.content.iconClass} onChange={this.handleChange}/>
						    </div>
						</div>
						<div className="form-group">
						    <div className="col-sm-4 col-sm-offset-2">
						    	<button type="button" className="ebtn ebtn-success ebtn-rounded ebtn-lg" onClick={this.updateMenu}>保存</button>
						    </div>
						</div>
					</form>
				</div>
			);
		}
	});

	// 菜单管理
	TUI.Menu = Menu;

    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = TUI;
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function() { return TUI; });
    } else {
        window.TUI = TUI;
    }
}).call(function() {
	return this || (typeof window !== 'undefined' ? window : global);
});