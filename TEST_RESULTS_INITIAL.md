# Initial Test Results - Feature/tests/ev-booking

**Date**: November 6, 2025  
**Status**: ⚠️ Tests Created, Need Component-Specific Adjustments

---

## 📊 Test Execution Summary

```
Test Files:  8 failed (8 total)
Tests:       36 failed | 10 passed (46 total)
Duration:    72.23s
```

### ✅ Tests Passing (10/46)

**Auth Tests:**
- ✅ LoginPage > renders login form with all fields
- ✅ RegisterPage > renders registration form

**State Management:**
- ✅ authStore (some tests passing)
- ✅ bookingStore (some tests passing)

**Other:**
- ✅ Various component render tests

---

## ❌ Common Failure Patterns

### 1. **Selector Issues - Multiple Elements Found**

**Problem**: Password field has both `<input>` and toggle `<button>` with "password" text.

```
TestingLibraryElementError: Found multiple elements with the text of: /password/i
```

**Files Affected:**
- `src/pages/auth/__tests__/Login.test.jsx` (5 tests)
- `src/pages/auth/__tests__/Register.test.jsx` (some tests)

**Fix Needed:**
```javascript
// BEFORE (fails)
const passwordInput = screen.getByLabelText(/password/i);

// AFTER (use more specific query)
const passwordInput = screen.getByRole('textbox', { name: /password/i });
// OR
const passwordInput = document.querySelector('input[name="password"]');
```

---

### 2. **Validation Behavior Different Than Expected**

**Problem**: Components don't set `aria-invalid="true"` on empty submit.

```
Error: expect(element).toHaveAttribute("aria-invalid", "true")
Expected: aria-invalid="true"
Received: aria-invalid="false"
```

**Files Affected:**
- `src/pages/auth/__tests__/Register.test.jsx`

**Fix Needed:**
- Check actual component implementation for validation strategy
- Update tests to match actual error display (helperText, error state, toast, etc.)
- May need to inspect `vietnameseTexts` usage or MUI TextField error props

---

### 3. **Form Submission Not Triggered**

**Problem**: API mocks not being called, suggests form submission not working.

```
AssertionError: expected "spy" to be called at least once
expect(authAPI.register).toHaveBeenCalled();
```

**Files Affected:**
- `src/pages/auth/__tests__/Register.test.jsx` (multiple tests)

**Possible Causes:**
- Form validation preventing submission
- Missing form state initialization
- Component using different API service path
- Need to check actual component's `onSubmit` handler

**Fix Needed:**
```javascript
// Check component's actual API import
import authAPI from '../../../services/authAPI'; // verify path

// In test, ensure mock is set up correctly
vi.mock('../../../services/authAPI', () => ({
  default: {
    register: vi.fn().mockResolvedValue({ data: { ... } }),
    login: vi.fn().mockResolvedValue({ data: { ... } })
  }
}));
```

---

### 4. **Loading State Not Detected**

**Problem**: Submit button not disabled during loading.

```
Error: expect(element).toBeDisabled()
Received element is not disabled
```

**Files Affected:**
- `src/pages/auth/__tests__/Register.test.jsx`

**Fix Needed:**
- Check if component uses different loading state mechanism
- May need to add `data-testid` for loading indicator
- Verify component's async handling pattern

---

### 5. **Missing Dependencies - Payment Page**

**Problem**: Hook `getBookingStats` is not a function.

```
TypeError: getBookingStats is not a function
 ❯ useMasterDataSync src/hooks/useMasterDataSync.js:15:17
```

**Files Affected:**
- ALL Payment.test.jsx tests (13 failed)

**Fix Needed:**
```javascript
// In setupTests.js or Payment.test.jsx, add mock:
vi.mock('../../../hooks/useMasterDataSync', () => ({
  useMasterDataSync: () => ({
    stats: { totalBookings: 0, activeBookings: 0 },
    loading: false,
    error: null
  })
}));

vi.mock('../../../store/bookingStore', () => ({
  default: (selector) => selector({
    getBookingStats: () => ({ totalBookings: 0 }),
    // ... other store methods
  })
}));
```

