;(function(){
	if (typeof jQuery === 'undefined' || typeof React === 'undefined') {
		throw new Error('TUI requires jQuery and React.');
	}

	var TUI = window.TUI || {};

	var Login = React.createClass({
		getInitialState: function() {
			return {
				alertClass: 'alert tui-alert',
				captchaClass: 'hide'
			};
		},
		// 刷新验证码
		refreshCaptcha() {
			$('input[name=checkCaptcha]').val('Y');
			$('#sign-captcha').attr('src', '/captcha?' + Math.random());
		},
		loginKeyDown: function(event) {
			if (event.keyCode === 13) {
				this.loginEvent();
			}
		},
		loginEvent: function() {
			var data = {
				username: this.refs[this.props.fields.username].value,
				password: this.refs[this.props.fields.password].value,
				checkCaptcha: this.refs['checkCaptcha'].value,
				captcha: this.refs['captcha'].value
			};

			// 非空验证
			if (data.username && data.password) {
				TUI.Loading({ text: '正在登录...' });

				$.post(this.props.loginUrl, data, function(result) {
					TUI.Loading({ className: 'hide' });

					if (result && result.error) {
				 		var code = result.error.code;

				 		switch(code) {
				 			case 2000:
				 				this.alertRender('用户名或密码错误');
				 				break;
				 			case 2001:
				 				this.alertRender('用户名或密码错误');
				 				break;
				 			case 2002:
				 				this.alertRender('验证码错误');
				 				this.setState({captchaClass: 'show'});
	         					this.refreshCaptcha();
				 				break;
				 			case 2003:
				 				this.alertRender('用户名或密码错误');
				 				this.setState({captchaClass: 'show'});
	         					this.refreshCaptcha();
				 				break;
				 			case 2004:
				 				this.alertRender('该用户已被冻结');
				 				break;
				 			case '-1':
				 				this.alertRender('验证码错误');
				 				this.setState({captchaClass: 'show'});
				 				this.refreshCaptcha();
				 				break;	
			 				default:
			 					this.alertRender('用户名/手机号或密码错误');		
			 					break;
				 		}
					} else {
						// 登录成功
						location.href = this.props.loginSuccessUrl;
					}
				}.bind(this));
			} else {
				this.alertRender('用户名或密码不能为空');
			}
		},
		alertRender: function(alertContent) {
			this.setState(
				{
					alertClass: 'alert alert-danger tui-alert',
					alertContent: alertContent
				}
			);
		},
		render: function() {
			return (
				<div className="col-md-4 col-md-offset-4 tui-login">
		        	<h2 className="login-header">{this.props.loginTitle}</h2>
		        	<div className={this.state.alertClass}>{this.state.alertContent}</div>
		        	<div className="well login-well">
			          	<form className="form-horizontal">
				            <div className="form-group">
			              		<input type="text" ref={this.props.fields.username} className="form-control" placeholder="用户名" style={{'height': '40px'}}/>
				            </div>
				            <div className="form-group">
				              <input type="password" ref={this.props.fields.password} className="form-control" placeholder="密码" style={{'height': '40px'}} onKeyDown={this.loginKeyDown} />
				            </div>
				            <div className={this.state.captchaClass + ' form-group'}>
								<div className="col-sm-7 captcha-col" style={{'paddingLeft': '0'}}>
									<input type="hidden" ref="checkCaptcha" name="checkCaptcha" value="N" />
	   								<input ref="captcha" name="captcha" type="text" className="form-control" placeholder="验证码" />
	   							</div>
	   							<div className="col-sm-5" style={{'paddingRight': '0'}}>
	   								<a href="javascript:;" className="pull-right" title="刷新验证码" onClick={this.refreshCaptcha} ><img style={{'height': '40px', 'width': '90px', 'borderRadius': '5px', 'border': '1px solid #ccc'}} id="sign-captcha" alt="验证码" /></a>
	   							</div>
							</div>
				            <div className="form-group" style={{'marginBottom': '0'}}>
				              <button type="button" className="ebtn ebtn-primary ebtn-rounded ebtn-lg btn-block" onClick={this.loginEvent}>登&nbsp;&nbsp;录</button>
				            </div>
			          	</form>
		        	</div>
		        	<h6 className="text-center" style={{'color': '#C8C8C8', 'fontWeight': 'normal', 'marginTop': '30'}}>建议您使用高版本的浏览器，推荐您使用谷歌浏览器享受极速体验</h6>
		        	<h6 className="text-center" style={{'color': '#C8C8C8', 'fontWeight': 'normal'}}>Powered by TUI & Trend云后台 强力驱动</h6>
		        </div>
			);
		}
	});

	// 登录
	TUI.Login = Login;

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