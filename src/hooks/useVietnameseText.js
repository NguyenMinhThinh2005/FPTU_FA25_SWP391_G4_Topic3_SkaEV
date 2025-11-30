import { getText, formatText } from '../utils/vietnameseTexts';

/**
 * Hook để sử dụng văn bản tiếng Việt trong components
 * 
 * @returns {object} Object chứa các hàm tiện ích để lấy văn bản
 */
export const useVietnameseText = () => {
    /**
     * Lấy văn bản theo đường dẫn
     * @param {string} path - Đường dẫn đến văn bản (vd: "auth.login")
     * @param {string} fallback - Văn bản mặc định nếu không tìm thấy
     * @returns {string} Văn bản tiếng Việt
     */
    const t = (path, fallback = '') => {
        return getText(path, fallback);
    };

    /**
     * Lấy văn bản và format với biến
     * @param {string} path - Đường dẫn đến văn bản
     * @param {object} variables - Object chứa các biến để thay thế
     * @param {string} fallback - Văn bản mặc định nếu không tìm thấy
     * @returns {string} Văn bản tiếng Việt đã được format
     */
    const tf = (path, variables = {}, fallback = '') => {
        return formatText(path, variables, fallback);
    };

    return { t, tf, getText, formatText };
};

export default useVietnameseText;