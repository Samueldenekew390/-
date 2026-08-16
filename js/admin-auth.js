/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Admin Authentication Manager
   ========================================================================== */

const AdminAuth = {
  // Check if current URL is the admin login page
  isLoginPage() {
    const p = (window.location.pathname || '').toLowerCase();
    const h = (window.location.href || '').toLowerCase();
    return p.includes('admin-login') || h.includes('admin-login');
  },

  // Check if current URL is the admin dashboard page
  isAdminDashboardPage() {
    const p = (window.location.pathname || '').toLowerCase();
    const h = (window.location.href || '').toLowerCase();
    return (p.includes('admin') && !p.includes('admin-login')) || (h.includes('admin.html') && !h.includes('admin-login'));
  },

  // Synchronous session check
  isLoggedIn() {
    const sessionActive = sessionStorage.getItem('eth_admin_session') === 'active' || 
                          localStorage.getItem('eth_admin_session') === 'active';
    const hasAdminToken = !!(sessionStorage.getItem('eth_admin_user') || localStorage.getItem('eth_admin_user'));
    return sessionActive || hasAdminToken;
  },

  // Get current admin user details
  getCurrentUser() {
    try {
      const userStr = sessionStorage.getItem('eth_admin_user') || localStorage.getItem('eth_admin_user');
      return userStr ? JSON.parse(userStr) : { email: 'admin@ethiolottery.et', role: 'admin' };
    } catch {
      return { email: 'admin@ethiolottery.et', role: 'admin' };
    }
  },

  // Check auth state and redirect appropriately
  async checkAuthAndRedirect() {
    const isLogin = this.isLoginPage();
    const isDashboard = this.isAdminDashboardPage();
    const loggedIn = this.isLoggedIn();

    // Also check Supabase async session if client exists
    if (!loggedIn && window.dbService && window.dbService.supabase) {
      try {
        const { data: { session } } = await window.dbService.supabase.auth.getSession();
        if (session && session.user) {
          this.setAdminSession(session.user, true);
          if (isLogin) {
            window.location.replace('admin.html');
            return true;
          }
          return true;
        }
      } catch (err) {
        console.warn('Supabase getSession check:', err);
      }
    }

    if (!loggedIn && isDashboard) {
      // Unauthenticated admin access -> redirect to login page (NEVER index.html)
      window.location.replace('admin-login.html');
      return false;
    } else if (loggedIn && isLogin) {
      // Already authenticated -> redirect to admin dashboard
      window.location.replace('admin.html');
      return true;
    }

    return loggedIn;
  },

  setAdminSession(user, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('eth_admin_session', 'active');
    storage.setItem('eth_admin_user', JSON.stringify({
      id: user?.id || 'admin-local',
      email: user?.email || 'admin@ethiolottery.et',
      role: 'admin',
      authenticated_at: new Date().toISOString()
    }));
  },

  // Login handler supporting Supabase Auth and credentials validation
  async login(email, password, rememberMe = false) {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if (!trimmedPass) {
      return { success: false, message: 'እባክዎ የይለፍ ቃል ያስገቡ።' };
    }

    // 1. Try authenticating with Supabase if Supabase is connected
    if (window.dbService && window.dbService.supabase && trimmedEmail) {
      try {
        const { data, error } = await window.dbService.supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPass
        });

        if (!error && data && data.user) {
          this.setAdminSession(data.user, rememberMe);
          return { success: true, user: data.user };
        } else if (error) {
          console.warn('Supabase Auth response:', error.message);
        }
      } catch (err) {
        console.warn('Supabase login exception:', err);
      }
    }

    // 2. Fallback / Local Admin check (for demo, testing, and offline administration)
    const validPasswords = ['ethio2019', 'admin123', 'admin', 'admin@2019', 'lottery2019'];
    const passMatch = validPasswords.includes(trimmedPass);

    if (passMatch) {
      const user = {
        id: 'admin-' + Date.now(),
        email: trimmedEmail || 'admin@ethiolottery.et',
        role: 'admin'
      };
      this.setAdminSession(user, rememberMe);
      return { success: true, user };
    }

    return { 
      success: false, 
      message: 'የተሳሳተ ኢሜይል ወይም የይለፍ ቃል አስገብተዋል። እባክዎ እንደገና ይሞክሩ።' 
    };
  },

  async logout() {
    try {
      if (window.dbService && window.dbService.supabase) {
        await window.dbService.supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase signout notice:', e);
    }
    sessionStorage.removeItem('eth_admin_session');
    sessionStorage.removeItem('eth_admin_user');
    localStorage.removeItem('eth_admin_session');
    localStorage.removeItem('eth_admin_user');
    window.location.replace('admin-login.html');
  }
};

window.AdminAuth = AdminAuth;
