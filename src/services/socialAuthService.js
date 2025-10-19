// Social authentication service
// TODO: Implement real social authentication with backend API

class SocialAuthService {
  constructor() {
    this.providers = {
      google: {
        clientId: import.meta.env?.VITE_GOOGLE_CLIENT_ID || "",
        redirectUri: `${window.location.origin}/auth/google/callback`,
        scope: "openid profile email",
      },
    };
  }

  // Google OAuth Login - To be implemented with real backend
  async loginWithGoogle() {
    throw new Error(
      "Social authentication not yet implemented. Please use email/password login."
    );
  }

  // Phone number verification - To be implemented with real backend
  async loginWithPhone(phoneNumber) {
    throw new Error(
      "Phone authentication not yet implemented. Please use email/password login."
    );
  }

  async verifyPhoneOTP(phoneNumber, otpCode) {
    throw new Error("Phone OTP verification not yet implemented.");
  }

  // Build auth URLs
  buildGoogleAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.providers.google.clientId,
      redirect_uri: this.providers.google.redirectUri,
      scope: this.providers.google.scope,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  // Link social account to existing account - To be implemented
  async linkSocialAccount(userId, provider, socialData) {
    throw new Error("Account linking not yet implemented.");
  }

  // Unlink social account - To be implemented
  async unlinkSocialAccount(userId, provider) {
    throw new Error("Account unlinking not yet implemented.");
  }

  // Get linked accounts for user - To be implemented
  async getLinkedAccounts() {
    throw new Error("Getting linked accounts not yet implemented.");
  }
}

// Create singleton instance
export const socialAuthService = new SocialAuthService();

// Convenience methods
export const loginWithGoogle = () => socialAuthService.loginWithGoogle();
export const loginWithPhone = (phone) =>
  socialAuthService.loginWithPhone(phone);
export const verifyPhoneOTP = (phone, otp) =>
  socialAuthService.verifyPhoneOTP(phone, otp);

// Google Auth object for login/register consistency
export const googleAuth = {
  signIn: async () => {
    throw new Error("Google authentication not yet implemented.");
  },

  signUp: async () => {
    throw new Error("Google registration not yet implemented.");
  },
};

// Phone OTP service object
export const phoneOTPService = {
  sendOTP: (phone) => socialAuthService.loginWithPhone(phone),
  verifyOTP: (phone, otp) => socialAuthService.verifyPhoneOTP(phone, otp),
};

export default socialAuthService;
