/**
 * TUI
 */
;(function(){
	if (typeof jQuery === 'undefined' || typeof React === 'undefined') {
		throw new Error('TUI requires jQuery and React.');
	}

	var TUI = {
		version: '1.1.7'
	};

	/**
	 * 实体详情 父组件
	 * EntityField:  实体字段 子组件
	 * EntityHandle: 实体操作 子组件
	 * EntityText:   input text 子组件
	 * EntitySelect: input text 子组件
	 */
	var EntityDetail = React.createClass({
		getInitialState: function() {
			var fields = this.props.entity.fields,
				fieldsState = {};

			for (var f in fields) {
				var field = fields[f];
				fieldsState[field.field] = { message: '' };
			}

			return {
				fields: fieldsState
			};
		},
		create: function() {
			var entity = this.props.entity;

			try {

				if (this.validators()) {
					var backList = this.props.backList,
						currentPage = 1,
						formId = this.props.formId,
						create = entity.create,
						// 默认创建url
						url = create? create.url: '',
						method = create? create.method: '',
						callback = create? create.callback: '';

					if (this.refs[entity.key].value !== '') {
						url = entity.update.url;
						method = entity.update.method;
						callback = entity.update.callback;
						currentPage = this.props.currentPage;
					}

					if (url && typeof callback === 'function') {
						Loading({ text: '正在处理' });

						$.ajax({
							method: method || 'POST',
							url: url,
							data: $('#' + formId).serialize(),
							dataType: 'JSON',
							success: function(result) {
								Loading({ className: 'hide' });
								if (callback(result) === 'success') {
									TUI.success('保存成功');
									$('#' + formId + ' button[type=reset]').click();
									backList(true, currentPage);
								} else {
									TUI.danger('保存失败');
								}
							},
							error: function(xhr, error, obj) {
								Loading({ className: 'hide' });
								TUI.danger(url + '远程调用异常［' + error + ', ' + obj + '］');
								throw new Error(url + '远程调用异常［' + error + ', ' + obj + '］');
							}
						});
					} else {
						TUI.danger('保存实体配置有误，使用说明请查看［entity.create和entity.update］');
					}
				}
			} catch(e) {
				TUI.danger('保存实体配置有误，' + e);
				throw new Error('保存实体配置有误，' + e);
			}
		},
		validators: function() {
			var fields = this.props.entity.fields,
			// 序列化表单数据
				dataArr = $('#' + this.props.formId).serializeArray(),
				data = {},
				// 不符合条件的个数
				inconformityNum = 0;

			// 由于refs无法获得子组件的值，所以使用jquery序列化表单后转换为对象
			for (var i = 0; i < dataArr.length; i++) {
				var fieldArr = dataArr[i];

				data[fieldArr['name']] = fieldArr['value'];
			}

			for (var f in fields) {
				var field = fields[f],
					validators = field.validators,
					disabled = field.disabled === undefined? false: field.disabled,
					readOnly = field.readOnly === undefined? false: field.readOnly;

				if ((disabled === false || readOnly === false) && typeof validators === 'object') {
					var value = data[field.field],
						notEmpty = validators.notEmpty,
						remote = validators.remote,
						fieldsState = this.state.fields;

					// 清除提示
					if (fieldsState[field.field].message.length > 0) {
						fieldsState[field.field] = { message: '' };
						this.setState({ fields: fieldsState });
					}

					// 非空
					if (typeof notEmpty === 'object' && value.length < 1) {
						fieldsState[field.field] = { message: notEmpty.message || field.text + '不能为空' };
						this.setState({ fields: fieldsState });

						inconformityNum++;
					}
					// 远程方法验证 返回json格式 {valid: true}
					else if (typeof remote === 'object') {

						$.ajax({
							type: 'GET',
							async: false,
							url: remote.url,
							data: {
								key: remote.data.key,
								value : field.field === field.field? encodeURI(value): remote.data.value
							},
							success: function(result) {
								if (!result.valid) {
									// 不通过
									inconformityNum++;
									fieldsState[field.field] = { message: remote.message || field.text + '错误' };
									this.setState({ fields: fieldsState });
								}
							}.bind(this),
							error: function(xhr, error, obj) {
								TUI.danger('TUI: remote url['+ remote.url +']远程调用异常，' + error + ', ' + obj);
								throw new Error('TUI: remote url['+ remote.url +']远程调用异常，' + error + ', ' + obj);
							}
						});

						
					}
				}
			}

			if (inconformityNum === 0) {
				return true;
			} else {
				return false;
			}
		},
		render: function() {
			var className = 'form-horizontal ' + this.props.className,
				entityData = this.props.entityData,
				// 主键
				key = this.props.entity.key,
				// 主键值
				keyValue = '';

			if (typeof entityData === 'object' && entityData[key] !== '') {
				keyValue = entityData[key];
			}

			return (
				<form id={this.props.formId} className={className}>
					<input type="hidden" ref={key} name={key} value={keyValue}/>
					<div className="form-group">
						<a href="javascript:;" className="col-sm-2" onClick={this.props.backList}><i className="fa fa-arrow-left"></i>&nbsp;返回列表</a>
					</div>
					<hr/>
					{
						this.props.entity.fields.map(function(f, key) {
							return (
								<div key={key} className="form-group">
									<label className="col-sm-2 control-label">{f.text}</label>
								    <div className="col-sm-8">
								    	<EntityField 
								    		keyValue={keyValue}
								    		field={f}
								    		entityData={entityData} />
								    	<span className="tui-error">{this.state.fields[f.field].message}</span>
								    </div>
								</div>
							);
						}.bind(this))
					}
					<EntityHandle
						keyValue={keyValue}
						backList={this.props.backList}
						create={this.create}
						update={this.props.entity.update}
						entityData={entityData}
						custom={this.props.entity.custom || []} />
				</form>
			);
		}
	});
	
	/**
	 * 实体字段
	 */
	var EntityField = React.createClass({
		render: function() {
			var entityData = this.props.entityData,
				field = this.props.field,
				type = field.type || 'text',
				fieldDOM = '',
				fieldProps = {
					type: type,
					field: field,
					entityData: entityData,
					keyValue: this.props.keyValue
				};

			switch(type) {
				case 'text':
					fieldDOM = <EntityText {...fieldProps} />;
					break;
				case 'select':
					fieldDOM = <EntitySelect {...fieldProps} />;
					break;	
				case 'radio':
					fieldDOM = <EntityRadio {...fieldProps} />;
					break;	
				case 'textarea':
					fieldDOM = <EntityTextarea {...fieldProps} />;
					break;	
				case 'editor':
					fieldDOM = <EntityEditor {...fieldProps} />;
					break;	
				default:
					fieldDOM = <EntityText {...fieldProps} />;
					break;
			}

			return fieldDOM;
		}
	});
	
	/**
	 * 实体操作
	 * 添加，修改
	 */
	var EntityHandle = React.createClass({
		customHandle: function(e) {
			// 处理方法返回值，返回success则刷新页面
			var handleRet = this.props.custom[e.target.dataset.customid].handle(this.props.entityData);

			if (handleRet && handleRet === 'success') {
				this.props.backList(true);
			}
		},
		render: function() {
			var entityData = this.props.entityData,
				keyValue = this.props.keyValue,
				update = this.props.update,
				createOrUpdateDOM = '';

			if (keyValue === undefined) {
				createOrUpdateDOM = <button type="button" className="ebtn ebtn-success ebtn-rounded tui-mr5" onClick={this.props.create}>添加</button>;
			} else if (keyValue !== '' && update) {

				if (update.condition && typeof update.condition === 'function') {
					// 如果有condition条件的话，符合条件的才有修改按钮，返回success表示符合
					if (update.condition(entityData) === 'success') {
						createOrUpdateDOM = <button type="button" className="ebtn ebtn-success ebtn-rounded tui-mr5" onClick={this.props.create}>保存</button>;
					}
				} else {
					createOrUpdateDOM = <button type="button" className="ebtn ebtn-success ebtn-rounded tui-mr5" onClick={this.props.create}>保存</button>;
				}
			}

			return (
				<div className="form-group">
					<div className="col-sm-4 col-sm-offset-2">
						{createOrUpdateDOM}
						<button type="button" className="ebtn ebtn-default ebtn-rounded tui-mr5" onClick={this.props.backList}>取消</button>
						{
							this.props.custom.map(function(c, key) {
								return (
									<button key={key} type="button" className={'tui-mr5 ' + c.className} onClick={this.customHandle} data-customid={key}>{c.text}</button>
								);
							}.bind(this))
						}
						<button type="reset" style={{'display': 'none'}}>重置</button>
					</div>
				</div>
			);
		}
	});

	/**
	 * 表单组件之input
	 */
	var EntityText = React.createClass({
		getInitialState: function() {
			return {
				value: ''
			};
		},
		shouldComponentUpdate: function(nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || 
					this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value });
				return true;
			}
			return false;
		},
		entityTextChangeHandle: function(e) {
			this.setState({ value: e.target.value });
		},
		render: function() {
			var field = this.props.field,
				entityData = this.props.entityData;

			if (this.props.keyValue !== '') {
				return (
					<input type={this.props.type} className="form-control" name={field.field} ref={field.field} placeholder={field.placeholder || field.text} value={this.state.value} onChange={this.entityTextChangeHandle} disabled={field.disabled || false} readOnly={field.readOnly || false} />
				);
			} else {
				return (
					<input type={this.props.type} className="form-control" name={field.field} ref={field.field} placeholder={field.placeholder || field.text} defaultValue=""/>
				);
			}
		}
	});

	/**
	 * 表单组件之select
	 */
	var EntitySelect = React.createClass({
		getInitialState: function() {
			return {
				value: '',
				options: {
					rows: []
				}
			};
		},
		componentDidMount: function() {
			var options = this.props.field.options;
			// 是字符串或非数组，表示select需要远程加载
			if (typeof options === 'string' || options instanceof Array === false) {
				var isObj = typeof options === 'object',
					url = isObj? options.url: options;

				$.get(url, function(result) {
					if (this.isMounted()) {
						// 重新赋值
						options = this.props.field.options;

						var options = {
							rows: result,
							textField: isObj? options.textField: 'text',
							valueField: isObj? options.valueField: 'value'
						};

						this.setState({ options: options })
					}
				}.bind(this));
			}
		},
		shouldComponentUpdate: function(nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || 
					this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value });
				return true;
			}
			return false;
		},
		entitySelectChangeHandle: function(e) {
			this.setState({ value: e.target.value });
		},
		render: function() {
			var field = this.props.field;

			if (field.options instanceof Array) {
				return (
					<select ref={field.field} name={field.field} className="form-control" value={this.state.value} onChange={this.entitySelectChangeHandle}>
					{
						field.options.map(function(op, key) {
							return <option key={key} value={op.value}>{op.text}</option>;
						}.bind(this))
					}
					</select>
				);
			} else {
				return (
					<select ref={field.field} name={field.field} className="form-control" value={this.state.value} onChange={this.entitySelectChangeHandle}>
					{
						this.state.options.rows.map(function(op, key) {
							return <option key={key} value={op[this.state.options.valueField]}>{op[this.state.options.textField]}</option>;
						}.bind(this))
					}
					</select>
				);
			}

		}
	});

	/**
	 * 表单组件之radio
	 */
	var EntityRadio = React.createClass({
		getInitialState: function() {
			return {
				value: ''
			};
		},
		shouldComponentUpdate: function(nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || 
					this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value });
				return true;
			}
			return false;
		},
		entityRadioChangeHandle: function(e) {
			this.setState({ value: e.target.value });
		},
		render: function() {
			var field = this.props.field,
				value = '';

			if (this.props.keyValue !== '') {
				value = this.props.entityData[field.field];
			}

			return (
				<p className="form-control-static">
				{
					field.options.map(function(op, key) {
						var radioDOM = '';

						if (!value) {
							radioDOM = <input type="radio" ref={field.field} name={field.field} value={op.value} />;
						} else {
							radioDOM = <input checked={this.state.value == op.value} type="radio" ref={field.field} name={field.field} value={op.value} onChange={this.entityRadioChangeHandle}/>;
						}
						return (
							<span key={key} style={{'marginRight': '10px'}}>
								<label className="tui-label">{op.text}</label>&nbsp;{radioDOM}
							</span>
						);
					}.bind(this))
				}
				</p>
			);
		}
	});
	
	/**
	 * 表单组件之textarea
	 */
	var EntityTextarea = React.createClass({
		getInitialState: function() {
			return {
				value: ''
			};
		},
		shouldComponentUpdate: function(nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || 
					this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value });
				return true;
			}
			return false;
		},
		entityTextareaChangeHandle: function(e) {
			this.setState({ value: e.target.value });
		},
		render: function() {
			var field = this.props.field;

			if (this.props.keyValue === '') {
				return (
					<textarea rows="5" className="form-control" name={field.field} ref={field.field} placeholder={field.text} />
				);
			} else {
				return (
					<textarea rows="5" className="form-control" name={field.field} ref={field.field} placeholder={field.text} value={this.state.value} onChange={this.entityTextareaChangeHandle} disabled={field.disabled || false} readOnly={field.readOnly || false}/>
				);
			}
		}
	});
	
	/**
	 * 表单组件之编辑器
	 */
	var EntityEditor = React.createClass({
		getInitialState: function() {
			return {
				editor: {}
			}
		},
		shouldComponentUpdate: function(nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || 
					this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				var editor = this.state.editor;
				if (value === undefined) {
					value = '';
				}
				editor.setValue(value);
			}
			return false;
		},
		componentDidMount: function() {
			// 编辑器DOM渲染后开始实例化
			if (this.isMounted()) {
				var toolbar = [ 'title', 'bold', 'italic', 'underline', 'strikethrough',  
            					'color', '|', 'ol', 'ul', 'blockquote', 'code', 'table', '|',  
            					'link', 'image', 'hr', '|', 'indent', 'outdent' ];

				var editor = new Simditor({
					textarea: $('#' + this.props.field.field),
  					toolbar: toolbar,  //工具栏 
  					upload: {  
			            url: TUI.config.simditor.url, //文件上传的接口地址  
			            params: null, //键值对,指定文件上传接口的额外参数,上传的时候随文件一起提交  
			            fileKey: 'fileDataFileName', //服务器端获取文件数据的参数名  
			            connectionCount: 3,  
			            leaveConfirm: '正在上传文件'  
			        }
			    });

			    this.setState({ editor: editor });
			}
		},
		render: function() {
			var field = this.props.field;

			if (this.props.keyValue === '') {
				return (
					<textarea id={field.field} rows="5" className="form-control" name={field.field} ref={field.field} placeholder={field.text} />
				);
			} else {
				return (
					<textarea id={field.field} rows="5" className="form-control" name={field.field} ref={field.field} placeholder={field.text} />
				);
			}
		}
	});

	/**
	 * TUI Table 表格组件
	 * Parent
	 */
	var TableComp = React.createClass({
		// 初始化表格
		getInitialState: function() {
			var searchbar = this.props.options.searchbar,
				toolbar = this.props.options.toolbar,
				searchbarCols = [],
				searchbarProps= {},
				pagination = this.props.options.pagination,
				formId = this.props.options.formId || 'tui-' + Math.random().toString(36).substr(2);

			// 初始化筛选工具栏
			if (searchbar instanceof Array && searchbar.length > 0) {

				for (var i = 0; i < searchbar.length; i++) {
					if (typeof searchbar[i] === 'object' && searchbar[i].field) {
						searchbarCols.push({field: searchbar[i].field, type: searchbar[i].type || 'text'});
					}
				}

				searchbarProps.searchbar = searchbar;
				searchbarProps.searchbarCols = searchbarCols;
				searchbarProps._pagingClick = this._pagingClick;
				searchbarProps.goCreate = this.goCreate;
				searchbarProps.formId = formId;
				// 是否有添加按钮
				searchbarProps.hasAdd = this.props.entity && this.props.entity.create? true: false;
				searchbar = <SearchBar {...searchbarProps} />;
			} else {
				searchbar = <SearchBar searchbar={[]} goCreate={this.goCreate} hasAdd={this.props.entity && this.props.entity.create? true: false} />;
			}

			// 初始化功能性工具栏
			if (toolbar instanceof Array && toolbar.length > 0) {
				toolbar = <ToolBar toolbar={toolbar} />;
			} else {
				toolbar = <ToolBar toolbar={[]} />;
			}

			return {
				formId: formId,
				// 是否显示实体详情
				isShowEntityDetail: false,
				searchbar: searchbar,
				toolbar: toolbar,
				searchbarCols: searchbarCols,
				tableDataProps: {},
				// 是否显示分页 默认true显示
				pagination: typeof pagination === 'boolean' && 
									pagination === true || 
									typeof pagination === 'undefined'? '正在加载分页...': '',
				// 当前页					
				currentPage: 1,
				maxSize: typeof this.props.options.maxSize === 'number'? this.props.options.maxSize: 10
			};
		},
		// 初次调用表格
		componentDidMount: function() {
			if (this.props.options.url) {
				this._loadData(1);
			}
		},
		componentWillReceiveProps: function(nextProps) {
			if (nextProps.options.refresh) {
				this.refresh(this.state.currentPage);
			}
		},
		// 分页按钮
		_pagingClick: function(e) {
			e.preventDefault();
			this._loadData(e.currentTarget.dataset.page);
		},
		// 返回列表
		backList: function(isRefresh, currentPage) {
			// 清空提示信息
			$('#find-' + this.state.formId).find('.tui-error').text('');
			this.setState({ isShowEntityDetail: false, entityData: {} });

			isRefresh = typeof isRefresh === 'boolean'? isRefresh: false;

			if (isRefresh) {
				this.refresh(currentPage);
			}
		},
		// 刷新
		refresh: function(currentPage) {
			this._loadData(this.state.currentPage);
		},
		// 改变分页最大显示数
		changeMaxSize: function(maxSize) {
			this.setState({ maxSize: maxSize });
			this._loadData(this.state.currentPage, maxSize);
		},
		// 加载数据
		_loadData: function(currentPage, maxSize) {
			Loading();

			var url = this.props.options.url,
				searchbarCols = this.state.searchbarCols,
				searchbarData = {};

			var ajaxData = this.props.options.data || { random: Math.random() };
				
			ajaxData.maxSize = maxSize || this.state.maxSize;
			ajaxData.currentPage = currentPage || 1;	   	

			// 筛选条件
			for (var i = 0; i < searchbarCols.length; i++) {

				var searchcol = searchbarCols[i].field,
					value = '';

				switch(searchbarCols[i].type) {
					case 'text':
						value = $('#' + this.state.formId).find('input[name='+ searchcol +']').val();
						break;
					case 'radio':
						value = $('#' + this.state.formId).find('input[name='+ searchcol +']:checked').val();
						break;	
					default:
						value = $('#' + this.state.formId).find('[name='+ searchcol +']').val();
						break;	
				}

				if (value) {
					ajaxData[searchcol] = value;
				}
			}		

			$.ajax({
				url: url,
				data: ajaxData,
				dataType: 'JSON',
				success: function(result) {
					Loading({ className: 'hide' });
					if (typeof result === 'object' 
							&& result.rows !== undefined 
							&& result.rowCount !==undefined) {

						if (this.isMounted()) {

							var pagination = this.props.options.pagination;

							var tableDataProps = { options: this.props.options, isCheckAll: false },
								paginationProps = {
													rowCount: result.rowCount, 
													currentPage: ajaxData.currentPage,
													maxSize: ajaxData.maxSize,
													_pagingClick: this._pagingClick,
													changeMaxSize: this.changeMaxSize
												};

							this.setState({
								rows: result.rows,
								tableDataProps: tableDataProps,
								pagination: typeof pagination === 'boolean' &&
												pagination === true ||
												typeof pagination === 'undefined'? 
												<Pagination {...paginationProps} />: '',
								currentPage: ajaxData.currentPage
							});
						}
					} else {
						TUI.danger('TUI Table 远程调用返回数据格式不正确［未检测到rows，rowCount］');
						throw new Error('TUI Table 远程调用返回数据格式不正确［未检测到rows，rowCount］');
					}
				}.bind(this),
				error: function(xhr, error, obj) {
					Loading({ className: 'hide' });
					TUI.danger('TUI Table 远程调用异常［' + error + ', ' + obj + '］');
					throw new Error('TUI Table 远程调用异常［' + error + ', ' + obj + '］');
				}
			});
		},
		// 删除事件
		deleteHandle: function(retDelete) {
			var refresh = this.refresh;

			var modalProps = {
				id: 'delModal',
				title: '删除确认',
				content: '<div class="alert alert-warning">确定要删除该条纪录吗？</div>',
				confirm: function() {
					$.ajax({
						method: retDelete.method || 'get',
						url: retDelete.url,
						success: function(result) {
							// 成功返回success
							if (retDelete.callback(result) === 'success') {
								TUI.success('删除成功');
								refresh();
							} else {
								TUI.danger('删除失败');
							}
						},
						error: function(xhr, error, obj) {
							$('#' + modalProps.id).modal('hide');
							TUI.danger(retDelete.url + '远程调用异常［' + error + ', ' + obj + '］');
							throw new Error(retDelete.url + '远程调用异常［' + error + ', ' + obj + '］');
						}
					});

					return 'success';
				}
			};

			Modal(modalProps);
		},
		//  查看事件
		findHandle: function(retFind) {
			Loading();

			$.ajax({
				method: retFind.method || 'GET',
				url: retFind.url,
				success: function(result) {
					Loading({ className: 'hide' });

					// 查看操作是否有callback
					if (typeof retFind.callback === 'function') {
						result = retFind.callback(result);
					}
					
					this.goCreate(result);
				}.bind(this),
				error: function(xhr, error, obj) {
					Loading({ className: 'hide' });
					TUI.danger(retFind.url + '远程调用异常［' + error + ', ' + obj + '］');
					throw new Error(retFind.url + '远程调用异常［' + error + ', ' + obj + '］');
				}
			});
		},
		// 显示添加或编辑页面
		goCreate: function(entityData) {
			if (typeof this.props.entity === 'object' && this.props.entity.fields instanceof Array) {
				this.setState({ isShowEntityDetail: true, entityData: entityData });
			} else {
				TUI.danger('请先添加实体属性，使用说明请看［entity.fields］');
			}
		},
		// checkbox处理事件
		handlerCheckForParent: function(index, isCheck) {
			this.state.rows[index].isCheck = isCheck;
			this.setState({
				rows: this.state.rows
			});
		},
		checkAll: function(isCheck) {
			this.state.rows.map(function(row, key) {
				row.isCheck = isCheck;

				return row;
			});
			this.state.tableDataProps.isCheckAll = isCheck;

			this.setState({rows: this.state.rows, tableDataProps: this.state.tableDataProps});
		},
		// 渲染表格和分页
		render: function() {
			var entityDetail = '';

			if (this.props.entity) {
				entityDetail = <EntityDetail
									className={this.state.isShowEntityDetail? 'show': 'hide'}
									formId={'find-' + this.state.formId}
									backList={this.backList} 
									entity={this.props.entity}
									entityData={this.state.entityData}
									currentPage={this.state.currentPage} />
			}

			return (
				<div className="well">
					<form id={this.state.formId} className={this.state.isShowEntityDetail? 'hide': 'show'}>
						{this.state.searchbar}
						{this.state.toolbar}
						<TableData
							rows={this.state.rows} 
							{...this.state.tableDataProps} 
							handlerCheckForParent={this.handlerCheckForParent} 
							checkAll={this.checkAll}
							deleteHandle={this.deleteHandle} 
							findHandle={this.findHandle}
							refresh={this.refresh} />
						{this.state.pagination}
					</form>

					{entityDetail}
				</div>	
			);
		}
	});
	
	/**
	 * TUI Table 表格组件-筛选条件工具栏
	 * Children
	 */
	var SearchBar = React.createClass({
		dateFocus: function(e) {
			TUI.datePicker(e, this.props.formId);
		},
		render: function() {
			// 添加按钮
			var addBtn = <button type="button" className="ebtn ebtn-success ebtn-rounded" onClick={this.props.goCreate}><span className="glyphicon glyphicon-plus" aria-hidden="true"></span>&nbsp;添加</button>;

			if (!this.props.hasAdd) {
				addBtn = '';
			}

			if (this.props.searchbar.length === 0 && this.props.hasAdd) {
				return (
					<div className="tui-searchbar">
						<div className="form-group">
							{addBtn}
						</div>
					</div>
				);
			} else if (this.props.searchbar.length > 0) {
				return (
					<div className="tui-searchbar">
						{
							this.props.searchbar.map(function(obj, key) {

								if (typeof obj === 'object') {
									var type = obj.type || 'text',
										searchbarDOM = '';

									switch(type) {
										// 文本框
										case 'text':
											searchbarDOM = (
												<div className="form-group" key={key}>
													<label htmlFor={obj.field}>{obj.text}</label>
													<input id={obj.field} name={obj.field} type="text" ref={obj.field} className="form-control" placeholder={obj.placeholder || obj.text}/>&nbsp;
												</div>
											);
											break;
										// 下拉框
										case 'select':
											var options = obj.options,
												optionsArr = [];

											// 是字符串或非数组，表示select需要远程加载
											if (typeof options === 'string' || options instanceof Array === false) {
												var isObj = typeof options === 'object',
													url = isObj? options.url: options,
													textField = isObj? options.textField: 'text',
													valueField = isObj? options.valueField: 'value';

												$.ajax({
													method: 'GET',
													async: false,
													url: url,
													success: function(result) {
														optionsArr.push(<option value="">不限</option>);

														for (var i = 0; i < result.length; i++) {
															optionsArr.push(<option value={result[i][valueField]}>{result[i][textField]}</option>);
														}

														searchbarDOM = (
															<div className="form-group">
																<label htmlFor={obj.field}>{obj.text}</label>
																<select id={obj.field} name={obj.field} className="form-control" key={key}>{optionsArr}</select>&nbsp;
															</div>
														);		
													},
													error: function(xhr, error, obj) {
														TUI.danger(url + '远程调用异常［' + error + ', ' + obj + '］');
													}
												});
												break;											
											} else {

												optionsArr.push(<option value="">不限</option>);

												for (var i = 0; i < obj.options.length; i++) {
													optionsArr.push(<option value={obj.options[i].value}>{obj.options[i].text}</option>);
												}

												searchbarDOM = (
													<div className="form-group">
														<label htmlFor={obj.field}>{obj.text}</label>
														<select id={obj.field} name={obj.field} className="form-control" key={key}>{optionsArr}</select>&nbsp;
													</div>
												);

												break;
											}
										// 单选按钮
										case 'radio':
											var options = [];
											for (var i = 0; i < obj.options.length; i++) {
												options.push(<label><input type="radio" name={obj.field} value={obj.options[i].value} />{obj.options[i].text}</label>);
											}

											searchbarDOM = (
												<div className="form-group" key={key}>
													<label htmlFor={obj.field}>{obj.text}</label>
													{options}
												</div>
											);
											break;
										// 日期控件
										case 'date':
											searchbarDOM = (
												<div className="form-group" key={key}>
													<label htmlFor={obj.field}>{obj.text}</label>
													<input id={obj.field} name={obj.field} type="text" ref={obj.field} className="form-control" onFocus={this.dateFocus} onBlur={this.dateBlur} placeholder={obj.placeholder || obj.text} />&nbsp;
												</div>
											);
											break;
										default:
											break;
									}

									return searchbarDOM;
								} else {
									return '';
								}
							}.bind(this))
						}
						<div className="form-group">
							&nbsp;<button type="button" className="ebtn ebtn-primary ebtn-rounded" onClick={this.props._pagingClick} data-page="1">查询</button>
							&nbsp;<button type="reset" className="ebtn ebtn-default ebtn-rounded">重置</button>
							&nbsp;{addBtn}
						</div>
					</div>
				);			
			} else {
				return (
					<div className="tui-searchbar"></div>
				);
			}
		}
	});

	/**
	 * TUI Table 表格组件-工具栏
	 * Children
	 */
	var ToolBar = React.createClass({
		render: function() {
			return (
				<div className="tui-toolbar">
					{
						this.props.toolbar.map(function(tb, key) {
							var type = tb.type || 'button',
								tbDOM = '';

							switch(type) {
								case 'button':
									tbDOM = <button className={(tb.className? tb.className: 'btn btn-primary') + ' tui-mr5'} type="button" onClick={tb.handle}>{tb.text}</button>;
									break;
								case 'checkbox':
									var id = tb.id || '',
										name = tb.name || '',
										checked = tb.checked || false;

									tbDOM = <div><label htmlFor={id} className="tui-mr5">{tb.text}</label><input type="checkbox" id={id} name={name} style={{'width': '15', 'height': '15'}} defaultChecked={tb.checked} /></div>;
									break;	
								default:
									tbDOM = <button className={(tb.className? tb.className: 'btn btn-primary') + ' tui-mr5'} type="button" onClick={tb.handle}>{tb.text}</button>;
									break;	
							};
							return (
								<div className="form-group">{tbDOM}</div>
							);
						})
					}
				</div>
			);
		}
	});

	/**
	 * TUI Table 表格组件-表格数据渲染
	 * Children
	 */
	var TableData = React.createClass({
		_checkAll: function(e) {
			this.props.checkAll(e.target.checked);
		},
		render: function() {
			if (!this.props.rows || !this.props.options) {
				return (<p>正在加载数据...</p>);
			}

			return (
				<div className="tui-table-div">
					<table className="tui-table table-striped">
						<thead className="tui-thead-default">
						    <tr>
						    	{
						    		this.props.options.columns.map(function(col, key) {
						    			var colContent = col.text;

						    			if (col.checkbox) {
						    				colContent = <input type="checkbox" checked={this.props.isCheckAll} onChange={this._checkAll}/>
						    			}
						    			return (<th key={key} style={{'width': col.width? col.width: 'auto'}}>{colContent}</th>);
						    		}.bind(this))
						    	}
						    	<td></td>
						    </tr>
					  	</thead>
					  	<tbody className="tui-tbody-default">
					  		{
								this.props.rows.map(function(row, key) {
									row.isCheck = row.isCheck || false;

									var tableRowProps = {
										row: row,
										rowHandles: this.props.options.rowHandles,
										columns: this.props.options.columns,
										index: key,
										handlerCheckForParent: this.props.handlerCheckForParent,
										deleteHandle: this.props.deleteHandle,
										findHandle: this.props.findHandle,
										refresh: this.props.refresh
									};

									return (<TableRow key={key} {...tableRowProps}/>);
								}.bind(this))
							}

					  	</tbody>
					</table>
				</div>
			);
		}
	});
	
	/**
	 * TUI TableRow 表格组件－行
	 * @type {[type]}
	 */
	var TableRow = React.createClass({
		deleteHandle: function(e) {
			e.preventDefault();

			var rowHandles = this.props.rowHandles;

			if (rowHandles && typeof this.props.rowHandles.delete === 'function') {
				var retDelete = rowHandles.delete(this.props.row);

				if (typeof retDelete === 'object' && retDelete.url) {
					this.props.deleteHandle(retDelete);
				} else {
					TUI.danger('删除事件缺少返回值［url］');
				}
			} else {
				TUI.danger('请配置删除事件，参考属性［rowHandles.delete］');
			}
		},
		findHandle: function(e) {
			e.preventDefault();

			var rowHandles = this.props.rowHandles;

			if (rowHandles && typeof this.props.rowHandles.find === 'function') {
				var retFind = rowHandles.find(this.props.row);

				if (typeof retFind === 'object' && retFind.url) {
					this.props.findHandle(retFind);
				} else {
					TUI.danger('查看事件缺少返回值［url］');
				}
			} else {
				TUI.danger('请配置查看事件，参考属性［rowHandles.find］');
			}
		},
		handlerCheck: function() {
			var isCheck = !this.props.row.isCheck;
			this.props.handlerCheckForParent(this.props.index, isCheck);
		},
		// 自定义操作
		customHandles: function(e) {
			e.preventDefault();
			this.props.rowHandles.custom[e.currentTarget.dataset.customid].handle(this.props.row);
			// if (handleRet && handleRet === 'success') {
			// 	this.props.refresh();
			// }
		},
		render: function() {
			var rowHandles = this.props.rowHandles,
				rowHandlesDOM = [];

			if (rowHandles) {
				// 查看
				if (typeof rowHandles.find === 'function') {
					rowHandlesDOM.push(<a href="javascript:;" className="tui-mr5" title="详情" onClick={this.findHandle}><i className="fa fa-edit fa-lg"></i></a>);
				}

				// 删除
				if (typeof rowHandles.delete === 'function') {
					rowHandlesDOM.push(<a href="javascript:;" className="tui-mr5" title="删除" onClick={this.deleteHandle} style={{'marginRight': '5px'}}><i className="fa fa-trash-o fa-lg"></i></a>);
				}

				var customHandles = rowHandles.custom,
					customHandlesDOM = [];

				if (rowHandles.custom && customHandles instanceof Array) {

					for (var i = 0; i < customHandles.length; i++) {
						var custom = customHandles[i];

						customHandlesDOM.push(<li><a href="javascript:;" onClick={this.customHandles} data-customid={i}><i className={custom.className? custom.className: ''}></i>&nbsp;{custom.text}</a></li>);
					}
					rowHandlesDOM.push(<div className="btn-group">
										  <a href="javascript:;" className="dropdown-toggle tui-dropdown-menu" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
										    更多 <span className="caret"></span>
										  </a>
										  <ul className="dropdown-menu tui-dropdown-menu">{customHandlesDOM}</ul>
										</div>);
				}
			}

			return (
				<tr>
					{
						this.props.columns.map(function(col, key) {
							var row = this.props.row;

							// 是否有处理方法
							if (typeof col.handle === 'function') {
								var handleVal = col.handle(row);
								
								if (handleVal === undefined) {
									console.error('TUI Table column["'+ col.field +'"] is no return value.');
								}

								if (!col.field) {
									var _html = {__html: handleVal};

									return (<td key={key} dangerouslySetInnerHTML={_html}></td>);
								}

								return (<td key={key}>{handleVal}</td>);
							} 
							// 是否多级属性
							else if (col.field.indexOf('.') > 0) {
								var _colArr = col.field.split('.'),
									_colVal = '';

								try {
									for (var i = 0; i < _colArr.length; i++) {
										if (i === 0) {
											_colVal = row[_colArr[i]];
										} else {
											_colVal = _colVal[_colArr[i]];
										}
									}

									return (<td key={key}>{_colVal}</td>);
								} catch (e) {
									return (<td key={key}></td>);
								}
							}
							// 是否有chexkbox
							else if (col.checkbox) {
								return (<td key={key}><input type="checkbox" name={col.field} value={row[col.field]} checked={row.isCheck} onChange={this.handlerCheck}/></td>);
							} 
							// 默认
							else {
								return (<td key={key}>{row[col.field]}</td>);
							}
						}.bind(this))
					}
					<td>{rowHandlesDOM}</td>
				</tr>
			);
		}
	});
	
	/**
	 * TUI Pagination 表格组件-分页组件 
	 * Children
	 */
	var Pagination = React.createClass({
		changeMaxSize: function() {
			this.props.changeMaxSize(this.refs.maxSize.value);
		},
		render: function() {

			// 总纪录数
			var rowCount = Number(this.props.rowCount) || 0,
			// 当前页
				currentPage = Number(this.props.currentPage),
			// 每页显示纪录数，默认10条
				maxSize = this.props.maxSize,
			// 最大分页数
				maxPageCount = 5,
			// 总页数
				pageCount = rowCount % maxSize === 0? rowCount / maxSize: parseInt( rowCount / maxSize ) + 1;
			
			// 分页数DOM
			var pagesDOM = [],
				begin = 1,
				end = pageCount + 1;

			if ( pageCount > maxPageCount ) {

				if ( currentPage - 5 >= 0 ) {
					/**
					 * 限制每次最多展示5页 展示不同的页数算法也不一样
					 */
					begin = currentPage - 2;
					end = currentPage + 2;
					if ( currentPage >= pageCount - 3 ) {
						begin = pageCount - maxPageCount + 1;
						end = pageCount;
					}

					pagesDOM.push(<li key={1}><a href="javascript:;" onClick={this.props._pagingClick} data-page={1}>{1}...</a></li>);
					end++;
				} else {
					
					end = maxPageCount + 1;
				}
			}
			
			for (var i = begin; i < end; i++) {
				var _page = <li key={i}><a href="javascript:;" onClick={this.props._pagingClick} data-page={i}>{i}</a></li>;

				if (i === currentPage) {
					_page = <li key={i} className="active"><a href="javascript:;">{i}</a></li>;
				}

				pagesDOM.push(_page);		
			}

			if (pageCount - currentPage > 3) {
				pagesDOM.push(<li key={pageCount}><a href="javascript:;" onClick={this.props._pagingClick} data-page={pageCount}>...{pageCount}</a></li>);
			}

			return (
				<nav>
				  <ul className="pager">
				  	<li>
				  	<small style={{'marginRight': '10px'}}>
				  		<span>共有&nbsp;{rowCount}&nbsp;条,每页显示&nbsp;
				  			<select ref="maxSize" defaultValue={maxSize} onChange={this.changeMaxSize}>
				  				<option value="10">10</option>
				  				<option value="15">15</option>
				  				<option value="20">20</option>
				  				<option value="30">30</option>
				  				<option value="50">50</option>
				  				<option value="100">100</option>
				  			</select>
				  			&nbsp;条
				  		</span>
				  	</small>
				  	</li>
				    <li>
				    	<a href="javascript:;" style={{'padding': '2px 7px'}} onClick={currentPage === 1 || currentPage - 1 === 0? '': this.props._pagingClick} data-page={currentPage - 1}>
				    		<i className="fa fa-arrow-left"></i>
				    	</a>
				    </li>
				    {pagesDOM}
				    <li>
				    	<a href="javascript:;" style={{'padding': '2px 7px'}} onClick={currentPage === pageCount || currentPage + 1 > pageCount? '': this.props._pagingClick} data-page={currentPage + 1}>
				    		<i className="fa fa-arrow-right"></i>
				    	</a>
				    </li>
				  </ul>
			  	</nav>
			);
		}
	});

	/**
	 * 封装表格
	 */
	var Table = function(options, entity) {
		if (typeof options === 'object' && 
				options.container && 
				options.container.length > 0) {

			var targetContainer = document.getElementById(options.container);

			if (targetContainer) {
				var tableProps = {
					options: options,
					entity: entity
				};

				ReactDOM.render(<TableComp {...tableProps} />,
					document.getElementById(options.container)
				);
			} else {
				TUI.danger('目标容器['+ options.container +']不存在');
				console.error('目标容器['+ options.container +']不存在');
			}
		} else {
			TUI.danger('TUI Table：请提供一个[container]容器');
			console.error('TUI Table：请提供一个[container]容器');
		}
	};

	/**
	 * TUI Modal 模态框组件
	 */
	var _Modal = React.createClass({
		confirm: function() {
			if (this.props.confirm() === 'success') {
				$('#' + this.props.id).modal('hide');
			}
		},
		render: function() {
			var content = {__html: this.props.content},
				confirmBtn = '';

			if (typeof this.props.confirm === 'function') {
				confirmBtn = <button type="button" className="ebtn ebtn-success ebtn-rounded" onClick={this.confirm}>确定</button>;
			}	

			return (
				<div id={this.props.id} className="modal fade" tabIndex="-1" role="dialog" aria-labelledby={this.props.id + 'Label'} aria-hidden="true">
				  <div className="modal-dialog" role="document">
				    <div className="modal-content">
				      <div className="modal-header">
				        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
				          <span aria-hidden="true">&times;</span>
				          <span className="sr-only">Close</span>
				        </button>
				        <h4 className="modal-title" id={this.props.id + 'Label'}>{this.props.title}</h4>
				      </div>
				      <div className="modal-body">
				        <div className="row">
 						    <div className="col-md-12" dangerouslySetInnerHTML={content} />
				        </div>
				      </div>
				      <div className="modal-footer">
				        <button type="button" className="ebtn ebtn-default ebtn-rounded" data-dismiss="modal">取消</button>&nbsp;{confirmBtn}
				      </div>
				    </div>
				  </div>
				</div>
			);
		}
	});

	var Modal = function(modalProps) {
		var modalDOM = document.getElementById('tui-modal-container');

		var _modalProps = {
			id: modalProps.id || 'tui-modal-' + Math.random().toString(36).substr(2),
			title: modalProps.title || '模态框',
			content: modalProps.content || '',
			confirm: modalProps.confirm,
			className: 'show'
		};

		if (!modalDOM) {
			modalDOM = document.createElement('div');
			modalDOM.id = 'tui-modal-container';
			document.body.appendChild(modalDOM);
		}

		ReactDOM.render(<_Modal {..._modalProps} />, modalDOM);

		setTimeout(function() {
			$('#' + _modalProps.id).modal('show');
		}, 100);
	};

	/**
	 * 弹出提示信息，如成功，失败
	 */
	var AlertModal = React.createClass({
		render: function() {
			return (
				<span className={this.props.type}>{this.props.msg}</span>
			);
		}
	});

	var Alert = function(obj) {
		var alertDOM = document.createElement('div');
		alertDOM.className = 'tui-alert-modal';
		document.body.appendChild(alertDOM);
		ReactDOM.render(React.createElement(AlertModal, { type: obj.type, msg: obj.msg }), alertDOM);

		setTimeout(function() {
			document.body.removeChild(alertDOM);
		}, 4000);
	};

	var success = function(msg) {
		this.Alert({ type: 'success', msg: msg });
	};

	var danger = function(msg) {
		this.Alert({ type: 'danger', msg: msg });
	};

	var warning = function(msg) {
		this.Alert({ type: 'warning', msg: msg });
	};

	var info = function(msg) {
		this.Alert({ type: 'info', msg: msg });
	};

	/**
     * 加载提示框
	 */
	var LoadingModal = React.createClass({
		render: function() {
			return (
				<div className={'tui-loading-parent ' + this.props.className}>
					<div className="tui-loading">
				  		<span className="text">{this.props.text}&nbsp;<i className="fa fa-spinner fa-spin fa-lg"></i></span>
				  	</div>
			  	</div>
			);
		}
	});

	var Loading = function(obj) {
		var loadingDOM = document.getElementsByClassName('tui-loading-container'),
			dom = '';
		if (loadingDOM.length === 0) {
			dom = document.createElement('div');
			dom.className = 'tui-loading-container';
			document.body.appendChild(dom);
		} else {
			dom = loadingDOM[0];
		}
		
		ReactDOM.render(React.createElement(LoadingModal, { className: obj && obj.className? obj.className: 'show', text: obj && obj.text? obj.text: '正在加载' }), dom);
	}

	// 常用工具类
	var Utils = {
		// 日期转换 毫秒转
		dateFormat: function(value, style) {
			if (value) {		
				var dateFormat = new Date(value),
					style = style || '',
					year = dateFormat.getYear() + 1900,
					month = ((dateFormat.getMonth() + 1) + '').length == 1? '0' + (dateFormat.getMonth() + 1): dateFormat.getMonth() + 1,
					date = (dateFormat.getDate() + '').length == 1? '0' + dateFormat.getDate(): dateFormat.getDate(),
					hour = (dateFormat.getHours() + '').length == 1? '0' + dateFormat.getHours(): dateFormat.getHours(),
					minute = (dateFormat.getMinutes() + '').length == 1? '0' + dateFormat.getMinutes(): dateFormat.getMinutes(),
					second = (dateFormat.getSeconds() + '').length == 1? '0' + dateFormat.getSeconds(): dateFormat.getSeconds();

				var rt = '';

				switch (style.toLowerCase()) {
					case 'yyyy-mm-dd hh:mm:ss':
						rt = year + '-' + month + '-' + date + '   ' + hour + ':' + minute + ':' + second;
						break;
					case 'yyyy-mm-dd':
						rt = year + '-' + month + '-' + date;
						break;
					default:
						rt = year + '-' + month + '-' + date + '   ' + hour + ':' + minute + ':' + second;
						break;	
				}

				return rt;
			} else {
				return '';
			}
		},
		getElementLeft: function(e) {
			e = e.target;

			var actualLeft = e.offsetLeft;
		　　 var current = e.offsetParent;
		　　 
			while (current !== null){
		　　 	actualLeft += current.offsetLeft;
		　　　　　current = current.offsetParent;
		　　 }

		　　 return actualLeft;
		},
		getElementTop: function(e) {
			e = e.target;

			var actualTop = e.offsetTop;
		　　 var current = e.offsetParent;
		　　 
			while (current !== null){
		　　 	actualTop += current.offsetTop;
		　　　　　current = current.offsetParent;
		　　 }

		　　 return actualTop;
		}
	};

	// 表格
	TUI.table = Table;
	// 模态框
	TUI.Modal = Modal;
	// 提示信息
	TUI.Alert = Alert;
	TUI.success = success;
	TUI.danger = danger;
	TUI.warning = warning;
	TUI.info = info;
	TUI.Loading = Loading;
	TUI.loading = Loading;
	// 工具类
	TUI.Utils = Utils;
	// 系统配置
	TUI.config = {
		simditor: {
			// 上传路径
			url: '/upload'
		}
	};

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