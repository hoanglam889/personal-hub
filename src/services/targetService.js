import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getTargetsWithTodos = async () => {
  try {
    const response = await fetch(`${BASE_URL}/targets-with-todos`);
    if (!response.ok) throw new Error('Mạng mẽo có vấn đề rồi Lâm ơi');
    return await response.json();
  } catch (error) {
    console.error("Lỗi Service:", error);
    return [];
  }
};

// Sau này ông muốn thêm hàm ADD, DELETE thì cứ viết tiếp ở đây
export const addTarget = async (title) => {
    try {
        const response = await axios.post(`${BASE_URL}/targets`, { title });
        return response.data; // Trả về target mới gồm id, title, is_pinned...
    } catch (error) {
        console.error("Lỗi khi thêm target:", error);
        throw error;
    }
};

// Hàm cập nhật trạng thái Todo
export const updateTodoStatus = async (todoId, isDone) => {
    try {
        // Gửi request PUT lên server/index.js
        const response = await axios.put(`${BASE_URL}/todos/${todoId}`, {
            is_done: isDone ? 1 : 0 // Chuyển về 1/0 để MySQL dễ xử lý
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi gọi API update todo:", error);
        throw error;
    }
};

// Hàm ghim
export const pinTarget = async (targetId) => {
    try {
        const response = await axios.put(`${BASE_URL}/targets/${targetId}/pin`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi ghim target:", error);
        throw error;
    }
};
// Hàm hủy ghim
export const unpinTarget = async (targetId) => {
    try {
        const response = await axios.put(`${BASE_URL}/targets/${targetId}/unpin`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi hủy ghim target:", error);
        throw error;
    }
};

export const deleteTarget = async (targetId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/targets/${targetId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa target:", error);
        throw error;
    }
};

// Hàm thêm mới một to-do con cho mục tiêu
// Nhận vào targetId (id mục tiêu cha), taskName (tên việc cần làm), note (ghi chú chi tiết)
export const addTodo = async (targetId, taskName, note) => {
    try {
        // Gửi request POST lên API backend
        const response = await axios.post(`${BASE_URL}/todos`, {
            target_id: targetId,
            task_name: taskName,
            note: note
        });
        return response.data; // Trả về thông tin to-do vừa được tạo thành công
    } catch (error) {
        console.error("Lỗi service khi thêm to-do:", error);
        throw error;
    }
};

// Hàm xóa một to-do con dựa trên ID của việc nhỏ đó
// Nhận vào todoId (id của công việc cần xóa)
export const deleteTodo = async (todoId) => {
    try {
        // Gửi request DELETE lên API backend
        const response = await axios.delete(`${BASE_URL}/todos/${todoId}`);
        return response.data; // Trả về thông tin xác nhận đã xóa thành công
    } catch (error) {
        console.error("Lỗi service khi xóa to-do:", error);
        throw error;
    }
};

// Hàm thêm mới giao dịch tài chính (Thu hoặc Chi)
// Nhận vào transactionData: { amount, note, category_name, transaction_date }
export const addTransaction = async (transactionData) => {
    try {
        const response = await axios.post(`${BASE_URL}/transactions`, transactionData);
        return response.data; // Trả về kết quả giao dịch vừa được tạo
    } catch (error) {
        console.error("Lỗi service khi thêm giao dịch:", error);
        throw error;
    }
};

// Hàm lấy tổng số tiền chi tiêu của ngày hôm nay
export const getTodaySpent = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/finance/today-spent`);
        return response.data.today_spent; // Trả về số tiền hôm nay đã tiêu (number)
    } catch (error) {
        console.error("Lỗi service khi lấy tổng tiền chi hôm nay:", error);
        return 0; // Mặc định trả về 0 nếu có lỗi
    }
};

// Hàm lấy tổng quan tài chính hôm nay: tổng chi, tổng thu và danh sách chi tiết các giao dịch
export const getTodaySummary = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/finance/today-summary`);
        return response.data; // Trả về { today_spent, today_received, transactions }
    } catch (error) {
        console.error("Lỗi service khi lấy tổng quan thu chi hôm nay:", error);
        return { today_spent: 0, today_received: 0, transactions: [] }; // Trả về cấu trúc mặc định nếu lỗi
    }
};

// Hàm cập nhật giao dịch tài chính
// Nhận vào txId (id giao dịch cần sửa) và txData: { amount, note, category_name, transaction_date }
export const updateTransaction = async (txId, txData) => {
    try {
        const response = await axios.put(`${BASE_URL}/transactions/${txId}`, txData);
        return response.data; // Trả về giao dịch vừa được cập nhật thành công
    } catch (error) {
        console.error("Lỗi service khi cập nhật giao dịch:", error);
        throw error;
    }
};

// Hàm xóa giao dịch tài chính
// Nhận vào txId (id giao dịch cần xóa)
export const deleteTransaction = async (txId) => {
    try {
        const response = await axios.delete(`${BASE_URL}/transactions/${txId}`);
        return response.data; // Trả về kết quả xác nhận đã xóa
    } catch (error) {
        console.error("Lỗi service khi xóa giao dịch:", error);
        throw error;
    }
};

// Hàm lấy toàn bộ danh sách giao dịch trong một tháng và năm
// Nhận vào month (tháng, ví dụ: 5), year (năm, ví dụ: 2026)
export const getMonthlyTransactions = async (month, year) => {
    try {
        const response = await axios.get(`${BASE_URL}/finance/monthly-transactions`, {
            params: { month, year }
        });
        return response.data; // Trả về mảng danh sách giao dịch của tháng
    } catch (error) {
        console.error("Lỗi service khi lấy giao dịch theo tháng:", error);
        return []; // Trả về mảng rỗng nếu lỗi
    }
};
