import { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { Card, Row, Col } from 'react-bootstrap';
import { getMonthlyTransactions } from '../services/targetService.js';
import 'react-calendar/dist/Calendar.css';
import './FinanceCalendar.css';

// Định dạng ngày thành YYYY-MM-DD phục vụ làm key trong map
const formatDateKey = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Định dạng hiển thị ngày tiếng Việt kèm thứ (ví dụ: 24/05/2026 (CN))
const formatVietnameseDate = (dateObj) => {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  const weekdays = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
  const weekday = weekdays[dateObj.getDay()];
  
  return `${day}/${month}/${year} (${weekday})`;
};

const FinanceCalendar = ({ onEditTransaction }) => {
  // === STATE CỤC BỘ ===
  const [selectedDate, setSelectedDate] = useState(new Date()); // Ngày đang click chọn
  const [currentMonthYear, setCurrentMonthYear] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  }); // Tháng/Năm hiện tại đang hiển thị
  const [monthlyTransactions, setMonthlyTransactions] = useState([]); // Toàn bộ giao dịch của tháng

  // Tải dữ liệu giao dịch từ backend khi đổi tháng/năm trên lịch
  useEffect(() => {
    getMonthlyTransactions(currentMonthYear.month, currentMonthYear.year).then(data => {
      setMonthlyTransactions(data);
    });
  }, [currentMonthYear]);

  // Nhóm giao dịch theo ngày để vẽ lên lịch
  const dailySummaries = useMemo(() => {
    const summaries = {};
    monthlyTransactions.forEach(tx => {
      const dateStr = formatDateKey(new Date(tx.transaction_date));
      if (!summaries[dateStr]) {
        summaries[dateStr] = { income: 0, expense: 0 };
      }
      if (tx.amount > 0) {
        summaries[dateStr].income += tx.amount;
      } else {
        summaries[dateStr].expense += Math.abs(tx.amount);
      }
    });
    return summaries;
  }, [monthlyTransactions]);

  // Tính tổng thu, tổng chi và số dư cả tháng
  const monthlySummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    monthlyTransactions.forEach(tx => {
      if (tx.amount > 0) {
        income += tx.amount;
      } else {
        expense += Math.abs(tx.amount);
      }
    });
    return {
      income,
      expense,
      net: income - expense
    };
  }, [monthlyTransactions]);

  // Lọc giao dịch của ngày đang chọn
  const selectedDayTransactions = useMemo(() => {
    const dateStr = formatDateKey(selectedDate);
    return monthlyTransactions.filter(tx => formatDateKey(new Date(tx.transaction_date)) === dateStr);
  }, [selectedDate, monthlyTransactions]);

  // Tính số dư (thu - chi) của ngày đang chọn
  const selectedDayNet = useMemo(() => {
    let net = 0;
    selectedDayTransactions.forEach(tx => {
      net += tx.amount;
    });
    return net;
  }, [selectedDayTransactions]);

  // Thay đổi tháng hiển thị trên lịch
  const handleActiveStartDateChange = ({ activeStartDate }) => {
    if (activeStartDate) {
      setCurrentMonthYear({
        month: activeStartDate.getMonth() + 1,
        year: activeStartDate.getFullYear()
      });
    }
  };

  // Hàm vẽ số tiền nhỏ (xanh cho thu, đỏ cho chi) trong từng ô lịch ngày
  const renderTileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const dateStr = formatDateKey(date);
    const summary = dailySummaries[dateStr];

    if (!summary) return null;

    return (
      <div className="tile-content-wrapper">
        {summary.income > 0 && (
          <div className="tile-amount income-text">
            {Math.round(summary.income).toLocaleString('vi-VN')}
          </div>
        )}
        {summary.expense > 0 && (
          <div className="tile-amount expense-text">
            {Math.round(summary.expense).toLocaleString('vi-VN')}
          </div>
        )}
      </div>
    );
  };

  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="py-2">
      {/* KHỐI LỊCH DARK MODE */}
      <div className="custom-calendar-container mb-3">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          onActiveStartDateChange={handleActiveStartDateChange}
          formatShortWeekday={(locale, date) => weekdays[date.getDay()]}
          tileContent={renderTileContent}
          locale="vi-VN"
        />
      </div>

      {/* KHỐI TỔNG HỢP THÁNG */}
      <Card className="border-0 mb-3" style={{ backgroundColor: '#121212', borderRadius: '15px', color: '#ffffff' }}>
        <Card.Body className="p-3 text-center">
          <Row>
            <Col xs={4} className="border-end border-secondary border-opacity-20">
              <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>Thu nhập</div>
              <strong className="text-success" style={{ fontSize: '1rem' }}>
                {monthlySummary.income > 0 ? `${monthlySummary.income.toLocaleString('vi-VN')}đ` : '0đ'}
              </strong>
            </Col>
            <Col xs={4} className="border-end border-secondary border-opacity-20">
              <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>Chi tiêu</div>
              <strong className="text-danger" style={{ fontSize: '1rem' }}>
                {monthlySummary.expense > 0 ? `${monthlySummary.expense.toLocaleString('vi-VN')}đ` : '0đ'}
              </strong>
            </Col>
            <Col xs={4}>
              <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>Tổng cộng</div>
              <strong 
                className={monthlySummary.net >= 0 ? 'text-success' : 'text-danger'}
                style={{ fontSize: '1rem' }}
              >
                {monthlySummary.net >= 0 ? '+' : ''}{monthlySummary.net.toLocaleString('vi-VN')}đ
              </strong>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* DANH SÁCH CHI TIẾT GIAO DỊCH NGÀY ĐANG CHỌN */}
      <Card className="border-0" style={{ backgroundColor: '#121212', borderRadius: '15px', color: '#ffffff' }}>
        <Card.Body className="p-3">
          
          {/* Header ngày được chọn và số dư trong ngày */}
          <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary border-opacity-20 pb-2">
            <span className="small text-secondary fw-bold" style={{ fontSize: '0.8rem' }}>
              {formatVietnameseDate(selectedDate)}
            </span>
            <span className={`fw-bold small ${selectedDayNet >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.85rem' }}>
              {selectedDayNet >= 0 ? '+' : ''}{selectedDayNet.toLocaleString('vi-VN')}đ
            </span>
          </div>

          {/* Danh sách các đơn giao dịch */}
          <div className="transaction-list" style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '5px' }}>
            {selectedDayTransactions && selectedDayTransactions.length > 0 ? (
              selectedDayTransactions.map(tx => {
                const isExpense = tx.amount < 0;
                return (
                  <div 
                    key={tx.id} 
                    className="d-flex align-items-center justify-content-between py-2 border-bottom border-secondary border-opacity-10"
                    style={{ cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.95rem' }}
                    onClick={() => onEditTransaction && onEditTransaction(tx)}
                    title="Nhấp để sửa hoặc xóa giao dịch"
                  >
                    <div className="d-flex align-items-center">
                      {/* Tròn nhỏ đổi màu theo loại thu/chi */}
                      <div 
                        className="me-2 rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          backgroundColor: isExpense ? '#ef4444' : '#10b981'
                        }}
                      />
                      <span className="fw-semibold text-start">
                        {tx.category_name}
                        {tx.note && (
                          <span className="text-secondary fw-normal small ms-1" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                            ({tx.note})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className={`fw-bold ${isExpense ? 'text-danger' : 'text-success'}`}>
                      {isExpense 
                        ? `-${Math.abs(tx.amount).toLocaleString('vi-VN')}đ` 
                        : `+${tx.amount.toLocaleString('vi-VN')}đ`}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-secondary py-4 small" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                Không có giao dịch nào được ghi nhận trong ngày này.
              </div>
            )}
          </div>

        </Card.Body>
      </Card>
    </div>
  );
};

export default FinanceCalendar;
