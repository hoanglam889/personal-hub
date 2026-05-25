require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Kết nối MySQL dạng Pool để tự động tái kết nối, thích hợp cho Vercel Serverless
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'to-do-list',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 2. API lấy Mục tiêu kèm theo các Việc nhỏ (Todos)
app.get('/api/targets-with-todos', (req, res) => {
  const sql = `
    SELECT t.*, tod.id as todo_id, tod.task_name, tod.note as todo_note, tod.is_done 
    FROM targets t
    LEFT JOIN todos tod ON t.id = tod.target_id
    ORDER BY t.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    
    // Logic gom nhóm: Biến dữ liệu phẳng thành mảng lồng nhau
    const formattedData = results.reduce((acc, row) => {
      let target = acc.find(t => t.id === row.id);
      if (!target) {
        target = { 
          id: row.id, 
          title: row.title, 
          deadline: row.deadline, 
          is_pinned: row.is_pinned,
          todos: [] 
        };
        acc.push(target);
      }
      if (row.todo_id) {
        target.todos.push({
          id: row.todo_id,
          task_name: row.task_name,
          note: row.todo_note,
          is_done: row.is_done
        });
      }
      return acc;
    }, []);

    return res.json(formattedData);
  });
});

// 3. API lấy Tài chính (Hạn mức & Số tiền đã xài trong tháng)
app.get('/api/finance-summary', (req, res) => {
  const sql = `
    SELECT 
      c.name, 
      c.budget_limit, 
      SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as total_spent
    FROM categories c
    LEFT JOIN transactions t ON c.id = t.category_id 
      AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE())
      AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE())
    GROUP BY c.id
  `;
  
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

// 4. API lấy giao dịch gần nhất
app.get('/api/recent-transactions', (req, res) => {
  const sql = `
    SELECT t.*, c.name as category_name 
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    ORDER BY t.transaction_date DESC 
    LIMIT 5
  `;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data);
  });
});

//5. API chỉ lấy những mục tiêu được ghim
app.get('/api/targets/pinned', (req, res) => {
  const sql = "SELECT * FROM targets WHERE is_pinned = 1 LIMIT 1";
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err);
    return res.json(data[0]); // Trả về 1 object duy nhất cho gọn
  });
});


//6. Route cập nhật trạng thái của 1 task
app.put('/api/todos/:id', (req, res) => {
    const todoId = req.params.id;
    const { is_done } = req.body; // React sẽ gửi cái này lên: { is_done: 1 } hoặc 0

    const query = "UPDATE todos SET is_done = ? WHERE id = ?";
    
    db.query(query, [is_done, todoId], (err, result) => {
        if (err) {
            console.error("Lỗi khi update database:", err);
            return res.status(500).json({ error: "Lỗi server rồi Lâm ơi!" });
        }
        res.json({ message: "Cập nhật thành công!", id: todoId, status: is_done });
    });
});

//7. Thêm API tạo mục tiêu mới
app.post('/api/targets', (req, res) => {
  const { title, deadline } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Thiếu tiêu đề mục tiêu!" });
  }

  // SQL để insert vào bảng targets
  // Lưu ý: deadline ở đây là để trống (NULL) vì khi tạo mới ta chưa có ngày thực tế
  const query = "INSERT INTO targets (title, deadline) VALUES (?, NULL)";

  db.query(query, [title], (err, result) => {
    if (err) {
      console.error("Lỗi tạo mục tiêu:", err);
      return res.status(500).json({ error: "Lỗi server khi tạo mục tiêu!" });
    }
    
    res.json({
      message: "Mục tiêu mới đã được thêm vào vũ trụ của Lâm!",
      id: result.insertId, // Trả về ID để React biết vừa thêm cái gì
      title: title,
      deadline: null,
      is_pinned: 0 // Mặc định là 0 (chưa ghim)
    });
  });
});

//8. API ghim mục tiêu
app.put('/api/targets/:id/pin', (req, res) => {
  const targetId = req.params.id;
  // Đầu tiên, tháo ghim tất cả
  db.query("UPDATE targets SET is_pinned = 0", (err) => {
    if (err) return res.status(500).json({ error: "Lỗi khi tháo ghim cũ" });
    
    // Sau đó, ghim cái được chọn
    db.query("UPDATE targets SET is_pinned = 1 WHERE id = ?", [targetId], (err, result) => {
      if (err) return res.status(500).json({ error: "Lỗi khi ghim mới" });
      res.json({ message: "Đã ghim thành công!", id: targetId });
    });
  });
});

//9. API hủy ghim mục tiêu
app.put('/api/targets/:id/unpin', (req, res) => {
  const targetId = req.params.id;
  
  // Chỉ tháo ghim đúng thằng target được chọn
  db.query("UPDATE targets SET is_pinned = 0 WHERE id = ?", [targetId], (err, result) => {
    if (err) {
      console.error("Lỗi tháo ghim:", err);
      return res.status(500).json({ error: "Lỗi khi tháo ghim" });
    }
    
    // BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ BÁO CHO FRONTEND BIẾT LÀ OK RỒI
    res.json({ message: "Đã hủy ghim thành công!", id: targetId });
  });
});


//10. API xóa mục tiêu
app.delete('/api/targets/:id', (req, res) => {
  const targetId = req.params.id;
  // Xóa todos của target này trước (nếu không có CASCADE ở DB)
  db.query("DELETE FROM todos WHERE target_id = ?", [targetId], (err) => {
    if (err) return res.status(500).json({ error: "Lỗi xóa todos con" });
    
    // Xóa target
    db.query("DELETE FROM targets WHERE id = ?", [targetId], (err, result) => {
      if (err) return res.status(500).json({ error: "Lỗi xóa mục tiêu" });
      res.json({ message: "Đã xóa mục tiêu!" });
    });
  });
});

// 11. API thêm mới một việc nhỏ (To-do) cho mục tiêu (Target)
// API này nhận vào target_id (để biết việc nhỏ này thuộc mục tiêu nào), task_name (tên việc) và note (ghi chú)
app.post('/api/todos', (req, res) => {
  const { target_id, task_name, note } = req.body;

  // Kiểm tra dữ liệu đầu vào bắt buộc
  if (!target_id || !task_name) {
    return res.status(400).json({ error: "Thiếu target_id hoặc tên việc cần làm!" });
  }

  // Câu lệnh SQL thêm việc nhỏ, mặc định cột is_done = 0 (chưa hoàn thành)
  const query = "INSERT INTO todos (target_id, task_name, note, is_done) VALUES (?, ?, ?, 0)";

  db.query(query, [target_id, task_name, note || null], (err, result) => {
    if (err) {
      console.error("Lỗi khi thêm to-do mới:", err);
      return res.status(500).json({ error: "Lỗi server khi thêm việc nhỏ!" });
    }
    
    // Trả về to-do mới vừa tạo cùng với ID tự động sinh từ database (result.insertId)
    res.json({
      message: "Đã thêm công việc mới thành công!",
      id: result.insertId,
      target_id: Number(target_id),
      task_name: task_name,
      note: note || null,
      is_done: 0 // Mặc định chưa làm
    });
  });
});

// 12. API xóa một việc nhỏ (To-do) con của mục tiêu
// API nhận vào ID của việc nhỏ ở phần params URL (ví dụ: /api/todos/15)
app.delete('/api/todos/:id', (req, res) => {
  const todoId = req.params.id;

  const query = "DELETE FROM todos WHERE id = ?";

  db.query(query, [todoId], (err) => {
    if (err) {
      console.error("Lỗi khi xóa việc nhỏ:", err);
      return res.status(500).json({ error: "Lỗi server khi xóa việc nhỏ!" });
    }
    
    // Trả về thông tin ID của việc nhỏ vừa được xóa để frontend cập nhật
    res.json({ 
      message: "Đã xóa công việc nhỏ thành công!", 
      id: Number(todoId) 
    });
  });
});

// 13. API lấy tổng tiền chi tiêu hôm nay (amount < 0)
app.get('/api/finance/today-spent', (req, res) => {
  // Lấy tổng số tiền chi (amount < 0) của ngày hôm nay (CURDATE())
  const sql = "SELECT SUM(ABS(amount)) as today_spent FROM transactions WHERE transaction_date = CURDATE() AND amount < 0";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lỗi lấy tiền tiêu hôm nay:", err);
      return res.status(500).json({ error: "Lỗi server!" });
    }
    const todaySpent = results[0]?.today_spent || 0;
    res.json({ today_spent: Number(todaySpent) });
  });
});

// 14. API thêm mới giao dịch tài chính (Thu/Chi)
// Tự động kiểm tra/thêm danh mục nếu chưa tồn tại trong bảng categories
app.post('/api/transactions', (req, res) => {
  const { amount, note, category_name, transaction_date } = req.body;

  if (amount === undefined || !category_name || !transaction_date) {
    return res.status(400).json({ error: "Thiếu thông tin số tiền, danh mục hoặc ngày giao dịch!" });
  }

  // 1. Kiểm tra danh mục trong bảng categories
  const checkCategoryQuery = "SELECT id FROM categories WHERE name = ?";
  db.query(checkCategoryQuery, [category_name], (err, results) => {
    if (err) {
      console.error("Lỗi kiểm tra danh mục:", err);
      return res.status(500).json({ error: "Lỗi server khi kiểm tra danh mục!" });
    }

    const saveTransaction = (categoryId) => {
      const insertTransactionQuery = "INSERT INTO transactions (category_id, amount, note, transaction_date) VALUES (?, ?, ?, ?)";
      db.query(insertTransactionQuery, [categoryId, amount, note || null, transaction_date], (err, result) => {
        if (err) {
          console.error("Lỗi thêm giao dịch:", err);
          return res.status(500).json({ error: "Lỗi server khi thêm giao dịch!" });
        }
        res.json({
          message: "Đã ghi nhận giao dịch thành công!",
          id: result.insertId,
          category_id: categoryId,
          category_name: category_name,
          amount: Number(amount),
          note: note || null,
          transaction_date: transaction_date
        });
      });
    };

    if (results.length > 0) {
      // Danh mục đã tồn tại, dùng luôn category_id
      saveTransaction(results[0].id);
    } else {
      // Danh mục chưa tồn tại, thêm vào bảng categories rồi dùng id mới
      const insertCategoryQuery = "INSERT INTO categories (name, budget_limit) VALUES (?, NULL)";
      db.query(insertCategoryQuery, [category_name], (err, insertResult) => {
        if (err) {
          console.error("Lỗi tạo danh mục mới:", err);
          return res.status(500).json({ error: "Lỗi server khi tạo danh mục mới!" });
        }
        saveTransaction(insertResult.insertId);
      });
    }
  });
});

// 15. API lấy tổng quan tài chính hôm nay: tổng thu, tổng chi và danh sách giao dịch hôm nay
app.get('/api/finance/today-summary', (req, res) => {
  const sqlSpent = "SELECT SUM(ABS(amount)) as today_spent FROM transactions WHERE transaction_date = CURDATE() AND amount < 0";
  const sqlReceived = "SELECT SUM(amount) as today_received FROM transactions WHERE transaction_date = CURDATE() AND amount > 0";
  const sqlTransactions = `
    SELECT t.*, c.name as category_name 
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.transaction_date = CURDATE()
    ORDER BY t.id DESC
  `;

  db.query(sqlSpent, (err, spentResults) => {
    if (err) {
      console.error("Lỗi lấy tổng chi hôm nay:", err);
      return res.status(500).json({ error: "Lỗi server khi lấy tổng chi!" });
    }

    db.query(sqlReceived, (err, receivedResults) => {
      if (err) {
        console.error("Lỗi lấy tổng thu hôm nay:", err);
        return res.status(500).json({ error: "Lỗi server khi lấy tổng thu!" });
      }

      db.query(sqlTransactions, (err, txResults) => {
        if (err) {
          console.error("Lỗi lấy danh sách giao dịch hôm nay:", err);
          return res.status(500).json({ error: "Lỗi server khi lấy giao dịch!" });
        }

        res.json({
          today_spent: Number(spentResults[0]?.today_spent || 0),
          today_received: Number(receivedResults[0]?.today_received || 0),
          transactions: txResults.map(tx => ({
            id: tx.id,
            category_id: tx.category_id,
            category_name: tx.category_name,
            amount: Number(tx.amount),
            note: tx.note,
            transaction_date: tx.transaction_date
          }))
        });
      });
    });
  });
});

// 16. API xóa một giao dịch tài chính theo ID
app.delete('/api/transactions/:id', (req, res) => {
  const txId = req.params.id;

  const query = "DELETE FROM transactions WHERE id = ?";
  db.query(query, [txId], (err) => {
    if (err) {
      console.error("Lỗi khi xóa giao dịch:", err);
      return res.status(500).json({ error: "Lỗi server khi xóa giao dịch!" });
    }
    
    res.json({ 
      message: "Đã xóa giao dịch thành công!", 
      id: Number(txId) 
    });
  });
});

// 17. API cập nhật một giao dịch tài chính theo ID
// Tự động kiểm tra và thêm danh mục mới nếu chưa tồn tại
app.put('/api/transactions/:id', (req, res) => {
  const txId = req.params.id;
  const { amount, note, category_name, transaction_date } = req.body;

  if (amount === undefined || !category_name || !transaction_date) {
    return res.status(400).json({ error: "Thiếu thông tin số tiền, danh mục hoặc ngày giao dịch!" });
  }

  // 1. Kiểm tra danh mục trong bảng categories
  const checkCategoryQuery = "SELECT id FROM categories WHERE name = ?";
  db.query(checkCategoryQuery, [category_name], (err, results) => {
    if (err) {
      console.error("Lỗi kiểm tra danh mục khi cập nhật:", err);
      return res.status(500).json({ error: "Lỗi server khi kiểm tra danh mục!" });
    }

    const updateTransaction = (categoryId) => {
      const updateQuery = "UPDATE transactions SET category_id = ?, amount = ?, note = ?, transaction_date = ? WHERE id = ?";
      db.query(updateQuery, [categoryId, amount, note || null, transaction_date, txId], (err) => {
        if (err) {
          console.error("Lỗi cập nhật giao dịch:", err);
          return res.status(500).json({ error: "Lỗi server khi cập nhật giao dịch!" });
        }
        res.json({
          message: "Đã cập nhật giao dịch thành công!",
          id: Number(txId),
          category_id: categoryId,
          category_name: category_name,
          amount: Number(amount),
          note: note || null,
          transaction_date: transaction_date
        });
      });
    };

    if (results.length > 0) {
      // Danh mục đã có sẵn
      updateTransaction(results[0].id);
    } else {
      // Thêm danh mục mới vào database
      const insertCategoryQuery = "INSERT INTO categories (name, budget_limit) VALUES (?, NULL)";
      db.query(insertCategoryQuery, [category_name], (err, insertResult) => {
        if (err) {
          console.error("Lỗi tạo danh mục mới khi cập nhật:", err);
          return res.status(500).json({ error: "Lỗi server khi tạo danh mục mới!" });
        }
        updateTransaction(insertResult.insertId);
      });
    }
  });
});

// 18. API lấy danh sách giao dịch theo tháng và năm
app.get('/api/finance/monthly-transactions', (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: "Thiếu tham số tháng (month) hoặc năm (year)!" });
  }

  // Câu lệnh SQL lấy tất cả các giao dịch trong tháng/năm, kèm theo tên danh mục
  const sql = `
    SELECT t.*, c.name as category_name 
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
    ORDER BY t.transaction_date ASC, t.id DESC
  `;

  db.query(sql, [month, year], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy giao dịch theo tháng:", err);
      return res.status(500).json({ error: "Lỗi server khi lấy giao dịch theo tháng!" });
    }

    // Trả về danh sách định dạng số tiền là Number
    const formattedResults = results.map(row => ({
      id: row.id,
      category_id: row.category_id,
      category_name: row.category_name,
      amount: Number(row.amount),
      note: row.note,
      transaction_date: row.transaction_date
    }));

    res.json(formattedResults);
  });
});

// Chỉ chạy app.listen khi chạy local (không phải môi trường Serverless của Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend Hub đang chạy tại http://localhost:${PORT} rồi Lâm ơi!`);
  });
}

module.exports = app;
