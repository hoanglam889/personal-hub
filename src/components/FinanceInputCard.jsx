import { useState } from 'react';
import { Card, Button, Modal } from 'react-bootstrap';

// Lấy ngày hôm nay theo giờ địa phương định dạng YYYY-MM-DD
const getTodayDateString = () => {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Định dạng ngày bất kỳ về YYYY-MM-DD cho ô input date
const formatDateForInput = (dateVal) => {
  if (!dateVal) return getTodayDateString();
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FinanceInputCard = ({ initialData, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onCancel }) => {
  // Các danh mục chi tiêu gợi ý nhanh
  const expenseCategories = ['Ăn uống', 'Xe cộ', 'Đi chơi', 'Mua sắm', 'Khác'];
  // Các danh mục thu nhập gợi ý nhanh
  const incomeCategories = ['Lương', 'Tip', 'Thưởng', 'Khác'];

  // === KHỞI TẠO STATE CỤC BỘ DỰA TRÊN INITIALDATA ===
  const [type, setType] = useState(() => {
    if (initialData) return initialData.amount < 0 ? 'chi' : 'thu';
    return 'chi';
  });

  const [date, setDate] = useState(() => {
    if (initialData) return formatDateForInput(initialData.transaction_date);
    return getTodayDateString();
  });

  const [note, setNote] = useState(() => {
    if (initialData) return initialData.note || '';
    return '';
  });

  const [amount, setAmount] = useState(() => {
    if (initialData) return String(Math.abs(initialData.amount));
    return '';
  });

  const [category, setCategory] = useState(() => {
    if (initialData) {
      const isExpense = initialData.amount < 0;
      const activeList = isExpense ? expenseCategories : incomeCategories;
      const isSuggested = activeList.includes(initialData.category_name);
      if (isSuggested && initialData.category_name !== 'Khác') return initialData.category_name;
      return 'Khác';
    }
    return '';
  });

  const [customCategory, setCustomCategory] = useState(() => {
    if (initialData) {
      const isExpense = initialData.amount < 0;
      const activeList = isExpense ? expenseCategories : incomeCategories;
      const isSuggested = activeList.includes(initialData.category_name);
      if (isSuggested && initialData.category_name !== 'Khác') return '';
      return initialData.category_name || '';
    }
    return '';
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false); // Điều khiển Modal xác nhận xóa giao dịch cục bộ

  // Thay đổi loại Thu/Chi và reset danh mục
  const handleTypeChange = (newType) => {
    setType(newType);
    setCategory('');
    setCustomCategory('');
  };

  // Xử lý khi nhấn nút Lưu giao dịch / Cập nhật giao dịch
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ và lớn hơn 0!');
      return;
    }

    // Xác định tên danh mục thực tế
    const finalCategory = category === 'Khác' ? customCategory.trim() : category;
    if (!finalCategory) {
      alert('Vui lòng chọn hoặc nhập danh mục giao dịch!');
      return;
    }

    // Đổi dấu số tiền: Chi thì lưu số âm, Thu thì lưu số dương
    const signedAmount = type === 'chi' ? -parsedAmount : parsedAmount;

    const transactionPayload = {
      amount: signedAmount,
      note: note.trim(),
      category_name: finalCategory,
      transaction_date: date,
    };

    if (initialData) {
      // Chế độ Edit
      onUpdateTransaction(initialData.id, transactionPayload);
    } else {
      // Chế độ Thêm mới
      onAddTransaction(transactionPayload);
      
      // Reset form sau khi thêm mới thành công
      setNote('');
      setAmount('');
      setCategory('');
      setCustomCategory('');
      setDate(getTodayDateString());
    }
  };

  // Xác định danh mục hiển thị dựa trên loại Thu/Chi
  const activeCategories = type === 'chi' ? expenseCategories : incomeCategories;

  return (
    <>
      <Card className="shadow-sm border-0 mb-2" style={{ borderRadius: '15px', overflow: 'hidden' }}>
        {/* Header đổi màu nền động theo loại giao dịch (Chi: Đỏ/Cam mờ, Thu: Xanh mờ) */}
        <div 
          className="p-2 text-white fw-bold text-center transition-all"
          style={{ 
            background: type === 'chi' 
              ? 'linear-gradient(135deg, #f05252, #c81e1e)' 
              : 'linear-gradient(135deg, #0e9f6e, #057a55)',
            fontSize: '1rem',
            transition: 'all 0.4s ease'
          }}
        >
          {initialData 
            ? (type === 'chi' ? '✏️ CHỈNH SỬA KHOẢN CHI' : '✏️ CHỈNH SỬA KHOẢN THU')
            : (type === 'chi' ? '💸 CHI TIÊU (CHI TIỀN)' : '💰 THU NHẬP (THU TIỀN)')}
        </div>

        <Card.Body className="p-3" style={{ backgroundColor: '#ffffff' }}>
          <form onSubmit={handleSubmit}>
            
            {/* DÒNG 1: CHỌN LOẠI THU / CHI */}
            <div className="mb-2">
              <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.8rem' }}>LOẠI GIAO DỊCH</label>
              <div className="d-flex gap-2">
                <Button 
                  type="button"
                  variant={type === 'chi' ? 'danger' : 'outline-danger'}
                  className="flex-grow-1 py-1.5 fw-bold btn-sm"
                  onClick={() => handleTypeChange('chi')}
                  style={{ 
                    borderRadius: '8px',
                    boxShadow: type === 'chi' ? '0 4px 12px rgba(220, 53, 69, 0.25)' : 'none'
                  }}
                >
                  Chi Tiền
                </Button>
                <Button 
                  type="button"
                  variant={type === 'thu' ? 'success' : 'outline-success'}
                  className="flex-grow-1 py-1.5 fw-bold btn-sm"
                  onClick={() => handleTypeChange('thu')}
                  style={{ 
                    borderRadius: '8px',
                    boxShadow: type === 'thu' ? '0 4px 12px rgba(40, 167, 69, 0.25)' : 'none'
                  }}
                >
                  Thu Tiền
                </Button>
              </div>
            </div>

            {/* DÒNG 2: CHỌN NGÀY GIAO DỊCH */}
            <div className="mb-2">
              <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.8rem' }}>NGÀY GIAO DỊCH</label>
              <input 
                type="date"
                className="form-control form-control-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{ borderRadius: '8px', border: '1px solid #ced4da' }}
              />
            </div>

            {/* DÒNG 3: NHẬP SỐ TIỀN */}
            <div className="mb-2">
              <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.8rem' }}>SỐ TIỀN (VNĐ)</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted fw-bold" style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                  {type === 'chi' ? '-' : '+'}
                </span>
                <input 
                  type="number"
                  min="1"
                  step="any"
                  className="form-control"
                  placeholder="Ví dụ: 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
                />
              </div>
            </div>

            {/* DÒNG 4: GHI CHÚ */}
            <div className="mb-2">
              <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.8rem' }}>GHI CHÚ / NỘI DUNG</label>
              <input 
                type="text"
                className="form-control form-control-sm"
                placeholder="Ví dụ: Ăn bún bò, nhận lương cứng (không bắt buộc)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </div>

            {/* DÒNG 5: DANH MỤC GỢI Ý NHANH */}
            <div className="mb-2">
              <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.8rem' }}>DANH MỤC</label>
              <div className="d-flex flex-wrap gap-1.5 mb-1">
                {activeCategories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="btn btn-sm px-2.5 py-1 fw-semibold transition-all"
                      style={{
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        border: isSelected 
                          ? (type === 'chi' ? '1px solid #dc3545' : '1px solid #28a745') 
                          : '1px solid #dee2e6',
                        backgroundColor: isSelected 
                          ? (type === 'chi' ? '#fde8e8' : '#e6f4ea') 
                          : '#f8f9fa',
                        color: isSelected 
                          ? (type === 'chi' ? '#c81e1e' : '#0e9f6e') 
                          : '#4b5563',
                        transform: isSelected ? 'scale(1.03)' : 'none',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* HIỂN THỊ THÊM Ô NHẬP NẾU CHỌN DANH MỤC "KHÁC" */}
              {category === 'Khác' && (
                <input 
                  type="text"
                  className="form-control form-control-sm mt-1.5 transition-all"
                  placeholder="Nhập tên danh mục tự chọn..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                  style={{ borderRadius: '6px', border: '1px solid #ced4da' }}
                />
              )}
            </div>

            {/* DÒNG CUỐI: CÁC NÚT HÀNH ĐỘNG GỬI / SỬA / XÓA */}
            {!initialData ? (
              <Button 
                type="submit"
                variant={type === 'chi' ? 'danger' : 'success'}
                className="w-100 py-1.5 fw-bold text-white mt-1 btn-sm"
                style={{ 
                  borderRadius: '8px', 
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  boxShadow: type === 'chi' ? '0 4px 12px rgba(220, 53, 69, 0.2)' : '0 4px 12px rgba(40, 167, 69, 0.2)'
                }}
              >
                {type === 'chi' ? '✓ Ghi nhận khoản chi' : '✓ Ghi nhận khoản thu'}
              </Button>
            ) : (
              <div className="d-flex gap-2 mt-1">
                <Button 
                  type="submit"
                  variant={type === 'chi' ? 'danger' : 'success'}
                  className="flex-grow-1 py-1.5 fw-bold text-white btn-sm"
                  style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                >
                  ✓ Lưu thay đổi
                </Button>
                <Button 
                  type="button"
                  variant="outline-danger"
                  className="py-1.5 fw-bold btn-sm"
                  onClick={() => setShowDeleteModal(true)}
                  style={{ borderRadius: '8px', fontSize: '0.9rem', minWidth: '80px' }}
                >
                  Xóa
                </Button>
                {onCancel && (
                  <Button 
                    type="button"
                    variant="light"
                    className="py-1.5 fw-bold btn-sm border"
                    onClick={onCancel}
                    style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                  >
                    Hủy
                  </Button>
                )}
              </div>
            )}

          </form>
        </Card.Body>
      </Card>

      {/* MODAL XÁC NHẬN XÓA GIAO DỊCH */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-danger">Xác nhận xóa giao dịch</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-dark text-start">
          Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác!
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={() => {
              setShowDeleteModal(false);
              onDeleteTransaction(initialData.id);
            }}
          >
            Đồng ý xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FinanceInputCard;