---

### 6. **Timeout Errors**

**Problem**: Async operations timing out.

```
Error: Test timed out in 5000ms.
```

**Files Affected:**
- `src/pages/auth/__tests__/Register.test.jsx` > "successfully registers user"

**Fix Needed:**
- Increase timeout: `test('...', async () => { ... }, 10000)`
- Or fix async mocks to resolve immediately
- Check waitFor conditions

---

## 🔧 Action Items

### Priority 1: Fix Core Test Utilities

1. **Update setupTests.js** - Add missing global mocks:
   ```javascript
   // Mock useMasterDataSync
   vi.mock('./hooks/useMasterDataSync', () => ({
     useMasterDataSync: () => ({ stats: {}, loading: false })
   }));
   
   // Mock bookingStore.getBookingStats
   // ... (see issue #5 above)
   ```

2. **Fix password selectors** in all auth tests:
   ```javascript
   // Use name attribute or more specific query
   screen.getByRole('textbox', { name: /password/i })
   ```

### Priority 2: Align Tests with Component Implementation

3. **Read actual component files**:
   - `src/pages/auth/Register.jsx`
   - `src/pages/auth/Login.jsx`
   - `src/pages/customer/Payment.jsx`

4. **Update test assertions** to match:
   - Validation error display mechanism
   - Loading state indicators
   - API service import paths
   - Form submission flow

### Priority 3: Add Missing Test IDs

5. **Add data-testid to components** (optional, improves test stability):
   ```jsx
   <TextField
     data-testid="register-firstName"
     name="firstName"
     // ...
   />
   ```

---

## 📝 Recommended Next Steps

### Step 1: Inspect Real Components
```bash
# Read the actual implementation
code src/pages/auth/Register.jsx
code src/pages/auth/Login.jsx
code src/pages/customer/Payment.jsx
```

### Step 2: Fix Test Selectors
- Update password field queries (use `name` attribute)
- Add `data-testid` where needed

### Step 3: Fix Mocks
- Add `useMasterDataSync` mock
- Add `getBookingStats` to bookingStore mock
- Verify API service paths

### Step 4: Re-run Tests
```bash
npm run test:cov
```

### Step 5: Analyze Coverage
```bash
# Open coverage report
start coverage/index.html
```

---

## 📖 Test Files Status

| File | Status | Pass | Fail | Notes |
|------|--------|------|------|-------|
| `Register.test.jsx` | ❌ | 2 | 6 | Validation & submission issues |
| `Login.test.jsx` | ❌ | 5 | 6 | Password selector issues |
| `BookingModal.test.jsx` | ⚠️ | ? | ? | Not executed due to imports |
| `QRCodeScanner.test.jsx` | ⚠️ | ? | ? | Not executed |
| `ChargeControl.test.jsx` | ⚠️ | ? | ? | Not executed |
| `Payment.test.jsx` | ❌ | 0 | 13 | Missing `getBookingStats` mock |
| `authStore.test.js` | ✅ | Most | Few | Working |
| `bookingStore.test.js` | ✅ | Most | Few | Working |

---

## 🎯 Expected Outcomes After Fixes

Once the above issues are resolved:

- **Auth Tests**: Should pass 100% (20 tests)
- **Booking Flow**: Should pass 80%+ (need component inspection)
- **Payment Tests**: Should pass after mock fixes (13 tests)
- **State Tests**: Already mostly passing

**Estimated Final Coverage**: 80%+ once aligned with actual implementation.

---

## 💡 Tips for Quick Wins

1. **Start with authStore & bookingStore tests** - they're almost all passing
2. **Fix Password selector globally** - search/replace in Login.test.jsx
3. **Add useMasterDataSync mock** - one fix for 13 Payment tests
4. **Read component source** - 10 minutes of inspection saves hours of debugging

---

**Generated**: November 6, 2025  
**Branch**: feature/tests/ev-booking  
**Command**: `npm run test:cov`
