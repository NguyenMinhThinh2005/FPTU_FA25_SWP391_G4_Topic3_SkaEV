// ===================================
// TOKEN DIAGNOSTIC SCRIPT
// Paste this into Browser Console (F12)
// ===================================

console.log("🔍 =========================");
console.log("🔍 AUTH TOKEN DIAGNOSTIC");
console.log("🔍 =========================\n");

// Check sessionStorage
const sessionToken = sessionStorage.getItem("token");
const sessionRefresh = sessionStorage.getItem("refreshToken");

// Check localStorage
const localToken = localStorage.getItem("token");

// Check auth store
let authStore = null;
try {
  authStore = JSON.parse(sessionStorage.getItem("skaev-auth-storage"));
} catch (e) {
  // ignore parse errors for diagnostic script
}

console.log("📦 Storage Status:");
console.log("  sessionStorage.token:", sessionToken ? "✅ EXISTS" : "❌ NULL");
console.log("  localStorage.token:", localToken ? "✅ EXISTS" : "❌ NULL");
console.log(
  "  sessionStorage.refreshToken:",
  sessionRefresh ? "✅ EXISTS" : "❌ NULL"
);
console.log("  skaev-auth-storage:", authStore ? "✅ EXISTS" : "❌ NULL");

const token = sessionToken || localToken;

if (!token) {
  console.log("\n❌ ===========================");
  console.log("❌ NO TOKEN FOUND!");
  console.log("❌ ===========================");
  console.log("❌ User is NOT logged in");
  console.log("❌ You need to log in first!");
  console.log("\n💡 Solution:");
  console.log("   1. Go to /login");
  console.log("   2. Enter credentials");
  console.log("   3. Check this diagnostic again");
} else {
  console.log("\n✅ Token found!");
  console.log("\n📄 Token Preview (first 50 chars):");
  console.log("  ", token.substring(0, 50) + "...");

  try {
    // Decode token
    const payload = JSON.parse(atob(token.split(".")[1]));

    console.log("\n👤 Token Payload:");
    console.log("  User ID:", payload.nameid || payload.sub || "N/A");
    console.log("  Email:", payload.email || "N/A");
    console.log("  Role:", payload.role || "N/A");
    console.log(
      "  Issued At:",
      new Date((payload.iat || 0) * 1000).toLocaleString()
    );
    console.log(
      "  Expires At:",
      new Date((payload.exp || 0) * 1000).toLocaleString()
    );

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp && payload.exp < now;
    const timeUntilExpiry = payload.exp ? payload.exp - now : null;

    if (isExpired) {
      console.log("\n❌ ===========================");
      console.log("❌ TOKEN IS EXPIRED!");
      console.log("❌ ===========================");
      console.log("💡 Solution: Log in again to get a new token");
    } else {
      console.log("\n✅ Token is VALID");
      if (timeUntilExpiry) {
        const minutes = Math.floor(timeUntilExpiry / 60);
        const hours = Math.floor(minutes / 60);
        console.log(
          "  Time until expiry:",
          hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
        );
      }
    }

    console.log("\n🔐 Full Decoded Payload:");
    console.log(JSON.stringify(payload, null, 2));
  } catch (e) {
    console.log("\n❌ Error decoding token:", e.message);
    console.log("❌ Token format is invalid!");
  }
}

// Check auth store state
if (authStore && authStore.state) {
  console.log("\n📊 Auth Store State:");
  console.log("  isAuthenticated:", authStore.state.isAuthenticated);
  console.log("  user:", authStore.state.user);
}

console.log("\n🧪 =========================");
console.log("🧪 TEST API CALL");
console.log("🧪 =========================");

if (token) {
  console.log("Testing with token...\n");

  fetch("http://localhost:5000/api/vehicles", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log(
        "📡 API Response Status:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        console.log("✅ API CALL SUCCESS! Token is working!");
      } else if (response.status === 401) {
        console.log("❌ 401 UNAUTHORIZED - Token is invalid or expired");
      } else if (response.status === 403) {
        console.log(
          "⚠️ 403 FORBIDDEN - Token valid but insufficient permissions"
        );
      }

      return response.json().catch(() => response.text());
    })
    .then((data) => {
      console.log("📦 Response Data:", data);
    })
    .catch((error) => {
      console.error("❌ API Call Error:", error);
    });
} else {
  console.log("⚠️ Skipping API test (no token available)");
}

console.log("\n💡 =========================");
console.log("💡 QUICK ACTIONS");
console.log("💡 =========================");
console.log('Copy full token: copy(sessionStorage.getItem("token"))');
console.log("Clear tokens: sessionStorage.clear(); localStorage.clear();");
console.log("Re-run diagnostic: (paste this script again)");
console.log("=========================\n");
