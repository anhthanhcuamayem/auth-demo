let supabaseClient;
let mode = 'login';

const $ = (selector) => document.querySelector(selector);
const authView = $('#auth-view');
const dashboardView = $('#dashboard-view');
const form = $('#auth-form');
const message = $('#form-message');
const submitButton = $('#submit-button');
const submitLabel = $('#submit-label');

function setMessage(text = '', type = '') {
  message.textContent = text;
  message.className = `message ${type}`;
}

function setLoading(loading) {
  submitButton.disabled = loading;
  submitLabel.classList.toggle('hidden', loading);
  submitButton.querySelector('.spinner').classList.toggle('hidden', !loading);
}

function setMode(nextMode) {
  mode = nextMode;
  const isSignup = mode === 'signup';
  $('.name-field').classList.toggle('hidden', !isSignup);
  $('.confirm-field').classList.toggle('hidden', !isSignup);
  $('#forgot-button').classList.toggle('hidden', isSignup);
  $('#remember').closest('.check-label').classList.toggle('hidden', isSignup);
  $('#form-eyebrow').textContent = isSignup ? 'START SOMETHING NEW' : 'WELCOME BACK';
  $('#form-title').textContent = isSignup ? 'Tạo tài khoản mới' : 'Chào mừng trở lại';
  $('#form-subtitle').textContent = isSignup ? 'Đăng ký để bắt đầu không gian riêng của bạn.' : 'Đăng nhập để tiếp tục hành trình của bạn.';
  submitLabel.textContent = isSignup ? 'Tạo tài khoản' : 'Đăng nhập';
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
  });
  form.reset();
  $('#remember').checked = true;
  setMessage();
}

function friendlyError(error) {
  const text = (error?.message || '').toLowerCase();
  if (text.includes('invalid login credentials')) return 'Email hoặc mật khẩu không chính xác.';
  if (text.includes('user already registered')) return 'Email này đã được đăng ký. Hãy đăng nhập.';
  if (text.includes('password should be at least')) return 'Mật khẩu cần có ít nhất 6 ký tự.';
  if (text.includes('email not confirmed')) return 'Email chưa được xác nhận. Hãy kiểm tra hộp thư của bạn.';
  if (text.includes('rate limit')) return 'Bạn thử quá nhiều lần. Vui lòng đợi một chút rồi thử lại.';
  return error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
}

function showDashboard(user) {
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'bạn';
  $('#user-name').textContent = name;
  $('#user-email').textContent = user.email || '';
  $('#user-avatar').textContent = name.trim().charAt(0).toUpperCase();
  authView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
}

async function handleSubmit(event) {
  event.preventDefault();
  setMessage();
  const email = $('#email').value.trim();
  const password = $('#password').value;
  if (!email || !password) return setMessage('Vui lòng điền đầy đủ email và mật khẩu.', 'error');
  if (password.length < 6) return setMessage('Mật khẩu cần có ít nhất 6 ký tự.', 'error');
  if (mode === 'signup' && password !== $('#confirm-password').value) return setMessage('Mật khẩu nhập lại chưa khớp.', 'error');

  setLoading(true);
  try {
    let result;
    if (mode === 'signup') {
      result = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: $('#name').value.trim() } }
      });
      if (result.error) throw result.error;
      if (result.data.session) showDashboard(result.data.user);
      else setMessage('Đăng ký thành công! Hãy kiểm tra email để xác nhận tài khoản.', 'success');
    } else {
      result = await supabaseClient.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      showDashboard(result.data.user);
    }
  } catch (error) {
    setMessage(friendlyError(error), 'error');
  } finally {
    setLoading(false);
  }
}

async function init() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('Thiếu cấu hình Supabase trên server.');
    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.user) showDashboard(session.user);
    supabaseClient.auth.onAuthStateChange((_event, sessionState) => {
      if (sessionState?.user) showDashboard(sessionState.user);
      else { dashboardView.classList.add('hidden'); authView.classList.remove('hidden'); }
    });
  } catch (error) {
    setMessage(error.message || 'Không thể kết nối Supabase.', 'error');
  }
}

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
form.addEventListener('submit', handleSubmit);
$('.show-password').addEventListener('click', () => {
  const passwordInput = $('#password');
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  $('.show-password').textContent = passwordInput.type === 'password' ? 'Hiện' : 'Ẩn';
});
$('#logout-button').addEventListener('click', async () => { await supabaseClient.auth.signOut(); });
$('#forgot-button').addEventListener('click', async () => {
  const email = $('#email').value.trim();
  if (!email) return setMessage('Nhập email trước để nhận link đặt lại mật khẩu.', 'error');
  setLoading(true);
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
  setLoading(false);
  setMessage(error ? friendlyError(error) : 'Link đặt lại mật khẩu đã được gửi tới email của bạn.', error ? 'error' : 'success');
});
init();
