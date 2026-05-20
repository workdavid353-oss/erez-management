// Login screen
const Login = ({ onLogin, theme }) => {
  const [email, setEmail] = React.useState('erez@erez-legal.co.il');
  const [password, setPassword] = React.useState('••••••••');

  const submit = (e) => { e.preventDefault(); onLogin(); };

  return (
    <div className="login" data-screen-label="00 Login">
      <div className="login-pane">
        <form className="login-form" onSubmit={submit}>
          <div className="crest">א</div>
          <h1>Erez Legal</h1>
          <div className="lead">מערכת ניהול תיקים — היכנס כדי להמשיך.</div>

          <div className="field-input">
            <label htmlFor="lg-email">אימייל</label>
            <input id="lg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} dir="ltr" style={{textAlign:'right'}} />
          </div>

          <div className="field-input">
            <label htmlFor="lg-pass">סיסמה</label>
            <input id="lg-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button className="btn primary" type="submit">כניסה למערכת</button>
          <a className="forgot" href="#" onClick={e => e.preventDefault()}>שכחתי סיסמה</a>
        </form>
      </div>

      <div className="login-art">
        <div className="columns">
          <div className="col" style={{height:'70vh'}}></div>
          <div className="col" style={{height:'60vh'}}></div>
          <div className="col" style={{height:'78vh'}}></div>
          <div className="col" style={{height:'52vh'}}></div>
          <div className="col" style={{height:'66vh'}}></div>
        </div>
        <div className="quote">
          <div className="mark">״</div>
          <div className="text">המשפט הוא הסדר, והסדר הוא הצדק.</div>
          <div className="attr">EDMUND BURKE</div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Login });
