'use strict';

(function () {
	var DatePickerComp = React.createClass({
		getInitialState: function getInitialState() {
			var date = new Date();
			return {
				className: 'show',
				year: date.getFullYear(),
				month: date.getMonth() + 1,
				daysObj: []
			};
		},
		componentDidMount: function componentDidMount() {
			if (this.isMounted()) {
				this.setState({
					daysObj: this.renderDays()
				});
			}
		},
		componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
			if (nextProps.className && nextProps.className.length > 0) {
				this.setState({ className: nextProps.className });
			}
		},
		// 获取月份的天数
		getMonthDays: function getMonthDays(year, month) {
			var days = 0;

			if (month === 2) {
				days = year % 4 === 0 ? 29 : 28;
			} else if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
				days = 31;
			} else {
				days = 30;
			}

			return days;
		},
		// 渲染目标日期的天数
		renderDays: function renderDays(year, month) {
			year = year || this.state.year;
			month = month || this.state.month;

			// 获取目标日期和目标月份的天数
			var targetDate = new Date(year + '-' + month + '-1'),
			    targetDays = this.getMonthDays(year, month),
			    day = targetDate.getDay();

			var daysObj = [],
			    daysArr = [],
			    daysInx = 0;

			for (var i = 0; i < day; i++) {
				daysArr.push('');
			}

			for (var i = 1; i < targetDays + 1; i++) {
				daysArr.push(i);

				// 每7天一组，按顺序排列
				if (daysArr.length === 7) {
					daysObj.push({ daysArr: daysArr });
					daysArr = [];
				}

				if (i === targetDays) {
					daysObj.push({ daysArr: daysArr });
				}
			}

			return daysObj;
		},
		// 文本框赋值
		setDate: function setDate(e) {
			e.preventDefault();

			if (e.target.dataset.day !== '') {
				var date = this.state.year + '-' + this.state.month + '-' + e.target.dataset.day;
				$('#' + this.props.formId).find('#' + this.props.target.id).val(date);
				this.setState({ className: 'hide' });
			}
		},
		// 上个月
		prevMonth: function prevMonth(e) {
			e.preventDefault();

			var year = this.state.year,
			    month = this.state.month;

			if (month - 1 === 0) {
				year--;
				month = 12;
			} else {
				month--;
			}

			this.setState({
				year: year,
				month: month,
				daysObj: this.renderDays(year, month)
			});
		},
		// 下个月
		nextMonth: function nextMonth(e) {
			e.preventDefault();

			var year = this.state.year,
			    month = this.state.month;

			if (month + 1 === 13) {
				year++;
				month = 1;
			} else {
				month++;
			}

			this.setState({
				year: year,
				month: month,
				daysObj: this.renderDays(year, month)
			});
		},
		close: function close(e) {
			e.preventDefault();

			this.setState({ className: 'hide' });
		},
		render: function render() {
			return React.createElement(
				'div',
				{ className: 'panel panel-default ' + this.state.className },
				React.createElement(
					'div',
					{ className: 'panel-body' },
					React.createElement(
						'div',
						{ className: 'tui-datepicker-head' },
						React.createElement(
							'a',
							{ onClick: this.prevMonth, href: 'javascript:;', className: 'pull-left', style: { 'padding': '8', 'margin': '8px 0', 'lineHeight': '0' } },
							React.createElement('i', { className: 'fa fa-arrow-left' })
						),
						React.createElement(
							'a',
							{ href: 'javascript:;', style: { 'padding': '8px 50px' } },
							this.state.month + '月',
							' ',
							this.state.year
						),
						React.createElement(
							'a',
							{ onClick: this.nextMonth, href: 'javascript:;', className: 'pull-right', style: { 'padding': '8', 'margin': '8px 0', 'lineHeight': '0' } },
							React.createElement('i', { className: 'fa fa-arrow-right' })
						)
					),
					React.createElement(
						'table',
						null,
						React.createElement(
							'thead',
							null,
							React.createElement(
								'tr',
								null,
								React.createElement(
									'th',
									null,
									'Su'
								),
								React.createElement(
									'th',
									null,
									'Mo'
								),
								React.createElement(
									'th',
									null,
									'Tu'
								),
								React.createElement(
									'th',
									null,
									'We'
								),
								React.createElement(
									'th',
									null,
									'Th'
								),
								React.createElement(
									'th',
									null,
									'Fr'
								),
								React.createElement(
									'th',
									null,
									'Sa'
								)
							)
						),
						React.createElement(
							'tbody',
							null,
							this.state.daysObj.map((function (d, key) {
								var daysDOM = [],
								    daysArr = d.daysArr;

								for (var i = 0; i < daysArr.length; i++) {
									daysDOM.push(React.createElement(
										'td',
										{ key: i, 'data-day': daysArr[i], onClick: this.setDate },
										React.createElement(
											'a',
											{ 'data-day': daysArr[i], href: 'javascript:;' },
											daysArr[i]
										)
									));
								}

								return React.createElement(
									'tr',
									{ key: key },
									daysDOM
								);
							}).bind(this))
						)
					),
					React.createElement(
						'div',
						{ className: 'tui-datepicker-foot' },
						React.createElement(
							'a',
							{ href: 'javascript:;', onClick: this.close },
							React.createElement('i', { className: 'fa fa-close fa-lg' })
						)
					)
				)
			);
		}
	});

	var datePicker = function datePicker(e, formId) {
		var datePickerDOM = document.getElementById('tui-datepicker');

		if (!datePickerDOM) {
			datePickerDOM = document.createElement('div');
			datePickerDOM.id = 'tui-datepicker';
			datePickerDOM.className = 'tui-datepicker';
			document.body.appendChild(datePickerDOM);
		}

		datePickerDOM.style.display = 'block';
		$('#tui-datepicker').offset({ top: TUI.Utils.getElementTop(e) + e.target.offsetHeight, left: TUI.Utils.getElementLeft(e) });

		ReactDOM.render(React.createElement(DatePickerComp, { formId: formId, className: 'show', target: e.target }), datePickerDOM);
	};

	TUI.datePicker = datePicker;
})();