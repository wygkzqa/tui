var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * TUI - 原生版
 */
;(function () {
	if (typeof jQuery === 'undefined' || typeof React === 'undefined') {
		throw new Error('TUI requires jQuery and React.');
	}

	var TUI = {
		version: '0.20.3'
	};

	/**
  * 实体详情 父组件
  * EntityField:  实体字段 子组件
  * EntityHandle: 实体操作 子组件
  * EntityText:   input text 子组件
  * EntitySelect: input text 子组件
  */
	var EntityDetail = React.createClass({
		displayName: 'EntityDetail',

		getInitialState: function () {
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
		create: function () {
			var entity = this.props.entity;

			try {

				if (this.validators()) {
					var backList = this.props.backList,
					    currentPage = 1,
					    formId = this.props.formId,
					    create = entity.create,
					   
					// 默认创建url
					url = create ? create.url : '',
					    method = create ? create.method : '',
					    callback = create ? create.callback : '';

					if (this.refs[entity.key].value !== '') {
						url = entity.update.url;
						method = entity.update.method;
						callback = entity.update.callback;
						currentPage = this.props.currentPage;
					}

					if (url && typeof callback === 'function') {
						Loading({ text: '正在处理' });

						// 异步提交表单，使用jQuery.form
						if (entity.ajaxSubmit && entity.ajaxSubmit === true) {

							var ajaxFormOptions = {
								method: method || 'POST',
								url: url,
								dataType: 'JSON',
								success: function (result) {
									Loading({ className: 'hide' });
									if (callback(result) === 'success') {
										TUI.success('保存成功');
										$('#' + formId + ' button[type=reset]').click();
										backList(true, currentPage);
									} else {
										TUI.danger('保存失败');
									}
								},
								error: function (xhr, error, obj) {
									Loading({ className: 'hide' });
									TUI.danger(url + '远程调用异常［' + error + ', ' + obj + '］');
									throw new Error(url + '远程调用异常［' + error + ', ' + obj + '］');
								}
							};

							$('#' + formId).ajaxSubmit(ajaxFormOptions);
						} else {

							$.ajax({
								method: method || 'POST',
								url: url,
								data: $('#' + formId).serialize(),
								dataType: 'JSON',
								success: function (result) {
									Loading({ className: 'hide' });
									if (callback(result) === 'success') {
										TUI.success('保存成功');
										$('#' + formId + ' button[type=reset]').click();
										backList(true, currentPage);
									} else {
										TUI.danger('保存失败');
									}
								},
								error: function (xhr, error, obj) {
									Loading({ className: 'hide' });
									TUI.danger(url + '远程调用异常［' + error + ', ' + obj + '］');
									throw new Error(url + '远程调用异常［' + error + ', ' + obj + '］');
								}
							});
						}
					} else {
						Loading({ className: 'hide' });
						TUI.danger('保存实体配置有误，使用说明请查看［entity.create和entity.update］');
					}
				}
			} catch (e) {
				Loading({ className: 'hide' });
				TUI.danger('保存实体配置有误，' + e);
				throw new Error('保存实体配置有误，' + e);
			}
		},
		validators: function () {
			// 实体字段
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
				   
				// 验证器
				validators = field.validators,
				   
				// 元素不是否可用
				disabled = field.disabled === undefined ? false : field.disabled,
				   
				// 元素只读状态
				readOnly = field.readOnly === undefined ? false : field.readOnly;

				// 如果元素不可用或只读，直接跳过该元素
				if (disabled || readOnly) {
					continue;
				}

				if (typeof validators === 'object') {
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
									value: field.field === field.field ? encodeURI(value) : remote.data.value
								},
								success: (function (result) {
									if (!result.valid) {
										// 不通过
										inconformityNum++;
										fieldsState[field.field] = { message: remote.message || field.text + '错误' };
										this.setState({ fields: fieldsState });
									}
								}).bind(this),
								error: function (xhr, error, obj) {
									TUI.danger('TUI: remote url[' + remote.url + ']远程调用异常，' + error + ', ' + obj);
									throw new Error('TUI: remote url[' + remote.url + ']远程调用异常，' + error + ', ' + obj);
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
		render: function () {
			var className = 'form-horizontal ' + this.props.className,
			    entityData = this.props.entityData,
			   
			// 主键
			key = this.props.entity.key,
			   
			// 主键值
			keyValue = entityData ? entityData[key] : '',
			   
			// 表单提交方式
			method = '';

			if (this.props.entity.update && this.props.entity.create) {
				if (typeof entityData === 'object' && entityData[key] !== '') {
					method = this.props.entity.update.method;
				} else if (this.props.entity.create) {
					method = this.props.entity.create.method || 'POST';
				} else {
					method = 'POST';
				}
			}

			return React.createElement(
				'form',
				{ id: this.props.formId, className: className, encType: 'multipart/form-data', method: method },
				React.createElement('input', { type: 'hidden', ref: key, name: key, value: keyValue }),
				React.createElement(
					'div',
					{ className: 'form-group' },
					React.createElement(
						'a',
						{ href: 'javascript:;', className: 'col-sm-2', onClick: this.props.backList },
						React.createElement('i', { className: 'fa fa-arrow-left' }),
						' 返回列表'
					)
				),
				React.createElement('hr', null),
				this.props.entity.fields.map((function (f, key) {
					return React.createElement(
						'div',
						{ key: key, className: 'form-group' },
						React.createElement(
							'label',
							{ className: 'col-sm-2 control-label' },
							f.text
						),
						React.createElement(
							'div',
							{ className: 'col-sm-8' },
							React.createElement(EntityField, {
								keyValue: keyValue,
								field: f,
								entityData: entityData,
								formId: this.props.formId }),
							React.createElement(
								'span',
								{ className: 'tui-error' },
								this.state.fields[f.field].message
							)
						)
					);
				}).bind(this)),
				React.createElement(EntityHandle, {
					keyValue: keyValue,
					backList: this.props.backList,
					create: this.create,
					update: this.props.entity.update,
					entityData: entityData,
					custom: this.props.entity.custom || []
				})
			);
		}
	});

	/**
  * 实体字段
  */
	var EntityField = React.createClass({
		displayName: 'EntityField',

		render: function () {
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

			switch (type) {
				case 'text':
					fieldDOM = React.createElement(EntityText, _extends({}, fieldProps, { formId: this.props.formId }));
					break;
				case 'select':
					fieldDOM = React.createElement(EntitySelect, fieldProps);
					break;
				case 'radio':
					fieldDOM = React.createElement(EntityRadio, fieldProps);
					break;
				case 'textarea':
					fieldDOM = React.createElement(EntityTextarea, fieldProps);
					break;
				case 'editor':
					fieldDOM = React.createElement(EntityEditor, fieldProps);
					break;
				default:
					fieldDOM = React.createElement(EntityText, fieldProps);
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
		displayName: 'EntityHandle',

		customHandle: function (e) {
			// 处理方法返回值，返回success则刷新页面
			var handleRet = this.props.custom[e.target.dataset.customid].handle(this.props.entityData);

			if (handleRet && handleRet === 'success') {
				this.props.backList(true);
			}
		},
		render: function () {
			var entityData = this.props.entityData,
			    keyValue = this.props.keyValue,
			    update = this.props.update,
			    createOrUpdateDOM = '',
			    custom = this.props.custom,
			   
			// 自定义操作
			customButtons = [];

			if (keyValue === undefined) {
				createOrUpdateDOM = React.createElement(
					'button',
					{ type: 'button', className: 'ebtn ebtn-success ebtn-rounded tui-mr5', onClick: this.props.create },
					'添加'
				);
			} else if (keyValue !== '' && update) {

				if (update.condition && typeof update.condition === 'function') {
					// 如果有condition条件的话，符合条件的才有修改按钮，返回success表示符合
					if (update.condition(entityData) === 'success') {
						createOrUpdateDOM = React.createElement(
							'button',
							{ type: 'button', className: 'ebtn ebtn-success ebtn-rounded tui-mr5', onClick: this.props.create },
							'保存'
						);
					}
				} else {
					createOrUpdateDOM = React.createElement(
						'button',
						{ type: 'button', className: 'ebtn ebtn-success ebtn-rounded tui-mr5', onClick: this.props.create },
						'保存'
					);
				}
			}

			// 自定义操作按钮
			for (var i = 0; i < custom.length; i++) {
				var _custom = custom[i];

				customButtons.push(React.createElement(
					'button',
					{ type: 'button', className: 'tui-mr5 ' + _custom.className, onClick: this.customHandle, 'data-customid': i },
					_custom.text
				));
			}

			return React.createElement(
				'div',
				{ className: 'form-group' },
				React.createElement(
					'div',
					{ className: 'col-sm-4 col-sm-offset-2' },
					createOrUpdateDOM,
					React.createElement(
						'button',
						{ type: 'button', className: 'ebtn ebtn-default ebtn-rounded tui-mr5', onClick: this.props.backList },
						'取消'
					),
					customButtons,
					React.createElement(
						'button',
						{ type: 'reset', style: { 'display': 'none' } },
						'重置'
					)
				)
			);
		}
	});

	/**
  * 表单组件之input
  */
	var EntityText = React.createClass({
		displayName: 'EntityText',

		getInitialState: function () {
			return {
				value: ''
			};
		},
		shouldComponentUpdate: function (nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value });
				return true;
			}
			return false;
		},
		entityTextChangeHandle: function (e) {
			this.setState({ value: e.target.value });
		},
		dateFocus: function (e) {
			TUI.datePicker(e, this.props.formId);
		},
		render: function () {
			var field = this.props.field,
			    entityData = this.props.entityData;

			if (this.props.type !== 'file' && this.props.keyValue !== '') {
				if (this.props.type === 'date') {
					return React.createElement('input', { type: 'text', className: 'form-control', name: field.field, ref: field.field, placeholder: field.placeholder || field.text, value: this.state.value, onFocus: this.dateFocus, onChange: this.entityTextChangeHandle, disabled: field.disabled || false, readOnly: field.readOnly || false });
				}

				return React.createElement('input', { type: this.props.type, className: 'form-control', name: field.field, ref: field.field, placeholder: field.placeholder || field.text, value: this.state.value, onChange: this.entityTextChangeHandle, disabled: field.disabled || false, readOnly: field.readOnly || false });
			} else {
				return React.createElement('input', { type: this.props.type, className: 'form-control', name: field.field, ref: field.field, placeholder: field.placeholder || field.text, defaultValue: '' });
			}
		}
	});

	/**
  * 表单组件之select
  */
	var EntitySelect = React.createClass({
		displayName: 'EntitySelect',

		getInitialState: function () {
			return {
				value: '',
				options: {
					rows: []
				}
			};
		},
		componentDidMount: function () {
			var options = this.props.field.options;
			// 是字符串或非数组，表示select需要远程加载
			if (typeof options === 'string' || options instanceof Array === false) {
				var isObj = typeof options === 'object',
				    url = isObj ? options.url : options;

				$.get(url, (function (result) {
					if (this.isMounted()) {
						// 重新赋值
						options = this.props.field.options;

						var options = {
							rows: result,
							textField: isObj ? options.textField : 'text',
							valueField: isObj ? options.valueField : 'value'
						};

						this.setState({ options: options });
					}
				}).bind(this));
			}
		},
		shouldComponentUpdate: function (nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value });
				return true;
			}
			return false;
		},
		entitySelectChangeHandle: function (e) {
			this.setState({ value: e.target.value });
		},
		render: function () {
			var field = this.props.field;

			if (field.options instanceof Array) {
				return React.createElement(
					'select',
					{ ref: field.field, name: field.field, className: 'form-control', value: this.state.value, onChange: this.entitySelectChangeHandle },
					field.options.map((function (op, key) {
						return React.createElement(
							'option',
							{ key: key, value: op.value },
							op.text
						);
					}).bind(this))
				);
			} else {
				return React.createElement(
					'select',
					{ ref: field.field, name: field.field, className: 'form-control', value: this.state.value, onChange: this.entitySelectChangeHandle },
					this.state.options.rows.map((function (op, key) {
						return React.createElement(
							'option',
							{ key: key, value: op[this.state.options.valueField] },
							op[this.state.options.textField]
						);
					}).bind(this))
				);
			}
		}
	});

	/**
  * 表单组件之radio
  */
	var EntityRadio = React.createClass({
		displayName: 'EntityRadio',

		getInitialState: function () {
			return {
				value: ''
			};
		},
		shouldComponentUpdate: function (nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value + '' });
				return true;
			}
			return false;
		},
		entityRadioChangeHandle: function (e) {
			this.setState({ value: e.target.value });
		},
		render: function () {
			var field = this.props.field;

			return React.createElement(
				'p',
				null,
				field.options.map((function (op, key) {
					var radioDOM = '';

					if (this.props.keyValue !== '') {
						radioDOM = React.createElement('input', { checked: this.state.value == op.value, type: 'radio', ref: field.field, name: field.field, value: op.value, onChange: this.entityRadioChangeHandle });
					} else {
						radioDOM = React.createElement('input', { type: 'radio', ref: field.field, name: field.field, value: op.value });
					}
					return React.createElement(
						'label',
						{ key: key, className: 'radio-inline' },
						radioDOM,
						' ',
						op.text
					);
				}).bind(this))
			);
		}
	});

	/**
  * 表单组件之textarea
  */
	var EntityTextarea = React.createClass({
		displayName: 'EntityTextarea',

		getInitialState: function () {
			return {
				value: ''
			};
		},
		shouldComponentUpdate: function (nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || this.state.value !== nextState.value) {
				var value = nextState.value;

				if (this.state.value === nextState.value) {
					value = nextProps.entityData[nextProps.field.field];
				}

				this.setState({ value: value });
				return true;
			}
			return false;
		},
		entityTextareaChangeHandle: function (e) {
			this.setState({ value: e.target.value });
		},
		render: function () {
			var field = this.props.field;

			if (this.props.keyValue) {
				return React.createElement('textarea', { rows: '5', className: 'form-control', name: field.field, ref: field.field, placeholder: field.text, value: this.state.value, onChange: this.entityTextareaChangeHandle, disabled: field.disabled || false, readOnly: field.readOnly || false });
			} else {
				return React.createElement('textarea', { rows: '5', className: 'form-control', name: field.field, ref: field.field, placeholder: field.text, defaultValue: '' });
			}
		}
	});

	/**
  * 表单组件之编辑器
  */
	var EntityEditor = React.createClass({
		displayName: 'EntityEditor',

		getInitialState: function () {
			return {
				editor: {}
			};
		},
		shouldComponentUpdate: function (nextProps, nextState) {
			if (nextProps.keyValue !== this.props.keyValue || this.state.value !== nextState.value) {
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
		componentDidMount: function () {
			// 编辑器DOM渲染后开始实例化
			if (this.isMounted()) {
				var toolbar = ['title', 'bold', 'italic', 'underline', 'strikethrough', 'color', '|', 'ol', 'ul', 'blockquote', 'code', 'table', '|', 'link', 'image', 'hr', '|', 'indent', 'outdent'];

				try {
					var editor = new Simditor({
						textarea: $('#' + this.props.field.field),
						toolbar: toolbar, //工具栏
						upload: {
							url: TUI.config.simditor.url, //文件上传的接口地址
							params: null, //键值对,指定文件上传接口的额外参数,上传的时候随文件一起提交
							fileKey: 'fileDataFileName', //服务器端获取文件数据的参数名
							connectionCount: 3,
							leaveConfirm: '正在上传文件'
						}
					});
					this.setState({ editor: editor });
				} catch (ex) {
					TUI.danger('请引入simdirot相关文件');
					console.error('请引入simdirot相关文件');
				}
			}
		},
		render: function () {
			var field = this.props.field;

			if (this.props.keyValue === '') {
				return React.createElement('textarea', { id: field.field, rows: '5', className: 'form-control', name: field.field, ref: field.field, placeholder: field.text });
			} else {
				return React.createElement('textarea', { id: field.field, rows: '5', className: 'form-control', name: field.field, ref: field.field, placeholder: field.text });
			}
		}
	});

	/**
  * TUI Table 表格组件
  * Parent
  */
	var TableComp = React.createClass({
		displayName: 'TableComp',

		// 初始化表格
		getInitialState: function () {

			var searchbarProps = this.props.searchbar.searchbarProps,
			    pagination = this.props.options.pagination;

			searchbarProps.goCreate = this.goCreate;
			searchbarProps._pagingClick = this._pagingClick;

			return {
				formId: this.props.options.formId,
				// 是否显示实体详情
				isShowEntityDetail: false,
				searchbar: React.createElement(SearchBar, searchbarProps),
				searchbarCols: this.props.searchbar.searchbarCols,
				toolbar: React.createElement(ToolBar, this.props.toolbar.toolbarProps),
				tableDataProps: {},
				// 是否显示分页 默认true显示
				pagination: typeof pagination === 'boolean' && pagination === true || typeof pagination === 'undefined' ? '正在加载分页...' : '',
				// 当前页
				currentPage: 1,
				maxSize: typeof this.props.options.maxSize === 'number' ? this.props.options.maxSize : 10
			};
		},
		// 初次调用表格
		componentDidMount: function () {
			if (this.props.options.url) {
				this._loadData(1);
			}
		},
		componentWillReceiveProps: function (nextProps) {
			if (nextProps.options.refresh) {
				this.refresh(this.state.currentPage);
			}
		},
		// 分页按钮
		_pagingClick: function (e) {
			e.preventDefault();
			this._loadData(e.currentTarget.dataset.page);
		},
		// 返回列表
		backList: function (isRefresh, currentPage) {
			// 清空提示信息
			$('#find-' + this.state.formId).find('.tui-error').text('');
			this.setState({ isShowEntityDetail: false, entityData: {} });

			isRefresh = typeof isRefresh === 'boolean' ? isRefresh : false;

			if (isRefresh) {
				this.refresh(currentPage);
			}
		},
		// 刷新
		refresh: function (currentPage) {
			this._loadData(this.state.currentPage);
		},
		// 改变分页最大显示数
		changeMaxSize: function (maxSize) {
			this.setState({ maxSize: maxSize });
			this._loadData(this.state.currentPage, maxSize);
		},
		// 加载数据
		_loadData: function (currentPage, maxSize) {
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

				switch (searchbarCols[i].type) {
					case 'text':
						value = $('#' + this.state.formId).find('input[name=' + searchcol + ']').val();
						break;
					case 'radio':
						value = $('#' + this.state.formId).find('input[name=' + searchcol + ']:checked').val();
						break;
					default:
						value = $('#' + this.state.formId).find('[name=' + searchcol + ']').val();
						break;
				}

				if (value) {
					ajaxData[searchcol] = value;
				}
			}

			if (typeof this.props.options.submitBefore === 'function') {
				this.props.options.submitBefore({
					data: ajaxData
				});
			}

			$.ajax({
				method: this.props.options.method ? this.props.options.method : 'GET',
				url: url,
				contentType: this.props.options.contentType || 'application/x-www-form-urlencoded',
				data: ajaxData,
				dataType: 'JSON',
				success: (function (result) {
					Loading({ className: 'hide' });
					if (typeof result === 'object' && result.rows !== undefined && result.rowCount !== undefined) {

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
								pagination: typeof pagination === 'boolean' && pagination === true || typeof pagination === 'undefined' ? React.createElement(Pagination, paginationProps) : '',
								currentPage: ajaxData.currentPage
							});
						}
					} else {
						TUI.danger('TUI Table 远程调用返回数据格式不正确［未检测到rows，rowCount］');
						throw new Error('TUI Table 远程调用返回数据格式不正确［未检测到rows，rowCount］');
					}
				}).bind(this),
				error: function (xhr, error, obj) {
					Loading({ className: 'hide' });
					TUI.danger('TUI Table 远程调用异常［' + error + ', ' + obj + '］');
					throw new Error('TUI Table 远程调用异常［' + error + ', ' + obj + '］');
				}
			});
		},
		// 删除事件
		deleteHandle: function (retDelete) {
			var refresh = this.refresh;

			var modalProps = {
				id: 'delModal',
				title: '删除确认',
				content: '<div class="alert alert-warning">确定要删除该条纪录吗？</div>',
				confirm: function () {
					$.ajax({
						method: retDelete.method || 'get',
						url: retDelete.url,
						success: function (result) {
							// 成功返回success
							if (retDelete.callback(result) === 'success') {
								TUI.success('删除成功');
								refresh();
							} else {
								TUI.danger('删除失败');
							}
						},
						error: function (xhr, error, obj) {
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
		findHandle: function (retFind) {
			Loading();

			$.ajax({
				method: retFind.method || 'GET',
				url: retFind.url,
				success: (function (result) {
					Loading({ className: 'hide' });

					// 查看操作是否有callback
					if (typeof retFind.callback === 'function') {
						result = retFind.callback(result);
					}

					this.goCreate(result);
				}).bind(this),
				error: function (xhr, error, obj) {
					Loading({ className: 'hide' });
					TUI.danger(retFind.url + '远程调用异常［' + error + ', ' + obj + '］');
					throw new Error(retFind.url + '远程调用异常［' + error + ', ' + obj + '］');
				}
			});
		},
		// 显示添加或编辑页面
		goCreate: function (entityData) {
			// 是否自定义创建按钮事件，handle方法表示自定义事件
			// 没有handle便走默认
			if (!this.props.entity.create || !this.props.entity.create.handle) {
				if (typeof this.props.entity === 'object' && this.props.entity.fields instanceof Array) {
					this.setState({ isShowEntityDetail: true, entityData: entityData });
				} else {
					TUI.danger('请先添加实体属性，使用说明请看［entity.fields］');
				}
			} else {
				this.props.entity.create.handle();
			}
		},
		// checkbox处理事件
		handlerCheckForParent: function (index, isCheck) {
			this.state.rows[index].isCheck = isCheck;
			this.setState({
				rows: this.state.rows
			});
		},
		checkAll: function (isCheck) {
			this.state.rows.map(function (row, key) {
				row.isCheck = isCheck;

				return row;
			});
			this.state.tableDataProps.isCheckAll = isCheck;

			this.setState({ rows: this.state.rows, tableDataProps: this.state.tableDataProps });
		},
		// 渲染表格和分页
		render: function () {
			var entityDetail = '',
			    type = this.props.options.type ? this.props.options.type : 'table';

			if (this.props.entity) {
				entityDetail = React.createElement(EntityDetail, {
					className: this.state.isShowEntityDetail ? 'show' : 'hide',
					formId: 'find-' + this.state.formId,
					backList: this.backList,
					entity: this.props.entity,
					entityData: this.state.entityData,
					currentPage: this.state.currentPage
				});
			}

			return React.createElement(
				'div',
				{ className: 'well' },
				React.createElement(
					'form',
					{ id: this.state.formId, className: this.state.isShowEntityDetail ? 'hide' : 'show' },
					this.state.searchbar,
					this.state.toolbar,
					React.createElement(
						'div',
						{ className: 'tui-table-div' },
						React.createElement(
							'table',
							{ className: 'tui-table tui-table-hover' },
							React.createElement(TableColsComp, {
								columns: this.props.options.columns,
								checkAll: this.checkAll,
								isCheckAll: this.state.tableDataProps.isCheckAll
							}),
							React.createElement(TableData, _extends({
								rows: this.state.rows
							}, this.state.tableDataProps, {
								handlerCheckForParent: this.handlerCheckForParent,
								deleteHandle: this.deleteHandle,
								findHandle: this.findHandle,
								refresh: this.refresh,
								type: type
							}))
						)
					),
					this.state.pagination
				),
				entityDetail
			);
		}
	});

	/**
  * TUI Table 表格组件-筛选条件工具栏
  * Children
  */
	var SearchBar = React.createClass({
		displayName: 'SearchBar',

		dateFocus: function (e) {
			TUI.datePicker(e, this.props.formId);
		},
		render: function () {
			// 添加按钮
			var addBtn = '';

			if (this.props.hasAdd) {
				addBtn = React.createElement(
					'button',
					{ type: 'button', className: 'ebtn ebtn-success ebtn-rounded', onClick: this.props.goCreate },
					React.createElement('i', { className: 'fa fa-plus' }),
					' 添加'
				);
			}

			if (this.props.searchbar.length === 0 && this.props.hasAdd) {
				return React.createElement(
					'div',
					{ className: 'tui-searchbar' },
					React.createElement(
						'div',
						{ className: 'form-group' },
						addBtn
					)
				);
			} else if (this.props.searchbar.length > 0) {
				return React.createElement(
					'div',
					{ className: 'tui-searchbar' },
					this.props.searchbar.map((function (obj, key) {

						if (typeof obj === 'object') {
							var type = obj.type || 'text',
							    searchbarDOM = '';

							switch (type) {
								// 文本框
								case 'text':
									searchbarDOM = React.createElement(
										'div',
										{ className: 'form-group', key: key },
										React.createElement(
											'label',
											{ htmlFor: obj.field },
											obj.text
										),
										React.createElement('input', { id: obj.field, name: obj.field, type: 'text', ref: obj.field, className: 'form-control', placeholder: obj.placeholder || obj.text }),
										' '
									);
									break;
								// 下拉框
								case 'select':
									var options = obj.options,
									    optionsArr = [];

									// 是字符串或非数组，表示select需要远程加载
									if (typeof options === 'string' || options instanceof Array === false) {
										var isObj = typeof options === 'object',
										    url = isObj ? options.url : options,
										    textField = isObj ? options.textField : 'text',
										    valueField = isObj ? options.valueField : 'value';

										$.ajax({
											method: 'GET',
											async: false,
											url: url,
											success: function (result) {
												optionsArr.push(React.createElement(
													'option',
													{ value: '' },
													'不限'
												));

												for (var i = 0; i < result.length; i++) {
													optionsArr.push(React.createElement(
														'option',
														{ value: result[i][valueField] },
														result[i][textField]
													));
												}

												searchbarDOM = React.createElement(
													'div',
													{ className: 'form-group', key: key },
													React.createElement(
														'label',
														{ htmlFor: obj.field },
														obj.text
													),
													React.createElement(
														'select',
														{ id: obj.field, name: obj.field, className: 'form-control' },
														optionsArr
													),
													' '
												);
											},
											error: function (xhr, error, obj) {
												TUI.danger(url + '远程调用异常［' + error + ', ' + obj + '］');
											}
										});
										break;
									} else {

										optionsArr.push(React.createElement(
											'option',
											{ value: '' },
											'不限'
										));

										for (var i = 0; i < obj.options.length; i++) {
											optionsArr.push(React.createElement(
												'option',
												{ value: obj.options[i].value },
												obj.options[i].text
											));
										}

										searchbarDOM = React.createElement(
											'div',
											{ className: 'form-group', key: key },
											React.createElement(
												'label',
												{ htmlFor: obj.field },
												obj.text
											),
											React.createElement(
												'select',
												{ id: obj.field, name: obj.field, className: 'form-control' },
												optionsArr
											),
											' '
										);

										break;
									}
								// 单选按钮
								case 'radio':
									var options = [];
									for (var i = 0; i < obj.options.length; i++) {
										options.push(React.createElement(
											'label',
											null,
											React.createElement('input', { type: 'radio', name: obj.field, value: obj.options[i].value }),
											obj.options[i].text
										));
									}

									searchbarDOM = React.createElement(
										'div',
										{ className: 'form-group', key: key },
										React.createElement(
											'label',
											{ htmlFor: obj.field },
											obj.text
										),
										options
									);
									break;
								// 日期控件
								case 'date':
									searchbarDOM = React.createElement(
										'div',
										{ className: 'form-group', key: key },
										React.createElement(
											'label',
											{ htmlFor: obj.field },
											obj.text
										),
										React.createElement('input', { id: obj.field, name: obj.field, type: 'text', ref: obj.field, className: 'form-control', onFocus: this.dateFocus, onBlur: this.dateBlur, placeholder: obj.placeholder || obj.text }),
										' '
									);
									break;
								default:
									break;
							}

							return searchbarDOM;
						} else {
							return '';
						}
					}).bind(this)),
					React.createElement(
						'div',
						{ className: 'form-group' },
						' ',
						React.createElement(
							'button',
							{ type: 'button', className: 'ebtn ebtn-primary ebtn-rounded', onClick: this.props._pagingClick, 'data-page': '1' },
							React.createElement('i', { className: 'fa fa-search' }),
							' 查询'
						),
						' ',
						React.createElement(
							'button',
							{ type: 'reset', className: 'ebtn ebtn-default ebtn-rounded' },
							'重置'
						),
						' ',
						addBtn
					)
				);
			} else {
				return React.createElement('div', { className: 'tui-searchbar' });
			}
		}
	});

	/**
  * TUI Table 表格组件-工具栏
  * Children
  */
	var ToolBar = React.createClass({
		displayName: 'ToolBar',

		render: function () {
			return React.createElement(
				'div',
				{ className: 'tui-toolbar' },
				this.props.toolbar.map(function (tb, key) {
					var type = tb.type || 'button',
					    tbDOM = '';

					switch (type) {
						case 'button':
							tbDOM = React.createElement(
								'button',
								{ className: (tb.className ? tb.className : 'btn btn-primary') + ' tui-mr5', type: 'button', onClick: tb.handle },
								tb.text
							);
							break;
						case 'checkbox':
							var id = tb.id || '',
							    name = tb.name || '',
							    checked = tb.checked || false;

							tbDOM = React.createElement(
								'div',
								null,
								React.createElement(
									'label',
									{ htmlFor: id, className: 'tui-mr5' },
									tb.text
								),
								React.createElement('input', { type: 'checkbox', id: id, name: name, style: { 'width': '15', 'height': '15' }, defaultChecked: tb.checked })
							);
							break;
						default:
							tbDOM = React.createElement(
								'button',
								{ className: (tb.className ? tb.className : 'btn btn-primary') + ' tui-mr5', type: 'button', onClick: tb.handle },
								tb.text
							);
							break;
					};
					return React.createElement(
						'div',
						{ className: 'form-group' },
						tbDOM
					);
				})
			);
		}
	});

	/**
  * 表格列组件
  */
	var TableColsComp = React.createClass({
		displayName: 'TableColsComp',

		render: function () {
			return React.createElement(
				'thead',
				{ className: 'tui-thead-default' },
				React.createElement(
					'tr',
					null,
					this.props.columns.map((function (col, key) {
						var colContent = col.text;

						if (col.checkbox) {
							colContent = React.createElement('input', { type: 'checkbox', checked: this.props.isCheckAll, onChange: this.props._checkAll });
						}
						return React.createElement(
							'th',
							{ key: key, style: { 'width': col.width ? col.width : 'auto' } },
							colContent
						);
					}).bind(this)),
					React.createElement('td', null)
				)
			);
		}
	});

	/**
  * TUI Table 表格组件-表格数据渲染
  * Children
  */
	var TableData = React.createClass({
		displayName: 'TableData',

		componentWillReceiveProps: function (nextProps) {
			if (nextProps.rows) {
				this.setState({ tableTree: nextProps.rows });
			}
		},
		_checkAll: function (e) {
			this.props.checkAll(e.target.checked);
		},
		/*
   * 父级点击
   */
		parentClick: function (e) {
			e.preventDefault();

			var dataset = e.currentTarget.dataset,
			    index = dataset.index.indexOf('-') === -1 ? dataset.index : dataset.index.split('-'),
			    hierarchy = dataset.hierarchy,
			    tableTree = this.state.tableTree,
			   
			// 父级状态默认收起
			status = '';

			// 最顶级展开
			if (typeof index === 'string') {

				status = tableTree[index].tableTreeStatus || 'hide';

				if (status === 'hide') {
					tableTree[index].tableTreeStatus = 'tui-show';
				} else {
					var children = tableTree[index].children;
					tableTree[index].tableTreeStatus = 'hide';

					// 隐藏二级
					if (children instanceof Array) {
						for (var i = 0; i < children.length; i++) {
							if (children[i]) {
								children[i].tableTreeChildStatus = 'hide';
							}
						}
					}
				}
			} else {
				// 二级的情况下，修改tableTreeChildStatus字段来控制三级的显示
				if (hierarchy == '2') {
					status = tableTree[index[0]].children[index[1]].tableTreeChildStatus || 'hide';

					if (status === 'hide') {
						tableTree[index[0]].children[index[1]].tableTreeChildStatus = 'tui-show';
					} else {
						tableTree[index[0]].children[index[1]].tableTreeChildStatus = 'hide';
					}
				} else {
					status = tableTree[index[0]].children[index[1]].tableTreeStatus || 'hide';

					if (status === 'hide') {
						tableTree[index[0]].children[index[1]].tableTreeStatus = 'tui-show';
					} else {
						tableTree[index[0]].children[index[1]].tableTreeStatus = 'hide';
					}
				}
			}

			this.setState({ tableTree: tableTree });
		},
		render: function () {
			if (!this.props.rows || !this.props.options) {
				return React.createElement(
					'tbody',
					null,
					React.createElement(
						'tr',
						null,
						React.createElement(
							'td',
							null,
							'正在加载数据...'
						)
					)
				);
			}

			var type = this.props.type;

			return React.createElement(
				'tbody',
				{ className: 'tui-tbody-default' },
				this.props.rows.map((function (row, key) {
					row.isCheck = row.isCheck || false;

					var tableRowProps = {
						type: type,
						row: row,
						rowHandles: this.props.options.rowHandles,
						columns: this.props.options.columns,
						index: key,
						handlerCheckForParent: this.props.handlerCheckForParent,
						deleteHandle: this.props.deleteHandle,
						findHandle: this.props.findHandle,
						refresh: this.props.refresh
					};

					// 标准表格
					if (type === 'table') {
						return React.createElement(TableRow, _extends({ key: key }, tableRowProps));
					}
					// 树形表格
					else if (type === 'tableTree') {

							var tableTreeProps = {
								parentClick: this.parentClick
							};

							tableRowProps.tableTreeProps = tableTreeProps;

							var childsArr = [React.createElement(TableRow
							// 一级状态 控制二级
							, _extends({ tableTreeStatus: this.state.tableTree[key].tableTreeStatus || 'hide',
								hierarchy: 1,
								isHighest: true,
								isParent: true,
								key: key
							}, tableRowProps))],
							    children = row.children;

							// 确保子级为数组
							if (children && children instanceof Array) {
								// 二级
								for (var i = 0; i < children.length; i++) {
									if (children[i]) {
										var _children = children[i].children;

										tableRowProps.row = children[i];
										tableRowProps.index = i;
										tableRowProps.parentIndex = key;

										if (_children && _children instanceof Array) {
											childsArr.push(React.createElement(TableRow
											// 二级状态
											, _extends({ tableTreeStatus: this.state.tableTree[key].tableTreeStatus || 'hide'
												// 控制三级的状态
												, tableTreeChildStatus: this.state.tableTree[key].children[i].tableTreeChildStatus || 'hide',
												hierarchy: 2,
												isParent: true,
												key: key + '-' + i
											}, tableRowProps)));

											// 三级
											for (var j = 0; j < _children.length; j++) {
												if (_children[j]) {
													tableRowProps.row = _children[j];
													tableRowProps.index = j;
													tableRowProps.parentIndex = i;

													childsArr.push(React.createElement(TableRow
													// 三级状态
													, _extends({ tableTreeStatus: this.state.tableTree[key].children[i].tableTreeChildStatus || 'hide',
														hierarchy: 3,
														key: key + '-' + i + '-' + j
													}, tableRowProps)));
												}
											}
										} else {
											childsArr.push(React.createElement(TableRow, _extends({
												tableTreeStatus: this.state.tableTree[key].tableTreeStatus || 'hide',
												key: key + '-' + i
											}, tableRowProps)));
										}
									}
								}
							}

							return childsArr;
						}
				}).bind(this))
			);
		}
	});

	/**
  * TUI TableRow 表格组件－行
  * @type {[type]}
  */
	var TableRow = React.createClass({
		displayName: 'TableRow',

		getInitialState: function () {
			var status = this.props.tableTreeStatus;

			return {
				tableTreeProps: {
					status: status,
					parentStatusDOM: this.getParentStatusDOM(status)
				}
			};
		},
		componentWillReceiveProps: function (nextProps) {
			if (this.props.type === 'tableTree') {

				if (nextProps.tableTreeStatus !== this.props.tableTreeStatus || nextProps.tableTreeChildStatus !== this.props.tableTreeChildStatus) {

					// 控制显示子级的状态
					var status = nextProps.tableTreeStatus,
					   
					// 控制图标的状态
					showHideStatus = this.props.hierarchy === 2 ? nextProps.tableTreeChildStatus : status;

					var tableTreeProps = {
						status: status,
						parentStatusDOM: this.getParentStatusDOM(showHideStatus)
					};

					this.setState({ tableTreeProps: tableTreeProps });
				}
			}
		},
		/**
   * 获取父级的状态DOM
   */
		getParentStatusDOM: function (status) {
			return status === 'hide' ? React.createElement(
				'span',
				null,
				React.createElement('i', { className: 'fa fa-angle-right tui-mr5' }),
				React.createElement('i', { className: 'fa fa-folder-open-o tui-mr5' })
			) : React.createElement(
				'span',
				null,
				React.createElement('i', { className: 'fa fa-angle-down tui-mr5' }),
				React.createElement('i', { className: 'fa fa-folder-open tui-mr5' })
			);
		},
		/**
   * 删除事件
   */
		deleteHandle: function (e) {
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
		/**
   * 查看事件
   */
		findHandle: function (e) {
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
		handlerCheck: function () {
			var isCheck = !this.props.row.isCheck;
			this.props.handlerCheckForParent(this.props.index, isCheck);
		},
		// 自定义操作
		customHandles: function (e) {
			e.preventDefault();
			this.props.rowHandles.custom[e.currentTarget.dataset.customid].handle(this.props.row);
		},
		render: function () {
			var rowHandles = this.props.rowHandles,
			    rowHandlesDOM = [],
			   
			// 自定义操作DOM
			customHandles = rowHandles ? rowHandles.custom : [],
			    customHandlesDOM = [];
			// 是否父级
			isParent = this.props.isParent, isHighest = this.props.isHighest, parentDOM = this.props.type === 'tableTree' ? React.createElement('td', null) : undefined;

			if (isParent) {
				parentDOM = React.createElement(
					'a',
					{ href: 'javascript:;',
						onClick: this.props.tableTreeProps.parentClick,
						'data-index': typeof this.props.parentIndex === 'number' ? this.props.parentIndex + '-' + this.props.index : this.props.index,
						'data-hierarchy': this.props.hierarchy
					},
					this.state.tableTreeProps.parentStatusDOM
				);
			}

			if (rowHandles) {
				// 查看
				if (typeof rowHandles.find === 'function') {
					rowHandlesDOM.push(React.createElement(
						'a',
						{ href: 'javascript:;', className: 'tui-mr5', title: '详情', onClick: this.findHandle },
						React.createElement('i', { className: 'fa fa-edit fa-lg' })
					));
				}

				// 自定义操作
				if (rowHandles.custom && customHandles instanceof Array) {
					for (var i = 0; i < customHandles.length; i++) {
						var custom = customHandles[i];

						customHandlesDOM.push(React.createElement(
							'li',
							null,
							React.createElement(
								'a',
								{ href: 'javascript:;', onClick: this.customHandles, 'data-customid': i },
								React.createElement('i', { className: custom.iconClass ? custom.iconClass : '' }),
								' ',
								custom.text
							)
						));
					}
				}

				// 删除
				if (typeof rowHandles.delete === 'function') {
					customHandlesDOM.push(React.createElement(
						'li',
						null,
						React.createElement(
							'a',
							{ href: 'javascript:;', className: 'tui-mr5', title: '删除', onClick: this.deleteHandle, style: { 'marginRight': '5px' } },
							React.createElement('i', { className: 'fa fa-trash-o fa-fw' }),
							' 删除'
						)
					));
				}

				if (customHandlesDOM.length > 0) {
					rowHandlesDOM.push(React.createElement(
						'div',
						{ className: 'btn-group' },
						React.createElement(
							'a',
							{ href: 'javascript:;', className: 'dropdown-toggle tui-dropdown-menu', 'data-toggle': 'dropdown', 'aria-haspopup': 'true', 'aria-expanded': 'false' },
							'更多 ',
							React.createElement('span', { className: 'caret' })
						),
						React.createElement(
							'ul',
							{ className: 'dropdown-menu tui-dropdown-menu' },
							customHandlesDOM
						)
					));
				}
			}

			return React.createElement(
				'tr',
				{ key: this.props.index,
					'data-parent': this.props.hierarchy === 3 ? 'child_' + this.props.parentIndex : typeof this.props.parentIndex === 'number' ? 'parent_' + this.props.parentIndex : '',
					className: this.props.type === 'table' || isHighest ? '' : this.state.tableTreeProps ? this.state.tableTreeProps.status : ''
				},
				this.props.columns.map((function (col, key) {
					var row = this.props.row,
					   
					// 列值
					// 如果是树形菜单并且是父级并且为第1列的话，把展开按钮加上
					colVal = key === 0 && isParent ? parentDOM : '';

					if (!col.handle && col.field.indexOf('.') === -1 && !col.checkbox) {
						return React.createElement(
							'td',
							{ key: key },
							colVal,
							row[col.field]
						);
					} else {
						// 是否有处理方法
						if (typeof col.handle === 'function') {
							colVal = col.handle(row);

							if (colVal === undefined) {
								console.error('TUI Table column["' + col.field + '"] is no return value.');
							}

							if (!col.field) {
								var _html = { __html: colVal };

								return React.createElement('td', { key: key, dangerouslySetInnerHTML: _html });
							}

							return React.createElement(
								'td',
								{ key: key },
								colVal
							);
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

									return React.createElement(
										'td',
										{ key: key },
										colVal,
										_colVal
									);
								} catch (e) {
									return React.createElement('td', { key: key });
								}
							}
							// 是否有chexkbox
							else if (col.checkbox) {
									return React.createElement(
										'td',
										{ key: key },
										React.createElement('input', { type: 'checkbox', name: col.field, value: row[col.field], checked: row.isCheck, onChange: this.handlerCheck })
									);
								}
					}
				}).bind(this)),
				React.createElement(
					'td',
					null,
					rowHandlesDOM
				)
			);
		}
	});

	/**
  * TUI Pagination 表格组件-分页组件
  * Children
  */
	var Pagination = React.createClass({
		displayName: 'Pagination',

		changeMaxSize: function () {
			this.props.changeMaxSize(this.refs.maxSize.value);
		},
		render: function () {

			// 总纪录数
			var rowCount = Number(this.props.rowCount) || 0,
			   
			// 当前页
			currentPage = Number(this.props.currentPage),
			   
			// 每页显示纪录数，默认10条
			maxSize = this.props.maxSize,
			   
			// 最大分页数
			maxPageCount = 5,
			   
			// 总页数
			pageCount = rowCount % maxSize === 0 ? rowCount / maxSize : parseInt(rowCount / maxSize) + 1;

			// 分页数DOM
			var pagesDOM = [],
			    begin = 1,
			    end = pageCount + 1;

			if (pageCount > maxPageCount) {

				if (currentPage - 5 >= 0) {
					/**
      * 限制每次最多展示5页 展示不同的页数算法也不一样
      */
					begin = currentPage - 2;
					end = currentPage + 2;
					if (currentPage >= pageCount - 3) {
						begin = pageCount - maxPageCount + 1;
						end = pageCount;
					}

					pagesDOM.push(React.createElement(
						'li',
						{ key: 1 },
						React.createElement(
							'a',
							{ href: 'javascript:;', onClick: this.props._pagingClick, 'data-page': 1 },
							1,
							'...'
						)
					));
					end++;
				} else {

					end = maxPageCount + 1;
				}
			}

			for (var i = begin; i < end; i++) {
				var _page = React.createElement(
					'li',
					{ key: i },
					React.createElement(
						'a',
						{ href: 'javascript:;', onClick: this.props._pagingClick, 'data-page': i },
						i
					)
				);

				if (i === currentPage) {
					_page = React.createElement(
						'li',
						{ key: i, className: 'active' },
						React.createElement(
							'a',
							{ href: 'javascript:;' },
							i
						)
					);
				}

				pagesDOM.push(_page);
			}

			if (pageCount - currentPage > 3) {
				pagesDOM.push(React.createElement(
					'li',
					{ key: pageCount },
					React.createElement(
						'a',
						{ href: 'javascript:;', onClick: this.props._pagingClick, 'data-page': pageCount },
						'...',
						pageCount
					)
				));
			}

			return React.createElement(
				'nav',
				null,
				React.createElement(
					'ul',
					{ className: 'pager' },
					React.createElement(
						'li',
						null,
						React.createElement(
							'small',
							{ style: { 'marginRight': '10px' } },
							React.createElement(
								'span',
								null,
								'共有 ',
								rowCount,
								' 条,每页显示 ',
								React.createElement(
									'select',
									{ ref: 'maxSize', defaultValue: maxSize, onChange: this.changeMaxSize },
									React.createElement(
										'option',
										{ value: '10' },
										'10'
									),
									React.createElement(
										'option',
										{ value: '15' },
										'15'
									),
									React.createElement(
										'option',
										{ value: '20' },
										'20'
									),
									React.createElement(
										'option',
										{ value: '30' },
										'30'
									),
									React.createElement(
										'option',
										{ value: '50' },
										'50'
									),
									React.createElement(
										'option',
										{ value: '100' },
										'100'
									)
								),
								' 条'
							)
						)
					),
					React.createElement(
						'li',
						null,
						React.createElement(
							'a',
							{ href: 'javascript:;', style: { 'padding': '2px 7px' }, onClick: currentPage === 1 || currentPage - 1 === 0 ? '' : this.props._pagingClick, 'data-page': currentPage - 1 },
							React.createElement('i', { className: 'fa fa-arrow-left' })
						)
					),
					pagesDOM,
					React.createElement(
						'li',
						null,
						React.createElement(
							'a',
							{ href: 'javascript:;', style: { 'padding': '2px 7px' }, onClick: currentPage === pageCount || currentPage + 1 > pageCount ? '' : this.props._pagingClick, 'data-page': currentPage + 1 },
							React.createElement('i', { className: 'fa fa-arrow-right' })
						)
					)
				)
			);
		}
	});

	/**
  * 封装表格
  * 支持两种格式的参数
  * 方式一: { options: [表格操作参数], entity: [实体操作参数] }
  * 方式二: options, entity
  */
	var Table = function (tableProps) {
		try {
			if (!tableProps.options) {
				if (arguments.length === 2) {
					tableProps = {
						options: arguments[0],
						entity: arguments[1]
					};
				} else {
					tableProps = {
						options: arguments[0]
					};
				}
			}

			var options = tableProps.options,
			    container = options.container,
			    targetContainer = document.getElementById(container);

			if (targetContainer) {
				var formId = options.formId || 'tui-' + Math.random().toString(36).substr(2),
				   
				/*
     * 初始化搜索栏
     */
				initSearchbar = function () {
					var searchbar = options.searchbar,
					    searchbarCols = [],
					    searchbarProps = {
						// 是否有添加按钮
						hasAdd: tableProps.entity && tableProps.entity.create ? true : false
					};

					// 初始化筛选工具栏
					if (searchbar instanceof Array && searchbar.length > 0) {

						for (var i = 0; i < searchbar.length; i++) {
							if (typeof searchbar[i] === 'object' && searchbar[i].field) {
								searchbarCols.push({ field: searchbar[i].field, type: searchbar[i].type || 'text' });
							}
						}

						searchbarProps.searchbar = searchbar;
						searchbarProps.searchbarCols = searchbarCols;
						searchbarProps.formId = formId;
					} else {

						searchbarProps.searchbar = [];
					}

					return {
						searchbarProps: searchbarProps,
						searchbarCols: searchbarCols
					};
				},
				   
				/*
     * 初始化工具栏
     */
				initToolbar = function () {
					var toolbar = options.toolbar,
					    toolbarProps = {};

					if (toolbar instanceof Array && toolbar.length > 0) {

						toolbarProps.toolbar = toolbar;
					} else {

						toolbarProps.toolbar = [];
					}

					return {
						toolbarProps: toolbarProps
					};
				};

				tableProps.searchbar = initSearchbar();
				tableProps.toolbar = initToolbar();
				tableProps.options.formId = formId;

				ReactDOM.render(React.createElement(TableComp, tableProps), document.getElementById(container));
			} else {
				TUI.danger('目标容器[' + container + ']不存在');
				console.error('目标容器[' + container + ']不存在');
			}
		} catch (e) {
			TUI.danger('初始化Table错误,请检查参数');
			console.error('初始化Table错误,请检查参数');
		}
	};

	/**
  * TUI Modal 模态框组件
  */
	var ModalComp = React.createClass({
		displayName: 'ModalComp',

		confirm: function () {
			if (this.props.confirm() === 'success') {
				$('#' + this.props.id).modal('hide');
			}
		},
		render: function () {
			var content = { __html: this.props.content },
			    confirmBtn = '';

			if (typeof this.props.confirm === 'function') {
				confirmBtn = React.createElement(
					'button',
					{ type: 'button', className: 'ebtn ebtn-success ebtn-rounded', onClick: this.confirm },
					'确定'
				);
			}

			return React.createElement(
				'div',
				{ id: this.props.id, className: 'modal fade', tabIndex: '-1', role: 'dialog', 'aria-labelledby': this.props.id + 'Label', 'aria-hidden': 'true' },
				React.createElement(
					'div',
					{ className: 'modal-dialog ' + this.props.type, role: 'document' },
					React.createElement(
						'div',
						{ className: 'modal-content' },
						React.createElement(
							'div',
							{ className: 'modal-header' },
							React.createElement(
								'button',
								{ type: 'button', className: 'close', 'data-dismiss': 'modal', 'aria-label': 'Close' },
								React.createElement(
									'span',
									{ 'aria-hidden': 'true' },
									'×'
								),
								React.createElement(
									'span',
									{ className: 'sr-only' },
									'Close'
								)
							),
							React.createElement(
								'h4',
								{ className: 'modal-title', id: this.props.id + 'Label' },
								this.props.title
							)
						),
						React.createElement(
							'div',
							{ className: 'modal-body' },
							React.createElement(
								'div',
								{ className: 'row' },
								React.createElement('div', { className: 'col-md-12', dangerouslySetInnerHTML: content })
							)
						),
						React.createElement(
							'div',
							{ className: 'modal-footer' },
							React.createElement(
								'button',
								{ type: 'button', className: 'ebtn ebtn-default ebtn-rounded', 'data-dismiss': 'modal' },
								'取消'
							),
							' ',
							confirmBtn
						)
					)
				)
			);
		}
	});

	/**
  * 模态框
  * @params
  * 		id:			模态框ID
  * 		type:		类型，大（modal-lg）、中、小（modal-sm）
  * 		title:
  * 		content:
  * 		confirm:
  * 		className:
  */
	var Modal = function (modalProps) {
		var modalDOM = document.getElementById('tui-modal-container');

		if (typeof modalProps.type === 'string') {
			switch (modalProps.type) {
				case 'lg':
					modalProps.type = 'modal-lg';
					break;
				case 'sm':
					modalProps.type = 'modal-sm';
					break;
				default:
					modalProps.type = '';
					break;
			}
		}

		var _modalProps = {
			id: modalProps.id || 'tui-modal-' + Math.random().toString(36).substr(2),
			type: modalProps.type || '',
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

		ReactDOM.render(React.createElement(ModalComp, _modalProps), modalDOM);

		setTimeout(function () {
			$('#' + _modalProps.id).modal('show');
		}, 100);
	};

	/**
  * 弹出提示信息，如成功，失败
  */
	var AlertModal = React.createClass({
		displayName: 'AlertModal',

		render: function () {
			return React.createElement(
				'span',
				{ className: this.props.type },
				this.props.msg
			);
		}
	});

	var Alert = function (obj) {
		var alertDOM = document.createElement('div');
		alertDOM.className = 'tui-alert-modal';
		document.body.appendChild(alertDOM);
		ReactDOM.render(React.createElement(AlertModal, { type: obj.type, msg: obj.msg }), alertDOM);

		setTimeout(function () {
			alertDOM.className = 'hide';
			document.body.removeChild(alertDOM);
		}, 3800);
	};

	var success = function (msg) {
		this.Alert({ type: 'success', msg: msg });
	};

	var danger = function (msg) {
		this.Alert({ type: 'danger', msg: msg });
	};

	var warning = function (msg) {
		this.Alert({ type: 'warning', msg: msg });
	};

	var info = function (msg) {
		this.Alert({ type: 'info', msg: msg });
	};

	/**
  * 加载提示框
  */
	var LoadingModal = React.createClass({
		displayName: 'LoadingModal',

		render: function () {
			return React.createElement(
				'div',
				{ className: 'tui-loading-parent ' + this.props.className },
				React.createElement(
					'div',
					{ className: 'tui-loading' },
					React.createElement(
						'span',
						{ className: 'text' },
						this.props.text,
						' ',
						React.createElement('i', { className: 'fa fa-spinner fa-spin fa-lg' })
					)
				)
			);
		}
	});

	var Loading = function (obj) {
		var loadingDOM = document.getElementsByClassName('tui-loading-container'),
		    dom = '';
		if (loadingDOM.length === 0) {
			dom = document.createElement('div');
			dom.className = 'tui-loading-container';
			document.body.appendChild(dom);
		} else {
			dom = loadingDOM[0];
		}

		ReactDOM.render(React.createElement(LoadingModal, { className: obj && obj.className ? obj.className : 'show', text: obj && obj.text ? obj.text : '正在加载' }), dom);
	};

	// 常用工具类
	var Utils = {
		// 日期转换 毫秒转
		dateFormat: function (value, style) {
			if (value) {
				var dateFormat = new Date(value),
				    style = style || '',
				    year = dateFormat.getYear() + 1900,
				    month = (dateFormat.getMonth() + 1 + '').length == 1 ? '0' + (dateFormat.getMonth() + 1) : dateFormat.getMonth() + 1,
				    date = (dateFormat.getDate() + '').length == 1 ? '0' + dateFormat.getDate() : dateFormat.getDate(),
				    hour = (dateFormat.getHours() + '').length == 1 ? '0' + dateFormat.getHours() : dateFormat.getHours(),
				    minute = (dateFormat.getMinutes() + '').length == 1 ? '0' + dateFormat.getMinutes() : dateFormat.getMinutes(),
				    second = (dateFormat.getSeconds() + '').length == 1 ? '0' + dateFormat.getSeconds() : dateFormat.getSeconds();

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
		getElementLeft: function (e) {
			e = e.target;

			var actualLeft = e.offsetLeft;
			var current = e.offsetParent;

			while (current !== null) {
				actualLeft += current.offsetLeft;
				current = current.offsetParent;
			}

			return actualLeft;
		},
		getElementTop: function (e) {
			e = e.target;

			var actualTop = e.offsetTop;
			var current = e.offsetParent;

			while (current !== null) {
				actualTop += current.offsetTop;
				current = current.offsetParent;
			}

			return actualTop;
		}
	};

	// 表格刷新
	var tableRefresh = function (tableProps) {
		try {
			tableProps.options.refresh = true;
			Table(tableProps);
		} catch (ex) {
			TUI.danger('TUI tableRefresh 异常，' + ex);
			console.error('TUI tableRefresh 异常，' + ex);
		}
	};

	// 表格
	TUI.table = Table;
	TUI.tableRefresh = tableRefresh;
	// 模态框
	TUI.Modal = Modal;
	TUI.modal = Modal;
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
		define(function () {
			return TUI;
		});
	} else {
		window.TUI = TUI;
	}
}).call(function () {
	return this || (typeof window !== 'undefined' ? window : global);
});